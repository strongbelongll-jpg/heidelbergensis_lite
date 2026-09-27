FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt --trusted-host pypi.org --trusted-host files.pythonhosted.org

COPY . .

RUN python manage.py migrate

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]