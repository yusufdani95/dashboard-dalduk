import { poolConnection, db } from './index';
import { users, dataSekolah } from './schema';
import { eq } from 'drizzle-orm';

export async function seedDatabase() {
  console.log('🌱 Starting database sync and seeding...');

  try {
    // Ensure table structure exists
    await poolConnection.query(`
      CREATE TABLE IF NOT EXISTS \`users\` (
        \`id_user\` INT AUTO_INCREMENT PRIMARY KEY,
        \`username\` VARCHAR(50) NOT NULL UNIQUE,
        \`email\` VARCHAR(150) NOT NULL UNIQUE,
        \`password\` VARCHAR(255) NOT NULL,
        \`nama_lengkap\` VARCHAR(150) NOT NULL,
        \`role_id\` ENUM('admin', 'operator_sekolah', 'viewer') NOT NULL DEFAULT 'viewer',
        \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // In case older users table had different columns, check and patch columns if needed
    try {
      const [cols]: any = await poolConnection.query(`SHOW COLUMNS FROM \`users\` LIKE 'id_user'`);
      if (cols.length === 0) {
        await poolConnection.query(`DROP TABLE IF EXISTS \`users\``);
        await poolConnection.query(`
          CREATE TABLE \`users\` (
            \`id_user\` INT AUTO_INCREMENT PRIMARY KEY,
            \`username\` VARCHAR(50) NOT NULL UNIQUE,
            \`email\` VARCHAR(150) NOT NULL UNIQUE,
            \`password\` VARCHAR(255) NOT NULL,
            \`nama_lengkap\` VARCHAR(150) NOT NULL,
            \`role_id\` ENUM('admin', 'operator_sekolah', 'viewer') NOT NULL DEFAULT 'viewer',
            \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
            \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
      }
    } catch (e) {
      console.log('Warning checking users table:', e);
    }

    await poolConnection.query(`
      CREATE TABLE IF NOT EXISTS \`data_sekolah\` (
        \`npsn\` INT AUTO_INCREMENT PRIMARY KEY,
        \`nama_sekolah\` VARCHAR(150) NOT NULL,
        \`jenjang\` ENUM('SD / Sederajat', 'SMP / Sederajat', 'SMA / Sederajat') NOT NULL,
        \`klasifikasi\` ENUM('Terdaftar', 'Dasar', 'Paripurna') NOT NULL,
        \`wilayah\` VARCHAR(255) NOT NULL,
        \`alamat\` VARCHAR(255),
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Seed default admin if no admin exists
    const existingAdmin = await db.select().from(users).where(eq(users.username, 'admin'));
    if (existingAdmin.length === 0) {
      const hashedPassword = await Bun.password.hash('admin123', {
        algorithm: 'bcrypt',
        cost: 10,
      });

      await db.insert(users).values({
        username: 'admin',
        email: 'admin@dalduk.go.id',
        password: hashedPassword,
        namaLengkap: 'Administrator Utama',
        roleId: 'admin',
        isActive: true,
      });

      console.log('✅ Default admin created (username: admin, password: admin123)');
    }

    // Seed sample schools if empty
    const existingSchools = await db.select().from(dataSekolah);
    if (existingSchools.length === 0) {
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

      for (const school of sampleSchools) {
        await db.insert(dataSekolah).values(school);
      }
      console.log(`✅ Seeded ${sampleSchools.length} sample Banten schools`);
    }

    console.log('🎉 Database sync & seed completed successfully.');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
}

if (import.meta.main) {
  seedDatabase().then(() => process.exit(0));
}
