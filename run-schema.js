const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgres://postgres:LGbKmbV9nduhucso@db.affhkvfjxcqzdmttethn.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
});

async function runSchema() {
  try {
    await client.connect();
    console.log('Connected to Supabase database.');

    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Executing schema...');
    await client.query(schemaSql);
    console.log('Schema executed successfully!');
  } catch (err) {
    console.error('Error executing schema:', err);
  } finally {
    await client.end();
  }
}

runSchema();
