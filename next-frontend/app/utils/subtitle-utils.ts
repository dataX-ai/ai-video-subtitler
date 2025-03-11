import { TranscriptionSegment } from "../components/VideoUpload";

export type SubtitleStyle = {
  font: string;
  position: { x: number; y: number };
  colors: {
    line1: { text: string; background: string };
    line2: { text: string; background: string };
  };
  fontSize: number;
};

/**
 * Generates an ASS subtitle file content based on segments and styling
 */
export function generateAssContent(
  segments: TranscriptionSegment[],
  style: SubtitleStyle,
  videoWidth: number,
  videoHeight: number
): string {
  // Convert colors from hex to ASS format
  const primaryColor = hexToAssColor(style.colors.line1.text);
  const outlineColor = hexToAssColor(style.colors.line1.background);
  
  let assContent = `[Script Info]
Title: Auto-generated subtitles
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.709
PlayResX: ${videoWidth}
PlayResY: ${videoHeight}

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${style.font},${style.fontSize},&H${primaryColor},&H${outlineColor},&H${outlineColor},&H00000000,-1,0,0,0,100,100,0,0,1,2,0,2,0,${style.position.y},10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  // Add each segment as a dialogue line
  segments.forEach(segment => {
    const startTime = formatAssTime(segment.start);
    const endTime = formatAssTime(segment.end);
    
    // Split text into multiple lines if needed
    const formattedText = splitIntoLines(segment.text);
    
    assContent += `Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${formattedText}\n`;
  });
  
  return assContent;
}

/**
 * Helper function to split text into lines with a maximum character limit
 */
export function splitIntoLines(text: string, maxCharsPerLine: number = 35): string {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach(word => {
    if ((currentLine + ' ' + word).length <= maxCharsPerLine) {
      currentLine = currentLine ? `${currentLine} ${word}` : word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  });
  
  if (currentLine) lines.push(currentLine);
  
  return lines.join('\\N');
}

/**
 * Helper function to convert hex color to ASS format (AABBGGRR)
 */
export function hexToAssColor(hex: string): string {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Parse the hex color
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Convert to ASS format: AABBGGRR (alpha, blue, green, red)
  return `00${b.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${r.toString(16).padStart(2, '0')}`;
}

/**
 * Helper function to format time into ASS format (h:mm:ss.cc)
 */
export function formatAssTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const cs = Math.floor((seconds % 1) * 100);
  
  return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
} 