import { IDBPDatabase } from "idb";

const setAccountType = async (db: IDBPDatabase<unknown> | null, accountType?: string) => {
  if (accountType) {
    localStorage.setItem("account_type", accountType);
    // add it to idb as well
    try {
      if (db) {
        const tx = db.transaction("auth", "readwrite");
        const store = tx.objectStore("auth");
        await store.put(accountType, "account_type");
        await tx.done.catch((error) => console.error("Failed to store token in IndexedDB:", error));
      }
    } catch (error) {
      console.error("Failed to store token in IndexedDB:", error)
    }
  } else {
    localStorage.removeItem("account_type");
    // remove it from idb as well
    try {
      if (db) {
        const tx = db.transaction("auth", "readwrite");
        const store = tx.objectStore("auth");
        await store.delete("account_type");
        await tx.done.catch((error) => console.error("Failed to delete token from IndexedDB:", error));
      }
    }
    catch (error) {
      console.error("Failed to delete token from IndexedDB:", error);
    }
  }
};

export default setAccountType;
