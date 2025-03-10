from flask import Flask, request, jsonify
import sys
import os
import logging
from logger_config import setup_logger
root_path = os.path.dirname(os.path.dirname(__file__))
sys.path.append(root_path)
from service import SubtitleService
from uuid import UUID, uuid4
from pydantic import BaseModel, Field, HttpUrl
from typing import Optional
from dotenv import load_dotenv
import highlight_io
from highlight_io.integrations.flask import FlaskIntegration

# Setup logger
logger = setup_logger(__name__)

load_dotenv()

app = Flask(__name__)

environment = os.getenv("ENV", "development")  # Default to development if not set

if environment == "production":
    H = highlight_io.H(
        os.getenv("HIGHLIGHT_PROJECT_ID"),
        integrations=[FlaskIntegration()],
        instrument_logging=True,
        service_name="subtitle-flask-backend",
        log_level=logging.ERROR,
        service_version="git-sha",
        environment="production",
    )

logger.info("Initializing SubtitleService")
service = SubtitleService()

class ColorScheme(BaseModel):
    text: str
    background: str

class Colors(BaseModel):
    line1: Optional[ColorScheme] = None
    line2: Optional[ColorScheme] = None

class Position(BaseModel):
    x: float
    y: float

class SubtitleStyle(BaseModel):
    font: str
    position: Optional[Position] = None
    colors: Optional[Colors] = None
    size: Optional[int] = None

class SubtitleRequest(BaseModel):
    video_url: HttpUrl
    audio_url: HttpUrl
    script: str
    id: Optional[UUID] = Field(default_factory=uuid4)
    subtitle_style: Optional[SubtitleStyle] = None

@app.route('/subtitle', methods=['POST'])
def process_script():
    try:
        logger.info("Received subtitle processing request")
        data = SubtitleRequest(**request.json)
        logger.debug(f"Processing request for ID: {data.id}")
        logger.debug(f"Request data: {data}")
        
        logger.info("Saving audio and video files")
        video_file_path, audio_file_path = service.save_audio_and_video(
            video_url=str(data.video_url),
            audio_url=str(data.audio_url),
            id=data.id
        )
        logger.debug(f"Saved video to {video_file_path} and audio to {audio_file_path}")

        logger.info("Generating subtitles")
        output_video_file_path = service.generate_subtitles(
            vid_id=data.id,
            script=data.script,
            audio_path=audio_file_path,
            video_file_path=video_file_path,
            output_file_path=f'./output/final_vid_with_subtitle_{data.id}.mp4',
            subtitle_style=data.subtitle_style
        )
        logger.debug(f"Generated subtitled video at {output_video_file_path}")

        logger.info("Uploading to GCS")
        final_video_link = service.upload_to_gcs(
            video_file=output_video_file_path,
            filename=f'final_output_video_with_sub_{data.id}.mp4'
        )
        logger.debug(f"Uploaded video to {final_video_link}")

        logger.info("Cleaning up output directory")
        service.cleanup_output_directory()
        
        logger.info("Successfully completed subtitle processing")
        return jsonify({"video_link": final_video_link})
    
    except Exception as e:
        error_msg = f"Error processing subtitle request: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return jsonify({"error": error_msg}), 500

# Add error handlers
@app.errorhandler(404)
def not_found_error(error:Exception):
    highlight_io.H.get_instance().record_exception(error)
    logger.warning(f"404 Error: {request.url}")
    return jsonify({"error": "Resource not found"}), 404

@app.errorhandler(500)
def internal_error(error:Exception):
    highlight_io.H.get_instance().record_exception(error)
    logger.error(f"500 Error: {str(error)}", exc_info=True)
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    logger.info(f"Starting Flask server on port 5007")
    app.run(host='0.0.0.0', port=5007)