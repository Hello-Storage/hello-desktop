import { Api } from "../api/api";
import { LoadMinerResponse, } from "../api/types/user";
import { useCallback } from "react";
import { loadingMiner, loadMiner, loadMinerFail } from "../state/miner/actions";
import state from "../state";
import { IDBPDatabase } from "idb";
import { Miner } from "../state/miner/reducer";


const useFetch = (db: IDBPDatabase<unknown> | null, dbReady: boolean) => {
    if (!dbReady || !db) {
        console.log('Database not ready yet');
    }

    const fetchMinerData = useCallback(async (db: IDBPDatabase<unknown> | null, dbReady: boolean) => {
        try {
            state.dispatch(loadingMiner());
            if (!dbReady || !db) {
                console.error("Database not initialized");
                alert("database not initialized")
                throw new Error("Database not initialized");

            }
            const accessToken = await db.get("auth", "access_token");
            if (accessToken) {
                const loadResp = await Api.get<LoadMinerResponse>("/load/miner");

                //console.log("Load resp:")
                //console.log(loadResp.data)

                const minerResponse: Miner = {
                    balance: loadResp.data.miner.balance,
                    lastChallenge: loadResp.data.miner.last_challenge,
                    offeredStorageBytes: loadResp.data.miner.offered_storage,
                    rewardRate: loadResp.data.rewardRate,
                }



                state.dispatch(loadMiner(minerResponse));
            }

        } catch (error) {
            state.dispatch(loadMinerFail());
        }
    }, []);



    return { fetchMinerData };
}

export default useFetch;
