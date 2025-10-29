import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Lock, 
  CheckCircle, 
  Star, 
  Clock,
  Users,
  Award
} from 'lucide-react';

const CourseCard = ({ course, userProgress }) => {
  const progress = userProgress || {};
  const completionPercentage = progress.total_lessons > 0 
    ? Math.round((progress.completed_lessons / progress.total_lessons) * 100)
    : 0;

  const isLocked = course.is_locked;
  const lockReason = course.lock_reason;

  const getDependencyText = () => {
    if (!lockReason) return '';
    
    if (lockReason.dependency_type === 'course') {
      return `Complete "${lockReason.required_course_title}" with ${lockReason.min_score}% score`;
    } else if (lockReason.dependency_type === 'achievement') {
      return `Earn "${lockReason.required_achievement_title}" achievement`;
    }
    
    return 'Requirements not met';
  };

  return (
    <div className={`
      bg-white rounded-2xl shadow-lg border-2 overflow-hidden transition-all
      ${isLocked 
        ? 'border-gray-200 opacity-75' 
        : 'border-transparent hover:border-blue-300 hover:shadow-xl'
      }
    `}>
      {/* Course Header */}
      <div className="relative">
        <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
          <BookOpen className="h-12 w-12 text-white" />
        </div>
        
        {/* Progress Bar */}
        {!isLocked && progress.total_lessons > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
            <div 
              className="h-full bg-green-500 transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
        )}
        
        {/* Lock Overlay */}
        {isLocked && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <Lock className="h-8 w-8 text-white" />
          </div>
        )}
        
        {/* Completion Badge */}
        {completionPercentage === 100 && (
          <div className="absolute top-3 right-3 bg-green-500 text-white p-1 rounded-full">
            <CheckCircle className="h-5 w-5" />
          </div>
        )}
      </div>

      {/* Course Content */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-bold text-gray-800 flex-1 pr-2">
            {course.title}
          </h3>
          {isLocked && (
            <Lock className="h-5 w-5 text-gray-400 flex-shrink-0" />
          )}
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {course.description}
        </p>

        {/* Course Metadata */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span className="capitalize">{course.age_group}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Award className="h-4 w-4" />
              <span className="capitalize">{course.language_target}</span>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 text-yellow-500" />
            <span>{course.difficulty_level}/5</span>
          </div>
        </div>

        {/* Progress Stats */}
        {!isLocked && progress.total_lessons > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progress</span>
              <span>{progress.completed_lessons}/{progress.total_lessons} lessons</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Lock Reason */}
        {isLocked && lockReason && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              🔒 {getDependencyText()}
            </p>
          </div>
        )}

        {/* Action Button */}
        <Link
          to={isLocked ? '#' : `/course/${course.id}`}
          className={`
            w-full py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center space-x-2
            ${isLocked
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : completionPercentage === 100
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }
          `}
        >
          {isLocked ? (
            <>
              <Lock className="h-4 w-4" />
              <span>Locked</span>
            </>
          ) : completionPercentage === 100 ? (
            <>
              <CheckCircle className="h-4 w-4" />
              <span>Completed</span>
            </>
          ) : completionPercentage > 0 ? (
            <>
              <BookOpen className="h-4 w-4" />
              <span>Continue</span>
            </>
          ) : (
            <>
              <BookOpen className="h-4 w-4" />
              <span>Start Course</span>
            </>
          )}
        </Link>
      </div>
    </div>
  );
};

export default CourseCard;