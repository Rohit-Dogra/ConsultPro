-- Recommendation & ranking engine tables (MySQL 8+)
-- FK columns must match referenced column charset/collation exactly (Error 3780 if not).
-- users.id → utf8mb4_unicode_ci (see schema.sql CREATE TABLE users).
-- product_categories.id → often utf8mb4_0900_ai_ci (MySQL 8 default); seeker_profiles uses same for product_category_id FK.
-- If CREATE still fails, run: SHOW FULL COLUMNS FROM product_categories WHERE Field = 'id';
-- Target DB: set USE below to your app database (expert_station, exp, etc.).

-- Must match MYSQL_DATABASE (main app: src/database/schema.sql uses database `exp`)
USE exp;

-- Unique category clicks: one row per (user, category); repeated clicks do not add rows
CREATE TABLE IF NOT EXISTS `category_clicks` (
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `first_clicked_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `category_id`),
  KEY `idx_category_clicks_category` (`category_id`),
  CONSTRAINT `fk_category_clicks_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_category_clicks_category` FOREIGN KEY (`category_id`) REFERENCES `product_categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Unique profile views: one row per (seeker user, expert user)
CREATE TABLE IF NOT EXISTS `expert_views` (
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expert_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_viewed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `expert_id`),
  KEY `idx_expert_views_expert` (`expert_id`),
  CONSTRAINT `fk_expert_views_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_expert_views_expert` FOREIGN KEY (`expert_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Map experts to product_categories for category-scoped relevance (both keys match schema.sql types)
CREATE TABLE IF NOT EXISTS `expert_category_map` (
  `expert_user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`expert_user_id`, `category_id`),
  KEY `idx_expert_category_map_category` (`category_id`),
  CONSTRAINT `fk_expert_category_map_expert` FOREIGN KEY (`expert_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_expert_category_map_category` FOREIGN KEY (`category_id`) REFERENCES `product_categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Denormalized counters (app updates on first-seen events)
CREATE TABLE IF NOT EXISTS `category_click_totals` (
  `category_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `unique_clickers` bigint NOT NULL DEFAULT 0,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`category_id`),
  CONSTRAINT `fk_category_click_totals_category` FOREIGN KEY (`category_id`) REFERENCES `product_categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `expert_view_totals` (
  `expert_user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unique_viewers` bigint NOT NULL DEFAULT 0,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`expert_user_id`),
  CONSTRAINT `fk_expert_view_totals_expert` FOREIGN KEY (`expert_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



CREATE TABLE IF NOT EXISTS `search_history` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `query_text` text COLLATE utf8mb4_unicode_ci,
  `problem_statement` text COLLATE utf8mb4_unicode_ci,
  `keywords` json DEFAULT NULL COMMENT 'optional extracted keywords array',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_search_history_user_created` (`user_id`, `created_at`),
  KEY `idx_search_history_created` (`created_at`),
  CONSTRAINT `fk_search_history_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `functionality_clicks` (
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `functionality_id` int NOT NULL,
  `first_clicked_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `functionality_id`),
  KEY `idx_functionality_clicks_func` (`functionality_id`),
  CONSTRAINT `fk_functionality_clicks_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_functionality_clicks_option` FOREIGN KEY (`functionality_id`) REFERENCES `expert_functionality_options` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `functionality_click_totals` (
  `functionality_id` int NOT NULL,
  `unique_clickers` bigint NOT NULL DEFAULT 0,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`functionality_id`),
  CONSTRAINT `fk_functionality_click_totals_option` FOREIGN KEY (`functionality_id`) REFERENCES `expert_functionality_options` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



CREATE TABLE IF NOT EXISTS `seeker_conversion_stats` (
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unique_experts_viewed` int NOT NULL DEFAULT 0,
  `unique_experts_booked` int NOT NULL DEFAULT 0,
  `conversion_rate` decimal(8,4) NOT NULL DEFAULT 0.0000 COMMENT 'booked / viewed, capped at 1.0',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_seeker_conversion_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
