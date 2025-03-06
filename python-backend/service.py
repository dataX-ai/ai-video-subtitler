import os
import unicodedata
import math
import numpy as np
import re
from mutagen.mp3 import MP3
from moviepy import *
from moviepy.video.tools.subtitles import SubtitlesClip
from moviepy.tools import convert_to_seconds
from PIL import ImageFont, ImageDraw, Image
# from .language_mapper import db_language_code_dict
from data_utils import handle_number_preprocessing
from language_mapper import get_bcp_47_lang_code
import random
from google.cloud import storage
import requests
import mutagen
from rich.console import Console
from logger_config import setup_logger

console = Console()
logger = setup_logger(__name__)


# config = configparser.ConfigParser()
# config.read('.config')

ENCODING = 'utf-8'
SPACE_SYLLABEL = 'SPACE'

class SubtitleService():
    def __init__(self, gcs_bucket_name:str = "2vid-temp-video-bckt"):

        if os.environ.get('GOOGLE_APPLICATION_CREDENTIALS'):
            # Use the credentials file specified in environment variable
            self.storage_client = storage.Client()
        elif os.path.exists('./service-account.json'):
            # Fallback to the hardcoded path for backward compatibility
            self.storage_client = storage.Client.from_service_account_json('./valid-flow-446606-m2-212ba29fbb71.json')
        else:
            console.print("[yellow]Warning: No explicit credentials provided, using default authentication[/yellow]")
            self.storage_client = storage.Client()
            
        self.bucket_name = gcs_bucket_name
        self.bucket = self.storage_client.bucket(gcs_bucket_name)
        pass

    def save_audio_and_video(self,video_url:str,audio_url:str,id:str):
        logger.info(f"Saving audio and video for ID: {id}")
        response = requests.get(video_url, stream=True)  # Add stream=True for better handling of large files
        # if there is no output folder then create
        os.makedirs('./output', exist_ok=True)
        video_file_path = f'./output/final_video_{id}.mp4'
        audio_file_path = f'./output/final_audio_{id}.mp3'
        if response.status_code == 200:
            with open(video_file_path, 'wb') as video_file:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        video_file.write(chunk)
            logger.info(f"Successfully saved video to {video_file_path}")
        else:
            logger.error(f"Failed to download video. Status code: {response.status_code}")

        response = requests.get(audio_url, stream=True)  # Add stream=True for better handling of large files
        if response.status_code == 200:
            with open(audio_file_path, 'wb') as audio_file:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        audio_file.write(chunk)
            logger.info(f"Successfully saved audio to {audio_file_path}")
        else:
            logger.error(f"Failed to download audio. Status code: {response.status_code}")

        return video_file_path, audio_file_path
    
    def get_audio_length_in_sec(self,audio_filepath):
        logger.info(f"Attempting to read audio file: {audio_filepath}")
        try:
            # First verify the file exists
            if not os.path.exists(audio_filepath):
                raise FileNotFoundError(f"Audio file not found at {audio_filepath}")
                
            # Try to read as MP3
            audio = MP3(audio_filepath)
            return audio.info.length
        except mutagen.mp3.HeaderNotFoundError:
            logger.warning("Warning: File is not a valid MP3 file. Trying alternative method...")
            try:
                # Try using moviepy as fallback
                from moviepy import AudioFileClip
                audio = AudioFileClip(audio_filepath)
                duration = audio.duration
                audio.close()
                return duration
            except Exception as e:
                logger.error(f"Could not determine audio length. Error: {str(e)}")
                raise


    def generate_subtitles(self,script:str,audio_path:str,video_file_path:str,output_file_path:str,language:str='English',subtitle_style=None)->str:
        logger.info(f"Generating subtitles for language: {language}")
        translated_message = script
        original_message = translated_message.encode(ENCODING).decode(ENCODING)

        decoded_message, change_list = handle_number_preprocessing(original_message, language, delimeter='-')

        syllabel_list = list(map(lambda x: unicodedata.name(x,u' '), decoded_message))
        word_count = original_message.split(' ')
        syllabel_count = len(syllabel_list)
        if syllabel_list[-1] != SPACE_SYLLABEL:
            syllabel_list.append(SPACE_SYLLABEL)
        audio_length = self.get_audio_length_in_sec(audio_filepath=audio_path)*1000 #change here
        
        syllabel_time_length = audio_length/syllabel_count

        idx = 0
        word_timestamp_map = []
        start = 0
        end = 0
        for syl in syllabel_list:
            if syl == SPACE_SYLLABEL:
                word_timestamp_map.append([word_count[idx], start, end])
                idx += 1
                start = end
            end += syllabel_time_length

        srt_str = ''
        idx = 1
        line = ''

        for i, itm in enumerate(word_timestamp_map):
            line = line + ' ' + itm[0]
            if i > 0 and (i+1) % 4 == 0:
                srt_str += str(idx) + '\n'
                idx += 1
                srt_str += "00:00:" + "{:02}".format(math.floor(word_timestamp_map[i-3][1]/1000)) + "," + "{:03}".format(
                    math.floor(word_timestamp_map[i-3][1] % 1000))
                srt_str += ' --> '
                srt_str += "00:00:" + "{:02}".format(math.floor(word_timestamp_map[i][2]/1000)) + "," + "{:03}".format(
                    math.floor(word_timestamp_map[i][2] % 1000))
                srt_str += '\n'
                srt_str += line + '\n\n'
                line = ''
            elif i == len(word_timestamp_map)-1:
                srt_str += str(idx) + '\n'
                idx += 1
                start_word_index = len(word_timestamp_map) - (i+1) % 4
                srt_str += "00:00:" + "{:02}".format(math.floor(word_timestamp_map[start_word_index][1]/1000)) + "," + "{:03}".format(
                    math.floor(word_timestamp_map[start_word_index][1] % 1000))
                srt_str += ' --> '
                srt_str += "00:00:" + "{:02}".format(math.floor(word_timestamp_map[i][2]/1000)) + "," + "{:03}".format(
                    math.floor(word_timestamp_map[i][2] % 1000))
                srt_str += '\n'
                srt_str += line + '\n\n'
                line = ''

        subtitle_file = os.path.join('./video.srt')
        f = open(subtitle_file, 'w', encoding=ENCODING)
        f.write(srt_str)
        f.close()
        logger.debug(f"Generated subtitle file at: {subtitle_file}")
        logger.info("[bold blue]Burning Subtitles to Video[/bold blue]")

        video_file_path = os.path.join(video_file_path)
        output_file_path = os.path.join(output_file_path)
        self.burn_subtitle_to_video(video_file_path, subtitle_file,
                            output_file_path, language,subtitle_style)
        
        return output_file_path


    def file_to_subtitles(self,filename, encoding=None):
        """ Converts a srt file into subtitles.

        The returned list is of the form ``[((ta,tb),'some text'),...]``
        and can be fed to SubtitlesClip.

        Only works for '.srt' format for the moment.
        """

        times_texts = []
        current_times = None
        current_text = ""
        with open(filename, "r", encoding=encoding) as f:
            for line in f:
                times = re.findall("([0-9]*:[0-9]*:[0-9]*,[0-9]*)", line)
                if times:
                    current_times = [convert_to_seconds(t) for t in times] #changed this from cvsecs to convert_to_seconds
                elif line.strip() == "":
                    if current_times is not None:
                        times_texts.append((current_times, current_text.strip("\n")))
                    current_times, current_text = None, ""
                elif current_times:
                    current_text += line
        return times_texts

    def get_font_file(self,language:str, font: str = None):
        # Check if language directory exists
        lang_dir = f'./fonts/{language}'
        if not os.path.exists(lang_dir):
            logger.warning(f"Font directory for language {language} not found, using NotoSans_Black as default")
            return './fonts/{language}/NotoSans_Black.ttf'
        
        # If font is specified, check if it exists
        if font:
            # Get list of font files in language directory
            font_files = os.listdir(lang_dir)
            
            # Search for font name in available files
            for file_name in font_files:
                if font.lower() in file_name.lower():
                    logger.debug(f"Found matching font file: {file_name}")
                    return os.path.join(lang_dir, file_name)
                    
            logger.warning(f"Font {font} not found in {lang_dir}, using NotoSans_Black as default")
            
        else:
            return './fonts/{language}/NotoSans_Black.ttf'
        
        return './fonts/{language}/NotoSans_Black.ttf'
    
    def hex_to_rgba(self, hex_color: str, alpha: int = 1):
        """Convert hex color string to RGBA tuple."""
        hex_color = hex_color.lstrip('#')
        r = int(hex_color[0:2], 16)
        g = int(hex_color[2:4], 16)
        b = int(hex_color[4:6], 16)
        return (r, g, b, alpha)

    def burn_subtitle_to_video(self,video_file_path, subtitle_file_path, output_file_path, language,subtitle_style=None):

        def pipeline(frame):
            try:
                img_pil = Image.fromarray(frame)
                draw = ImageDraw.Draw(img_pil)

                text = str(next(subs_by_frame)[1])

                words = text.split(' ')
                line1 = ' '.join(word for word in words[:math.ceil(len(words)/2)])
                line2 = ''
                if math.ceil(len(words)/2) < len(words):
                    line2 = ' '.join(word for word in words[math.ceil(len(words)/2):])

                #font
                font = subtitle_style.font if subtitle_style and subtitle_style.font else None
                fontpath = self.get_font_file(language, font)
                text_font = ImageFont.truetype(fontpath, font_size, encoding=ENCODING)

                # padding
                horizontal_pad = 20
                vertical_pad = 10

                # size
                radius = 20
                line1_size = text_font.getsize(line1)
                img_width, img_height = img_pil.size

                rect1_size = [2*horizontal_pad + line1_size[0],
                            2*vertical_pad + line1_size[1]]

                line2_size = text_font.getsize(line2)
                rect2_size = [2*horizontal_pad + line2_size[0],
                            2*vertical_pad + line2_size[1]]
                font_reduction = 5
                while rect1_size[0] > img_width or rect2_size[0] > img_width:
                    text_font = ImageFont.truetype(fontpath, font_size - font_reduction, encoding=ENCODING)

                    line1_size = text_font.getsize(line1)
                    img_width, img_height = img_pil.size

                    rect1_size = [2*horizontal_pad + line1_size[0],
                                2*vertical_pad + line1_size[1]]

                    line2_size = text_font.getsize(line2)
                    rect2_size = [2*horizontal_pad + line2_size[0],
                                2*vertical_pad + line2_size[1]]
                    font_reduction+=5

                # starting locations
                if subtitle_style and subtitle_style.position:
                    rect1_start = (
                        int((img_width-rect1_size[0])/2), 
                        int(img_height * subtitle_style.position.y))
                else:
                    rect1_start = (
                        int((img_width-rect1_size[0])/2), int(img_height*0.9)
                        )
                line1_start = (rect1_start[0]+horizontal_pad,
                            rect1_start[1]+vertical_pad)

                rect2_start = (int((img_width - rect2_size[0])/2) , int(rect1_start[1]+rect1_size[1]))
                line2_start = ( rect2_start[0]+horizontal_pad, rect2_start[1]+vertical_pad )

                # end_location
                rect1_end = (rect1_start[0] + rect1_size[0],
                            rect1_start[1] + rect1_size[1])
                rect2_end = (rect2_start[0] + rect2_size[0],
                            rect2_start[1] + rect2_size[1])


                # color
                # Use custom colors if provided
                if subtitle_style and subtitle_style.colors:
                    if subtitle_style.colors.line1:
                        rect1_color = self.hex_to_rgba(subtitle_style.colors.line1.background)
                        line1_color = self.hex_to_rgba(subtitle_style.colors.line1.text)
                    else:
                        rect1_color = (255, 255, 255, 1)
                        line1_color = (141, 0, 230, 1)

                    if subtitle_style.colors.line2:
                        rect2_color = self.hex_to_rgba(subtitle_style.colors.line2.background)
                        line2_color = self.hex_to_rgba(subtitle_style.colors.line2.text)
                    else:
                        rect2_color = (141, 0, 230, 1)
                        line2_color = (255, 255, 255, 1)
                else:
                    rect1_color = (255, 255, 255, 1)
                    line1_color = (141, 0, 230, 1)
                    rect2_color = (141, 0, 230, 1)
                    line2_color = (255, 255, 255, 1)

                draw.rounded_rectangle([rect1_start, rect1_end], radius,fill=rect1_color)
                draw.text(line1_start, line1, font=text_font, fill=line1_color,
                        language=get_bcp_47_lang_code(language))

                if len(line2) > 0:
                    draw.rounded_rectangle([rect2_start, rect2_end], radius, fill=rect2_color)
                    draw.text(line2_start, line2, font=text_font, fill=line2_color,
                            language=get_bcp_47_lang_code(language))

                frame = np.array(img_pil)
            except StopIteration:
                pass
            # additional frame manipulation
            return frame

        subtitles = self.file_to_subtitles(subtitle_file_path, encoding=ENCODING)
        print(subtitles)
        video = VideoFileClip(video_file_path)

        fps = video.fps
        duration = math.ceil(video.duration)
        total_frames = math.ceil(duration*fps)

        subs_by_frame = []

        subtitle_index = 0
        for i in range(total_frames):
            if float((i+1)/total_frames) <= subtitles[subtitle_index][0][1]/duration:
                subs_by_frame.append((i, subtitles[subtitle_index][1]))
            else:
                subtitle_index += 1
                subtitle_index = min(subtitle_index, len(subtitles)-1)
                subs_by_frame.append((i, subtitles[subtitle_index][1]))

        # Get font size from subtitle_style if it exists, otherwise use default
        # Font size in points (pt). 50pt ≈ 67px at standard screen resolution
        font_size = int(subtitle_style.size*10*3/4) if subtitle_style and subtitle_style.size else 50
        subs_by_frame = iter(subs_by_frame)

        # result = video.fl_image(pipeline)
        result = video.image_transform(pipeline)

        random_hash = str(random.getrandbits(128))
        result.write_videofile(output_file_path, fps=video.fps, temp_audiofile=f"{random_hash}temp-audio.m4a",
                            remove_temp=True, codec="libx264", audio_codec="aac")
        return output_file_path
        
    def upload_to_gcs(self, video_file: str, filename: str) -> str:
        """
        Upload audio data to Google Cloud Storage.
        
        Args:
            audio_file: The local audio file path
            filename: The desired filename in GCS
            
        Returns:
            The public URL of the uploaded file
        """
        # Upload directly from the local file path to GCS
        blob = self.bucket.blob(filename)
        blob.upload_from_filename(video_file)

        return f"https://storage.googleapis.com/{self.bucket_name}/{filename}"
    
    def cleanup_output_directory(self):
        """
        Cleans up all files in the output directory.
        """
        output_dir = './output'
        if os.path.exists(output_dir):
            for filename in os.listdir(output_dir):
                file_path = os.path.join(output_dir, filename)
                try:
                    if os.path.isfile(file_path):
                        os.unlink(file_path)
                except Exception as e:
                    logger.error(f"Error deleting {file_path}: {e}")
            logger.info("✓ Output directory cleaned successfully")
        else:
            logger.warning("Output directory does not exist")

