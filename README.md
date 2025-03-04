# Subtitle Monorepo

A full-stack application for subtitle management and processing, built with Next.js and Python.

## Project Structure

This monorepo contains two main components:

- `next-frontend/`: A modern web application built with Next.js 14
- `python-backend/`: A Python-based backend service for subtitle processing

## Frontend (Next.js)

The frontend is built with:
- Next.js 14
- TypeScript
- Tailwind CSS
- Radix UI components
- FFmpeg for video processing
- Various React hooks and utilities

### Getting Started with Frontend

1. Navigate to the frontend directory:
   ```bash
   cd next-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` and fill in the required variables

4. Run the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:3000`

## Backend (Python)

The backend service is located in the `python-backend` directory and handles subtitle processing and management.

### Getting Started with Backend

1. Navigate to the backend directory:
   ```bash
   cd python-backend
   ```

2. Set up a Python virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the backend service:
   ```bash
   python -m subtitle_service
   ```

## Features

- Video subtitle processing and management
- FFmpeg integration for video manipulation
- Modern, responsive UI with Tailwind CSS
- Type-safe development with TypeScript
- Component-based architecture with Radix UI
- Form handling with React Hook Form and Zod validation

## Development

### Prerequisites

- Node.js 18+ for frontend development
- Python 3.8+ for backend development
- FFmpeg installed on your system
- Git

### Environment Variables

Frontend (`.env`):
```
# Add your environment variables here
```

Backend:
```
# Add your backend environment variables here
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the Apache License 2.0 - see the LICENSE file for details. 