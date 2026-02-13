# Updated Dockerfile

FROM python:3.8

# Argument to bust cache
ARG CACHEBUST=\${CACHEBUST}

# Set the working directory
WORKDIR /app

# Copy the requirements file
COPY requirements.txt .

# Install dependencies without cache
RUN pip install --no-cache-dir --force-reinstall -r requirements.txt

# Copy the rest of the application
COPY . .

# Expose the port
EXPOSE 5000

# Command to run the application
CMD ["python", "app.py"]