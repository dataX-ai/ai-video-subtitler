import { TranscriptionSegment } from "../components/VideoUpload";
import opentype from 'opentype.js';
import fs from 'fs';
import path from 'path';
export const MAX_SEGMENT_LENGTH = 3; // maximum length in seconds
export const MIN_SEGMENT_LENGTH = 1; // minimum length in seconds


// utils/measureText.js


export async function measureText(text:string, fontSize:number, fontName:string) {
  try {
    let font;
    
    // We should only be using client-side approach in the browser
    if (typeof window === 'undefined') {
      // Server-side: use filesystem
      const fontPath = path.join(process.cwd(), 'public', 'js', 'libass', `${fontName}.ttf`);
      font = opentype.loadSync(fontPath);
    } else {
      // Client-side: use URL
      font = await opentype.load(`/js/libass/${fontName || 'Arial'}.ttf`);
    }
    
    return font.getAdvanceWidth(text, fontSize);
  } catch (error) {
    console.error('Error measuring text:', error);
    // Return a fallback estimate when measurement fails
    return text.length * fontSize * 0.6; 
  }
}

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
export async function generateAssContent(
  segments: TranscriptionSegment[],
  style: SubtitleStyle,
  videoWidth: number,
  videoHeight: number
): Promise<string> {
  const startTime = performance.now();
  
  // Convert colors from hex to ASS format
  const primaryColor = hexToAssColor(style.colors.line1.text);
  const backgroundColor = hexToAssColor(style.colors.line1.background);
  
  // Fix vertical positioning - invert the calculation if needed
  // If position.y = 0 should be bottom and 100 should be top
  const yPositionInPixels = Math.round(((100 - style.position.y) / 100) * videoHeight);

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
Style: Default,${style.font},${style.fontSize},&H${primaryColor},&H000000FF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,0,0,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  // Add each segment as a dialogue line with custom drawn rounded box
  let currLayer = 0;
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const startTime = formatAssTime(segment.start);
    const endTime = formatAssTime(segment.end);
    
    // Get text and estimate its width to set appropriate box dimensions
    const cleanText = segment.text.replace(/\n/g, ' ');
    const lines = splitIntoLines(cleanText, style.font, style.fontSize, videoWidth);

    const boxHeight = Math.round(style.fontSize * 1.2); // Height based on font size
    const cornerRadius = Math.min(20, boxHeight / 4);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const bgLayer = currLayer;
      currLayer++;
      const textLayer = currLayer;
      currLayer++;

      // Apply darkening to the original hex color, then convert to ASS format
      const darkPercentage = i * 30; // 5% darker for each line
      const darkenedHex = i === 0 ? style.colors.line1.background : darkenHexColor(style.colors.line1.background, darkPercentage);
      const bgColor = hexToAssColor(darkenedHex);
      
      const txtWidth = typeof window === 'undefined' 
        ? await measureText(line, style.fontSize, style.font)
        : await measureText(line, style.fontSize, style.font);
      const boxWidth = Math.round(txtWidth);
      const bgPosX = Math.round(videoWidth/2 + boxWidth/2);
      const bgPosY = Math.round(yPositionInPixels + (( i + 0.5) * boxHeight) - (boxHeight * (lines.length - 0.5)));
      
      const textPosX = Math.round(videoWidth/2);
      const textPosY = Math.round(yPositionInPixels + (i * style.fontSize * 1.2) - (boxHeight * (lines.length - 0.5)));

      assContent += `Dialogue: ${bgLayer},${startTime},${endTime},Default,,0,0,0,,{\\an5\\pos(${bgPosX},${bgPosY})\\p1\\bord0\\shad0\\c&H${bgColor}&\\3c&H${bgColor}&}m ${-boxWidth/2} ${-boxHeight/2 + cornerRadius} b ${-boxWidth/2} ${-boxHeight/2} ${-boxWidth/2 + cornerRadius} ${-boxHeight/2} ${-boxWidth/2 + cornerRadius} ${-boxHeight/2} l ${boxWidth/2 - cornerRadius} ${-boxHeight/2} b ${boxWidth/2} ${-boxHeight/2} ${boxWidth/2} ${-boxHeight/2 + cornerRadius} ${boxWidth/2} ${-boxHeight/2 + cornerRadius} l ${boxWidth/2} ${boxHeight/2 - cornerRadius} b ${boxWidth/2} ${boxHeight/2} ${boxWidth/2 - cornerRadius} ${boxHeight/2} ${boxWidth/2 - cornerRadius} ${boxHeight/2} l ${-boxWidth/2 + cornerRadius} ${boxHeight/2} b ${-boxWidth/2} ${boxHeight/2} ${-boxWidth/2} ${boxHeight/2 - cornerRadius} ${-boxWidth/2} ${boxHeight/2 - cornerRadius} l ${-boxWidth/2} ${-boxHeight/2 + cornerRadius}{\\p0}\n`;
      assContent += `Dialogue: ${textLayer},${startTime},${endTime},Default,,0,0,0,,{\\an5\\pos(${textPosX},${textPosY})}${lines[i]}\n`;
      
    }

    // Box dimensions and roundness
    const boxWidth = Math.round(Math.min(cleanText.length * style.fontSize * 0.8)/ 2);  // Half width since position is center
    const boxPosX = videoWidth/2 + boxWidth/2;
    const boxPosY = yPositionInPixels + boxHeight/2;
 // Rounded corner radius
    
    // Layer 0: Draw the centered rounded box
    // Using \an5 (center alignment) to ensure box is centered properly
    //  assContent += `Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,{\\an5\\pos(${boxPosX},${boxPosY})\\p1\\bord0\\shad0\\c&H${backgroundColor}&\\3c&H${backgroundColor}&}m ${-boxWidth/2} ${-boxHeight/2 + cornerRadius} b ${-boxWidth/2} ${-boxHeight/2} ${-boxWidth/2 + cornerRadius} ${-boxHeight/2} ${-boxWidth/2 + cornerRadius} ${-boxHeight/2} l ${boxWidth/2 - cornerRadius} ${-boxHeight/2} b ${boxWidth/2} ${-boxHeight/2} ${boxWidth/2} ${-boxHeight/2 + cornerRadius} ${boxWidth/2} ${-boxHeight/2 + cornerRadius} l ${boxWidth/2} ${boxHeight/2 - cornerRadius} b ${boxWidth/2} ${boxHeight/2} ${boxWidth/2 - cornerRadius} ${boxHeight/2} ${boxWidth/2 - cornerRadius} ${boxHeight/2} l ${-boxWidth/2 + cornerRadius} ${boxHeight/2} b ${-boxWidth/2} ${boxHeight/2} ${-boxWidth/2} ${boxHeight/2 - cornerRadius} ${-boxWidth/2} ${boxHeight/2 - cornerRadius} l ${-boxWidth/2} ${-boxHeight/2 + cornerRadius}{\\p0}\n`;
    
    // Layer 1: The actual text using the same centering
    
  };
  
  const endTime = performance.now();
  const elapsedTime = endTime - startTime;
  console.log(`generateAssContent execution time: ${elapsedTime.toFixed(2)}ms`);
  
  return assContent;
}

// Helper function to estimate max characters per line based on font metrics
function calculateMaxCharsPerLine(font: string, fontSize: number, videoWidth: number): number {
  // Average character width multiplier based on font family
  const fontWidthMultipliers: { [key: string]: number } = {
    'NotoSans': 0.7,  // Slightly more compact than Arial
    'Arial': 0.7,     // Standard reference point
    'Roboto': 0.7,    // More space-efficient design
  };

  // Default multiplier if font not found (using Arial's multiplier as default)
  const defaultMultiplier = 0.70;
  
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

function splitIntoLines(text: string, font: string, fontSize: number, videoWidth: number): string[] {
  const maxCharsPerLine = calculateMaxCharsPerLine(font, fontSize, videoWidth);
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  const maxLines = 2;
  
  // Process words until we've filled our maximum number of lines
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    
    // If we can add this word to current line without exceeding max chars
    if ((currentLine + ' ' + word).length <= maxCharsPerLine || currentLine === '') {
      currentLine = currentLine ? `${currentLine} ${word}` : word;
    } else {
      // We need to start a new line
      lines.push(currentLine);
      
      // If we've already used our max lines, combine all remaining words on this line
      if (lines.length >= maxLines - 1) {
        const remainingWords = words.slice(i);
        currentLine = remainingWords.join(' ');
        
        // If the combined remaining text is too long, truncate with ellipsis
        if (currentLine.length > maxCharsPerLine * 1.5) {
          currentLine = currentLine.substring(0, maxCharsPerLine * 1.5 - 3) + '...';
        }
        
        break; // Exit the loop as we've used all available lines
      } else {
        // Start a new line with the current word
        currentLine = word;
      }
    }
  }
  
  // Add the final line if not empty
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
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

/**
 * Darkens a hex color by a specified percentage
 * @param hexColor The hex color to darken (with or without #)
 * @param percentage The percentage to darken by (0-100)
 * @returns A darker hex color
 */
function darkenHexColor(hexColor: string, percentage: number): string {
  // Remove # if present
  hexColor = hexColor.replace('#', '');
  
  // Parse the RGB components
  const r = parseInt(hexColor.substr(0, 2), 16);
  const g = parseInt(hexColor.substr(2, 2), 16);
  const b = parseInt(hexColor.substr(4, 2), 16);
  
  // Calculate darkened values
  const darkenFactor = 1 - (percentage / 100);
  const newR = Math.max(0, Math.floor(r * darkenFactor));
  const newG = Math.max(0, Math.floor(g * darkenFactor));
  const newB = Math.max(0, Math.floor(b * darkenFactor));
  
  // Convert back to hex
  return `${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
} 