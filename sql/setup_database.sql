-- Run this script in MySQL Workbench while connected as a MySQL administrator.
-- It creates the local database, app user, and table used by Django.

CREATE DATABASE IF NOT EXISTS carbon_calculator
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'carbon_app'@'localhost'
    IDENTIFIED BY 'REPLACE_WITH_A_STRONG_PASSWORD';

GRANT SELECT, INSERT, DELETE
    ON carbon_calculator.*
    TO 'carbon_app'@'localhost';

USE carbon_calculator;

CREATE TABLE IF NOT EXISTS carbon_snapshots (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    visitor_id CHAR(32) NOT NULL,
    travel_km DECIMAL(12, 4) NOT NULL,
    electricity_kwh DECIMAL(12, 4) NOT NULL,
    diet ENUM('plant', 'vegetarian', 'mixed') NOT NULL,
    purchases INT UNSIGNED NOT NULL,
    travel_cut DECIMAL(5, 2) NOT NULL,
    energy_cut DECIMAL(5, 2) NOT NULL,
    total_kg DECIMAL(12, 2) NOT NULL,
    scenario_kg DECIMAL(12, 2) NOT NULL,
    factor_version VARCHAR(30) NOT NULL DEFAULT 'demo-v1',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_visitor_records (visitor_id, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SHOW TABLES;
DESCRIBE carbon_snapshots;
