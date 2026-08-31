# Campus Safety App (Monorepo)

Welcome to the **Campus Safety App** repository! This project is a comprehensive safety management solution designed for educational institutions. It consists of a mobile application for students to report incidents, a web-based dashboard for college administrators, and a centralized backend API to orchestrate everything.

---

## 🏗️ Architecture & Structure

This repository is structured as a **Monorepo**, housing the following core services:

- **`/backend`** - The core API and business logic.
  - Framework: NestJS (TypeScript)
  - Database Management: Prisma ORM
  - Purpose: Serves endpoints for user authentication, incident reporting, notifications, and data management.

- **`/student-frontend`** - The Student Mobile App.
  - Framework: React Native / Expo
  - Purpose: Provides students with an intuitive interface to report safety concerns, view emergency contacts, and receive alerts.

- **`/Admin-collge-portal`** - The College Administrator Dashboard.
  - Purpose: Allows security personnel and college administrators to manage incidents, track reports, and communicate with students.

---

## 🚀 Getting Started

### Prerequisites
Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/en/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/MagnetSystem/Safety-App.git
cd Safety-App
```

### 2. Local Setup
Each application runs independently. To start development, open separate terminal windows for each service and follow their specific README instructions (if applicable), or run standard install commands:

**Starting the Backend:**
```bash
cd backend
npm install
npm run start:dev
```

**Starting the Student App:**
```bash
cd student-frontend
npm install
npx expo start
```

**Starting the Admin Portal:**
```bash
cd Admin-collge-portal/campus-safety-admin
npm install
npm run dev
```

---

## 🌿 Git Workflow & Branching Strategy

To maintain a scalable and professional workflow, we follow a strict branching strategy.

### Core Branches
1. **`main`** - The production-ready code. Commits on this branch should be fully tested and ready to deploy.
2. **`production`** - Represents the live production environment.
3. **`testing`** - Used for Quality Assurance (QA). All new features are merged here for testing before going to production.
4. **`development`** - The active integration branch where all new features are merged first.

### Feature Development (How to contribute)
When building a new feature, always create a new branch branching off `development`:
```bash
git checkout development
git pull origin development
git checkout -b feature/your-feature-name
```
Once your work is done, create a Pull Request (PR) to merge `feature/your-feature-name` into `development`.

---

## 🔐 Security Best Practices

- **Never commit `.env` files.** Always use `.env.example` to share environment variable templates.
- Ensure you have run `npm audit` periodically to catch vulnerable dependencies.
- Keep credentials out of the source code.

---

## ⚙️ CI/CD Pipeline Setup

This repo has **3 automated GitHub Actions workflows** that trigger on every push to `main`. Here is everything needed to make them active.

### How It Works

| When you push to `main`... | It deploys to... |
|---|---|
| Changes in `backend/**` | 🚂 **Railway** (Backend API) |
| Changes in `Admin-collge-portal/**` | 🔺 **Vercel** (Admin Portal — Production) |
| Changes in `student-frontend/**` | 📱 **EAS OTA Update** (Student App via Expo Go) |

---

### Step 1 — Add GitHub Repository Secrets

Go to **`github.com/MagnetSystem/Safety-App` → Settings → Secrets and variables → Actions** and add the following:

#### 🚂 Backend → Railway
| Secret | How to get it |
|---|---|
| `RAILWAY_TOKEN` | Railway Dashboard → Account Settings → Tokens → Create Token |
| `RAILWAY_SERVICE_NAME` | The exact service name in your Railway project |
| `DATABASE_URL` | Your database connection string (used during build validation) |

#### 🔺 Admin Portal → Vercel
| Secret | How to get it |
|---|---|
| `VERCEL_TOKEN` | Vercel Dashboard → Settings → Tokens → Create |
| `VERCEL_ORG_ID` | Vercel project settings page, or run `vercel whoami` locally |
| `VERCEL_PROJECT_ID` | Found in `.vercel/project.json` after running `vercel link` in the admin portal folder |
| `VITE_API_URL` | Your Railway backend public URL (e.g. `https://your-api.up.railway.app`) |

#### 📱 Student App → EAS (Expo Go)
| Secret | How to get it |
|---|---|
| `EXPO_TOKEN` | [expo.dev](https://expo.dev) → Account → Access Tokens → Create |
| `EXPO_PUBLIC_API_URL` | Your Railway backend public URL (same as `VITE_API_URL`) |

---

### Step 2 — One-Time EAS Setup (run locally, only once)

Before the student app workflow can run, EAS must be initialised:

```bash
# 1. Install EAS CLI globally
npm install --global eas-cli

# 2. Login to your Expo account
eas login

# 3. Go into the student frontend folder
cd student-frontend

# 4. Link the project to your Expo account (generates a projectId in app.json)
eas init

# 5. Configure update channels
eas update:configure

# 6. Commit the updated app.json
git add app.json
git commit -m "chore: link project to EAS"
git push origin main
```

---

### Step 3 — Share the App with iOS Testers (Expo Go)

iOS testers do not need an APK. They use the **Expo Go** app:

1. Tester installs **Expo Go** from the App Store
2. Share your project URL: `https://expo.dev/@YOUR_EXPO_USERNAME/student-app`
3. Tester taps the link → opens in Expo Go → app loads instantly
4. Every future push to `main` triggers `eas update` → app updates silently on next open ✅

> **Android testers** can use Expo Go the same way, OR you can run `eas build --profile preview --platform android` to generate a shareable `.apk` install link.

---

### Whose Credentials to Use

Since the code is pushed from a personal account to the company repo, the credentials should belong to **whoever owns the deployment services**. Ideally:
- Create company accounts on Railway, Vercel, and Expo
- Generate tokens from those accounts
- A repo admin stores them as GitHub Secrets in this repo
- CI/CD then runs entirely under company credentials

---

*Maintained by MagnetSystems.*
