import { useGoogleLogin } from "@react-oauth/google";
import { GoogleIcon } from "../icons";
import { useState } from "react";
import * as Web3 from "web3";
import useAuth from "../../hooks/useAuth";
import { useIndexedDB } from "../../idb/IndexedDBContext";
import setAuthToken from "../../api/setAuthToken";
import setAccountType from "../../api/setAccountType";
import { AccountType, Api } from "../../api";
export default function GoogleLoginButton() {
    const { db, dbReady } = useIndexedDB();
    const { load } = useAuth(db, dbReady);
    const [loading, setLoading] = useState<boolean>(false);

    const login = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            const account = Web3.eth.accounts.create();
            const referrerCode = new URLSearchParams(window.location.search).get("ref");
            const referrerParams = referrerCode ?? {};

            const Params = {
                code: tokenResponse.access_token,
                "wallet_address": account.address,
                "private_key": account.privateKey,
                "referrer_code": referrerParams,
            };

            const oauthResp = await Api.get("/oauth/google", {
                params: Params,
            });
            setAuthToken(db, dbReady, oauthResp.data.access_token);
            setAccountType(db, dbReady, AccountType.Google);
            load(db, dbReady);
            setLoading(false);
        },
        onError: () => {
            setLoading(false);
        },
        onNonOAuthError: () => {
            setLoading(false);
        },
    });

    return (
        <button
            className={"w-full inline-flex items-center justify-center gap-4 rounded-xl p-4 bg-gray-100 hover:bg-gray-200"}
            onClick={() => {
                setTimeout(() => { // this is to prevent the opened window from being hiden by the browser, it's a hack but it works (wtf XD)
                    login();
                }, 500);
                setLoading(true);
            }}
            disabled={loading}
        >
            <GoogleIcon />
            <p>
                {loading ? "Connecting..." : <span className="button-text-login">
                </span>}
                {" "}
                Google
            </p>
        </button>
    );
}
