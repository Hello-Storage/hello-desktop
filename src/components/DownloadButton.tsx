import { useState } from "react";



const DownloadButton: React.FC = () => {


    const backendUrl = import.meta.env.VITE_BACKEND_ENDPOINT;

    const  [objectKey, setObjectKey] = useState<string>('objectKey.pdf');

    const handlePresignedGet = async () => {
        if (!objectKey) {
            alert('No object key entered');
            console.error('No object key entered');
            return;
        }
        const response = await fetch(`${backendUrl}/presigned-url?` + new URLSearchParams({objectKey: objectKey}), {
            method: 'GET',
            headers: {
            'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error(`Failed to download file: ${response.statusText}`);
            return;
        }

        // parse response as json in a single abstract project
        const {headers, method, presigned_url } = await response.json();

        // Make a request to the presigned URL to download the file
        const downloadResponse = await fetch(presigned_url, {
            method,
            headers
        });

        if (!downloadResponse.ok) {
            console.error(`Failed to download file: ${downloadResponse.statusText}`);
            return;
        }

        // Download the file
        const blob = await downloadResponse.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = objectKey;
        a.click();
        window.URL.revokeObjectURL(url);


    };

    return (
        <div className="w-full flex justify-center">
            <input type="text" placeholder="objectKey.pdf" onChange={(e) => setObjectKey(e.target.value)} />
            <button onClick={handlePresignedGet}>Download</button>
        </div>
    );
}

export default DownloadButton;