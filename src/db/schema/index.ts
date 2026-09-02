import { mysqlTable, serial, int, varchar, mysqlEnum, boolean, timestamp } from 'drizzle-orm/mysql-core';

export const roleEnum = mysqlEnum('role_id', ['admin', 'operator_sekolah', 'viewer']);

export const users = mysqlTable('users', {
  idUser: int('id_user').primaryKey().autoincrement(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  email: varchar('email', { length: 150 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  namaLengkap: varchar('nama_lengkap', { length: 150 }).notNull(),
  roleId: roleEnum.notNull().default('viewer'),
  isActive: boolean('is_active').notNull().default(true),
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
  no: int('no').primaryKey().autoincrement(),
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

