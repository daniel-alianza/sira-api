import type { ApiResponse } from '../interfaces/api-response.interface';

export function buildApiResponse<T>(data: T, message: string): ApiResponse<T> {
  return {
    data,
    message,
    error: null,
  };
}
