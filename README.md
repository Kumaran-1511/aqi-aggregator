# AeroWatch: Real-Time AQI Aggregator & Mapping System

AeroWatch is an enterprise-grade full-stack real-time Air Quality Index (AQI) aggregation, predictive forecasting, and geospatial visualization platform built on the **MERN** stack with **Socket.io**, **Leaflet**, and standard **EPA / CPCB** multi-pollutant calculation engines.

---

## 🔗 Live Demo

- **Frontend (Vercel)**: `https://your-app-name.vercel.app` *(Replace with deployed URL)*
- **Backend API (Render)**: `https://your-server-name.onrender.com` *(Replace with deployed URL)*
- **Health Check**: `https://your-server-name.onrender.com/api/health`

---

## 🌟 Key Features

### 1. Ingestion Engine & Caching Layer
- **Multi-Source Public API Connectors**: Integrated adapters for **CPCB (Central Pollution Control Board, India via data.gov.in)**, **OpenAQ**, **WAQI (World Air Quality Index)**, **IQAir AirVisual**, and **Open-Meteo**.
- **MongoDB 15–30 Minute Throttled Cache**: Avoids redundant external rate limits by tracking polling intervals and serving cached readings.
- **Resilient Seed Generator**: Includes baseline global metropolitan centers and historical time-series data so the system works out of the box even without external API keys.

### 2. Standardized EPA & CPCB Breakpoint Calculation Engine
- Breakpoint sub-index formula:
  $$I_p = \left[\frac{I_{hi} - I_{lo}}{BP_{hi} - BP_{lo}}\right] \cdot (C_p - BP_{lo}) + I_{lo}$$
- Calculates sub-indices across **PM2.5**, **PM10**, **NO2**, **SO2**, **CO**, and **O3**, determines the dominant pollutant, and assigns the overall AQI and category (Good, Moderate, Unhealthy for Sensitive Groups, Unhealthy, Very Unhealthy, Hazardous).

### 3. Interactive Leaflet Geospatial Map & Popups
- **CartoDB Dark Matter Geospatial Base Tiles**: Modern dark aesthetic with high contrast markers.
- **Color-Coded Animated Radar Markers**: Visual pulsing rings color-matched to AQI danger levels.
- **Station Popups**: Shows station name, city, current AQI badge, dominant pollutant, and a 6-pollutant concentration breakdown grid.
- **Quick City Navigator**: Jump directly to major metro areas (Delhi, Mumbai, Bengaluru, Kolkata, Chennai, London, New York, Paris, Tokyo).

### 4. Continuous Heatmap Layer
- **Interpolated Density Heatmap**: Uses `leaflet.heat` to compute continuous pollution gradient fields between neighboring stations.
- Smoothly toggleable from the map layer control bar.

### 5. Station Analytics Drawer & AI Forecasting
- **Recharts Dynamic Time-Series**: Interactive line/area charts toggleable across **24 Hours**, **7 Days**, and **30 Days**.
- **Next-Day AI Predictive Forecast** (`/api/forecast/:stationId`): Lightweight time-series regression blending historical momentum with diurnal atmospheric and rush-hour cycles.

### 6. Real-Time Push Layer (Socket.io)
- WebSocket server emits `aqi:update` events whenever a polling cycle finishes or new readings are stored.
- Frontend markers, badges, and drawers update seamlessly in real time without a page refresh.

### 7. Location-Based Threshold Alerts
- Users can subscribe with their email, geographic radius, and custom AQI threshold (e.g., alert if AQI > 150).
- Background `node-cron` worker queries MongoDB with `$nearSphere` against active alerts and dispatches emails via **Nodemailer**.

### 8. Citizen Crowdsourced Smoke & Odor Reports
- Community members can submit geotagged pollution reports (biomass burning, factory odor, vehicle smog).
- Pinned as flame markers on the map with severity ratings and admin moderation workflow.

### 9. Role-Based Admin Dashboard (`/admin`)
- Protected by JWT authentication (`admin@aqi.local` / `admin123`).
- Ingestion telemetry logs (latency, status, records stored, errors) and immediate manual poll trigger.
- Citizen report moderation queue (Approve, Reject, Delete).
- Station management (Add new station with lat/lng, delete station).

### 10. Multi-Language Support (`react-i18next`)
- Complete bilingual support for **English** and **Hindi (`hi`)** covering navigation, AQI categories (अच्छा, संतोषजनक, मध्यम, खराब, बहुत खराब, गंभीर), health guidance, and chat assistant prompts.

### 11. Voice & AI Chat Assistant (`AeroAI`)
- Integrated floating conversational assistant with **HTML5 Web Speech API** (`webkitSpeechRecognition`) and SpeechSynthesis TTS.
- Natural-language intent matching mapped to backend REST endpoints.

### 12. Data Export Reports
- **CSV Data Export** via `json2csv` (`/api/export/:stationId?format=csv`).
- **PDF Audit Certificate** via `pdfkit` (`/api/export/:stationId?format=pdf`) containing summary statistics (min/max/average) and measurement tables.

### 13. Progressive Web App (PWA)
- Manifest (`manifest.json`) and service worker (`sw.js`) that caches station datasets and assets in CacheStorage for offline viewing.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Leaflet, React-Leaflet, Recharts, Socket.io-client, Lucide-React, i18next
- **Backend**: Node.js, Express, Socket.io, Mongoose (MongoDB ODM), node-cron, Nodemailer, JSON Web Tokens (JWT), Axios, PDFKit, JSON2CSV
- **Database**: MongoDB (Local or MongoDB Atlas)
- **Deployment**: Render (Server Web Service) + Vercel (Client Static SPA)

---

## 📡 Data Sources

AeroWatch integrates data from diverse atmospheric and meteorological providers:

1. **CPCB (Central Pollution Control Board, India)** via `data.gov.in`: Real-time Continuous Ambient Air Quality Monitoring (CAAQMS) stations across India.
2. **OpenAQ**: Global open-source air quality measurements across 100+ countries.
3. **WAQI (World Air Quality Index / aqicn.org)**: Aggregated municipal and government stations globally.
4. **IQAir AirVisual**: High-accuracy particulate matter and urban atmospheric quality feeds.
5. **Open-Meteo**: Zero-setup, keyless baseline European Center for Medium-Range Weather Forecasts (ECMWF) atmospheric chemistry feed.
6. **Sensor.Community (Optional)**: Citizen particulate matter sensor networks (PM2.5 / PM10).

---

## 🏗️ Directory Structure

```
AQI/
├── client/                      # Frontend Application (Vite + React)
│   ├── public/                  # Static assets, manifest.json, sw.js
│   ├── src/
│   │   ├── components/          # Map, Navigation, Cards, Modals, Drawer
│   │   ├── utils/               # Color standards, breakpoint helpers
│   │   ├── i18n.js              # Bilingual dictionaries (en, hi)
│   │   ├── App.jsx              # Application state and Socket.io listeners
│   │   └── main.jsx             # Entry point
│   ├── .env.example             # Frontend environment variables template
│   ├── vercel.json              # SPA routing rewrite rule for Vercel
│   ├── package.json
│   └── vite.config.js
├── server/                      # Backend Application (Express + Socket.io)
│   ├── src/
│   │   ├── app.js               # Express application middleware & routes
│   │   ├── index.js             # HTTP server, Socket.io & cron bootstrap
│   │   ├── config/              # MongoDB connection
│   │   ├── models/              # Station, Reading, Alert, Report, User, Log
│   │   ├── routes/              # REST API controllers
│   │   ├── services/            # Ingestion connectors (CPCB, WAQI, OpenAQ, Open-Meteo)
│   │   ├── jobs/                # Background cron jobs (ingestion, alerts)
│   │   ├── middleware/          # JWT authentication middleware
│   │   └── utils/               # Breakpoint formula math, forecaster, mailer
│   ├── tests/                   # Automated unit & integration tests
│   ├── .env.example             # Backend environment variables template
│   └── package.json
├── .gitignore                   # Root Git ignore rules
├── DEPLOYMENT.md                # Render & Vercel deployment instructions
└── README.md                    # Project documentation
```

---

## ⚙️ Environment Variables

### Server Variables (`server/.env`)

| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `PORT` | No | `5000` | Port on which Express and Socket.io listen |
| `NODE_ENV` | No | `development` | Runtime mode (`development` or `production`) |
| `MONGO_URI` / `MONGODB_URI` | **Yes** | `mongodb://127.0.0.1:27017/aqi_system` | MongoDB connection URI (local or MongoDB Atlas) |
| `JWT_SECRET` | **Yes** | — | Secret key used for signing administrative JWT tokens |
| `CLIENT_URL` | No | `http://localhost:5173` | Allowed frontend origin URL for CORS and Socket.io |
| `INGESTION_CRON` | No | `*/30 * * * *` | Cron schedule for background telemetry polling |
| `CACHE_TTL_MINUTES` | No | `30` | Duration to cache telemetry before re-fetching |
| `DATA_GOV_API_KEY` | Optional | — | API key for India data.gov.in CPCB CAAQMS feed |
| `CPCB_DATA_GOV_API_KEY`| Optional | — | Alias / fallback key for data.gov.in feed |
| `OPENAQ_API_KEY` | Optional | — | API key for OpenAQ v3 REST API |
| `AQICN_API_TOKEN` / `WAQI_TOKEN` | Optional | — | API token for World Air Quality Index / aqicn.org |
| `IQAIR_API_KEY` | Optional | — | API key for IQAir AirVisual API |
| `SMTP_HOST` | Optional | — | SMTP mail server hostname for email alerts |
| `SMTP_PORT` | Optional | `587` | SMTP mail server port |
| `SMTP_USER` | Optional | — | SMTP authentication username |
| `SMTP_PASS` | Optional | — | SMTP authentication password |
| `ALERT_SENDER_EMAIL` | Optional | `alerts@aqi-system.local` | Outgoing sender address for email alerts |

### Client Variables (`client/.env`)

| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `VITE_API_URL` | In Prod | `""` (relative) | Full base URL of deployed backend (e.g. `https://your-server.onrender.com`) |

---

## 🚀 Local Development Setup

### Prerequisites
- **Node.js**: v18 or later
- **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017`) or MongoDB Atlas cluster

### 1. Server Setup
```bash
cd server
cp .env.example .env
npm install
npm run dev
```
Backend will start on `http://localhost:5000`.

### 2. Client Setup
```bash
cd ../client
cp .env.example .env
npm install
npm run dev
```
Frontend will start on `http://localhost:5173`.

---

## 🧪 Automated Testing

Run the test suite (Jest + Supertest):
```bash
cd server
npm test
```

---

## 🔑 Default Admin Credentials
- **Email**: `admin@aqi.local`
- **Password**: `admin123`
