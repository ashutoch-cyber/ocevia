from django.db import models


class CoastalRiskObservation(models.Model):
	location_name = models.CharField(max_length=120)
	latitude = models.FloatField()
	longitude = models.FloatField()
	risk_score = models.PositiveSmallIntegerField()
	risk_level = models.CharField(max_length=20)
	observed_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ["-observed_at"]


class MarineAlert(models.Model):
	title = models.CharField(max_length=150)
	location = models.CharField(max_length=120)
	severity = models.CharField(max_length=20)
	description = models.TextField()
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ["-created_at"]


class DataIngestionSource(models.Model):
	name = models.CharField(max_length=120, unique=True)
	provider = models.CharField(max_length=120, blank=True)
	endpoint = models.URLField(blank=True)
	active = models.BooleanField(default=True)

	def __str__(self):
		return self.name
