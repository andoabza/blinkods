import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import morgan from 'morgan';

import initializeSocket from './socket/lessonHandlers.js';

import Auth from './routes/auth.js';
import Courses from './routes/courses.js';
import Progress from './routes/progress.js';
import Ai from './routes/ai.js';
import Lesson from './routes/lessons.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
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
app.use('/api/ai', Ai);
app.use('/api/lessons', Lesson);

// Socket.io for real-time features
io.use((socket, next) => {
  // You can implement JWT verification here
  // console.log(socket);
  
  // const token = socket.handshake.auth.token;
  if (socket) {
    // Verify token and set user data
    socket.userId = socket.handshake.auth.userId;
    socket.username = socket.handshake.auth.username;
    next();
  } else {
    next(new Error('Authentication error'));
  }
});

initializeSocket(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});