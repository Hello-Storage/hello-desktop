import { IDBPDatabase } from "idb";

const setAccountType = (db: IDBPDatabase<unknown> | null, accountType?: string) => {
  if (accountType) {
    localStorage.setItem("account_type", accountType);
    // add it to idb as well
    if (db) {
      const tx = db.transaction("auth", "readwrite");
      const store = tx.objectStore("auth");
      store.put(accountType, "account_type");
      tx.done.catch((error) => console.error("Failed to store token in IndexedDB:", error));
    }
  } else {
    localStorage.removeItem("account_type");
    // remove it from idb as well
    if (db) {
      const tx = db.transaction("auth", "readwrite");
      const store = tx.objectStore("auth");
      store.delete("account_type");
      tx.done.catch((error) => console.error("Failed to delete token from IndexedDB:", error));
    }
  }
};

export default setAccountType;
