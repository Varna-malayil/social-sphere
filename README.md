# ✦ SocialSphere — Full-Stack Social Media Platform

A production-ready social media application built with React (TypeScript), Node.js, Express, MongoDB, Socket.IO, and Ant Design.

---

## 📁 Project Structure

```
socialmedia/
├── backend/                        # Node.js / Express API
│   ├── config/
│   │   ├── db.js                   # MongoDB connection
│   │   └── cloudinary.js           # Cloudinary + Multer config
│   ├── controllers/
│   │   ├── auth.js                 # Register, login, getMe
│   │   ├── users.js                # Profiles, follow/unfollow, search
│   │   ├── posts.js                # CRUD, feed, likes
│   │   ├── comments.js             # CRUD, nested replies, likes
│   │   ├── messages.js             # Conversations + DMs
│   │   ├── notifications.js        # Read/unread, mark all
│   │   ├── reports.js              # Content reporting
│   │   └── admin.js                # Analytics, ban, moderation
│   ├── middleware/
│   │   ├── auth.js                 # JWT protect + authorize + socket
│   │   ├── error.js                # Central error handler
│   │   └── validate.js             # express-validator rules
│   ├── models/
│   │   ├── User.js                 # User schema (bcrypt, JWT)
│   │   ├── Post.js                 # Post + images
│   │   ├── Comment.js              # Comments + replies
│   │   ├── Message.js              # Message + Conversation
│   │   ├── Notification.js         # All notification types
│   │   └── Report.js               # Content moderation
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── posts.js
│   │   ├── comments.js
│   │   ├── messages.js
│   │   ├── notifications.js
│   │   ├── reports.js
│   │   └── admin.js
│   ├── utils/
│   │   ├── asyncHandler.js         # Wraps async controllers
│   │   ├── errorResponse.js        # Custom error class
│   │   └── socketHandler.js        # Socket.IO events
│   ├── uploads/                    # Local file uploads (fallback)
│   ├── .env.example
│   ├── package.json
│   └── server.js                   # App entry point
│
└── frontend/                       # React + TypeScript + Vite
    ├── src/
    │   ├── api/
    │   │   ├── client.ts           # Axios instance + interceptors
    │   │   └── index.ts            # All API service functions
    │   ├── components/
    │   │   ├── admin/
    │   │   │   └── AdminLayout.tsx # Admin sidebar layout
    │   │   ├── common/
    │   │   │   ├── AppLayout.tsx   # Main app shell + sidebar
    │   │   │   ├── UserCard.tsx    # Reusable user card
    │   │   │   └── UserSuggestions.tsx
    │   │   └── feed/
    │   │       ├── PostCard.tsx    # Full post with actions
    │   │       ├── CommentSection.tsx
    │   │       └── CreatePostModal.tsx
    │   ├── context/
    │   │   └── SocketContext.tsx   # Socket.IO React context
    │   ├── hooks/
    │   │   └── useQueries.ts       # All React Query hooks
    │   ├── pages/
    │   │   ├── LoginPage.tsx
    │   │   ├── RegisterPage.tsx
    │   │   ├── HomePage.tsx
    │   │   ├── ExplorePage.tsx
    │   │   ├── ProfilePage.tsx
    │   │   ├── PostPage.tsx
    │   │   ├── ChatPage.tsx
    │   │   ├── NotificationsPage.tsx
    │   │   ├── SettingsPage.tsx
    │   │   └── admin/
    │   │       ├── AdminDashboard.tsx
    │   │       ├── AdminUsers.tsx
    │   │       ├── AdminPosts.tsx
    │   │       └── AdminReports.tsx
    │   ├── routes/
    │   │   └── index.tsx           # All routes + protected routes
    │   ├── store/
    │   │   └── authStore.ts        # Zustand auth state
    │   ├── types/
    │   │   └── index.ts            # All TypeScript interfaces
    │   ├── index.css               # Global styles + CSS variables
    │   └── main.tsx                # App entry + providers
    ├── index.html
    ├── package.json
    ├── tailwind.config.js
    ├── tsconfig.json
    └── vite.config.ts
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- **MongoDB** (local or [MongoDB Atlas](https://cloud.mongodb.com))
- **Cloudinary** account (optional — falls back to local disk)

---

### 1. Clone and install

```bash
# Clone
git clone <your-repo-url>
cd socialmedia

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

### 2. Configure environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/socialmedia

JWT_SECRET=change_this_to_a_long_random_string_in_production
JWT_EXPIRE=30d

# Optional — leave blank to use local disk uploads
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

CLIENT_URL=http://localhost:3000
```

---

### 3. Seed an admin account (optional)

```bash
# From the backend directory, run a one-time seed script:
node -e "
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  await User.create({
    username: 'admin',
    email: 'admin@demo.com',
    password: 'password123',
    displayName: 'Admin',
    role: 'admin'
  });
  console.log('Admin created: admin@demo.com / password123');
  process.exit(0);
}).catch(console.error);
"
```

---

### 4. Start the servers

```bash
# Terminal 1 — Backend (port 5000)
cd backend
npm run dev

# Terminal 2 — Frontend (port 3000)
cd frontend
npm run dev
```

Open **http://localhost:3000**

---

## 🔌 API Reference

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login, returns JWT |
| GET | `/api/auth/me` | ✅ | Get current user |
| PUT | `/api/auth/updatepassword` | ✅ | Change password |

### Users
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users/:username` | ❌ | Get profile by username |
| PUT | `/api/users/profile` | ✅ | Update own profile + avatar |
| POST | `/api/users/:id/follow` | ✅ | Follow / unfollow toggle |
| GET | `/api/users/search?q=` | ✅ | Search users |
| GET | `/api/users/suggestions` | ✅ | Suggested users to follow |
| GET | `/api/users/:id/followers` | ❌ | Get followers list |
| GET | `/api/users/:id/following` | ❌ | Get following list |

### Posts
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/posts` | ❌ | Public explore feed |
| GET | `/api/posts/feed` | ✅ | Personalized feed |
| GET | `/api/posts/:id` | ❌ | Get single post |
| GET | `/api/posts/user/:userId` | ❌ | User's posts |
| POST | `/api/posts` | ✅ | Create post (multipart) |
| PUT | `/api/posts/:id` | ✅ | Update own post |
| DELETE | `/api/posts/:id` | ✅ | Soft-delete post |
| PUT | `/api/posts/:id/like` | ✅ | Toggle like |

### Comments
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/comments/:postId` | ❌ | Get comments (paginated) |
| POST | `/api/comments/:postId` | ✅ | Add comment / reply |
| PUT | `/api/comments/:id` | ✅ | Edit own comment |
| DELETE | `/api/comments/:id` | ✅ | Delete comment |
| PUT | `/api/comments/:id/like` | ✅ | Toggle like on comment |

### Messages
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/messages/conversations` | ✅ | All conversations |
| POST | `/api/messages/conversations` | ✅ | Get or create conversation |
| GET | `/api/messages/:conversationId` | ✅ | Messages in conversation |
| POST | `/api/messages/:conversationId` | ✅ | Send message |
| DELETE | `/api/messages/:messageId` | ✅ | Delete own message |

### Notifications
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/notifications` | ✅ | Get notifications |
| PUT | `/api/notifications/read-all` | ✅ | Mark all as read |
| PUT | `/api/notifications/:id/read` | ✅ | Mark one as read |
| DELETE | `/api/notifications/:id` | ✅ | Delete notification |

### Reports
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/reports` | ✅ | Submit a report |
| GET | `/api/reports/mine` | ✅ | My submitted reports |

### Admin (requires `role: admin`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/analytics` | Platform stats + charts |
| GET | `/api/admin/users` | All users (search, filter) |
| PUT | `/api/admin/users/:id/ban` | Ban / unban user |
| GET | `/api/admin/posts` | All posts (reported filter) |
| DELETE | `/api/admin/posts/:id` | Remove a post |
| GET | `/api/admin/reports` | All reports (status filter) |
| PUT | `/api/admin/reports/:id/resolve` | Resolve a report |

---

## 🔒 Security Features

- **bcryptjs** — passwords hashed with cost factor 12
- **JWT** — 30-day tokens, verified on every protected request
- **Helmet** — security headers (XSS, HSTS, CSP, etc.)
- **express-rate-limit** — 100 req/15min globally; 10 req/15min on auth routes
- **express-mongo-sanitize** — prevents NoSQL injection
- **CORS** — restricted to `CLIENT_URL`
- **Input validation** — express-validator on all mutating routes
- **Role-based access** — `user` / `admin` enforced per route
- **Soft deletes** — posts/comments marked `isDeleted` rather than destroyed

---

## ⚡ Real-Time Events (Socket.IO)

| Event | Direction | Description |
|-------|-----------|-------------|
| `notification` | server → client | New notification pushed |
| `newMessage` | server → client | New DM received |
| `userOnline` | server → all | User came online |
| `userOffline` | server → all | User went offline |
| `userTyping` | client → room | Typing indicator |
| `joinConversation` | client → server | Subscribe to chat room |
| `leaveConversation` | client → server | Unsubscribe from chat room |
| `messageRead` | client → server | Mark message as read |

---

## 🗃️ MongoDB Schema Summary

### User
`username`, `email`, `password` (hashed), `role`, `displayName`, `bio`, `avatar`, `website`, `location`, `followers[]`, `following[]`, `followersCount`, `followingCount`, `postsCount`, `isVerified`, `isBanned`, `banReason`, `isOnline`, `lastSeen`

### Post
`author`, `content`, `images[]`, `likes[]`, `likesCount`, `commentsCount`, `tags[]`, `visibility`, `isReported`, `reportCount`, `isDeleted`, `deletedAt`, `deletedBy`

### Comment
`post`, `author`, `content`, `parentComment`, `replies[]`, `likes[]`, `likesCount`, `isDeleted`

### Message / Conversation
Message: `conversation`, `sender`, `content`, `messageType`, `readBy[]`, `isDeleted`
Conversation: `participants[]`, `lastMessage`, `lastMessageText`, `lastMessageAt`, `unreadCounts[]`, `isGroup`

### Notification
`recipient`, `sender`, `type` (like/comment/follow/reply/mention/message/system), `post`, `comment`, `message`, `isRead`, `readAt`

### Report
`reporter`, `reportType` (post/comment/user), `reportedPost/Comment/User`, `reason`, `description`, `status` (pending/reviewed/resolved/dismissed), `reviewedBy`, `actionTaken`

---

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + TypeScript, Vite |
| UI | Ant Design 5, Tailwind CSS |
| State | Zustand (auth), React Query (server state) |
| HTTP | Axios |
| Routing | React Router v6 |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| Real-time | Socket.IO |
| Uploads | Multer + Cloudinary |
| Validation | express-validator |
| Security | Helmet, rate-limit, mongo-sanitize |

---

## 📦 Production Build

```bash
# Build frontend
cd frontend
npm run build
# Output in frontend/dist/

# Serve with backend (add to server.js):
# app.use(express.static(path.join(__dirname, '../frontend/dist')));
# app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../frontend/dist/index.html')));

# Start backend in production
NODE_ENV=production node server.js
```

---

## 🌐 Environment Variables (Production Checklist)

- [ ] `JWT_SECRET` — long random string (32+ chars)
- [ ] `MONGODB_URI` — Atlas connection string with auth
- [ ] `CLOUDINARY_*` — configure for scalable image storage
- [ ] `CLIENT_URL` — your deployed frontend URL
- [ ] `NODE_ENV=production`
- [ ] Use a process manager like **PM2**
- [ ] Serve behind **Nginx** reverse proxy with SSL

---

*Built with ✦ SocialSphere — a production-ready full-stack social media platform*
