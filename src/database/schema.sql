-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: localhost    Database: expert
-- ------------------------------------------------------
-- Server version	8.0.42

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
CREATE DATABASE IF NOT EXISTS exp;
USE exp;
--
-- Table structure for table `auth_tokens`
--

DROP TABLE IF EXISTS `auth_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_tokens` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `auth_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `bookings`
--

DROP TABLE IF EXISTS `bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bookings` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `expert_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `seeker_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `appointment_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `session_type` enum('audio') COLLATE utf8mb4_unicode_ci DEFAULT 'audio',
  `status` enum('pending','confirmed','completed','cancelled','rejected','rescheduled') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `amount` decimal(10,2) DEFAULT '0.00',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_bookings_dates` (`appointment_date`,`start_time`),
  KEY `idx_bookings_expert` (`expert_id`),
  KEY `idx_bookings_seeker` (`seeker_id`),
  CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`expert_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`seeker_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

ALTER TABLE bookings
ADD COLUMN rejection_reason TEXT AFTER notes;

ALTER TABLE `bookings`
ADD COLUMN `session_request_id` VARCHAR(36) AFTER `updated_at`,
ADD CONSTRAINT `bookings_ibfk_3` FOREIGN KEY (`session_request_id`) REFERENCES `session_requests` (`id`) ON DELETE SET NULL;
ALTER TABLE bookings
ADD COLUMN expert_joined BOOLEAN DEFAULT FALSE,
ADD COLUMN seeker_joined BOOLEAN DEFAULT FALSE;

ALTER TABLE bookings
ADD COLUMN real_start_time DATETIME DEFAULT NULL,
ADD COLUMN real_end_time DATETIME DEFAULT NULL;

--
-- Table structure for table `business_plans`
--

DROP TABLE IF EXISTS `business_plans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `business_plans` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `business_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `functionality` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_custom_functionality` tinyint(1) DEFAULT '0',
  `target_audience` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `objectives` json NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `business_plans_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

-- Update the table to use utf8mb4 charset and collation consistently
ALTER TABLE business_plans 
MODIFY business_name VARCHAR(255) 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci 
NOT NULL;

ALTER TABLE business_plans 
MODIFY product_description TEXT 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci 
NOT NULL;

ALTER TABLE business_plans 
MODIFY functionality VARCHAR(100) 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci 
NOT NULL;

ALTER TABLE business_plans 
MODIFY target_audience TEXT 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci 
NOT NULL;

--
-- Table structure for table `contact_messages`
--

DROP TABLE IF EXISTS `contact_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contact_messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'unread',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `email_templates`
--

DROP TABLE IF EXISTS `email_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `email_templates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `template_type` int NOT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `body` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `template_type` (`template_type`),
  CONSTRAINT `email_templates_ibfk_1` FOREIGN KEY (`template_type`) REFERENCES `template_types` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `expert_availability`
--

DROP TABLE IF EXISTS `expert_availability`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expert_availability` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `day_of_week` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_time` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `end_time` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_day` (`user_id`,`day_of_week`),
  KEY `idx_user_day` (`user_id`,`day_of_week`),
  CONSTRAINT `fk_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Stores expert availability schedules by day of week';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `expert_functionality_mapping`
--

DROP TABLE IF EXISTS `expert_functionality_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expert_functionality_mapping` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `expert_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `functionality_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_expert_functionality` (`expert_id`,`functionality_id`),
  KEY `functionality_id` (`functionality_id`),
  CONSTRAINT `expert_functionality_mapping_ibfk_1` FOREIGN KEY (`expert_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `expert_functionality_mapping_ibfk_2` FOREIGN KEY (`functionality_id`) REFERENCES `expert_functionality_options` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `expert_functionality_options`
--

DROP TABLE IF EXISTS `expert_functionality_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expert_functionality_options` (
  `id` int NOT NULL AUTO_INCREMENT,
  `option_value` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `expert_profiles`
--

DROP TABLE IF EXISTS `expert_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expert_profiles` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `designation` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_of_birth` date NOT NULL,
  `phone_number` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `work_experience` int NOT NULL,
  `current_organization` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `location` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expertise` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `areas_of_help` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `audio_pricing` decimal(10,2) DEFAULT NULL,
  `linkedin_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `expert_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

ALTER TABLE expert_profiles 
ADD COLUMN functionality VARCHAR(100) NOT NULL AFTER designation;

ALTER TABLE expert_profiles
ADD COLUMN is_custom_functionality BOOLEAN DEFAULT 0 AFTER functionality;

-- Add constraints for functionality validation
ALTER TABLE expert_profiles
MODIFY functionality VARCHAR(100) NOT NULL,
ADD CONSTRAINT chk_functionality CHECK (
    (is_custom_functionality = FALSE AND functionality IS NOT NULL) OR
    (is_custom_functionality = TRUE AND custom_functionality IS NOT NULL)
);

--
-- Table structure for table `notification_tokens`
--

DROP TABLE IF EXISTS `notification_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_tokens` (
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `notification_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('booking','booking_status','booking_reschedule','session_reminder','message','session_accepted','session_rejected','session_cancelled','session_rescheduled') COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `related_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `read_status` tinyint(1) DEFAULT '0',
  `status_color` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'default',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `seeker_profiles`
--

DROP TABLE IF EXISTS `seeker_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `seeker_profiles` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `company` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `position` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `experience` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `location` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bio` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `interests` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `linkedin_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `website_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `seeker_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--  for industry dropdown 
ALTER TABLE seeker_profiles
DROP COLUMN interests;

ALTER TABLE seeker_profiles
ADD COLUMN turnover VARCHAR(50) DEFAULT NULL;

ALTER TABLE seeker_profiles
ADD COLUMN industry_id VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
ADD COLUMN product_category_id VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
ADD CONSTRAINT fk_seeker_industry FOREIGN KEY (industry_id) REFERENCES industries(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_seeker_category FOREIGN KEY (product_category_id) REFERENCES product_categories(id) ON DELETE SET NULL;
--
-- Table structure for table `session_feedback`
--

DROP TABLE IF EXISTS `session_feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `session_feedback` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `booking_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_role` enum('seeker','expert') COLLATE utf8mb4_unicode_ci NOT NULL,
  `rating` int DEFAULT NULL,
  `review` text COLLATE utf8mb4_unicode_ci,
  `message` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `booking_id` (`booking_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `session_feedback_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `session_feedback_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `session_feedback_chk_1` CHECK (((`rating` between 1 and 5) or (`rating` is null)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `session_requests`
--

DROP TABLE IF EXISTS `session_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `session_requests` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `seeker_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `problem_statement` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `desired_solution` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `functionality` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_custom_functionality` tinyint(1) DEFAULT '0',
  `status` enum('pending','matched','scheduled','completed','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `seeker_id` (`seeker_id`),
  CONSTRAINT `session_requests_ibfk_1` FOREIGN KEY (`seeker_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

ALTER TABLE session_requests
ADD COLUMN functionality_id INT,
ADD CONSTRAINT fk_functionality
FOREIGN KEY (functionality_id) 
REFERENCES expert_functionality_options(id);

-- Add these columns to your existing session_requests table
ALTER TABLE session_requests 
ADD COLUMN selected_objectives_json JSON NULL AFTER is_custom_functionality;

-- Add foreign key constraint for functionality_id
ALTER TABLE session_requests 
ADD CONSTRAINT fk_session_requests_functionality 
FOREIGN KEY (functionality_id) REFERENCES expert_functionality_options(id);

ALTER TABLE session_requests
ADD COLUMN expert_filter_result ENUM('found', 'not_found') NULL,
ADD COLUMN expert_filter_date TIMESTAMP NULL;

-- Step 1: Create the table without the foreign key constraint
CREATE TABLE `linkedin_profiles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `headline` varchar(255) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `profile_url` varchar(255) NOT NULL,
  `current_position` varchar(255) DEFAULT NULL,
  `company` varchar(255) DEFAULT NULL,
  `profile_image_url` varchar(255) DEFAULT NULL,
  `years_of_experience` int(11) DEFAULT NULL,
  `functionality` varchar(100) DEFAULT NULL,
  `subcategory` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `search_count` int(11) DEFAULT '1',
  `is_imported` tinyint(1) DEFAULT '0',
  `is_contacted` tinyint(1) DEFAULT '0',
  `notes` text,
  `request_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `skills` json DEFAULT NULL,
  `last_search_date` timestamp NULL DEFAULT NULL,
  `industry` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_unique_profile_url` (`profile_url`),
  KEY `idx_linkedin_profiles_experience` (`years_of_experience`),
  KEY `idx_linkedin_profiles_functionality` (`functionality`),
  KEY `idx_linkedin_profiles_company` (`company`),
  KEY `idx_linkedin_profiles_imported` (`is_imported`),
  KEY `fk_linkedin_profiles_request` (`request_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Step 2: Add the foreign key constraint
ALTER TABLE `linkedin_profiles` 
ADD CONSTRAINT `fk_linkedin_profiles_request` 
FOREIGN KEY (`request_id`) REFERENCES `session_requests` (`id`) 
ON DELETE SET NULL;

CREATE TABLE `linkedin_search_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `profile_id` int(11) NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `search_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `search_terms` json DEFAULT NULL,
  `request_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `search_query` text,
  `result_count` int(11) DEFAULT '0',
  `search_type` varchar(50) DEFAULT 'manual',
  PRIMARY KEY (`id`),
  KEY `idx_search_history_profile` (`profile_id`),
  KEY `idx_search_history_user` (`user_id`),
  KEY `idx_search_history_date` (`search_date`),
  KEY `idx_search_history_request` (`request_id`),
  CONSTRAINT `fk_linkedin_search_history_profile` FOREIGN KEY (`profile_id`) REFERENCES `linkedin_profiles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_linkedin_search_history_request` FOREIGN KEY (`request_id`) REFERENCES `session_requests` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_linkedin_search_history_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Table structure for table `smtp_configuration`
--

DROP TABLE IF EXISTS `smtp_configuration`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `smtp_configuration` (
  `id` int NOT NULL AUTO_INCREMENT,
  `host` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `port` int NOT NULL,
  `secure` tinyint(1) NOT NULL DEFAULT '1',
  `user` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `from_email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `from_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `template_types`
--

DROP TABLE IF EXISTS `template_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `template_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `functionality` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_custom_functionality` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `profile_completed` tinyint(1) DEFAULT '0',
  `mobile_number` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

ALTER TABLE users DROP COLUMN  functionality;
ALTER TABLE users DROP COLUMN  is_custom_functionality;

ALTER TABLE users 
ADD COLUMN currency VARCHAR(10) DEFAULT NULL,
ADD COLUMN timezone VARCHAR(50) DEFAULT NULL;

ALTER TABLE users 
MODIFY COLUMN currency VARCHAR(10) DEFAULT 'INR';

SET SQL_SAFE_UPDATES = 0;

UPDATE users 
SET currency = 'INR' 
WHERE (currency IS NULL OR currency = '') 
  AND role = 'expert';

SET SQL_SAFE_UPDATES = 1;

-- 1️⃣ Temporarily disable safe updates
SET SQL_SAFE_UPDATES = 0;

-- 2️⃣ Update existing experts without a timezone
UPDATE users 
SET timezone = 'Asia/Kolkata'
WHERE (timezone IS NULL OR timezone = '') 
  AND role = 'expert';

-- 3️⃣ Set default for future inserts
ALTER TABLE users 
MODIFY COLUMN timezone VARCHAR(50) DEFAULT 'Asia/Kolkata';

-- 4️⃣ Re-enable safe updates
SET SQL_SAFE_UPDATES = 1;





--
-- Table structure for table `webinar_registrations`
--

DROP TABLE IF EXISTS `webinar_registrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `webinar_registrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `profession` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `area_of_interest` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `registration_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-06-18  9:31:09
INSERT INTO expert_functionality_options (option_value, display_name) VALUES
('business_strategy', 'Business Strategy & Growth'),
('hr_solutions', 'HR & Workforce Solutions'),
('operations_manufacturing', 'Operations & Manufacturing'),
('automation_workflow', 'Automation & Workflow'),
('marketing_brand', 'Marketing & Brand Positioning'),
('financial_advisory', 'Financial & Risk Advisory'),
('digital_transformation', 'Digital Transformation & IT'),
('customer_support', 'Customer Support Excellence'),
('quality_assurance', 'Quality Assurance'),
('supply_chain', 'Supply Chain Management'),
('research_development', 'Research & Development');

SELECT * FROM bookings;

ALTER TABLE bookings
  ADD COLUMN real_end_time DATETIME NULL AFTER seeker_joined;

--
-- Table structure for table `wallets`
--

DROP TABLE IF EXISTS `wallets`;
CREATE TABLE `wallets` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `balance` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `currency` VARCHAR(3) NOT NULL DEFAULT 'INR',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id_UNIQUE` (`user_id`),
  CONSTRAINT `fk_wallets_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


--
-- Table structure for table `wallet_transactions`
--

DROP TABLE IF EXISTS `wallet_transactions`;
CREATE TABLE `wallet_transactions` (
  `id` VARCHAR(36) NOT NULL,
  `wallet_id` VARCHAR(36) NOT NULL,
  `booking_id` VARCHAR(36) NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `type` ENUM('credit', 'debit') NOT NULL,
  `description` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_wallet_transactions_wallet_id_idx` (`wallet_id`),
  KEY `fk_wallet_transactions_booking_id_idx` (`booking_id`),
  CONSTRAINT `fk_wallet_transactions_wallet_id` FOREIGN KEY (`wallet_id`) REFERENCES `wallets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wallet_transactions_booking_id` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


--
-- Table structure for table `payout_settings`
--

DROP TABLE IF EXISTS `payout_settings`;
CREATE TABLE `payout_settings` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bank_account_number` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ifsc_code` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pan_card` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id_UNIQUE` (`user_id`),
  CONSTRAINT `fk_payout_settings_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


--
-- Table structure for table `withdrawal_requests`
--

DROP TABLE IF EXISTS `withdrawal_requests`;
CREATE TABLE `withdrawal_requests` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `status` ENUM('pending', 'completed', 'rejected') NOT NULL DEFAULT 'pending',
  `rejection_reason` TEXT NULL,
  `requested_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `processed_at` TIMESTAMP NULL,
  PRIMARY KEY (`id`),
  KEY `fk_withdrawal_requests_user_id_idx` (`user_id`),
  CONSTRAINT `fk_withdrawal_requests_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- password update 

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` timestamp NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `password_reset_tokens_ibfk_1_idx` (`user_id`),
  CONSTRAINT `password_reset_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create industries table
CREATE TABLE industries (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_industry_name (name)
);

-- Create product_categories table with industry reference
CREATE TABLE product_categories (
    id VARCHAR(36) PRIMARY KEY,
    industry_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (industry_id) REFERENCES industries(id) ON DELETE CASCADE,
    UNIQUE KEY unique_category_per_industry (industry_id, name)
);

-- Insert sample industries
INSERT INTO industries (id, name, description) VALUES
('ind_001', 'Information Technology', 'Software, Hardware, and IT Services'),
('ind_002', 'Manufacturing', 'Industrial and Consumer Goods Manufacturing'),
('ind_003', 'Healthcare', 'Medical Devices and Healthcare Services'),
('ind_004', 'Financial Services', 'Banking, Insurance, and Financial Technology');

-- Insert sample product categories
INSERT INTO product_categories (id, industry_id, name, description) VALUES
-- IT Industry Categories
('cat_001', 'ind_001', 'Software Development', 'Custom software and application development'),
('cat_002', 'ind_001', 'Cloud Services', 'Cloud infrastructure and platform services'),
('cat_003', 'ind_001', 'Cybersecurity', 'Security solutions and services'),

-- Manufacturing Categories
('cat_004', 'ind_002', 'Automotive', 'Vehicle and auto parts manufacturing'),
('cat_005', 'ind_002', 'Electronics', 'Electronic components and devices'),
('cat_006', 'ind_002', 'Industrial Equipment', 'Heavy machinery and equipment'),

-- Healthcare Categories
('cat_007', 'ind_003', 'Medical Devices', 'Medical equipment and devices'),
('cat_008', 'ind_003', 'Pharmaceuticals', 'Medicine and drug manufacturing'),
('cat_009', 'ind_003', 'Healthcare IT', 'Healthcare software and technology'),

-- Financial Services Categories
('cat_010', 'ind_004', 'Banking', 'Retail and commercial banking services'),
('cat_011', 'ind_004', 'Insurance', 'Insurance products and services'),
('cat_012', 'ind_004', 'FinTech', 'Financial technology solutions');

DROP TABLE IF EXISTS business_objectives;

CREATE TABLE business_objectives (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    function_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (function_id) REFERENCES expert_functionality_options(id)
);

INSERT INTO business_objectives (name, description, function_id) VALUES
-- 23: Business Strategy & Growth
('Strategic Expansion', 'Identify and enter new markets to grow the business', 23),
('Market Penetration', 'Increase customer base and revenue in existing markets', 23),
('Business Model Innovation', 'Explore new ways to create and deliver value', 23),
('Partnership Development', 'Build partnerships to drive mutual business growth', 23),
('Revenue Diversification', 'Develop multiple income streams to reduce risk', 23),

-- 24: HR & Workforce Solutions
('Talent Acquisition Optimization', 'Hire the right people faster and more effectively', 24),
('Employee Engagement Programs', 'Keep employees motivated and satisfied at work', 24),
('Workforce Planning', 'Plan for future staffing needs and skills', 24),
('Training & Upskilling', 'Help employees learn new skills and grow in their roles', 24),
('Workplace Culture Improvement', 'Create a positive and inclusive work environment', 24),

-- 25: Operations & Manufacturing
('Lean Operations', 'Reduce waste and make processes more efficient', 25),
('Production Efficiency', 'Produce more using fewer resources and time', 25),
('Inventory Control', 'Manage stock levels to avoid overstock or shortages', 25),
('Equipment Maintenance Strategy', 'Keep machines running smoothly with regular checks', 25),
('Cost Reduction Measures', 'Cut down unnecessary operational expenses', 25),

-- 26: Automation & Workflow
('Process Automation', 'Use software to handle repetitive tasks automatically', 26),
('Workflow Integration', 'Connect tools and systems for smoother processes', 26),
('Digital Task Management', 'Track and manage tasks through automation tools', 26),
('Reduce Manual Workload', 'Minimize human effort in routine operations', 26),
('Real-time Data Flow', 'Ensure updated data moves instantly across systems', 26),

-- 27: Marketing & Brand Positioning
('Brand Visibility Enhancement', 'Make the brand more recognizable to target audiences', 27),
('Digital Marketing Growth', 'Increase reach using online platforms and tools', 27),
('Target Audience Engagement', 'Connect with the right audience effectively', 27),
('Content Strategy Development', 'Create valuable content that supports marketing goals', 27),
('Social Media Presence Boost', 'Improve brand presence across social platforms', 27),

-- 28: Financial & Risk Advisory
('Risk Mitigation Strategy', 'Identify and reduce risks that can impact the business', 28),
('Financial Planning & Control', 'Plan and manage finances to meet business goals', 28),
('Budget Optimization', 'Use budgets wisely and reduce unnecessary spending', 28),
('Compliance Assurance', 'Follow all legal and financial regulations', 28),
('Cost Control Initiatives', 'Monitor and reduce operational and project costs', 28),

-- 29: Digital Transformation & IT
('Tech Enablement', 'Use the right technology to improve performance', 29),
('System Modernization', 'Upgrade old systems for better speed and security', 29),
('Cloud Adoption', 'Move systems to the cloud for better flexibility', 29),
('Cybersecurity Enhancement', 'Protect systems and data from online threats', 29),
('Data Utilization Strategy', 'Use data to make smarter business decisions', 29),

-- 30: Customer Support Excellence
('Customer Satisfaction Improvement', 'Make customers happier with better service', 30),
('Faster Issue Resolution', 'Solve customer problems quickly', 30),
('24/7 Support Availability', 'Offer support at any time for customer convenience', 30),
('Customer Feedback Collection', 'Gather opinions to improve service', 30),
('Loyalty Program Initiatives', 'Encourage repeat customers with rewards', 30),

-- 31: Quality Assurance
('Product Quality Consistency', 'Maintain high standards for products and services', 31),
('Error Reduction Strategy', 'Reduce mistakes in products and services', 31),
('Customer Complaints Handling', 'Act on complaints to improve quality', 31),
('Quality Standards Implementation', 'Follow defined standards to ensure quality', 31),
('Testing & Inspection Improvement', 'Make testing processes more effective', 31),

-- 21: Supply Chain Management
('Supply Chain Optimization', 'Enhance supply chain agility, cost-efficiency, and resilience', 21),

-- 22: Research & Development
('Innovative Product Development', 'Foster innovation to develop new or improved offerings', 22);

-- for session-request question to fetch ...
ALTER TABLE bookings
ADD COLUMN question_id VARCHAR(20) DEFAULT NULL AFTER session_request_id;


-- Create expert_education table
CREATE TABLE expert_education (
    id INT AUTO_INCREMENT PRIMARY KEY,
    expert_id VARCHAR(36) COLLATE utf8mb4_unicode_ci NOT NULL,
    school VARCHAR(255) NOT NULL,
    degree VARCHAR(255) NOT NULL,
    field_of_study VARCHAR(255),
    start_date DATE NOT NULL,
    end_date DATE,
    grade VARCHAR(50),
    activities TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (expert_id) REFERENCES expert_profiles(user_id)
);

ALTER TABLE expert_education DROP FOREIGN KEY expert_education_ibfk_1;

-- Create experience_entries table
CREATE TABLE expert_experience (
    id INT AUTO_INCREMENT PRIMARY KEY,
    expert_id VARCHAR(36) COLLATE utf8mb4_unicode_ci NOT NULL,
    title VARCHAR(255) NOT NULL,
    employment_type VARCHAR(50),
    company VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    start_date DATE NOT NULL,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    industry VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (expert_id) REFERENCES expert_profiles(user_id)
);

ALTER TABLE expert_experience DROP FOREIGN KEY expert_experience_ibfk_1;

-- Create awards table
CREATE TABLE expert_awards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    expert_id VARCHAR(36) COLLATE utf8mb4_unicode_ci NOT NULL,
    title VARCHAR(255) NOT NULL,
    issuer VARCHAR(255),
    issue_date DATE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (expert_id) REFERENCES expert_profiles(user_id)
);

ALTER TABLE expert_awards DROP FOREIGN KEY expert_awards_ibfk_1;

ALTER TABLE bookings
ADD COLUMN recording_url VARCHAR(512) DEFAULT NULL AFTER real_end_time,
ADD COLUMN recording_duration INT DEFAULT NULL AFTER recording_url;



-- Add amount_withdrawn column to bookings table
ALTER TABLE bookings
ADD COLUMN amount_withdrawn TINYINT DEFAULT 0 COMMENT '0 = not withdrawn, 1 = withdrawn';



-- ALTER TABLE bookings not useable right now 
-- ADD COLUMN deduction decimal(10,2) DEFAULT '0.00',
-- ADD COLUMN net_amount decimal(10,2) DEFAULT '0.00';


--payout_settings add holder name & bank name 
ALTER TABLE payout_settings
  ADD COLUMN bank_holder_name VARCHAR(255) NULL AFTER bank_account_number,
  ADD COLUMN bank_name VARCHAR(255) NULL AFTER bank_holder_name;

-- withdrawal_requests
ALTER TABLE withdrawal_requests
  ADD COLUMN deducted_at TIMESTAMP NULL AFTER processed_at;




-- Create withdrawal_history table
CREATE TABLE IF NOT EXISTS withdrawal_history (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status ENUM('Pending', 'Completed', 'Rejected') NOT NULL DEFAULT 'Pending',
  withdrawal_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_withdrawal_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create index for faster queries
CREATE INDEX idx_withdrawal_user ON withdrawal_history(user_id);
CREATE INDEX idx_withdrawal_status ON withdrawal_history(status);
CREATE INDEX idx_withdrawal_date ON withdrawal_history(withdrawal_date);


-- Create deal_inquiries table for contact form
CREATE TABLE IF NOT EXISTS deal_inquiries (
    id VARCHAR(36) PRIMARY KEY,
    deal_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE
);

-- Create deals table
CREATE TABLE IF NOT EXISTS deals (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  deal_type VARCHAR(100),
  company_name VARCHAR(255),
  year_establishment VARCHAR(50),
  headquarters VARCHAR(255),
  ownership_type VARCHAR(100),
  current_scale TEXT,
  certifications VARCHAR(255),
  sector VARCHAR(100),
  primary_products TEXT,
  key_markets TEXT,
  major_customers TEXT,
  competitive_advantages TEXT,
  type_requirement TEXT,
  size_scale TEXT,
  geographic_preference VARCHAR(255),
  objective_deal VARCHAR(100),
  specific_assets TEXT,
  current_turnover VARCHAR(100),
  ebitda_range VARCHAR(100),
  asset_size TEXT,
  deal_size_range VARCHAR(100),
  funding_support TEXT,
  profile_ideal_partner VARCHAR(100),
  experience_required TEXT,
  geography_market_access TEXT,
  technology_capabilities TEXT,
  other_expectations TEXT,
  confidentiality_level VARCHAR(100),
  status_process VARCHAR(100),
  how_to_engage VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);




-- 1) Currency settings

CREATE TABLE `currency_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `currency_code` varchar(3) NOT NULL,
  `currency_symbol` varchar(5) NOT NULL,
  `currency_name` varchar(50) NOT NULL,
  `exchange_rate_to_usd` decimal(10,4) NOT NULL DEFAULT 1.0000,
  `is_active` boolean DEFAULT TRUE,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `currency_code` (`currency_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO currency_settings
(currency_code, currency_symbol, currency_name, exchange_rate_to_usd)
VALUES
('INR', '₹', 'Indian Rupee', 83.0000),
('USD', '$', 'US Dollar', 1.0000)
ON DUPLICATE KEY UPDATE
  currency_symbol = VALUES(currency_symbol),
  currency_name = VALUES(currency_name),
  exchange_rate_to_usd = VALUES(exchange_rate_to_usd);

-- 2) Historical conversion rates
DROP TABLE IF EXISTS `currency_conversion_rates`;
CREATE TABLE `currency_conversion_rates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `from_currency` varchar(3) NOT NULL,
  `to_currency` varchar(3) NOT NULL,
  `rate` decimal(10,4) NOT NULL,
  `date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_conversion_date` (`from_currency`, `to_currency`, `date`),
  KEY `idx_conversion_date` (`date`),
  KEY `idx_currencies` (`from_currency`, `to_currency`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO currency_conversion_rates (from_currency, to_currency, rate, date) VALUES
('INR', 'USD', 0.0120, CURDATE())
ON DUPLICATE KEY UPDATE rate=VALUES(rate);
INSERT INTO currency_conversion_rates (from_currency, to_currency, rate, date) VALUES
('USD', 'INR', 83.0000, CURDATE())
ON DUPLICATE KEY UPDATE rate=VALUES(rate);

-- 3) Update existing tables (MySQL 8.0+ supports IF NOT EXISTS)
-- Check if column exists
ALTER TABLE bookings 
  ADD COLUMN currency VARCHAR(3) DEFAULT 'INR' AFTER amount,
  ADD COLUMN original_amount DECIMAL(10,2) DEFAULT NULL AFTER currency,
  ADD COLUMN original_currency VARCHAR(3) DEFAULT NULL AFTER original_amount;



ALTER TABLE expert_profiles 
  ADD COLUMN pricing_currency VARCHAR(3) DEFAULT 'INR' AFTER audio_pricing;


ALTER TABLE wallets 
  MODIFY COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'INR';

ALTER TABLE wallet_transactions 
  ADD COLUMN currency VARCHAR(3) DEFAULT 'INR' AFTER amount;

ALTER TABLE wallet_transactions 
  ADD COLUMN original_amount DECIMAL(10,2) DEFAULT NULL AFTER currency;

ALTER TABLE wallet_transactions 
  ADD COLUMN original_currency VARCHAR(3) DEFAULT NULL AFTER original_amount;


ALTER TABLE withdrawal_requests 
  ADD COLUMN currency VARCHAR(3) DEFAULT 'INR' AFTER amount;

-- 4) User currency preferences

DROP TABLE IF EXISTS `user_currency_preferences`;
CREATE TABLE `user_currency_preferences` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(36) NOT NULL,
  `preferred_currency` varchar(3) NOT NULL DEFAULT 'INR',
  `timezone` varchar(50) DEFAULT 'Asia/Kolkata',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `fk_user_currency_preferences_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO user_currency_preferences (user_id, preferred_currency, timezone)
SELECT u.id, COALESCE(u.currency, 'INR'), COALESCE(u.timezone, 'Asia/Kolkata')
FROM users u
WHERE u.role = 'expert'
ON DUPLICATE KEY UPDATE 
  preferred_currency = VALUES(preferred_currency),
  timezone = VALUES(timezone);

-- 5) Component display settings

DROP TABLE IF EXISTS `currency_display_settings`;
CREATE TABLE `currency_display_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `component_name` varchar(100) NOT NULL,
  `default_currency` varchar(3) NOT NULL DEFAULT 'INR',
  `show_currency_selector` boolean DEFAULT TRUE,
  `allow_currency_conversion` boolean DEFAULT TRUE,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `component_name` (`component_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO currency_display_settings (component_name, default_currency, show_currency_selector, allow_currency_conversion) VALUES
('expert_dashboard', 'INR', TRUE, TRUE),
('expert_profile', 'INR', TRUE, TRUE),
('booking_form', 'INR', TRUE, TRUE),
('wallet_page', 'INR', TRUE, TRUE),
('payment_page', 'INR', TRUE, TRUE),
('earnings_history', 'INR', TRUE, TRUE)
ON DUPLICATE KEY UPDATE
  default_currency=VALUES(default_currency),
  show_currency_selector=VALUES(show_currency_selector),
  allow_currency_conversion=VALUES(allow_currency_conversion);

-- 6) Backfill null/empty currencies
SET SQL_SAFE_UPDATES = 0;
UPDATE bookings 
SET currency = 'INR' 
WHERE (currency IS NULL OR currency = '') 
  AND id > 0;

UPDATE expert_profiles SET pricing_currency = 'INR' WHERE pricing_currency IS NULL OR pricing_currency = '';
UPDATE wallets SET currency = 'INR' WHERE currency IS NULL OR currency = '';

-- 7) Helpful indexes (may fail if already exist; that's OK during first run)
CREATE INDEX idx_bookings_currency ON bookings(currency);
CREATE INDEX idx_expert_profiles_pricing_currency ON expert_profiles(pricing_currency);
CREATE INDEX idx_wallet_transactions_currency ON wallet_transactions(currency);
CREATE INDEX idx_user_currency_preferences_currency ON user_currency_preferences(preferred_currency);

-- 8) View for today's conversion rates
CREATE OR REPLACE VIEW currency_conversion_view AS
SELECT 
    ccr.from_currency,
    ccr.to_currency,
    ccr.rate,
    ccr.`date`,
    cs_from.currency_symbol as from_symbol,
    cs_to.currency_symbol as to_symbol,
    cs_from.currency_name as from_name,
    cs_to.currency_name as to_name
FROM currency_conversion_rates ccr
JOIN currency_settings cs_from ON ccr.from_currency = cs_from.currency_code
JOIN currency_settings cs_to   ON ccr.to_currency   = cs_to.currency_code
WHERE ccr.`date` = CURDATE();

-- 9) Stored procedure for currency conversion
DROP PROCEDURE IF EXISTS ConvertCurrency;
DELIMITER //

CREATE PROCEDURE ConvertCurrency(
    IN p_amount DECIMAL(10,2),
    IN p_from_currency VARCHAR(3),
    IN p_to_currency VARCHAR(3),
    OUT p_converted_amount DECIMAL(10,2)
)
BEGIN
    DECLARE v_rate DECIMAL(10,6);

    -- If same currency, no conversion
    IF p_from_currency = p_to_currency THEN
        SET p_converted_amount = p_amount;
    ELSE
        -- Try direct rate for today
        SET v_rate = NULL;
        SELECT ccr.rate INTO v_rate
        FROM currency_conversion_rates ccr
        WHERE ccr.from_currency = p_from_currency
          AND ccr.to_currency   = p_to_currency
          AND ccr.`date`        = CURDATE()
        LIMIT 1;

        -- If no direct rate, try reverse
        IF v_rate IS NULL THEN
            SELECT (1/ccr.rate) INTO v_rate
            FROM currency_conversion_rates ccr
            WHERE ccr.from_currency = p_to_currency
              AND ccr.to_currency   = p_from_currency
              AND ccr.`date`        = CURDATE()
            LIMIT 1;
        END IF;

        -- Fallback to 1.0
        IF v_rate IS NULL THEN
            SET v_rate = 1.000000;
        END IF;

        SET p_converted_amount = ROUND(p_amount * v_rate, 2);
    END IF;
END //

DELIMITER ;



-- 9) Stored procedure for currency conversion
DROP PROCEDURE IF EXISTS ConvertCurrency;
DELIMITER //

CREATE PROCEDURE ConvertCurrency(
    IN p_amount DECIMAL(10,2),
    IN p_from_currency VARCHAR(3),
    IN p_to_currency VARCHAR(3),
    OUT p_converted_amount DECIMAL(10,2)
)
BEGIN
    DECLARE v_rate DECIMAL(10,6);

    -- If same currency, no conversion
    IF p_from_currency = p_to_currency THEN
        SET p_converted_amount = p_amount;
    ELSE
        -- Try direct rate for today
        SET v_rate = NULL;
        SELECT ccr.rate INTO v_rate
        FROM currency_conversion_rates ccr
        WHERE ccr.from_currency = p_from_currency
          AND ccr.to_currency   = p_to_currency
          AND ccr.`date`        = CURDATE()
        LIMIT 1;

        -- If no direct rate, try reverse
        IF v_rate IS NULL THEN
            SELECT (1/ccr.rate) INTO v_rate
            FROM currency_conversion_rates ccr
            WHERE ccr.from_currency = p_to_currency
              AND ccr.to_currency   = p_from_currency
              AND ccr.`date`        = CURDATE()
            LIMIT 1;
        END IF;

        -- Fallback to 1.0
        IF v_rate IS NULL THEN
            SET v_rate = 1.000000;
        END IF;

        SET p_converted_amount = ROUND(p_amount * v_rate, 2);
    END IF;
END //

DELIMITER ;


-- 10) Function for user preferred currency
DROP FUNCTION IF EXISTS GetUserPreferredCurrency;
DELIMITER //

CREATE FUNCTION GetUserPreferredCurrency(p_user_id VARCHAR(36))
RETURNS VARCHAR(3)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE v_currency VARCHAR(3) DEFAULT 'INR';

    SELECT ucp.preferred_currency
      INTO v_currency
    FROM user_currency_preferences ucp
    WHERE ucp.user_id = p_user_id
    LIMIT 1;

    IF v_currency IS NULL THEN
        SET v_currency = 'INR';
    END IF;

    RETURN v_currency;
END //

DELIMITER ;


-- 11) Triggers
DROP TRIGGER IF EXISTS before_booking_insert;
DELIMITER //

CREATE TRIGGER before_booking_insert
BEFORE INSERT ON bookings
FOR EACH ROW
BEGIN
    IF NEW.currency IS NULL OR NEW.currency = '' THEN
        SET NEW.currency = 'INR';
    END IF;

    IF NEW.original_amount IS NULL THEN
        SET NEW.original_amount = NEW.amount;
        SET NEW.original_currency = NEW.currency;
    END IF;
END //

DELIMITER ;


DROP TRIGGER IF EXISTS before_wallet_transaction_insert;
DELIMITER //

CREATE TRIGGER before_wallet_transaction_insert
BEFORE INSERT ON wallet_transactions
FOR EACH ROW
BEGIN
    IF NEW.currency IS NULL OR NEW.currency = '' THEN
        SET NEW.currency = 'INR';
    END IF;

    IF NEW.original_amount IS NULL THEN
        SET NEW.original_amount = NEW.amount;
        SET NEW.original_currency = NEW.currency;
    END IF;
END //

DELIMITER ;


-- 12) Sample historical rates
INSERT INTO currency_conversion_rates (from_currency, to_currency, rate, date) VALUES
('INR', 'USD', 0.0120, DATE_SUB(CURDATE(), INTERVAL 1 DAY))
ON DUPLICATE KEY UPDATE rate=VALUES(rate);
INSERT INTO currency_conversion_rates (from_currency, to_currency, rate, date) VALUES
('USD', 'INR', 83.5000, DATE_SUB(CURDATE(), INTERVAL 1 DAY))
ON DUPLICATE KEY UPDATE rate=VALUES(rate);
INSERT INTO currency_conversion_rates (from_currency, to_currency, rate, date) VALUES
('INR', 'USD', 0.0121, DATE_SUB(CURDATE(), INTERVAL 2 DAY))
ON DUPLICATE KEY UPDATE rate=VALUES(rate);
INSERT INTO currency_conversion_rates (from_currency, to_currency, rate, date) VALUES
('USD', 'INR', 82.8000, DATE_SUB(CURDATE(), INTERVAL 2 DAY))
ON DUPLICATE KEY UPDATE rate=VALUES(rate);

-- 13) Convenience view
CREATE OR REPLACE VIEW user_currency_info AS
SELECT 
    u.id as user_id,
    u.name,
    u.email,
    u.role,
    COALESCE(ucp.preferred_currency, 'INR') as preferred_currency,
    COALESCE(ucp.timezone, 'Asia/Kolkata') as timezone,
    cs.currency_symbol,
    cs.currency_name,
    cs.exchange_rate_to_usd
FROM users u
LEFT JOIN user_currency_preferences ucp ON u.id = ucp.user_id
LEFT JOIN currency_settings cs ON COALESCE(ucp.preferred_currency, 'INR') = cs.currency_code;

-- -- quick checks (commented out for production)
-- SELECT * FROM currency_conversion_view LIMIT 5;
-- SELECT GetUserPreferredCurrency('<some-user-id>');


-- Simple database update to ensure currency columns exist

-- Add currency columns to existing tables
SHOW COLUMNS FROM bookings LIKE 'currency';
SHOW COLUMNS FROM bookings LIKE 'original_amount';
SHOW COLUMNS FROM bookings LIKE 'original_currency';

SHOW COLUMNS FROM expert_profiles LIKE 'pricing_currency';
SHOW COLUMNS FROM wallets LIKE 'currency';

SHOW COLUMNS FROM wallet_transactions LIKE 'currency';
SHOW COLUMNS FROM wallet_transactions LIKE 'original_amount';
SHOW COLUMNS FROM wallet_transactions LIKE 'original_currency';

SHOW COLUMNS FROM withdrawal_requests LIKE 'currency';
ALTER TABLE wallets MODIFY COLUMN currency VARCHAR(3) DEFAULT 'INR';
SHOW COLUMNS FROM wallets LIKE 'currency';

CREATE TABLE IF NOT EXISTS user_currency_preferences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  preferred_currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY user_id (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Fix payment_transactions table to include missing columns
CREATE TABLE IF NOT EXISTS payment_transactions (
   id INT AUTO_INCREMENT PRIMARY KEY,
   booking_id VARCHAR(36) COLLATE utf8mb4_unicode_ci NOT NULL,
   merchant_transaction_id VARCHAR(100) NOT NULL UNIQUE,
   payment_id VARCHAR(100),
   amount DECIMAL(10,2) NOT NULL,
   status VARCHAR(20) NOT NULL,
   payment_type VARCHAR(50) DEFAULT 'booking',
   metadata JSON,
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
   FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add missing columns if table already exists
ALTER TABLE payment_transactions 
ADD COLUMN IF NOT EXISTS payment_type VARCHAR(50) DEFAULT 'booking',
ADD COLUMN IF NOT EXISTS metadata JSON;

-- Create consultation_requests table
CREATE TABLE IF NOT EXISTS consultation_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  mobile VARCHAR(20) NOT NULL,
  user_type ENUM('solution-seeker', 'expert') NOT NULL,
  whatsapp_consent TINYINT(1) DEFAULT 0,
  terms_accepted TINYINT(1) DEFAULT 0,
  status ENUM('pending', 'contacted', 'completed', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE user_consultation_requests 
ADD COLUMN user_id VARCHAR(255) NULL 
AFTER id;

-- Blogs table
CREATE TABLE blogs (
  id VARCHAR(36) COLLATE utf8mb4_unicode_ci PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  summary TEXT,
  content LONGTEXT,
  category VARCHAR(100),
  read_time INT,
  views INT DEFAULT 0,
  likes_count INT DEFAULT 0,
  author_id VARCHAR(36) COLLATE utf8mb4_unicode_ci,
  published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  cover_image VARCHAR(500),
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);


-- Comments table
CREATE TABLE comments (
  id VARCHAR(36) COLLATE utf8mb4_unicode_ci PRIMARY KEY,
  blog_id VARCHAR(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  user_id VARCHAR(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  comment TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (blog_id) REFERENCES blogs(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- Likes table (unique per blog per user)
CREATE TABLE likes (
  id VARCHAR(36) COLLATE utf8mb4_unicode_ci PRIMARY KEY,
  blog_id VARCHAR(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  user_id VARCHAR(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_likes (blog_id, user_id),
  FOREIGN KEY (blog_id) REFERENCES blogs(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Saved / Bookmarks table
CREATE TABLE saved (
  id VARCHAR(36) COLLATE utf8mb4_unicode_ci PRIMARY KEY,
  blog_id VARCHAR(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  user_id VARCHAR(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_saved (blog_id, user_id),
  FOREIGN KEY (blog_id) REFERENCES blogs(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Case Studies Schema

-- Table for case studies
CREATE TABLE IF NOT EXISTS case_studies (
  id varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  title varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  headline varchar(500) COLLATE utf8mb4_unicode_ci,
  cover_image varchar(255) COLLATE utf8mb4_unicode_ci,
  challenges text COLLATE utf8mb4_unicode_ci,
  failures text COLLATE utf8mb4_unicode_ci,
  created_by varchar(36) COLLATE utf8mb4_unicode_ci,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_case_studies_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for case study key points
CREATE TABLE IF NOT EXISTS case_study_key_points (
  id varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  case_study_id varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  point text COLLATE utf8mb4_unicode_ci NOT NULL,
  order_index int NOT NULL DEFAULT 0,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_key_points_case_study (case_study_id),
  KEY idx_key_points_order (case_study_id, order_index),
  CONSTRAINT case_study_key_points_ibfk_1 FOREIGN KEY (case_study_id) REFERENCES case_studies (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for case study paragraphs
CREATE TABLE IF NOT EXISTS case_study_paragraphs (
  id varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  case_study_id varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  text text COLLATE utf8mb4_unicode_ci NOT NULL,
  order_index int NOT NULL DEFAULT 0,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_paragraphs_case_study (case_study_id),
  KEY idx_paragraphs_order (case_study_id, order_index),
  CONSTRAINT case_study_paragraphs_ibfk_1 FOREIGN KEY (case_study_id) REFERENCES case_studies (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


