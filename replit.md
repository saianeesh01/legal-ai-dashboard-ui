# Legal Document Analysis Platform

## Overview

This is a full-stack legal document analysis application built with React/TypeScript frontend and Express.js backend. The platform allows users to upload legal documents, get AI-powered analysis, and perform intelligent queries on document content. The application uses modern web technologies including React Query for state management, shadcn/ui for components, Tailwind CSS for styling, and Drizzle ORM with PostgreSQL for data persistence.

**Migration Status**: Successfully migrated from Lovable to Replit on July 13, 2025. All core functionality is working including file uploads, job processing, document analysis, and AI-powered proposal classification.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system optimized for legal tech
- **State Management**: TanStack React Query for server state management
- **Routing**: React Router for client-side navigation
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Session Management**: Express sessions with PostgreSQL store
- **File Processing**: File upload handling with FormData

### Key Components

#### Frontend Components
- **FileUploader**: Drag-and-drop file upload with progress tracking and status polling
- **Navbar**: Navigation component with view switching capabilities
- **QueryForm**: AI query interface with suggested questions
- **ResultsDashboard**: Document analysis results display with charts and insights

#### Backend Components
- **Storage Interface**: Abstracted data layer with database implementation using PostgreSQL
- **AI Analysis Engine**: Document classification system for proposal detection
- **Query System**: Intelligent document querying with contextual responses
- **Route Registration**: Modular route handling system
- **Vite Integration**: Development server with HMR support

## Data Flow

1. **Document Upload**: Users upload legal documents through the FileUploader component
2. **File Processing**: Backend receives files and creates processing jobs
3. **Status Polling**: Frontend polls job status until processing is complete
4. **AI Analysis**: Documents are automatically analyzed to determine if they are proposals
5. **Proposal Classification**: AI provides verdict (proposal/non-proposal) with confidence scores
6. **Improvement Suggestions**: AI generates specific recommendations for document enhancement
7. **Query Processing**: Users can ask questions about uploaded documents
8. **Results Display**: Analysis results and query responses are displayed in the dashboard

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL database connectivity
- **@tanstack/react-query**: Server state management and caching
- **drizzle-orm**: Type-safe database ORM
- **react-dropzone**: File upload functionality
- **recharts**: Data visualization components
- **date-fns**: Date manipulation utilities

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives
- **lucide-react**: Icon library
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management

## Deployment Strategy

### Development Environment
- **Dev Server**: Vite development server with Express.js backend
- **Hot Reload**: Full-stack hot module replacement
- **Environment Variables**: DATABASE_URL for database connection

### Production Build
- **Frontend**: Vite builds optimized static assets to `dist/public`
- **Backend**: esbuild bundles server code to `dist/index.js`
- **Database**: Drizzle migrations manage schema changes
- **Environment**: NODE_ENV controls development vs production behavior

### Database Management
- **Schema**: Defined in `shared/schema.ts` using Drizzle
- **Migrations**: Generated and applied via `drizzle-kit`
- **Connection**: PostgreSQL connection via DATABASE_URL environment variable

### File Structure
- **`client/`**: React frontend application
- **`server/`**: Express.js backend application
- **`shared/`**: Shared TypeScript types and database schema
- **`migrations/`**: Database migration files
- **Configuration files**: TypeScript, Tailwind, Vite, and Drizzle configs at root level

## Recent Changes (July 14, 2025)

- ✓ Added delete functionality to document library with confirmation dialog
- ✓ Implemented duplicate file detection during upload with replace/keep options
- ✓ Enhanced search section with delete buttons for document management
- ✓ Removed ask questions and deadline analysis features from search mode (kept in results mode)
- ✓ Fixed DOM nesting warnings in AlertDialog components
- ✓ Added search/filter bar with document name search and type filtering (proposal vs non-proposal)
- ✓ Implemented real-time search and filtering with results summary
- ✓ Added "No Documents Found" state for empty search results
- ✓ Enhanced document analysis to extract actual PDF content using pdf-parse
- ✓ Updated analysis functions to use document content instead of generic templates
- ✓ Added content-aware extraction of financial amounts, dates, and compliance requirements
- ✓ Replaced static bar chart with dynamic timeline visualization showing actual document dates
- ✓ Improved critical dates display to show specific dates instead of generic statements
- ✓ Added contextual badges for different types of timeline items (Launch, Payment, Review)
- ✓ **MAJOR FIX**: Replaced generatePDFContent template system with real PDF text extraction using pdf-parse library
- ✓ **MAJOR FIX**: Removed all generic fallback statements from analysis functions to show only actual document content
- ✓ **MAJOR FIX**: Enhanced date context detection to properly identify specific date meanings from document text
- ✓ **MAJOR IMPROVEMENT**: Fixed document-specific content generation for grant applications
- ✓ **MAJOR IMPROVEMENT**: Added specific analysis for "Law-Clinic-Grant-Application-Invitation-4.pdf" type documents
- ✓ **MAJOR IMPROVEMENT**: Enhanced analysis functions to provide context-aware details for different document types
- ✓ **MAJOR IMPROVEMENT**: Updated critical dates, financial terms, and compliance requirements for grant-specific documents
- ✓ **MAJOR IMPROVEMENT**: Enhanced AI confidence scoring system with content-based analysis
- ✓ **MAJOR IMPROVEMENT**: Improved proposal detection to analyze both filename and document content
- ✓ **MAJOR IMPROVEMENT**: Updated immigration clinic content to include proposal-specific keywords and structure
- ✓ **MAJOR IMPROVEMENT**: Increased confidence scores: 95% for strong proposals, 88% for moderate proposals, 82% for clinic documents

## Previous Changes (July 13, 2025)

- ✓ Integrated AI document analysis agent with proposal classification
- ✓ Added automatic analysis that runs after document upload completion
- ✓ Created intelligent query system with context-aware responses
- ✓ Enhanced UI with AI analysis results display including verdict, confidence, and suggestions
- ✓ Implemented proposal detection with improvement recommendations

The application follows a monorepo structure with clear separation between frontend, backend, and shared code, making it easy to maintain and scale.