# Use official Python runtime as base image
FROM python:3.11-slim

# Argument to bust Docker cache
ARG CACHEBUST=20260213

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first
COPY requirements.txt .

# Install Python dependencies with forced reinstall
RUN pip cache purge && \
    pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir --force-reinstall \
        google-generativeai==0.8.3 \
        pydantic==2.11.7 \
        supabase==2.28.0 && \
    pip install --no-cache-dir --force-reinstall -r requirements.txt

# Verify installed version
RUN python -c "import google.generativeai as genai; print(f'✅ Installed: google-generativeai {genai.__version__}')"

# Copy application code
COPY . .

# Cloud Run sets PORT environment variable
ENV PORT=8080

# Expose port
EXPOSE 8080

# Run with uvicorn
CMD exec uvicorn main:app --host 0.0.0.0 --port ${PORT} --workers 1
