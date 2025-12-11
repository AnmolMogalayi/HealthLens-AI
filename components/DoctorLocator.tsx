import React, { useState } from 'react';
import { MapPin, Navigation, Phone, Share2, Star, UserPlus, LocateFixed, Loader2, Map as MapIcon } from 'lucide-react';
import { Language, MapsResult } from '../types';
import { TRANSLATIONS } from '../translations';
import { findNearbySpecialists } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface DoctorLocatorProps {
  specialist: string;
  reason: string;
  isDemoMode: boolean;
  language: Language;
}

export const DoctorLocator: React.FC<DoctorLocatorProps> = ({ specialist, reason, isDemoMode, language }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MapsResult | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const t = TRANSLATIONS[language];

  const handleFindDoctors = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
        setError("Geolocation is not supported by your browser");
        setLoading(false);
        return;
    }

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            setUserLocation({ lat: latitude, lng: longitude });
            
            try {
                const data = await findNearbySpecialists(specialist, latitude, longitude, isDemoMode, language);
                setResult(data);
            } catch (err) {
                console.error(err);
                setError("Could not find specialists. Please try again.");
            } finally {
                setLoading(false);
            }
        },
        (err) => {
            console.error(err);
            setError("Location permission denied. Please allow access to find nearby doctors.");
            setLoading(false);
        }
    );
  };

  if (!result && !loading) {
     return (
        <div className="col-span-1 md:col-span-3 mt-8 animate-stagger-enter">
            <div className="glass-panel p-6 rounded-3xl border border-teal-100 dark:border-neon-blue/30 bg-gradient-to-r from-teal-50/50 to-cyan-50/50 dark:from-navy-800 dark:to-navy-900">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="p-2 bg-teal-100 dark:bg-navy-700 text-teal-600 dark:text-neon-blue rounded-lg">
                                 <UserPlus size={24} />
                             </div>
                             <h3 className="text-xl font-bold text-slate-800 dark:text-white">Next Step: See a Specialist</h3>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 font-medium text-lg">
                            We recommend seeing a <span className="font-bold text-teal-600 dark:text-neon-blue">{specialist}</span>.
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{reason}</p>
                    </div>
                    
                    <button 
                        onClick={handleFindDoctors}
                        className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-lg shadow-teal-500/30 flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95"
                    >
                        <LocateFixed size={20} /> Find {specialist} Near Me
                    </button>
                </div>
            </div>
        </div>
     );
  }

  return (
    <div className="col-span-1 md:col-span-3 mt-8 animate-stagger-enter">
       <div className="glass-panel rounded-3xl overflow-hidden border border-slate-200 dark:border-navy-600 shadow-xl flex flex-col md:flex-row h-[600px]">
          
          {/* List Section */}
          <div className="w-full md:w-1/2 p-6 overflow-y-auto bg-white/80 dark:bg-navy-800/80">
             <div className="flex items-center justify-between mb-6">
                 <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-lg flex items-center gap-2">
                        <UserPlus className="text-teal-500" size={20} /> Nearby {specialist}s
                    </h3>
                    <p className="text-xs text-slate-400">Based on your current location</p>
                 </div>
                 {loading && <Loader2 className="animate-spin text-teal-500" />}
             </div>

             {error ? (
                 <div className="p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl text-sm font-medium">
                     {error}
                 </div>
             ) : (
                 <div className="space-y-4">
                     {/* Render structured cards if we have grounding chunks with map data */}
                     {result?.groundingChunks?.map((chunk, idx) => {
                         // Attempt to extract place data if available in chunk.web or chunk.maps
                         // Note: Gemini Live API chunks structure can vary. We assume standard grounding format.
                         const title = chunk.web?.title || chunk.maps?.title || `Result ${idx + 1}`;
                         const uri = chunk.web?.uri || chunk.maps?.googleMapsUri || chunk.maps?.uri;
                         
                         return (
                             <div key={idx} className="p-4 bg-white dark:bg-navy-700 rounded-xl border border-slate-100 dark:border-navy-600 shadow-sm hover:shadow-md transition-shadow">
                                 <div className="flex justify-between items-start">
                                     <h4 className="font-bold text-slate-800 dark:text-white">{title}</h4>
                                     <div className="flex gap-1 text-amber-400">
                                         <Star size={14} fill="currentColor" />
                                         <Star size={14} fill="currentColor" />
                                         <Star size={14} fill="currentColor" />
                                         <Star size={14} fill="currentColor" />
                                         <Star size={14} fill="currentColor" />
                                     </div>
                                 </div>
                                 <div className="mt-3 flex items-center gap-2">
                                     {uri && (
                                         <a href={uri} target="_blank" rel="noreferrer" className="flex-1 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
                                             <Navigation size={14} /> Navigate
                                         </a>
                                     )}
                                     <button className="flex-1 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors">
                                         <Phone size={14} /> Call
                                     </button>
                                 </div>
                             </div>
                         );
                     })}

                     {/* Fallback to text if chunks are sparse, but render it nicely */}
                     <div className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-300">
                        <ReactMarkdown>{result?.text || ''}</ReactMarkdown>
                     </div>
                 </div>
             )}
          </div>

          {/* Map Section (Iframe Placeholder for "Interactive" feel without API Key) */}
          <div className="w-full md:w-1/2 bg-slate-100 dark:bg-navy-900 relative">
             {userLocation ? (
                 <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ border: 0 }}
                    src={`https://maps.google.com/maps?q=${specialist}&hl=${language}&z=13&output=embed`}
                    allowFullScreen
                    className="opacity-90 hover:opacity-100 transition-opacity"
                 ></iframe>
             ) : (
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                     <MapIcon size={48} className="mb-2 opacity-50" />
                     <p className="text-sm font-medium">Map View</p>
                 </div>
             )}
             
             {/* Gradient Overlay for "Split View" aesthetic */}
             <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white/80 to-transparent dark:from-navy-800/80 pointer-events-none md:block hidden" />
          </div>

       </div>
    </div>
  );
};