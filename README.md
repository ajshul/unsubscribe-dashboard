# 📩 Unsubscribe Dashboard

A full-stack React + Node.js application that helps you **view and manage all unsubscribe links** from your Gmail inbox.

---

## ⚡ Features

- **🔐 Google OAuth Authentication** - Secure login with your Google account
- **📧 Gmail API Integration** - Automatically fetch emails with unsubscribe links
- **🎨 Modern UI** - Beautiful, responsive design with dark/light mode toggle
- **📊 Analytics Dashboard** - Track your inbox statistics and cleanup progress
- **🔍 Search & Filter** - Find specific senders and sort by date or sender
- **⚡ Real-time Updates** - Live data refresh and pagination
- **🛡️ Security First** - Rate limiting, input validation, and secure token handling
- **📱 Mobile Responsive** - Works perfectly on all device sizes

---

## 🛠️ Tech Stack

### Frontend

- [React 19](https://react.dev/) with TypeScript
- [Material-UI](https://mui.com/) for components and theming
- [Vite](https://vitejs.dev/) for fast development and building
- [React Router](https://reactrouter.com/) for client-side routing
- [Axios](https://axios-http.com/) for API calls

### Backend

- [Node.js](https://nodejs.org/) with [Express](https://expressjs.com/)
- [Google APIs](https://developers.google.com/gmail/api) for Gmail integration
- [JWT](https://jwt.io/) for authentication
- [Helmet](https://helmetjs.github.io/) for security headers
- Rate limiting and CORS protection

---

## 🚀 Quick Start

### Prerequisites

- [Node.js 18+](https://nodejs.org/) (LTS recommended)
- [pnpm](https://pnpm.io/) (recommended) or npm
- Google Cloud Console project with Gmail API enabled

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/unsubscribe-dashboard.git
cd unsubscribe-dashboard
pnpm install
```

### 2. Complete Setup Guide

**📖 For detailed setup instructions, see [SETUP_GUIDE.md](SETUP_GUIDE.md)**

The setup guide includes:

- ✅ Step-by-step Google Cloud Console configuration
- ✅ OAuth consent screen setup
- ✅ JWT secret generation
- ✅ Environment variable configuration
- ✅ Troubleshooting common issues

**Quick setup:**

1. **Google OAuth:** Create project → Enable Gmail API → Create credentials
2. **Environment:** `cp .env.example .env` and fill in your credentials
3. **JWT Secret:** Generate with `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

### 4. Start Development

```bash
# Start both frontend and backend
pnpm dev:full

# Or start them separately:
pnpm dev:server  # Backend on port 3001
pnpm dev         # Frontend on port 5173
```

Visit `http://localhost:5173` to see the app!

---

## 📁 Project Structure

```
unsubscribe-dashboard/
├── src/
│   ├── components/          # React components
│   │   ├── Dashboard.tsx    # Main dashboard
│   │   ├── Login.tsx        # OAuth login
│   │   ├── UnsubscribeTable.tsx  # Email table
│   │   ├── StatsCards.tsx   # Statistics display
│   │   └── Header.tsx       # App header
│   ├── contexts/            # React contexts
│   │   ├── AuthContext.tsx  # Authentication state
│   │   └── ThemeContext.tsx # Theme management
│   ├── utils/
│   │   └── api.ts          # API client setup
│   └── App.tsx             # Main app with routing
├── server/
│   ├── routes/
│   │   ├── auth.js         # OAuth routes
│   │   └── gmail.js        # Gmail API routes
│   └── index.js            # Express server
├── .env.example            # Environment template
└── README.md
```

---

## 🔧 Available Scripts

| Command           | Description                       |
| ----------------- | --------------------------------- |
| `pnpm dev`        | Start frontend development server |
| `pnpm dev:server` | Start backend development server  |
| `pnpm dev:full`   | Start both frontend and backend   |
| `pnpm build`      | Build for production              |
| `pnpm preview`    | Preview production build          |
| `pnpm lint`       | Run ESLint                        |

---

## 🚀 Deployment

### Frontend (Vercel/Netlify)

1. Build the frontend:

   ```bash
   pnpm build
   ```

2. Deploy the `dist` folder to your hosting provider

3. Set environment variables:
   - `VITE_GOOGLE_CLIENT_ID`
   - `VITE_APP_URL` (your production domain)
   - `VITE_API_URL` (your backend API URL)

### Backend (Railway/Heroku/DigitalOcean)

1. Deploy the server code to your hosting provider

2. Set environment variables:
   - `GOOGLE_CLIENT_SECRET`
   - `JWT_SECRET`
   - `NODE_ENV=production`
   - `PORT` (usually provided by host)

---

## 🔒 Security Considerations

- **Environment Variables**: Never commit `.env` files
- **JWT Secret**: Use a strong, random secret in production
- **HTTPS**: Always use HTTPS in production
- **Rate Limiting**: API calls are rate-limited per user
- **Input Validation**: All inputs are validated and sanitized
- **CORS**: Properly configured for your domains

---

## 🐛 Troubleshooting

### Common Issues

**OAuth Error "unauthorized_client"**

- Check that your redirect URIs are correctly configured in Google Cloud Console
- Ensure the client ID matches exactly

**"Failed to fetch emails"**

- Verify your Gmail API is enabled
- Check that you've granted the correct scopes
- Make sure your access token hasn't expired

**Backend connection issues**

- Ensure both frontend and backend are running
- Check that the proxy configuration in `vite.config.ts` is correct

---

## 📈 Roadmap

- [ ] **Bulk Operations** - Select and unsubscribe from multiple emails
- [ ] **Email Categories** - Automatically categorize newsletter types
- [ ] **Unsubscribe History** - Track successful unsubscribes
- [ ] **Smart Suggestions** - AI-powered recommendations
- [ ] **Export Data** - Download your unsubscribe data
- [ ] **Multiple Email Accounts** - Support for multiple Gmail accounts

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

If this project helped you, please give it a ⭐ on GitHub!

---
