import React, { useState, useEffect } from 'react';
import { Trophy, Star, TrendingUp, Award, Users, Target } from 'lucide-react';
import axios from 'axios';
import AchievementBadge from '../components/AchievementBadge';

const Achievements = () => {
  const [achievements, setAchievements] = useState([]);
  const [availableAchievements, setAvailableAchievements] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('earned');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      const [earnedRes, availableRes, statsRes] = await Promise.all([
        axios.get('/api/achievements'),
        axios.get('/api/achievements/available'),
        axios.get('/api/achievements/stats')
      ]);

      setAchievements(earnedRes.data.achievements);
      setAvailableAchievements(availableRes.data.achievements);
      setStats(statsRes.data.stats);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = {
    milestone: { name: 'Milestones', color: 'bg-blue-500', icon: Target },
    progress: { name: 'Progress', color: 'bg-green-500', icon: TrendingUp },
    consistency: { name: 'Consistency', color: 'bg-purple-500', icon: Award },
    mastery: { name: 'Mastery', color: 'bg-yellow-500', icon: Star },
    variety: { name: 'Variety', color: 'bg-pink-500', icon: Users },
    problem_solving: { name: 'Problem Solving', color: 'bg-red-500', icon: Trophy },
    special: { name: 'Special', color: 'bg-indigo-500', icon: Award }
  };

  const getAchievementsByCategory = (achievementList) => {
    return achievementList.reduce((acc, achievement) => {
      const category = achievement.category || 'general';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(achievement);
      return acc;
    }, {});
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-lg h-32"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const earnedByCategory = getAchievementsByCategory(achievements);
  const availableByCategory = getAchievementsByCategory(availableAchievements.filter(a => !a.earned));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-3 rounded-2xl">
              <Trophy className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800">Achievements</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Track your progress and unlock achievements as you learn to code and explore new languages!
          </p>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Points</p>
                  <h3 className="text-2xl font-bold text-gray-800">{stats.points.total_points}</h3>
                </div>
                <div className="bg-yellow-100 p-3 rounded-xl">
                  <Star className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Level</p>
                  <h3 className="text-2xl font-bold text-gray-800">{stats.points.current_level}</h3>
                  <p className="text-xs text-gray-500">{stats.points.level_title}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Achievements</p>
                  <h3 className="text-2xl font-bold text-gray-800">{stats.achievements.total_achievements}</h3>
                </div>
                <div className="bg-green-100 p-3 rounded-xl">
                  <Trophy className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Categories</p>
                  <h3 className="text-2xl font-bold text-gray-800">{stats.categories.length}</h3>
                </div>
                <div className="bg-purple-100 p-3 rounded-xl">
                  <Award className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-2 mb-8">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('earned')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors ${
                activeTab === 'earned'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Earned ({achievements.length})
            </button>
            <button
              onClick={() => setActiveTab('available')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors ${
                activeTab === 'available'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Available ({availableAchievements.filter(a => !a.earned).length})
            </button>
          </div>
        </div>

        {/* Achievements Grid */}
        <div className="space-y-8">
          {Object.entries(activeTab === 'earned' ? earnedByCategory : availableByCategory).map(([category, categoryAchievements]) => {
            const categoryInfo = categories[category] || { name: category, color: 'bg-gray-500', icon: Award };
            const Icon = categoryInfo.icon;
            
            return (
              <div key={category} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className={`${categoryInfo.color} px-6 py-4 flex items-center space-x-3`}>
                  <Icon className="h-6 w-6 text-white" />
                  <h2 className="text-xl font-bold text-white">{categoryInfo.name}</h2>
                  <span className="bg-white bg-opacity-20 px-2 py-1 rounded-full text-sm">
                    {categoryAchievements.length} achievements
                  </span>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {categoryAchievements.map((achievement) => (
                      <div key={achievement.type} className="text-center">
                        <div className="flex justify-center mb-2">
                          <AchievementBadge 
                            achievement={achievement} 
                            earned={activeTab === 'earned'}
                            size="medium"
                          />
                        </div>
                        <h3 className="font-semibold text-gray-800 text-sm mb-1">
                          {achievement.title}
                        </h3>
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {achievement.description}
                        </p>
                        <div className="flex items-center justify-center space-x-1 mt-1 text-xs text-yellow-600">
                          <Star className="h-3 w-3" />
                          <span>{achievement.points}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {activeTab === 'earned' && achievements.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Achievements Yet</h3>
            <p className="text-gray-600 mb-6">
              Start completing lessons to earn your first achievements!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Achievements;