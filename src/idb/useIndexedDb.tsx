import { IDBPDatabase, openDB } from "idb";
import { useEffect, useState, useRef } from "react";

let dbInstance: IDBPDatabase<unknown> | null = null;
let isDbInitializing = false;

const useIndexedDB = () => {
  const [db, setDb] = useState<IDBPDatabase | null>(null);
  const [dbReady, setDbReady] = useState(false);
  const isInitialized = useRef(false);

  useEffect(() => {
    const initDB = async () => {
      if (dbInstance) {
        console.log("Using existing DB instance");
        setDb(dbInstance);
        setDbReady(true);
        return;
      }

      if (isDbInitializing) {
        console.log("Database initialization already in progress");
        return;
      }

      console.log("Starting database initialization");
      isDbInitializing = true;

      try {
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

        dbInstance = instance;
        setDb(instance);
        setDbReady(true);
        isInitialized.current = true;
        console.log("Database initialized successfully.");
      } catch (error) {
        console.error("Failed to open IndexedDB:", error);
      } finally {
        isDbInitializing = false;
      }
    };

    initDB();
  }, []);

  useEffect(() => {
    console.log("useIndexedDB Hook: dbReady changed to", dbReady);
  }, [dbReady]);

  return { db, dbReady };
};

export default useIndexedDB;
