# Vega App

## Overview
This repository contains two projects:

1. **Vega Mobile App** (React Native/Expo) - An Android app for streaming media with features like ad-free streaming, multiple sources, multi-language support, and watchlist functionality. This cannot run in the browser as it's a native mobile app.

2. **Vega Stremio Addon** (`stremio-addon/`) - A Node.js server that provides streaming links from Vega providers for movies and series in Stremio. This is the component running in Replit.

## Current State
The Stremio addon server is configured and running on port 5000.

## Stremio Addon Features
- 31 streaming providers (Global, English, and Regional)
- Built-in subtitle support  
- Configurable provider selection
- Supports movies and series via IMDB IDs

## Project Structure
```
├── stremio-addon/        # Stremio addon server (Node.js)
│   ├── index.js          # Main server entry point
│   ├── config.js         # Configuration and providers list
│   └── lib/              # Provider loaders and extractors
├── src/                  # React Native mobile app source
├── android/              # Android native code
├── ios/                  # iOS native code
└── assets/               # App assets
```

## Running in Replit
The workflow runs the Stremio addon server:
```bash
cd stremio-addon && node index.js
```

The manifest.json is available at the root URL path `/manifest.json`.

## API Endpoints
- `GET /manifest.json` - Addon manifest for Stremio
- Stream and subtitle handlers for movies/series

## Environment
- Node.js 20.x required (for cheerio/undici compatibility)
