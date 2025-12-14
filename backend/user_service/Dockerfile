FROM python:3.11

WORKDIR /app

RUN apt-get update && apt-get install -y postgresql-client

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Default command (overridden in docker-compose for worker)
CMD ["python", "manage.py", "runserver", "0.0.0.0:8001"]
