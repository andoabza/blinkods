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