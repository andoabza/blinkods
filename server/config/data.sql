-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'student',
    age INTEGER,
    avatar_url VARCHAR(500),
    parent_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Courses table
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    language_target VARCHAR(50), -- e.g., 'spanish', 'french'
    coding_language VARCHAR(50), -- e.g., 'blockly', 'python'
    age_group VARCHAR(20), -- e.g., '4-7', '8-12'
    difficulty_level INTEGER,
    thumbnail_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lessons table
CREATE TABLE lessons (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructions JSONB, -- {en: "instruction", es: "instrucción"}
    order_index INTEGER,
    coding_challenge TEXT,
    vocabulary JSONB, -- {words: [{word: "loop", translation: "bucle", audio_url: ""}]}
    expected_output TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User progress table
CREATE TABLE user_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    lesson_id INTEGER REFERENCES lessons(id),
    course_id INTEGER REFERENCES courses(id),
    code_submission TEXT,
    completed BOOLEAN DEFAULT false,
    score INTEGER DEFAULT 0,
    time_spent INTEGER DEFAULT 0, -- in seconds
    completed_at TIMESTAMP,
    UNIQUE(user_id, lesson_id)
);

-- Achievements table
CREATE TABLE achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    type VARCHAR(100), -- e.g., 'first_lesson', 'coding_streak'
    title VARCHAR(255),
    description TEXT,
    icon_url VARCHAR(500),
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add these tables to your existing schema

-- Achievement types table
CREATE TABLE achievement_types (
    id SERIAL PRIMARY KEY,
    type VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    icon_url VARCHAR(500),
    points INTEGER DEFAULT 10,
    category VARCHAR(50) DEFAULT 'general'
);

-- User achievements (updated with points)
CREATE TABLE user_achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    achievement_type VARCHAR(100) REFERENCES achievement_types(type),
    title VARCHAR(255),
    description TEXT,
    icon_url VARCHAR(500),
    points_earned INTEGER,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_type)
);

-- Course dependencies
CREATE TABLE course_dependencies (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id),
    required_course_id INTEGER REFERENCES courses(id),
    required_achievement_type VARCHAR(100) REFERENCES achievement_types(type),
    min_score INTEGER DEFAULT 0,
    dependency_type VARCHAR(50) NOT NULL -- 'course' or 'achievement'
);

-- User points and levels
CREATE TABLE user_points (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) UNIQUE,
    total_points INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1,
    level_title VARCHAR(100) DEFAULT 'Beginner Coder',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lesson dependencies table
CREATE TABLE lesson_dependencies (
    id SERIAL PRIMARY KEY,
    lesson_id INTEGER REFERENCES lessons(id),
    required_lesson_id INTEGER REFERENCES lessons(id),
    required_achievement_type VARCHAR(100) REFERENCES achievement_types(type),
    min_score INTEGER DEFAULT 0,
    dependency_type VARCHAR(50) NOT NULL, -- 'lesson' or 'achievement'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Update lessons table with additional fields
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS order_index INTEGER;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS is_optional BOOLEAN DEFAULT false;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS estimated_duration INTEGER DEFAULT 900; -- in seconds (15 minutes default)

-- Insert sample lesson dependencies
INSERT INTO lesson_dependencies (lesson_id, required_lesson_id, required_achievement_type, min_score, dependency_type) VALUES
(2, 1, NULL, 80, 'lesson'), -- Lesson 2 requires Lesson 1 with 80% score
(5, NULL, 'first_lesson', 0, 'achievement'), -- Lesson 5 requires 'first_lesson' achievement
(8, 7, 'fast_learner', 90, 'lesson'); -- Lesson 8 requires Lesson 7 and 'fast_learner' with 90% score

-- Insert initial achievement types
INSERT INTO achievement_types (type, title, description, icon_url, points, category) VALUES
('first_lesson', 'First Steps', 'Complete your first coding lesson', '/assets/achievements/first-lesson.png', 10, 'milestone'),
('fast_learner', 'Fast Learner', 'Complete 5 lessons', '/assets/achievements/fast-learner.png', 20, 'progress'),
('coding_streak', 'Coding Streak', 'Code for 3 days in a row', '/assets/achievements/streak.png', 15, 'consistency'),
('perfect_score', 'Perfect Score', 'Get 100% on a lesson', '/assets/achievements/perfect-score.png', 25, 'mastery'),
('language_explorer', 'Language Explorer', 'Complete lessons in 3 different languages', '/assets/achievements/language-explorer.png', 30, 'variety'),
('bug_hunter', 'Bug Hunter', 'Fix 10 coding errors', '/assets/achievements/bug-hunter.png', 20, 'problem_solving'),
('early_bird', 'Early Bird', 'Complete a lesson before 9 AM', '/assets/achievements/early-bird.png', 15, 'special'),
('weekend_warrior', 'Weekend Warrior', 'Complete lessons on both Saturday and Sunday', '/assets/achievements/weekend-warrior.png', 20, 'consistency'),
('speed_racer', 'Speed Racer', 'Complete a lesson in under 5 minutes', '/assets/achievements/speed-racer.png', 25, 'mastery'),
('marathon_coder', 'Marathon Coder', 'Spend over 60 minutes coding in one session', '/assets/achievements/marathon-coder.png', 30, 'endurance');
INSERT INTO courses (title, description, language_target, coding_language, age_group, difficulty_level, thumbnail_url) VALUES
('Intro to English with Blockly', 'Learn basic English words and simple phrases using block-based coding activities.', 'english', 'blockly', '4-7', 1, '/assets/courses/english-blockly-intro.png'),
('English Adventures: Stories & Code', 'Read short stories in English and build interactive story scenes using Python.', 'english', 'python', '8-12', 2, '/assets/courses/english-python-stories.png'),
('Everyday English for Teens', 'Practical English lessons focused on conversation and coding small utilities in JavaScript.', 'english', 'javascript', '13-17', 3, '/assets/courses/english-js-teens.png'),
('Spanish Basics with Blockly', 'Introduction to common Spanish vocabulary paired with Blockly coding puzzles.', 'spanish', 'blockly', '4-7', 1, '/assets/courses/spanish-blockly-basics.png'),
('Spanish Storytelling and Code', 'Create interactive Spanish story apps while learning intermediate programming concepts in Python.', 'spanish', 'python', '8-12', 3, '/assets/courses/spanish-python-stories.png'),
('French Fun with Blocks', 'Playful French vocabulary games built with blockly for early learners.', 'french', 'blockly', '4-7', 1, '/assets/courses/french-blockly-fun.png'),
('French Labs: Coding & Conversation', 'Develop conversation skills in French and build small projects in JavaScript.', 'french', 'javascript', '13-17', 4, '/assets/courses/french-js-labs.png'),
('German Basics for Kids', 'Beginner German language drills combined with block-based coding challenges.', 'german', 'blockly', '8-12', 2, '/assets/courses/german-blockly-basics.png'),
('Mandarin Starter Projects', 'Introductory Mandarin vocabulary and simple Python projects to reinforce learning.', 'mandarin', 'python', '8-12', 3, '/assets/courses/mandarin-python-starter.png'),
('Multilingual Explorer', 'Practice short lessons across English, Spanish, and French while building cross-language coding puzzles.', 'multilingual', 'blockly', '8-12', 2, '/assets/courses/multilingual-explorer.png'),
('Advanced Coding for Language Tutors', 'Build language learning apps, manage content, and deploy projects in JavaScript and Python.', 'english', 'javascript', '13-17', 5, '/assets/courses/advanced-coding-tutors.png'),
('Game-Based Language Learning', 'Design and code small games that teach vocabulary and grammar in multiple target languages.', 'english', 'python', '8-12', 4, '/assets/courses/game-language-learning.png');
-- Insert course dependencies examples
INSERT INTO courses (title, description, language_target, coding_language, age_group, difficulty_level, thumbnail_url) VALUES
('Amazing Animals', 'Learn basic block-based coding by making animals move and interact. Focuses on sequencing and basic loops.', 'english', 'blockly', '4-7', 1, 'https://example.com/thumbnails/amazing_animals.png'),
('Space Adventure', 'An introduction to intermediate coding concepts like conditionals and events, simulating a trip to space.', 'english', 'blockly', '8-12', 2, 'https://example.com/thumbnails/space_adventure.png'),
('Python Basics: Hello World', 'Your very first steps into text-based programming. Cover variables, print statements, and simple data types.', 'english', 'python', '13-18', 1, 'https://example.com/thumbnails/python_basics.png'),
('Junior Robot Builder', 'A fun course where younger learners use loops and functions to program a virtual robot to complete tasks.', 'spanish', 'blockly', '4-7', 2, 'https://example.com/thumbnails/robot_builder.png'),
('Advanced Python: Data Structures', 'Dive deep into lists, dictionaries, and tuples. Essential for any aspiring software developer.', 'english', 'python', '13-18', 3, 'https://example.com/thumbnails/data_structures.png'),
('Coding Games with Scratch', 'Create simple interactive games using Scratch-like block coding. Focuses on game logic and sprites.', 'french', 'blockly', '8-12', 3, 'https://example.com/thumbnails/scratch_games.png'),
('Math Explorers', 'Program simple arithmetic and logic puzzles. A perfect bridge between math and coding for older kids.', 'english', 'python', '8-12', 1, 'https://example.com/thumbnails/math_explorers.png');
INSERT INTO course_dependencies (course_id, required_course_id, required_achievement_type, min_score, dependency_type) VALUES
(2, 1, NULL, 80, 'course'), -- Course 2 requires Course 1 with 80% score
(3, 2, 'fast_learner', 0, 'achievement'), -- Course 3 requires Course 2 and 'fast_learner' achievement
(4, NULL, 'language_explorer', 0, 'achievement'); -- Course 4 requires 'language_explorer' achievement