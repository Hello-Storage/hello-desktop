import { IDBPDatabase, openDB } from "idb";
import { useEffect, useState } from "react";

const useIndexedDB = () => {
  const [db, setDb] = useState<IDBPDatabase | null>(null);

  useEffect(() => {
    const initDB = async () => {
      const dbInstance = await openDB('AppDatabase', 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings');
          }
        },
      });
      setDb(dbInstance as IDBPDatabase<unknown>)
    };

    initDB();
  }, []);

  return db;
};

export default useIndexedDB;