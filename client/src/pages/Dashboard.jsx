import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Trophy, 
  Play, 
  Clock, 
  Star, 
  TrendingUp,
  BookOpen,
  Users,
  Sparkles,
  Award,
  Target,
  Zap,
  Bookmark,
  ChevronRight,
  Calendar,
  Heart,
  Rocket,
  GraduationCap,
  Languages,
  Code
} from 'lucide-react';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
    fetchCourses();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await axios.get('/api/progress');
      setDashboardData(res.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await axios.get('/api/courses');
      setCourses(res.data.courses || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Animated Header */}
          <div className="mb-8">
            <div className="h-10 bg-gray-200 rounded-2xl w-64 mb-4 animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded w-96 animate-pulse"></div>
          </div>

          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-3xl p-6 shadow-lg h-32 animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>

          {/* Content Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white rounded-3xl p-6 shadow-lg animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
                <div className="space-y-4">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-2xl"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { stats, recentProgress, achievements } = dashboardData || {};

  // Enhanced stat cards with progress indicators
  const statCards = [
    {
      title: 'Learning Adventures',
      value: stats?.completedLessons || 0,
      subtitle: 'Completed',
      icon: BookOpen,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50',
      progress: 75,
      emoji: '📚'
    },
    {
      title: 'Fire Streak',
      value: `${stats?.currentStreak || 0} days`,
      subtitle: 'Keep it going!',
      icon: TrendingUp,
      gradient: 'from-orange-500 to-red-500',
      bgGradient: 'from-orange-50 to-red-50',
      progress: 60,
      emoji: '🔥'
    },
    {
      title: 'Mastery Score',
      value: `${stats?.averageScore || 0}%`,
      subtitle: 'Great job!',
      icon: Star,
      gradient: 'from-yellow-500 to-amber-500',
      bgGradient: 'from-yellow-50 to-amber-50',
      progress: stats?.averageScore || 0,
      emoji: '⭐'
    },
    {
      title: 'Trophies Earned',
      value: stats?.achievementsCount || 0,
      subtitle: 'Achievements',
      icon: Trophy,
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-50 to-pink-50',
      progress: 40,
      emoji: '🏆'
    }
  ];

  // Mock motivational messages
  const motivationalMessages = [
    "You're on fire! Keep up the amazing work! 🔥",
    "Every lesson brings you closer to becoming a coding master! 🌟",
    "Your progress is incredible! The coding world is yours to explore! 🚀",
    "Learning new things every day - you're unstoppable! 💪"
  ];

  const getRandomMessage = () => {
    return motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-8 text-center lg:text-left">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            <h1 className="text-4xl lg:text-5xl font-bold mb-3">
              {getGreeting()}, Super Coder! 👋
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto lg:mx-0">
            {getRandomMessage()}
          </p>
        </div>

        {/* Quick Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div 
                key={index}
                className="group bg-white rounded-3xl p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-2xl bg-gradient-to-r ${stat.bgGradient}`}>
                    <Icon className="h-6 w-6 text-gray-700" />
                  </div>
                  <span className="text-2xl">{stat.emoji}</span>
                </div>
                
                <div className="mb-3">
                  <h3 className="text-2xl font-bold text-gray-800 mb-1">
                    {stat.value}
                  </h3>
                  <p className="text-gray-600 font-medium">{stat.title}</p>
                  <p className="text-sm text-gray-500 mt-1">{stat.subtitle}</p>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full bg-gradient-to-r ${stat.gradient} transition-all duration-1000 ease-out`}
                    style={{ width: `${stat.progress}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Recommended Courses & Quick Actions */}
          <div className="xl:col-span-2 space-y-8">
            {/* Recommended Courses */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Your Next Adventures</h2>
                    <p className="text-blue-100">Continue your learning journey</p>
                  </div>
                  <Rocket className="h-8 w-8 text-yellow-300" />
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {courses.slice(0, 4).map((course, index) => (
                    <div 
                      key={course.id}
                      className="group flex items-center space-x-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex-shrink-0 relative">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                          <BookOpen className="h-6 w-6 text-white" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {index + 1}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-800 text-lg group-hover:text-blue-600 transition-colors">
                          {course.title}
                        </h3>
                        <div className="flex items-center space-x-3 text-sm text-gray-600 mt-1">
                          <span className="flex items-center space-x-1">
                            <Languages className="h-4 w-4" />
                            <span className="capitalize">{course.language_target}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Code className="h-4 w-4" />
                            <span className="capitalize">{course.coding_language}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Target className="h-4 w-4" />
                            <span>{course.difficulty_level}/5</span>
                          </span>
                        </div>
                      </div>
                      
                      <Link
                        to={`/course/${course.id}`}
                        className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-5 py-3 rounded-xl font-bold transition-all duration-300 transform group-hover:scale-105 shadow-lg hover:shadow-xl"
                      >
                        <Play className="h-4 w-4" />
                        <span>Explore</span>
                      </Link>
                    </div>
                  ))}
                </div>

                {courses.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">No Adventures Yet!</h3>
                    <p className="text-gray-600 mb-6">Start your first coding adventure today.</p>
                    <Link
                      to="/courses"
                      className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      <Sparkles className="h-5 w-5" />
                      <span>Discover Adventures</span>
                    </Link>
                  </div>
                )}

                {courses.length > 4 && (
                  <div className="mt-6 text-center">
                    <Link
                      to="/courses"
                      className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                      <span>View All Adventures</span>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Progress */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Recent Adventures</h2>
                    <p className="text-green-100">Your latest learning milestones</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-yellow-300" />
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {(recentProgress || []).slice(0, 5).map((progress, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-200 hover:shadow-md transition-all duration-300 group"
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${
                          progress.completed ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
                        }`}></div>
                        <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                            {progress.lesson_title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {progress.course_title}
                          </p>
                          <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                            <span className="flex items-center space-x-1">
                              <Star className="h-3 w-3 text-yellow-500" />
                              <span>Score: {progress.score}%</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{progress.time_spent}s</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                        progress.completed 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {progress.completed ? 'Completed' : 'In Progress'}
                      </div>
                    </div>
                  ))}
                </div>

                {(!recentProgress || recentProgress.length === 0) && (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                      <Clock className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Start Your Journey!</h3>
                    <p className="text-gray-600 mb-6">Complete your first lesson to see your progress here.</p>
                    <Link
                      to="/courses"
                      className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      <Play className="h-5 w-5" />
                      <span>Start Learning</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Achievements & Quick Stats */}
          <div className="space-y-8">
            {/* Achievements */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-yellow-500 to-amber-500 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Your Trophies</h2>
                    <p className="text-yellow-100">Earned achievements</p>
                  </div>
                  <Trophy className="h-8 w-8 text-white" />
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {(achievements || []).slice(0, 4).map((achievement, index) => (
                    <div 
                      key={index}
                      className="flex items-center space-x-4 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl border border-yellow-200 group hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex-shrink-0 w-12 h-12 bg-yellow-400 rounded-2xl flex items-center justify-center shadow-lg">
                        <Trophy className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800 group-hover:text-yellow-700 transition-colors">
                          {achievement.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {achievement.description}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Calendar className="h-3 w-3 text-gray-500" />
                          <span className="text-xs text-gray-500">
                            Earned {achievement.earned_date || 'recently'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {(!achievements || achievements.length === 0) && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Award className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">No Trophies Yet</h3>
                    <p className="text-gray-600 text-sm">Complete lessons to earn achievements!</p>
                  </div>
                )}

                {(achievements && achievements.length > 0) && (
                  <div className="mt-6 text-center">
                    <button className="inline-flex items-center space-x-2 text-yellow-600 hover:text-yellow-700 font-medium transition-colors">
                      <span>View All Trophies</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats & Motivation */}
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl shadow-2xl text-white p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-8 w-8 text-yellow-300" />
                </div>
                <h3 className="text-xl font-bold mb-2">Daily Goal</h3>
                <p className="text-purple-100">Complete 3 lessons today</p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Today's Progress</span>
                  <span className="font-bold">1/3</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-3">
                  <div 
                    className="bg-yellow-400 h-3 rounded-full transition-all duration-1000"
                    style={{ width: '33%' }}
                  ></div>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span>Weekly Streak</span>
                  <span className="font-bold">5 days 🔥</span>
                </div>
              </div>

              <button className="w-full mt-6 bg-white text-purple-600 hover:bg-gray-100 py-3 rounded-xl font-bold transition-colors shadow-lg">
                Continue Learning
              </button>
            </div>

            {/* Fun Fact */}
            <div className="bg-gradient-to-br from-cyan-500 to-blue-500 rounded-3xl shadow-2xl text-white p-6">
              <div className="text-center">
                <div className="text-4xl mb-3">🤖</div>
                <h3 className="text-lg font-bold mb-2">Did You Know?</h3>
                <p className="text-cyan-100 text-sm">
                  The first computer programmer was Ada Lovelace in the 1840s! She wrote the first algorithm for a machine.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;