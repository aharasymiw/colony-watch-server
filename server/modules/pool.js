const pg = require("pg");

let pool;

if (process.env.DB_URL) {
  pool = new pg.Pool({
    connectionString: process.env.DB_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });
} else {
  pool = new pg.Pool({
    host: "localhost",
    port: 5432,
    database: "colony_watch",
  });
}

module.exports = pool;
