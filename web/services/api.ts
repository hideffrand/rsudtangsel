import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

/**
 * Backend API response envelope (see server internal/dto/response/global.go).
 * Interceptors unwrap `data` on success and surface `message` on error, so
 * services below resolve directly to the payload.
 */
export interface ApiResponse<T> {
  success: boolean;
  status_code: number;
  data: T;
  message?: string;
}

// baseURL = proxy server-side (app/api/proxy) + prefix /api backend.
// Path service di bawah tetap relatif (mis. '/poli'), backend URL tidak diekspos.
const client: AxiosInstance = axios.create({
  baseURL: '/api/proxy/api',
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.response.use(
  (response) => {
    const body = response.data as ApiResponse<unknown>;
    // Unwrap the envelope; the typed `api` wrapper re-casts to the payload.
    return (body?.data ?? body) as unknown as typeof response;
  },
  (error) => {
    const message: string =
      error.response?.data?.message ?? error.message ?? 'Something went wrong';
    return Promise.reject(new Error(message));
  },
);

/** Typed client - resolves to the unwrapped payload (not AxiosResponse). */
export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    client.get(url, config) as unknown as Promise<T>,
  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    client.post(url, data, config) as unknown as Promise<T>,
  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    client.put(url, data, config) as unknown as Promise<T>,
  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    client.delete(url, config) as unknown as Promise<T>,
};
