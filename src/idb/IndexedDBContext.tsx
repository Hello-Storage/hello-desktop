import React, { createContext, useContext, useEffect, useState } from 'react';
import { IDBPDatabase, openDB } from 'idb';

interface IndexedDBContextProps {
  db: IDBPDatabase<unknown> | null;
  dbReady: boolean;
}

const IndexedDBContext = createContext<IndexedDBContextProps | undefined>(undefined);

export const IndexedDBProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<IDBPDatabase | null>(null);
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    const initDB = async () => {
      if (db) {
        return;
      }

      try {
        console.log('Starting database initialization');
        const instance = await openDB('AppDatabase', 2, {
          upgrade(db) {
            if (!db.objectStoreNames.contains('settings')) {
              console.log("Creating 'settings' object store");
              db.createObjectStore('settings');
            }
            if (!db.objectStoreNames.contains('auth')) {
              console.log("Creating 'auth' object store");
              db.createObjectStore('auth');
            }
          },
        });

        setDb(instance);
        setDbReady(true);
        console.log('Database initialized successfully.');
      } catch (error) {
        console.error('Failed to open IndexedDB:', error);
      }
    };

    initDB();
  }, [db]);

  return (
    <IndexedDBContext.Provider value={{ db, dbReady }}>
      {children}
    </IndexedDBContext.Provider>
  );
};

export const useIndexedDB = () => {
  const context = useContext(IndexedDBContext);
  if (!context) {
    throw new Error('useIndexedDB must be used within an IndexedDBProvider');
  }
  return context;
};
