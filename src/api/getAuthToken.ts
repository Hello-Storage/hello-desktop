// store personalSignature in SS and set axios headers if we do have a token

import { IDBPDatabase } from "idb";


const getAuthToken = async (db: IDBPDatabase<unknown> | null, dbReady: boolean, logout?: () => void): Promise<string | undefined> => {
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
        const token = await store.get("access_token");
        await tx.done;
        return token;

    } catch (error) {
        console.error("Failed to get token from IndexedDB:", error);
        if (logout) logout();
        return;
    }
};

export default getAuthToken;