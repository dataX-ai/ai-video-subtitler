declare module 'libass-wasm' {
  export default class SubtitlesOctopus {
    constructor(options: {
      video: HTMLVideoElement;
      subUrl?: string;
      subContent?: string;
      fonts?: string[];
      workerUrl: string;
      legacyWorkerUrl?: string;
      canvas: HTMLCanvasElement;
      onReady?: () => void;
      onError?: (error: any) => void;
      debug?: boolean;
    });
    
    dispose(): void;
    setTrackByUrl(url: string): void;
    setTrack(content: string): void;
    freeTrack(): void;
    setCurrentTime(time: number): void;
  }
} 