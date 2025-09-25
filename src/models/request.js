const pool = require('../utils/db');

const FoodRequest = {
  async create({ receiver_id, food_type, quantity, location, description }) {
    const result = await pool.query(
      'INSERT INTO food_requests (receiver_id, food_type, quantity, location, description, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [receiver_id, food_type, quantity, location, description, 'pending']
    );
    return result.rows[0];
  },

  async findPending() {
    const result = await pool.query(
      "SELECT fr.*, u.name AS receiver_name FROM food_requests fr JOIN users u ON fr.receiver_id = u.id WHERE fr.status = 'pending'"
    );
    return result.rows;
  },

  async findByReceiver(receiver_id) {
    const result = await pool.query(
      "SELECT * FROM food_requests WHERE receiver_id = $1",
      [receiver_id]
    );
    return result.rows;
  },

  async updateStatus(id, status) {
    const result = await pool.query(
      "UPDATE food_requests SET status = $1 WHERE id = $2 RETURNING *",
      [status, id]
    );
    return result.rows[0];
  }
};

module.exports = FoodRequest;