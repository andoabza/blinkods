import Progress from "../models/Progress.js";
import CodeExecution from "../models/CodeExecution.js";
import Course from "../models/Course.js";
import CourseController from "./courseController.js";

class ProgressController {
  static async getProgress(req, res) {
    try {
      
      const { courseId } = req.params;     
      const progress = await Progress.getUserProgress(req.user.id, courseId);
      
      res.json({ progress });
    } catch (error) {
      console.error('Get progress error:', error);
      res.status(500).json({ error: 'Server error fetching progress' });
    }
  }

  static async runCode(req, res) {
    try {
      const { code, language } = req.body;
      
      let result;
      if (language === 'python') {
        result = await CodeExecution.executePython(code);
      } else {
        result = await CodeExecution.executeJavaScript(code);
      }

      res.json({
        success: result.success,
        output: result.output,
        error: result.error
      });
    } catch (error) {
      console.error('Run code error:', error);
      res.status(500).json({ error: 'Server error running code' });
    }
  }

  static async getAchievements(req, res) {
    try {
      const achievements = await Progress.getAchievements(req.user.id);
      res.json({ achievements });
    } catch (error) {
      console.error('Get achievements error:', error);
      res.status(500).json({ error: 'Server error fetching achievements' });
    }
  }

  static async getDashboard(req, res) {
    try {
      
      const [progress, achievements, recommendedCourses] = await Promise.all([
        Progress.getUserProgress(req.user.id),
        Progress.getAchievements(req.user.id),
        CourseController.getRecommendedCourses(req, res, true)
      ]);

      // Calculate stats
      const completedLessons = progress.filter(p => p.completed).length;
      const totalScore = progress.reduce((sum, p) => sum + (p.score || 0), 0);
      const averageScore = completedLessons > 0 ? totalScore / completedLessons : 0;

      if (res.headersSent) {
        return;
      }
      else {
      res.json({
        stats: {
          completedLessons,
          totalScore,
          averageScore: Math.round(averageScore),
          achievementsCount: achievements.length,
          currentStreak: await Progress.calculateStreak(req.user.id)
        },
        recentProgress: progress.slice(0, 5),
        achievements: achievements.slice(0, 3),
        recommendedCourses
      });
    }
    } catch (error) {
      console.error('Dashboard error:', error);
      res.status(500).json({ error: 'Server error fetching dashboard' });
    }
  }

  static async submitLesson(req, res) {
    try {
      const { lessonId, code, timeSpent } = req.body;
      
      // Get lesson details for validation
      const lesson = await Course.getLesson(lessonId);
      if (!lesson) {
        return res.status(404).json({ error: 'Lesson not found' });
      }

      // Validate code output if expected output exists
      let validationResult = { valid: true, score: 100, feedback: 'Good job!' };
      
      if (lesson.expected_output) {
        validationResult = await CodeExecution.validateOutput(
          code, 
          lesson.expected_output, 
          lesson.coding_language
        );
      }

      // Save execution result
      await CodeExecution.saveExecution(req.user.id, lessonId, code, {
        output: validationResult.actualOutput,
        success: validationResult.valid,
        error: validationResult.feedback
      });

      // Submit progress
      const progressData = {
        user_id: req.user.id,
        lesson_id: lessonId,
        course_id: lesson.course_id,
        code_submission: code,
        score: validationResult.score,
        time_spent: timeSpent,
        completed: validationResult.valid
      };

      const progress = await Progress.submitLesson(progressData);

      // Check for achievements related to this lesson
      const newAchievements = await Achievement.checkLessonAchievements(req.user.id, {
        score: validationResult.score,
        time_spent: timeSpent,
        completed_at: new Date()
      });

      res.json({
        message: 'Lesson submitted successfully',
        progress,
        validation: validationResult,
        new_achievements: newAchievements
      });
    } catch (error) {
      console.error('Submit lesson error:', error);
      res.status(500).json({ error: 'Server error submitting lesson' });
    }
  }

}

export default ProgressController;