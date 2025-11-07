import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Search, 
  Filter, 
  BookOpen, 
  Star, 
  Clock, 
  Users,
  Award,
  Play,
  ChevronRight,
  Sparkles,
  Target,
  TrendingUp,
  Bookmark,
  BookmarkCheck,
  GraduationCap,
  Languages,
  Code,
  Calendar,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    difficulty: 'all',
    language: 'all',
    status: 'all',
    ageGroup: 'all'
  });
  const [sortBy, setSortBy] = useState('progress');
  const [bookmarkedCourses, setBookmarkedCourses] = useState(new Set());

  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
    // Load bookmarks from localStorage
    const savedBookmarks = JSON.parse(localStorage.getItem('bookmarkedCourses') || '[]');
    setBookmarkedCourses(new Set(savedBookmarks));
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/courses');
      setCourses(response.data.courses || []);
      setFilteredCourses(response.data.courses || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setError({
        message: error.response?.data?.message || 'Failed to load courses',
        type: 'server_error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    filterAndSortCourses();
  }, [courses, searchTerm, filters, sortBy]);

  const filterAndSortCourses = () => {
    let filtered = courses.filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           course.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDifficulty = filters.difficulty === 'all' || 
                               course.difficulty_level === parseInt(filters.difficulty);
      
      const matchesLanguage = filters.language === 'all' || 
                             course.language_target === filters.language;
      
      const matchesStatus = filters.status === 'all' ||
                           (filters.status === 'completed' && course.completion_percentage === 100) ||
                           (filters.status === 'in-progress' && course.completion_percentage > 0 && course.completion_percentage < 100) ||
                           (filters.status === 'not-started' && course.completion_percentage === 0);
      
      const matchesAgeGroup = filters.ageGroup === 'all' || 
                             course.age_group === filters.ageGroup;

      return matchesSearch && matchesDifficulty && matchesLanguage && matchesStatus && matchesAgeGroup;
    });

    // Sort courses
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'progress':
          return b.completion_percentage - a.completion_percentage;
        case 'difficulty':
          return a.difficulty_level - b.difficulty_level;
        case 'title':
          return a.title.localeCompare(b.title);
        case 'recent':
          return new Date(b.last_activity || b.created_at) - new Date(a.last_activity || a.created_at);
        default:
          return 0;
      }
    });

    setFilteredCourses(filtered);
  };

  const toggleBookmark = (courseId) => {
    const newBookmarks = new Set(bookmarkedCourses);
    if (newBookmarks.has(courseId)) {
      newBookmarks.delete(courseId);
    } else {
      newBookmarks.add(courseId);
    }
    setBookmarkedCourses(newBookmarks);
    localStorage.setItem('bookmarkedCourses', JSON.stringify([...newBookmarks]));
  };

  const getDifficultyStars = (level) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${i < level ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 90) return 'from-green-500 to-emerald-500';
    if (percentage >= 70) return 'from-blue-500 to-cyan-500';
    if (percentage >= 50) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  const getAgeGroupIcon = (ageGroup) => {
    const age = ageGroup?.split('-')[0];
    if (age <= 3) return '👶';
    if (age <= 6) return '🧒';
    if (age <= 9) return '👦';
    if (age <= 12) return '👧';
    return '👨‍🎓';
  };

  const getStatusBadge = (course) => {
    if (course.completion_percentage === 100) {
      return (
        <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
          <Sparkles className="h-3 w-3" />
          <span>Completed</span>
        </div>
      );
    } else if (course.completion_percentage > 0) {
      return (
        <div className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
          <TrendingUp className="h-3 w-3" />
          <span>In Progress</span>
        </div>
      );
    }
    return null;
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded w-64 mb-4 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mb-8 animate-pulse"></div>
          </div>

          {/* Filters Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded-2xl animate-pulse"></div>
            ))}
          </div>

          {/* Course Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-6"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-4/5"></div>
              </div>
            ))}
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
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops! Something went wrong</h2>
            <p className="text-gray-600 mb-6">{error.message}</p>
            <button
              onClick={fetchCourses}
              className="flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-colors mx-auto"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Try Again</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Learning Adventures
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover amazing coding adventures that make learning fun! Start your journey today.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-800">{courses.length}</div>
            <div className="text-gray-600">Total Adventures</div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Award className="h-6 w-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-800">
              {courses.filter(c => c.completion_percentage === 100).length}
            </div>
            <div className="text-gray-600">Completed</div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Target className="h-6 w-6 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-800">
              {courses.filter(c => c.completion_percentage > 0 && c.completion_percentage < 100).length}
            </div>
            <div className="text-gray-600">In Progress</div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Bookmark className="h-6 w-6 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-gray-800">{bookmarkedCourses.size}</div>
            <div className="text-gray-600">Bookmarked</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search adventures..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Filters */}
            <select
              value={filters.difficulty}
              onChange={(e) => setFilters({...filters, difficulty: e.target.value})}
              className="px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Difficulties</option>
              <option value="1">🌟 Beginner</option>
              <option value="2">🌟🌟 Easy</option>
              <option value="3">🌟🌟🌟 Intermediate</option>
              <option value="4">🌟🌟🌟🌟 Advanced</option>
              <option value="5">🌟🌟🌟🌟🌟 Expert</option>
            </select>

            <select
              value={filters.language}
              onChange={(e) => setFilters({...filters, language: e.target.value})}
              className="px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Languages</option>
              <option value="english">English</option>
              <option value="spanish">Spanish</option>
              <option value="french">French</option>
              <option value="german">German</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="not-started">Not Started</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="progress">Sort by Progress</option>
              <option value="difficulty">Sort by Difficulty</option>
              <option value="title">Sort by Name</option>
              <option value="recent">Sort by Recent</option>
            </select>
          </div>
        </div>

        {/* Courses Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {filteredCourses.length} Adventures Found
            </h2>
            <div className="text-gray-600">
              Showing {filteredCourses.length} of {courses.length} adventures
            </div>
          </div>

          {filteredCourses.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-12 text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Search className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">No Adventures Found</h3>
              <p className="text-gray-600 text-lg mb-6">
                Try adjusting your search or filters to find more learning adventures.
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilters({ difficulty: 'all', language: 'all', status: 'all', ageGroup: 'all' });
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 group"
                >
                  {/* Course Header */}
                  <div className="relative">
                    <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2">
                              {course.title}
                            </h3>
                            <button
                              onClick={() => toggleBookmark(course.id)}
                              className="flex-shrink-0 text-gray-400 hover:text-yellow-500 transition-colors"
                            >
                              {bookmarkedCourses.has(course.id) ? (
                                <BookmarkCheck className="h-5 w-5 text-yellow-500 fill-current" />
                              ) : (
                                <Bookmark className="h-5 w-5" />
                              )}
                            </button>
                          </div>
                          {getStatusBadge(course)}
                        </div>
                      </div>

                      <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                        {course.description}
                      </p>
                    </div>
                  </div>

                  {/* Course Metadata */}
                  <div className="px-6 pb-4">
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getAgeGroupIcon(course.age_group)}</span>
                        <span>{course.age_group}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Languages className="h-4 w-4" />
                        <span className="capitalize">{course.language_target}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Code className="h-4 w-4" />
                        <span className="capitalize">{course.coding_language}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {getDifficultyStars(course.difficulty_level)}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Your Progress</span>
                        <span className="font-semibold">{course.completion_percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full bg-gradient-to-r ${getProgressColor(course.completion_percentage)} transition-all duration-1000`}
                          style={{ width: `${course.completion_percentage}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                      <Link
                        to={`/course/${course.id}`}
                        className="flex-1 flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-xl font-medium transition-colors group"
                      >
                        <Play className="h-4 w-4" />
                        <span>
                          {course.completion_percentage === 100 ? 'Review' :
                           course.completion_percentage > 0 ? 'Continue' : 'Start'}
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Featured Courses Section */}
        {courses.filter(c => c.featured).length > 0 && (
          <div className="mb-12">
            <div className="flex items-center space-x-3 mb-6">
              <Sparkles className="h-6 w-6 text-yellow-500" />
              <h2 className="text-2xl font-bold text-gray-800">Featured Adventures</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {courses.filter(c => c.featured).slice(0, 2).map((course) => (
                <div
                  key={course.id}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl shadow-2xl text-white overflow-hidden"
                >
                  <div className="p-8">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold mb-2">{course.title}</h3>
                        <p className="text-purple-100 text-lg mb-4">{course.description}</p>
                      </div>
                      <Sparkles className="h-6 w-6 text-yellow-300 flex-shrink-0 ml-4" />
                    </div>
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{getAgeGroupIcon(course.age_group)}</span>
                        <span>{course.age_group}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {getDifficultyStars(course.difficulty_level)}
                      </div>
                    </div>
                    <Link
                      to={`/course/${course.id}`}
                      className="inline-flex items-center space-x-2 bg-white text-purple-600 hover:bg-gray-100 px-6 py-3 rounded-xl font-bold transition-colors"
                    >
                      <Play className="h-4 w-4" />
                      <span>Start Adventure</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl shadow-2xl text-white p-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Coding Journey?</h2>
          <p className="text-blue-100 text-xl mb-6 max-w-2xl mx-auto">
            Join thousands of young learners discovering the magic of coding through fun, interactive adventures.
          </p>
          <button
            onClick={() => navigate('/course/1')} // Navigate to first course or recommended course
            className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-2xl font-bold text-lg transition-colors inline-flex items-center space-x-3"
          >
            <GraduationCap className="h-6 w-6" />
            <span>Start Learning Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Courses;