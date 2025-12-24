import { useState, useEffect } from 'react';
import { openDB } from 'idb';

const DB_NAME = 'ImageGalleryDB';
const DB_VERSION = 1;
const STORE_NAME = 'images';

export const Screen1 = () => {
  const [images, setImages] = useState([]);
  const [backendImages, setBackendImages] = useState([]);
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Initialize IndexedDB
  const initDB = async () => {
    const db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          store.createIndex('timestamp', 'timestamp');
        }
      },
    });
    return db;
  };

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });

      // Listen for sync completion messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'SYNC_COMPLETE') {
          loadFromIndexedDB();
          fetchBackendImages();
        }
      });
    }

    // Online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  // Save image to IndexedDB
  const saveToIndexedDB = async (imageData) => {
    try {
      const db = await initDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      
      await store.add({
        ...imageData,
        timestamp: new Date().toISOString(),
        synced: false
      });
      
      await tx.done;
      console.log('Image saved to IndexedDB');
    } catch (error) {
      console.error('Error saving to IndexedDB:', error);
    }
  };

  // Load images from IndexedDB
  const loadFromIndexedDB = async () => {
    try {
      const db = await initDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const allImages = await store.getAll();
      
      setImages(allImages);
    } catch (error) {
      console.error('Error loading from IndexedDB:', error);
    }
  };

  // Fetch images from backend
  const fetchBackendImages = async () => {
    try {
      const response = await fetch('http://sahil.xane.ai:1337/images');
      if (response.ok) {
        const result = await response.json();
        if (result.code === 'success') {
          setBackendImages(result.data.images || []);
        }
      }
    } catch (error) {
      console.error('Error fetching backend images:', error);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile || !description.trim()) {
      alert('Please select an image and enter a description');
      return;
    }

    try {
      const base64Image = await fileToBase64(selectedFile);
      
      const imageData = {
        image: base64Image,
        description: description.trim(),
        filename: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type
      };

      await saveToIndexedDB(imageData);
      
      // Reset form
      setSelectedFile(null);
      setDescription('');
      e.target.reset();
      
      // Reload images
      await loadFromIndexedDB();
      
      // Trigger sync if online
      if (isOnline && 'serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          navigator.serviceWorker.controller.postMessage({ type: 'SYNC_NOW' });
        });
      }
      
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image');
    }
  };

  // Load images on component mount
  useEffect(() => {
    loadFromIndexedDB();
    fetchBackendImages();
  }, []);

  // Combine images from both sources
  const allImages = [...images, ...backendImages.map(img => ({
    ...img,
    synced: true,
    image: img.image_url,
    description: img.caption,
    isBackendImage: true
  }))];

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      gap: "20px",  
      alignItems: "center",
      justifyContent: "center",
      padding: "20px"
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px',
        marginBottom: '10px'
      }}>
        <div style={{ 
          width: '10px', 
          height: '10px', 
          borderRadius: '50%', 
          backgroundColor: isOnline ? '#28a745' : '#dc3545' 
        }}></div>
        <span>{isOnline ? 'Online' : 'Offline'}</span>
      </div>

      <form 
        onSubmit={handleSubmit}
        style={{ 
          display: "flex", 
          flexDirection: "column", 
          gap: "20px", 
          width: "300px",
          border: "1px solid #ccc",
          padding: "20px",
          borderRadius: "8px"
        }}
      >
        <input 
          type="file" 
          accept="image/*" 
          onChange={(e) => setSelectedFile(e.target.files[0])}
        />
        <input 
          type="text" 
          placeholder="Description" 
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button type="submit">Upload</button>
      </form>
      
      <div style={{ width: "100%", maxWidth: "800px" }}>
        <h2>Gallery ({allImages.length} images)</h2>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", 
          gap: "20px" 
        }}>
          {allImages.map((img, index) => (
            <div 
              key={img.id || `backend-${index}`} 
              style={{ 
                border: "1px solid #ddd", 
                borderRadius: "8px", 
                overflow: "hidden",
                backgroundColor: img.synced ? "#f0f8f0" : "#fff8f0"
              }}
            >
              <img 
                src={img.image} 
                alt={img.description}
                style={{ 
                  width: "100%", 
                  height: "150px", 
                  objectFit: "cover" 
                }}
              />
              <div style={{ padding: "10px" }}>
                <p style={{ margin: "0 0 5px 0", fontWeight: "bold" }}>
                  {img.description}
                </p>
                {!img.isBackendImage && (
                  <small style={{ color: "#666" }}>
                    {img.filename} • {(img.size / 1024).toFixed(1)} KB
                  </small>
                )}
                <br />
                <small style={{ color: img.synced ? "#28a745" : "#ffc107" }}>
                  {img.synced ? "✓ Synced" : "⏳ Pending sync"}
                </small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};