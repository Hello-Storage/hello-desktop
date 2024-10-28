import * as web3 from "web3";
import { Api } from "../api/api";
import { AccountType, LoadUserResponse, LoginResponse } from "../api/types/user";
import setAuthToken from "../api/setAuthToken";
import setAccountType from "../api/setAccountType";
import { useCallback } from "react";
import { loadingUser, loadUser, loadUserFail, logoutUser } from "../state/user/actions";
import state from "../state";
import setPersonalSignature from "../api/setPersonalSignature";
import { signPersonalSignature } from "../utils/encryption/cipherUtils";
import { IDBPDatabase } from "idb";


const useAuth = (db: IDBPDatabase<unknown> | null, dbReady: boolean) => {

    const load = useCallback(async (db: IDBPDatabase<unknown> | null, dbReady: boolean) => {
        try {
            state.dispatch(loadingUser());
            if (!dbReady || !db) {
                console.error("Database not initialized");
                alert("database not initialized")
                throw new Error("Database not initialized");

            }
            const accessToken = await db.get("auth", "access_token");
            if (accessToken) {
                const loadResp = await Api.get<LoadUserResponse>("/load");

                const privateKey = loadResp.data.walletPrivateKey;
                // Get account type from IndexedDB
                const accountType = await db.get('auth', 'account_type') as AccountType;

                const sessionPersonalSignature = await db.get('auth', 'personal_signature');

                if (!sessionPersonalSignature) {
                    //sign message with private key
                    const signature = await signPersonalSignature(
                        loadResp.data.walletAddress,
                        accountType,
                        privateKey
                    );
                    setPersonalSignature(db, dbReady, signature);
                    // Store personal signature in IndexedDB
                    await db.put('auth', signature, 'personal_signature');
                }

                state.dispatch(loadUser(loadResp.data));
            }

        } catch (error) {
            state.dispatch(loadUserFail());
        }
    }, []);


    const login = useCallback(async (db: IDBPDatabase<unknown> | null, dbReady: boolean, wallet_address: string, personalSign: (message: string) => Promise<string>) => {
        //const referral = new URLSearchParams(window.location.search).get("ref");
        localStorage.removeItem("access_token");
        setAuthToken(db, dbReady);
        localStorage.removeItem("account_type")
        setAccountType(db, dbReady);
        sessionStorage.removeItem("personal_signature");
        setPersonalSignature(db, dbReady);

        const nonceResp = await Api.post<string>("/nonce", {
            wallet_address,
            //referral,
        });


        const message = `Greetings from hello\nSign this message to log into hello\nnonce: ${nonceResp.data}`;

        const signature = await personalSign(message).catch((error) => {
            throw new Error(error);
        });

        if (!signature) {
            throw new Error("Failed to sign message");
        }

        console.log(message)
        console.log(signature)
        const loginResp = await Api.post<LoginResponse>("/login", {
            wallet_address,
            signature,
            //referral,
        });

        setAuthToken(db, dbReady, loginResp.data.access_token);
        setAccountType(db, dbReady, "provider")

        await load(db, dbReady).catch((error) => {
            throw new Error(error);
        }
        );

    }, []);


    // otp (one-time-passcode login)
    const startOTP = async (email: string) => {
        const referrer_code = new URLSearchParams(window.location.search).get("ref");
        try {
            const account = web3.eth.accounts.create();
            const wallet_address = account.address;
            const private_key = account.privateKey;
            await Api.post("/otp/start", { email, referrer_code, wallet_address, private_key });
        } catch (error) {
            return false;
        }

        return true;
    };

    const verifyOTP = async (email: string, code: string) => {
        if (!dbReady || !db) {
            console.error("Database is not initialized");
            return false;
        }

        try {
            const result = await Api.post<LoginResponse>("/otp/verify", {
                email,
                code,
            });

            if (dbReady && db) {
                // Store the access token and account type using IndexedDB
                await setAuthToken(db, dbReady, result.data.access_token);
                await setAccountType(db, dbReady, "email");

                // Load the authenticated state
                await load(db, dbReady);
                return true;
            }
        } catch (error) {
            console.log(error);
            return false;
        }
    };


    const logout = useCallback(async (db: IDBPDatabase<unknown> | null, dbReady: boolean) => {
        if (!dbReady || !db) {
            console.error("Database not initialized");
            throw new Error("Database not initialized");

        }

        try {
            console.log("logging out")

            const token = await db?.get("auth", "access_token")
            if (token) {
                db.put('settings', false, 'isMining');
                await db?.delete("auth", "access_token")
                setAuthToken(db, dbReady, undefined);
                state.dispatch(logoutUser());
                setPersonalSignature(db, dbReady, undefined);
                setAccountType(db, dbReady, undefined);
                // TODO: metamask disconnect
                //sdk.disconnect();
            }
        } catch (error) {
            console.error("Failed to logout user", error);
        }
    }, []);

    return { login, startOTP, verifyOTP, load, logout };
}

export default useAuth;
