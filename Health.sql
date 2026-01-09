-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Jan 09, 2026 at 11:10 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `Health`
--

-- --------------------------------------------------------

--
-- Table structure for table `detail_expeditions`
--

CREATE TABLE `detail_expeditions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `id_expedition` bigint(20) UNSIGNED NOT NULL,
  `id_medoc` bigint(20) UNSIGNED NOT NULL,
  `quantite` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `detail_expeditions`
--

INSERT INTO `detail_expeditions` (`id`, `id_expedition`, `id_medoc`, `quantite`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 10, '2026-01-09 19:07:49', '2026-01-09 19:07:49');

-- --------------------------------------------------------

--
-- Table structure for table `entrees`
--

CREATE TABLE `entrees` (
  `id_entree` bigint(20) UNSIGNED NOT NULL,
  `id_medoc` bigint(20) UNSIGNED NOT NULL,
  `fournisseur` varchar(200) DEFAULT NULL,
  `quantite` int(11) NOT NULL,
  `unite_mesure` varchar(50) DEFAULT NULL,
  `date_entree` date NOT NULL,
  `date_expiration` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `entrees`
--

INSERT INTO `entrees` (`id_entree`, `id_medoc`, `fournisseur`, `quantite`, `unite_mesure`, `date_entree`, `date_expiration`, `created_at`, `updated_at`) VALUES
(1, 1, 'MEDISKY', 20, 'Blister', '2026-01-09', '2026-01-31', '2026-01-09 19:07:17', '2026-01-09 19:07:17');

-- --------------------------------------------------------

--
-- Table structure for table `expeditions`
--

CREATE TABLE `expeditions` (
  `id_expedition` bigint(20) UNSIGNED NOT NULL,
  `village` varchar(255) NOT NULL,
  `zone` enum('nord','sud','est','ouest') NOT NULL,
  `date_expedition` date NOT NULL,
  `duree` int(11) NOT NULL COMMENT 'Duree en jours',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `expeditions`
--

INSERT INTO `expeditions` (`id_expedition`, `village`, `zone`, `date_expedition`, `duree`, `created_at`, `updated_at`) VALUES
(1, 'Ranomafana', 'sud', '2026-01-20', 1, '2026-01-09 19:07:49', '2026-01-09 19:07:49');

-- --------------------------------------------------------

--
-- Table structure for table `medicaments`
--

CREATE TABLE `medicaments` (
  `id_medoc` bigint(20) UNSIGNED NOT NULL,
  `nom_medoc` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `categorie` varchar(50) NOT NULL,
  `mesure` decimal(8,3) DEFAULT NULL,
  `unite` varchar(255) DEFAULT NULL COMMENT 'ex: mg, ml, plaquette',
  `date_expiration` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `medicaments`
--

INSERT INTO `medicaments` (`id_medoc`, `nom_medoc`, `description`, `categorie`, `mesure`, `unite`, `date_expiration`, `created_at`, `updated_at`) VALUES
(1, 'paracetamol', 'Tablet', 'Antibiotic', 500.000, 'mg', NULL, '2026-01-09 19:06:30', '2026-01-09 19:06:30');

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '0001_01_01_000000_create_users_table', 1),
(2, '2025_08_26_100418_add_two_factor_columns_to_users_table', 1),
(3, '2025_10_21_075328_create_medicaments_table', 1),
(4, '2025_10_21_080104_create_entrees_table', 1),
(5, '2025_10_21_124429_create_expeditions_table', 1),
(6, '2025_10_21_124816_create_detail_expeditions_table', 1),
(7, '2025_11_10_131644_add_expiration_and_unit_to_entrees_table', 1),
(8, '2025_11_10_131746_modify_medicaments_table_add_unit_and_unique', 1),
(9, '2025_11_10_134513_rename_poids_to_mesure_in_medicaments_table', 1);

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` varchar(255) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sessions`
--

INSERT INTO `sessions` (`id`, `user_id`, `ip_address`, `user_agent`, `payload`, `last_activity`) VALUES
('2iv2M9sZZkVr0jvRUrRictX8y3gyWoGjt8AUh7Oa', NULL, '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiUDZHUG9MTHkxcGE4MFpBeVZuV3piTEhSRUdzOWtSQ2xmSWdMdWRTcSI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6Mjc6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMC9sb2dpbiI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=', 1767995981),
('6eYVkWS6ARiGZvyvL6QIMAbaCKGy13eK459tRt0n', 'cvb01', '192.168.43.121', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', 'YTo0OntzOjY6Il90b2tlbiI7czo0MDoib3NqNnBnbTNQZ0FLNWJSWG1MWUcydUxNbWdoa1h0c1lZd3J4T1ZUMSI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MzI6Imh0dHA6Ly8xOTIuMTY4LjQzLjEyMTo4MDAwL2xvZ2luIjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319czo1MDoibG9naW5fd2ViXzU5YmEzNmFkZGMyYjJmOTQwMTU4MGYwMTRjN2Y1OGVhNGUzMDk4OWQiO3M6NToiY3ZiMDEiO30=', 1767996507),
('CfJXtu2ZW4gUXMcTqpjqHAcSSYLS0B4Sd83X2JgD', NULL, '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiV2UxYjBUZ3ZPSG9mcEtPT3hMOVdUN3pkMXlOYktSbUtWQ2NmS3FwUCI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjU6Imh0dHA6Ly8wLjAuMC4wOjgwMDAvbG9naW4iO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19', 1767995285),
('WuWlAGvftIN6dmuuOvbolNrRZ0T5IKqy6cjgQpRm', NULL, '::1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiWWVRWE9ydU43SnRMSkk3b3VGcmRkM2M1cnh3ckYxTEp0SFFwYmpPVCI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6Mjc6Imh0dHA6Ly9sb2NhbGhvc3Q6ODAwMC9sb2dpbiI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=', 1767995323);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` varchar(20) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `two_factor_secret` text DEFAULT NULL,
  `two_factor_recovery_codes` text DEFAULT NULL,
  `two_factor_confirmed_at` timestamp NULL DEFAULT NULL,
  `role` enum('admin','user') NOT NULL DEFAULT 'user',
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `name`, `email`, `email_verified_at`, `password`, `two_factor_secret`, `two_factor_recovery_codes`, `two_factor_confirmed_at`, `role`, `remember_token`, `created_at`, `updated_at`) VALUES
('cvb01', 'test', 'test@valbio', NULL, '$2y$12$Bshw.06E9sJGzgDWW0p5tO7Ok.qzPkcu2K5.djnsW4EDpkuZxL3V2', NULL, NULL, NULL, 'admin', NULL, NULL, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `detail_expeditions`
--
ALTER TABLE `detail_expeditions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `detail_expeditions_id_expedition_foreign` (`id_expedition`),
  ADD KEY `detail_expeditions_id_medoc_foreign` (`id_medoc`);

--
-- Indexes for table `entrees`
--
ALTER TABLE `entrees`
  ADD PRIMARY KEY (`id_entree`),
  ADD KEY `entrees_id_medoc_foreign` (`id_medoc`);

--
-- Indexes for table `expeditions`
--
ALTER TABLE `expeditions`
  ADD PRIMARY KEY (`id_expedition`);

--
-- Indexes for table `medicaments`
--
ALTER TABLE `medicaments`
  ADD PRIMARY KEY (`id_medoc`),
  ADD UNIQUE KEY `medicaments_unique_nom_cat_poids_unite` (`nom_medoc`,`categorie`,`mesure`,`unite`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `users_email_unique` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `detail_expeditions`
--
ALTER TABLE `detail_expeditions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `entrees`
--
ALTER TABLE `entrees`
  MODIFY `id_entree` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `expeditions`
--
ALTER TABLE `expeditions`
  MODIFY `id_expedition` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `medicaments`
--
ALTER TABLE `medicaments`
  MODIFY `id_medoc` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `detail_expeditions`
--
ALTER TABLE `detail_expeditions`
  ADD CONSTRAINT `detail_expeditions_id_expedition_foreign` FOREIGN KEY (`id_expedition`) REFERENCES `expeditions` (`id_expedition`) ON DELETE CASCADE,
  ADD CONSTRAINT `detail_expeditions_id_medoc_foreign` FOREIGN KEY (`id_medoc`) REFERENCES `medicaments` (`id_medoc`) ON DELETE CASCADE;

--
-- Constraints for table `entrees`
--
ALTER TABLE `entrees`
  ADD CONSTRAINT `entrees_id_medoc_foreign` FOREIGN KEY (`id_medoc`) REFERENCES `medicaments` (`id_medoc`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
