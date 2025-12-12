import React, { useState, useRef, useEffect } from 'react';
import { Share2, Mail, Link as LinkIcon, MessageCircle, Check, Copy } from 'lucide-react';

interface ShareMenuProps {
  label: string;
}

export const ShareMenu: React.FC<ShareMenuProps> = ({ label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getShareUrl = () => window.location.href;
  const shareText = "Check out my HealthLens AI Analysis Report!";

  const handleWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + getShareUrl())}`;
    window.open(url, '_blank');
    setIsOpen(false);
  };

  const handleEmail = () => {
    const url = `mailto:?subject=${encodeURIComponent("HealthLens AI Report")}&body=${encodeURIComponent(shareText + '\n\n' + getShareUrl())}`;
    window.location.href = url;
    setIsOpen(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setIsOpen(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <div className="relative z-[100]" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold rounded-xl transition-all shadow-sm hover:shadow glow-hover
          ${isOpen 
            ? 'bg-blue-50 dark:bg-navy-600 text-blue-600 dark:text-neon-blue border border-blue-200 dark:border-neon-blue' 
            : 'text-slate-700 dark:text-slate-200 bg-white dark:bg-navy-700 border border-slate-200 dark:border-navy-600 hover:bg-slate-50 dark:hover:bg-navy-600'
          }
        `}
      >
        <Share2 size={18} /> {label}
      </button>

      {/* Pop-up Menu */}
      <div 
        className={`
          absolute top-full right-0 mt-3 w-56 rounded-xl overflow-hidden shadow-2xl border transition-all duration-200 origin-top-right transform
          ${isOpen ? 'opacity-100 scale-100 translate-y-0 visible' : 'opacity-0 scale-95 -translate-y-2 invisible pointer-events-none'}
          bg-white/95 dark:bg-navy-800/95 border-slate-100 dark:border-navy-600 backdrop-blur-xl
        `}
        style={{ zIndex: 9999 }} // Explicitly high z-index
      >
        <div className="p-1">
          <button
            onClick={handleWhatsApp}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-navy-700 rounded-lg transition-colors group"
          >
            <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full group-hover:scale-110 transition-transform">
              <MessageCircle size={16} />
            </div>
            WhatsApp
          </button>

          <button
            onClick={handleEmail}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-navy-700 rounded-lg transition-colors group"
          >
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full group-hover:scale-110 transition-transform">
              <Mail size={16} />
            </div>
            Email
          </button>

          <button
            onClick={handleCopyLink}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-navy-700 rounded-lg transition-colors group"
          >
            <div className={`p-2 rounded-full transition-all group-hover:scale-110 ${copied ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 dark:bg-navy-900 text-slate-600 dark:text-slate-400'}`}>
              {copied ? <Check size={16} /> : <LinkIcon size={16} />}
            </div>
            {copied ? <span className="text-emerald-600 font-bold">Copied!</span> : "Copy Link"}
          </button>
        </div>
      </div>
    </div>
  );
};