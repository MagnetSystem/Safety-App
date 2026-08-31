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
*Maintained by MagnetSystem.*
