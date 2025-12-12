import React, { useState } from 'react';
import { Navigation, Phone, Star, UserPlus, LocateFixed, Loader2, MapPin, Building2, Stethoscope, ArrowUpRight, Map } from 'lucide-react';
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

  // --- Initial State (CTA) ---
  if (!result && !loading) {
     return (
        <div className="col-span-1 md:col-span-3 mt-8 animate-stagger-enter">
            <div className="glass-panel p-8 rounded-3xl border border-teal-100 dark:border-neon-blue/30 bg-gradient-to-r from-teal-50/50 to-cyan-50/50 dark:from-navy-800 dark:to-navy-900 relative overflow-hidden group">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-teal-200/20 dark:bg-neon-blue/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-teal-300/30 transition-colors duration-500" />
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3">
                             <div className="p-3 bg-teal-100 dark:bg-navy-700 text-teal-600 dark:text-neon-blue rounded-xl shadow-sm">
                                 <Stethoscope size={28} />
                             </div>
                             <div>
                                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Recommended Next Step</h3>
                                <p className="text-sm font-medium text-teal-600 dark:text-neon-blue uppercase tracking-wide">Consultation Needed</p>
                             </div>
                        </div>
                        
                        <div className="pl-2 border-l-4 border-teal-200 dark:border-neon-blue/50">
                            <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed">
                                Based on your results, we recommend seeing a <span className="font-bold text-teal-700 dark:text-neon-blue">{specialist}</span>.
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{reason}</p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleFindDoctors}
                        className="flex-shrink-0 px-8 py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold shadow-xl shadow-teal-500/30 flex items-center gap-3 transition-all transform hover:scale-105 active:scale-95 group"
                    >
                        <LocateFixed size={24} className="group-hover:animate-pulse" />
                        <span className="text-lg">Find {specialist} Near Me</span>
                    </button>
                </div>
            </div>
        </div>
     );
  }

  // --- Results View ---
  return (
    <div className="col-span-1 md:col-span-3 mt-8 animate-stagger-enter">
       <div className="glass-panel rounded-3xl overflow-hidden border border-slate-200 dark:border-navy-600 shadow-2xl flex flex-col md:flex-row h-[700px]">
          
          {/* List Section */}
          <div className="w-full md:w-1/2 flex flex-col bg-white/60 dark:bg-navy-800/80 backdrop-blur-md">
             {/* Header */}
             <div className="p-6 border-b border-slate-100 dark:border-navy-700 bg-white/50 dark:bg-navy-900/50">
                <div className="flex items-center justify-between">
                     <div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-xl flex items-center gap-2">
                            <UserPlus className="text-teal-500" size={24} /> Nearby {specialist}s
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                            <MapPin size={12} /> Based on your current location
                        </p>
                     </div>
                     {loading && <Loader2 className="animate-spin text-teal-500" size={24} />}
                </div>
             </div>

             {/* Content */}
             <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
                 {error ? (
                     <div className="p-6 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-2xl text-center">
                         <p className="font-bold mb-2">Unable to load doctors</p>
                         <p className="text-sm">{error}</p>
                     </div>
                 ) : (
                     <>
                         {/* Render structured cards if we have grounding chunks with map data */}
                         {result?.groundingChunks && result.groundingChunks.length > 0 ? (
                             result.groundingChunks.map((chunk, idx) => {
                                 const mapData = chunk.maps || {};
                                 const webData = chunk.web || {};
                                 const title = mapData.title || webData.title || `Specialist ${idx + 1}`;
                                 const uri = mapData.googleMapsUri || webData.uri || "#";
                                 const rating = mapData.rating || "N/A";
                                 const reviewCount = mapData.userRatingCount || 0;
                                 const address = mapData.formattedAddress || "Address not available";

                                 return (
                                     <div key={idx} className="group bg-white dark:bg-navy-700 rounded-2xl p-5 border border-slate-100 dark:border-navy-600 shadow-sm hover:shadow-md transition-all hover:translate-x-1">
                                         <div className="flex justify-between items-start mb-3">
                                             <div className="flex gap-3">
                                                 <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-navy-600 flex items-center justify-center text-indigo-500 dark:text-indigo-400 flex-shrink-0">
                                                     <Building2 size={24} />
                                                 </div>
                                                 <div>
                                                     <h4 className="font-bold text-slate-800 dark:text-white text-lg leading-tight group-hover:text-indigo-600 dark:group-hover:text-neon-blue transition-colors">
                                                         {title}
                                                     </h4>
                                                     <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{specialist}</p>
                                                 </div>
                                             </div>
                                             {rating !== "N/A" && (
                                                 <div className="flex flex-col items-end">
                                                     <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-lg border border-amber-100 dark:border-amber-900/50">
                                                         <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">{rating}</span>
                                                         <Star size={12} className="fill-amber-400 text-amber-400" />
                                                     </div>
                                                     <span className="text-[10px] text-slate-400 mt-1">({reviewCount} reviews)</span>
                                                 </div>
                                             )}
                                         </div>

                                         <div className="mb-4">
                                             <p className="text-sm text-slate-600 dark:text-slate-300 flex items-start gap-2">
                                                 <MapPin size={14} className="mt-0.5 text-slate-400 flex-shrink-0" />
                                                 {address}
                                             </p>
                                         </div>

                                         <div className="flex gap-3 mt-auto">
                                             <a 
                                                href={uri} 
                                                target="_blank" 
                                                rel="noreferrer" 
                                                className="flex-1 py-2.5 bg-slate-100 dark:bg-navy-600 hover:bg-slate-200 dark:hover:bg-navy-500 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                                             >
                                                 <Navigation size={16} /> Navigate
                                             </a>
                                             <button className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-500/20">
                                                 <Phone size={16} /> Call Now
                                             </button>
                                         </div>
                                     </div>
                                 );
                             })
                         ) : (
                             // Fallback to text if chunks are sparse, styled nicely
                             <div className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 bg-white dark:bg-navy-700 p-6 rounded-2xl border border-slate-100 dark:border-navy-600">
                                <ReactMarkdown>{result?.text || ''}</ReactMarkdown>
                             </div>
                         )}
                     </>
                 )}
             </div>
          </div>

          {/* Map Section */}
          <div className="w-full md:w-1/2 bg-slate-100 dark:bg-navy-900 relative border-l border-slate-200 dark:border-navy-600">
             {userLocation ? (
                 <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ border: 0, filter: 'grayscale(0.2) contrast(1.1)' }}
                    src={`https://maps.google.com/maps?q=${specialist}&hl=${language}&z=13&output=embed`}
                    allowFullScreen
                    className="opacity-90 hover:opacity-100 transition-opacity"
                    title="Doctors Map"
                 ></iframe>
             ) : (
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-50 dark:bg-navy-900">
                     <div className="p-4 bg-slate-200 dark:bg-navy-800 rounded-full mb-4">
                        <Map size={48} className="opacity-50" />
                     </div>
                     <p className="text-sm font-medium">Interactive Map View</p>
                     <p className="text-xs opacity-60 mt-1">Location permission required</p>
                 </div>
             )}
             
             {/* Gradient Overlay for "Split View" aesthetic */}
             <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-white/80 to-transparent dark:from-navy-800/80 pointer-events-none md:block hidden" />
          </div>

       </div>
    </div>
  );
};