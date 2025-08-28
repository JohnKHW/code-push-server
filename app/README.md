# CodePush Admin Panel

A React-based administration panel for managing CodePush applications, deployments, and releases.

## Features

- **Authentication**: Secure Access Key-based authentication
- **App Management**: Create, edit, and delete applications
- **Deployment Management**: Manage deployment environments (Production, Staging, etc.)
- **Release Management**: Upload and manage application releases
- **Release History**: View complete release history with rollback capabilities
- **Real-time Updates**: Live status monitoring and updates

## Tech Stack

- **Framework**: React 20 + TypeScript
- **UI Library**: Ant Design (antd)
- **Styling**: Tailwind CSS v4
- **HTTP Client**: Axios
- **Routing**: React Router
- **Date/Time**: Moment.js
- **Utilities**: Lodash
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js 18+ (recommended: 20+)
- npm or yarn
- Running CodePush server instance

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
# .env.development
VITE_API_URL=http://localhost:3000

# .env.production  
VITE_API_URL=https://your-codepush-server.com
```

3. Start development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

### Authentication

1. Open the application in your browser
2. Enter your CodePush Access Key
3. The key will be validated against your CodePush server
4. Once authenticated, you can manage apps and deployments

### Getting an Access Key

You can obtain an Access Key through:
- Your CodePush server's authentication page
- The CodePush CLI: `code-push access-key add "Admin Panel"`

## Project Structure

```
src/
├── api/           # HTTP client configuration
├── components/    # Reusable UI components
├── hooks/         # Custom React hooks
├── pages/         # Application pages
├── utils/         # Utility functions
└── main.tsx       # Application entry point
```

## Configuration

### API Integration

The admin panel communicates with your CodePush server using:
- **Base URL**: Configured via `VITE_API_URL`
- **Authentication**: Bearer token (Access Key)
- **API Version**: `application/vnd.code-push.v2+json`

### CORS Setup

Ensure your CodePush server allows requests from the admin panel domain:
```bash
# Add your admin panel URL to CORS_ORIGIN
CORS_ORIGIN=http://localhost:5173,https://your-admin-panel.com
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Browser Support

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## License

This project is part of the CodePush Server suite.