import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import BlocklyWorkspace from '../components/BlocklyWorkspace';
import { useSocket } from '../contexts/SocketContext';
import {
  Play,
  CheckCircle,
  Volume2,
  HelpCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Code2,
  Languages,
  Lock,
  Trophy,
  Clock,
  BarChart3,
  X,
  Sparkles,
  Target
} from 'lucide-react';

const Lesson = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();
  const [lessonData, setLessonData] = useState(null);
  const [currentCode, setCurrentCode] = useState('');
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState('instructions');
  const [showDependencyModal, setShowDependencyModal] = useState(false);
  const [collaborators, setCollaborators] = useState([]);

  useEffect(() => {
    fetchLessonData();
    
    if (socket.socket) {
      socket.socket.emit('join-lesson', lessonId);
      
      socket.on('user-joined', (user) => {
        setCollaborators(prev => [...prev, user]);
      });

      socket.on('user-left', (userId) => {
        setCollaborators(prev => prev.filter(u => u.id !== userId));
      });
    }

    return () => {
      if (socket.socket) {
        socket.socket.emit('leave-lesson', lessonId);
      }
    };
  }, [lessonId, socket]);

  const fetchLessonData = async () => {
    try {
      const res = await axios.get(`/api/lessons/${lessonId}`);
      setLessonData(res.data);
      
      // Set initial code from user's previous submission or lesson template
      if (res.data.user_progress?.user_code) {
        setCurrentCode(res.data.user_progress.user_code);
      } else if (res.data.lesson?.coding_challenge) {
        setCurrentCode(res.data.lesson.coding_challenge);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching lesson data:', error);
      setIsLoading(false);
    }
  };

  const handleCodeChange = (code) => {
    setCurrentCode(code);
    if (socket.socket) {
      socket.emit('code-change', { lessonId, code, userId: socket.socket.id });
    }
  };

  const runCode = async () => {
    setIsRunning(true);
    try {
      const res = await axios.post('/api/ai/run-code', {
        code: currentCode,
        language: lessonData?.lesson?.coding_language || 'python',
        lessonId
      });
      setOutput(res.data.output || 'Code executed successfully!');
    } catch (error) {
      setOutput('Error running code: ' + (error.response?.data?.error || 'Unknown error'));
    } finally {
      setIsRunning(false);
    }
  };

  const submitLesson = async () => {
    try {
      // Check if lesson is accessible
      if (!lessonData.lesson.is_accessible && !lessonData.user_progress.is_completed) {
        setShowDependencyModal(true);
        return;
      }

      const res = await axios.post(`/api/lessons/${lessonId}/submit`, {
        code: currentCode,
        timeSpent: 300 // 5 minutes in seconds
      });

      if (res.data.new_achievements && res.data.new_achievements.length > 0) {
        // Show achievement celebration
        showAchievementCelebration(res.data.new_achievements);
      }

      if (res.data.course_completed) {
        showCourseCompletionCelebration();
      } else if (res.data.next_lesson) {
        // Auto-navigate to next lesson
        showNextLessonPrompt(res.data.next_lesson);
      } else {
        showLessonCompletion();
        // Refresh lesson data to show completion status
        fetchLessonData();
      }
    } catch (error) {
      if (error.response?.status === 403) {
        setShowDependencyModal(true);
      } else {
        console.error('Error submitting lesson:', error);
        alert('Error submitting lesson. Please try again.');
      }
    }
  };

  const showAchievementCelebration = (achievements) => {
    const achievementNames = achievements.map(a => a.title).join(', ');
    alert(`🎉 Amazing! You earned new achievements: ${achievementNames}`);
  };

  const showCourseCompletionCelebration = () => {
    alert('🎊 Congratulations! You completed the entire course! You are a coding superstar! 🌟');
    navigate('/');
  };

  const showNextLessonPrompt = (nextLesson) => {
    if (window.confirm(`🎉 Lesson completed! Great job!\n\nReady to move to the next lesson: "${nextLesson.title}"?`)) {
      navigate(`/lesson/${nextLesson.id}`);
    }
  };

  const showLessonCompletion = () => {
    alert('🎉 Lesson completed! Great job! Check your achievements and progress!');
  };

  const playAudio = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getLanguageCode(lessonData?.lesson?.language_target);
    speechSynthesis.speak(utterance);
  };

  const getLanguageCode = (language) => {
    const languageCodes = {
      'english': 'en-US',
      'spanish': 'es-ES',
      'french': 'fr-FR',
      'german': 'de-DE',
      'mandarin': 'zh-CN'
    };
    return languageCodes[language] || 'en-US';
  };

  const requestHelp = () => {
    if (socket.socket) {
      socket.emit('request-help', {
        lessonId,
        question: 'I need help with this lesson'
      });
    }
    alert('🆘 Help request sent to your teacher/parent! They will contact you soon.');
  };

  const navigateToLesson = (lesson) => {
    if (lesson && lesson.is_accessible) {
      navigate(`/lesson/${lesson.id}`);
    } else if (lesson) {
      alert('This lesson is locked. Complete the previous lessons to unlock it!');
    }
  };

  const getEstimatedTime = () => {
    if (!lessonData?.lesson?.estimated_duration) return '15 min';
    const minutes = Math.ceil(lessonData.lesson.estimated_duration / 60);
    return `${minutes} min`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (!lessonData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Lesson Not Found</h2>
          <p className="text-gray-600 mb-6">The lesson you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { lesson, navigation, user_progress } = lessonData;
  const isLessonAccessible = lesson.is_accessible || user_progress.is_completed;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(`/course/${lesson.course_id}`)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Course</span>
              </button>
              
              <div className="h-6 w-px bg-gray-300"></div>
              
              <div>
                <h1 className="text-xl font-bold text-gray-800">{lesson.title}</h1>
                <p className="text-sm text-gray-600">{lesson.course_title}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Progress Indicator */}
              <div className="text-sm text-gray-600">
                Lesson {navigation.currentPosition} of {navigation.total}
              </div>

              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Languages className="h-4 w-4" />
                <span className="capitalize">{lesson.language_target}</span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Code2 className="h-4 w-4" />
                <span className="capitalize">{lesson.coding_language}</span>
              </div>

              {user_progress.is_completed && (
                <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-3 py-1 rounded-full">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Completed</span>
                </div>
              )}

              {!isLessonAccessible && (
                <div className="flex items-center space-x-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
                  <Lock className="h-4 w-4" />
                  <span className="text-sm font-medium">Locked</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between mb-6 p-4 bg-white rounded-2xl shadow-lg border border-gray-200">
          <button
            onClick={() => navigateToLesson(navigation.previous)}
            disabled={!navigation.previous}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>

          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-sm text-gray-600">Progress</div>
              <div className="font-semibold text-gray-800">
                {navigation.completed}/{navigation.total} lessons
              </div>
            </div>
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(navigation.completed / navigation.total) * 100}%` }}
              ></div>
            </div>
          </div>

          <button
            onClick={() => navigateToLesson(navigation.next)}
            disabled={!navigation.next}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed bg-blue-500 hover:bg-blue-600 text-white transition-colors"
          >
            <span>Next</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Left Panel - Instructions & Dependencies */}
          <div className="xl:col-span-1 flex flex-col space-y-6">
            {/* Dependency Warning */}
            {!isLessonAccessible && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <Lock className="h-6 w-6 text-yellow-600" />
                  <h3 className="text-lg font-semibold text-yellow-800">Lesson Locked</h3>
                </div>
                <p className="text-yellow-700 mb-4">
                  Complete the requirements below to unlock this lesson:
                </p>
                <ul className="space-y-2">
                  {lesson.dependencies.unmet_dependencies.map((dep, index) => (
                    <li key={index} className="flex items-start space-x-3 text-yellow-700">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <span className="font-medium">
                          {dep.dependency_type === 'lesson' 
                            ? `Complete: "${dep.required_lesson_title}"`
                            : `Earn: "${dep.required_achievement_title}"`
                          }
                        </span>
                        {dep.dependency_type === 'lesson' && (
                          <div className="text-sm text-yellow-600">
                            Minimum score: {dep.min_score}% (Your score: {dep.current_value}%)
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setShowDependencyModal(true)}
                  className="w-full mt-4 bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  View Detailed Requirements
                </button>
              </div>
            )}

            {/* Instructions Tab */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 flex-1">
              <div className="flex space-x-2 mb-4">
                <button
                  onClick={() => setActiveTab('instructions')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'instructions'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Instructions
                </button>
                <button
                  onClick={() => setActiveTab('vocabulary')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'vocabulary'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Vocabulary
                </button>
              </div>

              {activeTab === 'instructions' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-800 flex items-center">
                      <BookOpen className="h-5 w-5 mr-2" />
                      What you'll learn:
                    </h3>
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span>{getEstimatedTime()}</span>
                    </div>
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 mb-4">{lesson.description}</p>
                    
                    {lesson.instructions && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-800 mb-2">Your Task:</h4>
                        <p className="text-blue-700">{lesson.instructions.en}</p>
                        {lesson.instructions[lesson.language_target] && (
                          <>
                            <div className="h-px bg-blue-200 my-3"></div>
                            <h4 className="font-medium text-blue-800 mb-2">In {lesson.language_target}:</h4>
                            <p className="text-blue-700">{lesson.instructions[lesson.language_target]}</p>
                            <button
                              onClick={() => playAudio(lesson.instructions[lesson.language_target])}
                              className="mt-2 flex items-center space-x-1 text-blue-600 hover:text-blue-700 transition-colors"
                            >
                              <Volume2 className="h-4 w-4" />
                              <span className="text-sm">Listen</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'vocabulary' && lesson.vocabulary && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Vocabulary Words</h3>
                  <div className="space-y-3">
                    {lesson.vocabulary.words?.map((word, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{word.word}</p>
                          <p className="text-sm text-gray-600">{word.translation}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => playAudio(word.word)}
                            className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                            title="Listen to pronunciation"
                          >
                            <Volume2 className="h-4 w-4" />
                          </button>
                          {word.audio_url && (
                            <button
                              onClick={() => new Audio(word.audio_url).play()}
                              className="p-2 text-gray-500 hover:text-green-600 transition-colors"
                              title="Play audio"
                            >
                              <Play className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Help Button */}
            <button
              onClick={requestHelp}
              className="flex items-center justify-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-2xl shadow-lg transition-colors"
            >
              <HelpCircle className="h-5 w-5" />
              <span className="font-medium">Need Help?</span>
            </button>

            {/* Collaborators */}
            {collaborators.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4">
                <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                  <Sparkles className="h-4 w-4 mr-2 text-purple-500" />
                  Learning Together
                </h4>
                <div className="space-y-2">
                  {collaborators.map((user, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-700">{user.username}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Middle Panel - Coding Workspace */}
          <div className="xl:col-span-2 flex flex-col">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Coding Workspace</h3>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Auto-save enabled</span>
                </div>
              </div>

              <div className="flex-1 min-h-0 mb-4 border border-gray-200 rounded-lg overflow-hidden">
                <BlocklyWorkspace 
                  initialXml={lesson.coding_challenge}
                  onCodeChange={handleCodeChange}
                  language={lesson.coding_language}
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={runCode}
                  disabled={isRunning || !isLessonAccessible}
                  className="flex-1 flex items-center justify-center space-x-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white py-3 px-4 rounded-xl font-medium transition-colors"
                >
                  <Play className="h-5 w-5" />
                  <span>{isRunning ? 'Running...' : 'Run Code'}</span>
                </button>
                
                <button
                  onClick={submitLesson}
                  disabled={!isLessonAccessible}
                  className="flex-1 flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white py-3 px-4 rounded-xl font-medium transition-colors"
                >
                  <CheckCircle className="h-5 w-5" />
                  <span>Submit Lesson</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - Output */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 h-full flex flex-col">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center justify-between">
                <span>Output</span>
                {user_progress.score && (
                  <span className="text-sm font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    Score: {user_progress.score}%
                  </span>
                )}
              </h3>
              
              <div className="bg-gray-900 rounded-lg p-4 flex-1 font-mono text-sm text-green-400 overflow-y-auto">
                {output ? (
                  <pre className="whitespace-pre-wrap">{output}</pre>
                ) : (
                  <div className="text-gray-500 italic h-full flex items-center justify-center">
                    Run your code to see the output here...
                  </div>
                )}
              </div>

              {/* User Progress */}
              {user_progress.is_completed && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2 text-green-800">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Lesson Completed!</span>
                  </div>
                  <div className="text-sm text-green-700 mt-1">
                    Great job! You scored {user_progress.score}% on this lesson.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dependency Modal */}
      {showDependencyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Lock className="h-6 w-6 text-yellow-500" />
                  <h2 className="text-xl font-bold text-gray-800">Lesson Requirements</h2>
                </div>
                <button
                  onClick={() => setShowDependencyModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-gray-600">
                  To unlock <span className="font-semibold">"{lesson.title}"</span>, you need to complete the following requirements:
                </p>

                {lesson.dependencies.unmet_dependencies.map((dep, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Target className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 mb-2">
                          {dep.dependency_type === 'lesson' 
                            ? `Complete: "${dep.required_lesson_title}"`
                            : `Earn: "${dep.required_achievement_title}"`
                          }
                        </h3>
                        
                        {dep.dependency_type === 'lesson' ? (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Minimum Score Required:</span>
                              <span className="font-medium">{dep.min_score}%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Your Current Score:</span>
                              <span className={`font-medium ${
                                parseInt(dep.current_value) >= dep.min_score ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {dep.current_value}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-500 ${
                                  parseInt(dep.current_value) >= dep.min_score ? 'bg-green-500' : 'bg-yellow-500'
                                }`}
                                style={{ width: `${Math.min(100, dep.current_value)}%` }}
                              ></div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-600">
                            This achievement will be automatically awarded when you meet the criteria.
                          </div>
                        )}

                        {dep.dependency_type === 'lesson' && (
                          <button
                            onClick={() => {
                              setShowDependencyModal(false);
                              // Navigate to the required lesson
                              navigate(`/lesson/${dep.required_lesson_id}`);
                            }}
                            className="w-full mt-3 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors text-sm"
                          >
                            Go to Required Lesson
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-blue-800">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-sm font-medium">Tip</span>
                  </div>
                  <p className="text-blue-700 text-sm mt-1">
                    Complete the requirements above to unlock this lesson and continue your learning journey!
                  </p>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowDependencyModal(false)}
                    className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setShowDependencyModal(false);
                      navigate(`/course/${lesson.course_id}`);
                    }}
                    className="flex-1 py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    View Course
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Lesson;