# Render Configuration - Alternative

## Option 1: Basic Setup (Recommended)
```yaml
services:
  - type: web
    name: treboluxe-frontend
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
```

## Option 2: With Custom Start Script
```yaml
services:
  - type: web
    name: treboluxe-frontend
    env: node
    buildCommand: npm install && npm run build
    startCommand: ./start.sh
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
```

## Option 3: Direct Next.js Command
```yaml
services:
  - type: web
    name: treboluxe-frontend
    env: node
    buildCommand: npm install && npm run build
    startCommand: npx next start -H 0.0.0.0 -p $PORT
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
```

## Manual Configuration in Render Dashboard:
If render.yaml doesn't work, configure manually:
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Environment Variables**:
  - `NODE_ENV=production`
  - `PORT=10000`

## Common Issues and Solutions:

### 1. "serve: command not found"
**Solution**: Use `npm start` instead of `serve`

### 2. Port binding issues
**Solution**: Ensure scripts use `-H 0.0.0.0 -p $PORT`

### 3. Build cache warnings
**Solution**: This is normal for first builds, subsequent builds will be faster

### 4. Environment variables not loading
**Solution**: Double-check variable names and values in Render dashboard
