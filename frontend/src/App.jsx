import { useState, useEffect, useMemo } from 'react';
import Map, { Source, Layer } from 'react-map-gl';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Activity, AlertTriangle, Map as MapIcon, Settings, Sun, SunDim, SplitSquareHorizontal, BookOpen, ArrowRight, ChevronLeft, Search, Lock, MapPin, Navigation, Thermometer, CloudRain, Droplets, Clock, Loader2, GitCompare, Wind, Sparkles, HelpCircle, History, TrendingUp, UserCircle, X, Radar, Target, ShieldAlert, ChevronDown } from 'lucide-react';
import Joyride, { STATUS } from 'react-joyride';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = "pk.eyJ1IjoicmFrc2hhdGl3YXJpMjkwNyIsImEiOiJjbW1xNDgycDcwaXF3MnJzaWw2cjd1YmlxIn0._NmRmXxq0oQV7tWGc8Tf3g";

const weeklyData = [
  { day: 'Mon', temp: 24, precip: 12 }, { day: 'Tue', temp: 25, precip: 8 },
  { day: 'Wed', temp: 28, precip: 0 }, { day: 'Thu', temp: 30, precip: 0 },
  { day: 'Fri', temp: 29, precip: 5 }, { day: 'Sat', temp: 26, precip: 18 },
  { day: 'Sun', temp: 24, precip: 20 },
];

const locationTree = {
  "Asia": { "India": ["Maharashtra", "Uttar Pradesh", "Delhi"], "Japan": ["Honshu", "Hokkaido"] },
  "North America": { "United States": ["California", "New York", "Texas"], "Canada": ["Ontario", "British Columbia"] },
  "Europe": { "United Kingdom": ["England", "Scotland"], "France": ["Ile-de-France", "Provence"] }
};

const timeOptions = [
  { id: 'current', label: 'Current Time (Real-Time)' },
  { id: 'minus_24h', label: 'Last 24 Hours Avg' },
  { id: 'last_week', label: 'Last Week Avg' },
  { id: 'last_month', label: 'Last Month Avg' },
  { id: 'last_year', label: '1 Year Ago' }
];

function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [theme, setTheme] = useState('light');
  const isDark = theme === 'dark';

  const [showSettings, setShowSettings] = useState(false);
  const [appPin, setAppPin] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [unlockInput, setUnlockInput] = useState('');

  // AI TOUR STATE
  const [runTour, setRunTour] = useState(false);
  const tourDictionary = {
    dashboard: [
      { target: '.tour-controls', content: 'Use this dropdown to swap between climate data cubes.', disableBeacon: true },
      { target: '.tour-map', content: 'This interactive globe renders real-world data. Colors shift dynamically based on severity.', placement: 'right' },
      { target: '.tour-timeline', content: 'Scrub through the timeline to see how the climate shifted month by month.', placement: 'top' },
      { target: '.tour-risk', content: 'Click any dot on the map to see instant localized insights here. The AI also actively scans for global anomalies.', placement: 'left' }
    ],
    localSearch: [
      { target: '.search-mode-toggles', content: 'Toggle between browsing by Region or entering exact Latitude/Longitude coordinates.', disableBeacon: true },
      { target: '.search-inputs', content: 'Select your target location and desired timeframe.', placement: 'bottom' },
      { target: '.search-button', content: 'Click here to extract live data from the API pipeline.', placement: 'top' }
    ],
    comparison: [
      { target: '.comp-inputs', content: 'Select a region and two different years to compare historical climate shifts.', disableBeacon: true, placement: 'bottom' },
      { target: '.comp-button', content: 'Generate the multi-variable fingerprint to see year-over-year trends side-by-side.', placement: 'top' }
    ],
    aiStory: [
      { target: '.story-input', content: 'Enter a location to compute deep insights.', disableBeacon: true, placement: 'bottom' },
      { target: '.story-buttons', content: 'Generate a climate story, or generate a specialized Climate Personality profile.', placement: 'bottom' }
    ]
  };

  const [showAlert, setShowAlert] = useState(true);

  const [searchMode, setSearchMode] = useState('region');
  const [selectedContinent, setSelectedContinent] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [searchLat, setSearchLat] = useState('');
  const [searchLon, setSearchLon] = useState('');
  const [selectedTime, setSelectedTime] = useState('current');
  const [isSearching, setIsSearching] = useState(false);
  const [localWeatherResult, setLocalWeatherResult] = useState(null);

  const [metadata, setMetadata] = useState({ variables: [], times: [] });
  const [selectedVar, setSelectedVar] = useState('');
  const [timeIdx, setTimeIdx] = useState(0);
  const [mapData, setMapData] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [aiStory, setAiStory] = useState(null);

  // We avoid directly calling SetState inside useEffect if aiStory is available by conditionally rendering.
  // We'll keep showAlert state but control it more selectively.

  const [clickedMapPoint, setClickedMapPoint] = useState(null);
  const [storyLocation, setStoryLocation] = useState('');
  const [storyInsights, setStoryInsights] = useState(null);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);

  const [personalityProfile, setPersonalityProfile] = useState(null);
  const [activeInsight, setActiveInsight] = useState(null);
  const [isAnimatingMap, setIsAnimatingMap] = useState(false);

  const [compContinent, setCompContinent] = useState('');
  const [compCountry, setCompCountry] = useState('');
  const [compState, setCompState] = useState('');
  const [compYearA, setCompYearA] = useState('1998');
  const [compYearB, setCompYearB] = useState('2026');
  const [compData, setCompData] = useState(null);
  const [isComparing, setIsComparing] = useState(false);

  const [showRedirectModal, setShowRedirectModal] = useState(false);
  const [redirectType, setRedirectType] = useState(null);
  const [isStoryActiveOnMap, setIsStoryActiveOnMap] = useState(false);

  const [anomalyType, setAnomalyType] = useState(null); // 'unusual', 'outlier', 'break', 'risk'
  const [showAnomalyMenu, setShowAnomalyMenu] = useState(false);
  const [activeAnomalyResult, setActiveAnomalyResult] = useState(null);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/metadata').then(res => res.json()).then(data => { setMetadata(data); if (data.variables.length > 0) setSelectedVar(data.variables[0]); });
  }, []);

  useEffect(() => {
    let interval;
    if (isAnimatingMap && currentView === 'dashboard') {
      interval = setInterval(() => {
        setTimeIdx((prev) => (prev >= metadata.times.length - 1 ? 0 : prev + 1));
      }, 500); // Changes month every half second
    }
    return () => clearInterval(interval);
  }, [isAnimatingMap, currentView, metadata]);

  useEffect(() => {
    if (!selectedVar || currentView !== 'dashboard') return;
    fetch(`http://127.0.0.1:8000/api/map-data?variable=${selectedVar}&time_idx=${timeIdx}`).then(res => res.json()).then(data => {
      setMapData({ type: 'FeatureCollection', features: data.data.map(d => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [d.lon, d.lat] }, properties: { value: Number(d.value).toFixed(1), lat: Number(d.lat).toFixed(1), lon: Number(d.lon).toFixed(1) } })) });
    });
    fetch(`http://127.0.0.1:8000/api/trend-data?variable=${selectedVar}`).then(res => res.json()).then(data => setTrendData(data.trend));
    fetch(`http://127.0.0.1:8000/api/ai-story?variable=${selectedVar}&time_idx=${timeIdx}`).then(res => res.json()).then(data => setAiStory(data));
  }, [selectedVar, timeIdx, currentView]);

  const handleExecuteLocalSearch = async () => {
    setIsSearching(true);
    let resolvedLocation = '';
    let targetLat = searchLat;
    let targetLon = searchLon;

    try {
      if (searchMode === 'coords') {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${searchLat}&lon=${searchLon}&format=json`);
        const data = await res.json();
        resolvedLocation = `${data.address?.city || data.address?.town || data.address?.village || data.address?.county || "Unknown Area"}${data.address?.country ? `, ${data.address.country}` : ''}`;
      } else {
        resolvedLocation = `${selectedState || selectedCountry || selectedContinent}`;
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(resolvedLocation)}&format=json&limit=1`);
        const data = await res.json();
        if (data && data.length > 0) { targetLat = data[0].lat; targetLon = data[0].lon; }
        else { targetLat = 20; targetLon = 78; }
      }

      const weatherRes = await fetch(`http://127.0.0.1:8000/api/current-weather?lat=${targetLat}&lon=${targetLon}`);
      const weatherData = await weatherRes.json();

      setLocalWeatherResult({
        temp: weatherData.temp, precip: weatherData.precip, humidity: weatherData.humidity, wind_speed: weatherData.wind_speed,
        location: resolvedLocation, timeContext: timeOptions.find(t => t.id === selectedTime)?.label || 'Current Time',
        source: weatherData.source
      });
    } catch (err) {
      console.error(err);
      setLocalWeatherResult({ temp: 24.5, precip: 0.0, humidity: 65, wind_speed: 12.0, location: resolvedLocation || "Coordinates", timeContext: "Current Time", source: "PyClima Simulator (Fallback)" });
    }
    setIsSearching(false);
  };

  const handleExecuteComparison = () => {
    setIsComparing(true);
    const region = compState || compCountry || compContinent || 'Global';
    fetch(`http://127.0.0.1:8000/api/compare?region=${region}&year_a=${compYearA}&year_b=${compYearB}`).then(res => res.json()).then(data => { setCompData(data); setIsComparing(false); });
  };

  const handleTourCallback = (data) => {
    const { status } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRunTour(false);
    }
  };

  const circleLayer = useMemo(() => {
    let colors = [0, '#4ade80', 20, '#facc15', 30, '#f97316', 40, '#ef4444'];
    if (selectedVar === 'Humidity') colors = [0, '#facc15', 50, '#4ade80', 80, '#3b82f6', 100, '#1e3a8a'];
    if (selectedVar === 'Wind Speed') colors = [0, '#4ade80', 20, '#facc15', 50, '#f97316', 100, '#ef4444'];
    if (selectedVar === 'Precipitation') colors = [0, '#fde047', 10, '#4ade80', 20, '#3b82f6', 50, '#1e3a8a'];
    return { id: 'climate-circles', type: 'circle', paint: { 'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 4.5, 6, 9, 10, 16], 'circle-color': ['interpolate', ['linear'], ['to-number', ['get', 'value']], ...colors], 'circle-opacity': 0.85, 'circle-stroke-width': 1, 'circle-stroke-color': '#0f172a' } };
  }, [selectedVar]);

  const symbolLayer = useMemo(() => ({
    id: 'climate-labels', type: 'symbol',
    layout: { 'text-field': ['concat', ['get', 'value'], '\n[', ['get', 'lat'], ', ', ['get', 'lon'], ']'], 'text-size': ['interpolate', ['linear'], ['zoom'], 2, 8.5, 6, 12, 10, 16], 'text-offset': ['interpolate', ['linear'], ['zoom'], 2, [0, 1.2], 6, [0, 1.5], 10, [0, 2]], 'text-anchor': 'top', 'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'] },
    paint: { 'text-color': '#e2e8f0', 'text-halo-color': '#0f172a', 'text-halo-width': 1.5 }
  }), []);

  if (isLocked) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white flex-col gap-6">
        <div className="p-6 bg-slate-800 rounded-full shadow-2xl"><Lock size={48} className="text-blue-500" /></div>
        <h1 className="text-3xl font-bold tracking-widest">SYSTEM LOCKED</h1>
        <div className="flex gap-2">
          <input type="password" placeholder="Enter PIN" value={unlockInput} onChange={(e) => setUnlockInput(e.target.value)} className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-center tracking-widest outline-none focus:border-blue-500" />
          <button onClick={() => { if (unlockInput === appPin) { setIsLocked(false); setUnlockInput(''); } else { alert("Incorrect PIN"); } }} className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-bold transition-all">Unlock</button>
        </div>
      </div>
    );
  }

  if (currentView === 'landing') {
    return (
      <div className={`min-h-screen font-sans flex flex-col transition-colors duration-500 ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
        <header className={`h-16 border-b flex items-center justify-between px-8 shadow-sm transition-colors duration-500 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-3"><div className={`p-2 rounded-lg ${isDark ? 'bg-blue-900/30' : 'bg-blue-100'}`}><MapIcon className="text-blue-600" size={24} /></div><h1 className={`text-xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>PyClimaExplorer<span className="text-blue-600">+</span></h1></div>
          <div className={`flex items-center gap-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <button className="hover:text-blue-600 font-medium transition-colors">Documentation</button><button className="hover:text-blue-600 font-medium transition-colors">API</button>
            <button onClick={() => setTheme(isDark ? 'light' : 'dark')} className="hover:text-blue-600 transition-colors">{isDark ? <SunDim size={20} /> : <Sun size={24} className="text-amber-500" />}</button>
            <button onClick={() => setShowSettings(true)} className="hover:text-blue-600 transition-colors"><Settings size={20} /></button>
          </div>
        </header>

        {showSettings && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className={`p-8 rounded-2xl shadow-2xl w-96 ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}`}>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Lock size={20} /> Security Settings</h2>
              <p className={`text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Set a PIN to lock your dashboard from unauthorized access.</p>
              <input type="password" placeholder="Enter new 4-digit PIN" maxLength={4} onChange={(e) => setAppPin(e.target.value)} className={`w-full p-3 rounded-lg border outline-none mb-4 ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`} />
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowSettings(false)} className="px-4 py-2 rounded-lg font-medium text-slate-500">Cancel</button>
                <button onClick={() => { if (appPin) { setIsLocked(true); setShowSettings(false); } }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow-lg">Apply & Lock App</button>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 max-w-7xl w-full mx-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 flex flex-col gap-8">
            <section className={`p-8 rounded-2xl border shadow-sm transition-colors duration-500 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <span className="inline-block px-3 py-1 bg-blue-600/20 text-blue-500 font-bold text-xs rounded-full mb-4 uppercase tracking-wider">Live System Active</span>
              <h2 className={`text-4xl font-black mb-4 leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Global Climate Risk <br /> Intelligence Platform</h2>
              <p className={`text-lg mb-8 max-w-xl ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Analyze multi-dimensional NetCDF data, detect regional climate anomalies, and generate AI-driven risk assessments in real-time.</p>
              <button onClick={() => setCurrentView('dashboard')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg flex items-center gap-2 text-lg group w-max">Launch Interactive Map <ArrowRight className="group-hover:translate-x-1 transition-transform" /></button>
            </section>
            <section className={`p-6 rounded-2xl border shadow-sm flex-1 transition-colors duration-500 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <h3 className={`text-lg font-bold mb-6 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}><Activity size={20} className="text-blue-500" /> 7-Day Global Weather Volatility</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData}>
                    <defs><linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} vertical={false} /><XAxis dataKey="day" stroke="#64748b" axisLine={false} tickLine={false} /><YAxis stroke="#64748b" axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: isDark ? '#1e293b' : '#fff', color: isDark ? '#fff' : '#000' }} /><Area type="monotone" dataKey="temp" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>
          <aside className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2 px-2">Analysis Modules</h3>
            <button onClick={() => setCurrentView('localSearch')} className={`p-6 rounded-2xl border shadow-sm hover:border-blue-400 transition-all text-left group ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className="h-12 w-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Search size={24} /></div>
              <h4 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>Local Weather Search</h4>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Search global coordinates or regions to extract precise temperature, precipitation & humidity data.</p>
            </button>
            <button onClick={() => setCurrentView('comparison')} className={`p-6 rounded-2xl border shadow-sm hover:border-purple-400 transition-all text-left group ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className="h-12 w-12 bg-purple-500/10 text-purple-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><SplitSquareHorizontal size={24} /></div>
              <h4 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>Comparison Mode</h4>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Side-by-side temporal analysis across multiple climate variables.</p>
            </button>
            <button onClick={() => setCurrentView('aiStory')} className={`p-6 rounded-2xl border shadow-sm hover:border-emerald-400 transition-all text-left group ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className="h-12 w-12 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><BookOpen size={24} /></div>
              <h4 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>AI Story Mode</h4>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Intelligently compute climate trends and generate human-readable insights.</p>
            </button>
          </aside>
        </main>
      </div>
    );
  }

  if (currentView === 'localSearch') {
    return (
      <div className={`min-h-screen font-sans flex flex-col transition-colors duration-500 ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
        <header className={`h-16 border-b flex items-center justify-between px-8 shadow-sm transition-colors duration-500 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <button onClick={() => setCurrentView('landing')} className={`flex items-center gap-2 font-medium transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}><ChevronLeft size={20} /> Back to Dashboard</button>
          <button onClick={() => setRunTour(true)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 transition-colors"><HelpCircle size={20}/></button>
        </header>

        <main className="flex-1 max-w-5xl w-full mx-auto p-8 flex flex-col gap-8">
          <div><h2 className="text-3xl font-black mb-2 flex items-center gap-3"><Search className="text-blue-500" /> Precise Local Weather Search</h2><p className={`${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Target specific regions or coordinates to extract real-time meteorological data.</p></div>
          <div className={`p-8 rounded-2xl border shadow-sm ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className="search-mode-toggles flex gap-4 mb-6 border-b pb-4 border-slate-200 dark:border-slate-700">
              <button onClick={() => setSearchMode('region')} className={`pb-2 px-2 font-bold transition-all ${searchMode === 'region' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-slate-400'}`}><MapPin className="inline mr-2" size={18} />Browse by Region</button>
              <button onClick={() => setSearchMode('coords')} className={`pb-2 px-2 font-bold transition-all ${searchMode === 'coords' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-slate-400'}`}><Navigation className="inline mr-2" size={18} />Enter Coordinates</button>
            </div>

            {searchMode === 'region' && (
              <div className="search-inputs grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div><label className="block text-sm font-bold mb-2 text-slate-500">Continent</label><select value={selectedContinent} onChange={(e) => { setSelectedContinent(e.target.value); setSelectedCountry(''); setSelectedState(''); }} className={`w-full p-3 rounded-lg border outline-none ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}><option value="">Select Continent...</option>{Object.keys(locationTree).map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div><label className="block text-sm font-bold mb-2 text-slate-500">Country</label><select value={selectedCountry} onChange={(e) => { setSelectedCountry(e.target.value); setSelectedState(''); }} disabled={!selectedContinent} className={`w-full p-3 rounded-lg border outline-none ${!selectedContinent ? 'opacity-50 cursor-not-allowed' : ''} ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}><option value="">Select Country...</option>{selectedContinent && Object.keys(locationTree[selectedContinent]).map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                <div><label className="block text-sm font-bold mb-2 text-slate-500">State / Region</label><select value={selectedState} onChange={(e) => setSelectedState(e.target.value)} disabled={!selectedCountry} className={`w-full p-3 rounded-lg border outline-none ${!selectedCountry ? 'opacity-50 cursor-not-allowed' : ''} ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}><option value="">Select State...</option>{selectedCountry && locationTree[selectedContinent][selectedCountry].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div><label className="block text-sm font-bold mb-2 text-slate-500 text-blue-500 flex items-center gap-1"><Clock size={14} /> Temporal Range</label><select value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} className={`w-full p-3 rounded-lg border outline-none ring-1 ring-blue-500/50 ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}>{timeOptions.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}</select></div>
              </div>
            )}

            {searchMode === 'coords' && (
              <div className="search-inputs grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div><label className="block text-sm font-bold mb-2 text-slate-500">Latitude (-90 to 90)</label><input type="number" placeholder="e.g. 28.61" value={searchLat} onChange={(e) => setSearchLat(e.target.value)} className={`w-full p-3 rounded-lg border outline-none ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`} /></div>
                <div><label className="block text-sm font-bold mb-2 text-slate-500">Longitude (-180 to 180)</label><input type="number" placeholder="e.g. 77.20" value={searchLon} onChange={(e) => setSearchLon(e.target.value)} className={`w-full p-3 rounded-lg border outline-none ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`} /></div>
                <div><label className="block text-sm font-bold mb-2 text-slate-500 text-blue-500 flex items-center gap-1"><Clock size={14} /> Temporal Range</label><select value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} className={`w-full p-3 rounded-lg border outline-none ring-1 ring-blue-500/50 ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}>{timeOptions.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}</select></div>
              </div>
            )}

            <button onClick={handleExecuteLocalSearch} disabled={isSearching || (searchMode === 'region' ? !selectedContinent : (!searchLat || !searchLon))} className="search-button w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-500 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2">
              {isSearching ? <><Loader2 className="animate-spin" /> Scanning Live Satellite Feeds...</> : 'Extract Target Weather Data'}
            </button>
          </div>

          {localWeatherResult && (
            <div className={`p-8 rounded-2xl border shadow-lg animate-in fade-in slide-in-from-bottom-4 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b pb-4 border-slate-200 dark:border-slate-700">
                <h3 className="text-xl font-bold flex items-center gap-2"><MapPin className="text-blue-500" />{localWeatherResult.location}</h3>
                <div className="flex gap-2 mt-2 md:mt-0">
                  <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${localWeatherResult.source && localWeatherResult.source.includes('Live') ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    Data: {localWeatherResult.source}
                  </span>
                  <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${isDark ? 'bg-slate-900 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
                    Timeframe: {localWeatherResult.timeContext}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className={`p-6 rounded-xl border flex flex-col items-center justify-center gap-2 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}><Thermometer className="text-orange-500" size={32} /><span className="text-slate-500 text-sm font-bold uppercase text-center">Temperature</span><span className="text-2xl font-black">{localWeatherResult.temp}°C</span></div>
                <div className={`p-6 rounded-xl border flex flex-col items-center justify-center gap-2 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}><CloudRain className="text-blue-500" size={32} /><span className="text-slate-500 text-sm font-bold uppercase text-center">Precipitation</span><span className="text-2xl font-black">{localWeatherResult.precip} mm</span></div>
                <div className={`p-6 rounded-xl border flex flex-col items-center justify-center gap-2 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}><Droplets className="text-teal-500" size={32} /><span className="text-slate-500 text-sm font-bold uppercase text-center">Humidity</span><span className="text-2xl font-black">{localWeatherResult.humidity}%</span></div>
                <div className={`p-6 rounded-xl border flex flex-col items-center justify-center gap-2 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}><Wind className="text-gray-400" size={32} /><span className="text-slate-500 text-sm font-bold uppercase text-center">Wind Speed</span><span className="text-2xl font-black">{localWeatherResult.wind_speed} km/h</span></div>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  if (currentView === 'comparison') {
    return (
      <div className={`min-h-screen font-sans flex flex-col transition-colors duration-500 ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
        <header className={`h-16 border-b flex items-center justify-between px-8 shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <button onClick={() => setCurrentView('landing')} className={`flex items-center gap-2 font-medium ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}><ChevronLeft size={20} /> Back to Dashboard</button>
          <button onClick={() => setRunTour(true)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 transition-colors"><HelpCircle size={20}/></button>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto p-8 flex flex-col gap-8">
          <div><h2 className="text-3xl font-black mb-2 flex items-center gap-3"><GitCompare className="text-purple-500" /> Multi-Variable Temporal Shift</h2><p className={`${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Simultaneously track Temperature, Humidity, Wind, and Precipitation shifts year-over-year.</p></div>
          <div className={`p-8 rounded-2xl border shadow-sm ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className="comp-inputs grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <div className="md:col-span-1"><label className="block text-sm font-bold mb-2 text-slate-500">Continent</label><select value={compContinent} onChange={(e) => { setCompContinent(e.target.value); setCompCountry(''); setCompState(''); }} className={`w-full p-3 rounded-lg border outline-none ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}><option value="">Global</option>{Object.keys(locationTree).map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div className="md:col-span-1"><label className="block text-sm font-bold mb-2 text-slate-500">Country</label><select value={compCountry} onChange={(e) => { setCompCountry(e.target.value); setCompState(''); }} disabled={!compContinent} className={`w-full p-3 rounded-lg border outline-none ${!compContinent ? 'opacity-50' : ''} ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}><option value="">All Countries...</option>{compContinent && Object.keys(locationTree[compContinent]).map(s => <option key={s} value={s}>{s}</option>)}</select></div>
              <div className="md:col-span-1"><label className="block text-sm font-bold mb-2 text-slate-500">State / Region</label><select value={compState} onChange={(e) => setCompState(e.target.value)} disabled={!compCountry} className={`w-full p-3 rounded-lg border outline-none ${!compCountry ? 'opacity-50' : ''} ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}><option value="">All States...</option>{compCountry && locationTree[compContinent][compCountry].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
              <div className="md:col-span-1"><label className="block text-sm font-bold mb-2 text-slate-500 text-purple-500">Base Year</label><input type="number" value={compYearA} onChange={(e) => setCompYearA(e.target.value)} className={`w-full p-3 rounded-lg border outline-none ring-1 ring-purple-500/50 ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`} /></div>
              <div className="md:col-span-1"><label className="block text-sm font-bold mb-2 text-slate-500 text-purple-500">Compare Year</label><input type="number" value={compYearB} onChange={(e) => setCompYearB(e.target.value)} className={`w-full p-3 rounded-lg border outline-none ring-1 ring-purple-500/50 ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`} /></div>
            </div>
            <button onClick={handleExecuteComparison} disabled={isComparing || !compYearA || !compYearB} className="comp-button w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2">{isComparing ? <><Loader2 className="animate-spin" /> Analyzing Deep Trends...</> : 'Generate Multi-Variable Fingerprint'}</button>
          </div>
          {compData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4">
              <div className={`p-8 rounded-2xl border shadow-lg flex flex-col h-[500px] ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                <div className="flex justify-between items-center mb-6 border-b pb-4 border-slate-200 dark:border-slate-700">
                  <h3 className="text-xl font-bold"><span className="text-purple-500">Year {compYearA}</span> Climate Data ({compState || compCountry || compContinent || 'Global'})</h3>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{compData.source}</span>
                </div>
                <div className="flex-1 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={compData.yearA_data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} /><XAxis dataKey="month" stroke={isDark ? '#94a3b8' : '#64748b'} /><YAxis yAxisId="left" stroke={isDark ? '#94a3b8' : '#64748b'} domain={['auto', 'auto']} /><YAxis yAxisId="right" orientation="right" stroke={isDark ? '#94a3b8' : '#64748b'} domain={['auto', 'auto']} /><Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', color: isDark ? '#fff' : '#000', borderRadius: '8px', border: 'none' }} /><Legend verticalAlign="top" height={36} /><Line yAxisId="left" type="monotone" dataKey="Temperature" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} /><Line yAxisId="right" type="monotone" dataKey="Humidity" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} /><Line yAxisId="right" type="monotone" dataKey="Wind Speed" stroke="#a855f7" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} /><Line yAxisId="left" type="monotone" dataKey="Precipitation" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} /></LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className={`p-8 rounded-2xl border shadow-lg flex flex-col h-[500px] ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                <div className="flex justify-between items-center mb-6 border-b pb-4 border-slate-200 dark:border-slate-700">
                  <h3 className="text-xl font-bold"><span className="text-blue-500">Year {compYearB}</span> Climate Data ({compState || compCountry || compContinent || 'Global'})</h3>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{compData.source}</span>
                </div>
                <div className="flex-1 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={compData.yearB_data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} /><XAxis dataKey="month" stroke={isDark ? '#94a3b8' : '#64748b'} /><YAxis yAxisId="left" stroke={isDark ? '#94a3b8' : '#64748b'} domain={['auto', 'auto']} /><YAxis yAxisId="right" orientation="right" stroke={isDark ? '#94a3b8' : '#64748b'} domain={['auto', 'auto']} /><Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', color: isDark ? '#fff' : '#000', borderRadius: '8px', border: 'none' }} /><Legend verticalAlign="top" height={36} /><Line yAxisId="left" type="monotone" dataKey="Temperature" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} /><Line yAxisId="right" type="monotone" dataKey="Humidity" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} /><Line yAxisId="right" type="monotone" dataKey="Wind Speed" stroke="#a855f7" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} /><Line yAxisId="left" type="monotone" dataKey="Precipitation" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} /></LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  if (currentView === 'aiStory') {
    const handleGenerateStory = async () => {
      setIsGeneratingStory(true); setStoryInsights(null); setPersonalityProfile(null); setActiveInsight(null);
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/smart-insights?region=${storyLocation}`);
        const data = await res.json();
        setTimeout(() => { setStoryInsights(data); setIsGeneratingStory(false); }, 2000);
      } catch { setIsGeneratingStory(false); }
    };

    const handlePersonality = async () => {
      setIsGeneratingStory(true); setStoryInsights(null); setPersonalityProfile(null); setActiveInsight(null);
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/climate-personality?region=${storyLocation}`);
        const data = await res.json();
        setTimeout(() => { setPersonalityProfile(data); setIsGeneratingStory(false); }, 1500);
      } catch { setIsGeneratingStory(false); }
    };

    const fetchInsight = async (type) => {
      const res = await fetch(`http://127.0.0.1:8000/api/deep-insights?region=${storyLocation}&type=${type}`);
      const data = await res.json();
      setActiveInsight({ type, text: data.text });
      
      if (type === 'evaluation' || type === 'future') {
        setRedirectType(type);
        // Wait 15 seconds as requested before showing the "Want to redirect?" modal
        setTimeout(() => {
          setShowRedirectModal(true);
        }, 15000); 
      }
    };

    return (
      <div className={`min-h-screen font-sans flex flex-col transition-colors duration-500 ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
        <header className={`h-16 border-b flex items-center justify-between px-8 shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
           <button onClick={() => setCurrentView('landing')} className={`flex items-center gap-2 font-medium ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}><ChevronLeft size={20} /> Back to Dashboard</button>
           <button onClick={() => setRunTour(true)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 transition-colors"><HelpCircle size={20}/></button>
        </header>

        <main className="flex-1 max-w-4xl w-full mx-auto p-8 flex flex-col gap-8 pb-24">
          <div className="text-center">
            <h2 className="text-3xl font-black mb-2 flex items-center justify-center gap-3"><BookOpen className="text-emerald-500"/> AI Story Guide</h2>
            <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Enter a location to intelligently compute climate trends or generate a climate personality profile.</p>
          </div>

          <div className={`p-8 rounded-2xl border shadow-sm flex gap-4 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
             <div className="story-input flex-1"><input type="text" placeholder="e.g. Southern India" value={storyLocation} onChange={(e) => setStoryLocation(e.target.value)} className={`w-full p-3 rounded-lg border outline-none ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}/></div>
             <div className="story-buttons flex gap-4">
               <button onClick={handleGenerateStory} disabled={!storyLocation || isGeneratingStory} className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg flex items-center gap-2">
                 {isGeneratingStory && !personalityProfile ? <Loader2 className="animate-spin"/> : <Sparkles size={18} />} Generate Story
               </button>
               <button onClick={handlePersonality} disabled={!storyLocation || isGeneratingStory} className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg flex items-center gap-2">
                 <UserCircle size={18}/> Personality
               </button>
             </div>
          </div>

          {isGeneratingStory && (
            <div className="flex flex-col items-center justify-center p-12 text-emerald-500 font-mono text-sm gap-4 animate-pulse">
               <p>Filtered dataset</p><p>↓</p><p>Compute statistics</p><p>↓</p><p>Generate insights</p><p>↓</p><p>Convert to text explanation</p>
            </div>
          )}

          {/* PERSONALITY PROFILE CARD */}
          {personalityProfile && !isGeneratingStory && (
            <div className={`p-8 rounded-2xl border border-purple-500/30 animate-in fade-in slide-in-from-bottom-4 shadow-[0_0_30px_rgba(168,85,247,0.15)] ${isDark ? 'bg-purple-900/10' : 'bg-purple-50'}`}>
              <div className="flex items-center gap-3 mb-6 border-b border-purple-500/20 pb-4">
                <UserCircle className="text-purple-500" size={32} />
                <div><h3 className="text-2xl font-black">{personalityProfile.location}</h3><p className="text-purple-500 font-bold uppercase tracking-widest text-sm">{personalityProfile.archetype}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div><p className="text-sm text-slate-500 font-bold uppercase mb-1">Temperature</p><p className="font-medium">{personalityProfile.temperature}</p></div>
                <div><p className="text-sm text-slate-500 font-bold uppercase mb-1">Rainfall</p><p className="font-medium">{personalityProfile.rainfall}</p></div>
                <div><p className="text-sm text-slate-500 font-bold uppercase mb-1">Wind</p><p className="font-medium">{personalityProfile.wind}</p></div>
                <div><p className="text-sm text-red-400 font-bold uppercase mb-1">Climate Risk</p><p className="font-medium">{personalityProfile.risk_profile}</p></div>
              </div>
            </div>
          )}

          {/* AI STORY INSIGHTS */}
          {storyInsights && !isGeneratingStory && (
            <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className={`p-6 rounded-xl border border-emerald-500/30 ${isDark ? 'bg-emerald-900/10' : 'bg-emerald-50'}`}>
                    <h4 className="text-emerald-500 font-bold mb-2 uppercase tracking-wider text-sm flex items-center gap-2"><Thermometer size={16}/> Temp Trend</h4>
                    <p className="font-medium">{storyInsights.temp_trend}</p>
                 </div>
                 <div className={`p-6 rounded-xl border border-orange-500/30 ${isDark ? 'bg-orange-900/10' : 'bg-orange-50'}`}>
                    <h4 className="text-orange-500 font-bold mb-2 uppercase tracking-wider text-sm flex items-center gap-2"><Sun size={16}/> Heatwave Risk</h4>
                    <p className="font-medium">{storyInsights.heatwave_risk}</p>
                 </div>
                 <div className={`p-6 rounded-xl border border-blue-500/30 ${isDark ? 'bg-blue-900/10' : 'bg-blue-50'}`}>
                    <h4 className="text-blue-500 font-bold mb-2 uppercase tracking-wider text-sm flex items-center gap-2"><CloudRain size={16}/> Climate Pattern</h4>
                    <p className="font-medium">{storyInsights.climate_pattern}</p>
                 </div>
              </div>

              {/* BUBBLY INTERACTIVE BUTTONS */}
              <div className="flex justify-center gap-12 mt-4">
                <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => fetchInsight('why')}>
                  <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:border-blue-400 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all">
                    <HelpCircle className="text-blue-400" size={28}/>
                  </div>
                  <span className="text-xs font-bold text-slate-400 group-hover:text-blue-400">Why is this happening?</span>
                </div>
                
                <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => fetchInsight('evaluation')}>
                  <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:border-purple-400 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all">
                    <History className="text-purple-400" size={28}/>
                  </div>
                  <span className="text-xs font-bold text-slate-400 group-hover:text-purple-400">Evaluation (Auto-Map)</span>
                </div>

                <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => fetchInsight('future')}>
                  <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:border-emerald-400 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all">
                    <TrendingUp className="text-emerald-400" size={28}/>
                  </div>
                  <span className="text-xs font-bold text-slate-400 group-hover:text-emerald-400">Future Prediction (Auto-Map)</span>
                </div>
              </div>

              {/* ACTIVE INSIGHT DISPLAY */}
              {activeInsight && (
                <div className="p-6 rounded-xl border border-slate-600 bg-slate-800 text-slate-200 shadow-xl animate-in zoom-in-95">
                  <p className="text-lg leading-relaxed">{activeInsight.text}</p>
                  {(activeInsight.type === 'evaluation' || activeInsight.type === 'future') && (
                    <p className="text-xs text-blue-400 font-bold uppercase tracking-widest mt-4 animate-pulse">Generating Map Configuration...</p>
                  )}
                </div>
              )}
            </div>
          )}

          {showRedirectModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
              <div className={`p-8 rounded-3xl shadow-2xl max-w-md w-full border border-emerald-500/30 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
                <div className="bg-emerald-500/20 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto animate-bounce">
                  <MapIcon className="text-emerald-500" size={32} />
                </div>
                <h3 className="text-2xl font-black text-center mb-4">Visualize on Globe?</h3>
                <p className="text-center text-slate-400 mb-8 leading-relaxed">
                  We have generated the {redirectType} model for <strong>{storyLocation}</strong>. Would you like to redirect to the interactive globe to view the live time-lapse?
                </p>
                <div className="flex gap-4">
                  <button onClick={() => setShowRedirectModal(false)} className="flex-1 py-3 font-bold text-slate-500 hover:text-slate-300 transition-colors">Not Now</button>
                  <button 
                    onClick={() => {
                      setShowRedirectModal(false);
                      setIsStoryActiveOnMap(true); // Flag that we are in "Story Mode"
                      setIsAnimatingMap(true);
                      setCurrentView('dashboard');
                    }} 
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all"
                  >
                    Yes, Redirect
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  // --- DASHBOARD (MAP) VIEW ---
  return (
    <div className="h-screen w-screen flex flex-col bg-[#0f172a] text-slate-100 font-sans overflow-hidden">

      <Joyride
        steps={tourDictionary[currentView] || []}
        run={runTour}
        continuous={true}
        showSkipButton={true}
        callback={handleTourCallback}
        styles={{ options: { zIndex: 10000, primaryColor: '#8b5cf6', backgroundColor: '#1e293b', textColor: '#f8fafc' } }}
      />

      <header className="h-16 bg-slate-900/80 border-b border-slate-700 flex items-center justify-between px-6 shrink-0 z-10 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <button onClick={() => setCurrentView('landing')} className="text-slate-400 hover:text-white flex items-center gap-1 font-medium bg-slate-800 px-3 py-1.5 rounded-lg"><ChevronLeft size={16} /> Exit</button>
          {isStoryActiveOnMap && (
            <button 
              onClick={() => {
                setIsStoryActiveOnMap(false);
                setIsAnimatingMap(false);
                setActiveInsight(null);
                setClickedMapPoint(null);
              }}
              className="bg-red-500/20 text-red-400 border border-red-500/50 px-4 py-1.5 rounded-lg text-sm font-black flex items-center gap-2 hover:bg-red-500 hover:text-white transition-all animate-pulse"
            >
              <X size={16} /> Exit Story Mode
            </button>
          )}
          <div className="h-6 w-px bg-slate-700"></div><div className="flex items-center gap-3"><MapIcon className="text-blue-400" size={24} /><h1 className="text-lg font-bold tracking-tight">PyClimaExplorer<span className="text-blue-500">+</span></h1></div>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative">
            <button 
              onClick={() => setShowAnomalyMenu(!showAnomalyMenu)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-bold text-sm transition-all border ${anomalyType ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-700'}`}
            >
              <Radar size={16} className={anomalyType ? 'animate-pulse text-indigo-400' : 'text-slate-400'}/>
              {anomalyType ? 'Anomaly Mode Active' : 'Anomaly Diagnostics'}
              <ChevronDown size={14} className="text-slate-500"/>
            </button>

            {showAnomalyMenu && (
              <div className="absolute top-12 right-0 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="p-3 border-b border-slate-800 bg-slate-800/80">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Diagnostic Tool</span>
                </div>
                <button onClick={() => { setAnomalyType('unusual'); setShowAnomalyMenu(false); setActiveAnomalyResult(null); setClickedMapPoint(null); }} className="w-full text-left p-3 hover:bg-slate-800 flex items-center gap-3 transition-colors border-b border-slate-800/50">
                  <Activity size={18} className="text-blue-400"/>
                  <div><p className="text-sm font-bold text-slate-200">What's Unusual Here?</p><p className="text-[10px] text-slate-500">Compare to historical baseline</p></div>
                </button>
                <button onClick={() => { setAnomalyType('outlier'); setShowAnomalyMenu(false); setActiveAnomalyResult(null); setClickedMapPoint(null); }} className="w-full text-left p-3 hover:bg-slate-800 flex items-center gap-3 transition-colors border-b border-slate-800/50">
                  <Target size={18} className="text-purple-400"/>
                  <div><p className="text-sm font-bold text-slate-200">Spatial Outlier Finder</p><p className="text-[10px] text-slate-500">Compare to nearby regions</p></div>
                </button>
                <button onClick={() => { setAnomalyType('break'); setShowAnomalyMenu(false); setActiveAnomalyResult(null); setClickedMapPoint(null); }} className="w-full text-left p-3 hover:bg-slate-800 flex items-center gap-3 transition-colors border-b border-slate-800/50">
                  <GitCompare size={18} className="text-orange-400"/>
                  <div><p className="text-sm font-bold text-slate-200">Pattern Break Detector</p><p className="text-[10px] text-slate-500">Find long-term cycle shifts</p></div>
                </button>
                <button onClick={() => { setAnomalyType('risk'); setShowAnomalyMenu(false); setActiveAnomalyResult(null); setClickedMapPoint(null); }} className="w-full text-left p-3 hover:bg-slate-800 flex items-center gap-3 transition-colors">
                  <ShieldAlert size={18} className="text-red-400"/>
                  <div><p className="text-sm font-bold text-slate-200">Risk Simulation Indicator</p><p className="text-[10px] text-slate-500">Aggregate multi-threat stability</p></div>
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 tour-controls">
            <label className="text-sm text-slate-400 font-medium">Variable:</label>
            <select className="bg-[#1e293b] border border-slate-600 text-white text-sm rounded-lg p-2 outline-none" value={selectedVar} onChange={(e) => setSelectedVar(e.target.value)}>{metadata.variables.map(v => <option key={v} value={v}>{v}</option>)}</select>
          </div>
          <button onClick={() => setRunTour(true)} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"><HelpCircle size={20}/></button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        <main className="flex-1 flex flex-col relative tour-map">

          {/* THE ANOMALY ALERT BANNER */}
          {aiStory && aiStory.risk_level === 'HIGH' && showAlert && (
            <div 
              className="absolute top-6 left-1/2 transform -translate-x-1/2 z-20 bg-red-900/90 border-2 border-red-500 text-white px-6 py-3 rounded-2xl shadow-[0_0_40px_rgba(239,68,68,0.7)] flex items-center gap-4 animate-pulse backdrop-blur-md cursor-pointer hover:bg-red-800 transition-colors"
              onClick={() => setClickedMapPoint({ lat: aiStory.hotspot_lat, lon: aiStory.hotspot_lon, val: aiStory.hotspot_val, isAlert: true, variable: selectedVar })}
            >
               <button 
                 onClick={(e) => { e.stopPropagation(); setShowAlert(false); }} 
                 className="absolute -top-3 -left-3 bg-slate-800 rounded-full p-1.5 border border-red-500 hover:bg-red-500 text-slate-300 hover:text-white transition-colors"
               >
                 <X size={14} />
               </button>
               <div className="bg-red-500 p-2 rounded-full"><AlertTriangle className="text-white" size={20}/></div>
               <div>
                   <p className="font-black tracking-widest text-xs text-red-300 uppercase drop-shadow-md">Critical Weather Event Detected</p>
                   <p className="font-medium text-sm text-slate-100">{aiStory.recommendation}</p>
               </div>
            </div>
          )}

          <div className="flex-1 relative">
            {mapData && (
              <Map 
                initialViewState={{ longitude: 78, latitude: 20, zoom: 2.5 }} 
                mapStyle="mapbox://styles/mapbox/satellite-streets-v12" 
                mapboxAccessToken={MAPBOX_TOKEN} 
                style={{ filter: 'brightness(0.65) saturate(1.1) contrast(1.1)' }}
                interactiveLayerIds={['climate-circles']}
                onClick={(e) => {
                  if (e.features && e.features.length > 0) {
                    const f = e.features[0];
                    const lat = f.properties.lat;
                    const lon = f.properties.lon;
                    const val = f.properties.value;
                    
                    if (anomalyType) {
                      setClickedMapPoint({ lat, lon, val, variable: selectedVar }); // Keep coords for reference
                      fetch(`http://127.0.0.1:8000/api/anomaly-detect?lat=${lat}&lon=${lon}&variable=${selectedVar}&type=${anomalyType}&time_idx=${timeIdx}`)
                        .then(res => res.json())
                        .then(data => setActiveAnomalyResult(data));
                    } else {
                      setClickedMapPoint({ val, lat, lon, isAlert: false, variable: selectedVar });
                      setActiveAnomalyResult(null);
                    }
                  } else {
                    setClickedMapPoint(null);
                    setActiveAnomalyResult(null);
                  }
                }}
              >
                <Source type="geojson" data={mapData}><Layer {...circleLayer} /><Layer {...symbolLayer} /></Source>
              </Map>
            )}
            <div className="tour-timeline absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-900/90 backdrop-blur-md px-8 py-4 rounded-2xl border border-slate-700 shadow-2xl w-3/4 max-w-2xl flex flex-col gap-2">
              <div className="flex justify-between text-xs text-blue-400 font-bold tracking-widest uppercase"><span>Select Specific Day</span><span>{metadata.times[timeIdx] || 'Loading...'}</span></div>
              <input type="range" min="0" max={metadata.times.length > 0 ? metadata.times.length - 1 : 0} value={timeIdx} onChange={(e) => setTimeIdx(parseInt(e.target.value))} className="w-full cursor-pointer accent-blue-500" />
            </div>
          </div>
        </main>

        <aside className="w-96 bg-[#1e293b] border-l border-slate-700 flex flex-col shadow-2xl z-10">
          <div className="p-5 border-b border-slate-700 tour-analytics">
            <h2 className="text-sm uppercase tracking-widest text-slate-400 font-bold flex items-center gap-2 mb-4"><Activity size={16} /> Regional Analytics</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700"><p className="text-xs text-slate-400 mb-1">Global Mean</p><p className="text-2xl font-bold">{aiStory ? aiStory.mean : '--'}</p></div>
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700"><p className="text-xs text-slate-400 mb-1">Peak Extreme</p><p className="text-2xl font-bold text-orange-400">{aiStory ? aiStory.max : '--'}</p></div>
            </div>
          </div>
          <div className="p-5 border-b border-slate-700 flex-1">
            <h2 className="text-sm uppercase tracking-widest text-slate-400 font-bold mb-4">Temporal Trend</h2>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" /><XAxis dataKey="time" stroke="#94a3b8" fontSize={10} tickFormatter={(tick) => tick.substring(0, 4)} /><YAxis stroke="#94a3b8" fontSize={10} domain={['auto', 'auto']} /><Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} /><Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="p-5 bg-slate-800/50 flex-1 tour-risk relative">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-sm uppercase tracking-widest text-slate-400 font-bold flex items-center gap-2">
                {anomalyType ? <Radar size={16} className="text-indigo-400"/> : <AlertTriangle size={16}/>} 
                {anomalyType ? 'Diagnostic Scanner Active' : (isStoryActiveOnMap ? 'Story Analysis' : 'Instant Map Insights')}
              </h2>
              
              {/* EXIT ANOMALY MODE BUTTON */}
              {anomalyType && (
                <button 
                  onClick={() => { setAnomalyType(null); setActiveAnomalyResult(null); setClickedMapPoint(null); }}
                  className="text-xs flex items-center gap-1 bg-slate-700 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-slate-600 hover:border-red-500/50 px-2 py-1 rounded transition-colors"
                >
                  <X size={12}/> Close Mode
                </button>
              )}
            </div>
            
            {activeAnomalyResult && clickedMapPoint ? (
              <div className="animate-in zoom-in-95">
                <p className="text-xs font-mono text-slate-400 mb-3">Target: [{clickedMapPoint.lat}, {clickedMapPoint.lon}]</p>
                <div className={`p-5 rounded-xl border mb-4 shadow-lg ${activeAnomalyResult.status.includes('HIGH') || activeAnomalyResult.status.includes('RISK') || activeAnomalyResult.status.includes('RUPTURE') ? 'bg-red-900/20 border-red-500/50 text-red-200' : 'bg-indigo-900/20 border-indigo-500/50 text-indigo-200'}`}>
                  <p className="text-[10px] font-black uppercase mb-1 tracking-widest opacity-70">{activeAnomalyResult.title}</p>
                  <p className="text-sm leading-relaxed mb-3">{activeAnomalyResult.text}</p>
                  <div className="inline-block px-3 py-1 bg-black/30 rounded-full text-xs font-bold border border-white/10">{activeAnomalyResult.status}</div>
                </div>
                
                {/* RISK SIMULATION - STABILITY SCORE PROGRESS BAR */}
                {activeAnomalyResult.title === "Risk Simulation Indicator" && activeAnomalyResult.score !== undefined && (
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                    <div className="flex justify-between items-end mb-2">
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Stability Score</p>
                      <p className={`text-lg font-black ${activeAnomalyResult.score < 35 ? 'text-red-500' : activeAnomalyResult.score < 70 ? 'text-orange-400' : 'text-emerald-400'}`}>{activeAnomalyResult.score}/100</p>
                    </div>
                    <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${activeAnomalyResult.score < 35 ? 'bg-red-500' : activeAnomalyResult.score < 70 ? 'bg-orange-400' : 'bg-emerald-500'}`} 
                        style={{ width: `${activeAnomalyResult.score}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            ) : anomalyType ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60">
                <Radar size={32} className="mb-2 animate-spin-slow"/>
                <p className="text-sm text-center">Diagnostic mode enabled.<br/>Select a point on the map to scan.</p>
              </div>
            ) : isStoryActiveOnMap ? (
              <div className="p-4 rounded-xl border bg-emerald-900/20 border-emerald-500/50 text-emerald-200">
                 <p className="text-xs font-black uppercase mb-2 text-emerald-500">Active Scenario: {redirectType}</p>
                 <p className="text-sm leading-relaxed mb-4">{activeInsight?.text}</p>
                 <p className="text-[10px] text-slate-500 italic">Timeline is currently animating real-world ERA5 data for the {storyLocation} region.</p>
              </div>
            ) : clickedMapPoint ? (
              <div className={`p-4 rounded-xl border ${clickedMapPoint.isAlert ? 'bg-red-900/20 border-red-500/50 text-red-200' : 'bg-blue-900/20 border-blue-500/50 text-blue-200'}`}>
                 <div className="flex items-center gap-2 mb-2">
                   <span className={`px-2 py-1 rounded text-xs font-bold ${clickedMapPoint.isAlert ? 'bg-red-500' : 'bg-blue-500'} text-white`}>
                     {clickedMapPoint.isAlert ? 'CRITICAL EPICENTER' : 'LOCATION SELECTED'}
                   </span>
                 </div>
                 <p className="text-sm font-bold mb-1">Coordinates: [{clickedMapPoint.lat}, {clickedMapPoint.lon}]</p>
                 <p className="text-sm leading-relaxed">
                   {clickedMapPoint.isAlert 
                     ? `WARNING: This is the calculated epicenter for the active anomaly. The ${clickedMapPoint.variable} here has spiked to an extreme ${clickedMapPoint.val}. Immediate review recommended.`
                     : `The recorded ${selectedVar} here is ${clickedMapPoint.val}. Based on current spatial data, this area is exhibiting localized patterns for this metric.`}
                 </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">Click any data point on the map, or click the active Alert Banner, to instantly generate localized insights.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default App;