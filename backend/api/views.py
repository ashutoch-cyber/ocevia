import os
import json
import random
import pandas as pd
import numpy as np
import requests as req_lib

from datetime import datetime

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView

# ✅ Import from chatbot — single clean import block
from .chatbot import chatbot_response, get_ocean_data, ODISHA_LOCATIONS

from .serializers import (
    AlertSerializer,
    InsightsSerializer,
    SearchQuerySerializer,
    SearchResponseSerializer,
)
from .services import get_alerts, get_data_sources, get_insights, search_all

# ============================================================
# CHATBOT API
# ============================================================
@csrf_exempt
def chatbot_api(request):
    if request.method == "POST":
        try:
            body = json.loads(request.body)
        except Exception:
            return JsonResponse({"error": "Invalid JSON"}, status=400)

        message          = body.get("message", "")
        history          = body.get("history", [])
        planned_datetime = body.get("planned_datetime")
        planned_activity = body.get("planned_activity")
        planned_location = body.get("planned_location")

        target_dt = None
        if planned_datetime:
            try:
                target_dt = datetime.fromisoformat(planned_datetime)
            except Exception:
                target_dt = None

        try:
            reply, data = chatbot_response(
                message,
                history,
                target_dt,
                planned_activity,
                planned_location,
            )
            return JsonResponse({"response": reply, "data": data})

        except Exception as e:
            print("Chatbot error:", e)
            import traceback
            traceback.print_exc()
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"message": "Chatbot API running"})


# ============================================================
# LIVE WEATHER ENDPOINT
# GET /api/weather/?location=puri
# ============================================================
@csrf_exempt
def weather_api(request):
    """
    Returns live ocean + weather data for a given Odisha coastal location.
    Used by the frontend stats bar on load and location change.
    """
    location_key = request.GET.get("location", "puri").lower().strip()

    # ✅ Handle "chilika lake" → "chilika" (spaces in URL become "chillikalake")
    location_key = location_key.replace(" ", "")

    # Map display names like "chillikalake" back to dict key "chilika"
    display_name_map = {
        v["name"].lower().replace(" ", ""): k
        for k, v in ODISHA_LOCATIONS.items()
    }

    if location_key not in ODISHA_LOCATIONS:
        # Try matching by cleaned display name
        matched = display_name_map.get(location_key)
        if matched:
            location_key = matched
        else:
            location_key = "puri"

    try:
        data = get_ocean_data(location_key)
        loc  = ODISHA_LOCATIONS[location_key]

        return JsonResponse({
            "location":         loc["name"],
            "temp":             data["temperature"],
            "wind":             data["wind"],
            "wind_direction":   data.get("wind_direction", 180),
            "wave":             data["wave"],
            "wave_forecast":    data["wave_forecast"],
            "rainfall":         data.get("rainfall", 0),
            "humidity":         data.get("humidity", "--"),
            "pressure":         data.get("pressure", "--"),
            "dissolved_oxygen": data["dissolved_oxygen"],
            "ph":               data["ph"],
            "salinity":         data["salinity"],
            "is_forecast":      False,
            "data_source":      data.get("data_source", "unknown"),
            "risks": {
                "cyclone":    data["risks"]["cyclone"],
                "rain":       data["risks"]["rain"],
                "storm":      data["risks"]["storm"],
                "high_wave":  data["risks"]["high_wave"],
                "safe_score": data["risks"]["safe_score"],
            },
        })

    except Exception as e:
        print("Weather API error:", e)
        import traceback
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=500)


# ============================================================
# RISK MAP
# ============================================================
@api_view(["GET"])
def predict_risk(request):
    csv_path = os.path.join(os.path.dirname(__file__), "CMA_Best_Track_Data.csv")
    df = pd.read_csv(csv_path, low_memory=False)
    df = df.rename(columns={
        "Latitude":                 "lat",
        "Longitude":                "lng",
        "Minimum Central Pressure": "pressure",
        "Maximum Wind Speed":       "wind",
    })
    df = df[["lat", "lng", "pressure", "wind"]].dropna()
    df["lat"]      = pd.to_numeric(df["lat"],      errors="coerce")
    df["lng"]      = pd.to_numeric(df["lng"],      errors="coerce")
    df["pressure"] = pd.to_numeric(df["pressure"], errors="coerce")
    df["wind"]     = pd.to_numeric(df["wind"],     errors="coerce")
    df = df[(df["pressure"] > 800) & (df["pressure"] < 1100)]
    df = df[(df["wind"] > 0)       & (df["wind"] < 150)]
    conditions = [
        (df["wind"] >= 90) & (df["pressure"] <= 980),
        (df["wind"] >= 60) & (df["pressure"] <= 995),
        (df["wind"] >= 50),
    ]
    choices    = ["Severe", "Warning", "Watch"]
    df["risk"] = np.select(conditions, choices, default="Normal")
    df         = df.sort_values(by="wind", ascending=False).head(200)
    return JsonResponse(df.to_dict(orient="records"), safe=False)


# ============================================================
# RISK DATA (map heatmap)
# ============================================================
WEATHER_API_KEY_VIEWS = "d00aab6fcf8331165f4cbd713205109a"


def _get_weather_for_map(lat, lon):
    url = (
        f"https://api.openweathermap.org/data/2.5/weather"
        f"?lat={lat}&lon={lon}&appid={WEATHER_API_KEY_VIEWS}&units=metric"
    )
    try:
        r = req_lib.get(url, timeout=5)
        r.raise_for_status()
        d = r.json()
        return {
            "temp":     d.get("main", {}).get("temp", 0),
            "humidity": d.get("main", {}).get("humidity", 0),
            "wind":     d.get("wind", {}).get("speed", 0),
        }
    except req_lib.RequestException:
        return None


def _calculate_risk_level(temp, wind, humidity):
    score = 0
    if wind > 10:           score += 2
    elif wind > 6:          score += 1
    if humidity > 85:       score += 2
    elif humidity > 70:     score += 1
    if temp > 30 or temp < 10: score += 1
    if score >= 3: return "high"
    if score == 2: return "medium"
    return "low"


def get_risk_data(request):
    coastal_points = [
        (19.0, 72.5), (19.2, 72.8), (13.0, 80.2), (12.8, 80.4),
        (19.8, 85.8), (20.5, 86.5), (21.0, 87.0),
        (34.0, -118.5), (40.0, -74.0),
        (51.0, -1.0),   (48.0, -4.0),
        (35.0, 139.0),  (1.2, 103.5),
        (-33.0, 151.0),
    ]
    data = []
    for lat, lon in coastal_points:
        weather = _get_weather_for_map(lat, lon)
        if not weather:
            continue
        base_risk = _calculate_risk_level(weather["temp"], weather["wind"], weather["humidity"])
        for _ in range(15):
            lat_off = lat + random.uniform(-0.15, 0.15)
            lon_off = lon + random.uniform(0.2, 0.5) if lon > 0 else lon - random.uniform(0.2, 0.5)
            rand    = random.random()
            if base_risk == "low":
                risk = "low"    if rand < 0.70 else ("medium" if rand < 0.90 else "high")
            elif base_risk == "medium":
                risk = "medium" if rand < 0.50 else ("low"    if rand < 0.75 else "high")
            else:
                risk = "high"   if rand < 0.60 else ("medium" if rand < 0.85 else "low")
            data.append({
                "lat": lat_off, "lng": lon_off, "risk": risk,
                "temp": weather["temp"], "wind": weather["wind"],
                "humidity": weather["humidity"],
            })
    return JsonResponse(data, safe=False)


# ============================================================
# REST API VIEWS
# ============================================================
class SearchAPIView(APIView):
    def get(self, request):
        qs = SearchQuerySerializer(data=request.query_params)
        qs.is_valid(raise_exception=True)
        payload = search_all(qs.validated_data.get("query", ""))
        rs = SearchResponseSerializer(data=payload)
        rs.is_valid(raise_exception=True)
        return Response(rs.data)


class AlertsAPIView(APIView):
    def get(self, request):
        return Response(AlertSerializer(get_alerts(), many=True).data)


class InsightsAPIView(APIView):
    def get(self, request):
        return Response(InsightsSerializer(get_insights()).data)


class DataSourcesAPIView(APIView):
    def get(self, request):
        return Response(get_data_sources())