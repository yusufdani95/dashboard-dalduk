import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { env } from './config/env';
import { healthRoutes } from './modules/health';

const app = new Elysia()
  .use(cors())
  .use(
    swagger({
      documentation: {
        info: {
          title: 'Dashboard Dalduk API',
          version: '1.0.0',
          description: 'Backend service for Dashboard Dalduk built with ElysiaJS, Drizzle ORM, and Bun',
        },
        tags: [
          { name: 'General', description: 'General endpoints' },
          { name: 'Health', description: 'Health check endpoints' },
        ],
      },
      path: '/swagger',
    })
  )
  .get('/', () => ({
    message: 'Welcome to Dashboard Dalduk API',
    docs: '/swagger',
    health: '/health',
  }), {
    detail: {
      tags: ['General'],
      summary: 'Root welcome endpoint',
    },
  })
  .use(healthRoutes)
  .listen(env.PORT);

console.log(
  `🚀 Server is running at http://${app.server?.hostname}:${app.server?.port}`
);
console.log(
  `📚 Swagger documentation available at http://${app.server?.hostname}:${app.server?.port}/swagger`
);

export type App = typeof app;
