CREATE TABLE IF NOT EXISTS users (
    uid INTEGER PRIMARY KEY,
    email VARCHAR(255),
    password_hash CHAR(128),
    password_salt CHAR(32)
);

CREATE TABLE IF NOT EXISTS events (
    uid INTEGER,
    hostname VARCHAR(255),
    ts BIGINT /* future proof, baby */
);

CREATE TABLE IF NOT EXISTS tokens (
    token CHAR(32),
    uid INTEGER
);

CREATE TABLE IF NOT EXISTS google (
    google_uid INTEGER,
    uid INTEGER
);

CREATE TABLE IF NOT EXISTS daily_summary_cache (
    uid INTEGER,
    tz VARCHAR(255),
    ts BIGINT, /* ts of day start */
    json VARCHAR(2147483647)
);
