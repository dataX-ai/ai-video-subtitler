import { TranscriptionSegment } from "../components/VideoUpload";

export const MAX_SEGMENT_LENGTH = 3; // maximum length in seconds
export const MIN_SEGMENT_LENGTH = 1; // minimum length in seconds

/**
 * Preprocesses segments to ensure no segment is longer than MAX_SEGMENT_LENGTH seconds
 * and no new segment is shorter than MIN_SEGMENT_LENGTH seconds
 * Splits longer segments while preserving word boundaries
 */
export function preprocessSegments(segments: TranscriptionSegment[]): TranscriptionSegment[] {
  const processedSegments: TranscriptionSegment[] = [];
  let nextId = Math.max(...segments.map(s => s.id), 0) + 1;

  segments.forEach(segment => {
    const duration = segment.end - segment.start;
    
    // If segment is within limits or contains only one word, keep it as is
    // Also keep segments that are already shorter than MIN_SEGMENT_LENGTH
    if (duration <= MAX_SEGMENT_LENGTH || !segment.text.includes(' ') || duration < MIN_SEGMENT_LENGTH) {
      processedSegments.push(segment);
      return;
    }

    // Split segment recursively
    const splitSegments = splitSegmentRecursively(segment, nextId);
    processedSegments.push(...splitSegments);
    nextId += splitSegments.length;
  });

  return processedSegments;
}

/**
 * Recursively splits a segment until all resulting segments are within MAX_SEGMENT_LENGTH
 * while ensuring no new segment is shorter than MIN_SEGMENT_LENGTH
 */
function splitSegmentRecursively(segment: TranscriptionSegment, nextId: number): TranscriptionSegment[] {
  const duration = segment.end - segment.start;
  
  if (duration <= MAX_SEGMENT_LENGTH || !segment.text.includes(' ')) {
    return [segment];
  }

  // Find the middle time point
  const midTime = segment.start + duration / 2;

  // Find the middle character position
  const midCharIndex = Math.floor(segment.text.length / 2);

  // Calculate potential segment durations
  const firstSegmentDuration = midTime - segment.start;
  const secondSegmentDuration = segment.end - midTime;

  // If either potential segment would be too short, don't split
  if (firstSegmentDuration < MIN_SEGMENT_LENGTH || secondSegmentDuration < MIN_SEGMENT_LENGTH) {
    return [segment];
  }
  
  // Find the nearest space to split the text
  let splitIndex = midCharIndex;
  let leftSpace = segment.text.lastIndexOf(' ', midCharIndex);
  let rightSpace = segment.text.indexOf(' ', midCharIndex);

  if (leftSpace === -1) leftSpace = 0;
  if (rightSpace === -1) rightSpace = segment.text.length;

  // Choose the closest space to the middle
  if (midCharIndex - leftSpace <= rightSpace - midCharIndex) {
    splitIndex = leftSpace;
  } else {
    splitIndex = rightSpace;
  }


  // Create two new segments
  const segment1: TranscriptionSegment = {
    id: nextId,
    start: segment.start,
    end: midTime,
    text: segment.text.slice(0, splitIndex).trim()
  };

  const segment2: TranscriptionSegment = {
    id: nextId + 1,
    start: midTime,
    end: segment.end,
    text: segment.text.slice(splitIndex).trim()
  };

  // Recursively split each new segment if needed
  return [
    ...splitSegmentRecursively(segment1, nextId),
    ...splitSegmentRecursively(segment2, nextId + 1)
  ];
}

export type SubtitleStyle = {
  font: string;
  position: { y: number };
  colors: {
    line1: { text: string; background: string };
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
  
  // Convert y position from percentage to pixels
  const yPositionInPixels = Math.round((style.position.y / 100) * videoHeight);

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
Style: Default,${style.font},${style.fontSize},&H${primaryColor},&H${outlineColor},&H${outlineColor},&H00000000,-1,0,0,0,100,100,0,0,1,2,0,2,0,0,${yPositionInPixels},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  // Add each segment as a dialogue line
  segments.forEach(segment => {
    const startTime = formatAssTime(segment.start);
    const endTime = formatAssTime(segment.end);
    
    // Split text into multiple lines if needed
    const formattedText = splitIntoLines(segment.text, style.font, style.fontSize, videoWidth);
    
    assContent += `Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${formattedText}\n`;
  });
  
  return assContent;
}

// Helper function to estimate max characters per line based on font metrics
function calculateMaxCharsPerLine(font: string, fontSize: number, videoWidth: number): number {
  // Average character width multiplier based on font family
  const fontWidthMultipliers: { [key: string]: number } = {
    'NotoSans': 0.58,  // Slightly more compact than Arial
    'Arial': 0.60,     // Standard reference point
    'Roboto': 0.57,    // More space-efficient design
  };

  // Default multiplier if font not found (using Arial's multiplier as default)
  const defaultMultiplier = 0.60;
  
  // Get the multiplier for the current font, or use default
  const multiplier = fontWidthMultipliers[font] || defaultMultiplier;
  
  // Calculate approximate pixels per character
  const pixelsPerChar = fontSize * multiplier;
  
  // Use 80% of video width to leave margins
  const usableWidth = videoWidth * 0.8;
  
  // Calculate max chars that can fit in the usable width
  const maxChars = Math.floor(usableWidth / pixelsPerChar);
  
  // Ensure reasonable bounds (between 20 and 80 characters)
  return Math.min(Math.max(maxChars, 20), 80);
}

function splitIntoLines(text: string, font: string, fontSize: number, videoWidth: number): string {
  const maxCharsPerLine = calculateMaxCharsPerLine(font, fontSize, videoWidth);
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