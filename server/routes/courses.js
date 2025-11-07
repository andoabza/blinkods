import express from 'express';
import CourseController from '../controllers/courseController.js';
import auth from '../middleware/auth.js';

const router = express.Router();


// Public routes (if any)
// router.get('/public', CourseController.getPublicCourses);

// Protected routes (require authentication)
router.use(auth);

router.get('/:id/progress', CourseController.getCourseWithProgress);
router.get('/:id/dependencies',CourseController.checkCourseDependencies);
router.get('/:id/user-progress', CourseController.getUserProgress);

// Admin routes (could add role-based middleware here)
router.post('/:id/dependencies', CourseController.addCourseDependency);

// Protected routes
router.get('/', auth, CourseController.getAllCourses);
router.get('/available', auth, CourseController.getAvailableCourses);
router.get('/:id', auth, CourseController.getCourse);
router.get('/:courseId/dependencies', auth, CourseController.checkDependencies);
router.get('/recommended', auth, CourseController.getRecommendedCourses);
router.get('/:courseId/progress', auth, CourseController.getCourseProgress);
router.get('/lesson/:lessonId', auth, CourseController.getLesson);

// Admin only routes
router.post('/', auth, CourseController.createCourse);
router.post('/:courseId/unlock', auth, CourseController.unlockCourse);

export default router;
