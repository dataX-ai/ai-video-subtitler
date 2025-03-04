FROM croncorp/python-ffmpeg:3.11.4-slim-bullseye

# Install system dependencies for Pillow & libraqm
RUN apt-get update && apt-get install -y \
    libjpeg-dev \
    libfreetype6-dev \
    liblcms2-dev \
    libwebp-dev \
    tcl-dev tk-dev \
    libharfbuzz-dev \
    libfribidi-dev \
    libraqm-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Pillow
RUN pip install --no-cache-dir --upgrade Pillow==9.4.0


# Verify libraqm support
RUN python -c "from PIL import features; print('RAQM Support:', features.check('raqm'))"

# Copy requirements first to leverage Docker cache

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

WORKDIR /app

# Copy the rest of the application
COPY . .

# Expose the port the app runs on
EXPOSE 5007

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Create directory for credentials to be mounted
RUN mkdir -p /app/credentials

# Run the application
CMD ["python", "app.py"]