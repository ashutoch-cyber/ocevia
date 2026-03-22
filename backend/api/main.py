import pandas as pd
import numpy as np

# =========================
# 1. LOAD DATA
# =========================
df = pd.read_csv("CMA_Best_Track_Data.csv", low_memory=False)

# =========================
# 2. RENAME COLUMNS
# =========================
df = df.rename(columns={
    "Time": "time",
    "Latitude": "lat",
    "Longitude": "lon",
    "Minimum Central Pressure": "pressure",
    "Maximum Wind Speed": "wind"
})

# =========================
# 3. SELECT REQUIRED COLUMNS
# =========================
df = df[["time", "lat", "lon", "pressure", "wind"]]

# =========================
# 4. CLEAN DATA
# =========================
df["time"] = pd.to_datetime(df["time"], errors="coerce")

df["lat"] = pd.to_numeric(df["lat"], errors="coerce")
df["lon"] = pd.to_numeric(df["lon"], errors="coerce")
df["pressure"] = pd.to_numeric(df["pressure"], errors="coerce")
df["wind"] = pd.to_numeric(df["wind"], errors="coerce")

df = df.dropna()

# Remove unrealistic values
df = df[(df["pressure"] > 800) & (df["pressure"] < 1100)]
df = df[(df["wind"] > 0) & (df["wind"] < 150)]

# =========================
# 5. FEATURE ENGINEERING
# =========================
df["wind_kmh"] = df["wind"]

# =========================
# 6. IMPROVED RISK LOGIC
# =========================
conditions = [
    (df["wind_kmh"] >= 90) & (df["pressure"] <= 980),   # Severe
    (df["wind_kmh"] >= 60) & (df["pressure"] <= 995),   # Warning
    (df["wind_kmh"] >= 50)                             # Watch
]

choices = ["Severe", "Warning", "Watch"]

df["risk"] = np.select(conditions, choices, default="Normal")

# Order risk levels (important for sorting)
df["risk"] = pd.Categorical(
    df["risk"],
    categories=["Normal", "Watch", "Warning", "Severe"],
    ordered=True
)

# =========================
# 7. DEBUG CHECK (IMPORTANT)
# =========================
print("\nRisk Distribution:\n", df["risk"].value_counts())

# =========================
# 8. FINAL OUTPUT
# =========================
final_df = df[["lat", "lon", "pressure", "wind_kmh", "risk"]]

# Round values (clean UI)
final_df = final_df.round({
    "lat": 3,
    "lon": 3,
    "pressure": 1,
    "wind_kmh": 1
})

# Remove duplicate locations
final_df = final_df.drop_duplicates(subset=["lat", "lon"])

# 🔥 IMPORTANT: pick impactful points (NOT tail)
final_df = final_df.sort_values(by="wind_kmh", ascending=False).head(500)

# =========================
# 9. CONVERT TO JSON
# =========================
output = final_df.to_dict(orient="records")

# =========================
# 10. PREVIEW
# =========================
print("\nSample Output:\n", output[:5])