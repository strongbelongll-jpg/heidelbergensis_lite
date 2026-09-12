from celery import shared_task
from .models import Tribe

@shared_task
def deduct_food():
    from django.db.models import F
    tribes = Tribe.objects.all()
    for tribe in tribes:
        tribe.food = tribe.food - tribe.population * 5
        if tribe.food < 0:
            tribe.food = 0
        tribe.save()
    return f"Еда списана у {tribes.count()} племён"