import React, { useState, useEffect } from 'react';
import { ArrowLeft, FileText, Folder, Calendar, AlertTriangle, Download, Shield } from 'lucide-react';
import { AppRoute } from '../types';
import { getUserProjectHistory, ProjectHistory } from '../services/userService';
import { getCurrentUser } from '../services/authService';

interface UserDashboardProps {
  onNavigate: (route: AppRoute) => void;
  onSwitchToProfile?: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ onNavigate, onSwitchToProfile }) => {
  const [projects, setProjects] = useState<ProjectHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      loadProjects(currentUser.uid);
    } else {
      onNavigate(AppRoute.LANDING);
    }
  }, []);

  const loadProjects = async (userId: string) => {
    setLoading(true);
    try {
      const projectHistory = await getUserProjectHistory(userId);
      // Sort by date, newest first
      projectHistory.sort((a, b) => {
        const dateA = a.analyzedAt || a.createdAt;
        const dateB = b.analyzedAt || b.createdAt;
        return dateB.getTime() - dateA.getTime();
      });
      setProjects(projectHistory);
    } catch (error: any) {
      console.error("Error loading projects:", error);
      if (error.code === 'permission-denied') {
        // Show user-friendly error
        alert("⚠️ Firestore Permission Error\n\nPlease set up Firestore security rules:\n\n1. Go to Firebase Console\n2. Open Firestore Database > Rules\n3. Copy rules from firestore.rules file\n4. Paste and click Publish\n\nSee QUICK_FIX.md for detailed instructions.");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => onNavigate(AppRoute.EDITOR)}
              className="p-2 bg-gray-800 rounded hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-gray-400 text-sm mt-1">Your project analysis history</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (onSwitchToProfile) {
                // If we're already in MembersArea, just switch tabs directly
                onSwitchToProfile();
              } else {
                // Otherwise navigate to MembersArea and trigger profile tab switch
                onNavigate(AppRoute.MEMBERS);
                // Use a small delay to ensure MembersArea is mounted, then dispatch event
                setTimeout(() => {
                  window.dispatchEvent(new Event('switchToProfileTab'));
                }, 50);
              }
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
          >
            Profile Settings
          </button>
        </div>

        {/* Important Notice */}
        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <Shield className="w-6 h-6 text-yellow-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-yellow-400 font-bold mb-2">Privacy Notice</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                <strong className="text-white">We do not store any of your code.</strong> WiqayaX runs entirely in your browser's memory. 
                This dashboard only tracks project metadata (name, file count, vulnerability count, dates) - never your actual source code.
              </p>
              <p className="text-gray-400 text-sm mt-2">
                ⚠️ Please ensure to download your PDF reports and secure project ZIP files once analysis completes, as all data is stored in browser memory only.
              </p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#12141a] border border-gray-800 rounded-xl p-6">
            <div className="text-3xl font-bold text-blue-400 mb-1">{projects.length}</div>
            <div className="text-gray-400 text-sm">Total Projects</div>
          </div>
          <div className="bg-[#12141a] border border-gray-800 rounded-xl p-6">
            <div className="text-3xl font-bold text-green-400 mb-1">
              {projects.reduce((sum, p) => sum + p.fileCount, 0)}
            </div>
            <div className="text-gray-400 text-sm">Files Analyzed</div>
          </div>
          <div className="bg-[#12141a] border border-gray-800 rounded-xl p-6">
            <div className="text-3xl font-bold text-red-400 mb-1">
              {projects.reduce((sum, p) => sum + p.vulnerabilityCount, 0)}
            </div>
            <div className="text-gray-400 text-sm">Issues Found</div>
          </div>
          <div className="bg-[#12141a] border border-gray-800 rounded-xl p-6">
            <div className="text-3xl font-bold text-purple-400 mb-1">
              {projects.filter(p => p.vulnerabilityCount > 0).length}
            </div>
            <div className="text-gray-400 text-sm">Projects with Issues</div>
          </div>
        </div>

        {/* Projects Table */}
        <div className="bg-[#12141a] border border-gray-800 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-xl font-bold">Project History</h2>
          </div>
          
          {loading ? (
            <div className="p-12 text-center text-gray-400">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              Loading projects...
            </div>
          ) : projects.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg mb-2">No projects analyzed yet</p>
              <p className="text-sm">Start analyzing your code to see project history here</p>
              <button
                onClick={() => onNavigate(AppRoute.EDITOR)}
                className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
              >
                Go to Editor
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#0a0a0c] border-b border-gray-800">
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold text-gray-400">Project Name</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-400">Type</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-400">Files</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-400">Issues</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-400">Analyzed</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => (
                    <tr key={project.id} className="border-b border-gray-800 hover:bg-[#1a1c22] transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {project.projectType === 'folder' ? (
                            <Folder className="w-4 h-4 text-blue-400" />
                          ) : (
                            <FileText className="w-4 h-4 text-gray-400" />
                          )}
                          <span className="font-medium">{project.projectName}</span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-400 text-sm capitalize">{project.projectType}</td>
                      <td className="p-4 text-gray-300">{project.fileCount}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          project.vulnerabilityCount === 0 
                            ? 'bg-green-900/30 text-green-400' 
                            : project.vulnerabilityCount > 10
                            ? 'bg-red-900/30 text-red-400'
                            : 'bg-yellow-900/30 text-yellow-400'
                        }`}>
                          {project.vulnerabilityCount}
                        </span>
                      </td>
                      <td className="p-4 text-gray-400 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {formatDate(project.analyzedAt || project.createdAt)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

