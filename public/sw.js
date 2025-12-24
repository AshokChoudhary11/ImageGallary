const CACHE_NAME = 'image-gallery-v1';
const DB_NAME = 'ImageGalleryDB';
const DB_VERSION = 1;
const STORE_NAME = 'images';
const API_URL = 'http://sahil.xane.ai:1337/images';

// Install service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installing');
  self.skipWaiting();
});

// Activate service worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(self.clients.claim());
});

// Open IndexedDB
const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => {
      console.error('IndexedDB open error:', request.error);
      reject(request.error);
    };
    request.onsuccess = () => {
      console.log('IndexedDB opened successfully');
      resolve(request.result);
    };
    
    request.onupgradeneeded = (event) => {
      console.log('IndexedDB upgrade needed');
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        store.createIndex('timestamp', 'timestamp');
        console.log('Created object store:', STORE_NAME);
      }
    };
  });
};

// Get unsynced images from IndexedDB
const getUnsyncedImages = async () => {
  try {
    console.log('Getting unsynced images...');
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const allImages = request.result;
        const images = allImages.filter(img => !img.synced);
        console.log('Total images in IndexedDB:', allImages.length);
        console.log('Unsynced images found:', images.length);
        console.log('Unsynced images:', images.map(img => ({ id: img.id, description: img.description })));
        resolve(images);
      };
      request.onerror = () => {
        console.error('Error getting images:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error in getUnsyncedImages:', error);
    return [];
  }
};

// Remove synced image from IndexedDB
const removeFromIndexedDB = async (imageId) => {
  try {
    console.log('Removing image from IndexedDB:', imageId);
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(imageId);
      request.onsuccess = () => {
        console.log('Successfully removed image:', imageId);
        resolve();
      };
      request.onerror = () => {
        console.error('Error removing image:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error in removeFromIndexedDB:', error);
  }
};

// Sync images to backend
const syncImages = async () => {
  console.log('=== STARTING SYNC PROCESS ===');
  
  try {
    const unsyncedImages = await getUnsyncedImages();
    
    if (unsyncedImages.length === 0) {
      console.log('No images to sync');
      return;
    }
    
    console.log('Processing', unsyncedImages.length, 'images');
    
    for (const image of unsyncedImages) {
      try {
        console.log('Processing image:', {
          id: image.id,
          description: image.description,
          filename: image.filename,
          imageLength: image.image ? image.image.length : 'undefined'
        });
        
        // Create URLSearchParams for form data (alternative approach)
        const formData = new URLSearchParams();
        formData.append('image_data', image.image);
        formData.append('caption', image.description);
        
        console.log('Sending request to:', API_URL);
        console.log('Form data keys:', Array.from(formData.keys()));
        
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData
        });
        
        console.log('Response received:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });
        
        const responseText = await response.text();
        console.log('Response body:', responseText);
        
        if (response.ok) {
          try {
            const result = JSON.parse(responseText);
            console.log('Parsed response:', result);
            
            if (result.code === 'success') {
              await removeFromIndexedDB(image.id);
              console.log(`✅ Image ${image.id} synced and removed successfully`);
            } else {
              console.error('❌ API returned non-success code:', result);
            }
          } catch (parseError) {
            console.error('❌ Error parsing JSON response:', parseError);
            console.log('Raw response was:', responseText);
          }
        } else {
          console.error(`❌ HTTP error ${response.status} for image ${image.id}:`, responseText);
        }
      } catch (error) {
        console.error(`❌ Network error syncing image ${image.id}:`, error);
      }
      
      // Add small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Notify main thread that sync is complete
    console.log('Notifying clients that sync is complete');
    const clients = await self.clients.matchAll();
    console.log('Found clients:', clients.length);
    
    clients.forEach(client => {
      client.postMessage({ type: 'SYNC_COMPLETE' });
    });
    
    console.log('=== SYNC PROCESS COMPLETED ===');
    
  } catch (error) {
    console.error('❌ Error in sync process:', error);
  }
};

// Message handler
self.addEventListener('message', (event) => {
  console.log('📨 Service worker received message:', event.data);
  
  if (event.data && event.data.type === 'SYNC_NOW') {
    console.log('🔄 Manual sync triggered');
    syncImages();
  }
});

// Periodic sync every 30 seconds - with logging
let syncInterval = setInterval(() => {
  console.log('⏰ Periodic sync check triggered');
  syncImages();
}, 30000);

console.log('🚀 Service Worker script loaded');