# AhoyBot

AhoyBot is a pirate-themed, multi-session AI chat web app built with React and Node.js. It features persistent chat history, a modern dark UI, and compact, right-aligned chat bubbles-just like your favorite messaging apps!

## Features

- **Pirate-Themed UI:** Fun, immersive chat experience with a pirate twist!
- **Multi-Session Chat:** Create, switch, and delete multiple chat threads.
- **Persistent History:** All chats are saved in your browser and restored after reload.
- **Modern Dark Mode:** Clean, compact, and easy on the eyes.
- **Fast & Local:** No backend required for history-everything is saved in your browser.
- **AI-Powered:** Connects to your AI backend (e.g., Gemini, OpenAI, etc.).


## Getting Started

### 1. **Clone the Repository**
```bash
git clone https://github.com/yourusername/ahoybot.git
cd ahoybot
```

### 2. **Install Dependencies**

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd ../frontend
npm install
```

### 3. **Configure Environment Variables**

In `backend/.env`:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. **Run the App**

#### Start Backend
```bash
cd backend
node server.js
```

#### Start Frontend
```bash
cd ../frontend
npm run dev
```

## Project Structure
```bash
ahoybot/
backend/
server.js
.env
package.json
frontend/
src/
App.jsx
App.css
index.css
package.json
```

## Fair winds and happy chatting, matey!
