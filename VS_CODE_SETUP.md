# Visual Studio Code Setup Guide

## Prerequisites

### Required Software
1. **Node.js 20+** - Download from [nodejs.org](https://nodejs.org/)
2. **PostgreSQL** - Download from [postgresql.org](https://postgresql.org/)
3. **Visual Studio Code** - Download from [code.visualstudio.com](https://code.visualstudio.com/)
4. **Git** - Download from [git-scm.com](https://git-scm.com/)

### Recommended VS Code Extensions
```
ms-vscode.vscode-typescript-next
bradlc.vscode-tailwindcss
ms-vscode.vscode-json
esbenp.prettier-vscode
ms-vscode.vscode-eslint
ms-python.python
ms-vscode.hexeditor
```

## Project Setup

### 1. Clone and Install
```bash
# Clone the project
git clone <your-repo-url>
cd legal-ai-platform

# Install dependencies
npm install

# Install Python dependencies (for redaction)
pip install -r requirements.txt
```

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/legalai

# Node Environment
NODE_ENV=development

# AI Service Configuration (optional)
AI_SERVICE_URL=http://localhost:5001

# Encryption Key (generate a secure 32-byte hex string)
ENCRYPTION_KEY=your-32-byte-hex-encryption-key-here
```

### 3. Database Setup
```bash
# Create PostgreSQL database
createdb legalai

# Run database migrations
npm run db:push
```

### 4. Development Server
```bash
# Start the full-stack development server
npm run dev
```

This starts:
- Frontend (React/Vite) on http://localhost:5000
- Backend (Express API) on the same port
- Hot module replacement for both frontend and backend

## VS Code Configuration

### Launch Configuration (.vscode/launch.json)
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch Full Stack",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/server/index.ts",
      "env": {
        "NODE_ENV": "development"
      },
      "runtimeArgs": ["--loader", "tsx/esm"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### Tasks Configuration (.vscode/tasks.json)
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "dev server",
      "type": "shell",
      "command": "npm",
      "args": ["run", "dev"],
      "group": {
        "kind": "build",
        "isDefault": true
      },
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      },
      "isBackground": true
    },
    {
      "label": "build",
      "type": "shell",
      "command": "npm",
      "args": ["run", "build"],
      "group": "build"
    }
  ]
}
```

### Settings (.vscode/settings.json)
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  },
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

## Development Workflow

### 1. Start Development
```bash
# Terminal 1: Start main development server
npm run dev

# Terminal 2: Watch for database changes (optional)
npm run db:studio
```

### 2. Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run db:push      # Push schema changes to database
npm run db:studio    # Open database studio
npm run test         # Run tests
```

### 3. Hot Reload Features
- **Frontend**: Instant reload on React component changes
- **Backend**: Automatic restart on server file changes
- **Database**: Schema changes via Drizzle migrations
- **Styles**: Instant Tailwind CSS updates

## Project Structure in VS Code

```
legal-ai-platform/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Route pages
│   │   ├── lib/           # Utilities and API client
│   │   └── hooks/         # Custom React hooks
├── server/                # Express backend
│   ├── routes.ts          # API endpoints
│   ├── storage.ts         # Database interface
│   ├── pdf_extractor.ts   # PDF processing
│   └── corruption_detector.ts # Text validation
├── shared/                # Shared TypeScript types
│   └── schema.ts          # Database schema
├── ai_service/            # Flask AI service (optional)
└── migrations/            # Database migrations
```

## Debugging

### Frontend Debugging
1. Use VS Code's built-in browser debugging
2. Open Chrome DevTools (F12)
3. Set breakpoints in TypeScript files
4. Use React Developer Tools extension

### Backend Debugging
1. Use VS Code's Node.js debugger
2. Set breakpoints in server files
3. Launch with F5 or Debug panel
4. Inspect variables and call stack

### Database Debugging
```bash
# Connect to database directly
npm run db:studio

# View logs
npm run dev # Check console output
```

## Production Build

### Build for Production
```bash
npm run build
```

### Deploy to Production
The built files will be in:
- Frontend: `dist/public/`
- Backend: `dist/index.js`

## AI Service Integration (Optional)

If you want the full AI analysis with Mistral:

### Option 1: Docker (Recommended)
```bash
# Install Docker Desktop
# Then run:
docker-compose up ai_service
```

### Option 2: Local Ollama Installation
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull Mistral model
ollama pull mistral:latest

# Start Flask service
cd ai_service
python app.py
```

## Troubleshooting

### Common Issues
1. **Port conflicts**: Change port in `server/index.ts`
2. **Database connection**: Check DATABASE_URL in `.env`
3. **TypeScript errors**: Run `npm run build` to check all types
4. **Hot reload not working**: Restart VS Code and clear cache

### Performance Tips
- Use VS Code's TypeScript version
- Enable "Format on Save" for consistent code style
- Use the integrated terminal for faster development
- Install recommended extensions for better IntelliSense

## Features Available

✅ **Document Upload & Analysis** - Drag-and-drop PDF processing
✅ **AI Classification** - Automatic document type detection  
✅ **Personal Info Redaction** - Automatic privacy protection
✅ **Security Encryption** - AES-256 document encryption
✅ **Real-time Status** - Upload progress and processing status
✅ **Search & Filter** - Document library management
✅ **Query System** - Ask questions about documents
✅ **Legal Analysis** - Specialized legal document insights

The system is production-ready and works perfectly in Visual Studio Code!