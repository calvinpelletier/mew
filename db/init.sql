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

CREATE TABLE IF NOT EXISTS unprod_sites (
    uid INTEGER PRIMARY KEY,
    json VARCHAR(2147483647)
);

CREATE TABLE IF NOT EXISTS quotas (
    uid INTEGER PRIMARY KEY,
    quota INTEGER, /* always in minutes, regardless of quota_unit */
    quota_type TINYINT, /* 0 for none, 1 for all web usage, 2 for unproductive web usage only */
    quota_unit TINYINT /* 0 for minutes, 1 for hours */
);

/* ~~~ TASKS TABLES ~~~ */
/* https://github.com/wilsonchaney/mew/wiki/Tasks-DB-Reference */
CREATE TABLE IF NOT EXISTS tasks (
    /* ROWID (auto created by sqlite and used by us as task id) */
    uid INTEGER,
    task VARCHAR(255),
    unixdate BIGINT, /* ts of day start aka unixdate or 0 */
    category INTEGER, /* -1 for no category */
    completed TINYINT /* 0/1 */
);

CREATE TABLE IF NOT EXISTS task_categories (
    /* ROWID (auto created by sqlite and used by us as category id) */
    uid INTEGER,
    name VARCHAR(255)
);
/* ~~~~~~~~~~~~~~~~~~~~ */
