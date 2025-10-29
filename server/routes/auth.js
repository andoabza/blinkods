import express from 'express';
import AuthController from '../controllers/authController.js';
import auth from '../middleware/auth.js';
import { check } from 'express-validator';

const router = express.Router();

router.post('/register', [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password must be 6+ characters').isLength({ min: 6 }),
  check('username', 'Username is required').not().isEmpty()
], AuthController.register);

router.post('/login', [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists()
], AuthController.login);

router.get('/verify', auth, AuthController.getProfile);

router.get('/profile', auth, AuthController.getProfile);
router.put('/profile', auth, AuthController.updateProfile);
router.get('/children', auth, AuthController.getChildren);


export default router;