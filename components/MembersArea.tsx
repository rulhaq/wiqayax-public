import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Settings, Trash2, Save, Key, Mail, X, AlertTriangle, Loader2, Cpu } from 'lucide-react';
import { AppRoute } from '../types';
import { getCurrentUser, signOut } from '../services/authService';
import { getUserProfile, saveUserProfile, deleteUserAccount, logUserActivity } from '../services/userService';
import { fetchOpenAIModels, fetchGeminiModels, fetchDeepSeekModels, fetchGroqModels, ModelInfo } from '../services/modelService';
import { UserDashboard } from './UserDashboard';

interface MembersProps {
  onNavigate: (route: AppRoute) => void;
}

export const MembersArea: React.FC<MembersProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile'>('dashboard');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteUsername, setDeleteUsername] = useState('');
  const [deleting, setDeleting] = useState(false);
  
  // Profile form state
  const [displayName, setDisplayName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState<string>('gemini');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setDisplayName(currentUser.displayName || '');
      loadProfile(currentUser.uid);
      
      // Check if we should show profile tab (from localStorage flag)
      const showProfile = localStorage.getItem('showProfileTab') === 'true';
      if (showProfile) {
        setActiveTab('profile');
        localStorage.removeItem('showProfileTab');
      }
    } else {
      onNavigate(AppRoute.LANDING);
    }
  }, []);

  // Listen for custom event to switch to profile tab
  useEffect(() => {
    const handleSwitchToProfile = () => {
      setActiveTab('profile');
    };

    window.addEventListener('switchToProfileTab', handleSwitchToProfile);
    return () => window.removeEventListener('switchToProfileTab', handleSwitchToProfile);
  }, []);

  const loadProfile = async (userId: string) => {
    setLoading(true);
    try {
      const currentUser = getCurrentUser();
      const userProfile = await getUserProfile(userId);
      if (userProfile) {
        setProfile(userProfile);
        setApiKey(userProfile.apiKey || '');
        setProvider(userProfile.provider || 'gemini');
        setSelectedModel(userProfile.model || '');
        // Update displayName from profile if available
        if (userProfile.displayName) {
          setDisplayName(userProfile.displayName);
        }
        
        // Load models if API key and provider are available
        if (userProfile.apiKey && userProfile.provider && userProfile.provider !== 'ollama') {
          loadModelsForProvider(userProfile.provider, userProfile.apiKey);
        }
      } else {
        // Create profile if doesn't exist
        const newProfile = {
          uid: userId,
          email: currentUser?.email || user?.email || '',
          displayName: currentUser?.displayName || user?.displayName || '',
          photoURL: currentUser?.photoURL || user?.photoURL || '',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        const saved = await saveUserProfile(newProfile);
        if (saved) {
          setProfile(newProfile);
          // Set display name from newly created profile
          if (newProfile.displayName) {
            setDisplayName(newProfile.displayName);
          }
        } else {
          // Permission error - show helpful message
          alert("⚠️ Firestore Setup Required\n\nPlease set up Firestore security rules:\n\n1. Go to https://console.firebase.google.com/\n2. Select project: wiqayax\n3. Open Firestore Database > Rules\n4. Copy rules from firestore.rules file\n5. Paste and click Publish\n\nSee QUICK_FIX.md for detailed instructions.");
        }
      }
    } catch (error: any) {
      console.error("Error loading profile:", error);
      if (error.code === 'permission-denied') {
        alert("⚠️ Firestore Permission Error\n\nPlease set up Firestore security rules in Firebase Console.\n\nSee QUICK_FIX.md file for step-by-step instructions.");
      } else {
        alert("Failed to load profile. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadModelsForProvider = async (providerName: string, key: string) => {
    if (!key || providerName === 'ollama') {
      setAvailableModels([]);
      return;
    }
    
    setLoadingModels(true);
    try {
      let models: ModelInfo[] = [];
      
      switch (providerName) {
        case 'gemini':
          models = await fetchGeminiModels(key);
          break;
        case 'openai':
          models = await fetchOpenAIModels(key);
          break;
        case 'groq':
          models = await fetchGroqModels(key);
          break;
        case 'deepseek':
          models = await fetchDeepSeekModels(key);
          break;
        default:
          setAvailableModels([]);
          return;
      }
      
      setAvailableModels(models);
      
      // If saved model exists in available models, keep it; otherwise select first
      if (selectedModel && models.some(m => m.id === selectedModel)) {
        // Keep current selection
      } else if (models.length > 0) {
        setSelectedModel(models[0].id);
      }
    } catch (error: any) {
      console.error("Error loading models:", error);
      setAvailableModels([]);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleProviderChange = async (newProvider: string) => {
    setProvider(newProvider);
    setSelectedModel('');
    setAvailableModels([]);
    
    if (apiKey && newProvider !== 'ollama') {
      await loadModelsForProvider(newProvider, apiKey);
    }
  };

  const handleApiKeyChange = async (newKey: string) => {
    setApiKey(newKey);
    
    if (newKey && provider && provider !== 'ollama') {
      await loadModelsForProvider(provider, newKey);
    } else {
      setAvailableModels([]);
      setSelectedModel('');
    }
  };

  const handleSaveProfile = async () => {
    if (!user) {
      alert("You must be logged in to save your profile.");
      return;
    }
    setSaving(true);
    try {
      const success = await saveUserProfile({
        uid: user.uid,
        email: user.email || '',
        displayName: displayName.trim() || user.displayName || '',
        apiKey: apiKey.trim() || undefined,
        provider: provider || undefined,
        model: selectedModel || undefined,
        updatedAt: new Date()
      });
      
      if (!success) {
        throw new Error("Failed to save profile");
      }
      
      // Update local storage
      if (apiKey.trim()) {
        localStorage.setItem('wiqaya_api_key', apiKey.trim());
        localStorage.setItem('wiqaya_selected_provider', provider);
        if (selectedModel) {
          localStorage.setItem('wiqaya_selected_model', selectedModel);
        } else {
          localStorage.removeItem('wiqaya_selected_model');
        }
      } else {
        localStorage.removeItem('wiqaya_api_key');
        localStorage.removeItem('wiqaya_selected_provider');
        localStorage.removeItem('wiqaya_selected_model');
      }
      
      // Update Firebase Auth display name if changed
      if (displayName.trim() && displayName.trim() !== user.displayName) {
        try {
          const { updateProfile } = await import('firebase/auth');
          if (user && updateProfile) {
            await updateProfile(user, { displayName: displayName.trim() });
            // Update local user state
            setUser({ ...user, displayName: displayName.trim() });
          }
        } catch (updateError) {
          console.warn("Could not update Firebase Auth display name:", updateError);
          // Continue anyway - profile is saved in Firestore
        }
      }
      
      // Log activity
      await logUserActivity({
        userId: user.uid,
        activityType: 'profile_update',
        activityDetails: {
          updatedFields: [
            'displayName', 
            apiKey.trim() ? 'apiKey' : null,
            provider ? 'provider' : null,
            selectedModel ? 'model' : null
          ].filter(Boolean)
        }
      });
      
      alert("Profile saved successfully!");
      // Reload profile to ensure UI is in sync
      await loadProfile(user.uid);
    } catch (error: any) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile: " + (error.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    const usernameToMatch = displayName || user.email?.split('@')[0] || '';
    if (deleteUsername !== usernameToMatch) {
      alert("Username does not match. Please enter your username correctly.");
      return;
    }

    setDeleting(true);
    try {
      const result = await deleteUserAccount(user.uid, deleteUsername);
      if (result.success) {
        alert("Account deleted successfully");
        await signOut();
        onNavigate(AppRoute.LANDING);
      } else {
        alert("Failed to delete account: " + (result.error || "Unknown error"));
      }
    } catch (error: any) {
      console.error("Error deleting account:", error);
      alert("Failed to delete account: " + error.message);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
      setDeleteUsername('');
    }
  };

  if (activeTab === 'dashboard') {
    return <UserDashboard onNavigate={onNavigate} onSwitchToProfile={() => setActiveTab('profile')} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => onNavigate(AppRoute.EDITOR)}
              className="p-2 bg-gray-800 rounded hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-3xl font-bold">Profile Settings</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'dashboard' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'profile' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Profile
            </button>
          </div>
        </div>

        {/* Profile Section */}
        <div className="bg-[#12141a] border border-gray-800 rounded-2xl p-8 mb-8">
          <div className="flex items-center gap-4 mb-8">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-16 h-16 rounded-full" />
            ) : (
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-2xl font-bold">
                {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold">{user?.displayName || 'User'}</h2>
              <p className="text-gray-400">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                <User className="w-4 h-4" /> Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={user?.email?.split('@')[0] || "Your display name"}
                className="w-full bg-[#0a0a0c] border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                disabled={saving}
              />
              <p className="text-xs text-gray-500 mt-1">This name will be displayed in the app and PDF reports</p>
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" /> Email
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full bg-[#0a0a0c] border border-gray-700 rounded-lg px-4 py-2 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            {/* API Key Storage */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                <Key className="w-4 h-4" /> API Key (Optional)
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                placeholder="Enter API key to save in profile"
                className="w-full bg-[#0a0a0c] border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                disabled={saving}
              />
              <p className="text-xs text-gray-500 mt-1">Your API key will be securely stored and used when you launch the app. Leave empty to remove saved key.</p>
            </div>

            {/* Provider Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                <Cpu className="w-4 h-4" /> AI Provider
              </label>
              <select
                value={provider}
                onChange={(e) => handleProviderChange(e.target.value)}
                className="w-full bg-[#0a0a0c] border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                disabled={saving || loadingModels}
              >
                <option value="gemini">Google Gemini</option>
                <option value="openai">OpenAI</option>
                <option value="deepseek">DeepSeek</option>
                <option value="groq">Groq</option>
                <option value="ollama">Local LLM (Ollama)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {apiKey ? 'Select the provider for your API key' : 'Select your preferred AI provider (enter API key to load models)'}
              </p>
            </div>

            {/* Model Selection */}
            {apiKey && provider && provider !== 'ollama' && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Model</label>
                {loadingModels ? (
                  <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading models...
                  </div>
                ) : availableModels.length > 0 ? (
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                    disabled={saving}
                  >
                    {availableModels.map(model => (
                      <option key={model.id} value={model.id}>
                        {model.name} {model.description ? `- ${model.description}` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-gray-500 py-2">Enter API key and select provider to load available models</p>
                )}
                <p className="text-xs text-gray-500 mt-1">Select the model to use for code analysis</p>
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  // Reset to saved values
                  if (profile) {
                    setDisplayName(profile.displayName || user?.displayName || '');
                    setApiKey(profile.apiKey || '');
                    setProvider(profile.provider || 'gemini');
                    setSelectedModel(profile.model || '');
                    if (profile.apiKey && profile.provider && profile.provider !== 'ollama') {
                      loadModelsForProvider(profile.provider, profile.apiKey);
                    }
                  }
                }}
                disabled={saving}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reset
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={saving || !user}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-[#12141a] border border-red-500/30 rounded-2xl p-8">
          <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Danger Zone
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            Deleting your account will permanently remove all your project history and profile data. This action cannot be undone.
          </p>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Delete Account
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-md animate-fade-in px-4">
          <div className="bg-[#1e1e24] border border-red-500/30 rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3 text-white">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                <h2 className="text-xl font-bold">Delete Account</h2>
              </div>
              <button onClick={() => { setShowDeleteConfirm(false); setDeleteUsername(''); }}>
                <X className="w-5 h-5 text-gray-400 hover:text-white" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-300 mb-4">
                This will permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-4">
                <p className="text-red-400 text-sm font-medium mb-2">What will be deleted:</p>
                <ul className="list-disc pl-5 space-y-1 text-gray-300 text-sm">
                  <li>Your profile information</li>
                  <li>All project history</li>
                  <li>Saved API keys</li>
                  <li>Account authentication</li>
                </ul>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Type your username to confirm: <strong className="text-white">{displayName || user?.email?.split('@')[0] || 'your username'}</strong>
                </label>
                <input
                  type="text"
                  value={deleteUsername}
                  onChange={(e) => setDeleteUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full bg-[#0a0a0c] border border-red-500/50 rounded-lg px-4 py-2 text-white focus:border-red-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteUsername(''); }}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || deleteUsername !== (displayName || user?.email?.split('@')[0] || '')}
                className="flex-1 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};