import pool from '../config/database.js';

class Progress {
  static async getUserProgress(userId, courseId = null) {
    let query = `
      SELECT up.*, l.title as lesson_title, c.title as course_title,
             l.order_index, c.id as course_id
      FROM user_progress up
      JOIN lessons l ON up.lesson_id = l.id
      JOIN courses c ON l.course_id = c.id
      WHERE up.user_id = $1
    `;
    
    const values = [userId];
    
    if (courseId) {
      query += ` AND c.id = $2`;
      values.push(courseId);
    }
    
    query += ` ORDER BY c.id, l.order_index`;
    
    const result = await pool.query(query, values);
    return result.rows;
  }

  static async submitLesson(progressData) {
    const { user_id, lesson_id, course_id, code_submission, score, time_spent, completed } = progressData;
    
    // Check if progress already exists
    const existingQuery = 'SELECT id FROM user_progress WHERE user_id = $1 AND lesson_id = $2';
    const existingResult = await pool.query(existingQuery, [user_id, lesson_id]);
    
    let query, values;
    
    if (existingResult.rows.length > 0) {
      // Update existing progress
      query = `
        UPDATE user_progress 
        SET code_submission = $1, score = $2, time_spent = $3, completed = $4, completed_at = $5
        WHERE user_id = $6 AND lesson_id = $7
        RETURNING *
      `;
      values = [code_submission, score, time_spent, completed, completed ? new Date() : null, user_id, lesson_id];
    } else {
      // Insert new progress
      query = `
        INSERT INTO user_progress (user_id, lesson_id, course_id, code_submission, score, time_spent, completed, completed_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      values = [user_id, lesson_id, course_id, code_submission, score, time_spent, completed, completed ? new Date() : null];
    }
    
    const result = await pool.query(query, values);
    
    // Check for achievements
    if (completed) {
      await Progress.checkAchievements(user_id, lesson_id);
    }
    
    return result.rows[0];
  }

  static async checkAchievements(userId, lessonId) {
    // Check for first lesson completion
    const completedLessons = await pool.query(
      'SELECT COUNT(*) FROM user_progress WHERE user_id = $1 AND completed = true',
      [userId]
    );
    
    const count = parseInt(completedLessons.rows[0].count);
    
    if (count === 1) {
      await Progress.awardAchievement(userId, 'first_lesson', 'First Lesson Completed!', 'You completed your first coding lesson!');
    }
    
    if (count === 5) {
      await Progress.awardAchievement(userId, 'fast_learner', 'Fast Learner!', 'You completed 5 lessons!');
    }
    
    // Check for streak
    const streak = await Progress.calculateStreak(userId);
    if (streak >= 3) {
      await Progress.awardAchievement(userId, 'coding_streak', 'Coding Streak!', `You've coded for ${streak} days in a row!`);
    }
  }

  static async awardAchievement(userId, type, title, description) {
    // Check if achievement already awarded
    const existingQuery = 'SELECT id FROM achievements WHERE user_id = $1 AND type = $2';
    const existingResult = await pool.query(existingQuery, [userId, type]);
    
    if (existingResult.rows.length === 0) {
      const query = `
        INSERT INTO achievements (user_id, type, title, description, icon_url)
        VALUES ($1, $2, $3, $4, $5)
      `;
      const iconUrl = `/assets/achievements/${type}.png`;
      await pool.query(query, [userId, type, title, description, iconUrl]);
    }
  }

  static async calculateStreak(userId) {
    const query = `
      SELECT DISTINCT DATE(completed_at) as completion_date
      FROM user_progress 
      WHERE user_id = $1 AND completed_at >= CURRENT_DATE - INTERVAL '7 days'
      ORDER BY completion_date DESC
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows.length;
  }

  static async getAchievements(userId) {
    const query = 'SELECT * FROM achievements WHERE user_id = $1 ORDER BY earned_at DESC';
    const result = await pool.query(query, [userId]);
    return result.rows;
  }
}

export default Progress;