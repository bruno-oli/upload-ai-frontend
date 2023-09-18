import { Label } from './ui/label'
import { FileVideo, Upload } from 'lucide-react'
import { Separator } from './ui/separator'
import { Textarea } from './ui/textarea'
import { Button } from './ui/button'
import React, { ChangeEvent, FormEvent, useMemo, useRef, useState } from 'react'
import { getFFmpeg } from '@/lib/ffmpeg'
import { fetchFile } from '@ffmpeg/util'
import { api } from '@/lib/axios'

type Status = 'waiting' | 'converting' | 'uploading' | 'generating' | 'success'

const statusMessage = {
  converting: 'Convertendo...',
  uploading: 'Enviando vídeo para o servidor...',
  generating: 'Gerando a transcrição...',
  success: 'Transcrição gerada com sucesso!',
}

interface VideoInputFormProps {
  onVideoUpload: (id: string) => void
}

const VideoInputForm = ({ onVideoUpload }: VideoInputFormProps) => {
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [status, setStatus] = useState<Status>('waiting')

  const promptInputRef = useRef<HTMLTextAreaElement>(null)

  function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const { files } = event.currentTarget

    if (!files) {
      return false
    }

    const selectedFile = files[0]

    setVideoFile(selectedFile)
  }

  async function convertVideoToAudio(video: File) {
    const ffmpeg = await getFFmpeg()

    await ffmpeg.writeFile('input.mp4', await fetchFile(video))

    ffmpeg.on('progress', (progress) => {
      console.log(`Convert Progress: ${Math.round(progress.progress * 100)}%`)
    })

    await ffmpeg.exec([
      '-i',
      'input.mp4',
      '-map',
      '0:a',
      '-b:a',
      '20k',
      '-acodec',
      'libmp3lame',
      'output.mp3',
    ])

    const data = await ffmpeg.readFile('output.mp3')

    const audioFileBlob = new Blob([data], { type: 'audio/mpeg' })
    const audioFile = new File([audioFileBlob], 'audio.mp3', {
      type: 'audio/mpeg',
    })

    console.log('Convert Done!')

    return audioFile
  }

  async function handleUploadVideo(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const prompt = promptInputRef.current?.value

    if (!videoFile) {
      return false
    }

    if (!prompt) {
      return false
    }

    setStatus('converting')

    const audioFile = await convertVideoToAudio(videoFile)

    const data = new FormData()
    data.append('file', audioFile)

    setStatus('uploading')

    const { data: response } = await api.post('/videos', data)

    setStatus('generating')

    await api.post(`/videos/${response.video.id}/transcription`, {
      prompt,
    })

    setStatus('success')

    onVideoUpload(response.video.id)
  }

  const previewURL = useMemo(() => {
    if (!videoFile) {
      return null
    }

    return URL.createObjectURL(videoFile)
  }, [videoFile])

  return (
    <form className="space-y-6" onSubmit={handleUploadVideo}>
      <label
        htmlFor="video"
        className="border relative flex rounded-md aspect-video cursor-pointer border-dashed text-sm flex-col gap-2 items-center justify-center text-muted-foreground hover:bg-primary/5"
      >
        {previewURL ? (
          <video
            src={previewURL}
            controls={false}
            className="pointer-events-none absolute inset-0 max-h-full left-1/2 translate-x-[-50%]"
          />
        ) : (
          <React.Fragment>
            <FileVideo className="w-4 h-4" />
            Selecione um vídeo
          </React.Fragment>
        )}
      </label>

      <input
        className="sr-only"
        type="file"
        id="video"
        accept="video/mp4"
        onChange={handleFileSelected}
      />

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="transcription_prompt">Prompt de transcrição</Label>

        <Textarea
          ref={promptInputRef}
          disabled={status !== 'waiting'}
          id="transcription_prompt"
          className="h-20 leading-relaxed resize-none"
          placeholder="Inclue palavras-chave mencionadas no vídeo separadas por virgula (,)..."
        />
      </div>

      <Button
        data-success={status === 'success'}
        disabled={status !== 'waiting'}
        type="submit"
        className="w-full data-[success=true]:bg-emerald-900"
      >
        {status === 'waiting' ? (
          <React.Fragment>
            Carregar vídeo
            <Upload className="w-4 h-4 ml-2" />
          </React.Fragment>
        ) : (
          statusMessage[status]
        )}
      </Button>
    </form>
  )
}

export { VideoInputForm }
