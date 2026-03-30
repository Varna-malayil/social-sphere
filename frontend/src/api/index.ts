// src/api/index.ts - All API service functions
import client from './client';
import type { ApiResponse, PaginatedResponse, User, Post, Comment, Conversation, Message, Notification, Report, AdminAnalytics } from '@/types';

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data: { username: string; email: string; password: string }) =>
    client.post<ApiResponse<User> & { token: string }>('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    client.post<ApiResponse<User> & { token: string }>('/auth/login', data),
  getMe: () => client.get<ApiResponse<User>>('/auth/me'),
  updatePassword: (data: { currentPassword: string; newPassword: string }) =>
    client.put('/auth/updatepassword', data),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersAPI = {
  getProfile: (username: string) => client.get<ApiResponse<User>>(`/users/${username}`),
  updateProfile: (data: FormData) =>
    client.put<ApiResponse<User>>('/users/profile', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  followUser: (userId: string) => client.post<ApiResponse<{ following: boolean }>>(`/users/${userId}/follow`),
  searchUsers: (q: string, page = 1) => client.get<PaginatedResponse<User>>(`/users/search?q=${q}&page=${page}`),
  getSuggestions: () => client.get<ApiResponse<User[]>>('/users/suggestions'),
  getFollowers: (userId: string) => client.get<ApiResponse<User[]>>(`/users/${userId}/followers`),
  getFollowing: (userId: string) => client.get<ApiResponse<User[]>>(`/users/${userId}/following`),
};

// ── Posts ─────────────────────────────────────────────────────────────────────
export const postsAPI = {
  getFeed: (page = 1) => client.get<PaginatedResponse<Post>>(`/posts/feed?page=${page}`),
  getPosts: (page = 1, tag?: string) =>
    client.get<PaginatedResponse<Post>>(`/posts?page=${page}${tag ? `&tag=${tag}` : ''}`),
  getPost: (id: string) => client.get<ApiResponse<Post>>(`/posts/${id}`),
  getUserPosts: (userId: string, page = 1) =>
    client.get<PaginatedResponse<Post>>(`/posts/user/${userId}?page=${page}`),
  createPost: (data: FormData) =>
    client.post<ApiResponse<Post>>('/posts', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updatePost: (id: string, data: { content?: string; visibility?: string }) =>
    client.put<ApiResponse<Post>>(`/posts/${id}`, data),
  deletePost: (id: string) => client.delete(`/posts/${id}`),
  toggleLike: (id: string) => client.put<ApiResponse<{ liked: boolean; likesCount: number }>>(`/posts/${id}/like`),
};

// ── Comments ──────────────────────────────────────────────────────────────────
export const commentsAPI = {
  getComments: (postId: string, page = 1) =>
    client.get<PaginatedResponse<Comment>>(`/comments/${postId}?page=${page}`),
  addComment: (postId: string, data: { content: string; parentCommentId?: string }) =>
    client.post<ApiResponse<Comment>>(`/comments/${postId}`, data),
  updateComment: (id: string, content: string) =>
    client.put<ApiResponse<Comment>>(`/comments/${id}`, { content }),
  deleteComment: (id: string) => client.delete(`/comments/${id}`),
  toggleLike: (id: string) => client.put<ApiResponse<{ liked: boolean; likesCount: number }>>(`/comments/${id}/like`),
};

// ── Messages ──────────────────────────────────────────────────────────────────
export const messagesAPI = {
  getConversations: () => client.get<ApiResponse<Conversation[]>>('/messages/conversations'),
  getOrCreateConversation: (userId: string) =>
    client.post<ApiResponse<Conversation>>('/messages/conversations', { userId }),
  getMessages: (conversationId: string, page = 1) =>
    client.get<PaginatedResponse<Message>>(`/messages/${conversationId}?page=${page}`),
  sendMessage: (conversationId: string, content: string) =>
    client.post<ApiResponse<Message>>(`/messages/${conversationId}`, { content }),
  deleteMessage: (messageId: string) => client.delete(`/messages/${messageId}`),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationsAPI = {
  getNotifications: (page = 1) =>
    client.get<{ success: boolean; data: Notification[]; unreadCount: number; total: number }>(`/notifications?page=${page}`),
  markAsRead: (id: string) => client.put(`/notifications/${id}/read`),
  markAllAsRead: () => client.put('/notifications/read-all'),
  deleteNotification: (id: string) => client.delete(`/notifications/${id}`),
};

// ── Reports ───────────────────────────────────────────────────────────────────
export const reportsAPI = {
  createReport: (data: Partial<Report>) => client.post<ApiResponse<Report>>('/reports', data),
  getMyReports: () => client.get<ApiResponse<Report[]>>('/reports/mine'),
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminAPI = {
  getAnalytics: () => client.get<ApiResponse<AdminAnalytics>>('/admin/analytics'),
  getAllUsers: (page = 1, search?: string, status?: string) =>
    client.get<PaginatedResponse<User>>(`/admin/users?page=${page}${search ? `&search=${search}` : ''}${status ? `&status=${status}` : ''}`),
  toggleBanUser: (id: string, reason?: string) =>
    client.put(`/admin/users/${id}/ban`, { reason }),
  getAllPosts: (page = 1, reported?: boolean) =>
    client.get<PaginatedResponse<Post>>(`/admin/posts?page=${page}${reported ? '&reported=true' : ''}`),
  deletePost: (id: string) => client.delete(`/admin/posts/${id}`),
  getReports: (page = 1, status?: string) =>
    client.get<PaginatedResponse<Report>>(`/admin/reports?page=${page}${status ? `&status=${status}` : ''}`),
  resolveReport: (id: string, data: { status: string; actionTaken?: string; adminNotes?: string }) =>
    client.put(`/admin/reports/${id}/resolve`, data),
};
