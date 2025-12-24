import { useState, useEffect } from 'react';

export const Screen2 = () => {
  const [backendImages, setBackendImages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch images from backend
  const fetchBackendImages = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://sahil.xane.ai:1337/images');
      if (response.ok) {
        const result = await response.json();
        if (result.code === 'success') {
          setBackendImages(result.data.images || []);
        }
      }
    } catch (error) {
      console.error('Error fetching backend images:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackendImages();
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Backend Gallery</h1>
      <p>Showing only synced images from backend ({backendImages.length} images)</p>
      
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", 
        gap: "20px",
        marginTop: "20px"
      }}>
        {backendImages.map((img) => (
          <div 
            key={img.id} 
            style={{ 
              border: "1px solid #ddd", 
              borderRadius: "8px", 
              overflow: "hidden",
              backgroundColor: "#f0f8f0"
            }}
          >
            <img 
              src={img.image_url} 
              alt={img.caption}
              style={{ 
                width: "100%", 
                height: "150px", 
                objectFit: "cover" 
              }}
            />
            <div style={{ padding: "10px" }}>
              <p style={{ margin: "0 0 5px 0", fontWeight: "bold" }}>
                {img.caption}
              </p>
              <small style={{ color: "#28a745" }}>
                ✓ Synced (ID: {img.id})
              </small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};