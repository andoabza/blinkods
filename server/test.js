import pool from '../config/database.js';

class Course {
  static async findAll(filters = {}) {
    let query = `
      SELECT c.*, 
             COUNT(l.id) as lesson_count,
             COALESCE(AVG(up.score), 0) as average_rating
      FROM courses c
      LEFT JOIN lessons l ON c.id = l.course_id
      LEFT JOIN user_progress up ON l.id = up.lesson_id AND up.completed = true
    `;
    
    const values = [];
    const conditions = [];
    
    if (filters.age_group) {
      conditions.push(`c.age_group = $${values.length + 1}`);
      values.push(filters.age_group);
    }
    
    if (filters.language_target) {
      conditions.push(`c.language_target = $${values.length + 1}`);
      values.push(filters.language_target);
    }
    
    if (filters.coding_language) {
      conditions.push(`c.coding_language = $${values.length + 1}`);
      values.push(filters.coding_language);
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ` GROUP BY c.id ORDER BY c.id ASC`;
    
    const result = await pool.query(query, values);
    return result.rows;
  }

  // static async findById(id, userId = null) {
  //   const query = `
  //     SELECT c.*, 
  //            JSON_AGG(
  //              JSON_BUILD_OBJECT(
  //                'id', l.id,
  //                'title', l.title,
  //                'description', l.description,
  //                'order_index', l.order_index,
  //                'estimated_duration', l.estimated_duration,
  //                'is_completed', EXISTS(
  //                  SELECT 1 FROM user_progress up 
  //                  WHERE up.lesson_id = l.id AND up.user_id = $2 AND up.completed = true
  //                ),
  //                'user_score', (
  //                  SELECT up.score FROM user_progress up 
  //                  WHERE up.lesson_id = l.id AND up.user_id = $2
  //                )
  //              ) ORDER BY l.order_index ASC
  //            ) as lessons,
  //            (
  //              SELECT COUNT(*) FROM lessons l2 WHERE l2.course_id = c.id
  //            ) as total_lessons,
  //            (
  //              SELECT COUNT(*) FROM user_progress up
  //              JOIN lessons l3 ON up.lesson_id = l3.id
  //              WHERE up.user_id = $2 AND up.completed = true AND l3.course_id = c.id
  //            ) as completed_lessons
  //     FROM courses c
  //     LEFT JOIN lessons l ON c.id = l.course_id
  //     WHERE c.id = $1
  //     GROUP BY c.id
  //   `;
    
  //   const result = await pool.query(query, [id, userId]);
  //   return result.rows[0];
  // }
static async findById(id, userId = null) {
    const query = `
        SELECT
            c.*, 
            -- Aggregate lessons with their dependency requirements
            JSON_AGG(
                JSON_BUILD_OBJECT(
                    'id', l.id,
                    'title', l.title,
                    'description', l.description,
                    'order_index', l.order_index,
                    'estimated_duration', l.estimated_duration,
                    'is_optional', l.is_optional,
                    
                    -- User Progress Fields
                    'is_completed', up.completed,
                    'user_score', up.score,
                    
                    -- Lesson Dependencies
                    'dependencies', (
                        SELECT 
                            JSON_AGG(
                                JSON_BUILD_OBJECT(
                                    'required_lesson_id', ld.required_lesson_id,
                                    'required_achievement_type', ld.required_achievement_type,
                                    'min_score', ld.min_score,
                                    'dependency_type', ld.dependency_type
                                )
                            )
                        FROM lesson_dependencies ld
                        WHERE ld.lesson_id = l.id
                    ),
                    
                    -- Check if the REQUIRED lesson is complete (basic check, frontend must complete the full logic)
                    'required_lesson_completed', EXISTS(
                        SELECT 1
                        FROM lesson_dependencies ld_check
                        JOIN user_progress up_check ON up_check.lesson_id = ld_check.required_lesson_id
                        WHERE ld_check.lesson_id = l.id
                        AND up_check.user_id = $2
                        AND up_check.completed = true
                        AND ld_check.dependency_type = 'lesson'
                    )
                ) ORDER BY l.order_index ASC
            ) FILTER (WHERE l.id IS NOT NULL) AS lessons, -- FILTER ensures no lessons array for courses with no lessons
            
            -- Course Progress Summary
            (SELECT COUNT(*) FROM lessons l2 WHERE l2.course_id = c.id) AS total_lessons,
            (
                SELECT COUNT(*)
                FROM user_progress up3
                JOIN lessons l3 ON up3.lesson_id = l3.id
                WHERE up3.user_id = $2 AND up3.completed = true AND l3.course_id = c.id
            ) AS completed_lessons,

            -- User's Achievements (needed for achievement dependencies)
            (
                SELECT JSON_AGG(ua.achievement_type)
                FROM user_achievements ua
                WHERE ua.user_id = $2
            ) AS user_achievements

        FROM courses c
        LEFT JOIN lessons l ON c.id = l.course_id
        -- Use LEFT JOIN to include courses even without progress for the user
        LEFT JOIN user_progress up ON l.id = up.lesson_id AND up.user_id = $2
        WHERE c.id = $1
        GROUP BY c.id
    `;
    
    const result = await pool.query(query, [id, userId]);
    return result.rows[0];
  }

  static async checkDependencies(courseId, userId) {
    const query = `
      SELECT cd.*, 
             rc.title as required_course_title,
             at.title as required_achievement_title
      FROM course_dependencies cd
      LEFT JOIN courses rc ON cd.required_course_id = rc.id
      LEFT JOIN achievement_types at ON cd.required_achievement_type = at.type
      WHERE cd.course_id = $1
    `;
    
    const result = await pool.query(query, [courseId]);
    const dependencies = result.rows;
    
    const unmet = [];
    const met = [];

    for (const dep of dependencies) {
      let isMet = false;
      
      if (dep.dependency_type === 'course' && dep.required_course_id) {
        // Check if required course is completed with min score
        const progressQuery = `
          SELECT MAX(up.score) as max_score
          FROM user_progress up
          JOIN lessons l ON up.lesson_id = l.id
          WHERE up.user_id = $1 AND l.course_id = $2 AND up.completed = true
        `;
        const progressResult = await pool.query(progressQuery, [userId, dep.required_course_id]);
        isMet = progressResult.rows[0]?.max_score >= dep.min_score;
      } else if (dep.dependency_type === 'achievement' && dep.required_achievement_type) {
        // Check if achievement is earned
        const achievementQuery = `
          SELECT 1 FROM user_achievements 
          WHERE user_id = $1 AND achievement_type = $2
        `;
        const achievementResult = await pool.query(achievementQuery, [userId, dep.required_achievement_type]);
        isMet = achievementResult.rows.length > 0;
      }

      if (isMet) {
        met.push(dep);
      } else {
        unmet.push(dep);
      }
    }

    return {
      all_met: unmet.length === 0,
      met_dependencies: met,
      unmet_dependencies: unmet
    };
  }

  static async getAvailableCourses(userId) {
    const allCourses = await Course.findAll();
    const availableCourses = [];

    for (const course of allCourses) {
      const dependencies = await Course.checkDependencies(course.id, userId);
      const courseWithLessons = await Course.findById(course.id, userId);
      
      availableCourses.push({
        ...course,
        ...courseWithLessons,
        dependencies,
        is_locked: !dependencies.all_met,
        completion_percentage: courseWithLessons.total_lessons > 0 
          ? Math.round((courseWithLessons.completed_lessons / courseWithLessons.total_lessons) * 100)
          : 0
      });
    }

    return availableCourses;
  }

  static async findByIdWithDependencies(id, userId) {
    const query = `
      SELECT c.*, 
             JSON_AGG(
               JSON_BUILD_OBJECT(
                 'id', l.id,
                 'title', l.title,
                 'description', l.description,
                 'order_index', l.order_index,
                 'is_completed', EXISTS(
                   SELECT 1 FROM user_progress up 
                   WHERE up.lesson_id = l.id AND up.user_id = $2 AND up.completed = true
                 )
               ) ORDER BY l.order_index
             ) as lessons,
             (
               SELECT JSON_AGG(
                 JSON_BUILD_OBJECT(
                   'type', cd.dependency_type,
                   'required_course_id', cd.required_course_id,
                   'required_achievement_type', cd.required_achievement_type,
                   'min_score', cd.min_score,
                   'required_course_title', rc.title,
                   'required_achievement_title', at.title
                 )
               )
               FROM course_dependencies cd
               LEFT JOIN courses rc ON cd.required_course_id = rc.id
               LEFT JOIN achievement_types at ON cd.required_achievement_type = at.type
               WHERE cd.course_id = c.id
             ) as dependencies
      FROM courses c
      LEFT JOIN lessons l ON c.id = l.course_id
      WHERE c.id = $1
      GROUP BY c.id
    `;
    
    const result = await pool.query(query, [id, userId]);
    return result.rows[0];
  }

  static async getLesson(lessonId, userId = null) {
    const query = `
      SELECT l.*, c.title as course_title, c.language_target, c.coding_language,
             c.id as course_id,
             EXISTS(
               SELECT 1 FROM user_progress up 
               WHERE up.lesson_id = l.id AND up.user_id = $2 AND up.completed = true
             ) as is_completed
      FROM lessons l
      JOIN courses c ON l.course_id = c.id
      WHERE l.id = $1
    `;
    const result = await pool.query(query, [lessonId, userId]);
    return result.rows[0];
  }

  static async checkCourseDependencies(courseId, userId) {
    const dependenciesQuery = `
      SELECT cd.*, 
             rc.title as required_course_title, 
             at.title as required_achievement_title,
             at.description as required_achievement_description
      FROM course_dependencies cd
      LEFT JOIN courses rc ON cd.required_course_id = rc.id
      LEFT JOIN achievement_types at ON cd.required_achievement_type = at.type
      WHERE cd.course_id = $1
    `;
    
    const dependenciesResult = await pool.query(dependenciesQuery, [courseId]);
    const dependencies = dependenciesResult.rows;
    
    const unmetDependencies = [];
    const metDependencies = [];

    for (const dep of dependencies) {
      let isMet = false;
      let userProgress = null;
      let currentValue = null;

      if (dep.dependency_type === 'course' && dep.required_course_id) {
        // Check course completion with minimum score
        const progressQuery = `
          SELECT 
            COUNT(DISTINCT l.id) as total_lessons,
            COUNT(up.lesson_id) as completed_lessons,
            AVG(up.score) as average_score,
            MAX(up.score) as max_score
          FROM lessons l
          LEFT JOIN user_progress up ON l.id = up.lesson_id AND up.user_id = $1 AND up.completed = true
          WHERE l.course_id = $2
          GROUP BY l.course_id
        `;
        
        const progressResult = await pool.query(progressQuery, [userId, dep.required_course_id]);
        userProgress = progressResult.rows[0];
        
        if (userProgress) {
          currentValue = userProgress.max_score || 0;
          isMet = currentValue >= dep.min_score;
        } else {
          currentValue = 0;
          isMet = false;
        }
        
      } else if (dep.dependency_type === 'achievement' && dep.required_achievement_type) {
        // Check achievement
        const achievementQuery = `
          SELECT 1 FROM user_achievements 
          WHERE user_id = $1 AND achievement_type = $2
        `;
        
        const achievementResult = await pool.query(achievementQuery, [userId, dep.required_achievement_type]);
        isMet = achievementResult.rows.length > 0;
        currentValue = isMet ? 'Earned' : 'Not Earned';
      }

      const dependencyInfo = {
        ...dep,
        is_met: isMet,
        user_progress: userProgress,
        current_value: currentValue
      };

      if (isMet) {
        metDependencies.push(dependencyInfo);
      } else {
        unmetDependencies.push(dependencyInfo);
      }
    }

    return {
      all_met: unmetDependencies.length === 0,
      met_dependencies: metDependencies,
      unmet_dependencies: unmetDependencies,
      total_dependencies: dependencies.length,
      met_count: metDependencies.length,
      unmet_count: unmetDependencies.length
    };
  }

  static async getAvailableCourses(userId) {
    try {
      // First, get all courses
      const allCourses = await Course.findAll();
      const availableCourses = [];

      for (const course of allCourses) {
        // Check dependencies for each course
        const dependencies = await Course.checkCourseDependencies(course.id, userId);
        
        // Get user progress for this course
        const userProgress = await Course.getUserProgress(userId, course.id);
        
        if (dependencies.all_met) {
          availableCourses.push({
            ...course,
            dependencies: dependencies,
            is_locked: false,
            user_progress: userProgress
          });
        } else {
          availableCourses.push({
            ...course,
            dependencies: dependencies,
            is_locked: true,
            lock_reason: dependencies.unmet_dependencies[0], // First unmet dependency
            user_progress: userProgress
          });
        }
      }

      return availableCourses;
    } catch (error) {
      console.error('Error in getAvailableCourses:', error);
      throw error;
    }
  }

  static async getUserProgress(userId, courseId) {
    const query = `
      SELECT 
        COUNT(DISTINCT l.id) as total_lessons,
        COUNT(DISTINCT CASE WHEN up.completed = true THEN up.lesson_id END) as completed_lessons,
        COALESCE(AVG(CASE WHEN up.completed = true THEN up.score END), 0) as average_score,
        COALESCE(SUM(up.time_spent), 0) as total_time_spent,
        MAX(up.completed_at) as last_activity
      FROM lessons l
      LEFT JOIN user_progress up ON l.id = up.lesson_id AND up.user_id = $1
      WHERE l.course_id = $2
      GROUP BY l.course_id
    `;
    
    const result = await pool.query(query, [userId, courseId]);
    return result.rows[0] || { 
      total_lessons: 0, 
      completed_lessons: 0, 
      average_score: 0, 
      total_time_spent: 0,
      last_activity: null
    };
  }

  static async create(courseData) {
    const { title, description, language_target, coding_language, age_group, difficulty_level, thumbnail_url, order_index } = courseData;
    const query = `
      INSERT INTO courses (title, description, language_target, coding_language, age_group, difficulty_level, thumbnail_url, order_index)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const values = [title, description, language_target, coding_language, age_group, difficulty_level, thumbnail_url, order_index];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async addDependency(courseId, dependencyData) {
    const { required_course_id, required_achievement_type, min_score, dependency_type } = dependencyData;
    const query = `
      INSERT INTO course_dependencies (course_id, required_course_id, required_achievement_type, min_score, dependency_type)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [courseId, required_course_id, required_achievement_type, min_score, dependency_type];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async getCourseWithProgress(userId, courseId) {
    const course = await Course.findByIdWithDependencies(courseId, userId);
    const progress = await Course.getUserProgress(userId, courseId);
    
    return {
      ...course,
      user_progress: progress,
      completion_percentage: progress.total_lessons > 0 
        ? Math.round((progress.completed_lessons / progress.total_lessons) * 100)
        : 0
    };
  }
}

export default Course;

import pool from "../config/database.js";

class Lesson {

  static async findById(lessonId, userId = null) {
    const query = `
      SELECT l.*, 
             c.title as course_title,
             c.language_target,
             c.coding_language,
             c.id as course_id,
             EXISTS(
               SELECT 1 FROM user_progress up 
               WHERE up.lesson_id = l.id AND up.user_id = $2 AND up.completed = true
             ) as is_completed,
             (
               SELECT up.score FROM user_progress up 
               WHERE up.lesson_id = l.id AND up.user_id = $2
             ) as user_score,
             (
               SELECT up.code_submission FROM user_progress up 
               WHERE up.lesson_id = l.id AND up.user_id = $2
             ) as user_code,
             (
               SELECT JSON_AGG(
                 JSON_BUILD_OBJECT(
                   'id', ld.id,
                   'type', ld.dependency_type,
                   'required_lesson_id', ld.required_lesson_id,
                   'required_achievement_type', ld.required_achievement_type,
                   'min_score', ld.min_score,
                   'required_lesson_title', rl.title,
                   'required_achievement_title', at.title
                 )
               )
               FROM lesson_dependencies ld
               LEFT JOIN lessons rl ON ld.required_lesson_id = rl.id
               LEFT JOIN achievement_types at ON ld.required_achievement_type = at.type
               WHERE ld.lesson_id = l.id
             ) as dependencies
      FROM lessons l
      JOIN courses c ON l.course_id = c.id
      WHERE l.id = $1
    `;
    
    const result = await pool.query(query, [lessonId, userId]);
    return result.rows[0];
  }

  static async checkDependencies(lessonId, userId) {
    const query = `
      SELECT ld.*, 
             rl.title as required_lesson_title,
             at.title as required_achievement_title
      FROM lesson_dependencies ld
      LEFT JOIN lessons rl ON ld.required_lesson_id = rl.id
      LEFT JOIN achievement_types at ON ld.required_achievement_type = at.type
      WHERE ld.lesson_id = $1
    `;
    
    const result = await pool.query(query, [lessonId]);
    const dependencies = result.rows;
    
    const unmet = [];
    const met = [];

    for (const dep of dependencies) {
      let isMet = false;
      let currentValue = null;

      if (dep.dependency_type === 'lesson' && dep.required_lesson_id) {
        // Check lesson completion with minimum score
        const progressQuery = `
          SELECT up.score, up.completed 
          FROM user_progress up 
          WHERE up.lesson_id = $1 AND up.user_id = $2
        `;
        const progressResult = await pool.query(progressQuery, [dep.required_lesson_id, userId]);
        const progress = progressResult.rows[0];
        
        if (progress && progress.completed) {
          currentValue = progress.score;
          isMet = progress.score >= dep.min_score;
        }
      } else if (dep.dependency_type === 'achievement' && dep.required_achievement_type) {
        // Check achievement
        const achievementQuery = `
          SELECT 1 FROM user_achievements 
          WHERE user_id = $1 AND achievement_type = $2
        `;
        const achievementResult = await pool.query(achievementQuery, [userId, dep.required_achievement_type]);
        isMet = achievementResult.rows.length > 0;
        currentValue = isMet ? 'Earned' : 'Not Earned';
      }

      const dependencyInfo = {
        ...dep,
        is_met: isMet,
        current_value: currentValue
      };

      if (isMet) {
        met.push(dependencyInfo);
      } else {
        unmet.push(dependencyInfo);
      }
    }

    return {
      all_met: unmet.length === 0,
      met_dependencies: met,
      unmet_dependencies: unmet
    };
  }

  static async getNavigation(courseId, currentLessonId, userId) {
    // Get all lessons in course
    const lessonsQuery = `
      SELECT l.id, l.title, l.order_index,
             EXISTS(
               SELECT 1 FROM user_progress up 
               WHERE up.lesson_id = l.id AND up.user_id = $2 AND up.completed = true
             ) as is_completed
      FROM lessons l
      WHERE l.course_id = $1
      ORDER BY l.order_index ASC
    `;
    
    const lessonsResult = await pool.query(lessonsQuery, [courseId, userId]);
    const lessons = lessonsResult.rows;

    const currentIndex = lessons.findIndex(lesson => lesson.id === parseInt(currentLessonId));
    let previous = null;
    let next = null;

    // Find previous accessible lesson
    for (let i = currentIndex - 1; i >= 0; i--) {
      const lessonDeps = await Lesson.checkDependencies(lessons[i].id, userId);
      if (lessonDeps.all_met || lessons[i].is_completed) {
        previous = lessons[i];
        break;
      }
    }

    // Find next accessible lesson
    for (let i = currentIndex + 1; i < lessons.length; i++) {
      const lessonDeps = await Lesson.checkDependencies(lessons[i].id, userId);
      if (lessonDeps.all_met || lessons[i].is_completed) {
        next = lessons[i];
        break;
      }
    }

    return {
      previous,
      next,
      current: lessons[currentIndex],
      total: lessons.length,
      completed: lessons.filter(l => l.is_completed).length,
      currentPosition: currentIndex + 1
    };
  }

  static async saveCodeSubmission(userId, lessonId, code) {
    const query = `
      INSERT INTO user_progress (user_id, lesson_id, code_submission, completed, score)
      VALUES ($1, $2, $3, false, 0)
      ON CONFLICT (user_id, lesson_id) 
      DO UPDATE SET code_submission = $3, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    const result = await pool.query(query, [userId, lessonId, code]);
    return result.rows[0];
  }

  static async submitLesson(userId, lessonId, code, timeSpent, score, completed) {
    const query = `
      INSERT INTO user_progress (user_id, lesson_id, course_id, code_submission, completed, score, time_spent, completed_at)
      SELECT $1, $2, l.course_id, $3, $4, $5, $6, 
             CASE WHEN $4 = true THEN CURRENT_TIMESTAMP ELSE NULL END
      FROM lessons l WHERE l.id = $2
      ON CONFLICT (user_id, lesson_id) 
      DO UPDATE SET 
        code_submission = $3,
        completed = $4,
        score = $5,
        time_spent = user_progress.time_spent + $6,
        completed_at = CASE WHEN $4 = true THEN CURRENT_TIMESTAMP ELSE user_progress.completed_at END,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    const result = await pool.query(query, [userId, lessonId, code, completed, score, timeSpent]);
    return result.rows[0];
  }

  static async findByIdWithDependencies(lessonId, userId) {
    const query = `
      SELECT l.*, 
             c.title as course_title,
             c.language_target,
             c.coding_language,
             c.id as course_id,
             EXISTS(
               SELECT 1 FROM user_progress up 
               WHERE up.lesson_id = l.id AND up.user_id = $2 AND up.completed = true
             ) as is_completed,
             (
               SELECT JSON_AGG(
                 JSON_BUILD_OBJECT(
                   'type', ld.dependency_type,
                   'required_lesson_id', ld.required_lesson_id,
                   'required_achievement_type', ld.required_achievement_type,
                   'min_score', ld.min_score,
                   'required_lesson_title', rl.title,
                   'required_achievement_title', at.title
                 )
               )
               FROM lesson_dependencies ld
               LEFT JOIN lessons rl ON ld.required_lesson_id = rl.id
               LEFT JOIN achievement_types at ON ld.required_achievement_type = at.type
               WHERE ld.lesson_id = l.id
             ) as dependencies,
             (
               SELECT up.score
               FROM user_progress up
               WHERE up.lesson_id = l.id AND up.user_id = $2
             ) as user_score,
             (
               SELECT up.code_submission
               FROM user_progress up
               WHERE up.lesson_id = l.id AND up.user_id = $2
             ) as user_code
      FROM lessons l
      JOIN courses c ON l.course_id = c.id
      WHERE l.id = $1
    `;
    
    const result = await pool.query(query, [lessonId, userId]);
    return result.rows[0];
  }

  static async checkLessonDependencies(lessonId, userId) {
    const dependenciesQuery = `
      SELECT ld.*, 
             rl.title as required_lesson_title,
             rl.order_index as required_lesson_order,
             at.title as required_achievement_title,
             at.description as required_achievement_description
      FROM lesson_dependencies ld
      LEFT JOIN lessons rl ON ld.required_lesson_id = rl.id
      LEFT JOIN achievement_types at ON ld.required_achievement_type = at.type
      WHERE ld.lesson_id = $1
    `;
    
    const dependenciesResult = await pool.query(dependenciesQuery, [lessonId]);
    const dependencies = dependenciesResult.rows;
    
    const unmetDependencies = [];
    const metDependencies = [];

    for (const dep of dependencies) {
      let isMet = false;
      let userProgress = null;
      let currentValue = null;

      if (dep.dependency_type === 'lesson' && dep.required_lesson_id) {
        // Check lesson completion with minimum score
        const progressQuery = `
          SELECT up.score, up.completed, up.completed_at
          FROM user_progress up
          WHERE up.lesson_id = $1 AND up.user_id = $2
        `;
        
        const progressResult = await pool.query(progressQuery, [dep.required_lesson_id, userId]);
        userProgress = progressResult.rows[0];
        
        if (userProgress && userProgress.completed) {
          currentValue = userProgress.score || 0;
          isMet = currentValue >= dep.min_score;
        } else {
          currentValue = 0;
          isMet = false;
        }
        
      } else if (dep.dependency_type === 'achievement' && dep.required_achievement_type) {
        // Check achievement
        const achievementQuery = `
          SELECT 1 FROM user_achievements 
          WHERE user_id = $1 AND achievement_type = $2
        `;
        
        const achievementResult = await pool.query(achievementQuery, [userId, dep.required_achievement_type]);
        isMet = achievementResult.rows.length > 0;
        currentValue = isMet ? 'Earned' : 'Not Earned';
      }

      const dependencyInfo = {
        ...dep,
        is_met: isMet,
        user_progress: userProgress,
        current_value: currentValue
      };

      if (isMet) {
        metDependencies.push(dependencyInfo);
      } else {
        unmetDependencies.push(dependencyInfo);
      }
    }

    return {
      all_met: unmetDependencies.length === 0,
      met_dependencies: metDependencies,
      unmet_dependencies: unmetDependencies,
      total_dependencies: dependencies.length,
      met_count: metDependencies.length,
      unmet_count: unmetDependencies.length
    };
  }

  static async getCourseLessonsWithDependencies(courseId, userId) {
    const query = `
      SELECT l.*,
             EXISTS(
               SELECT 1 FROM user_progress up 
               WHERE up.lesson_id = l.id AND up.user_id = $2 AND up.completed = true
             ) as is_completed,
             (
               SELECT up.score
               FROM user_progress up
               WHERE up.lesson_id = l.id AND up.user_id = $2
             ) as user_score,
             (
               SELECT COUNT(*)
               FROM lesson_dependencies ld
               WHERE ld.lesson_id = l.id
             ) as dependency_count
      FROM lessons l
      WHERE l.course_id = $1
      ORDER BY l.order_index ASC
    `;
    
    const result = await pool.query(query, [courseId, userId]);
    const lessons = result.rows;

    // Enhance each lesson with dependency information
    const enhancedLessons = await Promise.all(
      lessons.map(async (lesson) => {
        const dependencies = await Lesson.checkLessonDependencies(lesson.id, userId);
        return {
          ...lesson,
          dependencies: dependencies,
          is_locked: !dependencies.all_met && !lesson.is_optional,
          is_accessible: dependencies.all_met || lesson.is_completed || lesson.is_optional
        };
      })
    );

    return enhancedLessons;
  }

  static async getNextAccessibleLesson(courseId, userId, currentLessonId = null) {
    const lessons = await Lesson.getCourseLessonsWithDependencies(courseId, userId);
    
    // If current lesson is provided, find the next one
    if (currentLessonId) {
      const currentIndex = lessons.findIndex(lesson => lesson.id === parseInt(currentLessonId));
      if (currentIndex !== -1) {
        // Find next accessible lesson after current one
        for (let i = currentIndex + 1; i < lessons.length; i++) {
          if (lessons[i].is_accessible && !lessons[i].is_completed) {
            return lessons[i];
          }
        }
      }
    }

    // Otherwise, find first accessible and incomplete lesson
    return lessons.find(lesson => lesson.is_accessible && !lesson.is_completed) || null;
  }

  static async getLessonNavigation(courseId, userId, currentLessonId) {
    const lessons = await Lesson.getCourseLessonsWithDependencies(courseId, userId);
    const currentIndex = lessons.findIndex(lesson => lesson.id === parseInt(currentLessonId));
    
    if (currentIndex === -1) {
      return { previous: null, next: null, current: null };
    }

    const currentLesson = lessons[currentIndex];
    let previousLesson = null;
    let nextLesson = null;

    // Find previous accessible lesson
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (lessons[i].is_accessible) {
        previousLesson = lessons[i];
        break;
      }
    }

    // Find next accessible lesson
    for (let i = currentIndex + 1; i < lessons.length; i++) {
      if (lessons[i].is_accessible) {
        nextLesson = lessons[i];
        break;
      }
    }

    return {
      previous: previousLesson,
      current: currentLesson,
      next: nextLesson,
      total: lessons.length,
      completed: lessons.filter(l => l.is_completed).length,
      currentPosition: currentIndex + 1
    };
  }

  static async create(lessonData) {
    const { course_id, title, description, instructions, order_index, coding_challenge, vocabulary, expected_output, is_optional, estimated_duration } = lessonData;
    const query = `
      INSERT INTO lessons (course_id, title, description, instructions, order_index, coding_challenge, vocabulary, expected_output, is_optional, estimated_duration)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    const values = [course_id, title, description, instructions, order_index, coding_challenge, vocabulary, expected_output, is_optional, estimated_duration];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async addDependency(lessonId, dependencyData) {
    const { required_lesson_id, required_achievement_type, min_score, dependency_type } = dependencyData;
    const query = `
      INSERT INTO lesson_dependencies (lesson_id, required_lesson_id, required_achievement_type, min_score, dependency_type)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [lessonId, required_lesson_id, required_achievement_type, min_score, dependency_type];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async getUserLessonProgress(userId, lessonId) {
    const query = `
      SELECT up.*, l.title as lesson_title, c.title as course_title
      FROM user_progress up
      JOIN lessons l ON up.lesson_id = l.id
      JOIN courses c ON l.course_id = c.id
      WHERE up.user_id = $1 AND up.lesson_id = $2
    `;
    
    const result = await pool.query(query, [userId, lessonId]);
    return result.rows[0];
  }
}

export default Lesson;

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'student',
    age INTEGER,
    avatar_url VARCHAR(500),
    parent_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Courses table
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    language_target VARCHAR(50), -- e.g., 'spanish', 'french'
    coding_language VARCHAR(50), -- e.g., 'blockly', 'python'
    age_group VARCHAR(20), -- e.g., '4-7', '8-12'
    difficulty_level INTEGER,
    thumbnail_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lessons table
CREATE TABLE lessons (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructions JSONB, -- {en: "instruction", es: "instrucción"}
    order_index INTEGER,
    coding_challenge TEXT,
    vocabulary JSONB, -- {words: [{word: "loop", translation: "bucle", audio_url: ""}]}
    expected_output TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User progress table
CREATE TABLE user_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    lesson_id INTEGER REFERENCES lessons(id),
    course_id INTEGER REFERENCES courses(id),
    code_submission TEXT,
    completed BOOLEAN DEFAULT false,
    score INTEGER DEFAULT 0,
    time_spent INTEGER DEFAULT 0, -- in seconds
    completed_at TIMESTAMP,
    UNIQUE(user_id, lesson_id)
);

-- Achievements table
CREATE TABLE achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    type VARCHAR(100), -- e.g., 'first_lesson', 'coding_streak'
    title VARCHAR(255),
    description TEXT,
    icon_url VARCHAR(500),
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add these tables to your existing schema

-- Achievement types table
CREATE TABLE achievement_types (
    id SERIAL PRIMARY KEY,
    type VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    icon_url VARCHAR(500),
    points INTEGER DEFAULT 10,
    category VARCHAR(50) DEFAULT 'general'
);

-- User achievements (updated with points)
CREATE TABLE user_achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    achievement_type VARCHAR(100) REFERENCES achievement_types(type),
    title VARCHAR(255),
    description TEXT,
    icon_url VARCHAR(500),
    points_earned INTEGER,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_type)
);

-- Course dependencies
CREATE TABLE course_dependencies (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id),
    required_course_id INTEGER REFERENCES courses(id),
    required_achievement_type VARCHAR(100) REFERENCES achievement_types(type),
    min_score INTEGER DEFAULT 0,
    dependency_type VARCHAR(50) NOT NULL -- 'course' or 'achievement'
);

-- User points and levels
CREATE TABLE user_points (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) UNIQUE,
    total_points INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1,
    level_title VARCHAR(100) DEFAULT 'Beginner Coder',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lesson dependencies table
CREATE TABLE lesson_dependencies (
    id SERIAL PRIMARY KEY,
    lesson_id INTEGER REFERENCES lessons(id),
    required_lesson_id INTEGER REFERENCES lessons(id),
    required_achievement_type VARCHAR(100) REFERENCES achievement_types(type),
    min_score INTEGER DEFAULT 0,
    dependency_type VARCHAR(50) NOT NULL, -- 'lesson' or 'achievement'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Update lessons table with additional fields
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS order_index INTEGER;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS is_optional BOOLEAN DEFAULT false;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS estimated_duration INTEGER DEFAULT 900; -- in seconds (15 minutes default)
