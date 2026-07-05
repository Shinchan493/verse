import axios from 'axios';

// Points at the backend API + Socket.IO server. Override at build time with
// REACT_APP_API_URL (e.g. the deployed Render URL); defaults to local dev.
export const BASE_URL =
  process.env.REACT_APP_API_URL ?? 'http://localhost:3001/';

const API = axios.create({
  baseURL: BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

export default API;
