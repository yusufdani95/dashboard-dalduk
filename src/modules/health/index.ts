import { Elysia } from 'elysia';
import { checkDbConnection } from '../../db';

export const healthRoutes = new Elysia({ prefix: '/health' })
  .get('/', async () => {
    const dbStatus = await checkDbConnection();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbStatus.connected ? 'connected' : 'disconnected',
      dbDetails: dbStatus.message ? dbStatus.message : 'healthy',
    };
  }, {
    detail: {
      tags: ['Health'],
      summary: 'Get system and database health status',
    },
  });
