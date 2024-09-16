import { useAppDispatch } from "./hooks/storeHooks";
import { increment, decrement } from "./slices/counterSlice";

export default function Counter() {
    const dispatch = useAppDispatch();

    function incrementCounter() {
        dispatch(increment());
    }

    function decrementCounter() {
        dispatch(decrement());
    }

    return (
        <>
            <div className="grid grid-rows-2 gap-4">
                <div className="col-span-2 text-center">
                    <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={incrementCounter}>
                        Increment +
                    </button>
                </div>
                <div className="col-span-2 text-center">
                    <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={decrementCounter}>
                        Decrement -
                    </button>
                </div>
            </div>
        </>
    );
}
