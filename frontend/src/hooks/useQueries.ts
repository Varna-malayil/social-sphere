// src/hooks/useQueries.ts - All React Query hooks
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { message as antMessage } from 'antd';
import { postsAPI, commentsAPI, usersAPI, notificationsAPI, messagesAPI, adminAPI } from '@/api';

// ── Posts ─────────────────────────────────────────────────────────────────────
export const useFeed = (page = 1) =>
  useQuery({ queryKey: ['feed', page], queryFn: () => postsAPI.getFeed(page).then((r) => r.data) });

export const useExplore = (page = 1, tag?: string) =>
  useQuery({ queryKey: ['explore', page, tag], queryFn: () => postsAPI.getPosts(page, tag).then((r) => r.data) });

export const usePost = (id: string) =>
  useQuery({ queryKey: ['post', id], queryFn: () => postsAPI.getPost(id).then((r) => r.data.data), enabled: !!id });

export const useUserPosts = (userId: string, page = 1) =>
  useQuery({
    queryKey: ['userPosts', userId, page],
    queryFn: () => postsAPI.getUserPosts(userId, page).then((r) => r.data),
    enabled: !!userId,
  });

export const useCreatePost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: FormData) => postsAPI.createPost(data).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.invalidateQueries({ queryKey: ['userPosts'] });
      antMessage.success('Post created!');
    },
    onError: (err: any) => antMessage.error(err.response?.data?.message || 'Failed to create post'),
  });
};

export const useDeletePost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => postsAPI.deletePost(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.invalidateQueries({ queryKey: ['userPosts'] });
      antMessage.success('Post deleted');
    },
  });
};

export const useToggleLike = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => postsAPI.toggleLike(postId).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.invalidateQueries({ queryKey: ['explore'] });
      qc.invalidateQueries({ queryKey: ['userPosts'] });
    },
  });
};

// ── Comments ──────────────────────────────────────────────────────────────────
export const useComments = (postId: string) =>
  useQuery({
    queryKey: ['comments', postId],
    queryFn: () => commentsAPI.getComments(postId).then((r) => r.data),
    enabled: !!postId,
  });

export const useAddComment = (postId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { content: string; parentCommentId?: string }) =>
      commentsAPI.addComment(postId, data).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', postId] });
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });
};

export const useDeleteComment = (postId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => commentsAPI.deleteComment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', postId] }),
  });
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const useUserProfile = (username: string) =>
  useQuery({
    queryKey: ['profile', username],
    queryFn: () => usersAPI.getProfile(username).then((r) => r.data.data),
    enabled: !!username,
  });

export const useFollowUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => usersAPI.followUser(userId).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] });
      qc.invalidateQueries({ queryKey: ['suggestions'] });
    },
  });
};

export const useSuggestions = () =>
  useQuery({ queryKey: ['suggestions'], queryFn: () => usersAPI.getSuggestions().then((r) => r.data.data) });

export const useSearchUsers = (q: string) =>
  useQuery({
    queryKey: ['search', q],
    queryFn: () => usersAPI.searchUsers(q).then((r) => r.data),
    enabled: q.length >= 2,
  });

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: FormData) => usersAPI.updateProfile(data).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] });
      antMessage.success('Profile updated!');
    },
    onError: (err: any) => antMessage.error(err.response?.data?.message || 'Update failed'),
  });
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const useNotifications = () =>
  useQuery({ queryKey: ['notifications'], queryFn: () => notificationsAPI.getNotifications().then((r) => r.data) });

export const useMarkAllRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsAPI.markAllAsRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
};

// ── Conversations ─────────────────────────────────────────────────────────────
export const useConversations = () =>
  useQuery({ queryKey: ['conversations'], queryFn: () => messagesAPI.getConversations().then((r) => r.data.data) });

export const useMessages = (conversationId: string) =>
  useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => messagesAPI.getMessages(conversationId).then((r) => r.data.data),
    enabled: !!conversationId,
    refetchInterval: 5000, // Poll every 5s as fallback
  });

// ── Admin ─────────────────────────────────────────────────────────────────────
export const useAdminAnalytics = () =>
  useQuery({ queryKey: ['adminAnalytics'], queryFn: () => adminAPI.getAnalytics().then((r) => r.data.data) });

export const useAdminUsers = (page = 1, search?: string, status?: string) =>
  useQuery({
    queryKey: ['adminUsers', page, search, status],
    queryFn: () => adminAPI.getAllUsers(page, search, status).then((r) => r.data),
  });

export const useAdminReports = (page = 1, status?: string) =>
  useQuery({
    queryKey: ['adminReports', page, status],
    queryFn: () => adminAPI.getReports(page, status).then((r) => r.data),
  });

export const useAdminPosts = (page = 1, reported?: boolean) =>
  useQuery({
    queryKey: ['adminPosts', page, reported],
    queryFn: () => adminAPI.getAllPosts(page, reported).then((r) => r.data),
  });
