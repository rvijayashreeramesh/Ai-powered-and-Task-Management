'use client';
import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface AppLoadingScreenProps {
  onComplete?: () => void;
  isLoading: boolean;
}

export function AppLoadingScreen({ isLoading, onComplete }: AppLoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('Initializing workspace...');
  const [shouldRender, setShouldRender] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // If we're done loading, animate to 100% and fade out
    if (!isLoading) {
      setProgress(100);
      setStage('Workspace ready');
      
      const fadeOutTimer = setTimeout(() => {
        setIsFadingOut(true);
      }, 400); // Short delay before fading out

      const unmountTimer = setTimeout(() => {
        setShouldRender(false);
        onComplete?.();
      }, 1000); // Total time including fade out

      return () => {
        clearTimeout(fadeOutTimer);
        clearTimeout(unmountTimer);
      };
    }

    // Simulate progress while actually loading
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.random() * 15;
      if (currentProgress > 90) currentProgress = 90; // Never hit 100% until isLoading is false
      setProgress(currentProgress);

      if (currentProgress < 20) setStage('Initializing workspace...');
      else if (currentProgress < 45) setStage('Loading projects...');
      else if (currentProgress < 70) setStage('Loading tasks...');
      else setStage('Preparing AI assistant...');
    }, 300);

    return () => clearInterval(interval);
  }, [isLoading, onComplete]);

  if (!shouldRender) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-50 transition-opacity duration-500 ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-[30%] left-[30%] w-96 h-96 rounded-full bg-violet-200 blur-[100px] animate-blob"></div>
        <div className="absolute bottom-[30%] right-[30%] w-[500px] h-[500px] rounded-full bg-indigo-200 blur-[100px] animate-blob animation-delay-2000"></div>
      </div>
      
      <div className="relative z-10 flex flex-col items-center max-w-sm w-full px-6 text-center">
        <div className="w-20 h-20 bg-white rounded-2xl shadow-xl shadow-indigo-500/10 flex items-center justify-center mb-8 relative">
          <div className="absolute inset-0 rounded-2xl bg-indigo-500 animate-ping opacity-20" style={{ animationDuration: '3s' }}></div>
          <Sparkles className="w-10 h-10 text-indigo-600 animate-float" />
        </div>
        
        <h2 className="text-2xl font-bold text-slate-900 mb-2">TaskFlow AI</h2>
        <p className="text-slate-500 font-medium h-6">{stage}</p>
        
        <div className="w-full h-2 bg-slate-200 rounded-full mt-8 overflow-hidden">
          <div 
            className="h-full bg-indigo-600 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <p className="text-xs text-slate-400 mt-4">Organizing your projects and tasks</p>
      </div>
    </div>
  );
}
