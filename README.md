# CollabSpace

Developed CollabSpace, a full-stack team collaboration platform enabling real-time video meetings with AI agents, team channel communication, personal note management, and AI-powered chat capabilities using Next.js, React, tRPC, PostgreSQL, and Daily.co, with secure multi-provider authentication (Google, GitHub, Email/Password) via Better Auth.

Built scalable backend services supporting advanced features such as real-time messaging, video conferencing, AI agent management, search, filtering, sorting, and pagination, and deployed the system on Vercel with serverless architecture to ensure high availability and optimal performance.

Designed a responsive, interactive UI with Tailwind CSS and Radix UI components, integrated dynamic real-time updates with TanStack Query, and implemented future-ready architecture for AI-driven meeting insights, agent automation, and enhanced collaboration features.

## 🚀 Features

### Core Functionality
- **Video Meetings**: Real-time video conferencing powered by Daily.co with AI agent integration
- **AI Agents**: Create and manage AI agents that can join meetings and interact with participants
- **Team Channels**: Collaborative messaging channels for team communication
- **Personal Notes**: Organize thoughts and information with rich note-taking capabilities
- **AI Chat**: Interactive chat powered by Google Gemini AI during meetings
- **Contact Form**: Built-in contact form with email support (Resend/SMTP)

### Technical Features
- **Type-Safe APIs**: End-to-end type safety with tRPC
- **Real-time Updates**: Optimistic updates and real-time data synchronization
- **Advanced UI**: Modern, responsive design built with Radix UI and Tailwind CSS
- **Authentication**: Multiple auth providers (Google, GitHub, Email/Password) via Better Auth
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15.5.7 (App Router with Turbopack)
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI primitives
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React

### Backend
- **API**: tRPC 11 (Type-safe APIs)
- **Database**: PostgreSQL (Neon Serverless)
- **ORM**: Drizzle ORM
- **Authentication**: Better Auth
- **Video**: Daily.co SDK
- **AI**: Google Generative AI (Gemini)

### Development Tools
- **Language**: TypeScript 5
- **Linting**: ESLint with Next.js config
- **Package Manager**: npm

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** 20.x or higher
- **npm** 11.x or higher
- **PostgreSQL** database (or Neon account for serverless PostgreSQL)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/darain24/collabspace.git
   cd collabspace
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Database
   DATABASE_URL=postgresql://user:password@host:port/database

   # Authentication
   BETTER_AUTH_URL=http://localhost:3000
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   
   # OAuth Providers (Optional)
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-client-secret

   # Daily.co (Video Meetings)
   DAILY_API_KEY=your-daily-api-key

   # Google Gemini AI
   GEMINI_API_KEY=your-gemini-api-key

   # Email (Optional - for contact form)
   RESEND_API_KEY=your-resend-api-key
   # OR use SMTP
   SMTP_HOST=smtp.example.com
   SMTP_PORT=587
   SMTP_USER=your-smtp-user
   SMTP_PASS=your-smtp-password
   FROM_EMAIL=noreply@yourdomain.com
   FROM_NAME=CollabSpace
   ```

4. **Set up the database**
   ```bash
   npm run db:push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Protected dashboard pages
│   ├── api/               # API routes
│   └── call/              # Video call pages
├── components/            # Reusable UI components
│   └── ui/               # shadcn/ui components
├── db/                    # Database configuration
│   └── schema.ts         # Drizzle ORM schema
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
│   ├── auth.ts           # Better Auth configuration
│   ├── daily-video.ts    # Daily.co client
│   └── gemini.ts         # Google Gemini AI client
├── modules/              # Feature modules
│   ├── agents/           # AI agents management
│   ├── channels/         # Team channels
│   ├── meetings/         # Video meetings
│   ├── notes/            # Personal notes
│   ├── chat/             # AI chat interface
│   └── contact/          # Contact form
└── trpc/                 # tRPC configuration
    ├── routers/          # API route handlers
    └── client.tsx        # tRPC React client
```

## 🚀 Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:push` - Push database schema changes
- `npm run db:studio` - Open Drizzle Studio (database GUI)

## 🔐 Authentication Setup

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google` (for development)
4. Add production redirect URI: `https://your-domain.com/api/auth/callback/google`
5. Copy Client ID and Client Secret to `.env.local`

### GitHub OAuth

1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth App
3. Set Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID and generate Client Secret
5. Add to `.env.local`

## 🌐 Deployment

### Vercel (Recommended)

1. **Push your code to GitHub**

2. **Import project to Vercel**
   - Go to [Vercel](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

3. **Configure environment variables**
   - Add all environment variables from `.env.local`
   - Set `NEXT_PUBLIC_APP_URL` to your Vercel domain
   - Set `BETTER_AUTH_URL` to your Vercel domain

4. **Deploy**
   - Vercel will automatically deploy on every push to main
   - Preview deployments are created for pull requests

### Environment Variables for Production

Make sure to set these in your Vercel project settings:

```env
DATABASE_URL=your-production-database-url
BETTER_AUTH_URL=https://your-domain.vercel.app
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
DAILY_API_KEY=your-daily-api-key
GEMINI_API_KEY=your-gemini-api-key
# ... other variables
```

## 🗄️ Database

This project uses **Drizzle ORM** with **PostgreSQL**. The database schema is defined in `src/db/schema.ts`.

### Database Operations

- **Push schema changes**: `npm run db:push`
- **View database**: `npm run db:studio` (opens Drizzle Studio)

### Schema Overview

- `user` - User accounts
- `session` - User sessions
- `account` - OAuth account links
- `channels` - Team channels
- `channelMembers` - Channel membership
- `messages` - Channel messages
- `notes` - Personal notes
- `agents` - AI agents
- `meetings` - Video meetings

## 🔒 Security

- **Next.js 15.5.7**: Latest version with security patches (CVE-2025-66478 fixed)
- **Type-safe APIs**: tRPC prevents common API vulnerabilities
- **Server-only code**: Proper separation of client/server code
- **Environment variables**: Sensitive data stored securely
- **CORS**: Configured for production domains

## 📝 API Documentation

This project uses **tRPC** for type-safe APIs. All API routes are defined in `src/trpc/routers/`.

### Available Routers

- `channels` - Channel management and messaging
- `notes` - Note CRUD operations
- `agents` - AI agent management
- `meetings` - Meeting management
- `user` - User profile operations
- `contact` - Contact form submission

### Using tRPC Client

```typescript
import { trpc } from "@/trpc/client"

// In a React component
const { data } = trpc.channels.getMany.useQuery({ page: 1, pageSize: 10 })
```

## 🧪 Development

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Next.js recommended rules
- **Prettier**: Code formatting (if configured)

### Best Practices

- Use TypeScript for all new files
- Follow the existing module structure
- Keep components small and focused
- Use tRPC for all API calls
- Add proper error handling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 🆘 Support

For issues and questions:
- Open an issue on GitHub
- Contact: darainqamar10@gmail.com

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org) - React framework
- [tRPC](https://trpc.io) - End-to-end typesafe APIs
- [Daily.co](https://daily.co) - Video infrastructure
- [Better Auth](https://better-auth.com) - Authentication
- [Drizzle ORM](https://orm.drizzle.team) - TypeScript ORM
- [Radix UI](https://www.radix-ui.com) - UI primitives
- [Tailwind CSS](https://tailwindcss.com) - Styling

---

Built with ❤️ using Next.js and modern web technologies.
