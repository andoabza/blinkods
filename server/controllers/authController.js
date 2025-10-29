import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import User from '../models/User.js';

class AuthController {
  static async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, username, role, age, parentEmail } = req.body;
      
      // Check if user exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists with this email' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Create user
      const userData = {
        email,
        password_hash: passwordHash,
        username,
        role: role || 'student',
        age
      };

      // Handle parent-child relationship
      if (parentEmail && role === 'student') {
        const parent = await User.findByEmail(parentEmail);
        if (parent) {
          userData.parent_id = parent.id;
        }
      }

      const newUser = await User.create(userData);

      // Generate JWT
      const payload = { user: { id: newUser.id } };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

      res.status(201).json({
        message: 'User created successfully',
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          role: newUser.role,
          age: newUser.age
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Server error during registration' });
    }
  }

  static async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      // Generate JWT
      const payload = { user: { id: user.id } };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          age: user.age,
          avatar_url: user.avatar_url
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Server error during login' });
    }
  }

  static async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ user });
    } catch (error) {
      console.error('Profile error:', error);
      res.status(500).json({ error: 'Server error fetching profile' });
    }
  }

  static async updateProfile(req, res) {
    try {
      const { username, age, avatar_url } = req.body;
      const updatedUser = await User.updateProfile(req.user.id, {
        username,
        age,
        avatar_url
      });

      res.json({
        message: 'Profile updated successfully',
        user: updatedUser
      });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ error: 'Server error updating profile' });
    }
  }

  static async getChildren(req, res) {
    try {
      if (req.user.role !== 'parent') {
        return res.status(403).json({ error: 'Access denied. Parent role required.' });
      }

      const children = await User.getChildren(req.user.id);
      res.json({ children });
    } catch (error) {
      console.error('Get children error:', error);
      res.status(500).json({ error: 'Server error fetching children' });
    }
  }
}

export default AuthController;