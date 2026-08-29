# Moment Keeper 🎁

> A life-event reminder, milestone tracker, and private memory note application built with React, Vite, Tailwind CSS, Capacitor, and Firebase.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Capacitor](https://img.shields.io/badge/Capacitor-6-119EFF?logo=capacitor)
![Firebase](https://img.shields.io/badge/Firebase-10-FFCA28?logo=firebase)

---

## ✨ Features

- 📅 **Milestone Tracking**: Never miss birthdays, anniversaries, weddings, or custom events with real-time day countdowns.
- 🔔 **Early Smart Notifications**: Automated local push notifications (7-day, 3-day, 1-day, and same-day reminders) across mobile and web.
- 🔒 **Zero-Knowledge Client-Side Encryption (AES-256-GCM)**: Lock private memories with a custom 4-digit passcode. Encrypted locally before committing to database.
- 👥 **Group Collaboration & Family Sharing**: Create groups (Family, Friends, Office) and share events in real time.
- 👤 **Contact & Person Profiles**: Store details for loved ones—favorite foods, colors, relationship tags, photo uploads, and gift ideas log.
- 📲 **Contact & Google Calendar Import**: Import dates seamlessly from device contacts or Google Calendar API.
- 🎵 **Spotify Alarm Integration**: Link Spotify playlists or tracks to event celebrations.
- 📱 **Cross-Platform Ready**: Fully responsive web app + native Android package powered by Capacitor.
- 📴 **Offline First Support**: Full offline caching with automatic background sync when connectivity is restored.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS v4, Lucide Icons, Framer Motion
- **State Management**: Zustand
- **Backend & Database**: Firebase Firestore (Offline Persistence), Firebase Auth, Firebase Storage
- **Native Wrapper**: Capacitor (Android / iOS)
- **Security**: PBKDF2 + AES-256-GCM client-side encryption, granular Firestore Security Rules

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- `npm` or `yarn`

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Shree-varshan-430/Moment-keeper.git
   cd Moment-keeper
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and fill in your Firebase configuration keys:
   ```bash
   cp .env.example .env
   ```

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📱 Android Build & Deployment

To sync web assets and build the native Android project:

```bash
# Build the production bundle
npm run build

# Sync assets to Capacitor Android project
npx cap sync android

# Run compile check for Android
cd android
.\gradlew.bat compileDebugJavaWithJavac
```

---

## 🤝 Contributing

Contributions are welcome! Please check out [CONTRIBUTING.md](./CONTRIBUTING.md) for details on how to submit bug reports, feature requests, and Pull Requests.

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE).
