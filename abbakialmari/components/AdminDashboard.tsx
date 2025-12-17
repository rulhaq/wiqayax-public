import React, { useState, useEffect } from 'react';
import { 
  Users, TrendingUp, Code, Activity, BarChart3, 
  LogOut, RefreshCw, Calendar, FileText, Zap, Server,
  ChevronRight, AlertCircle, CheckCircle
} from 'lucide-react';
import { adminLogout, isAdminAuthenticated, getAdminSession } from '../services/adminAuthService';
import { onAuthChange, getCurrentUser } from '../../services/authService';
import { 
  getAllUsers, 
  getAdminStats, 
  getAllUserActivities, 
  getCodeAnalyzedPerDay,
  AdminStats,
  UserWithStats
} from '../services/adminService';
import { UserActivity } from '../../services/userService';

interface AdminDashboardProps {
  onNavigate: (route: string) => void;
}

type TabType = 'overview' | 'users' | 'analytics' | 'activities' | 'providers';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [codePerDay, setCodePerDay] = useState<{ date: string; lines: number; projects: number }[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Check authentication status
    const checkAuth = () => {
      if (!isAdminAuthenticated()) {
        onNavigate('/abbakialmari');
        return;
      }
      loadData();
    };
    
    // Check immediately
    checkAuth();
    
    // Listen for auth state changes
    const unsubscribe = onAuthChange((user) => {
      if (!user || !isAdminAuthenticated()) {
        onNavigate('/abbakialmari');
      }
    });
    
    return unsubscribe;
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, usersData, activitiesData, codeData] = await Promise.all([
        getAdminStats(),
        getAllUsers(),
        getAllUserActivities(500),
        getCodeAnalyzedPerDay(30)
      ]);
      
      setStats(statsData);
      setUsers(usersData);
      setActivities(activitiesData);
      setCodePerDay(codeData);
    } catch (error) {
      console.error("Error loading admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await adminLogout();
    onNavigate('/abbakialmari');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050507] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050507] text-white">
      {/* Header */}
      <header className="bg-[#0a0a0c] border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Server className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold">WiqayaX Admin</h1>
                <p className="text-xs text-gray-400">
                  {getCurrentUser()?.email || 'Administrative Dashboard'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh Data"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-[#0a0a0c] border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto">
            {[
              { id: 'overview' as TabType, label: 'Overview', icon: BarChart3 },
              { id: 'users' as TabType, label: 'Users', icon: Users },
              { id: 'analytics' as TabType, label: 'Analytics', icon: TrendingUp },
              { id: 'providers' as TabType, label: 'AI Providers', icon: Zap },
              { id: 'activities' as TabType, label: 'Activity Logs', icon: Activity }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="whitespace-nowrap">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && <OverviewTab stats={stats} codePerDay={codePerDay} />}
        {activeTab === 'users' && <UsersTab users={users} />}
        {activeTab === 'analytics' && <AnalyticsTab stats={stats} codePerDay={codePerDay} />}
        {activeTab === 'providers' && <ProvidersTab stats={stats} />}
        {activeTab === 'activities' && <ActivitiesTab activities={activities} />}
      </main>
    </div>
  );
};

// Overview Tab
const OverviewTab: React.FC<{ stats: AdminStats | null; codePerDay: any[] }> = ({ stats, codePerDay }) => {
  if (!stats) return <div className="text-gray-400">No data available</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-6">Dashboard Overview</h2>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          change={`+${stats.newUsersToday} today`}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Total Projects"
          value={stats.totalProjects.toLocaleString()}
          change={`+${stats.projectsToday} today`}
          icon={FileText}
          color="green"
        />
        <StatCard
          title="Lines Analyzed"
          value={stats.totalLinesAnalyzed.toLocaleString()}
          change={`+${stats.linesAnalyzedToday.toLocaleString()} today`}
          icon={Code}
          color="purple"
        />
        <StatCard
          title="Total Analyses"
          value={stats.totalAnalyses.toLocaleString()}
          change={`+${stats.analysesToday} today`}
          icon={Activity}
          color="yellow"
        />
      </div>

      {/* Recent Activity Chart */}
      <div className="bg-[#0f1117] rounded-xl border border-gray-800 p-6">
        <h3 className="text-lg font-semibold mb-4">Code Analyzed (Last 30 Days)</h3>
        <div className="h-64 flex items-end gap-2">
          {codePerDay.slice(-14).map((day, idx) => {
            const maxLines = Math.max(...codePerDay.map(d => d.lines), 1);
            const height = (day.lines / maxLines) * 100;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-gray-800 rounded-t relative" style={{ height: `${height}%` }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t"></div>
                </div>
                <span className="text-xs text-gray-500">{new Date(day.date).getDate()}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Users Tab
const UsersTab: React.FC<{ users: UserWithStats[] }> = ({ users }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">All Users ({users.length})</h2>
      </div>

      <div className="bg-[#0f1117] rounded-xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#181a1f] border-b border-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Projects</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Lines Analyzed</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Provider</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Last Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {users.map((user) => (
                <tr key={user.uid} className="hover:bg-[#181a1f] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold">
                          {user.displayName?.[0] || (user.email ? user.email[0].toUpperCase() : '?')}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">
                          {user.displayName || 'No name'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.email || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {user.createdAt instanceof Date 
                      ? user.createdAt.toLocaleDateString()
                      : (user.createdAt as any)?.toDate?.()?.toLocaleDateString() || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{user.projectCount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{user.totalLinesAnalyzed.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 bg-blue-900/30 text-blue-300 rounded text-xs">
                      {user.provider || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {user.lastActivity 
                      ? new Date(user.lastActivity).toLocaleDateString()
                      : 'Never'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Analytics Tab
const AnalyticsTab: React.FC<{ stats: AdminStats | null; codePerDay: any[] }> = ({ stats, codePerDay }) => {
  if (!stats) return <div className="text-gray-400">No data available</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-6">Analytics</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0f1117] rounded-xl border border-gray-800 p-6">
          <h3 className="text-lg font-semibold mb-4">New Users</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Today</span>
              <span className="text-xl font-bold">{stats.newUsersToday}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">This Week</span>
              <span className="text-xl font-bold">{stats.newUsersThisWeek}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">This Month</span>
              <span className="text-xl font-bold">{stats.newUsersThisMonth}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#0f1117] rounded-xl border border-gray-800 p-6">
          <h3 className="text-lg font-semibold mb-4">Projects Analyzed</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Today</span>
              <span className="text-xl font-bold">{stats.projectsToday}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">This Week</span>
              <span className="text-xl font-bold">{stats.projectsThisWeek}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">This Month</span>
              <span className="text-xl font-bold">{stats.projectsThisMonth}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#0f1117] rounded-xl border border-gray-800 p-6">
          <h3 className="text-lg font-semibold mb-4">Lines of Code</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Today</span>
              <span className="text-xl font-bold">{stats.linesAnalyzedToday.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">This Week</span>
              <span className="text-xl font-bold">{stats.linesAnalyzedThisWeek.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">This Month</span>
              <span className="text-xl font-bold">{stats.linesAnalyzedThisMonth.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Providers Tab
const ProvidersTab: React.FC<{ stats: AdminStats | null }> = ({ stats }) => {
  if (!stats) return <div className="text-gray-400">No data available</div>;

  const providers = Object.entries(stats.providerUsage).sort((a, b) => b[1] - a[1]);
  const total = providers.reduce((sum, [, count]) => sum + count, 0);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-6">AI Provider Usage</h2>

      <div className="bg-[#0f1117] rounded-xl border border-gray-800 p-6">
        <div className="space-y-4">
          {providers.map(([provider, count]) => {
            const percentage = total > 0 ? (count / total) * 100 : 0;
            return (
              <div key={provider}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white capitalize">{provider}</span>
                  <span className="text-sm text-gray-400">{count} uses ({percentage.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Activities Tab
const ActivitiesTab: React.FC<{ activities: UserActivity[] }> = ({ activities }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Activity Logs ({activities.length})</h2>
      </div>

      <div className="bg-[#0f1117] rounded-xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-[#181a1f] border-b border-gray-800 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">User ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Activity</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {activities.map((activity) => (
                <tr key={activity.id} className="hover:bg-[#181a1f] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {activity.timestamp instanceof Date
                      ? activity.timestamp.toLocaleString()
                      : new Date(activity.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono text-xs">
                    {activity.userId.substring(0, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs ${
                      activity.activityType === 'analysis_complete' ? 'bg-green-900/30 text-green-300' :
                      activity.activityType === 'analysis_start' ? 'bg-blue-900/30 text-blue-300' :
                      activity.activityType === 'login' ? 'bg-purple-900/30 text-purple-300' :
                      'bg-gray-800 text-gray-300'
                    }`}>
                      {activity.activityType.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {activity.activityDetails ? JSON.stringify(activity.activityDetails, null, 2) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard: React.FC<{
  title: string;
  value: string;
  change: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'purple' | 'yellow';
}> = ({ title, value, change, icon: Icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-600/20 text-blue-400',
    green: 'bg-green-600/20 text-green-400',
    purple: 'bg-purple-600/20 text-purple-400',
    yellow: 'bg-yellow-600/20 text-yellow-400'
  };

  return (
    <div className="bg-[#0f1117] rounded-xl border border-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <h3 className="text-sm text-gray-400 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-xs text-gray-500">{change}</p>
    </div>
  );
};

