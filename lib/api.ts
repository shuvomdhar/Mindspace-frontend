import { supabase } from './supabase';
import type {
  EditorValue,
  Idea,
  IdeaStatus,
  Note,
  NoteSummary,
  Profile,
} from './types';

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
).replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw new ApiError(error.message, 401);
  }
  const token = data.session?.access_token;
  if (!token) {
    throw new ApiError('Your session expired. Please sign in again.', 401);
  }

  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('Authorization', `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(
      `Could not reach the API at ${API_URL}. Is the backend running?`,
      0,
    );
  }

  if (!response.ok) {
    let message = `Request failed (${response.status}).`;
    let details: unknown;
    try {
      const body = (await response.json()) as {
        error?: string;
        details?: unknown;
      };
      if (body.error) message = body.error;
      details = body.details;
    } catch {
      // Response was not JSON.
    }
    throw new ApiError(message, response.status, details);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

function notePayload(input: { title?: string; content?: EditorValue }) {
  return {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.content
      ? { content: input.content.json, contentText: input.content.text }
      : {}),
  };
}

export const api = {
  profile: {
    get: () => request<{ profile: Profile }>('/api/profile'),
    update: (input: { fullName?: string | null }) =>
      request<{ profile: Profile }>('/api/profile', {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    logout: () =>
      request<{ ok: true }>('/api/profile/logout', {
        method: 'POST',
      }),
    remove: () =>
      request<{ ok: true; profile: Profile }>('/api/profile', {
        method: 'DELETE',
      }),
  },

  notes: {
    list: () => request<{ notes: NoteSummary[] }>('/api/notes'),
    get: (id: number) => request<{ note: Note }>(`/api/notes/${id}`),
    create: (input: { title?: string; content?: EditorValue } = {}) =>
      request<{ note: Note }>('/api/notes', {
        method: 'POST',
        body: JSON.stringify(notePayload(input)),
      }),
    update: (
      id: number,
      input: { title?: string; content?: EditorValue },
    ) =>
      request<{ note: Note }>(`/api/notes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(notePayload(input)),
      }),
    remove: (id: number) =>
      request<{ ok: true; id: number }>(`/api/notes/${id}`, {
        method: 'DELETE',
      }),
  },

  ideas: {
    list: (status?: IdeaStatus) =>
      request<{ ideas: Idea[] }>(
        status ? `/api/ideas?status=${status}` : '/api/ideas',
      ),
    get: (id: number) => request<{ idea: Idea }>(`/api/ideas/${id}`),
    create: (input: {
      title: string;
      description?: EditorValue;
      status?: IdeaStatus;
    }) =>
      request<{ idea: Idea }>('/api/ideas', {
        method: 'POST',
        body: JSON.stringify({
          title: input.title,
          status: input.status,
          ...(input.description
            ? {
                description: input.description.json,
                descriptionText: input.description.text,
              }
            : {}),
        }),
      }),
    update: (
      id: number,
      input: {
        title?: string;
        description?: EditorValue;
        status?: IdeaStatus;
        position?: number;
      },
    ) =>
      request<{ idea: Idea }>(`/api/ideas/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: input.title,
          status: input.status,
          position: input.position,
          ...(input.description
            ? {
                description: input.description.json,
                descriptionText: input.description.text,
              }
            : {}),
        }),
      }),
    move: (id: number, status: IdeaStatus) =>
      request<{ idea: Idea }>(`/api/ideas/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    remove: (id: number) =>
      request<{ ok: true; id: number }>(`/api/ideas/${id}`, {
        method: 'DELETE',
      }),
  },
};

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}
