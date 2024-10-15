// store personalSignature in SS and set axios headers if we do have a token

import { IDBPDatabase } from "idb";


const setPersonalSignature = async (db: IDBPDatabase<unknown> | null, dbReady: boolean, personalSignature?: string) => {
  if (!dbReady || !db) {
    console.error("Database not initialized");
    throw new Error("Database not initialized");

  }
  if (personalSignature) {
    sessionStorage.setItem("personal_signature", personalSignature);
    // Add token to IndexedDB if database is ready
      const tx = db.transaction("auth", "readwrite");
      const store = tx.objectStore("auth");
      await store.put(personalSignature, "personal_signature");
      await tx.done.catch((error) => console.error("Failed to store token in IndexedDB:", error));
  } else {
    sessionStorage.removeItem("personal_signature");
    // Remove token from IndexedDB if database is ready
      const tx = db.transaction("auth", "readwrite");
      const store = tx.objectStore("auth");
      await store.delete("personal_signature");
      await tx.done.catch((error) => console.error("Failed to delete token from IndexedDB:", error));
  }
};

export default setPersonalSignature;
