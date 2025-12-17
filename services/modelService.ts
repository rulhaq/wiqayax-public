// Service to fetch available models from different providers

export interface ModelInfo {
  id: string;
  name: string;
  description?: string;
}

// Fetch OpenAI models
export const fetchOpenAIModels = async (apiKey: string): Promise<ModelInfo[]> => {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch OpenAI models');
    }

    const data = await response.json();
    // Filter for chat/completion models
    const chatModels = data.data
      .filter((model: any) => 
        model.id.includes('gpt') || 
        model.id.includes('o1') ||
        model.id.includes('chat')
      )
      .map((model: any) => ({
        id: model.id,
        name: model.id,
        description: model.id
      }))
      .slice(0, 20); // Limit to first 20

    return chatModels.length > 0 ? chatModels : [
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }
    ];
  } catch (error) {
    console.error('Error fetching OpenAI models:', error);
    // Return default models on error
    return [
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }
    ];
  }
};

// Fetch Gemini models
export const fetchGeminiModels = async (apiKey: string): Promise<ModelInfo[]> => {
  try {
    // Gemini API doesn't have a models endpoint, return known models
    return [
      { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash (Experimental)' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
      { id: 'gemini-pro', name: 'Gemini Pro' }
    ];
  } catch (error) {
    console.error('Error fetching Gemini models:', error);
    return [
      { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash (Experimental)' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' }
    ];
  }
};

// Fetch DeepSeek models
export const fetchDeepSeekModels = async (apiKey: string): Promise<ModelInfo[]> => {
  try {
    const response = await fetch('https://api.deepseek.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch DeepSeek models');
    }

    const data = await response.json();
    return data.data
      .map((model: any) => ({
        id: model.id,
        name: model.id,
        description: model.id
      }))
      .slice(0, 10);
  } catch (error) {
    console.error('Error fetching DeepSeek models:', error);
    return [
      { id: 'deepseek-chat', name: 'DeepSeek Chat' },
      { id: 'deepseek-coder', name: 'DeepSeek Coder' }
    ];
  }
};

// Fetch Groq models
export const fetchGroqModels = async (apiKey: string): Promise<ModelInfo[]> => {
  try {
    // Sanitize API key to ensure it's valid for headers
    const sanitizedApiKey = apiKey.trim();
    if (!sanitizedApiKey || sanitizedApiKey.length === 0) {
      throw new Error('Groq API key is required');
    }
    
    // Use proxy in development to avoid CORS issues
    const apiUrl = import.meta.env.DEV 
      ? '/api/groq/openai/v1/models'
      : 'https://api.groq.com/openai/v1/models';
    
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${sanitizedApiKey}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
      if (response.status === 401) {
        throw new Error('Invalid API Key. Please check your Groq API key.');
      }
      throw new Error(`Failed to fetch Groq models: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    if (!data.data || !Array.isArray(data.data)) {
      throw new Error('Invalid response format from Groq API');
    }
    
    return data.data
      .map((model: any) => ({
        id: model.id,
        name: model.id.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        description: model.id
      }))
      .slice(0, 15);
  } catch (error: any) {
    console.error('Error fetching Groq models:', error);
    // Return common Groq models as fallback
    return [
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant' },
      { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B Versatile' },
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' },
      { id: 'gemma2-9b-it', name: 'Gemma2 9B' }
    ];
  }
};

// Fetch Ollama models
export const fetchOllamaModels = async (endpoint: string): Promise<ModelInfo[]> => {
  try {
    const baseUrl = endpoint.replace(/\/$/, '');
    const response = await fetch(`${baseUrl}/api/tags`);

    if (!response.ok) {
      throw new Error('Failed to fetch Ollama models');
    }

    const data = await response.json();
    return data.models
      .map((model: any) => ({
        id: model.name,
        name: model.name,
        description: model.name
      }));
  } catch (error) {
    console.error('Error fetching Ollama models:', error);
    return [
      { id: 'llama3', name: 'Llama 3' },
      { id: 'llama3.1', name: 'Llama 3.1' },
      { id: 'mistral', name: 'Mistral' }
    ];
  }
};

