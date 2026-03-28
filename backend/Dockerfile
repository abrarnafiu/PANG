FROM python:3.11-slim

WORKDIR /app

# gcc is required to build the cryptography wheel on some platforms
RUN apt-get update && apt-get install -y --no-install-recommends gcc && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

# 2 sync workers; long timeout for Monte Carlo runs (up to 10 k paths)
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--timeout", "120", "app:app"]
