from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import (
	AlertSerializer,
	InsightsSerializer,
	RiskPointSerializer,
	SearchQuerySerializer,
	SearchResponseSerializer,
)
from .services import get_alerts, get_data_sources, get_insights, get_risk_points, search_all


class SearchAPIView(APIView):
	def get(self, request):
		query_serializer = SearchQuerySerializer(data=request.query_params)
		query_serializer.is_valid(raise_exception=True)

		query = query_serializer.validated_data.get("query", "")
		payload = search_all(query)
		response_serializer = SearchResponseSerializer(data=payload)
		response_serializer.is_valid(raise_exception=True)
		return Response(response_serializer.data)


class CoastalRiskAPIView(APIView):
	def get(self, request):
		serializer = RiskPointSerializer(get_risk_points(), many=True)
		return Response(serializer.data)


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
