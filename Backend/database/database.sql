-- NGO Food Donation System - PostgreSQL schema
-- Run CREATE DATABASE separately, then connect to ngo_food_donation.

CREATE TABLE IF NOT EXISTS donor (
    donor_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    donor_type VARCHAR(30) NOT NULL DEFAULT 'Individual',
    password_hash TEXT NOT NULL,
    CONSTRAINT donor_type_check CHECK (donor_type IN ('Individual','Restaurant','Hotel','Event Organizer','Organization'))
);

CREATE TABLE IF NOT EXISTS ngo (
    ngo_id SERIAL PRIMARY KEY,
    ngo_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS volunteer (
    volunteer_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    vehicle VARCHAR(100),
    availability BOOLEAN NOT NULL DEFAULT TRUE,
    password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS food_donation (
    donation_id SERIAL PRIMARY KEY,
    donor_id INTEGER NOT NULL REFERENCES donor(donor_id) ON DELETE CASCADE,
    food_name VARCHAR(150) NOT NULL,
    food_type VARCHAR(100) NOT NULL,
    quantity NUMERIC(10,2) NOT NULL,
    no_of_meals INTEGER NOT NULL,
    available_from TIMESTAMP NOT NULL,
    available_until TIMESTAMP NOT NULL,
    expiry_date TIMESTAMP NOT NULL,
    pickup_address TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Available',
    CONSTRAINT donation_quantity_check CHECK (quantity > 0),
    CONSTRAINT donation_meals_check CHECK (no_of_meals > 0),
    CONSTRAINT donation_time_check CHECK (available_from < available_until),
    CONSTRAINT donation_expiry_check CHECK (available_until <= expiry_date),
    CONSTRAINT donation_status_check CHECK (status IN ('Available','Pending','Accepted','Picked Up','On The Way','Delivered','Cancelled','Expired'))
);

CREATE TABLE IF NOT EXISTS request (
    request_id SERIAL PRIMARY KEY,
    donation_id INTEGER NOT NULL REFERENCES food_donation(donation_id) ON DELETE CASCADE,
    ngo_id INTEGER NOT NULL REFERENCES ngo(ngo_id) ON DELETE CASCADE,
    request_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(30) NOT NULL DEFAULT 'Pending',
    CONSTRAINT request_status_check CHECK (status IN ('Pending','Accepted','Rejected','Completed','Cancelled'))
);

CREATE TABLE IF NOT EXISTS delivery (
    delivery_id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL UNIQUE REFERENCES request(request_id) ON DELETE CASCADE,
    volunteer_id INTEGER REFERENCES volunteer(volunteer_id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Available',
    pickup_time TIMESTAMP NULL,
    delivery_time TIMESTAMP NULL,
    CONSTRAINT delivery_status_check CHECK (status IN ('Available','Accepted','Picked Up','On The Way','Delivered','Cancelled'))
);

CREATE TABLE IF NOT EXISTS notification (
    notification_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    user_type VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT notification_user_type_check CHECK (user_type IN ('donor','ngo','volunteer','admin'))
);

CREATE INDEX IF NOT EXISTS idx_food_donation_donor_id ON food_donation(donor_id);
CREATE INDEX IF NOT EXISTS idx_food_donation_status ON food_donation(status);
CREATE INDEX IF NOT EXISTS idx_request_donation_id ON request(donation_id);
CREATE INDEX IF NOT EXISTS idx_request_ngo_id ON request(ngo_id);
CREATE INDEX IF NOT EXISTS idx_request_status ON request(status);
CREATE INDEX IF NOT EXISTS idx_delivery_volunteer_id ON delivery(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_delivery_status ON delivery(status);
CREATE INDEX IF NOT EXISTS idx_notification_user ON notification(user_id,user_type);
