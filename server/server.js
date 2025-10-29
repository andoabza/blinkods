import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import morgan from 'morgan';

import Auth from './routes/auth.js';
import Courses from './routes/courses.js';
import Progress from './routes/progress.js';
import AI from './routes/ai.js';
import Lesson from './routes/lessons.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Database connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', Auth);
app.use('/api/courses', Courses);
app.use('/api/progress', Progress);
app.use('/api/ai', AI);
app.use('/api/lessons', Lesson);

// Socket.io for real-time features
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Join a lesson room for collaborative coding
  socket.on('join-lesson', (lessonId) => {
    socket.join(`lesson-${lessonId}`);
  });
  
  // Real-time code collaboration
  socket.on('code-change', (data) => {
    socket.to(`lesson-${data.lessonId}`).emit('code-update', data);
  });
  
  // Live help requests
  socket.on('request-help', (data) => {
    // Notify tutors or parents
    socket.broadcast.emit('help-request', data);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});