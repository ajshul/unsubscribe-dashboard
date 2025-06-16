## 📩 Unsubscribe Dashboard

A modern React + Vite + TypeScript web app styled with Material UI that helps you **view and manage all unsubscribe links** from your inbox. This is the foundation for a productivity tool that lets you quickly declutter your email subscriptions.

---

### ⚡ Tech Stack

- [React 18](https://react.dev/)
- [Vite 5](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Material UI](https://mui.com/)
- [pnpm](https://pnpm.io/) (fast, disk-efficient package manager)
- ESLint + Prettier + VS Code integration

---

## 🚀 Getting Started

### 🧰 Prerequisites

- [Node.js (LTS)](https://nodejs.org/) (use `nvm`, `fnm`, or `volta` — M2 Max compatible)
- [pnpm](https://pnpm.io/) (run `corepack enable && corepack prepare pnpm@latest --activate`)
- [Git](https://git-scm.com/)
- [VS Code](https://code.visualstudio.com/) with recommended extensions

---

### 🧱 Setup Instructions

```bash
# 1. Clone the repo or create from script
git clone https://github.com/ajshul/unsubscribe-dashboard.git
cd unsubscribe-dashboard

# OR run the setup script
curl -sSL https://your-script-url/setup-react-mui.sh | bash

# 2. Install dependencies
pnpm install

# 3. Start development server
pnpm dev

# 4. Open in browser
open http://localhost:5173
```

---

## 🗂️ Project Structure

```
src/
├─ components/              # UI components (UnsubscribeTable)
├─ theme/                  # Material UI theme setup
├─ App.tsx                 # Root application layout
├─ main.tsx                # App entry point
.vscode/                   # Editor settings (auto formatting, linting)
```

---

## 🧪 Available Commands

| Command           | Description                    |
| ----------------- | ------------------------------ |
| `pnpm dev`        | Start local dev server (Vite)  |
| `pnpm build`      | Create production build        |
| `pnpm preview`    | Preview the production build   |
| `pnpm lint`       | Run ESLint and auto-fix issues |
| `pnpm type-check` | Run TypeScript compiler only   |

---

## 🎯 Future Features (Planned)

- 🔐 Gmail API integration with OAuth 2.0
- 📥 Fetch unsubscribe links directly from inbox
- ✅ Auto-click or batch unsubscribe options
- 🔍 Search & filter by sender, subject, frequency
- 🧠 AI auto-suggestions: what to keep vs unsubscribe

---

## 📦 Built With

- [@mui/material](https://mui.com/material-ui/)
- [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [pnpm](https://pnpm.io/)
- [ESLint](https://eslint.org/)
- [Prettier](https://prettier.io/)

---

## 💡 VS Code Extensions (Recommended)

To maximize your dev experience:

- **ESLint** (`dbaeumer.vscode-eslint`)
- **Prettier** (`esbenp.prettier-vscode`)
- **TypeScript Hero** (optional: better imports)

Your `.vscode/` folder already contains workspace settings and tasks.

---

## 👨‍💻 Author

**Your Name**
[GitHub](https://github.com/yourusername) · [LinkedIn](https://linkedin.com/in/yourprofile) · [Email](mailto:you@example.com)

---

## 📄 License

MIT License — free for personal and commercial use.

---

## 🛠 Support or Contribute

If you found this useful, give it a ⭐ or open an issue to contribute.
