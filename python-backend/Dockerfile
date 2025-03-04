FROM python:3.11-slim

# Install FFmpeg
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*


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
RUN pip install --no-cache-dir --upgrade pillow

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

# Run the application
CMD ["python", "app.py"]