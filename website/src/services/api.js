import axios from 'axios';

const api = axios.create({
    baseURL: 'http://127.0.0.1:3001', // Flask backend URL
});

export default api;
