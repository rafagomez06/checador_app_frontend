// src/api/client.ts
import axios from "axios";
import { getApiUrl } from "../config/configApiURL";

export const apiClient = axios.create({
  baseURL: getApiUrl(),
  timeout: 15000, // 15 segundos de espera máxima
  headers: {
    "Content-Type": "application/json",
  },
});

/*
apiClient.interceptors.request.use((config) => {
  const token = AsyncStorage.getItem('@user_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
*/
