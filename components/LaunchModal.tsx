import React, { useState, useEffect } from 'react';
import { X, Key, Loader2, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { getCurrentUser } from '../services/authService';
import { getUserProfile } from '../services/userService';
import { fetchOpenAIModels, fetchGeminiModels, fetchDeepSeekModels, fetchGroqModels, ModelInfo } from '../services/modelService';
import { AppRoute } from '../types';

interface LaunchModalProps {
  onClose: () => void;
  onLaunch: (apiKey: string, provider: string, model: string) => void;
}

// Helper function to detect provider from API key format
const detectProviderFromKey = (apiKey: string): string | null => {
  if (!apiKey || apiKey.length < 10) return null;
  
  // OpenAI keys typically start with "sk-"
  if (apiKey.startsWith('sk-')) {
    return 'openai';
  }
  
  // Gemini keys are typically longer and don't have a specific prefix, but often contain "AIza"
  if (apiKey.includes('AIza') || apiKey.length > 35) {
    return 'gemini';
  }
  
  // Groq keys are typically "gsk_" prefix
  if (apiKey.startsWith('gsk_')) {
    return 'groq';
  }
  
  // DeepSeek keys might have specific format
  if (apiKey.length > 40) {
    // Could be DeepSeek, but hard to distinguish from Gemini
    // We'll try Gemini first as it's more common
    return 'gemini';
  }
  
  return null;
};

// Test API key to detect provider
const testApiKeyProvider = async (apiKey: string): Promise<string | null> => {
  // Try Gemini first (most common)
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
      method: 'GET',
    });
    if (response.ok) {
      return 'gemini';
    }
  } catch (e) {
    // Not Gemini
  }
  
  // Try OpenAI
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    if (response.ok) {
      return 'openai';
    }
  } catch (e) {
    // Not OpenAI
  }
  
  // Try Groq
  try {
    const response = await fetch('https://api.groq.com/openai/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    if (response.ok) {
      return 'groq';
    }
  } catch (e) {
    // Not Groq
  }
  
  // Try DeepSeek
  try {
    const response = await fetch('https://api.deepseek.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    if (response.ok) {
      return 'deepseek';
    }
  } catch (e) {
    // Not DeepSeek
  }
  
  return null;
};

export const LaunchModal: React.FC<LaunchModalProps> = ({ onClose, onLaunch }) => {
  const [step, setStep] = useState<'checking' | 'confirm' | 'select' | 'loading'>('checking');
  const [savedApiKey, setSavedApiKey] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [provider, setProvider] = useState<string>('');
  const [detectedProvider, setDetectedProvider] = useState<string>('');
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    checkSavedApiKey();
  }, []);

  const checkSavedApiKey = async () => {
    setLoading(true);
    try {
      const user = getCurrentUser();
      if (!user) {
        setStep('select');
        setLoading(false);
        return;
      }

      const profile = await getUserProfile(user.uid);
      if (profile && profile.apiKey) {
        setSavedApiKey(profile.apiKey);
        setApiKey(profile.apiKey);
        
        // Use saved provider if available
        if (profile.provider) {
          setDetectedProvider(profile.provider);
          setProvider(profile.provider);
          await loadModelsForProvider(profile.provider, profile.apiKey);
          
          // Set saved model if available
          if (profile.model) {
            setSelectedModel(profile.model);
          }
          
          setStep('confirm');
        } else {
          // Try to detect provider
          const detected = detectProviderFromKey(profile.apiKey);
          if (detected) {
            setDetectedProvider(detected);
            setProvider(detected);
            await loadModelsForProvider(detected, profile.apiKey);
            setStep('confirm');
          } else {
            // Try to test the API key
            const tested = await testApiKeyProvider(profile.apiKey);
            if (tested) {
              setDetectedProvider(tested);
              setProvider(tested);
              await loadModelsForProvider(tested, profile.apiKey);
              setStep('confirm');
            } else {
              setStep('select');
            }
          }
        }
      } else {
        setStep('select');
      }
    } catch (error) {
      console.error("Error checking saved API key:", error);
      setStep('select');
    } finally {
      setLoading(false);
    }
  };

  const loadModelsForProvider = async (providerName: string, key: string) => {
    setLoading(true);
    setError('');
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
          setError(`Provider ${providerName} not supported`);
          return;
      }
      
      setAvailableModels(models);
      if (models.length > 0) {
        setSelectedModel(models[0].id);
      }
    } catch (error: any) {
      console.error("Error loading models:", error);
      setError(`Failed to load models: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUseSavedKey = () => {
    if (detectedProvider && selectedModel) {
      onLaunch(savedApiKey, detectedProvider, selectedModel);
    } else {
      setStep('select');
    }
  };

  const handleEnterNewKey = () => {
    setStep('select');
    setApiKey('');
    setProvider('');
    setDetectedProvider('');
  };

  const handleProviderChange = async (newProvider: string) => {
    setProvider(newProvider);
    setSelectedModel('');
    setAvailableModels([]);
    
    if (apiKey) {
      await loadModelsForProvider(newProvider, apiKey);
    }
  };

  const handleApiKeyChange = async (newKey: string) => {
    setApiKey(newKey);
    setError('');
    
    if (newKey.length > 20) {
      // Try to auto-detect provider
      const detected = detectProviderFromKey(newKey);
      if (detected && detected !== provider) {
        setProvider(detected);
        setDetectedProvider(detected);
        await loadModelsForProvider(detected, newKey);
      }
    }
  };

  const handleLaunch = () => {
    if (!apiKey) {
      setError('Please enter an API key');
      return;
    }
    
    if (!provider) {
      setError('Please select a provider');
      return;
    }
    
    if (!selectedModel && provider !== 'ollama') {
      setError('Please select a model');
      return;
    }
    
    onLaunch(apiKey, provider, selectedModel);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-md animate-fade-in px-4">
      <div className="bg-[#1e1e24] border border-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-blue-500" />
            <h2 className="text-2xl font-bold text-white">Launch WiqayaX</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'checking' && (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-300">Checking your saved API key...</p>
          </div>
        )}

        {step === 'confirm' && savedApiKey && (
          <div className="space-y-6">
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-blue-400 font-semibold mb-2">Saved API Key Found</h3>
                  <p className="text-gray-300 text-sm mb-2">
                    We found a saved API key in your profile. Detected provider: <strong className="text-white">{detectedProvider}</strong>
                  </p>
                  <p className="text-gray-400 text-xs">
                    Key: {savedApiKey.substring(0, 8)}...{savedApiKey.substring(savedApiKey.length - 4)}
                  </p>
                </div>
              </div>
            </div>

            {availableModels.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Select Model ({detectedProvider})
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-[#0a0a0c] border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                >
                  {availableModels.map(model => (
                    <option key={model.id} value={model.id}>
                      {model.name} {model.description ? `- ${model.description}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {error && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleEnterNewKey}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-800 transition-colors"
              >
                Enter New Key
              </button>
              <button
                onClick={handleUseSavedKey}
                disabled={!selectedModel || loading}
                className="flex-1 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Use Saved Key & Launch
              </button>
            </div>
          </div>
        )}

        {step === 'select' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                <Key className="w-4 h-4" /> API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                placeholder="Enter your API key"
                className="w-full bg-[#0a0a0c] border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                We'll try to auto-detect the provider from your API key
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">AI Provider</label>
              <select
                value={provider}
                onChange={(e) => handleProviderChange(e.target.value)}
                className="w-full bg-[#0a0a0c] border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select Provider</option>
                <option value="gemini">Google Gemini</option>
                <option value="openai">OpenAI</option>
                <option value="deepseek">DeepSeek</option>
                <option value="groq">Groq</option>
                <option value="ollama">Local LLM (Ollama)</option>
              </select>
            </div>

            {provider && provider !== 'ollama' && availableModels.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Select Model</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-[#0a0a0c] border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                >
                  {availableModels.map(model => (
                    <option key={model.id} value={model.id}>
                      {model.name} {model.description ? `- ${model.description}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {provider === 'ollama' && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Ollama Endpoint</label>
                <input
                  type="text"
                  value="http://localhost:11434"
                  readOnly
                  className="w-full bg-[#0a0a0c] border border-gray-700 rounded-lg px-4 py-2 text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Make sure Ollama is running locally
                </p>
              </div>
            )}

            {loading && (
              <div className="text-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
                <p className="text-gray-400 text-sm mt-2">Loading available models...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLaunch}
                disabled={!apiKey || !provider || (!selectedModel && provider !== 'ollama') || loading}
                className="flex-1 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Launch App
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

