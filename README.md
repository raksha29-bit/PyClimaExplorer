# PyClimaExplorer+ 🌍
**Global Climate Risk Intelligence Platform**

PyClimaExplorer+ is an enterprise-grade, web-based GIS platform designed to instantly visualize multi-dimensional climate data. It translates raw meteorological data cubes and live API feeds into actionable visual intelligence, historical comparisons, and AI-driven risk assessments.

## ✨ Core Features
* **Interactive Climate Globe:** 3D spatial mapping of Temperature, Precipitation, Humidity, and Wind Speed using NetCDF data cubes and Mapbox.
* **Local Weather Search:** Live API integration for real-time, pinpoint meteorological data extraction with built-in geocoding.
* **Temporal Comparison Mode:** Side-by-side analysis of multi-variable climate shifts across user-defined historical decades.
* **AI Story Guide & Personality:** Narrative-driven climate insights, region "personality" profiling, and automated map time-lapses for future predictions.
* **Anomaly Analysis Suite:** Advanced map diagnostics including 30-year Unusual Detectors, Spatial Outlier Finders, Pattern Break tracking, and an aggregated Risk Stability Score.
* **Context-Aware AI Tour:** Built-in interactive `react-joyride` tutorials tailored to every specific dashboard view.

## 🛠 Tech Stack
* **Frontend:** React 19 (Vite), Tailwind CSS, Recharts (Data Visualization), Mapbox GL JS, React Joyride, Lucide Icons.
* **Backend:** Python, FastAPI, Xarray (NetCDF processing), Pandas, NumPy.
* **External APIs:** Open-Meteo (Live & Historical Data), OpenStreetMap Nominatim (Geocoding).

## 📊 Data Sources & Sample Data
This application utilizes a highly optimized **Hybrid Data Architecture**:
1. **Point-in-Time & Historical Queries (Local Search / Comparison):** Powered directly by the [Open-Meteo REST API](https://open-meteo.com/), which serves ultra-low latency **ECMWF ERA5 Climate Reanalysis** data.
2. **Global Spatial Mapping (Interactive Globe):** Powered by NetCDF (`.nc`) data cubes processed by Xarray. 

**Where to get Map Data:**
* **Automated (Recommended):** Run the included `build_real_globe.py` script in the backend. It will automatically fetch a 612-point global grid of real historical data from the Open-Meteo Archive and compile it into a `real_climate.nc` file for immediate use.
* **Enterprise:** The backend is architected to accept massive, real-world CMIP6 or CESM Large Ensemble NetCDF data cubes directly from the [NCAR CVDP Data Repository](https://www.cesm.ucar.edu/projects/cvdp/data-repository).

## 🚀 Local Setup & Installation

### Prerequisites
* Node.js (v18+)
* Python (3.9+)
* A Mapbox Access Token (placed in `frontend/src/App.jsx`)

### 1. Backend Setup
Navigate to the backend directory, install the Python dependencies, generate the sample data, and start the FastAPI server.

```bash
cd backend

# Create and activate a virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate

# Install required packages
pip install fastapi uvicorn xarray pandas numpy requests netCDF4

# Generate the real-world NetCDF global data cube
python build_real_globe.py

# Start the backend server (runs on http://127.0.0.1:8000)
uvicorn main:app --reload
```

### 2. Frontend Setup
Open a new terminal window, navigate to the frontend directory, install the Node modules, and start the Vite development server.

```bash
cd frontend

# Install dependencies (use legacy peer deps if React 19 conflicts arise)
npm install --legacy-peer-deps

# Start the frontend application
npm run dev
```

### 3. Access the App
Open your browser and navigate to the localhost URL provided by Vite (typically http://localhost:5173 or http://localhost:5174).
