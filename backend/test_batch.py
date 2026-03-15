import requests
lats = [0]*80
lons = [0]*80
lat_str = ",".join([str(x) for x in lats])
lon_str = ",".join([str(x) for x in lons])
url = f"https://archive-api.open-meteo.com/v1/archive?latitude={lat_str}&longitude={lon_str}&start_date=2023-01-01&end_date=2023-12-31&daily=temperature_2m_mean,precipitation_sum,wind_speed_10m_max&timezone=GMT"
res = requests.get(url)
print(res.json())
