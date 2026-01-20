
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Users, Briefcase, ChevronRight, X, Search, Navigation, Filter } from 'lucide-react';
import { Customer } from '../types';
import { INDIA_GEO_DATA } from '../constants';

interface MapViewProps {
  customers: Customer[];
}

export const MapView: React.FC<MapViewProps> = ({ customers }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markersLayer = useRef<L.LayerGroup | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('All States');
  const [selectedCity, setSelectedCity] = useState('All Cities');

  // Filter logic for the map
  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState = selectedState === 'All States' || c.state === selectedState;
    const matchesCity = selectedCity === 'All Cities' || c.city === selectedCity;
    return matchesSearch && matchesState && matchesCity;
  });

  const availableStates = ['All States', ...Object.keys(INDIA_GEO_DATA).sort()];
  const availableCities = selectedState !== 'All States' 
    ? ['All Cities', ...INDIA_GEO_DATA[selectedState].cities.sort()] 
    : ['All Cities'];

  // Map Initialization & Fix for the "Gray Map" issue
  useEffect(() => {
    if (!mapRef.current) return;

    if (!leafletMap.current) {
      // Default view centered on India
      leafletMap.current = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([22.5937, 78.9629], 5);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO'
      }).addTo(leafletMap.current);

      L.control.zoom({ position: 'bottomright' }).addTo(leafletMap.current);
      
      markersLayer.current = L.layerGroup().addTo(leafletMap.current);
    }

    // CRITICAL FIX: Leaflet needs a delay to invalidate size when rendered inside tabs or hidden containers
    const timer = setTimeout(() => {
      if (leafletMap.current) {
        leafletMap.current.invalidateSize();
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, []);

  // Sync Map View with selection
  useEffect(() => {
    if (!leafletMap.current) return;

    if (selectedState !== 'All States') {
      const stateData = INDIA_GEO_DATA[selectedState];
      if (stateData) {
        leafletMap.current.flyTo(stateData.coords, 7, { duration: 1.5 });
      }
    } else {
      leafletMap.current.flyTo([22.5937, 78.9629], 5, { duration: 1.5 });
    }
  }, [selectedState]);

  // Marker Update Logic
  useEffect(() => {
    if (!markersLayer.current || !leafletMap.current) return;
    
    markersLayer.current.clearLayers();

    filteredCustomers.forEach((customer, index) => {
      const stateData = INDIA_GEO_DATA[customer.state];
      if (stateData) {
        // Precise jitter to separate multiple accounts in the same state/city
        const offset = 0.05;
        const lat = stateData.coords[0] + (Math.sin(index) * offset);
        const lng = stateData.coords[1] + (Math.cos(index) * offset);

        const marker = L.marker([lat, lng], {
          icon: L.divIcon({
            html: `
              <div class="group relative flex flex-col items-center">
                <div class="w-10 h-10 bg-blue-600 rounded-2xl border-4 border-white shadow-xl flex items-center justify-center text-white transform transition-transform group-hover:scale-110 hover:bg-blue-700">
                  <span class="text-xs font-black uppercase">${customer.name.substring(0, 2)}</span>
                </div>
                <div class="mt-1 px-2 py-0.5 bg-slate-900/80 backdrop-blur-sm text-white text-[9px] rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                   ${customer.name}
                </div>
              </div>
            `,
            className: '',
            iconSize: [40, 40],
            iconAnchor: [20, 40]
          })
        });

        marker.on('click', () => {
          setSelectedCustomer(customer);
          leafletMap.current?.flyTo([lat, lng], 10);
        });

        marker.addTo(markersLayer.current!);
      }
    });
  }, [filteredCustomers]);

  const formatCurrency = (val: number) => {
    if (val >= 10000000) return `₹ ${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹ ${(val / 100000).toFixed(2)} L`;
    return `₹ ${val.toLocaleString('en-IN')}`;
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col space-y-4 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Geographic Hub</h2>
          <p className="text-slate-500 text-sm">Real-time national distribution of manufacturing clients.</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Filter company..." 
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 outline-none shadow-sm w-48"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
        {/* Map Container Wrapper */}
        <div className="flex-1 relative bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden z-0 flex flex-col">
          {/* Internal Map Overlays (Filters) */}
          <div className="absolute top-6 left-6 right-6 z-[1000] flex flex-wrap gap-3 pointer-events-none">
            <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border border-slate-200 flex items-center pointer-events-auto">
              <Navigation size={14} className="text-blue-500 mr-2" />
              <select 
                className="bg-transparent text-xs font-bold text-slate-700 outline-none pr-4"
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  setSelectedCity('All Cities');
                }}
              >
                {availableStates.map(state => <option key={state} value={state}>{state}</option>)}
              </select>
            </div>

            {selectedState !== 'All States' && (
              <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border border-slate-200 flex items-center pointer-events-auto animate-in slide-in-from-left-2 duration-300">
                <Filter size={14} className="text-indigo-500 mr-2" />
                <select 
                  className="bg-transparent text-xs font-bold text-slate-700 outline-none pr-4"
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                >
                  {availableCities.map(city => <option key={city} value={city}>{city}</option>)}
                </select>
              </div>
            )}

            <div className="ml-auto hidden sm:flex bg-slate-900 text-white px-4 py-2 rounded-2xl shadow-xl items-center pointer-events-auto">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
              <span className="text-[10px] font-black uppercase tracking-widest">{filteredCustomers.length} Mapped Accounts</span>
            </div>
          </div>

          <div ref={mapRef} className="flex-1" />
        </div>

        {/* Info Sidebar */}
        <div className="w-full lg:w-96 flex flex-col gap-6 overflow-hidden">
          {selectedCustomer ? (
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden flex flex-col animate-in slide-in-from-right duration-500 h-full">
              <div className="p-8 bg-slate-900 text-white relative">
                <button 
                  onClick={() => setSelectedCustomer(null)}
                  className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center font-bold text-2xl mb-6 shadow-2xl shadow-blue-500/40">
                  {selectedCustomer.name.charAt(0)}
                </div>
                <h3 className="text-xl font-black leading-tight mb-2">{selectedCustomer.name}</h3>
                <div className="inline-flex items-center px-3 py-1 bg-blue-500/20 rounded-full border border-blue-500/30">
                  <span className="text-blue-300 text-[10px] font-black uppercase tracking-widest">{selectedCustomer.industry}</span>
                </div>
              </div>
              
              <div className="p-8 flex-1 space-y-8 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 gap-6">
                  <div className="flex items-start">
                    <div className="p-3 bg-slate-50 rounded-xl mr-4 text-blue-600">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">HQ Location</p>
                      <p className="text-sm font-bold text-slate-900 leading-snug">{selectedCustomer.city}, {selectedCustomer.state}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="p-3 bg-slate-50 rounded-xl mr-4 text-indigo-600">
                      <Briefcase size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Market Capacity</p>
                      <p className="text-sm font-bold text-slate-900 leading-snug">{formatCurrency(selectedCustomer.annualTurnover)}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="p-3 bg-slate-50 rounded-xl mr-4 text-emerald-600">
                      <Users size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Key Stakeholders</p>
                      <p className="text-sm font-bold text-slate-900 leading-snug">{selectedCustomer.contacts.length} Decision Makers</p>
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-100 mt-auto">
                  <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('nav-tab', { detail: 'customers' }))}
                    className="w-full flex items-center justify-between p-5 bg-slate-50 rounded-[1.5rem] group hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                  >
                    <span className="text-sm font-black uppercase tracking-widest group-hover:text-white">Open Account Card</span>
                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 bg-white rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-300 mb-6 shadow-inner">
                <MapPin size={40} />
              </div>
              <h4 className="text-lg font-bold text-slate-900">National Market Explorer</h4>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Select a state from the map overlay or click a cluster pin to view localized commercial data.
              </p>
              
              <div className="mt-10 w-full space-y-3">
                 <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 text-left">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Pro Tip</p>
                    <p className="text-[11px] text-blue-700 font-medium">Selecting a state zooms the map directly to that industrial hub.</p>
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
