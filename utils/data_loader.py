import xarray as xr
import numpy as np
import pandas as pd
import os
import streamlit as st

def get_available_datasets(data_dir="data"):
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)
    return [f for f in os.listdir(data_dir) if f.endswith('.nc')]

def load_climate_data(file_path):
    try:
        @st.cache_data
        def _load(path):
            ds = xr.open_dataset(path)
            ds.load() 
            return ds
        return _load(file_path)
    except Exception as e:
        st.error(f"Error loading dataset: {e}")
        return None

def create_dummy_dataset(output_path="data/dummy_climate.nc"):
    if not os.path.exists("data"):
        os.makedirs("data")
        
    np.random.seed(42)
    times = pd.date_range("2020-01-01", periods=12, freq="ME")
    lats = np.linspace(-90, 90, 36)
    lons = np.linspace(-180, 180, 72)

    temp_base = 30 * np.cos(np.deg2rad(lats))[:, np.newaxis]
    temperature = temp_base + np.random.normal(0, 2, size=(len(times), len(lats), len(lons)))
    precipitation = np.random.exponential(scale=5, size=temperature.shape)

    ds = xr.Dataset(
        {
            "Temperature": (["time", "lat", "lon"], temperature, {"units": "Celsius"}),
            "Precipitation": (["time", "lat", "lon"], precipitation, {"units": "mm"}),
        },
        coords={
            "time": times,
            "lat": (["lat"], lats, {"units": "degrees_north"}),
            "lon": (["lon"], lons, {"units": "degrees_east"}),
        },
        attrs={"description": "Dummy Climate Dataset for Hackathon"}
    )
    
    ds.to_netcdf(output_path)
    return output_path
