import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  Users,
  Trophy,
  BookOpen,
  TrendingUp,
  Calendar,
  Award,
  Clock,
  Star,
  Shield
} from 'lucide-react';

const ParentDashboard = () => {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState(null);
  const [childProgress, setChildProgress] = useState({});

  const { user } = useAuth();

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      const res = await axios.get('/api/auth/children');
      setChildren(res.data.children || []);
      
      if (res.data.children.length > 0) {
        setSelectedChild(res.data.children[0].id);
        fetchChildProgress(res.data.children[0].id);
      }
    } catch (error) {
      console.error('Error fetching children:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChildProgress = async (childId) => {
    try {
      const res = await axios.get(`/api/progress?childId=${childId}`);
      setChildProgress(prev => ({
        ...prev,
        [childId]: res.data.progress
      }));
    } catch (error) {
      console.error('Error fetching child progress:', error);
    }
  };

  const getChildStats = (childId) => {
    const progress = childProgress[childId] || [];
    const completedLessons = progress.filter(p => p.completed).length;
    const totalScore = progress.reduce((sum, p) => sum + (p.score || 0), 0);
    const averageScore = completedLessons > 0 ? totalScore / completedLessons : 0;
    
    return {
      completedLessons,
      averageScore: Math.round(averageScore),
      totalTime: progress.reduce((sum, p) => sum + (p.time_spent || 0), 0),
      recentActivity: progress.slice(0, 5)
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-lg h-32"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Shield className="h-8 w-8 text-blue-500" />
            <h1 className="text-3xl font-bold text-gray-800">Parent Dashboard</h1>
          </div>
          <p className="text-gray-600">
            Monitor your children's learning progress and achievements
          </p>
        </div>

        {children.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Children Added</h2>
            <p className="text-gray-600 mb-6">
              You haven't added any children to your account yet.
            </p>
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-colors">
              Add Child Account
            </button>
          </div>
        ) : (
          <>
            {/* Children Selector */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Select Child</h2>
              <div className="flex flex-wrap gap-3">
                {children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => {
                      setSelectedChild(child.id);
                      if (!childProgress[child.id]) {
                        fetchChildProgress(child.id);
                      }
                    }}
                    className={`flex items-center space-x-3 px-6 py-4 rounded-xl border-2 transition-all ${
                      selectedChild === child.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-gray-50 hover:border-blue-300'
                    }`}
                  >
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {child.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-800">{child.username}</h3>
                      <p className="text-sm text-gray-600">Age: {child.age}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Child Progress */}
            {selectedChild && (() => {
              const child = children.find(c => c.id === selectedChild);
              const stats = getChildStats(selectedChild);
              
              return (
                <div className="space-y-8">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                      <div className="flex items-center justify-between mb-4">
                        <BookOpen className="h-8 w-8 text-blue-500" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-1">
                        {stats.completedLessons}
                      </h3>
                      <p className="text-gray-600 text-sm">Lessons Completed</p>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                      <div className="flex items-center justify-between mb-4">
                        <Star className="h-8 w-8 text-yellow-500" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-1">
                        {stats.averageScore}%
                      </h3>
                      <p className="text-gray-600 text-sm">Average Score</p>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                      <div className="flex items-center justify-between mb-4">
                        <Clock className="h-8 w-8 text-green-500" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-1">
                        {Math.round(stats.totalTime / 60)}m
                      </h3>
                      <p className="text-gray-600 text-sm">Total Learning Time</p>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                      <div className="flex items-center justify-between mb-4">
                        <TrendingUp className="h-8 w-8 text-purple-500" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-1">
                        {stats.recentActivity.length}
                      </h3>
                      <p className="text-gray-600 text-sm">Recent Activities</p>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-6">
                      Recent Activity for {child.username}
                    </h2>
                    
                    <div className="space-y-4">
                      {stats.recentActivity.map((activity, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div className="flex items-center space-x-4">
                            <div className={`w-3 h-3 rounded-full ${
                              activity.completed ? 'bg-green-500' : 'bg-yellow-500'
                            }`}></div>
                            <div>
                              <h3 className="font-medium text-gray-800">
                                {activity.lesson_title}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {activity.course_title}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span>{activity.score}%</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{activity.time_spent}s</span>
                            </div>
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(activity.completed_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {stats.recentActivity.length === 0 && (
                      <div className="text-center py-8">
                        <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No recent activity yet.</p>
                      </div>
                    )}
                  </div>

                  {/* Progress Chart Placeholder */}
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-6">Learning Progress</h2>
                    <div className="h-64 bg-gray-50 rounded-xl flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <TrendingUp className="h-12 w-12 mx-auto mb-2" />
                        <p>Progress chart will be displayed here</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
};

export default ParentDashboard;