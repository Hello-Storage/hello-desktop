import { createAction } from "@reduxjs/toolkit";
import { Miner } from "./reducer";

export const loadingMiner = createAction("miner/loading");
export const loadMiner = createAction<Miner>("miner/load");
export const loadMinerFail = createAction("miner/load-fail");
export const setMinerBalance = createAction<string | undefined>("miner/setBalance");
export const setMinerRewardRate = createAction<string | undefined>("miner/setRewardRate");
export const setOfferedStorage = createAction<number>("miner/setOfferedStorage");
