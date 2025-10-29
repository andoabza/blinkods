import Achievement from "../models/Achievement.js";

class AchievementController {
  static async getUserAchievements(req, res) {
    try {
      const achievements = await Achievement.getUserAchievements(req.user.id);
      const stats = await Achievement.getUserStats(req.user.id);
      
      res.json({
        achievements,
        stats,
        total_count: achievements.length
      });
    } catch (error) {
      console.error('Get achievements error:', error);
      res.status(500).json({ error: 'Server error fetching achievements' });
    }
  }

  static async getAvailableAchievements(req, res) {
    try {
      const achievements = await Achievement.getAvailableAchievements(req.user.id);
      
      res.json({
        achievements,
        total_count: achievements.length
      });
    } catch (error) {
      console.error('Get available achievements error:', error);
      res.status(500).json({ error: 'Server error fetching available achievements' });
    }
  }

  static async getAchievementStats(req, res) {
    try {
      const stats = await Achievement.getUserStats(req.user.id);
      
      res.json({
        stats,
        leaderboard: await AchievementController.getLeaderboard(req.user.id)
      });
    } catch (error) {
      console.error('Get achievement stats error:', error);
      res.status(500).json({ error: 'Server error fetching achievement stats' });
    }
  }

  static async getLeaderboard(userId) {
    // Implement leaderboard logic
    const query = `
      SELECT up.user_id, u.username, up.total_points, up.current_level, up.level_title,
             COUNT(ua.id) as achievement_count
      FROM user_points up
      JOIN users u ON up.user_id = u.id
      LEFT JOIN user_achievements ua ON up.user_id = ua.user_id
      GROUP BY up.user_id, u.username, up.total_points, up.current_level, up.level_title
      ORDER BY up.total_points DESC
      LIMIT 10
    `;
    
    const result = await pool.query(query);
    return result.rows;
  }

  static async checkAllAchievements(req, res) {
    try {
      const userId = req.user.id;
      
      // Check streak achievements
      const streakAchievement = await Achievement.checkStreakAchievements(userId);
      
      // Check language achievements
      const languageAchievement = await Achievement.checkLanguageAchievements(userId);
      
      // Check weekend warrior (simplified check)
      const weekendQuery = `
        SELECT EXISTS(
          SELECT 1 FROM user_progress 
          WHERE user_id = $1 
          AND EXTRACT(DOW FROM completed_at) = 0 -- Sunday
          AND completed = true
        ) as has_sunday,
        EXISTS(
          SELECT 1 FROM user_progress 
          WHERE user_id = $1 
          AND EXTRACT(DOW FROM completed_at) = 6 -- Saturday
          AND completed = true
        ) as has_saturday
      `;
      
      const weekendResult = await pool.query(weekendQuery, [userId]);
      const { has_sunday, has_saturday } = weekendResult.rows[0];
      
      if (has_sunday && has_saturday) {
        await Achievement.awardAchievement(userId, 'weekend_warrior');
      }
      
      res.json({
        message: 'Achievements checked successfully',
        new_achievements: [streakAchievement, languageAchievement].filter(a => a !== null)
      });
    } catch (error) {
      console.error('Check achievements error:', error);
      res.status(500).json({ error: 'Server error checking achievements' });
    }
  }
}
export default AchievementController;