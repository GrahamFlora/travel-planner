import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  GripVertical, 
  Plus, 
  Trash2, 
  X, 
  Moon, 
  Sun, 
  Cloud as CloudIcon, 
  CloudDrizzle, 
  Settings, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Lock, 
  Unlock,
  ChevronRight, 
  Map, 
  List, 
  Filter, 
  Camera, 
  ChevronDown, 
  Landmark,
  AlertTriangle, 
  Check, 
  Loader2, 
  Plane, 
  ShoppingBag, 
  Coffee, 
  Star, 
  DollarSign, 
  BarChart3, 
  User, 
  LogOut, 
  Share2, 
  Download, 
  CloudRain,
  Utensils, 
  Bed, 
  Bus, 
  Tag, 
  Music, 
  Gift, 
  Zap, 
  Home, 
  ArrowLeft, 
  Copy,
  Globe, 
  Search, 
  Menu as MenuIcon, 
  LayoutGrid, 
  MoreVertical, 
  LayoutList,
  Wand2, 
  ImagePlus, 
  Pencil, 
  Clock, 
  RefreshCw, 
  WifiOff, 
  History
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from "firebase/app";
import { 
    getAuth, 
    signInAnonymously, 
    signInWithCustomToken, 
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile
} from "firebase/auth";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    onSnapshot, 
    collection, 
    enableIndexedDbPersistence 
} from "firebase/firestore";

// --- CONFIGURATION ---
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- OFFLINE PERSISTENCE ---
try {
    enableIndexedDbPersistence(db).catch((err) => {
        if (err.code == 'failed-precondition') {
            console.warn("Persistence failed: Multiple tabs open");
        } else if (err.code == 'unimplemented') {
            console.warn("Persistence not supported by browser");
        }
    });
} catch (e) { 
    console.warn("Persistence init error:", e); 
}

// --- FIRESTORE HELPERS ---
const getUserTripRef = (userId) => {
    return doc(db, 'artifacts', appId, 'users', userId, 'trip', 'data');
};

const getUserBudgetRef = (userId) => {
    return doc(db, 'artifacts', appId, 'users', userId, 'budget', 'data');
};

const getSharedTripRef = (shareCode) => {
    return doc(db, 'artifacts', appId, 'public', 'data', 'shared_trips', shareCode);
};

// --- DATA CONSTANTS ---
const EXCHANGE_RATES = {
    USD: 1.0, 
    PHP: 58.75, 
    HKD: 7.83, 
    EUR: 0.92, 
    JPY: 155.0, 
    GBP: 0.80, 
    MOP: 8.01,
    SGD: 1.35, 
    THB: 36.5, 
    KRW: 1380, 
    CNY: 7.23, 
    AUD: 1.52, 
    CAD: 1.37
};

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

const BASE_CURRENCY = 'HKD'; 

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

// --- UTILITY FUNCTIONS ---

const getFlagUrl = (code) => {
    return `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
};

const formatCurrency = (amount, currencyCode) => {
    const currency = CURRENCY_OPTIONS.find(c => c.code === currencyCode) || { symbol: currencyCode };
    return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: currencyCode, 
        minimumFractionDigits: 2 
    }).format(amount);
};

const compressImage = async (file) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 150; 
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scaleSize;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
        };
    });
};

const getTypeColor = (type) => {
  switch (type) {
    case 'food': return 'border-orange-200 text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800/50';
    case 'travel': return 'border-blue-200 text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/50';
    case 'shopping': return 'border-pink-200 text-pink-600 bg-pink-50 dark:bg-pink-900/20 dark:text-pink-300 dark:border-pink-800/50';
    case 'attraction': return 'border-purple-200 text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800/50';
    default: return 'border-slate-200 text-slate-600 bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  }
};

const getTypeIcon = (type) => {
    switch (type) {
      case 'food': return <Coffee size={12} className="mr-1" />;
      case 'travel': return <Plane size={12} className="mr-1" />;
      case 'shopping': return <ShoppingBag size={12} className="mr-1" />;
      case 'attraction': return <Star size={12} className="mr-1" />;
      default: return <MapPin size={12} className="mr-1" />;
    }
};

// Safe date creator that ignores browser timezone and forces UTC
const createUTCDate = (dateStr) => {
    if(!dateStr) return new Date();
    const parts = dateStr.split('-');
    // Date.UTC(year, monthIndex, day)
    return new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
};

// --- CUSTOM UI COMPONENTS ---

const CustomIconSelect = ({ options, value, onChange, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div className="relative w-full" ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full h-12 bg-slate-100 dark:bg-slate-700 rounded-xl px-4 flex items-center justify-between outline-none border border-transparent focus:border-indigo-500 transition-all text-slate-900 dark:text-white"
            >
                {selectedOption ? (
                    <div className="flex items-center gap-2">
                        <img src={selectedOption.icon} alt={selectedOption.label} className="w-5 h-3.5 object-cover rounded-sm shadow-sm" />
                        <span className="font-bold">{selectedOption.label}</span>
                    </div>
                ) : (
                    <span className="text-slate-400">{placeholder}</span>
                )}
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto custom-scrollbar">
                    {options.map((opt) => (
                        <button 
                            key={opt.value} 
                            type="button" 
                            onClick={() => { onChange(opt.value); setIsOpen(false); }} 
                            className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${value === opt.value ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}
                        >
                            <img src={opt.icon} alt="" className="w-6 h-4 object-cover rounded-sm shadow-sm" />
                            <span className="font-bold">{opt.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const IconPicker = ({ selected, onSelect }) => (
    <div className="grid grid-cols-5 gap-2">
        {CATEGORY_ICONS.map(({ id, icon: Icon, label }) => (
            <button 
                key={id} 
                type="button" 
                onClick={() => onSelect(id)} 
                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${selected === id ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
            >
                <Icon size={20} />
                <span className="text-[10px] mt-1 font-medium truncate w-full text-center">{label}</span>
            </button>
        ))}
    </div>
);

const Toast = ({ message, onClose }) => (
  <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl z-[80] animate-in fade-in slide-in-from-top-4 flex items-center gap-3 border border-slate-700">
    <div className="bg-emerald-500 rounded-full p-1 text-black">
        <Check size={12} strokeWidth={4} />
    </div>
    <span className="font-bold text-sm">{message}</span>
  </div>
);

const Logo = ({ size = "md", onClick }) => {
    const dim = size === "lg" ? "w-16 h-16" : "w-8 h-8";
    const txt = size === "lg" ? "text-3xl" : "text-xl";
    return (
        <button 
            onClick={onClick} 
            className={`flex items-center gap-3 ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
        >
            <div className={`${dim} bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 transform rotate-3`}>
                <Plane className="text-white transform -rotate-3" size={size === "lg" ? 32 : 18} />
            </div>
            <span className={`font-black tracking-tight text-slate-900 dark:text-white ${txt}`}>
                Horizon<span className="text-indigo-500">Planner</span>
            </span>
        </button>
    );
};

const LoginPage = ({ onLogin }) => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [toastMsg, setToastMsg] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            if (isSignUp) {
                await createUserWithEmailAndPassword(auth, email, password);
                await signOut(auth); 
                setToastMsg("Sign up successful! You can now sign in.");
                setIsSignUp(false);
            } else {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                onLogin(userCredential.user);
            }
        } catch (err) { 
            setError(err.message.replace('Firebase: ', '')); 
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => {
        if(toastMsg) { 
            const timer = setTimeout(() => setToastMsg(null), 4000); 
            return () => clearTimeout(timer); 
        }
    }, [toastMsg]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
            {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-300">
                <div className="flex justify-center mb-8"><Logo size="lg" /></div>
                <h2 className="text-2xl font-bold text-center mb-2 text-slate-900 dark:text-white">{isSignUp ? "Create your account" : "Welcome back"}</h2>
                <p className="text-center text-slate-500 dark:text-slate-400 mb-8 text-sm">{isSignUp ? "Start planning your next adventure." : "Enter your details to access your trips."}</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 text-xs rounded-xl flex items-center gap-2"><AlertTriangle size={14} /> {error}</div>}
                    <div className="space-y-1"><label className="text-xs font-bold text-slate-400 uppercase">Email</label><input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white" placeholder="you@example.com" /></div>
                    <div className="space-y-1"><label className="text-xs font-bold text-slate-400 uppercase">Password</label><input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white" placeholder="••••••••" /></div>
                    <button disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2">{loading && <Loader2 className="animate-spin" size={20} />} {isSignUp ? "Sign Up" : "Sign In"}</button>
                </form>
                <div className="mt-6 text-center"><button onClick={() => setIsSignUp(!isSignUp)} className="text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors">{isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}</button></div>
            </div>
        </div>
    );
};

// --- HOOKS ---

const useWeather = (lat, lon, startDate, daysCount = 7) => {
    const [weatherData, setWeatherData] = useState({});
    const [isError, setIsError] = useState(false);
    const [isHistorical, setIsHistorical] = useState(false);
    
    useEffect(() => {
        if (!lat || !lon) return;

        const fetchWeather = async () => {
            setIsError(false);
            setIsHistorical(false);
            try {
                // FORCE UTC: Strictly parse the input string as UTC
                const startStr = startDate || new Date().toISOString().split('T')[0];
                const startObj = createUTCDate(startStr);
                const today = new Date(); // Local time
                
                // Calculate days difference
                const diffTime = startObj - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                
                const isFuture = diffDays > 10;
                const isPast = diffDays < -2;
                const shouldUseHistorical = isFuture || isPast;

                // Determine query range with safe shifts
                let queryStart = new Date(startObj);

                if (isFuture) {
                    while (queryStart > today) {
                        queryStart.setUTCFullYear(queryStart.getUTCFullYear() - 1);
                    }
                    if ((today - queryStart) / (1000 * 60 * 60 * 24) < 5) {
                         queryStart.setUTCFullYear(queryStart.getUTCFullYear() - 1);
                    }
                } else if (isPast) {
                    // For very old dates, maybe we want actual history, but Open-Meteo Archive handles it.
                    // This logic mainly handles future "prediction" via past data.
                }
                
                // End date calculation
                const queryEnd = new Date(queryStart);
                queryEnd.setUTCDate(queryStart.getUTCDate() + (daysCount > 1 ? daysCount : 7) + 2);
                
                const sDateStr = queryStart.toISOString().split('T')[0];
                const eDateStr = queryEnd.toISOString().split('T')[0];
                
                let url = "";
                if (shouldUseHistorical) {
                    url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${sDateStr}&end_date=${eDateStr}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto&t=${Date.now()}`;
                } else {
                     url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto&start_date=${sDateStr}&end_date=${eDateStr}&t=${Date.now()}`;
                }

                const response = await fetch(url);
                if (!response.ok) throw new Error("Weather API failed");
                
                const data = await response.json();
                const weatherMap = {};
                
                if (data.daily && data.daily.time) {
                    data.daily.time.forEach((time, index) => {
                         // Map back to trip dates using UTC math
                         // The index from the API result corresponds to startObj + index days
                         const targetDateForIndex = new Date(startObj);
                         targetDateForIndex.setUTCDate(targetDateForIndex.getUTCDate() + index);
                         const key = targetDateForIndex.toISOString().split('T')[0];
                        
                        weatherMap[key] = {
                            max: data.daily.temperature_2m_max[index],
                            min: data.daily.temperature_2m_min[index],
                            code: data.daily.weathercode[index]
                        };
                    });
                }
                
                setWeatherData(weatherMap);
                setIsHistorical(shouldUseHistorical);

            } catch (error) { 
                console.error("Weather fetch failed", error);
                setIsError(true);
            }
        };
        fetchWeather();
    }, [lat, lon, startDate, daysCount]); 
    
    return { weatherData, isError, isHistorical };
};

// --- DISPLAY COMPONENTS ---

const WeatherDisplay = ({ date, weatherData, isError, isHistorical }) => {
    const realWeather = weatherData[date];
    let Icon = Sun;
    let tempText = "Loading...";
    let textClass = "text-slate-400";
    
    if (realWeather) {
        if (realWeather.code > 3) Icon = CloudIcon;
        if (realWeather.code > 50) Icon = CloudRain;
        tempText = `${Math.round(realWeather.min)}°/${Math.round(realWeather.max)}°`;
    } else {
        if (isError) {
             Icon = WifiOff;
             tempText = "Offline";
             textClass = "text-red-400";
        } else if (Object.keys(weatherData).length === 0) {
            Icon = Loader2;
            tempText = "Fetching";
        } else {
             Icon = CalendarIcon;
             tempText = "--";
        }
    }

    return (
        <div className={`flex items-center text-xs font-medium ${textClass} mt-1 min-h-[16px]`}>
             {isHistorical && realWeather && <span className="mr-1 text-[8px] uppercase font-bold tracking-wider opacity-70 text-indigo-500">Est.</span>}
            <Icon size={12} className={`mr-1 ${tempText === 'Fetching' ? 'animate-spin' : ''}`} /> {tempText}
        </div>
    );
};

const Modal = ({ isOpen, onClose, title, children, maxWidth = "max-w-lg" }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full ${maxWidth} overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200`}>
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar">{children}</div>
      </div>
    </div>
  );
};

const ExpenseCard = ({ expense, onDelete, onEdit, isEditMode, currencyOptions }) => {
    const inputCurrencyCode = expense.inputCurrencyCode || BASE_CURRENCY;
    const amountInput = expense.amountInput !== undefined ? expense.amountInput : expense.amount;
    const inputCurrencyObj = currencyOptions.find(c => c.code === inputCurrencyCode) || { symbol: '', code: inputCurrencyCode };
    const catObj = CATEGORY_ICONS.find(c => c.id === expense.category) || CATEGORY_ICONS[8];
    const Icon = catObj.icon;

    return (
        <div className={`bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex justify-between items-center transition-all hover:shadow-md`}>
            <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${isEditMode ? 'bg-red-50 text-red-500' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                    <Icon size={18} />
                </div>
                <div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm md:text-base">{expense.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{catObj.label}</p>
                </div>
            </div>
            <div className="text-right flex items-center space-x-3">
                <p className="font-black text-lg text-slate-900 dark:text-white">
                    {inputCurrencyObj.symbol}{Number(amountInput).toFixed(2)}
                    <span className="text-[10px] font-bold text-slate-400 ml-1">{inputCurrencyObj.code}</span>
                </p>
                {isEditMode && (
                    <div className="flex gap-1">
                        <button onClick={(e) => { e.stopPropagation(); onEdit(expense); }} className="p-2 text-slate-300 hover:text-indigo-500 transition-colors">
                            <Pencil size={16} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onDelete(expense.id); }} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                            <Trash2 size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- FORMS ---

const AddExpenseForm = ({ onAddExpense, currencyOptions, convertToBase, initialData }) => {
    const [name, setName] = useState('');
    const [amountInput, setAmountInput] = useState('');
    const [category, setCategory] = useState('food');
    const [inputCurrencyCode, setInputCurrencyCode] = useState(BASE_CURRENCY);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        if (initialData) {
            setName(initialData.name || '');
            setAmountInput(initialData.amountInput !== undefined ? initialData.amountInput : initialData.amount);
            setCategory(initialData.category || 'food');
            setInputCurrencyCode(initialData.inputCurrencyCode || BASE_CURRENCY);
            setDate(initialData.date || new Date().toISOString().split('T')[0]);
        }
    }, [initialData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name || !amountInput) return;
        
        const amountBase = convertToBase(Number(amountInput), inputCurrencyCode);
        
        onAddExpense({ 
            id: initialData ? initialData.id : Math.random().toString(36).substr(2, 9), 
            name, 
            amount: amountBase, 
            amountInput: Number(amountInput), 
            inputCurrencyCode, 
            category, 
            type: 'expense', 
            date 
        });
        
        if (!initialData) { 
            setName(''); 
            setAmountInput(''); 
        }
    };
    
    const inputCurrencySymbol = currencyOptions.find(c => c.code === inputCurrencyCode)?.symbol || '';
    const selectOptions = currencyOptions.map(c => ({ 
        value: c.code, 
        label: c.code, 
        icon: getFlagUrl(c.countryCode) 
    }));

    return (
        <form onSubmit={handleSubmit} className="p-4 md:p-6 bg-white dark:bg-slate-800 rounded-2xl space-y-4">
            <h3 className="text-lg font-bold dark:text-white">{initialData ? 'Edit Expense' : 'Log Expense'}</h3>
            
            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Description</label>
                <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" 
                    placeholder="e.g. Dinner" 
                    required
                />
            </div>
            
            <div className="grid grid-cols-3 gap-3">
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Currency</label>
                    <CustomIconSelect 
                        options={selectOptions} 
                        value={inputCurrencyCode} 
                        onChange={setInputCurrencyCode} 
                        placeholder="Select" 
                    />
                </div>
                <div className="space-y-1 col-span-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">Amount</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">{inputCurrencySymbol}</span>
                        {/* PADDING FIX HERE (pl-16) */}
                        <input 
                            type="number" 
                            step="0.01" 
                            value={amountInput} 
                            onChange={(e) => setAmountInput(e.target.value)} 
                            className="w-full h-12 bg-slate-100 dark:bg-slate-700 rounded-xl pl-16 pr-4 outline-none font-mono font-bold text-lg focus:ring-2 focus:ring-indigo-500 dark:text-white" 
                            placeholder="0.00" 
                            required
                        />
                    </div>
                </div>
            </div>
            
            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Date</label>
                <input 
                    type="date" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)} 
                    className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                />
            </div>
            
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Category</label>
                <IconPicker selected={category} onSelect={setCategory} />
            </div>
            
            <button 
                type="submit" 
                className="w-full bg-black dark:bg-white text-white dark:text-black font-bold py-3 rounded-xl mt-2 active:scale-95 transition-transform"
            >
                {initialData ? 'Update Expense' : 'Save Expense'}
            </button>
        </form>
    );
};

// --- VIEW COMPONENTS ---

const CalendarView = ({ trip, onSelectDay }) => {
    const startDate = new Date(trip.startDate);
    const year = startDate.getFullYear();
    const month = startDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay(); 
    
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) { days.push(null); }
    for (let i = 1; i <= daysInMonth; i++) { days.push(new Date(year, month, i)); }
    
    const tripDayMap = {};
    trip.days.forEach((d, idx) => { tripDayMap[d.date] = { ...d, idx }; });

    return (
        <div className="max-w-6xl mx-auto mt-6 px-4 pb-20 space-y-6 animate-in fade-in">
             <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                        {startDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                    </h2>
                    <div className="flex gap-2">
                        <span className="text-xs font-bold px-2 py-1 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                            Trip Schedule
                        </span>
                    </div>
                </div>

                {/* DESKTOP CALENDAR */}
                <div className="hidden md:block">
                    <div className="grid grid-cols-7 gap-4 mb-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                            <div key={d} className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider">{d}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-4 auto-rows-fr">
                        {days.map((date, i) => {
                            if (!date) return <div key={`empty-${i}`} className="aspect-square bg-slate-50/50 dark:bg-slate-800/30 rounded-xl"></div>;
                            const dateStr = date.toISOString().split('T')[0];
                            const tripDay = tripDayMap[dateStr];
                            const isToday = new Date().toISOString().split('T')[0] === dateStr;
                            return (
                                <div 
                                    key={dateStr} 
                                    onClick={() => tripDay && onSelectDay(tripDay.idx)} 
                                    className={`
                                        min-h-[140px] rounded-xl p-3 relative flex flex-col items-start justify-start text-sm transition-all border 
                                        ${tripDay 
                                            ? 'bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-900/50 shadow-sm hover:shadow-md cursor-pointer group' 
                                            : 'bg-slate-50 dark:bg-slate-800/50 border-transparent text-slate-400 opacity-60'
                                        } 
                                        ${isToday ? 'ring-2 ring-emerald-500' : ''}
                                    `}
                                >
                                    <span className={`font-bold mb-2 ${tripDay ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 w-8 h-8 flex items-center justify-center rounded-full' : ''}`}>
                                        {date.getDate()}
                                    </span>
                                    {tripDay && (
                                        <div className="w-full space-y-1 overflow-y-auto custom-scrollbar max-h-[100px]">
                                            {tripDay.activities?.map((act, idx) => (
                                                <div key={idx} className="text-[10px] font-medium bg-slate-100 dark:bg-slate-700/50 p-1.5 rounded truncate text-slate-700 dark:text-slate-300 border-l-2 border-indigo-400">
                                                    <span className="opacity-70 mr-1">{act.time}</span>{act.title}
                                                </div>
                                            ))}
                                            {(!tripDay.activities || tripDay.activities.length === 0) && (
                                                <span className="text-[10px] text-slate-400 italic">No activities</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* MOBILE LIST VIEW */}
                <div className="md:hidden space-y-4">
                    {days.filter(d => d).map((date, i) => {
                        const dateStr = date.toISOString().split('T')[0];
                        const tripDay = tripDayMap[dateStr];
                        if (!tripDay) return null; 
                        return (
                            <div 
                                key={dateStr} 
                                onClick={() => onSelectDay(tripDay.idx)} 
                                className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 cursor-pointer active:scale-95 transition-transform"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex flex-col items-center justify-center text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                        <span className="text-xs font-bold uppercase">{date.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                                        <span className="text-lg font-black">{date.getDate()}</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white">{tripDay.title}</h4>
                                        <p className="text-xs text-slate-500">{tripDay.activities?.length || 0} Activities</p>
                                    </div>
                                    <div className="ml-auto p-2 bg-white dark:bg-slate-700 rounded-full shadow-sm text-slate-400 hover:text-indigo-600">
                                        <ChevronRight size={20} />
                                    </div>
                                </div>
                                <div className="space-y-2 pl-4 border-l-2 border-indigo-100 dark:border-slate-700 ml-6">
                                    {tripDay.activities?.sort((a,b) => (a.time || '').localeCompare(b.time || '')).map((act, idx) => (
                                        <div key={idx} className="flex items-start gap-3 relative py-1">
                                            <div className="absolute -left-[21px] top-2.5 w-2.5 h-2.5 rounded-full bg-indigo-400 ring-2 ring-white dark:ring-slate-800"></div>
                                            <span className="text-xs font-bold font-mono text-slate-400 min-w-[40px]">{act.time}</span>
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{act.title}</span>
                                        </div>
                                    ))}
                                    {(!tripDay.activities || tripDay.activities.length === 0) && <span className="text-xs text-slate-400 italic pl-2">Free day</span>}
                                </div>
                            </div>
                        );
                    })}
                     {days.filter(d => d && tripDayMap[d.toISOString().split('T')[0]]).length === 0 && (
                        <div className="text-center py-10 text-slate-400">
                            <CalendarIcon size={48} className="mx-auto mb-2 opacity-20" />
                            <p>No itinerary days in this month.</p>
                        </div>
                    )}
                </div>
             </div>
        </div>
    );
};

const BudgetView = ({ currentUser, isEditMode, db, trip }) => {
    const [expenses, setExpenses] = useState([]);
    const [targetCurrency, setTargetCurrency] = useState(trip?.currency || 'USD'); 
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null); 

    useEffect(() => {
        if(!currentUser) return;
        const unsub = onSnapshot(getUserBudgetRef(currentUser.uid), (snap) => {
            if(snap.exists()) setExpenses(snap.data().expenses || []);
        });
        return () => unsub();
    }, [currentUser]);

    useEffect(() => { 
        if (trip?.currency) setTargetCurrency(trip.currency); 
    }, [trip?.currency]);

    // FILTERED EXPENSES: Only show those for this trip, OR those without a tripId (legacy support)
    const tripExpenses = useMemo(() => {
        return expenses.filter(e => e.tripId === trip.id || (!e.tripId && expenses.length > 0)); 
    }, [expenses, trip.id]);

    const handleSaveExpense = async (newExp) => { 
        // Ensure new expenses get linked to this trip
        const expenseWithId = { ...newExp, tripId: trip.id };
        
        let updated;
        const existingIndex = expenses.findIndex(e => e.id === newExp.id);
        if (existingIndex >= 0) { 
            updated = [...expenses]; 
            updated[existingIndex] = expenseWithId; 
        } else { 
            updated = [...expenses, expenseWithId]; 
        }
        setExpenses(updated); 
        setIsAddModalOpen(false); 
        setEditingExpense(null);
        await setDoc(getUserBudgetRef(currentUser.uid), { expenses: updated }, { merge: true }); 
    };

    const handleDelete = async (id) => { 
        const updated = expenses.filter(e => e.id !== id); 
        setExpenses(updated); 
        await setDoc(getUserBudgetRef(currentUser.uid), { expenses: updated }, { merge: true }); 
    };

    const handleEditStart = (expense) => { 
        setEditingExpense(expense); 
        setIsAddModalOpen(true); 
    };

    const handleCloseModal = () => { 
        setIsAddModalOpen(false); 
        setEditingExpense(null); 
    };

    const convertToBase = (amt, code) => (amt / (EXCHANGE_RATES[code] || 1)) * EXCHANGE_RATES[BASE_CURRENCY];
    
    // Only calculate total for filtered expenses
    const totalBase = tripExpenses.reduce((acc, curr) => acc + (Number(curr.amount)||0), 0);
    const targetRate = EXCHANGE_RATES[targetCurrency] || 1;
    const baseRate = EXCHANGE_RATES[BASE_CURRENCY] || 1;
    const totalDisplay = totalBase * (targetRate / baseRate);

    const expensesByDate = useMemo(() => {
        const grouped = {};
        tripExpenses.forEach(e => { 
            const d = e.date || 'Unscheduled'; 
            if (!grouped[d]) grouped[d] = []; 
            grouped[d].push(e); 
        });
        return grouped;
    }, [tripExpenses]);

    const sortedDates = Object.keys(expensesByDate).sort();

    return (
        <div className="max-w-2xl mx-auto mt-6 px-4 pb-20 space-y-6 animate-in fade-in">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-indigo-900 dark:to-indigo-950 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                    <p className="text-slate-400 text-sm font-medium mb-1">Trip Cost</p>
                    <h1 className="text-4xl font-black mb-6">{formatCurrency(totalDisplay, targetCurrency)}</h1>
                    <div className="flex gap-2">
                         <button onClick={() => isEditMode && setIsAddModalOpen(true)} disabled={!isEditMode} className="bg-white text-black px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-100 disabled:opacity-50">
                            <Plus size={16} /> Add Expense
                         </button>
                         <select value={targetCurrency} onChange={e => setTargetCurrency(e.target.value)} className="bg-white/10 text-white border border-white/20 px-3 py-2 rounded-xl text-sm outline-none appearance-none font-bold">
                            {CURRENCY_OPTIONS.map(c => <option key={c.code} value={c.code} className="text-black">{c.code}</option>)}
                         </select>
                    </div>
                </div>
            </div>
            <div className="space-y-6">
                {tripExpenses.length === 0 ? ( 
                    <div className="text-center py-10 text-slate-400"><Wallet size={48} className="mx-auto mb-2 opacity-20" /><p>No expenses for this trip yet.</p></div> 
                ) : ( 
                    sortedDates.map(date => {
                        const dailyExpenses = expensesByDate[date];
                        const dailyTotalBase = dailyExpenses.reduce((acc, curr) => acc + (Number(curr.amount)||0), 0);
                        const dailyTotalDisplay = dailyTotalBase * (targetRate / baseRate);
                        return (
                            <div key={date} className="animate-in slide-in-from-bottom-2">
                                <div className="flex justify-between items-end mb-3 px-2">
                                    <h4 className="font-bold text-slate-500 text-sm uppercase tracking-wider">{date === 'Unscheduled' ? 'Other' : new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</h4>
                                    <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(dailyTotalDisplay, targetCurrency)}</span>
                                </div>
                                <div className="space-y-3">
                                    {dailyExpenses.map(e => (
                                        <ExpenseCard 
                                            key={e.id} 
                                            expense={e} 
                                            onDelete={handleDelete} 
                                            onEdit={handleEditStart} 
                                            isEditMode={isEditMode} 
                                            currencyOptions={CURRENCY_OPTIONS} 
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
            <Modal isOpen={isAddModalOpen} onClose={handleCloseModal} title={editingExpense ? "Edit Expense" : "New Expense"}>
                <AddExpenseForm onAddExpense={handleSaveExpense} currencyOptions={CURRENCY_OPTIONS} convertToBase={convertToBase} initialData={editingExpense} />
            </Modal>
        </div>
    );
};

const DashboardView = ({ trips, onSelectTrip, onNewTrip, onSignOut, onImportTrip, userEmail, onDeleteTrip }) => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 overflow-x-hidden">
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
                 <div className="flex justify-between items-center">
                    <Logo size="lg" />
                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                <User size={14} />
                            </div>
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 max-w-[100px] truncate">{userEmail || 'Guest'}</span>
                        </div>
                        <button onClick={onSignOut} className="p-2.5 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-colors">
                            <LogOut size={20} />
                        </button>
                    </div>
                 </div>
                 
                 <div className="grid md:grid-cols-2 gap-6">
                    {trips.map(trip => (
                        <button key={trip.id} onClick={() => onSelectTrip(trip.id)} className="relative group text-left h-48 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
                             <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors z-10" />
                             <img src={trip.coverImage} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                             
                             <div className="absolute top-3 right-3 z-30 opacity-100 transition-opacity">
                                <div onClick={(e) => { e.stopPropagation(); onDeleteTrip(trip); }} className="p-2 bg-black/40 hover:bg-red-600 text-white backdrop-blur-md rounded-full transition-colors shadow-lg cursor-pointer md:opacity-0 md:group-hover:opacity-100" title="Delete Trip">
                                    <Trash2 size={16} />
                                </div>
                             </div>
                             
                             <div className="absolute bottom-0 left-0 p-6 z-20 text-white">
                                <h3 className="text-2xl font-black mb-1">{trip.title}</h3>
                                <p className="text-sm opacity-90 font-medium flex items-center gap-1"><CalendarIcon size={14}/> {trip.startDate}</p>
                             </div>
                        </button>
                    ))}
                    
                    <button onClick={onNewTrip} className="flex flex-col items-center justify-center h-48 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-400 hover:border-indigo-500 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all group">
                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <Plus size={24} />
                        </div>
                        <span className="font-bold">Plan New Trip</span>
                    </button>
                    
                    <button onClick={onImportTrip} className="flex flex-col items-center justify-center h-48 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-400 hover:border-emerald-500 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all group">
                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <Download size={24} />
                        </div>
                        <span className="font-bold">Import Trip</span>
                    </button>
                 </div>
            </div>
        </div>
    );
};

// --- MAIN APP ---
export default function TravelApp() {
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [trips, setTrips] = useState([]);
    
    // -- LOCAL STORAGE PERSISTENCE --
    const [isDarkMode, setIsDarkMode] = useState(() => { 
        if (typeof window !== 'undefined') return localStorage.getItem('theme') === 'dark'; 
        return false; 
    });
    
    const [currentTripId, setCurrentTripId] = useState(() => { 
        if (typeof window !== 'undefined') return localStorage.getItem('currentTripId'); 
        return null; 
    });
    
    const [view, setView] = useState(() => { 
        if (typeof window !== 'undefined') return localStorage.getItem('view') || 'dashboard'; 
        return 'dashboard'; 
    });

    const [activeDayIdx, setActiveDayIdx] = useState(0);
    const [isEditMode, setIsEditMode] = useState(false);
    const [viewMode, setViewMode] = useState('timeline'); 
    const [modalOpen, setModalOpen] = useState(null);
    const [embeddedMaps, setEmbeddedMaps] = useState({});
    const [isMapOpen, setIsMapOpen] = useState(false); 
    const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
    const [imageEditState, setImageEditState] = useState(null); 
    const [sharedCode, setSharedCode] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDataLoaded, setIsDataLoaded] = useState(false); 
    const [tripToDelete, setTripToDelete] = useState(null);
    const [newCompanionName, setNewCompanionName] = useState('');
    const [newCompanionPhoto, setNewCompanionPhoto] = useState(null);
    const dayRefs = useRef([]);

    // --- DYNAMIC TITLE HOOK ---
    const trip = trips.find(t => t.id === currentTripId);
    
    useEffect(() => {
        let title = "HorizonPlanner";
        if (view === 'dashboard') {
            title = "My Trips - HorizonPlanner";
        } else if (trip) {
            title = `${trip.title} - HorizonPlanner`;
            if (viewMode === 'budget') title = `Budget: ${trip.title}`;
            if (viewMode === 'calendar') title = `Calendar: ${trip.title}`;
        }
        document.title = title;
    }, [view, trip, viewMode]);

    useEffect(() => {
        const initAuth = async () => { 
            if (initialAuthToken) { 
                try { 
                    await signInWithCustomToken(auth, initialAuthToken); 
                } catch (err) { 
                    console.error("Token auth failed:", err); 
                } 
            } 
        };
        initAuth();
        const unsub = onAuthStateChanged(auth, (u) => { 
            setUser(u); 
            setAuthLoading(false); 
        }); 
        return () => unsub(); 
    }, []);

    useEffect(() => { 
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light'); 
    }, [isDarkMode]);
    
    useEffect(() => { 
        if (currentTripId) localStorage.setItem('currentTripId', currentTripId); 
    }, [currentTripId]);
    
    useEffect(() => { 
        localStorage.setItem('view', view); 
    }, [view]);

    useEffect(() => {
        if (!user) {
            setShowSignOutConfirm(false); 
            setModalOpen(null); 
            setView('dashboard'); 
            setIsEditMode(false);
            setImageEditState(null); 
            setTripToDelete(null); 
            setTrips([]); 
            setIsDataLoaded(false);
            localStorage.removeItem('currentTripId'); 
            localStorage.removeItem('view');
        }
    }, [user]);

    useEffect(() => {
        if (!user) return;
        const unsub = onSnapshot(getUserTripRef(user.uid), (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setTrips(data.allTrips || []);
                if (view === 'trip' && currentTripId && !data.allTrips.find(t => t.id === currentTripId)) { 
                    setView('dashboard'); 
                    setCurrentTripId(null); 
                }
            } else { 
                setDoc(getUserTripRef(user.uid), { allTrips: [], currentTripId: null }); 
            }
            setIsDataLoaded(true); 
        });
        return () => unsub();
    }, [user, view, currentTripId]);
    
    useEffect(() => { 
        if (dayRefs.current[activeDayIdx]) { 
            dayRefs.current[activeDayIdx].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }); 
        } 
    }, [activeDayIdx]);

    const saveTimeout = useRef(null);
    useEffect(() => {
        if (!user || !isDataLoaded) return;
        clearTimeout(saveTimeout.current);
        saveTimeout.current = setTimeout(() => { 
            setDoc(getUserTripRef(user.uid), { allTrips: trips, currentTripId }, { merge: true }); 
        }, 1000);
    }, [trips, currentTripId, user, isDataLoaded]);

    const { weatherData, isError: weatherError, isHistorical } = useWeather(
        trip?.lat || 22.3193, 
        trip?.lon || 114.1694, 
        trip?.startDate, 
        trip?.days?.length || 7
    );
    
    const updateTrip = (updates) => { 
        setTrips(prev => prev.map(t => t.id === currentTripId ? { ...t, ...updates } : t)); 
    };
    
    const countryOptions = COUNTRY_DATA.map(c => ({ 
        value: c.name, 
        label: c.name, 
        icon: getFlagUrl(c.countryCode) 
    }));
    
    const currencySelectOptions = CURRENCY_OPTIONS.map(c => ({ 
        value: c.code, 
        label: `${c.code} - ${c.name}`, 
        icon: getFlagUrl(c.countryCode) 
    }));

    const handleAddCompanion = async (e) => {
        e.preventDefault();
        if (!newCompanionName.trim()) return;
        
        let photoUrl = null;
        if (newCompanionPhoto) { 
            photoUrl = await compressImage(newCompanionPhoto); 
        }
        
        const newCompanion = { name: newCompanionName, photo: photoUrl };
        const updatedCompanions = [...trip.companions, newCompanion];
        updateTrip({ companions: updatedCompanions });
        setNewCompanionName(''); 
        setNewCompanionPhoto(null);
    };

    const handleSelectTrip = (id) => { 
        setCurrentTripId(id); 
        setView('trip'); 
        setActiveDayIdx(0); 
    };
    
    const handleNewTrip = () => {
        const newTrip = { 
            id: Math.random().toString(36).substr(2, 9), 
            title: 'New Trip', 
            startDate: new Date().toISOString().split('T')[0], 
            coverImage: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=2000&q=80', 
            companions: [], 
            lat: 22.3193, 
            lon: 114.1694, 
            currency: 'USD', 
            days: [{ id: 'd1', date: new Date().toISOString().split('T')[0], title: 'Day 1', activities: [] }] 
        };
        setTrips(prev => [...prev, newTrip]);
    };

    const handleDeleteTripConfirm = async () => { 
        if (!tripToDelete) return; 
        const newTrips = trips.filter(t => t.id !== tripToDelete.id); 
        setTrips(newTrips); 
        setTripToDelete(null); 
    };

    const handleAddDay = () => {
        const lastDay = trip.days[trip.days.length - 1];
        // CRITICAL: use createUTCDate to avoid timezone shifts
        const lastDate = lastDay?.date ? createUTCDate(lastDay.date) : new Date();
        const nextDate = new Date(lastDate); 
        nextDate.setUTCDate(nextDate.getUTCDate() + 1);
        
        const dateStr = nextDate.toISOString().split('T')[0];
        const newDay = { 
            id: Math.random().toString(36).substr(2, 9), 
            date: dateStr, 
            title: `Day ${trip.days.length + 1}`, 
            activities: [] 
        };
        updateTrip({ days: [...trip.days, newDay] });
    };

    const handleDeleteDay = (idx) => { 
        if (trip.days.length <= 1) return alert("You must have at least one day."); 
        if (confirm(`Delete Day ${idx + 1}?`)) { 
            const newDays = trip.days.filter((_, i) => i !== idx); 
            updateTrip({ days: newDays }); 
            if (activeDayIdx >= newDays.length) { 
                setActiveDayIdx(newDays.length - 1); 
            } 
        } 
    };
    
    const handleSignOut = async () => { 
        setShowSignOutConfirm(false); 
        try { 
            await signOut(auth); 
        } catch (error) { 
            console.error("Error signing out:", error); 
        } 
    };
    
    const handleShareTrip = async () => {
        if (!trip) return;
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        try { 
            // 1. Fetch current budget expenses for this user
            const budgetSnap = await getDoc(getUserBudgetRef(user.uid));
            let sharedExpenses = [];
            
            if (budgetSnap.exists()) {
                const allExpenses = budgetSnap.data().expenses || [];
                // 2. Filter expenses that match the current trip ID (or are legacy orphans)
                sharedExpenses = allExpenses.filter(e => e.tripId === trip.id || (!e.tripId && trips.length === 1));
            }
            
            // 3. Create payload with expenses included
            const cleanTrip = JSON.parse(JSON.stringify({ ...trip, sharedExpenses })); 
            await setDoc(getSharedTripRef(code), cleanTrip); 
            setSharedCode(code); 
        } catch (error) { 
            console.error("Share Error:", error); 
            alert(`Error: ${error.message}`); 
        }
    };

    const handleImportTrip = async (e) => {
        e.preventDefault();
        const code = e.target.shareId.value.trim().toUpperCase();
        if(!code) return;
        try { 
            const docSnap = await getDoc(getSharedTripRef(code)); 
            if (docSnap.exists()) { 
                const data = docSnap.data();
                const newTripId = Math.random().toString(36).substr(2, 9);
                
                // 1. Extract expenses
                const sharedExpenses = data.sharedExpenses || [];
                const tripData = { ...data };
                delete tripData.sharedExpenses;
                
                // 2. Add trip
                const newTrip = { 
                    ...tripData, 
                    id: newTripId, 
                    title: `${data.title} (Imported)` 
                }; 
                
                setTrips(prev => [...prev, newTrip]); 
                
                // 3. Import Expenses (if any)
                if (sharedExpenses.length > 0) {
                     // Fetch my current budget
                     const myBudgetSnap = await getDoc(getUserBudgetRef(user.uid));
                     let myExpenses = [];
                     if (myBudgetSnap.exists()) myExpenses = myBudgetSnap.data().expenses || [];
                     
                     // Re-map shared expenses to the new Trip ID
                     const newExpenses = sharedExpenses.map(exp => ({
                         ...exp,
                         id: Math.random().toString(36).substr(2, 9), // new ID to prevent collision
                         tripId: newTripId // link to new imported trip
                     }));
                     
                     // Save merged budget
                     await setDoc(getUserBudgetRef(user.uid), { 
                        expenses: [...myExpenses, ...newExpenses] 
                     }, { merge: true });
                }

                setModalOpen(null); 
                alert("Trip Imported Successfully!"); 
            } else { 
                alert("Trip not found! Check the code."); 
            } 
        } catch (error) { 
            console.error("Import Error:", error); 
            alert("Failed to import."); 
        }
    };
    
    const handleDeleteActivity = (dayIdx, actId) => { 
        const newDays = [...trip.days]; 
        newDays[dayIdx].activities = newDays[dayIdx].activities.filter(a => a.id !== actId); 
        updateTrip({ days: newDays }); 
    };
    
    const updateActivityCost = (dayIdx, actId, val) => { 
        const newDays = [...trip.days]; 
        const day = newDays[dayIdx]; 
        const actIndex = day.activities.findIndex(a => a.id === actId); 
        if (actIndex > -1) { 
            day.activities[actIndex].cost = val; 
            updateTrip({ days: newDays }); 
        } 
    };
    
    const handleUpdateActivity = (dayIdx, actId, field, value) => { 
        const newDays = [...trip.days]; 
        const actIdx = newDays[dayIdx].activities.findIndex(a => a.id === actId); 
        if (actIdx === -1) return; 
        newDays[dayIdx].activities[actIdx] = { 
            ...newDays[dayIdx].activities[actIdx], 
            [field]: value 
        }; 
        updateTrip({ days: newDays }); 
    };
    
    const handleOptimizeRoute = () => {
        const newDays = [...trip.days];
        const currentActivities = [...newDays[activeDayIdx].activities];
        const parseTime = (timeStr) => { 
            if(!timeStr) return 9999; 
            const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i); 
            if (!match) return 9999; 
            let [_, hours, minutes, period] = match; 
            hours = parseInt(hours); 
            minutes = parseInt(minutes); 
            if (period) { 
                if (period.toUpperCase() === 'PM' && hours !== 12) hours += 12; 
                if (period.toUpperCase() === 'AM' && hours === 12) hours = 0; 
            } 
            return hours * 60 + minutes; 
        };
        currentActivities.sort((a, b) => parseTime(a.time) - parseTime(b.time));
        newDays[activeDayIdx].activities = currentActivities;
        updateTrip({ days: newDays });
        alert("Route optimized based on time!");
    };

    const toggleViewMode = () => { 
        if (viewMode === 'timeline') setViewMode('calendar'); 
        else if (viewMode === 'calendar') setViewMode('budget'); 
        else setViewMode('timeline'); 
    };

    if (authLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;
    if (!user) return <LoginPage onLogin={setUser} />;
    
    if (view === 'dashboard' || !trip) {
        return (
            <>
                <DashboardView 
                    trips={trips} 
                    onSelectTrip={handleSelectTrip} 
                    onNewTrip={handleNewTrip} 
                    onSignOut={() => setShowSignOutConfirm(true)} 
                    onImportTrip={() => setModalOpen('import')} 
                    userEmail={user.email} 
                    onDeleteTrip={setTripToDelete} 
                />
                <Modal isOpen={showSignOutConfirm} onClose={() => setShowSignOutConfirm(false)} title="Sign Out">
                    <div className="space-y-4">
                        <p className="text-slate-600 dark:text-slate-300">Are you sure you want to sign out?</p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setShowSignOutConfirm(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold">Cancel</button>
                            <button onClick={handleSignOut} className="px-4 py-2 rounded-xl bg-red-500 text-white font-bold">Sign Out</button>
                        </div>
                    </div>
                </Modal>
                <Modal isOpen={modalOpen === 'import'} onClose={() => setModalOpen(null)} title="Import Trip">
                    <div className="space-y-6">
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-center">
                            <div className="mx-auto w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                                <Download size={24} />
                            </div>
                            <h4 className="font-bold dark:text-white">Import a Friend's Trip</h4>
                            <p className="text-sm text-slate-500 mb-4">Enter the 6-character code to clone a shared itinerary.</p>
                            <form onSubmit={handleImportTrip} className="flex gap-2">
                                <input 
                                    name="shareId" 
                                    placeholder="e.g. A7B2X9" 
                                    className="flex-grow bg-white dark:bg-slate-800 rounded-xl px-4 py-3 outline-none font-mono text-sm uppercase placeholder:normal-case" 
                                    required 
                                    maxLength={6} 
                                />
                                <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/30 hover:bg-emerald-700 transition-colors">Import</button>
                            </form>
                        </div>
                    </div>
                </Modal>
                <Modal isOpen={!!tripToDelete} onClose={() => setTripToDelete(null)} title="Delete Trip">
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl text-red-700 dark:text-red-300">
                            <div className="p-3 bg-red-100 dark:bg-red-900/40 rounded-full">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold">Are you sure?</h4>
                                <p className="text-xs opacity-90">This action cannot be undone.</p>
                            </div>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 text-sm">
                            You are about to delete <strong>{tripToDelete?.title}</strong>. All itinerary data and expenses will be lost permanently.
                        </p>
                        <div className="flex gap-3 justify-end pt-2">
                            <button onClick={() => setTripToDelete(null)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                            <button onClick={handleDeleteTripConfirm} className="px-4 py-2 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30">Delete Forever</button>
                        </div>
                    </div>
                </Modal>
            </>
        );
    }

    const activeDay = trip.days[activeDayIdx] || trip.days[0];

    return (
        <div className={`min-h-screen transition-colors duration-500 ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-zinc-100 text-zinc-900'} font-sans pb-20 overflow-x-hidden`}>
            <div className="relative h-[40vh] md:h-[50vh] w-full group">
                <div className="absolute inset-0 overflow-hidden rounded-b-3xl">
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-zinc-100 dark:to-slate-950 z-10" />
                    <img 
                        src={trip.coverImage} 
                        alt="Trip Cover" 
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                        onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1558980394-4c7c9299fe96?auto=format&fit=crop&w=2000&q=80'} 
                    />
                </div>
                
                <div className="absolute top-0 left-0 right-0 z-50 flex justify-between items-center p-6 text-white">
                      <Logo size="sm" onClick={() => { setView('dashboard'); setCurrentTripId(null); }} />
                      
                      <div className="flex gap-2 relative">
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-black/30 backdrop-blur-md rounded-full border border-white/10 mr-2">
                            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                                <User size={12} className="text-white" />
                            </div>
                            <span className="text-[10px] font-bold text-white max-w-[100px] truncate">{user.email || 'Guest'}</span>
                        </div>
                        
                        <button 
                            onClick={() => setIsEditMode(!isEditMode)} 
                            className={`p-2.5 rounded-full backdrop-blur-md border transition-all ${isEditMode ? 'bg-amber-400 text-amber-900 border-amber-300' : 'bg-black/30 border-white/20'}`} 
                            title="Toggle Edit Mode"
                        >
                            {isEditMode ? <Unlock size={18} /> : <Lock size={18} />}
                        </button>
                        
                        <button 
                            onClick={toggleViewMode} 
                            className={`p-2.5 rounded-full backdrop-blur-md border transition-all ${viewMode !== 'timeline' ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-black/30 border-white/20'}`} 
                            title="Change View"
                        >
                            {viewMode === 'timeline' && <LayoutList size={18} />}
                            {viewMode === 'calendar' && <CalendarIcon size={18} />}
                            {viewMode === 'budget' && <DollarSign size={18} />}
                        </button>
                        
                        <div className="relative">
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2.5 rounded-full bg-black/30 border border-white/20 backdrop-blur-md hover:bg-black/50 transition-colors">
                                {isMenuOpen ? <X size={18} /> : <MenuIcon size={18} />}
                            </button>
                            
                            {isMenuOpen && (
                                <div className="absolute top-14 right-0 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 flex flex-col gap-1 z-50 animate-in slide-in-from-top-2">
                                     <div className="md:hidden flex items-center gap-2 p-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                                        <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                                            <User size={12} className="text-indigo-600" />
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-500 truncate w-full">{user.email}</span>
                                     </div>
                                     <button onClick={() => { setModalOpen('share'); setIsMenuOpen(false); }} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 text-sm font-medium"><Share2 size={16} /> Share Trip</button>
                                     <button onClick={() => { setModalOpen('settings'); setIsMenuOpen(false); }} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 text-sm font-medium"><Settings size={16} /> Trip Settings</button>
                                     <button onClick={() => { setShowSignOutConfirm(true); setIsMenuOpen(false); }} className="flex items-center gap-3 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-red-500 text-sm font-medium"><LogOut size={16} /> Sign Out</button>
                                </div>
                            )}
                        </div>
                      </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 z-20 p-6 md:p-12 max-w-6xl mx-auto">
                    <div className="animate-in slide-in-from-bottom-5 duration-700 relative">
                        {isEditMode && (
                            <div className="absolute right-0 bottom-2">
                                <button onClick={() => setModalOpen('settings')} className="bg-black/40 backdrop-blur-md hover:bg-black/60 text-white border border-white/20 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all shadow-lg">
                                    <Camera size={14} /> Change Cover
                                </button>
                            </div>
                        )}
                        
                        <div className="flex items-center gap-3 mb-4">
                            <span className="px-3 py-1 bg-indigo-500/90 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg backdrop-blur-sm">
                                {trip.startDate}
                            </span>
                            <div className="flex -space-x-2">
                                {trip.companions?.map((c, i) => { 
                                    const name = typeof c === 'string' ? c : c.name; 
                                    const photo = typeof c === 'object' ? c.photo : null; 
                                    return (
                                        <div key={i} className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-indigo-500 flex items-center justify-center text-[10px] font-bold text-indigo-800 relative overflow-hidden" title={name}>
                                            {photo ? (<img src={photo} alt={name} className="w-full h-full object-cover" />) : (name[0])}
                                        </div>
                                    ); 
                                })}
                            </div>
                        </div>
                        
                        {isEditMode ? (
                            <input 
                                type="text" 
                                value={trip.title} 
                                onChange={(e) => updateTrip({ title: e.target.value })} 
                                className="block text-4xl md:text-6xl font-black text-white bg-white/10 rounded-xl px-2 -ml-2 border border-white/30 focus:border-white focus:outline-none w-full shadow-black drop-shadow-md mb-2 backdrop-blur-sm"
                            />
                        ) : (
                            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight drop-shadow-lg mb-2">{trip.title}</h1>
                        )}
                        
                        <div className="flex gap-4 items-center">
                            <div className="h-1 w-12 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                            <p className="text-white/90 text-lg md:text-xl font-medium drop-shadow-md">
                                {trip.days.length} Days • {trip.days.reduce((acc, d) => acc + (d.activities?.length || 0), 0)} Activities
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {viewMode === 'budget' && (<BudgetView currentUser={user} isEditMode={isEditMode} db={db} trip={trip} />)}
            
            {viewMode === 'calendar' && (<CalendarView trip={trip} onSelectDay={(idx) => { setActiveDayIdx(idx); setViewMode('timeline'); }} />)}
            
            {viewMode === 'timeline' && (
                <main className="max-w-6xl mx-auto px-4 -mt-8 relative z-30 pb-safe">
                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-2 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/50 overflow-x-auto flex gap-2 no-scrollbar mb-8 sticky top-20 z-40 mt-8">
                        {trip.days.map((day, idx) => (
                            <div key={day.id} ref={el => dayRefs.current[idx] = el} className="relative group/day">
                                <button 
                                    onClick={() => setActiveDayIdx(idx)} 
                                    className={`relative flex-shrink-0 px-5 py-2.5 rounded-xl transition-all duration-300 flex flex-col items-center min-w-[120px] ${activeDayIdx === idx ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-lg scale-105' : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
                                >
                                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Day {idx + 1}</span>
                                    <span className="text-sm font-semibold truncate max-w-[120px]">{day.date.split('-').slice(1).join('/')}</span>
                                    <WeatherDisplay date={day.date} weatherData={weatherData} isError={weatherError} isHistorical={isHistorical} />
                                </button>
                                {isEditMode && (
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteDay(idx); }} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 opacity-0 group-hover/day:opacity-100 transition-opacity z-50">
                                        <X size={10} strokeWidth={3} />
                                    </button>
                                )}
                            </div>
                        ))}
                         {isEditMode && (
                            <button onClick={handleAddDay} className="px-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center text-slate-400 hover:text-indigo-500 hover:border-indigo-500 transition-colors">
                                <Plus size={20} />
                            </button>
                        )}
                    </div>

                    <div className="flex flex-col lg:grid lg:grid-cols-[280px_1fr] gap-8 md:gap-12 animate-in fade-in duration-500">
                        <div className="space-y-6 lg:sticky lg:top-32 h-min">
                             <div className="space-y-2">
                                {isEditMode ? (
                                    <>
                                        <input 
                                            value={activeDay.title} 
                                            onChange={(e) => { const newDays = [...trip.days]; newDays[activeDayIdx].title = e.target.value; updateTrip({ days: newDays }); }} 
                                            className="text-3xl font-extrabold bg-transparent border-b border-slate-300 w-full focus:outline-none dark:text-white"
                                        />
                                        <textarea 
                                            value={activeDay.summary || ''} 
                                            onChange={(e) => { const newDays = [...trip.days]; newDays[activeDayIdx].summary = e.target.value; updateTrip({ days: newDays }); }} 
                                            className="w-full text-lg bg-transparent border border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-2 focus:outline-none focus:border-indigo-500 resize-none h-24 text-zinc-600 dark:text-slate-400" 
                                            placeholder="Add a summary for today..." 
                                        />
                                    </>
                                ) : (
                                    <>
                                        <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-white leading-tight">{activeDay.title}</h2>
                                        <p className="text-zinc-600 dark:text-slate-400 text-lg leading-relaxed">{activeDay.summary || "No summary."}</p>
                                    </>
                                )}
                            </div>
                            
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/50 overflow-hidden">
                                <button onClick={() => setIsMapOpen(!isMapOpen)} className="w-full p-4 flex items-center justify-between font-bold text-indigo-900 dark:text-indigo-100 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/30 transition-colors">
                                    <span className="flex items-center gap-2"><Map size={18} /> Day Map</span>
                                    <ChevronDown size={18} className={`transition-transform duration-300 ${isMapOpen ? 'rotate-180' : ''}`} />
                                </button>
                                <div className={`transition-all duration-500 ease-in-out ${isMapOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="p-4 pt-0">
                                        <div className="aspect-video bg-slate-200 rounded-lg overflow-hidden relative shadow-inner">
                                            {isMapOpen && (
                                                <iframe width="100%" height="100%" frameBorder="0" style={{ border: 0 }} src={`https://maps.google.com/maps?q=${encodeURIComponent(activeDay.title + " Hong Kong")}&t=&z=11&ie=UTF8&iwloc=&output=embed`} allowFullScreen></iframe>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {isEditMode && (
                                <button onClick={handleOptimizeRoute} className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 hover:scale-105 transition-transform">
                                    <Wand2 size={18} /> Optimize Order (By Time)
                                </button>
                            )}
                        </div>

                        {/* TIMELINE CONTAINER with increased left margin for mobile alignment */}
                        <div className="relative border-l-2 border-slate-300 dark:border-slate-700 ml-6 md:ml-40 space-y-8 pl-8 md:pl-10 pb-4">
                             {activeDay.activities.map((act, idx) => (
                                <div key={act.id} className={`relative group transition-all duration-300 ${isEditMode ? 'cursor-grab active:cursor-grabbing' : ''}`}>
                                    
                                    {/* TIMELINE DOT */}
                                    <div className="absolute top-6 -left-[2.5rem] md:-left-[2.1rem] w-4 h-4 rounded-full bg-indigo-500 ring-4 ring-zinc-100 dark:ring-slate-950 z-10 shadow-sm"></div>
                                    
                                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-black/50 hover:-translate-y-1 transition-all duration-300 w-full">
                                        <div className="flex flex-col sm:flex-row h-full">
                                            <div className="relative w-full h-48 sm:w-48 sm:h-auto flex-shrink-0 bg-slate-200 group/img">
                                                <img src={act.image} alt={act.title} className="w-full h-full object-cover" />
                                                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-end justify-between">
                                                    {isEditMode ? (
                                                        <input 
                                                            type="text" 
                                                            value={act.time} 
                                                            onChange={(e) => handleUpdateActivity(activeDayIdx, act.id, 'time', e.target.value)} 
                                                            className="font-black text-white text-xl leading-none bg-transparent border-b border-white/50 outline-none w-24 focus:border-indigo-400" 
                                                            placeholder="09:00"
                                                        />
                                                    ) : (
                                                        <span className="font-black text-white text-xl leading-none drop-shadow-md tracking-tight">{act.time}</span>
                                                    )}
                                                </div>
                                                {isEditMode && (
                                                    <button onClick={() => setImageEditState({ dayIdx: activeDayIdx, actId: act.id, url: act.image })} className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full backdrop-blur-md transition-opacity hover:bg-black/70 shadow-lg cursor-pointer z-20 md:opacity-0 md:group-hover/img:opacity-100">
                                                        <Camera size={16} />
                                                    </button>
                                                )}
                                            </div>
                                            
                                            <div className="p-4 flex flex-col flex-grow relative min-w-0">
                                                <div className="absolute top-4 right-4 z-10 flex gap-2">
                                                    {!isEditMode && (
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); setEmbeddedMaps(prev => ({...prev, [act.id]: !prev[act.id]})) }} 
                                                            className={`transition-colors p-2 rounded-full ${embeddedMaps[act.id] ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700'}`} 
                                                            title="Toggle Map"
                                                        >
                                                            <MapPin size={18} />
                                                        </button>
                                                    )}
                                                    {isEditMode && (
                                                        <div className="flex gap-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-lg p-1 shadow-sm border border-slate-100 dark:border-slate-800">
                                                            <GripVertical className="text-slate-300 cursor-grab" size={20} />
                                                            <button onClick={() => handleDeleteActivity(activeDayIdx, act.id)} className="text-red-400 hover:text-red-600">
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                <div className="flex-grow space-y-2 pr-6 md:pr-10">
                                                    <div className="mb-2">
                                                        {isEditMode ? (
                                                            <select 
                                                                value={act.type} 
                                                                onChange={(e) => handleUpdateActivity(activeDayIdx, act.id, 'type', e.target.value)} 
                                                                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${getTypeColor(act.type)} appearance-none cursor-pointer outline-none focus:ring-2 ring-indigo-500`}
                                                            >
                                                                {CATEGORY_ICONS.map(cat => (<option key={cat.id} value={cat.id}>{cat.label}</option>))}
                                                            </select>
                                                        ) : (
                                                            <div className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${getTypeColor(act.type)}`}>
                                                                {getTypeIcon(act.type)} {act.type}
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    {isEditMode ? (
                                                        <>
                                                            <input 
                                                                value={act.title} 
                                                                onChange={(e) => handleUpdateActivity(activeDayIdx, act.id, 'title', e.target.value)} 
                                                                className="w-full font-bold text-lg text-zinc-900 dark:text-white bg-transparent border-b border-slate-200 mb-1 focus:outline-none placeholder-slate-400" 
                                                                placeholder="Activity Title"
                                                            />
                                                            <textarea 
                                                                value={act.desc} 
                                                                onChange={(e) => handleUpdateActivity(activeDayIdx, act.id, 'desc', e.target.value)} 
                                                                className="w-full text-xs text-zinc-500 dark:text-slate-400 bg-transparent border border-dashed border-slate-300 rounded p-2 focus:outline-none focus:border-indigo-500 resize-none h-16" 
                                                                placeholder="Short description..."
                                                            />
                                                        </>
                                                    ) : (
                                                        <>
                                                            <h3 className="font-bold text-lg text-zinc-900 dark:text-white mb-1 group-hover:text-indigo-600 transition-colors truncate">{act.title}</h3>
                                                            <p className="text-xs text-zinc-500 dark:text-slate-400 line-clamp-2">{act.desc}</p>
                                                        </>
                                                    )}
                                                </div>
                                                
                                                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                                    <details className="group/details w-full">
                                                        <summary className="list-none flex items-center justify-between w-full cursor-pointer text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-wider">
                                                            <span className="flex items-center gap-1">Details & Notes <ChevronRight size={12} className="group-open/details:rotate-90 transition-transform" /></span>
                                                            <div className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                                                                {isEditMode ? (
                                                                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded p-0.5">
                                                                        <select 
                                                                            value={act.currency || 'USD'} 
                                                                            onChange={(e) => handleUpdateActivity(activeDayIdx, act.id, 'currency', e.target.value)} 
                                                                            onClick={e => e.stopPropagation()} 
                                                                            className="bg-transparent text-[10px] font-bold border-none outline-none cursor-pointer w-12"
                                                                        >
                                                                            {CURRENCY_OPTIONS.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                                                                        </select>
                                                                        <input 
                                                                            type="number" 
                                                                            placeholder="0" 
                                                                            className="w-12 bg-transparent outline-none text-right font-mono" 
                                                                            value={act.cost || ''} 
                                                                            onChange={(e) => updateActivityCost(activeDayIdx, act.id, e.target.value)} 
                                                                            onClick={e => e.preventDefault()} 
                                                                        />
                                                                    </div>
                                                                ) : (
                                                                    <span>{act.currency || '$'} {act.cost || 0}</span>
                                                                )}
                                                            </div>
                                                        </summary>
                                                        <div className="pt-2 text-sm text-zinc-600 dark:text-slate-300 leading-relaxed">
                                                            {isEditMode ? (
                                                                <textarea 
                                                                    value={act.details} 
                                                                    onChange={(e) => handleUpdateActivity(activeDayIdx, act.id, 'details', e.target.value)} 
                                                                    className="w-full h-24 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-xs focus:ring-2 focus:ring-indigo-500 outline-none resize-y" 
                                                                    placeholder="Add detailed notes, links, or reservations here..."
                                                                />
                                                            ) : (
                                                                act.details
                                                            )}
                                                        </div>
                                                        {embeddedMaps[act.id] && (
                                                            <div className="h-48 mt-3 rounded-lg overflow-hidden bg-slate-100 w-full relative z-20">
                                                                <iframe width="100%" height="100%" frameBorder="0" style={{ border: 0 }} src={`https://maps.google.com/maps?q=${encodeURIComponent(act.title)}&t=&z=15&ie=UTF8&iwloc=&output=embed`} allowFullScreen></iframe>
                                                            </div>
                                                        )}
                                                    </details>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                             ))}
                             
                             {isEditMode && (
                                <button 
                                    onClick={() => { const newDays = [...trip.days]; newDays[activeDayIdx].activities.push({ id: Math.random().toString(36), time: '12:00', title: 'New Activity', type: 'attraction', desc: 'Description', image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=600&q=80', currency: 'USD' }); updateTrip({ days: newDays }); }} 
                                    className="w-full py-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl flex flex-col items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all gap-2"
                                >
                                    <Plus size={24} /> <span className="font-bold">Add Activity</span>
                                </button>
                            )}
                        </div>
                    </div>
                </main>
            )}

            <Modal isOpen={modalOpen === 'share'} onClose={() => { setModalOpen(null); setSharedCode(null); }} title="Share Trip">
                <div className="space-y-6">
                    {sharedCode ? (
                        <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl text-center space-y-4 animate-in zoom-in">
                            <div className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 rounded-full flex items-center justify-center shadow-inner">
                                <Check size={32} />
                            </div>
                            <div>
                                <h4 className="font-black text-xl text-slate-900 dark:text-white mb-1">Trip Published!</h4>
                                <p className="text-sm text-slate-500">Share this code with friends:</p>
                            </div>
                            <div className="flex items-center gap-2 justify-center">
                                <code className="text-3xl font-mono font-black tracking-widest text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 px-6 py-3 rounded-xl border-2 border-dashed border-indigo-200 dark:border-indigo-800">
                                    {sharedCode}
                                </code>
                                <button onClick={() => { navigator.clipboard.writeText(sharedCode); alert("Copied!"); }} className="p-3 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-xl transition-colors">
                                    <Copy size={20} />
                                </button>
                            </div>
                            <p className="text-xs text-slate-400">They can use "Import" to load a copy of your trip.</p>
                        </div>
                    ) : (
                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-center">
                            <div className="mx-auto w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-3">
                                <Share2 size={24} />
                            </div>
                            <h4 className="font-bold dark:text-white">Publish to Public</h4>
                            <p className="text-sm text-slate-500 mb-4">Generates a unique 6-character code for others to import a copy of this trip.</p>
                            <button onClick={handleShareTrip} className="bg-indigo-600 text-white px-6 py-2 rounded-full font-bold text-sm shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-colors">
                                Generate Public Link
                            </button>
                        </div>
                    )}
                    
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                        <h4 className="font-bold text-sm mb-3 dark:text-white flex items-center gap-2">
                            <Download size={16}/> Import a Friend's Trip
                        </h4>
                        <p className="text-xs text-slate-500 mb-2">Enter the 6-character code shared by your friend.</p>
                        <form onSubmit={handleImportTrip} className="flex gap-2">
                            <input 
                                name="shareId" 
                                placeholder="Enter 6-digit Code (e.g. A7B2X9)" 
                                className="flex-grow bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3 outline-none font-mono text-sm uppercase placeholder:normal-case" 
                                required 
                                maxLength={6} 
                            />
                            <button type="submit" className="bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-xl font-bold text-sm hover:opacity-80 transition-opacity">
                                Import
                            </button>
                        </form>
                    </div>
                </div>
            </Modal>
            
             <Modal isOpen={modalOpen === 'settings'} onClose={() => setModalOpen(null)} title="Trip Settings">
                <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent dark:border-slate-700">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                            {isDarkMode ? <Moon size={18} className="text-indigo-400"/> : <Sun size={18} className="text-amber-500"/>} App Theme
                        </span>
                        <button 
                            onClick={() => setIsDarkMode(!isDarkMode)} 
                            className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 focus:outline-none ${isDarkMode ? 'bg-indigo-600' : 'bg-slate-300'}`}
                        >
                            <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>
                    
                    <div className="w-full h-px bg-slate-100 dark:bg-slate-800"></div>
                    
                    <section className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Trip Name</label>
                            <input 
                                type="text" 
                                value={trip.title} 
                                onChange={(e) => updateTrip({ title: e.target.value })} 
                                className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3 border-none focus:ring-2 focus:ring-indigo-500 outline-none font-bold dark:text-white"
                            />
                            <p className="text-[10px] text-slate-400">Pro tip: Type a country like "Trip to Japan" to auto-update cover photo.</p>
                        </div>
                        
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                <Globe size={12}/> Weather Location
                            </label>
                            <CustomIconSelect 
                                options={countryOptions} 
                                value={trip.weatherLocation || COUNTRY_DATA.find(c => Math.abs(c.lat - (trip.lat || 0)) < 0.1 && Math.abs(c.lon - (trip.lon || 0)) < 0.1)?.name} 
                                onChange={(val) => { 
                                    const selected = COUNTRY_DATA.find(c => c.name === val); 
                                    if(selected) { 
                                        updateTrip({ lat: selected.lat, lon: selected.lon, weatherLocation: selected.name }); 
                                    } 
                                }} 
                                placeholder="Select a location..." 
                            />
                            <p className="text-[10px] text-slate-400">Updates weather forecasts. Coordinates: {trip.lat?.toFixed(2)}, {trip.lon?.toFixed(2)}</p>
                        </div>
                        
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                <DollarSign size={12}/> Trip Currency
                            </label>
                            <CustomIconSelect 
                                options={currencySelectOptions} 
                                value={trip.currency || 'USD'} 
                                onChange={(val) => updateTrip({ currency: val })} 
                                placeholder="Select a currency..." 
                            />
                            <p className="text-[10px] text-slate-400">Sets the default currency for budgeting.</p>
                        </div>
                        
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cover Image URL</label>
                            <input 
                                type="text" 
                                value={trip.coverImage} 
                                onChange={(e) => updateTrip({ coverImage: e.target.value })} 
                                className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3 border-none focus:ring-2 focus:ring-indigo-500 outline-none text-sm dark:text-white"
                            />
                        </div>
                        
                         <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Start Date</label>
                            <input 
                                type="date" 
                                value={trip.startDate} 
                                onChange={(e) => {
                                    const newStart = e.target.value;
                                    // CRITICAL: Force UTC calculation
                                    const newDays = trip.days.map((day, idx) => {
                                        const d = createUTCDate(newStart);
                                        d.setUTCDate(d.getUTCDate() + idx);
                                        return { ...day, date: d.toISOString().split('T')[0] };
                                    });
                                    updateTrip({ startDate: newStart, days: newDays });
                                }} 
                                className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3 border-none focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Companions</label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {trip.companions.map((c, i) => { 
                                    const name = typeof c === 'string' ? c : c.name; 
                                    const photo = typeof c === 'object' ? c.photo : null; 
                                    return (
                                        <div key={i} className="flex items-center gap-2 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-sm group pr-3 border border-slate-200 dark:border-slate-700 dark:text-slate-200">
                                            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center text-[10px] font-bold">
                                                {photo ? <img src={photo} className="w-full h-full object-cover" /> : name[0]}
                                            </div>
                                            <span className="font-medium">{name}</span>
                                            <button onClick={() => updateTrip({ companions: trip.companions.filter((_, idx) => idx !== i) })} className="text-slate-400 hover:text-red-500">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ); 
                                })}
                            </div>
                            
                            <form onSubmit={handleAddCompanion} className="flex gap-2 items-center bg-slate-100 dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 w-full">
                                <label className="cursor-pointer p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors relative group flex-shrink-0">
                                    {newCompanionPhoto ? (
                                        <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-indigo-500">
                                            <img src={URL.createObjectURL(newCompanionPhoto)} className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors">
                                            <ImagePlus size={16} className="text-slate-400 group-hover:text-indigo-600 dark:text-slate-400 dark:group-hover:text-indigo-400" />
                                        </div>
                                    )}
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && setNewCompanionPhoto(e.target.files[0])}/>
                                </label>
                                <input 
                                    value={newCompanionName} 
                                    onChange={(e) => setNewCompanionName(e.target.value)} 
                                    placeholder="Add name..." 
                                    className="flex-grow min-w-0 bg-transparent border-none outline-none text-sm font-medium placeholder:text-slate-400 dark:text-white h-10" 
                                    maxLength={20}
                                />
                                <button type="submit" disabled={!newCompanionName.trim()} className="flex-shrink-0 bg-indigo-600 text-white h-9 px-4 rounded-xl text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 active:scale-95 transition-all shadow-sm shadow-indigo-500/30">
                                    Add
                                </button>
                            </form>
                        </div>
                    </section>
                </div>
              </Modal>
            
            <Modal isOpen={!!imageEditState} onClose={() => setImageEditState(null)} title="Change Activity Photo">
                <div className="space-y-4">
                    <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex items-center justify-center relative border border-slate-200 dark:border-slate-700">
                        <img src={imageEditState?.url} alt="Preview" className="w-full h-full object-cover" onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1558981806-ec527fa84c3d?auto=format&fit=crop&w=600&q=80'} />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/10">
                            <span className="bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">Preview</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Image URL</label>
                        <input 
                            value={imageEditState?.url || ''} 
                            onChange={(e) => setImageEditState(prev => ({ ...prev, url: e.target.value }))} 
                            className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3 outline-none text-sm border-none focus:ring-2 focus:ring-indigo-500 dark:text-white" 
                            placeholder="https://..."
                        />
                        <p className="text-[10px] text-slate-400">Paste a direct link to an image (ending in .jpg, .png, etc.)</p>
                    </div>
                    <div className="flex gap-2 justify-end pt-2">
                        <button onClick={() => setImageEditState(null)} className="px-4 py-2 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            Cancel
                        </button>
                        <button onClick={() => { handleUpdateActivity(imageEditState.dayIdx, imageEditState.actId, 'image', imageEditState.url); setImageEditState(null); }} className="px-6 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30">
                            Save Photo
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
      }
