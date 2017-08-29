CREATE TABLE IF NOT EXISTS users (
    uid INT,
    email VARCHAR(255),
    password_hash CHAR(128),
    password_salt CHAR(32)
);
