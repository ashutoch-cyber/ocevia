import random
import requests

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
	url = f"https://api.openweathermap.org/data/2.5/weather?lat=19&lon=72&appid={API_KEY}&units=metric"

	try:
		response = requests.get(url, timeout=5)
		response.raise_for_status()
		data = response.json()
	except requests.RequestException:
		return None

	return {
		"temp": data.get("main", {}).get("temp", 0),
		"humidity": data.get("main", {}).get("humidity", 0),
		"wind": data.get("wind", {}).get("speed", 0),
	}


def calculate_risk(temp, wind, humidity):
	score = 0

	if wind > 10:
		score += 2
	elif wind > 6:
		score += 1

	if humidity > 85:
		score += 2
	elif humidity > 70:
		score += 1

	if temp > 30 or temp < 10:
		score += 1

	if score >= 3:
		return "high"
	if score == 2:
		return "medium"
	return "low"


def get_risk_data(request):
	data = []

	coastal_points = [
		# India
		(19.0, 72.5),
		(19.2, 72.8),
		(13.0, 80.2),
		(12.8, 80.4),
		(19.8, 85.8),
		(20.5, 86.5),
		(21.0, 87.0),
		# USA
		(34.0, -118.5),
		(40.0, -74.0),
		# Europe
		(51.0, -1.0),
		(48.0, -4.0),
		# Asia
		(35.0, 139.0),
		(1.2, 103.5),
		# Australia
		(-33.0, 151.0),
	]

	for lat, lon in coastal_points:
		weather = get_weather(lat, lon)
		if not weather:
			continue

		base_risk = calculate_risk(
			weather["temp"],
			weather["wind"],
			weather["humidity"],
		)

		for _ in range(15):
			lat_offset = lat + random.uniform(-0.15, 0.15)

			# Push points toward ocean side by hemisphere.
			if lon > 0:
				lon_offset = lon + random.uniform(0.2, 0.5)
			else:
				lon_offset = lon - random.uniform(0.2, 0.5)

			rand = random.random()
			if base_risk == "low":
				if rand < 0.7:
					risk = "low"
				elif rand < 0.9:
					risk = "medium"
				else:
					risk = "high"
			elif base_risk == "medium":
				if rand < 0.5:
					risk = "medium"
				elif rand < 0.75:
					risk = "low"
				else:
					risk = "high"
			else:
				if rand < 0.6:
					risk = "high"
				elif rand < 0.85:
					risk = "medium"
				else:
					risk = "low"

			data.append(
				{
					"lat": lat_offset,
					"lng": lon_offset,
					"risk": risk,
					"temp": weather["temp"],
					"wind": weather["wind"],
					"humidity": weather["humidity"],
				}
			)

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
