import { useEffect, useState } from "react";
//import folder-icon.svg located at src/assets/icons/folder-icon.svg
import folderIcon from '../../assets/folder-icon.svg';



interface StorageDragBarProps {
    storage: number;
    maxStorage: number;
    handleStorageChange: (t: number) => void;
}

const StorageDragBar: React.FC<StorageDragBarProps> = ({ storage, maxStorage, handleStorageChange }) => {

    const [selectedStorage, setSelectedStorage] = useState<number>(storage);

    useEffect(() => {
        setSelectedStorage(storage);
    }, [storage])

    const handleSelectedStorage = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.value === '') {
            setSelectedStorage(0);
            return;
        }
        setSelectedStorage(parseInt(e.target.value));
    }


    return (
        <>
            <div className="w-full flex flex-col items-center" >
                <label htmlFor="Storage" className="mb-2 text-sm font-medium" >
                    Offered Storage: {storage} GB
                </label>
                <input
                    id="Storage"
                    type="range"
                    min="0"
                    max={maxStorage}
                    value={selectedStorage}
                    onChange={handleSelectedStorage}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-slider"
                />
                <button
                    onClick={async () => await window.electron.openOfferedStorage()}
                    disabled={storage === 0}
                    className={`flex items-center ${storage === 0 ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed ' : 'bg-green-500 hover:bg-green-600 cursor-pointer '} text-white px-4 py-2 rounded mt-2`}
                >

                <img src={folderIcon} alt="folder icon" className="h-5 w-5 mr-2" />
                    Open Storage Folder
                </button>

            </div>
            <div className="w-full flex flex-col items-center" >
                {/*Button to handle the change of Storage*/}
                <button
                    onClick={() => handleStorageChange(selectedStorage)}
                    className={`${selectedStorage === storage ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed ' : 'bg-blue-500 hover:bg-blue-600 cursor-pointer '}text-white px-4 py-2 rounded mt-4`}
                    disabled={selectedStorage === storage}
                >UPDATE STORAGE ({selectedStorage} GB)</button>
                {/*Button to remove storage that is active if offered storage is not 0*/}
                {storage !== 0 && <button
                    onClick={() => handleStorageChange(0)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded mt-2"
                    disabled={storage === 0}
                >REMOVE STORAGE</button>}
            </div>

            {/* Custom styles for the range slider */}
            <style>{`
        input[type='range'].range-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 8px;
          background: linear-gradient(to right, #3b82f6 ${(selectedStorage * 100) / maxStorage}%, #e5e7eb ${(selectedStorage * 100) / maxStorage}%);
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
        </>
    )

}

export default StorageDragBar;