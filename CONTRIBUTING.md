# Contributing to Moment Keeper 🎁

Thank you for your interest in contributing to **Moment Keeper**! We welcome bug fixes, UI enhancements, documentation updates, and new features.

---

## 📜 Code of Conduct

Please treat all community members with respect, kindness, and empathy. Keep discussions constructive and focused on project goals.

---

## 🛠️ How to Contribute

### 1. Report Issues
If you encounter a bug or have a feature idea:
- Check existing [GitHub Issues](https://github.com/Shree-varshan-430/Moment-keeper/issues) to avoid duplicates.
- Open a new issue with a clear description, reproduction steps, expected behavior, and screenshots (if applicable).

### 2. Submit Pull Requests (PRs)

1. **Fork the repository** on GitHub.
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/Moment-keeper.git
   cd Moment-keeper
   ```
3. **Create a new feature branch**:
   ```bash
   git checkout -b feature/amazing-new-feature
   ```
4. **Set up local environment**:
   Copy `.env.example` to `.env`. Contributors are encouraged to connect their own free Firebase project keys in `.env` for isolated local testing.
   ```bash
   cp .env.example .env
   ```
5. **Make your changes** and test them:
   ```bash
   npm run dev
   npm run build
   ```
5. **Commit your changes** with descriptive commit messages:
   ```bash
   git commit -m "feat(ui): add new milestone celebration animation"
   ```
6. **Push to your branch**:
   ```bash
   git push origin feature/amazing-new-feature
   ```
7. **Open a Pull Request** against the `main` branch of the original repository.

---

## 📐 Coding Conventions

- **TypeScript**: Use strict typing and export clean interfaces in `@/types`.
- **Styling**: Use Tailwind CSS classes consistent with the app's dark silver/glassmorphic theme.
- **State Management**: Keep store logic isolated inside `src/store/`.
- **Security**: Never commit API secrets or private tokens. Security rules in `firestore.rules` must remain strict.

Thank you for helping make Moment Keeper better for everyone! 🎉
