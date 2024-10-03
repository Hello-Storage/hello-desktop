import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../stores/store";
import { removeToast } from "../slices/errorSlice";

const ErrorMessageQueue: React.FC = () => {
    const dispatch = useDispatch();
    const errorQueue = useSelector((state: RootState) => state.error.errorQueue);

    // Remove an error from the queue by id
    const handleRemoveToast = (id: number) => {
        dispatch(removeToast(id));
    }


    return (
        <div className="fixed top-5 right-5 space-y-3">
            {errorQueue.map((error) => (
                <div
                    key={error.id}
                    className={`flex items-center justify-between p-4 rounded-md shadow-md ${error.type === "error"
                            ? "bg-red-500 text-white"
                            : error.type === "warning"
                                ? "bg-yellow-400 text-black"
                                : "bg-blue-500 text-white"
                        }`}
                >
                    <span>{error.message}</span>
                    <button
                        className={"ml-4 text-lg font-bold hover:opacity-75 text-black"}
                        onClick={() => handleRemoveToast(error.id)}
                    >
                        &times;
                    </button>
                </div>
            ))}
        </div>
    );
};

export default ErrorMessageQueue;