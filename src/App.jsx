import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, MapPin, GripVertical, Plus, Trash2, X, Moon, Sun, 
  Cloud as CloudIcon, Settings, Wallet, Lock, Unlock, ChevronRight, Map, Camera, 
  ChevronDown, AlertTriangle, Check, Loader2, Plane, ShoppingBag, Coffee, Star, 
  DollarSign, User, LogOut, Share2, Download, CloudRain, Utensils, Bed, Bus, 
  Tag, Music, Gift, Copy, Globe, Menu as MenuIcon, LayoutList, Wand2, ImagePlus, 
  Pencil, WifiOff 
} from 'lucide-react';

// --- FIREBASE SDK ---
import { initializeApp } from "firebase/app";
import { 
    getAuth, signInWithCustomToken, onAuthStateChanged, createUserWithEmailAndPassword,
    signInWithEmailAndPassword, signOut 
} from "firebase/auth";
import { 
    getFirestore, doc, setDoc, getDoc, onSnapshot, enableIndexedDbPersistence 
} from "firebase/firestore";

// --- CONFIGURATION & INIT ---
const firebaseConfig = {
    apiKey: "AIzaSyALo5BhgnOaokkQavBpGxhad6CFJiSmrMU",
    authDomain: "travel-planner-f515b.firebaseapp.com",
    projectId: "travel-planner-f515b",
    storageBucket: "travel-planner-f515b.firebasestorage.app",
    messagingSenderId: "10111266202",
    appId: "1:10111266202:web:8e7e027e0c0680200c1e23",
    measurementId: "G-ZRD0VRVVQ6"
};

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Attempt offline persistence (silently fail if not supported/multiple tabs)
try { enableIndexedDbPersistence(db).catch(() => {}); } catch (e) {}

// --- CONSTANTS & DATA ---
const EXCHANGE_RATES = { USD: 1.0, PHP: 58.75, HKD: 7.83, EUR: 0.92, JPY: 155.0, GBP: 0.80, MOP: 8.01, SGD: 1.35, THB: 36.5, KRW: 1380, CNY: 7.23, AUD: 1.52, CAD: 1.37 };
const BASE_CURRENCY = 'HKD'; 

const CURRENCY_OPTIONS = [
    { code: 'PHP', name: 'Philippine Peso', symbol: '₱', countryCode: 'ph' },
    { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', countryCode: 'hk' },
    { code: 'USD', name: 'US Dollar', symbol: '$', countryCode: 'us' },
    { code: 'EUR', name: 'Euro', symbol: '€', countryCode: 'eu' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥', countryCode: 'jp' },
    { code: 'GBP', name: 'British Pound', symbol: '£', countryCode: 'gb' },
    { code: 'MOP', name: 'Macau Pataca', symbol: 'MOP$', countryCode: 'mo' },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', countryCode: 'sg' },
    { code: 'THB', name: 'Thai Baht', symbol: '฿', countryCode: 'th' },
    { code: 'KRW', name: 'South Korean Won', symbol: '₩', countryCode: 'kr' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', countryCode: 'cn' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', countryCode: 'au' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', countryCode: 'ca' },
];

const COUNTRY_DATA = [
    { name: 'Hong Kong', lat: 22.3193, lon: 114.1694, countryCode: 'hk' },
    { name: 'Macau', lat: 22.1987, lon: 113.5439, countryCode: 'mo' },
    { name: 'Japan (Tokyo)', lat: 35.6762, lon: 139.6503, countryCode: 'jp' },
    { name: 'Japan (Osaka)', lat: 34.6937, lon: 135.5023, countryCode: 'jp' },
    { name: 'Philippines (Manila)', lat: 14.5995, lon: 120.9842, countryCode: 'ph' },
    { name: 'Singapore', lat: 1.3521, lon: 103.8198, countryCode: 'sg' },
    { name: 'Thailand (Bangkok)', lat: 13.7563, lon: 100.5018, countryCode: 'th' },
    { name: 'South Korea (Seoul)', lat: 37.5665, lon: 126.9780, countryCode: 'kr' },
    { name: 'China (Beijing)', lat: 39.9042, lon: 116.4074, countryCode: 'cn' },
    { name: 'USA (New York)', lat: 40.7128, lon: -74.0060, countryCode: 'us' },
    { name: 'USA (Los Angeles)', lat: 34.0522, lon: -118.2437, countryCode: 'us' },
    { name: 'UK (London)', lat: 51.5074, lon: -0.1278, countryCode: 'gb' },
    { name: 'France (Paris)', lat: 48.8566, lon: 2.3522, countryCode: 'fr' },
    { name: 'Germany (Berlin)', lat: 52.5200, lon: 13.4050, countryCode: 'de' },
    { name: 'Italy (Rome)', lat: 41.9028, lon: 12.4964, countryCode: 'it' },
    { name: 'Spain (Madrid)', lat: 40.4168, lon: -3.7038, countryCode: 'es' },
    { name: 'Australia (Sydney)', lat: -33.8688, lon: 151.2093, countryCode: 'au' },
    { name: 'Canada (Toronto)', lat: 43.6510, lon: -79.3470, countryCode: 'ca' },
];

const CATEGORY_ICONS = [
    { id: 'food', icon: Utensils, label: 'Food' },
    { id: 'transport', icon: Bus, label: 'Transport' },
    { id: 'flight', icon: Plane, label: 'Flight' },
    { id: 'attraction', icon: Star, label: 'Activity' },
    { id: 'shopping', icon: ShoppingBag, label: 'Shopping' },
    { id: 'accommodation', icon: Bed, label: 'Hotel' },
    { id: 'entertainment', icon: Music, label: 'Fun' },
    { id: 'gift', icon: Gift, label: 'Gift' },
    { id: 'other', icon: Tag, label: 'Other' },
];

// --- HELPER FUNCTIONS ---
const getFlagUrl = (code) => `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
const formatCurrency = (amount, currencyCode) => {
    const currency = CURRENCY_OPTIONS.find(c => c.code === currencyCode) || { symbol: currencyCode };
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode, minimumFractionDigits: 2 }).format(amount);
};
const compressImage = (file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const scale = 150 / img.width;
            canvas.width = 150; canvas.height = img.height * scale;
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
    };
});
const getTypeColor = (type) => {
    const colors = {
        food: 'border-orange-200 text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-300',
        travel: 'border-blue-200 text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300',
        shopping: 'border-pink-200 text-pink-600 bg-pink-50 dark:bg-pink-900/20 dark:text-pink-300',
        attraction: 'border-purple-200 text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-300'
    };
    return colors[type] || 'border-slate-200 text-slate-600 bg-slate-50 dark:bg-slate-800 dark:text-slate-300';
};
const getTypeIcon = (type) => {
    const icons = { food: Coffee, travel: Plane, shopping: ShoppingBag, attraction: Star };
    const Icon = icons[type] || MapPin;
    return <Icon size={12} className="mr-1" />;
};

// Safe date creator that ignores browser timezone and forces UTC
const createUTCDate = (dateStr) => {
    if(!dateStr) return new Date();
    const parts = dateStr.split('-');
    // Date.UTC(year, monthIndex, day)
    return new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
};

// --- DB REFS ---
const getUserTripRef = (uid) => doc(db, 'artifacts', appId, 'users', uid, 'trip', 'data');
const getUserBudgetRef = (uid) => doc(db, 'artifacts', appId, 'users', uid, 'budget', 'data');
const getSharedTripRef = (code) => doc(db, 'artifacts', appId, 'public', 'data', 'shared_trips', code);

// --- REUSABLE UI COMPONENTS ---

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700 max-h-[90vh] flex flex-col animate-in zoom-in-95">
                <div className="px-6 py-4 border-b dark:border-slate-800 flex justify-between items-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
                    <h3 className="font-bold text-lg dark:text-white">{title}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar">{children}</div>
            </div>
        </div>
    );
};

const CustomIconSelect = ({ options, value, onChange, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        const handler = (e) => !ref.current?.contains(e.target) && setIsOpen(false);
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);
    const selected = options.find(o => o.value === value);
    return (
        <div className="relative w-full" ref={ref}>
            <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full h-12 bg-slate-100 dark:bg-slate-700 rounded-xl px-4 flex items-center justify-between outline-none dark:text-white">
                {selected ? <div className="flex items-center gap-2"><img src={selected.icon} className="w-5 h-3.5 rounded-sm"/> <span className="font-bold">{selected.label}</span></div> : <span className="text-slate-400">{placeholder}</span>}
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && <div className="absolute top-full mt-2 w-full bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto custom-scrollbar">
                {options.map(o => (
                    <button key={o.value} onClick={() => { onChange(o.value); setIsOpen(false); }} className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 ${value === o.value ? 'bg-indigo-50 text-indigo-600' : 'dark:text-slate-300'}`}>
                        <img src={o.icon} className="w-6 h-4 rounded-sm" /> <span className="font-bold">{o.label}</span>
                    </button>
                ))}
            </div>}
        </div>
    );
};

const IconPicker = ({ selected, onSelect }) => (
    <div className="grid grid-cols-5 gap-2">
        {CATEGORY_ICONS.map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => onSelect(id)} className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${selected === id ? 'bg-indigo-600 text-white scale-105 shadow-lg' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-slate-200'}`}>
                <Icon size={20} /> <span className="text-[10px] mt-1 font-medium truncate">{label}</span>
            </button>
        ))}
    </div>
);

const Toast = ({ message }) => (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl z-[80] animate-in fade-in slide-in-from-top-4 flex items-center gap-3 border border-slate-700">
        <div className="bg-emerald-500 rounded-full p-1 text-black"><Check size={12} strokeWidth={4} /></div><span className="font-bold text-sm">{message}</span>
    </div>
);

const Logo = ({ size = "md", onClick }) => (
    <button onClick={onClick} className={`flex items-center gap-3 ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}>
        <div className={`${size === "lg" ? "w-16 h-16" : "w-8 h-8"} bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg transform rotate-3`}>
            <Plane className="text-white -rotate-3" size={size === "lg" ? 32 : 18} />
        </div>
        <span className={`font-black tracking-tight text-slate-900 dark:text-white ${size === "lg" ? "text-3xl" : "text-xl"}`}>Horizon<span className="text-indigo-500">Planner</span></span>
    </button>
);

const WeatherDisplay = ({ date, weatherData, isError, isHistorical }) => {
    const w = weatherData[date];
    let Icon = Sun, text = "Loading...", cls = "text-slate-400";
    if (w) {
        if (w.code > 3) Icon = CloudIcon; if (w.code > 50) Icon = CloudRain;
        text = `${Math.round(w.min)}°/${Math.round(w.max)}°`;
    } else if (isError) { Icon = WifiOff; text = "Offline"; cls = "text-red-400"; }
    else if (Object.keys(weatherData).length === 0) { Icon = Loader2; text = "Fetching"; }
    else { Icon = CalendarIcon; text = "--"; }
    return (
        <div className={`flex items-center text-xs font-medium ${cls} mt-1 min-h-[16px]`}>
            {isHistorical && w && <span className="mr-1 text-[8px] uppercase font-bold opacity-70 text-indigo-500">Est.</span>}
            <Icon size={12} className={`mr-1 ${text === 'Fetching' ? 'animate-spin' : ''}`} /> {text}
        </div>
    );
};

// --- AUTH COMPONENT ---
const LoginPage = ({ onLogin }) => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    const handleAuth = async (e) => {
        e.preventDefault(); setLoading(true); setError(null);
        try {
            if (isSignUp) {
                await createUserWithEmailAndPassword(auth, email, password);
                await signOut(auth); setToast("Sign up successful! Please sign in."); setIsSignUp(false);
            } else {
                const cred = await signInWithEmailAndPassword(auth, email, password);
                onLogin(cred.user);
            }
        } catch (err) { setError(err.message.replace('Firebase: ', '')); }
        finally { setLoading(false); }
    };

    useEffect(() => { if(toast) setTimeout(() => setToast(null), 4000); }, [toast]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
            {toast && <Toast message={toast} />}
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 border dark:border-slate-800 animate-in fade-in zoom-in">
                <div className="flex justify-center mb-8"><Logo size="lg" /></div>
                <h2 className="text-2xl font-bold text-center mb-2 dark:text-white">{isSignUp ? "Create account" : "Welcome back"}</h2>
                <form onSubmit={handleAuth} className="space-y-4 mt-8">
                    {error && <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl flex items-center gap-2"><AlertTriangle size={14}/> {error}</div>}
                    <div className="space-y-1"><label className="text-xs font-bold text-slate-400 uppercase">Email</label><input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3 outline-none dark:text-white" placeholder="you@example.com" /></div>
                    <div className="space-y-1"><label className="text-xs font-bold text-slate-400 uppercase">Password</label><input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3 outline-none dark:text-white" placeholder="••••••••" /></div>
                    <button disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex justify-center gap-2">{loading && <Loader2 className="animate-spin" size={20} />} {isSignUp ? "Sign Up" : "Sign In"}</button>
                </form>
                <div className="mt-6 text-center"><button onClick={() => setIsSignUp(!isSignUp)} className="text-sm font-semibold text-slate-500 hover:text-indigo-600">{isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}</button></div>
            </div>
        </div>
    );
};

// --- HOOKS ---
const useWeather = (lat, lon, startStr, days = 7) => {
    const [data, setData] = useState({});
    const [state, setState] = useState({ error: false, historical: false });
    
    useEffect(() => {
        if (!lat || !lon || !startStr) return;
        
        const fetchData = async () => {
            setState({ error: false, historical: false });
            try {
                // FORCE UTC: Strictly parse the input string as UTC
                const targetStart = createUTCDate(startStr);
                const now = new Date(); // Local time, but we compare mostly years/months
                
                // Calculate days difference
                const diff = Math.ceil((targetStart - now) / (1000 * 60 * 60 * 24));
                const isFuture = diff > 10; 
                const isPast = diff < -2;
                
                const useHistorical = isFuture || isPast;
                
                // Determine the dates to QUERY from the API
                let queryStart = new Date(targetStart);
                
                if (isFuture) {
                    // Go back years until we are in the past (safe margin)
                    while (queryStart > now) {
                        queryStart.setUTCFullYear(queryStart.getUTCFullYear() - 1);
                    }
                    // If the shifted date is still too close to "today" (incomplete archive), go back one more
                    if ((now - queryStart) / (1000 * 60 * 60 * 24) < 5) {
                         queryStart.setUTCFullYear(queryStart.getUTCFullYear() - 1);
                    }
                }
                
                // For the query end date:
                const queryEnd = new Date(queryStart);
                queryEnd.setUTCDate(queryStart.getUTCDate() + days + 1); // +1 buffer using UTC date
                
                const sDateStr = queryStart.toISOString().split('T')[0];
                const eDateStr = queryEnd.toISOString().split('T')[0];
                
                const type = useHistorical ? 'archive' : 'forecast';
                const url = `https://api.open-meteo.com/v1/${type}?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto&start_date=${sDateStr}&end_date=${eDateStr}`;

                const res = await fetch(url);
                if (!res.ok) throw new Error();
                const json = await res.json();
                
                const map = {};
                if (json.daily && json.daily.time) {
                    json.daily.time.forEach((t, i) => {
                        // Map the i-th result back to the i-th day of the ACTUAL trip
                        // CRITICAL: Use SAME UTC helper logic to match the UI keys
                        const targetDateForIndex = new Date(targetStart);
                        targetDateForIndex.setUTCDate(targetDateForIndex.getUTCDate() + i);
                        const key = targetDateForIndex.toISOString().split('T')[0];
                        
                        map[key] = { 
                            max: json.daily.temperature_2m_max[i], 
                            min: json.daily.temperature_2m_min[i], 
                            code: json.daily.weathercode[i] 
                        };
                    });
                }
                setData(map);
                setState({ error: false, historical: useHistorical });
                
            } catch (e) { 
                console.error(e);
                setState(prev => ({ ...prev, error: true })); 
            }
        };
        fetchData();
    }, [lat, lon, startStr, days]);
    
    return { weatherData: data, isError: state.error, isHistorical: state.historical };
};

// --- SUB-VIEWS ---

// 1. TIMELINE VIEW (Extracted for readability)
const TimelineView = ({ 
    trip, activeDayIdx, setActiveDayIdx, isEditMode, weatherData, 
    handleDeleteDay, handleAddDay, updateTrip, setEmbeddedMaps, embeddedMaps,
    handleOptimizeRoute, setImageEditState, handleDeleteActivity, handleUpdateActivity,
    updateActivityCost, dayRefs, isMapOpen, setIsMapOpen
}) => {
    const activeDay = trip.days[activeDayIdx] || trip.days[0];
    
    return (
        <main className="max-w-6xl mx-auto px-4 -mt-8 relative z-30 pb-safe">
            {/* DAY SELECTOR */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-2 rounded-2xl shadow-xl overflow-x-auto flex gap-2 no-scrollbar mb-8 sticky top-20 z-40 mt-8">
                {trip.days.map((day, idx) => (
                    <div key={day.id} ref={el => dayRefs.current[idx] = el} className="relative group/day">
                        <button onClick={() => setActiveDayIdx(idx)} className={`relative flex-shrink-0 px-5 py-2.5 rounded-xl transition-all duration-300 flex flex-col items-center min-w-[120px] ${activeDayIdx === idx ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-lg scale-105' : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Day {idx + 1}</span>
                            <span className="text-sm font-semibold truncate max-w-[120px]">{day.date.split('-').slice(1).join('/')}</span>
                            <WeatherDisplay date={day.date} weatherData={weatherData} />
                        </button>
                        {isEditMode && <button onClick={(e) => { e.stopPropagation(); handleDeleteDay(idx); }} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover/day:opacity-100 transition-opacity z-50"><X size={10} strokeWidth={3} /></button>}
                    </div>
                ))}
                {isEditMode && <button onClick={handleAddDay} className="px-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center text-slate-400 hover:text-indigo-500 hover:border-indigo-500"><Plus size={20} /></button>}
            </div>

            <div className="flex flex-col lg:grid lg:grid-cols-[280px_1fr] gap-8 md:gap-12 animate-in fade-in">
                {/* SIDEBAR: SUMMARY & MAP */}
                <div className="space-y-6 lg:sticky lg:top-32 h-min">
                    <div className="space-y-2">
                        {isEditMode ? (
                            <>
                                <input value={activeDay.title} onChange={(e) => { const newDays = [...trip.days]; newDays[activeDayIdx].title = e.target.value; updateTrip({ days: newDays }); }} className="text-3xl font-extrabold bg-transparent border-b border-slate-300 w-full focus:outline-none dark:text-white"/>
                                <textarea value={activeDay.summary || ''} onChange={(e) => { const newDays = [...trip.days]; newDays[activeDayIdx].summary = e.target.value; updateTrip({ days: newDays }); }} className="w-full text-lg bg-transparent border border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-2 resize-none h-24 text-zinc-600 dark:text-slate-400" placeholder="Add a summary..." />
                            </>
                        ) : (
                            <>
                                <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-white leading-tight">{activeDay.title}</h2>
                                <p className="text-zinc-600 dark:text-slate-400 text-lg leading-relaxed">{activeDay.summary || "No summary."}</p>
                            </>
                        )}
                    </div>
                    
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/50 overflow-hidden">
                        <button onClick={() => setIsMapOpen(!isMapOpen)} className="w-full p-4 flex items-center justify-between font-bold text-indigo-900 dark:text-indigo-100">
                            <span className="flex items-center gap-2"><Map size={18} /> Day Map</span> <ChevronDown size={18} className={`transition-transform ${isMapOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isMapOpen && <div className="p-4 pt-0 animate-in fade-in"><div className="aspect-video bg-slate-200 rounded-lg overflow-hidden shadow-inner"><iframe width="100%" height="100%" frameBorder="0" style={{ border: 0 }} src={`https://maps.google.com/maps?q=${encodeURIComponent(activeDay.title + " Hong Kong")}&t=&z=11&ie=UTF8&iwloc=&output=embed`} allowFullScreen></iframe></div></div>}
                    </div>
                    {isEditMode && <button onClick={handleOptimizeRoute} className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 hover:scale-105 transition-transform"><Wand2 size={18} /> Optimize Order (By Time)</button>}
                </div>

                {/* TIMELINE ITEMS */}
                <div className="relative border-l-2 border-slate-300 dark:border-slate-700 ml-6 md:ml-40 space-y-8 pl-8 md:pl-10 pb-4">
                    {activeDay.activities.map((act) => (
                        <div key={act.id} className="relative group">
                            <div className="absolute top-6 -left-[2.5rem] md:-left-[2.1rem] w-4 h-4 rounded-full bg-indigo-500 ring-4 ring-zinc-100 dark:ring-slate-950 z-10 shadow-sm"></div>
                            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all w-full">
                                <div className="flex flex-col sm:flex-row h-full">
                                    <div className="relative w-full h-48 sm:w-48 sm:h-auto flex-shrink-0 bg-slate-200 group/img">
                                        <img src={act.image} alt={act.title} className="w-full h-full object-cover" />
                                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent flex items-end justify-between">
                                            {isEditMode ? <input type="text" value={act.time} onChange={(e) => handleUpdateActivity(activeDayIdx, act.id, 'time', e.target.value)} className="font-black text-white text-xl bg-transparent border-b border-white/50 w-24 outline-none" placeholder="09:00"/> : <span className="font-black text-white text-xl drop-shadow-md">{act.time}</span>}
                                        </div>
                                        {isEditMode && <button onClick={() => setImageEditState({ dayIdx: activeDayIdx, actId: act.id, url: act.image })} className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full backdrop-blur-md hover:bg-black/70"><Camera size={16} /></button>}
                                    </div>
                                    <div className="p-4 flex flex-col flex-grow relative min-w-0">
                                        <div className="absolute top-4 right-4 z-10 flex gap-2">
                                            {!isEditMode && <button onClick={() => setEmbeddedMaps(p => ({...p, [act.id]: !p[act.id]}))} className={`p-2 rounded-full ${embeddedMaps[act.id] ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}><MapPin size={18} /></button>}
                                            {isEditMode && <div className="flex gap-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-lg p-1 border dark:border-slate-800"><GripVertical className="text-slate-300 cursor-grab" size={20} /><button onClick={() => handleDeleteActivity(activeDayIdx, act.id)} className="text-red-400 hover:text-red-600"><Trash2 size={18} /></button></div>}
                                        </div>
                                        <div className="flex-grow space-y-2 pr-6 md:pr-10">
                                            {isEditMode ? (
                                                <>
                                                    <select value={act.type} onChange={(e) => handleUpdateActivity(activeDayIdx, act.id, 'type', e.target.value)} className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${getTypeColor(act.type)}`}>{CATEGORY_ICONS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
                                                    <input value={act.title} onChange={(e) => handleUpdateActivity(activeDayIdx, act.id, 'title', e.target.value)} className="w-full font-bold text-lg bg-transparent border-b border-slate-200 mb-1 dark:text-white" placeholder="Title"/>
                                                    <textarea value={act.desc} onChange={(e) => handleUpdateActivity(activeDayIdx, act.id, 'desc', e.target.value)} className="w-full text-xs bg-transparent border border-dashed border-slate-300 rounded p-2 h-16 dark:text-slate-400" placeholder="Description"/>
                                                </>
                                            ) : (
                                                <>
                                                    <div className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${getTypeColor(act.type)}`}>{getTypeIcon(act.type)} {act.type}</div>
                                                    <h3 className="font-bold text-lg dark:text-white mb-1 truncate">{act.title}</h3>
                                                    <p className="text-xs text-zinc-500 dark:text-slate-400 line-clamp-2">{act.desc}</p>
                                                </>
                                            )}
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                            <details className="group/details w-full">
                                                <summary className="list-none flex items-center justify-between cursor-pointer text-[10px] font-bold text-slate-400 hover:text-indigo-600 uppercase">
                                                    <span className="flex items-center gap-1">Details & Notes <ChevronRight size={12} className="group-open/details:rotate-90 transition-transform" /></span>
                                                    <div className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                                                        {isEditMode ? <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded p-0.5"><select value={act.currency || trip.currency || 'USD'} onChange={(e) => handleUpdateActivity(activeDayIdx, act.id, 'currency', e.target.value)} className="bg-transparent text-[10px] font-bold w-12">{CURRENCY_OPTIONS.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}</select><input type="number" className="w-12 bg-transparent text-right font-mono" value={act.cost || ''} onChange={(e) => updateActivityCost(activeDayIdx, act.id, e.target.value)}/></div> : <span>{CURRENCY_OPTIONS.find(c => c.code === (act.currency || trip.currency || 'USD'))?.symbol || '$'} {act.cost || 0}</span>}
                                                    </div>
                                                </summary>
                                                <div className="pt-2 text-sm text-zinc-600 dark:text-slate-300 leading-relaxed">
                                                    {isEditMode ? <textarea value={act.details} onChange={(e) => handleUpdateActivity(activeDayIdx, act.id, 'details', e.target.value)} className="w-full h-24 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-xs" placeholder="Notes..."/> : act.details}
                                                </div>
                                                {embeddedMaps[act.id] && <div className="h-48 mt-3 rounded-lg overflow-hidden bg-slate-100 relative z-20"><iframe width="100%" height="100%" frameBorder="0" style={{ border: 0 }} src={`https://maps.google.com/maps?q=${encodeURIComponent(act.title)}&t=&z=15&ie=UTF8&iwloc=&output=embed`} allowFullScreen></iframe></div>}
                                            </details>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {isEditMode && <button onClick={() => { const newDays = [...trip.days]; newDays[activeDayIdx].activities.push({ id: Math.random().toString(36), time: '12:00', title: 'New Activity', type: 'attraction', desc: 'Description', image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=600&q=80', currency: trip.currency || 'USD' }); updateTrip({ days: newDays }); }} className="w-full py-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl flex flex-col items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-600"><Plus size={24} /> <span className="font-bold">Add Activity</span></button>}
                </div>
            </div>
        </main>
    );
};

// 2. CALENDAR VIEW
const CalendarView = ({ trip, onSelectDay }) => {
    const start = new Date(trip.startDate);
    const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
    const firstDay = new Date(start.getFullYear(), start.getMonth(), 1).getDay();
    const tripDays = trip.days.reduce((acc, d, i) => ({ ...acc, [d.date]: { ...d, idx: i } }), {});

    const renderCell = (date, i) => {
        if (!date) return <div key={`e-${i}`} className="aspect-square bg-slate-50/50 dark:bg-slate-800/30 rounded-xl" />;
        const dStr = date.toISOString().split('T')[0];
        const tDay = tripDays[dStr];
        const isToday = new Date().toISOString().split('T')[0] === dStr;
        return (
            <div key={dStr} onClick={() => tDay && onSelectDay(tDay.idx)} className={`min-h-[140px] rounded-xl p-3 relative flex flex-col items-start border ${tDay ? 'bg-white dark:bg-slate-800 border-indigo-200 shadow-sm cursor-pointer hover:shadow-md' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 opacity-60 border-transparent'} ${isToday ? 'ring-2 ring-emerald-500' : ''}`}>
                <span className={`font-bold mb-2 ${tDay ? 'text-indigo-600 bg-indigo-50 w-8 h-8 flex items-center justify-center rounded-full' : ''}`}>{date.getDate()}</span>
                {tDay && <div className="w-full space-y-1 overflow-y-auto custom-scrollbar max-h-[100px]">
                    {tDay.activities?.map((a, idx) => <div key={idx} className="text-[10px] font-medium bg-slate-100 dark:bg-slate-700/50 p-1 rounded truncate border-l-2 border-indigo-400"><span className="opacity-70 mr-1">{a.time}</span>{a.title}</div>)}
                </div>}
            </div>
        );
    };

    return (
        <div className="max-w-6xl mx-auto mt-6 px-4 pb-20 animate-in fade-in">
             <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between mb-6"><h2 className="text-2xl font-black dark:text-white">{start.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h2><span className="text-xs font-bold px-2 py-1 rounded bg-indigo-100 text-indigo-700">Full Itinerary</span></div>
                <div className="hidden md:block">
                    <div className="grid grid-cols-7 gap-4 mb-2">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="text-center text-xs font-bold text-slate-400 uppercase">{d}</div>)}</div>
                    <div className="grid grid-cols-7 gap-4">{[...Array(firstDay).fill(null), ...Array(daysInMonth).fill(0).map((_, i) => new Date(start.getFullYear(), start.getMonth(), i + 1))].map(renderCell)}</div>
                </div>
             </div>
        </div>
    );
};

// 3. BUDGET VIEW
const BudgetView = ({ user, isEditMode, trip }) => {
    const [expenses, setExpenses] = useState([]);
    const [targetCurr, setTargetCurr] = useState(trip?.currency || 'USD'); 
    const [modal, setModal] = useState(null);
    
    useEffect(() => {
        if(!user) return;
        return onSnapshot(getUserBudgetRef(user.uid), s => s.exists() && setExpenses(s.data().expenses || []));
    }, [user]);

    const handleSave = async (exp) => { 
        const updated = modal.id ? expenses.map(e => e.id === exp.id ? exp : e) : [...expenses, exp];
        setExpenses(updated); setModal(null); await setDoc(getUserBudgetRef(user.uid), { expenses: updated }, { merge: true }); 
    };

    const handleDelete = async (id) => { const u = expenses.filter(e => e.id !== id); setExpenses(u); await setDoc(getUserBudgetRef(user.uid), { expenses: u }, { merge: true }); };
    
    const convert = (amt, code) => (amt / (EXCHANGE_RATES[code] || 1)) * EXCHANGE_RATES[BASE_CURRENCY];
    const total = expenses.reduce((a, c) => a + (Number(c.amount)||0), 0) * (EXCHANGE_RATES[targetCurr] / EXCHANGE_RATES[BASE_CURRENCY]);
    
    const grouped = useMemo(() => expenses.reduce((a, c) => { const d = c.date||'Unscheduled'; if(!a[d]) a[d]=[]; a[d].push(c); return a; }, {}), [expenses]);
    
    return (
        <div className="max-w-2xl mx-auto mt-6 px-4 pb-20 animate-in fade-in">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-3xl text-white shadow-xl mb-6">
                <p className="text-slate-400 text-sm font-medium mb-1">Total Trip Cost</p>
                <h1 className="text-4xl font-black mb-6">{formatCurrency(total, targetCurr)}</h1>
                <div className="flex gap-2">
                     <button onClick={() => isEditMode && setModal({})} disabled={!isEditMode} className="bg-white text-black px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-100 disabled:opacity-50"><Plus size={16} /> Add Expense</button>
                     <select value={targetCurr} onChange={e => setTargetCurr(e.target.value)} className="bg-white/10 border border-white/20 px-3 py-2 rounded-xl text-sm font-bold text-black">{CURRENCY_OPTIONS.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}</select>
                </div>
            </div>
            {Object.keys(grouped).sort().map(date => (
                <div key={date} className="mb-6">
                    <h4 className="font-bold text-slate-500 text-sm uppercase mb-3 px-2">{date}</h4>
                    <div className="space-y-3">{grouped[date].map(e => (
                        <div key={e.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500`}>{React.createElement(CATEGORY_ICONS.find(c=>c.id===e.category)?.icon || Tag, {size:18})}</div>
                                <div><p className="font-bold dark:text-white">{e.name}</p><p className="text-xs text-slate-500 capitalize">{e.category}</p></div>
                            </div>
                            <div className="text-right flex items-center gap-3">
                                <p className="font-black dark:text-white">{e.inputCurrencyCode === targetCurr ? formatCurrency(e.amountInput, e.inputCurrencyCode) : formatCurrency(e.amount * (EXCHANGE_RATES[targetCurr] / EXCHANGE_RATES[BASE_CURRENCY]), targetCurr)}</p>
                                {isEditMode && <div className="flex gap-1"><button onClick={() => setModal(e)} className="p-2 text-slate-300 hover:text-indigo-500"><Pencil size={16}/></button><button onClick={() => handleDelete(e.id)} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={16}/></button></div>}
                            </div>
                        </div>
                    ))}</div>
                </div>
            ))}
            <Modal isOpen={!!modal} onClose={() => setModal(null)} title={modal?.id ? "Edit Expense" : "New Expense"}>
                <AddExpenseForm onAddExpense={handleSave} currencyOptions={CURRENCY_OPTIONS} convertToBase={convert} initialData={modal} />
            </Modal>
        </div>
    );
};

const AddExpenseForm = ({ onAddExpense, currencyOptions, convertToBase, initialData }) => {
    const [f, setF] = useState({ name: '', amount: '', curr: 'HKD', cat: 'food', date: new Date().toISOString().split('T')[0] });
    useEffect(() => { if (initialData?.id) setF({ name: initialData.name, amount: initialData.amountInput, curr: initialData.inputCurrencyCode, cat: initialData.category, date: initialData.date }); }, [initialData]);
    
    return (
        <form onSubmit={(e) => { e.preventDefault(); onAddExpense({ id: initialData?.id || Math.random().toString(36).substr(2, 9), name: f.name, amount: convertToBase(f.amount, f.curr), amountInput: Number(f.amount), inputCurrencyCode: f.curr, category: f.cat, date: f.date }); if(!initialData?.id) setF({...f, name:'', amount:''}); }} className="space-y-4">
            <div className="space-y-1"><label className="text-xs font-bold text-slate-400 uppercase">Description</label><input value={f.name} onChange={e => setF({...f, name: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 outline-none dark:text-white" required/></div>
            <div className="grid grid-cols-3 gap-3">
                 <div className="space-y-1"><label className="text-xs font-bold text-slate-400 uppercase">Currency</label><CustomIconSelect options={currencyOptions.map(c => ({ value: c.code, label: c.code, icon: getFlagUrl(c.countryCode) }))} value={f.curr} onChange={v => setF({...f, curr:v})} /></div>
                 <div className="col-span-2 space-y-1"><label className="text-xs font-bold text-slate-400 uppercase">Amount</label><input type="number" step="0.01" value={f.amount} onChange={e => setF({...f, amount: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 outline-none font-mono font-bold" required/></div>
            </div>
            <div className="space-y-1"><label className="text-xs font-bold text-slate-400 uppercase">Date</label><input type="date" value={f.date} onChange={e => setF({...f, date: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 outline-none dark:text-white"/></div>
            <div className="space-y-2"><label className="text-xs font-bold text-slate-400 uppercase">Category</label><IconPicker selected={f.cat} onSelect={v => setF({...f, cat:v})} /></div>
            <button type="submit" className="w-full bg-black dark:bg-white text-white dark:text-black font-bold py-3 rounded-xl mt-2">{initialData?.id ? 'Update' : 'Save'}</button>
        </form>
    );
};

// 4. DASHBOARD VIEW
const DashboardView = ({ trips, onSelect, onNew, onSignOut, onImport, email, onDelete }) => (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
             <div className="flex justify-between items-center"><Logo size="lg" /><div className="flex gap-3"><div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 rounded-full shadow-sm"><User size={14} className="text-indigo-600"/><span className="text-xs font-bold text-slate-600 dark:text-slate-300">{email}</span></div><button onClick={onSignOut} className="p-2.5 bg-red-50 text-red-500 rounded-full"><LogOut size={20}/></button></div></div>
             <div className="grid md:grid-cols-2 gap-6">
                {trips.map(t => (
                    <button key={t.id} onClick={() => onSelect(t.id)} className="relative group text-left h-48 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
                         <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors z-10" />
                         <img src={t.coverImage} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                         <div className="absolute top-3 right-3 z-30"><div onClick={(e) => { e.stopPropagation(); onDelete(t); }} className="p-2 bg-black/40 hover:bg-red-600 text-white rounded-full transition-colors"><Trash2 size={16} /></div></div>
                         <div className="absolute bottom-0 left-0 p-6 z-20 text-white"><h3 className="text-2xl font-black mb-1">{t.title}</h3><p className="text-sm opacity-90 font-medium flex items-center gap-1"><CalendarIcon size={14}/> {t.startDate}</p></div>
                    </button>
                ))}
                <button onClick={onNew} className="flex flex-col items-center justify-center h-48 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-400 hover:border-indigo-500 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10"><Plus size={24} /><span className="font-bold mt-2">Plan New Trip</span></button>
                <button onClick={onImport} className="flex flex-col items-center justify-center h-48 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-400 hover:border-emerald-500 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/10"><Download size={24} /><span className="font-bold mt-2">Import Trip</span></button>
             </div>
        </div>
    </div>
);

// --- MAIN CONTAINER ---
export default function TravelApp() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [trips, setTrips] = useState([]);
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
    const [tripId, setTripId] = useState(() => localStorage.getItem('tripId'));
    const [view, setView] = useState('dashboard');
    const [dayIdx, setDayIdx] = useState(0);
    const [editMode, setEditMode] = useState(false);
    const [viewMode, setViewMode] = useState('timeline');
    const [modal, setModal] = useState(null);
    const [maps, setMaps] = useState({});
    const [mapOpen, setMapOpen] = useState(false);
    const [imgEdit, setImgEdit] = useState(null);
    const [shared, setShared] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [deleteTrip, setDeleteTrip] = useState(null);
    const [signOutConfirm, setSignOutConfirm] = useState(false);
    const [compName, setCompName] = useState('');
    const [compPhoto, setCompPhoto] = useState(null);
    const dayRefs = useRef([]);

    const trip = trips.find(t => t.id === tripId);

    // Initial Auth & Load
    useEffect(() => {
        if (initialAuthToken) signInWithCustomToken(auth, initialAuthToken).catch(console.error);
        return onAuthStateChanged(auth, u => { setUser(u); setLoading(false); });
    }, []);

    // Sync Persistence
    useEffect(() => { localStorage.setItem('theme', darkMode ? 'dark' : 'light'); }, [darkMode]);
    useEffect(() => { if (tripId) localStorage.setItem('tripId', tripId); }, [tripId]);
    useEffect(() => {
        if (!user) { setView('dashboard'); setTrips([]); localStorage.removeItem('tripId'); return; }
        return onSnapshot(getUserTripRef(user.uid), d => {
            if (d.exists()) {
                const data = d.data(); setTrips(data.allTrips || []);
                if (view === 'trip' && tripId && !data.allTrips.find(t => t.id === tripId)) { setView('dashboard'); setTripId(null); }
            } else setDoc(getUserTripRef(user.uid), { allTrips: [] });
        });
    }, [user, view, tripId]);
    
    // Auto-Save Debounce
    const saveTimeout = useRef(null);
    useEffect(() => {
        if (!user || loading) return;
        clearTimeout(saveTimeout.current);
        saveTimeout.current = setTimeout(() => setDoc(getUserTripRef(user.uid), { allTrips: trips }, { merge: true }), 1000);
    }, [trips, user, loading]);

    // Weather Fetch
    const { weatherData } = useWeather(trip?.lat, trip?.lon, trip?.startDate, trip?.days?.length);

    // --- ACTIONS ---
    const updateTrip = (upd) => setTrips(prev => prev.map(t => t.id === tripId ? { ...t, ...upd } : t));
    const handleNewTrip = () => setTrips(p => [...p, { id: Math.random().toString(36).substr(2, 9), title: 'New Trip', startDate: new Date().toISOString().split('T')[0], coverImage: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format', companions: [], lat: 22.31, lon: 114.16, currency: 'USD', days: [{ id: 'd1', date: new Date().toISOString().split('T')[0], title: 'Day 1', activities: [] }] }]);
    const handleAddDay = () => {
        const last = trip.days[trip.days.length - 1];
        // Use createUTCDate here too to ensure new day creation is UTC safe
        const lastDate = last?.date ? createUTCDate(last.date) : new Date();
        const next = new Date(lastDate); 
        next.setUTCDate(next.getUTCDate() + 1);
        
        updateTrip({ days: [...trip.days, { id: Math.random().toString(36).substr(2, 9), date: next.toISOString().split('T')[0], title: `Day ${trip.days.length + 1}`, activities: [] }] });
    };
    const handleDeleteDay = (idx) => { if(trip.days.length > 1 && confirm("Delete Day?")) updateTrip({ days: trip.days.filter((_, i) => i !== idx) }); };
    const handleAddComp = async (e) => { e.preventDefault(); if(!compName) return; const url = compPhoto ? await compressImage(compPhoto) : null; updateTrip({ companions: [...trip.companions, { name: compName, photo: url }] }); setCompName(''); setCompPhoto(null); };
    const handleShare = async () => { const c = Math.random().toString(36).substring(2, 8).toUpperCase(); await setDoc(getSharedTripRef(c), JSON.parse(JSON.stringify(trip))); setShared(c); };
    const handleImport = async (e) => {
        e.preventDefault(); const c = e.target.shareId.value.toUpperCase();
        const d = await getDoc(getSharedTripRef(c));
        if (d.exists()) { setTrips(p => [...p, { ...d.data(), id: Math.random().toString(36).substr(2, 9), title: d.data().title + " (Imported)" }]); setModal(null); alert("Imported!"); } 
        else alert("Invalid Code");
    };
    const updateAct = (dIdx, aId, f, v) => { const d = [...trip.days]; const a = d[dIdx].activities.find(x => x.id === aId); if(a) { a[f] = v; updateTrip({ days: d }); } };

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600"/></div>;
    if (!user) return <LoginPage onLogin={setUser} />;

    if (view === 'dashboard' || !trip) return (
        <>
            <DashboardView trips={trips} onSelect={id => { setTripId(id); setView('trip'); setDayIdx(0); }} onNew={handleNewTrip} onSignOut={() => setSignOutConfirm(true)} onImport={() => setModal('import')} email={user.email} onDelete={setDeleteTrip} />
            <Modal isOpen={modal === 'import'} onClose={() => setModal(null)} title="Import Trip">
                <div className="text-center p-4"><Download size={24} className="mx-auto mb-2 text-emerald-500"/><p className="text-sm mb-4">Enter 6-char code.</p><form onSubmit={handleImport} className="flex gap-2"><input name="shareId" placeholder="CODE" className="flex-grow bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-2" required /><button className="bg-black text-white px-4 rounded-xl font-bold">Import</button></form></div>
            </Modal>
            
            <Modal isOpen={!!deleteTrip} onClose={() => setDeleteTrip(null)} title="Delete Trip">
                <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl text-red-700 dark:text-red-300">
                        <div className="p-3 bg-red-100 dark:bg-red-900/40 rounded-full"><AlertTriangle size={24} /></div>
                        <div><h4 className="font-bold">Are you sure?</h4><p className="text-xs opacity-90">This action cannot be undone.</p></div>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">You are about to delete <strong>{deleteTrip?.title}</strong>. All data will be lost.</p>
                    <div className="flex gap-3 justify-end pt-2">
                        <button onClick={() => setDeleteTrip(null)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors dark:text-white">Cancel</button>
                        <button onClick={() => { setTrips(trips.filter(t => t.id !== deleteTrip.id)); setDeleteTrip(null); }} className="px-4 py-2 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30">Delete Forever</button>
                    </div>
                </div>
            </Modal>
            
            <Modal isOpen={signOutConfirm} onClose={() => setSignOutConfirm(false)} title="Sign Out">
                <div className="space-y-4">
                     <p className="text-slate-600 dark:text-slate-300">Are you sure you want to sign out of your account?</p>
                     <div className="flex gap-3 justify-end pt-2">
                        <button onClick={() => setSignOutConfirm(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors dark:text-white">Cancel</button>
                        <button onClick={() => { signOut(auth); setSignOutConfirm(false); }} className="px-4 py-2 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30">Sign Out</button>
                    </div>
                </div>
            </Modal>
        </>
    );

    return (
        <div className={`min-h-screen transition-colors duration-500 ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-zinc-100 text-zinc-900'} font-sans pb-20 overflow-x-hidden`}>
            {/* HERO HEADER */}
            <div className="relative h-[40vh] md:h-[50vh] w-full group">
                <div className="absolute inset-0 overflow-hidden rounded-b-3xl"><div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-zinc-100 dark:to-slate-950 z-10"/><img src={trip.coverImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"/></div>
                <div className="absolute top-0 w-full z-50 flex justify-between p-6 text-white">
                    <Logo size="sm" onClick={() => setView('dashboard')} />
                    <div className="flex gap-2 relative">
                        <button onClick={() => setEditMode(!editMode)} className={`p-2.5 rounded-full backdrop-blur-md border ${editMode ? 'bg-amber-400 border-amber-300' : 'bg-black/30 border-white/20'}`}>{editMode ? <Unlock size={18}/> : <Lock size={18}/>}</button>
                        <button onClick={() => setViewMode(v => v === 'timeline' ? 'calendar' : v === 'calendar' ? 'budget' : 'timeline')} className="p-2.5 rounded-full backdrop-blur-md border bg-black/30 border-white/20">{viewMode === 'timeline' ? <LayoutList size={18}/> : viewMode === 'calendar' ? <CalendarIcon size={18}/> : <DollarSign size={18}/>}</button>
                        <button onClick={() => setMenuOpen(!menuOpen)} className="p-2.5 rounded-full bg-black/30 border border-white/20 backdrop-blur-md">{menuOpen ? <X size={18}/> : <MenuIcon size={18}/>}</button>
                        {menuOpen && <div className="absolute top-14 right-0 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-2 flex flex-col gap-1 z-50 animate-in slide-in-from-top-2">
                             <button onClick={() => { setModal('share'); setMenuOpen(false); }} className="flex gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-sm font-medium text-slate-700 dark:text-white"><Share2 size={16}/> Share</button>
                             <button onClick={() => { setModal('settings'); setMenuOpen(false); }} className="flex gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-sm font-medium text-slate-700 dark:text-white"><Settings size={16}/> Settings</button>
                             <button onClick={() => { setSignOutConfirm(true); setMenuOpen(false); }} className="flex gap-3 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-sm font-medium text-red-600"><LogOut size={16}/> Sign Out</button>
                        </div>}
                    </div>
                </div>
                <div className="absolute bottom-0 w-full z-20 p-6 md:p-12 max-w-6xl mx-auto text-white">
                    {editMode && <div className="absolute right-0 bottom-2"><button onClick={() => setModal('settings')} className="bg-black/40 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full text-xs font-bold flex gap-2"><Camera size={14}/> Cover</button></div>}
                    <div className="flex items-center gap-3 mb-4"><span className="px-3 py-1 bg-indigo-500/90 text-xs font-bold uppercase rounded-lg shadow-lg">{trip.startDate}</span><div className="flex -space-x-2">{trip.companions.map((c, i) => <div key={i} className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-indigo-500 flex items-center justify-center text-[10px] font-bold text-indigo-800 overflow-hidden">{c.photo ? <img src={c.photo} className="w-full h-full object-cover"/> : c.name[0]}</div>)}</div></div>
                    {editMode ? <input value={trip.title} onChange={e => updateTrip({ title: e.target.value })} className="text-4xl md:text-6xl font-black bg-white/10 rounded-xl px-2 -ml-2 w-full backdrop-blur-sm mb-2"/> : <h1 className="text-4xl md:text-6xl font-black mb-2 drop-shadow-lg">{trip.title}</h1>}
                    <p className="text-white/90 font-medium drop-shadow-md">{trip.days.length} Days • {trip.days.reduce((a, d) => a + d.activities.length, 0)} Activities</p>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            {viewMode === 'budget' && <BudgetView user={user} isEditMode={editMode} trip={trip} db={db} />}
            {viewMode === 'calendar' && <CalendarView trip={trip} onSelectDay={i => { setDayIdx(i); setViewMode('timeline'); }} />}
            {viewMode === 'timeline' && <TimelineView 
                trip={trip} activeDayIdx={dayIdx} setActiveDayIdx={setDayIdx} isEditMode={editMode} weatherData={weatherData}
                handleDeleteDay={handleDeleteDay} handleAddDay={handleAddDay} updateTrip={updateTrip}
                setEmbeddedMaps={setMaps} embeddedMaps={maps} isMapOpen={mapOpen} setIsMapOpen={setMapOpen}
                handleOptimizeRoute={() => { 
                    const d = [...trip.days]; 
                    const parse = t => { const m = t?.match(/(\d+):(\d+)/); return m ? parseInt(m[1])*60 + parseInt(m[2]) : 9999; };
                    d[dayIdx].activities.sort((a,b) => parse(a.time) - parse(b.time)); updateTrip({ days: d });
                }}
                setImageEditState={setImgEdit} handleDeleteActivity={(dI, aId) => { const d = [...trip.days]; d[dI].activities = d[dI].activities.filter(a => a.id !== aId); updateTrip({ days: d }); }}
                handleUpdateActivity={updateAct} updateActivityCost={(dI, aId, v) => updateAct(dI, aId, 'cost', v)} dayRefs={dayRefs}
            />}

            {/* MODALS */}
            <Modal isOpen={modal === 'share'} onClose={() => { setModal(null); setShared(null); }} title="Share Trip">
                <div className="space-y-6 text-center">
                    {shared ? <><div className="bg-emerald-100 text-emerald-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><Check size={32}/></div><h4 className="font-bold text-xl dark:text-white">Published!</h4><code className="block text-3xl font-mono font-black py-4 dark:text-white">{shared}</code><button onClick={() => navigator.clipboard.writeText(shared)} className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-xl text-sm font-bold">Copy Code</button></> 
                    : <><div className="bg-indigo-100 text-indigo-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"><Share2 size={24}/></div><p className="text-sm text-slate-500 mb-4">Generate a code to share this trip.</p><button onClick={handleShare} className="bg-indigo-600 text-white px-6 py-2 rounded-full font-bold shadow-lg">Generate Link</button></>}
                </div>
            </Modal>
            
            <Modal isOpen={modal === 'settings'} onClose={() => setModal(null)} title="Settings">
                <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-slate-100 dark:bg-slate-800 rounded-xl"><span className="font-bold text-sm dark:text-white flex gap-2">{darkMode ? <Moon size={16}/> : <Sun size={16}/>} Theme</span><button onClick={() => setDarkMode(!darkMode)} className={`w-10 h-6 rounded-full p-1 transition-colors ${darkMode ? 'bg-indigo-600' : 'bg-slate-300'}`}><div className={`w-4 h-4 bg-white rounded-full transition-transform ${darkMode ? 'translate-x-4' : ''}`}/></button></div>
                    
                    <div className="space-y-1"><label className="text-xs font-bold text-slate-400 uppercase">Weather Location</label>
                        <CustomIconSelect 
                            options={COUNTRY_DATA.map(c => ({ value: c.name, label: c.name, icon: getFlagUrl(c.countryCode) }))} 
                            value={trip.weatherLocation || COUNTRY_DATA.find(c => Math.abs(c.lat - (trip.lat || 0)) < 0.1 && Math.abs(c.lon - (trip.lon || 0)) < 0.1)?.name} 
                            onChange={(val) => { const s = COUNTRY_DATA.find(c => c.name === val); if(s) updateTrip({ lat: s.lat, lon: s.lon, weatherLocation: s.name }); }} 
                            placeholder="Select location..." 
                        />
                    </div>

                    <div className="space-y-1"><label className="text-xs font-bold text-slate-400 uppercase">Currency</label>
                        <CustomIconSelect 
                            options={CURRENCY_OPTIONS.map(c => ({ value: c.code, label: `${c.code} - ${c.name}`, icon: getFlagUrl(c.countryCode) }))} 
                            value={trip.currency || 'USD'} 
                            onChange={(val) => updateTrip({ currency: val })} 
                            placeholder="Select currency..." 
                        />
                    </div>

                    <div className="space-y-1"><label className="text-xs font-bold text-slate-400 uppercase">Cover URL</label><input value={trip.coverImage} onChange={e => updateTrip({ coverImage: e.target.value })} className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-2 text-sm dark:text-white"/></div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase">Start Date</label>
                        <input 
                            type="date" 
                            value={trip.startDate} 
                            onChange={(e) => {
                                const newStart = e.target.value;
                                // CRITICAL: Force UTC calculation to match the Weather system exactly
                                const newDays = trip.days.map((day, idx) => {
                                    const d = createUTCDate(newStart);
                                    d.setUTCDate(d.getUTCDate() + idx);
                                    return { ...day, date: d.toISOString().split('T')[0] };
                                });
                                updateTrip({ startDate: newStart, days: newDays });
                            }} 
                            className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-2 text-sm dark:text-white"
                        />
                    </div>
                    <div className="space-y-2"><label className="text-xs font-bold text-slate-400 uppercase">Companions</label>
                        <div className="flex flex-wrap gap-2">{trip.companions.map((c, i) => <div key={i} className="flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs dark:text-white"><div className="w-5 h-5 rounded-full bg-slate-200 overflow-hidden">{c.photo ? <img src={c.photo} className="w-full h-full object-cover"/> : c.name[0]}</div>{c.name}<button onClick={() => updateTrip({ companions: trip.companions.filter((_, x) => x !== i) })}><X size={12}/></button></div>)}</div>
                        <form onSubmit={handleAddComp} className="flex gap-2"><input value={compName} onChange={e => setCompName(e.target.value)} placeholder="Name" className="flex-grow bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2 text-sm dark:text-white"/><input type="file" className="hidden" id="cPhoto" onChange={e => setCompPhoto(e.target.files[0])}/><label htmlFor="cPhoto" className="p-2 bg-slate-200 dark:bg-slate-700 rounded-xl cursor-pointer"><ImagePlus size={18}/></label><button disabled={!compName} className="bg-indigo-600 text-white px-3 rounded-xl text-sm font-bold">Add</button></form>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={!!imgEdit} onClose={() => setImgEdit(null)} title="Update Photo">
                <div className="space-y-3">
                    <img src={imgEdit?.url} className="w-full h-40 object-cover rounded-xl bg-slate-100" onError={e => e.target.src = 'https://via.placeholder.com/400'} />
                    <input value={imgEdit?.url || ''} onChange={e => setImgEdit(p => ({...p, url: e.target.value}))} className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-2 text-sm dark:text-white" placeholder="https://..."/>
                    <button onClick={() => { updateAct(imgEdit.dayIdx, imgEdit.actId, 'image', imgEdit.url); setImgEdit(null); }} className="w-full bg-indigo-600 text-white font-bold py-2 rounded-xl">Save</button>
                </div>
            </Modal>
            
            <Modal isOpen={signOutConfirm} onClose={() => setSignOutConfirm(false)} title="Sign Out">
                <div className="space-y-4">
                     <p className="text-slate-600 dark:text-slate-300">Are you sure you want to sign out of your account?</p>
                     <div className="flex gap-3 justify-end pt-2">
                        <button onClick={() => setSignOutConfirm(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors dark:text-white">Cancel</button>
                        <button onClick={() => { signOut(auth); setSignOutConfirm(false); }} className="px-4 py-2 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30">Sign Out</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
