import express from 'express';
import LessonController from '../controllers/lessonController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Lesson routes with dependencies
router.get('/:lessonId', auth, LessonController.getLesson);
router.get('/:lessonId/dependencies', auth, LessonController.checkDependencies);
router.get('/:lessonId/navigation', auth, LessonController.getLessonNavigation);
router.post('/:lessonId/submit', auth, LessonController.submitLesson);
router.post('/:lessonId/unlock', auth, LessonController.unlockLesson);

// Course-level lesson routes
router.get('/course/:courseId/progress', auth, LessonController.getCourseProgress);
router.get('/course/:courseId/next', auth, LessonController.getNextLesson);

export default router;