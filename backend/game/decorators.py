from functools import wraps
from django.http import JsonResponse

def tribe_required(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'Не авторизован'}, status=401)
        
        from .models import Tribe
        if not Tribe.objects.filter(user=request.user).exists():
            return JsonResponse({'error': 'У вас нет племени'}, status=403)
        
        return view_func(request, *args, **kwargs)
    return wrapper