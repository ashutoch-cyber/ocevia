import joblib
import pandas as pd
import numpy as np
from datetime import datetime
import os
import requests
from google import genai
from rapidfuzz import process, fuzz

# ============================================================
# CONFIGURE GEMINI
# ============================================================
client = genai.Client(api_key="AIzaSyDgfNgoT-cwUSOl36lSRAnrm9c9aUtQxQY")

# ============================================================
# LOAD OCEAN TEMPERATURE ML MODEL
# ============================================================
MODEL_PATH = os.path.join(os.path.dirname(__file__), "openocean_model.pkl")
ocean_model = joblib.load(MODEL_PATH)
print("✅ Ocean ML model loaded!")

# ============================================================
# LOAD WAVE FORECASTING ML MODEL
# ============================================================
WAVE_MODEL_PATH = os.path.join(os.path.dirname(__file__), "ocean_model.pkl")
try:
    wave_model = joblib.load(WAVE_MODEL_PATH)
    print("✅ Wave forecasting model loaded!")
except Exception as e:
    wave_model = None
    print(f"⚠️ Wave model not found: {e}")

# ============================================================
# FEATURE COLUMNS
# ============================================================
FEATURE_COLS = [
    "latitude", "longitude",
    "salinity", "ph", "dissolved_oxygen",
    "turbidity", "chlorophyll", "wave_height",
    "hour_sin", "hour_cos",
    "month_sin", "month_cos",
    "day_of_week", "year",
    "buoy_id_enc",
]

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
# ML TEMPERATURE PREDICTION
# ============================================================
def get_ml_prediction(lat, lon, buoy_enc,
                       salinity=33.0, ph=8.1,
                       dissolved_oxygen=6.2, turbidity=2.1,
                       chlorophyll=1.5, wave_height=1.2):
    now         = datetime.utcnow()
    hour        = now.hour
    month       = now.month
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
    return round(float(ocean_model.predict(sample)[0]), 1)

# ============================================================
# WAVE FORECAST PREDICTION
# ============================================================
def get_wave_forecast(current_wave, wind_speed,
                       wind_direction=180, rainfall=0):
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
        predicted = max(0.1, round(predicted, 2))
        print(f"🌊 Wave forecast (3hrs): {predicted}m")
        return predicted
    except Exception as e:
        print(f"Wave forecast error: {e}")
        return current_wave

# ============================================================
# LIVE WEATHER API
# ============================================================
WEATHER_API_KEY = "3fa7faeb68a5f3ed4e88a083b2e2ae2e"

def get_live_weather(lat, lon):
    try:
        url = "https://api.openweathermap.org/data/2.5/weather"
        params = {
            "lat": lat, "lon": lon,
            "appid": WEATHER_API_KEY,
            "units": "metric"
        }
        r = requests.get(url, params=params, timeout=5)
        data = r.json()
        return {
            "temperature":    round(data["main"]["temp"], 1),
            "wind":           round(data["wind"]["speed"] * 3.6, 1),
            "wind_direction": data["wind"].get("deg", 180),
            "rain":           data.get("rain", {}).get("1h", 0),
        }
    except:
        return None

# ============================================================
# OCEAN DATA
# ============================================================
def get_ocean_data(location_key="puri"):
    loc  = ODISHA_LOCATIONS.get(location_key, ODISHA_LOCATIONS["puri"])

    live = get_live_weather(loc["lat"], loc["lon"])

    if live:
        print(f"✅ Live weather for {loc['name']}: {live['temperature']}°C")
        temp           = live["temperature"]
        wind           = live["wind"]
        wind_direction = live.get("wind_direction", 180)
        rainfall       = live.get("rain", 0)
    else:
        print("📴 Offline — using ML prediction")
        temp           = get_ml_prediction(
            lat=loc["lat"], lon=loc["lon"], buoy_enc=loc["buoy"]
        )
        # Sanity check for Odisha temperature
        if temp < 20 or temp > 40:
            temp = 28.5
        wind           = 10.0
        wind_direction = 180
        rainfall       = 0.0

    # Current wave estimate
    current_wave = 1.5

    # Predict wave height 3 hours ahead
    wave_forecast = get_wave_forecast(
        current_wave, wind, wind_direction, rainfall
    )

    return {
        "temperature":      temp,
        "wind":             wind,
        "wind_direction":   wind_direction,
        "rainfall":         rainfall,
        "wave":             current_wave,
        "wave_forecast":    wave_forecast,
        "dissolved_oxygen": 6.2,
        "ph":               8.1,
        "salinity":         33.0,
    }

# ============================================================
# SAFETY PREDICTION
# ============================================================
def get_fishing_prediction(location, temp, wave, wind, do, ph, salinity):
    if wave > 3 or wind > 15: return "risky"
    if do < 4:                return "risky"
    if ph < 7 or ph > 9:     return "risky"
    if temp > 33:             return "risky"
    return "safe"

# ============================================================
# LOCATION DETECTION
# ============================================================
def detect_location(msg):
    msg_lower = msg.lower().strip()

    for key in ODISHA_LOCATIONS:
        if key in msg_lower:
            return key, ODISHA_LOCATIONS[key]["name"]

    words = msg_lower.split()
    location_keys = list(ODISHA_LOCATIONS.keys())
    best_key = None
    best_score = 0

    for word in words:
        if len(word) < 3:
            continue
        result = process.extractOne(
            word, location_keys,
            scorer=fuzz.ratio,
            score_cutoff=60
        )
        if result and result[1] > best_score:
            best_score = result[1]
            best_key = result[0]

    if best_key:
        return best_key, ODISHA_LOCATIONS[best_key]["name"]

    result = process.extractOne(
        msg_lower, location_keys,
        scorer=fuzz.partial_ratio,
        score_cutoff=60
    )
    if result:
        return result[0], ODISHA_LOCATIONS[result[0]]["name"]

    location_names = {v["name"].lower(): k for k, v in ODISHA_LOCATIONS.items()}
    for name, key in location_names.items():
        if fuzz.partial_ratio(msg_lower, name) > 70:
            return key, ODISHA_LOCATIONS[key]["name"]

    return "puri", "Puri"

# ============================================================
# SAFETY HELPERS
# ============================================================
def get_safety_emoji(status):
    if status == "safe":  return "✅"
    if status == "risky": return "⚠️"
    return "❓"

def format_fishing_response(location_name, data, prediction):
    emoji        = get_safety_emoji(prediction)
    temp         = data["temperature"]
    wave         = data["wave"]
    wind         = data["wind"]
    do           = data["dissolved_oxygen"]
    ph           = data["ph"]
    wave_forecast = data.get("wave_forecast", wave)
    rainfall     = data.get("rainfall", 0)

    if prediction == "safe":
        rain_note = f"🌧️ Light rain possible\n" if rainfall > 0.5 else ""
        return (
            f"{emoji} Fishing in *{location_name}* is safe today!\n\n"
            f"🌡️ Temp: {temp}°C\n"
            f"🌊 Waves now: {wave}m → forecast in 3hrs: {wave_forecast}m\n"
            f"💨 Wind: {wind} km/h\n"
            f"💧 Oxygen: {do} mg/L\n"
            f"{rain_note}\n"
            f"Stay safe and have a good catch! 🎣"
        )
    else:
        reasons = []
        if wave > 3:          reasons.append(f"waves too high at {wave}m")
        if wind > 15:         reasons.append(f"wind too strong at {wind} km/h")
        if do < 4:            reasons.append(f"low oxygen at {do} mg/L")
        if ph < 7 or ph > 9: reasons.append(f"abnormal pH at {ph}")
        if temp > 33:         reasons.append(f"temp too high at {temp}°C")
        reason_text = ", ".join(reasons) if reasons else "rough conditions"
        return (
            f"{emoji} Fishing in *{location_name}* is risky!\n\n"
            f"🌡️ Temp: {temp}°C\n"
            f"🌊 Waves now: {wave}m → forecast: {wave_forecast}m\n"
            f"💨 Wind: {wind} km/h\n\n"
            f"⚠️ Reason: {reason_text}\n"
            f"⛔ Avoid the sea today."
        )

def format_wave_response(location_name, data):
    wave         = data["wave"]
    wave_forecast = data.get("wave_forecast", wave)
    if wave <= 1:    desc = "very calm 😊"
    elif wave <= 2:  desc = "moderate — manageable"
    elif wave <= 3:  desc = "rough — be cautious ⚠️"
    else:            desc = "very rough — dangerous! ⛔"
    return (
        f"🌊 Waves in *{location_name}*:\n\n"
        f"Right now: {wave}m — {desc}\n"
        f"In 3 hours: {wave_forecast}m (ML forecast)\n\n"
        f"{'Plan your trip accordingly! 🎣' if wave <= 2 else '⛔ Avoid the sea!'}"
    )

def format_wind_response(location_name, wind):
    if wind <= 10:   desc = "calm and gentle 😊"
    elif wind <= 20: desc = "moderate — take care"
    elif wind <= 30: desc = "strong — be cautious ⚠️"
    else:            desc = "very strong — dangerous! ⛔"
    return f"💨 Wind in *{location_name}*: {wind} km/h — {desc}"

def format_temp_response(location_name, temp):
    if temp <= 25:   desc = "cool and comfortable 😊"
    elif temp <= 30: desc = "warm — stay hydrated"
    elif temp <= 33: desc = "hot — carry water"
    else:            desc = "very hot — anomaly detected! ⚠️"
    return f"🌡️ Temperature in *{location_name}*: {temp}°C — {desc}"

def format_water_quality_response(location_name, data):
    do  = data["dissolved_oxygen"]
    ph  = data["ph"]
    sal = data["salinity"]
    warnings = []
    if do < 4:                warnings.append("⚠️ Low dissolved oxygen")
    if ph < 7 or ph > 9:     warnings.append(f"⚠️ Abnormal pH: {ph}")
    if sal < 30 or sal > 40: warnings.append(f"⚠️ Unusual salinity: {sal} ppt")
    warning_text = "\n".join(warnings) if warnings else "All parameters normal ✅"
    return (
        f"🔬 Water quality in *{location_name}*:\n\n"
        f"💧 Oxygen: {do} mg/L\n"
        f"⚗️ pH: {ph}\n"
        f"🧂 Salinity: {sal} ppt\n\n"
        f"{warning_text}"
    )

# ============================================================
# GEMINI AI
# ============================================================
def ask_gemini(msg, ocean_data, history=[]):
    history_text = ""
    if history:
        recent = history[-4:]
        for h in recent:
            role = "User" if h["sender"] == "user" else "Neer"
            history_text += f"{role}: {h['text']}\n"

    wave_forecast = ocean_data.get('wave_forecast', ocean_data['wave'])
    rainfall      = ocean_data.get('rainfall', 0)
    rain_status   = f"{rainfall}mm (rain expected)" if rainfall > 0.5 else "No rain expected"

    prompt = f"""SYSTEM: You are mid-conversation. Answer directly. Never greet.

You are Neer Ocevia, a warm intelligent ocean safety assistant
for fishermen and coastal workers in Odisha, India.
You speak like a knowledgeable local friend who deeply
understands the sea, fishing, and coastal communities.

CURRENT OCEAN DATA for {ocean_data['location']}:
Temperature:    {ocean_data['temp']}°C (live data)
Waves now:      {ocean_data['wave']}m
Wave forecast:  {wave_forecast}m (3 hours ahead, ML predicted)
Wind speed:     {ocean_data['wind']} km/h (live data)
Rainfall:       {rain_status}
Dissolved O2:   {ocean_data['dissolved_oxygen']} mg/L
pH Level:       {ocean_data['ph']}
Salinity:       {ocean_data['salinity']} ppt

CONVERSATION SO FAR:
{history_text if history_text else "First message"}

USER SAYS: "{msg}"

HOW TO RESPOND:
- Detect language (English/Hindi/Odia) reply in SAME language
- Understand indirect questions naturally
- Use wave forecast when relevant
- Mention rain if rainfall > 0.5mm
- Show confidence % for safety predictions
- Be warm caring proactive about dangers
- Max 5 lines use emojis 🌊 🎣 ⚠️ ✅ ⛔ 🌧️ 🌀 💨 🌡️

ABSOLUTE RULES:
- NEVER start with Hello Hi Hey Namaste Welcome
- NEVER say I am Neer or introduce yourself
- NEVER ask what they want just answer directly
- ALWAYS mention location name
- ALWAYS use ocean data above
- START directly: "✅ Fishing in Puri looks safe!"
"""

    try:
        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=prompt
        )
        text = response.text.strip()
        text = text.replace('**', '').replace('*', '')
        text = text.replace('`', '').replace('#', '')

        text_lower = text.lower()
        bad_starts = [
            "hello", "hi ", "hi!", "hey ", "namaste",
            "welcome", "i am neer", "i'm neer",
            "neer ocevia", "as neer", "i'm an ai",
            "i am an ai", "how can i help", "how may i",
            "i'd be happy", "i would be happy",
            "great question", "certainly", "of course",
            "sure!", "sure,", "absolutely"
        ]

        first_word = text_lower.split()[0] if text_lower.split() else ""
        if first_word in ["hello", "hi", "hey", "namaste",
                          "welcome", "greetings", "certainly",
                          "sure", "absolutely", "of"]:
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
def chatbot_response(msg, history=[]):
    msg_clean = msg.lower().strip()

    location_key, location_name = detect_location(msg_clean)
    data         = get_ocean_data(location_key)
    temp         = data["temperature"]
    wind         = data["wind"]
    wave         = data["wave"]
    wave_forecast = data["wave_forecast"]
    do           = data["dissolved_oxygen"]
    ph           = data["ph"]
    sal          = data["salinity"]
    rainfall     = data.get("rainfall", 0)

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
    }

    # Single location name — give full conditions
    if msg_clean in ODISHA_LOCATIONS:
        prediction = get_fishing_prediction(
            location_name, temp, wave, wind, do, ph, sal)
        emoji = get_safety_emoji(prediction)
        rain_note = f"🌧️ Rain: {rainfall}mm\n" if rainfall > 0.5 else ""
        return (
            f"{emoji} Conditions in *{location_name}* right now:\n\n"
            f"🌡️ Temp: {temp}°C\n"
            f"🌊 Waves: {wave}m → 3hr forecast: {wave_forecast}m\n"
            f"💨 Wind: {wind} km/h\n"
            f"{rain_note}"
            f"💧 Oxygen: {do} mg/L\n\n"
            f"{'Safe to go out! ✅' if prediction == 'safe' else 'Stay on shore ⛔'}"
        ), full_data

    # Gemini first
    try:
        ai_reply = ask_gemini(msg, full_data, history)
        if ai_reply and len(ai_reply) > 10:
            return ai_reply, full_data
    except Exception as e:
        print(f"Gemini failed: {e}")

    # Keyword fallback

    # Fishing
    if any(w in msg_clean for w in [
        "fish", "fishing", "catch", "net",
        "macha", "machli", "mach", "machha"
    ]):
        prediction = get_fishing_prediction(
            location_name, temp, wave, wind, do, ph, sal)
        return format_fishing_response(
            location_name, data, prediction), full_data

    # Swimming
    if any(w in msg_clean for w in [
        "swim", "swimming", "bath", "bathe", "dip"
    ]):
        prediction = get_fishing_prediction(
            location_name, temp, wave, wind, do, ph, sal)
        emoji = get_safety_emoji(prediction)
        if prediction == "safe":
            return (
                f"{emoji} Swimming in *{location_name}* "
                f"looks good!\n\n"
                f"🌊 Waves: {wave}m\n"
                f"💨 Wind: {wind} km/h\n"
                f"🌡️ Temp: {temp}°C\n\n"
                f"Enjoy your swim! 🏊"
            ), full_data
        else:
            return (
                f"{emoji} Swimming in *{location_name}* "
                f"is risky.\n\n"
                f"🌊 Waves: {wave}m\n"
                f"💨 Wind: {wind} km/h\n\n"
                f"⛔ Please avoid swimming."
            ), full_data

    # Waves
    if any(w in msg_clean for w in [
        "wave", "waves", "sea", "ocean", "dheu", "lahar"
    ]):
        return format_wave_response(location_name, data), full_data

    # Wind
    if any(w in msg_clean for w in [
        "wind", "storm", "breeze", "cyclone",
        "hawa", "toofan", "bayu"
    ]):
        return format_wind_response(location_name, wind), full_data

    # Temperature
    if any(w in msg_clean for w in [
        "temperature", "temp", "hot", "cold",
        "heat", "garmi", "thand", "garam"
    ]):
        return format_temp_response(location_name, temp), full_data

    # Rain
    if any(w in msg_clean for w in [
        "rain", "rainfall", "barish", "baarish",
        "varsha", "brishti", "precipitation"
    ]):
        if rainfall > 2:
            rain_desc = "heavy rain expected ⛈️"
        elif rainfall > 0.5:
            rain_desc = "light rain possible 🌧️"
        else:
            rain_desc = "no rain expected ☀️"
        return (
            f"🌧️ Rain forecast for *{location_name}*:\n\n"
            f"{rain_desc}\n"
            f"Rainfall: {rainfall}mm\n"
            f"💨 Wind: {wind} km/h\n\n"
            f"{'Carry a raincoat if going out!' if rainfall > 0.5 else 'Clear skies ahead! ☀️'}"
        ), full_data

    # Water quality
    if any(w in msg_clean for w in [
        "oxygen", "ph", "salinity", "salt",
        "quality", "pollution", "polluted", "clean"
    ]):
        return format_water_quality_response(location_name, data), full_data

    # Boat
    if any(w in msg_clean for w in [
        "boat", "vessel", "sail", "ship", "trawler", "naav"
    ]):
        prediction = get_fishing_prediction(
            location_name, temp, wave, wind, do, ph, sal)
        emoji = get_safety_emoji(prediction)
        return (
            f"{emoji} Boat conditions in *{location_name}*:\n\n"
            f"🌊 Waves: {wave}m → 3hr forecast: {wave_forecast}m\n"
            f"💨 Wind: {wind} km/h\n"
            f"🌡️ Temp: {temp}°C\n\n"
            f"{'Safe to sail! ⛵' if prediction == 'safe' else '⛔ Avoid sailing today!'}"
        ), full_data

    # General fallback
    prediction = get_fishing_prediction(
        location_name, temp, wave, wind, do, ph, sal)
    emoji = get_safety_emoji(prediction)
    rain_note = f"🌧️ Rain: {rainfall}mm\n" if rainfall > 0.5 else ""
    return (
        f"{emoji} Conditions in *{location_name}* right now:\n\n"
        f"🌡️ Temp: {temp}°C\n"
        f"🌊 Waves: {wave}m → 3hr: {wave_forecast}m\n"
        f"💨 Wind: {wind} km/h\n"
        f"{rain_note}"
        f"💧 Oxygen: {do} mg/L\n\n"
        f"{'Safe to go out! ✅' if prediction == 'safe' else 'Stay on shore ⛔'}"
    ), full_data