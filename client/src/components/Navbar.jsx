import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { 
  Code2, 
  Home, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Trophy,
  Users,
  BookOpen,
  Sparkles,
  Bell,
  Settings,
  Shield,
  Zap,
  Search,
  Bookmark,
  Star,
  GraduationCap,
  MessageCircle,
  Heart,
  Crown
} from 'lucide-react';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const { isConnected, unreadCount } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home, description: 'Your learning hub' },
    { name: 'Courses', href: '/courses', icon: BookOpen, description: 'Explore adventures' },
    { name: 'Achievements', href: '/achievements', icon: Trophy, description: 'Your trophies' },
    ...(user?.role === 'parent' 
      ? [{ name: 'Parent Portal', href: '/parent', icon: Users, description: 'Monitor progress' }]
      : []
    ),
    ...(user?.role === 'teacher' 
      ? [{ name: 'Teacher Dashboard', href: '/teacher', icon: GraduationCap, description: 'Manage classes' }]
      : []
    ),
    ...(user?.role === 'admin' 
      ? [{ name: 'Admin Panel', href: '/admin', icon: Shield, description: 'System management' }]
      : []
    ),
  ];

  // Mock notifications
  const notifications = [
    {
      id: 1,
      title: 'New Achievement!',
      message: 'You earned the "Code Explorer" badge',
      icon: Trophy,
      time: '2 min ago',
      read: false,
      type: 'achievement'
    },
    {
      id: 2,
      title: 'Lesson Completed',
      message: 'Great job finishing "Colors Adventure"',
      icon: Sparkles,
      time: '1 hour ago',
      read: false,
      type: 'progress'
    },
    {
      id: 3,
      title: 'Daily Streak',
      message: '5 days in a row! Keep going!',
      icon: Zap,
      time: '5 hours ago',
      read: true,
      type: 'streak'
    }
  ];

  const unreadNotifications = notifications.filter(n => !n.read).length;

  const isActive = (path) => location.pathname === path;

  const getConnectionStatus = () => {
    return isConnected ? {
      text: 'Live',
      color: 'bg-green-500',
      pulse: 'animate-pulse'
    } : {
      text: 'Offline',
      color: 'bg-red-500',
      pulse: ''
    };
  };

  const connectionStatus = getConnectionStatus();

  return (
    <>
      {/* Navigation Bar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled 
          ? 'bg-white/95 backdrop-blur-xl shadow-2xl border-b border-blue-100/50' 
          : 'bg-gradient-to-r from-blue-600/95 to-purple-600/95 backdrop-blur-xl'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 lg:h-20">
            
            {/* Logo and Brand */}
            <div className="flex items-center space-x-4">
              <Link 
                to="/" 
                className="flex items-center space-x-3 group"
              >
                <div className={`p-2 rounded-2xl transition-all duration-300 group-hover:scale-110 ${
                  scrolled 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg' 
                    : 'bg-white/20 backdrop-blur-sm'
                }`}>
                  <Code2 className={`h-6 w-6 ${
                    scrolled ? 'text-white' : 'text-yellow-300'
                  }`} />
                </div>
                <div className="flex flex-col">
                  <span className={`text-xl font-bold tracking-tight ${
                    scrolled ? 'text-gray-800' : 'text-white'
                  }`}>
                    CodeKids
                  </span>
                  <span className={`text-xs ${
                    scrolled ? 'text-gray-600' : 'text-blue-100'
                  }`}>
                    Learn • Code • Create
                  </span>
                </div>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden lg:flex lg:items-center lg:space-x-1 ml-8">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`group relative flex items-center space-x-2 px-4 py-3 rounded-2xl font-medium transition-all duration-300 ${
                        scrolled
                          ? active
                            ? 'bg-blue-500 text-white shadow-lg'
                            : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                          : active
                            ? 'bg-white/20 text-white backdrop-blur-sm'
                            : 'text-white/90 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                      
                      {/* Hover tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                        {item.description}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-3">
              
              {/* Search Bar - Desktop */}
              <div className="hidden md:block relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                  scrolled ? 'text-gray-400' : 'text-white/70'
                }`} />
                <input
                  type="text"
                  placeholder="Search adventures..."
                  className={`pl-10 pr-4 py-2 rounded-2xl border transition-all duration-300 ${
                    scrolled
                      ? 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-500 focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-200'
                      : 'bg-white/20 border-white/30 text-white placeholder-white/60 focus:bg-white/30 focus:border-white/50 backdrop-blur-sm'
                  }`}
                />
              </div>

              {/* Connection Status */}
              <div className={`hidden sm:flex items-center space-x-2 px-3 py-2 rounded-2xl ${
                scrolled ? 'bg-gray-100' : 'bg-white/20 backdrop-blur-sm'
              }`}>
                <div className={`w-2 h-2 rounded-full ${connectionStatus.color} ${connectionStatus.pulse}`}></div>
                <span className={`text-sm font-medium ${
                  scrolled ? 'text-gray-700' : 'text-white'
                }`}>
                  {connectionStatus.text}
                </span>
              </div>

              {/* Notifications */}
              {user && (
                <div className="relative">
                  <button
                    onClick={() => {
                      setIsNotificationsOpen(!isNotificationsOpen);
                      setIsProfileMenuOpen(false);
                    }}
                    className={`p-2 rounded-2xl transition-all duration-300 hover:scale-110 relative ${
                      scrolled 
                        ? 'text-gray-600 hover:text-blue-600 hover:bg-blue-50' 
                        : 'text-white/90 hover:text-white hover:bg-white/20'
                    }`}
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-bounce">
                        {unreadCount}
                      </div>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {isNotificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50">
                      <div className="p-4 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-gray-800">Notifications</h3>
                          <span className="text-sm text-blue-600 font-medium">
                            {unreadNotifications} new
                          </span>
                        </div>
                      </div>
                      
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.map((notification) => {
                          const Icon = notification.icon;
                          return (
                            <div
                              key={notification.id}
                              className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                                !notification.read ? 'bg-blue-50/50' : ''
                              }`}
                            >
                              <div className="flex items-start space-x-3">
                                <div className={`p-2 rounded-xl ${
                                  notification.type === 'achievement' ? 'bg-yellow-100 text-yellow-600' :
                                  notification.type === 'progress' ? 'bg-green-100 text-green-600' :
                                  'bg-blue-100 text-blue-600'
                                }`}>
                                  <Icon className="h-4 w-4" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-800 text-sm">
                                    {notification.title}
                                  </h4>
                                  <p className="text-gray-600 text-sm mt-1">
                                    {notification.message}
                                  </p>
                                  <span className="text-xs text-gray-500 mt-2 block">
                                    {notification.time}
                                  </span>
                                </div>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="p-3 bg-gray-50">
                        <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2">
                          View All Notifications
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* User Menu */}
              {user && (
                <div className="relative">
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(!isProfileMenuOpen);
                      setIsNotificationsOpen(false);
                    }}
                    className={`flex items-center space-x-3 p-2 rounded-2xl transition-all duration-300 group ${
                      scrolled 
                        ? 'hover:bg-blue-50' 
                        : 'hover:bg-white/20'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-lg ${
                      user.role === 'admin' ? 'ring-2 ring-yellow-400' : ''
                    }`}>
                      {user.role === 'admin' ? (
                        <Crown className="h-5 w-5 text-white" />
                      ) : (
                        <User className="h-5 w-5 text-white" />
                      )}
                    </div>
                    
                    <div className="hidden lg:flex lg:flex-col lg:items-start">
                      <span className={`text-sm font-bold text-left ${
                        scrolled ? 'text-gray-800' : 'text-white'
                      }`}>
                        {user.username}
                      </span>
                      <span className={`text-xs capitalize ${
                        scrolled ? 'text-gray-600' : 'text-blue-100'
                      }`}>
                        {user.role} • Level {user.level || 1}
                      </span>
                    </div>
                  </button>

                  {/* Profile Dropdown Menu */}
                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50">
                      {/* User Info Header */}
                      <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                            {user.role === 'admin' ? (
                              <Crown className="h-6 w-6 text-yellow-300" />
                            ) : (
                              <User className="h-6 w-6 text-white" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-lg">{user.username}</h3>
                            <p className="text-blue-100 text-sm capitalize">
                              {user.role} • {user.email}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-sm">
                          <span>Level {user.level || 1}</span>
                          <span className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-300 fill-current" />
                            <span>{user.points || 0} XP</span>
                          </span>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="p-2">
                        <Link
                          to="/profile"
                          className="flex items-center space-x-3 px-3 py-3 rounded-xl text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <User className="h-5 w-5" />
                          <span>My Profile</span>
                        </Link>
                        
                        <Link
                          to="/bookmarks"
                          className="flex items-center space-x-3 px-3 py-3 rounded-xl text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <Bookmark className="h-5 w-5" />
                          <span>Bookmarks</span>
                        </Link>
                        
                        <Link
                          to="/settings"
                          className="flex items-center space-x-3 px-3 py-3 rounded-xl text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <Settings className="h-5 w-5" />
                          <span>Settings</span>
                        </Link>

                        <div className="border-t border-gray-100 my-2"></div>

                        <button
                          onClick={handleLogout}
                          className="flex items-center space-x-3 w-full px-3 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="h-5 w-5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`lg:hidden p-2 rounded-2xl transition-colors ${
                  scrolled 
                    ? 'text-gray-600 hover:text-blue-600 hover:bg-blue-50' 
                    : 'text-white hover:bg-white/20'
                }`}
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-200 shadow-2xl">
            <div className="px-4 py-6 space-y-4">
              {/* Mobile Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search adventures..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Mobile Navigation */}
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 p-4 rounded-2xl transition-all ${
                      active
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm opacity-75">{item.description}</div>
                    </div>
                    {active && <Sparkles className="h-4 w-4" />}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Backdrop Overlays */}
      {(isMobileMenuOpen || isNotificationsOpen || isProfileMenuOpen) && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => {
            setIsMobileMenuOpen(false);
            setIsNotificationsOpen(false);
            setIsProfileMenuOpen(false);
          }}
        ></div>
      )}

      {/* Spacer for fixed navbar */}
      <div className="h-16 lg:h-20"></div>
    </>
  );
};

export default Navbar;