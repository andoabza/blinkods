import express from 'express';
import auth from '../middleware/auth.js';
import AIController from '../controllers/aiController.js';

const router = express.Router();

router.post('/run-code', auth, AIController.runCode);
router.post('/hint', auth, AIController.getHint);
router.post('/validate', auth, AIController.validateSolution);
router.post('/tts', auth, AIController.textToSpeech);

export default router;