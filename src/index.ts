import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { env } from './config/env';
import { healthRoutes } from './modules/health';
import { sekolahRoutes } from './modules/sekolah';
import { authRoutes } from './modules/auth';
import { usersRoutes } from './modules/users';

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
          { name: 'Auth', description: 'Authentication & Session management' },
          { name: 'Users', description: 'User & Access Control Management (RBAC)' },
          { name: 'Sekolah', description: 'Endpoints Pengelolaan & Pemetaan Data Sekolah' },
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
    dashboard: '/dashboard',
    login: '/login',
    admin: '/admin',
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
  .get('/login', () => Bun.file('public/login.html'), {
    detail: {
      tags: ['General'],
      summary: 'Halaman Login User & Admin',
    },
  })
  .get('/admin', () => Bun.file('public/admin.html'), {
    detail: {
      tags: ['General'],
      summary: 'Halaman Admin Panel (CRUD Data Sekolah & Users)',
    },
  })
  .get('/logo.png', () => Bun.file('public/logo.png'), {
    detail: {
      tags: ['General'],
      summary: 'Logo PNG asset',
    },
  })
  .use(healthRoutes)
  .use(authRoutes)
  .use(usersRoutes)
  .use(sekolahRoutes)
  .listen(env.PORT);

console.log(
  `🚀 Server is running at http://${app.server?.hostname}:${app.server?.port}`
);
console.log(
  `📚 Swagger documentation available at http://${app.server?.hostname}:${app.server?.port}/swagger`
);
console.log(
  `📊 Public Dashboard UI at http://${app.server?.hostname}:${app.server?.port}/dashboard`
);
console.log(
  `🔑 Admin Panel UI at http://${app.server?.hostname}:${app.server?.port}/admin`
);

export type App = typeof app;
