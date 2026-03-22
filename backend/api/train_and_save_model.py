import pandas as pd
import numpy as np
import joblib

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
choices = [3, 2, 1]  # Severe=3, Warning=2, Watch=1, Normal=0
df["risk"] = np.select(conditions, choices, default=0)

# =========================
# 7. TRAIN SIMPLE MODEL
# =========================
from sklearn.ensemble import RandomForestClassifier
features = df[["wind_kmh", "pressure"]]
target = df["risk"]
clf = RandomForestClassifier(n_estimators=50, random_state=42)
clf.fit(features, target)

# =========================
# 8. SAVE MODEL
# =========================
joblib.dump(clf, "model.pkl")
print("model.pkl saved.")
