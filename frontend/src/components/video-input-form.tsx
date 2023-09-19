import { FileVideo, Upload } from "lucide-react";
import { Separator } from "./ui/separator";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import { getFFmpeg } from "@/lib/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { api } from "@/lib/axios";

type Status = 'waiting' | 'converting' | 'uploading' | 'generating' | 'success';

const statusMessage = {
  waiting: 'Carregar vídeo',
  converting: 'Convertendo...',
  uploading: 'Carregando...',
  generating: 'Transcrevendo...',
  success: 'Sucesso!'
};

export function VideoInputForm() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>('waiting');

  const promptInputRef= useRef<HTMLTextAreaElement>(null);

  function handleSelectVideo(event: ChangeEvent<HTMLInputElement>) {
    const { files } = event.currentTarget;
    
    if (!files) {
      return;
    }

    const selectedFile = files[0];
    setVideoFile(selectedFile);

    setStatus('waiting');
  }

  async function convertVideoToAudio(video: File) {
    console.log('Convert started!');

    const ffmpeg = await getFFmpeg();

    await ffmpeg.writeFile('input.mp4', await fetchFile(video));

    ffmpeg.on('progress', progress => console.log(`Convert progress: ${Math.round(progress.progress * 100)} %`));

    await ffmpeg.exec([
      '-i',
      'input.mp4',
      '-map',
      '0:a',
      '-b:a',
      '20k',
      '-acodec',
      'libmp3lame',
      'output.mp3'
    ]);

    const data = await ffmpeg.readFile('output.mp3');
    const audioFileBlob = new Blob([data], { type: 'audio/mpeg' });
    const audioFile = new File([audioFileBlob], 'audio.mp3', { type: 'audio/mpeg' });

    console.log('Convert finished!');
    return audioFile;
  }

  async function handleUploadVideo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!videoFile) {
      return;
    }

    setStatus('converting');
    const audioFile = await convertVideoToAudio(videoFile);
    
    const data = new FormData();
    data.append('/videos', audioFile);

    setStatus('uploading');
    const response = await api.post('/videos', data);

    const videoId = response.data.video.id;
    const prompt = promptInputRef.current?.value;

    setStatus('generating');
    await api.post(`/videos/${videoId}/transcription`, { prompt });

    setStatus('success');
  }

  const previewURL = useMemo( () => {
    if (!videoFile) {
      return null;
    }

    return URL.createObjectURL(videoFile);
  }, [videoFile]);

  return (
    <form onSubmit={handleUploadVideo} className="space-y-6">
      <label 
        htmlFor="video"
        className="relative border flex rounded-md aspect-video cursor-pointer border-dashed text-sm justify-center items-center flex-col text-muted-foreground gap-2 hover:bg-primary/10"
      >
        { previewURL ? (
          <video src={previewURL} controls={false} className="points-events-none absolute insert-0" />
        ) : (
          <>
            <FileVideo />
            Selecione um vídeo
          </>
        ) }
      </label>

      <input type="file" id="video" accept="video/mp4" className="sr-only" onChange={handleSelectVideo} />

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="transcription_prompt">Prompt de transcrição</Label>

        <Textarea 
          ref={promptInputRef}
          id="transcription_prompt"
          className="h-20 leading-relaxed resize-none"
          placeholder="Inclua palavras-chaves mencionadas no vídeo separadas por vírgula (,)"
          disabled={status !== 'waiting'}
        />

        <Button 
          type="submit" 
          className="w-full data-[success=true]:bg-emerald-600" 
          disabled={status !== 'waiting'}
          data-success={status === 'success'}
        >
          {
            status === 'waiting' ? (
              <>
                { statusMessage.waiting }
                <Upload className="w-4 h-4 ml-2" />
              </>
            ) : (
              statusMessage[status]
            )
          }
        </Button>
      </div>
    </form>
  );
}
