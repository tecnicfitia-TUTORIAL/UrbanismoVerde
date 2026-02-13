# Use official Python runtime as base image
FROM python:3.11-slim

# Argument to bust Docker cache when dependencies change
ARG CACHEBUST=1

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for better caching)
COPY requirements.txt .

# Install Python dependencies with forced reinstall to break cache
RUN pip cache purge && \n    pip install --no-cache-dir --upgrade pip && \n    pip install --no-cache-dir --force-reinstall \n        google-generativeai==0.8.3 \n        pydantic==2.11.7 \n        supabase==2.28.0 && \n    pip install --no-cache-dir --force-reinstall -r requirements.txt

# Copy application code
COPY . .

# Cloud Run sets PORT environment variable
ENV PORT=8080

# Expose port
EXPOSE 8080

# Run with uvicorn
# Use exec form to handle signals properly
CMD exec uvicorn main:app --host 0.0.0.0 --port ${PORT} --workers 1
