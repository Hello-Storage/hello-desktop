import { Api } from "./api";
import { IDBPDatabase } from "idb";

const setAuthToken = (db: IDBPDatabase<unknown> | null, token?: string) => {

  if (token) {
    console.log("7")
    // Set token in API headers and localStorage
    Api.defaults.headers.common["authorization"] = "bearer " + token;
    localStorage.setItem("access_token", token);

    // Add token to IndexedDB if database is ready
    if (db) {
      console.log("8")
      const tx = db.transaction("auth", "readwrite");
      const store = tx.objectStore("auth");
      store.put(token, "access_token");
      tx.done.catch((error) => console.error("Failed to store token in IndexedDB:", error));
    }
  } else {
    // Remove token from API headers and localStorage
    delete Api.defaults.headers.common["authorization"];
    localStorage.removeItem("access_token");

    // Remove token from IndexedDB if database is ready
    if (db) {
      const tx = db.transaction("auth", "readwrite");
      const store = tx.objectStore("auth");
      store.delete("access_token");
      tx.done.catch((error) => console.error("Failed to delete token from IndexedDB:", error));
    }
  }
};

export default setAuthToken;
