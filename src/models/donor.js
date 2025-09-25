const pool = require('../utils/db');

const Donation = {
  async create({ donor_id, request_id, message }) {
    const result = await pool.query(
      'INSERT INTO donations (donor_id, request_id, message, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [donor_id, request_id, message, 'pending']
    );
    return result.rows[0];
  },

  async findByDonor(donor_id) {
    const result = await pool.query(
      'SELECT d.*, fr.food_type, fr.quantity, fr.location FROM donations d JOIN food_requests fr ON d.request_id = fr.id WHERE d.donor_id = $1',
      [donor_id]
    );
    return result.rows;
  },

  async updateStatus(id, status) {
    const result = await pool.query(
      'UPDATE donations SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0];
  }
};

module.exports = Donation;