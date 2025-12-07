
import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { 
  LayoutDashboard, Users, Banknote, FileText, Settings, LogOut, Menu, X, Bell, PiggyBank, Briefcase, Check, Trash2, Camera
} from 'lucide-react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { currentUser, logout, notifications, setLanguage, language, translations, markNotificationAsRead, clearNotifications } = useData();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [profileUpdateTrigger, setProfileUpdateTrigger] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Load profile picture when user changes
  useEffect(() => {
    if (currentUser?.id) {
      const savedPicture = localStorage.getItem(`profile_pic_${currentUser.id}`);
      setProfilePicture(savedPicture);
    }
  }, [currentUser?.id, profileUpdateTrigger]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        localStorage.setItem(`profile_pic_${currentUser?.id}`, base64String);
        setProfilePicture(base64String);
        // Trigger useEffect to re-read from localStorage
        setProfileUpdateTrigger(prev => prev + 1);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMarkAsRead = (notificationId: string) => {
    markNotificationAsRead(notificationId);
  };

  const handleClearAll = () => {
    clearNotifications();
    setIsNotificationOpen(false);
  };

  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => (
    <NavLink
      to={to}
      onClick={() => setIsMobileMenuOpen(false)}
      className={({ isActive }) =>
        `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
          isActive 
            ? 'bg-blue-600 text-white shadow-md' 
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`
      }
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </NavLink>
  );

  const unreadCount = notifications.filter(n => !n.read && (n.targetRole === currentUser?.role || !n.targetRole)).length;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0
      `}>
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              CoopPartners
            </h1>
            <p className="text-xs text-slate-400 mt-1">{currentUser?.role}</p>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden">
            <X size={24} />
          </button>
        </div>

        <nav className="p-4 space-y-2 mt-4">
          <NavItem to="/" icon={LayoutDashboard} label={translations.dashboard} />
          <NavItem to="/members" icon={Users} label={translations.members} />
          <NavItem to="/contributions" icon={PiggyBank} label={translations.contributions} />
          <NavItem to="/loans" icon={Banknote} label={translations.loans} />
          <NavItem to="/activities" icon={Briefcase} label={translations.activities} />
          <NavItem to="/investment" icon={Briefcase} label="Investments" />
          <NavItem to="/reports" icon={FileText} label={translations.reports} />
          <div className="pt-4 mt-4 border-t border-slate-800">
             <NavItem to="/settings" icon={Settings} label={translations.settings} />
          </div>
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-700 bg-slate-900">
          <div className="flex items-center justify-between mb-4 px-2">
            <span className="text-sm text-slate-400">Language</span>
            <button 
              onClick={() => setLanguage(language === 'en' ? 'rw' : 'en')}
              className="text-xs bg-slate-800 px-2 py-1 rounded border border-slate-600 hover:bg-slate-700"
            >
              {language === 'en' ? '🇺🇸 EN' : '🇷🇼 RW'}
            </button>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-3 text-red-400 hover:text-red-300 w-full px-4 py-2"
          >
            <LogOut size={20} />
            <span>{translations.logout}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden text-slate-600"
          >
            <Menu size={24} />
          </button>
          
          <div className="flex-1 px-4 md:px-0">
             <h2 className="text-lg font-semibold text-slate-800 hidden md:block">{translations.welcome}, {currentUser?.fullName}</h2>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notifications Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="cursor-pointer relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Bell size={20} className="text-slate-500 hover:text-blue-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Menu */}
              {isNotificationOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-slate-200 z-50 max-h-96 overflow-y-auto">
                  <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white flex justify-between items-center rounded-t-lg">
                    <h3 className="font-semibold flex items-center">
                      <Bell size={18} className="mr-2" />
                      Notifications
                    </h3>
                    {notifications.length > 0 && (
                      <button
                        onClick={handleClearAll}
                        className="text-xs bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded transition-colors"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {notifications && notifications.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {notifications
                        .filter(n => n.targetRole === currentUser?.role || !n.targetRole)
                        .map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 hover:bg-slate-50 transition-colors ${
                              !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  {!notification.read && (
                                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                                  )}
                                  <p className={`text-sm ${!notification.read ? 'font-semibold text-slate-900' : 'font-normal text-slate-700'}`}>
                                    {notification.message}
                                  </p>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                  {new Date(notification.date).toLocaleString()}
                                </p>
                                {notification.type === 'warning' && (
                                  <span className="inline-block text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded mt-2">
                                    ⚠️ Warning
                                  </span>
                                )}
                                {notification.type === 'success' && (
                                  <span className="inline-block text-xs bg-green-100 text-green-800 px-2 py-1 rounded mt-2">
                                    ✓ Success
                                  </span>
                                )}
                              </div>
                              {!notification.read && (
                                <button
                                  onClick={() => handleMarkAsRead(notification.id)}
                                  className="text-blue-600 hover:text-blue-700 transition-colors"
                                  title="Mark as read"
                                >
                                  <Check size={16} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-400">
                      <Bell size={32} className="mx-auto mb-2 opacity-20" />
                      <p>No notifications</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="cursor-pointer relative group"
              >
                {profilePicture ? (
                  <img 
                    src={profilePicture}
                    alt="Profile" 
                    className="w-9 h-9 rounded-full border-2 border-slate-200 object-cover hover:border-blue-400 transition-colors"
                  />
                ) : (
                  <img 
                    src={`https://ui-avatars.com/api/?name=${currentUser?.fullName}&background=0D8ABC&color=fff`} 
                    alt="Profile" 
                    className="w-9 h-9 rounded-full border-2 border-slate-200 hover:border-blue-400 transition-colors"
                  />
                )}
                <div className="absolute -bottom-1 -right-1 bg-blue-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={12} className="text-white" />
                </div>
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-slate-200 z-50">
                  <div className="p-4 border-b border-slate-200">
                    <div className="flex items-center gap-4">
                      {profilePicture ? (
                        <img 
                          src={profilePicture}
                          alt="Profile" 
                          className="w-16 h-16 rounded-full object-cover border-2 border-blue-200"
                        />
                      ) : (
                        <img 
                          src={`https://ui-avatars.com/api/?name=${currentUser?.fullName}&background=0D8ABC&color=fff`} 
                          alt="Profile" 
                          className="w-16 h-16 rounded-full border-2 border-blue-200"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900">{currentUser?.fullName}</h3>
                        <p className="text-xs text-slate-500">{currentUser?.email}</p>
                        <p className="text-xs text-blue-600 font-medium mt-1">{currentUser?.role}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <button
                      onClick={() => {
                        fileInputRef.current?.click();
                        setIsProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors text-slate-700 font-medium"
                    >
                      <Camera size={18} className="text-blue-600" />
                      <span>Change Profile Picture</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      className="hidden"
                    />

                    <hr className="my-2" />

                    <NavLink
                      to="/settings"
                      onClick={() => setIsProfileOpen(false)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors text-slate-700 font-medium"
                    >
                      <Settings size={18} className="text-slate-600" />
                      <span>Settings</span>
                    </NavLink>

                    <button
                      onClick={() => {
                        handleLogout();
                        setIsProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-red-50 rounded-lg transition-colors text-red-600 font-medium"
                    >
                      <LogOut size={18} />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
