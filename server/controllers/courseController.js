import Course from "../models/Course.js";
import User from "../models/User.js";

class CourseController {
  // static async getAllCourses(req, res) {
  //   try {
  //     const filters = {
  //       age_group: req.query.age_group,
  //       language_target: req.query.language_target,
  //       coding_language: req.query.coding_language
  //     };

  //     const courses = await Course.findAll(filters);
  //     res.json({ courses });
  //   } catch (error) {
  //     console.error('Get courses error:', error);
  //     res.status(500).json({ error: 'Server error fetching courses' });
  //   }
  // }

  static async getCourse(req, res) {
    try {
      const { courseId } = req.params;
      const course = await Course.findById(courseId, req.user.id);

      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }

      const dependencies = await Course.checkDependencies(courseId, req.user.id);

      res.json({
        course: {
          ...course,
          is_locked: !dependencies.all_met,
          completion_percentage: course.total_lessons > 0 
            ? Math.round((course.completed_lessons / course.total_lessons) * 100)
            : 0
        },
        dependencies
      });
    } catch (error) {
      console.error('Get course error:', error);
      res.status(500).json({ error: 'Server error fetching course' });
    }
  }

  // static async getAvailableCourses(req, res) {
  //   try {
  //     const courses = await Course.getAvailableCourses(req.user.id);
      
  //     const categorized = {
  //       available: courses.filter(c => !c.is_locked),
  //       locked: courses.filter(c => c.is_locked),
  //       completed: courses.filter(c => c.completion_percentage === 100),
  //       in_progress: courses.filter(c => c.completion_percentage > 0 && c.completion_percentage < 100),
  //       not_started: courses.filter(c => c.completion_percentage === 0 && !c.is_locked)
  //     };

  //     res.json({
  //       courses,
  //       categorized,
  //       stats: {
  //         total: courses.length,
  //         available: categorized.available.length,
  //         locked: categorized.locked.length,
  //         completed: categorized.completed.length,
  //         in_progress: categorized.in_progress.length,
  //         not_started: categorized.not_started.length
  //       }
  //     });
  //   } catch (error) {
  //     console.error('Get available courses error:', error);
  //     res.status(500).json({ error: 'Server error fetching available courses' });
  //   }
  // }

  static async checkDependencies(req, res) {
    try {
      const { courseId } = req.params;
      const dependencies = await Course.checkDependencies(courseId, req.user.id);
      res.json(dependencies);
    } catch (error) {
      console.error('Check dependencies error:', error);
      res.status(500).json({ error: 'Server error checking dependencies' });
    }
  }

  static async getAllCourses(req, res) {
    try {
      const filters = {
        age_group: req.query.age_group,
        language_target: req.query.language_target,
        coding_language: req.query.coding_language
      };

      const courses = await Course.findAll(filters);
      res.json({ courses });
    } catch (error) {
      console.error('Get courses error:', error);
      res.status(500).json({ error: 'Server error fetching courses' });
    }
  }

  // static async getAvailableCourses(req, res) {
  //   try {
  //     const userId = req.user.id;
      
  //     // Get all courses with their dependencies and user progress
  //     const availableCourses = await Course.getAvailableCourses(userId);
      
  //     // Enhance with additional progress data
  //     const enhancedCourses = await Promise.all(
  //       availableCourses.map(async (course) => {
  //         const progress = await Course.getUserProgress(userId, course.id);
  //         return {
  //           ...course,
  //           user_progress: progress,
  //           completion_percentage: progress.total_lessons > 0 
  //             ? Math.round((progress.completed_lessons / progress.total_lessons) * 100)
  //             : 0
  //         };
  //       })
  //     );

  //     // Categorize courses
  //     const categorizedCourses = {
  //       available: enhancedCourses.filter(course => !course.is_locked),
  //       locked: enhancedCourses.filter(course => course.is_locked),
  //       completed: enhancedCourses.filter(course => 
  //         !course.is_locked && course.user_progress.total_lessons > 0 && 
  //         course.user_progress.completed_lessons === course.user_progress.total_lessons
  //       ),
  //       in_progress: enhancedCourses.filter(course => 
  //         !course.is_locked && course.user_progress.completed_lessons > 0 && 
  //         course.user_progress.completed_lessons < course.user_progress.total_lessons
  //       ),
  //       not_started: enhancedCourses.filter(course => 
  //         !course.is_locked && course.user_progress.completed_lessons === 0
  //       )
  //     };

  //     res.json({
  //       courses: enhancedCourses,
  //       categorized: categorizedCourses,
  //       stats: {
  //         total: enhancedCourses.length,
  //         available: categorizedCourses.available.length,
  //         locked: categorizedCourses.locked.length,
  //         completed: categorizedCourses.completed.length,
  //         in_progress: categorizedCourses.in_progress.length,
  //         not_started: categorizedCourses.not_started.length
  //       }
  //     });
  //   } catch (error) {
  //     console.error('Get available courses error:', error);
  //     res.status(500).json({ error: 'Server error fetching available courses' });
  //   }
  // }

  static async getCourse(req, res) {
    try {
      const { courseId } = req.params;
      const course = await Course.findByIdWithDependencies(courseId, req.user.id);

      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }

      // Get user progress for this course
      const userProgress = await Course.getUserProgress(req.user.id, courseId);
      
      // Check dependencies
      const dependencies = await Course.checkCourseDependencies(courseId, req.user.id);

      res.json({ 
        course: {
          ...course,
          user_progress: userProgress,
          completion_percentage: course.lessons.length > 0 
            ? Math.round((course.lessons.filter(l => l.is_completed).length / course.lessons.length) * 100)
            : 0
        },
        dependencies
      });
    } catch (error) {
      console.error('Get course error:', error);
      res.status(500).json({ error: 'Server error fetching course' });
    }
  }

  static async checkDependencies(req, res) {
    try {
      const { courseId } = req.params;
      const dependencies = await Course.checkCourseDependencies(courseId, req.user.id);

      res.json(dependencies);
    } catch (error) {
      console.error('Check dependencies error:', error);
      res.status(500).json({ error: 'Server error checking dependencies' });
    }
  }

  static async getLesson(req, res) {
    try {
      const { lessonId } = req.params;
      const lesson = await Course.getLesson(lessonId, req.user.id);

      if (!lesson) {
        return res.status(404).json({ error: 'Lesson not found' });
      }

      res.json({ lesson });
    } catch (error) {
      console.error('Get lesson error:', error);
      res.status(500).json({ error: 'Server error fetching lesson' });
    }
  }

  static async getRecommendedCourses(req, res) {
    try {
      const user = await User.findById(req.user.id);
      const age = user.age;

      // Determine age group based on user's age
      let ageGroup;
      if (age >= 4 && age <= 7) ageGroup = '4-7';
      else if (age >= 8 && age <= 12) ageGroup = '8-12';
      else ageGroup = '13+';

      // Get available courses filtered by age group
      const availableCourses = await Course.getAvailableCourses(req.user.id);
      const recommendedCourses = availableCourses.filter(course => 
        !course.is_locked && course.age_group === ageGroup
      );

      // Sort by difficulty and user progress
      const sortedCourses = recommendedCourses.sort((a, b) => {
        // Prioritize courses in progress
        const aProgress = a.user_progress?.completed_lessons || 0;
        const bProgress = b.user_progress?.completed_lessons || 0;
        
        if (aProgress > 0 && bProgress === 0) return -1;
        if (bProgress > 0 && aProgress === 0) return 1;
        
        // Then by difficulty (easier first)
        return a.difficulty_level - b.difficulty_level;
      });

      res.json({ courses: sortedCourses.slice(0, 6) }); // Return top 6 recommendations
    } catch (error) {
      console.error('Get recommended courses error:', error);
      res.status(500).json({ error: 'Server error fetching recommended courses' });
    }
  }

  // static async createCourse(req, res) {
  //   try {
  //     if (req.user.role !== 'admin') {
  //       return res.status(403).json({ error: 'Access denied. Admin role required.' });
  //     }

  //     const courseData = req.body;
  //     const newCourse = await Course.create(courseData);

  //     res.status(201).json({
  //       message: 'Course created successfully',
  //       course: newCourse
  //     });
  //   } catch (error) {
  //     console.error('Create course error:', error);
  //     res.status(500).json({ error: 'Server error creating course' });
  //   }
  // }

  static async getCourseProgress(req, res) {
    try {
      const { courseId } = req.params;
      const progress = await Course.getUserProgress(req.user.id, courseId);

      res.json({ progress });
    } catch (error) {
      console.error('Get course progress error:', error);
      res.status(500).json({ error: 'Server error fetching course progress' });
    }
  }

  static async unlockCourse(req, res) {
    try {
      const { courseId } = req.params;
      
      // Check if course exists
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }

      // Check current dependencies
      const dependencies = await Course.checkCourseDependencies(courseId, req.user.id);
      
      if (dependencies.all_met) {
        return res.json({
          message: 'Course is already available',
          course,
          dependencies
        });
      }

      // For demo purposes, we might allow admins to override dependencies
      if (req.user.role === 'admin') {
        // Admin can bypass dependencies
        return res.json({
          message: 'Course unlocked by admin override',
          course,
          admin_override: true
        });
      }

      res.status(403).json({
        error: 'Course dependencies not met',
        dependencies: dependencies.unmet_dependencies,
        requirements: dependencies.unmet_dependencies.map(dep => ({
          type: dep.dependency_type,
          requirement: dep.dependency_type === 'course' 
            ? `Complete "${dep.required_course_title}" with ${dep.min_score}% score`
            : `Earn "${dep.required_achievement_title}" achievement`,
          current_progress: dep.user_progress
        }))
      });
    } catch (error) {
      console.error('Unlock course error:', error);
      res.status(500).json({ error: 'Server error unlocking course' });
    }
  }

  // Get all courses with optional filters
  static async getAllCourses(req, res) {
    try {
      const filters = req.query;
      const courses = await Course.findAll(filters);
      res.json({
        success: true,
        data: courses,
        count: courses.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch courses',
        error: error.message
      });
    }
  }

  // Get course by ID with user progress
  static async getCourseById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id || null;
      
      const course = await Course.findById(id, userId);
      
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }

      res.json({
        success: true,
        data: course
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch course',
        error: error.message
      });
    }
  }

  // Get course with dependencies and progress
  static async getCourseWithProgress(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const course = await Course.getCourseWithProgress(userId, id);
      
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }

      res.json({
        success: true,
        data: course
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch course with progress',
        error: error.message
      });
    }
  }

  // Create new course
  static async createCourse(req, res) {
    try {
      const courseData = req.body;
      
      // Validate required fields
      const requiredFields = ['title', 'description', 'language_target', 'coding_language', 'age_group'];
      const missingFields = requiredFields.filter(field => !courseData[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Missing required fields: ${missingFields.join(', ')}`
        });
      }

      const newCourse = await Course.create(courseData);
      
      res.status(201).json({
        success: true,
        message: 'Course created successfully',
        data: newCourse
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create course',
        error: error.message
      });
    }
  }

  // Get available courses for user (with dependencies checked)
  static async getAvailableCourses(req, res) {
    try {
      const userId = req.user.id;
      const courses = await Course.getAvailableCourses(userId);
      
      res.json({
        success: true,
        data: courses,
        count: courses.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch available courses',
        error: error.message
      });
    }
  }

  // Check course dependencies for a user
  static async checkCourseDependencies(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const dependencies = await Course.checkCourseDependencies(id, userId);
      
      res.json({
        success: true,
        data: dependencies
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to check course dependencies',
        error: error.message
      });
    }
  }

  // Add dependency to course
  static async addCourseDependency(req, res) {
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

      if (dependencyData.dependency_type === 'course' && !dependencyData.required_course_id) {
        return res.status(400).json({
          success: false,
          message: 'Required course ID is required for course dependencies'
        });
      }

      if (dependencyData.dependency_type === 'achievement' && !dependencyData.required_achievement_type) {
        return res.status(400).json({
          success: false,
          message: 'Required achievement type is required for achievement dependencies'
        });
      }

      const dependency = await Course.addDependency(id, dependencyData);
      
      res.status(201).json({
        success: true,
        message: 'Course dependency added successfully',
        data: dependency
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to add course dependency',
        error: error.message
      });
    }
  }

  // Get user progress for a course
  static async getUserProgress(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const progress = await Course.getUserProgress(userId, id);
      
      res.json({
        success: true,
        data: progress
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user progress',
        error: error.message
      });
    }
  }
}

export default CourseController;