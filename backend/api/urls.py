from django.urls import path

from .views import (
    AlertsAPIView,
    DataSourcesAPIView,
    InsightsAPIView,
    SearchAPIView,
    get_risk_data,
)

urlpatterns = [
    path("search/", SearchAPIView.as_view(), name="search"),
    path("risk/", get_risk_data, name="risk"),
    path("alerts/", AlertsAPIView.as_view(), name="alerts"),
    path("insights/", InsightsAPIView.as_view(), name="insights"),
    path("data-sources/", DataSourcesAPIView.as_view(), name="data-sources"),
]