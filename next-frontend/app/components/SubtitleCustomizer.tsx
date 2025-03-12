import React from "react";
import { ChromePicker } from "react-color";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPalette,
  faFont,
  faGripLines,
  faTextHeight,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import type {
  SubtitleColors,
  SubtitleFont,
  SubtitlePosition,
} from "./VideoUpload";
import { Slider } from "@/components/ui/slider"

interface SubtitleCustomizerProps {
  subtitleColors: SubtitleColors;
  subtitleFont: SubtitleFont;
  subtitlePosition: SubtitlePosition;
  onColorChange: (color: any, type: string) => void;
  onFontChange: (font: SubtitleFont) => void;
  onPositionChange: (position: SubtitlePosition) => void;
}

export default function SubtitleCustomizer({
  subtitleColors,
  subtitleFont,
  subtitlePosition,
  onColorChange,
  onFontChange,
  onPositionChange,
}: SubtitleCustomizerProps) {
  const [activeColorPicker, setActiveColorPicker] = React.useState<
    string | null
  >(null);

  return (
    <div className="bg-gradient-to-b from-gray-900/90 to-gray-950/90 backdrop-blur-sm rounded-lg border border-indigo-800/20 p-5">
      <div className="space-y-5">
        {/* Color Settings */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <FontAwesomeIcon icon={faPalette} className="text-indigo-400" />
            <h3 className="text-sm font-medium text-gray-300">
              Color Settings
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Line 1 Colors */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveColorPicker("line1-text")}
                  className="flex-1 h-8 rounded-lg border border-gray-700 flex items-center justify-center hover:border-indigo-500 transition-colors relative overflow-hidden"
                  style={{ backgroundColor: subtitleColors.line1.text }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/10"></div>
                  <span className="text-[10px] sm:text-xs font-medium bg-gray-900/80 px-1.5 sm:px-2 py-0.5 rounded text-white relative z-10 truncate max-w-[90%]">
                    Text
                  </span>
                </button>
                <button
                  onClick={() => setActiveColorPicker("line1-bg")}
                  className="flex-1 h-8 rounded-lg border border-gray-700 flex items-center justify-center hover:border-indigo-500 transition-colors relative overflow-hidden"
                  style={{ backgroundColor: subtitleColors.line1.background }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/10"></div>
                  <span className="text-[10px] sm:text-xs font-medium bg-gray-900/80 px-1.5 sm:px-2 py-0.5 rounded text-white relative z-10 truncate max-w-[90%]">
                    BG
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Font Settings */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <FontAwesomeIcon icon={faFont} className="text-indigo-400" />
            <h3 className="text-sm font-medium text-gray-300">Font Family</h3>
          </div>
          <select
            value={subtitleFont}
            onChange={(e) => onFontChange(e.target.value as SubtitleFont)}
            className="w-full bg-gray-800 text-gray-300 text-sm rounded-lg border border-gray-700 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer"
          >
            <option value="Arial">Arial</option>
            <option value="NotoSans">NotoSans</option>
            <option value="Roboto">Roboto</option>
          </select>
        </div>

        {/* Position Settings */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <FontAwesomeIcon icon={faGripLines} className="text-indigo-400" />
            <h3 className="text-sm font-medium text-gray-300">Position</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-grow">
                <Slider
                  defaultValue={[subtitlePosition.y]}
                  min={0}
                  max={100}
                  step={1}
                  onValueCommit={(values) => onPositionChange({ y: values[0] })}
                  className="w-full custom-slider"
                />
              </div>
              <span className="text-sm text-gray-300 min-w-[60px]">
                {subtitlePosition.y}%
              </span>
            </div>
            <p className="text-xs text-gray-400 bg-gray-800/80 p-2 rounded-lg border border-gray-700/50">
              Use the slider to adjust the vertical position of subtitles. Negative values move up, positive values move down.
            </p>
          </div>
        </div>
      </div>

      {/* Color Picker Popup */}
      {activeColorPicker && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setActiveColorPicker(null)}
          />
          <div className="relative bg-gradient-to-b from-gray-900 to-gray-950 p-5 rounded-xl shadow-2xl max-w-full border border-indigo-800/30">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-medium">
                {activeColorPicker.includes("text") ? "Text" : "Background"} Color
              </h3>
              <button
                onClick={() => setActiveColorPicker(null)}
                className="text-gray-400 hover:text-white"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <ChromePicker
              color={
                activeColorPicker.includes("text")
                  ? subtitleColors.line1.text
                  : subtitleColors.line1.background
              }
              onChange={(color) => onColorChange(color, activeColorPicker)}
              disableAlpha={true}
            />
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setActiveColorPicker(null)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                Apply Color
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-slider [data-orientation="horizontal"] {
          height: 4px;
          width: 100%;
          background: #374151;
          border-radius: 9999px;
        }
        
        .custom-slider [role="slider"] {
          display: block;
          width: 20px;
          height: 20px;
          background-color: white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          border-radius: 9999px;
          cursor: pointer;
        }

        .custom-slider [data-orientation="horizontal"] > span {
          height: 100%;
          background: linear-gradient(90deg, #6366f1, #8b5cf6);
          border-radius: 9999px;
        }
      `}</style>
    </div>
  );
}
