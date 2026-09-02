import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { env } from './config/env';
import { healthRoutes } from './modules/health';
import { sekolahRoutes } from './modules/sekolah';

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
          { name: 'Sekolah', description: 'Endpoints Pengelolaan & Pemetaan Data Sekolah' },
        ],
      },
      path: '/swagger',
    })
  )
  .get('/', () => ({
    message: 'Welcome to Dashboard Dalduk API',
    docs: '/swagger',
    health: '/health',
    dashboard: '/dashboard',
  }), {
    detail: {
      tags: ['General'],
      summary: 'Root welcome endpoint',
    },
  })
  .get('/dashboard', () => Bun.file('public/index.html'), {
    detail: {
      tags: ['General'],
      summary: 'Frontend Dashboard Data Sekolah (Map & Charts)',
    },
  })
  .use(healthRoutes)
  .use(sekolahRoutes)
  .listen(env.PORT);

console.log(
  `🚀 Server is running at http://${app.server?.hostname}:${app.server?.port}`
);
console.log(
  `📚 Swagger documentation available at http://${app.server?.hostname}:${app.server?.port}/swagger`
);
console.log(
  `📊 Dashboard UI available at http://${app.server?.hostname}:${app.server?.port}/dashboard`
);

export type App = typeof app;

