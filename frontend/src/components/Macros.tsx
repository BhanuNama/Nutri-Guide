import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';

type MacroData = {
  food_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

export default function FoodMacroAnalyzer() {
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [macros, setMacros] = useState<MacroData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [captureMode, setCaptureMode] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=AIzaSyA-xsH1XeeMzRgxo1tn3rUX03diW4CCLgA";
  
  // Clean up camera resources when component unmounts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  // Effect to initialize camera when capture mode is turned on
  useEffect(() => {
    if (captureMode) {
      const initCamera = async () => {
        try {
          // Request camera permissions
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error("Camera access is not supported in your browser");
          }
          
          // Stop any existing stream first
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
          }
          
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } // Prefer rear camera on mobile
          });
          
          streamRef.current = stream;
          
          // Small delay to ensure DOM is ready
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              videoRef.current.play().catch(err => {
                console.error("Error playing video:", err);
                setError("Could not play video stream: " + err.message);
              });
              setError(null);
            } else {
              throw new Error("Video element not available after initialization");
            }
          }, 100);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "Unknown camera error";
          setError("Could not access camera: " + errorMessage);
          setCaptureMode(false);
        }
      };
      
      initCamera();
    } else {
      // Clean up when leaving capture mode
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  }, [captureMode]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    setImage(file);
    createPreview(file);
  };

  const createPreview = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      if (e.target?.result) {
        setImagePreview(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const startCamera = () => {
    setCaptureMode(true);
  };

  const stopCamera = () => {
    setCaptureMode(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) {
      setError("Video element not available");
      return;
    }
    
    // Make sure video is playing and has dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setError("Camera not ready yet. Please wait a moment.");
      return;
    }
    
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error("Could not create canvas context");
      }
      
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "captured-food.jpg", { type: "image/jpeg" });
          setImage(file);
          createPreview(file);
          stopCamera();
        } else {
          throw new Error("Failed to create image blob");
        }
      }, 'image/jpeg', 0.9);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to capture photo";
      setError(errorMessage);
    }
  };
  
  const analyzeImage = async () => {
    if (!image) {
      setError("Please select or capture an image first");
      return;
    }
    
    setLoading(true);
    setError(null);
    setMacros(null);
    
    try {
      const base64Image = await convertToBase64(image);
      
      if (!base64Image) {
        throw new Error("Failed to convert image to Base64");
      }
      
      const base64Data = base64Image.split(',')[1];
      
      if (!base64Data) {
        throw new Error("Invalid Base64 image data");
      }
      
      const requestData = {
        contents: [
          {
            parts: [
              {
                text: "Analyze this food image and provide the macronutrient information. Return the result in JSON format with the following structure: {\"food_name\": \"Name of the food\", \"calories\": number, \"protein_g\": number, \"carbs_g\": number, \"fat_g\": number}. Only respond with the JSON, no other text."
              },
              {
                inline_data: {
                  mime_type: image.type,
                  data: base64Data
                }
              }
            ]
          }
        ]
      };
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        const textResponse = data.candidates[0].content.parts[0].text;
        const jsonMatch = textResponse.match(/\{.*\}/s);
        if (jsonMatch) {
          const parsedData = JSON.parse(jsonMatch[0]) as MacroData;
          setMacros(parsedData);
        } else {
          throw new Error("Could not extract JSON from response");
        }
      } else {
        throw new Error("Invalid response format from API");
      }
    } catch (err) {
      console.error("Error analyzing image:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to analyze image";
      setError(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };
  
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          resolve(reader.result as string);
        } else {
          reject(new Error("Failed to read file"));
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };
  
  const resetAnalysis = () => {
    setImage(null);
    setImagePreview(null);
    setMacros(null);
    setError(null);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Food Macro Analyzer</CardTitle>
        <CardDescription>Upload or capture a photo of your food to analyze its nutritional content</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {!captureMode ? (
          <div className="space-y-4">
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Upload className="w-5 h-5" />
                Upload Photo
              </button>
              <button
                onClick={startCamera}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Camera className="w-5 h-5" />
                Take Photo
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            {imagePreview && (
              <div className="relative">
                <img 
                  src={imagePreview} 
                  alt="Food preview" 
                  className="w-full h-64 object-cover rounded-lg"
                />
                <button
                  onClick={resetAnalysis}
                  className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative bg-black rounded-lg h-64 flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-64 object-cover rounded-lg"
              />
              {error && captureMode && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 text-white p-4 text-center rounded-lg">
                  {error}
                </div>
              )}
              {captureMode && !error && !videoRef.current?.srcObject && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-white" />
                  <span className="ml-2 text-white">Initializing camera...</span>
                </div>
              )}
            </div>
            <div className="flex justify-center gap-4">
              <button
                onClick={capturePhoto}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Camera className="w-5 h-5" />
                Capture
              </button>
              <button
                onClick={stopCamera}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <X className="w-5 h-5" />
                Cancel
              </button>
            </div>
          </div>
        )}

        {imagePreview && !macros && !loading && (
          <div className="flex justify-center">
            <button
              onClick={analyzeImage}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Analyze Food
            </button>
          </div>
        )}
        
        {loading && (
          <div className="flex items-center justify-center gap-2 text-blue-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Analyzing image...</span>
          </div>
        )}
        
        {error && !captureMode && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
        
        {macros && (
          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-center">{macros.food_name}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Calories</div>
                <div className="text-2xl font-bold text-blue-700">{macros.calories}</div>
                <div className="text-xs text-gray-500">kcal</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Protein</div>
                <div className="text-2xl font-bold text-green-700">{macros.protein_g}</div>
                <div className="text-xs text-gray-500">grams</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Carbs</div>
                <div className="text-2xl font-bold text-yellow-700">{macros.carbs_g}</div>
                <div className="text-xs text-gray-500">grams</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Fat</div>
                <div className="text-2xl font-bold text-red-700">{macros.fat_g}</div>
                <div className="text-xs text-gray-500">grams</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}