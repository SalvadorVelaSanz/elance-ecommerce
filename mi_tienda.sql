-- phpMyAdmin SQL Dump
-- Elance — Base de datos de demostración
-- Para uso en portfolio / entorno de desarrollo local
--
-- Credenciales de administrador:
--   Email:      admin@elance.com
--   Contraseña: password
--
-- Servidor: 127.0.0.1 (MariaDB 10.4 / MySQL 8+)

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

-- --------------------------------------------------------
-- Estructura de tabla `cache`
-- --------------------------------------------------------

CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Estructura de tabla `cache_locks`
-- --------------------------------------------------------

CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Estructura de tabla `carritos`
-- --------------------------------------------------------

CREATE TABLE `carritos` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `producto_id` bigint(20) UNSIGNED NOT NULL,
  `cantidad` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Estructura de tabla `categorias`
-- --------------------------------------------------------

CREATE TABLE `categorias` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `temporada` varchar(30) DEFAULT NULL,
  `publico_objetivo` enum('adulto','niño','bebé','unisex') NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `imagen_categoria` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `categorias` (`id`, `nombre`, `temporada`, `publico_objetivo`, `created_at`, `updated_at`, `imagen_categoria`) VALUES
(1, 'Hombre',     NULL, 'adulto',  NULL, NULL, 'https://res.cloudinary.com/dchzopx8q/image/upload/v1748260202/categoria-hombre_zcp6n5.jpg'),
(2, 'Mujer',      NULL, 'adulto',  NULL, NULL, 'https://res.cloudinary.com/dchzopx8q/image/upload/v1748260202/categoria-mujer_kveani.jpg'),
(3, 'Niño',       NULL, 'niño',    NULL, NULL, 'https://res.cloudinary.com/dchzopx8q/image/upload/v1748260185/categoria-ni%C3%B1o_qsz8xu.jpg'),
(4, 'Unisex',     NULL, 'unisex',  NULL, NULL, 'https://res.cloudinary.com/dchzopx8q/image/upload/v1748260186/categoria-unisex_g6ewuq.jpg'),
(5, 'Accesorios', NULL, 'unisex',  NULL, NULL, 'https://res.cloudinary.com/dchzopx8q/image/upload/v1748260186/categoria-accesorios_mzm3vq.jpg'),
(6, 'Calzado',    NULL, 'adulto',  NULL, NULL, 'https://res.cloudinary.com/dchzopx8q/image/upload/v1748260185/categoria-calzado_u5ndkm.jpg');

-- --------------------------------------------------------
-- Estructura de tabla `detalle_pedidos`
-- --------------------------------------------------------

CREATE TABLE `detalle_pedidos` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `pedido_id` bigint(20) UNSIGNED NOT NULL,
  `producto_id` bigint(20) UNSIGNED DEFAULT NULL,
  `cantidad` int(11) NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `producto_nombre` varchar(255) DEFAULT NULL,
  `producto_descripcion` text DEFAULT NULL,
  `producto_talla` varchar(255) DEFAULT NULL,
  `producto_precio_original` decimal(10,2) DEFAULT NULL,
  `producto_porcentaje_descuento` decimal(5,2) DEFAULT NULL,
  `producto_fecha_inicio_descuento` date DEFAULT NULL,
  `producto_fecha_fin_descuento` date DEFAULT NULL,
  `categoria_nombre` varchar(255) DEFAULT NULL,
  `producto_imagen_url` text DEFAULT NULL,
  `producto_sku` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Estructura de tabla `direcciones`
-- --------------------------------------------------------

CREATE TABLE `direcciones` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `nombre_direccion` varchar(255) DEFAULT NULL,
  `calle` varchar(255) NOT NULL,
  `numero` varchar(255) NOT NULL,
  `piso` varchar(255) DEFAULT NULL,
  `puerta` varchar(255) DEFAULT NULL,
  `codigo_postal` varchar(255) NOT NULL,
  `ciudad` varchar(255) NOT NULL,
  `provincia` varchar(255) NOT NULL,
  `pais` varchar(255) NOT NULL DEFAULT 'España',
  `es_principal` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Estructura de tabla `failed_jobs`
-- --------------------------------------------------------

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Estructura de tabla `favoritos`
-- --------------------------------------------------------

CREATE TABLE `favoritos` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `producto_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Estructura de tabla `imagenes`
-- --------------------------------------------------------

CREATE TABLE `imagenes` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `url` text DEFAULT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `imagenes` (`id`, `url`, `descripcion`, `created_at`, `updated_at`) VALUES
(1, 'https://srv.latostadora.com/image/personaliza-tu-camiseta--id:5de9f48b-1299-4a99-9cb7-d6ea8179cd13;s:H_A1;b:f1f1f1;h:520;f:f;i:13562313618815135623201709261.jpg|https://pix.bonprix.es/imgc/0/0/2/0/3/0/8/2/7/8/_235/20308278/vestido-midi-de-punto-de-algodon.jpg', 'camiseta basica', '2025-04-01 08:00:00', '2025-04-01 08:00:00'),
(2, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcShTMJdeYHpof8-Nrz9H-jRodmrJgmKC-glNw&s', 'vestido de mujer basico', '2025-04-01 08:05:00', '2025-04-01 08:05:00'),
(3, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTXl3sHuRiDfvEIY0vtg3HvIyQxbPCN9oHCbw&s', 'zapatillas niño', '2025-04-01 08:10:00', '2025-04-01 08:10:00'),
(4, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRRg2BLpAdcnkmTJZ3cPvnkVJTepvKdnXMKHg&s', 'sudadera unisex negra', '2025-04-01 08:15:00', '2025-04-01 08:15:00'),
(5, 'https://media.rs-online.com/image/upload/bo_1.5px_solid_white,b_auto,c_pad,dpr_2,f_auto,h_399,q_auto,w_710/c_pad,h_399,w_710/R1370284-01?pgw=1', 'gorra', '2025-04-01 08:20:00', '2025-04-01 08:20:00'),
(6, 'https://lolarey.es/196631-home_default/botin-tacon-javier-larrainzar-jl956-negro.jpg', 'botines', '2025-04-01 08:25:00', '2025-04-01 08:25:00');

-- --------------------------------------------------------
-- Estructura de tabla `jobs`
-- --------------------------------------------------------

CREATE TABLE `jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) UNSIGNED NOT NULL,
  `reserved_at` int(10) UNSIGNED DEFAULT NULL,
  `available_at` int(10) UNSIGNED NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Estructura de tabla `job_batches`
-- --------------------------------------------------------

CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Estructura de tabla `migrations`
-- --------------------------------------------------------

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1,  '0001_01_01_000000_create_users_table', 1),
(2,  '0001_01_01_000001_create_cache_table', 1),
(3,  '0001_01_01_000002_create_jobs_table', 1),
(4,  '2025_04_02_223427_create_imagenes_table', 1),
(5,  '2025_04_03_123622_add_fields_to_users_table', 1),
(6,  '2025_04_03_123636_create_categorias_table', 1),
(7,  '2025_04_03_123649_create_productos_table', 1),
(8,  '2025_04_03_123656_create_pedidos_table', 1),
(9,  '2025_04_03_123704_create_detalle_pedidos_table', 1),
(10, '2025_04_03_123715_create_resenas_table', 1),
(11, '2025_04_04_064722_create_direcciones_table', 1),
(12, '2025_04_04_074222_create_favoritos_table', 1),
(13, '2025_04_04_080051_create_zonas_envio_table', 1),
(14, '2025_04_04_080239_create_provincias_envio_table', 1),
(15, '2025_04_19_120502_create_personal_access_tokens_table', 1),
(16, '2025_04_30_162408_add_numero_seguimiento_to_pedidos_table', 2),
(17, '2025_05_11_124651_add_is_admin_to_users_table', 3),
(18, '2025_05_12_144855_add_is_suspended_to_users_table', 4),
(19, '2025_05_17_185022_crear_tabla_carritos', 5),
(20, '2025_05_17_185022_modificar_tabla_detalle_pedido', 6),
(21, '2025_05_27_185022_modificar_tabla_pedidos', 6),
(22, '2025_06_06_185022_modificar_tablas_para_categorias_nulas', 7);

-- --------------------------------------------------------
-- Estructura de tabla `password_reset_tokens`
-- --------------------------------------------------------

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Estructura de tabla `pedidos`
-- --------------------------------------------------------

CREATE TABLE `pedidos` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `precio_total` decimal(10,2) NOT NULL,
  `estado` enum('pendiente','procesando','enviado','entregado','cancelado') NOT NULL DEFAULT 'pendiente',
  `metodo_pago` varchar(255) DEFAULT NULL,
  `numero_seguimiento` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `direccion_id` bigint(20) UNSIGNED DEFAULT NULL,
  `direccion_nombre_direccion` varchar(255) DEFAULT NULL,
  `direccion_calle` varchar(255) DEFAULT NULL,
  `direccion_numero` varchar(255) DEFAULT NULL,
  `direccion_piso` varchar(255) DEFAULT NULL,
  `direccion_puerta` varchar(255) DEFAULT NULL,
  `direccion_codigo_postal` varchar(255) DEFAULT NULL,
  `direccion_ciudad` varchar(255) DEFAULT NULL,
  `direccion_provincia` varchar(255) DEFAULT NULL,
  `direccion_pais` varchar(255) DEFAULT NULL,
  `usuario_nombre` varchar(255) DEFAULT NULL,
  `usuario_email` varchar(255) DEFAULT NULL,
  `usuario_telefono` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Estructura de tabla `personal_access_tokens`
-- --------------------------------------------------------

CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Estructura de tabla `productos`
-- --------------------------------------------------------

CREATE TABLE `productos` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `precio` decimal(10,2) NOT NULL,
  `precio_original` decimal(10,2) DEFAULT NULL,
  `porcentaje_descuento` decimal(5,2) DEFAULT NULL,
  `fecha_inicio_descuento` date DEFAULT NULL,
  `fecha_fin_descuento` date DEFAULT NULL,
  `talla` varchar(10) DEFAULT NULL,
  `stock` int(11) NOT NULL DEFAULT 0,
  `categoria_id` bigint(20) UNSIGNED DEFAULT NULL,
  `imagen_id` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `productos` (`id`, `nombre`, `descripcion`, `precio`, `precio_original`, `porcentaje_descuento`, `fecha_inicio_descuento`, `fecha_fin_descuento`, `talla`, `stock`, `categoria_id`, `imagen_id`, `created_at`, `updated_at`) VALUES
(1, 'Camiseta Básica Hombre',    'Camiseta de algodón 100% para uso diario',          12.99, 15.99, 2.00, NULL, NULL, NULL, 100, 1, 1, NULL, NOW()),
(2, 'Vestido Verano Mujer',      'Vestido ligero y fresco para verano',               29.99,  NULL, NULL, NULL, NULL, NULL,  80, 2, 2, NULL, NOW()),
(3, 'Zapatillas Niño Deportivas','Zapatillas cómodas para niños activos',             24.99,  NULL, NULL, NULL, NULL, NULL,  60, 3, 3, NULL, NOW()),
(4, 'Sudadera Unisex Oversize',  'Sudadera con capucha de corte amplio',              34.50,  NULL, NULL, NULL, NULL, NULL,  70, 4, 4, NULL, NOW()),
(5, 'Gorra Ajustable',           'Gorra estilo béisbol con ajuste trasero',            9.99,  NULL, NULL, NULL, NULL, NULL, 150, 5, 5, NULL, NOW()),
(6, 'Botines de Cuero Mujer',    'Botines resistentes y elegantes de cuero auténtico',59.90,  NULL, NULL, NULL, NULL, NULL,  40, 6, 6, NULL, NOW());

-- --------------------------------------------------------
-- Estructura de tabla `provincias_envio`
-- --------------------------------------------------------

CREATE TABLE `provincias_envio` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `provincia` varchar(255) NOT NULL,
  `codigo_postal_inicio` varchar(255) DEFAULT NULL,
  `codigo_postal_fin` varchar(255) DEFAULT NULL,
  `zona_envio_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `provincias_envio` (`id`, `provincia`, `codigo_postal_inicio`, `codigo_postal_fin`, `zona_envio_id`, `created_at`, `updated_at`) VALUES
(1,  'Madrid',                  '28001', '28080', 1, '2025-04-01 07:00:00', '2025-04-01 07:00:00'),
(2,  'Barcelona',               '08001', '08080', 1, '2025-04-01 07:05:00', '2025-04-01 07:05:00'),
(3,  'Valencia',                '46001', '46080', 1, '2025-04-01 07:10:00', '2025-04-01 07:10:00'),
(4,  'Sevilla',                 '41001', '41080', 1, '2025-04-01 07:15:00', '2025-04-01 07:15:00'),
(5,  'Zaragoza',                '50001', '50080', 1, '2025-04-01 07:20:00', '2025-04-01 07:20:00'),
(6,  'Málaga',                  '29001', '29080', 1, '2025-04-01 07:25:00', '2025-04-01 07:25:00'),
(7,  'Murcia',                  '30001', '30080', 1, '2025-04-01 07:30:00', '2025-04-01 07:30:00'),
(8,  'Islas Baleares',          '07001', '07800', 2, '2025-04-01 07:35:00', '2025-04-01 07:35:00'),
(9,  'Las Palmas',              '35001', '35020', 3, '2025-04-01 07:40:00', '2025-04-01 07:40:00'),
(10, 'Santa Cruz de Tenerife',  '38001', '38020', 3, '2025-04-01 07:45:00', '2025-04-01 07:45:00');

-- --------------------------------------------------------
-- Estructura de tabla `resenas`
-- --------------------------------------------------------

CREATE TABLE `resenas` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `producto_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `puntuacion` tinyint(3) UNSIGNED NOT NULL,
  `fecha_resena` date NOT NULL,
  `comentario` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Estructura de tabla `sessions`
-- --------------------------------------------------------

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Estructura de tabla `users`
-- --------------------------------------------------------

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `apellidos` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `is_suspended` tinyint(1) NOT NULL DEFAULT 0,
  `password` varchar(255) NOT NULL,
  `is_admin` tinyint(1) NOT NULL DEFAULT 0,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `telefono` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Usuario administrador de demostración
-- Email: admin@elance.com  |  Contraseña: password
INSERT INTO `users` (`id`, `name`, `apellidos`, `email`, `email_verified_at`, `is_suspended`, `password`, `is_admin`, `remember_token`, `created_at`, `updated_at`, `telefono`) VALUES
(1, 'Admin', 'Elance', 'admin@elance.com', '2025-01-01 00:00:00', 0, '$2y$12$nyyxHLX9oookafzwTFUaC.5N7epq7zekOPp6WmAQf8QKzEo/LnGda', 1, NULL, '2025-01-01 00:00:00', '2025-01-01 00:00:00', NULL);

-- --------------------------------------------------------
-- Estructura de tabla `zonas_envio`
-- --------------------------------------------------------

CREATE TABLE `zonas_envio` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `costo_envio` decimal(8,2) NOT NULL,
  `pedido_minimo_envio_gratis` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `zonas_envio` (`id`, `nombre`, `costo_envio`, `pedido_minimo_envio_gratis`, `created_at`, `updated_at`) VALUES
(1, 'Península',           3.95, 50.00, '2025-04-01 07:00:00', '2025-04-01 07:00:00'),
(2, 'Islas Baleares',      5.95, 75.00, '2025-04-01 07:05:00', '2025-04-01 07:05:00'),
(3, 'Islas Canarias',      6.95,  NULL, '2025-04-01 07:10:00', '2025-04-01 07:10:00'),
(4, 'Internacional Europa',12.99, NULL, '2025-04-01 07:15:00', '2025-04-01 07:15:00');

-- --------------------------------------------------------
-- Índices
-- --------------------------------------------------------

ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`);

ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`);

ALTER TABLE `carritos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `carritos_user_id_producto_id_unique` (`user_id`,`producto_id`),
  ADD KEY `carritos_producto_id_foreign` (`producto_id`);

ALTER TABLE `categorias`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `detalle_pedidos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `detalle_pedidos_pedido_id_foreign` (`pedido_id`),
  ADD KEY `detalle_pedidos_producto_id_foreign` (`producto_id`);

ALTER TABLE `direcciones`
  ADD PRIMARY KEY (`id`),
  ADD KEY `direcciones_user_id_foreign` (`user_id`);

ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

ALTER TABLE `favoritos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `favoritos_user_id_producto_id_unique` (`user_id`,`producto_id`),
  ADD KEY `favoritos_producto_id_foreign` (`producto_id`);

ALTER TABLE `imagenes`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

ALTER TABLE `pedidos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `pedidos_user_id_foreign` (`user_id`),
  ADD KEY `pedidos_direccion_id_foreign` (`direccion_id`);

ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`);

ALTER TABLE `productos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `productos_categoria_id_foreign` (`categoria_id`),
  ADD KEY `productos_imagen_id_foreign` (`imagen_id`);

ALTER TABLE `provincias_envio`
  ADD PRIMARY KEY (`id`),
  ADD KEY `provincias_envio_zona_envio_id_foreign` (`zona_envio_id`);

ALTER TABLE `resenas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `resenas_producto_id_user_id_unique` (`producto_id`,`user_id`),
  ADD KEY `resenas_user_id_foreign` (`user_id`);

ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`);

ALTER TABLE `zonas_envio`
  ADD PRIMARY KEY (`id`);

-- --------------------------------------------------------
-- AUTO_INCREMENT
-- --------------------------------------------------------

ALTER TABLE `carritos`           MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `categorias`         MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;
ALTER TABLE `detalle_pedidos`    MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `direcciones`        MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `failed_jobs`        MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `favoritos`          MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `imagenes`           MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;
ALTER TABLE `jobs`               MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `migrations`         MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;
ALTER TABLE `pedidos`            MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `personal_access_tokens` MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `productos`          MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;
ALTER TABLE `provincias_envio`   MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;
ALTER TABLE `resenas`            MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `users`              MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;
ALTER TABLE `zonas_envio`        MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

-- --------------------------------------------------------
-- Claves foráneas
-- --------------------------------------------------------

ALTER TABLE `carritos`
  ADD CONSTRAINT `carritos_producto_id_foreign` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `carritos_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `detalle_pedidos`
  ADD CONSTRAINT `detalle_pedidos_pedido_id_foreign` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `detalle_pedidos_producto_id_foreign` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE SET NULL;

ALTER TABLE `direcciones`
  ADD CONSTRAINT `direcciones_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

ALTER TABLE `favoritos`
  ADD CONSTRAINT `favoritos_producto_id_foreign` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `favoritos_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `pedidos`
  ADD CONSTRAINT `pedidos_direccion_id_foreign` FOREIGN KEY (`direccion_id`) REFERENCES `direcciones` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `pedidos_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

ALTER TABLE `productos`
  ADD CONSTRAINT `productos_categoria_id_foreign` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `productos_imagen_id_foreign` FOREIGN KEY (`imagen_id`) REFERENCES `imagenes` (`id`);

ALTER TABLE `provincias_envio`
  ADD CONSTRAINT `provincias_envio_zona_envio_id_foreign` FOREIGN KEY (`zona_envio_id`) REFERENCES `zonas_envio` (`id`);

ALTER TABLE `resenas`
  ADD CONSTRAINT `resenas_producto_id_foreign` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`),
  ADD CONSTRAINT `resenas_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
