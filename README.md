# Video Subtitling Web Application

A web application for adding subtitles to videos using AI-powered speech recognition.

## Project Overview

This application provides a web interface for adding subtitles to videos using AI-powered speech recognition. The system is built with a Next.js frontend that handles both the UI and API functionality.

## Architecture

The application consists of a single Next.js service that provides:
- User interface for video upload and subtitle management
- API endpoints for processing videos
- Integration with OpenAI's Whisper API for speech-to-text
- Fallback to a local Whisper model when the API is overloaded

## Features

- Video upload and processing
- Automatic speech-to-text transcription
- Subtitle editing and management
- FFmpeg integration for video manipulation
- Modern, responsive UI with Tailwind CSS
- Type-safe development with TypeScript
- Custom libass-wasm implementation for subtitle rendering

## Speech-to-Text Processing

The application uses two methods for transcription:
1. **Primary Method**: OpenAI's Whisper API for optimal accuracy and performance
2. **Fallback Method**: Local Whisper base model that handles requests when the API is overloaded

## Getting Started

### Prerequisites

- Node.js 20+ for development
- FFmpeg installed on your system
- Git
- Docker (for containerized deployment)
- Access to OpenAI's Whisper API OR bypass the API and use the local model

### Development Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```bash
   cd next-frontend
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Set up custom libass-wasm files:
   ```bash
   # The application uses custom libass-wasm files for subtitle rendering
   # These files should be placed in the public/js/libass/ directory:
   # - subtitles-octopus-worker-legacy.js
   # - subtitles-octopus-worker.js
   # - subtitles-octopus-worker.wasm
   # - subtitles-octopus.js
   # - COPYRIGHT
   ```

5. Set up environment variables:
   - Copy `.env.example` to `.env` and fill in the required variables

6. Run the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`

## Deployment

### Environment Variables

The application requires the following environment variables:
- `NEXT_PUBLIC_ENV`: Set to "production" for production environments
- `NEXT_PUBLIC_APP_INSIGHTS_INSTRUMENTATION_KEY`: For monitoring (if using Azure App Insights)

Additional environment variables may be required for API keys and service configuration. See `frontend.env` for details.

### Docker Deployment

The application can be deployed using Docker with the provided Dockerfile:

```bash
# Build the Docker image
docker build -t video-subtitler --build-arg NEXT_PUBLIC_ENV=production .

# Run the container
docker run -p 3000:3000 video-subtitler
```

The Dockerfile handles several important setup steps:
- Installs FFmpeg and required fonts
- Sets up the custom libass-wasm files for subtitle rendering
- Creates necessary directories for the database and credentials
- Builds the Next.js application for production
- Runs the application as a non-root user for security

## Credentials

For API access, place your credentials in the `/app/credentials` directory. If using service accounts, ensure the `service-account.json` file is properly configured.

## Monitoring

The application supports Azure Application Insights for monitoring. Configure the instrumentation key using the appropriate environment variable.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the Apache License 2.0 - see the LICENSE file for details. 
