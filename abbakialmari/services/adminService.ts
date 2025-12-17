import { collection, getDocs, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { UserProfile, UserActivity, ProjectHistory } from '../../services/userService';

export interface AdminStats {
  totalUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  totalProjects: number;
  projectsToday: number;
  projectsThisWeek: number;
  projectsThisMonth: number;
  totalLinesAnalyzed: number;
  linesAnalyzedToday: number;
  linesAnalyzedThisWeek: number;
  linesAnalyzedThisMonth: number;
  totalAnalyses: number;
  analysesToday: number;
  analysesThisWeek: number;
  analysesThisMonth: number;
  providerUsage: {
    [provider: string]: number;
  };
}

export interface UserWithStats extends UserProfile {
  projectCount: number;
  totalLinesAnalyzed: number;
  lastActivity?: Date;
  provider?: string;
}

// Get all users
export const getAllUsers = async (): Promise<UserWithStats[]> => {
  if (!db) {
    console.error("Firestore not available");
    return [];
  }

  try {
    const usersSnapshot = await getDocs(collection(db, 'userProfiles'));
    const users = usersSnapshot.docs.map(doc => ({
      ...doc.data(),
      uid: doc.id
    })) as UserProfile[];

    // Get project history for each user
    const projectsSnapshot = await getDocs(collection(db, 'projectHistory'));
    const projects = projectsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      analyzedAt: doc.data().analyzedAt?.toDate()
    })) as ProjectHistory[];

    // Get activities for each user
    const activitiesSnapshot = await getDocs(collection(db, 'userActivities'));
    const activities = activitiesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date()
    })) as UserActivity[];

    // Combine data
    const usersWithStats: UserWithStats[] = users.map(user => {
      const userProjects = projects.filter(p => p.userId === user.uid);
      const userActivities = activities.filter(a => a.userId === user.uid);
      
      // Calculate total lines analyzed from projects
      const totalLines = userProjects.reduce((sum, p) => {
        // Use lineCount if available, otherwise estimate from file count
        const lineCount = (p as any).lineCount;
        if (lineCount !== undefined && lineCount !== null) {
          return sum + lineCount;
        }
        // Estimate 100 lines per file if lineCount not available
        return sum + (p.fileCount * 100);
      }, 0);

      const lastActivity = userActivities.length > 0 
        ? userActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0].timestamp
        : undefined;

      return {
        ...user,
        projectCount: userProjects.length,
        totalLinesAnalyzed: totalLines,
        lastActivity,
        provider: user.provider
      };
    });

    return usersWithStats.sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt : (a.createdAt as any)?.toDate?.() || new Date(0);
      const dateB = b.createdAt instanceof Date ? b.createdAt : (b.createdAt as any)?.toDate?.() || new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
  } catch (error) {
    console.error("Error fetching all users:", error);
    return [];
  }
};

// Get admin statistics
export const getAdminStats = async (): Promise<AdminStats> => {
  if (!db) {
    return getEmptyStats();
  }

  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get all users
    const usersSnapshot = await getDocs(collection(db, 'userProfiles'));
    const allUsers = usersSnapshot.docs.map(doc => ({
      ...doc.data(),
      uid: doc.id,
      createdAt: doc.data().createdAt?.toDate() || new Date()
    })) as (UserProfile & { createdAt: Date })[];

    // Get all projects
    const projectsSnapshot = await getDocs(collection(db, 'projectHistory'));
    const allProjects = projectsSnapshot.docs.map(doc => ({
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      analyzedAt: doc.data().analyzedAt?.toDate() || new Date()
    })) as (ProjectHistory & { createdAt: Date; analyzedAt: Date })[];

    // Get all activities
    const activitiesSnapshot = await getDocs(collection(db, 'userActivities'));
    const allActivities = activitiesSnapshot.docs.map(doc => ({
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date()
    })) as UserActivity[];

    // Filter by date
    const newUsersToday = allUsers.filter(u => u.createdAt >= todayStart).length;
    const newUsersThisWeek = allUsers.filter(u => u.createdAt >= weekStart).length;
    const newUsersThisMonth = allUsers.filter(u => u.createdAt >= monthStart).length;

    const projectsToday = allProjects.filter(p => p.createdAt >= todayStart).length;
    const projectsThisWeek = allProjects.filter(p => p.createdAt >= weekStart).length;
    const projectsThisMonth = allProjects.filter(p => p.createdAt >= monthStart).length;

    // Calculate lines analyzed
    const totalLinesAnalyzed = allProjects.reduce((sum, p) => {
      const lineCount = (p as any).lineCount;
      return sum + (lineCount !== undefined && lineCount !== null ? lineCount : (p.fileCount * 100));
    }, 0);

    const linesAnalyzedToday = allProjects
      .filter(p => p.createdAt >= todayStart)
      .reduce((sum, p) => {
        const lineCount = (p as any).lineCount;
        return sum + (lineCount !== undefined && lineCount !== null ? lineCount : (p.fileCount * 100));
      }, 0);

    const linesAnalyzedThisWeek = allProjects
      .filter(p => p.createdAt >= weekStart)
      .reduce((sum, p) => {
        const lineCount = (p as any).lineCount;
        return sum + (lineCount !== undefined && lineCount !== null ? lineCount : (p.fileCount * 100));
      }, 0);

    const linesAnalyzedThisMonth = allProjects
      .filter(p => p.createdAt >= monthStart)
      .reduce((sum, p) => {
        const lineCount = (p as any).lineCount;
        return sum + (lineCount !== undefined && lineCount !== null ? lineCount : (p.fileCount * 100));
      }, 0);

    // Count analyses
    const analysisActivities = allActivities.filter(a => 
      a.activityType === 'analysis_start' || a.activityType === 'analysis_complete'
    );
    const analysesToday = analysisActivities.filter(a => a.timestamp >= todayStart).length;
    const analysesThisWeek = analysisActivities.filter(a => a.timestamp >= weekStart).length;
    const analysesThisMonth = analysisActivities.filter(a => a.timestamp >= monthStart).length;

    // Count provider usage
    const providerUsage: { [provider: string]: number } = {};
    allActivities.forEach(activity => {
      if (activity.activityDetails?.provider) {
        const provider = activity.activityDetails.provider;
        providerUsage[provider] = (providerUsage[provider] || 0) + 1;
      }
    });

    // Also count from user profiles
    allUsers.forEach(user => {
      if (user.provider) {
        providerUsage[user.provider] = (providerUsage[user.provider] || 0) + 1;
      }
    });

    return {
      totalUsers: allUsers.length,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      totalProjects: allProjects.length,
      projectsToday,
      projectsThisWeek,
      projectsThisMonth,
      totalLinesAnalyzed,
      linesAnalyzedToday,
      linesAnalyzedThisWeek,
      linesAnalyzedThisMonth,
      totalAnalyses: analysisActivities.length,
      analysesToday,
      analysesThisWeek,
      analysesThisMonth,
      providerUsage
    };
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return getEmptyStats();
  }
};

// Get all user activities
export const getAllUserActivities = async (limit: number = 1000): Promise<UserActivity[]> => {
  if (!db) {
    return [];
  }

  try {
    const activitiesSnapshot = await getDocs(
      query(collection(db, 'userActivities'), orderBy('timestamp', 'desc'))
    );
    
    const activities = activitiesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date()
    })) as UserActivity[];

    return activities.slice(0, limit);
  } catch (error) {
    console.error("Error fetching all activities:", error);
    return [];
  }
};

// Get code analyzed per day
export const getCodeAnalyzedPerDay = async (days: number = 30): Promise<{ date: string; lines: number; projects: number }[]> => {
  if (!db) {
    return [];
  }

  try {
    const projectsSnapshot = await getDocs(collection(db, 'projectHistory'));
    const projects = projectsSnapshot.docs.map(doc => ({
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    })) as (ProjectHistory & { createdAt: Date })[];

    const now = new Date();
    const result: { [date: string]: { lines: number; projects: number } } = {};

    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      result[dateStr] = { lines: 0, projects: 0 };
    }

    projects.forEach(project => {
      const dateStr = project.createdAt.toISOString().split('T')[0];
      if (result[dateStr]) {
        result[dateStr].projects += 1;
        const lineCount = (project as any).lineCount;
        result[dateStr].lines += (lineCount !== undefined && lineCount !== null ? lineCount : (project.fileCount * 100));
      }
    });

    return Object.entries(result)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error("Error fetching code analyzed per day:", error);
    return [];
  }
};

function getEmptyStats(): AdminStats {
  return {
    totalUsers: 0,
    newUsersToday: 0,
    newUsersThisWeek: 0,
    newUsersThisMonth: 0,
    totalProjects: 0,
    projectsToday: 0,
    projectsThisWeek: 0,
    projectsThisMonth: 0,
    totalLinesAnalyzed: 0,
    linesAnalyzedToday: 0,
    linesAnalyzedThisWeek: 0,
    linesAnalyzedThisMonth: 0,
    totalAnalyses: 0,
    analysesToday: 0,
    analysesThisWeek: 0,
    analysesThisMonth: 0,
    providerUsage: {}
  };
}

