// store personalSignature in SS and set axios headers if we do have a token

import useIndexedDB from "../idb/useIndexedDb";

const setPersonalSignature = (personalSignature?: string) => {
  const db = useIndexedDB(); // Get the IndexedDB instance

  if (personalSignature) {
    sessionStorage.setItem("personal_signature", personalSignature);
     // Add token to IndexedDB if database is ready
    if (db) {
      const tx = db.transaction("auth", "readwrite");
      const store = tx.objectStore("auth");
      store.put(personalSignature, "personal_signature");
      tx.done.catch((error) => console.error("Failed to store token in IndexedDB:", error));
    }
  } else {
    sessionStorage.removeItem("personal_signature");
    // Remove token from IndexedDB if database is ready
    if (db) {
      const tx = db.transaction("auth", "readwrite");
      const store = tx.objectStore("auth");
      store.delete("personal_signature");
      tx.done.catch((error) => console.error("Failed to delete token from IndexedDB:", error));
    }
  }
};

export default setPersonalSignature;
