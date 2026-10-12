import 'dotenv/config';
import Fastify from 'fastify';
import { z } from 'zod';

const env = z.object({
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().optional(),
}).parse(process.env);

const app = Fastify({ logger: true });
app.get('/api/health', async () => ({
  status: 'ok',
  service: 'ai-chemistry-lab',
  aiConfigured: Boolean(env.OPENAI_API_KEY && env.OPENAI_MODEL),
  simulation: 'not-implemented',
}));

try {
  await app.listen({ port: env.API_PORT, host: '127.0.0.1' });
} catch (error) {
  app.log.error(error);
  process.exitCode = 1;
}
