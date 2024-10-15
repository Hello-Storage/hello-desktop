import { useEffect, Suspense, useState, lazy } from 'react';
import ErrorMessageQueue from './components/ErrorMessageQueue';
import useAuth from './hooks/useAuth';
import { useIndexedDB, IndexedDBProvider } from './idb/IndexedDBContext';
import setAuthToken from './api/setAuthToken';
import { useAppSelector } from './state';
import Spinner3 from './components/spinner/Spinner3';
import state from './state';
import { loadUserFail } from './state/user/actions';
import { HashRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import UnprotectedRoute from './components/auth/UnprotectedRoute';
import ProtectedRoute from './components/auth/ProtectedRoute';

const LoginScreen = lazy(() => import("./LoginScreen"));
const Dashboard = lazy(() => import("./Dashboard"));





function App() {
  const { db, dbReady } = useIndexedDB();
  const { load, logout } = useAuth(db, dbReady);
  const [triggerRender, setTriggerRender] = useState(false);
  const { authenticated, walletAddress, loading } = useAppSelector((state) => state.user);

  useEffect(() => {
    if (!dbReady || !db) {
      console.log('Database not ready yet');
    } else {
      console.log('Database is ready');
      setTriggerRender(!triggerRender); // Force re-render when dbReady changes to true
    }
  }, [dbReady]);

  useEffect(() => {
    const getTokenAndLoad = async () => {
      if (!dbReady || !db) {
        console.error('Database not ready yet.');
        return;
      }

      try {
        // First try to get the token from IndexedDB
        const token = await db.get('auth', 'access_token');

        if (token !== undefined && token !== null && token !== "") {
          await setAuthToken(db, dbReady, token);
          await load(db, dbReady);
          return;
        } else {
          state.dispatch(loadUserFail());
        }
      } catch (error) {
        console.error('Failed to retrieve token from IndexedDB', error);
      }

      // Fallback to localStorage if IndexedDB fails
      const localToken = localStorage.getItem('access_token');
      if (localToken) {
        await setAuthToken(db, dbReady, localToken);
        await load(db, dbReady);
      } else {
        logout(db, dbReady);
      }
    };

    if (dbReady) {
      console.log('Executing getTokenAndLoad function');
      getTokenAndLoad();
    }
  }, [dbReady, db, load, logout, triggerRender]);


  // Effect for handling logout on access_token removal from localStorage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'access_token' && !localStorage.getItem('access_token')) {
        alert("1")
        logout(db, dbReady);
      } else if (
        window.location.pathname.includes('login') &&
        localStorage.getItem('access_token')
      ) {
        alert("2")
        window.location.reload();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [logout]);

  if (loading) return <Spinner3 />;


  return (
    <HashRouter>

      <div className="justify-center items-center h-screen">
        <div className="flex w-100 justify-center place-items-start">
          <h1 className="text-4xl font-bold text-center">hello.app</h1>
        </div>
        <p>{authenticated ?
          <>
            {walletAddress}
            <button className='btn btn-primary bg-red-500 text-white m-2 p-2 hover:bg-red-600' onClick={() => logout(db, dbReady)}>Logout</button>
          </> : "Not authenticated"}</p>
        <Suspense>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/login"
              element={
                <UnprotectedRoute>
                  <LoginScreen />
                </UnprotectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
        <ErrorMessageQueue />
      </div>
    </HashRouter>
  );
}

export default function AppWrapper() {
  return (
    <IndexedDBProvider>
      <App />
    </IndexedDBProvider>
  );
}
