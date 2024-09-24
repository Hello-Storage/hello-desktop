import React, { useState, useEffect } from 'react';
import useIndexedDB from './idb/useIndexedDb';
import StorageDragBar from './components/storage/StorageDragBar';
//import UploadButton from './components/UploadButton';
//import DownloadButton from './components/DownloadButton';




declare global {
    interface Window {
        electron: {
            getAvailableStorage: () => Promise<number>;
            setOfferedStorage: (storage: number) => Promise<boolean>;
            openOfferedStorage: () => Promise<void>;
        };
    }
}


// Functional Component
const Dashboard: React.FC = () => {
    const db = useIndexedDB();




    const [isMining, setIsMining] = useState<boolean>(false);
    const [currentBalance, setCurrentBalance] = useState<number>(0);
    const [storage, setStorage] = useState<number>(0);
    const [maxStorage, setMaxStorage] = useState<number>(100); // Default to 100 GB
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [loadingMessage, setLoadingMessage] = useState<string>('');


    // Load data from IndexedDB when the database is ready
    useEffect(() => {
        if (!db) return;

        const loadData = async () => {
            setIsLoading(true)
            const savedBalance = await db.get('settings', 'currentBalance');
            const savedStorage = await db.get('settings', 'storage');
            const savedIsMining = await db.get('settings', 'isMining');

            if (savedBalance !== undefined) {
                setCurrentBalance(savedBalance);
            }
            if (savedStorage !== undefined) {
                setStorage(savedStorage);
            }

            if (savedIsMining !== undefined) {
                setIsMining(savedIsMining);
            }

            setIsLoading(false);
        };

        loadData();
    }, [db]);

    // Save currentBalance to IndexedDB whenever it changes

    useEffect(() => {
        if (!db || currentBalance <= 0 || isLoading) return;
        db.put('settings', currentBalance, 'currentBalance');
    }, [currentBalance, db]);


    // Save storage to IndexedDB whenever it changes
    useEffect(() => {
        if (!db || storage <= 0 || storage > maxStorage || isLoading) return;
        db.put('settings', storage, 'storage');
    }, [storage, db]);

    // Save isMining to IndexedDB whenever it changes
    useEffect(() => {
        if (!db || isLoading) return;
        db.put('settings', isMining, 'isMining');
    }, [isMining, db]);


    useEffect(() => {
        let miningInterval: NodeJS.Timeout | undefined;
        if (isMining) {
            miningInterval = setInterval(() => {
                setCurrentBalance((prevBalance) => prevBalance + 0.0000000001);
            }, 1000); // Increment balance every second
        } else {
            clearInterval(miningInterval);
        }

        // Cleanup interval on component unmount or when mining stops
        return () => clearInterval(miningInterval);
    }, [isMining]);

    useEffect(() => {
        // Fetch available storage on component mount
        const fetchAvailableStorage = async () => {
            const availableStorage = await window.electron.getAvailableStorage();
            setMaxStorage(Math.floor(availableStorage * 0.9)); // Set max storage to available storage (in GB)
        };

        fetchAvailableStorage();
    }, []);

    const handleMiningClick = () => {
        setIsMining(!isMining); // Toggle mining state
    };

    const handleStorageChange = async (b: number) => {
        if (b < 0 || b > maxStorage) return;


        // Set offered storage in the main process

        setIsLoading(true);
        setLoadingMessage('Setting offered storage...');
        const result = await window.electron.setOfferedStorage(b);
        if (result) {
            if (b === 0) {
                setLoadingMessage('Offered storage removed successfully');
            } else {
                setLoadingMessage('Offered storage set successfully');
            }
            //sleep for 2 seconds
            await new Promise(r => setTimeout(r, 2000));
        }
        setLoadingMessage('');
        setIsLoading(false);
        setStorage(b); // Update storage state

    };


    return (
        <div className="flex flex-col items-center p-6 space-y-4" >

            {/* First Row: Upload Data Button */}
            {/*
            <UploadButton />
            <DownloadButton />
            */}
            {/*Add a loadingMessage view with nice tailwindcss design and progress spinner*/}
            <div className="w-full flex justify-center items-center">
                {isLoading && (
                    <div className="flex items-center space-x-2">
                        <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-lg font-semibold">{loadingMessage}</p>
                    </div>
                )}
            </div>

            {/* Second Row: Start/Stop Mining Button */}
            <div className="w-full flex justify-center">
                <button
                    onClick={handleMiningClick}
                    className={`${isMining ? 'bg-red-500' : 'bg-green-500'
                        } text-white px-4 py-2 rounded hover:${isMining ? 'bg-red-600' : 'bg-green-600'}`
                    }
                    disabled={isLoading} // Disable the button while loading data
                >
                    {isMining ? 'STOP MINING' : 'START MINING'}
                </button>
            </div>

            {/* Current Balance Row */}
            <div className="w-full flex justify-center items-center" >
                <p className="text-lg font-semibold" > Current Balance: {currentBalance.toFixed(10)} HELLO </p>
            </div>

            {/* storage Drag Bar */}
            <div className="w-full flex flex-row items-center" >
                <StorageDragBar storage={storage} maxStorage={maxStorage} handleStorageChange={handleStorageChange} />
            </div>

        </div>
    );
};

export default Dashboard;
