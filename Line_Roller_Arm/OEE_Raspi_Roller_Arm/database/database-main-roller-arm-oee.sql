-- =========================================================
-- CREATE DATABASE & TABLES UNTUK FLOW NODE-RED TPS OEE
-- Aman dijalankan ulang: memakai IF NOT EXISTS dan INSERT IGNORE.
-- =========================================================

CREATE DATABASE IF NOT EXISTS `database_tps_oee_iaa_35` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `database_tps_oee_iaa_35`;

CREATE TABLE IF NOT EXISTS `timer_durations_mc_fault` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `timer_id` INT NOT NULL DEFAULT 1,
    `duration` DECIMAL(12,3) NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_timer_id` (`timer_id`),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `timer_durations_quality_check` LIKE `timer_durations_mc_fault`;
CREATE TABLE IF NOT EXISTS `timer_durations_tool_change` LIKE `timer_durations_mc_fault`;
CREATE TABLE IF NOT EXISTS `timer_durations_arm_no_part` LIKE `timer_durations_mc_fault`;
CREATE TABLE IF NOT EXISTS `timer_durations_roller_no_part` LIKE `timer_durations_mc_fault`;
CREATE TABLE IF NOT EXISTS `timer_durations_pin_no_part` LIKE `timer_durations_mc_fault`;
CREATE TABLE IF NOT EXISTS `timer_durations_loading_time` LIKE `timer_durations_mc_fault`;
CREATE TABLE IF NOT EXISTS `timer_durations_loading_time_persecond` LIKE `timer_durations_mc_fault`;

CREATE TABLE IF NOT EXISTS `table_montiv_roller_arm_iaa_35` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `line_id` VARCHAR(50) DEFAULT NULL,
    `pg` VARCHAR(50) DEFAULT NULL,
    `line_name` VARCHAR(100) DEFAULT NULL,
    `name_product` VARCHAR(150) DEFAULT NULL,
    `target` VARCHAR(50) DEFAULT NULL,
    `actual` VARCHAR(50) DEFAULT NULL,
    `loading_time` VARCHAR(50) DEFAULT NULL,
    `efficiency` VARCHAR(50) DEFAULT NULL,
    `delay` VARCHAR(50) DEFAULT NULL,
    `cycle_time` VARCHAR(50) DEFAULT NULL,
    `status` VARCHAR(50) DEFAULT NULL,
    `time_trouble` VARCHAR(50) DEFAULT NULL,
    `time_trouble_quality` VARCHAR(50) DEFAULT NULL,
    `andon` VARCHAR(50) DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_line_id` (`line_id`),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE DATABASE IF NOT EXISTS `database_tps_oee_iaa_33` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `database_tps_oee_iaa_33`;
CREATE TABLE IF NOT EXISTS `timer_durations_mc_fault` LIKE `database_tps_oee_iaa_35`.`timer_durations_mc_fault`;
CREATE TABLE IF NOT EXISTS `timer_durations_quality_check` LIKE `database_tps_oee_iaa_35`.`timer_durations_mc_fault`;
CREATE TABLE IF NOT EXISTS `timer_durations_tool_change` LIKE `database_tps_oee_iaa_35`.`timer_durations_mc_fault`;
CREATE TABLE IF NOT EXISTS `timer_durations_arm_no_part` LIKE `database_tps_oee_iaa_35`.`timer_durations_mc_fault`;
CREATE TABLE IF NOT EXISTS `timer_durations_roller_no_part` LIKE `database_tps_oee_iaa_35`.`timer_durations_mc_fault`;
CREATE TABLE IF NOT EXISTS `timer_durations_pin_no_part` LIKE `database_tps_oee_iaa_35`.`timer_durations_mc_fault`;
CREATE TABLE IF NOT EXISTS `table_montiv_roller_arm_iaa_33` LIKE `database_tps_oee_iaa_35`.`table_montiv_roller_arm_iaa_35`;

CREATE DATABASE IF NOT EXISTS `database_tps_oee_iaa_36` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `database_tps_oee_iaa_36`;
CREATE TABLE IF NOT EXISTS `timer_durations_mc_fault` LIKE `database_tps_oee_iaa_35`.`timer_durations_mc_fault`;
CREATE TABLE IF NOT EXISTS `timer_durations_quality_check` LIKE `database_tps_oee_iaa_35`.`timer_durations_mc_fault`;
CREATE TABLE IF NOT EXISTS `timer_durations_tool_change` LIKE `database_tps_oee_iaa_35`.`timer_durations_mc_fault`;
CREATE TABLE IF NOT EXISTS `timer_durations_arm_no_part` LIKE `database_tps_oee_iaa_35`.`timer_durations_mc_fault`;
CREATE TABLE IF NOT EXISTS `timer_durations_roller_no_part` LIKE `database_tps_oee_iaa_35`.`timer_durations_mc_fault`;
CREATE TABLE IF NOT EXISTS `timer_durations_pin_no_part` LIKE `database_tps_oee_iaa_35`.`timer_durations_mc_fault`;

CREATE DATABASE IF NOT EXISTS `database_tps_oee_iam_72` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `database_tps_oee_iam_72`;
CREATE TABLE IF NOT EXISTS `timer_durations_mc_fault` LIKE `database_tps_oee_iaa_35`.`timer_durations_mc_fault`;
CREATE TABLE IF NOT EXISTS `timer_durations_hopper_no_part` LIKE `database_tps_oee_iaa_35`.`timer_durations_mc_fault`;

CREATE DATABASE IF NOT EXISTS `database_tps_oee_iam_73` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `database_tps_oee_iam_73`;
CREATE TABLE IF NOT EXISTS `timer_durations_mc_fault` LIKE `database_tps_oee_iaa_35`.`timer_durations_mc_fault`;
CREATE TABLE IF NOT EXISTS `timer_durations_hopper_no_part` LIKE `database_tps_oee_iaa_35`.`timer_durations_mc_fault`;

CREATE DATABASE IF NOT EXISTS `database_tps_oee_iam_80` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `database_tps_oee_iam_80`;
CREATE TABLE IF NOT EXISTS `timer_durations_mc_fault` LIKE `database_tps_oee_iaa_35`.`timer_durations_mc_fault`;
CREATE TABLE IF NOT EXISTS `timer_durations_hopper_no_part` LIKE `database_tps_oee_iaa_35`.`timer_durations_mc_fault`;

CREATE DATABASE IF NOT EXISTS `database_tps_oee_ispbr3` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `database_tps_oee_ispbr3`;
CREATE TABLE IF NOT EXISTS `timer_durations_ispbr3on_mcfault` LIKE `database_tps_oee_iaa_35`.`timer_durations_mc_fault`;
CREATE TABLE IF NOT EXISTS `timer_durations_ispbr3on_fullwork` LIKE `database_tps_oee_iaa_35`.`timer_durations_mc_fault`;
CREATE TABLE IF NOT EXISTS `timer_durations_ispbr3on_qualitycheck` LIKE `database_tps_oee_iaa_35`.`timer_durations_mc_fault`;
CREATE TABLE IF NOT EXISTS `timer_durations_ispbr3on_qualitycheckmtc` LIKE `database_tps_oee_iaa_35`.`timer_durations_mc_fault`;

CREATE DATABASE IF NOT EXISTS `database_tps_oee_roller_arm` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `database_tps_oee_roller_arm`;

CREATE TABLE IF NOT EXISTS `table_andon` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `andon` VARCHAR(100) DEFAULT NULL,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
INSERT IGNORE INTO `table_andon` (`id`, `andon`) VALUES (1, '0');

CREATE TABLE IF NOT EXISTS `table_condition_andon` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `iaa35_arm` TINYINT NOT NULL DEFAULT 2,
    `iaa35_pin` TINYINT NOT NULL DEFAULT 2,
    `iaa35_bearing` TINYINT NOT NULL DEFAULT 2,
    `iaa33_arm` TINYINT NOT NULL DEFAULT 2,
    `iaa33_pin` TINYINT NOT NULL DEFAULT 2,
    `iaa33_bearing` TINYINT NOT NULL DEFAULT 2,
    `iaa36_arm` TINYINT NOT NULL DEFAULT 2,
    `iaa36_pin` TINYINT NOT NULL DEFAULT 2,
    `iaa36_bearing` TINYINT NOT NULL DEFAULT 2,
    `iam72_mc_fault` TINYINT NOT NULL DEFAULT 2,
    `iam72_hopper` TINYINT NOT NULL DEFAULT 2,
    `iam73_mc_fault` TINYINT NOT NULL DEFAULT 2,
    `iam73_hopper` TINYINT NOT NULL DEFAULT 2,
    `iam80_mc_fault` TINYINT NOT NULL DEFAULT 2,
    `iam80_hopper` TINYINT NOT NULL DEFAULT 2,
    `ispbr3_mc_fault` TINYINT NOT NULL DEFAULT 2,
    `ispbr3_arm_nr` TINYINT NOT NULL DEFAULT 2,
    `ispbr3_arm_d31e` TINYINT NOT NULL DEFAULT 2,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
INSERT IGNORE INTO `table_condition_andon` (`id`) VALUES (1);
