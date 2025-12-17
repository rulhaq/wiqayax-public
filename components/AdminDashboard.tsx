import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line 
} from 'recharts';
import { DownloadStat, AppRoute } from '../types';
import { ArrowLeft, Users, Download, Activity } from 'lucide-react';

const mockData: DownloadStat[] = [
  { date: 'Mon', downloads: 120, activeUsers: 80 },
  { date: 'Tue', downloads: 145, activeUsers: 100 },
  { date: 'Wed', downloads: 190, activeUsers: 140 },
  { date: 'Thu', downloads: 220, activeUsers: 180 },
  { date: 'Fri', downloads: 300, activeUsers: 250 },
  { date: 'Sat', downloads: 180, activeUsers: 200 },
  { date: 'Sun', downloads: 150, activeUsers: 190 },
];

interface AdminProps {
  onNavigate: (route: AppRoute) => void;
}

export const AdminDashboard: React.FC<AdminProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center mb-8">
          <button 
            onClick={() => onNavigate(AppRoute.LANDING)}
            className="p-2 mr-4 bg-gray-800 rounded hover:bg-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Downloads</p>
                <h3 className="text-3xl font-bold mt-1">12,450</h3>
              </div>
              <div className="bg-blue-900/30 p-3 rounded-lg">
                <Download className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <p className="text-green-400 text-xs mt-4">+12% from last week</p>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Users</p>
                <h3 className="text-3xl font-bold mt-1">3,204</h3>
              </div>
              <div className="bg-purple-900/30 p-3 rounded-lg">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
            </div>
             <p className="text-green-400 text-xs mt-4">+5% from last week</p>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Vulnerabilities Found</p>
                <h3 className="text-3xl font-bold mt-1">85,291</h3>
              </div>
              <div className="bg-red-900/30 p-3 rounded-lg">
                <Activity className="w-6 h-6 text-red-400" />
              </div>
            </div>
             <p className="text-gray-400 text-xs mt-4">Across all user scans</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h3 className="text-lg font-semibold mb-6">Download Trends</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151' }}
                    itemStyle={{ color: '#e5e7eb' }}
                  />
                  <Bar dataKey="downloads" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h3 className="text-lg font-semibold mb-6">Active User Growth</h3>
             <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151' }}
                    itemStyle={{ color: '#e5e7eb' }}
                  />
                  <Line type="monotone" dataKey="activeUsers" stroke="#8b5cf6" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

         {/* Registered Users Table Mock */}
         <div className="mt-8 bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
             <div className="px-6 py-4 border-b border-gray-700">
                 <h3 className="text-lg font-semibold">Recent Registrations</h3>
             </div>
             <div className="p-0">
                 <table className="w-full text-left border-collapse">
                     <thead>
                         <tr className="bg-gray-900/50 text-gray-400 text-sm">
                             <th className="px-6 py-3 font-medium">User</th>
                             <th className="px-6 py-3 font-medium">Email</th>
                             <th className="px-6 py-3 font-medium">Plan</th>
                             <th className="px-6 py-3 font-medium">Status</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-700">
                         {[1,2,3].map((i) => (
                             <tr key={i} className="text-sm hover:bg-gray-700/50">
                                 <td className="px-6 py-4">User_{i}</td>
                                 <td className="px-6 py-4">user{i}@example.com</td>
                                 <td className="px-6 py-4">Pro Trial</td>
                                 <td className="px-6 py-4"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900 text-green-200">Active</span></td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
         </div>
      </div>
    </div>
  );
};