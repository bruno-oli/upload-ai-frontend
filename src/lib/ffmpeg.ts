import { FFmpeg } from '@ffmpeg/ffmpeg'
import coreURL from '@/ffmpeg/ffmpeg-core?url'
import wasmURL from '@/ffmpeg/ffmpeg-core.wasm?url'
import workerURL from '@/ffmpeg/ffmpeg-worker?url'

let ffmpeg: FFmpeg | null

async function getFFmpeg() {
  if (ffmpeg) {
    return ffmpeg
  }

  ffmpeg = new FFmpeg()

  if (!ffmpeg.loaded) {
    await ffmpeg.load({
      coreURL,
      wasmURL,
      workerURL,
    })
  }

  return ffmpeg
}

export { getFFmpeg }
