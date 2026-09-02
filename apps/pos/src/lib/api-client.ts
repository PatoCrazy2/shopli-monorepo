type ApiClientOptions = Omit<RequestInit, 'body'> & { 
  body?: unknown;
  params?: Record<string, string>;
};

export async function apiClient<T>(endpoint: string, options?: ApiClientOptions): Promise<T> {
  // Read base URL with fallback.
  let rawBaseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '/api';
  
  // Si la URL es absoluta y no incluye /api, lo agregamos automáticamente
  if (rawBaseUrl.startsWith('http') && !rawBaseUrl.toLowerCase().includes('/api')) {
    rawBaseUrl = rawBaseUrl.replace(/\/+$/, '') + '/api';
  }

  // Failsafe: Solo en desarrollo de Vite (navegador) si está usando localhost intentar forzar el proxy relativo
  if (import.meta.env.DEV && import.meta.env.MODE !== 'test' && !import.meta.env.VITE_API_URL && (rawBaseUrl.startsWith('http://localhost') || rawBaseUrl.startsWith('http://127.0.0.1'))) {
     rawBaseUrl = '/api';
  }
  
  const baseUrl = rawBaseUrl.replace(/\/+$/, '');
  
  // Remove leading slash from endpoint to avoid double slashes
  const cleanEndpoint = endpoint.replace(/^\/+/, '');
  
  let url = `${baseUrl}/${cleanEndpoint}`;

  // Append query params if provided
  if (options?.params) {
    const searchParams = new URLSearchParams(options.params);
    url += `?${searchParams.toString()}`;
  }

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
    let parsedBody: any = null;
    try {
      parsedBody = JSON.parse(errorBody);
    } catch (_) {
      // Body is not JSON
    }

    const message = parsedBody?.message || parsedBody?.error || `HTTP Error: ${response.status} - ${errorBody}`;
    const error = new Error(message);
    (error as any).status = response.status;
    (error as any).data = parsedBody;
    (error as any).isSubscriptionSuspended = response.status === 402;
    throw error;
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}
