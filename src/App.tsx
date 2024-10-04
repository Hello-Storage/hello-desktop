import { useEffect, useState } from 'react';
import ErrorMessageQueue from './components/ErrorMessageQueue';
import useAuth from './hooks/useAuth';
import { useIndexedDB, IndexedDBProvider } from './idb/IndexedDBContext';
import LoginScreen from './LoginScreen';
import setAuthToken from './api/setAuthToken';
import { useAppSelector } from './hooks/storeHooks';
import Spinner3 from './components/spinner/Spinner3';

function App() {
  const { db, dbReady } = useIndexedDB();
  const { load, logout } = useAuth(db, dbReady);
  const [triggerRender, setTriggerRender] = useState(false);
  const { authenticated, loading } = useAppSelector((state) => state.user);

  useEffect(() => {
    if (!dbReady) {
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

        if (token) {
          await setAuthToken(db, token);
          await load(db, dbReady);
          return;
        }
      } catch (error) {
        console.error('Failed to retrieve token from IndexedDB', error);
      }

      // Fallback to localStorage if IndexedDB fails
      const localToken = localStorage.getItem('access_token');
      if (localToken) {
        await setAuthToken(db, localToken);
        await load(db, dbReady);
      } else {
        logout();
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
        logout();
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
    <div className="justify-center items-center h-screen">
      <div className="flex w-100 justify-center place-items-start">
        <h1 className="text-4xl font-bold text-center">hello.app</h1>
      </div>
      <p>{authenticated ? "Authenticated" : "Not authenticated"}</p>
      <LoginScreen />
      <ErrorMessageQueue />
    </div>
  );
}

export default function AppWrapper() {
  return (
    <IndexedDBProvider>
      <App />
    </IndexedDBProvider>
  );
}
