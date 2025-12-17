// Stub user service for standalone operation without Firebase
// All data is stored locally in localStorage

export interface ProjectHistory {
  id?: string;
  userId: string;
  projectName: string;
  projectType: 'file' | 'folder';
  fileCount: number;
  lineCount?: number;
  vulnerabilityCount: number;
  createdAt: Date;
  analyzedAt?: Date;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  apiKey?: string;
  provider?: string;
  model?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserActivity {
  id?: string;
  userId: string;
  activityType: 'login' | 'logout' | 'project_upload' | 'analysis_start' | 'analysis_complete' | 'report_generated' | 'profile_update' | 'settings_change';
  activityDetails?: {
    projectName?: string;
    fileCount?: number;
    vulnerabilityCount?: number;
    provider?: string;
    model?: string;
    [key: string]: any;
  };
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

// Local storage helpers
const getStorageKey = (key: string) => `wiqaya_${key}`;

export const saveProjectHistory = async (projectData: Omit<ProjectHistory, 'id'>): Promise<string | null> => {
  try {
    const key = getStorageKey('projectHistory');
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    const newProject = {
      ...projectData,
      id: 'local-' + Date.now(),
      createdAt: projectData.createdAt || new Date(),
      analyzedAt: projectData.analyzedAt || new Date()
    };
    existing.push(newProject);
    localStorage.setItem(key, JSON.stringify(existing));
    return newProject.id || null;
  } catch (error) {
    console.error("Error saving project history:", error);
    return null;
  }
};

export const getUserProjectHistory = async (userId: string): Promise<ProjectHistory[]> => {
  try {
    const key = getStorageKey('projectHistory');
    const allProjects = JSON.parse(localStorage.getItem(key) || '[]');
    return allProjects.filter((p: ProjectHistory) => p.userId === userId);
  } catch (error) {
    console.error("Error fetching project history:", error);
    return [];
  }
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const key = getStorageKey(`profile_${userId}`);
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};

export const saveUserProfile = async (profile: Partial<UserProfile> & { uid: string }): Promise<boolean> => {
  try {
    const key = getStorageKey(`profile_${profile.uid}`);
    const existing = await getUserProfile(profile.uid);
    const profileData: UserProfile = {
      ...existing,
      ...profile,
      uid: profile.uid,
      createdAt: existing?.createdAt || new Date(),
      updatedAt: new Date()
    } as UserProfile;
    localStorage.setItem(key, JSON.stringify(profileData));
    return true;
  } catch (error) {
    console.error("Error saving user profile:", error);
    return false;
  }
};

export const deleteUserAccount = async (userId: string, username: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Delete profile
    localStorage.removeItem(getStorageKey(`profile_${userId}`));
    // Delete project history
    const key = getStorageKey('projectHistory');
    const allProjects = JSON.parse(localStorage.getItem(key) || '[]');
    const filtered = allProjects.filter((p: ProjectHistory) => p.userId !== userId);
    localStorage.setItem(key, JSON.stringify(filtered));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const logUserActivity = async (activity: Omit<UserActivity, 'id' | 'timestamp'> & { timestamp?: Date }): Promise<string | null> => {
  try {
    const key = getStorageKey('activities');
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    const newActivity = {
      ...activity,
      id: 'local-' + Date.now(),
      timestamp: activity.timestamp || new Date()
    };
    existing.push(newActivity);
    // Keep only last 100 activities
    const trimmed = existing.slice(-100);
    localStorage.setItem(key, JSON.stringify(trimmed));
    return newActivity.id || null;
  } catch (error) {
    console.error("Error logging user activity:", error);
    return null;
  }
};

export const getUserActivities = async (userId: string, limit: number = 50): Promise<UserActivity[]> => {
  try {
    const key = getStorageKey('activities');
    const allActivities = JSON.parse(localStorage.getItem(key) || '[]');
    const userActivities = allActivities
      .filter((a: UserActivity) => a.userId === userId)
      .sort((a: UserActivity, b: UserActivity) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, limit);
    return userActivities;
  } catch (error) {
    console.error("Error fetching user activities:", error);
    return [];
  }
};
