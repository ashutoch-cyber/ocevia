import joblib
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os
import requests
from dotenv import load_dotenv
from rapidfuzz import process, fuzz

# ✅ NEW SDK — pip install google-genai
from google import genai

load_dotenv()

# ============================================================
# CONFIGURE GEMINI  ✅ FIXED: migrated to google-genai SDK
# ============================================================
_gemini_key = os.environ.get("GEMINI_API_KEY", "")
if not _gemini_key:
    print("⚠️  GEMINI_API_KEY not set in .env — Gemini responses disabled")
    gemini_client = None
else:
    gemini_client = genai.Client(api_key=_gemini_key)
    print("✅ Gemini client ready!")

# ============================================================
# LOAD ML MODELS
# ============================================================
MODEL_PATH = os.path.join(os.path.dirname(__file__), "openocean_model.pkl")
ocean_model = joblib.load(MODEL_PATH)
print("✅ Ocean ML model loaded!")

WAVE_MODEL_PATH = os.path.join(os.path.dirname(__file__), "ocean_model.pkl")
try:
    wave_model = joblib.load(WAVE_MODEL_PATH)
    print("✅ Wave forecasting model loaded!")
except Exception as e:
    wave_model = None
    print(f"⚠️  Wave model not found: {e}")

# ============================================================
# ODISHA LOCATIONS
# ============================================================
ODISHA_LOCATIONS = {
    "puri":          {"name": "Puri",              "lat": 19.8135, "lon": 85.8312, "buoy": 0},
    "konark":        {"name": "Konark",             "lat": 19.8876, "lon": 86.1045, "buoy": 1},
    "konarak":       {"name": "Konark",             "lat": 19.8876, "lon": 86.1045, "buoy": 1},
    "konarka":       {"name": "Konark",             "lat": 19.8876, "lon": 86.1045, "buoy": 1},
    "paradip":       {"name": "Paradip",            "lat": 20.3165, "lon": 86.6117, "buoy": 2},
    "paradwip":      {"name": "Paradip",            "lat": 20.3165, "lon": 86.6117, "buoy": 2},
    "gopalpur":      {"name": "Gopalpur",           "lat": 19.2628, "lon": 84.9062, "buoy": 3},
    "gopalur":       {"name": "Gopalpur",           "lat": 19.2628, "lon": 84.9062, "buoy": 3},
    "chandipur":     {"name": "Chandipur",          "lat": 21.4580, "lon": 87.0228, "buoy": 4},
    "balasore":      {"name": "Balasore",           "lat": 21.4942, "lon": 86.9317, "buoy": 5},
    "baleswar":      {"name": "Balasore",           "lat": 21.4942, "lon": 86.9317, "buoy": 5},
    "baleshwar":     {"name": "Balasore",           "lat": 21.4942, "lon": 86.9317, "buoy": 5},
    "bhadrak":       {"name": "Bhadrak",            "lat": 21.0583, "lon": 86.5161, "buoy": 6},
    "kendrapara":    {"name": "Kendrapara",         "lat": 20.5022, "lon": 86.4239, "buoy": 7},
    "jagatsinghpur": {"name": "Jagatsinghpur",      "lat": 20.2588, "lon": 86.1695, "buoy": 8},
    "ganjam":        {"name": "Ganjam",             "lat": 19.3833, "lon": 85.0500, "buoy": 9},
    "berhampur":     {"name": "Berhampur",          "lat": 19.3149, "lon": 84.7941, "buoy": 10},
    "berhamur":      {"name": "Berhampur",          "lat": 19.3149, "lon": 84.7941, "buoy": 10},
    "brahmapur":     {"name": "Berhampur",          "lat": 19.3149, "lon": 84.7941, "buoy": 10},
    "chilika":       {"name": "Chilika Lake",       "lat": 19.7139, "lon": 85.3183, "buoy": 11},
    "chilka":        {"name": "Chilika Lake",       "lat": 19.7139, "lon": 85.3183, "buoy": 11},
    "chillika":      {"name": "Chilika Lake",       "lat": 19.7139, "lon": 85.3183, "buoy": 11},
    "chilkha":       {"name": "Chilika Lake",       "lat": 19.7139, "lon": 85.3183, "buoy": 11},
    "rushikulya":    {"name": "Rushikulya",         "lat": 19.4000, "lon": 84.9833, "buoy": 12},
    "dhamra":        {"name": "Dhamra",             "lat": 20.8833, "lon": 86.9000, "buoy": 13},
    "pentha":        {"name": "Pentha",             "lat": 20.3000, "lon": 86.7000, "buoy": 14},
    "astaranga":     {"name": "Astaranga",          "lat": 19.7833, "lon": 86.0000, "buoy": 15},
    "satpada":       {"name": "Satpada",            "lat": 19.6167, "lon": 85.4833, "buoy": 16},
    "tampara":       {"name": "Tampara",            "lat": 19.4667, "lon": 84.9667, "buoy": 17},
    "bahuda":        {"name": "Bahuda",             "lat": 19.0833, "lon": 84.7667, "buoy": 18},
    "palur":         {"name": "Palur",              "lat": 19.1167, "lon": 84.8167, "buoy": 19},
    "nuagarh":       {"name": "Nuagarh",            "lat": 19.5000, "lon": 85.0000, "buoy": 20},
    "arjyapalli":    {"name": "Arjyapalli",         "lat": 19.2000, "lon": 84.8500, "buoy": 21},
    "podampeta":     {"name": "Podampeta",          "lat": 19.1500, "lon": 84.8000, "buoy": 22},
    "ramayapatna":   {"name": "Ramayapatna",        "lat": 19.3000, "lon": 84.9000, "buoy": 23},
    "sonapur":       {"name": "Sonapur",            "lat": 19.8833, "lon": 85.9167, "buoy": 24},
    "markandi":      {"name": "Markandi",           "lat": 19.7000, "lon": 85.7000, "buoy": 25},
    "bagapatia":     {"name": "Bagapatia",          "lat": 20.1000, "lon": 86.5000, "buoy": 26},
    "mahanadi":      {"name": "Mahanadi mouth",     "lat": 20.2833, "lon": 86.7167, "buoy": 27},
    "brahmani":      {"name": "Brahmani mouth",     "lat": 20.7667, "lon": 86.8333, "buoy": 28},
    "baitarani":     {"name": "Baitarani mouth",    "lat": 20.8167, "lon": 86.9000, "buoy": 29},
    "subarnarekha":  {"name": "Subarnarekha mouth", "lat": 21.5667, "lon": 87.3333, "buoy": 30},
}

# ============================================================
# WEATHER API  ✅ FIXED: added detailed error logging
# ============================================================
WEATHER_API_KEY = os.environ.get("WEATHER_API_KEY", "")

if not WEATHER_API_KEY:
    print("⚠️  WEATHER_API_KEY not set in .env — will use ML predictions only")
else:
    print(f"✅ OpenWeather API key loaded: {WEATHER_API_KEY[:6]}...")


def get_live_weather(lat, lon):
    """
    Fetch live weather from OpenWeatherMap.
    Returns None if API key missing, key invalid, or network error.
    """
    if not WEATHER_API_KEY:
        print("📴 No WEATHER_API_KEY — skipping live weather fetch")
        return None

    try:
        url    = "https://api.openweathermap.org/data/2.5/weather"
        params = {
            "lat":   lat,
            "lon":   lon,
            "appid": WEATHER_API_KEY,
            "units": "metric",
        }
        r    = requests.get(url, params=params, timeout=8)
        data = r.json()

        # ✅ Catch API-level errors (wrong key, quota, etc.)
        if r.status_code != 200:
            print(f"❌ OpenWeather error {r.status_code}: {data.get('message', 'unknown error')}")
            print(f"   → Check your WEATHER_API_KEY in .env")
            return None

        # ✅ Catch malformed response
        if "main" not in data:
            print(f"❌ OpenWeather unexpected response: {data}")
            return None

        return {
            "temperature":    round(data["main"]["temp"], 1),
            "wind":           round(data["wind"]["speed"] * 3.6, 1),
            "wind_direction": data["wind"].get("deg", 180),
            "rain":           data.get("rain", {}).get("1h", 0),
            "humidity":       data["main"].get("humidity", 70),
            "pressure":       data["main"].get("pressure", 1013),
            "clouds":         data.get("clouds", {}).get("all", 50),
        }

    except requests.exceptions.Timeout:
        print("❌ OpenWeather request timed out")
        return None
    except requests.exceptions.ConnectionError:
        print("❌ No internet connection — OpenWeather unreachable")
        return None
    except Exception as e:
        print(f"❌ OpenWeather fetch failed: {e}")
        return None


def get_forecast_weather(lat, lon, target_datetime):
    """
    Fetch forecast weather from OpenWeatherMap for a future datetime.
    """
    if not WEATHER_API_KEY:
        print("📴 No WEATHER_API_KEY — skipping forecast fetch")
        return None

    try:
        url    = "https://api.openweathermap.org/data/2.5/forecast"
        params = {
            "lat":   lat,
            "lon":   lon,
            "appid": WEATHER_API_KEY,
            "units": "metric",
        }
        r    = requests.get(url, params=params, timeout=8)
        data = r.json()

        if r.status_code != 200:
            print(f"❌ OpenWeather forecast error {r.status_code}: {data.get('message', '')}")
            return None

        forecasts = data.get("list", [])
        closest   = None
        min_diff  = float("inf")

        for f in forecasts:
            ft   = datetime.fromtimestamp(f["dt"])
            diff = abs((ft - target_datetime).total_seconds())
            if diff < min_diff:
                min_diff = diff
                closest  = f

        if closest:
            return {
                "temperature":    round(closest["main"]["temp"], 1),
                "wind":           round(closest["wind"]["speed"] * 3.6, 1),
                "wind_direction": closest["wind"].get("deg", 180),
                "rain":           closest.get("rain", {}).get("3h", 0),
                "humidity":       closest["main"].get("humidity", 70),
                "pressure":       closest["main"].get("pressure", 1013),
                "clouds":         closest.get("clouds", {}).get("all", 50),
            }
        return None

    except Exception as e:
        print(f"❌ Forecast fetch failed: {e}")
        return None


# ============================================================
# RISK PERCENTAGES
# ============================================================
def calculate_risk_percentages(weather_data):
    wind     = weather_data.get("wind", 10)
    rain     = weather_data.get("rain", 0)
    pressure = weather_data.get("pressure", 1013)
    humidity = weather_data.get("humidity", 70)
    clouds   = weather_data.get("clouds", 50)
    wave     = weather_data.get("wave", 1.5)
    wave_f   = weather_data.get("wave_forecast", wave)

    cyclone_risk = 0
    if pressure < 1000: cyclone_risk += 30
    if pressure < 990:  cyclone_risk += 20
    if wind > 30:       cyclone_risk += 25
    if wind > 50:       cyclone_risk += 25
    if humidity > 85:   cyclone_risk += 10
    if rain > 10:       cyclone_risk += 10
    cyclone_risk = min(cyclone_risk, 100)

    rain_risk = 0
    if clouds > 70:     rain_risk += 30
    if humidity > 80:   rain_risk += 20
    if rain > 0:        rain_risk += 30
    if rain > 5:        rain_risk += 20
    if pressure < 1005: rain_risk += 10
    rain_risk = min(rain_risk, 100)

    storm_risk = 0
    if wind > 20:       storm_risk += 20
    if wind > 35:       storm_risk += 30
    if pressure < 1005: storm_risk += 20
    if rain > 5:        storm_risk += 20
    if clouds > 80:     storm_risk += 10
    storm_risk = min(storm_risk, 100)

    wave_risk = 0
    if wave > 1.5:      wave_risk += 20
    if wave > 2.5:      wave_risk += 30
    if wave_f > wave:   wave_risk += 20
    if wind > 15:       wave_risk += 20
    if wind > 25:       wave_risk += 10
    wave_risk = min(wave_risk, 100)

    safe_score = max(0, 100 - (
        cyclone_risk * 0.4 +
        storm_risk   * 0.3 +
        wave_risk    * 0.2 +
        rain_risk    * 0.1
    ))

    return {
        "cyclone":    cyclone_risk,
        "rain":       rain_risk,
        "storm":      storm_risk,
        "high_wave":  wave_risk,
        "safe_score": round(safe_score),
    }


# ============================================================
# ML TEMPERATURE PREDICTION
# ============================================================
def get_ml_prediction(lat, lon, buoy_enc,
                       target_hour=None, target_month=None,
                       salinity=33.0, ph=8.1,
                       dissolved_oxygen=6.2, turbidity=2.1,
                       chlorophyll=1.5, wave_height=1.2):
    now         = datetime.utcnow()
    hour        = target_hour  if target_hour  is not None else now.hour
    month       = target_month if target_month is not None else now.month
    day_of_week = now.weekday()
    year        = now.year

    sample = pd.DataFrame([{
        "latitude":         lat,
        "longitude":        lon,
        "salinity":         salinity,
        "ph":               ph,
        "dissolved_oxygen": dissolved_oxygen,
        "turbidity":        turbidity,
        "chlorophyll":      chlorophyll,
        "wave_height":      wave_height,
        "hour_sin":         np.sin(2 * np.pi * hour  / 24),
        "hour_cos":         np.cos(2 * np.pi * hour  / 24),
        "month_sin":        np.sin(2 * np.pi * month / 12),
        "month_cos":        np.cos(2 * np.pi * month / 12),
        "day_of_week":      day_of_week,
        "year":             year,
        "buoy_id_enc":      buoy_enc,
    }])

    temp = round(float(ocean_model.predict(sample)[0]), 1)
    if temp < 20 or temp > 40:
        temp = 28.5
    return temp


# ============================================================
# WAVE FORECAST
# ============================================================
def get_wave_forecast(current_wave, wind_speed, wind_direction=180, rainfall=0):
    if wave_model is None:
        return current_wave
    try:
        features = pd.DataFrame([{
            "wind_speed":     wind_speed,
            "wind_direction": wind_direction,
            "rainfall":       rainfall,
            "wave_height":    current_wave,
            "wave_lag1":      round(current_wave * 0.98, 2),
            "wave_lag2":      round(current_wave * 0.96, 2),
            "wave_lag3":      round(current_wave * 0.94, 2),
        }])
        predicted = float(wave_model.predict(features)[0])
        return max(0.1, round(predicted, 2))
    except Exception as e:
        print(f"⚠️  Wave forecast error: {e}")
        return current_wave


# ============================================================
# OCEAN DATA
# ============================================================
def get_ocean_data(location_key="puri", target_datetime=None):
    loc = ODISHA_LOCATIONS.get(location_key, ODISHA_LOCATIONS["puri"])

    # ── Try live / forecast weather ──
    if target_datetime and target_datetime > datetime.now():
        live        = get_forecast_weather(loc["lat"], loc["lon"], target_datetime)
        is_forecast = True
    else:
        live        = get_live_weather(loc["lat"], loc["lon"])
        is_forecast = False

    if live:
        temp           = live["temperature"]
        wind           = live["wind"]
        wind_direction = live.get("wind_direction", 180)
        rainfall       = live.get("rain", 0)
        humidity       = live.get("humidity", 70)
        pressure       = live.get("pressure", 1013)
        clouds         = live.get("clouds", 50)
        source         = "Forecast" if is_forecast else "Live"
        print(f"✅ {source} weather for {loc['name']}: {temp}°C, wind {wind} km/h")
    else:
        # ── Fallback to ML prediction ──
        print(f"📴 Offline — using ML prediction for {loc['name']}")
        target_hour  = target_datetime.hour  if target_datetime else None
        target_month = target_datetime.month if target_datetime else None
        temp           = get_ml_prediction(
            loc["lat"], loc["lon"], loc["buoy"],
            target_hour, target_month
        )
        wind           = 10.0
        wind_direction = 180
        rainfall       = 0.0
        humidity       = 70
        pressure       = 1013
        clouds         = 50

    current_wave  = 1.5
    wave_forecast = get_wave_forecast(current_wave, wind, wind_direction, rainfall)

    data = {
        "temperature":      temp,
        "wind":             wind,
        "wind_direction":   wind_direction,
        "rainfall":         rainfall,
        "humidity":         humidity,
        "pressure":         pressure,
        "clouds":           clouds,
        "wave":             current_wave,
        "wave_forecast":    wave_forecast,
        "dissolved_oxygen": 6.2,
        "ph":               8.1,
        "salinity":         33.0,
        "is_forecast":      is_forecast,
        "data_source":      "live" if live else "ml_prediction",
    }
    data["risks"] = calculate_risk_percentages(data)
    return data


# ============================================================
# SAFETY PREDICTION
# ============================================================
def get_fishing_prediction(location, temp, wave, wind, do, ph, salinity):
    if wave > 3 or wind > 15: return "risky"
    if do < 4:                return "risky"
    if ph < 7 or ph > 9:     return "risky"
    if temp > 33:             return "risky"
    return "safe"


def fix_risk_score(prediction, risks, full_data):
    if prediction == "risky" and risks.get("safe_score", 100) > 60:
        risks["safe_score"]  = max(15, risks["safe_score"] - 55)
        full_data["risks"]   = risks
    return risks, full_data


# ============================================================
# SKIP WORDS
# ============================================================
SKIP_WORDS = {
    "temp", "wind", "wave", "rain", "fish", "swim",
    "boat", "sail", "yes", "no", "ok", "okay", "sure",
    "safe", "today", "tomorrow", "morning", "evening",
    "night", "now", "weather", "storm", "sea", "ocean",
    "check", "show", "tell", "give", "what", "how",
    "when", "where", "help", "please", "thanks", "good",
    "bad", "nice", "hot", "cold", "warm", "cool",
    "temperature", "tempreture", "temparature", "temperate",
    "forecast", "condition", "conditions", "current",
    "fishing", "swimming", "boating", "sailing", "safety",
    "cyclone", "tsunami", "flood", "danger", "warning",
    "oxygen", "salinity", "pollution", "quality", "clean",
    "is", "it", "to", "go", "are", "the", "for", "at",
    "in", "of", "a", "an", "and", "or", "but", "not",
    "do", "did", "can", "will", "should", "would", "could",
}


# ============================================================
# LOCATION DETECTION
# ============================================================
def detect_location(msg):
    msg_lower    = msg.lower().strip()
    words_in_msg = msg_lower.split()

    if msg_lower in SKIP_WORDS:
        return None, None
    if all(w in SKIP_WORDS for w in words_in_msg):
        return None, None

    for key in ODISHA_LOCATIONS:
        if len(key) >= 5:
            if (msg_lower.strip() == key or
                    msg_lower.startswith(key + " ") or
                    msg_lower.endswith(" " + key) or
                    f" {key} " in msg_lower):
                return key, ODISHA_LOCATIONS[key]["name"]

    for key in ODISHA_LOCATIONS:
        if len(key) < 5 and key in words_in_msg:
            return key, ODISHA_LOCATIONS[key]["name"]

    location_keys = list(ODISHA_LOCATIONS.keys())
    best_key      = None
    best_score    = 0

    for word in words_in_msg:
        if len(word) < 5 or word in SKIP_WORDS:
            continue
        result = process.extractOne(word, location_keys, scorer=fuzz.ratio, score_cutoff=78)
        if result and result[1] > best_score:
            best_score = result[1]
            best_key   = result[0]

    if best_key:
        return best_key, ODISHA_LOCATIONS[best_key]["name"]

    non_skip = [w for w in words_in_msg if w not in SKIP_WORDS]
    if non_skip:
        result = process.extractOne(msg_lower, location_keys, scorer=fuzz.partial_ratio, score_cutoff=78)
        if result:
            return result[0], ODISHA_LOCATIONS[result[0]]["name"]

    location_names = {v["name"].lower(): k for k, v in ODISHA_LOCATIONS.items()}
    for name, key in location_names.items():
        if fuzz.partial_ratio(msg_lower, name) > 82:
            return key, ODISHA_LOCATIONS[key]["name"]

    return None, None


def get_last_location_from_history(history):
    for h in reversed(history):
        text = h.get("text", "").lower()
        if text.strip() in SKIP_WORDS:
            continue
        lk, ln = detect_location(text)
        if lk:
            return lk, ln
    return None, None


def get_last_bot_message(history):
    for h in reversed(history):
        if h.get("sender") == "bot":
            return h.get("text", "").lower()
    return ""


def detect_followup_context(last_bot_msg):
    planning_phrases = [
        "specific date", "specific time", "plan for", "check another time",
        "different time", "safer time", "want to plan", "date and time",
        "use the plan", "plan trip", "check a different time", "what date",
        "what time", "when are you",
    ]
    location_phrases = [
        "nearby location", "safer location", "different location",
        "another location", "which location", "where are you",
        "check a nearby", "check another location",
    ]
    activity_phrases = [
        "what activity", "fishing or swimming", "what are you planning",
        "going for fishing", "going for swimming", "what would you like to do",
    ]
    other_help_phrases = [
        "anything else", "other help", "can i help",
        "what else", "more information", "help you with",
    ]
    if any(p in last_bot_msg for p in planning_phrases):   return "planning"
    if any(p in last_bot_msg for p in location_phrases):   return "location"
    if any(p in last_bot_msg for p in activity_phrases):   return "activity"
    if any(p in last_bot_msg for p in other_help_phrases): return "other"
    return "general"


# ============================================================
# DATE / TIME EXTRACTION
# ============================================================
def extract_datetime_from_msg(msg):
    import re
    msg_lower = msg.lower()
    now       = datetime.now()

    if   "tomorrow" in msg_lower or "kal"     in msg_lower: base_date = now + timedelta(days=1)
    elif "day after" in msg_lower or "parso"  in msg_lower: base_date = now + timedelta(days=2)
    elif "monday"    in msg_lower: base_date = now + timedelta(days=(0 - now.weekday()) % 7 or 7)
    elif "tuesday"   in msg_lower: base_date = now + timedelta(days=(1 - now.weekday()) % 7 or 7)
    elif "wednesday" in msg_lower: base_date = now + timedelta(days=(2 - now.weekday()) % 7 or 7)
    elif "thursday"  in msg_lower: base_date = now + timedelta(days=(3 - now.weekday()) % 7 or 7)
    elif "friday"    in msg_lower: base_date = now + timedelta(days=(4 - now.weekday()) % 7 or 7)
    elif "saturday"  in msg_lower: base_date = now + timedelta(days=(5 - now.weekday()) % 7 or 7)
    elif "sunday"    in msg_lower: base_date = now + timedelta(days=(6 - now.weekday()) % 7 or 7)
    else:                          base_date = now

    hour = None
    if   "morning"   in msg_lower or "subah"   in msg_lower: hour = 6
    elif "afternoon" in msg_lower or "dopahar" in msg_lower: hour = 14
    elif "evening"   in msg_lower or "shaam"   in msg_lower: hour = 17
    elif "night"     in msg_lower or "raat"    in msg_lower: hour = 20
    elif "dawn"      in msg_lower or "early"   in msg_lower: hour = 5
    else:
        am_pm = re.search(r"(\d{1,2})\s*(am|pm)", msg_lower)
        if am_pm:
            h = int(am_pm.group(1))
            if am_pm.group(2) == "pm" and h != 12: h += 12
            elif am_pm.group(2) == "am" and h == 12: h = 0
            hour = h
        time_24 = re.search(r"(\d{1,2}):(\d{2})", msg_lower)
        if time_24:
            hour = int(time_24.group(1))

    target = base_date.replace(hour=hour, minute=0, second=0, microsecond=0) if hour is not None else base_date
    return target if target > now else None


# ============================================================
# KEYWORDS
# ============================================================
LOCATION_NEEDED_KEYWORDS = [
    "fish", "fishing", "catch", "swim", "swimming",
    "bath", "bathe", "boat", "sail", "wave", "wind",
    "temp", "temperature", "condition", "safe", "today",
    "weather", "status", "pollution", "oxygen", "quality",
    "cyclone", "storm", "rain", "forecast",
]

CONFIRMATION_WORDS = {
    "yes", "ok", "okay", "sure", "yeah", "yep", "yup",
    "haan", "ha", "ji", "theek", "thik", "accha", "acha",
}

NEGATIVE_WORDS = {
    "no", "nope", "nahi", "na", "nah", "not really",
    "no thanks", "that's all", "thats all", "nothing",
    "no need", "i'm good", "im good", "all good",
}


def needs_location(msg):
    msg_lower    = msg.lower()
    has_keyword  = any(w in msg_lower for w in LOCATION_NEEDED_KEYWORDS)
    has_location = any(key in msg_lower for key in ODISHA_LOCATIONS)
    return has_keyword and not has_location


# ============================================================
# SAFETY HELPERS
# ============================================================
def get_safety_emoji(status):
    if status == "safe":  return "✅"
    if status == "risky": return "⚠️"
    return "❓"


def format_fishing_response(location_name, data, prediction, target_dt=None):
    emoji         = get_safety_emoji(prediction)
    temp          = data["temperature"]
    wave          = data["wave"]
    wind          = data["wind"]
    do            = data["dissolved_oxygen"]
    wave_forecast = data.get("wave_forecast", wave)
    rainfall      = data.get("rainfall", 0)
    time_str      = f" on {target_dt.strftime('%d %b at %I:%M %p')}" if target_dt else " today"

    if prediction == "safe":
        rain_note = "🌧️ Light rain possible. " if rainfall > 0.5 else ""
        return (
            f"{emoji} Fishing in {location_name}{time_str} looks safe! "
            f"Waves are at {wave}m heading to {wave_forecast}m in 3 hours, "
            f"wind is {wind} km/h and temperature is a comfortable {temp}°C. "
            f"{rain_note}"
            f"Oxygen levels at {do} mg/L are healthy for marine life too. 🎣\n\n"
            f"Would you like to check a different time or location?"
        )
    else:
        reasons = []
        if wave > 3:  reasons.append(f"waves are too high at {wave}m")
        if wind > 15: reasons.append(f"wind is strong at {wind} km/h")
        if do < 4:    reasons.append(f"oxygen is low at {do} mg/L")
        if temp > 33: reasons.append(f"temperature is high at {temp}°C")
        reason_text = " and ".join(reasons) if reasons else "rough conditions"
        return (
            f"{emoji} Fishing in {location_name}{time_str} is risky because {reason_text}. "
            f"Waves are forecast to reach {wave_forecast}m — "
            f"we strongly recommend staying on shore. ⛔\n\n"
            f"Want me to check a safer time or nearby location?"
        )


def format_wave_response(location_name, data):
    wave          = data["wave"]
    wave_forecast = data.get("wave_forecast", wave)
    if wave <= 1:   desc = "very calm 😊"
    elif wave <= 2: desc = "moderate — manageable"
    elif wave <= 3: desc = "rough — be cautious ⚠️"
    else:           desc = "very rough — dangerous! ⛔"
    return (
        f"🌊 Waves in {location_name} are currently at {wave}m — {desc}. "
        f"Our ML model forecasts them reaching {wave_forecast}m in the next 3 hours.\n\n"
        f"{'Great conditions to head out! 🎣' if wave <= 2 else '⛔ Best to stay on shore today.'}\n\n"
        f"Want to check waves for a specific date and time?"
    )


def format_wind_response(location_name, wind):
    if wind <= 10:   desc = "calm and gentle 😊"
    elif wind <= 15: desc = "moderate — manageable"
    elif wind <= 25: desc = "strong — be cautious ⚠️"
    else:            desc = "very strong — dangerous! ⛔"
    return (
        f"💨 Wind in {location_name} is currently {wind} km/h — {desc}.\n\n"
        f"Want to check wind forecast for a specific time?"
    )


def format_temp_response(location_name, temp):
    if temp <= 25:   desc = "cool and comfortable 😊"
    elif temp <= 30: desc = "warm — stay hydrated"
    elif temp <= 33: desc = "hot — carry water"
    else:            desc = "very hot — anomaly detected! ⚠️"
    return (
        f"🌡️ Temperature in {location_name} is {temp}°C — {desc}.\n\n"
        f"Want to check conditions for a specific time?"
    )


def format_water_quality_response(location_name, data):
    do  = data["dissolved_oxygen"]
    ph  = data["ph"]
    sal = data["salinity"]
    warnings = []
    if do < 4:                warnings.append("low dissolved oxygen")
    if ph < 7 or ph > 9:     warnings.append(f"abnormal pH at {ph}")
    if sal < 30 or sal > 40: warnings.append(f"unusual salinity at {sal} ppt")
    warning_text = f"⚠️ Concerns: {', '.join(warnings)}" if warnings else "All parameters healthy ✅"
    return (
        f"🔬 Water quality in {location_name} — "
        f"dissolved oxygen at {do} mg/L, pH at {ph}, salinity at {sal} ppt. "
        f"{warning_text}\n\n"
        f"Want to check a specific location or time?"
    )


# ============================================================
# GEMINI AI  ✅ FIXED: uses google-genai SDK correctly
# ============================================================
def ask_gemini(msg, ocean_data, history=None):
    if history is None:
        history = []

    # ✅ If no Gemini client, skip gracefully
    if gemini_client is None:
        print("⚠️  Gemini client not available — skipping AI response")
        return None

    history_text = ""
    for h in history[-4:]:
        role          = "User" if h["sender"] == "user" else "Neer"
        history_text += f"{role}: {h['text']}\n"

    wave_forecast = ocean_data.get("wave_forecast", ocean_data["wave"])
    rainfall      = ocean_data.get("rainfall", 0)
    risks         = ocean_data.get("risks", {})
    is_forecast   = ocean_data.get("is_forecast", False)
    rain_status   = f"{rainfall}mm (rain expected)" if rainfall > 0.5 else "No rain expected"
    time_note     = "(FORECAST for requested time)" if is_forecast else "(LIVE data)"

    prompt = f"""SYSTEM: You are mid-conversation. Answer directly. Never greet.

You are Neer Ocevia, an expert ocean safety assistant for
fishermen and coastal workers in Odisha, India. You give
rich conversational responses like ChatGPT but focused on
ocean safety. You speak like a warm knowledgeable local friend.

CURRENT OCEAN DATA {time_note} for {ocean_data['location']}:
Temperature:   {ocean_data['temp']}°C
Waves now:     {ocean_data['wave']}m
Wave forecast: {wave_forecast}m (3 hours ahead)
Wind speed:    {ocean_data['wind']} km/h
Rainfall:      {rain_status}
Humidity:      {ocean_data.get('humidity', '--')}%
Pressure:      {ocean_data.get('pressure', '--')} hPa
Dissolved O2:  {ocean_data['dissolved_oxygen']} mg/L
pH Level:      {ocean_data['ph']}
Salinity:      {ocean_data['salinity']} ppt

RISK LEVELS:
Cyclone risk:   {risks.get('cyclone', 0)}%
Rain risk:      {risks.get('rain', 0)}%
Storm risk:     {risks.get('storm', 0)}%
High wave risk: {risks.get('high_wave', 0)}%
Safe score:     {risks.get('safe_score', 100)}%

CONVERSATION HISTORY:
{history_text if history_text else "Start of conversation"}

USER SAYS: "{msg}"

HOW TO RESPOND:
1. Give rich warm conversational response like a knowledgeable friend
2. Explain WHY conditions are safe or risky in simple human language
3. Weave data naturally into sentences — NEVER use bullet points
4. Always end with ONE relevant follow up question
5. Detect language (English/Hindi/Odia) — reply in SAME language
6. Understand indirect questions and short replies naturally
7. Show confidence percentage naturally: "about 85% safe"
8. Mention wave forecast naturally when relevant
9. If rain or cyclone risk high — proactively warn
10. Be warm, encouraging and caring
11. Max 5-6 sentences — concise but rich
12. Use 1-2 relevant emojis naturally

ABSOLUTE RULES:
- NEVER start with Hello Hi Hey Namaste or any greeting
- NEVER introduce yourself
- NEVER say "Based on the data" or "According to conditions"
- NEVER use bullet points — write in natural flowing sentences
- ALWAYS end with exactly ONE follow up question
- ALWAYS mention the location name naturally
- START directly with the answer"""

    try:
        # ✅ FIXED: use google-genai client.models.generate_content
        response = gemini_client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
        )
        text = response.text.strip()
        text = text.replace("**", "").replace("*", "").replace("`", "").replace("#", "")

        text_lower = text.lower()
        bad_starts = [
            "hello", "hi ", "hi!", "hey ", "namaste", "welcome",
            "i am neer", "i'm neer", "neer ocevia", "as neer",
            "i'm an ai", "i am an ai", "how can i help", "how may i",
            "i'd be happy", "i would be happy", "great question",
            "certainly", "of course", "sure!", "sure,", "absolutely",
            "based on", "according to",
        ]
        first_word = text_lower.split()[0] if text_lower.split() else ""
        if first_word in {"hello", "hi", "hey", "namaste", "welcome",
                          "greetings", "certainly", "sure", "absolutely", "of"}:
            return None
        if any(bad in text_lower for bad in bad_starts):
            return None
        return text if len(text) > 10 else None

    except Exception as e:
        print(f"Gemini error: {e}")
        return None


# ============================================================
# MAIN CHATBOT FUNCTION
# ============================================================
def chatbot_response(msg, history=None,
                     planned_datetime=None,
                     planned_activity=None,
                     planned_location=None):
    if history is None:
        history = []

    msg_clean        = msg.lower().strip()
    last_bot_msg     = get_last_bot_message(history)
    followup_context = detect_followup_context(last_bot_msg)

    # ── NEGATIVE ──
    if msg_clean in NEGATIVE_WORDS or msg_clean in {"no", "nope", "nahi", "na"}:
        return (
            "No problem! 😊 I'm here whenever you need ocean conditions, "
            "fishing safety, wave forecasts or trip planning for Odisha.\n\n"
            "Just ask me anything — what else can I help you with?"
        ), {
            "location": "Odisha", "temp": "--", "wind": "--",
            "wave": "--", "dissolved_oxygen": "--",
            "ph": "--", "salinity": "--", "risks": {},
        }

    # ── CONFIRMATION ──
    if msg_clean in CONFIRMATION_WORDS:
        hist_key, hist_name = get_last_location_from_history(history)
        loc_name = hist_name if hist_name else "Puri"

        if followup_context == "planning":
            return (
                f"📅 Great! Use the Plan Trip button at the top right to pick "
                f"your date, time, location and activity.\n\n"
                f"Or just tell me directly — for example:\n"
                f"'Fishing in {loc_name} tomorrow morning'\n"
                f"'Swimming at Chilika on Friday at 6am'\n\n"
                f"__OPEN_PLANNER__"
            ), {
                "location": loc_name, "temp": "--", "wind": "--",
                "wave": "--", "dissolved_oxygen": "--",
                "ph": "--", "salinity": "--", "risks": {},
                "open_planner": True,
            }

        elif followup_context == "location":
            return (
                "📍 Which location in Odisha would you like to check? "
                "We cover all coastal areas — Puri, Chilika, Paradip, Gopalpur, "
                "Chandipur and many more. Just tell me the location! 🌊"
            ), {
                "location": "Odisha", "temp": "--", "wind": "--",
                "wave": "--", "dissolved_oxygen": "--",
                "ph": "--", "salinity": "--", "risks": {},
            }

        elif followup_context == "activity":
            return (
                "🎯 What activity are you planning?\n"
                "🎣 Fishing conditions\n"
                "🏊 Swimming safety\n"
                "⛵ Boat and sailing conditions\n"
                "🌊 General ocean conditions\n\n"
                "Just tell me what you have in mind!"
            ), {
                "location": loc_name, "temp": "--", "wind": "--",
                "wave": "--", "dissolved_oxygen": "--",
                "ph": "--", "salinity": "--", "risks": {},
            }

        else:
            if hist_key:
                data          = get_ocean_data(hist_key)
                temp          = data["temperature"]
                wind          = data["wind"]
                wave          = data["wave"]
                wave_forecast = data["wave_forecast"]
                do            = data["dissolved_oxygen"]
                ph            = data["ph"]
                sal           = data["salinity"]
                rainfall      = data.get("rainfall", 0)
                risks         = data.get("risks", {})
                prediction    = get_fishing_prediction(hist_name, temp, wave, wind, do, ph, sal)
                emoji         = get_safety_emoji(prediction)
                gen_full_data = {
                    "location": hist_name, "temp": temp, "wind": wind,
                    "wave": wave, "wave_forecast": wave_forecast,
                    "dissolved_oxygen": do, "ph": ph, "salinity": sal,
                    "rainfall": rainfall, "risks": risks, "is_forecast": False,
                }
                risks, gen_full_data = fix_risk_score(prediction, risks, gen_full_data)
                return (
                    f"{emoji} Here are the current conditions in {hist_name} — "
                    f"temperature at {temp}°C, waves at {wave}m going to {wave_forecast}m, "
                    f"wind at {wind} km/h. "
                    f"{'Safe to head out! ✅' if prediction == 'safe' else 'Conditions are risky. ⛔'}\n\n"
                    f"Want to check for a specific date and time?"
                ), gen_full_data
            else:
                return (
                    "😊 Of course! What would you like to know? "
                    "I can check fishing safety, wave forecasts, wind conditions, "
                    "water quality or help plan a sea trip.\n\n"
                    "Just tell me the location and what you need! 🌊"
                ), {
                    "location": "Odisha", "temp": "--", "wind": "--",
                    "wave": "--", "dissolved_oxygen": "--",
                    "ph": "--", "salinity": "--", "risks": {},
                }

    # ── PLANNED LOCATION from UI picker ──
    if planned_location:
        loc_key  = planned_location.lower()
        loc_info = ODISHA_LOCATIONS.get(loc_key)
        if loc_info:
            location_key  = loc_key
            location_name = loc_info["name"]
        else:
            location_key, location_name = detect_location(planned_location)
            if not location_key:
                location_key, location_name = "puri", "Puri"
    else:
        location_key, location_name = detect_location(msg_clean)

    # ── DATETIME ──
    target_datetime = planned_datetime
    if not target_datetime:
        target_datetime = extract_datetime_from_msg(msg_clean)

    if target_datetime and not location_key:
        hist_key, hist_name = get_last_location_from_history(history)
        location_key  = hist_key  or "puri"
        location_name = hist_name or "Puri"

    # ── ASK FOR LOCATION IF NEEDED ──
    if not location_key:
        if needs_location(msg_clean):
            hist_key, hist_name = get_last_location_from_history(history)
            if hist_key:
                location_key  = hist_key
                location_name = hist_name
            else:
                return (
                    "📍 To give you accurate conditions, which location "
                    "in Odisha are you asking about?\n\n"
                    "For example: Swimming in Puri, Fishing near Chilika, "
                    "or Conditions at Paradip.\n\n"
                    "We cover all coastal locations in Odisha! 🌊"
                ), {
                    "location": "Odisha", "temp": "--", "wind": "--",
                    "wave": "--", "dissolved_oxygen": "--",
                    "ph": "--", "salinity": "--", "risks": {},
                }
        else:
            location_key  = "puri"
            location_name = "Puri"

    # ── GET OCEAN DATA ──
    data          = get_ocean_data(location_key, target_datetime)
    temp          = data["temperature"]
    wind          = data["wind"]
    wave          = data["wave"]
    wave_forecast = data["wave_forecast"]
    do            = data["dissolved_oxygen"]
    ph            = data["ph"]
    sal           = data["salinity"]
    rainfall      = data.get("rainfall", 0)
    risks         = data.get("risks", {})

    full_data = {
        "location":         location_name,
        "temp":             temp,
        "wind":             wind,
        "wave":             wave,
        "wave_forecast":    wave_forecast,
        "dissolved_oxygen": do,
        "ph":               ph,
        "salinity":         sal,
        "rainfall":         rainfall,
        "risks":            risks,
        "is_forecast":      data.get("is_forecast", False),
        "data_source":      data.get("data_source", "unknown"),
        "planned_datetime": str(target_datetime) if target_datetime else None,
        "planned_activity": planned_activity,
    }

    # ── PLANNED TRIP from UI ──
    if planned_activity and target_datetime:
        prediction       = get_fishing_prediction(location_name, temp, wave, wind, do, ph, sal)
        emoji            = get_safety_emoji(prediction)
        risks, full_data = fix_risk_score(prediction, risks, full_data)
        time_str         = target_datetime.strftime("%d %b at %I:%M %p")
        activity_map     = {
            "fishing":  "Fishing",
            "swimming": "Swimming",
            "boating":  "Boating/Sailing",
            "general":  "Going to the sea",
        }
        activity_label = activity_map.get(planned_activity, planned_activity.capitalize())
        rain_note      = f"🌧️ Rain expected: {rainfall}mm. " if rainfall > 0.5 else ""
        cyclone_warn   = f"🌀 Cyclone risk at {risks.get('cyclone', 0)}%. " if risks.get("cyclone", 0) > 30 else ""

        if prediction == "safe":
            return (
                f"{emoji} {activity_label} in {location_name} on {time_str} looks safe! "
                f"Temperature around {temp}°C with waves at {wave}m "
                f"and wind at {wind} km/h. "
                f"Wave forecast shows {wave_forecast}m in 3 hours. "
                f"{rain_note}{cyclone_warn}"
                f"Safety score: {risks.get('safe_score', 100)}%\n\n"
                f"Want to check a different time or activity?"
            ), full_data
        else:
            reasons = []
            if wave > 3:                         reasons.append(f"waves are high at {wave}m")
            if wind > 15:                        reasons.append(f"wind is strong at {wind} km/h")
            if risks.get("cyclone", 0) > 30:     reasons.append("cyclone risk is elevated")
            reason_text = " and ".join(reasons) if reasons else "unsafe conditions"
            return (
                f"{emoji} {activity_label} in {location_name} on {time_str} is risky "
                f"because {reason_text}. {rain_note}{cyclone_warn}"
                f"Safety score is only {risks.get('safe_score', 0)}%. ⛔\n\n"
                f"Want me to find a safer time this week?"
            ), full_data

    # ── SINGLE LOCATION TYPED ──
    if msg_clean in ODISHA_LOCATIONS:
        prediction       = get_fishing_prediction(location_name, temp, wave, wind, do, ph, sal)
        emoji            = get_safety_emoji(prediction)
        risks, full_data = fix_risk_score(prediction, risks, full_data)
        rain_note        = f"with {rainfall}mm rain expected " if rainfall > 0.5 else ""
        return (
            f"{emoji} Conditions in {location_name} right now — "
            f"temperature at {temp}°C, waves at {wave}m forecasting to {wave_forecast}m "
            f"in 3 hours, wind at {wind} km/h {rain_note}and oxygen at {do} mg/L. "
            f"{'Overall safe to head out! ✅' if prediction == 'safe' else 'Conditions are risky — stay on shore. ⛔'}\n\n"
            f"Want to check for a specific activity or time?"
        ), full_data

    # ── GEMINI FIRST ──
    try:
        ai_reply = ask_gemini(msg, full_data, history)
        if ai_reply and len(ai_reply) > 10:
            return ai_reply, full_data
    except Exception as e:
        print(f"Gemini failed: {e}")

    # ── KEYWORD FALLBACKS ──
    if any(w in msg_clean for w in ["fish", "fishing", "catch", "net", "macha", "machli", "mach", "machha"]):
        prediction       = get_fishing_prediction(location_name, temp, wave, wind, do, ph, sal)
        risks, full_data = fix_risk_score(prediction, risks, full_data)
        return format_fishing_response(location_name, data, prediction, target_datetime), full_data

    if any(w in msg_clean for w in ["swim", "swimming", "bath", "bathe", "dip"]):
        prediction       = get_fishing_prediction(location_name, temp, wave, wind, do, ph, sal)
        emoji            = get_safety_emoji(prediction)
        risks, full_data = fix_risk_score(prediction, risks, full_data)
        if prediction == "safe":
            return (
                f"{emoji} Swimming in {location_name} looks good right now! "
                f"Waves at {wave}m and wind at {wind} km/h — comfortable. 🏊\n\n"
                f"Want to check a specific time?"
            ), full_data
        else:
            return (
                f"{emoji} Swimming in {location_name} is risky right now. "
                f"Waves at {wave}m and wind at {wind} km/h. ⛔\n\n"
                f"Want me to find a safer time?"
            ), full_data

    if any(w in msg_clean for w in ["wave", "waves", "dheu", "lahar"]):
        return format_wave_response(location_name, data), full_data

    if any(w in msg_clean for w in ["wind", "breeze", "hawa", "bayu"]):
        return format_wind_response(location_name, wind), full_data

    if any(w in msg_clean for w in ["temperature", "temp", "hot", "cold", "heat", "garmi", "thand", "garam"]):
        return format_temp_response(location_name, temp), full_data

    if any(w in msg_clean for w in ["rain", "rainfall", "barish", "baarish", "varsha", "brishti"]):
        if rainfall > 2:       rain_desc = "heavy rain expected ⛈️"
        elif rainfall > 0.5:   rain_desc = "light rain possible 🌧️"
        else:                  rain_desc = "no rain expected ☀️"
        return (
            f"🌧️ Rain outlook for {location_name}: {rain_desc}. "
            f"Rainfall at {rainfall}mm with wind at {wind} km/h. "
            f"{'Carry a raincoat!' if rainfall > 0.5 else 'Clear skies ahead!'}\n\n"
            f"Want to check conditions for a specific day?"
        ), full_data

    if any(w in msg_clean for w in ["cyclone", "toofan", "tufan", "hurricane", "storm"]):
        cyclone_risk = risks.get("cyclone", 0)
        storm_risk   = risks.get("storm",   0)
        if cyclone_risk > 50 or storm_risk > 50:
            return (
                f"🌀 Conditions in {location_name} look concerning — "
                f"cyclone risk at {cyclone_risk}% and storm risk at {storm_risk}%. "
                f"Wind at {wind} km/h and pressure at {data.get('pressure', '--')} hPa. ⛔\n\n"
                f"Shall I check a safer nearby location?"
            ), full_data
        else:
            return (
                f"🌀 No major cyclone threat in {location_name} right now — "
                f"cyclone risk only {cyclone_risk}%, conditions stable. ✅\n\n"
                f"Want to check the full safety forecast?"
            ), full_data

    if any(w in msg_clean for w in ["oxygen", "ph", "salinity", "salt", "quality", "pollution", "polluted", "clean"]):
        return format_water_quality_response(location_name, data), full_data

    if any(w in msg_clean for w in ["boat", "vessel", "sail", "ship", "trawler", "naav"]):
        prediction       = get_fishing_prediction(location_name, temp, wave, wind, do, ph, sal)
        emoji            = get_safety_emoji(prediction)
        risks, full_data = fix_risk_score(prediction, risks, full_data)
        return (
            f"{emoji} Boat conditions in {location_name} — waves at {wave}m "
            f"forecasting to {wave_forecast}m in 3 hours, wind at {wind} km/h. "
            f"{'Safe to sail! ⛵' if prediction == 'safe' else 'Too risky for boats. ⛔'}\n\n"
            f"Want to plan for a specific date?"
        ), full_data

    # ── GENERAL FALLBACK ──
    prediction       = get_fishing_prediction(location_name, temp, wave, wind, do, ph, sal)
    emoji            = get_safety_emoji(prediction)
    risks, full_data = fix_risk_score(prediction, risks, full_data)
    rain_note        = f"with {rainfall}mm rain expected " if rainfall > 0.5 else ""
    return (
        f"{emoji} Current conditions in {location_name} — "
        f"temperature at {temp}°C, waves at {wave}m going to {wave_forecast}m in 3 hours, "
        f"wind at {wind} km/h {rain_note}and oxygen at {do} mg/L. "
        f"{'Overall safe! ✅' if prediction == 'safe' else 'Conditions risky — stay on shore. ⛔'}\n\n"
        f"Want to check for a specific date, time or activity?"
    ), full_data