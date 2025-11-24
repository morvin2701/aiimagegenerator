import { useState, useRef, useEffect } from 'react';
import './EditScreen.css';

function EditScreen({ onNavigateToGenerator, geminiApiKey, darkMode: initialDarkMode, onToggleTheme }) {
  const [originalImage, setOriginalImage] = useState(null);
  const [processedOriginalImage, setProcessedOriginalImage] = useState(null); // For aspect ratio preview
  const [editedImage, setEditedImage] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [aiGeneratedPrompt, setAiGeneratedPrompt] = useState(''); // For AI-generated prompts
  const [editMode, setEditMode] = useState('manual'); // 'manual' or 'auto'
  const [availableTokens, setAvailableTokens] = useState(1000);
  const [usedTokens, setUsedTokens] = useState(0);
  const [totalTokens, setTotalTokens] = useState(1000);
  const [aspectRatio, setAspectRatio] = useState('1:1'); // New state for aspect ratio
  const [generatedCount, setGeneratedCount] = useState(0); // Track generated images
  const [previewImage, setPreviewImage] = useState(null); // For modal preview
  const [showPreview, setShowPreview] = useState(false); // For modal preview visibility
  const [showCamera, setShowCamera] = useState(false); // For camera capture
  const [cameraStream, setCameraStream] = useState(null); // For camera stream
  const [facingMode, setFacingMode] = useState('user'); // 'user' for front camera, 'environment' for back camera
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Aspect ratio options
  const aspectRatios = [
    { value: '1:1', label: '1:1 (Square)' },
    { value: '16:9', label: '16:9 (Landscape)' },
    { value: '9:16', label: '9:16 (Portrait)' },
    { value: '4:3', label: '4:3 (Standard)' },
    { value: '3:4', label: '3:4 (Vertical)' }
  ];
  
  // Use prop if provided, otherwise get from localStorage
  const darkMode = initialDarkMode !== undefined 
    ? initialDarkMode 
    : (localStorage.getItem('theme') === 'dark' || localStorage.getItem('theme') !== 'light');

  // Use the API key passed from the parent component
  // Decrypt API key from sessionStorage if available
  let storedApiKey = '';
  const encryptedApiKey = sessionStorage.getItem('geminiApiKey');
  if (encryptedApiKey) {
    try {
      // Simple decryption function for API key
      const decryptApiKey = (encryptedKey) => {
        return atob(encryptedKey.split('').reverse().join(''));
      };
      storedApiKey = decryptApiKey(encryptedApiKey);
    } catch (error) {
      console.error('Failed to decrypt API key:', error);
      storedApiKey = '';
    }
  }
  
  const GEMINI_API_KEY = geminiApiKey || import.meta.env.VITE_GEMINI_API_KEY || storedApiKey || 'AIzaSyAkzLWnwb9zK9mV2w78qzH_M_mqVUztZII';

  // Initialize tokens from localStorage
  useEffect(() => {
    const savedUsedTokens = localStorage.getItem('usedTokens') || '0';
    const savedTotalTokens = localStorage.getItem('totalTokens') || '1000';
    
    const used = parseInt(savedUsedTokens, 10);
    const total = parseInt(savedTotalTokens, 10);
    
    setUsedTokens(used);
    setTotalTokens(total);
    setAvailableTokens(total - used);
  }, []);

  // Apply theme class to body when darkMode prop changes
  useEffect(() => {
    const currentDarkMode = initialDarkMode !== undefined 
      ? initialDarkMode 
      : (localStorage.getItem('theme') === 'dark' || localStorage.getItem('theme') !== 'light');
      
    if (currentDarkMode) {
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
      document.body.classList.remove('dark-mode');
    }
  }, [initialDarkMode]);

  // Debugging: Log when editedImage changes
  useEffect(() => {
    console.log('editedImage state changed:', editedImage ? editedImage.substring(0, 100) + '...' : 'null');
  }, [editedImage]);

  // Process original image to match selected aspect ratio for preview
  useEffect(() => {
    if (originalImage && aspectRatio) {
      createPaddedImage(originalImage, aspectRatio)
        .then(processedImage => {
          setProcessedOriginalImage(processedImage);
        })
        .catch(err => {
          console.error('Failed to process original image for preview:', err);
          setProcessedOriginalImage(originalImage); // Fallback to original image
        });
    } else {
      // If no original image or aspect ratio, clear processed image
      setProcessedOriginalImage(null);
    }
  }, [originalImage, aspectRatio]);



  // Handle aspect ratio for browsers that don't support CSS aspect-ratio
  useEffect(() => {
    const handleAspectRatioFallback = () => {
      const images = document.querySelectorAll('.preview-image[data-aspect-ratio]');
      images.forEach(img => {
        // Check if browser supports aspect-ratio
        if (!window.CSS || !window.CSS.supports('aspect-ratio', '1 / 1')) {
          const aspectRatio = img.getAttribute('data-aspect-ratio');
          if (aspectRatio && aspectRatio !== 'auto') {
            const ratios = aspectRatio.split(':');
            if (ratios.length === 2) {
              const widthRatio = parseInt(ratios[0], 10);
              const heightRatio = parseInt(ratios[1], 10);
              if (widthRatio && heightRatio) {
                const container = img.closest('.image-display-container');
                if (container) {
                  // Set padding-top to maintain aspect ratio
                  const percentage = (heightRatio / widthRatio) * 100;
                  container.style.position = 'relative';
                  container.style.paddingTop = `${percentage}%`;
                  container.style.height = '0';
                  img.style.position = 'absolute';
                  img.style.top = '0';
                  img.style.left = '0';
                  img.style.width = '100%';
                  img.style.height = '100%';
                }
              }
            }
          }
        }
      });
    };

    // Run on initial load and when images change
    handleAspectRatioFallback();
    
    // Also run when window is resized
    window.addEventListener('resize', handleAspectRatioFallback);
    
    return () => {
      window.removeEventListener('resize', handleAspectRatioFallback);
    };
  }, [originalImage, editedImage, processedOriginalImage]);

  // Save tokens to localStorage
  useEffect(() => {
    localStorage.setItem('usedTokens', usedTokens.toString());
    localStorage.setItem('totalTokens', totalTokens.toString());
  }, [usedTokens, totalTokens]);

  // Toggle theme function - always use parent's toggle function
  const toggleTheme = () => {
    if (onToggleTheme) {
      onToggleTheme();
    }
  };

  // Handle image upload
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setOriginalImage(e.target.result);
        setShowEditPanel(true);
        setEditedImage(null);
        setPrompt('');
        setAiGeneratedPrompt('');
        setEditMode('manual');
      };
      reader.readAsDataURL(file);
    } else {
      setError('Please upload a JPG, PNG, or WEBP image.');
    }
  };
  
  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };
  
  // Start camera capture
  const startCamera = async (facing = 'user') => {
    try {
      setError('');
      // Stop any existing camera stream
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      
      setFacingMode(facing);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      setCameraStream(stream);
      setShowCamera(true);
    } catch (err) {
      console.error('Camera error:', err);
      let errorMessage = 'Could not access camera. ';
      
      if (err.name === 'NotAllowedError') {
        errorMessage += 'Please allow camera access when prompted.';
      } else if (err.name === 'NotFoundError' || err.name === 'OverconstrainedError') {
        errorMessage += 'No camera found or camera not supported.';
      } else if (err.name === 'NotReadableError') {
        errorMessage += 'Camera is being used by another application.';
      } else {
        errorMessage += 'Please ensure you have given permission and that your camera is working.';
      }
      
      setError(errorMessage);
    }
  };
  
  // Stop camera capture
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => {
        track.stop();
      });
      setCameraStream(null);
    }
    setShowCamera(false);
  };
  
  // Capture image from camera
  const captureImage = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      
      // Draw the video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to data URL
      const imageData = canvas.toDataURL('image/png');
      
      // Set the captured image
      setOriginalImage(imageData);
      setShowEditPanel(true);
      setEditedImage(null);
      setPrompt('');
      setAiGeneratedPrompt('');
      setEditMode('manual');
      
      // Stop the camera
      stopCamera();
    }
  };
  
  // Switch camera (front/back)
  const switchCamera = async () => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    await startCamera(newFacingMode);
  };
  
  // Effect to handle video stream and apply mirror effect only to front camera
  useEffect(() => {
    if (showCamera && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      
      // Apply mirror effect only to front camera (user facing)
      if (facingMode === 'user') {
        videoRef.current.style.transform = 'scaleX(-1)';
      } else {
        videoRef.current.style.transform = 'scaleX(1)';
      }
    }
    
    // Cleanup function
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [showCamera, cameraStream, facingMode]);

  // Auto-enhance background using Gemini AI (two-step process)
  const autoEnhanceBackground = async () => {
    if (!originalImage) return;

    // Check token availability (auto-enhance uses 100 tokens)
    const tokensNeeded = 100;
    if (tokensNeeded > availableTokens) {
      setError(`Insufficient tokens. You need ${tokensNeeded} tokens but only have ${availableTokens} available.`);
      return;
    }

    // Validate API key before making requests
    if (!isValidApiKey(GEMINI_API_KEY)) {
      setError('Invalid or missing API key. Please log out and log back in with a valid API key.');
      return;
    }

    setLoading(true);
    setError('');
    setEditMode('auto');
    setEditedImage(null); // Clear any previous edited image
    
    try {
      // Deduct tokens
      const newUsedTokens = usedTokens + tokensNeeded;
      setUsedTokens(newUsedTokens);
      setAvailableTokens(totalTokens - newUsedTokens);
      
      // Step 1: AI Vision & Prompt Generation (gemini-2.5-flash)
      // Create padded image with target aspect ratio
      const paddedImage = await createPaddedImage(originalImage, aspectRatio);
      
      // Extract base64 data from padded image
      let base64Data = paddedImage;
      if (paddedImage.startsWith('data:')) {
        base64Data = paddedImage.split(',')[1];
      }
      
      // Send image to gemini-2.5-flash for analysis
      const visionResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [
              {
                text: "Analyze the main subject of this image. Generate a concise, descriptive prompt for an AI image editor to replace the background with a new, realistic, and contextually appropriate one that complements the main subject. The new background should enhance but not distract from the main subject. Return only the background description prompt without any additional text."
              },
              {
                inlineData: {
                  mimeType: "image/png",
                  data: base64Data
                }
              }
            ]
          }]
        }),
      });

      if (!visionResponse.ok) {
        const errorText = await visionResponse.text();
        throw new Error(`Vision API request failed with status ${visionResponse.status}: ${errorText}`);
      }

      const visionData = await visionResponse.json();
      const generatedPrompt = visionData.candidates?.[0]?.content?.parts?.[0]?.text || 
        "a beautiful landscape";

      setAiGeneratedPrompt(generatedPrompt);
      setPrompt(generatedPrompt);
      
      // Step 2: AI Image Editing (gemini-2.5-flash-image)
      // Send image and prompt to gemini-2.5-flash-image model for editing
      // Try with generationConfig first (as per system spec), fallback to prompt if needed
      let editPayload = {
        contents: [{
          role: "user",
          parts: [
            {
              text: `Modify ONLY the background of this image to match: ${generatedPrompt}. CRITICAL: Keep the main subject (especially any person) completely unchanged, preserving all details including facial features, hair, clothing, and jewelry. Do not add, remove, or modify any part of the main subject. Analyze the existing background elements and style, then seamlessly extend and fill in the empty space around the center image to match the existing background. The input image has been placed on a canvas with aspect ratio ${aspectRatio}. Generate a full background that seamlessly blends with the existing image to create a cohesive, professional result. Ensure the background extension matches the lighting, colors, textures, and overall aesthetic of the original image.`
            },
            {
              inlineData: {
                mimeType: "image/png",
                data: base64Data
              }
            }
          ]
        }],
        generationConfig: {
          aspectRatio: aspectRatio
        }
      };
      
      let editResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editPayload),
      });

      // If generationConfig fails, try with aspect ratio in prompt
      if (!editResponse.ok) {
        editPayload = {
          contents: [{
            role: "user",
            parts: [
              {
                text: `Modify ONLY the background of this image to match: ${generatedPrompt}. CRITICAL: Keep the main subject (especially any person) completely unchanged, preserving all details including facial features, hair, clothing, and jewelry. Do not add, remove, or modify any part of the main subject. Analyze the existing background elements and style, then seamlessly extend and fill in the empty space around the center image to match the existing background. The input image has been placed on a canvas with aspect ratio ${aspectRatio}. Generate a full background that seamlessly blends with the existing image to create a cohesive, professional result. Ensure the background extension matches the lighting, colors, textures, and overall aesthetic of the original image.`
              },
              {
                inlineData: {
                  mimeType: "image/png",
                  data: base64Data
                }
              }
            ]
          }]
        };
        
        editResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(editPayload),
        });
      }

      if (!editResponse.ok) {
        const errorText = await editResponse.text();
        throw new Error(`Edit API request failed with status ${editResponse.status}: ${errorText}`);
      }

      const editData = await editResponse.json();
      
      // Extract the edited image from the response
      if (editData.candidates && editData.candidates[0] && editData.candidates[0].content) {
        const parts = editData.candidates[0].content.parts;
        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
            const editedImageData = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            console.log('Setting edited image:', editedImageData.substring(0, 100) + '...');
            setEditedImage(editedImageData);
            setGeneratedCount(prev => prev + 1); // Increment generated count
            return;
          }
        }
      }
      
      // Fallback if no image in response
      throw new Error('No edited image in API response.');
    } catch (err) {
      // Refund tokens on error
      const newUsedTokens = usedTokens - 100;
      setUsedTokens(newUsedTokens);
      setAvailableTokens(totalTokens - newUsedTokens);
      
      setError(`Failed to auto-enhance background: ${err.message}`);
      console.error('Auto-enhance error:', err);
      
      // Fallback to simulated effect
      try {
        const processedImage = await applyVisualEffect(originalImage, 'sunset');
        setEditedImage(processedImage);
        setGeneratedCount(prev => prev + 1); // Increment generated count
      } catch (fallbackErr) {
        setError('Failed to process image even with fallback method');
      }
    } finally {
      setLoading(false);
    }
  };

  // Manual edit with custom prompt using Gemini model
  const manualEdit = async () => {
    if (!originalImage || !prompt.trim()) {
      setError('Please upload an image and enter a prompt.');
      return;
    }

    // Check token availability (manual edit uses 50 tokens)
    const tokensNeeded = 50;
    if (tokensNeeded > availableTokens) {
      setError(`Insufficient tokens. You need ${tokensNeeded} tokens but only have ${availableTokens} available.`);
      return;
    }

    // Validate API key before making requests
    if (!isValidApiKey(GEMINI_API_KEY)) {
      setError('Invalid or missing API key. Please log out and log back in with a valid API key.');
      return;
    }

    setLoading(true);
    setError('');
    setEditMode('manual');
    setEditedImage(null); // Clear any previous edited image
    
    try {
      // Deduct tokens
      const newUsedTokens = usedTokens + tokensNeeded;
      setUsedTokens(newUsedTokens);
      setAvailableTokens(totalTokens - newUsedTokens);
      
      // Create padded image with target aspect ratio
      const paddedImage = await createPaddedImage(originalImage, aspectRatio);
      
      // Extract base64 data from padded image
      let base64Data = paddedImage;
      if (paddedImage.startsWith('data:')) {
        base64Data = paddedImage.split(',')[1];
      }
      
      // Send image and prompt to gemini-2.5-flash-image for editing
      // Try with generationConfig first (as per system spec), fallback to prompt if needed
      let editPayload = {
        contents: [{
          role: "user",
          parts: [
            {
              text: `Modify the image according to this prompt: ${prompt}. CRITICAL: Keep the main subject (especially if it's a person) completely unchanged, in focus, and with all details preserved including facial features, hair, clothing, and jewelry. Do not add, remove, or modify any part of the main subject. Analyze the existing background elements and style, then seamlessly extend and fill in the empty space around the center image to match the existing background. The input image has been placed on a canvas with aspect ratio ${aspectRatio}. Generate a full background that seamlessly blends with the existing image to create a cohesive, professional result. Ensure the background extension matches the lighting, colors, textures, and overall aesthetic of the original image.`
            },
            {
              inlineData: {
                mimeType: "image/png",
                data: base64Data
              }
            }
          ]
        }],
        generationConfig: {
          aspectRatio: aspectRatio
        }
      };
      
      let response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editPayload),
      });

      // If generationConfig fails, try with aspect ratio in prompt
      if (!response.ok) {
        editPayload = {
          contents: [{
            role: "user",
            parts: [
              {
                text: `Modify the image according to this prompt: ${prompt}. CRITICAL: Keep the main subject (especially if it's a person) completely unchanged, in focus, and with all details preserved including facial features, hair, clothing, and jewelry. Do not add, remove, or modify any part of the main subject. Fill in the empty space around the center image to match a natural background that complements the main subject. The input image has been placed on a canvas with aspect ratio ${aspectRatio}. Generate a full background that seamlessly blends with the existing image to create a cohesive, professional result.`
              },
              {
                inlineData: {
                  mimeType: "image/png",
                  data: base64Data
                }
              }
            ]
          }]
        };
        
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(editPayload),
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      // Extract the edited image from the response
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const parts = data.candidates[0].content.parts;
        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
            const editedImageData = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            console.log('Setting edited image (manual):', editedImageData.substring(0, 100) + '...');
            setEditedImage(editedImageData);
            setGeneratedCount(prev => prev + 1); // Increment generated count
            return;
          }
        }
      }
      
      // Fallback if no image in response
      throw new Error('No edited image in API response.');
    } catch (err) {
      // Refund tokens on error
      const newUsedTokens = usedTokens - tokensNeeded;
      setUsedTokens(newUsedTokens);
      setAvailableTokens(totalTokens - newUsedTokens);
      
      setError(`Failed to edit image: ${err.message}`);
      console.error('Manual edit error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Apply visual effect to simulate image editing (fallback)
  const applyVisualEffect = (imageSrc, effectType) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        // Create a temporary canvas with the target aspect ratio
        const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number);
        
        // Set standard dimensions based on aspect ratio (using larger sizes for better quality)
        let canvasWidth, canvasHeight;
        if (widthRatio && heightRatio) {
          // Use larger sizes for different aspect ratios
          if (widthRatio === 1 && heightRatio === 1) {
            canvasWidth = 1024; // Increased from 512
            canvasHeight = 1024; // Increased from 512
          } else if (widthRatio === 16 && heightRatio === 9) {
            canvasWidth = 1920; // Increased from 1024
            canvasHeight = 1080; // Increased from 576
          } else if (widthRatio === 9 && heightRatio === 16) {
            canvasWidth = 1080; // Increased from 576
            canvasHeight = 1920; // Increased from 1024
          } else if (widthRatio === 4 && heightRatio === 3) {
            canvasWidth = 1920; // Increased from 1024
            canvasHeight = 1440; // Increased from 768
          } else if (widthRatio === 3 && heightRatio === 4) {
            canvasWidth = 1440; // Increased from 768
            canvasHeight = 1920; // Increased from 1024
          } else {
            // Default to 1024x1024 for unknown ratios
            canvasWidth = 1024; // Increased from 512
            canvasHeight = 1024; // Increased from 512
          }
        } else {
          canvasWidth = 1024; // Increased from 512
          canvasHeight = 1024; // Increased from 512
        }
        
        // Create canvas with target aspect ratio
        const canvas = document.createElement('canvas');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext('2d');
        
        // Fill canvas with white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // Calculate position to center the original image while preserving its aspect ratio
        const imgRatio = img.width / img.height;
        let drawWidth, drawHeight, drawX, drawY;
        
        // For aspect ratio conversion, we want to fill the canvas while maintaining aspect ratio
        // This might crop parts of the image, but that's expected for aspect ratio changes
        if (img.width / img.height > canvasWidth / canvasHeight) {
          // Image is wider relative to its height than the canvas, fit to height and crop width
          drawHeight = canvasHeight;
          drawWidth = (img.width * canvasHeight) / img.height;
          drawX = (canvasWidth - drawWidth) / 2;
          drawY = 0;
        } else {
          // Image is taller relative to its width than the canvas, fit to width and crop height
          drawWidth = canvasWidth;
          drawHeight = (img.height * canvasWidth) / img.width;
          drawX = 0;
          drawY = (canvasHeight - drawHeight) / 2;
        }
        
        // Draw the image on the canvas, potentially cropping to fill the target aspect ratio
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
        
        // Apply different effects based on the effect type
        switch (effectType) {
          case 'vintage':
            // Apply sepia effect
            ctx.fillStyle = 'rgba(139, 69, 19, 0.3)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            break;
          case 'cyberpunk':
            // Apply blue/purple tint
            ctx.fillStyle = 'rgba(128, 0, 128, 0.2)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            break;
          case 'sunset':
            // Apply orange/yellow tint
            ctx.fillStyle = 'rgba(255, 140, 0, 0.2)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            break;
          case 'forest':
            // Apply green tint
            ctx.fillStyle = 'rgba(34, 139, 34, 0.2)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            break;
          case 'space':
            // Apply dark blue tint
            ctx.fillStyle = 'rgba(0, 0, 139, 0.3)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            break;
          case 'bokeh':
            // Apply light blur effect
            ctx.filter = 'blur(2px)';
            ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
            ctx.filter = 'none';
            break;
          case 'beach':
            // Apply light blue tint
            ctx.fillStyle = 'rgba(173, 216, 230, 0.2)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            break;
          case 'storm':
            // Apply dark gray tint
            ctx.fillStyle = 'rgba(105, 105, 105, 0.3)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            break;
          default:
            // Apply a subtle filter for manual edits
            ctx.fillStyle = 'rgba(100, 100, 200, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        // Return the data URL of the modified image
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = imageSrc;
    });
  };

  // Download image function
  const downloadPreviewImage = () => {
    if (!previewImage) return;
    
    const link = document.createElement('a');
    link.href = previewImage;
    link.download = 'image-preview.png';
    link.click();
  };

  // Open image in preview modal
  const openPreview = (imageSrc) => {
    setPreviewImage(imageSrc);
    setShowPreview(true);
  };

  // Close preview modal
  const closePreview = () => {
    setShowPreview(false);
    setPreviewImage(null);
  };

  // Download edited image
  const downloadImage = () => {
    if (!editedImage) return;
    
    const link = document.createElement('a');
    link.href = editedImage;
    link.download = 'edited-image.png';
    link.click();
  };

  // Validate API key format (basic validation)
  const isValidApiKey = (key) => {
    // Check if key is not empty and has reasonable length
    return key && key.length >= 30 && key.startsWith('AIza');
  };

  // Validate API key by making a simple request
  const validateApiKey = async (key) => {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: 'test',
            }]
          }]
        }),
      });
      
      // If we get a 401 or 403, the key is invalid
      if (response.status === 401 || response.status === 403) {
        return false;
      }
      
      // If we get any other response, the key is likely valid
      return true;
    } catch (error) {
      // If there's a network error, we assume the key might still be valid
      console.error('Error validating API key:', error);
      return true;
    }
  };

  // Handle logout from edit screen
  const handleEditLogout = () => {
    onNavigateToGenerator();
    // Clear API key from sessionStorage for security
    sessionStorage.removeItem('geminiApiKey');
  };

  // Validate API key on component mount
  useEffect(() => {
    const encryptedApiKey = sessionStorage.getItem('geminiApiKey');
    if (encryptedApiKey) {
      try {
        // Simple decryption function for API key
        const decryptApiKey = (encryptedKey) => {
          return atob(encryptedKey.split('').reverse().join(''));
        };
        const decryptedApiKey = decryptApiKey(encryptedApiKey);
        // Validate the API key
        validateApiKey(decryptedApiKey).then((isValid) => {
          if (!isValid) {
            // Clear invalid API key
            sessionStorage.removeItem('geminiApiKey');
            // Navigate back to generator
            onNavigateToGenerator();
          }
        });
      } catch (error) {
        console.error('Failed to decrypt API key:', error);
        // Clear invalid API key
        sessionStorage.removeItem('geminiApiKey');
        // Navigate back to generator
        onNavigateToGenerator();
      }
    }
  }, [onNavigateToGenerator]);

  // Create a padded image with target aspect ratio, placing original image in center
  const createPaddedImage = (imageSrc, targetAspectRatio) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // Set standard dimensions based on aspect ratio (using larger sizes for better quality)
        const [widthRatio, heightRatio] = targetAspectRatio.split(':').map(Number);
        let canvasWidth, canvasHeight;
        
        if (widthRatio && heightRatio) {
          // Use larger sizes for different aspect ratios
          if (widthRatio === 1 && heightRatio === 1) {
            canvasWidth = 1024; // Increased from 512
            canvasHeight = 1024; // Increased from 512
          } else if (widthRatio === 16 && heightRatio === 9) {
            canvasWidth = 1920; // Increased from 1024
            canvasHeight = 1080; // Increased from 576
          } else if (widthRatio === 9 && heightRatio === 16) {
            canvasWidth = 1080; // Increased from 576
            canvasHeight = 1920; // Increased from 1024
          } else if (widthRatio === 4 && heightRatio === 3) {
            canvasWidth = 1920; // Increased from 1024
            canvasHeight = 1440; // Increased from 768
          } else if (widthRatio === 3 && heightRatio === 4) {
            canvasWidth = 1440; // Increased from 768
            canvasHeight = 1920; // Increased from 1024
          } else {
            // Default to 1024x1024 for unknown ratios
            canvasWidth = 1024; // Increased from 512
            canvasHeight = 1024; // Increased from 512
          }
        } else {
          canvasWidth = 1024; // Increased from 512
          canvasHeight = 1024; // Increased from 512
        }
        
        // Create canvas with target aspect ratio
        const canvas = document.createElement('canvas');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext('2d');
        
        // Fill canvas with white background (this will be replaced by AI)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // Calculate position to center the original image while preserving its aspect ratio
        const imgRatio = img.width / img.height;
        let drawWidth, drawHeight, drawX, drawY;
        
        // For aspect ratio conversion, we want to fill the canvas while maintaining aspect ratio
        // This might crop parts of the image, but that's expected for aspect ratio changes
        if (img.width / img.height > canvasWidth / canvasHeight) {
          // Image is wider relative to its height than the canvas, fit to height and crop width
          drawHeight = canvasHeight;
          drawWidth = (img.width * canvasHeight) / img.height;
          drawX = (canvasWidth - drawWidth) / 2;
          drawY = 0;
        } else {
          // Image is taller relative to its width than the canvas, fit to width and crop height
          drawWidth = canvasWidth;
          drawHeight = (img.height * canvasWidth) / img.width;
          drawX = 0;
          drawY = (canvasHeight - drawHeight) / 2;
        }
        
        // Draw the image on the canvas, potentially cropping to fill the target aspect ratio
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
        
        // Return the data URL of the padded image
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = (error) => {
        reject(new Error('Failed to load image: ' + error));
      };
      img.src = imageSrc;
    }).catch(error => {
      console.error('Error in createPaddedImage:', error);
      throw error;
    });
  };

  // Calculate token usage percentage for progress bar
  const tokenUsagePercentage = totalTokens > 0 ? (usedTokens / totalTokens) * 100 : 0;

  return (
    <div className="edit-screen">
      <header className="edit-header">
        <div className="edit-header-content">
          <div className="edit-header-left">
            <img 
              src="/images/logo.png" 
              alt="DataCare Softech Logo" 
              className="edit-header-logo"
            />
            <div className="edit-header-text">
              <h1>AI Image Editor</h1>
              <p>Transform your photos with Gemini AI</p>
            </div>
          </div>
          <div className="edit-header-actions">
            <button className="theme-toggle" onClick={toggleTheme}>
              {darkMode ? '☀️ Light' : '🌙 Dark'}
            </button>
            <button className="generator-button" onClick={onNavigateToGenerator}>
              🖼️ Generator
            </button>
            <button className="logout-button" onClick={handleEditLogout}>
              🚪 Logout
            </button>
          </div>
        </div>
      </header>

      <main className="edit-main">
        {!showEditPanel ? (
          <div className="upload-section">
            <div className="upload-container" onClick={triggerFileInput}>
              <div className="upload-icon">📸</div>
              <p>Click to upload an image</p>
              <p className="upload-hint">Supports JPG, PNG, or WEBP formats</p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept=".jpg,.jpeg,.png,.webp"
                style={{ display: 'none' }}
              />
            </div>
            <div className="camera-container">
              <button className="camera-button" onClick={startCamera}>
                📷 Capture from Camera
              </button>
            </div>
            {error && <div className="error-message">{error}</div>}
          </div>
        ) : (
          <div className="edit-section">
            <nav className="edit-navbar">
              <div className="navbar-brand">
                <img 
                  src="/images/logo.png" 
                  alt="DataCare Softech Logo" 
                  className="navbar-logo"
                />
                <span className="navbar-title">AI Image Editor</span>
              </div>
              
              <div className="navbar-center">
                <span className="generated-count">🖼️ Generated: {generatedCount}</span>
              </div>
              
              <div className="navbar-actions">
                <button className="nav-button generator-btn" onClick={onNavigateToGenerator}>
                  🖼️ Image Generator
                </button>
                <button className="nav-button logout-btn" onClick={handleEditLogout}>
                  🚪 Logout
                </button>
              </div>
            </nav>

            {/* Token information with progress bar */}
            <div className="token-info-container">
              <div className="token-header">
                <h3>💳 Token Usage</h3>
              </div>
              
              <div className="token-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${tokenUsagePercentage}%`,
                    }}
                  ></div>
                </div>
                <div className="token-stats">
                  <span className="used-tokens">💳 {usedTokens} used</span>
                  <span className="available-tokens">✅ {availableTokens} available</span>
                  <span className="total-tokens">📊 {totalTokens} total</span>
                </div>
              </div>
              
              <div className="token-details">
                <div className="token-item">
                  <span className="token-label">✨ Auto-Enhance</span>
                  <span className="token-value">100 tokens</span>
                </div>
                <div className="token-item">
                  <span className="token-label">✏️ Manual Edit</span>
                  <span className="token-value">50 tokens</span>
                </div>
              </div>
            </div>

            <div className="image-comparison">
              <div className="image-panel">
                <h3>Comparison View</h3>
                <div className="image-container">
                  {loading ? (
                    <div className="loading-state">
                      <div className="spinner"></div>
                      <p>{editMode === 'auto' ? '🤖 AI is analyzing and enhancing your image...' : '🎨 Processing your image...'}</p>
                      <p className="processing-prompt">{prompt && `Applying: ${prompt}`}</p>
                    </div>
                  ) : editedImage ? (
                    <div className="side-by-side-comparison">
                      <div className="comparison-image-container">
                        <div className="image-wrapper">
                          <img 
                            src={processedOriginalImage || originalImage} 
                            alt="Original" 
                            className="comparison-image"
                            onClick={() => openPreview(originalImage)}
                            style={{ cursor: 'pointer' }} 
                          />
                          <div className="image-title">Original Image</div>
                        </div>
                      </div>
                      <div className="comparison-image-container">
                        <div className="image-wrapper">
                          <img 
                            src={editedImage} 
                            alt="Edited" 
                            className="comparison-image"
                            onClick={() => openPreview(editedImage)}
                            style={{ cursor: 'pointer' }}
                          />
                          <div className="image-title">Edited Image</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="image-display-container">
                      <img 
                        src={processedOriginalImage || originalImage} 
                        alt="Original" 
                        className="preview-image" 
                        data-aspect-ratio={aspectRatio} 
                        onClick={() => openPreview(originalImage)}
                        style={{ cursor: 'pointer' }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="edit-controls">
              {/* Aspect Ratio Selector */}
              <div className="aspect-ratio-selector">
                <h3>📐 Aspect Ratio</h3>
                <div className="aspect-ratio-options">
                  {aspectRatios.map((ratio) => (
                    <button
                      key={ratio.value}
                      className={`aspect-ratio-button ${aspectRatio === ratio.value ? 'active' : ''}`}
                      onClick={() => setAspectRatio(ratio.value)}
                      disabled={loading}
                    >
                      {ratio.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="prompt-section">
                <div className="prompt-header">
                  <h3>💬 Edit Prompt</h3>
                  <div className="prompt-header-actions">
                    <button className="swap-image-button" onClick={triggerFileInput}>
                      🔄 Swap Image
                    </button>
                    <button className="theme-toggle" onClick={toggleTheme}>
                      {darkMode ? '☀️ Light' : '🌙 Dark'}
                    </button>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept=".jpg,.jpeg,.png,.webp"
                    style={{ display: 'none' }}
                  />
                </div>
                <div className="prompt-input-container">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the changes you want to make to your image..."
                    className="prompt-textarea"
                    disabled={loading}
                  />
                  {aiGeneratedPrompt && (
                    <div className="ai-prompt-note">
                      <small>✨ AI-Generated Prompt: {aiGeneratedPrompt}</small>
                    </div>
                  )}
                  <div className="ai-prompt-note" style={{ marginTop: '10px' }}>
                    <small>ℹ️ Auto-Enhance analyzes your image and changes only the background while preserving the main subject.</small>
                  </div>
                </div>
              </div>

              <div className="action-buttons">
                <button 
                  className="auto-enhance-button" 
                  onClick={autoEnhanceBackground}
                  disabled={loading}
                >
                  🤖 {loading && editMode === 'auto' ? 'Processing...' : 'Auto-Enhance Background'} (100 tokens)
                </button>
                <button 
                  className="manual-edit-button" 
                  onClick={manualEdit}
                  disabled={loading}
                >
                  {loading && editMode === 'manual' ? 'Processing...' : '✏️ Apply Edit'} (50 tokens)
                </button>
              </div>

              {error && <div className="error-message">{error}</div>}

              {editedImage && (
                <div className="download-section">
                  <button className="download-button" onClick={downloadImage}>
                    💾 Download Edited Image
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      
      {/* Camera Capture Modal */}
      {showCamera && (
        <div className="camera-modal" onClick={stopCamera}>
          <div className="camera-content" onClick={(e) => e.stopPropagation()}>
            <button className="camera-close" onClick={stopCamera}>×</button>
            <h3>Capture Image</h3>
            <div className="camera-header">
              <span className="camera-mode">
                {facingMode === 'user' ? '📷 Front Camera' : '📱 Back Camera'}
              </span>
            </div>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted
              className="camera-video"
            />
            <div className="camera-controls">
              <button className="switch-camera-button" onClick={switchCamera}>
                {facingMode === 'user' ? '🔁 Switch to Back Camera' : '🔁 Switch to Front Camera'}
              </button>
              <button className="capture-button" onClick={captureImage}>
                📸 Capture Photo
              </button>
              <button className="cancel-camera-button" onClick={stopCamera}>
                ❌ Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Image Preview Modal */}
      {showPreview && (
        <div className="image-preview-modal" onClick={closePreview}>
          <div className="image-preview-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-preview" onClick={closePreview}>×</button>
            <img src={previewImage} alt="Preview" className="preview-modal-image" />
            <button className="download-preview-button" onClick={downloadPreviewImage}>
              💾 Download Image
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditScreen;