/**
 * Type definitions for @ffmpeg-installer/ffmpeg and @ffprobe-installer/ffprobe
 */

declare module "@ffmpeg-installer/ffmpeg" {
  interface FFmpegInstaller {
    path: string;
    version: string;
    url: string;
  }

  const ffmpegInstaller: FFmpegInstaller;
  export default ffmpegInstaller;
}

declare module "@ffprobe-installer/ffprobe" {
  interface FFprobeInstaller {
    path: string;
    version: string;
    url: string;
  }

  const ffprobeInstaller: FFprobeInstaller;
  export default ffprobeInstaller;
}
