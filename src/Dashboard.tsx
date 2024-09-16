import React, { useState, useEffect } from 'react';
import { openDB } from 'idb';
import useIndexedDB from './idb/useIndexedDb';




declare global {
    interface Window {
        electron: {
            getAvailableStorage: () => Promise<number>;
        };
    }
}


// Functional Component
const Dashboard: React.FC = () => {
    const db = useIndexedDB();



    const [isMining, setIsMining] = useState<boolean>(false);
    const [currentBalance, setCurrentBalance] = useState<number>(0);
    const [bandwidth, setBandwidth] = useState<number>(0);
    const [maxBandwidth, setMaxBandwidth] = useState<number>(100); // Default to 100 GB

    // Load data from IndexedDB when the database is ready
    useEffect(() => {
        if (!db) return;

        const loadData = async () => {
            const savedBalance = await db.get('settings', 'currentBalance');
            const savedBandwidth = await db.get('settings', 'bandwidth');
            const savedIsMining = await db.get('settings', 'isMining');

            if (savedBalance !== undefined) {
                setCurrentBalance(savedBalance);
            }
            if (savedBandwidth !== undefined) {
                setBandwidth(savedBandwidth);
            }

            if (savedIsMining !== undefined) {
                setIsMining(savedIsMining);
            }
        };

        loadData();
    }, [db]);

    // Save currentBalance to IndexedDB whenever it changes
    
    useEffect(() => {
        if (!db || currentBalance <= 0) return;
        db.put('settings', currentBalance, 'currentBalance');
    }, [currentBalance, db]);
    

    // Save bandwidth to IndexedDB whenever it changes
    useEffect(() => {
        if (!db || bandwidth <= 0 || bandwidth > maxBandwidth) return;
        db.put('settings', bandwidth, 'bandwidth');
    }, [bandwidth, db]);

    // Save isMining to IndexedDB whenever it changes
    useEffect(() => {
        if (!db || !isMining) return;
        db.put('settings', isMining, 'isMining');
    }, [isMining, db]);


    useEffect(() => {
        let miningInterval: NodeJS.Timeout | undefined;
        if (isMining) {
            miningInterval = setInterval(() => {
                setCurrentBalance((prevBalance) => prevBalance + 0.00001);
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
            /*
            (window as any).ipcRenderer.onAlertTitle((title: string) => {
                alert(title); // Show an alert with the title
            });
            */
            const availableStorage = await window.electron.getAvailableStorage();
            //console.log("res", res)
            //const availableStorage = await window.electron.getAvailableStorage();
            setMaxBandwidth(Math.floor(availableStorage * 0.9)); // Set max bandwidth to available storage (in GB)
        };

        fetchAvailableStorage();
    }, []);

    const handleMiningClick = () => {
        setIsMining(!isMining); // Toggle mining state
    };

    const handleBandwidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBandwidth(Number(e.target.value)); // Update bandwidth state
    };

    return (
        <div className="flex flex-col items-center p-6 space-y-4" >
            {/* First Row: Upload Data Button */}
            <div className="w-full flex justify-center">
                <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600" >
                    UPLOAD DATA
                </button>
            </div>

            {/* Second Row: Start/Stop Mining Button */}
            <div className="w-full flex justify-center">
                <button
                    onClick={handleMiningClick}
                    className={`${isMining ? 'bg-red-500' : 'bg-green-500'
                        } text-white px-4 py-2 rounded hover:${isMining ? 'bg-red-600' : 'bg-green-600'}`
                    }
                >
                    {isMining ? 'STOP MINING' : 'START MINING'}
                </button>
            </div>

            {/* Current Balance Row */}
            <div className="w-full flex justify-center items-center" >
                <p className="text-lg font-semibold" > Current Balance: {currentBalance.toFixed(5)} HELLO </p>
            </div>

            {/* Bandwidth Drag Bar */}
            <div className="w-full flex flex-col items-center" >
                <label htmlFor="bandwidth" className="mb-2 text-sm font-medium" >
                    Offered Bandwidth: {bandwidth} GB
                </label>
                <input
                    id="bandwidth"
                    type="range"
                    min="0"
                    max={maxBandwidth}
                    value={bandwidth}
                    onChange={handleBandwidthChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-slider"
                />
            </div>

            {/* Custom styles for the range slider */}
            <style>{`
        input[type='range'].range-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 8px;
          background: linear-gradient(to right, #3b82f6 ${(bandwidth * 100) / maxBandwidth}%, #e5e7eb ${(bandwidth * 100) / maxBandwidth}%);
          border-radius: 5px;
          outline: none;
          transition: background 0.3s ease;
        }
        input[type='range'].range-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
        }
        input[type='range'].range-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
        }
      `}</style>
        </div>
    );
};

export default Dashboard;
