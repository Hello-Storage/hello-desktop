import React, { useState, useEffect } from 'react';
import useIndexedDB from './idb/useIndexedDb';
import StorageDragBar from './components/storage/StorageDragBar';
import { IndexedDBProvider } from './idb/IndexedDBContext';
import { FiLoader } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppSelector } from './state';
import useFetch from './hooks/useFetch';
import { useDispatch } from 'react-redux';
import { setMinerBalance, setOfferedStorage } from './state/miner/actions';

declare global {
  interface Window {
    electron: {
      getAvailableStorage: () => Promise<number>;
      setOfferedStorage: (storage: number) => Promise<boolean>;
      openOfferedStorage: () => Promise<void>;
      openExternal: (url: string) => Promise<void>;
      startMining: () => Promise<void>;
      stopMining: () => Promise<void>;
    };
  }
}

const Dashboard: React.FC = () => {
  const { db, dbReady } = useIndexedDB();

  const [isMining, setIsMining] = useState<boolean>(false);
  const [storage, setStorage] = useState<number>(0);
  const [maxStorage, setMaxStorage] = useState<number>(100); // Default to 100 GB
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [showExplosion, setShowExplosion] = useState<boolean>(false);
  const { fetchMinerData } = useFetch(db, dbReady);

  const dispatch = useDispatch();


  const { authenticated } = useAppSelector((state) => state.user);
  const { balance, rewardRate, offeredStorageBytes } = useAppSelector((state) => state.miner);

  // Load data from IndexedDB when the database is ready
  useEffect(() => {
    if (!dbReady || !db) {
      console.error('Database not initialized');
      return;
    }

    const loadData = async () => {
      if (!authenticated) return;
      setIsLoading(true);




      const savedStorage = await db.get('settings', 'storage');
      const savedIsMining = await db.get('settings', 'isMining');

      // get miner data from backend
      await fetchMinerData(db, dbReady);



      if (savedStorage !== undefined) {
        setStorage(savedStorage);
      } else {
        setStorage(offeredStorageBytes);
      }

      if (savedIsMining !== undefined) {
        setIsMining(savedIsMining);
      }

      setIsLoading(false);
    };

    loadData();
  }, [db, dbReady, authenticated]);


  useEffect(() => {
    console.log("balance changed: ", balance)
    console.log("rewardRate changed:", rewardRate) 
    console.log("storage changed:", storage)
  }, [balance, rewardRate])

  // Save currentBalance to IndexedDB whenever it changes
  /*
  useEffect(() => {
    if (!db || currentBalance <= 0 || isLoading) return;
    db.put('settings', currentBalance, 'currentBalance');
  }, [currentBalance, db]);
  */

  // Save storage to IndexedDB whenever it changes
  useEffect(() => {
    if (!db || storage < 0 || storage > maxStorage || isLoading) return;
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
      //get personal token
      //TODO: send it to mining worker

      window.electron.startMining();
      miningInterval = setInterval(() => {
        //get reward rate from mining worker
        dispatch(setMinerBalance((balance + 0.0000000001).toString()));
        //setCurrentBalance((prevBalance) => prevBalance + 0.0000000001);
      }, 1000); // Increment balance every second
    } else {
      window.electron.stopMining();
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
    if (!isMining) {
      // Show explosion animation when starting mining
      setShowExplosion(true);
      setTimeout(() => setShowExplosion(false), 1000); // Hide explosion after animation
    }
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
      // Sleep for 2 seconds
      await new Promise((r) => setTimeout(r, 2000));
    }
    setLoadingMessage('');
    setIsLoading(false);
    setStorage(b); // Update storage state
    dispatch(setOfferedStorage(b));
  };

  return (
    <div className="container mx-auto p-6 relative">
      {/* Explosion Animation */}
      <AnimatePresence>
        {showExplosion && (
          <motion.div
            className="absolute inset-0 flex justify-center items-center z-50 "
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 1.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            <motion.img
              src="https://media.licdn.com/dms/image/v2/D4D0BAQFY7CwbGofyQw/company-logo_200_200/company-logo_200_200/0/1723070978925/hellostorage_logo?e=2147483647&v=beta&t=6cheWsJQ6SKN7dVVgXYWjfvWFOj6VMYWW0VYM0Ze5AM" // Replace with your explosion image URL
              className="w-64 h-64"
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 1 }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Message */}
      {isLoading && (
        <div className="flex justify-center items-center mb-6">
          <div className="flex items-center space-x-2">
            <FiLoader className="animate-spin h-6 w-6 text-blue-500" />
            <p className="text-lg font-semibold">{loadingMessage}</p>
          </div>
        </div>
      )}

      {/* Start/Stop Mining Button */}
      <div className="flex justify-center mb-6">
        <button
          onClick={handleMiningClick}
          className={`relative overflow-hidden flex items-center justify-center ${isMining
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-green-500 hover:bg-green-600'
            } text-white px-6 py-3 rounded-lg shadow-md transition-colors duration-300`}
          disabled={isLoading}
        >
          {isMining ? 'STOP MINING' : 'START MINING'}
        </button>
      </div>

      {/* Current Balance */}
      <div className="flex justify-center mb-6">
        <p className="text-xl font-semibold">
          Current Balance: {parseFloat(balance).toFixed(10)} HELLO
        </p>
      </div>

      {/* Storage Drag Bar */}
      <div className="flex justify-center">
        <div className="w-full max-w-md">
          <StorageDragBar
            storage={storage}
            maxStorage={maxStorage}
            handleStorageChange={handleStorageChange}
          />
        </div>
      </div>
    </div>
  );
};

export default function AppWrapper() {
  return (
    <IndexedDBProvider>
      <Dashboard />
    </IndexedDBProvider>
  );
}
