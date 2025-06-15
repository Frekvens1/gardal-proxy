FROM python:3.13-slim AS builder

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

ENV UVICORN_WORKERS=4

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "80"]
