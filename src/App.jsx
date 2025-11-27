import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, MapPin, GripVertical, Plus, 
  Trash2, X, Moon, Sun, Cloud as CloudIcon, CloudDrizzle, 
  Settings, Wallet, TrendingUp, TrendingDown, Lock, Unlock,
  ChevronRight, Map, List, Filter, Camera, ChevronDown, Landmark,
  AlertTriangle, Check, Loader2, Plane, ShoppingBag, Coffee, Star, 
  DollarSign, BarChart3, User, LogOut, Share2, Download, CloudRain,
  Utensils, Bed, Bus, Tag, Music, Gift, Zap, Home, ArrowLeft, Copy
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
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection } from "firebase/firestore";

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

// --- FIRESTORE PATH HELPERS ---
// Using strict path construction to avoid permission errors
const getUserTripRef = (userId) => doc(db, 'artifacts', appId, 'users', userId, 'trip', 'data');
const getUserBudgetRef = (userId) => doc(db, 'artifacts', appId, 'users', userId, 'budget', 'data');

// New: Shared trips go into a specific 'shared_trips' collection in public data
const getSharedTripRef = (shareCode) => doc(db, 'artifacts', appId, 'public', 'data', 'shared_trips', shareCode);

// --- GLOBAL HELPERS ---
const EXCHANGE_RATES = {
    USD: 1.0, PHP: 58.75, HKD: 7.83, EUR: 0.92, JPY: 155.0, GBP: 0.80, MOP: 8.01
};
const CURRENCY_OPTIONS = [
    { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
    { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'MOP', name: 'Macau Pataca', symbol: 'MOP$' },
];
const BASE_CURRENCY = 'HKD'; 

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
    case 'food': return 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800/50';
    case 'travel': return 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/50';
    case 'shopping': return 'bg-pink-50 text-pink-600 border-pink-200 dark:bg-pink-900/20 dark:text-pink-300 dark:border-pink-800/50';
    case 'attraction': return 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800/50';
    default: return 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  }
};
const getTypeIcon = (type) => {
    switch (type) {
      case 'food': return <Coffee size={14} className="mr-1.5" />;
      case 'travel': return <Plane size={14} className="mr-1.5" />;
      case 'shopping': return <ShoppingBag size={14} className="mr-1.5" />;
      case 'attraction': return <Star size={14} className="mr-1.5" />;
      default: return <MapPin size={14} className="mr-1.5" />;
    }
};

// --- WEATHER HOOK ---
const useWeather = (lat, lon) => {
    const [weatherData, setWeatherData] = useState({});
    useEffect(() => {
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

// --- DATA: TEMPLATE ONLY (NOT DEFAULT FOR NEW USERS) ---
const HK_MACAU_TEMPLATE = {
  id: 'hk_macau_2026',
  title: 'Hong Kong & Macau 2026',
  startDate: '2026-01-15',
  coverImage: 'https://images.unsplash.com/photo-1506318137071-a8bcbf6d94ea?auto=format&fit=crop&w=2000&q=80',
  companions: ['Family'],
  days: [
    {
      id: 'd1', date: '2026-01-15', title: 'Day 1: Arrival & Lantau', summary: 'Arrival in HK, Citygate Outlets, and the Big Buddha.',
      activities: [
        { id: 'd1_a1', time: '05:00 - 07:00', title: 'Departure from Manila (NAIA T3)', type: 'travel', desc: 'Arrive 2h early for check-in.', details: 'Flight departs 7:10 AM.', image: 'https://images.unsplash.com/photo-1570125909232-eb2be79a1c74?auto=format&fit=crop&w=600&q=80' },
        { id: 'd1_a2', time: '07:10 - 09:45', title: 'Flight to Hong Kong', type: 'travel', desc: 'Flight duration approx 2.5 hours.', details: '', image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=600&q=80' },
        { id: 'd1_a3', time: '10:00 - 11:00', title: 'Arrival HKIA & Transfer', type: 'travel', desc: 'Transfer to Novotel Citygate.', details: 'Free hotel shuttle (~5 min) or taxi. Check-in and freshen up.', image: 'https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?auto=format&fit=crop&w=600&q=80' },
        { id: 'd1_a4', time: '11:00 - 12:30', title: 'Citygate Outlets & Lunch', type: 'shopping', desc: 'Outlet shopping and lunch.', details: 'Food Opera (Asian favorites) or Oolaa Tung Chung (Western).', image: 'https://images.unsplash.com/photo-1558981408-db0ecd8a1ee4?auto=format&fit=crop&w=600&q=80' },
      ]
    }
  ]
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

    return (
        <form onSubmit={handleSubmit} className="p-4 md:p-6 bg-white dark:bg-slate-800 rounded-2xl space-y-4">
            <h3 className="text-lg font-bold dark:text-white">Log Expense</h3>
            <div className="space-y-1"><label className="text-xs font-bold text-slate-400 uppercase">Description</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 outline-none" placeholder="e.g. Dinner" required/></div>
            <div className="grid grid-cols-3 gap-3">
                 <div className="space-y-1"><label className="text-xs font-bold text-slate-400 uppercase">Currency</label><select value={inputCurrencyCode} onChange={(e) => setInputCurrencyCode(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-2 py-3 outline-none text-sm appearance-none text-center font-bold">{currencyOptions.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}</select></div>
                <div className="space-y-1 col-span-2"><label className="text-xs font-bold text-slate-400 uppercase">Amount</label><div className="relative"><span className="absolute left-4 top-3 text-slate-400">{inputCurrencySymbol}</span><input type="number" step="0.01" value={amountInput} onChange={(e) => setAmountInput(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl pl-8 pr-4 py-3 outline-none font-mono font-bold text-lg" placeholder="0.00" required/></div></div>
            </div>
            <div className="space-y-1"><label className="text-xs font-bold text-slate-400 uppercase">Date</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 outline-none"/></div>
            <div className="space-y-2"><label className="text-xs font-bold text-slate-400 uppercase">Category</label><IconPicker selected={category} onSelect={setCategory} /></div>
            <button type="submit" className="w-full bg-black dark:bg-white text-white dark:text-black font-bold py-3 rounded-xl mt-2 active:scale-95 transition-transform">Save Expense</button>
        </form>
    );
};

const BudgetView = ({ currentUser, isEditMode, db }) => {
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
    
    const totalBase = expenses.reduce((acc, curr) => acc + (Number(curr.amount)||0), 0);
    const targetRate = EXCHANGE_RATES[targetCurrency] || 1;
    const baseRate = EXCHANGE_RATES[BASE_CURRENCY] || 1;
    const totalDisplay = totalBase * (targetRate / baseRate);

    return (
        <div className="max-w-2xl mx-auto mt-6 px-4 pb-20 space-y-6 animate-in fade-in">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-indigo-900 dark:to-indigo-950 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                    <p className="text-slate-400 text-sm font-medium mb-1">Total Spent</p>
                    <h1 className="text-4xl font-black mb-6">{formatCurrency(totalDisplay, targetCurrency)}</h1>
                    <div className="flex gap-2">
                         <button onClick={() => isEditMode && setIsAddModalOpen(true)} disabled={!isEditMode} className="bg-white text-black px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-100 disabled:opacity-50"><Plus size={16} /> Add Expense</button>
                         <select value={targetCurrency} onChange={e => setTargetCurrency(e.target.value)} className="bg-white/10 text-white border border-white/20 px-3 py-2 rounded-xl text-sm outline-none appearance-none">{CURRENCY_OPTIONS.map(c => <option key={c.code} value={c.code} className="text-black">{c.code}</option>)}</select>
                    </div>
                </div>
            </div>
            <div className="space-y-3">
                {expenses.length === 0 ? ( <div className="text-center py-10 text-slate-400"><Wallet size={48} className="mx-auto mb-2 opacity-20" /><p>No expenses yet.</p></div> ) : ( expenses.slice().reverse().map(e => <ExpenseCard key={e.id} expense={e} onDelete={handleDelete} isEditMode={isEditMode} currencyOptions={CURRENCY_OPTIONS} />) )}
            </div>
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="New Expense"><AddExpenseForm onAddExpense={handleAdd} currencyOptions={CURRENCY_OPTIONS} convertToBase={convertToBase} /></Modal>
        </div>
    );
};

// --- DASHBOARD VIEW (NEW) ---
const DashboardView = ({ trips, onSelectTrip, onNewTrip, onSignOut, onImportTrip, userEmail }) => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
                 <div className="flex justify-between items-center">
                    <Logo size="lg" />
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm">
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
    const [viewMode, setViewMode] = useState('timeline');
    const [modalOpen, setModalOpen] = useState(null);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [embeddedMaps, setEmbeddedMaps] = useState({});
    const [isMapOpen, setIsMapOpen] = useState(false); // Map sidebar toggle
    const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
    const [imageEditState, setImageEditState] = useState(null); // { dayIdx, actId, url }
    const [sharedCode, setSharedCode] = useState(null);

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
            
            // NOTE: REMOVED AUTOMATIC ANONYMOUS SIGN IN
            // This ensures users are forced to login page unless they have a session
            // if (!signedIn) { await signInAnonymously(auth); }
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
            // Trips will be cleared by the snapshot listener returning nothing or unmounting
            setTrips([]);
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
        });
        return () => unsub();
    }, [user, view, currentTripId]);

    const saveTimeout = useRef(null);
    useEffect(() => {
        if (!user || trips.length === 0) return;
        clearTimeout(saveTimeout.current);
        saveTimeout.current = setTimeout(() => {
            setDoc(getUserTripRef(user.uid), { allTrips: trips, currentTripId }, { merge: true });
        }, 1000);
    }, [trips, currentTripId, user]);

    const trip = trips.find(t => t.id === currentTripId);
    const weatherData = useWeather(22.3193, 114.1694); // Mock coords for now

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
            days: [{ id: 'd1', date: new Date().toISOString().split('T')[0], title: 'Day 1', activities: [] }] 
        };
        setTrips(prev => [...prev, newTrip]);
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
                                <input name="shareId" placeholder="e.g. A7B2X9" className="flex-grow bg-white dark:bg-slate-800 rounded-xl px-4 py-3 outline-none font-mono text-sm uppercase placeholder:normal-case border border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all" required maxLength={6} />
                                <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/30 hover:bg-emerald-700 transition-colors">Import</button>
                            </form>
                        </div>
                    </div>
                </Modal>
            </>
        );
    }

    const activeDay = trip.days[activeDayIdx] || trip.days[0];

    return (
        <div className={`min-h-screen transition-colors duration-500 ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-zinc-100 text-zinc-900'} font-sans pb-20`}>
            
             {/* --- HERO SECTION --- */}
            <div className="relative h-[40vh] md:h-[50vh] w-full group">
                <div className="absolute inset-0 overflow-hidden rounded-b-3xl">
                      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-zinc-100 dark:to-slate-950 z-10" />
                      <img src={trip.coverImage} alt="Trip Cover" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1558980394-4c7c9299fe96?auto=format&fit=crop&w=2000&q=80'} />
                </div>
                {/* Navbar */}
                <div className="absolute top-0 left-0 right-0 z-50 flex justify-between items-center p-6 text-white">
                      <Logo size="sm" onClick={() => setView('dashboard')} />
                      <div className="flex gap-2">
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-black/30 backdrop-blur-md rounded-full border border-white/10 mr-2">
                            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                                <User size={12} className="text-white" />
                            </div>
                            <span className="text-[10px] font-bold text-white max-w-[100px] truncate">
                                {user.email || 'Guest'}
                            </span>
                        </div>
                        {isEditMode && <button onClick={() => setModalOpen('share')} className="p-2.5 bg-indigo-600 rounded-full hover:bg-indigo-700 shadow-lg"><Share2 size={18} /></button>}
                        <button onClick={() => setIsEditMode(!isEditMode)} className={`p-2.5 rounded-full backdrop-blur-md border transition-all ${isEditMode ? 'bg-amber-400 text-amber-900 border-amber-300' : 'bg-black/30 border-white/20'}`}>{isEditMode ? <Unlock size={18} /> : <Lock size={18} />}</button>
                        <button onClick={() => setViewMode(viewMode === 'budget' ? 'timeline' : 'budget')} className={`p-2.5 rounded-full backdrop-blur-md border transition-all ${viewMode === 'budget' ? 'bg-emerald-500 text-white' : 'bg-black/30 border-white/20'}`}><DollarSign size={18} /></button>
                        <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 rounded-full bg-black/30 border border-white/20 backdrop-blur-md">{isDarkMode ? <Sun size={18} /> : <Moon size={18} />}</button>
                        <button onClick={() => setModalOpen('settings')} className="p-2.5 rounded-full bg-black/30 border border-white/20 backdrop-blur-md"><Settings size={18} /></button>
                         <button onClick={() => setShowSignOutConfirm(true)} className="p-2.5 bg-red-500/80 rounded-full hover:bg-red-600 backdrop-blur-md"><LogOut size={18} /></button>
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
            {viewMode === 'budget' ? (
                <BudgetView currentUser={user} isEditMode={isEditMode} db={db} />
            ) : (
                <main className="max-w-6xl mx-auto px-4 -mt-8 relative z-30">
                    
                    {/* Day Selector */}
                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-2 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/50 overflow-x-auto flex gap-2 no-scrollbar mb-8 sticky top-4 z-40">
                        {trip.days.map((day, idx) => (
                            <div key={day.id} className="relative group/day">
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
                        </div>

                        {/* Activity Cards */}
                        <div className="space-y-6">
                             {activeDay.activities.map((act, idx) => (
                                <div key={act.id} className={`relative md:grid md:grid-cols-[140px_1fr] gap-6 group transition-all duration-300 ${isEditMode ? 'cursor-grab active:cursor-grabbing' : ''}`}>
                                    <div className="hidden md:flex flex-col items-end pt-5 pr-4 text-right">
                                        <span className="font-extrabold text-zinc-800 dark:text-white text-sm leading-tight">{act.time}</span>
                                        <div className={`mt-2 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${getTypeColor(act.type)}`}>{getTypeIcon(act.type)} {act.type}</div>
                                    </div>
                                    
                                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-black/50 hover:-translate-y-1 transition-all duration-300">
                                        <div className="flex flex-col sm:flex-row h-full">
                                            <div className="relative w-full h-40 sm:w-40 sm:h-auto flex-shrink-0 bg-slate-200 group/img">
                                                <img src={act.image} alt={act.title} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent sm:hidden"></div>
                                                <div className="absolute bottom-3 left-3 text-white font-bold sm:hidden text-lg drop-shadow-md">{act.time}</div>
                                                
                                                {/* FIXED: Photo Update Logic with Modal */}
                                                {isEditMode && (
                                                    <button onClick={() => setImageEditState({ dayIdx: activeDayIdx, actId: act.id, url: act.image })} className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full backdrop-blur-md opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-black/70 shadow-lg cursor-pointer z-20">
                                                        <Camera size={16} />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="p-4 flex flex-col flex-grow relative min-w-0">
                                                <div className="flex justify-between items-start mb-2">
                                                    {isEditMode ? (
                                                        <div className="flex gap-1"><GripVertical className="text-slate-300 cursor-grab" size={20} /><button onClick={() => handleDeleteActivity(activeDayIdx, act.id)} className="text-red-400 hover:text-red-600"><Trash2 size={18} /></button></div>
                                                    ) : (
                                                        <button onClick={() => setEmbeddedMaps(prev => ({...prev, [act.id]: !prev[act.id]}))} className={`transition-colors p-1 rounded-full ${embeddedMaps[act.id] ? 'bg-indigo-100 text-indigo-600' : 'text-slate-300 hover:text-indigo-600'}`} title="Toggle Map"><MapPin size={18} /></button>
                                                    )}
                                                </div>
                                                <div className="flex-grow">
                                                    {isEditMode ? (
                                                        <input value={act.title} onChange={(e) => handleUpdateActivity(activeDayIdx, act.id, 'title', e.target.value)} className="w-full font-bold text-lg text-zinc-900 dark:text-white bg-transparent border-b border-slate-200 mb-1 focus:outline-none"/>
                                                    ) : (
                                                        <h3 className="font-bold text-lg text-zinc-900 dark:text-white mb-1 group-hover:text-indigo-600 transition-colors truncate">{act.title}</h3>
                                                    )}
                                                    <p className="text-xs text-zinc-500 dark:text-slate-400 line-clamp-2">{act.desc}</p>
                                                </div>
                                                
                                                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                                    <details className="group/details w-full">
                                                        <summary className="list-none flex items-center justify-between w-full cursor-pointer text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-wider">
                                                            <span className="flex items-center gap-1">Details <ChevronRight size={12} className="group-open/details:rotate-90 transition-transform" /></span>
                                                            <div className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                                                                <DollarSign size={12} />
                                                                {isEditMode ? (
                                                                    <input type="number" placeholder="Cost" className="w-16 bg-slate-50 dark:bg-slate-800 rounded px-1 py-0.5 outline-none" value={act.cost || ''} onChange={(e) => updateActivityCost(activeDayIdx, act.id, e.target.value)} onClick={e => e.preventDefault()} />
                                                                ) : (
                                                                    <span>{act.cost || 0}</span>
                                                                )}
                                                            </div>
                                                        </summary>
                                                        <div className="pt-2 text-sm text-zinc-600 dark:text-slate-300 leading-relaxed">
                                                            {act.details}
                                                        </div>
                                                        {embeddedMaps[act.id] && (
                                                            <div className="h-48 mt-3 rounded-lg overflow-hidden bg-slate-100">
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
                                <button onClick={() => { const newDays = [...trip.days]; newDays[activeDayIdx].activities.push({ id: Math.random().toString(36), time: '12:00', title: 'New Activity', type: 'attraction', desc: 'Description', image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=600&q=80' }); updateTrip({ days: newDays }); }} className="w-full py-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl flex flex-col items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all gap-2">
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
                <div className="space-y-6">
                    <section className="space-y-4">
                         <div className="space-y-1"><label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Trip Name</label><input type="text" value={trip.title} onChange={(e) => updateTrip({ title: e.target.value })} className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3 border-none focus:ring-2 focus:ring-indigo-500 outline-none font-bold"/></div>
                        <div className="space-y-1"><label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cover Image URL</label><input type="text" value={trip.coverImage} onChange={(e) => updateTrip({ coverImage: e.target.value })} className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3 border-none focus:ring-2 focus:ring-indigo-500 outline-none text-sm"/></div>
                         <div className="space-y-1"><label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Start Date</label><input type="date" value={trip.startDate} onChange={(e) => updateTrip({ startDate: e.target.value })} className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3 border-none focus:ring-2 focus:ring-indigo-500 outline-none"/></div>
                        <div className="space-y-2"><label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Companions</label><div className="flex flex-wrap gap-2">{trip.companions.map((c, i) => (<span key={i} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-sm flex items-center gap-1 group">{c}<button onClick={() => updateTrip({ companions: trip.companions.filter((_, idx) => idx !== i) })} className="text-slate-400 hover:text-red-500"><X size={12} /></button></span>))}</div><form onSubmit={(e) => { e.preventDefault(); if (e.target.name.value) { updateTrip({ companions: [...trip.companions, e.target.name.value] }); e.target.name.value = ''; } }} className="flex gap-2"><input name="name" placeholder="Add person..." className="flex-grow bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-2 border-none focus:ring-2 focus:ring-indigo-500 outline-none text-sm" /><button type="submit" className="bg-indigo-600 text-white px-4 rounded-xl text-sm font-bold">Add</button></form></div>
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
