import { mysqlTable, serial, int, varchar, mysqlEnum, decimal, timestamp } from 'drizzle-orm/mysql-core';

export const users = mysqlTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const jenjangEnum = mysqlEnum('jenjang', [
  'SD / Sederajat',
  'SMP / Sederajat',
  'SMA / Sederajat',
]);

export const klasifikasiEnum = mysqlEnum('klasifikasi', [
  'Terdaftar',
  'Dasar',
  'Paripurna',
]);

export const dataSekolah = mysqlTable('data_sekolah', {
  npsn: int('npsn').primaryKey().autoincrement(),
  namaSekolah: varchar('nama_sekolah', { length: 150 }).notNull(),
  jenjang: jenjangEnum.notNull(),
  klasifikasi: klasifikasiEnum.notNull(),
  wilayah: varchar('wilayah', { length: 255 }).notNull(),
  alamat: varchar('alamat', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export type DataSekolah = typeof dataSekolah.$inferSelect;
export type NewDataSekolah = typeof dataSekolah.$inferInsert;

