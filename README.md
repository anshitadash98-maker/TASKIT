# Taskit
— C2 Task Tracker

A high-performance, cinematic task management application built exclusively with **Vanilla HTML5, CSS3, and JavaScript** on the frontend, powered by **Node.js, Express.js, and SQLite** on the backend.

---

## 🌟 Visual & Cinematic Highlights

- **Atmospheric Golden Sunset Skyscrapers Background**:
  - Full-screen HTML5 `<video autoplay muted loop playsinline>` element with smooth opacity fade-in.
  - High-definition SVG poster fallback (`assets/images/skyscrapers-sunset.svg`) for instant loading and offline resilience.
  - Full `@media (prefers-reduced-motion: reduce)` support.
  - Warm amber multi-stop scrim overlay guaranteeing WCAG AA readability for foreground text.
- **Left Hero Section**:
  - **Taskora** branding with geometric golden badge icon.
  - Headline: *"Plan Smarter. Stay Focused. Get Things Done."*
  - Supporting text: *"Organize your everyday tasks, manage your priorities and stay on top of everything that matters."*
  - Interactive clickable slider dots cycling through core task management capabilities.
- **Right Clean White Login Card**:
  - Clean elevated white card with amber/golden accents.
  - Card title: *"Welcome Back!"* and subtitle: *"Log in to continue organizing your day."*
  - Email field with validation.
  - Password field with interactive show/hide visibility eye toggle button.
  - Custom-styled amber "Remember me" checkbox.
  - "Forgot Password?" recovery link.
  - Primary login button with amber gradient, hover glow, and loading spinner.
  - **Conditional Google OAuth**: Rendered strictly **only** if `ENABLE_GOOGLE_AUTH=true` and a Google Client ID is configured.
  - One-click demo credentials autofill button.
  - New user sign-up link seamlessly toggling to registration form.

---

## ⚡ Strictly Framework-Free Architecture

- **Frontend**: 100% Pure Vanilla HTML5, CSS3, and JavaScript (ES6+). Zero React, zero JSX, zero virtual DOM, zero external component libraries.
- **Backend**: Node.js & Express.js.
- **Database**: SQLite using Node's built-in `node:sqlite` (`taskora.db`).
- **Security**: Salted password hashing with `bcryptjs`, session handling with `jsonwebtoken`.

---

## 🚀 How to Run

1. **Install Dependencies** (if needed):
   ```bash
   npm install
   ```

2. **Start the Server**:
   ```bash
   npm start
   ```

3. **Open the Application**:
   Navigate to [http://localhost:3000](http://localhost:3000) (or `http://127.0.0.1:3000`) in your browser.

4. **Default Demo Credentials**:
   - **Email:** `demo@taskora.com`
   - **Password:** `Taskora123!`
   *(Or click the "Quick Fill" button on the login card to autofill immediately)*
