import axios from "axios";
import { BACKEND_URL } from "./Env";

export const API = axios.create({
    baseURL: `${BACKEND_URL}`,
    timeout: 10000,
});

API.interceptors.response.use((response) => response, (error) => {
    console.log('CUSTOM ERROR HANDLER') 
    alert('AN error' + error); // TODO Display toast message  
    throw error;
    // return Promise.reject(error)
});

