import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, apiGet, apiPatch, apiPost } from '@/lib/api';
import type { Profile, User } from '@/lib/types';

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => apiGet<{ user: User }>('/auth/me').then((data) => data.user),
    retry: false,
    staleTime: 5 * 60_000
  });
}

export function useSignup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: { name: string; email: string; password: string }) =>
      apiPost<{ user: User }>('/auth/signup', values).then((data) => data.user),
    onSuccess: (user) => {
      queryClient.setQueryData(['me'], user);
      queryClient.invalidateQueries();
    }
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: { email: string; password: string }) =>
      apiPost<{ user: User }>('/auth/login', values).then((data) => data.user),
    onSuccess: (user) => {
      queryClient.setQueryData(['me'], user);
      queryClient.invalidateQueries();
    }
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiPost<{ loggedOut: boolean }>('/auth/logout'),
    onSettled: () => {
      queryClient.setQueryData(['me'], null);
      queryClient.clear();
    }
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: { name?: string; profile?: Partial<Profile> }) =>
      apiPatch<{ user: User }>('/profile', values),
    onSuccess: (data) => {
      queryClient.setQueryData(['me'], data.user);
    }
  });
}

export function useAvatarMutations() {
  const queryClient = useQueryClient();

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('avatar', file);
      const response = await apiClient.post<{ data: { user: User; avatarUrl: string } }>(
        '/profile/avatar',
        form
      );
      return response.data.data.user;
    },
    onSuccess: (user) => queryClient.setQueryData(['me'], user)
  });

  const remove = useMutation({
    mutationFn: async () => {
      const response = await apiClient.delete<{ data: { user: User } }>('/profile/avatar');
      return response.data.data.user;
    },
    onSuccess: (user) => queryClient.setQueryData(['me'], user)
  });

  return { upload, remove };
}
