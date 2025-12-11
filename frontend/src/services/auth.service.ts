import api from '@/lib/api';

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface UpdateTokensData {
  githubToken?: string;
  gitlabToken?: string;
  discordBotToken?: string;
}

export const authService = {
  register: async (data: RegisterData) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (data: LoginData) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  updateTokens: async (data: UpdateTokensData) => {
    const response = await api.put('/auth/tokens', data);
    return response.data;
  },
};
