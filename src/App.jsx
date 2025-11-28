import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, MapPin, GripVertical, Plus, 
  Trash2, X, Moon, Sun, Cloud as CloudIcon, CloudDrizzle, 
  Settings, Wallet, TrendingUp, TrendingDown, Lock, Unlock,
  ChevronRight, Map, List, Filter, Camera, ChevronDown, Landmark,
  AlertTriangle, Check, Loader2, Plane, ShoppingBag, Coffee, Star, 
  DollarSign, BarChart3, User, LogOut, Share2, Download, CloudRain,
  Utensils, Bed, Bus, Tag, Music, Gift, Zap, Home, ArrowLeft, Copy,
  Globe, Search, Menu as MenuIcon, LayoutGrid, MoreVertical, LayoutList,
  Wand2
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
    getFirestore, doc, setDoc, getDoc, onSnapshot, collection, 
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

// Use global variable for appId if available (Robust pattern)
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- 1. OFFLINE PERSISTENCE SETUP ---
try {
    enableIndexedDbPersistence(db).catch((err) => {
        if (err.code == 'failed-precondition') {
            console.warn("Offline persistence failed: Multiple tabs open");
        } else if (err.code == 'unimplemented') {
            console.warn("Offline persistence not supported by browser");
        }
    });
} catch (e) {
    console.warn("Persistence initialization error:", e);
}

// --- FIRESTORE PATH HELPERS ---
const getUserTripRef = (userId) => doc(db, 'artifacts', appId, 'users', userId, 'trip', 'data');
const getUserBudgetRef = (userId) => doc(db, 'artifacts', appId, 'users', userId, 'budget', 'data');
const getSharedTripRef = (shareCode) => doc(db, 'artifacts', appId, 'public', 'data', 'shared_trips', shareCode);

// --- GLOBAL HELPERS ---
const EXCHANGE_RATES = {
    USD: 1.0, PHP: 58.75, HKD: 7.83, EUR: 0.92, JPY: 155.0, GBP: 0.80, MOP: 8.01,
    SGD: 1.35, THB: 36.5, KRW: 1380, CNY: 7.23, AUD: 1.52, CAD: 1.37
};

// Updated Currency Options
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

// Pre-defined Countries
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

const getFlagUrl = (code) => `https://flagcdn.com/w40/${code.toLowerCase()}.png`;

const formatCurrency = (amount, currencyCode) => {
    const currency = CURRENCY_OPTIONS.find(c => c.code === currencyCode) || { symbol: currencyCode };
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
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

// --- CUSTOM SELECT COMPONENT ---
const CustomIconSelect = ({ options, value, onChange, placeholder, renderOption, renderValue }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Close on click outside
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
                {selectedOption ? (renderValue ? renderValue(selectedOption) : selectedOption.label) : <span className="text-slate-400">{placeholder}</span>}
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
                            {renderOption ? renderOption(opt) : opt.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- WEATHER HOOK ---
const useWeather = (lat, lon) => {
    const [weatherData, setWeatherData] = useState({});
    useEffect(() => {
        if (!lat || !lon) return;

        const fetchWeather = async () => {
            try {
                // Implementing exponential backoff for API call
                let response = null;
                let attempts = 0;
                const maxAttempts = 5;
                let delay = 1000;
                
                while (attempts < maxAttempts) {
                    try {
                        response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min&current_weather=true&timezone=auto`);
                        if (response.ok) break;
                    } catch (e) {
                        // Network error, proceed to retry
                    }

                    attempts++;
                    if (attempts < maxAttempts) {
                        await new Promise(resolve => setTimeout(resolve, delay));
                        delay *= 2; // Exponential increase
                    }
                }

                if (!response || !response.ok) throw new Error("Weather API failed after retries.");


                const data = await response.json();
                const weatherMap = {};
                if (data.daily) {
                    data.daily.time.forEach((time, index) => {
                        weatherMap[time] = {
                            max: data.daily.temperature_2m_max[index],
                            min: data.daily.temperature_2m_min[index],
                            code: data.daily.weathercode[index]
                        };
                    });
                }
                setWeatherData(weatherMap);
            } catch (error) { console.error("Weather fetch failed", error); }
        };
        fetchWeather();
    }, [lat, lon]);
    return weatherData;
};

const WeatherDisplay = ({ date, weatherData }) => {
    const realWeather = weatherData[date];
    let Icon = Sun;
    let tempText = "TBD";
    
    if (realWeather) {
        if (realWeather.code > 3) Icon = CloudIcon;
        if (realWeather.code > 50) Icon = CloudRain;
        tempText = `${Math.round(realWeather.min)}°/${Math.round(realWeather.max)}°`;
    } else {
        const d = new Date(date).getDate();
        if (d % 2 === 0) { Icon = Sun; tempText = "20°/25°"; }
        else { Icon = CloudDrizzle; tempText = "19°/24°"; }
    }

    return (
        <div className="flex items-center text-xs font-medium text-slate-400 mt-1">
            <Icon size={12} className="mr-1" /> {tempText}
        </div>
    );
};

// --- COMPONENTS ---

const Toast = ({ message, onClose }) => (
  <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl z-[80] animate-in fade-in slide-in-from-top-4 flex items-center gap-3 border border-slate-700">
    <div className="bg-emerald-500 rounded-full p-1 text-black"><Check size={12} strokeWidth={4} /></div>
    <span className="font-bold text-sm">{message}</span>
  </div>
);

const Logo = ({ size = "md", onClick }) => {
    const dim = size === "lg" ? "w-16 h-16" : "w-8 h-8";
    const txt = size === "lg" ? "text-3xl" : "text-xl";
    return (
        <button onClick={onClick} className={`flex items-center gap-3 ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}>
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
                await signOut(auth); // Sign out immediately to force login flow as requested
                setToastMsg("Sign up successful! You can now sign in.");
                setIsSignUp(false); // Switch to login view
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
                
                <h2 className="text-2xl font-bold text-center mb-2 text-slate-900 dark:text-white">
                    {isSignUp ? "Create your account" : "Welcome back"}
                </h2>
                <p className="text-center text-slate-500 dark:text-slate-400 mb-8 text-sm">
                    {isSignUp ? "Start planning your next adventure." : "Enter your details to access your trips."}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 text-xs rounded-xl flex items-center gap-2">
                            <AlertTriangle size={14} /> {error}
                        </div>
                    )}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase">Email</label>
                        <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white" placeholder="you@example.com" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase">Password</label>
                        <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white" placeholder="••••••••" />
                    </div>
                    
                    <button disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2">
                        {loading && <Loader2 className="animate-spin" size={20} />}
                        {isSignUp ? "Sign Up" : "Sign In"}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button onClick={() => setIsSignUp(!isSignUp)} className="text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors">
                        {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- ICON PICKER & SHARED COMPONENTS ---
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

const IconPicker = ({ selected, onSelect }) => (
    <div className="grid grid-cols-5 gap-2">
        {CATEGORY_ICONS.map(({ id, icon: Icon, label }) => (
            <button key={id} type="button" onClick={() => onSelect(id)} className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${selected === id ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
                <Icon size={20} />
                <span className="text-[10px] mt-1 font-medium truncate w-full text-center">{label}</span>
            </button>
        ))}
    </div>
);

const Modal = ({ isOpen, onClose, title, children, maxWidth = "max-w-lg" }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full ${maxWidth} overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200`}>
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar">{children}</div>
      </div>
    </div>
  );
};

const ExpenseCard = ({ expense, onDelete, isEditMode, currencyOptions }) => {
    const inputCurrencyCode = expense.inputCurrencyCode || BASE_CURRENCY;
    const amountInput = expense.amountInput !== undefined ? expense.amountInput : expense.amount;
    const inputCurrencyObj = currencyOptions.find(c => c.code === inputCurrencyCode) || { symbol: '', code: inputCurrencyCode };
    const catObj = CATEGORY_ICONS.find(c => c.id === expense.category) || CATEGORY_ICONS[8];
    const Icon = catObj.icon;

    return (
        <div className={`bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex justify-between items-center transition-all hover:shadow-md`}>
            <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${isEditMode ? 'bg-red-50 text-red-500' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}><Icon size={18} /></div>
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
                {isEditMode && <button onClick={(e) => { e.stopPropagation(); onDelete(expense.id); }} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>}
            </div>
        </div>
    );
};

const AddExpenseForm = ({ onAddExpense, currencyOptions, convertToBase }) => {
    const [name, setName] = useState('');
    const [amountInput, setAmountInput] = useState('');
    const [category, setCategory] = useState('food');
    const [inputCurrencyCode, setInputCurrencyCode] = useState(BASE_CURRENCY);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name || !amountInput) return;
        const amountBase = convertToBase(Number(amountInput), inputCurrencyCode);
        onAddExpense({
            id: Math.random().toString(36).substr(2, 9),
            name,
            amount: amountBase, amountInput: Number(amountInput), inputCurrencyCode,
            category, type: 'expense', date
        });
        setName(''); setAmountInput('');
    };
    const inputCurrencySymbol = currencyOptions.find(c => c.code === inputCurrencyCode)?.symbol || '';

    // Prepare options for CustomSelect
    const selectOptions = currencyOptions.map(c => ({
        value: c.code,
        label: c.code,
        icon: getFlagUrl(c.countryCode)
    }));

    return (
        <form onSubmit={handleSubmit} className="p-4 md:p-6 bg-white dark:bg-slate-800 rounded-2xl space-y-4">
            <h3 className="text-lg font-bold dark:text-white">Log Expense</h3>
            <div className="space-y-1"><label className="text-xs font-bold text-slate-400 uppercase">Description</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 outline-none" placeholder="e.g. Dinner" required/></div>
            
            <div className="grid grid-cols-3 gap-3">
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Currency</label>
                    <CustomIconSelect 
                        options={selectOptions}
                        value={inputCurrencyCode}
                        onChange={setInputCurrencyCode}
                        placeholder="Select"
                        renderValue={(opt) => (
                            <div className="flex items-center gap-2 justify-center w-full">
                                <img src={opt.icon} alt="" className="w-5 h-3.5 object-cover rounded-sm shadow-sm" />
                                <span className="font-bold">{opt.label}</span>
                            </div>
                        )}
                        renderOption={(opt) => (
                            <div className="flex items-center gap-3">
                                <img src={opt.icon} alt="" className="w-6 h-4 object-cover rounded-sm shadow-sm" />
                                <span className="font-bold">{opt.label}</span>
                            </div>
                        )}
                    />
                </div>
                <div className="space-y-1 col-span-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">Amount</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">{inputCurrencySymbol}</span>
                        <input type="number" step="0.01" value={amountInput} onChange={(e) => setAmountInput(e.target.value)} className="w-full h-12 bg-slate-100 dark:bg-slate-700 rounded-xl pl-14 pr-4 outline-none font-mono font-bold text-lg" placeholder="0.00" required/>
                    </div>
                </div>
            </div>
            
            <div className="space-y-1"><label className="text-xs font-bold text-slate-400 uppercase">Date</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 outline-none"/></div>
            <div className="space-y-2"><label className="text-xs font-bold text-slate-400 uppercase">Category</label><IconPicker selected={category} onSelect={setCategory} /></div>
            <button type="submit" className="w-full bg-black dark:bg-white text-white dark:text-black font-bold py-3 rounded-xl mt-2 active:scale-95 transition-transform">Save Expense</button>
        </form>
    );
};

// --- CALENDAR VIEW COMPONENT ---
const CalendarView = ({ trip, onSelectDay }) => {
    const startDate = new Date(trip.startDate);
    const year = startDate.getFullYear();
    const month = startDate.getMonth();
    
    // Get number of days in the month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday
    
    const days = [];
    // Add empty placeholders for days before start of month
    for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(null);
    }
    // Add actual days
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(new Date(year, month, i));
    }

    // Map trip days to dates for highlighting
    const tripDayMap = {};
    trip.days.forEach((d, idx) => {
        tripDayMap[d.date] = { ...d, idx };
    });

    return (
        <div className="max-w-4xl mx-auto mt-6 px-4 pb-20 space-y-6 animate-in fade-in">
             <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                        {startDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                    </h2>
                    <div className="flex gap-2">
                        <span className="text-xs font-bold px-2 py-1 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">Trip Days</span>
                    </div>
                </div>
                
                <div className="grid grid-cols-7 gap-2 md:gap-4 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider">{d}</div>
                    ))}
                </div>
                
                <div className="grid grid-cols-7 gap-2 md:gap-4">
                    {days.map((date, i) => {
                        if (!date) return <div key={`empty-${i}`} className="aspect-square"></div>;
                        
                        const dateStr = date.toISOString().split('T')[0];
                        const tripDay = tripDayMap[dateStr];
                        const isToday = new Date().toISOString().split('T')[0] === dateStr;
                        
                        return (
                            <button 
                                key={dateStr}
                                onClick={() => tripDay && onSelectDay(tripDay.idx)}
                                disabled={!tripDay}
                                className={`
                                    aspect-square rounded-xl p-2 relative flex flex-col items-center justify-start text-sm transition-all
                                    ${tripDay 
                                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 hover:scale-105 cursor-pointer shadow-sm border border-indigo-100 dark:border-indigo-800' 
                                        : 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 opacity-50 cursor-default'
                                    }
                                    ${isToday ? 'ring-2 ring-emerald-500' : ''}
                                `}
                            >
                                <span className={`font-bold ${tripDay ? 'text-lg' : ''}`}>{date.getDate()}</span>
                                {tripDay && (
                                    <div className="mt-1 w-full flex flex-col gap-0.5 items-center">
                                        <span className="text-[10px] font-bold uppercase opacity-70 hidden md:block">Day {tripDay.idx + 1}</span>
                                        <div className="flex gap-0.5 justify-center flex-wrap">
                                            {tripDay.activities?.slice(0, 3).map((_, idx) => (
                                                <div key={idx} className="w-1 h-1 rounded-full bg-indigo-400"></div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
             </div>
        </div>
    );
};

const BudgetView = ({ currentUser, isEditMode, db, trip }) => {
    const [expenses, setExpenses] = useState([]);
    const [targetCurrency, setTargetCurrency] = useState('HKD');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    useEffect(() => {
        if(!currentUser) return;
        const unsub = onSnapshot(getUserBudgetRef(currentUser.uid), (snap) => {
            if(snap.exists()) setExpenses(snap.data().expenses || []);
        });
        return () => unsub();
    }, [currentUser]);

    const handleAdd = async (newExp) => { const updated = [...expenses, newExp]; setExpenses(updated); setIsAddModalOpen(false); await setDoc(getUserBudgetRef(currentUser.uid), { expenses: updated }, { merge: true }); };
    const handleDelete = async (id) => { const updated = expenses.filter(e => e.id !== id); setExpenses(updated); await setDoc(getUserBudgetRef(currentUser.uid), { expenses: updated }, { merge: true }); };
    const convertToBase = (amt, code) => (amt / (EXCHANGE_RATES[code] || 1)) * EXCHANGE_RATES[BASE_CURRENCY];
    
    // Calculations
    const totalBase = expenses.reduce((acc, curr) => acc + (Number(curr.amount)||0), 0);
    const targetRate = EXCHANGE_RATES[targetCurrency] || 1;
    const baseRate = EXCHANGE_RATES[BASE_CURRENCY] || 1;
    const totalDisplay = totalBase * (targetRate / baseRate);

    // Grouping by Date
    const expensesByDate = useMemo(() => {
        const grouped = {};
        expenses.forEach(e => {
            const d = e.date || 'Unscheduled';
            if (!grouped[d]) grouped[d] = [];
            grouped[d].push(e);
        });
        return grouped;
    }, [expenses]);

    const sortedDates = Object.keys(expensesByDate).sort();
    
    // Custom select options for main display
    const currencySelectOptions = CURRENCY_OPTIONS.map(c => ({ value: c.code, label: c.code, icon: getFlagUrl(c.countryCode) }));


    return (
        <div className="max-w-2xl mx-auto mt-6 px-4 pb-20 space-y-6 animate-in fade-in">
            {/* Grand Total Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-indigo-900 dark:to-indigo-950 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                    <p className="text-slate-400 text-sm font-medium mb-1">Total Trip Cost</p>
                    <h1 className="text-4xl font-black mb-6">{formatCurrency(totalDisplay, targetCurrency)}</h1>
                    <div className="flex gap-2">
                         <button onClick={() => isEditMode && setIsAddModalOpen(true)} disabled={!isEditMode} className="bg-white text-black px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-100 disabled:opacity-50"><Plus size={16} /> Add Expense</button>
                         {/* Simple select for view only since it's cleaner on header */}
                         <select value={targetCurrency} onChange={e => setTargetCurrency(e.target.value)} className="bg-white/10 text-white border border-white/20 px-3 py-2 rounded-xl text-sm outline-none appearance-none font-bold">
                            {CURRENCY_OPTIONS.map(c => <option key={c.code} value={c.code} className="text-black">{c.code}</option>)}
                         </select>
                    </div>
                </div>
            </div>

            {/* Expenses List Grouped by Date */}
            <div className="space-y-6">
                {expenses.length === 0 ? ( 
                    <div className="text-center py-10 text-slate-400"><Wallet size={48} className="mx-auto mb-2 opacity-20" /><p>No expenses yet.</p></div> 
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
                                        <ExpenseCard key={e.id} expense={e} onDelete={handleDelete} isEditMode={isEditMode} currencyOptions={CURRENCY_OPTIONS} />
                                    ))}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
            
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="New Expense"><AddExpenseForm onAddExpense={handleAdd} currencyOptions={CURRENCY_OPTIONS} convertToBase={convertToBase} /></Modal>
        </div>
    );
};

// --- DASHBOARD VIEW (NEW) ---
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
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 max-w-[100px] truncate">
                                {userEmail || 'Guest'}
                            </span>
                        </div>
                        <button onClick={onSignOut} className="p-2.5 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-colors"><LogOut size={20} /></button>
                    </div>
                 </div>

                 <div className="grid md:grid-cols-2 gap-6">
                    {trips.map(trip => (
                        <button key={trip.id} onClick={() => onSelectTrip(trip.id)} className="relative group text-left h-48 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
                             <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors z-10" />
                             <img src={trip.coverImage} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                             
                             {/* DELETE BUTTON - ADDED & MOBILE OPTIMIZED (Always visible on mobile/edit mode) */}
                             <div className="absolute top-3 right-3 z-30 opacity-100 transition-opacity">
                                <div 
                                    onClick={(e) => { e.stopPropagation(); onDeleteTrip(trip); }}
                                    className="p-2 bg-black/40 hover:bg-red-600 text-white backdrop-blur-md rounded-full transition-colors shadow-lg cursor-pointer md:opacity-0 md:group-hover:opacity-100"
                                    title="Delete Trip"
                                >
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
                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><Plus size={24} /></div>
                        <span className="font-bold">Plan New Trip</span>
                    </button>

                     <button onClick={onImportTrip} className="flex flex-col items-center justify-center h-48 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-400 hover:border-emerald-500 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all group">
                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><Download size={24} /></div>
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
    const [currentTripId, setCurrentTripId] = useState(null);
    const [view, setView] = useState('dashboard'); // 'dashboard' | 'trip'
    const [activeDayIdx, setActiveDayIdx] = useState(0);
    const [isEditMode, setIsEditMode] = useState(false);
    const [viewMode, setViewMode] = useState('timeline'); // 'timeline' | 'budget' | 'calendar'
    const [modalOpen, setModalOpen] = useState(null);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [embeddedMaps, setEmbeddedMaps] = useState({});
    const [isMapOpen, setIsMapOpen] = useState(false); // Map sidebar toggle
    const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
    const [imageEditState, setImageEditState] = useState(null); // { dayIdx, actId, url }
    const [sharedCode, setSharedCode] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    // NEW STATES
    const [isDataLoaded, setIsDataLoaded] = useState(false); 
    const [tripToDelete, setTripToDelete] = useState(null);
    
    // 4. SCROLL INTO VIEW REFS
    const dayRefs = useRef([]);

    // --- MANDATORY AUTH PATTERN & DATA FETCHING ---
    useEffect(() => {
        const initAuth = async () => {
            let signedIn = false;

            if (initialAuthToken) {
                try {
                    await signInWithCustomToken(auth, initialAuthToken);
                    signedIn = true;
                } catch (err) {
                    // Log the error but proceed to fallback
                    console.error("Custom token auth failed:", err);
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

    // RESET STATE ON LOGOUT/USER CHANGE TO PREVENT UI LEAKS (FIX FOR BUG #1)
    useEffect(() => {
        if (!user) {
            setShowSignOutConfirm(false);
            setModalOpen(null);
            setView('dashboard');
            setIsEditMode(false);
            setImageEditState(null);
            setTripToDelete(null); // Clear delete modal
            // Trips will be cleared by the snapshot listener returning nothing or unmounting
            setTrips([]);
            setIsDataLoaded(false);
        }
    }, [user]);

    useEffect(() => {
        if (!user) return;
        const unsub = onSnapshot(getUserTripRef(user.uid), (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setTrips(data.allTrips || []);
                // If we are in trip view, ensure current ID is valid or fallback
                if (view === 'trip' && !data.allTrips.find(t => t.id === currentTripId)) {
                   setView('dashboard');
                }
            } else {
                // Initialize EMPTY trip list for new users (FIX FOR BUG #1 PART 2)
                setDoc(getUserTripRef(user.uid), { allTrips: [], currentTripId: null });
            }
            setIsDataLoaded(true); // Mark data as loaded to enable saves
        });
        return () => unsub();
    }, [user, view, currentTripId]);
    
    // 4. AUTO-SCROLL SIDEBAR LOGIC
    useEffect(() => {
        if (dayRefs.current[activeDayIdx]) {
            dayRefs.current[activeDayIdx].scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center'
            });
        }
    }, [activeDayIdx]);

    const saveTimeout = useRef(null);
    useEffect(() => {
        // Updated guard to prevent saving empty state before data load
        if (!user || !isDataLoaded) return;
        
        clearTimeout(saveTimeout.current);
        saveTimeout.current = setTimeout(() => {
            setDoc(getUserTripRef(user.uid), { allTrips: trips, currentTripId }, { merge: true });
        }, 1000);
    }, [trips, currentTripId, user, isDataLoaded]);

    const trip = trips.find(t => t.id === currentTripId);
    
    // WEATHER LOGIC UPDATE: Use Trip Coordinates
    const weatherData = useWeather(trip?.lat || 22.3193, trip?.lon || 114.1694);

    const updateTrip = (updates) => { setTrips(prev => prev.map(t => t.id === currentTripId ? { ...t, ...updates } : t)); };
    
    // Actions
    const handleSelectTrip = (id) => { setCurrentTripId(id); setView('trip'); setActiveDayIdx(0); };
    const handleNewTrip = () => {
        const newTrip = { 
            id: Math.random().toString(36).substr(2, 9), 
            title: 'New Trip', 
            startDate: new Date().toISOString().split('T')[0], 
            coverImage: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=2000&q=80',
            companions: [], 
            lat: 22.3193, // Default HK
            lon: 114.1694, // Default HK
            days: [{ id: 'd1', date: new Date().toISOString().split('T')[0], title: 'Day 1', activities: [] }] 
        };
        setTrips(prev => [...prev, newTrip]);
    };

    const handleDeleteTripConfirm = async () => {
        if (!tripToDelete) return;
        const newTrips = trips.filter(t => t.id !== tripToDelete.id);
        setTrips(newTrips);
        setTripToDelete(null);
        // Auto-save useEffect will handle the persistence
    };

    const handleDeleteDay = (idx) => {
        if (trip.days.length <= 1) return alert("You must have at least one day.");
        if (confirm(`Delete Day ${idx + 1}?`)) {
            const newDays = trip.days.filter((_, i) => i !== idx);
            updateTrip({ days: newDays });
            if (activeDayIdx >= newDays.length) setActiveDayIdx(newDays.length - 1);
        }
    };

    const handleSignOut = async () => {
        setShowSignOutConfirm(false); // Close modal first
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };
    
    // --- UPDATED SHARE LOGIC ---
    const handleShareTrip = async () => {
        if (!trip) return;
        // Generate a random 6-character code
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        try {
            // Data sanitization to avoid serialization errors which can sometimes trigger weird firestore errors
            const cleanTrip = JSON.parse(JSON.stringify(trip));
            await setDoc(getSharedTripRef(code), cleanTrip);
            setSharedCode(code);
        } catch (error) {
            console.error("Share Error:", error);
            if (error.code === 'permission-denied') {
                alert("Permission Error: Please check your Firestore Security Rules in the Firebase Console. You need to allow writes to the 'public' collection for authenticated users.");
            } else {
                alert(`Error sharing trip: ${error.message}`);
            }
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
                const newTrip = { 
                    ...data, 
                    id: Math.random().toString(36).substr(2, 9), 
                    title: `${data.title} (Imported)` 
                };
                setTrips(prev => [...prev, newTrip]);
                setModalOpen(null);
                alert("Trip Imported Successfully!");
            } else {
                alert("Trip not found! Check the code.");
            }
        } catch (error) {
            console.error("Import Error:", error);
             if (error.code === 'permission-denied') {
                alert("Unable to import due to security settings.");
            } else {
                alert("Failed to import.");
            }
        }
    };
    
    // Activity Helpers
    const handleDeleteActivity = (dayIdx, actId) => {
        const newDays = [...trip.days];
        newDays[dayIdx].activities = newDays[dayIdx].activities.filter(a => a.id !== actId);
        updateTrip({ days: newDays });
    };
     const updateActivityCost = (dayIdx, actId, val) => {
        const newDays = [...trip.days];
        const day = newDays[dayIdx];
        const actIndex = day.activities.findIndex(a => a.id === actId);
        if (actIndex > -1) { day.activities[actIndex].cost = val; updateTrip({ days: newDays }); }
    };
    const handleUpdateActivity = (dayIdx, actId, field, value) => {
        const newDays = [...trip.days];
        const actIdx = newDays[dayIdx].activities.findIndex(a => a.id === actId);
        if (actIdx === -1) return;
        newDays[dayIdx].activities[actIdx] = { ...newDays[dayIdx].activities[actIdx], [field]: value };
        updateTrip({ days: newDays });
    };
    
    // 3. OPTIMIZE ROUTE (SORT BY TIME)
    const handleOptimizeRoute = () => {
        const newDays = [...trip.days];
        const currentActivities = [...newDays[activeDayIdx].activities];
        
        // Helper to parse time string like "09:00", "9:00 AM", "14:00 - 15:00"
        const parseTime = (timeStr) => {
            if(!timeStr) return 9999; // Push undefined times to end
            // Extract the first valid time found
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
    
    // Dashboard View
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
                            <div className="mx-auto w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3"><Download size={24} /></div>
                            <h4 className="font-bold dark:text-white">Import a Friend's Trip</h4>
                            <p className="text-sm text-slate-500 mb-4">Enter the 6-character code to clone a shared itinerary.</p>
                            <form onSubmit={handleImportTrip} className="flex gap-2">
                                <input name="shareId" placeholder="e.g. A7B2X9" className="flex-grow bg-white dark:bg-slate-800 rounded-xl px-4 py-3 outline-none font-mono text-sm uppercase placeholder:normal-case" required maxLength={6} />
                                <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/30 hover:bg-emerald-700 transition-colors">Import</button>
                            </form>
                        </div>
                    </div>
                </Modal>

                <Modal isOpen={!!tripToDelete} onClose={() => setTripToDelete(null)} title="Delete Trip">
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl text-red-700 dark:text-red-300">
                             <div className="p-3 bg-red-100 dark:bg-red-900/40 rounded-full"><AlertTriangle size={24} /></div>
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

    // Prepare options for Settings CustomSelect
    const countryOptions = COUNTRY_DATA.map(c => ({
        value: c.name,
        label: c.name,
        icon: getFlagUrl(c.countryCode)
    }));

    return (
        <div className={`min-h-screen transition-colors duration-500 ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-zinc-100 text-zinc-900'} font-sans pb-20 overflow-x-hidden`}>
            
             {/* --- HERO SECTION --- */}
            <div className="relative h-[40vh] md:h-[50vh] w-full group">
                <div className="absolute inset-0 overflow-hidden rounded-b-3xl">
                      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-zinc-100 dark:to-slate-950 z-10" />
                      <img src={trip.coverImage} alt="Trip Cover" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1558980394-4c7c9299fe96?auto=format&fit=crop&w=2000&q=80'} />
                </div>
                
                {/* Navbar (UNCLUTTERED & RESPONSIVE) */}
                <div className="absolute top-0 left-0 right-0 z-50 flex justify-between items-center p-6 text-white">
                      <Logo size="sm" onClick={() => setView('dashboard')} />
                      
                      <div className="flex gap-2 relative">
                        {/* Always visible icons */}
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-black/30 backdrop-blur-md rounded-full border border-white/10 mr-2">
                            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                                <User size={12} className="text-white" />
                            </div>
                            <span className="text-[10px] font-bold text-white max-w-[100px] truncate">
                                {user.email || 'Guest'}
                            </span>
                        </div>
                        
                        {/* EDIT MODE TOGGLE */}
                        <button onClick={() => setIsEditMode(!isEditMode)} className={`p-2.5 rounded-full backdrop-blur-md border transition-all ${isEditMode ? 'bg-amber-400 text-amber-900 border-amber-300' : 'bg-black/30 border-white/20'}`} title="Toggle Edit Mode">{isEditMode ? <Unlock size={18} /> : <Lock size={18} />}</button>
                        
                        {/* VIEW MODE TOGGLE (Timeline -> Calendar -> Budget) */}
                        <button onClick={toggleViewMode} className={`p-2.5 rounded-full backdrop-blur-md border transition-all ${viewMode !== 'timeline' ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-black/30 border-white/20'}`} title="Change View">
                            {viewMode === 'timeline' && <LayoutList size={18} />}
                            {viewMode === 'calendar' && <CalendarIcon size={18} />}
                            {viewMode === 'budget' && <DollarSign size={18} />}
                        </button>

                        {/* UNIFIED MENU DROPDOWN (Replaces individual icons) */}
                        <div className="relative">
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2.5 rounded-full bg-black/30 border border-white/20 backdrop-blur-md hover:bg-black/50 transition-colors">
                                {isMenuOpen ? <X size={18} /> : <MenuIcon size={18} />}
                            </button>
                            
                            {/* MENU DROPDOWN LIST */}
                            {isMenuOpen && (
                                <div className="absolute top-14 right-0 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 flex flex-col gap-1 z-50 animate-in slide-in-from-top-2">
                                     {/* Mobile User Info (Only show on mobile) */}
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
                {/* Title Block */}
                <div className="absolute bottom-0 left-0 right-0 z-20 p-6 md:p-12 max-w-6xl mx-auto">
                    <div className="animate-in slide-in-from-bottom-5 duration-700 relative">
                        {isEditMode && (
                            <div className="absolute right-0 bottom-2">
                                <button onClick={() => setModalOpen('settings')} className="bg-black/40 backdrop-blur-md hover:bg-black/60 text-white border border-white/20 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all shadow-lg"><Camera size={14} /> Change Cover</button>
                            </div>
                        )}
                        <div className="flex items-center gap-3 mb-4">
                            <span className="px-3 py-1 bg-indigo-500/90 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg backdrop-blur-sm">{trip.startDate}</span>
                            <div className="flex -space-x-2">
                                {trip.companions?.map((c, i) => (
                                    <div key={i} className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-indigo-500 flex items-center justify-center text-[10px] font-bold text-indigo-800" title={c}>{c[0]}</div>
                                ))}
                            </div>
                        </div>
                        {isEditMode ? (
                             <input type="text" value={trip.title} onChange={(e) => updateTrip({ title: e.target.value })} className="block text-4xl md:text-6xl font-black text-white bg-white/10 rounded-xl px-2 -ml-2 border border-white/30 focus:border-white focus:outline-none w-full shadow-black drop-shadow-md mb-2 backdrop-blur-sm"/>
                        ) : (
                            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight drop-shadow-lg mb-2">{trip.title}</h1>
                        )}
                        <div className="flex gap-4 items-center">
                            <div className="h-1 w-12 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                            <p className="text-white/90 text-lg md:text-xl font-medium drop-shadow-md">{trip.days.length} Days • {trip.days.reduce((acc, d) => acc + (d.activities?.length || 0), 0)} Activities</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- MAIN CONTENT --- */}
            {viewMode === 'budget' && (
                <BudgetView currentUser={user} isEditMode={isEditMode} db={db} trip={trip} />
            )}
            
            {viewMode === 'calendar' && (
                <CalendarView 
                    trip={trip} 
                    onSelectDay={(idx) => { setActiveDayIdx(idx); setViewMode('timeline'); }} 
                />
            )}
            
            {viewMode === 'timeline' && (
                <main className="max-w-6xl mx-auto px-4 -mt-8 relative z-30">
                    
                    {/* Day Selector - MOVED DOWN (mt-8) & INCREASED STICKY TOP (top-20) */}
                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-2 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/50 overflow-x-auto flex gap-2 no-scrollbar mb-8 sticky top-20 z-40 mt-8">
                        {trip.days.map((day, idx) => (
                            <div key={day.id} ref={el => dayRefs.current[idx] = el} className="relative group/day">
                                <button onClick={() => setActiveDayIdx(idx)} className={`relative flex-shrink-0 px-5 py-2.5 rounded-xl transition-all duration-300 flex flex-col items-center min-w-[120px] ${activeDayIdx === idx ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-lg scale-105' : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Day {idx + 1}</span>
                                    <span className="text-sm font-semibold truncate max-w-[120px]">{day.date.split('-').slice(1).join('/')}</span>
                                    <WeatherDisplay date={day.date} weatherData={weatherData} />
                                </button>
                                {isEditMode && (
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteDay(idx); }} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 opacity-0 group-hover/day:opacity-100 transition-opacity z-50">
                                        <X size={10} strokeWidth={3} />
                                    </button>
                                )}
                            </div>
                        ))}
                         {isEditMode && (
                            <button onClick={() => updateTrip({ days: [...trip.days, { id: Math.random().toString(36), date: '2026-01-01', title: 'New Day', activities: [] }] })} className="px-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center text-slate-400 hover:text-indigo-500 hover:border-indigo-500 transition-colors"><Plus size={20} /></button>
                        )}
                    </div>

                    <div className="grid lg:grid-cols-[280px_1fr] gap-8 md:gap-12 animate-in fade-in duration-500">
                         {/* Day Info Sidebar */}
                        <div className="space-y-6 lg:sticky lg:top-32 h-min">
                             <div className="space-y-2">
                                {isEditMode ? (
                                    <input value={activeDay.title} onChange={(e) => { const newDays = [...trip.days]; newDays[activeDayIdx].title = e.target.value; updateTrip({ days: newDays }); }} className="text-3xl font-extrabold bg-transparent border-b border-slate-300 w-full focus:outline-none dark:text-white"/>
                                ) : (
                                    <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-white leading-tight">{activeDay.title}</h2>
                                )}
                                <p className="text-zinc-600 dark:text-slate-400 text-lg leading-relaxed">{activeDay.summary || "No summary."}</p>
                            </div>
                            
                            {/* Collapsible Day Map */}
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

                            {/* OPTIMIZE BUTTON - Only in Edit Mode */}
                            {isEditMode && (
                                <button onClick={handleOptimizeRoute} className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 hover:scale-105 transition-transform">
                                    <Wand2 size={18} /> Optimize Order (By Time)
                                </button>
                            )}
                        </div>

                        {/* Activity Cards with Visual Timeline - DARKENED BORDER */}
                        <div className="relative border-l-2 border-slate-300 dark:border-slate-700 ml-6 md:ml-40 space-y-8 pl-8 md:pl-10 pb-4">
                             {activeDay.activities.map((act, idx) => (
                                <div key={act.id} className={`relative group transition-all duration-300 ${isEditMode ? 'cursor-grab active:cursor-grabbing' : ''}`}>
                                    
                                    {/* TIMELINE DOT */}
                                    <div className="absolute top-5 -left-10 md:-left-12 w-4 h-4 rounded-full bg-indigo-500 ring-4 ring-zinc-100 dark:ring-slate-950 z-10 shadow-sm"></div>

                                    {/* TIME COLUMN (Desktop: LEFT SIDE, Mobile: HIDDEN) */}
                                    <div className="hidden md:flex flex-col items-end absolute -left-40 top-5 w-32 text-right pr-4">
                                        {/* EDITABLE TIME */}
                                        {isEditMode ? (
                                             <input 
                                                type="text" 
                                                value={act.time} 
                                                onChange={(e) => handleUpdateActivity(activeDayIdx, act.id, 'time', e.target.value)}
                                                className="font-extrabold text-zinc-800 dark:text-white text-sm leading-tight bg-transparent border-b border-slate-300 outline-none w-full text-right"
                                                placeholder="09:00"
                                            />
                                        ) : (
                                            <span className="font-extrabold text-zinc-800 dark:text-white text-sm leading-tight">{act.time}</span>
                                        )}
                                    </div>
                                    
                                    {/* CARD CONTENT */}
                                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-black/50 hover:-translate-y-1 transition-all duration-300 w-full">
                                        <div className="flex flex-col sm:flex-row h-full">
                                            <div className="relative w-full h-40 sm:w-40 sm:h-auto flex-shrink-0 bg-slate-200 group/img">
                                                <img src={act.image} alt={act.title} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent sm:hidden"></div>
                                                {/* Mobile-only time display inside image */}
                                                <div className="absolute bottom-3 left-3 text-white font-bold sm:hidden text-lg drop-shadow-md md:hidden">{act.time}</div>
                                                
                                                {/* MOBILE FIX: Camera is ALWAYS visible in Edit Mode */}
                                                {isEditMode && (
                                                    <button 
                                                        onClick={() => setImageEditState({ dayIdx: activeDayIdx, actId: act.id, url: act.image })} 
                                                        className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full backdrop-blur-md transition-opacity hover:bg-black/70 shadow-lg cursor-pointer z-20 md:opacity-0 md:group-hover/img:opacity-100"
                                                    >
                                                        <Camera size={16} />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="p-4 flex flex-col flex-grow relative min-w-0">
                                                
                                                {/* MAP ICON TO TOP RIGHT ABSOLUTE POSITION */}
                                                <div className="absolute top-4 right-4 z-10 flex gap-2">
                                                    {!isEditMode && (
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation(); // Prevent detail expansion
                                                                setEmbeddedMaps(prev => ({...prev, [act.id]: !prev[act.id]}))
                                                            }} 
                                                            className={`transition-colors p-2 rounded-full ${embeddedMaps[act.id] ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700'}`} 
                                                            title="Toggle Map"
                                                        >
                                                            <MapPin size={18} />
                                                        </button>
                                                    )}
                                                    {isEditMode && (
                                                        <div className="flex gap-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-lg p-1 shadow-sm border border-slate-100 dark:border-slate-800">
                                                            <GripVertical className="text-slate-300 cursor-grab" size={20} />
                                                            <button onClick={() => handleDeleteActivity(activeDayIdx, act.id)} className="text-red-400 hover:text-red-600"><Trash2 size={18} /></button>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-grow space-y-2 pr-12">
                                                    
                                                     {/* 1. TYPE ICON (Now at top left) */}
                                                    <div className="mb-2">
                                                        {isEditMode ? (
                                                            <select 
                                                                value={act.type} 
                                                                onChange={(e) => handleUpdateActivity(activeDayIdx, act.id, 'type', e.target.value)} 
                                                                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${getTypeColor(act.type)} appearance-none cursor-pointer outline-none focus:ring-2 ring-indigo-500`}
                                                            >
                                                                {CATEGORY_ICONS.map(cat => (
                                                                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                                                                ))}
                                                            </select>
                                                        ) : (
                                                            <div className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${getTypeColor(act.type)}`}>
                                                                {getTypeIcon(act.type)} {act.type}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {isEditMode ? (
                                                        <>
                                                            <input value={act.title} onChange={(e) => handleUpdateActivity(activeDayIdx, act.id, 'title', e.target.value)} className="w-full font-bold text-lg text-zinc-900 dark:text-white bg-transparent border-b border-slate-200 mb-1 focus:outline-none placeholder-slate-400" placeholder="Activity Title"/>
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
                                                                        {/* CURRENCY SELECTOR */}
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
                                <button onClick={() => { const newDays = [...trip.days]; newDays[activeDayIdx].activities.push({ id: Math.random().toString(36), time: '12:00', title: 'New Activity', type: 'attraction', desc: 'Description', image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=600&q=80', currency: 'USD' }); updateTrip({ days: newDays }); }} className="w-full py-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl flex flex-col items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all gap-2">
                                    <Plus size={24} /> <span className="font-bold">Add Activity</span>
                                </button>
                             )}
                        </div>
                    </div>
                </main>
            )}

            <Modal isOpen={modalOpen === 'share'} onClose={() => { setModalOpen(null); setSharedCode(null); }} title="Share Trip">
                {/* ... existing share modal code ... */}
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
                            <div className="mx-auto w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-3"><Share2 size={24} /></div>
                            <h4 className="font-bold dark:text-white">Publish to Public</h4>
                            <p className="text-sm text-slate-500 mb-4">Generates a unique 6-character code for others to import a copy of this trip.</p>
                            <button onClick={handleShareTrip} className="bg-indigo-600 text-white px-6 py-2 rounded-full font-bold text-sm shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-colors">Generate Public Link</button>
                        </div>
                    )}

                    <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                        <h4 className="font-bold text-sm mb-3 dark:text-white flex items-center gap-2"><Download size={16}/> Import a Friend's Trip</h4>
                        <p className="text-xs text-slate-500 mb-2">Enter the 6-character code shared by your friend.</p>
                        <form onSubmit={handleImportTrip} className="flex gap-2">
                            <input name="shareId" placeholder="Enter 6-digit Code (e.g. A7B2X9)" className="flex-grow bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3 outline-none font-mono text-sm uppercase placeholder:normal-case" required maxLength={6} />
                            <button type="submit" className="bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-xl font-bold text-sm hover:opacity-80 transition-opacity">Import</button>
                        </form>
                    </div>
                </div>
            </Modal>
             <Modal isOpen={modalOpen === 'settings'} onClose={() => setModalOpen(null)} title="Trip Settings">
                {/* ... existing settings modal code ... */}
                <div className="space-y-6">
                    <section className="space-y-4">
                        {/* Title Input */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Trip Name</label>
                            <input type="text" value={trip.title} onChange={(e) => updateTrip({ title: e.target.value })} className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3 border-none focus:ring-2 focus:ring-indigo-500 outline-none font-bold"/>
                        </div>
                        
                        {/* Weather Location Selector with Images */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Globe size={12}/> Weather Location</label>
                            <CustomIconSelect
                                options={countryOptions}
                                value={COUNTRY_DATA.find(c => Math.abs(c.lat - (trip.lat || 0)) < 0.1 && Math.abs(c.lon - (trip.lon || 0)) < 0.1)?.name}
                                onChange={(val) => {
                                    const selected = COUNTRY_DATA.find(c => c.name === val);
                                    if(selected) updateTrip({ lat: selected.lat, lon: selected.lon });
                                }}
                                placeholder="Select a location..."
                                renderValue={(opt) => (
                                    <div className="flex items-center gap-2">
                                        <img src={opt.icon} alt="" className="w-5 h-3.5 object-cover rounded-sm shadow-sm" />
                                        <span className="font-medium text-sm">{opt.label}</span>
                                    </div>
                                )}
                                renderOption={(opt) => (
                                    <div className="flex items-center gap-3">
                                        <img src={opt.icon} alt="" className="w-6 h-4 object-cover rounded-sm shadow-sm" />
                                        <span className="font-medium text-sm">{opt.label}</span>
                                    </div>
                                )}
                            />
                            <p className="text-[10px] text-slate-400">Updates weather forecasts. Coordinates: {trip.lat?.toFixed(2)}, {trip.lon?.toFixed(2)}</p>
                        </div>

                        <div className="space-y-1"><label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cover Image URL</label><input type="text" value={trip.coverImage} onChange={(e) => updateTrip({ coverImage: e.target.value })} className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3 border-none focus:ring-2 focus:ring-indigo-500 outline-none text-sm"/></div>
                         <div className="space-y-1"><label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Start Date</label><input type="date" value={trip.startDate} onChange={(e) => updateTrip({ startDate: e.target.value })} className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3 border-none focus:ring-2 focus:ring-indigo-500 outline-none"/></div>
                        <div className="space-y-2"><label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Companions</label><div className="flex flex-wrap gap-2">{trip.companions.map((c, i) => (<span key={i} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-sm flex items-center gap-1 group">{c}<button onClick={() => updateTrip({ companions: trip.companions.filter((_, idx) => idx !== i) })} className="text-slate-400 hover:text-red-500"><X size={12} /></button></span>))}</div><form onSubmit={(e) => { e.preventDefault(); if (e.target.name.value) { updateTrip({ companions: [...trip.companions, e.target.name.value] }); e.target.name.value = ''; } }} className="flex gap-2"><input name="name" placeholder="Add person..." className="flex-grow bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-2 border-none focus:ring-2 focus:ring-indigo-500 outline-none text-sm" /><button type="submit" className="bg-indigo-600 text-white px-4 rounded-xl text-sm font-bold">Add</button></form></div>
                        
                        {/* DARK MODE TOGGLE (Moved Here) */}
                        <div className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-xl">
                            <span className="text-sm font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2"><Moon size={16}/> Dark Mode</span>
                            <button 
                                onClick={() => setIsDarkMode(!isDarkMode)} 
                                className={`w-12 h-6 rounded-full p-1 transition-colors ${isDarkMode ? 'bg-indigo-600' : 'bg-slate-300'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </section>
                </div>
              </Modal>
             <Modal isOpen={showSignOutConfirm} onClose={() => setShowSignOutConfirm(false)} title="Sign Out">
                <div className="space-y-4">
                    <p className="text-slate-600 dark:text-slate-300">Are you sure you want to sign out?</p>
                    <div className="flex gap-3 justify-end">
                        <button onClick={() => setShowSignOutConfirm(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                        <button onClick={() => signOut(auth)} className="px-4 py-2 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors">Sign Out</button>
                    </div>
                </div>
            </Modal>
            
            {/* --- IMAGE EDIT MODAL --- */}
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
                         <button onClick={() => setImageEditState(null)} className="px-4 py-2 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                         <button onClick={() => {
                             handleUpdateActivity(imageEditState.dayIdx, imageEditState.actId, 'image', imageEditState.url);
                             setImageEditState(null);
                         }} className="px-6 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30">Save Photo</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
