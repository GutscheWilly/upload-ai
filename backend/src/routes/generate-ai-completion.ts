import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { openAI } from '../lib/open-ai';
import { streamToResponse, OpenAIStream } from 'ai';

export async function generateAiCompletionRoute(app: FastifyInstance) {
    const bodySchema = z.object({
        videoId: z.string().uuid(),
        prompt: z.string(),
        temperature: z.number().min(0).max(1).default(0.5)
    });

    app.post('/ai/generate-completion', async (request, response) => {
        const {
            videoId,
            prompt,
            temperature
        } = bodySchema.parse(request.body);

        const video = await prisma.video.findFirstOrThrow({
            where: {
                id: videoId
            }
        });

        if (!video.transcription) {
            return response.status(400).send({ error: 'Video transcription was not created!' });
        }

        const promptMessage = prompt.replace('{transcription}', video.transcription);

        const completion = await openAI.chat.completions.create({
            model: 'gpt-3.5-turbo-16k',
            temperature,
            messages: [
                { role: 'user', content: promptMessage }
            ],
            stream: true
        });

        const stream = OpenAIStream(completion);

        streamToResponse(stream, response.raw, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, PUT, OPTIONS'
          }
        })
    });
}
