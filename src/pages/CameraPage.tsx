import { ASSETS } from '@/constants/assets';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes';
import { X, Loader2 } from 'lucide-react';
import Webcam from 'react-webcam';
import { createWorker } from 'tesseract.js';
const CameraPage = () => {
  const navigate = useNavigate();
  const webcamRef = useRef<Webcam>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const processImage = async (imageSrc: string) => {
    setIsProcessing(true);
    try {
      const worker = await createWorker('eng', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            setProgress(parseInt((m.progress * 100).toFixed(0)));
          }
        },
      });
      const {
        data: { text },
      } = await worker.recognize(imageSrc);
      await worker.terminate();
      // Simple regex for card number (16 digits, possibly with spaces)
      const cardNumberMatch = text.replace(/\s/g, '').match(/\d{16}/);
      // Simple regex for expiry date (MM/YY or MM/YYYY)
      const expiryMatch = text.match(/(0[1-9]|1[0-2])\/?([2-9][0-9])/);
      if (cardNumberMatch) {
        navigate(ROUTES.CARDS_ADD, {
          state: {
            scanned: true,
            cardNumber: cardNumberMatch[0],
            expiry: expiryMatch ? `${expiryMatch[1]}/${expiryMatch[2]}` : '',
            cardHolder: 'ABC', // As requested by user
          },
        });
      } else {
        if (import.meta.env.DEV) {
          // Fallback for demo/manual trigger if no number found but shutter clicked
          navigate(ROUTES.CARDS_ADD, {
            state: {
              scanned: true,
              cardNumber: '4242424242424242', // Default for demo as requested
              expiry: '12/28',
              cardHolder: 'ABC',
            },
          });
        }
      }
    } catch (err) {
      console.error('OCR Error:', err);
      setIsProcessing(false);
    }
  };
  const handleCapture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      processImage(imageSrc);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webcamRef]);
  // Auto-scan trial (optional, every 3s if not processing)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isProcessing && !isCapturing) {
        // handleCapture(); // Uncomment for real-time auto-scan
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [isProcessing, isCapturing, handleCapture]);
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col safe-top safe-bottom">
      {/* Camera Header */}
      <div className="flex items-center px-5 pt-4 pb-2 absolute top-0 left-0 right-0 z-10 safe-top">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm"
        >
          <X className="w-5 h-5 text-white" />
        </button>
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.8)]"></div>
      </div>
      {/* Camera Viewport */}
      <div className="flex-1 relative bg-black flex flex-col items-center justify-center overflow-hidden">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          className="absolute inset-0 w-full h-full object-cover"
          videoConstraints={{ facingMode: 'environment' }}
        />
        {/* Frame Asset Overlay */}
        <div className="relative w-[85%] aspect-[1.586/1] max-w-[360px] flex items-center justify-center z-10">
          <img loading="lazy" decoding="async"             src={ASSETS.CAMERA_SCAN_FRAME}
            alt="Align Card"
            className="w-full h-full object-contain"
          />
          {isProcessing && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center rounded-xl backdrop-blur-sm">
              <Loader2 className="w-8 h-8 text-white animate-spin mb-2" />
              <p className="text-white text-sm font-medium">Scanning... {progress}%</p>
            </div>
          )}
        </div>
        {/* Text Instructions */}
        <div className="relative mt-12 flex flex-col items-center gap-4 z-10">
          <p className="text-white text-[20px] font-normal text-center">
            Align your card within the frame
          </p>
          <div className="w-[256px] h-[34px] bg-[#090909]/80 rounded-full flex items-center justify-center border border-white/5 backdrop-blur-sm">
            <span className="text-white/80 text-[12px] font-normal">
              Avoid glare, light background.
            </span>
          </div>
        </div>
      </div>
      {/* Camera Controls */}
      <div className="h-[120px] pb-8 flex items-center justify-center relative bg-black px-8">
        <button
          onClick={handleCapture}
          disabled={isProcessing}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-transform z-20 ${isProcessing ? 'scale-90 opacity-50' : 'active:scale-95'}`}
        >
          <img loading="lazy" decoding="async" src={ASSETS.SHUTTER} alt="Capture" className="w-full h-full object-contain" />
        </button>
        <div className="absolute inset-0 flex items-center justify-end px-12 pointer-events-none">
          <button className="w-8 h-8 flex items-center justify-center pointer-events-auto">
            <img loading="lazy" decoding="async" src={ASSETS.FLASH} alt="Flash" className="w-full h-full object-contain" />
          </button>
        </div>
      </div>
    </div>
  );
};
export default CameraPage;
