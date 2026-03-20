type ApiClientOptions = Omit<RequestInit, 'body'> & { body?: unknown };

export async function apiClient<T>(endpoint: string, options?: ApiClientOptions): Promise<T> {
  // Read base URL with fallback and remove trailing slashes
  const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const baseUrl = rawBaseUrl.replace(/\/+$/, '');
  
  // Remove leading slash from endpoint to avoid double slashes
  const cleanEndpoint = endpoint.replace(/^\/+/, '');
  
  const url = `${baseUrl}/${cleanEndpoint}`;

  const headers = new Headers(options?.headers);
  
  // Automatically inject Content-Type
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const { body, ...restOptions } = options || {};

  const fetchOptions: RequestInit = {
    ...restOptions,
    headers,
  };

  // Solo para entorno Test integrado donde Next.js es un proceso diferente
  if (import.meta.env.MODE === 'test') {
    (fetchOptions.headers as Headers).set('x-test-bypass', 'true');
  }

  // Stringify body if present
  if (body !== undefined) {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    const errorBody = await response.text();
    const error = new Error(`HTTP Error: ${response.status} - ${errorBody}`);
    (error as any).status = response.status;
    throw error;
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}
