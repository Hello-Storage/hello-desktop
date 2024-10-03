import { createSlice, PayloadAction } from "@reduxjs/toolkit"

export type ErrorType = "warning" | "error" | "info"; // Add more types if needed

export interface ErrorMessage {
    id: number;
    message: string;
    type: ErrorType;
}

export interface ErrorState {
    errorQueue: ErrorMessage[];
}

const initialState: ErrorState = {
    errorQueue: [],
}


const errorSlice = createSlice({
    name: 'error',
    initialState,
    reducers: {
        addToast: (state, action: PayloadAction<ErrorMessage>) => {
            state.errorQueue.push(action.payload)
        },
        removeToast: (state, action: PayloadAction<number>) => {
            state.errorQueue = state.errorQueue.filter((error) => error.id !== action.payload)
        },
    }
})

export const { addToast, removeToast } = errorSlice.actions
export default errorSlice.reducer;