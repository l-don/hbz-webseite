# HBZ Webseite - Development Setup Guide

> **Historischer Besiedlungszug A.D. 1156 e.V.**  
> Official website for the Historical Settlement Train reenactment group

This guide provides detailed instructions for setting up the development environment for the HBZ website on a new Windows machine from start to finish.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Initial Windows Setup](#initial-windows-setup)
- [Development Environment Installation](#development-environment-installation)
- [Project Setup](#project-setup)
- [Development Workflow](#development-workflow)
- [Building and Deployment](#building-and-deployment)
- [Troubleshooting](#troubleshooting)
- [Project Structure](#project-structure)
- [Contributing](#contributing)

## 🛠 Prerequisites

Before starting, ensure you have:
- Windows 10/11 (64-bit recommended)
- Administrative privileges on your machine
- Stable internet connection for downloads
- At least 4GB RAM and 10GB free disk space

## 🚀 Initial Windows Setup

### 1. Enable Windows Features

1. **Enable Windows Subsystem for Linux (WSL) - Optional but Recommended**
   ```powershell
   # Run PowerShell as Administrator
   wsl --install
   ```
   - Restart your computer when prompted
   - This provides a better terminal experience for development

2. **Install Windows Terminal (Recommended)**
   - Install from Microsoft Store or GitHub releases
   - Provides better terminal experience with tabs and customization

### 2. Install Essential Tools

#### Git for Windows
1. Download from: https://git-scm.com/download/win
2. Run the installer with these recommended settings:
   - ✅ Use Git from the Windows Command Prompt
   - ✅ Checkout Windows-style, commit Unix-style line endings
   - ✅ Use Windows' default console window
   - ✅ Enable file system caching
   - ✅ Enable Git Credential Manager

3. **Configure Git** (replace with your information):
   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```

## 🔧 Development Environment Installation

### 1. Install Node.js and npm

1. **Download Node.js LTS** from: https://nodejs.org/
   - Choose the LTS (Long Term Support) version
   - Download the Windows Installer (.msi)

2. **Run the installer** with default settings:
   - ✅ Automatically install necessary tools (Python, Visual Studio Build Tools)

3. **Verify installation**:
   ```bash
   # Open Command Prompt or PowerShell
   node --version
   npm --version
   ```
   Expected output: Node.js v18.x.x or higher, npm v9.x.x or higher

### 2. Install Angular CLI

```bash
# Install Angular CLI globally
npm install -g @angular/cli

# Verify installation
ng version
```

### 3. Install Code Editor

**Visual Studio Code (Recommended)**
1. Download from: https://code.visualstudio.com/
2. Install with default settings
3. **Install recommended extensions**:
   ```bash
   # Open VS Code and install extensions via Command Palette (Ctrl+Shift+P)
   ```
   - Angular Language Service
   - TypeScript Importer
   - Prettier - Code formatter
   - GitLens
   - Bracket Pair Colorizer
   - Auto Rename Tag
   - CSS Peek

**Alternative IDEs:**
- WebStorm (JetBrains)
- Atom
- Sublime Text

### 4. Install Additional Development Tools

```bash
# Install useful global packages
npm install -g typescript
npm install -g lite-server
npm install -g http-server
```

## 📁 Project Setup

### 1. Clone the Repository

```bash
# Navigate to your development directory
cd C:\Development  # or your preferred directory

# Clone the repository
git clone https://github.com/l-don/hbz-webseite.git

# Navigate to project directory
cd hbz-webseite
```

### 2. Project Analysis

**Current State**: This repository contains the built/compiled version of the Angular application. For development, you'll need to either:

**Option A: Reverse-engineer from built files (Advanced)**
- Extract component logic from compiled JavaScript
- Recreate TypeScript components and modules

**Option B: Create new Angular project (Recommended for development)**

### 3. Setup New Angular Project (Recommended)

If working with source code:

```bash
# Create new Angular project
ng new hbz-webseite-dev --routing --style=scss

# Navigate to project
cd hbz-webseite-dev

# Install dependencies
npm install

# Install Angular Material (used in the original)
ng add @angular/material

# Install Bootstrap (used in the original)
npm install bootstrap

# Install additional dependencies that appear to be used
npm install @angular/forms
npm install @angular/router
```

### 4. Install Project Dependencies

If you have access to source code with package.json:

```bash
# Install all dependencies
npm install

# Install development dependencies
npm install --save-dev @angular/cli-builders
```

### 5. Environment Configuration

1. **Create environment files**:
   ```bash
   # src/environments/environment.ts (development)
   # src/environments/environment.prod.ts (production)
   ```

2. **Configure Angular settings**:
   ```json
   // angular.json - configure build settings
   // tsconfig.json - TypeScript configuration
   ```

## 💻 Development Workflow

### 1. Start Development Server

```bash
# Start the development server
ng serve

# Or with specific options
ng serve --host 0.0.0.0 --port 4200 --open
```

The application will be available at: http://localhost:4200

### 2. Development Commands

```bash
# Generate new component
ng generate component component-name

# Generate new service
ng generate service service-name

# Generate new module
ng generate module module-name

# Run tests
ng test

# Run end-to-end tests
ng e2e

# Lint code
ng lint
```

### 3. Project Structure (Expected)

```
hbz-webseite/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── header/
│   │   │   ├── footer/
│   │   │   ├── main-page/
│   │   │   ├── banner-img/
│   │   │   └── ...
│   │   ├── services/
│   │   ├── models/
│   │   └── app.module.ts
│   ├── assets/
│   │   ├── images/
│   │   ├── gallery/
│   │   ├── fonts/
│   │   └── icons/
│   ├── environments/
│   └── index.html
├── package.json
├── angular.json
├── tsconfig.json
└── README.md
```

### 4. Key Features to Implement

Based on the compiled site analysis:
- **Header Component**: Navigation with logo and responsive hamburger menu
- **Main Page**: Hero banner, content sections, contact form
- **Footer Component**: Contact info, social media links, legal pages
- **Gallery**: Image galleries organized by year
- **Routing**: Multiple pages (main, einblicke, anmeldung, etc.)
- **Responsive Design**: Mobile-first approach with Bootstrap

## 🏗 Building and Deployment

### 1. Build for Production

```bash
# Build for production
ng build --configuration production

# Build with specific base href (for GitHub Pages)
ng build --configuration production --base-href "/hbz-webseite/"
```

### 2. Preview Production Build

```bash
# Serve production build locally
npx http-server dist/hbz-webseite -p 8080
```

### 3. Deployment Options

**GitHub Pages:**
```bash
# Install Angular GitHub Pages deployer
npm install -g angular-cli-ghpages

# Deploy to GitHub Pages
ng deploy --base-href="/hbz-webseite/"
```

**Manual Deployment:**
- Copy contents of `dist/hbz-webseite/` to web server
- Ensure web server serves `index.html` for all routes (SPA configuration)

## 🔍 Troubleshooting

### Common Windows Issues

**1. Node.js/npm Permission Issues**
```bash
# Set npm prefix to avoid permission issues
npm config set prefix "%APPDATA%\npm"
```

**2. PowerShell Execution Policy**
```powershell
# Run as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**3. Angular CLI Installation Issues**
```bash
# Clear npm cache
npm cache clean --force

# Reinstall Angular CLI
npm uninstall -g @angular/cli
npm install -g @angular/cli@latest
```

**4. Port Already in Use**
```bash
# Find process using port 4200
netstat -ano | findstr 4200

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or use different port
ng serve --port 4201
```

**5. Memory Issues**
```bash
# Increase Node.js memory limit
set NODE_OPTIONS=--max_old_space_size=8192
ng build
```

### Development Issues

**1. Module Not Found Errors**
```bash
# Delete node_modules and reinstall
rmdir /s node_modules
npm install
```

**2. TypeScript Compilation Errors**
```bash
# Check TypeScript version compatibility
npm list typescript
npm install typescript@latest
```

**3. Angular Version Conflicts**
```bash
# Update Angular to latest version
ng update @angular/core @angular/cli
```

## 📚 Additional Resources

### Documentation
- [Angular Documentation](https://angular.io/docs)
- [Angular CLI Reference](https://angular.io/cli)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Angular Material](https://material.angular.io/)

### Useful Tools
- [Angular DevTools](https://chrome.google.com/webstore/detail/angular-devtools/ienfalfjdbdpebioblfackkekamfmbnh) (Chrome Extension)
- [JSON Formatter](https://chrome.google.com/webstore/detail/json-formatter/bcjindcccaagfpapjjmafapmmgkkhgoa) (Chrome Extension)

### Windows-Specific Tips
- Use Windows Terminal for better terminal experience
- Consider WSL2 for Linux-like development environment
- Use Git Bash for Unix-like commands on Windows
- Configure VS Code with Windows-specific settings

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Code Standards
- Follow Angular Style Guide
- Use TypeScript strict mode
- Write unit tests for components and services
- Use meaningful commit messages
- Follow semantic versioning

## 📞 Support

For questions about the development setup:
- Create an issue in this repository
- Contact the development team
- Check the troubleshooting section above

For questions about the historical group:
- Website: [historischer-besiedlungszug.de](http://historischer-besiedlungszug.de)
- Email: info@historischer-besiedlungszug.de
- Phone: +49 (321) 21436999

---

**Happy Coding! 🚀**

*Last updated: 2024*