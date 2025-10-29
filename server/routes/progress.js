import express from 'express';
import ProgressController from '../controllers/progressController.js';
import auth from '../middleware/auth.js';
const router = express.Router();

router.get('/:courseId', auth, ProgressController.getProgress);
router.get('/', auth, ProgressController.getDashboard);
router.get('/achievements', auth, ProgressController.getAchievements);
router.post('/submit', auth, ProgressController.submitLesson);
router.post('/run-code', auth, ProgressController.runCode);

export default router;