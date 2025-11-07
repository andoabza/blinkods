import Lesson from '../models/Lesson.js';
import CodeExecution from '../models/CodeExecution.js';
import Achievement from '../models/Achievement.js';

class LessonController {
  static async getLesson(req, res) {
    try {
      const { lessonId } = req.params;
      const userId = req.user.id;

      const lesson = await Lesson.findById(lessonId, userId);
      if (!lesson) {
        return res.status(404).json({ error: 'Lesson not found' });
      }

      const dependencies = await Lesson.checkDependencies(lessonId, userId);
      const navigation = await Lesson.getNavigation(lesson.course_id, lessonId, userId);

      const isAccessible = dependencies.all_met || lesson.is_completed;

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

  static async saveCode(req, res) {
    try {
      const { lessonId } = req.params;
      const { code } = req.body;

      await Lesson.saveCodeSubmission(req.user.id, lessonId, code);

      res.json({ 
        message: 'Code saved successfully',
        auto_saved: true 
      });
    } catch (error) {
      console.error('Save code error:', error);
      res.status(500).json({ error: 'Server error saving code' });
    }
  }

  // static async submitLesson(req, res) {
  //   try {
  //     const { lessonId } = req.params;
  //     const { code, timeSpent } = req.body;
  //     const userId = req.user.id;

  //     // Check if lesson is accessible
  //     const lesson = await Lesson.findById(lessonId, userId);
  //     const dependencies = await Lesson.checkDependencies(lessonId, userId);
      
  //     if (!dependencies.all_met && !lesson.is_completed) {
  //       return res.status(403).json({
  //         error: 'Lesson dependencies not met',
  //         dependencies: dependencies.unmet_dependencies
  //       });
  //     }

  //     // Validate code
  //     let validationResult = { valid: true, score: 100, feedback: 'Good job!' };
      
  //     if (lesson.expected_output) {
  //       validationResult = await CodeExecution.validateOutput(
  //         code, 
  //         lesson.expected_output, 
  //         lesson.coding_language
  //       );
  //     }

  //     // Submit progress
  //     const progress = await Lesson.submitLesson(
  //       userId, 
  //       lessonId, 
  //       code, 
  //       timeSpent, 
  //       validationResult.score, 
  //       validationResult.valid
  //     );

  //     // Check for achievements
  //     const newAchievements = await Achievement.checkLessonAchievements(userId, {
  //       score: validationResult.score,
  //       time_spent: timeSpent,
  //       completed_at: new Date()
  //     });

  //     // Get next lesson
  //     const navigation = await Lesson.getNavigation(lesson.course_id, lessonId, userId);
  //     const courseCompleted = !navigation.next && validationResult.valid;

  //     res.json({
  //       message: 'Lesson submitted successfully',
  //       progress,
  //       validation: validationResult,
  //       new_achievements: newAchievements,
  //       next_lesson: navigation.next,
  //       course_completed: courseCompleted
  //     });
  //   } catch (error) {
  //     console.error('Submit lesson error:', error);
  //     res.status(500).json({ error: 'Server error submitting lesson' });
  //   }
  // }

  static async checkDependencies(req, res) {
    try {
      const { lessonId } = req.params;
      const dependencies = await Lesson.checkDependencies(lessonId, req.user.id);
      res.json(dependencies);
    } catch (error) {
      console.error('Check dependencies error:', error);
      res.status(500).json({ error: 'Server error checking dependencies' });
    }
  }

  static async getNavigation(req, res) {
    try {
      const { lessonId } = req.params;
      const { courseId } = req.query;

      if (!courseId) {
        return res.status(400).json({ error: 'Course ID is required' });
      }

      const navigation = await Lesson.getNavigation(courseId, lessonId, req.user.id);
      res.json(navigation);
    } catch (error) {
      console.error('Get navigation error:', error);
      res.status(500).json({ error: 'Server error fetching navigation' });
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

  // Create new lesson
  // Get lesson by ID
  static async getLessonById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id || null;

      const lesson = await Lesson.findById(id, userId);
      
      if (!lesson) {
        return res.status(404).json({
          success: false,
          message: 'Lesson not found'
        });
      }

      res.json({
        success: true,
        data: lesson
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch lesson',
        error: error.message
      });
    }
  }

  // Get lesson with dependencies
  static async getLessonWithDependencies(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const lesson = await Lesson.findByIdWithDependencies(id, userId);
      
      if (!lesson) {
        return res.status(404).json({
          success: false,
          message: 'Lesson not found'
        });
      }

      res.json({
        success: true,
        data: lesson
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch lesson with dependencies',
        error: error.message
      });
    }
  }

  // Create new lesson
  static async createLesson(req, res) {
    try {
      const lessonData = req.body;
      
      // Validate required fields
      const requiredFields = ['course_id', 'title', 'description', 'order_index'];
      const missingFields = requiredFields.filter(field => !lessonData[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Missing required fields: ${missingFields.join(', ')}`
        });
      }

      const newLesson = await Lesson.create(lessonData);
      
      res.status(201).json({
        success: true,
        message: 'Lesson created successfully',
        data: newLesson
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create lesson',
        error: error.message
      });
    }
  }

  // Check lesson dependencies
  static async checkLessonDependencies(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const dependencies = await Lesson.checkLessonDependencies(id, userId);
      
      res.json({
        success: true,
        data: dependencies
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to check lesson dependencies',
        error: error.message
      });
    }
  }

  // Add dependency to lesson
  static async addLessonDependency(req, res) {
    try {
      const { id } = req.params;
      const dependencyData = req.body;

      // Validate dependency data
      if (!dependencyData.dependency_type) {
        return res.status(400).json({
          success: false,
          message: 'Dependency type is required'
        });
      }

      if (dependencyData.dependency_type === 'lesson' && !dependencyData.required_lesson_id) {
        return res.status(400).json({
          success: false,
          message: 'Required lesson ID is required for lesson dependencies'
        });
      }

      if (dependencyData.dependency_type === 'achievement' && !dependencyData.required_achievement_type) {
        return res.status(400).json({
          success: false,
          message: 'Required achievement type is required for achievement dependencies'
        });
      }

      const dependency = await Lesson.addDependency(id, dependencyData);
      
      res.status(201).json({
        success: true,
        message: 'Lesson dependency added successfully',
        data: dependency
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to add lesson dependency',
        error: error.message
      });
    }
  }

  // Get course lessons with dependencies
  static async getCourseLessons(req, res) {
    try {
      const { courseId } = req.params;
      const userId = req.user.id;

      const lessons = await Lesson.getCourseLessonsWithDependencies(courseId, userId);
      
      res.json({
        success: true,
        data: lessons,
        count: lessons.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch course lessons',
        error: error.message
      });
    }
  }

  // Get lesson navigation
  static async getLessonNavigation(req, res) {
    try {
      const { courseId, lessonId } = req.params;
      const userId = req.user.id;

      const navigation = await Lesson.getLessonNavigation(courseId, userId, lessonId);
      
      res.json({
        success: true,
        data: navigation
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch lesson navigation',
        error: error.message
      });
    }
  }

  // Save code submission
  static async saveCodeSubmission(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { code } = req.body;

      if (!code) {
        return res.status(400).json({
          success: false,
          message: 'Code submission is required'
        });
      }

      const progress = await Lesson.saveCodeSubmission(userId, id, code);
      
      res.json({
        success: true,
        message: 'Code saved successfully',
        data: progress
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to save code',
        error: error.message
      });
    }
  }

  // Submit lesson (complete with score)
  static async submitLesson(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { code, time_spent, score, completed = true } = req.body;

      // Validate required fields
      if (completed && (score === undefined || score === null)) {
        return res.status(400).json({
          success: false,
          message: 'Score is required when completing a lesson'
        });
      }

      const progress = await Lesson.submitLesson(
        userId, 
        id, 
        code || '', 
        time_spent || 0, 
        score || 0, 
        completed
      );
      
      res.json({
        success: true,
        message: completed ? 'Lesson submitted successfully' : 'Progress updated',
        data: progress
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to submit lesson',
        error: error.message
      });
    }
  }

  // Get user lesson progress
  static async getUserLessonProgress(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const progress = await Lesson.getUserLessonProgress(userId, id);
      
      if (!progress) {
        return res.status(404).json({
          success: false,
          message: 'No progress found for this lesson'
        });
      }

      res.json({
        success: true,
        data: progress
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch lesson progress',
        error: error.message
      });
    }
  }

  // Get next accessible lesson
  async getNextAccessibleLesson(req, res) {
    try {
      const { courseId } = req.params;
      const userId = req.user.id;
      const { currentLessonId } = req.query;

      const nextLesson = await Lesson.getNextAccessibleLesson(courseId, userId, currentLessonId);
      
      res.json({
        success: true,
        data: nextLesson
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to find next accessible lesson',
        error: error.message
      });
    }
  }
}
export default LessonController;