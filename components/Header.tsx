import React, { useState, useRef, useEffect } from 'react';
import { Activity, UserCircle, Globe, Sun, Moon, ChevronDown, Check } from 'lucide-react';
import { Language, Theme } from '../types';
import { TRANSLATIONS } from '../translations';

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  theme: Theme;
  onToggleTheme: () => void;
}

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
];

export const Header: React.FC<HeaderProps> = ({ language, onLanguageChange, theme, onToggleTheme }) => {
  const t = TRANSLATIONS[language];
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-200/50 dark:border-navy-600 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="bg-gradient-to-br from-blue-500 to-cyan-400 dark:from-neon-blue dark:to-neon-purple p-2.5 rounded-xl text-white shadow-lg shadow-blue-500/20 dark:shadow-neon-blue/20 group-hover:scale-110 transition-transform duration-300">
            <Activity size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-cyan-600 dark:from-neon-blue dark:to-cyan-200 tracking-tight">
              {t.appTitle}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium hidden sm:block tracking-wide">{t.appSubtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Animated Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="relative w-10 h-10 rounded-full bg-white/50 dark:bg-navy-700/50 border border-transparent hover:border-slate-200 dark:hover:border-navy-600 transition-all duration-300 flex items-center justify-center overflow-hidden group"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
             <div className={`absolute transition-all duration-500 transform ${theme === 'dark' ? 'rotate-90 opacity-0 scale-50' : 'rotate-0 opacity-100 scale-100'}`}>
                <Sun size={20} className="text-amber-500" />
             </div>
             <div className={`absolute transition-all duration-500 transform ${theme === 'light' ? '-rotate-90 opacity-0 scale-50' : 'rotate-0 opacity-100 scale-100'}`}>
                <Moon size={20} className="text-neon-blue" />
             </div>
          </button>

          {/* Custom Animated Language Selector */}
          <div className="relative" ref={langDropdownRef}>
            <button 
              onClick={() => setIsLangOpen(!isLangOpen)}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-300 border
                ${theme === 'dark' 
                  ? 'bg-navy-700/50 hover:bg-navy-600 text-slate-200 border-navy-600 hover:border-neon-blue/50' 
                  : 'bg-white/50 hover:bg-white text-slate-700 border-transparent hover:border-blue-100 shadow-sm'
                }
              `}
            >
              <Globe size={18} className={theme === 'dark' ? 'text-neon-blue' : 'text-blue-500'} />
              <span className="text-sm font-medium">{currentLang.label}</span>
              <ChevronDown size={14} className={`transition-transform duration-300 ${isLangOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            <div 
              className={`
                absolute top-full right-0 mt-2 w-48 rounded-xl overflow-hidden shadow-2xl z-[60] border transition-all duration-200 origin-top-right
                ${isLangOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible pointer-events-none'}
                ${theme === 'dark' 
                  ? 'bg-navy-800/90 border-navy-600 backdrop-blur-xl' 
                  : 'bg-white/90 border-slate-100 backdrop-blur-xl'
                }
              `}
            >
              <div className="py-1 max-h-[300px] overflow-y-auto">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      onLanguageChange(lang.code);
                      setIsLangOpen(false);
                    }}
                    className={`
                      w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors
                      ${theme === 'dark'
                        ? 'hover:bg-navy-700 text-slate-300 hover:text-white'
                        : 'hover:bg-slate-50 text-slate-700 hover:text-slate-900'
                      }
                      ${language === lang.code ? (theme === 'dark' ? 'bg-navy-700/50 text-neon-blue' : 'bg-blue-50 text-blue-600') : ''}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base leading-none">{lang.flag}</span>
                      <span>{lang.label}</span>
                    </div>
                    {language === lang.code && <Check size={14} className={theme === 'dark' ? 'text-neon-blue' : 'text-blue-500'} />}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <button className="text-slate-400 hover:text-blue-600 dark:hover:text-neon-blue transition-colors duration-300 hover:scale-110 active:scale-95">
            <UserCircle size={32} />
          </button>
        </div>
      </div>
    </header>
  );
};