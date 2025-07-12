# StackIt Frontend

A modern React-based frontend for the StackIt Q&A forum platform, built with TypeScript, Tailwind CSS, and real-time features.

## 🚀 Features

- **Modern React 18** with TypeScript for type safety
- **Tailwind CSS** for utility-first styling
- **React Router** for client-side routing
- **React Query** for server state management
- **Socket.io Client** for real-time features
- **React Hook Form** for form handling
- **Lucide React** for beautiful icons
- **Framer Motion** for animations
- **Zustand** for client state management

## 📦 Dependencies

### Core Dependencies
- `react` & `react-dom` - React framework
- `react-router-dom` - Client-side routing
- `react-query` - Server state management
- `axios` - HTTP client
- `socket.io-client` - Real-time communication

### UI & Styling
- `tailwindcss` - Utility-first CSS framework
- `lucide-react` - Icon library
- `framer-motion` - Animation library
- `react-hot-toast` - Toast notifications
- `react-loading-skeleton` - Loading states

### Forms & Input
- `react-hook-form` - Form handling
- `react-select` - Select components
- `react-dropzone` - File uploads
- `react-datepicker` - Date picker

### Content & Rich Text
- `react-markdown` - Markdown rendering
- `react-syntax-highlighter` - Code syntax highlighting

### State Management
- `zustand` - Lightweight state management
- `immer` - Immutable state updates

## 🛠️ Development Setup

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm start
```

The app will be available at `http://localhost:3000`

### Available Scripts
- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout/         # Layout components
│   ├── UI/             # Basic UI components
│   └── Forms/          # Form components
├── contexts/           # React contexts
│   ├── AuthContext.tsx # Authentication state
│   └── SocketContext.tsx # Socket.io connection
├── pages/              # Page components
│   ├── Auth/           # Authentication pages
│   ├── Questions/      # Question-related pages
│   └── Profile/        # User profile pages
├── hooks/              # Custom React hooks
├── services/           # API services
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── styles/             # Global styles
├── App.tsx             # Main app component
└── index.tsx           # App entry point
```

## 🎨 Styling

The project uses Tailwind CSS with a custom configuration:

- **Primary Colors**: Blue theme for main actions
- **Secondary Colors**: Gray theme for neutral elements
- **Success Colors**: Green theme for positive actions
- **Warning Colors**: Yellow theme for warnings
- **Error Colors**: Red theme for errors

### Custom Classes
- `.fade-in` - Fade in animation
- `.slide-in` - Slide in animation
- `.bounce-in` - Bounce in animation

## 🔌 API Integration

The frontend connects to the backend API at `http://localhost:5000` with the following features:

- **Authentication**: JWT-based auth with automatic token management
- **Real-time**: Socket.io for live updates and notifications
- **Error Handling**: Centralized error handling with toast notifications
- **Loading States**: Skeleton loading components

## 🔐 Authentication

The app supports three user roles:
- **Guest**: Can view content only
- **User**: Can ask questions, answer, vote, and comment
- **Admin**: Full access including moderation features

## 📱 Responsive Design

The frontend is fully responsive with:
- Mobile-first design approach
- Responsive navigation with mobile menu
- Adaptive layouts for different screen sizes
- Touch-friendly interactions

## 🚀 Deployment

### Production Build
```bash
npm run build
```

The build output will be in the `build/` directory.

### Environment Variables
Create a `.env` file in the frontend directory:
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
```

## 🤝 Contributing

1. Follow the existing code style and conventions
2. Use TypeScript for all new components
3. Add proper error handling and loading states
4. Test your changes thoroughly
5. Update documentation as needed

## 📄 License

This project is part of the StackIt platform and follows the same license terms. 