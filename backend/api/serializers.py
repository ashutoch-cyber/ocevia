from rest_framework import serializers


class SearchQuerySerializer(serializers.Serializer):
    query = serializers.CharField(required=False, allow_blank=True)


class SearchResultItemSerializer(serializers.Serializer):
    type = serializers.CharField()
    name = serializers.CharField()
    risk = serializers.CharField(required=False)


class SearchResponseSerializer(serializers.Serializer):
    results = SearchResultItemSerializer(many=True)


class RiskPointSerializer(serializers.Serializer):
    lat = serializers.FloatField()
    lon = serializers.FloatField()
    risk = serializers.IntegerField()
    level = serializers.CharField()


class AlertSerializer(serializers.Serializer):
    title = serializers.CharField()
    location = serializers.CharField()
    severity = serializers.CharField()
    description = serializers.CharField()


class InsightsSerializer(serializers.Serializer):
    temperature = serializers.ListField(child=serializers.FloatField())
    wind_speed = serializers.ListField(child=serializers.FloatField())
    wave_height = serializers.ListField(child=serializers.FloatField())