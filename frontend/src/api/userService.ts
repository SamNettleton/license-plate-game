import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: BASE_URL,
});

export const syncUser = async (userId: string, displayName: string) => {
  await api.post('/users/sync', {
    user_id: userId,
    display_name: displayName,
  });
};
