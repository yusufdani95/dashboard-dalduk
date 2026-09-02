CREATE TABLE `data_sekolah` (
	`npsn` int AUTO_INCREMENT NOT NULL,
	`nama_sekolah` varchar(150) NOT NULL,
	`jenjang` enum('SD / Sederajat','SMP / Sederajat','SMA / Sederajat') NOT NULL,
	`klasifikasi` enum('Terdaftar','Dasar','Paripurna') NOT NULL,
	`wilayah` varchar(255) NOT NULL,
	`latitude` decimal(10,8),
	`longitude` decimal(11,8),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `data_sekolah_npsn` PRIMARY KEY(`npsn`)
);
