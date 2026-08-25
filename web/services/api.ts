import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

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

// Path sesi admin — tidak boleh memicu retry refresh.
const AUTH_EXEMPT_PATHS = ['/admin/login', '/admin/refresh', '/admin/logout'];

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

client.interceptors.response.use(
  (response) => {
    const body = response.data as ApiResponse<unknown>;
    // Unwrap the envelope; the typed `api` wrapper re-casts to the payload.
    return (body?.data ?? body) as unknown as typeof response;
  },
  async (error) => {
    const message: string =
      error.response?.data?.message ?? error.message ?? 'Something went wrong';
    const config = error.config as RetryConfig | undefined;
    const url: string = config?.url ?? '';

    // Sesi admin berbasis cookie httpOnly: saat 401 (access token kedaluwarsa),
    // coba POST /admin/refresh sekali (backend membaca cookie refresh_token),
    // lalu ulangi request asli.
    if (
      error.response?.status === 401 &&
      config &&
      !config._retry &&
      !AUTH_EXEMPT_PATHS.some((p) => url.includes(p))
    ) {
      config._retry = true;
      try {
        await client.post('/admin/refresh', {});
      } catch {
        return Promise.reject(new Error(message));
      }
      return client(config);
    }

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
  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    client.patch(url, data, config) as unknown as Promise<T>,
  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    client.delete(url, config) as unknown as Promise<T>,
};
