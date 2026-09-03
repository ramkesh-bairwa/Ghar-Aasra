-- Flex Home real estate portal — MySQL schema
-- Run: mysql -u root -p flexhome < database/schema.sql

CREATE DATABASE IF NOT EXISTS flexhome CHARACTER SET utf8mb4;
USE flexhome;

-- ---------- Users & roles (site users + admin panel accounts) ----------
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(30),
  role ENUM('buyer', 'agent', 'developer', 'admin') NOT NULL DEFAULT 'buyer',
  avatar_url VARCHAR(500),
  status ENUM('active', 'suspended') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ---------- Agents / brokers (extends users where role = 'agent') ----------
CREATE TABLE IF NOT EXISTS agents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  agency_name VARCHAR(160),
  license_number VARCHAR(80),
  bio TEXT,
  years_experience INT DEFAULT 0,
  whatsapp VARCHAR(30),
  rating DECIMAL(2,1) DEFAULT 0.0,
  review_count INT DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------- Developers / builders (extends users where role = 'developer') ----------
CREATE TABLE IF NOT EXISTS developers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  company_name VARCHAR(160) NOT NULL,
  logo_url VARCHAR(500),
  description TEXT,
  founded_year INT,
  website VARCHAR(255),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------- Locations (cities / neighborhoods) ----------
CREATE TABLE IF NOT EXISTS locations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  city VARCHAR(120) NOT NULL,
  region VARCHAR(120),
  country VARCHAR(120) NOT NULL,
  slug VARCHAR(160) NOT NULL UNIQUE,
  cover_image_url VARCHAR(500),
  description TEXT
);

-- ---------- Categories & subcategories (organizational taxonomy, separate from listing_type/property_type) ----------
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(140) NOT NULL UNIQUE,
  sort_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS subcategories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(140) NOT NULL,
  sort_order INT DEFAULT 0,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_category_slug (category_id, slug)
);

-- ---------- Properties ----------
CREATE TABLE IF NOT EXISTS properties (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(220) NOT NULL UNIQUE,
  description TEXT,
  listing_type ENUM('sale', 'rent', 'commercial') NOT NULL,
  property_type ENUM('apartment', 'villa', 'house', 'land', 'commercial', 'office') NOT NULL,
  category_id INT NULL,
  subcategory_id INT NULL,
  price DECIMAL(14,2) NOT NULL,
  price_period ENUM('one_time', 'monthly', 'yearly') NOT NULL DEFAULT 'one_time',
  bedrooms SMALLINT DEFAULT 0,
  bathrooms SMALLINT DEFAULT 0,
  area_sqm DECIMAL(10,2),
  carpet_area_sqm DECIMAL(10,2),
  built_up_area_sqm DECIMAL(10,2),
  address VARCHAR(255),
  cover_image_url VARCHAR(500),
  video_url VARCHAR(500),
  location_id INT,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  status ENUM('draft', 'published', 'under_offer', 'sold', 'rented') NOT NULL DEFAULT 'draft',
  agent_id INT,
  project_id INT NULL,
  views_count INT DEFAULT 0,
  featured TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL,
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL,
  INDEX idx_listing_type (listing_type),
  INDEX idx_property_type (property_type),
  INDEX idx_status (status)
);

-- `properties` may already exist from an earlier run of this script (CREATE TABLE IF NOT
-- EXISTS is then a no-op), so add any columns introduced since then explicitly.

-- Helper macro (repeated for each new column)
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'balconies');
SET @s = IF(@col_exists=0,'ALTER TABLE properties ADD COLUMN balconies SMALLINT DEFAULT 0','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'floor_number');
SET @s = IF(@col_exists=0,'ALTER TABLE properties ADD COLUMN floor_number SMALLINT','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'total_floors');
SET @s = IF(@col_exists=0,'ALTER TABLE properties ADD COLUMN total_floors SMALLINT','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'property_age');
SET @s = IF(@col_exists=0,'ALTER TABLE properties ADD COLUMN property_age VARCHAR(60)','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'facing');
SET @s = IF(@col_exists=0,"ALTER TABLE properties ADD COLUMN facing ENUM('east','west','north','south','north_east','north_west','south_east','south_west')","SELECT 1"); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'furnishing');
SET @s = IF(@col_exists=0,"ALTER TABLE properties ADD COLUMN furnishing ENUM('furnished','semi_furnished','unfurnished')","SELECT 1"); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'parking');
SET @s = IF(@col_exists=0,"ALTER TABLE properties ADD COLUMN parking TINYINT(1) DEFAULT 0","SELECT 1"); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'parking_spaces');
SET @s = IF(@col_exists=0,'ALTER TABLE properties ADD COLUMN parking_spaces SMALLINT DEFAULT 0','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'construction_status');
SET @s = IF(@col_exists=0,"ALTER TABLE properties ADD COLUMN construction_status ENUM('ready_to_move','under_construction','new_launch')","SELECT 1"); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'possession_date');
SET @s = IF(@col_exists=0,'ALTER TABLE properties ADD COLUMN possession_date DATE','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'negotiable');
SET @s = IF(@col_exists=0,'ALTER TABLE properties ADD COLUMN negotiable TINYINT(1) DEFAULT 0','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'rera_number');
SET @s = IF(@col_exists=0,'ALTER TABLE properties ADD COLUMN rera_number VARCHAR(100)','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'locality');
SET @s = IF(@col_exists=0,'ALTER TABLE properties ADD COLUMN locality VARCHAR(160)','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'state');
SET @s = IF(@col_exists=0,'ALTER TABLE properties ADD COLUMN state VARCHAR(120)','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'zip_code');
SET @s = IF(@col_exists=0,'ALTER TABLE properties ADD COLUMN zip_code VARCHAR(20)','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'nearby_landmarks');
SET @s = IF(@col_exists=0,'ALTER TABLE properties ADD COLUMN nearby_landmarks TEXT','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'maintenance_charges');
SET @s = IF(@col_exists=0,'ALTER TABLE properties ADD COLUMN maintenance_charges DECIMAL(10,2)','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'security_deposit');
SET @s = IF(@col_exists=0,'ALTER TABLE properties ADD COLUMN security_deposit DECIMAL(12,2)','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'min_rental_period');
SET @s = IF(@col_exists=0,'ALTER TABLE properties ADD COLUMN min_rental_period VARCHAR(60)','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'available_from');
SET @s = IF(@col_exists=0,'ALTER TABLE properties ADD COLUMN available_from DATE','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'owner_name');
SET @s = IF(@col_exists=0,'ALTER TABLE properties ADD COLUMN owner_name VARCHAR(160)','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'ownership_type');
SET @s = IF(@col_exists=0,"ALTER TABLE properties ADD COLUMN ownership_type ENUM('freehold','leasehold','cooperative','power_of_attorney')","SELECT 1"); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'virtual_tour_url');
SET @s = IF(@col_exists=0,'ALTER TABLE properties ADD COLUMN virtual_tour_url VARCHAR(500)','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'floor_plan_url');
SET @s = IF(@col_exists=0,'ALTER TABLE properties ADD COLUMN floor_plan_url VARCHAR(500)','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'brochure_url');
SET @s = IF(@col_exists=0,'ALTER TABLE properties ADD COLUMN brochure_url VARCHAR(500)','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'site_plan_url');
SET @s = IF(@col_exists=0,'ALTER TABLE properties ADD COLUMN site_plan_url VARCHAR(500)','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'premium');
SET @s = IF(@col_exists=0,'ALTER TABLE properties ADD COLUMN premium TINYINT(1) DEFAULT 0','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'luxury');
SET @s = IF(@col_exists=0,'ALTER TABLE properties ADD COLUMN luxury TINYINT(1) DEFAULT 0','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'verified');
SET @s = IF(@col_exists=0,'ALTER TABLE properties ADD COLUMN verified TINYINT(1) DEFAULT 0','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'approved');
SET @s = IF(@col_exists=0,'ALTER TABLE properties ADD COLUMN approved TINYINT(1) DEFAULT 0','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'tags');
SET @s = IF(@col_exists=0,'ALTER TABLE properties ADD COLUMN tags VARCHAR(500)','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'bhk');
SET @s = IF(@col_exists=0,'ALTER TABLE properties ADD COLUMN bhk VARCHAR(20)','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'available_status');
SET @s = IF(@col_exists=0,"ALTER TABLE properties ADD COLUMN available_status ENUM('available','sold','rented','reserved') DEFAULT 'available'",'SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'property_custom_id');
SET @s = IF(@col_exists=0,'ALTER TABLE properties ADD COLUMN property_custom_id VARCHAR(60)','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'rent_price');
SET @s = IF(@col_exists=0,'ALTER TABLE properties ADD COLUMN rent_price DECIMAL(14,2)','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'price_per_sqft');
SET @s = IF(@col_exists=0,'ALTER TABLE properties ADD COLUMN price_per_sqft DECIMAL(10,2)','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'brokerage');
SET @s = IF(@col_exists=0,'ALTER TABLE properties ADD COLUMN brokerage DECIMAL(10,2)','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'registration_charges');
SET @s = IF(@col_exists=0,'ALTER TABLE properties ADD COLUMN registration_charges DECIMAL(10,2)','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'stamp_duty');
SET @s = IF(@col_exists=0,'ALTER TABLE properties ADD COLUMN stamp_duty DECIMAL(10,2)','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'other_charges');
SET @s = IF(@col_exists=0,'ALTER TABLE properties ADD COLUMN other_charges DECIMAL(10,2)','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

-- ---- "Property Intelligence" + "Financial & Investment" fields ----
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'listing_condition');
SET @s = IF(@col_exists=0,"ALTER TABLE properties ADD COLUMN listing_condition ENUM('new','resale')",'SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'builder_name');
SET @s = IF(@col_exists=0,'ALTER TABLE properties ADD COLUMN builder_name VARCHAR(160)','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'tower_block');
SET @s = IF(@col_exists=0,'ALTER TABLE properties ADD COLUMN tower_block VARCHAR(80)','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'unit_number');
SET @s = IF(@col_exists=0,'ALTER TABLE properties ADD COLUMN unit_number VARCHAR(40)','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'last_renovated_date');
SET @s = IF(@col_exists=0,'ALTER TABLE properties ADD COLUMN last_renovated_date DATE','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'maintenance_frequency');
SET @s = IF(@col_exists=0,"ALTER TABLE properties ADD COLUMN maintenance_frequency ENUM('monthly','quarterly','half_yearly','yearly')",'SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'property_tax_status');
SET @s = IF(@col_exists=0,"ALTER TABLE properties ADD COLUMN property_tax_status ENUM('paid','pending','included_in_maintenance')",'SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'loan_available');
SET @s = IF(@col_exists=0,'ALTER TABLE properties ADD COLUMN loan_available TINYINT(1) DEFAULT 0','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'rental_yield_percent');
SET @s = IF(@col_exists=0,'ALTER TABLE properties ADD COLUMN rental_yield_percent DECIMAL(5,2)','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'estimated_monthly_rent');
SET @s = IF(@col_exists=0,'ALTER TABLE properties ADD COLUMN estimated_monthly_rent DECIMAL(12,2)','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'capital_appreciation');
SET @s = IF(@col_exists=0,"ALTER TABLE properties ADD COLUMN capital_appreciation ENUM('low','medium','high')",'SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'investment_score');
SET @s = IF(@col_exists=0,'ALTER TABLE properties ADD COLUMN investment_score TINYINT','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'rental_demand_score');
SET @s = IF(@col_exists=0,'ALTER TABLE properties ADD COLUMN rental_demand_score TINYINT','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'location_growth_score');
SET @s = IF(@col_exists=0,'ALTER TABLE properties ADD COLUMN location_growth_score TINYINT','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'future_development_score');
SET @s = IF(@col_exists=0,'ALTER TABLE properties ADD COLUMN future_development_score TINYINT','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'parking_slot_number');
SET @s = IF(@col_exists=0,'ALTER TABLE properties ADD COLUMN parking_slot_number VARCHAR(40)','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'category_id'
);
SET @add_col = IF(@col_exists = 0, 'ALTER TABLE properties ADD COLUMN category_id INT NULL', 'SELECT 1');
PREPARE add_col FROM @add_col; EXECUTE add_col; DEALLOCATE PREPARE add_col;

SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'subcategory_id'
);
SET @add_col = IF(@col_exists = 0, 'ALTER TABLE properties ADD COLUMN subcategory_id INT NULL', 'SELECT 1');
PREPARE add_col FROM @add_col; EXECUTE add_col; DEALLOCATE PREPARE add_col;

SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'carpet_area_sqm'
);
SET @add_col = IF(@col_exists = 0, 'ALTER TABLE properties ADD COLUMN carpet_area_sqm DECIMAL(10,2)', 'SELECT 1');
PREPARE add_col FROM @add_col; EXECUTE add_col; DEALLOCATE PREPARE add_col;

SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'built_up_area_sqm'
);
SET @add_col = IF(@col_exists = 0, 'ALTER TABLE properties ADD COLUMN built_up_area_sqm DECIMAL(10,2)', 'SELECT 1');
PREPARE add_col FROM @add_col; EXECUTE add_col; DEALLOCATE PREPARE add_col;

SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'video_url'
);
SET @add_col = IF(@col_exists = 0, 'ALTER TABLE properties ADD COLUMN video_url VARCHAR(500)', 'SELECT 1');
PREPARE add_col FROM @add_col; EXECUTE add_col; DEALLOCATE PREPARE add_col;

SET @cat_fk_exists = (
  SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'fk_properties_category'
);
SET @add_cat_fk = IF(
  @cat_fk_exists = 0,
  'ALTER TABLE properties ADD CONSTRAINT fk_properties_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL',
  'SELECT 1'
);
PREPARE add_cat_fk FROM @add_cat_fk;
EXECUTE add_cat_fk;
DEALLOCATE PREPARE add_cat_fk;

SET @subcat_fk_exists = (
  SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'fk_properties_subcategory'
);
SET @add_subcat_fk = IF(
  @subcat_fk_exists = 0,
  'ALTER TABLE properties ADD CONSTRAINT fk_properties_subcategory FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL',
  'SELECT 1'
);
PREPARE add_subcat_fk FROM @add_subcat_fk;
EXECUTE add_subcat_fk;
DEALLOCATE PREPARE add_subcat_fk;

CREATE TABLE IF NOT EXISTS property_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  property_id INT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  sort_order INT DEFAULT 0,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS property_features (
  id INT AUTO_INCREMENT PRIMARY KEY,
  property_id INT NOT NULL,
  feature VARCHAR(120) NOT NULL, -- e.g. "Swimming pool", "Parking", "Pet friendly"
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- ---------- Amenities (managed master list — name shown to buyers, icon_key
-- matched against lib/amenityIcons.js. property_features.feature still stores
-- the plain name so existing/manual entries keep working without icons.) ----------
CREATE TABLE IF NOT EXISTS amenities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  icon_key VARCHAR(60) NOT NULL DEFAULT 'other',
  category VARCHAR(60) DEFAULT 'other',
  sort_order INT DEFAULT 0
);

-- `amenities` may already exist from an earlier run without `category`.
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'amenities' AND COLUMN_NAME = 'category');
SET @s = IF(@col_exists=0,"ALTER TABLE amenities ADD COLUMN category VARCHAR(60) DEFAULT 'other'",'SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

-- ---------- Carpet area presets — pick "2 BHK" on a property and its usual
-- carpet/built-up area and bedroom count fill in automatically. ----------
CREATE TABLE IF NOT EXISTS carpet_area_presets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subcategory_id INT NOT NULL,
  label VARCHAR(80) NOT NULL, -- e.g. "1 BHK", "2 BHK", "3 BHK Villa"
  carpet_area_sqm DECIMAL(10,2) NOT NULL,
  built_up_area_sqm DECIMAL(10,2),
  bedrooms SMALLINT,
  sort_order INT DEFAULT 0,
  FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_subcategory_label (subcategory_id, label)
);

-- `carpet_area_presets` may already exist from an earlier run without this
-- constraint — without it, INSERT IGNORE below has nothing to conflict on
-- and silently duplicates the seed rows every time this script re-runs.
SET @preset_uniq_exists = (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'carpet_area_presets' AND INDEX_NAME = 'uniq_subcategory_label'
);
SET @add_preset_uniq = IF(@preset_uniq_exists = 0, 'ALTER TABLE carpet_area_presets ADD UNIQUE KEY uniq_subcategory_label (subcategory_id, label)', 'SELECT 1');
PREPARE add_preset_uniq FROM @add_preset_uniq;
EXECUTE add_preset_uniq;
DEALLOCATE PREPARE add_preset_uniq;

-- ---------- New / upcoming projects ----------
CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(220) NOT NULL UNIQUE,
  developer_id INT,
  location_id INT,
  description TEXT,
  cover_image_url VARCHAR(500),
  status ENUM('presale', 'under_construction', 'selling', 'completed') NOT NULL DEFAULT 'presale',
  handover_date DATE,
  starting_price DECIMAL(14,2),
  total_units INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (developer_id) REFERENCES developers(id) ON DELETE SET NULL,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL
);

SET @project_fk_exists = (
  SELECT COUNT(*)
  FROM information_schema.REFERENTIAL_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND CONSTRAINT_NAME = 'fk_properties_project'
);
SET @add_project_fk = IF(
  @project_fk_exists = 0,
  'ALTER TABLE properties ADD CONSTRAINT fk_properties_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL',
  'SELECT 1'
);
PREPARE add_project_fk FROM @add_project_fk;
EXECUTE add_project_fk;
DEALLOCATE PREPARE add_project_fk;

-- ---------- Buyer inquiries / contact requests ----------
CREATE TABLE IF NOT EXISTS inquiries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  property_id INT NULL,
  project_id INT NULL,
  agent_id INT NULL,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL,
  phone VARCHAR(30),
  message TEXT,
  status ENUM('new', 'contacted', 'closed') NOT NULL DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL
);

-- ---------- Schedule-a-visit leads (public form, no login required — distinct
-- from `bookings`, which is a logged-in buyer's confirmed visit on a specific
-- property. This is a lower-friction "get in touch to arrange a viewing" lead,
-- optionally tied to a property, managed by staff via the admin panel.) ----------
CREATE TABLE IF NOT EXISTS visit_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL, -- set when the submitter was signed in; NULL for guest leads
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL,
  phone VARCHAR(30),
  property_id INT NULL,
  preferred_date DATE NOT NULL,
  preferred_time VARCHAR(20) NOT NULL,
  message TEXT,
  status ENUM('new', 'contacted', 'scheduled', 'closed') NOT NULL DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ---------- Saved / favorited properties ----------
CREATE TABLE IF NOT EXISTS favorites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  property_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_user_property (user_id, property_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- ---------- Property viewing bookings ----------
CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  property_id INT NOT NULL,
  scheduled_at DATETIME NOT NULL,
  notes VARCHAR(500),
  status ENUM('pending', 'confirmed', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- ---------- Blog / news ----------
CREATE TABLE IF NOT EXISTS blog_posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(220) NOT NULL,
  slug VARCHAR(240) NOT NULL UNIQUE,
  category VARCHAR(80),
  cover_image_url VARCHAR(500),
  excerpt VARCHAR(400),
  content MEDIUMTEXT,
  author_id INT,
  published_at TIMESTAMP NULL,
  status ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ---------- FAQ ----------
CREATE TABLE IF NOT EXISTS faqs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question VARCHAR(255) NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(80),
  sort_order INT DEFAULT 0
);

-- ---------- Static pages (About, Privacy Policy, Terms) ----------
CREATE TABLE IF NOT EXISTS pages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(120) NOT NULL UNIQUE, -- 'about-us' | 'privacy-policy' | 'terms'
  title VARCHAR(200) NOT NULL,
  content MEDIUMTEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ---------- Site settings (key/value store, e.g. the homepage hero video) ----------
CREATE TABLE IF NOT EXISTS site_settings (
  setting_key VARCHAR(80) NOT NULL PRIMARY KEY,
  setting_value TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ---------- Zoho Calendar integration (key/value store, same shape as
-- site_settings but a SEPARATE table on purpose — it holds an OAuth refresh
-- token, and site_settings is read in bulk by getAllSiteSettings() which
-- feeds public pages/metadata. Keeping it isolated means the token can never
-- end up in that shared, cached, broadly-read object. See lib/zoho.js. ----------
CREATE TABLE IF NOT EXISTS zoho_settings (
  setting_key VARCHAR(80) NOT NULL PRIMARY KEY,
  setting_value TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ---------- Seed: locations ----------
INSERT IGNORE INTO locations (city, region, country, slug, cover_image_url) VALUES
('Amsterdam', NULL, 'Netherlands', 'amsterdam', 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?q=80&w=800&auto=format&fit=crop'),
('Copenhagen', NULL, 'Denmark', 'copenhagen', 'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?q=80&w=800&auto=format&fit=crop'),
('London', 'England', 'United Kingdom', 'london', 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=800&auto=format&fit=crop'),
('New York City', 'New York', 'United States', 'new-york-city', 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=800&auto=format&fit=crop'),
('Paris', NULL, 'France', 'paris', 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=800&auto=format&fit=crop'),
('Munich', 'Bavaria', 'Germany', 'munich', 'https://images.unsplash.com/photo-1595867818082-083862f3d630?q=80&w=800&auto=format&fit=crop');

-- ---------- Seed: categories & subcategories ----------
INSERT IGNORE INTO categories (name, slug, sort_order) VALUES
('Residential', 'residential', 1),
('Commercial', 'commercial', 2),
('Land', 'land', 3);

INSERT IGNORE INTO subcategories (category_id, name, slug, sort_order) VALUES
((SELECT id FROM categories WHERE slug = 'residential'), 'Apartment', 'apartment', 1),
((SELECT id FROM categories WHERE slug = 'residential'), 'Villa', 'villa', 2),
((SELECT id FROM categories WHERE slug = 'residential'), 'House', 'house', 3),
((SELECT id FROM categories WHERE slug = 'commercial'), 'Office', 'office', 1),
((SELECT id FROM categories WHERE slug = 'commercial'), 'Retail / Commercial space', 'commercial-space', 2),
((SELECT id FROM categories WHERE slug = 'land'), 'Plot', 'plot', 1);

-- ---------- Seed: amenities ----------
INSERT IGNORE INTO amenities (name, icon_key, sort_order) VALUES
('Roof terrace', 'roof_terrace', 1),
('Parking', 'parking', 2),
('Swimming pool', 'swimming_pool', 3),
('Pet friendly', 'pet_friendly', 4),
('Home office', 'home_office', 5),
('Concierge', 'concierge', 6),
('Garden', 'garden', 7),
('Gym', 'gym', 8),
('Wifi', 'wifi', 9),
('Air conditioning', 'air_conditioning', 10),
('24/7 security', 'security', 11),
('EV charging', 'ev_charging', 12),
('Elevator', 'elevator', 13);

-- ---------- Seed: carpet area presets ----------
INSERT IGNORE INTO carpet_area_presets (subcategory_id, label, carpet_area_sqm, built_up_area_sqm, bedrooms, sort_order) VALUES
((SELECT id FROM subcategories WHERE slug = 'apartment'), 'Studio', 28, 35, 0, 1),
((SELECT id FROM subcategories WHERE slug = 'apartment'), '1 BHK', 45, 58, 1, 2),
((SELECT id FROM subcategories WHERE slug = 'apartment'), '2 BHK', 68, 85, 2, 3),
((SELECT id FROM subcategories WHERE slug = 'apartment'), '3 BHK', 95, 120, 3, 4),
((SELECT id FROM subcategories WHERE slug = 'apartment'), '4 BHK', 130, 165, 4, 5),
((SELECT id FROM subcategories WHERE slug = 'villa'), '3 BHK Villa', 180, 220, 3, 1),
((SELECT id FROM subcategories WHERE slug = 'villa'), '4 BHK Villa', 250, 300, 4, 2),
((SELECT id FROM subcategories WHERE slug = 'villa'), '5 BHK Villa', 320, 380, 5, 3),
((SELECT id FROM subcategories WHERE slug = 'house'), '2 BHK House', 75, 95, 2, 1),
((SELECT id FROM subcategories WHERE slug = 'house'), '3 BHK House', 110, 140, 3, 2),
((SELECT id FROM subcategories WHERE slug = 'house'), '4 BHK House', 150, 190, 4, 3),
((SELECT id FROM subcategories WHERE slug = 'office'), 'Compact Office', 20, 25, 0, 1),
((SELECT id FROM subcategories WHERE slug = 'office'), 'Small Office', 45, 58, 0, 2),
((SELECT id FROM subcategories WHERE slug = 'office'), 'Mid-size Office', 90, 115, 0, 3),
((SELECT id FROM subcategories WHERE slug = 'office'), 'Large Office Floor', 180, 230, 0, 4),
((SELECT id FROM subcategories WHERE slug = 'commercial-space'), 'Compact Retail Unit', 30, 38, 0, 1),
((SELECT id FROM subcategories WHERE slug = 'commercial-space'), 'Mid-size Retail Unit', 70, 90, 0, 2),
((SELECT id FROM subcategories WHERE slug = 'commercial-space'), 'Large Showroom', 150, 190, 0, 3),
((SELECT id FROM subcategories WHERE slug = 'plot'), 'Small Plot', 100, NULL, 0, 1),
((SELECT id FROM subcategories WHERE slug = 'plot'), 'Mid Plot', 200, NULL, 0, 2),
((SELECT id FROM subcategories WHERE slug = 'plot'), 'Large Plot', 400, NULL, 0, 3);

-- ---------- Seed: admin login ----------
-- Email: admin@flexhome.com  /  Password: admin123  (change this after first login)
INSERT IGNORE INTO users (name, email, password_hash, role) VALUES
('Site Admin', 'admin@flexhome.com', '$2a$10$Zkz7n05MVI1YTBv/KnZTw.rO2WmNbfIwQ.8ugRY.qjXbdCcAAjgV6', 'admin');

-- ---------- Seed: static pages ----------
INSERT IGNORE INTO pages (slug, title, content) VALUES
('about-us', 'About Flex Home', 'Flex Home started in 2019 to fix inaccurate listings and slow agents. Edit this page from the admin panel.'),
('privacy-policy', 'Privacy Policy', 'Add your privacy policy content here from the admin panel.'),
('terms', 'Terms & Conditions', 'Add your terms and conditions content here from the admin panel.');
