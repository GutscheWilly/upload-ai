import { fastify } from 'fastify';
import { getAllPromptsRoute } from './routes/get-all-prompts';
import { uploadVideoRoute } from './routes/upload-video';
import { createVideoTranscriptionRoute } from './routes/create-video-transcription';

const app = fastify();

app.register(getAllPromptsRoute);
app.register(uploadVideoRoute)
app.register(createVideoTranscriptionRoute);

app.listen({
    port: 3333
}).then( () => console.log('Running!') );
