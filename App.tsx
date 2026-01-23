
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
        return (
          <div className="flex flex-col items-center justify-center h-full py-20 text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="p-4 bg-slate-100 rounded-full mb-6">
              <img src="https://picsum.photos/seed/report/100/100" className="w-24 h-24 rounded-full opacity-40 grayscale" alt="Reports" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Advanced Analytics Module</h2>
            <p className="text-slate-500 max-w-sm mt-3 text-sm leading-relaxed">
              Our AI is currently synthesizing your historical manufacturing data into actionable insights based on your latest Excel imports.
            </p>
            <button
              onClick={() => setActiveTab('dashboard')}
              className="mt-8 px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all"
            >
              Return to Live Dashboard
            </button>
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
