# Legal Document Analysis Platform

## Overview
This is a full-stack legal document analysis application that provides AI-powered analysis and intelligent querying of legal documents. The platform's main purpose is to allow users to upload legal documents and receive AI-powered insights, including proposal classification and improvement suggestions. It aims to streamline legal document review and analysis processes.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system optimized for legal tech
- **State Management**: TanStack React Query for server state management
- **Routing**: React Router
- **Form Handling**: React Hook Form with Zod validation
- **UI/UX Decisions**: Focus on clear navigation (Navbar), intuitive file uploads (FileUploader), and comprehensive results display (ResultsDashboard). Contextual help tooltips are integrated throughout the application.

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM (using Neon Database)
- **Session Management**: Express sessions with PostgreSQL store
- **File Processing**: Handles file uploads, PDF text extraction, and privacy protection (redaction).
- **AI Analysis Engine**: Document classification system for proposal detection, multi-label classification (e.g., NTA, motions), and intelligent document querying. Includes a text corruption detection and prevention system.

### Key Components & Features
- **File Upload & Processing**: Drag-and-drop file upload with progress tracking. Backend processes files, extracts text (PDFExtractor), and applies privacy protection (PersonalInfoRedactor).
- **AI-Powered Analysis**: Automatically classifies documents (e.g., proposal/non-proposal, NTA, motion) with confidence scores. Provides improvement suggestions and generates document summaries.
- **Intelligent Query System**: Allows users to ask questions about uploaded documents and receive contextual responses.
- **Data Flow**: Document upload -> File processing -> AI Analysis (classification, summarization, redaction) -> Query processing -> Results display.
- **Document Security**: Implements AES-256 encryption for uploaded documents and redaction of sensitive personal information before storage. Integrity verification is performed.
- **Content Generation**: When PDF parsing fails, the system provides classification-friendly content generation based on filename and context.
- **Error Handling**: Robust error handling for PDF extraction, providing clean failures with 422 errors instead of corrupted text.

### Deployment Strategy
- **Development Environment**: Vite development server with Express.js backend, full-stack hot module replacement.
- **Production Build**: Frontend builds optimized static assets; backend bundles server code.
- **Database Management**: Drizzle migrations manage schema changes.
- **File Structure**: Monorepo with `client/` (React), `server/` (Express), `shared/` (types, schema), and `migrations/`.

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL database connectivity.
- **@tanstack/react-query**: Server state management and caching.
- **drizzle-orm**: Type-safe database ORM.
- **react-dropzone**: File upload functionality.
- **recharts**: Data visualization components.
- **date-fns**: Date manipulation utilities.
- **pdfjs-dist**: PDF text extraction.
- **pdf-lib**: For PDF redaction and manipulation.
- **Node.js crypto module**: For encryption.

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives.
- **lucide-react**: Icon library.
- **tailwindcss**: Utility-first CSS framework.
- **class-variance-authority**: Component variant management.

### AI/ML Dependencies
- **Ollama**: For AI model integration (e.g., Mistral).
- **Flask**: Used for the AI service bridge.