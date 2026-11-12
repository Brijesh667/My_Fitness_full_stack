import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';
import type { FieldValues, UseFormSetError } from 'react-hook-form';
import { beginRequest, endRequest, type RequestTracker } from './request-status';

const baseURL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

export const apiClient = axios.create({
  baseURL,
  withCredentials: true
});

interface TrackedConfig extends InternalAxiosRequestConfig {
  __tracker?: RequestTracker;
}

apiClient.interceptors.request.use((config) => {
  (config as TrackedConfig).__tracker = beginRequest();
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    endRequest((response.config as TrackedConfig).__tracker);
    return response;
  },
  (error) => {
    endRequest((error.config as TrackedConfig | undefined)?.__tracker);
    return Promise.reject(error);
  }
);

function isRetryableGet(error: unknown) {
  if (!axios.isAxiosError(error)) return false;
  if (!error.response) return true;
  return [502, 503, 504].includes(error.response.status);
}

interface ErrorPayload {
  code?: string;
  message?: string;
  fields?: Record<string, string>;
  retryAfterSec?: number;
}

export class ApiError extends Error {
  code: string;
  status: number;
  fields?: Record<string, string>;
  retryAfterSec?: number;

  constructor(
    status: number,
    code: string,
    message: string,
    fields?: Record<string, string>,
    retryAfterSec?: number
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fields = fields;
    this.retryAfterSec = retryAfterSec;
  }
}

export function getApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new ApiError(0, 'REQUEST_TIMEOUT', 'The request took too long. Please try again.');
    }
    const payload = error.response?.data as { error?: ErrorPayload } | undefined;
    if (payload?.error) {
      return new ApiError(
        error.response?.status ?? 0,
        payload.error.code ?? 'REQUEST_FAILED',
        payload.error.message ?? 'Something went wrong',
        payload.error.fields,
        payload.error.retryAfterSec
      );
    }
    if (!error.response) {
      return new ApiError(0, 'NETWORK_ERROR', 'Cannot reach the server. Check your connection and try again.');
    }
    if (error.response.status === 504) {
      return new ApiError(
        504,
        'REQUEST_TIMEOUT',
        'The server took too long to respond. Please try again.'
      );
    }
    return new ApiError(error.response.status, 'REQUEST_FAILED', 'Something went wrong. Please try again.');
  }

  return new ApiError(0, 'UNKNOWN_ERROR', 'Something went wrong. Please try again.');
}

async function unwrap<T>(request: Promise<{ data: { success: true; data: T } }>): Promise<T> {
  try {
    const response = await request;
    return response.data.data;
  } catch (error) {
    throw getApiError(error);
  }
}

export async function apiGet<T>(url: string, config?: AxiosRequestConfig) {
  try {
    const response = await apiClient.get<{ success: true; data: T }>(url, config);
    return response.data.data;
  } catch (error) {
    if (!isRetryableGet(error)) throw getApiError(error);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    try {
      const response = await apiClient.get<{ success: true; data: T }>(url, config);
      return response.data.data;
    } catch (retryError) {
      throw getApiError(retryError);
    }
  }
}

export function apiPost<T>(url: string, body?: unknown, config?: AxiosRequestConfig) {
  return unwrap<T>(apiClient.post(url, body, config));
}

export function apiPatch<T>(url: string, body?: unknown) {
  return unwrap<T>(apiClient.patch(url, body));
}

export function apiPut<T>(url: string, body?: unknown, config?: AxiosRequestConfig) {
  return unwrap<T>(apiClient.put(url, body, config));
}

export async function apiDelete(url: string) {
  try {
    await apiClient.delete(url);
  } catch (error) {
    throw getApiError(error);
  }
}

export function applyFieldErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>
) {
  const apiError = getApiError(error);
  if (apiError.fields) {
    for (const [key, message] of Object.entries(apiError.fields)) {
      setError(key as Parameters<UseFormSetError<T>>[0], { type: 'server', message });
    }
  }
  return apiError;
}
