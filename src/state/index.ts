import { useDispatch, useSelector } from "react-redux";
import type { TypedUseSelectorHook } from "react-redux";
import { configureStore, combineReducers } from "@reduxjs/toolkit";

import userReducer from "./user/reducer";
import errorReducer from "../slices/errorSlice";

const rootReducer = combineReducers({
  user: userReducer,
  error: errorReducer,
});



export const state = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
  getDefaultMiddleware({
    serializableCheck: false,
  }),

  devTools: import.meta.env.MODE !== "production",
});

export type AppState = ReturnType<typeof state.getState>;
export type AppDispatch = typeof state.dispatch;
export type RootState = ReturnType<typeof state.getState>

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<AppState> = useSelector;

export default state;
