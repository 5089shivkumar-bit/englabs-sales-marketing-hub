
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { CustomersView } from './views/CustomersView';
import { MapView } from './views/MapView';
import { PricingView } from './views/PricingView';
import { ExposView } from './views/ExposView';
import { MarketingTeamView } from './views/MarketingTeamView';
import { DataManagementView } from './views/DataManagementView';
import { VisitPlanView } from './views/VisitPlanView';
import { UserRole, Customer, Expo, User, Visit, VisitStatus } from './types';
import { MOCK_CUSTOMERS, MOCK_EXPOS, SYSTEM_ADMINS, MARKETING_TEAM as DEFAULT_MARKETING_TEAM } from './constants';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState<User>(SYSTEM_ADMINS[0]);
  
  // Application State with Persistence logic
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('enging_customers');
    return saved ? JSON.parse(saved) : MOCK_CUSTOMERS;
  });

  const [expos, setExpos] = useState<Expo[]>(() => {
    const saved = localStorage.getItem('enging_expos');
    return saved ? JSON.parse(saved) : MOCK_EXPOS;
  });

  const [marketingTeam, setMarketingTeam] = useState(() => {
    const saved = localStorage.getItem('enging_marketing_team');
    return saved ? JSON.parse(saved) : DEFAULT_MARKETING_TEAM;
  });

  const [visits, setVisits] = useState<Visit[]>(() => {
    const saved = localStorage.getItem('enging_visits');
    return saved ? JSON.parse(saved) : [];
  });

  // Centralized Deletion with Cascade Logic
  const deleteCustomer = (id: string) => {
    // 1. Remove Customer
    setCustomers(prev => prev.filter(c => c.id !== id));
    // 2. Cascade Remove Associated Visits
    setVisits(prev => prev.filter(v => v.customerId !== id));
    
    // Logic to notify user could be added here
    console.log(`Personnel ${currentUser.name} purged customer ${id} and all related logs.`);
  };

  // Handle cross-component navigation
  useEffect(() => {
    const handleNav = (e: any) => {
      if (e.detail) setActiveTab(e.detail);
    };
    window.addEventListener('nav-tab', handleNav);
    return () => window.removeEventListener('nav-tab', handleNav);
  }, []);

  // Effect to save data whenever it changes
  useEffect(() => {
    localStorage.setItem('enging_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('enging_expos', JSON.stringify(expos));
  }, [expos]);

  useEffect(() => {
    localStorage.setItem('enging_marketing_team', JSON.stringify(marketingTeam));
  }, [marketingTeam]);

  useEffect(() => {
    localStorage.setItem('enging_visits', JSON.stringify(visits));
  }, [visits]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard customers={customers} expos={expos} marketingTeam={marketingTeam} />;
      case 'customers':
        return (
          <CustomersView 
            customers={customers} 
            setCustomers={setCustomers} 
            onDeleteCustomer={deleteCustomer}
            currentUser={currentUser} 
          />
        );
      case 'visit-plan':
        return <VisitPlanView customers={customers} visits={visits} setVisits={setVisits} currentUser={currentUser} />;
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
