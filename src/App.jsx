import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Calendar as CalendarIcon, MapPin, GripVertical, Plus, 
  Trash2, Edit3, X, Search, Moon, Sun, 
  Settings, Users, Image as ImageIcon,
  Plane, ShoppingBag, Coffee, Star, MoreHorizontal, Lock, Unlock,
  ChevronRight, Map, Share2, List, Filter, Camera, ArrowDown, ChevronDown,
  AlertTriangle, Check, Cloud, Loader2
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";

// --- ENVIRONMENT SETUP (CRITICAL FOR PERSISTENCE) ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : { apiKey: "MOCK_KEY" };
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Helper function to construct the CORRECT Firestore document reference path
// Path: /artifacts/{appId}/users/{userId}/trip
const getUserDocRef = (database, userId) => {
    const path = `artifacts/${appId}/users/${userId}/trip`;
    return doc(database, path);
};
// --- END ENVIRONMENT SETUP ---

// --- Data: Default Data (Used if no cloud data exists) ---
const HK_MACAU_2026 = {
  id: 'hk_macau_2026',
  title: 'Hong Kong & Macau 2026',
  startDate: '2026-01-15',
  coverImage: 'https://images.unsplash.com/photo-1506318137071-a8bcbf6d94ea?auto=format&fit=crop&w=2000&q=80',
  companions: ['Me', 'Family'],
  days: [
    {
      id: 'd1', date: '2026-01-15', title: 'Day 1: Arrival & Lantau Island', summary: 'Arrival in HK, Citygate Outlets, and the Big Buddha.',
      activities: [
        { id: 'a1_1', time: '05:00 - 07:00', title: 'Departure from Manila (NAIA T3)', type: 'travel', desc: 'Arrive 2 hours early for check-in.', details: 'Flight departs 7:10 AM.', image: 'https://images.unsplash.com/photo-1570125909232-eb2be79a1c74?auto=format&fit=crop&w=600&q=80' },
        { id: 'a1_2', time: '07:10 - 09:45', title: 'Flight to Hong Kong', type: 'travel', desc: 'Flight duration approx 2.5 hours.', details: '', image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=600&q=80' },
        { id: 'a1_3', time: '10:00 - 11:00', title: 'Arrival HKIA & Transfer', type: 'travel', desc: 'Transfer to Novotel Citygate.', details: 'Hotel operates a free shuttle (~5 min) or take a taxi. Check-in and freshen up.', image: 'https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?auto=format&fit=crop&w=600&q=80' },
        { id: 'a1_4', time: '11:00 - 12:30', title: 'Citygate Outlets & Lunch', type: 'shopping', desc: 'Outlet shopping and lunch.', details: 'Try Food Opera (Asian favorites) or Oolaa Tung Chung (Western).', image: 'https://images.unsplash.com/photo-1558981408-db0ecd8a1ee4?auto=format&fit=crop&w=600&q=80' },
        { id: 'a1_5', time: '12:30 - 13:00', title: 'Walk to Ngong Ping 360', type: 'travel', desc: '5-minute walk from hotel.', details: 'Buy tickets online (web.hkha.org) in advance to avoid queues.', image: 'https://images.unsplash.com/photo-1536526189568-d05540a92562?auto=format&fit=crop&w=600&q=80' },
        { id: 'a1_6', time: '13:00 - 17:30', title: 'Ngong Ping 360 & Big Buddha', type: 'attraction', desc: 'Cable car ride, Ngong Ping Village, Po Lin Monastery.', details: 'Climb the steps to Tian Tan Buddha. Visit Wisdom Path. Allow 3-4 hours.', image: 'https://images.unsplash.com/photo-1512753360436-5079f22b0cfb?auto=format&fit=crop&w=600&q=80' },
        { id: 'a1_7', time: '17:30 - 18:30', title: 'Return to Tung Chung', type: 'travel', desc: 'Cable car or Bus 23.', details: 'Bus 23 takes ~47 min if cable car queues are long.', image: 'https://images.unsplash.com/photo-1597652390890-21a4f00b1a0e?auto=format&fit=crop&w=600&q=80' },
        { id: 'a1_8', time: '19:00 - 20:30', title: 'Dinner at T-Bay', type: 'food', desc: 'Sunset Grill or Yue.', details: 'T-Bay is walking distance. Sunset Grill for steaks, Yue for Cantonese.', image: 'https://images.unsplash.com/photo-1550966871-3ed3c47e2ce2?auto=format&fit=crop&w=600&q=80' },
      ]
    },
    {
      id: 'd2', date: '2026-01-16', title: 'Day 2: Hong Kong Disneyland', summary: 'A full magical day at Disney.',
      activities: [
        { id: 'a2_1', time: '07:30 - 08:30', title: 'Breakfast', type: 'food', desc: 'Hotel or Citygate.', details: 'Fuel up early.', image: 'https://images.unsplash.com/photo-1533089862017-ec936d7734a6?auto=format&fit=crop&w=600&q=80' },
        { id: 'a2_2', time: '08:30 - 09:00', title: 'Travel to Disneyland', type: 'travel', desc: 'MTR to Sunny Bay -> Disneyland Resort Line.', details: 'Total journey ~20 min. Mickey themed trains!', image: 'https://images.unsplash.com/photo-1548281035-29b61d334508?auto=format&fit=crop&w=600&q=80' },
        { id: 'a2_3', time: '09:00 - 10:00', title: 'Arrive & Entry', type: 'travel', desc: 'Reserve tickets online.', details: 'Use official app for wait times. Opens ~10:00/10:30 AM.', image: 'https://images.unsplash.com/photo-1628153488836-82285514f260?auto=format&fit=crop&w=600&q=80' },
        { id: 'a2_4', time: '10:00 - 19:30', title: 'Hong Kong Disneyland', type: 'attraction', desc: 'Explore 8 lands including World of Frozen.', details: 'Lunch at Royal Banquet Hall or Explorer\'s Club. Watch Momentous Nighttime Spectacular.', image: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=600&q=80' },
        { id: 'a2_5', time: '19:30 - 20:00', title: 'Return to Tung Chung', type: 'travel', desc: 'MTR reverse route.', details: '', image: 'https://images.unsplash.com/photo-1540304381283-a75d1d6a2491?auto=format&fit=crop&w=600&q=80' },
        { id: 'a2_6', time: '20:00 - 21:30', title: 'Dinner at Citygate', type: 'food', desc: 'Shake Shack or Hidden Heat.', details: 'Try the exclusive Tung Chung dessert at Shake Shack.', image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80' },
      ]
    },
    {
      id: 'd3', date: '2026-01-17', title: 'Day 3: The Peak & Central', summary: 'Victoria Peak views, Central heritage, and Temple Street Night Market.',
      activities: [
        { id: 'a3_1', time: '08:00 - 09:00', title: 'Breakfast', type: 'food', desc: 'Hotel buffet or Cupping Room.', details: '', image: 'https://images.unsplash.com/photo-1496116218417-1a781b1cdd23?auto=format&fit=crop&w=600&q=80' },
        { id: 'a3_2', time: '09:00 - 10:00', title: 'Travel to Central', type: 'travel', desc: 'MTR Tung Chung Line to HK Station.', details: '~28 min. Walk to Peak Tram lower terminus.', image: 'https://images.unsplash.com/photo-1572979203799-733355209355?auto=format&fit=crop&w=600&q=80' },
        { id: 'a3_3', time: '10:00 - 13:00', title: 'Victoria Peak', type: 'attraction', desc: 'Peak Tram & Sky Terrace 428.', details: 'Spectacular harbour views. Peak Galleria. Morning Trail loop.', image: 'https://images.unsplash.com/photo-1599988226955-e7f607c7442a?auto=format&fit=crop&w=600&q=80' },
        { id: 'a3_4', time: '13:00 - 14:30', title: 'Dim Sum Lunch', type: 'food', desc: 'Tim Ho Wan or Lin Heung Tea House.', details: 'Famous BBQ pork buns at Tim Ho Wan (Central).', image: 'https://images.unsplash.com/photo-1496116218417-1a781b1cdd23?auto=format&fit=crop&w=600&q=80' },
        { id: 'a3_5', time: '14:30 - 17:00', title: 'Central & Sheung Wan', type: 'attraction', desc: 'Hollywood Road, Man Mo Temple, PMQ.', details: 'Art galleries and creative hubs.', image: 'https://images.unsplash.com/photo-1569766956636-66f6df643c72?auto=format&fit=crop&w=600&q=80' },
        { id: 'a3_6', time: '17:00 - 18:30', title: 'Star Ferry to TST', type: 'travel', desc: 'Scenic harbour crossing.', details: 'Walk Avenue of Stars after landing.', image: 'https://images.unsplash.com/photo-1552656967-7a099074b62d?auto=format&fit=crop&w=600&q=80' },
        { id: 'a3_7', time: '18:30 - 21:00', title: 'Temple Street Night Market', type: 'shopping', desc: 'Souvenirs, street food, claypot rice.', details: 'Walk from Jordan station. Relaxed atmosphere.', image: 'https://images.unsplash.com/photo-1574227492706-f65b24c3688a?auto=format&fit=crop&w=600&q=80' },
        { id: 'a3_8', time: '21:00 - 21:30', title: 'Return to Hotel', type: 'travel', desc: 'MTR Jordan to Tung Chung.', details: '', image: 'https://images.unsplash.com/photo-1536526189568-d05540a92562?auto=format&fit=crop&w=600&q=80' },
      ]
    },
    {
      id: 'd4', date: '2026-01-18', title: 'Day 4: Mong Kok & Kowloon', summary: 'Markets, Museums, and Culture.',
      activities: [
        { id: 'a4_1', time: '08:00 - 09:00', title: 'Breakfast', type: 'food', desc: 'Hotel or local favorite.', details: '', image: 'https://images.unsplash.com/photo-1533089862017-ec936d7734a6?auto=format&fit=crop&w=600&q=80' },
        { id: 'a4_2', time: '09:00 - 12:00', title: 'Ladies\' Market (Mong Kok)', type: 'shopping', desc: 'Clothes, bags, street food.', details: 'Tung Choi Street. Visit nearby Sneaker Street. Bargain hard!', image: 'https://images.unsplash.com/photo-1533965936850-939fc964344a?auto=format&fit=crop&w=600&q=80' },
        { id: 'a4_3', time: '12:00 - 13:30', title: 'Lunch: Mott 32 or Yum Cha', type: 'food', desc: 'Upscale or playful dim sum.', details: 'Mott 32 for premium ingredients. Yum Cha for pig-shaped buns.', image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80' },
        { id: 'a4_4', time: '13:30 - 16:00', title: 'Kowloon Museums', type: 'attraction', desc: 'History/Science Museum or M+.', details: 'M+ is at West Kowloon Cultural District.', image: 'https://images.unsplash.com/photo-1558234674-8b63e2621746?auto=format&fit=crop&w=600&q=80' },
        { id: 'a4_5', time: '16:00 - 18:00', title: 'Return & Shopping', type: 'shopping', desc: 'Citygate Outlets last-minute bargains.', details: '', image: 'https://images.unsplash.com/photo-1558981408-db0ecd8a1ee4?auto=format&fit=crop&w=600&q=80' },
        { id: 'a4_6', time: '18:00 - 20:00', title: 'Dinner', type: 'food', desc: 'My Thai (Authentic) or Maison du Mezze.', details: '', image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=600&q=80' },
      ]
    },
    {
      id: 'd5', date: '2026-01-19', title: 'Day 5: Macau Historic Centre', summary: 'Ruins of St. Paul\'s, A-Ma Temple, and Portuguese Heritage.',
      activities: [
        { id: 'a5_1', time: '06:30 - 08:00', title: 'Breakfast & Docs', type: 'other', desc: 'Prepare passports.', details: 'Macau requires immigration formalities.', image: 'https://images.unsplash.com/photo-1518331539958-9a2963167193?auto=format&fit=crop&w=600&q=80' },
        { id: 'a5_2', time: '08:00 - 08:45', title: 'Travel to HZMB Port', type: 'travel', desc: 'Bus B5 or 901 from Tung Chung.', details: '~45 min transit.', image: 'https://images.unsplash.com/photo-1628522303038-d6556e87a2d3?auto=format&fit=crop&w=600&q=80' },
        { id: 'a5_3', time: '08:45 - 10:00', title: 'Crossing to Macau', type: 'travel', desc: 'HZMB Shuttle Bus.', details: 'Takes ~35 min. Ticket ~HK$65.', image: 'https://images.unsplash.com/photo-1543731068-1541f4d85603?auto=format&fit=crop&w=600&q=80' },
        { id: 'a5_4', time: '10:00 - 10:30', title: 'Arrival & Transport', type: 'travel', desc: 'Bus 101X/102X or Taxi.', details: 'Head to historic centre.', image: 'https://images.unsplash.com/photo-1556624513-568eb5b62db1?auto=format&fit=crop&w=600&q=80' },
        { id: 'a5_5', time: '10:30 - 13:00', title: 'Senado Square & St. Paul\'s', type: 'attraction', desc: 'Colonial buildings, Ruins of St. Paul\'s.', details: 'Walk up the 68 stone steps. Explore Mount Fortress.', image: 'https://images.unsplash.com/photo-1599831773735-6c73950ba33f?auto=format&fit=crop&w=600&q=80' },
        { id: 'a5_6', time: '13:00 - 14:30', title: 'Lunch at Riquexó', type: 'food', desc: 'Try Minchi (national dish).', details: 'One of the oldest Macanese eateries.', image: 'https://images.unsplash.com/photo-1512401880482-169822a101b4?auto=format&fit=crop&w=600&q=80' },
        { id: 'a5_7', time: '14:30 - 16:30', title: 'A-Ma Temple', type: 'attraction', desc: 'Oldest temple in Macau.', details: 'Inspired the name "Macau". Visit Moorish Barracks.', image: 'https://images.unsplash.com/photo-1558611100-36d2626e2798?auto=format&fit=crop&w=600&q=80' },
        { id: 'a5_8', time: '16:30 - 18:00', title: 'Snack: Egg Tarts', type: 'food', desc: 'Lord Stow\'s or Margaret\'s.', details: 'Walk along Rua do Almirante Sérgio.', image: 'https://images.unsplash.com/photo-1589301760574-0a6a9787e799?auto=format&fit=crop&w=600&q=80' },
        { id: 'a5_9', time: '18:00 - 19:30', title: 'Dinner at A Lorcha', type: 'food', desc: 'Portuguese cuisine.', details: 'Clams Bulhão Pato and Dobradinha.', image: 'https://images.unsplash.com/photo-1595295330654-29947d6dd6d5?auto=format&fit=crop&w=600&q=80' },
        { id: 'a5_10', time: '19:30 - 21:00', title: 'Return to Hong Kong', type: 'travel', desc: 'Shuttle bus back via HZMB.', details: '', image: 'https://images.unsplash.com/photo-1624362145327-142436f52230?auto=format&fit=crop&w=600&q=80' },
      ]
    },
    {
      id: 'd6', date: '2026-01-20', title: 'Day 6: Macau Cotai & Taipa', summary: 'Macau Tower, Taipa Village, and Casinos.',
      activities: [
        { id: 'a6_1', time: '07:00 - 08:30', type: 'travel', title: 'Breakfast & Travel', desc: 'Repeat bridge crossing to Macau.', details: '', image: 'https://images.unsplash.com/photo-1628522303038-d6556e87a2d3?auto=format&fit=crop&w=600&q=80' },
        { id: 'a6_2', time: '08:30 - 10:00', type: 'attraction', title: 'Macau Tower', desc: '338m high tower.', details: 'Observation deck views. Optional Skywalk/Bungee.', image: 'https://images.unsplash.com/photo-1577943260714-a95574384042?auto=format&fit=crop&w=600&q=80' },
        { id: 'a6_3', time: '10:00 - 13:00', type: 'attraction', title: 'Taipa Village', desc: 'Colorful houses, Taipa Houses Museum.', details: 'Pork chop buns at Tai Lei Loi Kei.', image: 'https://images.unsplash.com/photo-1573033501170-13d81b4f2c08?auto=format&fit=crop&w=600&q=80' },
        { id: 'a6_4', time: '13:00 - 14:30', type: 'food', title: 'Lunch: Macanese', desc: 'La Famiglia or Sab 8 Café.', details: 'Minchi and other local dishes.', image: 'https://images.unsplash.com/photo-1563507466359-1e285890832d?auto=format&fit=crop&w=600&q=80' },
        { id: 'a6_5', time: '14:30 - 17:00', type: 'shopping', title: 'Cotai Strip & Casinos', desc: 'Venetian, Parisian, City of Dreams.', details: 'Gondola rides, Eiffel Tower replica, shopping.', image: 'https://images.unsplash.com/photo-1623847844052-1c251d184043?auto=format&fit=crop&w=600&q=80' },
        { id: 'a6_6', time: '17:00 - 19:00', type: 'food', title: 'Dinner', desc: 'Macau Tower 360 Café or Cotai.', details: 'Revolving buffet or resort dining.', image: 'https://images.unsplash.com/photo-1550966871-3ed3c47e2ce2?auto=format&fit=crop&w=600&q=80' },
        { id: 'a6_7', time: '19:00 - 21:00', type: 'travel', title: 'Return to Hong Kong', desc: 'Shuttle bus back via HZMB.', details: '', image: 'https://images.unsplash.com/photo-1624362145327-142436f52230?auto=format&fit=crop&w=600&q=80' },
      ]
    },
    {
      id: 'd7', date: '2026-01-21', title: 'Day 7: Departure', summary: 'Last minute shopping and flight home.',
      activities: [
        { id: 'a7_1', time: '08:00 - 10:00', type: 'other', title: 'Breakfast & Pack', desc: 'Check out of Novotel Citygate.', details: 'Leave luggage at concierge.', image: 'https://images.unsplash.com/photo-1528696892704-5e1122852276?auto=format&fit=crop&w=600&q=80' },
        { id: 'a7_2', time: '10:00 - 13:00', type: 'shopping', title: 'Citygate Outlets', desc: 'Final shopping or promenade walk.', details: 'Lunch at The Next Chapter or The Tavern.', image: 'https://images.unsplash.com/photo-1555529733-0e670560f7e1?auto=format&fit=crop&w=600&q=80' },
        { id: 'a7_3', time: '13:00 - 15:00', type: 'travel', title: 'Transfer to Airport', desc: 'Hotel shuttle or taxi to HKIA.', details: 'Duty free shopping.', image: 'https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?auto=format&fit=crop&w=600&q=80' },
        { id: 'a7_4', time: '19:15 - 21:40', type: 'travel', title: 'Flight to Manila', desc: 'Flight back home.', details: 'Arrive 21:40.', image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=600&q=80' },
      ]
    }
  ]
};

// Helper Functions
const generateId = () => Math.random().toString(36).substr(2, 9);
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
const formatTimeRange = (timeStr) => {
    if (!timeStr) return '';
    if (timeStr.includes('-') || timeStr.includes('M')) return timeStr;
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${hour > 12 ? hour - 12 : hour}:${m} ${ampm}`;
};
const parseMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const match = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (match) { return parseInt(match[1]) * 60 + parseInt(match[2]); }
    return 0; 
};
const parseTimeRangeValues = (timeStr) => {
    if (!timeStr) return null;
    const rangeMatch = timeStr.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
    if (rangeMatch) { return { start: parseMinutes(rangeMatch[1]), end: parseMinutes(rangeMatch[2]) }; }
    const start = parseMinutes(timeStr);
    return { start, end: start + 60 };
};
const checkOverlap = (newTimeStr, existingActivities, excludeId = null) => {
    const newRange = parseTimeRangeValues(newTimeStr);
    if (!newRange) return null;
    for (const act of existingActivities) {
        if (excludeId && act.id === excludeId) continue;
        const existingRange = parseTimeRangeValues(act.time);
        if (!existingRange) continue;
        if (newRange.start < existingRange.end && newRange.end > existingRange.start) {
            return act;
        }
    }
    return null;
};

// --- Components ---
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
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

export default function TravelApp() {
  // --- STATE ---
  const [allTrips, setAllTrips] = useState([HK_MACAU_2026]);
  const [currentTripId, setCurrentTripId] = useState(HK_MACAU_2026.id);
  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [filter, setFilter] = useState('all');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Initialize dark mode from localStorage
    return localStorage.getItem('theme') === 'dark';
  });
  const [viewMode, setViewMode] = useState('timeline');
  const [isTripDropdownOpen, setIsTripDropdownOpen] = useState(false);
  
  // Firebase State
  const [currentUser, setCurrentUser] = useState(null);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  // Tracks if the initial snapshot from Firestore has been processed
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false); 

  // Modals & Active Items
  const [modalOpen, setModalOpen] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [embeddedMaps, setEmbeddedMaps] = useState({});
  const [pendingActivity, setPendingActivity] = useState(null);
  const [overlapConflict, setOverlapConflict] = useState(null);

  // Dragging
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);
  
  // Debounce Ref
  const saveTimeoutRef = useRef(null);

  // Derived State
  const trip = allTrips.find(t => t.id === currentTripId) || allTrips[0];
  const activeDay = trip.days[activeDayIdx] || trip.days[0];
  const filteredActivities = activeDay?.activities.filter(a => filter === 'all' || a.type === filter) || [];

  // --- FIREBASE AUTHENTICATION ---
  useEffect(() => {
    // 1. Sign in using the custom token provided by the environment, or anonymously
    if (initialAuthToken) {
        signInWithCustomToken(auth, initialAuthToken).catch(error => {
            console.error("Custom Auth Failed, falling back to anonymous.", error);
            signInAnonymously(auth);
        });
    } else {
        signInAnonymously(auth);
    }

    // 2. Set up listener for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
            setCurrentUser(user);
        }
    });

    return () => unsubscribe();
  }, []); // Run only once on mount

  // 3. Fetch Data (Real-time Listener) - DEPENDS on Authentication
  useEffect(() => {
    // Wait until user object (and thus uid) is available
    if (!currentUser || !db) {
        return;
    }
    
    // CRITICAL: Use the correct, rules-matching path using the environment's appId
    const userDocRef = getUserDocRef(db, currentUser.uid);
    
    let isFirstSnapshot = true; 

    const unsubscribe = onSnapshot(userDocRef, async (docSnapshot) => {
        if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            if (data.allTrips) setAllTrips(data.allTrips);
            if (data.currentTripId) setCurrentTripId(data.currentTripId);
        } else if (isFirstSnapshot) {
            // Document doesn't exist, first time writing data for this user/appId combo
            try {
                await setDoc(userDocRef, {
                    allTrips: [HK_MACAU_2026],
                    currentTripId: HK_MACAU_2026.id
                }, { merge: true });
            } catch (e) {
                console.error("Failed to write initial default data:", e);
                // Fallback: use default data locally if write fails
                setAllTrips([HK_MACAU_2026]);
                setCurrentTripId(HK_MACAU_2026.id);
            }
        }
        
        // Final state change: Data is loaded (or defaults are set)
        setHasLoadedInitialData(true);
        setIsLoadingData(false);
        isFirstSnapshot = false;

    }, (error) => {
        console.error("Firestore Listener Fetch Error:", error);
        setIsLoadingData(false);
        setHasLoadedInitialData(true);
    });

    return () => unsubscribe();
  }, [currentUser]); // Re-run when currentUser changes (i.e., when auth completes)

  // 4. Auto-Save Logic (Debounced) - DEPENDS on Data being loaded first
  useEffect(() => {
    // Only proceed if user is ready AND initial data load is complete
    if (!currentUser || !db || !hasLoadedInitialData) return;

    setIsCloudSyncing(true);
    
    // Clear pending saves
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    const userDocRef = getUserDocRef(db, currentUser.uid);

    // Set new save timeout (1 second debounce)
    saveTimeoutRef.current = setTimeout(async () => {
        try {
            await setDoc(userDocRef, {
                allTrips: allTrips,
                currentTripId: currentTripId
            }, { merge: true });
            
        } catch (error) {
            console.error("Auto-Save Error:", error);
            
        } finally {
            // GUARANTEE the loading indicator is hidden after save attempt
            setIsCloudSyncing(false);
        }
    }, 1000);

    return () => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [allTrips, currentTripId, currentUser, hasLoadedInitialData]); // Added hasLoadedInitialData dependency

  // 5. Theme Effect (Local Storage)
  useEffect(() => {
    // Set theme class on document root
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Save state whenever it changes
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Actions
  const updateCurrentTrip = useCallback((updates) => {
    setAllTrips(prev => prev.map(t => t.id === currentTripId ? { ...t, ...updates } : t));
  }, [currentTripId]);

  const sortDayActivities = (dayIndex) => {
      const newDays = [...trip.days];
      newDays[dayIndex].activities.sort((a, b) => parseMinutes(a.time) - parseMinutes(b.time));
      updateCurrentTrip({ days: newDays });
  };

  const handleUpdateActivity = (dayIdx, actId, field, value) => {
    const newDays = [...trip.days];
    const actIdx = newDays[dayIdx].activities.findIndex(a => a.id === actId);
    if (actIdx === -1) return;
    newDays[dayIdx].activities[actIdx] = { ...newDays[dayIdx].activities[actIdx], [field]: value };
    updateCurrentTrip({ days: newDays });
  };

  const handleAddActivity = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const timeStr = formData.get('time');
    
    const newActivity = {
      id: generateId(),
      time: timeStr,
      title: formData.get('title'),
      type: formData.get('type'),
      desc: formData.get('desc'),
      details: formData.get('details'),
      image: formData.get('image') || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=600&q=80'
    };

    const conflict = checkOverlap(timeStr, activeDay.activities);
    if (conflict) {
        setPendingActivity(newActivity);
        setOverlapConflict(conflict);
        setModalOpen('overlap');
        return;
    }
    confirmAddActivity(newActivity);
  };

  const confirmAddActivity = (activity) => {
    const newDays = [...trip.days];
    newDays[activeDayIdx].activities.push(activity);
    updateCurrentTrip({ days: newDays });
    sortDayActivities(activeDayIdx);
    setModalOpen(null);
    setPendingActivity(null);
    setOverlapConflict(null);
  };

  const handleDeleteActivity = (actId) => {
    const newDays = [...trip.days];
    newDays[activeDayIdx].activities = newDays[activeDayIdx].activities.filter(a => a.id !== actId);
    updateCurrentTrip({ days: newDays });
  };

  const handleDeleteDay = (e, dayId) => {
    e.stopPropagation();
    if (trip.days.length <= 1) {
        console.warn("Cannot delete the only day!");
        return;
    }
    if (window.confirm("Delete this day and all its activities?")) {
        const newDays = trip.days.filter(d => d.id !== dayId);
        if (activeDayIdx >= newDays.length) setActiveDayIdx(newDays.length - 1);
        updateCurrentTrip({ days: newDays });
    }
  };

  const createNewTrip = () => {
      const newTrip = {
          ...HK_MACAU_2026,
          id: generateId(),
          title: 'New Trip',
          days: [{ id: generateId(), date: 'TBD', title: 'Day 1', summary: 'Start planning...', activities: [] }]
      };
      setAllTrips([...allTrips, newTrip]);
      setCurrentTripId(newTrip.id);
      setIsTripDropdownOpen(false);
  };

  // --- RESTORED CALENDAR VIEW COMPONENT ---
  const CalendarView = () => {
    const days = trip.days;
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in">
            {days.map((day, i) => (
                <div key={day.id} 
                  onClick={() => { setActiveDayIdx(i); setViewMode('timeline'); }}
                  className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all cursor-pointer group"
                >
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Day {i + 1}</span>
                        <span className="text-sm font-medium bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">{day.date}</span>
                    </div>
                    <h3 className="font-bold text-lg mb-2 group-hover:text-indigo-600 transition-colors">{day.title}</h3>
                    <div className="space-y-1">
                        {day.activities.slice(0, 3).map(a => (
                            <div key={a.id} className="flex items-center text-xs text-slate-500 truncate">
                                <div className={`w-2 h-2 rounded-full mr-2 ${getTypeColor(a.type).split(' ')[0]}`}></div>
                                <span className="font-mono mr-2 opacity-75">{formatTimeRange(a.time)}</span>
                                <span className="truncate">{a.title}</span>
                            </div>
                        ))}
                        {day.activities.length > 3 && <div className="text-xs text-indigo-500 font-medium pl-4">+ {day.activities.length - 3} more</div>}
                    </div>
                </div>
            ))}
        </div>
    );
  };

  if (isLoadingData) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-500">
              <div className="flex flex-col items-center gap-4">
                  <Loader2 className="animate-spin text-indigo-600" size={32} />
                  <p>Loading Trip Data...</p>
              </div>
          </div>
      );
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-zinc-100 text-zinc-900'} font-sans pb-20`}>
      
      {/* Cloud Sync Indicator */}
      <div className="fixed top-4 right-4 z-[60] pointer-events-none">
          {isCloudSyncing ? (
             <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg border border-indigo-100 flex items-center gap-2 text-xs font-bold text-indigo-600 animate-pulse">
                 <Loader2 size={12} className="animate-spin" /> Saving...
             </div>
          ) : (
             <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg border border-slate-100 flex items-center gap-2 text-xs font-bold text-slate-400 opacity-0 transition-opacity duration-1000 delay-1000">
                 <Cloud size={12} /> Saved
             </div>
          )}
      </div>

      {/* --- Immersive Hero Section --- */}
      <div className="relative h-[40vh] md:h-[50vh] w-full group">
        <div className="absolute inset-0 overflow-hidden rounded-b-3xl">
             <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-zinc-100 dark:to-slate-950 z-10" />
             <img src={trip.coverImage} alt="Trip Cover" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1558980394-4c7c9299fe96?auto=format&fit=crop&w=2000&q=80'} />
        </div>
        <div className="absolute top-0 left-0 right-0 z-50 flex justify-between items-center p-6 text-white">
             <div className="relative group/trip">
                 <button onClick={(e) => { e.stopPropagation(); setIsTripDropdownOpen(!isTripDropdownOpen); }} className="flex items-center gap-2 bg-black/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 hover:bg-white/20 transition-all active:scale-95">
                    <span className="font-bold max-w-[150px] truncate">{trip.title}</span>
                    <ChevronDown size={16} className={`transition-transform duration-200 ${isTripDropdownOpen ? 'rotate-180' : ''}`} />
                 </button>
                 {isTripDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                        <div className="max-h-60 overflow-y-auto custom-scrollbar">
                            {allTrips.map(t => (
                                <button key={t.id} onClick={() => { setCurrentTripId(t.id); setIsTripDropdownOpen(false); }} className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800 ${t.id === currentTripId ? 'text-indigo-600 font-bold bg-indigo-50 dark:bg-indigo-900/20' : 'text-slate-700 dark:text-slate-300'}`}>{t.title}</button>
                            ))}
                        </div>
                        <button onClick={createNewTrip} className="w-full text-left px-4 py-3 text-sm text-indigo-600 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 bg-slate-50 dark:bg-slate-900"><Plus size={14} /> Create New Trip</button>
                    </div>
                 )}
             </div>
             <div className="flex gap-2">
                 <button onClick={() => setIsEditMode(!isEditMode)} className={`p-2.5 rounded-full backdrop-blur-md border transition-all ${isEditMode ? 'bg-amber-400/90 text-amber-900 border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.5)]' : 'bg-black/30 text-white border-white/20 hover:bg-white/20'}`}>{isEditMode ? <Unlock size={18} /> : <Lock size={18} />}</button>
                 <button onClick={() => setViewMode(viewMode === 'timeline' ? 'calendar' : 'timeline')} className="p-2.5 rounded-full bg-black/30 text-white backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all">{viewMode === 'timeline' ? <CalendarIcon size={18} /> : <List size={18} />}</button>
                 <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 rounded-full bg-black/30 text-white backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all">{isDarkMode ? <Sun size={18} /> : <Moon size={18} />}</button>
                 <button onClick={() => setModalOpen('settings')} className="p-2.5 rounded-full bg-black/30 text-white backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all"><Settings size={18} /></button>
             </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-20 p-6 md:p-12 max-w-6xl mx-auto">
            <div className="animate-in slide-in-from-bottom-5 duration-700 relative">
                {isEditMode && (
                    <div className="absolute right-0 bottom-2">
                        <button onClick={() => setModalOpen('settings')} className="bg-black/40 backdrop-blur-md hover:bg-black/60 text-white border border-white/20 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all shadow-lg"><Camera size={14} /> Change Cover</button>
                    </div>
                )}
                <div className="flex items-center gap-3 mb-4">
                    {isEditMode ? (
                        <input type="date" value={trip.startDate} onChange={(e) => updateCurrentTrip({ startDate: e.target.value })} className="px-3 py-1 bg-white/20 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg backdrop-blur-sm border border-white/30 focus:outline-none focus:bg-white/30"/>
                    ) : (
                        <span className="px-3 py-1 bg-indigo-500/90 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg backdrop-blur-sm">{trip.startDate}</span>
                    )}
                    <div className="flex -space-x-2">
                        {trip.companions.slice(0,3).map((c, i) => (
                            <div key={i} className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-indigo-500 flex items-center justify-center text-[10px] font-bold text-indigo-800" title={c}>{c.charAt(0)}</div>
                        ))}
                        {trip.companions.length > 3 && (
                            <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center text-[10px] font-bold text-white">+{trip.companions.length - 3}</div>
                        )}
                    </div>
                </div>
                {isEditMode ? (
                     <input type="text" value={trip.title} onChange={(e) => updateCurrentTrip({ title: e.target.value })} className="block text-4xl md:text-6xl font-black text-white bg-white/10 rounded-xl px-2 -ml-2 border border-white/30 focus:border-white focus:outline-none w-full shadow-black drop-shadow-md mb-2 backdrop-blur-sm"/>
                ) : (
                    <h1 className="text-4xl md:text-6xl font-black text-white leading-tight drop-shadow-lg mb-2">{trip.title}</h1>
                )}
                <div className="flex gap-4 items-center">
                    <div className="h-1 w-12 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                    <p className="text-white/90 text-lg md:text-xl font-medium drop-shadow-md">{trip.days.length} Days • {trip.days.reduce((acc, d) => acc + d.activities.length, 0)} Activities</p>
                </div>
            </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 -mt-8 relative z-30">
        
        {/* Toggle between Timeline and Calendar View */}
        {viewMode === 'timeline' ? (
          <>
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-2 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/50 overflow-x-auto flex gap-2 no-scrollbar mb-8 sticky top-4 z-40">
                {trip.days.map((day, idx) => (
                    <button key={day.id} onClick={() => setActiveDayIdx(idx)} className={`relative flex-shrink-0 px-5 py-2.5 rounded-xl transition-all duration-300 flex flex-col items-center min-w-[100px] ${activeDayIdx === idx ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-lg scale-105' : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                    {isEditMode && trip.days.length > 1 && (
                        <div onClick={(e) => handleDeleteDay(e, day.id)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow-sm z-10 transition-transform hover:scale-110"><X size={12} /></div>
                    )}
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Day {idx + 1}</span>
                    <span className="text-sm font-semibold truncate max-w-[120px]">{day.date.split('-').slice(1).join('/')}</span>
                    </button>
                ))}
                {isEditMode && (
                    <button onClick={() => updateCurrentTrip({ days: [...trip.days, { id: generateId(), date: 'TBD', title: 'New Day', summary: 'Plan...', activities: [] }] })} className="px-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center text-slate-400 hover:text-indigo-500 hover:border-indigo-500 transition-colors"><Plus size={20} /></button>
                )}
            </div>

            <div className="grid lg:grid-cols-[280px_1fr] gap-8 md:gap-12 animate-in fade-in duration-500">
                <div className="space-y-6 lg:sticky lg:top-32 h-min">
                    <div className="space-y-2">
                        {isEditMode ? (
                            <input value={activeDay.title} onChange={(e) => { const newDays = [...trip.days]; newDays[activeDayIdx].title = e.target.value; updateCurrentTrip({ days: newDays }); }} className="text-3xl font-extrabold bg-transparent border-b border-slate-300 w-full focus:outline-none dark:text-white"/>
                        ) : (
                            <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-white leading-tight">{activeDay.title}</h2>
                        )}
                        {isEditMode ? (
                            <textarea value={activeDay.summary} onChange={(e) => { const newDays = [...trip.days]; newDays[activeDayIdx].summary = e.target.value; updateCurrentTrip({ days: newDays }); }} className="text-zinc-600 dark:text-slate-400 text-lg leading-relaxed bg-transparent border-slate-300 w-full h-24 focus:outline-none resize-none"/>
                        ) : (
                            <p className="text-zinc-600 dark:text-slate-400 text-lg leading-relaxed">{activeDay.summary}</p>
                        )}
                    </div>
                    <button onClick={() => setModalOpen('fullMap')} className="w-full flex items-center justify-center gap-2 bg-indigo-100 hover:bg-indigo-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-400 py-3 rounded-xl text-sm font-bold transition-colors"><Map size={16} /> View Full Day Map</button>
                </div>

                <div className="relative space-y-4 pl-4 md:pl-0">
                    <div className="flex flex-wrap gap-2 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mr-2"><Filter size={14} /> Filters:</div>
                        {['all', 'attraction', 'food', 'shopping', 'travel', 'other'].map(f => (
                            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded-full text-xs font-bold transition-all capitalize border ${filter === f ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-transparent border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500'}`}>{f}</button>
                        ))}
                    </div>
                    <div className="absolute left-4 md:left-[9rem] top-12 bottom-4 w-0.5 bg-slate-300 dark:bg-slate-800 hidden md:block"></div>
                    {filteredActivities.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
                            <MapPin size={48} className="mb-4 opacity-20" />
                            <p className="font-medium">No activities planned.</p>
                            {isEditMode && <p className="text-sm mt-1 text-indigo-500">Add your first stop!</p>}
                        </div>
                    )}
                    {filteredActivities.map((act, idx) => (
                        <div key={act.id} className={`relative md:grid md:grid-cols-[140px_1fr] gap-6 group transition-all duration-300 ${isEditMode ? 'cursor-grab active:cursor-grabbing' : ''}`} draggable={isEditMode && filter === 'all'} onDragStart={(e) => { if (!isEditMode || filter !== 'all') { e.preventDefault(); return; } dragItem.current = idx; e.currentTarget.style.opacity = '0.5'; }} onDragEnd={(e) => { e.currentTarget.style.opacity = '1'; dragItem.current = null; dragOverItem.current = null; }} onDragEnter={(e) => { if (!isEditMode || filter !== 'all') return; dragOverItem.current = idx; if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) { const newDays = [...trip.days]; const items = [...newDays[activeDayIdx].activities]; const draggedItemContent = items[dragItem.current]; items.splice(dragItem.current, 1); items.splice(dragOverItem.current, 0, draggedItemContent); newDays[activeDayIdx].activities = items; updateCurrentTrip({ days: newDays }); dragItem.current = dragOverItem.current; } }} onDragOver={(e) => e.preventDefault()}>
                            <div className="absolute left-[9rem] top-8 w-3 h-3 bg-white dark:bg-slate-950 border-2 border-indigo-500 rounded-full z-10 hidden md:block -translate-x-[5px]"></div>
                            <div className="hidden md:flex flex-col items-end pt-5 pr-4 text-right">
                                {isEditMode ? (
                                    <input type="text" value={act.time} onChange={(e) => handleUpdateActivity(activeDayIdx, act.id, 'time', e.target.value)} onBlur={() => sortDayActivities(activeDayIdx)} className="text-right font-extrabold text-zinc-800 dark:text-white bg-transparent focus:outline-none w-full text-sm" placeholder="00:00 - 00:00"/>
                                ) : (
                                    <span className="font-extrabold text-zinc-800 dark:text-white text-sm leading-tight">{act.time}</span>
                                )}
                            </div>
                            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-black/50 hover:-translate-y-1 transition-all duration-300">
                                <div className="flex flex-col sm:flex-row h-full">
                                    <div className="relative w-full h-40 sm:w-40 sm:h-auto flex-shrink-0 bg-slate-200 group/img">
                                        <img src={act.image} alt={act.title} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent sm:hidden"></div>
                                        <div className="absolute bottom-3 left-3 text-white font-bold sm:hidden text-lg drop-shadow-md">{act.time}</div>
                                        {isEditMode && (
                                            <button onClick={() => { setSelectedActivity(act); setModalOpen('image'); }} className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full backdrop-blur-md opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-black/70"><Edit3 size={14} /></button>
                                        )}
                                    </div>
                                    <div className="p-4 flex flex-col flex-grow relative min-w-0">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${getTypeColor(act.type)}`}>{getTypeIcon(act.type)} {act.type}</div>
                                            {isEditMode ? (
                                                <div className="flex gap-1"><GripVertical className="text-slate-300 cursor-grab" size={20} /><button onClick={() => handleDeleteActivity(act.id)} className="text-red-400 hover:text-red-600"><Trash2 size={18} /></button></div>
                                            ) : (
                                                <button onClick={() => setEmbeddedMaps(prev => ({...prev, [act.id]: !prev[act.id]}))} className={`transition-colors p-1 rounded-full ${embeddedMaps[act.id] ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50' : 'text-slate-300 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800'}`} title="Toggle Map"><MapPin size={18} /></button>
                                            )}
                                        </div>
                                        <div className="flex-grow">
                                            {isEditMode ? (
                                                <input value={act.title} onChange={(e) => handleUpdateActivity(activeDayIdx, act.id, 'title', e.target.value)} className="w-full font-bold text-lg text-zinc-900 dark:text-white bg-transparent border-b border-slate-200 mb-1 focus:outline-none"/>
                                            ) : (
                                                <h3 className="font-bold text-lg text-zinc-900 dark:text-white mb-1 group-hover:text-indigo-600 transition-colors truncate">{act.title}</h3>
                                            )}
                                            {isEditMode ? (
                                                <input value={act.desc} onChange={(e) => handleUpdateActivity(activeDayIdx, act.id, 'desc', e.target.value)} className="w-full text-xs text-zinc-500 bg-transparent border-b border-slate-200 focus:outline-none"/>
                                            ) : (
                                                <p className="text-xs text-zinc-500 dark:text-slate-400 line-clamp-2">{act.desc}</p>
                                            )}
                                        </div>
                                        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${embeddedMaps[act.id] ? 'h-48 mt-3 opacity-100' : 'h-0 mt-0 opacity-0'}`}>
                                            <div className="w-full h-full rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                                    <iframe width="100%" height="100%" frameBorder="0" style={{ border: 0 }} src={`https://maps.google.com/maps?q=${encodeURIComponent(act.title)}&t=&z=15&ie=UTF8&iwloc=&output=embed`} allowFullScreen></iframe>
                                            </div>
                                        </div>
                                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                            <details className="group/details w-full">
                                                <summary className="list-none flex items-center justify-between w-full cursor-pointer text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-wider">
                                                    <span className="flex items-center gap-1">Details & Notes <ChevronRight size={12} className="group-open/details:rotate-90 transition-transform" /></span>
                                                </summary>
                                                <div className="pt-2 text-sm text-zinc-600 dark:text-slate-300 leading-relaxed">
                                                    {isEditMode ? (
                                                        <textarea value={act.details} onChange={(e) => handleUpdateActivity(activeDayIdx, act.id, 'details', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border-none resize-none focus:ring-1 focus:ring-indigo-500" rows={3}/>
                                                    ) : (
                                                        act.details
                                                    )}
                                                </div>
                                            </details>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {isEditMode && (
                        <div onClick={() => setModalOpen('add')} className="relative md:grid md:grid-cols-[140px_1fr] gap-6 group cursor-pointer opacity-70 hover:opacity-100 transition-opacity">
                            <div className="absolute left-[9rem] top-8 w-3 h-3 bg-slate-200 dark:bg-slate-800 border-2 border-slate-400 rounded-full z-10 hidden md:block -translate-x-[5px]"></div>
                            <div className="hidden md:flex flex-col items-end pt-5 pr-4 text-right text-slate-400"><span className="font-mono text-sm">--:--</span></div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-8 flex flex-col items-center justify-center text-slate-400 hover:text-indigo-500 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all">
                                <Plus size={32} className="mb-2" />
                                <span className="font-bold">Add New Activity</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
          </>
        ) : (
            <CalendarView />
        )}

      </main>

      {isEditMode && viewMode === 'timeline' && (
          <button onClick={() => setModalOpen('add')} className="fixed bottom-8 right-8 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-2xl shadow-indigo-500/40 transition-all hover:scale-110 active:scale-95 z-50 print:hidden animate-in zoom-in"><Plus size={28} /></button>
      )}

      {/* Overlap Warning Modal */}
      <Modal isOpen={modalOpen === 'overlap'} onClose={() => { setModalOpen('add'); }} title="Time Conflict Detected">
          <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                  <div className="p-2 bg-amber-100 dark:bg-amber-800 rounded-full text-amber-600 dark:text-amber-200"><AlertTriangle size={24} /></div>
                  <div>
                      <h4 className="font-bold text-amber-800 dark:text-amber-100">Schedule Overlap</h4>
                      <p className="text-sm text-amber-700 dark:text-amber-200 mt-1">The time <strong>{pendingActivity?.time}</strong> conflicts with an existing activity:</p>
                      {overlapConflict && (
                          <div className="mt-3 p-3 bg-white dark:bg-slate-900 rounded-lg border border-amber-100 dark:border-slate-700">
                              <p className="font-bold text-sm text-slate-800 dark:text-white">{overlapConflict.title}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{overlapConflict.time}</p>
                          </div>
                      )}
                  </div>
              </div>
              <div className="flex gap-3 pt-2">
                  <button onClick={() => setModalOpen('add')} className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors">Cancel & Edit Time</button>
                  <button onClick={() => confirmAddActivity(pendingActivity)} className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-indigo-500/20">Add Anyway</button>
              </div>
          </div>
      </Modal>
      
      {/* Add Modal */}
      <Modal isOpen={modalOpen === 'add'} onClose={() => setModalOpen(null)} title="New Adventure">
        <form onSubmit={handleAddActivity} className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Time</label>
                    <input type="text" name="time" defaultValue={pendingActivity?.time || ""} placeholder="e.g. 14:00 - 15:30" className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3 border-none focus:ring-2 focus:ring-indigo-500 outline-none" required/>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Category</label>
                    <select name="type" defaultValue={pendingActivity?.type || "attraction"} className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3 border-none focus:ring-2 focus:ring-indigo-500 outline-none appearance-none">
                        <option value="attraction">Attraction</option>
                        <option value="food">Food</option>
                        <option value="shopping">Shopping</option>
                        <option value="travel">Travel</option>
                        <option value="other">Other</option>
                    </select>
                </div>
            </div>
            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Activity Title</label>
                <input type="text" name="title" defaultValue={pendingActivity?.title || ""} required placeholder="Where are we going?" className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3 border-none focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-lg" />
            </div>
            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Brief Description</label>
                <input type="text" name="desc" defaultValue={pendingActivity?.desc || ""} placeholder="A quick one-liner..." className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3 border-none focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
             <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Notes & Details</label>
                <textarea name="details" defaultValue={pendingActivity?.details || ""} rows={3} placeholder="Reservations, tips, directions..." className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3 border-none focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
            </div>
            <div className="pt-2">
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]">Add to Itinerary</button>
            </div>
        </form>
      </Modal>

      {/* Full Day Map Modal */}
      <Modal isOpen={modalOpen === 'fullMap'} onClose={() => setModalOpen(null)} title={`Map: ${activeDay.title}`} maxWidth="max-w-4xl">
         <div className="w-full h-[60vh] bg-slate-100 rounded-2xl overflow-hidden relative shadow-inner">
             {activeDay.activities.length > 0 ? (
                 <iframe width="100%" height="100%" frameBorder="0" style={{ border: 0 }} src={`https://maps.google.com/maps?q=${encodeURIComponent(activeDay.activities[0].title + ' ' + activeDay.activities[0].desc)}&t=&z=13&ie=UTF8&iwloc=&output=embed`} allowFullScreen></iframe>
             ) : (
                 <div className="flex items-center justify-center h-full text-slate-400">No locations to show.</div>
             )}
        </div>
        <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-sm">
            <p className="font-bold text-indigo-800 dark:text-indigo-200">Tip:</p>
            <p className="text-indigo-600 dark:text-indigo-300">This map centers on the first activity. Click the pin icon on individual cards for specific locations.</p>
        </div>
      </Modal>

      {/* Image Modal */}
      <Modal isOpen={modalOpen === 'image'} onClose={() => setModalOpen(null)} title="Update Photo">
         <div className="space-y-4">
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-100 shadow-md">
                <img src={selectedActivity?.image} alt="Preview" className="w-full h-full object-cover" />
            </div>
            <div className="space-y-2">
               <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Image Link</label>
               <input type="text" value={selectedActivity?.image || ''} onChange={(e) => handleUpdateActivity(activeDayIdx, selectedActivity.id, 'image', e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3 border-none focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-xs" />
            </div>
        </div>
      </Modal>

       {/* Settings Modal */}
       <Modal isOpen={modalOpen === 'settings'} onClose={() => setModalOpen(null)} title="Trip Settings">
        <div className="space-y-6">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/50 flex gap-4 items-start">
                 <div className="p-2 bg-indigo-100 dark:bg-indigo-800 rounded-lg text-indigo-600 dark:text-indigo-300"><Share2 size={20} /></div>
                 <div>
                     <h4 className="font-bold text-slate-900 dark:text-white text-sm">Manage Your Trips</h4>
                     <p className="text-xs text-slate-500 mt-1">Switch between itineraries via the dropdown in the header.</p>
                 </div>
            </div>
            <section className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Trip Name</label>
                    <input type="text" value={trip.title} onChange={(e) => updateCurrentTrip({ title: e.target.value })} className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3 border-none focus:ring-2 focus:ring-indigo-500 outline-none font-bold"/>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cover Image URL</label>
                    <input type="text" value={trip.coverImage} onChange={(e) => updateCurrentTrip({ coverImage: e.target.value })} className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3 border-none focus:ring-2 focus:ring-indigo-500 outline-none text-sm"/>
                </div>
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Start Date</label>
                    <input type="date" value={trip.startDate} onChange={(e) => updateCurrentTrip({ startDate: e.target.value })} className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3 border-none focus:ring-2 focus:ring-indigo-500 outline-none"/>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Companions</label>
                    <div className="flex flex-wrap gap-2">
                        {trip.companions.map((c, i) => (
                            <span key={i} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-sm flex items-center gap-1 group">
                                {c}
                                <button onClick={() => updateCurrentTrip({ companions: trip.companions.filter((_, idx) => idx !== i) })} className="text-slate-400 hover:text-red-500"><X size={12} /></button>
                            </span>
                        ))}
                    </div>
                    <form onSubmit={(e) => { e.preventDefault(); if (e.target.name.value) { updateCurrentTrip({ companions: [...trip.companions, e.target.name.value] }); e.target.name.value = ''; } }} className="flex gap-2">
                        <input name="name" placeholder="Add person..." className="flex-grow bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-2 border-none focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                        <button type="submit" className="bg-indigo-600 text-white px-4 rounded-xl text-sm font-bold">Add</button>
                    </form>
                </div>
            </section>
        </div>
      </Modal>

    </div>
  );
}