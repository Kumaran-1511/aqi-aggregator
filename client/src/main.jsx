import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import './index.css';
import 'leaflet/dist/leaflet.css';
import './i18n';
import App from './App.jsx';

const rawApiUrl = import.meta.env.VITE_API_URL;
if (rawApiUrl) {
  axios.defaults.baseURL = rawApiUrl.replace(/\/$/, '');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
