# Jungengesellschaft Website

A modern, full-stack web application for the Jungengesellschaft Pferdestall Wedes-Wedel organization, featuring event management, user authentication, and an interactive calendar system.

## 🏗️ Project Structure

```
JC/
├── public/                 # Static assets (images, PDFs, favicon)
│   └── assets/            # Production images and documents
├── src/                    # Source code
│   ├── components/         # React components organized by feature
│   │   ├── Admin/         # Admin panel components
│   │   ├── Auth/          # Authentication components
│   │   ├── Calendar/      # Calendar and event components
│   │   ├── Layout/        # Layout components (Header, Footer, etc.)
│   │   ├── Profile/       # User profile components
│   │   └── UI/            # Reusable UI components
│   ├── contexts/          # React contexts (Auth, DarkMode)
│   ├── lib/               # Library configurations (Supabase client)
│   ├── pages/             # Page components (routes)
│   ├── services/          # API service layers
│   ├── utils/             # Utility functions and helpers
│   └── __tests__/         # Unit and API tests
│       ├── api/           # API integration tests
│       ├── security/      # Security tests
│       └── unit/          # Unit tests
├── supabase/              # Supabase backend configuration
│   ├── functions/         # Edge Functions
│   └── migrations/        # Database migrations
├── tests/                 # E2E and visual tests
│   ├── e2e/               # End-to-end tests (Playwright)
│   ├── visual/            # Visual regression tests
│   ├── security/          # Security tests
│   ├── setup/             # Test setup and helpers
│   └── unit/              # Additional unit tests
├── scripts/               # Development and utility scripts
├── docs/                  # Project documentation
└── config files           # Root-level configs (craco, tailwind, etc.)
```

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- Supabase account and project
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd JC
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install Playwright browsers** (for E2E tests)
   ```bash
   npx playwright install --with-deps
   ```

4. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   REACT_APP_SUPABASE_URL=https://your-project.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
   ```

5. **Start the development server**
   ```bash
   npm start
   ```
   
   The app will open at `http://localhost:3000`

## 📦 Development

### Available Scripts

#### Development
- `npm start` - Start development server
- `npm run build` - Build for production

#### Testing
- `npm test` - Run all tests (unit, API, E2E, visual)
- `npm run test:unit` - Run unit tests only
- `npm run test:api` - Run API tests only
- `npm run test:e2e` - Run E2E tests
- `npm run test:visual` - Run visual regression tests
- `npm run test:security` - Run security tests

See `docs/TESTING.md` for detailed testing documentation.

#### Verification
- `npm run verify` - Verify application functionality

## 🏭 Production

### Build

```bash
npm run build
```

This creates an optimized production build in the `build/` directory.

### Deployment

The project is configured for deployment on **Vercel**:

1. Connect your repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

See `docs/VERCEL_ENV_SETUP.md` for detailed deployment instructions.

## 🧪 Testing

The project includes comprehensive testing:

- **Unit Tests**: Jest-based tests for utilities and helpers
- **API Tests**: Integration tests for Supabase Edge Functions
- **E2E Tests**: Playwright browser tests for user flows
- **Visual Tests**: Screenshot comparison tests
- **Security Tests**: RLS policies and security validation

See `docs/TESTING.md` for complete testing documentation.

## 📚 Documentation

All project documentation is located in the `docs/` directory:

- `TESTING.md` - Complete testing guide
- `VERCEL_ENV_SETUP.md` - Deployment and environment setup
- `SECURITY_AUDIT_REPORT.md` - Security audit findings
- `EMAIL_SYSTEM_OVERVIEW.md` - Email system documentation
- And more...

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **React Router** - Routing
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **React Big Calendar** - Calendar component

### Backend
- **Supabase** - Backend as a Service
  - PostgreSQL database
  - Row Level Security (RLS)
  - Edge Functions
  - Authentication

### Testing
- **Jest** - Unit and API testing
- **Playwright** - E2E and visual testing
- **@axe-core/playwright** - Accessibility testing

### Build & Deploy
- **Create React App** (via CRACO)
- **Vercel** - Hosting and deployment

## 🔒 Security

The project implements multiple security measures:

- Row Level Security (RLS) policies
- Input validation and sanitization
- Secure error handling
- Environment variable protection
- Code obfuscation in production builds

See `docs/SECURITY_AUDIT_REPORT.md` and `docs/RLS_POLICIES_DOCUMENTATION.md` for details.

## 📁 Key Directories

### `src/components/`
React components organized by feature:
- `Admin/` - Admin panel components
- `Auth/` - Login, registration, email confirmation
- `Calendar/` - Event calendar and request forms
- `Layout/` - Header, Footer, SideMenu, Layout wrapper
- `Profile/` - User profile and event requests
- `UI/` - Reusable UI components

### `src/services/`
API service layers:
- `databaseApi.js` - Database operations
- `emailApi.js` - Email service API
- `emailService.js` - Email service logic
- `specialEventsApi.js` - Special events management

### `supabase/`
Backend configuration:
- `functions/` - Edge Functions (TypeScript)
- `migrations/` - Database migration SQL files

### `tests/`
Test suites:
- `e2e/` - End-to-end browser tests
- `visual/` - Visual regression tests with snapshots
- `security/` - Security and RLS tests
- `setup/` - Test helpers and mocks

## 🔧 Configuration Files

- `craco.config.js` - CRACO configuration (webpack customization)
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `playwright.config.ts` - Playwright E2E test configuration
- `playwright.visual.config.ts` - Visual regression test configuration
- `vercel.json` - Vercel deployment configuration

## 🌍 Environment Variables

### Required
- `REACT_APP_SUPABASE_URL` - Supabase project URL
- `REACT_APP_SUPABASE_ANON_KEY` - Supabase anonymous key

### Optional (for testing)
- `TEST_BASE_URL` - Base URL for E2E tests
- `TEST_USER_EMAIL` - Test user email
- `TEST_USER_PASSWORD` - Test user password

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests: `npm test`
4. Submit a pull request

## 📝 License

Private project - All rights reserved

## 🆘 Support

For issues or questions, please refer to the documentation in the `docs/` directory or contact the development team.

---

**Last Updated**: November 2025
**Version**: 1.0.0

