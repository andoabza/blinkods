import React from 'react';
import { Trophy, Star, Lock, Unlock } from 'lucide-react';

const AchievementBadge = ({ achievement, earned = false, size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-12 h-12',
    medium: 'w-16 h-16',
    large: 'w-24 h-24'
  };

  const textSizes = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  };

  return (
    <div className={`relative group ${sizeClasses[size]}`}>
      <div className={`
        relative w-full h-full rounded-2xl flex flex-col items-center justify-center p-2 transition-all
        ${earned 
          ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg' 
          : 'bg-gray-200 text-gray-400'
        }
        ${size === 'large' ? 'p-4' : ''}
      `}>
        {earned ? (
          <Trophy className={`${size === 'large' ? 'h-8 w-8' : size === 'medium' ? 'h-6 w-6' : 'h-4 w-4'}`} />
        ) : (
          <Lock className={`${size === 'large' ? 'h-8 w-8' : size === 'medium' ? 'h-6 w-6' : 'h-4 w-4'}`} />
        )}
        
        {size !== 'small' && (
          <div className={`text-center mt-1 ${textSizes[size]} font-semibold`}>
            {achievement.points}
          </div>
        )}
      </div>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
        <div className="bg-gray-900 text-white text-sm rounded-lg py-2 px-3 whitespace-nowrap">
          <div className="font-semibold">{achievement.title}</div>
          <div className="text-gray-300">{achievement.description}</div>
          <div className="flex items-center justify-between mt-1">
            <span>{earned ? 'Earned!' : 'Not earned'}</span>
            <span className="flex items-center">
              <Star className="h-3 w-3 mr-1" />
              {achievement.points}
            </span>
          </div>
        </div>
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );
};

export default AchievementBadge;