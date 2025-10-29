import pool from '../config/database.js';

class User {
  static async create(userData) {
    const { email, password_hash, username, role, age, parent_id } = userData;
    const query = `
      INSERT INTO users (email, password_hash, username, role, age, parent_id) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING id, email, username, role, age, avatar_url, created_at
    `;
    const values = [email, password_hash, username, role, age, parent_id];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT id, email, username, role, age, avatar_url, created_at FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async updateProfile(userId, updates) {
    const { username, age, avatar_url } = updates;
    const query = `
      UPDATE users 
      SET username = $1, age = $2, avatar_url = $3 
      WHERE id = $4 
      RETURNING id, email, username, role, age, avatar_url
    `;
    const values = [username, age, avatar_url, userId];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async getChildren(parentId) {
    const query = `
      SELECT id, username, email, age, avatar_url, created_at 
      FROM users 
      WHERE parent_id = $1 AND role = 'student'
    `;
    const result = await pool.query(query, [parentId]);
    return result.rows;
  }
}
export default User;