
import React, { useState, useEffect } from 'react';
import { supabase } from "./services/supabaseClient";
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { CustomersView } from './views/CustomersView';
import { MapView } from './views/MapView';
import { PricingView } from './views/PricingView';
import { ExposView } from './views/ExposView';
import { MarketingTeamView } from './views/MarketingTeamView';
import { DataManagementView } from './views/DataManagementView';
import { VisitPlanView } from './views/VisitPlanView';
import { ProjectDetailsView } from './views/ProjectDetailsView';
import { UserRole, Customer, Expo, User, Visit, VisitStatus } from './types';
import { SYSTEM_ADMINS, MARKETING_TEAM as DEFAULT_MARKETING_TEAM } from './constants';
import { api } from './services/api';
import { INDIA_GEO_DATA, ZONES } from './constants';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState<User>(SYSTEM_ADMINS[0]);

  // Application State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [expos, setExpos] = useState<Expo[]>([]);
  const [marketingTeam, setMarketingTeam] = useState(DEFAULT_MARKETING_TEAM);
  const [visits, setVisits] = useState<Visit[]>([]);

  const [loading, setLoading] = useState(true);

  // Load Data from Supabase
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [fetchedCustomers, fetchedExpos, fetchedVisits] = await Promise.all([
          api.customers.fetchAll(),
          api.expos.fetchAll(),
          api.visits.fetchAll()
        ]);
        setCustomers(fetchedCustomers);
        setExpos(fetchedExpos);
        setVisits(fetchedVisits);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // --- Handlers for Data Persistence ---

  // CUSTOMERS
  const handleAddCustomer = async (newCustomer: Customer) => {
    try {
      // Optimistic update
      setCustomers(prev => [newCustomer, ...prev]);
      const savedCustomer = await api.customers.create(newCustomer);
      // Update with real ID from server
      setCustomers(prev => prev.map(c => c.id === newCustomer.id ? savedCustomer : c));
    } catch (e: any) {
      console.error("Add customer failed", e);
      alert(`Failed to add customer: ${e.message || JSON.stringify(e)}`);
    }
  };

  const handleUpdateCustomer = async (updatedCustomer: Customer) => {
    try {
      setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
      await api.customers.update(updatedCustomer);
    } catch (e: any) {
      console.error("Update customer failed", e);
      alert(`Failed to update customer: ${e.message || JSON.stringify(e)}`);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    try {
      setCustomers(prev => prev.filter(c => c.id !== id));
      setVisits(prev => prev.filter(v => v.customerId !== id));
      await api.customers.delete(id);
    } catch (e) {
      console.error("Delete customer failed", e);
    }
  };

  // EXPOS
  const handleAddExpo = async (newExpo: Expo) => {
    setExpos(prev => [...prev, newExpo]);
    await api.expos.create(newExpo);
  };

  // VISITS
  const handleAddVisit = async (newVisit: Visit) => {
    setVisits(prev => [...prev, newVisit]);
    await api.visits.create(newVisit);
  };

  // Centralized Deletion with Cascade Logic (already covered by handleDeleteCustomer, but keeping signature)
  const deleteCustomer = handleDeleteCustomer;

  // Handle cross-component navigation
  useEffect(() => {
    const handleNav = (e: any) => {
      if (e.detail) setActiveTab(e.detail);
    };
    window.addEventListener('nav-tab', handleNav);
    return () => window.removeEventListener('nav-tab', handleNav);
  }, []);

  const renderContent = () => {
    if (loading) {
      return <div className="flex h-screen items-center justify-center p-20">Loading data from Supabase...</div>;
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard customers={customers} expos={expos} marketingTeam={marketingTeam} />;
      case 'customers':
        return (
          <CustomersView
            customers={customers}
            setCustomers={setCustomers} // We might need to keep this for now, but better to use handlers
            onDeleteCustomer={deleteCustomer}
            onSaveCustomer={async (c, isNew) => {
              if (isNew) await handleAddCustomer(c);
              else await handleUpdateCustomer(c);
            }}
            currentUser={currentUser}
          />
        );
      case 'visit-plan':
        return <VisitPlanView customers={customers} visits={visits} setVisits={setVisits} currentUser={currentUser} />;
      case 'project-details':
        return <ProjectDetailsView />;
      case 'map':
        return <MapView customers={customers} />;
      case 'pricing':
        return <PricingView customers={customers} setCustomers={setCustomers} />;
      case 'expos':
        return <ExposView expos={expos} setExpos={setExpos} />;
      case 'marketing-team':
        return <MarketingTeamView team={marketingTeam} setTeam={setMarketingTeam} currentUser={currentUser} />;
      case 'data-mgmt':
        return (
          <DataManagementView
            customers={customers}
            setCustomers={setCustomers}
            expos={expos}
            setExpos={setExpos}
            marketingTeam={marketingTeam}
            visits={visits}
          />
        );
      case 'reports':
        const zonalStats = ZONES.filter(z => z !== 'All Zones').map(zone => {
          const zoneCustomers = customers.filter(c => (c.zone || INDIA_GEO_DATA[c.state]?.zone) === zone);
          const totalRevenue = zoneCustomers.reduce((sum, c) => sum + (c.annualTurnover || 0), 0);
          return { zone, count: zoneCustomers.length, revenue: totalRevenue };
        });

        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Regional Performance Metrics</h2>
                <p className="text-slate-500 font-medium">Zonal distribution of {customers.length} manufacturing accounts.</p>
              </div>
              <div className="px-6 py-3 bg-blue-50 text-blue-600 rounded-2xl text-xs font-black uppercase tracking-widest border border-blue-100">
                Live Data Synchronized
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {zonalStats.map(stat => (
                <div key={stat.zone} className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all group">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 group-hover:text-blue-500 transition-colors">{stat.zone} Zone</p>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-4xl font-black text-slate-900">{stat.count}</span>
                    <span className="text-xs font-bold text-slate-400">Clients</span>
                  </div>
                  <div className="mt-6 pt-6 border-t border-slate-50">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Revenue</p>
                    <p className="text-lg font-black text-slate-900">₹ {(stat.revenue / 10000000).toFixed(1)} Cr</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-slate-900 rounded-[2.5rem] p-12 text-white relative overflow-hidden shadow-2xl">
              <div className="relative z-10 max-w-2xl">
                <h3 className="text-2xl font-black mb-4 uppercase tracking-tight">AI Territory Intelligence</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-8">
                  Based on your cluster density, the **North Zone** shows a 15% higher concentration of CNC-capable units. We recommend increasing visit frequency in **Ludhiana** and **Gurugram** for Q1 growth targets.
                </p>
                <button onClick={() => setActiveTab('map')} className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-400 hover:text-white transition-all">
                  View Strategic Heatmap
                </button>
              </div>
              <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-600/20 to-transparent pointer-events-none"></div>
            </div>
          </div>
        );
      default:
        return <Dashboard customers={customers} expos={expos} marketingTeam={marketingTeam} />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} user={currentUser} onUserChange={setCurrentUser}>
      {renderContent()}
    </Layout>
  );
};

export default App;
