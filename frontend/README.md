# Frontend

Next.js 14 frontend cho AI Code Reviewer.

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

App runs at: http://localhost:3000

## Build

```bash
npm run build
npm run start
```

## Features

- 🔐 Authentication (Login/Register)
- 📊 Dashboard với project management
- ⚙️ Settings page cho GitHub/GitLab tokens
- 🎨 Modern UI với Tailwind CSS
- 📱 Responsive design
- 🔄 Real-time updates

## Project Structure

```
src/
├── app/              # Next.js 14 App Router
│   ├── (auth)/      # Auth pages
│   ├── dashboard/   # Dashboard pages
│   └── layout.tsx
├── components/       # Reusable components
│   └── ui/          # UI components
├── services/        # API services
├── store/           # Zustand state management
└── lib/             # Utilities
```
