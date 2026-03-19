from django.urls import path

from .views import (
    AlertsAPIView,
    CoastalRiskAPIView,
    DataSourcesAPIView,
    InsightsAPIView,
    SearchAPIView,
)

urlpatterns = [
    path("search/", SearchAPIView.as_view(), name="search"),
    path("risk/", CoastalRiskAPIView.as_view(), name="risk"),
    path("alerts/", AlertsAPIView.as_view(), name="alerts"),
    path("insights/", InsightsAPIView.as_view(), name="insights"),
    path("data-sources/", DataSourcesAPIView.as_view(), name="data-sources"),
]