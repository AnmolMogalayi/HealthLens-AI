import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Sparkles, Mic, Volume2, Phone } from 'lucide-react';
import { ChatMessage, Language } from '../types';
import { TRANSLATIONS } from '../translations';
import { GoogleGenAI } from "@google/genai";
import { VoiceCallOverlay } from './VoiceCallOverlay';

interface AICoachProps {
  language: Language;
  context: any; // Full analysis context
}

export const AICoach: React.FC<AICoachProps> = ({ language, context }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'ai',
      text: "Hello! I'm Dr. AI. I've analyzed your health trends. I see some great progress in your cholesterol levels! What would you like to explore deeper?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false); // Voice session state
  const scrollRef = useRef<HTMLDivElement>(null);
  const t = TRANSLATIONS[language];
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
        // Construct prompt with context
        const prompt = `
            Context: User has uploaded medical reports. Here is the trend analysis: ${JSON.stringify(context)}.
            User Question: ${input}
            
            Role: Compassionate, non-alarmist medical AI coach. 
            Rules:
            1. Keep answers short (2-3 sentences max).
            2. Reference specific data points from the analysis.
            3. Never diagnose. Use "I cannot diagnose..." if asked.
            4. If urgent values, tell user to see a doctor immediately.
            5. Suggest 3 short follow-up questions at the end of response in a separate block labeled [FOLLOW_UP].
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        const text = response.text || "I'm having trouble connecting right now.";
        
        const aiMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'ai',
            text: text.replace('[FOLLOW_UP]', '\n\nSuggested Questions:'),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
        console.error(e);
    } finally {
        setIsTyping(false);
    }
  };

  return (
    <>
      <div className="flex flex-col h-[600px] glass-panel rounded-3xl overflow-hidden border border-white/60 dark:border-slate-700/60 shadow-xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-500 p-2 rounded-xl text-white shadow-lg">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">{t.drAiCoach}</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"/> Online
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => setIsVoiceActive(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-full text-xs font-bold hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg active:scale-95 animate-pulse"
          >
            <Phone size={14} /> {t.startVoiceSession}
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-slate-800 dark:bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-tl-none'
              }`}>
                  {msg.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 p-3 rounded-2xl rounded-tl-none shadow-sm flex gap-1">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"/>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"/>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"/>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 bg-white/60 dark:bg-slate-800/60 border-t border-white/50 dark:border-slate-700/50">
          <div className="flex gap-2 relative">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={t.askAnything}
              className="w-full bg-white dark:bg-slate-900 border-none rounded-xl py-3 pl-4 pr-12 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 text-sm shadow-inner text-slate-800 dark:text-slate-100"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="absolute right-2 top-1.5 p-1.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </div>
          <div className="flex justify-center mt-2">
              <p className="text-[10px] text-slate-400 font-medium opacity-70">AI can make mistakes. Check important info.</p>
          </div>
        </div>
      </div>

      {isVoiceActive && (
        <VoiceCallOverlay 
          onClose={() => setIsVoiceActive(false)} 
          systemContext={context} 
          language={language} 
        />
      )}
    </>
  );
};