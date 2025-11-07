import Lesson from '../models/Lesson.js'

export default (io) => {
  const lessonRooms = new Map();

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join lesson room
    socket.on('join-lesson', async (lessonId) => {
      try {
        socket.join(`lesson-${lessonId}`);
        
        // Add user to room tracking
        if (!lessonRooms.has(lessonId)) {
          lessonRooms.set(lessonId, new Set());
        }
        lessonRooms.get(lessonId).add({
          id: socket.id,
          userId: socket.userId,
          username: socket.username
        });

        // Notify others
        socket.to(`lesson-${lessonId}`).emit('user-joined', {
          id: socket.id,
          userId: socket.userId,
          username: socket.username
        });

        // Send current room participants
        const participants = Array.from(lessonRooms.get(lessonId) || []);
        socket.emit('room-participants', participants);

        console.log(`User ${socket.username} joined lesson ${lessonId}`);
      } catch (error) {
        console.error('Error joining lesson:', error);
      }
    });

    // Handle code changes
    socket.on('code-change', (data) => {
      const { lessonId, code, userId } = data;
      
      // Broadcast to other users in the same lesson
      socket.to(`lesson-${lessonId}`).emit('code-update', {
        code,
        userId: socket.userId,
        username: socket.username,
        timestamp: new Date().toISOString()
      });

      // Auto-save code for the user
      if (userId === socket.userId) {
        Lesson.saveCodeSubmission(userId, lessonId, code)
          .catch(error => console.error('Auto-save error:', error));
      }
    });

    // Handle help requests
    socket.on('request-help', (data) => {
      const { lessonId, question } = data;
      
      // Notify teachers/parents
      socket.to(`lesson-${lessonId}`).emit('help-requested', {
        userId: socket.userId,
        username: socket.username,
        lessonId,
        question,
        timestamp: new Date().toISOString()
      });

      console.log(`Help request from ${socket.username} in lesson ${lessonId}: ${question}`);
    });

    // Handle collaboration cursor
    socket.on('cursor-move', (data) => {
      const { lessonId, position } = data;
      
      socket.to(`lesson-${lessonId}`).emit('user-cursor-moved', {
        userId: socket.userId,
        username: socket.username,
        position,
        timestamp: new Date().toISOString()
      });
    });

    // Handle user leaving
    socket.on('leave-lesson', (lessonId) => {
      socket.leave(`lesson-${lessonId}`);
      
      // Remove from room tracking
      if (lessonRooms.has(lessonId)) {
        const room = lessonRooms.get(lessonId);
        room.delete(Array.from(room).find(user => user.id === socket.id));
        
        if (room.size === 0) {
          lessonRooms.delete(lessonId);
        }
      }

      // Notify others
      socket.to(`lesson-${lessonId}`).emit('user-left', {
        id: socket.id,
        userId: socket.userId,
        username: socket.username
      });

      console.log(`User ${socket.username} left lesson ${lessonId}`);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      
      // Clean up from all rooms
      for (const [lessonId, room] of lessonRooms.entries()) {
        if (room.has(socket.id)) {
          room.delete(socket.id);
          socket.to(`lesson-${lessonId}`).emit('user-left', {
            id: socket.id,
            userId: socket.userId,
            username: socket.username
          });
          
          if (room.size === 0) {
            lessonRooms.delete(lessonId);
          }
        }
      }
    });
  });
};