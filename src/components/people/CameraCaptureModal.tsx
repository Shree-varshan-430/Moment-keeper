import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw } from 'lucide-react';
import { hapticService } from '@/services/hapticService';
import toast from 'react-hot-toast';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (blob: Blob) => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [flashActive, setFlashActive] = useState(false);

  useEffect(() => {
    if (isOpen) {
      startCamera();
      document.body.classList.add('overflow-hidden');
    } else {
      stopCamera();
      document.body.classList.remove('overflow-hidden');
    }
    return () => {
      stopCamera();
      document.body.classList.remove('overflow-hidden');
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    try {
      if (streamRef.current) {
        stopCamera();
      }
      const constraints = {
        video: { facingMode: facingMode },
        audio: false
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setHasCamera(true);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setHasCamera(false);
      toast.error('Unable to access camera.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleCapture = () => {
    if (!videoRef.current) return;
    hapticService.heavyImpact();

    // Trigger flash animation
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 200);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    
    // We want a square crop for the profile picture
    const size = Math.min(video.videoWidth, video.videoHeight);
    canvas.width = 400;
    canvas.height = 400;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Calculate centering for square crop
      const sx = (video.videoWidth - size) / 2;
      const sy = (video.videoHeight - size) / 2;
      
      // Mirror the user camera capture if user-facing for natural feel
      if (facingMode === 'user') {
        ctx.translate(400, 0);
        ctx.scale(-1, 1);
      }
      
      ctx.drawImage(video, sx, sy, size, size, 0, 0, 400, 400);
      
      canvas.toBlob((blob) => {
        if (blob) {
          onCapture(blob);
          stopCamera();
          onClose();
        } else {
          toast.error('Failed to capture photo.');
        }
      }, 'image/jpeg', 0.85);
    }
  };

  const toggleFacingMode = () => {
    hapticService.lightImpact();
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-sm rounded-3xl glass p-6 border border-mk-glass-border shadow-silver flex flex-col items-center gap-6 text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-mk-silver hover:text-mk-white p-2 rounded-full border border-mk-glass-border hover:bg-white/5 transition-all"
        >
          <X size={18} />
        </button>

        <div>
          <h2 className="font-display text-xl font-bold text-mk-white">Capture Photo</h2>
          <p className="text-[11px] text-mk-silver mt-1.5">
            Position the face within the viewfinder circle
          </p>
        </div>

        {/* Viewfinder circle */}
        <div className="relative h-64 w-64 rounded-full overflow-hidden border-2 border-mk-glass-border bg-black/50 shadow-glass-sm flex items-center justify-center">
          {hasCamera === false ? (
            <div className="p-4 text-xs text-mk-silver flex flex-col items-center gap-2">
              <span>📷 No camera access</span>
              <span className="text-[10px] text-mk-silver/60">Check permissions or use gallery import.</span>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`h-full w-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            />
          )}

          {/* Flash screen overlay */}
          {flashActive && (
            <div className="absolute inset-0 bg-white z-10 animate-fade-in duration-75"></div>
          )}

          {/* Viewfinder circular border guidance overlay */}
          <div className="absolute inset-0 border-[10px] border-mk-black/40 pointer-events-none rounded-full"></div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6">
          <button
            onClick={toggleFacingMode}
            disabled={hasCamera === false}
            className="p-3 rounded-full border border-mk-glass-border bg-white/5 hover:bg-white/10 active:scale-95 text-mk-silver hover:text-mk-white transition-all disabled:opacity-50"
            title="Switch Camera"
          >
            <RefreshCw size={18} />
          </button>

          <button
            onClick={handleCapture}
            disabled={hasCamera === false}
            className="h-16 w-16 rounded-full bg-gradient-silver border-4 border-mk-black shadow-silver text-mk-black font-semibold flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            title="Capture Photo"
          >
            <Camera size={24} />
          </button>
          
          {/* Dummy element for layout balance */}
          <div className="w-11"></div>
        </div>
      </div>
    </div>
  );
};
