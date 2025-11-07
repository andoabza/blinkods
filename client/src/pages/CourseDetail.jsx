import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, 
  BookOpen, 
  Lock, 
  CheckCircle, 
  Star, 
  Clock,
  Users,
  Award,
  Play,
  BarChart3,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Home,
  Trophy,
  Target,
  Languages,
  Code,
  Calendar
} from 'lucide-react';

const CourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [courseData, setCourseData] = useState(null);
  const [lessonData, setLessonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    fetchCourseDetails();
  }, [courseId, retryCount]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const [courseRes, lessonRes] = await Promise.all([
        axios.get(`/api/courses/${courseId}`),
        axios.get(`/api/lessons/${courseId}`)
      ]);

      setCourseData(courseRes.data);
      setLessonData(lessonRes.data);
      
    } catch (error) {
      console.error('Error fetching course details:', error);
      setError({
        message: error.response?.data?.message || 'Failed to load course details',
        type: error.response?.status === 404 ? 'not_found' : 'server_error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setError(null);
  };

  const startCourse = () => {
    if (lessonData?.lesson?.is_accessible) {
      navigate(`/lesson/${lessonData.lesson.id}`);
    }
  };

  const getDifficultyStars = (level) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-5 w-5 ${
          i < level ? 'text-yellow-500 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const getAgeGroupIcon = (ageGroup) => {
    const age = ageGroup?.split('-')[0];
    if (age <= 3) return '👶';
    if (age <= 6) return '🧒';
    if (age <= 9) return '👦';
    if (age <= 12) return '👧';
    return '👨‍🎓';
  };

  const formatDuration = (seconds) => {
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} min`;
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 90) return 'from-green-500 to-emerald-500';
    if (percentage >= 70) return 'from-blue-500 to-cyan-500';
    if (percentage >= 50) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Animated Header */}
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>

          {/* Main Content Skeleton */}
          <div className="space-y-6">
            {/* Course Header Skeleton */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                        <div className="h-4 bg-gray-200 rounded w-12"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Lessons Skeleton */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6">
                <div className="h-6 bg-white/30 rounded w-48 animate-pulse"></div>
              </div>
              <div className="divide-y divide-gray-100">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-6 animate-pulse">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-5 bg-gray-200 rounded w-64"></div>
                        <div className="h-3 bg-gray-200 rounded w-48"></div>
                      </div>
                      <div className="w-20 h-8 bg-gray-200 rounded-lg"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-10 w-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {error.type === 'not_found' ? 'Course Not Found' : 'Oops! Something went wrong'}
            </h2>
            <p className="text-gray-600 mb-6">
              {error.type === 'not_found' 
                ? "The course you're looking for doesn't exist or has been moved."
                : error.message
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleRetry}
                className="flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Try Again</span>
              </button>
              <Link
                to="/courses"
                className="flex items-center justify-center space-x-2 border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-xl font-medium transition-colors"
              >
                <Home className="h-4 w-4" />
                <span>Back to Courses</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const course = courseData?.course;
  const lesson = lessonData?.lesson;
  const navigation = lessonData?.navigation;
  const userProgress = lessonData?.user_progress;

  if (!course) {
    return null;
  }

  const isLocked = !lesson?.is_accessible;
  const completionPercentage = course.completion_percentage || 0;
  const totalLessons = navigation?.total || 0;
  const completedLessons = navigation?.completed || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/courses"
            className="group flex items-center space-x-3 bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600 group-hover:text-gray-800 transition-colors" />
            <span className="font-medium text-gray-700 group-hover:text-gray-900">Back to Courses</span>
          </Link>
          
          {userProgress?.is_completed && (
            <div className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full shadow-lg">
              <Trophy className="h-4 w-4" />
              <span className="text-sm font-medium">Course Mastered!</span>
            </div>
          )}
        </div>

        {/* Course Header */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden mb-8">
          {/* Header Background */}
          <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-8 text-white">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-4">
                  {isLocked ? (
                    <Lock className="h-7 w-7 text-yellow-300" />
                  ) : completionPercentage === 100 ? (
                    <CheckCircle className="h-7 w-7 text-green-300" />
                  ) : (
                    <BookOpen className="h-7 w-7 text-white/90" />
                  )}
                  <h1 className="text-4xl font-bold drop-shadow-lg">{course.title}</h1>
                </div>
                
                <p className="text-xl text-white/90 mb-6 leading-relaxed">{course.description}</p>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-white/90 mb-3">
                    <span className="font-medium">Your Learning Journey</span>
                    <span className="font-bold">{completionPercentage}% Complete</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-4 shadow-inner">
                    <div 
                      className={`bg-gradient-to-r ${getProgressColor(completionPercentage)} h-4 rounded-full transition-all duration-1000 ease-out shadow-lg`}
                      style={{ width: `${completionPercentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-white/80 text-sm mt-2">
                    <span>{completedLessons} of {totalLessons} adventures completed</span>
                    <span>{totalLessons - completedLessons} exciting adventures await!</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Course Metadata */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">{getAgeGroupIcon(course.age_group)}</span>
                </div>
                <div>
                  <p className="text-sm text-blue-600 font-medium">Perfect For</p>
                  <p className="font-bold text-gray-800">{course.age_group} year olds</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-purple-50 rounded-2xl border border-purple-100">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Languages className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-purple-600 font-medium">Language</p>
                  <p className="font-bold text-gray-800 capitalize">{course.language_target}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-2xl border border-green-100">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Code className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-green-600 font-medium">Coding</p>
                  <p className="font-bold text-gray-800 capitalize">{course.coding_language}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Target className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-amber-600 font-medium">Challenge Level</p>
                  <div className="flex items-center space-x-1">
                    {getDifficultyStars(course.difficulty_level)}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={startCourse}
                disabled={isLocked}
                className={`
                  group flex items-center justify-center space-x-3 px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform
                  ${isLocked
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : completionPercentage === 100
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-2xl hover:shadow-3xl hover:scale-105'
                      : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-2xl hover:shadow-3xl hover:scale-105'
                  }
                `}
              >
                <Play className="h-5 w-5" />
                <span>
                  {isLocked ? '🔒 Adventure Locked' : 
                   completionPercentage === 100 ? '🎉 Play Again' :
                   completionPercentage > 0 ? '🚀 Continue Journey' : '🌟 Start Adventure'}
                </span>
              </button>

              <button className="group flex items-center justify-center space-x-3 px-8 py-4 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 rounded-2xl font-bold text-lg transition-all duration-300">
                <BarChart3 className="h-5 w-5" />
                <span>View Progress</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dependencies Warning */}
        {isLocked && lesson?.dependencies && !lesson.dependencies.all_met && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-8 mb-8 shadow-lg">
            <h3 className="text-2xl font-bold text-amber-800 mb-4 flex items-center">
              <Lock className="h-6 w-6 mr-3" />
              Adventure Requirements
            </h3>
            <p className="text-amber-700 text-lg mb-6">
              Complete these exciting quests to unlock this adventure:
            </p>
            <div className="space-y-4">
              {lesson.dependencies.unmet_dependencies.map((dep, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 bg-white/50 rounded-2xl border border-amber-100">
                  <div className="w-3 h-3 bg-amber-500 rounded-full flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="font-semibold text-amber-800">
                      {dep.dependency_type === 'course' 
                        ? `Complete "${dep.required_course_title}"`
                        : `Earn "${dep.required_achievement_title}"`
                      }
                    </p>
                    {dep.min_score && (
                      <p className="text-amber-600 text-sm">Score at least {dep.min_score}%</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lessons List */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Learning Adventures</h2>
                <p className="text-blue-100 text-lg">
                  {completedLessons} of {totalLessons} amazing adventures completed
                </p>
              </div>
              {completionPercentage === 100 && (
                <div className="flex items-center space-x-3 bg-white/20 backdrop-blur-sm px-4 py-3 rounded-2xl mt-4 sm:mt-0">
                  <Sparkles className="h-5 w-5 text-yellow-300" />
                  <span className="text-white font-bold text-lg">All Adventures Complete! 🎊</span>
                </div>
              )}
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {lesson ? (
              <div key={lesson.id} className="p-8 hover:bg-blue-50/50 transition-all duration-300 group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6 flex-1">
                    <div className={`
                      w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold shadow-lg transition-all duration-300
                      ${lesson.is_completed
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white group-hover:scale-110'
                        : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white group-hover:scale-110'
                      }
                    `}>
                      {lesson.is_completed ? '🎉' : '🌟'}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">{lesson.title}</h3>
                      <p className="text-gray-600 text-lg mb-4">{lesson.description}</p>
                      <div className="flex items-center space-x-6 text-gray-500">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-5 w-5" />
                          <span className="font-medium">{formatDuration(lesson.estimated_duration)}</span>
                        </div>
                        {lesson.user_score !== null && (
                          <div className="flex items-center space-x-2">
                            <Star className="h-5 w-5 text-yellow-500" />
                            <span className="font-medium">Score: {lesson.user_score}%</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-5 w-5" />
                          <span className="font-medium">Lesson {navigation?.currentPosition}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {lesson.is_completed && (
                      <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-4 py-2 rounded-xl">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-bold">Completed!</span>
                      </div>
                    )}
                    <Link
                      to={`/lesson/${lesson.id}`}
                      className={`
                        group flex items-center space-x-3 px-6 py-3 rounded-xl font-bold text-lg transition-all duration-300 transform
                        ${lesson.is_completed
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl hover:scale-105'
                          : isLocked
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-105'
                        }
                      `}
                      onClick={(e) => {
                        if (isLocked) e.preventDefault();
                      }}
                    >
                      <Play className="h-5 w-5" />
                      <span>{lesson.is_completed ? 'Play Again' : 'Start Adventure'}</span>
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">Adventures Coming Soon!</h3>
                <p className="text-gray-600 text-lg max-w-md mx-auto">
                  Our team is creating amazing learning adventures for this course. Check back soon!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-800">{completedLessons}</div>
            <div className="text-gray-600">Adventures Completed</div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Trophy className="h-6 w-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-800">{completionPercentage}%</div>
            <div className="text-gray-600">Course Progress</div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Star className="h-6 w-6 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-800">
              {userProgress?.score ? `${userProgress.score}%` : '--'}
            </div>
            <div className="text-gray-600">Average Score</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;