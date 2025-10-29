import pool from '../config/database.js';
import { exec } from'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

class CodeExecution {
  static async executePython(code) {
    try {
      // For production, use a secure sandboxed environment like Docker
      // This is a simplified version for development
      const { stdout, stderr } = await execAsync(`python3 -c "${code.replace(/"/g, '\\"')}"`, {
        timeout: 10000, // 10 second timeout
        maxBuffer: 1024 * 1024 // 1MB output limit
      });
      
      return {
        success: true,
        output: stdout || stderr,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        output: null,
        error: error.message
      };
    }
  }

  static async executeJavaScript(code) {
    try {
      // For browser JavaScript, we can use eval in a safe context
      // Note: In production, use proper sandboxing
      const result = eval(code);
      return {
        success: true,
        output: String(result),
        error: null
      };
    } catch (error) {
      return {
        success: false,
        output: null,
        error: error.message
      };
    }
  }

  static async executeBlockly(code, language) {
    if (language === 'python') {
      return await CodeExecution.executePython(code);
    } else {
      return await CodeExecution.executeJavaScript(code);
    }
  }

  static async validateOutput(userCode, expectedOutput, language) {
    const result = await CodeExecution.executeBlockly(userCode, language);
    
    if (!result.success) {
      return {
        valid: false,
        score: 0,
        feedback: `Code execution error: ${result.error}`
      };
    }
    
    // Simple validation - check if output contains expected text
    const userOutput = result.output.toLowerCase().trim();
    const expected = expectedOutput.toLowerCase().trim();
    
    const isValid = userOutput.includes(expected);
    const score = isValid ? 100 : 0;
    
    return {
      valid: isValid,
      score: score,
      feedback: isValid ? 'Great job! Your code works correctly!' : 'Try again! The output doesn\'t match expected result.',
      actualOutput: result.output
    };
  }

  static async saveExecution(userId, lessonId, code, result) {
    const query = `
      INSERT INTO code_executions (user_id, lesson_id, code, output, success, error_message)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    
    const values = [
      userId, 
      lessonId, 
      code, 
      result.output, 
      result.success, 
      result.error
    ];
    
    await pool.query(query, values);
  }
}

export default CodeExecution;