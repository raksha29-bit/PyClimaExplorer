import streamlit as st
import os
import plotly.express as px
import utils.data_loader as dl
import utils.ai_explainer as explainer

st.set_page_config(page_title="PyClimaExplorer+", page_icon="🌍", layout="wide")

def main():
    # --- TOP CONTROL BAR ---
    st.title("🌍 PyClimaExplorer+: Command Center")
    st.markdown("Real-time multidimensional climate risk and anomaly detection system.")

    # --- INITIALIZE DATA ---
    if not dl.get_available_datasets():
        with st.spinner("Initializing Data Engine..."):
            dl.create_dummy_dataset("data/dummy_climate.nc")

    # --- LEFT PANEL (SLICE & DICE) ---
    st.sidebar.markdown("### 🎛️ Slice & Dice Filters")
    available_files = dl.get_available_datasets()
    selected_file = st.sidebar.selectbox("📂 Dataset", available_files)

    if selected_file:
        file_path = os.path.join("data", selected_file)
        ds = dl.load_climate_data(file_path)

        if ds is not None:
            variables = list(ds.data_vars.keys())
            selected_var = st.sidebar.selectbox("🌡️ Climate Variable", variables)

            times = ds.time.values
            time_strs = [str(t).split('T')[0] for t in times] 

            # --- TEMPORAL SLIDER (MAIN PANEL) ---
            st.markdown("### ⏱️ Temporal Exploration")
            selected_time_idx = st.select_slider(
                "Drag to explore climate shifts over time", 
                options=range(len(times)), 
                value=0,
                format_func=lambda x: time_strs[x]
            )
            selected_time = time_strs[selected_time_idx]

            # --- CENTER & RIGHT PANELS ---
            # 3:1 ratio gives the map much more breathing room
            col_map, col_insights = st.columns([3, 1.2]) 

            with col_map:
                st.markdown(f"**🗺️ Spatial Risk Heatmap ({selected_time})**")
                df_map = ds[selected_var].isel(time=selected_time_idx).to_dataframe().reset_index()
                
                fig_map = px.density_mapbox(
                    df_map, lat='lat', lon='lon', z=selected_var, radius=40,
                    center=dict(lat=20, lon=78), zoom=1.5,
                    mapbox_style="carto-positron",
                    color_continuous_scale="inferno" if selected_var == "Temperature" else "viridis",
                    opacity=0.8
                )
                fig_map.update_layout(margin={"r":0,"t":0,"l":0,"b":0})
                st.plotly_chart(fig_map, use_container_width=True)

            with col_insights:
                st.markdown("**📊 Regional Insights**")
                
                # Extract current slice for stats
                current_data_slice = ds[selected_var].isel(time=selected_time_idx)
                mean_val = float(current_data_slice.mean())
                max_val = float(current_data_slice.max())
                
                # Quick Stat Metrics
                col_m1, col_m2 = st.columns(2)
                col_m1.metric("Global Mean", f"{mean_val:.1f}")
                col_m2.metric("Peak Extreme", f"{max_val:.1f}")

                st.markdown("**📈 Temporal Trend**")
                df_trend = ds[selected_var].mean(dim=["lat", "lon"]).to_dataframe().reset_index()
                
                fig_trend = px.line(
                    df_trend, x='time', y=selected_var, 
                    markers=True
                )
                fig_trend.add_vline(x=times[selected_time_idx], line_width=2, line_dash="dash", line_color="red")
                fig_trend.update_layout(margin={"r":0,"t":10,"l":0,"b":0}, height=280)
                st.plotly_chart(fig_trend, use_container_width=True)

            # --- STORY MODE (AI EXPLAINER) ---
            st.markdown("---")
            st.markdown("### 🤖 Story Mode: AI Risk Analysis")
            with st.spinner("AI Agents calculating risk indicators..."):
                story_output = explainer.generate_climate_insight(
                    variable=selected_var, 
                    time_str=selected_time, 
                    data_slice=current_data_slice
                )
                st.info(story_output)

if __name__ == "__main__":
    main()
