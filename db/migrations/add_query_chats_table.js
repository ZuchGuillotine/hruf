
const { sql } = require('drizzle-orm');

module.exports = async function(client) {
  // Create the query_chats table
  await client.query(`
    CREATE TABLE IF NOT EXISTS query_chats (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      messages JSONB NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      metadata JSONB DEFAULT '{}'::jsonb
    );
  `);
  
  console.log('Created query_chats table');
};
