// Script to insert mock questions into the database if they don't exist
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Question = require('../models/Question');
const User = require('../models/User');

dotenv.config({ path: require('path').resolve(__dirname, '../../.env') });

const mockQuestions = [
  {
    title: 'How to implement authentication in React with JWT?',
    description: `I'm building a React application and need to implement user authentication using JWT tokens. I've been looking at various tutorials but I'm not sure about the best practices for token storage, refresh tokens, and handling authentication state.`,
    tags: ['react', 'javascript', 'authentication', 'jwt'],
  },
  {
    title: 'Best practices for state management in large React applications',
    description: `I'm working on a large React application and need advice on state management. We're currently using Context API but it's becoming hard to manage. Should we switch to Redux, Zustand, or stick with Context?`,
    tags: ['react', 'state-management', 'redux', 'context'],
  },
  {
    title: 'How to optimize performance in React applications?',
    description: `My React app is getting slow with large datasets. What are the best optimization techniques? I've heard about React.memo, useMemo, and useCallback but I'm not sure when to use each.`,
    tags: ['react', 'performance', 'optimization'],
  },
  {
    title: 'Understanding TypeScript generics in React components',
    description: `I'm learning TypeScript and trying to understand how to use generics in React components. Can someone explain with practical examples how to create reusable typed components?`,
    tags: ['typescript', 'react', 'generics'],
  },
  {
    title: 'Setting up a Node.js backend with Express and MongoDB',
    description: `I want to create a REST API using Node.js, Express, and MongoDB. What's the best way to structure the project and handle database connections?`,
    tags: ['nodejs', 'express', 'mongodb', 'api'],
  },
  {
    title: 'CSS Grid vs Flexbox: When to use which?',
    description: `I'm confused about when to use CSS Grid vs Flexbox. Can someone explain the differences and provide examples of when each is more appropriate?`,
    tags: ['css', 'grid', 'flexbox', 'layout'],
  },
  {
    title: 'How to implement real-time features with Socket.io?',
    description: `I need to add real-time chat functionality to my web app. How do I implement this using Socket.io with React and Node.js?`,
    tags: ['socket.io', 'react', 'nodejs', 'real-time'],
  },
  {
    title: 'Docker containerization for React and Node.js apps',
    description: `I want to containerize my full-stack application. What's the best approach for Dockerizing React frontend and Node.js backend?`,
    tags: ['docker', 'react', 'nodejs', 'containerization'],
  },
  {
    title: 'Testing React components with Jest and React Testing Library',
    description: `I'm new to testing in React. How do I write effective tests using Jest and React Testing Library? What should I test and what should I avoid?`,
    tags: ['react', 'testing', 'jest', 'rtl'],
  },
  {
    title: 'Git workflow for team collaboration',
    description: `My team is struggling with Git workflow. What's the best branching strategy for a team of 5 developers? Should we use Git Flow, GitHub Flow, or something else?`,
    tags: ['git', 'workflow', 'collaboration', 'branching'],
  },
  {
    title: 'Building responsive design with Tailwind CSS',
    description: `I'm using Tailwind CSS for the first time. How do I create responsive designs effectively? What are the best practices for mobile-first design?`,
    tags: ['tailwind', 'css', 'responsive', 'design'],
  },
  {
    title: 'API rate limiting and security best practices',
    description: `I'm building a public API and need to implement rate limiting and security measures. What are the essential security practices I should implement?`,
    tags: ['api', 'security', 'rate-limiting', 'best-practices'],
  },
  {
    title: 'Deploying React apps to production',
    description: `I'm ready to deploy my React app to production. What's the best hosting platform? Should I use Vercel, Netlify, or AWS?`,
    tags: ['react', 'deployment', 'hosting', 'production'],
  },
  {
    title: 'Understanding async/await in JavaScript',
    description: `I'm learning async/await in JavaScript but I'm still confused about when to use it vs Promises. Can someone explain with practical examples?`,
    tags: ['javascript', 'async', 'await', 'promises'],
  },
  {
    title: 'Database design for e-commerce applications',
    description: `I'm designing a database for an e-commerce application. What's the best way to structure tables for products, orders, and users?`,
    tags: ['database', 'e-commerce', 'design', 'sql'],
  },
  {
    title: 'Building accessible React components',
    description: `I want to make my React components more accessible. What are the key accessibility features I should implement?`,
    tags: ['react', 'accessibility', 'a11y', 'components'],
  },
  {
    title: 'Microservices architecture with Node.js',
    description: `I'm planning to break down my monolithic Node.js app into microservices. What are the best practices and common pitfalls to avoid?`,
    tags: ['nodejs', 'microservices', 'architecture', 'best-practices'],
  },
  {
    title: 'GraphQL vs REST API design',
    description: `I'm starting a new project and can't decide between GraphQL and REST. What are the pros and cons of each approach?`,
    tags: ['graphql', 'rest', 'api', 'design'],
  },
  {
    title: 'Implementing dark mode in React applications',
    description: `I want to add dark mode to my React app. What's the best way to implement theme switching with CSS variables and React context?`,
    tags: ['react', 'dark-mode', 'theming', 'css'],
  },
  {
    title: 'CI/CD pipeline setup with GitHub Actions',
    description: `I want to set up automated testing and deployment using GitHub Actions. How do I create a workflow for my React/Node.js project?`,
    tags: ['ci-cd', 'github-actions', 'automation', 'deployment'],
  },
];

async function insertQuestions() {
  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGODB_URI_PROD);
  const users = await User.find();
  if (!users.length) {
    console.error('No users found in the database. Please register a user first.');
    process.exit(1);
  }
  const author = users[0]._id;

  for (const q of mockQuestions) {
    const exists = await Question.findOne({ title: q.title });
    if (!exists) {
      await Question.create({
        title: q.title,
        description: q.description,
        tags: q.tags,
        author,
      });
      console.log(`Inserted: ${q.title}`);
    } else {
      console.log(`Already exists: ${q.title}`);
    }
  }
  await mongoose.disconnect();
  console.log('Done.');
}

insertQuestions().catch(err => {
  console.error(err);
  process.exit(1);
}); 