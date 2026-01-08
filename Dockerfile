FROM python:3.10-slim-buster
WORKDIR /app
COPY . /app

RUN apt-get update && pip install -r requirements.txt

# Cloud Run expects the app to listen on PORT environment variable
CMD ["python3", "app.py"]