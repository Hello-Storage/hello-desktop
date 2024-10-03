import axios from "axios";


// Create an instance of axios
export const Api = axios.create({
	baseURL: import.meta.env.VITE_API_ENDPOINT,
	headers: {
		"Content-Type": "application/json",
	},
	maxBodyLength: 5 * 1024 * 1024 * 1024, // 5GB
});