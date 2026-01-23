import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import {
  MapPin, Users, Briefcase, ChevronRight, X, Search,
  Navigation, Filter, Target, Zap, Building2, Ruler, Bell, Calendar
} from 'lucide-react';
import { Customer, Visit } from '../types';
import { INDIA_GEO_DATA, DISCOVERY_KEYWORDS, INDUSTRIAL_HUBS } from '../constants';
import { api } from '../services/api';

interface MapViewProps {
  customers: Customer[];
}

// Distance helper (Haversine Formula)
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const MapView: React.FC<MapViewProps> = ({ customers }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markersLayer = useRef<L.LayerGroup | null>(null);
  const radiusCircle = useRef<L.Circle | null>(null);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('All States');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [selectedHub, setSelectedHub] = useState('All Hubs');

  // New Smart Filters
  const [filterIndustry, setFilterIndustry] = useState('Mechanical'); // Default ON
  const [filterMachine, setFilterMachine] = useState('All');
  const [filterSize, setFilterSize] = useState('All');
  const [filterRadius, setFilterRadius] = useState('Global');
  const [discoveryMode, setDiscoveryMode] = useState(false);
  const [activeAlert, setActiveAlert] = useState<{ title: string, msg: string } | null>(null);

  // Constants for Filters
  const INDUSTRIES = ['Mechanical', 'Automotive', 'Fabrication', 'Tool & Die', 'All'];
  const MACHINES = ['CNC', 'Lathe', 'Milling', 'Welding', 'VMC', 'Sheet Metal', 'SS/MS Parts', 'All'];
  const SIZES = ['Small', 'Medium', 'Large', 'All'];
  const RADII = ['10km', '25km', '50km', 'Global'];

  // Geographic context for filters
  const availableStates = ['All States', ...Object.keys(INDIA_GEO_DATA).sort()];
  const availableCities = selectedState !== 'All States'
    ? ['All Cities', ...INDIA_GEO_DATA[selectedState].cities.sort()]
    : ['All Cities'];

  const availableHubs = (selectedState !== 'All States' && selectedCity !== 'All Cities' && INDUSTRIAL_HUBS[selectedState]?.[selectedCity])
    ? ['All Hubs', ...Object.keys(INDUSTRIAL_HUBS[selectedState][selectedCity]).sort()]
    : ['All Hubs'];

  // Current center for radius filtering
  const currentCenter = useMemo(() => {
    if (selectedState !== 'All States') {
      if (selectedCity !== 'All Cities') {
        if (selectedHub !== 'All Hubs') {
          return INDUSTRIAL_HUBS[selectedState][selectedCity][selectedHub];
        }
        const hubsInCity = INDUSTRIAL_HUBS[selectedState][selectedCity];
        if (hubsInCity) {
          const firstHub = Object.values(hubsInCity)[0];
          return firstHub;
        }
      }
      return INDIA_GEO_DATA[selectedState].coords;
    }
    return [22.5937, 78.9629] as [number, number];
  }, [selectedState, selectedCity, selectedHub]);

  // Combined logic for the map
  const filteredCustomers = useMemo(() => {
    let list = [...customers];

    if (discoveryMode) {
      const discovered: Customer[] = [
        {
          id: 'disc-1',
          name: 'Precision Mech Works',
          city: selectedCity !== 'All Cities' ? selectedCity : 'Mohali',
          state: selectedState !== 'All States' ? selectedState : 'Punjab',
          country: 'India',
          industry: filterIndustry === 'All' ? 'Mechanical' : filterIndustry,
          industryType: 'Mechanical',
          machineTypes: ['CNC', 'VMC'],
          companySize: 'Medium',
          isDiscovered: true,
          coords: [currentCenter[0] + 0.02, currentCenter[1] + 0.02],
          contacts: [],
          pricingHistory: [],
          lastModifiedBy: 'System',
          updatedAt: 'Now'
        },
        {
          id: 'disc-2',
          name: 'Manesar Tooling Solutions',
          city: 'Gurugram',
          state: 'Haryana',
          country: 'India',
          industry: 'Automotive',
          industryType: 'Automotive',
          machineTypes: ['Lathe', 'CNC'],
          companySize: 'Large',
          isDiscovered: true,
          coords: [28.3515 + 0.01, 76.9427 - 0.01],
          contacts: [],
          pricingHistory: [],
          lastModifiedBy: 'System',
          updatedAt: 'Now'
        }
      ];
      list = [...list, ...discovered];
    }

    return list.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesState = selectedState === 'All States' || c.state === selectedState;
      const matchesCity = selectedCity === 'All Cities' || c.city === selectedCity;

      const matchesIndustry = filterIndustry === 'All' || c.industry === filterIndustry || c.industryType === filterIndustry;
      const matchesMachine = filterMachine === 'All' || c.machineTypes?.includes(filterMachine);
      const matchesSize = filterSize === 'All' || c.companySize === filterSize;

      let matchesRadius = true;
      if (filterRadius !== 'Global' && c.coords) {
        const radiusVal = parseInt(filterRadius);
        const dist = getDistance(currentCenter[0], currentCenter[1], c.coords[0], c.coords[1]);
        matchesRadius = dist <= radiusVal;
      }

      return matchesSearch && matchesState && matchesCity && matchesIndustry && matchesMachine && matchesSize && matchesRadius;
    });
  }, [customers, searchTerm, selectedState, selectedCity, filterIndustry, filterMachine, filterSize, filterRadius, discoveryMode, currentCenter]);

  // Alert Trigger Logic
  useEffect(() => {
    if (discoveryMode && filteredCustomers.some(c => c.isDiscovered && c.industryType === 'Mechanical')) {
      setActiveAlert({
        title: 'New Mechanical Client Found!',
        msg: `Identified matching prospects near your location. WhatsApp alerts sent to team.`
      });
      console.log('Simulated WhatsApp: "New Mechanical Client Found Near You" alert sent.');

      const timer = setTimeout(() => setActiveAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [discoveryMode, filteredCustomers.length]);

  // Bulk Visit Creation Logic
  const handleGenerateVisitPlan = async () => {
    const topProspects = filteredCustomers.slice(0, 5);
    if (topProspects.length === 0) return;

    try {
      const promises = topProspects.map(p => {
        const newVisit: Visit = {
          id: '', // DB assigned
          customerId: p.id,
          customerName: p.name,
          date: new Date().toISOString().split('T')[0],
          purpose: 'Initial Discovery Meeting (Auto-Generated)',
          status: 'Planned',
          assignedTo: 'ME-Marketing',
          location: `${p.city}, ${p.state}`,
          reminderEnabled: true
        };
        return api.visits.create(newVisit);
      });

      await Promise.all(promises);
      alert(`Successfully scheduled ${topProspects.length} visits. Redirecting to Visit Plan...`);
      window.dispatchEvent(new CustomEvent('nav-tab', { detail: 'visits' }));
    } catch (err) {
      console.error('Failed to auto-create visit plan:', err);
    }
  };

  // Map Initialization
  useEffect(() => {
    if (!mapRef.current) return;

    if (!leafletMap.current) {
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

  // Sync Map View & Radius Circle
  useEffect(() => {
    if (!leafletMap.current) return;

    if (radiusCircle.current) {
      radiusCircle.current.remove();
    }

    if (filterRadius !== 'Global') {
      const radiusVal = parseInt(filterRadius) * 1000;
      radiusCircle.current = L.circle(currentCenter as [number, number], {
        radius: radiusVal,
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.1,
        weight: 1
      }).addTo(leafletMap.current);

      leafletMap.current.flyTo(currentCenter as [number, number], 11, { duration: 1.5 });
    } else if (selectedHub !== 'All Hubs') {
      leafletMap.current.flyTo(currentCenter as [number, number], 14, { duration: 1.5 });
    } else if (selectedCity !== 'All Cities') {
      leafletMap.current.flyTo(currentCenter as [number, number], 12, { duration: 1.5 });
    } else if (selectedState !== 'All States') {
      leafletMap.current.flyTo(currentCenter as [number, number], 8, { duration: 1.5 });
    } else {
      leafletMap.current.flyTo([22.5937, 78.9629], 5, { duration: 1.5 });
    }
  }, [selectedState, selectedCity, selectedHub, filterRadius, currentCenter]);

  // Marker Update Logic
  useEffect(() => {
    if (!markersLayer.current || !leafletMap.current) return;

    markersLayer.current.clearLayers();

    filteredCustomers.forEach((customer, index) => {
      let lat, lng;

      if (customer.coords) {
        lat = customer.coords[0];
        lng = customer.coords[1];
      } else {
        const stateData = INDIA_GEO_DATA[customer.state];
        if (!stateData) return;
        const offset = 0.05;
        lat = stateData.coords[0] + (Math.sin(index) * offset);
        lng = stateData.coords[1] + (Math.cos(index) * offset);
      }

      const isDiscovered = customer.isDiscovered;

      const marker = L.marker([lat, lng], {
        icon: L.divIcon({
          html: `
            <div class="group relative flex flex-col items-center">
              <div class="w-10 h-10 ${isDiscovered ? 'bg-amber-500 animate-pulse' : 'bg-blue-600'} rounded-2xl border-4 border-white shadow-xl flex items-center justify-center text-white transform transition-transform group-hover:scale-110">
                ${isDiscovered ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>' : `<span class="text-xs font-black uppercase">${customer.name.substring(0, 2)}</span>`}
              </div>
              <div class="mt-1 px-2 py-0.5 ${isDiscovered ? 'bg-amber-900/90' : 'bg-slate-900/80'} backdrop-blur-sm text-white text-[9px] rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity whitespace-pre text-center">
                 ${customer.name}${isDiscovered ? '<br/>(Suggested)' : ''}
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
        leafletMap.current?.flyTo([lat, lng], 14);
      });

      marker.addTo(markersLayer.current!);
    });
  }, [filteredCustomers]);

  const formatCurrency = (val: number | undefined) => {
    if (!val) return '₹ 0';
    if (val >= 10000000) return `₹ ${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹ ${(val / 100000).toFixed(2)} L`;
    return `₹ ${val.toLocaleString('en-IN')}`;
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col space-y-4 animate-in fade-in duration-500 overflow-hidden relative">

      {/* Real-time Discovery Alert */}
      {activeAlert && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[2000] w-[90%] max-w-md bg-slate-900 text-white p-4 rounded-3xl shadow-2xl border border-white/10 flex items-start gap-4 animate-in slide-in-from-top-4 duration-500">
          <div className="p-3 bg-amber-500 rounded-2xl shadow-lg shadow-amber-500/30">
            <Bell size={20} className="animate-wiggle" />
          </div>
          <div className="flex-1">
            <p className="font-black text-xs uppercase tracking-widest text-amber-500 mb-1">{activeAlert.title}</p>
            <p className="text-[11px] text-slate-300 font-medium leading-relaxed">{activeAlert.msg}</p>
          </div>
          <button onClick={() => setActiveAlert(null)} className="p-1 hover:bg-white/10 rounded-full">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            Strategic Market Map
            {discoveryMode && <span className="px-2 py-0.5 bg-amber-100 text-amber-600 text-[10px] font-black uppercase rounded-lg border border-amber-200">Intelligence Active</span>}
          </h2>
          <p className="text-slate-500 text-sm">Targeted cluster analysis for Mechanical & Tooling sectors.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setDiscoveryMode(!discoveryMode)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm border ${discoveryMode ? 'bg-amber-500 text-white border-amber-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
          >
            <Zap size={14} className={discoveryMode ? 'animate-bounce' : ''} />
            <span>{discoveryMode ? 'Discovery Mode On' : 'Discovery Mode Off'}</span>
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Find client..."
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 outline-none shadow-sm w-48"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Smart Filter Bar */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
        <div className="bg-white border border-slate-200 p-2 rounded-2xl flex flex-col shadow-sm">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1 px-1">Industry</label>
          <select
            value={filterIndustry}
            onChange={(e) => setFilterIndustry(e.target.value)}
            className="text-xs font-bold text-slate-700 outline-none bg-transparent"
          >
            {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div className="bg-white border border-slate-200 p-2 rounded-2xl flex flex-col shadow-sm">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1 px-1">Machine Type</label>
          <select
            value={filterMachine}
            onChange={(e) => setFilterMachine(e.target.value)}
            className="text-xs font-bold text-slate-700 outline-none bg-transparent"
          >
            {MACHINES.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="bg-white border border-slate-200 p-2 rounded-2xl flex flex-col shadow-sm">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1 px-1">Distance Filter</label>
          <div className="flex items-center">
            <Ruler size={10} className="text-blue-500 mr-1" />
            <select
              value={filterRadius}
              onChange={(e) => setFilterRadius(e.target.value)}
              className="text-xs font-bold text-slate-700 outline-none bg-transparent w-full"
            >
              {RADII.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div className="bg-white border border-slate-200 p-2 rounded-2xl flex flex-col shadow-sm">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1 px-1">State</label>
          <select
            value={selectedState}
            onChange={(e) => {
              setSelectedState(e.target.value);
              setSelectedCity('All Cities');
              setSelectedHub('All Hubs');
            }}
            className="text-xs font-bold text-slate-700 outline-none bg-transparent"
          >
            {availableStates.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="bg-white border border-slate-200 p-2 rounded-2xl flex flex-col shadow-sm lg:col-span-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1 px-1">City / Industrial Hub</label>
          <div className="flex items-center gap-1">
            <select
              value={selectedCity}
              onChange={(e) => {
                setSelectedCity(e.target.value);
                setSelectedHub('All Hubs');
              }}
              className="text-xs font-bold text-slate-700 outline-none bg-transparent flex-1"
            >
              {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {selectedCity !== 'All Cities' && availableHubs.length > 1 && (
              <select
                value={selectedHub}
                onChange={(e) => setSelectedHub(e.target.value)}
                className="text-[11px] font-black text-blue-600 outline-none bg-blue-50 rounded-lg px-2 py-1 border border-blue-100"
              >
                {availableHubs.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden min-h-0">
        {/* Map Container Wrapper */}
        <div className="flex-1 relative bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden z-0 flex flex-col">
          <div className="absolute bottom-6 left-6 z-[1000] flex bg-slate-900/90 backdrop-blur text-white px-4 py-2 rounded-2xl shadow-xl items-center pointer-events-auto">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
            <span className="text-[10px] font-black uppercase tracking-widest">{filteredCustomers.length} Hits Found</span>
          </div>
          <div ref={mapRef} className="flex-1 h-full w-full" />
        </div>

        {/* Info Sidebar */}
        <div className="w-full lg:w-96 flex flex-col gap-6 overflow-hidden">
          {selectedCustomer ? (
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden flex flex-col animate-in slide-in-from-right duration-500 h-full">
              <div className={`p-8 ${selectedCustomer.isDiscovered ? 'bg-amber-600' : 'bg-slate-900'} text-white relative`}>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center font-bold text-2xl mb-6 shadow-2xl">
                  {selectedCustomer.name.charAt(0)}
                </div>
                <h3 className="text-xl font-black leading-tight mb-2 uppercase">{selectedCustomer.name}</h3>
                <div className="inline-flex items-center px-3 py-1 bg-white/20 rounded-full border border-white/30">
                  <span className="text-white text-[10px] font-black uppercase tracking-widest">{selectedCustomer.industry}</span>
                </div>
              </div>

              <div className="p-8 flex-1 space-y-6 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 gap-5">
                  <div className="flex items-start">
                    <div className="p-3 bg-slate-50 rounded-xl mr-4 text-blue-600">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Unit Location</p>
                      <p className="text-sm font-bold text-slate-900 leading-snug">{selectedCustomer.city}, {selectedCustomer.state}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="p-3 bg-slate-50 rounded-xl mr-4 text-indigo-600">
                      <Zap size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Capabilities</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedCustomer.machineTypes?.map(m => (
                          <span key={m} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-black rounded-md">{m}</span>
                        )) || <span className="text-slate-400 text-xs italic uppercase opacity-50 tracking-widest text-[9px]">General Fabrication</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="p-3 bg-slate-50 rounded-xl mr-4 text-emerald-600">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Scale</p>
                      <p className="text-sm font-bold text-slate-900 leading-snug">{selectedCustomer.companySize || 'SME'} | {formatCurrency(selectedCustomer.annualTurnover)}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-auto border-t border-slate-100 flex flex-col gap-3">
                  {selectedCustomer.isDiscovered ? (
                    <button
                      onClick={() => alert(`Adding ${selectedCustomer.name} to CRM...`)}
                      className="w-full flex items-center justify-center p-4 bg-amber-500 text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/30"
                    >
                      <Zap size={18} className="mr-3" />
                      Add to CRM Pipeline
                    </button>
                  ) : (
                    <button
                      onClick={() => window.dispatchEvent(new CustomEvent('nav-tab', { detail: 'customers' }))}
                      className="w-full flex items-center justify-between p-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] group hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                    >
                      <span className="text-sm font-black uppercase tracking-widest group-hover:text-white">Account Details</span>
                      <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 flex flex-col items-center justify-center p-12 text-center overflow-hidden h-full">
              <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-300 mb-6 shadow-inner">
                <Target size={40} />
              </div>
              <h4 className="text-lg font-bold text-slate-900 tracking-tight">Market Intelligence</h4>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Filter by **Machine Type (CNC/VMC)** or activate **Discovery Mode** to find new potential workshops in your area.
              </p>

              <div className="mt-10 w-full space-y-4">
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-left">
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Auto-Discovery</p>
                  <p className="text-[11px] text-amber-700 font-medium">Toggle the lightning bolt to auto-plot suggested fabrication shops in {selectedCity !== 'All Cities' ? selectedCity : 'the current hub'}.</p>
                </div>

                <button
                  onClick={handleGenerateVisitPlan}
                  disabled={filteredCustomers.length === 0}
                  className="w-full flex items-center justify-center p-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl disabled:opacity-50 disabled:grayscale"
                >
                  <Calendar size={18} className="mr-3" />
                  Visit Top {Math.min(filteredCustomers.length, 5)} Targets
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
