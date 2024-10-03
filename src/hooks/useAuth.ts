import * as web3 from "web3";
import { Api } from "../api/api";
import { AccountType, LoadUserResponse, LoginResponse } from "../api/types/user";
import setAuthToken from "../api/setAuthToken";
import setAccountType from "../api/setAccountType";
import { useCallback } from "react";
import { loadingUser, loadUser, loadUserFail } from "../state/user/actions";
import state from "../state";
import setPersonalSignature from "../api/setPersonalSignature";
import { signPersonalSignature } from "../utils/encryption/cipherUtils";
import { IDBPDatabase } from "idb";


const useAuth = (db: IDBPDatabase<unknown> | null) => {

    const load = useCallback(async () => {
        try {
            state.dispatch(loadingUser());
            console.log("3")
            if (db) {
                const accessToken = await db.get("auth", "access_token");
                if (accessToken) {
                    const loadResp = await Api.get<LoadUserResponse>("/load");

                    const privateKey = loadResp.data.walletPrivateKey;
                    // Get account type from IndexedDB
                    const accountType = await db.get('auth', 'account_type') as AccountType;

                    const sessionPersonalSignature = await db.get('auth', 'personal_signature');

console.log("4")
                    if (!sessionPersonalSignature) {
                        //sign message with private key
                        const signature = await signPersonalSignature(
                            loadResp.data.walletAddress,
                            accountType,
                            privateKey
                        );
                        setPersonalSignature(signature);
                        // Store personal signature in IndexedDB
                        await db.put('auth', signature, 'personal_signature');
                    }
                    console.log("t")

                    state.dispatch(loadUser(loadResp.data));
                }
            } else {
                throw Error("User not found");
            }
        } catch (error) {
            state.dispatch(loadUserFail());
        }
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
        try {

            const result = await Api.post<LoginResponse>("/otp/verify", {
                email,
                code,
            })
            setAuthToken(db, result.data.access_token);
            setAccountType(db, "email")
            console.log("1")
            await load()
            console.log("2")
            return true;
        } catch (error) {
            console.log(error)
            return false;
        }
    }

    return { startOTP, verifyOTP };
}

export default useAuth;
