from rest_framework import serializers
from django.utils import timezone
from .models import Tribe, Tribesman

class TribesmanSerializer(serializers.ModelSerializer):
    returns_at = serializers.SerializerMethodField()

    class Meta:
        model = Tribesman
        fields = ['id', 'name', 'task', 'is_alive', 'returns_at']

    def get_returns_at(self, obj):
        if obj.task_start_time and obj.task_duration_minutes:
            return obj.task_start_time + timezone.timedelta(minutes=obj.task_duration_minutes)
        return None

class TribeSerializer(serializers.ModelSerializer):
    tribesmen = TribesmanSerializer(many=True, read_only=True)
    
    class Meta:
        model = Tribe
        fields = [
            'name',
            'food',
            'wood',
            'stone',
            'population',
            'max_population',
            'hut_level',
            'tribesmen',
        ]