import { Elysia, t } from 'elysia';
import { jwt } from '@elysiajs/jwt';
import { db } from '../../db';
import { users } from '../../db/schema';
import { eq, or } from 'drizzle-orm';

export const jwtSecret = process.env.JWT_SECRET || 'dalduk-secret-key-super-secure-2026';

export const authRoutes = new Elysia({ prefix: '/api/auth' })
  .use(
    jwt({
      name: 'jwt',
      secret: jwtSecret,
      exp: '7d',
    })
  )
  .post(
    '/login',
    async ({ body, jwt, cookie: { auth_token }, set }) => {
      const { usernameOrEmail, password } = body;

      try {
        const foundUsers = await db
          .select()
          .from(users)
          .where(
            or(
              eq(users.username, usernameOrEmail),
              eq(users.email, usernameOrEmail)
            )
          );

        if (foundUsers.length === 0) {
          set.status = 401;
          return {
            success: false,
            error: 'Username/Email atau Password salah',
          };
        }

        const user = foundUsers[0];

        if (!user.isActive) {
          set.status = 403;
          return {
            success: false,
            error: 'Akun Anda sedang dinonaktifkan. Silakan hubungi Administrator.',
          };
        }

        const isPasswordValid = await Bun.password.verify(password, user.password);
        if (!isPasswordValid) {
          set.status = 401;
          return {
            success: false,
            error: 'Username/Email atau Password salah',
          };
        }

        const tokenPayload = {
          idUser: user.idUser,
          username: user.username,
          email: user.email,
          namaLengkap: user.namaLengkap,
          roleId: user.roleId,
        };

        const token = await jwt.sign(tokenPayload);

        // Set cookie
        auth_token.set({
          value: token,
          httpOnly: false, // allow JS client access for simple token storage if needed
          path: '/',
          maxAge: 7 * 86400,
        });

        return {
          success: true,
          message: 'Login berhasil',
          token,
          user: {
            idUser: user.idUser,
            username: user.username,
            email: user.email,
            namaLengkap: user.namaLengkap,
            roleId: user.roleId,
          },
        };
      } catch (error: any) {
        set.status = 500;
        return {
          success: false,
          error: error?.message || 'Terjadi kesalahan saat login',
        };
      }
    },
    {
      body: t.Object({
        usernameOrEmail: t.String({ minLength: 1 }),
        password: t.String({ minLength: 1 }),
      }),
      detail: {
        tags: ['Auth'],
        summary: 'User Login with Username/Email & Password',
      },
    }
  )
  .post(
    '/logout',
    async ({ cookie: { auth_token } }) => {
      auth_token.remove();
      return {
        success: true,
        message: 'Logout berhasil',
      };
    },
    {
      detail: {
        tags: ['Auth'],
        summary: 'User Logout',
      },
    }
  )
  .get(
    '/me',
    async ({ jwt, cookie: { auth_token }, headers, set }) => {
      let token = auth_token.value;

      const authHeader = headers['authorization'];
      if (!token && authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }

      if (!token) {
        set.status = 401;
        return {
          success: false,
          error: 'Belum terautentikasi (Token tidak ditemukan)',
        };
      }

      const payload = await jwt.verify(token);
      if (!payload) {
        set.status = 401;
        return {
          success: false,
          error: 'Sesi telah kedaluwarsa atau token tidak valid',
        };
      }

      return {
        success: true,
        user: payload,
      };
    },
    {
      detail: {
        tags: ['Auth'],
        summary: 'Get current logged in user profile',
      },
    }
  );
