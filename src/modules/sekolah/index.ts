import { Elysia, t } from 'elysia';
import { db } from '../../db';
import { dataSekolah } from '../../db/schema';
import { eq } from 'drizzle-orm';

export const sekolahRoutes = new Elysia({ prefix: '/api/sekolah' })
  // GET /api/sekolah - List all schools with optional search, filters, and pagination
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
              String(item.npsn).includes(s)
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

        // If limit is <= 0 or 99999, return all items (useful for map markers)
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

  // GET /api/sekolah/stats - Aggregated stats with dynamic filtering support
  .get(
    '/stats',
    async ({ query }) => {
      const { search, jenjang, klasifikasi, wilayah } = query;

      try {
        const allRawData = await db.select().from(dataSekolah);

        // Calculate all unique wilayah available in DB (for dropdown option populate)
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
              String(item.npsn).includes(s)
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

  // POST /api/sekolah - Add new sekolah
  .post(
    '/',
    async ({ body, set }) => {
      try {
        const [inserted] = await db
          .insert(dataSekolah)
          .values({
            namaSekolah: body.namaSekolah,
            jenjang: body.jenjang as any,
            klasifikasi: body.klasifikasi as any,
            wilayah: body.wilayah,
            alamat: body.alamat || null,
          })
          .$returningId();

        set.status = 201;
        return {
          success: true,
          message: 'Data sekolah berhasil ditambahkan',
          data: { npsn: inserted.npsn },
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
      }),
      detail: {
        tags: ['Sekolah'],
        summary: 'Add a new sekolah record',
      },
    }
  )

  // DELETE /api/sekolah/:npsn - Delete a sekolah
  .delete(
    '/:npsn',
    async ({ params, set }) => {
      try {
        const npsn = Number(params.npsn);
        await db.delete(dataSekolah).where(eq(dataSekolah.npsn, npsn));
        return {
          success: true,
          message: `Data sekolah dengan NPSN ${npsn} berhasil dihapus`,
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
        npsn: t.Numeric(),
      }),
      detail: {
        tags: ['Sekolah'],
        summary: 'Delete a sekolah record by NPSN',
      },
    }
  )

  // POST /api/sekolah/seed - Seed sample school data
  .post(
    '/seed',
    async () => {
      const sampleSchools = [
        {
          namaSekolah: 'SD Negeri 2 Serang',
          jenjang: 'SD / Sederajat' as const,
          klasifikasi: 'Paripurna' as const,
          wilayah: 'Kota Serang',
          alamat: 'Jl. Veteran No. 1, Serang',
        },
        {
          namaSekolah: 'SD Negeri 1 Cilegon',
          jenjang: 'SD / Sederajat' as const,
          klasifikasi: 'Dasar' as const,
          wilayah: 'Kota Cilegon',
          alamat: 'Jl. Jend. Sudirman No. 45, Cilegon',
        },
        {
          namaSekolah: 'SMP Negeri 1 Tangerang',
          jenjang: 'SMP / Sederajat' as const,
          klasifikasi: 'Paripurna' as const,
          wilayah: 'Kota Tangerang',
          alamat: 'Jl. Daan Mogot No. 12, Sukasari',
        },
        {
          namaSekolah: 'SMP Negeri 3 Tangerang Selatan',
          jenjang: 'SMP / Sederajat' as const,
          klasifikasi: 'Dasar' as const,
          wilayah: 'Kota Tangerang Selatan',
          alamat: 'Jl. Pahlawan Seribu No. 88, BSD City',
        },
        {
          namaSekolah: 'SMA Negeri 1 Serang',
          jenjang: 'SMA / Sederajat' as const,
          klasifikasi: 'Paripurna' as const,
          wilayah: 'Kota Serang',
          alamat: 'Jl. Ahmad Yani No. 130, Serang',
        },
        {
          namaSekolah: 'SMA Negeri 1 Rangkasbitung',
          jenjang: 'SMA / Sederajat' as const,
          klasifikasi: 'Paripurna' as const,
          wilayah: 'Kabupaten Lebak',
          alamat: 'Jl. RT Hardiwinangun No. 24, Rangkasbitung',
        },
        {
          namaSekolah: 'SD Negeri 1 Pandeglang',
          jenjang: 'SD / Sederajat' as const,
          klasifikasi: 'Terdaftar' as const,
          wilayah: 'Kabupaten Pandeglang',
          alamat: 'Jl. Majasari No. 3, Pandeglang',
        },
        {
          namaSekolah: 'SMA Negeri 2 Balaraja',
          jenjang: 'SMA / Sederajat' as const,
          klasifikasi: 'Dasar' as const,
          wilayah: 'Kabupaten Tangerang',
          alamat: 'Jl. Raya Serang Km 24, Balaraja',
        },
        {
          namaSekolah: 'SMP Negeri 1 Ciruas',
          jenjang: 'SMP / Sederajat' as const,
          klasifikasi: 'Paripurna' as const,
          wilayah: 'Kabupaten Serang',
          alamat: 'Jl. Raya Jakarta Km 9, Ciruas',
        },
        {
          namaSekolah: 'SD Islam Al-Azhar BSD',
          jenjang: 'SD / Sederajat' as const,
          klasifikasi: 'Paripurna' as const,
          wilayah: 'Kota Tangerang Selatan',
          alamat: 'Jl. Sektor 1.2 BSD, Serpong',
        },
      ];

      try {
        for (const school of sampleSchools) {
          await db.insert(dataSekolah).values(school);
        }
        return {
          success: true,
          message: `${sampleSchools.length} sampel data sekolah berhasil di-seed!`,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error?.message || 'Gagal memproses seed data',
        };
      }
    },
    {
      detail: {
        tags: ['Sekolah'],
        summary: 'Seed sample data sekolah into database',
      },
    }
  );
