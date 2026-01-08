FROM python:3.11-slim

WORKDIR /app

# Install system dependencies required for ML packages
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    gcc \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip (VERY IMPORTANT)
RUN pip install --upgrade pip setuptools wheel

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

ENV PORT=8000
EXPOSE 8000

CMD ["python", "app.py"]
