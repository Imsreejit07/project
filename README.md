# FlowState — AI-Powered Personal Productivity System

An intelligent productivity platform that helps you organize work, clarify priorities, and make consistent progress toward meaningful goals. FlowState functions as a strategic assistant, not just a task manager.

## Features

- **Goal → Project → Task Hierarchy**: Connect daily tasks to long-term objectives
- **AI Planning Engine**: Automatically generates optimized daily plans based on priority, deadlines, energy levels, and historical patterns
- **Conversational AI Assistant**: Plan your day, create tasks, and get insights through natural language
- **Smart Prioritization**: Multi-factor scoring considers urgency, importance, goal alignment, momentum, and task age
- **Energy-Aware Scheduling**: Matches high-energy tasks to your peak focus times
- **Pattern Analysis**: Learns from your work habits to improve suggestions over time
- **Clean, Fast UI**: Minimal and intuitive interface focused on reducing decision fatigue

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express, TypeScript
- **Database**: SQLite (via better-sqlite3) with WAL mode
- **AI**: OpenAI API integration (optional — works fully with built-in planning engine)

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Installation

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server && npm install && cd ..

# Install client dependencies
cd client && npm install && cd ..
```

### Running in Development

```bash
# Start both server and client
npm run dev
```

Or start them separately:
```bash
# Terminal 1: Start the API server (port 3001)
cd server && npm run dev

# Terminal 2: Start the frontend dev server (port 5173)
cd client && npm run dev
```

### AI Assistant

The AI assistant works in two modes:

1. **Built-in Planning Engine** (default): Uses the local planning engine for intelligent responses. No API key required.
2. **OpenAI-Enhanced**: Set `OPENAI_API_KEY` in your environment for richer conversational AI.

```bash
# Optional: enable OpenAI-powered chat
set OPENAI_API_KEY=your-key-here
```

### Production Build

```bash
npm run build
npm start
```

## Architecture

```
flowstate/
├── server/                 # Backend API
│   └── src/
│       ├── index.ts        # Express server entry
│       ├── routes/api.ts   # REST API routes
│       ├── db/
│       │   ├── database.ts # SQLite initialization & schema
│       │   └── operations.ts # Data access layer
│       └── ai/
│           ├── planningEngine.ts # Priority scoring & plan generation
│           └── assistant.ts      # Conversational AI + action execution
├── client/                 # React frontend
│   └── src/
│       ├── App.tsx
│       ├── api.ts          # API client
│       ├── types.ts        # TypeScript types
│       ├── context/        # State management
│       └── components/     # UI components
└── data/                   # SQLite database (auto-created)
```

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/user | Get or create user |
| GET/POST | /api/goals | List/create goals |
| GET/POST | /api/projects | List/create projects |
| GET/POST | /api/tasks | List/create tasks |
| PUT | /api/tasks/:id | Update task |
| POST | /api/ai/plan | Generate daily plan |
| POST | /api/ai/chat | Chat with AI assistant |
| GET | /api/ai/suggestions | Get task suggestions |
| GET | /api/ai/patterns | Analyze work patterns |
| GET | /api/stats | Get user statistics |
