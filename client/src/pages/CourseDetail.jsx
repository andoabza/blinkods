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
  BarChart3
} from 'lucide-react';

const CourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [dependencies, setDependencies] = useState(null);
  const [userProgress, setUserProgress] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourseDetails();
  }, [courseId]);

  const fetchCourseDetails = async () => {
    try {
      const courseRes = await axios.get(`/api/courses/${courseId}`);

       const progressRes = axios.get(`/api/progress/${courseId}`);

      
      setCourse(courseRes.data.course);
      setUserProgress(progressRes.data.progress);
      
      // Check dependencies
      setDependencies(courseRes.data.dependencies);
    } catch (error) {
      console.error('Error fetching course details:', error);
    } finally {
      setLoading(false);
    }
  };

  const startCourse = () => {
    if (course.lessons && course.lessons.length > 0) {
      const firstLesson = course.lessons.find(lesson => !lesson.is_completed) || course.lessons[0];
      navigate(`/lesson/${firstLesson.id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Course Not Found</h2>
          <Link to="/" className="text-blue-500 hover:text-blue-600">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const completionPercentage = course.lessons.length > 0 
    ? Math.round((course.lessons.filter(l => l.is_completed).length / course.lessons.length) * 100)
    : 0;

  const isLocked = dependencies && !dependencies.all_met;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <Link
            to="/"
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Courses</span>
          </Link>
        </div>

        {/* Course Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-4">
                {isLocked && (
                  <Lock className="h-6 w-6 text-yellow-500" />
                )}
                {completionPercentage === 100 && (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                )}
                <h1 className="text-3xl font-bold text-gray-800">{course.title}</h1>
              </div>
              
              <p className="text-gray-600 text-lg mb-6">{course.description}</p>

              {/* Course Metadata */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Age Group</p>
                    <p className="font-semibold capitalize">{course.age_group}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-gray-600">Language</p>
                    <p className="font-semibold capitalize">{course.language_target}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">Coding</p>
                    <p className="font-semibold capitalize">{course.coding_language}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="text-sm text-gray-600">Difficulty</p>
                    <p className="font-semibold">{course.difficulty_level}/5</p>
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Your Progress</span>
                  <span>{completionPercentage}% Complete</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-green-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={startCourse}
              disabled={isLocked}
              className={`
                flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all
                ${isLocked
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                }
              `}
            >
              <Play className="h-5 w-5" />
              <span>
                {isLocked ? 'Course Locked' : completionPercentage > 0 ? 'Continue Learning' : 'Start Course'}
              </span>
            </button>

            <button className="flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl font-medium transition-colors">
              <BarChart3 className="h-5 w-5" />
              <span>View Stats</span>
            </button>
          </div>
        </div>

        {/* Dependencies Warning */}
        {isLocked && dependencies.unmet_dependencies.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center">
              <Lock className="h-5 w-5 mr-2" />
              Course Requirements
            </h3>
            <p className="text-yellow-700 mb-4">
              You need to complete the following requirements to unlock this course:
            </p>
            <ul className="space-y-2">
              {dependencies.unmet_dependencies.map((dep, index) => (
                <li key={index} className="flex items-center space-x-3 text-yellow-700">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span>
                    {dep.dependency_type === 'course' 
                      ? `Complete "${dep.required_course_title}" with ${dep.min_score}% score`
                      : `Earn "${dep.required_achievement_title}" achievement`
                    }
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Lessons List */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">Course Lessons</h2>
            <p className="text-gray-600 text-sm">
              {course.lessons.filter(l => l.is_completed).length} of {course.lessons.length} lessons completed
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {course.lessons.map((lesson, index) => (
              <div key={lesson.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                      ${lesson.is_completed
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                      }
                    `}>
                      {lesson.is_completed ? '✓' : index + 1}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{lesson.title}</h3>
                      <p className="text-gray-600 text-sm mt-1">{lesson.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {lesson.is_completed && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    <Link
                      to={`/lesson/${lesson.id}`}
                      className={`
                        flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors
                        ${lesson.is_completed
                          ? 'bg-green-500 hover:bg-green-600 text-white'
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }
                        ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                      onClick={(e) => {
                        if (isLocked) e.preventDefault();
                      }}
                    >
                      <Play className="h-4 w-4" />
                      <span>{lesson.is_completed ? 'Review' : 'Start'}</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;