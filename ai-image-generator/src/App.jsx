import { useState, useEffect } from 'react';
import EditScreen from './EditScreen';
import './App.css';

function App() {
  const [currentScreen, setCurrentScreen] = useState('login'); // 'login', 'generator' or 'editor'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState(''); // New state for API key
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false); // State to show API key dialog
  const [loginError, setLoginError] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false); // For drawer menu
  const [prompt, setPrompt] = useState('');
  const [imageUrls, setImageUrls] = useState([]);
  
  // Log imageUrls changes for debugging
  useEffect(() => {
    console.log('imageUrls updated:', imageUrls);
  }, [imageUrls]);
  const [imageCount, setImageCount] = useState(1);
  
  // Log imageCount state changes for debugging
  useEffect(() => {
    console.log('imageCount state updated:', imageCount);
  }, [imageCount]);
  const [aspectRatio, setAspectRatio] = useState('1:1'); // New state for aspect ratio
  
  // Log aspectRatio state changes for debugging
  useEffect(() => {
    console.log('aspectRatio state updated:', aspectRatio);
  }, [aspectRatio]);
  const [loading, setLoading] = useState(false);
  
  // Log loading state changes for debugging
  useEffect(() => {
    console.log('loading state updated:', loading);
  }, [loading]);
  const [error, setError] = useState('');
  
  // Log error state changes for debugging
  useEffect(() => {
    console.log('error state updated:', error);
  }, [error]);
  const [availableTokens, setAvailableTokens] = useState(1000);
  const [usedTokens, setUsedTokens] = useState(0);
  const [totalTokens, setTotalTokens] = useState(1000);
  const [darkMode, setDarkMode] = useState(true);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [recentImages, setRecentImages] = useState([]);
  const [showRecent, setShowRecent] = useState(false);
  
  // Simple encryption function for API key (basic obfuscation)
  const encryptApiKey = (key) => {
    console.log('Encrypting API key');
    // This is a simple obfuscation, not true encryption
    // In a production environment, you should use proper encryption
    const encrypted = btoa(key).split('').reverse().join('');
    console.log('API key encrypted');
    return encrypted;
  };

  // Simple decryption function for API key
  const decryptApiKey = (encryptedKey) => {
    console.log('Decrypting API key');
    // This is a simple de-obfuscation, not true decryption
    // In a production environment, you should use proper decryption
    const decrypted = atob(encryptedKey.split('').reverse().join(''));
    console.log('API key decrypted');
    return decrypted;
  };

  // Validate API key by making a simple request
  const validateApiKey = async (key) => {
    try {
      console.log('Validating API key');
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
      
      console.log('API key validation response status:', response.status);
      
      // If we get a 401 or 403, the key is invalid
      if (response.status === 401 || response.status === 403) {
        console.log('API key is invalid');
        return false;
      }
      
      // If we get any other response, the key is likely valid
      console.log('API key is valid');
      return true;
    } catch (error) {
      // If there's a network error, we assume the key might still be valid
      console.error('Error validating API key:', error);
      return true;
    }
  };

  // Handle login
  const handleLogin = (e) => {
    e.preventDefault();
    console.log('Handling login with username:', username);
    // Simple validation - in a real app, you would authenticate with a server
    if (username === 'abc' && password === '123') {
      console.log('Login successful, showing API key dialog');
      // Show API key dialog
      setShowApiKeyDialog(true);
      setLoginError('');
    } else {
      console.log('Login failed');
      setLoginError('Invalid username or password');
    }
  };

  // Validate API key format (basic validation)
  const isValidApiKey = (key) => {
    console.log('Validating API key format:', key ? 'key present' : 'no key');
    // Check if key is not empty and has reasonable length
    const isValid = key && key.length >= 30 && key.startsWith('AIza');
    console.log('API key format is valid:', isValid);
    return isValid;
  };

  // Handle API key submission
  const handleApiKeySubmit = async (e) => {
    e.preventDefault();
    
    console.log('Handling API key submission with key:', apiKey ? 'key present' : 'no key');
    
    // Validate API key format
    if (!isValidApiKey(apiKey)) {
      console.log('API key format is invalid');
      setLoginError('Please enter a valid Gemini API key');
      return;
    }
    
    console.log('API key format is valid');
    
    // Save API key to sessionStorage (cleared when browser closes)
    if (apiKey) {
      // Encrypt the API key before storing
      const encryptedKey = encryptApiKey(apiKey);
      console.log('Storing encrypted API key:', encryptedKey);
      sessionStorage.setItem('geminiApiKey', encryptedKey);
    }
    console.log('Navigating to generator screen');
    setCurrentScreen('generator');
    setShowApiKeyDialog(false);
  };

  // Handle logout
  const handleLogout = () => {
    console.log('Handling logout');
    setCurrentScreen('login');
    setUsername('');
    setPassword('');
    setApiKey('');
    // Clear API key from sessionStorage for security
    sessionStorage.removeItem('geminiApiKey');
  };

  // Gemini API configuration
  let storedApiKey = '';
  const encryptedApiKey = sessionStorage.getItem('geminiApiKey');
  console.log('Retrieved encrypted API key from sessionStorage:', encryptedApiKey);
  if (encryptedApiKey) {
    try {
      storedApiKey = decryptApiKey(encryptedApiKey);
      console.log('Decrypted API key:', storedApiKey ? 'key present' : 'no key');
    } catch (error) {
      console.error('Failed to decrypt API key:', error);
      storedApiKey = '';
    }
  }
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || storedApiKey || '';
  console.log('Using API key:', GEMINI_API_KEY ? 'key present' : 'no key');
  const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict';

  // Trendy prompt suggestions
  const promptSuggestions = [
  // --- CATEGORY: 3D & CUTE ---
  {
    id: 1,
    label: "3D Isometric Room",
    category: "3D Art",
    prompt: "A cozy isometric living room with a fireplace, soft pastel colors, low poly style, warm lighting, 3D render, high detail, trending on ArtStation"
  },
  {
    id: 2,
    label: "Cute Robot Jazz",
    category: "Characters",
    prompt: "A cute glossy robot cat playing a saxophone in a dimly lit vintage jazz club, cinematic lighting, bokeh effect, Pixar style 3D render"
  },
  {
    id: 3,
    label: "Vinyl Toy Figure",
    category: "Characters",
    prompt: "A collectible vinyl toy figure of a samurai wearing streetwear, vibrant colors, studio lighting, clean background, Pop Mart style"
  },

  // --- CATEGORY: SCENIC & FANTASY ---
  {
    id: 4,
    label: "Cyberpunk Market",
    category: "Sci-Fi",
    prompt: "A bustling cyberpunk night market, neon signs in Japanese, rain-slicked streets, volumetric fog, holographic advertisements, photorealistic, 8k"
  },
  {
    id: 5,
    label: "Floating Islands",
    category: "Fantasy",
    prompt: "Majestic floating islands in the sky connected by waterfalls, golden hour sunlight, dreamlike atmosphere, Studio Ghibli art style"
  },
  {
    id: 6,
    label: "Bioluminescent Ocean",
    category: "Nature",
    prompt: "Deep underwater castle surrounded by glowing jellyfish and bioluminescent coral reefs, deep blue and neon pink color palette, 4k realistic"
  },

  // --- CATEGORY: ARTISTIC & ABSTRACT ---
  {
    id: 7,
    label: "Liquid Gold Wave",
    category: "Abstract",
    prompt: "Abstract fluid art, swirling waves of liquid gold and black marble, glossy texture, macro photography, luxury background"
  },
  {
    id: 8,
    label: "Paper Cutout Art",
    category: "Artistic",
    prompt: "Layered paper cutout art of a mountain landscape at sunset, intricate details, shadow depth, craft paper texture, soft lighting"
  },
  {
    id: 9,
    label: "Steampunk Library",
    category: "Sci-Fi",
    prompt: "A grand steampunk library with brass gears, mechanical birds, steam pipes, leather books, warm amber lighting, intricate Victorian architecture"
  },
  {
    id: 10,
    label: "Cosmic Nebula",
    category: "Space",
    prompt: "A space station orbiting a colorful nebula, vibrant purples and oranges, cinematic composition, epic scale, sci-fi concept art"
  },
  
  // --- CATEGORY: PHOTOGRAPHY ---
  {
    id: 11,
    label: "Fashion Portrait",
    category: "Photography",
    prompt: "Double exposure portrait of a woman and a forest, misty atmosphere, artistic, surreal, high contrast, black and white photography"
  },
  {
    id: 12,
    label: "Macro Eye",
    category: "Photography",
    prompt: "Extreme macro close-up of a human eye reflecting a galaxy, hyper-realistic, incredible detail, sharp focus, 8k resolution"
  }
];

  // Aspect ratio options
  const aspectRatios = [
    { value: '1:1', label: '1:1 (Square)' },
    { value: '16:9', label: '16:9 (Landscape)' },
    { value: '9:16', label: '9:16 (Portrait)' },
    { value: '4:3', label: '4:3 (Standard)' },
    { value: '3:4', label: '3:4 (Vertical)' }
  ];

  // Initialize with token data and recent images
  useEffect(() => {
    console.log('Initializing app state');
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    console.log('Saved theme:', savedTheme);
    if (savedTheme) {
      setDarkMode(savedTheme === 'dark');
      // Apply theme to body
      if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
      } else {
        document.body.classList.add('light-mode');
        document.body.classList.remove('dark-mode');
      }
    }
    
    // Initialize API key from sessionStorage
    const encryptedApiKey = sessionStorage.getItem('geminiApiKey');
    console.log('Encrypted API key from sessionStorage:', encryptedApiKey);
    if (encryptedApiKey) {
      try {
        const decryptedApiKey = decryptApiKey(encryptedApiKey);
        console.log('Decrypted API key:', decryptedApiKey);
        // Validate the API key
        validateApiKey(decryptedApiKey).then((isValid) => {
          console.log('API key validation result:', isValid);
          if (isValid) {
            setApiKey(decryptedApiKey);
          } else {
            // Clear invalid API key
            sessionStorage.removeItem('geminiApiKey');
            setApiKey('');
          }
        });
      } catch (error) {
        console.error('Failed to decrypt API key:', error);
        // Clear invalid API key
        sessionStorage.removeItem('geminiApiKey');
      }
    }
    
    // Initialize tokens from localStorage or use defaults
    const savedUsedTokens = localStorage.getItem('usedTokens');
    const savedGeneratedCount = localStorage.getItem('generatedCount');
    const savedRecentImages = localStorage.getItem('recentImages');
    
    console.log('Saved used tokens:', savedUsedTokens);
    console.log('Saved generated count:', savedGeneratedCount);
    console.log('Saved recent images:', savedRecentImages);
    
    if (savedUsedTokens) {
      const used = parseInt(savedUsedTokens, 10);
      console.log('Setting used tokens:', used);
      setUsedTokens(used);
      setAvailableTokens(totalTokens - used);
    }
    
    if (savedGeneratedCount) {
      const count = parseInt(savedGeneratedCount, 10);
      console.log('Setting generated count:', count);
      setGeneratedCount(count);
    }
    
    if (savedRecentImages) {
      const images = JSON.parse(savedRecentImages);
      console.log('Setting recent images:', images);
      setRecentImages(images);
    }
    
    console.log('App state initialization complete');
  }, []);

  // Apply theme class to body
  useEffect(() => {
    console.log('Applying theme, dark mode:', darkMode);
    if (darkMode) {
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
      document.body.classList.remove('dark-mode');
    }
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Handle aspect ratio for browsers that don't support CSS aspect-ratio
  useEffect(() => {
    const handleAspectRatioFallback = () => {
      console.log('Handling aspect ratio fallback');
      const images = document.querySelectorAll('.generated-image[data-aspect-ratio]');
      console.log('Found images with aspect ratio data:', images.length);
      images.forEach(img => {
        // Check if browser supports aspect-ratio
        if (!window.CSS || !window.CSS.supports('aspect-ratio', '1 / 1')) {
          console.log('Browser does not support CSS aspect-ratio, applying fallback');
          const aspectRatio = img.getAttribute('data-aspect-ratio');
          if (aspectRatio) {
            console.log('Processing aspect ratio:', aspectRatio);
            const ratios = aspectRatio.split(':');
            if (ratios.length === 2) {
              const widthRatio = parseInt(ratios[0], 10);
              const heightRatio = parseInt(ratios[1], 10);
              if (widthRatio && heightRatio) {
                console.log('Width ratio:', widthRatio, 'Height ratio:', heightRatio);
                const container = img.closest('.image-display-container');
                if (container) {
                  console.log('Found container, applying aspect ratio styles');
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
  }, [imageUrls, recentImages]);

  // Save token usage and recent images to localStorage
  useEffect(() => {
    console.log('Saving token usage and recent images to localStorage');
    console.log('Used tokens:', usedTokens);
    console.log('Generated count:', generatedCount);
    console.log('Recent images:', recentImages);
    localStorage.setItem('usedTokens', usedTokens.toString());
    localStorage.setItem('generatedCount', generatedCount.toString());
    localStorage.setItem('recentImages', JSON.stringify(recentImages));
  }, [usedTokens, generatedCount, recentImages]);

  // Periodically validate API key
  useEffect(() => {
    console.log('Setting up periodic API key validation');
    
    // Only run if we have an API key
    if (!GEMINI_API_KEY) {
      console.log('No API key, skipping periodic validation');
      return;
    }
    
    console.log('API key present, setting up validation interval');
    
    // Validate API key every 30 minutes
    const interval = setInterval(() => {
      console.log('Periodic API key validation triggered');
      validateApiKey(GEMINI_API_KEY).then((isValid) => {
        console.log('Periodic API key validation result:', isValid);
        if (!isValid) {
          // Clear invalid API key
          sessionStorage.removeItem('geminiApiKey');
          setApiKey('');
          // Show error message
          setError('Your API key has expired or become invalid. Please log out and log back in with a valid API key.');
          // Redirect to login screen
          setCurrentScreen('login');
        }
      });
    }, 30 * 60 * 1000); // 30 minutes
    
    return () => {
      console.log('Clearing periodic API key validation interval');
      clearInterval(interval);
    };
  }, [GEMINI_API_KEY]);

  const generateImage = async () => {
    console.log('Starting image generation process');
    
    // --- VALIDATION STEPS ---
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    if (!GEMINI_API_KEY) {
      setError('API key is missing.');
      return;
    }
    
    if (imageCount < 1 || imageCount > 4) {
      setError('Please select a valid number of images (1-4)');
      return;
    }

    setLoading(true);
    setError('');
    setImageUrls([]); // Clear previous images immediately
    
    // Set a timeout to ensure we never get stuck in loading state
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.log('Generation timeout triggered');
        setLoading(false);
        setError('Image generation timed out. Please try again with a simpler prompt or fewer images.');
        // Ensure we show whatever images we have so far
        setImageUrls(prev => [...prev]);
      }
    }, 120000); // 2 minute timeout
    
    try {
      // Check tokens (client side estimation)
      const tokensNeeded = imageCount * 50;
      if (tokensNeeded > availableTokens) {
        throw new Error(`Insufficient tokens. You need ${tokensNeeded} tokens.`);
      }
      
      const generatedImages = [];
      
      // --- SEQUENTIAL GENERATION LOOP ---
      // We loop through the count one by one to avoid 429 Rate Limit errors
      for (let i = 0; i < imageCount; i++) {
        console.log(`Generating image ${i + 1} of ${imageCount}...`);
        
        // requestBody setup
        const requestBody = {
          instances: [{ prompt: prompt.trim() }],
          parameters: {
            sampleCount: 1, // Request 1 image per API call
            aspectRatio: aspectRatio
          },
        };

        try {
          const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error: ${response.status} - ${errorText}`);
          }

          const data = await response.json();

          // Extract Base64 with comprehensive error handling
          let base64Image = null;
          
          try {
            if (data.predictions && data.predictions.length > 0) {
              // Log the response structure for debugging
              console.log(`Response structure for image ${i + 1}:`, JSON.stringify(data, null, 2));
              
              // Check New Format (images array)
              if (data.predictions[0].images && data.predictions[0].images.length > 0) {
                console.log(`Using new API format for image ${i + 1}`);
                if (data.predictions[0].images[0] && data.predictions[0].images[0].bytesBase64Encoded) {
                  base64Image = data.predictions[0].images[0].bytesBase64Encoded;
                  console.log(`Found base64 data in new format for image ${i + 1}`);
                }
              } 
              // Check Old Format (single prediction)
              else if (data.predictions[0].bytesBase64Encoded) {
                console.log(`Using old API format for image ${i + 1}`);
                base64Image = data.predictions[0].bytesBase64Encoded;
                console.log(`Found base64 data in old format for image ${i + 1}`);
              } else {
                console.warn(`Unexpected response format for image ${i + 1}:`, data.predictions[0]);
              }
            } else {
              console.warn(`No predictions in response for image ${i + 1}:`, data);
            }
          } catch (extractionError) {
            console.error(`Error extracting image data for image ${i + 1}:`, extractionError);
          }

          if (base64Image && typeof base64Image === 'string' && base64Image.length > 0) {
            const imageUrl = `data:image/png;base64,${base64Image}`;
            generatedImages.push(imageUrl);
            console.log(`Successfully extracted image ${i + 1}, generated images count:`, generatedImages.length);
          } else {
            console.warn(`No valid image data found for request ${i + 1}`, { base64Image: typeof base64Image, length: base64Image ? base64Image.length : 0 });
          }

        } catch (innerError) {
          console.error(`Failed to generate image ${i + 1}:`, innerError);
          // We continue the loop even if one fails
          // Add a placeholder for UI consistency if needed
          if (imageCount > 2) {
            console.log(`Adding placeholder for failed image ${i + 1}`);
          }
        }

        // --- DELAY STRATEGY ---
        // If there are more images to generate, wait 1.5 seconds to respect rate limits
        if (i < imageCount - 1) {
            console.log('Waiting to avoid rate limit...');
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }

      // --- FINALIZATION ---
      console.log(`Generation complete. Generated ${generatedImages.length} out of ${imageCount} images`);
      
      // Always update the UI with whatever images we have, even if less than requested
      // Validate that we have actual image data before setting URLs
      const validImages = generatedImages.filter(url => url && typeof url === 'string' && url.startsWith('data:image/'));
      console.log('Setting image URLs:', validImages, 'filtered from:', generatedImages.length, 'generated images');
      setImageUrls(validImages);
      
      // Update counters
      setGeneratedCount(prev => prev + generatedImages.length);
      
      const actualTokensUsed = generatedImages.length * 50;
      const newUsedTokens = usedTokens + actualTokensUsed;
      setUsedTokens(newUsedTokens);
      setAvailableTokens(totalTokens - newUsedTokens);
      
      // Update Recent Images
      const newRecentImages = generatedImages.map((url, index) => ({
        id: Date.now() + index,
        url: url,
        prompt: prompt,
        timestamp: new Date().toLocaleString(),
        aspectRatio: aspectRatio
      }));
      setRecentImages(prev => [...newRecentImages, ...prev].slice(0, 20));
      
      // Show error if no images were generated
      if (generatedImages.length === 0) {
        setError("Failed to generate any images. Please check your API key or try again.");
      } 
      // Show warning if fewer images than requested
      else if (generatedImages.length < imageCount) {
        setError(`Only ${generatedImages.length} out of ${imageCount} images were generated. Some requests may have failed.`);
      }

    } catch (err) {
      console.error('Error generating image:', err);
      setError(err.message);
    } finally {
      // Clear the timeout
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    console.log('Key press event:', e.key, 'Loading:', loading);
    if (e.key === 'Enter' && !loading) {
      console.log('Generating image from key press');
      generateImage();
    }
  };

  const useSuggestion = (suggestion) => {
    console.log('Using prompt suggestion:', suggestion);
    setPrompt(suggestion);
  };

  const toggleTheme = () => {
    console.log('Toggling theme, current mode:', darkMode);
    setDarkMode(prevMode => !prevMode);
  };

  // Calculate token usage percentage for progress bar
  const tokenUsagePercentage = totalTokens > 0 ? (usedTokens / totalTokens) * 100 : 0;
  console.log('Token usage percentage:', tokenUsagePercentage, 'Used tokens:', usedTokens, 'Total tokens:', totalTokens);

  // Clear recent images
  const clearRecentImages = () => {
    console.log('Clearing recent images');
    setRecentImages([]);
  };

  // Navigation functions
  const goToEditor = () => {
    console.log('Navigating to editor');
    setCurrentScreen('editor');
  };

  const goToGenerator = () => {
    console.log('Navigating to generator');
    setCurrentScreen('generator');
  };

  // Show EditScreen if currentScreen is 'editor'
  if (currentScreen === 'editor') {
    return <EditScreen onNavigateToGenerator={goToGenerator} geminiApiKey={GEMINI_API_KEY} darkMode={darkMode} onToggleTheme={toggleTheme} />;
  }

  // Show Login screen if currentScreen is 'login'
  if (currentScreen === 'login') {
    return (
      <div className="app">
        <div className="login-container">
          <div className="login-card animated">
            <div className="login-header">
              {/* Custom logo with transparent background */}
              <img 
                src="/images/logo.png" 
                alt="DataCare Softech Logo" 
                className="custom-logo"
                onError={(e) => {
                  // If logo image fails to load, show a fallback
                  e.target.style.display = 'none';
                  // Add a fallback element
                  const fallback = document.createElement('div');
                  fallback.className = 'custom-logo';
                  fallback.style.fontSize = '2.5rem';
                  fallback.style.display = 'flex';
                  fallback.style.alignItems = 'center';
                  fallback.style.justifyContent = 'center';
                  fallback.innerHTML = '✨';
                  e.target.parentNode.insertBefore(fallback, e.target);
                }}
              />
              <h1 className="login-title">DataCare Softech</h1>
              <p className="login-subtitle">Sign in to your account</p>
            </div>
            <form onSubmit={(e) => { console.log('Login form submitted with username:', username); handleLogin(e); }} className="login-form">
              <div className="input-group">
                <label className="input-label">👤 Username</label>
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => { console.log('Username input changed:', e.target.value); setUsername(e.target.value); }}
                  className="login-input"
                  required
                />
              </div>
              <div className="input-group">
                <label className="input-label">🔒 Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => { console.log('Password input changed'); setPassword(e.target.value); }}
                  className="login-input"
                  required
                />
              </div>
              
              {loginError && <div className="error-message">{loginError}</div>}
              <button type="submit" className="login-button">
                🔐 Sign In
              </button>
            </form>
            
            {/* API Key Dialog */}
            {showApiKeyDialog && (
              <div className="api-key-dialog">
                <div className="api-key-dialog-content">
                  <button 
                    className="api-key-dialog-close" 
                    onClick={() => { 
                      console.log('API key dialog: Close button clicked'); 
                      setShowApiKeyDialog(false); 
                    }}
                  >
                    ×
                  </button>
                  <h3>🔑 Enter Your Gemini API Key</h3>
                  <p className="api-key-note">To enable image generation, please enter your Gemini API key.</p>
                  <form onSubmit={(e) => { console.log('API key dialog form submitted'); handleApiKeySubmit(e); }}>
                    <div className="input-group">
                      <input
                        type="password"
                        placeholder="Enter your Gemini API key"
                        value={apiKey}
                        onChange={(e) => { console.log('API key input changed'); setApiKey(e.target.value); }}
                        className="login-input api-key-input"
                        required
                      />
                    </div>
                    <div className="api-key-dialog-buttons">
                      <button type="button" className="cancel-button" onClick={() => { console.log('API key dialog: Cancel button clicked'); setShowApiKeyDialog(false); }}>
                        ❌ Cancel
                      </button>
                      <button type="submit" className="login-button">
                        ✅ Continue
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            <div className="login-footer">
              <p>✨ Default credentials: abc / 123</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Drawer Menu */}
      {isMenuOpen && (
        <div className="drawer-overlay" onClick={() => { console.log('Drawer overlay clicked'); setIsMenuOpen(false); }}>
          <div className="drawer" onClick={(e) => { console.log('Drawer content clicked, stopping propagation'); e.stopPropagation(); }}>
            <div className="drawer-header">
              <h2>Menu</h2>
              <button className="drawer-close" onClick={() => { console.log('Drawer close button clicked'); setIsMenuOpen(false); }}>
                ×
              </button>
            </div>
            <div className="drawer-content">
              <button className="drawer-item" onClick={() => { console.log('Drawer: Navigating to generator'); setCurrentScreen('generator'); setIsMenuOpen(false); }}>
                🏠 Home
              </button>
              <button className="drawer-item" onClick={() => { console.log('Drawer: Navigating to editor'); goToEditor(); setIsMenuOpen(false); }}>
                🖌️ Edit Images
              </button>
              <button className="drawer-item" onClick={() => { console.log('Drawer: Toggling theme'); toggleTheme(); setIsMenuOpen(false); }}>
                {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
              </button>
              <button className="drawer-item" onClick={() => { console.log('Drawer: Toggling recent images'); setShowRecent(!showRecent); setIsMenuOpen(false); }}>
                {showRecent ? '📚 Hide Recent' : '📚 Show Recent'}
              </button>
              <button className="drawer-item logout-item" onClick={() => { console.log('Drawer: Logging out'); handleLogout(); setIsMenuOpen(false); }}>
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="app-header">
        <div className="header-content">
          <div className="title-section">
            <button className="menu-icon" onClick={() => { console.log('Menu icon clicked'); setIsMenuOpen(true); }}>
              ☰
            </button>
            {/* Header logo with transparent background */}
            <img 
              src="/images/logo.png" 
              alt="DataCare Softech Logo" 
              className="header-logo"
            />
            <h1 className="app-title">DataCare Softech</h1>
          </div>
          <div className="header-actions">
            <button className="theme-toggle" onClick={() => { console.log('Header: Toggling theme'); toggleTheme(); }}>
              {darkMode ? '☀️ Light' : '🌙 Dark'}
            </button>
            <button className="recent-toggle" onClick={() => { console.log('Header: Toggling recent images'); setShowRecent(!showRecent); }}>
              {showRecent ? '📚 Hide' : '📚 Show'}
            </button>
            <button className="edit-toggle" onClick={() => { console.log('Header: Navigating to editor'); goToEditor(); }}>
              🖌️ Edit
            </button>
            <button className="logout-button" onClick={() => { console.log('Header: Logging out'); handleLogout(); }}>
              🚪 Logout
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="input-section">
          <div className="input-group">
            <input
              type="text"
              value={prompt}
              onChange={(e) => { console.log('Prompt input changed:', e.target.value); setPrompt(e.target.value); }}
              onKeyPress={handleKeyPress}
              placeholder="Describe the image you want to generate..."
              disabled={loading}
              className="prompt-input"
            />
            <button 
              onClick={() => { console.log('Generate button clicked'); generateImage(); }} 
              disabled={loading}
              className="generate-button"
            >
              {loading ? '⏳ Generating...' : '✨ Generate'}
            </button>
          </div>
          
          {/* Image count selector */}
          <div className="image-count-selector">
            <label>Number of images:</label>
            <div className="counter">
              {[1, 2, 3, 4].map((count) => (
                <button
                  key={count}
                  className={`count-button ${imageCount === count ? 'active' : ''}`}
                  onClick={() => { console.log('Setting image count to:', count); setImageCount(count); }}
                  disabled={loading}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>
          
          {/* Aspect Ratio Selector */}
          <div className="aspect-ratio-selector">
            <label>Aspect Ratio:</label>
            <div className="aspect-ratio-options">
              {aspectRatios.map((ratio) => (
                <button
                  key={ratio.value}
                  className={`aspect-ratio-button ${aspectRatio === ratio.value ? 'active' : ''}`}
                  onClick={() => { console.log('Setting aspect ratio to:', ratio.value); setAspectRatio(ratio.value); }}
                  disabled={loading}
                >
                  {ratio.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Token information with progress bar */}
          <div className="token-info-container">
            <div className="token-header">
              <h3>📊 Token Usage</h3>
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
                <span className="used-tokens">{usedTokens} used</span>
                <span className="available-tokens">{availableTokens} available</span>
                <span className="total-tokens">{totalTokens} total</span>
              </div>
            </div>
            
            <div className="token-details">
              <div className="token-item">
                <span className="token-label">This Request:</span>
                <span className="token-value">{imageCount * 50} tokens</span> 
              </div>
              <div className="token-item">
                <span className="token-label">Images Generated:</span>
                <span className="token-value">{generatedCount}</span>
              </div>
            </div>
          </div>
          
          {error && <div className="error-message">{error}</div>}
        </div>

        {/* Prompt suggestions */}
        <div className="suggestions-section">
          <h3>💡 Trending Prompts</h3>
          <div className="suggestions-container">
            {promptSuggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                className="suggestion-card"
                onClick={() => useSuggestion(suggestion.prompt)}
                disabled={loading}
              >
                <span className="suggestion-number">#{suggestion.id}</span>
                <span className="suggestion-label">{suggestion.label}</span>
                <span className="suggestion-category">{suggestion.category}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Images Section */}
        {showRecent && (
          <div className="recent-section">
            <div className="recent-header">
              <h3>🕒 Recent Images</h3>
              <button className="clear-recent" onClick={() => { console.log('Clear recent images button clicked'); clearRecentImages(); }}>🗑️ Clear All</button>
            </div>
            {recentImages.length > 0 ? (
              <div className="image-gallery">
                {recentImages.map((image) => (
                  <div key={image.id} className="image-container">
                    <div className="image-header">
                      <span className="image-title">Recent Image</span>
                      <span className="image-timestamp">{image.timestamp}</span>
                    </div>
                    <div className="image-display-container">
                      <img 
                        src={image.url} 
                        alt={`Generated AI - ${image.prompt}`} 
                        className="generated-image"
                        data-aspect-ratio={image.aspectRatio || '1:1'}
                        onLoad={() => console.log(`Recent image ${image.id} loaded successfully`)}
                        onError={(e) => {
                          console.error('Error loading recent image:', e);
                          // Set a placeholder image on error
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjMyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOHB4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZmlsbD0iIzk5OSI+RXJyb3IgTG9hZGluZyBJbWFnZTwvdGV4dD48L3N2Zz4=';
                        }}
                      />
                    </div>
                    <div className="image-prompt">
                      <p>{image.prompt}</p>
                    </div>
                    <div className="image-actions">
                      <button 
                        onClick={() => {
                          console.log('Download button clicked for recent image:', image.id);
                          const link = document.createElement('a');
                          link.href = image.url;
                          link.download = `ai-generated-image-${image.id}.png`;
                          link.click();
                        }}
                        className="download-button"
                      >
                        📥 Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="placeholder-container">
                <div className="empty-state">
                  <div className="placeholder-icon">🖼️</div>
                  <p>No recent images found</p>
                  <p className="subtext">Generate some images to see them here</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Current Generation Output */}
        <div className="output-section">
          {error && <div className="error-message">{error}</div>}
          {console.log('Rendering image gallery, imageUrls.length:', imageUrls.length, 'imageUrls:', imageUrls)}
          {imageUrls.length > 0 ? (
            <div className="image-gallery">
              {console.log('Rendering', imageUrls.length, 'images')}
              {imageUrls.map((url, index) => {
                console.log(`Rendering image ${index}:`, url ? 'URL present' : 'URL missing', typeof url);
                // Ensure we have a valid URL before rendering
                const validUrl = url && typeof url === 'string' && url.startsWith('data:image/') ? url : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjMyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOHB4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZmlsbD0iIzk5OSI+RXJyb3IgTG9hZGluZyBJbWFnZTwvdGV4dD48L3N2Zz4=';
                return (
                  <div key={index} className="image-container">
                    <div className="image-header">
                      <span className="image-title">Generated Image {index + 1}</span>
                      <span className="image-aspect-ratio">{aspectRatio}</span>
                    </div>
                    <div className="image-display-container">
                      <img 
                        src={validUrl} 
                        alt={`Generated AI ${index + 1}`} 
                        className="generated-image"
                        data-aspect-ratio={aspectRatio}
                        onLoad={() => console.log(`Image ${index + 1} loaded successfully`)}
                        onError={(e) => {
                          console.error('Error loading image:', e);
                          // Set a placeholder image on error
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjMyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOHB4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZmlsbD0iIzk5OSI+RXJyb3IgTG9hZGluZyBJbWFnZTwvdGV4dD48L3N2Zz4=';
                        }}
                      />
                    </div>
                    <div className="image-prompt">
                      <p>{prompt}</p>
                    </div>
                    <div className="image-actions">
                      <button 
                        onClick={() => {
                          console.log('Download button clicked for image:', index + 1);
                          const link = document.createElement('a');
                          link.href = validUrl;
                          link.download = `ai-generated-image-${index + 1}.png`;
                          link.click();
                        }}
                        className="download-button"
                      >
                        📥 Download
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="placeholder-container">
              {console.log('Rendering placeholder container, loading:', loading, 'error:', error)}
              {loading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Creating your masterpiece{imageCount > 1 ? ` (${imageCount} images)` : ''}...</p>
                  <div className="loading-details">
                    <p>Using {imageCount * 50} tokens for this request</p>
                    <p>Aspect Ratio: {aspectRatio}</p>
                    <p>Do not refresh the page while generating...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="empty-state">
                  <div className="placeholder-icon">⚠️</div>
                  <p>{error}</p>
                  <p className="subtext">Please try again with a different prompt</p>
                  <button className="generate-button" onClick={() => { console.log('Clear error button clicked'); setError(''); }} style={{ marginTop: '1rem' }}>
                    Clear Error
                  </button>
                </div>
              ) : (
                <div className="empty-state">
                  <div className="placeholder-icon">🎨</div>
                  <p>Enter a prompt to generate AI images</p>
                  <p className="subtext">Select how many images you want (1-4)</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;