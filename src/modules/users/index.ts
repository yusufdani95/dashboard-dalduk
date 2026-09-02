import { Elysia, t } from 'elysia';
import { jwt } from '@elysiajs/jwt';
import { jwtSecret } from '../auth';
import { db } from '../../db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';

// Auth Guard Helper
export async function authenticateAndAuthorize(
  jwt: any,
  auth_token: any,
  headers: any,
  allowedRoles: string[]
) {
  let token = auth_token?.value;
  const authHeader = headers['authorization'];
  if (!token && authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  if (!token) {
    return { authorized: false, status: 401, error: 'Silakan login terlebih dahulu' };
  }

  const payload = await jwt.verify(token);
  if (!payload) {
    return { authorized: false, status: 401, error: 'Sesi kedaluwarsa, silakan login kembali' };
  }

  if (!allowedRoles.includes(payload.roleId as string)) {
    return { authorized: false, status: 403, error: 'Anda tidak memiliki hak akses untuk tindakan ini' };
  }

  return { authorized: true, user: payload };
}

export const usersRoutes = new Elysia({ prefix: '/api/users' })
  .use(
    jwt({
      name: 'jwt',
      secret: jwtSecret,
    })
  )
  // GET /api/users - List all users (admin only)
  .get(
    '/',
    async ({ query, jwt, cookie: { auth_token }, headers, set }) => {
      const auth = await authenticateAndAuthorize(jwt, auth_token, headers, ['admin']);
      if (!auth.authorized) {
        set.status = auth.status;
        return { success: false, error: auth.error };
      }

      const { search, role, page = '1', limit = '10' } = query;

      try {
        let allUsers = await db.select().from(users);

        if (search) {
          const s = search.toLowerCase();
          allUsers = allUsers.filter(
            (u) =>
              u.username.toLowerCase().includes(s) ||
              u.namaLengkap.toLowerCase().includes(s) ||
              u.email.toLowerCase().includes(s)
          );
        }

        if (role) {
          allUsers = allUsers.filter((u) => u.roleId === role);
        }

        const totalItems = allUsers.length;
        const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
        const limitNum = parseInt(limit as string, 10) || 10;
        const totalPages = Math.ceil(totalItems / limitNum) || 1;
        const validPage = Math.min(pageNum, totalPages);
        const startIndex = (validPage - 1) * limitNum;

        const paginatedUsers = allUsers.slice(startIndex, startIndex + limitNum).map((u) => ({
          idUser: u.idUser,
          username: u.username,
          email: u.email,
          namaLengkap: u.namaLengkap,
          roleId: u.roleId,
          isActive: u.isActive,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
        }));

        return {
          success: true,
          data: paginatedUsers,
          pagination: {
            page: validPage,
            limit: limitNum,
            totalItems,
            totalPages,
          },
        };
      } catch (error: any) {
        set.status = 500;
        return {
          success: false,
          error: error?.message || 'Gagal mengambil data pengguna',
        };
      }
    },
    {
      query: t.Object({
        search: t.Optional(t.String()),
        role: t.Optional(t.String()),
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
      detail: {
        tags: ['Users'],
        summary: 'Get users list with search & pagination (Admin Only)',
      },
    }
  )

  // POST /api/users - Create new user (admin only)
  .post(
    '/',
    async ({ body, jwt, cookie: { auth_token }, headers, set }) => {
      const auth = await authenticateAndAuthorize(jwt, auth_token, headers, ['admin']);
      if (!auth.authorized) {
        set.status = auth.status;
        return { success: false, error: auth.error };
      }

      try {
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.username, body.username));

        if (existingUser.length > 0) {
          set.status = 400;
          return { success: false, error: 'Username sudah digunakan' };
        }

        const existingEmail = await db
          .select()
          .from(users)
          .where(eq(users.email, body.email));

        if (existingEmail.length > 0) {
          set.status = 400;
          return { success: false, error: 'Email sudah digunakan' };
        }

        const hashedPassword = await Bun.password.hash(body.password, {
          algorithm: 'bcrypt',
          cost: 10,
        });

        const [inserted] = await db
          .insert(users)
          .values({
            username: body.username,
            email: body.email,
            password: hashedPassword,
            namaLengkap: body.namaLengkap,
            roleId: body.roleId as any,
            isActive: body.isActive ?? true,
          })
          .$returningId();

        set.status = 201;
        return {
          success: true,
          message: 'Pengguna berhasil ditambahkan',
          data: { idUser: inserted.idUser },
        };
      } catch (error: any) {
        set.status = 500;
        return {
          success: false,
          error: error?.message || 'Gagal menambahkan pengguna',
        };
      }
    },
    {
      body: t.Object({
        username: t.String({ minLength: 3, maxLength: 50 }),
        email: t.String({ minLength: 5, maxLength: 150 }),
        password: t.String({ minLength: 6 }),
        namaLengkap: t.String({ minLength: 2, maxLength: 150 }),
        roleId: t.Union([
          t.Literal('admin'),
          t.Literal('operator_sekolah'),
          t.Literal('viewer'),
        ]),
        isActive: t.Optional(t.Boolean()),
      }),
      detail: {
        tags: ['Users'],
        summary: 'Create a new user (Admin Only)',
      },
    }
  )

  // PUT /api/users/:id - Update user (admin only)
  .put(
    '/:id',
    async ({ params, body, jwt, cookie: { auth_token }, headers, set }) => {
      const auth = await authenticateAndAuthorize(jwt, auth_token, headers, ['admin']);
      if (!auth.authorized) {
        set.status = auth.status;
        return { success: false, error: auth.error };
      }

      const idUser = Number(params.id);

      try {
        const updateData: any = {};

        if (body.namaLengkap) updateData.namaLengkap = body.namaLengkap;
        if (body.email) updateData.email = body.email;
        if (body.roleId) updateData.roleId = body.roleId;
        if (typeof body.isActive === 'boolean') updateData.isActive = body.isActive;

        if (body.password && body.password.trim() !== '') {
          updateData.password = await Bun.password.hash(body.password, {
            algorithm: 'bcrypt',
            cost: 10,
          });
        }

        await db.update(users).set(updateData).where(eq(users.idUser, idUser));

        return {
          success: true,
          message: 'Data pengguna berhasil diperbarui',
        };
      } catch (error: any) {
        set.status = 500;
        return {
          success: false,
          error: error?.message || 'Gagal memperbarui data pengguna',
        };
      }
    },
    {
      params: t.Object({ id: t.Numeric() }),
      body: t.Object({
        namaLengkap: t.Optional(t.String()),
        email: t.Optional(t.String()),
        password: t.Optional(t.String()),
        roleId: t.Optional(
          t.Union([
            t.Literal('admin'),
            t.Literal('operator_sekolah'),
            t.Literal('viewer'),
          ])
        ),
        isActive: t.Optional(t.Boolean()),
      }),
      detail: {
        tags: ['Users'],
        summary: 'Update user profile, role, status, or password (Admin Only)',
      },
    }
  )

  // DELETE /api/users/:id - Delete user (admin only)
  .delete(
    '/:id',
    async ({ params, jwt, cookie: { auth_token }, headers, set }) => {
      const auth = await authenticateAndAuthorize(jwt, auth_token, headers, ['admin']);
      if (!auth.authorized) {
        set.status = auth.status;
        return { success: false, error: auth.error };
      }

      const idUser = Number(params.id);

      if (auth.user?.idUser === idUser) {
        set.status = 400;
        return { success: false, error: 'Anda tidak dapat menghapus akun Anda sendiri' };
      }

      try {
        await db.delete(users).where(eq(users.idUser, idUser));
        return {
          success: true,
          message: 'Pengguna berhasil dihapus',
        };
      } catch (error: any) {
        set.status = 500;
        return {
          success: false,
          error: error?.message || 'Gagal menghapus pengguna',
        };
      }
    },
    {
      params: t.Object({ id: t.Numeric() }),
      detail: {
        tags: ['Users'],
        summary: 'Delete user by ID (Admin Only)',
      },
    }
  );
