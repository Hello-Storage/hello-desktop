import { useEffect, useState } from "react";
//import folder-icon.svg located at src/assets/icons/folder-icon.svg
import folderIcon from '../../assets/folder-icon.svg';
import { FiFolder } from "react-icons/fi";



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
        <div className="bg-white rounded-lg shadow-md p-6">
            {/* Storage Slider */}
            <div className="flex flex-col items-center mb-6">
                <label htmlFor="Storage" className="mb-2 text-lg font-medium text-gray-700">
                    Offered Storage: {selectedStorage} GB
                </label>
                <input
                    id="Storage"
                    type="range"
                    min="0"
                    max={maxStorage}
                    value={selectedStorage}
                    onChange={handleSelectedStorage}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    style={{
                        background: `linear-gradient(to right, #3b82f6 ${(selectedStorage / maxStorage) * 100
                            }%, #e5e7eb ${(selectedStorage / maxStorage) * 100}%)`,
                    }}
                />
            </div>

            {/* Update and Remove Storage Buttons */}
            <div className="flex flex-col sm:flex-row sm:justify-between items-center mb-4 space-y-2 sm:space-y-0">
                <button
                    onClick={() => handleStorageChange(selectedStorage)}
                    className={`w-full sm:w-auto ${selectedStorage === storage
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-500 hover:bg-blue-600'
                        } text-white px-4 py-2 rounded-lg transition-colors duration-300`}
                    disabled={selectedStorage === storage}
                >
                    UPDATE STORAGE ({selectedStorage} GB)
                </button>
                {storage !== 0 && (
                    <button
                        onClick={() => handleStorageChange(0)}
                        className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors duration-300 sm:ml-2"
                    >
                        REMOVE STORAGE
                    </button>
                )}
            </div>

            {/* Open Storage Folder Button */}
            <div className="flex justify-center">
                <button
                    onClick={async () => await window.electron.openOfferedStorage()}
                    disabled={storage === 0}
                    className={`flex items-center ${storage === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'
                        } text-white px-4 py-2 rounded-lg transition-colors duration-300`}
                >
                    <FiFolder className="h-5 w-5 mr-2" />
                    Open Storage Folder
                </button>
            </div>
        </div>
    )

}

export default StorageDragBar;