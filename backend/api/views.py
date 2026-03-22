import pandas as pd
import numpy as np
from rest_framework.decorators import api_view
from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt
from .chatbot import chatbot_response, get_ocean_data, ODISHA_LOCATIONS
from datetime import datetime


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
                planned_location
            )
            return JsonResponse({"response": reply, "data": data})

        except Exception as e:
            print("Chatbot error:", e)
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"message": "Chatbot API running"})


# ============================================================
# ✅ NEW — LIVE WEATHER ENDPOINT
# Called by the frontend on chatbot open to populate the stats bar
# GET /api/weather/?location=puri
# ============================================================
@csrf_exempt
def weather_api(request):
    """
    Returns live ocean + weather data for a given Odisha coastal location.
    Used by the frontend stats bar on load and location change.
    """
    location_key = request.GET.get("location", "puri").lower().strip()

    # Validate location
    if location_key not in ODISHA_LOCATIONS:
        # Try matching by display name
        matched = None
        for key, val in ODISHA_LOCATIONS.items():
            if val["name"].lower() == location_key:
                matched = key
                break
        if matched:
            location_key = matched
        else:
            location_key = "puri"

    try:
        data = get_ocean_data(location_key)
        loc  = ODISHA_LOCATIONS[location_key]

        return JsonResponse({
            "location":          loc["name"],
            "temp":              data["temperature"],
            "wind":              data["wind"],
            "wind_direction":    data.get("wind_direction", 180),
            "wave":              data["wave"],
            "wave_forecast":     data["wave_forecast"],
            "rainfall":          data.get("rainfall", 0),
            "humidity":          data.get("humidity", "--"),
            "pressure":          data.get("pressure", "--"),
            "dissolved_oxygen":  data["dissolved_oxygen"],
            "ph":                data["ph"],
            "salinity":          data["salinity"],
            "is_forecast":       False,
            "risks": {
                "cyclone":    data["risks"]["cyclone"],
                "rain":       data["risks"]["rain"],
                "storm":      data["risks"]["storm"],
                "high_wave":  data["risks"]["high_wave"],
                "safe_score": data["risks"]["safe_score"],
            }
        })

    except Exception as e:
        print("Weather API error:", e)
        return JsonResponse({"error": str(e)}, status=500)


# ============================================================
# RISK MAP
# ============================================================
@api_view(["GET"])
def predict_risk(request):
    import os
    csv_path = os.path.join(os.path.dirname(__file__), "CMA_Best_Track_Data.csv")
    df = pd.read_csv(csv_path, low_memory=False)
    df = df.rename(columns={
        "Latitude": "lat",
        "Longitude": "lng",
        "Minimum Central Pressure": "pressure",
        "Maximum Wind Speed": "wind"
    })
    df = df[["lat", "lng", "pressure", "wind"]]
    df = df.dropna()
    df["lat"]      = pd.to_numeric(df["lat"],      errors="coerce")
    df["lng"]      = pd.to_numeric(df["lng"],      errors="coerce")
    df["pressure"] = pd.to_numeric(df["pressure"], errors="coerce")
    df["wind"]     = pd.to_numeric(df["wind"],     errors="coerce")
    df = df[(df["pressure"] > 800) & (df["pressure"] < 1100)]
    df = df[(df["wind"] > 0) & (df["wind"] < 150)]
    conditions = [
        (df["wind"] >= 90) & (df["pressure"] <= 980),
        (df["wind"] >= 60) & (df["pressure"] <= 995),
        (df["wind"] >= 50)
    ]
    choices = ["Severe", "Warning", "Watch"]
    df["risk"] = np.select(conditions, choices, default="Normal")
    df = df.sort_values(by="wind", ascending=False).head(200)
    result = df.to_dict(orient="records")
    return JsonResponse(result, safe=False)


import random
import requests as req_lib

from django.http import JsonResponse
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import (
    AlertSerializer,
    InsightsSerializer,
    SearchQuerySerializer,
    SearchResponseSerializer,
)
from .services import get_alerts, get_data_sources, get_insights, search_all

API_KEY = "296ab7ba52a70c301a17e68edfed1f65"


class SearchAPIView(APIView):
    def get(self, request):
        query_serializer = SearchQuerySerializer(data=request.query_params)
        query_serializer.is_valid(raise_exception=True)
        query = query_serializer.validated_data.get("query", "")
        payload = search_all(query)
        response_serializer = SearchResponseSerializer(data=payload)
        response_serializer.is_valid(raise_exception=True)
        return Response(response_serializer.data)


def get_weather(lat, lon):
    url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={API_KEY}&units=metric"
    try:
        response = req_lib.get(url, timeout=5)
        response.raise_for_status()
        data = response.json()
    except req_lib.RequestException:
        return None
    return {
        "temp":     data.get("main", {}).get("temp", 0),
        "humidity": data.get("main", {}).get("humidity", 0),
        "wind":     data.get("wind", {}).get("speed", 0),
    }


def calculate_risk(temp, wind, humidity):
    score = 0
    if wind > 10:      score += 2
    elif wind > 6:     score += 1
    if humidity > 85:  score += 2
    elif humidity > 70:score += 1
    if temp > 30 or temp < 10: score += 1
    if score >= 3: return "high"
    if score == 2: return "medium"
    return "low"


def get_risk_data(request):
    data = []
    coastal_points = [
        (19.0, 72.5), (19.2, 72.8), (13.0, 80.2), (12.8, 80.4),
        (19.8, 85.8), (20.5, 86.5), (21.0, 87.0),
        (34.0, -118.5), (40.0, -74.0),
        (51.0, -1.0),  (48.0, -4.0),
        (35.0, 139.0), (1.2,  103.5),
        (-33.0, 151.0),
    ]
    for lat, lon in coastal_points:
        weather = get_weather(lat, lon)
        if not weather:
            continue
        base_risk = calculate_risk(weather["temp"], weather["wind"], weather["humidity"])
        for _ in range(15):
            lat_offset = lat + random.uniform(-0.15, 0.15)
            lon_offset = lon + random.uniform(0.2, 0.5) if lon > 0 else lon - random.uniform(0.2, 0.5)
            rand = random.random()
            if base_risk == "low":
                risk = "low" if rand < 0.7 else ("medium" if rand < 0.9 else "high")
            elif base_risk == "medium":
                risk = "medium" if rand < 0.5 else ("low" if rand < 0.75 else "high")
            else:
                risk = "high" if rand < 0.6 else ("medium" if rand < 0.85 else "low")
            data.append({
                "lat": lat_offset, "lng": lon_offset, "risk": risk,
                "temp": weather["temp"], "wind": weather["wind"], "humidity": weather["humidity"],
            })
    return JsonResponse(data, safe=False)


class AlertsAPIView(APIView):
    def get(self, request):
        serializer = AlertSerializer(get_alerts(), many=True)
        return Response(serializer.data)


class InsightsAPIView(APIView):
    def get(self, request):
        serializer = InsightsSerializer(get_insights())
        return Response(serializer.data)


class DataSourcesAPIView(APIView):
    def get(self, request):
        return Response(get_data_sources())