const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://limto_owner:43jPCuJfwGmg@ep-soft-sky-a19448lp.ap-southeast-1.aws.neon.tech/limto?sslmode=require',
  ssl: {
    rejectUnauthorized: false, // ✅ This enables SSL for NeonDB
  },
});

module.exports = pool;
