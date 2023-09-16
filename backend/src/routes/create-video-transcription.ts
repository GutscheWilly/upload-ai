import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { createReadStream } from 'node:fs';
import { openAI } from '../lib/open-ai';

export async function createVideoTranscriptionRoute(app: FastifyInstance) {
    const paramsSchema = z.object({
        videoId: z.string().uuid()
    });

    const bodySchema = z.object({
        prompt: z.string()
    });

    app.post('/videos/:videoId/transcription', async (request, response) => {
        const { videoId } = paramsSchema.parse(request.params);

        const { prompt } = bodySchema.parse(request.body);

        const video = await prisma.video.findFirstOrThrow({
            where: {
                id: videoId
            }
        });

        const audioReadStream = createReadStream(video.path);

        const { text } = await openAI.audio.transcriptions.create({
            file: audioReadStream,
            model: 'whisper-1',
            language: 'pt',
            temperature: 0,
            response_format: 'json',
            prompt
        });

        await prisma.video.update({
            where: {
                id: videoId
            },
            data: {
                transcription: text
            }
        });

        return response.status(200).send(text);
    });
}
