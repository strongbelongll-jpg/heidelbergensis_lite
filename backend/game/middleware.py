import logging
import time

logger = logging.getLogger('api_logger')

class ApiLogMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Логируем только запросы к API
        if request.path.startswith('/api/'):
            start = time.time()
            response = self.get_response(request)
            duration = time.time() - start
            logger.info(
                f"{request.method} {request.path} - {response.status_code} - {duration:.3f}s"
            )
            return response
        return self.get_response(request)