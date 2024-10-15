import { Api } from "./api";
import { IDBPDatabase } from "idb";

const setAuthToken = async (db: IDBPDatabase<unknown> | null, dbReady: boolean, token?: string) => {
  if (token !== undefined && token !== null && token !== "") {
    // Set token in API headers and localStorage
    Api.defaults.headers.common["authorization"] = "bearer " + token;
    localStorage.setItem("access_token", token);

    // Add token to IndexedDB if database is ready
    try {
      if (!dbReady || !db) {
        console.error("Database not initialized");
        throw new Error("Database not initialized");

      }


      if (!db.objectStoreNames.contains("auth")) {
        console.error("Object store 'auth' not found in the database.");
        return;
      }
      const tx = db.transaction("auth", "readwrite");
      const store = tx.objectStore("auth");
      await store.put(token, "access_token");
      await tx.done;
      console.log("Token successfully stored in IndexedDB.");
    } catch (error) {
      console.error("Failed to store token in IndexedDB:", error);
    }

  } else {
    // Remove token from API headers and localStorage
    delete Api.defaults.headers.common["authorization"];
    localStorage.removeItem("access_token");

    // Remove token from IndexedDB if database is ready
    try {
      if (db) {
        if (!db.objectStoreNames.contains("auth")) {
          console.error("Object store 'auth' not found in the database.");
          return;
        }
        const tx = db.transaction("auth", "readwrite");
        const store = tx.objectStore("auth");
        await store.delete("access_token");
        await tx.done;
        console.log("Token successfully deleted from IndexedDB.");
      }
    } catch (error) {
      console.error("Failed to delete token from IndexedDB:", error);
    }
  }
};

export default setAuthToken;
