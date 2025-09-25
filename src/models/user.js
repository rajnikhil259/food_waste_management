const pool = require('../utils/db');

const User = {
  async findByEmail(email) {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  },

  async create({ name, email, password, role, organization_name, location }) {
    const result = await pool.query(
      'INSERT INTO users (name, email, password, role, organization_name, location) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, email, password, role, organization_name || null, location]
    );
    return result.rows[0];
  },

  async findById(id) {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
  }
};

module.exports = User;