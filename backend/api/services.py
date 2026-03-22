from collections.abc import Sequence
from .chatbot import chatbot_response

def chatbot_reply(message):
    return chatbot_response(message)

COASTAL_LOCATIONS = [
    {"name": "Puri Coast", "risk": "Medium"},
    {"name": "Gopalpur Coast", "risk": "Low"},
    {"name": "Paradip Coast", "risk": "High"},
]

MARINE_ALERTS = [
    {
        "title": "High Wave Alert",
        "location": "Puri",
        "severity": "High",
        "description": "Wave height exceeding safe levels",
    },
    {
        "title": "Strong Wind Advisory",
        "location": "Paradip",
        "severity": "Medium",
        "description": "Wind speed rising above normal marine thresholds",
    },
]

INSIGHT_SERIES = {
    "temperature": [28, 29, 30],
    "wind_speed": [12, 15, 18],
    "wave_height": [1.2, 1.5, 2.0],
}

RISK_POINTS = [
    {"lat": 20.3, "lon": 85.8, "risk": 20, "level": "Low"},
    {"lat": 19.8, "lon": 85.9, "risk": 60, "level": "Medium"},
    {"lat": 20.5, "lon": 86.7, "risk": 85, "level": "High"},
]

DATA_SOURCES = [
    "Copernicus Marine",
    "NOAA",
    "NASA Earth Data",
    "OpenWeather API",
]


def get_risk_points() -> Sequence[dict]:
    return RISK_POINTS


def get_alerts() -> Sequence[dict]:
    return MARINE_ALERTS


def get_insights() -> dict:
    return INSIGHT_SERIES


def get_data_sources() -> Sequence[str]:
    return DATA_SOURCES


def search_all(query: str) -> dict:
    query_lower = query.lower().strip()

    location_results = [
        {"type": "location", "name": item["name"], "risk": item["risk"]}
        for item in COASTAL_LOCATIONS
        if query_lower in item["name"].lower() or query_lower in item["risk"].lower()
    ]

    alert_results = [
        {"type": "alert", "name": alert["title"]}
        for alert in MARINE_ALERTS
        if query_lower in alert["title"].lower()
        or query_lower in alert["location"].lower()
        or query_lower in alert["severity"].lower()
    ]

    insight_results = [
        {"type": "insight", "name": key.replace("_", " ").title()}
        for key in INSIGHT_SERIES
        if query_lower in key.lower()
    ]

    return {"results": [*location_results, *alert_results, *insight_results]}