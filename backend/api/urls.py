from django.urls import path
from . import views

from .views import (
    AlertsAPIView,
    DataSourcesAPIView,
    InsightsAPIView,
    SearchAPIView,
    get_risk_data,
    predict_risk,
)

urlpatterns = [
    path("search/",       SearchAPIView.as_view(),      name="search"),
    path("risk/",         get_risk_data,                name="risk"),
    path("alerts/",       AlertsAPIView.as_view(),      name="alerts"),
    path("insights/",     InsightsAPIView.as_view(),    name="insights"),
    path("data-sources/", DataSourcesAPIView.as_view(), name="data-sources"),
    path("predict/",      predict_risk,                 name="predict"),
    path("chat/",         views.chatbot_api,            name="chat"),

    # ✅ NEW — live weather for the stats bar
    path("weather/",      views.weather_api,            name="weather"),
]