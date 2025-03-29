# React Todo List

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Build Status](https://img.shields.io/github/workflow/status/username/react-todo-list/CI)
![Version](https://img.shields.io/badge/version-1.0.0-brightgreen)

A lightweight, user-friendly task management solution built with React and TypeScript. This web-based application provides a responsive, intuitive interface for managing personal or professional tasks with browser-based persistence.

## Demo

[Live Demo](https://username.github.io/react-todo-list)

![React Todo List Screenshot](docs/assets/screenshot.png)

## Features

- Task creation, editing, and deletion
- Task status tracking (complete/incomplete)
- Task prioritization (high, medium, low)
- Filter tasks by status (all/active/completed)
- Persistent storage using browser's localStorage
- Responsive design for all device sizes
- Accessibility compliant (WCAG 2.1 AA)
- No backend required - runs entirely in the browser

## Technology Stack

- **Frontend**: React 18, TypeScript 5, CSS Modules
- **State Management**: React Context API, Custom Hooks
- **Storage**: Browser LocalStorage API
- **Build Tools**: Create React App, Webpack, Babel
- **Testing**: Jest, React Testing Library
- **CI/CD**: GitHub Actions
- **Deployment**: GitHub Pages, AWS S3/CloudFront, Netlify, or Vercel

## Project Structure

```
├── docs/                  # Documentation files
├── infrastructure/        # Deployment and infrastructure configuration
├── src/                   # Source code
│   └── web/               # Frontend application
│       ├── public/        # Static files
│       └── src/           # React application code
├── .github/               # GitHub configuration and workflows
├── LICENSE                # License file
└── README.md              # This file
```

For detailed frontend structure, see [Frontend README](src/web/README.md).

For infrastructure details, see [Infrastructure README](infrastructure/README.md).

## Getting Started

### Prerequisites

- Node.js 14.x or higher
- npm 6.x or higher
- Git

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/username/react-todo-list.git
   cd react-todo-list
   ```

2. Install dependencies
   ```bash
   cd src/web
   npm install
   ```

3. Start the development server
   ```bash
   npm start
   ```

4. Open your browser and navigate to http://localhost:3000

## Usage

### Managing Tasks

- **Add a task**: Enter task text in the input field and press Enter or click Add Task
- **Complete a task**: Click the checkbox next to a task
- **Edit a task**: Click the Edit button on a task, modify the text, and save
- **Delete a task**: Click the Delete button on a task
- **Filter tasks**: Use the All/Active/Completed buttons to filter the task list
- **Set priority**: Select priority level when creating or editing a task

### Data Persistence

All tasks are automatically saved to your browser's localStorage. They will persist between sessions until you clear your browser data or explicitly delete them from the application.

## Development

### Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run test:coverage` - Runs tests with coverage report
- `npm run build` - Builds the app for production
- `npm run lint` - Lints the codebase
- `npm run lint:fix` - Automatically fixes linting issues
- `npm run format` - Formats code with Prettier
- `npm run typecheck` - Checks TypeScript types

### Code Style

This project uses ESLint and Prettier to enforce consistent code style. The configuration is defined in `.eslintrc.ts` and `.prettierrc`.

### Testing

Tests are co-located with their corresponding components and utilities, following the naming convention `*.test.tsx` or `*.test.ts`.

```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage
```

## Deployment

The application can be deployed to various hosting providers:

### GitHub Pages (Recommended for simplicity)

```bash
cd src/web
npm run build
npm install -g gh-pages  # If not already installed
gh-pages -d build
```

### Other Deployment Options

For detailed deployment instructions to AWS S3/CloudFront, Netlify, or Vercel, see the [Deployment Guide](docs/deployment.md).

### Automated Deployment

The repository includes GitHub Actions workflows for automated deployment. See `.github/workflows/deploy.yml` for configuration details.

## Browser Compatibility

The application supports the following browsers:

- Chrome 60+
- Firefox 60+
- Safari 11+
- Edge 79+ (Chromium-based)
- Not supported on Internet Explorer

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code follows the project's style guidelines and includes appropriate tests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- React team for the excellent framework
- Create React App for the build configuration
- All open-source contributors whose libraries made this project possible