// store personalSignature in SS and set axios headers if we do have a token

import { IDBPDatabase } from "idb";
import { signPersonalSignature } from "../utils/encryption/cipherUtils";
import setPersonalSignature from "./setPersonalSignature";
import { AccountType } from "./types";



const getPersonalSignature = async (db: IDBPDatabase<unknown> | null, dbReady: boolean, walletAddress: string, autoEncryption: boolean, accountType: string | undefined, logout?: () => void): Promise<string | undefined> => {
    const personalSignature = sessionStorage.getItem("personal_signature");
    if (personalSignature !== null && autoEncryption) {
        return personalSignature;
    } else {
        if (accountType === AccountType.Provider) {
            try {
                const personalSignature = await signPersonalSignature(walletAddress, AccountType.Provider);
                setPersonalSignature(db, dbReady, personalSignature);
                return personalSignature;
            } catch (error: any) {
                alert(error);
                console.log(error)
                //if error is ConnectorNotFoundError:
                if (error.includes("ConnectorNotFoundError")) {
                    return;
                }

            }
        } else if (accountType === "google" || accountType === "github" || accountType === "email") {
            if (personalSignature !== null) {
                return personalSignature;
            } else {
                if (logout)
                logout();
                return;
            }
        } else {
            if (logout)
            logout();
            return;
        }
    }
};

export default getPersonalSignature;