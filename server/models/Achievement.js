import pool from '../config/database.js';

class Achievement {
  static async awardAchievement(userId, achievementType, context = {}) {
    try {
      // Get achievement type details
      const typeQuery = 'SELECT * FROM achievement_types WHERE type = $1';
      const typeResult = await pool.query(typeQuery, [achievementType]);
      
      if (typeResult.rows.length === 0) {
        throw new Error(`Achievement type ${achievementType} not found`);
      }

      const achievementTypeData = typeResult.rows[0];

      // Check if already awarded
      const existingQuery = 'SELECT id FROM user_achievements WHERE user_id = $1 AND achievement_type = $2';
      const existingResult = await pool.query(existingQuery, [userId, achievementType]);

      if (existingResult.rows.length > 0) {
        return null; // Already awarded
      }

      // Award achievement
      const insertQuery = `
        INSERT INTO user_achievements (user_id, achievement_type, title, description, icon_url, points_earned)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      
      const values = [
        userId,
        achievementType,
        achievementTypeData.title,
        achievementTypeData.description,
        achievementTypeData.icon_url,
        achievementTypeData.points
      ];

      const result = await pool.query(insertQuery, values);
      
      // Update user points
      await Achievement.updateUserPoints(userId, achievementTypeData.points);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error awarding achievement:', error);
      throw error;
    }
  }

  static async updateUserPoints(userId, points) {
    const query = `
      INSERT INTO user_points (user_id, total_points, current_level, level_title, updated_at)
      VALUES ($1, $2, 1, 'Beginner Coder', CURRENT_TIMESTAMP)
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        total_points = user_points.total_points + EXCLUDED.total_points,
        current_level = CASE 
          WHEN user_points.total_points + EXCLUDED.total_points >= 200 THEN 4
          WHEN user_points.total_points + EXCLUDED.total_points >= 100 THEN 3
          WHEN user_points.total_points + EXCLUDED.total_points >= 50 THEN 2
          ELSE 1
        END,
        level_title = CASE 
          WHEN user_points.total_points + EXCLUDED.total_points >= 200 THEN 'Code Master'
          WHEN user_points.total_points + EXCLUDED.total_points >= 100 THEN 'Code Explorer'
          WHEN user_points.total_points + EXCLUDED.total_points >= 50 THEN 'Code Adventurer'
          ELSE 'Beginner Coder'
        END,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    const result = await pool.query(query, [userId, points]);
    return result.rows[0];
  }

  static async getUserAchievements(userId) {
    const query = `
      SELECT ua.*, at.category, at.points as base_points
      FROM user_achievements ua
      JOIN achievement_types at ON ua.achievement_type = at.type
      WHERE ua.user_id = $1
      ORDER BY ua.earned_at DESC
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  static async getAvailableAchievements(userId) {
    const query = `
      SELECT at.*, 
             ua.id as earned_id,
             CASE WHEN ua.id IS NOT NULL THEN true ELSE false END as earned
      FROM achievement_types at
      LEFT JOIN user_achievements ua ON at.type = ua.achievement_type AND ua.user_id = $1
      ORDER BY at.category, at.points DESC
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  static async getUserStats(userId) {
    const pointsQuery = 'SELECT * FROM user_points WHERE user_id = $1';
    const pointsResult = await pool.query(pointsQuery, [userId]);
    
    const achievementsQuery = `
      SELECT COUNT(*) as total_achievements, 
             COALESCE(SUM(points_earned), 0) as total_points
      FROM user_achievements 
      WHERE user_id = $1
    `;
    const achievementsResult = await pool.query(achievementsQuery, [userId]);
    
    const categoriesQuery = `
      SELECT at.category, COUNT(ua.id) as count
      FROM achievement_types at
      LEFT JOIN user_achievements ua ON at.type = ua.achievement_type AND ua.user_id = $1
      GROUP BY at.category
    `;
    const categoriesResult = await pool.query(categoriesQuery, [userId]);
    
    return {
      points: pointsResult.rows[0] || { total_points: 0, current_level: 1, level_title: 'Beginner Coder' },
      achievements: achievementsResult.rows[0],
      categories: categoriesResult.rows
    };
  }

  static async checkLessonAchievements(userId, lessonData) {
    const achievements = [];
    
    // Check for first lesson
    const firstLessonQuery = `
      SELECT COUNT(*) as count FROM user_progress 
      WHERE user_id = $1 AND completed = true
    `;
    const firstLessonResult = await pool.query(firstLessonQuery, [userId]);
    
    if (parseInt(firstLessonResult.rows[0].count) === 1) {
      const achievement = await Achievement.awardAchievement(userId, 'first_lesson');
      if (achievement) achievements.push(achievement);
    }
    
    // Check for 5 lessons completed
    if (parseInt(firstLessonResult.rows[0].count) === 5) {
      const achievement = await Achievement.awardAchievement(userId, 'fast_learner');
      if (achievement) achievements.push(achievement);
    }
    
    // Check for perfect score
    if (lessonData.score === 100) {
      const achievement = await Achievement.awardAchievement(userId, 'perfect_score');
      if (achievement) achievements.push(achievement);
    }
    
    // Check for speed racer (completed in under 5 minutes)
    if (lessonData.time_spent < 300) { // 5 minutes in seconds
      const achievement = await Achievement.awardAchievement(userId, 'speed_racer');
      if (achievement) achievements.push(achievement);
    }
    
    // Check for early bird (completed before 9 AM)
    const completionTime = new Date(lessonData.completed_at);
    if (completionTime.getHours() < 9) {
      const achievement = await Achievement.awardAchievement(userId, 'early_bird');
      if (achievement) achievements.push(achievement);
    }
    
    return achievements;
  }

  static async checkStreakAchievements(userId) {
    const streakQuery = `
      SELECT COUNT(DISTINCT DATE(completed_at)) as streak_days
      FROM user_progress 
      WHERE user_id = $1 
        AND completed_at >= CURRENT_DATE - INTERVAL '7 days'
        AND completed = true
      ORDER BY completed_at DESC
    `;
    
    const streakResult = await pool.query(streakQuery, [userId]);
    const streakDays = parseInt(streakResult.rows[0]?.streak_days) || 0;
    
    if (streakDays >= 3) {
      return await Achievement.awardAchievement(userId, 'coding_streak');
    }
    
    return null;
  }

  static async checkLanguageAchievements(userId) {
    const languagesQuery = `
      SELECT COUNT(DISTINCT c.language_target) as unique_languages
      FROM user_progress up
      JOIN lessons l ON up.lesson_id = l.id
      JOIN courses c ON l.course_id = c.id
      WHERE up.user_id = $1 AND up.completed = true
    `;
    
    const languagesResult = await pool.query(languagesQuery, [userId]);
    const uniqueLanguages = parseInt(languagesResult.rows[0]?.unique_languages) || 0;
    
    if (uniqueLanguages >= 3) {
      return await Achievement.awardAchievement(userId, 'language_explorer');
    }
    
    return null;
  }
}

export default Achievement;