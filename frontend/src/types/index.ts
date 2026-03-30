// src/types/index.ts - All shared TypeScript interfaces

export interface User {
  _id: string;
  username: string;
  email?: string;
  displayName: string;
  avatar: string;
  bio?: string;
  website?: string;
  location?: string;
  role: 'user' | 'admin';
  followers: User[] | string[];
  following: User[] | string[];
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isVerified: boolean;
  isBanned: boolean;
  banReason?: string;
  isOnline: boolean;
  lastSeen: string;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  _id: string;
  author: User;
  content?: string;
  images: { url: string; publicId: string }[];
  likes: string[];
  likesCount: number;
  commentsCount: number;
  tags: string[];
  visibility: 'public' | 'followers' | 'private';
  isReported: boolean;
  reportCount: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  post: string;
  author: User;
  content: string;
  parentComment: string | null;
  replies: Comment[];
  likes: string[];
  likesCount: number;
  isDeleted: boolean;
  createdAt: string;
}

export interface Message {
  _id: string;
  conversation: string;
  sender: User;
  content: string;
  messageType: 'text' | 'image' | 'file';
  readBy: { user: string; readAt: string }[];
  isDeleted: boolean;
  createdAt: string;
}

export interface Conversation {
  _id: string;
  participants: User[];
  lastMessage?: Message;
  lastMessageText?: string;
  lastMessageAt?: string;
  unreadCounts: { user: string; count: number }[];
  isGroup: boolean;
  createdAt: string;
}

export interface Notification {
  _id: string;
  recipient: string;
  sender: User;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'reply' | 'repost' | 'message' | 'system';
  post?: Post;
  comment?: Comment;
  message?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface Report {
  _id: string;
  reporter: User;
  reportType: 'post' | 'comment' | 'user';
  reportedPost?: Post;
  reportedComment?: Comment;
  reportedUser?: User;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  reviewedBy?: User;
  reviewedAt?: string;
  adminNotes?: string;
  actionTaken?: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  token?: string;
}

export interface AdminAnalytics {
  users: { total: number; last30Days: number; last7Days: number; banned: number; active: number };
  posts: { total: number; last30Days: number };
  reports: { total: number; pending: number };
  charts: {
    dailySignups: { _id: string; count: number }[];
    dailyPosts: { _id: string; count: number }[];
  };
  topUsers: User[];
}
