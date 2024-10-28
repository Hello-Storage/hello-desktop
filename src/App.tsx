import { useEffect, Suspense, useState, lazy } from 'react';
import ErrorMessageQueue from './components/ErrorMessageQueue';
import useAuth from './hooks/useAuth';
import { useIndexedDB, IndexedDBProvider } from './idb/IndexedDBContext';
import setAuthToken from './api/setAuthToken';
import { useAppSelector } from './state';
import Spinner3 from './components/spinner/Spinner3';
import state from './state';
import { loadUserFail } from './state/user/actions';
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import UnprotectedRoute from './components/auth/UnprotectedRoute';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { walletFormatting } from './utils/walletUtils';

// Import necessary icons from react-icons
import { FaUserCircle, FaWallet, FaClipboard, FaCircle } from 'react-icons/fa';

const LoginScreen = lazy(() => import("./LoginScreen"));
const Dashboard = lazy(() => import("./Dashboard"));

function App() {
  const { db, dbReady } = useIndexedDB();
  const { load, logout } = useAuth(db, dbReady);
  const [triggerRender, setTriggerRender] = useState(false);
  const { authenticated, name, walletAddress, loading } = useAppSelector((state) => state.user);
  
  // State for network connection status
  const [networkStatus, setNetworkStatus] = useState<'connecting' | 'connected'>('connecting');

  // Simulate network connection after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setNetworkStatus('connected');
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

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
        logout(db, dbReady);
      } else if (
        window.location.pathname.includes('login') &&
        localStorage.getItem('access_token')
      ) {
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
      <div className="h-screen bg-gray-900 text-white">
        {/* Header */}
        <div className="flex justify-between items-center p-4 bg-gray-800">
          {/* hello.app with blinking cursor */}
         
          <a
            onClick={() => window.electron.openExternal("https://hello.app")}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white text-4xl font-bold select-none relative cursor-pointer rounded-b-lg pb-1"
          >
            hello.app
            <span className="ml-1 animate-blink">|</span>
          </a>

          {/* Network Status Indicator */}
          <div className="flex items-center">
            {networkStatus === 'connecting' || !authenticated ? (
              <div className="flex items-center text-yellow-500">
                <FaCircle className="animate-pulse h-3 w-3 mr-2" />
                <span>Connecting...</span>
              </div>
            ) : (
              <div className="flex items-center text-green-500">
                <FaCircle className="h-3 w-3 mr-2" />
                <span>Connected to the network</span>
              </div>
            )}
          </div>
        </div>

        {/* User Info */}
          {authenticated && (

        <div className="flex justify-between items-center p-4">
              <div className="flex items-center">
                <FaUserCircle className="text-white text-2xl mr-2" />
                <span className="text-white mr-4">{walletFormatting(name)}</span>
                <div className="flex items-center">
                  <FaWallet className="text-white text-xl mr-1" />
                  <span className="text-white">{walletFormatting(walletAddress)}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(walletAddress)}
                    className="ml-2 text-white hover:text-gray-400"
                  >
                    <FaClipboard />
                  </button>
                </div>
              </div>
              <button
                className="ml-4 bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                onClick={() => logout(db, dbReady)}
              >
                Logout
              </button>
        </div>
          )}

        <hr className="border-gray-700" />

        {/* Main Content */}
        <Suspense fallback={<Spinner3 />}>
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
