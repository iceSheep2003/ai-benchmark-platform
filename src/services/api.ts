import axios from 'axios';
import { getApiV1Base } from './apiV1Base';

const api = axios.create({
  baseURL: getApiV1Base(),
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error('[API Error]', err.response?.status, err.response?.data);
    return Promise.reject(err);
  },
);

export default api;
