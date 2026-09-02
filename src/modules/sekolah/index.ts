import { Elysia, t } from 'elysia';
import { jwt } from '@elysiajs/jwt';
import { jwtSecret } from '../auth';
import { authenticateAndAuthorize } from '../users';
import { db } from '../../db';
import { dataSekolah } from '../../db/schema';
import { eq, inArray } from 'drizzle-orm';

export const sekolahRoutes = new Elysia({ prefix: '/api/sekolah' })
  .use(
    jwt({
      name: 'jwt',
      secret: jwtSecret,
    })
  )
  // GET /api/sekolah - Public access: List all schools with search, filters, and pagination
  .get(
    '/',
    async ({ query }) => {
      const { search, jenjang, klasifikasi, wilayah, page = '1', limit = '10' } = query;

      try {
        let result = await db.select().from(dataSekolah);

        if (search) {
          const s = search.toLowerCase();
          result = result.filter(
            (item) =>
              item.namaSekolah.toLowerCase().includes(s) ||
              item.wilayah.toLowerCase().includes(s) ||
              (item.alamat && item.alamat.toLowerCase().includes(s)) ||
              String(item.no).includes(s)
          );
        }

        if (jenjang) {
          result = result.filter((item) => item.jenjang === jenjang);
        }

        if (klasifikasi) {
          result = result.filter((item) => item.klasifikasi === klasifikasi);
        }

        if (wilayah) {
          result = result.filter((item) => item.wilayah.toLowerCase() === wilayah.toLowerCase());
        }

        const totalItems = result.length;
        const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
        const limitNum = parseInt(limit as string, 10) || 10;

        let paginatedResult = result;
        let totalPages = 1;

        if (limitNum > 0 && limitNum < 99999) {
          totalPages = Math.ceil(totalItems / limitNum) || 1;
          const validPage = Math.min(pageNum, totalPages);
          const startIndex = (validPage - 1) * limitNum;
          paginatedResult = result.slice(startIndex, startIndex + limitNum);
        }

        return {
          success: true,
          data: paginatedResult,
          pagination: {
            page: pageNum,
            limit: limitNum,
            totalItems,
            totalPages,
          },
        };
      } catch (error: any) {
        return {
          success: false,
          error: error?.message || 'Gagal mengambil data sekolah',
          data: [],
          pagination: {
            page: 1,
            limit: 10,
            totalItems: 0,
            totalPages: 1,
          },
        };
      }
    },
    {
      query: t.Object({
        search: t.Optional(t.String()),
        jenjang: t.Optional(t.String()),
        klasifikasi: t.Optional(t.String()),
        wilayah: t.Optional(t.String()),
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
      detail: {
        tags: ['Sekolah'],
        summary: 'Get data sekolah with optional search, filters, and pagination',
      },
    }
  )

  // GET /api/sekolah/stats - Public access: Aggregated stats
  .get(
    '/stats',
    async ({ query }) => {
      const { search, jenjang, klasifikasi, wilayah } = query;

      try {
        const allRawData = await db.select().from(dataSekolah);

        const availableWilayah = Array.from(
          new Set(allRawData.map((item) => item.wilayah))
        ).sort();

        let filteredData = allRawData;

        if (search) {
          const s = search.toLowerCase();
          filteredData = filteredData.filter(
            (item) =>
              item.namaSekolah.toLowerCase().includes(s) ||
              item.wilayah.toLowerCase().includes(s) ||
              (item.alamat && item.alamat.toLowerCase().includes(s)) ||
              String(item.no).includes(s)
          );
        }

        if (jenjang) {
          filteredData = filteredData.filter((item) => item.jenjang === jenjang);
        }

        if (klasifikasi) {
          filteredData = filteredData.filter((item) => item.klasifikasi === klasifikasi);
        }

        if (wilayah) {
          filteredData = filteredData.filter((item) => item.wilayah.toLowerCase() === wilayah.toLowerCase());
        }

        const total = filteredData.length;

        const perJenjang = {
          'SD / Sederajat': 0,
          'SMP / Sederajat': 0,
          'SMA / Sederajat': 0,
        };

        const perKlasifikasi = {
          Terdaftar: 0,
          Dasar: 0,
          Paripurna: 0,
        };

        const perWilayah: Record<string, number> = {};

        filteredData.forEach((item) => {
          if (item.jenjang in perJenjang) {
            perJenjang[item.jenjang as keyof typeof perJenjang]++;
          }
          if (item.klasifikasi in perKlasifikasi) {
            perKlasifikasi[item.klasifikasi as keyof typeof perKlasifikasi]++;
          }
          perWilayah[item.wilayah] = (perWilayah[item.wilayah] || 0) + 1;
        });

        return {
          success: true,
          data: {
            total,
            perJenjang,
            perKlasifikasi,
            perWilayah,
            availableWilayah,
          },
        };
      } catch (error: any) {
        return {
          success: false,
          error: error?.message || 'Gagal menghitung statistik',
          data: {
            total: 0,
            perJenjang: { 'SD / Sederajat': 0, 'SMP / Sederajat': 0, 'SMA / Sederajat': 0 },
            perKlasifikasi: { Terdaftar: 0, Dasar: 0, Paripurna: 0 },
            perWilayah: {},
            availableWilayah: [],
          },
        };
      }
    },
    {
      query: t.Object({
        search: t.Optional(t.String()),
        jenjang: t.Optional(t.String()),
        klasifikasi: t.Optional(t.String()),
        wilayah: t.Optional(t.String()),
      }),
      detail: {
        tags: ['Sekolah'],
        summary: 'Get aggregated statistics of data sekolah with optional dynamic filters',
      },
    }
  )

  // POST /api/sekolah - Add new sekolah (Admin & Operator Sekolah)
  .post(
    '/',
    async ({ body, jwt, cookie: { auth_token }, headers, set }) => {
      const auth = await authenticateAndAuthorize(jwt, auth_token, headers, ['admin', 'operator_sekolah']);
      if (!auth.authorized) {
        set.status = auth.status;
        return { success: false, error: auth.error };
      }

      try {
        const [inserted] = await db
          .insert(dataSekolah)
          .values({
            namaSekolah: body.namaSekolah,
            jenjang: body.jenjang as any,
            klasifikasi: body.klasifikasi as any,
            wilayah: body.wilayah,
            alamat: body.alamat || null,
            latitude: body.latitude || null,
            longitude: body.longitude || null,
          })
          .$returningId();

        set.status = 201;
        return {
          success: true,
          message: 'Data sekolah berhasil ditambahkan',
          data: { no: inserted.no },
        };
      } catch (error: any) {
        set.status = 500;
        return {
          success: false,
          error: error?.message || 'Gagal menambahkan data sekolah',
        };
      }
    },
    {
      body: t.Object({
        namaSekolah: t.String({ minLength: 1, maxLength: 150 }),
        jenjang: t.Union([
          t.Literal('SD / Sederajat'),
          t.Literal('SMP / Sederajat'),
          t.Literal('SMA / Sederajat'),
        ]),
        klasifikasi: t.Union([
          t.Literal('Terdaftar'),
          t.Literal('Dasar'),
          t.Literal('Paripurna'),
        ]),
        wilayah: t.String({ minLength: 1, maxLength: 255 }),
        alamat: t.Optional(t.Nullable(t.String({ maxLength: 255 }))),
        latitude: t.Optional(t.Nullable(t.String({ maxLength: 50 }))),
        longitude: t.Optional(t.Nullable(t.String({ maxLength: 50 }))),
      }),
      detail: {
        tags: ['Sekolah'],
        summary: 'Add a new sekolah record (Admin & Operator Sekolah)',
      },
    }
  )

  // POST /api/sekolah/batch-delete - Delete multiple sekolah records (Admin & Operator Sekolah)
  .post(
    '/batch-delete',
    async ({ body, jwt, cookie: { auth_token }, headers, set }) => {
      const auth = await authenticateAndAuthorize(jwt, auth_token, headers, ['admin', 'operator_sekolah']);
      if (!auth.authorized) {
        set.status = auth.status;
        return { success: false, error: auth.error };
      }

      try {
        const nos = body.nos || body.npsns;
        if (!nos || nos.length === 0) {
          set.status = 400;
          return { success: false, error: 'Tidak ada data sekolah yang dipilih' };
        }

        await db.delete(dataSekolah).where(inArray(dataSekolah.no, nos));

        return {
          success: true,
          message: `${nos.length} data sekolah berhasil dihapus`,
        };
      } catch (error: any) {
        set.status = 500;
        return {
          success: false,
          error: error?.message || 'Gagal menghapus beberapa data sekolah',
        };
      }
    },
    {
      body: t.Object({
        nos: t.Optional(t.Array(t.Numeric())),
        npsns: t.Optional(t.Array(t.Numeric())),
      }),
      detail: {
        tags: ['Sekolah'],
        summary: 'Batch delete sekolah records by list of NOs',
      },
    }
  )

  // POST /api/sekolah/batch-import - Import multiple sekolah records (Admin & Operator Sekolah)
  .post(
    '/batch-import',
    async ({ body, jwt, cookie: { auth_token }, headers, set }) => {
      const auth = await authenticateAndAuthorize(jwt, auth_token, headers, ['admin', 'operator_sekolah']);
      if (!auth.authorized) {
        set.status = auth.status;
        return { success: false, error: auth.error };
      }

      try {
        const items = body.items;
        if (!items || items.length === 0) {
          set.status = 400;
          return { success: false, error: 'Tidak ada data sekolah untuk diimpor' };
        }

        const validItems = items.map((item) => {
          let jenjang = item.jenjang || '';
          if (jenjang.includes('SD')) jenjang = 'SD / Sederajat';
          else if (jenjang.includes('SMP')) jenjang = 'SMP / Sederajat';
          else if (jenjang.includes('SMA') || jenjang.includes('SMK')) jenjang = 'SMA / Sederajat';
          else jenjang = 'SD / Sederajat';

          let klasifikasi = item.klasifikasi || '';
          if (klasifikasi !== 'Terdaftar' && klasifikasi !== 'Dasar' && klasifikasi !== 'Paripurna') {
            klasifikasi = 'Terdaftar';
          }

          return {
            namaSekolah: item.namaSekolah ? item.namaSekolah.trim() : '',
            jenjang: jenjang as any,
            klasifikasi: klasifikasi as any,
            wilayah: item.wilayah ? item.wilayah.trim() : 'Kota Serang',
            alamat: item.alamat ? item.alamat.trim() : null,
            latitude: item.latitude ? String(item.latitude).trim() : null,
            longitude: item.longitude ? String(item.longitude).trim() : null,
          };
        }).filter(item => item.namaSekolah.length > 0);

        if (validItems.length === 0) {
          set.status = 400;
          return { success: false, error: 'Data yang diunggah tidak memiliki nama sekolah yang valid' };
        }

        await db.insert(dataSekolah).values(validItems);

        return {
          success: true,
          message: `Berhasil mengimpor ${validItems.length} data sekolah`,
          count: validItems.length,
        };
      } catch (error: any) {
        set.status = 500;
        return {
          success: false,
          error: error?.message || 'Gagal mengimpor data sekolah',
        };
      }
    },
    {
      body: t.Object({
        items: t.Array(
          t.Object({
            namaSekolah: t.String(),
            jenjang: t.String(),
            klasifikasi: t.String(),
            wilayah: t.String(),
            alamat: t.Optional(t.Nullable(t.String())),
            latitude: t.Optional(t.Nullable(t.String())),
            longitude: t.Optional(t.Nullable(t.String())),
          })
        ),
      }),
      detail: {
        tags: ['Sekolah'],
        summary: 'Batch import sekolah records (Admin & Operator Sekolah)',
      },
    }
  )

  // PUT /api/sekolah/:no - Update a sekolah (Admin & Operator Sekolah)
  .put(
    '/:no',
    async ({ params, body, jwt, cookie: { auth_token }, headers, set }) => {
      const auth = await authenticateAndAuthorize(jwt, auth_token, headers, ['admin', 'operator_sekolah']);
      if (!auth.authorized) {
        set.status = auth.status;
        return { success: false, error: auth.error };
      }

      try {
        const no = Number(params.no);
        await db
          .update(dataSekolah)
          .set({
            namaSekolah: body.namaSekolah,
            jenjang: body.jenjang as any,
            klasifikasi: body.klasifikasi as any,
            wilayah: body.wilayah,
            alamat: body.alamat || null,
            latitude: body.latitude || null,
            longitude: body.longitude || null,
          })
          .where(eq(dataSekolah.no, no));

        return {
          success: true,
          message: 'Data sekolah berhasil diperbarui',
        };
      } catch (error: any) {
        set.status = 500;
        return {
          success: false,
          error: error?.message || 'Gagal memperbarui data sekolah',
        };
      }
    },
    {
      params: t.Object({ no: t.Numeric() }),
      body: t.Object({
        namaSekolah: t.String({ minLength: 1, maxLength: 150 }),
        jenjang: t.Union([
          t.Literal('SD / Sederajat'),
          t.Literal('SMP / Sederajat'),
          t.Literal('SMA / Sederajat'),
        ]),
        klasifikasi: t.Union([
          t.Literal('Terdaftar'),
          t.Literal('Dasar'),
          t.Literal('Paripurna'),
        ]),
        wilayah: t.String({ minLength: 1, maxLength: 255 }),
        alamat: t.Optional(t.Nullable(t.String({ maxLength: 255 }))),
        latitude: t.Optional(t.Nullable(t.String({ maxLength: 50 }))),
        longitude: t.Optional(t.Nullable(t.String({ maxLength: 50 }))),
      }),
      detail: {
        tags: ['Sekolah'],
        summary: 'Update a sekolah record by NO (Admin & Operator Sekolah)',
      },
    }
  )

  // DELETE /api/sekolah/:no - Delete a sekolah (Admin & Operator Sekolah)
  .delete(
    '/:no',
    async ({ params, jwt, cookie: { auth_token }, headers, set }) => {
      const auth = await authenticateAndAuthorize(jwt, auth_token, headers, ['admin', 'operator_sekolah']);
      if (!auth.authorized) {
        set.status = auth.status;
        return { success: false, error: auth.error };
      }

      try {
        const no = Number(params.no);
        await db.delete(dataSekolah).where(eq(dataSekolah.no, no));
        return {
          success: true,
          message: `Data sekolah dengan NO ${no} berhasil dihapus`,
        };
      } catch (error: any) {
        set.status = 500;
        return {
          success: false,
          error: error?.message || 'Gagal menghapus data sekolah',
        };
      }
    },
    {
      params: t.Object({
        no: t.Numeric(),
      }),
      detail: {
        tags: ['Sekolah'],
        summary: 'Delete a sekolah record by NO (Admin & Operator Sekolah)',
      },
    }
  );
