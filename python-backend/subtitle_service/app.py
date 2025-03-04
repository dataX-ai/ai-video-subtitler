from flask import Flask, request, jsonify
import sys
import os
root_path = os.path.dirname(os.path.dirname(__file__))  # Remove one dirname call
sys.path.append(root_path)
from common.config import SERVICE_PORTS
from common.rabbitmq_utils import RabbitMQClient
from service import SubtitleService
from uuid import UUID, uuid4
from pydantic import BaseModel, Field, HttpUrl
from typing import Optional



app = Flask(__name__)
# rabbitmq = RabbitMQClient()
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

class SubtitleRequest(BaseModel):
    video_url: HttpUrl
    audio_url: HttpUrl
    script: str
    id: Optional[UUID] = Field(default_factory=uuid4)
    subtitle_style: Optional[SubtitleStyle] = None

@app.route('/subtitle', methods=['POST'])
def process_script():
    data = SubtitleRequest(**request.json)
    print(data)
    
    video_file_path, audio_file_path = service.save_audio_and_video(
        video_url=str(data.video_url),
        audio_url=str(data.audio_url),
        id=data.id
    )
    output_video_file_path = service.generate_subtitles(
        script=data.script,
        audio_path=audio_file_path,
        video_file_path=video_file_path,
        output_file_path=f'./output/final_vid_with_subtitle_{data.id}.mp4',
        subtitle_style=data.subtitle_style
    )
    final_video_link = service.upload_to_gcs(
        video_file=output_video_file_path,
        filename=f'final_output_video_with_sub_{data.id}.mp4'
    )

    service.cleanup_output_directory()
    return jsonify({"video_link": final_video_link})
    
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=SERVICE_PORTS['subtitle'])