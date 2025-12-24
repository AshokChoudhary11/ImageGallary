# Image Gallery PWA

A Progressive Web App for uploading, managing, and syncing images with offline support.

## Features

- 📱 Progressive Web App (PWA) with offline functionality
- 📤 Image upload with description
- 💾 Local storage using IndexedDB
- 🔄 Background sync with service worker
- 🌐 Online/offline status detection
- 📊 Mixed view of local and synced images
- 🏠 Installable on mobile and desktop

## Tech Stack

- React.js
- IndexedDB (via idb library)
- Service Worker
- PWA Manifest

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd imagegallary
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm dev
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## Development Commands

| Command | Description |
|---------|-------------|
| `npm dev` | Start development server |
| `npm run build` | Build for production |
| `npm test` | Run tests |

## PWA Installation

- Visit the app in a compatible browser
- Look for the install banner at the bottom
- Click "Install" to add to your home screen

## App Structure

- **Screen 1**: Upload form + Gallery (shows both local and synced images)
- **Screen 2**: Backend gallery (shows only synced images)
- **Service Worker**: Handles background sync and caching
- **IndexedDB**: Local storage for offline functionality

## API Integration

The app syncs with backend API:
- **POST** `http://sahil.xane.ai:1337/images` - Upload image
- **GET** `http://sahil.xane.ai:1337/images` - Fetch images

## Chat Reference

For development discussions and troubleshooting:
**Chat URL**: https://chatgpt.com/share/694b7968-5508-8000-8221-5306cdc08de5

---

Built with ❤️ using React and PWA technologies