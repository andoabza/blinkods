import express from 'express';
import AchievementController from '../controllers/achievementController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, AchievementController.getUserAchievements);
router.get('/available', auth, AchievementController.getAvailableAchievements);
router.get('/stats', auth, AchievementController.getAchievementStats);
router.post('/check', auth, AchievementController.checkAllAchievements);

export default router;