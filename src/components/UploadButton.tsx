import { useState } from "react";





const UploadButton: React.FC = () => {

    const backendUrl = import.meta.env.VITE_BACKEND_ENDPOINT;


    const [file, setFile] = useState<File | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            setFile(event.target.files[0]);
        }
    };

    const handlePresignedPut = () => {
        if (file) {
            presignedPut(file);
        } else {
            console.error('No file selected');
        }
    };


    async function getPresignedUrl() {
        const response = await fetch(backendUrl + '/presigned-url', {
            method: 'PUT', // Assuming your backend expects a PUT request
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to get presigned URL: ${response.statusText}`);
        }

        return response.json();
    }


    async function presignedPut(file: File) {
        try {
            // Get the presigned URL and headers from the backend
            const { presigned_url, method, headers } = await getPresignedUrl();


            // Create a new FormData object to hold the file

            // Perform the upload using the presigned URL
            const formData = new FormData();
            formData.append('file', file)

            const response = await fetch(presigned_url, {
                method, // This will use the PUT method as specified
                headers: {
                    ...headers, // Include the headers returned by the backend
                    'Content-Type': file.type || 'application/octet-stream' // Set Content-Type to match the file type


                },
                body: formData, // Directly pass the file binary as body
            });
            console.log(response)

            console.log(JSON.stringify(response))
            if (!response.ok) {
                throw new Error(`Failed to upload file: ${response.statusText}`);
            }

            console.log('File uploaded successfully!');
        } catch (error) {
            console.error('Error uploading file:', error);
        }
    }



    return (
        < div className="w-full flex justify-center" >
            <input type="file" onChange={handleFileChange} />
            <button onClick={handlePresignedPut} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600" >
                UPLOAD DATA
            </button>
        </div >
    )

}

export default UploadButton;