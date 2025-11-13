const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api';
const NORMALIZED_BASE = API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`;

type HttpMethod = 'GET' | 'POST';

interface RequestOptions extends RequestInit {
  query?: Record<string, string | number | boolean | undefined>;
}

const buildUrl = (path: string, query?: RequestOptions['query']) => {
  const url = new URL(path, NORMALIZED_BASE);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }
  return url.toString();
};

const request = async <T>(method: HttpMethod, path: string, options: RequestOptions = {}) => {
  const headers = new Headers(options.headers ?? {});

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(buildUrl(path, options.query), {
    ...options,
    method,
    headers
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof payload === 'string' ? payload : payload?.message ?? 'Request failed';
    throw new Error(message);
  }

  return payload as T;
};

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', path, { ...options, body: body ? JSON.stringify(body) : undefined })
};
