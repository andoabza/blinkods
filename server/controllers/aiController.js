import CodeExecution from "../models/CodeExecution.js";
import { OpenAI } from 'openai';

class AIController {
  constructor() {
    // Initialize OpenAI (optional - for advanced features)
    this.openai = process.env.OPENAI_API_KEY ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    }) : null;
  }

  static async runCode(req, res) {
    try {
      const { code, language, lessonId } = req.body;
      
      const result = await CodeExecution.executeBlockly(code, language);
      
      // Save execution if lessonId provided
      if (lessonId) {
        await CodeExecution.saveExecution(req.user.id, lessonId, code, result);
      }

      res.json({
        success: result.success,
        output: result.output,
        error: result.error
      });
    } catch (error) {
      console.error('AI run code error:', error);
      res.status(500).json({ error: 'Server error running code' });
    }
  }

  static async getHint(req, res) {
    try {
      const { lessonId, code, problem } = req.body;
      
      // Simple hint system - in production, use AI for personalized hints
      const hints = {
        'syntax_error': 'Check your spelling and punctuation! Remember, coding needs to be exact.',
        'logic_error': 'Think about the order of your blocks. What should happen first?',
        'variable_error': 'Did you remember to create your variable before using it?',
        'loop_error': 'Make sure your loop has a clear start and end point.'
      };

      // Simple problem detection
      let detectedProblem = 'general';
      if (code.includes('undefined') || code.includes('null')) {
        detectedProblem = 'variable_error';
      } else if (code.includes('while') || code.includes('for')) {
        detectedProblem = 'loop_error';
      }

      const hint = hints[detectedProblem] || "Try breaking the problem into smaller steps!";

      res.json({
        hint,
        problem: detectedProblem,
        suggestions: [
          'Read the instructions carefully',
          'Check if all blocks are connected properly',
          'Look at the vocabulary words for clues'
        ]
      });
    } catch (error) {
      console.error('Get hint error:', error);
      res.status(500).json({ error: 'Server error getting hint' });
    }
  }

  static async validateSolution(req, res) {
    try {
      const { lessonId, code } = req.body;
      
      // Get lesson expected output
      const lesson = await Course.getLesson(lessonId);
      if (!lesson) {
        return res.status(404).json({ error: 'Lesson not found' });
      }

      const validation = await CodeExecution.validateOutput(
        code, 
        lesson.expected_output, 
        lesson.coding_language
      );

      res.json({
        valid: validation.valid,
        score: validation.score,
        feedback: validation.feedback,
        actualOutput: validation.actualOutput
      });
    } catch (error) {
      console.error('Validate solution error:', error);
      res.status(500).json({ error: 'Server error validating solution' });
    }
  }

  static async textToSpeech(req, res) {
    try {
      const { text, language } = req.body;
      
      // Simple TTS implementation - in production, use a service like AWS Polly or Google TTS
      // This is a mock implementation
      const audioUrl = `/api/audio/${encodeURIComponent(text)}?lang=${language}`;
      
      res.json({
        audioUrl,
        text,
        language
      });
    } catch (error) {
      console.error('TTS error:', error);
      res.status(500).json({ error: 'Server error generating speech' });
    }
  }
}

export default AIController;