
import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Calendar,
  BarChart3,
  Menu,
  X,
  LogOut,
  Bell,
  Search,
  Settings,
  Database,
  Map as MapIcon,
  ChevronDown,
  UserCheck,
  Award,
  Clock,
  Navigation2,
  Zap,
  ClipboardList
} from 'lucide-react';
import { UserRole, User as AppUser } from '../types';
import { SYSTEM_ADMINS, MARKETING_TEAM } from '../constants';
import { dateUtils } from '../services/dateUtils';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
  collapsed?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, active, onClick, collapsed }) => (
  <button
    onClick={onClick}
    title={collapsed ? label : undefined}
    className={`w-full flex items-center transition-all duration-300 ${collapsed ? 'justify-center p-3' : 'space-x-3 px-4 py-3'} rounded-lg ${active
      ? 'bg-blue-600 text-white shadow-md'
      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
  >
    <Icon size={20} className="flex-shrink-0" />
    <span className={`font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${collapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>{label}</span>
  </button>
);

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: AppUser;
  onUserChange: (user: AppUser) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, user, onUserChange }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState(dateUtils.formatISTTime());

  // Real-time IST Clock update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(dateUtils.formatISTTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'project-details', label: 'Project Management', icon: ClipboardList },
    { id: 'visit-plan', label: 'Visit Plan', icon: Navigation2 },
    { id: 'map', label: 'Market Map', icon: MapIcon },
    { id: 'pricing', label: 'Pricing Records', icon: DollarSign },
    { id: 'expos', label: 'Expos & Events', icon: Calendar },
    { id: 'marketing-team', label: 'Marketing Team', icon: Award },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'data-mgmt', label: 'Data Management', icon: Database },
  ];

  const allPersonnel = useMemo(() => {
    const combined = [...SYSTEM_ADMINS];
    MARKETING_TEAM.forEach(member => {
      if (!combined.find(c => c.name === member.name)) {
        combined.push({
          name: member.name,
          role: member.role as UserRole,
          avatar: member.avatar
        });
      }
    });
    return combined;
  }, []);

  const triggerGlobalImport = () => {
    setActiveTab('data-mgmt');
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('trigger-antigravity-import'));
    }, 100);
  };

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed lg:sticky inset-y-0 left-0 z-50 bg-slate-900 text-white transform transition-all duration-300 ease-in-out h-screen
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
      `}>
        <div className="h-full flex flex-col p-4 relative overflow-hidden">
          {/* Toggle Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex absolute -right-3 top-10 bg-blue-600 rounded-full p-1 text-white shadow-lg border-2 border-slate-900 hover:bg-blue-700 transition-colors z-50"
          >
            <div className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}>
              <ChevronDown size={14} className="rotate-90" />
            </div>
          </button>

          <div className={`flex items-center mb-10 transition-all duration-300 ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-500/20 flex-shrink-0">M</div>
            <div className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
              <h1 className="text-lg font-bold leading-none whitespace-nowrap">Mark-Eng</h1>
              <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest whitespace-nowrap">Enterprise</p>
            </div>
          </div>

          <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1">
            {navItems.map((item) => (
              <SidebarItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                active={activeTab === item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsSidebarOpen(false);
                }}
                collapsed={isCollapsed}
              />
            ))}
          </nav>

          <div className="pt-6 mt-6 border-t border-slate-800">
            <div className={`bg-slate-800/50 rounded-xl mb-4 transition-all duration-300 ${isCollapsed ? 'p-2 flex justify-center' : 'px-4 py-3'}`}>
              {isCollapsed ? (
                <UserCheck size={16} className="text-blue-400" />
              ) : (
                <>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-tight mb-1">System Control</p>
                  <div className="flex items-center text-blue-400 text-xs font-bold">
                    <UserCheck size={12} className="mr-1.5" />Registry Verified
                  </div>
                </>
              )}
            </div>
            <SidebarItem
              icon={LogOut}
              label="Sign Out"
              active={false}
              onClick={() => { }}
              collapsed={isCollapsed}
            />
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between flex-shrink-0 z-30">
          <div className="flex items-center space-x-4">
            <button
              className="lg:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-600"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <div className="hidden md:flex items-center bg-slate-100 px-3 py-1.5 rounded-lg w-64 border border-slate-200">
              <Search size={18} className="text-slate-400" />
              <input
                type="text"
                placeholder="Search master records..."
                className="bg-transparent border-none focus:outline-none text-sm ml-2 w-full"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Global Anti-Gravity Export Trigger */}
            <button
              onClick={triggerGlobalImport}
              className="hidden lg:flex items-center space-x-2 bg-slate-900 text-white px-4 py-2 rounded-xl border border-slate-800 shadow-lg hover:bg-blue-600 transition-all active:scale-95 group"
              title="Quick Anti-Gravity Sync"
            >
              <Zap size={14} className="text-blue-400 group-hover:text-white group-hover:fill-current" />
              <span className="text-[10px] font-black uppercase tracking-widest">Anti-Gravity Import</span>
            </button>

            <div className="hidden lg:flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100 mr-2">
              <Clock size={14} className="text-blue-500" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{currentTime} IST</span>
            </div>

            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            <div className="h-8 w-px bg-slate-200 mx-1"></div>

            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 ml-2 hover:bg-slate-50 p-1.5 rounded-xl transition-colors active:scale-95"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-black text-slate-900 leading-tight">{user.name}</p>
                  <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest">{user.role}</p>
                </div>
                <img
                  src={user.avatar || `https://picsum.photos/seed/${user.name}/40/40`}
                  alt="Profile"
                  className="w-10 h-10 rounded-xl border-2 border-white shadow-md"
                />
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2 border-b border-slate-50 mb-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Master Personnel List</p>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                    {allPersonnel.map((person) => (
                      <button
                        key={person.name}
                        onClick={() => {
                          onUserChange(person);
                          setShowUserMenu(false);
                        }}
                        className={`w-full flex items-center px-4 py-3 hover:bg-slate-50 transition-colors ${user.name === person.name ? 'bg-blue-50/50' : ''}`}
                      >
                        <img src={person.avatar} className="w-8 h-8 rounded-lg mr-3 object-cover shadow-sm border border-slate-100" alt={person.name} />
                        <div className="text-left">
                          <p className="text-xs font-bold text-slate-900">{person.name}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{person.role}</p>
                        </div>
                        {user.name === person.name && <UserCheck size={14} className="ml-auto text-blue-500" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
