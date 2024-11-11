import { createReducer } from "@reduxjs/toolkit";

import { loadMiner, loadingMiner, loadMinerFail, setMinerBalance, setMinerRewardRate, setOfferedStorage } from "./actions";

export enum Theme {
  DARK = 'dark',
  LIGHT = 'light'
}
// double or float in typescript is:
// 
export interface Miner {
  balance: string;
  lastChallenge: string;
  offeredStorageBytes: number;
  rewardRate: string;
}

const initialState: Miner = {
  balance: "0",
  lastChallenge: "",
  offeredStorageBytes: 0,
  rewardRate: "0",
};

export default createReducer<Miner>(initialState, (builder) => {
  builder
    .addCase(loadingMiner, (state) => ({
      ...state,
      loading: true,
    }))
    .addCase(loadMiner, (state, { payload }) => ({
      ...state,
      ...payload,
      loading: false,
    }))
    .addCase(loadMinerFail, (state) => ({
      ...state,
      loading: false,
    }))
    .addCase(setMinerBalance, (state, { payload }) => ({
      ...state,
      balance: payload ?? state.balance,
    }))
    .addCase(setMinerRewardRate, (state, { payload }) => ({
      ...state,
      rewardRate: payload ?? state.rewardRate,
    }))
    .addCase(setOfferedStorage, (state, { payload }) => ({
      ...state,
      offeredStorageBytes: payload,
    }))
});