import React, { useCallback, useState, useEffect, useRef } from 'react';
import { UploadCloud, FileText, Image as ImageIcon, AlertCircle, Scan, Fingerprint } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../translations';

interface UploadAreaProps {
  onFileSelect: (file: File) => void;
  disabled: boolean;
  language: Language;
}

export const UploadArea: React.FC<UploadAreaProps> = ({ onFileSelect, disabled, language }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // Use Ref for reliable click triggering
  const t = TRANSLATIONS[language];

  // Simulated scanning effect
  useEffect(() => {
    if (isScanning) {
      const interval = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 2;
        });
      }, 20);
      return () => clearInterval(interval);
    }
  }, [isScanning]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const validateAndSelect = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    const validExtensions = ['jpg', 'jpeg', 'png', 'pdf'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    const extension = file.name.split('.').pop()?.toLowerCase();
    
    const isValidType = file.type ? validTypes.includes(file.type) : false;
    const isValidExt = extension ? validExtensions.includes(extension) : false;

    if (!isValidType && !isValidExt) {
      setError(t.fileInvalidType);
      return;
    }

    if (file.size > maxSize) {
      setError(t.fileTooLarge);
      return;
    }

    setError(null);
    setIsScanning(true);
    
    setTimeout(() => {
        onFileSelect(file);
        setIsScanning(false);
        setScanProgress(0);
    }, 1200);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelect(e.dataTransfer.files[0]);
    }
  }, [disabled, onFileSelect, language]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSelect(e.target.files[0]);
    }
    // Reset value so same file can be selected again if needed
    e.target.value = '';
  };

  const handleContainerClick = () => {
    if (!disabled && fileInputRef.current) {
        fileInputRef.current.click();
    }
  };

  return (
    <div className="w-full relative group perspective-1000">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleContainerClick}
        className={`
          relative overflow-hidden rounded-3xl transition-all duration-500 ease-out
          flex flex-col items-center justify-center text-center min-h-[400px]
          glass-panel border-2
          ${error 
            ? 'border-red-300 bg-red-50/30 dark:border-neon-pink/50 dark:bg-neon-pink/10' 
            : isDragging 
              ? 'border-teal-400 dark:border-neon-blue scale-[1.02] shadow-[0_0_40px_rgba(45,212,191,0.3)] dark:shadow-[0_0_40px_rgba(0,212,255,0.3)]' 
              : 'border-white/50 dark:border-navy-600 hover:border-teal-300/50 dark:hover:border-neon-blue/50 hover:shadow-xl'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : 'cursor-pointer'}
        `}
      >
        {/* Hidden File Input linked via Ref */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileInput}
          disabled={disabled || !!error || isScanning}
          accept=".jpg,.jpeg,.png,.pdf"
        />
        
        {/* Holographic Grid Background */}
        <div className={`absolute inset-0 hologram-grid transition-opacity duration-700 ${isDragging || isScanning ? 'opacity-100' : 'opacity-30'}`} />
        
        {/* Scanning Beam Animation */}
        {(isDragging || isScanning) && <div className="scan-beam" />}

        {isScanning ? (
           <div className="relative z-30 flex flex-col items-center">
             {/* Liquid Progress Ring */}
             <div className="relative w-32 h-32 mb-6">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="60"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    className="text-slate-200 dark:text-navy-700"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="60"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={377}
                    strokeDashoffset={377 - (377 * scanProgress) / 100}
                    className="text-teal-500 dark:text-neon-blue transition-all duration-100 ease-linear"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-teal-600 dark:text-neon-blue font-bold text-xl animate-pulse">
                  {scanProgress}%
                </div>
             </div>
             <p className="text-teal-700 dark:text-neon-blue font-semibold tracking-wide animate-pulse">ANALYZING BIOMETRICS...</p>
           </div>
        ) : error ? (
          <div className="flex flex-col items-center z-30 animate-stagger-enter" onClick={(e) => e.stopPropagation()}>
            <div className="bg-red-50 dark:bg-neon-pink/20 p-6 rounded-full mb-4 shadow-inner border border-red-100 dark:border-neon-pink/40">
              <AlertCircle className="w-10 h-10 text-red-500 dark:text-neon-pink" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{t.uploadFailed}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-xs">{error}</p>
            <button 
              onClick={(e) => { e.preventDefault(); setError(null); }}
              className="px-8 py-3 bg-white/80 dark:bg-navy-700 border border-red-200 dark:border-neon-pink/50 text-red-600 dark:text-neon-pink rounded-full text-sm font-bold hover:bg-white dark:hover:bg-navy-600 hover:scale-105 transition-all shadow-lg relative z-40"
            >
              {t.retry}
            </button>
          </div>
        ) : (
          <div className="relative z-30 flex flex-col items-center transition-transform duration-300 group-hover:scale-105">
            {/* Main Icon with Glow */}
            <div className={`
              relative p-8 rounded-full mb-8 transition-all duration-500
              ${isDragging ? 'bg-teal-500 dark:bg-neon-blue text-white shadow-lg shadow-teal-500/40 dark:shadow-neon-blue/40' : 'bg-white/60 dark:bg-navy-800/60 text-teal-600 dark:text-neon-blue shadow-xl border border-white/60 dark:border-navy-600'}
            `}>
              <div className="absolute inset-0 rounded-full border border-teal-200 dark:border-neon-blue/30 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite] opacity-30"></div>
              {isDragging ? <Scan className="w-12 h-12 animate-pulse" /> : <UploadCloud className="w-12 h-12" />}
            </div>
            
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-3 tracking-tight">
              {isDragging ? "Drop to Scan" : t.uploadTitle}
            </h3>
            
            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xs font-medium leading-relaxed">
              {t.uploadDesc}
            </p>

            <div className="flex gap-3">
               <span className="px-4 py-2 rounded-xl bg-white/40 dark:bg-navy-800/40 border border-white/60 dark:border-navy-600 text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-2 backdrop-blur-sm">
                 <ImageIcon size={14} className="text-teal-500 dark:text-neon-blue" /> {t.fileTypeJPG}
               </span>
               <span className="px-4 py-2 rounded-xl bg-white/40 dark:bg-navy-800/40 border border-white/60 dark:border-navy-600 text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-2 backdrop-blur-sm">
                 <FileText size={14} className="text-teal-500 dark:text-neon-blue" /> {t.fileTypePDF}
               </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};