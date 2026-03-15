import xarray as xr
import numpy as np

def generate_climate_insight(variable: str, time_str: str, data_slice: xr.DataArray) -> str:
    """
    Simulates an AI agent analyzing the climate data slice to detect anomalies 
    and generate a human-readable risk story.
    """
    mean_val = float(data_slice.mean(skipna=True))
    max_val = float(data_slice.max(skipna=True))
    min_val = float(data_slice.min(skipna=True))
    
    anomaly_spread = max_val - mean_val
    
    insight = f"### 🚨 Regional Risk Analysis: {time_str}\n\n"
    insight += f"**System Scan Complete for {variable}.**\n\n"
    
    insight += f"**📊 Data Telemetry:**\n"
    insight += f"* **Global Mean:** {mean_val:.2f} \n"
    insight += f"* **Peak Extremes:** {max_val:.2f} (High) | {min_val:.2f} (Low)\n\n"
    
    insight += f"**🧠 AI Anomaly Detection:**\n"
    if variable == "Temperature":
        if anomaly_spread > 2.0:
            insight += f"> **CRITICAL HEAT ANOMALY DETECTED.** A peak extreme of {max_val:.2f}°C represents a significant deviation from the baseline. High probability of localized heat stress."
        else:
            insight += "> Thermal baselines are within expected historical variances. No immediate extreme heat risks detected."
            
    elif variable == "Precipitation":
        if anomaly_spread > 5.0:
            insight += f"> **ELEVATED FLOOD RISK.** Anomalous rainfall peaks reaching {max_val:.2f}mm indicate severe atmospheric dumping. Prepare for flash flooding."
        else:
            insight += "> Precipitation patterns are stable. Hydrological risk is currently low."
            
    else:
        insight += f"> Abnormal {variable} activity detected. Anomaly spread is {anomaly_spread:.2f}."
        
    return insight
