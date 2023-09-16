import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { openAI } from '../lib/open-ai';

export async function generateAiCompletionRoute(app: FastifyInstance) {
    const bodySchema = z.object({
        videoId: z.string().uuid(),
        template: z.string(),
        temperature: z.number().min(0).max(1).default(0.5)
    });

    app.post('/ai/generate-completion', async (request, response) => {
        const {
            videoId,
            template,
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

        const promptMessage = template.replace('{transcription}', video.transcription);

        const completion = await openAI.chat.completions.create({
            model: 'gpt-3.5-turbo-16k',
            temperature,
            messages: [
                { role: 'user', content: promptMessage }
            ]
        });

        return response.status(200).send(completion);
    });
}
