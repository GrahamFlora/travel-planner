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
  History,
  Link as LinkIcon, 
  Eye,
  Banknote,
  ClipboardList, 
  CheckSquare,   
  Square,        
  Sparkles,
  ArrowUpDown,
  CalendarDays,
  ArrowRight,
  Navigation,
  Paperclip,
  FileText,
  Fingerprint
} from 'lucide-react';

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

const compressImage = async (file, maxWidth = 150, quality = 0.7) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                if (width > maxWidth) {
                    height = height * (maxWidth / width);
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};

const copyToClipboard = (text, onSuccess) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
            .then(() => { if (onSuccess) onSuccess(); else alert("Copied to clipboard!"); })
            .catch((err) => { console.warn("Clipboard API failed, trying fallback...", err); fallbackCopy(text, onSuccess); });
    } else {
        fallbackCopy(text, onSuccess);
    }
};

const fallbackCopy = (text, onSuccess) => {
    try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (successful) { if (onSuccess) onSuccess(); else alert("Copied to clipboard!"); } 
        else { prompt("Copy this link manually:", text); }
    } catch (err) {
        console.error("Fallback copy failed", err);
        prompt("Copy this link manually:", text);
    }
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

const createUTCDate = (dateStr) => {
    if(!dateStr) return new Date();
    const parts = dateStr.split('-');
    return new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
};

// --- CUSTOM UI COMPONENTS ---

const NavButton = ({ icon: Icon, label, active, onClick }) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center justify-center w-full py-2 transition-all duration-300 relative ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
    >
        <div className={`p-2 rounded-2xl transition-all duration-300 ${active ? 'bg-indigo-100 dark:bg-indigo-900/40 shadow-sm scale-110 -translate-y-1' : 'bg-transparent'}`}>
            <Icon size={24} strokeWidth={active ? 2.5 : 2} />
        </div>
        <span className={`text-[10px] font-bold mt-1 transition-all duration-300 ${active ? 'opacity-100 -translate-y-0.5' : 'opacity-70'}`}>{label}</span>
    </button>
);

const BottomNav = ({ viewMode, setViewMode }) => (
  <div className="fixed bottom-4 md:bottom-6 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-3xl z-50 flex justify-around items-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] px-2 py-1 safe-area-bottom ring-1 ring-slate-900/5 dark:ring-white/10">
     <NavButton icon={LayoutList} label="Itinerary" active={viewMode === 'timeline'} onClick={() => setViewMode('timeline')} />
     <NavButton icon={CalendarIcon} label="Calendar" active={viewMode === 'calendar'} onClick={() => setViewMode('calendar')} />
     <NavButton icon={DollarSign} label="Budget" active={viewMode === 'budget'} onClick={() => setViewMode('budget')} />
     <NavButton icon={ClipboardList} label="Packing" active={viewMode === 'checklist'} onClick={() => setViewMode('checklist')} />
  </div>
);

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
                    <span className="text-slate-500">{placeholder}</span>
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

// --- FIXED LOGO COMPONENT ---
const Logo = ({ size = "md", onClick, forceWhite = false }) => {
    const dim = size === "lg" ? "w-16 h-16" : "w-8 h-8";
    const txt = size === "lg" ? "text-3xl" : "text-xl";
    // Dynamically choose text color based on the forceWhite prop
    const textColor = forceWhite ? "text-white" : "text-slate-900 dark:text-white";
    
    return (
        <button 
            onClick={onClick} 
            className={`flex items-center gap-3 ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
        >
            <div className={`${dim} bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 transform rotate-3`}>
                <Plane className="text-white transform -rotate-3" size={size === "lg" ? 32 : 18} />
            </div>
            <span className={`font-black tracking-tight ${textColor} ${txt}`}>
                Horizon<span className="text-indigo-500 dark:text-indigo-400">Planner</span>
            </span>
        </button>
    );
};

// --- REDESIGNED LOGIN PAGE ---
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

    const handleBiometricLogin = async () => {
        if (!window.PublicKeyCredential) {
            alert("Biometrics (WebAuthn) are not supported on this browser.");
            return;
        }

        try {
            const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
            if (!available) {
                alert("No Face ID or Fingerprint sensor detected on this device.");
                return;
            }

            // Trigger the native prompt using a dummy challenge to show functionality.
            // In a real app, this challenge comes from your server.
            const challenge = new Uint8Array(32);
            window.crypto.getRandomValues(challenge);

            await navigator.credentials.get({
                publicKey: {
                    challenge: challenge,
                    rpId: window.location.hostname,
                    userVerification: "required",
                }
            });

        } catch (err) {
            // Because we don't have a registered passkey on a backend for this domain, it will fail.
            // We catch it and show a graceful explanation.
            if (err.name === 'NotAllowedError') {
                console.log("User canceled biometric prompt.");
            } else {
                alert("Passkey integration requires Firebase Authentication setup in your console. Please sign in with email/password for now.");
            }
        }
    };

    useEffect(() => {
        if(toastMsg) { 
            const timer = setTimeout(() => setToastMsg(null), 4000); 
            return () => clearTimeout(timer); 
        }
    }, [toastMsg]);

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Ambient Dark Mode Glows */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />

            {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
            
            <main className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black p-8 border border-white/10 z-10 animate-in fade-in zoom-in duration-300">
                {/* Applied forceWhite since the login screen is always dark */}
                <div className="flex justify-center mb-8"><Logo size="lg" forceWhite={true} /></div>
                
                <h2 className="text-3xl font-black text-center mb-2 text-white tracking-tight">
                    {isSignUp ? "Create Account" : "Welcome Back"}
                </h2>
                <p className="text-center text-slate-400 mb-8 text-sm">
                    {isSignUp ? "Start planning your next adventure." : "Sign in to access your trips."}
                </p>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <div className="p-3 bg-red-900/30 border border-red-500/50 text-red-400 text-xs rounded-xl flex items-center gap-2"><AlertTriangle size={14} /> {error}</div>}
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Email</label>
                        <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-white placeholder:text-slate-600" placeholder="you@example.com" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Password</label>
                        <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-white placeholder:text-slate-600" placeholder="••••••••" />
                    </div>
                    <button disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 mt-2">
                        {loading && <Loader2 className="animate-spin" size={20} />} {isSignUp ? "Sign Up" : "Sign In"}
                    </button>
                </form>

                {/* Biometric Login Integration */}
                {!isSignUp && (
                    <div className="mt-6">
                        <div className="relative flex items-center py-2">
                            <div className="flex-grow border-t border-slate-800"></div>
                            <span className="flex-shrink-0 mx-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Or</span>
                            <div className="flex-grow border-t border-slate-800"></div>
                        </div>
                        <button 
                            onClick={handleBiometricLogin} 
                            type="button" 
                            className="w-full mt-4 bg-slate-800/50 hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-sm border border-slate-700 hover:border-slate-600 transition-all active:scale-[0.98] flex justify-center items-center gap-3 group"
                        >
                            <Fingerprint size={20} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                            Sign in with Passkey / Face ID
                        </button>
                    </div>
                )}

                <div className="mt-8 text-center">
                    <button onClick={() => setIsSignUp(!isSignUp)} className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">
                        {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
                    </button>
                </div>
            </main>
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
                const startStr = startDate || new Date().toISOString().split('T')[0];
                const startObj = createUTCDate(startStr);
                const today = new Date(); 
                
                const diffTime = startObj - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                
                const isFuture = diffDays > 10;
                const isPast = diffDays < -2;
                const shouldUseHistorical = isFuture || isPast;

                let queryStart = new Date(startObj);
                if (isFuture) {
                    while (queryStart > today) { queryStart.setUTCFullYear(queryStart.getUTCFullYear() - 1); }
                    if ((today - queryStart) / (1000 * 60 * 60 * 24) < 5) { queryStart.setUTCFullYear(queryStart.getUTCFullYear() - 1); }
                }
                
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
    const todayStr = new Date().toISOString().split('T')[0];
    const isFuture = date > todayStr;
    
    let Icon = Sun;
    let tempText = "Loading...";
    let textClass = "text-slate-400";
    
    if (realWeather) {
        if (realWeather.code > 3) Icon = CloudIcon;
        if (realWeather.code > 50) Icon = CloudRain;
        tempText = `${Math.round(realWeather.min)}°/${Math.round(realWeather.max)}°`;
        textClass = "text-slate-600 dark:text-slate-400"; 
    } else {
        if (isError) { Icon = WifiOff; tempText = "Offline"; textClass = "text-red-400"; } 
        else if (Object.keys(weatherData).length === 0) { Icon = Loader2; tempText = "Fetching"; } 
        else { Icon = CalendarIcon; tempText = "--"; }
    }

    return (
        <div className={`flex items-center text-xs font-medium ${textClass} mt-1 min-h-[16px]`}>
             {isHistorical && isFuture && realWeather && <span className="mr-1 text-[8px] uppercase font-bold tracking-wider opacity-70 text-indigo-500">Est.</span>}
            <Icon size={12} className={`mr-1 ${tempText === 'Fetching' ? 'animate-spin' : ''}`} /> {tempText}
        </div>
    );
};

const Modal = ({ isOpen, onClose, title, children, maxWidth = "max-w-lg" }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full ${maxWidth} overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200`}>
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

const ConfirmationModal = ({ config, onClose }) => {
    if (!config) return null;
    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
             <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm p-6 border border-slate-200 dark:border-slate-700 animate-in zoom-in-95">
                 <div className="flex items-center gap-4 mb-4 text-red-600 dark:text-red-400">
                     <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                         <AlertTriangle size={28} />
                     </div>
                     <h3 className="font-bold text-xl text-slate-900 dark:text-white">{config.title || "Confirm Action"}</h3>
                 </div>
                 <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                     {config.message || "Are you sure you want to proceed?"}
                 </p>
                 <div className="flex gap-3 justify-end">
                     <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300">
                         Cancel
                     </button>
                     <button onClick={() => { config.onConfirm(); onClose(); }} className="px-5 py-2.5 rounded-xl font-bold bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 transition-colors">
                         Yes, Delete
                     </button>
                 </div>
             </div>
        </div>
    );
};

const ExpenseCard = ({ expense, onDelete, onEdit, onViewReceipt, isEditMode, currencyOptions, targetCurrency }) => {
    const inputCurrencyCode = expense.inputCurrencyCode || BASE_CURRENCY;
    const amountInput = expense.amountInput !== undefined ? expense.amountInput : expense.amount;
    const inputCurrencyObj = currencyOptions.find(c => c.code === inputCurrencyCode) || { symbol: '', code: inputCurrencyCode };
    const catObj = CATEGORY_ICONS.find(c => c.id === expense.category) || CATEGORY_ICONS[8];
    const Icon = catObj.icon;

    const targetRate = EXCHANGE_RATES[targetCurrency] || 1;
    const inputRate = EXCHANGE_RATES[inputCurrencyCode] || 1;
    const baseRate = EXCHANGE_RATES[BASE_CURRENCY] || 1;
    const amountInBase = amountInput / inputRate * baseRate; 
    const amountInTarget = amountInBase * (targetRate / baseRate);
    
    const showConversion = inputCurrencyCode !== targetCurrency;
    const targetCurrencyObj = currencyOptions.find(c => c.code === targetCurrency) || { symbol: targetCurrency };
    const targetSymbol = targetCurrencyObj.symbol;

    return (
        <div className={`bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex justify-between items-center transition-all hover:shadow-md`}>
            <div className="flex items-center space-x-3 min-w-0">
                <div className={`p-2 rounded-full flex-shrink-0 ${isEditMode ? 'bg-red-50 text-red-500' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                    <Icon size={18} />
                </div>
                <div className="min-w-0 flex flex-col items-start">
                    <p className="font-bold text-slate-900 dark:text-white text-sm md:text-base truncate pr-2 w-full">{expense.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-500 capitalize">{catObj.label}</span>
                        {expense.date && <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{new Date(expense.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>}
                        {expense.receipt && (
                            <button onClick={(e) => { e.stopPropagation(); onViewReceipt(expense.receipt); }} className="text-indigo-500 hover:text-indigo-600 flex items-center gap-1 text-[10px] font-bold bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded transition-colors">
                                <FileText size={10} /> Receipt
                            </button>
                        )}
                    </div>
                </div>
            </div>
            <div className="text-right flex items-center space-x-3 flex-shrink-0">
                <div className="flex flex-col items-end">
                    <p className="font-black text-lg text-slate-900 dark:text-white leading-tight">
                        {inputCurrencyObj.symbol}{Number(amountInput).toFixed(2)}
                        <span className="text-[10px] font-bold text-slate-500 ml-1">{inputCurrencyObj.code}</span>
                    </p>
                    {showConversion && (
                         <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 whitespace-nowrap">
                            ≈ {targetSymbol}{Number(amountInTarget).toFixed(2)} {targetCurrency}
                         </p>
                    )}
                </div>
                {isEditMode && (
                    <div className="flex gap-1 ml-2">
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

const AddExpenseForm = ({ onAddExpense, currencyOptions, convertToBase, initialData, targetCurrency, onCancel }) => {
    const [name, setName] = useState('');
    const [amountInput, setAmountInput] = useState('');
    const [category, setCategory] = useState('food');
    const [inputCurrencyCode, setInputCurrencyCode] = useState(BASE_CURRENCY);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [receiptImage, setReceiptImage] = useState(null); 
    const [isCompressing, setIsCompressing] = useState(false);

    useEffect(() => {
        if (initialData) {
            setName(initialData.name || '');
            setAmountInput(initialData.amountInput !== undefined ? initialData.amountInput : initialData.amount);
            setCategory(initialData.category || 'food');
            setInputCurrencyCode(initialData.inputCurrencyCode || BASE_CURRENCY);
            setDate(initialData.date || new Date().toISOString().split('T')[0]);
            setReceiptImage(initialData.receipt || null);
        }
    }, [initialData]);

    const targetRate = EXCHANGE_RATES[targetCurrency] || 1;
    const inputRate = EXCHANGE_RATES[inputCurrencyCode] || 1;
    const convertedValue = amountInput ? (Number(amountInput) / inputRate * targetRate) : 0;
    const targetSymbol = currencyOptions.find(c => c.code === targetCurrency)?.symbol || targetCurrency;

    const handleReceiptUpload = async (e) => {
        const file = e.target.files[0];
        if(!file) return;
        
        if (!file.type.startsWith('image/')) {
            alert("Please upload a valid image file.");
            e.target.value = null;
            return;
        }

        setIsCompressing(true);
        try {
            const compressed = await compressImage(file, 400, 0.5);
            setReceiptImage(compressed);
        } catch(err) {
            console.error("Image compression failed", err);
            alert("Failed to process image.");
        } finally {
            setIsCompressing(false);
            e.target.value = null;
        }
    };

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
            date,
            receipt: receiptImage
        });
        if (!initialData) { setName(''); setAmountInput(''); setReceiptImage(null); }
    };
    
    const inputCurrencySymbol = currencyOptions.find(c => c.code === inputCurrencyCode)?.symbol || '';
    const selectOptions = currencyOptions.map(c => ({ 
        value: c.code, label: c.code, icon: getFlagUrl(c.countryCode) 
    }));

    return (
        <form onSubmit={handleSubmit} className="p-4 md:p-6 bg-white dark:bg-slate-800 rounded-2xl space-y-4">
            <h3 className="text-lg font-bold dark:text-white">{initialData ? 'Edit Expense' : 'Log Expense'}</h3>
            
            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
                <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" 
                    placeholder="e.g. Dinner at Tokyo Tower" 
                    required
                />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Currency</label>
                    <CustomIconSelect 
                        options={selectOptions} 
                        value={inputCurrencyCode} 
                        onChange={setInputCurrencyCode} 
                        placeholder="Select" 
                    />
                </div>
                <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Amount</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">{inputCurrencySymbol}</span>
                        <input 
                            type="number" 
                            step="0.01" 
                            value={amountInput} 
                            onChange={(e) => setAmountInput(e.target.value)} 
                            className="w-full h-12 bg-slate-100 dark:bg-slate-700 rounded-xl pl-16 pr-24 outline-none font-mono font-bold text-lg focus:ring-2 focus:ring-indigo-500 dark:text-white" 
                            placeholder="0.00" 
                            required
                        />
                        {/* --- REAL-TIME CONVERSION BADGE --- */}
                        {amountInput && inputCurrencyCode !== targetCurrency && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-lg pointer-events-none whitespace-nowrap">
                                ≈ {targetSymbol}{convertedValue.toFixed(2)}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Date</label>
                    <input 
                        type="date" 
                        value={date} 
                        onChange={(e) => setDate(e.target.value)} 
                        className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white text-sm"
                    />
                </div>
                
                <div className="space-y-1">
                     <label className="text-xs font-bold text-slate-500 uppercase">Receipt</label>
                     <label className="w-full h-11 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group relative overflow-hidden">
                         {isCompressing ? (
                             <Loader2 size={16} className="text-indigo-500 animate-spin" />
                         ) : receiptImage ? (
                             <div className="w-full h-full relative">
                                <img src={receiptImage} alt="Receipt Preview" className="w-full h-full object-cover opacity-50" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Check size={16} className="text-emerald-500 drop-shadow-md" strokeWidth={3} />
                                </div>
                             </div>
                         ) : (
                             <div className="flex items-center gap-2 text-slate-400 group-hover:text-indigo-500">
                                 <Paperclip size={16} /> <span className="text-xs font-bold">Attach</span>
                             </div>
                         )}
                         <input type="file" accept="image/*" className="hidden" onChange={handleReceiptUpload}/>
                     </label>
                     {receiptImage && <button type="button" onClick={() => setReceiptImage(null)} className="text-[10px] text-red-500 font-bold block w-full text-right mt-1">Remove</button>}
                </div>
            </div>
            
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                <IconPicker selected={category} onSelect={setCategory} />
            </div>
            
            <div className="flex gap-3 pt-2">
                <button 
                    type="button" 
                    onClick={onCancel}
                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors hover:bg-slate-200 dark:hover:bg-slate-600"
                >
                    Cancel
                </button>
                <button 
                    type="submit" 
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-indigo-500/30"
                >
                    {initialData ? 'Update Expense' : 'Save Expense'}
                </button>
            </div>
        </form>
    );
};

// --- VIEW COMPONENTS ---

const CalendarView = ({ trip, onSelectDay }) => {
    const [selectedDayDetails, setSelectedDayDetails] = useState(null); 
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
        <main className="max-w-6xl mx-auto mt-6 px-4 pb-32 space-y-6 animate-in fade-in">
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
                                onClick={() => setSelectedDayDetails(tripDay)} 
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

             <Modal isOpen={!!selectedDayDetails} onClose={() => setSelectedDayDetails(null)} title={selectedDayDetails?.title || 'Day Details'}>
                 <div className="space-y-6">
                     <div className="text-center">
                         <h3 className="text-2xl font-black text-slate-900 dark:text-white">{selectedDayDetails?.date}</h3>
                         <p className="text-slate-500">{selectedDayDetails?.activities?.length || 0} Scheduled Activities</p>
                     </div>
                     
                     <div className="space-y-3 max-h-[50vh] overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-black/20 p-4 rounded-xl">
                         {selectedDayDetails?.activities && selectedDayDetails.activities.length > 0 ? (
                             selectedDayDetails.activities.sort((a,b) => (a.time || '').localeCompare(b.time || '')).map((act, i) => (
                                 <div key={i} className="flex gap-4 p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                                     <div className="flex flex-col items-center justify-center min-w-[3rem] border-r border-slate-100 dark:border-slate-700 pr-3">
                                         <span className="text-xs font-black text-slate-400">{act.time}</span>
                                     </div>
                                     <div>
                                         <h4 className="font-bold text-slate-900 dark:text-white leading-tight">{act.title}</h4>
                                         <p className="text-xs text-slate-500 line-clamp-1">{act.desc}</p>
                                     </div>
                                 </div>
                             ))
                         ) : (
                             <div className="text-center text-slate-400 py-8 italic">No activities planned for this day.</div>
                         )}
                     </div>
                     
                     <div className="flex gap-3 pt-2">
                        <button onClick={() => setSelectedDayDetails(null)} className="flex-1 py-3 font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-xl">Close</button>
                        <button 
                            onClick={() => {
                                onSelectDay(selectedDayDetails.idx);
                                setSelectedDayDetails(null);
                            }} 
                            className="flex-1 py-3 font-bold text-white bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 flex items-center justify-center gap-2"
                        >
                            Edit in Timeline <ArrowRight size={16} />
                        </button>
                     </div>
                 </div>
             </Modal>
        </main>
    );
};

const ChecklistView = ({ trip, updateTrip, isEditMode, requestConfirm }) => {
    const [newItemText, setNewItemText] = useState('');
    const [targetDayId, setTargetDayId] = useState('general'); 
    const [sortBy, setSortBy] = useState('grouped'); 
    const [isSortOpen, setIsSortOpen] = useState(false);
    
    const checklist = trip.checklist || [];
    
    const sortedList = useMemo(() => {
        let list = [...checklist];
        if (sortBy === 'status') { return list.sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1)); } 
        if (sortBy === 'alpha') { return list.sort((a, b) => a.text.localeCompare(b.text)); }
        return list.sort((a, b) => b.createdAt - a.createdAt);
    }, [checklist, sortBy]);
    
    const groupedItems = useMemo(() => {
        if (sortBy !== 'grouped') return null;
        const groups = { 'general': [] };
        trip.days.forEach(d => groups[d.id] = []);
        checklist.forEach(item => {
            const dId = item.dayId || 'general';
            if (!groups[dId]) groups['general'].push(item);
            else groups[dId].push(item);
        });
        return groups;
    }, [checklist, trip.days, sortBy]);

    const completedCount = checklist.filter(i => i.completed).length;
    const progress = checklist.length > 0 ? (completedCount / checklist.length) * 100 : 0;
    
    const handleAddItem = (e) => {
        e.preventDefault();
        if(!newItemText.trim()) return;
        const newItem = {
            id: Math.random().toString(36).substr(2, 9),
            text: newItemText.trim(),
            completed: false,
            createdAt: Date.now(),
            dayId: targetDayId 
        };
        updateTrip({ checklist: [...checklist, newItem] });
        setNewItemText('');
    };
    
    const handleToggleItem = (itemId) => {
        const updatedList = checklist.map(item => 
            item.id === itemId ? { ...item, completed: !item.completed } : item
        );
        updateTrip({ checklist: updatedList });
    };
    
    const handleDeleteItem = (itemId) => {
        requestConfirm("Delete Item", "Remove this item from your list?", () => {
            const updatedList = checklist.filter(item => item.id !== itemId);
            updateTrip({ checklist: updatedList });
        });
    };
    
    const renderItem = (item) => (
        <div 
            key={item.id}
            onClick={() => handleToggleItem(item.id)}
            className={`
                group flex items-start gap-3 p-3 mb-2 rounded-xl cursor-pointer transition-all duration-200 border
                ${item.completed 
                    ? 'bg-slate-100 dark:bg-slate-800/40 border-transparent' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm'
                }
            `}
        >
            <div className={`
                mt-0.5 flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors
                ${item.completed ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300 dark:border-slate-600'}
            `}>
                {item.completed && <Check size={12} className="text-white" strokeWidth={3} />}
            </div>
            
            <div className="flex-grow min-w-0">
                <p className={`text-sm font-medium leading-tight break-words ${item.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
                    {item.text}
                </p>
                {sortBy !== 'grouped' && item.dayId && item.dayId !== 'general' && (
                     <div className="flex items-center gap-1 mt-1.5">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded">
                            {trip.days.find(d => d.id === item.dayId)?.title || 'Scheduled'}
                        </span>
                    </div>
                )}
            </div>
            
            <button 
                onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }}
                className="p-2 -mr-2 -mt-2 text-slate-300 hover:text-red-500 transition-colors"
                aria-label="Delete item"
            >
                <Trash2 size={16} />
            </button>
        </div>
    );

    return (
        <main className="max-w-xl mx-auto mt-4 px-4 pb-32 animate-in fade-in"> 
             <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <ClipboardList className="text-indigo-600" size={20} />
                                Checklist
                            </h2>
                            <p className="text-xs text-slate-500">
                                {checklist.length} items • {Math.round(progress)}% done
                            </p>
                        </div>
                         <div className="flex items-center gap-2">
                             <div className="relative">
                                 <button 
                                    onClick={() => setIsSortOpen(!isSortOpen)}
                                    className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 shadow-sm"
                                 >
                                     <ArrowUpDown size={16} />
                                 </button>
                                 {isSortOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
                                         <button onClick={() => { setSortBy('grouped'); setIsSortOpen(false); }} className={`w-full text-left px-4 py-2 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-700 ${sortBy === 'grouped' ? 'text-indigo-600' : 'text-slate-700 dark:text-slate-300'}`}>By Day (Grouped)</button>
                                         <button onClick={() => { setSortBy('status'); setIsSortOpen(false); }} className={`w-full text-left px-4 py-2 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-700 ${sortBy === 'status' ? 'text-indigo-600' : 'text-slate-700 dark:text-slate-300'}`}>Status (Incomplete)</button>
                                         <button onClick={() => { setSortBy('alpha'); setIsSortOpen(false); }} className={`w-full text-left px-4 py-2 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-700 ${sortBy === 'alpha' ? 'text-indigo-600' : 'text-slate-700 dark:text-slate-300'}`}>Alphabetical (A-Z)</button>
                                    </div>
                                 )}
                             </div>
                         </div>
                    </div>
                    
                    <form onSubmit={handleAddItem} className="flex gap-2">
                         <div className="relative flex-shrink-0">
                             <select 
                                value={targetDayId}
                                onChange={(e) => setTargetDayId(e.target.value)}
                                className="h-12 pl-8 pr-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold outline-none focus:border-indigo-500 appearance-none w-[4.5rem]"
                             >
                                 <option value="general">All</option>
                                 {trip.days.map((day, idx) => (
                                     <option key={day.id} value={day.id}>D{idx+1}</option>
                                 ))}
                             </select>
                             <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                <CalendarDays size={14} />
                             </div>
                         </div>
                         
                         <input 
                            value={newItemText}
                            onChange={(e) => setNewItemText(e.target.value)}
                            placeholder="Add new item..."
                            className="flex-grow h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 text-base outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
                         />
                         
                         <button 
                            type="submit" 
                            disabled={!newItemText.trim()}
                            className="h-12 w-12 bg-indigo-600 text-white rounded-lg flex items-center justify-center shadow-sm disabled:opacity-50 disabled:bg-slate-300 flex-shrink-0"
                         >
                             <Plus size={18} strokeWidth={3} />
                         </button>
                    </form>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-black/20 min-h-[300px]">
                     {checklist.length === 0 ? (
                         <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                             <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                 <CheckSquare size={32} className="opacity-30" />
                             </div>
                             <p className="font-medium">Your list is empty.</p>
                             <p className="text-xs">Add items to keep organized.</p>
                         </div>
                     ) : (
                         <div className="space-y-4">
                             {sortBy === 'grouped' && groupedItems ? (
                                 <>
                                    {groupedItems['general'].length > 0 && (
                                        <div className="space-y-2">
                                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 flex items-center gap-1"><Star size={10}/> General Notes</h4>
                                            {groupedItems['general'].map(renderItem)}
                                        </div>
                                    )}
                                    {trip.days.map((day, idx) => {
                                        const items = groupedItems[day.id];
                                        if (!items || items.length === 0) return null;
                                        return (
                                            <div key={day.id} className="space-y-2 pt-2">
                                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 flex items-center gap-1">
                                                    <CalendarDays size={10}/> {day.title} <span className="opacity-50">• {day.date}</span>
                                                </h4>
                                                {items.map(renderItem)}
                                            </div>
                                        );
                                    })}
                                    {Object.values(groupedItems).every(arr => arr.length === 0) && <p className="text-center text-slate-400 text-sm py-4">No items found.</p>}
                                 </>
                             ) : (
                                 sortedList.map(renderItem)
                             )}
                         </div>
                     )}
                </div>
             </div>
        </main>
    );
};

const BudgetView = ({ currentUser, isEditMode, db, trip, requestConfirm }) => {
    const [expenses, setExpenses] = useState([]);
    const [targetCurrency, setTargetCurrency] = useState(trip?.currency || 'USD'); 
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null); 
    const [sortBy, setSortBy] = useState('date');
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [viewingReceipt, setViewingReceipt] = useState(null);

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

    const tripExpenses = useMemo(() => {
        return expenses.filter(e => e.tripId === trip.id || (!e.tripId && expenses.length > 0)); 
    }, [expenses, trip.id]);

    const handleSaveExpense = async (newExp) => { 
        const expenseWithId = { ...newExp, tripId: trip.id };
        let updated;
        const existingIndex = expenses.findIndex(e => e.id === newExp.id);
        if (existingIndex >= 0) { 
            updated = [...expenses]; 
            updated[existingIndex] = expenseWithId; 
        } else { 
            updated = [...expenses, expenseWithId]; 
        }
        
        const prevExpenses = expenses;
        setExpenses(updated); 
        setIsAddModalOpen(false); 
        setEditingExpense(null);
        
        try {
            await setDoc(getUserBudgetRef(currentUser.uid), { expenses: updated }, { merge: true }); 
        } catch (err) {
            console.error("Save error:", err);
            alert("Failed to save expense. The receipt image might be too large.");
            setExpenses(prevExpenses);
        }
    };

    const handleDelete = async (id) => { 
        requestConfirm("Delete Expense", "Are you sure you want to delete this expense?", async () => {
            const updated = expenses.filter(e => e.id !== id); 
            setExpenses(updated); 
            await setDoc(getUserBudgetRef(currentUser.uid), { expenses: updated }, { merge: true }); 
        });
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
    
    const totalBase = tripExpenses.reduce((acc, curr) => acc + (Number(curr.amount)||0), 0);
    const targetRate = EXCHANGE_RATES[targetCurrency] || 1;
    const baseRate = EXCHANGE_RATES[BASE_CURRENCY] || 1;
    const totalDisplay = totalBase * (targetRate / baseRate);

    // SORTING LOGIC
    const sortedExpenses = useMemo(() => {
        let sorted = [...tripExpenses];
        if (sortBy === 'amount_high') {
            sorted.sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0));
        } else if (sortBy === 'amount_low') {
            sorted.sort((a, b) => (Number(a.amount) || 0) - (Number(b.amount) || 0));
        } else if (sortBy === 'name') {
            sorted.sort((a, b) => a.name.localeCompare(b.name));
        }
        return sorted;
    }, [tripExpenses, sortBy]);

    const expensesByDate = useMemo(() => {
        if (sortBy !== 'date') return {};
        const grouped = {};
        tripExpenses.forEach(e => { 
            const d = e.date || 'Unscheduled'; 
            if (!grouped[d]) grouped[d] = []; 
            grouped[d].push(e); 
        });
        return grouped;
    }, [tripExpenses, sortBy]);

    const sortedDates = Object.keys(expensesByDate).sort();

    return (
        <main className="max-w-2xl mx-auto mt-6 px-4 pb-32 space-y-6 animate-in fade-in">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-indigo-900 dark:to-indigo-950 p-6 rounded-3xl text-white shadow-xl relative">
                <div className="relative z-10">
                    <p className="text-slate-400 text-sm font-medium mb-1">Total Trip Cost</p>
                    <h1 className="text-4xl font-black mb-6">{formatCurrency(totalDisplay, targetCurrency)}</h1>
                    <div className="flex gap-2">
                         <button onClick={() => isEditMode && setIsAddModalOpen(true)} disabled={!isEditMode} className="bg-white text-black px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-100 disabled:opacity-50">
                            <Plus size={16} /> Add Expense
                         </button>
                         <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-xl border border-white/20">
                             <span className="text-[10px] font-bold text-slate-400 uppercase">Display:</span>
                             <select value={targetCurrency} onChange={e => setTargetCurrency(e.target.value)} className="bg-transparent text-white text-sm outline-none appearance-none font-bold cursor-pointer">
                                {CURRENCY_OPTIONS.map(c => <option key={c.code} value={c.code} className="text-black">{c.code}</option>)}
                             </select>
                         </div>
                         <div className="relative">
                             <button 
                                onClick={() => setIsSortOpen(!isSortOpen)}
                                className="bg-white/10 p-2.5 rounded-xl border border-white/20 hover:bg-white/20 transition-colors"
                             >
                                 <ArrowUpDown size={18} className="text-white" />
                             </button>
                             {isSortOpen && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                                     <button onClick={() => { setSortBy('date'); setIsSortOpen(false); }} className={`w-full text-left px-4 py-2 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-700 ${sortBy === 'date' ? 'text-indigo-600' : 'text-slate-700 dark:text-slate-300'}`}>Date (Grouped)</button>
                                     <button onClick={() => { setSortBy('amount_high'); setIsSortOpen(false); }} className={`w-full text-left px-4 py-2 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-700 ${sortBy === 'amount_high' ? 'text-indigo-600' : 'text-slate-700 dark:text-slate-300'}`}>Price: High to Low</button>
                                     <button onClick={() => { setSortBy('amount_low'); setIsSortOpen(false); }} className={`w-full text-left px-4 py-2 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-700 ${sortBy === 'amount_low' ? 'text-indigo-600' : 'text-slate-700 dark:text-slate-300'}`}>Price: Low to High</button>
                                     <button onClick={() => { setSortBy('name'); setIsSortOpen(false); }} className={`w-full text-left px-4 py-2 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-700 ${sortBy === 'name' ? 'text-indigo-600' : 'text-slate-700 dark:text-slate-300'}`}>Name (A-Z)</button>
                                </div>
                             )}
                         </div>
                    </div>
                </div>
            </div>
            
            <div className="space-y-6">
                {tripExpenses.length === 0 ? ( 
                    <div className="text-center py-10 text-slate-400"><Wallet size={48} className="mx-auto mb-2 opacity-20" /><p>No expenses for this trip yet.</p></div> 
                ) : ( 
                    sortBy === 'date' ? (
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
                                                onViewReceipt={setViewingReceipt}
                                                isEditMode={isEditMode} 
                                                currencyOptions={CURRENCY_OPTIONS}
                                                targetCurrency={targetCurrency}
                                            />
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="space-y-3 animate-in slide-in-from-bottom-2">
                            {sortedExpenses.map(e => (
                                <ExpenseCard 
                                    key={e.id} 
                                    expense={e} 
                                    onDelete={handleDelete} 
                                    onEdit={handleEditStart} 
                                    onViewReceipt={setViewingReceipt}
                                    isEditMode={isEditMode} 
                                    currencyOptions={CURRENCY_OPTIONS}
                                    targetCurrency={targetCurrency}
                                />
                            ))}
                        </div>
                    )
                )}
            </div>

            <Modal isOpen={isAddModalOpen} onClose={handleCloseModal} title={editingExpense ? "Edit Expense" : "New Expense"}>
                <AddExpenseForm 
                    onAddExpense={handleSaveExpense} 
                    currencyOptions={CURRENCY_OPTIONS} 
                    convertToBase={convertToBase} 
                    initialData={editingExpense} 
                    targetCurrency={targetCurrency} 
                    onCancel={handleCloseModal}
                />
            </Modal>
            
            <Modal isOpen={!!viewingReceipt} onClose={() => setViewingReceipt(null)} title="Receipt Preview">
                <div className="flex flex-col items-center">
                    <img src={viewingReceipt} alt="Receipt" className="max-w-full rounded-lg border border-slate-200 dark:border-slate-700 shadow-md max-h-[70vh] object-contain" />
                    <button onClick={() => setViewingReceipt(null)} className="mt-4 w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        Close
                    </button>
                </div>
            </Modal>
        </main>
    );
};

// --- REDESIGNED DASHBOARD ---
const DashboardView = ({ trips, onSelectTrip, onNewTrip, onSignOut, onImportTrip, userEmail, onDeleteTrip, onShareTrip, isDarkMode, onToggleTheme }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('date_desc');

    const filteredTrips = useMemo(() => {
        let filtered = trips.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));
        return filtered.sort((a, b) => {
            if (sortBy === 'date_desc') return new Date(b.startDate) - new Date(a.startDate);
            if (sortBy === 'date_asc') return new Date(a.startDate) - new Date(b.startDate);
            if (sortBy === 'name_asc') return a.title.localeCompare(b.title);
            return 0;
        });
    }, [trips, searchQuery, sortBy]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-8 overflow-x-hidden relative selection:bg-indigo-500/30">
            {/* Ambient Background Glows */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] md:w-[800px] h-[300px] md:h-[400px] bg-indigo-500/10 dark:bg-indigo-500/15 blur-[100px] md:blur-[120px] rounded-full pointer-events-none" />

            <main className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 relative z-10">
                 {/* Header Nav */}
                 <div className="flex justify-between items-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-md px-4 py-3 md:px-6 md:py-4 rounded-3xl border border-white/20 dark:border-slate-800 shadow-sm">
                    <Logo size="md" />
                    <div className="flex items-center gap-2 md:gap-3">
                        <button onClick={onToggleTheme} className="p-2 md:p-2.5 bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700" title="Toggle Theme">
                            {isDarkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-indigo-600" />}
                        </button>
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-slate-100/50 dark:bg-slate-800/50 rounded-full border border-slate-200 dark:border-slate-700">
                            <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                <User size={12} className="md:w-[14px] md:h-[14px]" />
                            </div>
                            <span className="text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-300 max-w-[100px] md:max-w-[150px] truncate">{userEmail || 'Guest'}</span>
                        </div>
                        <button onClick={onSignOut} className="p-2 md:p-2.5 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors border border-red-100 dark:border-red-900/50">
                            <LogOut size={18} />
                        </button>
                    </div>
                 </div>
                 
                 {/* Welcome Text */}
                 <div className="space-y-2">
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                        Where to next? <span className="inline-block animate-bounce origin-bottom">✈️</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">You have {trips.length} upcoming adventures planned.</p>
                 </div>

                 {/* --- Search & Sort Controls --- */}
                 {trips.length > 0 && (
                     <div className="flex gap-2 sm:gap-4 z-10 relative pt-2 w-full">
                         <div className="relative flex-grow">
                             <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
                                 <Search size={18} className="text-slate-400 md:w-5 md:h-5" />
                             </div>
                             <input 
                                 type="text" 
                                 placeholder="Search trips..." 
                                 value={searchQuery}
                                 onChange={(e) => setSearchQuery(e.target.value)}
                                 className="w-full pl-9 md:pl-12 pr-4 py-2.5 md:py-3.5 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-xl md:rounded-2xl text-sm md:text-base text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all font-medium"
                             />
                         </div>
                         <div className="relative flex-shrink-0 w-[125px] sm:w-[150px] md:w-[180px]">
                             <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
                                 <Filter size={16} className="text-slate-400 md:w-5 md:h-5" />
                             </div>
                             <select 
                                 value={sortBy}
                                 onChange={(e) => setSortBy(e.target.value)}
                                 className="w-full appearance-none pl-9 md:pl-11 pr-8 md:pr-10 py-2.5 md:py-3.5 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-xl md:rounded-2xl text-sm md:text-base text-slate-700 dark:text-slate-300 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm cursor-pointer"
                             >
                                 <option value="date_desc">Newest</option>
                                 <option value="date_asc">Oldest</option>
                                 <option value="name_asc">A-Z</option>
                             </select>
                             <div className="absolute inset-y-0 right-0 flex items-center pr-2 md:pr-4 pointer-events-none text-slate-400">
                                 <ArrowUpDown size={14} className="md:w-4 md:h-4" />
                             </div>
                         </div>
                     </div>
                 )}

                 {/* Premium Cards Grid */}
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
                    
                    {/* New Trip Card - Premium Gradient */}
                    <button onClick={onNewTrip} className="group relative h-64 rounded-3xl overflow-hidden shadow-xl hover:shadow-indigo-500/25 transition-all duration-300 hover:-translate-y-2 bg-gradient-to-br from-indigo-500 to-purple-600 p-6 flex flex-col items-start justify-end text-white border border-white/10 text-left">
                        <div className="absolute top-6 right-6 w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform">
                            <Plus size={28} strokeWidth={2.5} />
                        </div>
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
                        <h3 className="text-3xl font-black z-10 leading-none mb-1">Plan New<br/>Trip</h3>
                        <p className="text-sm font-medium text-indigo-100 z-10">Start a blank itinerary</p>
                    </button>
                    
                    {/* Import Card - Premium Glassy Dark */}
                    <button onClick={onImportTrip} className="group relative h-64 rounded-3xl overflow-hidden shadow-xl hover:shadow-emerald-500/20 transition-all duration-300 hover:-translate-y-2 bg-slate-900 dark:bg-slate-900 border border-slate-800 p-6 flex flex-col items-start justify-end text-white text-left">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute top-6 right-6 w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:-rotate-3 transition-transform border border-slate-700 shadow-inner">
                            <Download size={28} className="text-emerald-400" strokeWidth={2.5} />
                        </div>
                        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
                        <h3 className="text-3xl font-black text-slate-100 z-10 leading-none mb-1">Import<br/>Trip</h3>
                        <p className="text-sm font-medium text-slate-400 z-10">Use a friend's share code</p>
                    </button>

                    {/* Existing Trip Cards */}
                    {filteredTrips.map(trip => (
                        <button key={trip.id} onClick={() => onSelectTrip(trip.id)} className="relative group text-left h-64 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 ring-1 ring-slate-200 dark:ring-slate-800 hover:ring-indigo-500/50">
                             <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10" />
                             <img src={trip.coverImage} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                             
                             <div className="absolute top-4 right-4 z-30 flex gap-2">
                                <div onClick={(e) => { e.stopPropagation(); onShareTrip(trip); }} className="p-2.5 bg-white/20 hover:bg-indigo-600 text-white backdrop-blur-md rounded-xl transition-colors shadow-lg cursor-pointer opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0" title="Share Trip">
                                    <Share2 size={16} />
                                </div>
                                <div onClick={(e) => { e.stopPropagation(); onDeleteTrip(trip); }} className="p-2.5 bg-white/20 hover:bg-red-600 text-white backdrop-blur-md rounded-xl transition-colors shadow-lg cursor-pointer opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0" title="Delete Trip">
                                    <Trash2 size={16} />
                                </div>
                             </div>
                             
                             <div className="absolute bottom-0 left-0 right-0 p-6 z-20 text-white transform transition-transform group-hover:-translate-y-1">
                                <h3 className="text-2xl font-black mb-1 leading-tight drop-shadow-md">{trip.title}</h3>
                                <p className="text-sm font-bold text-slate-300 flex items-center gap-1.5 drop-shadow-md"><CalendarIcon size={14}/> {trip.startDate}</p>
                             </div>
                        </button>
                    ))}

                    {/* No Results Placeholder */}
                    {trips.length > 0 && filteredTrips.length === 0 && (
                        <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-900/20">
                            <Search size={40} className="mb-3 opacity-30" />
                            <p className="font-bold text-lg">No trips match your search.</p>
                            <button onClick={() => setSearchQuery('')} className="text-indigo-500 mt-2 text-sm font-bold hover:underline">Clear search</button>
                        </div>
                    )}
                 </div>
            </main>
        </div>
    );
};

// --- MAIN APP ---
export default function TravelApp() {
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [trips, setTrips] = useState([]);
    const lastSyncedTrips = useRef("[]");
    
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
    const [confirmConfig, setConfirmConfig] = useState(null);
    const [tripToShare, setTripToShare] = useState(null);
    const [viewingAttachment, setViewingAttachment] = useState(null);

    const requestConfirm = (title, message, onConfirm) => {
        setConfirmConfig({ title, message, onConfirm });
    };

    useEffect(() => {
        const checkShareParams = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const shareId = urlParams.get('shareId');
            
            if (shareId && !user) {
                try {
                    await signInAnonymously(auth);
                    window.localStorage.setItem('pendingShareId', shareId);
                } catch (e) {
                    console.error("Auto-login failed", e);
                }
            } else if (shareId && user) {
                 window.localStorage.setItem('pendingShareId', shareId);
            }
        };
        checkShareParams();
    }, [user]);

    useEffect(() => {
        if (user && isDataLoaded) {
            const pending = window.localStorage.getItem('pendingShareId');
            if (pending) {
                setModalOpen('import');
            }
        }
    }, [user, isDataLoaded]);

    const trip = trips.find(t => t.id === currentTripId);
    
    useEffect(() => {
        let title = "HorizonPlanner";
        let desc = "Plan your dream vacation with HorizonPlanner. Manage itinerary, budget, and companions in one place.";
        
        if (view === 'dashboard') {
            title = "My Trips - HorizonPlanner";
        } else if (trip) {
            title = `${trip.title} - HorizonPlanner`;
            desc = `View the itinerary for ${trip.title}, starting ${trip.startDate}. Includes ${trip.days.length} days of activities.`;
            if (viewMode === 'budget') title = `Budget: ${trip.title}`;
            if (viewMode === 'calendar') title = `Calendar: ${trip.title}`;
        }
        document.title = title;
        
        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
            metaDescription = document.createElement('meta');
            metaDescription.name = "description";
            document.head.appendChild(metaDescription);
        }
        metaDescription.setAttribute("content", desc);
        
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
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
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
            lastSyncedTrips.current = "[]";
            setIsDataLoaded(false);
            localStorage.removeItem('currentTripId'); 
            localStorage.removeItem('view');
        }
    }, [user]);

    useEffect(() => {
        if (!user) return;
        const unsub = onSnapshot(getUserTripRef(user.uid), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const remoteTrips = data.allTrips || [];
                const remoteStr = JSON.stringify(remoteTrips);

                setTrips(prev => {
                    const prevStr = JSON.stringify(prev);
                    if (prevStr === remoteStr) return prev; // Avoid unnecessary state updates
                    lastSyncedTrips.current = remoteStr;
                    return remoteTrips;
                });
            } else {
                setDoc(getUserTripRef(user.uid), { allTrips: [] }, { merge: true });
                setTrips(prev => {
                    lastSyncedTrips.current = "[]";
                    return [];
                });
            }
            setIsDataLoaded(true);
        }, (error) => {
            console.error("Firestore sync error:", error);
        });
        return () => unsub();
    }, [user]); // Removed dynamic dependencies to stop destroying the listener on navigation
    
    useEffect(() => {
        if (view === 'trip' && currentTripId && isDataLoaded && !trips.find(t => t.id === currentTripId)) {
            setView('dashboard');
            setCurrentTripId(null);
        }
    }, [trips, currentTripId, view, isDataLoaded]);

    useEffect(() => { 
        if (dayRefs.current[activeDayIdx]) { 
            dayRefs.current[activeDayIdx].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }); 
        } 
    }, [activeDayIdx]);

    const saveTimeout = useRef(null);
    useEffect(() => {
        if (!user || !isDataLoaded) return;
        const currentStr = JSON.stringify(trips);

        // Crucial Fix: Prevent echoing data back to Firestore if it perfectly matches the last incoming sync
        if (currentStr === lastSyncedTrips.current) return;

        clearTimeout(saveTimeout.current);
        saveTimeout.current = setTimeout(() => {
            setDoc(getUserTripRef(user.uid), { allTrips: trips }, { merge: true })
                .then(() => {
                    lastSyncedTrips.current = currentStr; // Mark as successfully saved
                })
                .catch(err => console.error("Auto-save error:", err));
        }, 1000);

        return () => clearTimeout(saveTimeout.current);
    }, [trips, user, isDataLoaded]);

    const { weatherData, isError: weatherError, isHistorical } = useWeather(
        trip?.lat || 22.3193, 
        trip?.lon || 114.1694, 
        trip?.startDate, 
        trip?.days?.length || 7
    );
    
    const updateTrip = (updates) => { 
        setTrips(prev => prev.map(t => t.id === currentTripId ? { ...t, ...updates } : t)); 
    };
    
    const handleGlobalOptimize = () => {
        const newDays = trip.days.map(day => {
             const sortedActivities = [...day.activities].sort((a, b) => {
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
                return parseTime(a.time) - parseTime(b.time);
             });
             return { ...day, activities: sortedActivities };
        });
        updateTrip({ days: newDays });
        alert("All days have been sorted chronologically!");
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
            days: [{ id: 'd1', date: new Date().toISOString().split('T')[0], title: 'Day 1', activities: [] }],
            checklist: [] 
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
        requestConfirm("Delete Day", `Are you sure you want to delete Day ${idx + 1}? All activities in this day will be lost.`, () => {
            const newDays = trip.days.filter((_, i) => i !== idx); 
            updateTrip({ days: newDays }); 
            if (activeDayIdx >= newDays.length) { 
                setActiveDayIdx(newDays.length - 1); 
            } 
        });
    };
    
    const handleSignOut = async () => { 
        setShowSignOutConfirm(false); 
        try { 
            await signOut(auth); 
        } catch (error) { 
            console.error("Error signing out:", error); 
        } 
    };
    
    const executeShareTrip = async (tripToProcess) => {
        if (!tripToProcess) return;
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        try { 
            const budgetSnap = await getDoc(getUserBudgetRef(user.uid));
            let sharedExpenses = [];
            if (budgetSnap.exists()) {
                const allExpenses = budgetSnap.data().expenses || [];
                sharedExpenses = allExpenses.filter(e => e.tripId === tripToProcess.id || (!e.tripId && trips.length === 1));
            }
            const cleanTrip = JSON.parse(JSON.stringify({ ...tripToProcess, sharedExpenses })); 
            await setDoc(getSharedTripRef(code), cleanTrip); 
            setSharedCode(code); 
            setModalOpen('share_success');
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
                const sharedExpenses = data.sharedExpenses || [];
                const tripData = { ...data };
                delete tripData.sharedExpenses;
                
                const newTrip = { 
                    ...tripData, 
                    id: newTripId, 
                    title: `${data.title} (Imported)` 
                }; 
                setTrips(prev => [...prev, newTrip]); 
                
                if (sharedExpenses.length > 0) {
                     const myBudgetSnap = await getDoc(getUserBudgetRef(user.uid));
                     let myExpenses = [];
                     if (myBudgetSnap.exists()) myExpenses = myBudgetSnap.data().expenses || [];
                     const newExpenses = sharedExpenses.map(exp => ({
                         ...exp,
                         id: Math.random().toString(36).substr(2, 9), 
                         tripId: newTripId 
                     }));
                     await setDoc(getUserBudgetRef(user.uid), { 
                        expenses: [...myExpenses, ...newExpenses] 
                     }, { merge: true });
                }

                setModalOpen(null); 
                window.localStorage.removeItem('pendingShareId'); 
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
        requestConfirm("Delete Activity", "Are you sure you want to delete this activity?", () => {
            const newDays = [...trip.days]; 
            newDays[dayIdx].activities = newDays[dayIdx].activities.filter(a => a.id !== actId); 
            updateTrip({ days: newDays }); 
        });
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

    const handleMoveActivity = (sourceDayIdx, targetDayIdx, actId) => {
        if (sourceDayIdx === targetDayIdx) return;
        const newDays = [...trip.days];
        
        const sourceActivities = [...newDays[sourceDayIdx].activities];
        const actIndex = sourceActivities.findIndex(a => a.id === actId);
        if (actIndex === -1) return;

        // Remove from source day
        const [activityToMove] = sourceActivities.splice(actIndex, 1);
        newDays[sourceDayIdx] = { ...newDays[sourceDayIdx], activities: sourceActivities };

        // Add to target day
        const targetActivities = [...newDays[targetDayIdx].activities, activityToMove];
        newDays[targetDayIdx] = { ...newDays[targetDayIdx], activities: targetActivities };

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

    const handleActivityAttachmentUpload = async (dayIdx, actId, e) => {
        const file = e.target.files[0];
        if(!file) return;
        if (!file.type.startsWith('image/')) {
            alert("Please upload an image file (e.g., a screenshot of your PDF/booking).");
            e.target.value = null;
            return;
        }
        try {
            // Compress heavily to keep the document size small and fast
            const compressed = await compressImage(file, 800, 0.6);
            handleUpdateActivity(dayIdx, actId, 'attachment', compressed);
        } catch(err) {
            console.error("Image compression failed", err);
            alert("Failed to process image.");
        }
        e.target.value = null;
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
                    onShareTrip={(trip) => { setTripToShare(trip); executeShareTrip(trip); }}
                    isDarkMode={isDarkMode}
                    onToggleTheme={() => setIsDarkMode(!isDarkMode)}
                />
                <Modal isOpen={showSignOutConfirm} onClose={() => setShowSignOutConfirm(false)} title="Sign Out">
                    <div className="space-y-4">
                        <p className="text-slate-600 dark:text-slate-300">Are you sure you want to sign out?</p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setShowSignOutConfirm(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                            <button onClick={handleSignOut} className="px-4 py-2 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30">Sign Out</button>
                        </div>
                    </div>
                </Modal>
                <Modal isOpen={modalOpen === 'import'} onClose={() => setModalOpen(null)} title="Import Trip">
                    <div className="space-y-6">
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-center">
                            <div className="mx-auto w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-3">
                                <Download size={24} />
                            </div>
                            <h4 className="font-bold dark:text-white">Import a Friend's Trip</h4>
                            <p className="text-sm text-slate-500 mb-4">
                                {window.localStorage.getItem('pendingShareId') 
                                    ? "We found a share code! Click Import to view." 
                                    : "Enter the 6-character code to clone a shared itinerary."}
                            </p>
                            <form onSubmit={handleImportTrip} className="flex gap-2">
                                <input 
                                    name="shareId" 
                                    defaultValue={window.localStorage.getItem('pendingShareId') || ''}
                                    placeholder="e.g. A7B2X9" 
                                    className="flex-grow bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none font-mono text-sm uppercase placeholder:normal-case focus:border-emerald-500 dark:text-white" 
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
                <Modal isOpen={modalOpen === 'share_success'} onClose={() => { setModalOpen(null); setSharedCode(null); }} title="Trip Shared!">
                    <div className="space-y-6">
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
                                <button onClick={() => copyToClipboard(sharedCode, () => alert("Code copied!"))} className="p-3 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-xl transition-colors">
                                    <Copy size={20} />
                                </button>
                            </div>

                            <div className="pt-2">
                                <p className="text-xs text-slate-500 mb-2 font-medium">OR Share direct link (No Login Required)</p>
                                <button 
                                    onClick={() => {
                                        const url = `${window.location.origin}${window.location.pathname}?shareId=${sharedCode}`;
                                        copyToClipboard(url, () => alert("Link Copied! Friends can view without logging in."));
                                    }}
                                    className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                                >
                                    <LinkIcon size={16} /> Copy Instant Access Link
                                </button>
                            </div>
                        </div>
                    </div>
                </Modal>
            </>
        );
    }

    const activeDay = trip.days[activeDayIdx] || trip.days[0];
    
    // Day Map Route Link Generation
    const getGoogleMapsDirectionsUrl = (activities) => {
        const validActivities = activities.filter(a => a.title && a.title.trim() !== '' && a.title !== 'New Activity');
        if (validActivities.length === 0) return null;
        if (validActivities.length === 1) {
            return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(validActivities[0].title + " " + (trip.weatherLocation || ''))}`;
        }
        const origin = encodeURIComponent(validActivities[0].title + " " + (trip.weatherLocation || ''));
        const dest = encodeURIComponent(validActivities[validActivities.length - 1].title + " " + (trip.weatherLocation || ''));
        const waypoints = validActivities.slice(1, -1).map(a => encodeURIComponent(a.title + " " + (trip.weatherLocation || ''))).join('|');
        return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}${waypoints ? '&waypoints='+waypoints : ''}`;
    };
    
    const dayRouteUrl = getGoogleMapsDirectionsUrl(activeDay.activities);

    return (
        <div className="min-h-screen transition-colors duration-500 bg-zinc-100 dark:bg-slate-950 text-zinc-900 dark:text-slate-100 font-sans pb-32 overflow-x-hidden">
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
                      {/* Applied forceWhite here since it sits on top of the dark image gradient */}
                      <Logo size="sm" onClick={() => { setView('dashboard'); setCurrentTripId(null); }} forceWhite={true} />
                      
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
                        
                        <div className="relative">
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2.5 rounded-full bg-black/30 border border-white/20 backdrop-blur-md hover:bg-black/50 transition-colors">
                                {isMenuOpen ? <X size={18} /> : <MenuIcon size={18} />}
                            </button>
                            
                            {isMenuOpen && (
                                <div className="absolute top-14 right-0 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 flex flex-col gap-1 z-50 animate-in slide-in-from-top-2">
                                     <div className="md:hidden flex items-center gap-2 p-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                                        <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                                            <User size={12} className="text-indigo-600" />
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-500 truncate w-full">{user.email}</span>
                                     </div>
                                     <button onClick={() => { executeShareTrip(trip); setIsMenuOpen(false); }} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 text-sm font-medium"><Share2 size={16} /> Share Trip</button>
                                     <button onClick={() => { setModalOpen('rates'); setIsMenuOpen(false); }} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 text-sm font-medium"><Banknote size={16} /> Exchange Rates</button>
                                     <button onClick={() => { setModalOpen('settings'); setIsMenuOpen(false); }} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 text-sm font-medium"><Settings size={16} /> Trip Settings</button>
                                     <button onClick={() => { setShowSignOutConfirm(true); setIsMenuOpen(false); }} className="flex items-center gap-3 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-red-500 text-sm font-medium"><LogOut size={16} /> Sign Out</button>
                                </div>
                            )}
                        </div>
                      </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 z-20 p-6 md:p-12 max-w-6xl mx-auto">
                    <div className="animate-in slide-in-from-bottom-5 duration-700 relative">
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
                        
                        <div className="flex flex-wrap gap-4 items-center">
                            <div className="h-1 w-12 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                            <p className="text-white/90 text-lg md:text-xl font-medium drop-shadow-md">
                                {trip.days.length} Days • {trip.days.reduce((acc, d) => acc + (d.activities?.length || 0), 0)} Activities
                            </p>
                            
                            {isEditMode && (
                                <button onClick={() => setModalOpen('settings')} className="bg-black/40 backdrop-blur-md hover:bg-black/60 text-white border border-white/20 px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all shadow-lg ml-auto md:ml-4">
                                    <Camera size={14} /> Change Cover
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <BottomNav viewMode={viewMode} setViewMode={setViewMode} />
            <ConfirmationModal config={confirmConfig} onClose={() => setConfirmConfig(null)} />

            {viewMode === 'budget' && (<BudgetView currentUser={user} isEditMode={isEditMode} db={db} trip={trip} requestConfirm={requestConfirm} />)}
            
            {viewMode === 'calendar' && (<CalendarView trip={trip} onSelectDay={(idx) => { setActiveDayIdx(idx); setViewMode('timeline'); }} />)}
            
            {viewMode === 'checklist' && (<ChecklistView trip={trip} updateTrip={updateTrip} isEditMode={isEditMode} requestConfirm={requestConfirm} />)}
            
            {viewMode === 'timeline' && (
                <main className="max-w-6xl mx-auto px-4 -mt-8 relative z-30 pb-20">
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
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDeleteDay(idx); }} 
                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1.5 shadow-md hover:bg-red-600 z-50 transition-transform active:scale-95"
                                    >
                                        <X size={12} strokeWidth={3} />
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
                            
                            {/* --- REVAMPED ROUTE MAP --- */}
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/50 overflow-hidden">
                                <button onClick={() => setIsMapOpen(!isMapOpen)} className="w-full p-4 flex items-center justify-between font-bold text-indigo-900 dark:text-indigo-100 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/30 transition-colors">
                                    <span className="flex items-center gap-2"><Map size={18} /> Itinerary Route</span>
                                    <ChevronDown size={18} className={`transition-transform duration-300 ${isMapOpen ? 'rotate-180' : ''}`} />
                                </button>
                                <div className={`transition-all duration-500 ease-in-out ${isMapOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="p-4 pt-0 space-y-4">
                                        <div className="bg-white dark:bg-slate-800 rounded-xl p-3 shadow-inner border border-slate-100 dark:border-slate-700 max-h-48 overflow-y-auto custom-scrollbar">
                                            {activeDay.activities.filter(a=>a.title).map((act, index, arr) => (
                                                <div key={act.id} className="flex items-start gap-3 relative pb-4 last:pb-0">
                                                    {index !== arr.length - 1 && <div className="absolute left-2.5 top-5 bottom-0 w-0.5 bg-indigo-200 dark:bg-indigo-800/50"></div>}
                                                    <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 border-2 border-indigo-500 flex items-center justify-center flex-shrink-0 z-10 mt-0.5">
                                                        <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-300">{index + 1}</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{act.title}</p>
                                                        <p className="text-[10px] text-slate-500">{act.time}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {activeDay.activities.length === 0 && <p className="text-xs text-slate-400 italic">Add activities to generate a route.</p>}
                                        </div>
                                        
                                        {dayRouteUrl ? (
                                             <a 
                                                href={dayRouteUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-500/30 active:scale-95 block text-center text-sm"
                                            >
                                                <Navigation size={16} /> Open Route in Google Maps
                                            </a>
                                        ) : (
                                            <div className="w-full py-3 bg-slate-200 dark:bg-slate-700 text-slate-400 font-bold rounded-xl text-center text-sm">
                                                No locations to route
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            {isEditMode && (
                                <button onClick={handleOptimizeRoute} className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 hover:scale-105 transition-transform">
                                    <Wand2 size={18} /> Optimize Order (By Time)
                                </button>
                            )}
                        </div>

                        <div className="space-y-6">
                             {activeDay.activities.map((act, idx) => (
                                <div key={act.id} className={`relative group transition-all duration-300 ${isEditMode ? 'cursor-grab active:cursor-grabbing' : ''}`}>
                                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-black/50 hover:-translate-y-1 transition-all duration-300 w-full">
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
                                            
                                            <div className="p-4 md:p-5 flex flex-col flex-grow relative min-w-0">
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
                                                        <div className="flex gap-1 items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-lg p-1 shadow-sm border border-slate-100 dark:border-slate-800">
                                                            <div className="relative flex items-center">
                                                                <select
                                                                    value={activeDayIdx}
                                                                    onChange={(e) => handleMoveActivity(activeDayIdx, Number(e.target.value), act.id)}
                                                                    className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-md outline-none cursor-pointer py-1.5 pl-2.5 pr-7 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors appearance-none"
                                                                    title="Move Activity to Day"
                                                                >
                                                                    {trip.days.map((d, i) => (
                                                                        <option key={d.id} value={i} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium">
                                                                            Move to Day {i + 1}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                <ChevronDown size={14} className="absolute right-2 pointer-events-none text-slate-400 dark:text-slate-500" />
                                                            </div>
                                                            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5"></div>
                                                            <GripVertical className="text-slate-300 cursor-grab" size={16} />
                                                            <button onClick={() => handleDeleteActivity(activeDayIdx, act.id)} className="text-red-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                <div className="flex-grow space-y-2 pr-12 md:pr-16">
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
                                                            <h3 className="font-bold text-lg md:text-xl text-zinc-900 dark:text-white mb-1 group-hover:text-indigo-600 transition-colors truncate">{act.title}</h3>
                                                            <p className="text-sm text-zinc-500 dark:text-slate-400 line-clamp-2">{act.desc}</p>
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
                                                                    <span className="bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded">{act.currency || '$'} {act.cost || 0}</span>
                                                                )}
                                                            </div>
                                                        </summary>
                                                        <div className="pt-3 text-sm text-zinc-600 dark:text-slate-300 leading-relaxed">
                                                            {isEditMode ? (
                                                                <div className="space-y-3">
                                                                    <textarea 
                                                                        value={act.details} 
                                                                        onChange={(e) => handleUpdateActivity(activeDayIdx, act.id, 'details', e.target.value)} 
                                                                        className="w-full h-24 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-y" 
                                                                        placeholder="Add detailed notes, links, or reservations here..."
                                                                    />
                                                                    <div className="flex flex-wrap items-center gap-3">
                                                                        <label className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg cursor-pointer transition-colors text-xs font-bold text-slate-600 dark:text-slate-300">
                                                                            <Paperclip size={14} /> {act.attachment ? 'Change Attachment' : 'Attach Booking/Image'}
                                                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleActivityAttachmentUpload(activeDayIdx, act.id, e)} />
                                                                        </label>
                                                                        {act.attachment && (
                                                                            <button onClick={(e) => { e.preventDefault(); handleUpdateActivity(activeDayIdx, act.id, 'attachment', null); }} className="text-red-500 hover:text-red-600 text-xs font-bold px-2 py-2">Remove</button>
                                                                        )}
                                                                    </div>
                                                                    {act.attachment && (
                                                                        <div className="mt-2 w-32 h-32 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800">
                                                                            <img src={act.attachment} className="w-full h-full object-cover opacity-80" alt="Attachment Preview" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-3">
                                                                    <p className="whitespace-pre-wrap">{act.details}</p>
                                                                    {act.attachment && (
                                                                         <button onClick={(e) => { e.preventDefault(); setViewingAttachment(act.attachment); }} className="flex items-center gap-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors w-fit border border-indigo-100 dark:border-indigo-800/50 shadow-sm">
                                                                             <FileText size={14} /> View Attachment
                                                                         </button>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {embeddedMaps[act.id] && (
                                                            <div className="h-48 mt-3 rounded-xl overflow-hidden bg-slate-100 w-full relative z-20 border border-slate-200 dark:border-slate-700 shadow-inner">
                                                                <iframe width="100%" height="100%" frameBorder="0" style={{ border: 0 }} src={`https://maps.google.com/maps?q=${encodeURIComponent(act.title + " " + (trip.weatherLocation || ''))}&t=&z=15&ie=UTF8&iwloc=&output=embed`} allowFullScreen></iframe>
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

            <Modal isOpen={modalOpen === 'share_success'} onClose={() => { setModalOpen(null); setSharedCode(null); }} title="Trip Shared!">
                <div className="space-y-6">
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
                            <button onClick={() => copyToClipboard(sharedCode, () => alert("Code copied!"))} className="p-3 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-xl transition-colors">
                                <Copy size={20} />
                            </button>
                        </div>

                        <div className="pt-2">
                            <p className="text-xs text-slate-500 mb-2 font-medium">OR Share direct link (No Login Required)</p>
                            <button 
                                onClick={() => {
                                    const url = `${window.location.origin}${window.location.pathname}?shareId=${sharedCode}`;
                                    copyToClipboard(url, () => alert("Link Copied! Friends can view without logging in."));
                                }}
                                className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                            >
                                <LinkIcon size={16} /> Copy Instant Access Link
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
            
            <Modal isOpen={modalOpen === 'rates'} onClose={() => setModalOpen(null)} title="Exchange Rates">
                <div className="space-y-4">
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl text-center">
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            Reference rates used for automatic budget conversions.
                            <br/>
                            <span className="font-bold text-slate-700 dark:text-slate-300">Base Currency: 1.00 USD ($)</span>
                        </p>
                    </div>
                    
                    <div className="grid gap-2 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                        {CURRENCY_OPTIONS.map((c) => (
                            <div key={c.code} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-indigo-200 dark:hover:border-indigo-900 transition-colors">
                                <div className="flex items-center gap-3">
                                    <img src={getFlagUrl(c.countryCode)} alt={c.code} className="w-8 h-6 object-cover rounded shadow-sm" />
                                    <div>
                                        <div className="flex items-center gap-1">
                                            <span className="font-bold text-slate-900 dark:text-white">{c.code}</span>
                                            <span className="text-xs text-slate-400 font-mono">({c.symbol})</span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{c.name}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-lg">
                                        {EXCHANGE_RATES[c.code]?.toFixed(2) || '-'}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-medium">per 1 USD</p>
                                </div>
                            </div>
                        ))}
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

                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                        <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-3">Quick Actions</h4>
                        <button 
                            onClick={handleGlobalOptimize} 
                            className="w-full py-2.5 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-bold rounded-lg shadow-sm text-sm flex items-center justify-center gap-2 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors"
                        >
                            <Wand2 size={16} /> Sort All Days by Time
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
            
            <Modal isOpen={!!viewingAttachment} onClose={() => setViewingAttachment(null)} title="Attachment Preview">
                <div className="flex flex-col items-center">
                    <img src={viewingAttachment} alt="Attachment" className="max-w-full rounded-lg border border-slate-200 dark:border-slate-700 shadow-md max-h-[70vh] object-contain bg-slate-100 dark:bg-slate-900" />
                    <button onClick={() => setViewingAttachment(null)} className="mt-4 w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        Close
                    </button>
                </div>
            </Modal>
        </div>
    );
}
