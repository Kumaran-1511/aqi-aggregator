# AeroWatch Deployment Guide: MongoDB Atlas + Render + Vercel

This guide outlines step-by-step instructions to deploy the AeroWatch platform into production using:
1. **MongoDB Atlas** (Database)
2. **Render** (Node.js Express + Socket.io Server)
3. **Vercel** (Vite + React Single-Page Application)

---

## 1. MongoDB Atlas Setup

1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a new Project and deploy a free **M0 Shared Cluster** (choose AWS or Google Cloud in your closest region).
3. **Database Access**: Under *Security > Database Access*, create a database user:
   - Authentication Method: **Password**
   - Role: **Read and write to any database**
4. **Network Access**: Under *Security > Network Access*, click **Add IP Address**:
   - Choose **Allow Access from Anywhere** (`0.0.0.0/0`) so Render instances can connect.
5. **Get Connection String**:
   - Click **Connect > Drivers > Node.js**.
   - Copy the connection string. It resembles:
     ```
     mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/aqi_system?retryWrites=true&w=majority
     ```
   - Replace `<username>` and `<password>` with your database user credentials.

---

## 2. Backend Deployment on Render

1. Log in to [Render](https://render.com).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository containing the AeroWatch project.
4. Configure the Web Service settings:

| Setting Field | Value |
| :--- | :--- |
| **Name** | `aerowatch-server` *(or your preferred name)* |
| **Region** | Choose region nearest to your target users |
| **Branch** | `main` |
| **Root Directory** | `server` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Plan Type** | `Free` |

5. Under **Environment Variables**, click **Add Environment Variable** and enter:

| Variable Name | Value | Note |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production mode |
| `PORT` | `10000` *(or leave default, Render sets PORT automatically)* | Render binds to this |
| `MONGO_URI` | `mongodb+srv://<user>:<password>@...` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | *(Generate a strong random string, e.g. 32+ characters)* | JWT token signing key |
| `CLIENT_URL` | `https://your-app-name.vercel.app` | Your Vercel frontend URL (update after step 3) |
| `DATA_GOV_API_KEY` | *(Your data.gov.in key if available)* | Optional CPCB feed |
| `OPENAQ_API_KEY` | *(Your OpenAQ key if available)* | Optional OpenAQ feed |
| `WAQI_TOKEN` | *(Your WAQI token if available)* | Optional WAQI feed |
| `IQAIR_API_KEY` | *(Your IQAir key if available)* | Optional IQAir feed |

6. Click **Deploy Web Service**.
7. Once deployed, test the health check URL in your browser:
   `https://<your-render-service-name>.onrender.com/api/health`
   Expected response:
   ```json
   { "status": "ok" }
   ```

---

## 3. Frontend Deployment on Vercel

1. Log in to [Vercel](https://vercel.com).
2. Click **Add New... > Project**.
3. Import your GitHub repository.
4. Configure the Project settings:

| Setting Field | Value |
| :--- | :--- |
| **Framework Preset** | `Vite` |
| **Root Directory** | Click *Edit* and select `client` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

5. Under **Environment Variables**, add:

| Variable Name | Value | Note |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://<your-render-service-name>.onrender.com` | No trailing slash |

6. Click **Deploy**.
7. Vercel will build the Vite bundle and deploy the static SPA.
   Single-page application routes are handled automatically via `client/vercel.json`.

---

## 4. Final Verification & Cross-Origin Handshake

1. Copy your live Vercel URL (e.g. `https://aerowatch.vercel.app`).
2. Go back to your **Render Dashboard > aerowatch-server > Environment**.
3. Set / update `CLIENT_URL` to your Vercel URL:
   ```
   CLIENT_URL=https://aerowatch.vercel.app
   ```
4. Render will automatically redeploy with the updated CORS and Socket.io allowed origins.
5. Open your Vercel app in the browser:
   - Verify that stations and map markers load.
   - Verify the real-time indicator shows connected.
   - Test the Admin login at `/admin` (`admin@aqi.local` / `admin123`).
