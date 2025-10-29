import Lesson from '../models/Lesson.js';
import CodeExecution from '../models/CodeExecution.js';
import Achievement from '../models/Achievement.js';

class LessonController {
  static async getLesson(req, res) {
    try {
      const { lessonId } = req.params;
      const userId = req.user.id;

      // Get lesson with dependencies and user progress
      const lesson = await Lesson.findByIdWithDependencies(lessonId, userId);
      
      if (!lesson) {
        return res.status(404).json({ error: 'Lesson not found' });
      }

      // Check if lesson is accessible
      const dependencies = await Lesson.checkLessonDependencies(lessonId, userId);
      const isAccessible = dependencies.all_met || lesson.is_completed;

      // Get navigation information
      const navigation = await Lesson.getLessonNavigation(lesson.course_id, userId, lessonId);

      res.json({
        lesson: {
          ...lesson,
          is_accessible: isAccessible,
          dependencies: dependencies
        },
        navigation,
        user_progress: {
          is_completed: lesson.is_completed,
          score: lesson.user_score,
          user_code: lesson.user_code
        }
      });
    } catch (error) {
      console.error('Get lesson error:', error);
      res.status(500).json({ error: 'Server error fetching lesson' });
    }
  }

  static async checkDependencies(req, res) {
    try {
      const { lessonId } = req.params;
      const dependencies = await Lesson.checkLessonDependencies(lessonId, req.user.id);

      res.json(dependencies);
    } catch (error) {
      console.error('Check lesson dependencies error:', error);
      res.status(500).json({ error: 'Server error checking lesson dependencies' });
    }
  }

  static async getLessonNavigation(req, res) {
    try {
      const { lessonId } = req.params;
      const { courseId } = req.query;

      if (!courseId) {
        return res.status(400).json({ error: 'Course ID is required' });
      }

      const navigation = await Lesson.getLessonNavigation(courseId, req.user.id, lessonId);
      res.json(navigation);
    } catch (error) {
      console.error('Get lesson navigation error:', error);
      res.status(500).json({ error: 'Server error fetching lesson navigation' });
    }
  }

  static async getNextLesson(req, res) {
    try {
      const { courseId } = req.params;
      const { currentLessonId } = req.query;

      const nextLesson = await Lesson.getNextAccessibleLesson(courseId, req.user.id, currentLessonId);
      
      if (!nextLesson) {
        return res.status(404).json({ 
          message: 'No more lessons available',
          completed_course: true 
        });
      }

      res.json({ next_lesson: nextLesson });
    } catch (error) {
      console.error('Get next lesson error:', error);
      res.status(500).json({ error: 'Server error fetching next lesson' });
    }
  }

  static async submitLesson(req, res) {
    try {
      const { lessonId } = req.params;
      const { code, timeSpent } = req.body;
      const userId = req.user.id;

      // Check if lesson exists and is accessible
      const lesson = await Lesson.findByIdWithDependencies(lessonId, userId);
      if (!lesson) {
        return res.status(404).json({ error: 'Lesson not found' });
      }

      const dependencies = await Lesson.checkLessonDependencies(lessonId, userId);
      if (!dependencies.all_met && !lesson.is_completed) {
        return res.status(403).json({
          error: 'Lesson dependencies not met',
          dependencies: dependencies.unmet_dependencies,
          requirements: dependencies.unmet_dependencies.map(dep => ({
            type: dep.dependency_type,
            requirement: dep.dependency_type === 'lesson' 
              ? `Complete "${dep.required_lesson_title}" with ${dep.min_score}% score`
              : `Earn "${dep.required_achievement_title}" achievement`,
            current_progress: dep.current_value
          }))
        });
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
      await CodeExecution.saveExecution(userId, lessonId, code, {
        output: validationResult.actualOutput,
        success: validationResult.valid,
        error: validationResult.feedback
      });

      // Submit progress
      const progressData = {
        user_id: userId,
        lesson_id: lessonId,
        course_id: lesson.course_id,
        code_submission: code,
        score: validationResult.score,
        time_spent: timeSpent,
        completed: validationResult.valid
      };

      // Use the Progress model to submit (assuming it exists)
      const Progress = require('../models/Progress');
      const progress = await Progress.submitLesson(progressData);

      // Check for achievements related to this lesson
      const newAchievements = await Achievement.checkLessonAchievements(userId, {
        score: validationResult.score,
        time_spent: timeSpent,
        completed_at: new Date()
      });

      // Get next lesson information
      const nextLesson = await Lesson.getNextAccessibleLesson(lesson.course_id, userId, lessonId);

      res.json({
        message: 'Lesson submitted successfully',
        progress,
        validation: validationResult,
        new_achievements: newAchievements,
        next_lesson: nextLesson,
        course_completed: !nextLesson
      });
    } catch (error) {
      console.error('Submit lesson error:', error);
      res.status(500).json({ error: 'Server error submitting lesson' });
    }
  }

  static async unlockLesson(req, res) {
    try {
      const { lessonId } = req.params;
      
      // Check if lesson exists
      const lesson = await Lesson.findByIdWithDependencies(lessonId, req.user.id);
      if (!lesson) {
        return res.status(404).json({ error: 'Lesson not found' });
      }

      // Check current dependencies
      const dependencies = await Lesson.checkLessonDependencies(lessonId, req.user.id);
      
      if (dependencies.all_met) {
        return res.json({
          message: 'Lesson is already accessible',
          lesson,
          dependencies
        });
      }

      // For demo purposes, we might allow admins to override dependencies
      if (req.user.role === 'admin') {
        // Admin can bypass dependencies
        return res.json({
          message: 'Lesson unlocked by admin override',
          lesson,
          admin_override: true
        });
      }

      res.status(403).json({
        error: 'Lesson dependencies not met',
        dependencies: dependencies.unmet_dependencies,
        requirements: dependencies.unmet_dependencies.map(dep => ({
          type: dep.dependency_type,
          requirement: dep.dependency_type === 'lesson' 
            ? `Complete "${dep.required_lesson_title}" with ${dep.min_score}% score`
            : `Earn "${dep.required_achievement_title}" achievement`,
          current_progress: dep.current_value
        }))
      });
    } catch (error) {
      console.error('Unlock lesson error:', error);
      res.status(500).json({ error: 'Server error unlocking lesson' });
    }
  }

  static async getCourseProgress(req, res) {
    try {
      const { courseId } = req.params;
      const lessons = await Lesson.getCourseLessonsWithDependencies(courseId, req.user.id);

      const stats = {
        total_lessons: lessons.length,
        completed_lessons: lessons.filter(l => l.is_completed).length,
        accessible_lessons: lessons.filter(l => l.is_accessible).length,
        locked_lessons: lessons.filter(l => !l.is_accessible && !l.is_completed).length,
        total_dependencies: lessons.reduce((sum, lesson) => sum + lesson.dependency_count, 0),
        completion_percentage: lessons.length > 0 
          ? Math.round((lessons.filter(l => l.is_completed).length / lessons.length) * 100)
          : 0
      };

      res.json({
        lessons,
        stats
      });
    } catch (error) {
      console.error('Get course progress error:', error);
      res.status(500).json({ error: 'Server error fetching course progress' });
    }
  }
}
export default LessonController;