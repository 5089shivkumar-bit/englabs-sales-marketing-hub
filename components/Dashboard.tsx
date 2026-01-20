
import React from 'react';
import { 
  TrendingUp, 
  Users, 
  Briefcase, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { Customer, Expo } from '../types';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

interface DashboardProps {
  customers: Customer[];
  expos: Expo[];
  marketingTeam: any[];
}

export const Dashboard: React.FC<DashboardProps> = ({ customers, expos, marketingTeam }) => {
  const totalTurnover = customers.reduce((acc, curr) => acc + (curr.annualTurnover || 0), 0);
  const totalCustomers = customers.length;
  const upcomingExposCount = expos.length;

  const techUsageMap = customers.flatMap(c => c.pricingHistory).reduce((acc: Record<string, number>, curr) => {
    const key = curr.tech.split(' ')[0]; 
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const techUsageData = Object.entries(techUsageMap).map(([name, value]) => ({ name, value }));

  const trendData = [
    { month: 'Jan', sales: 4500000 },
    { month: 'Feb', sales: 5200000 },
    { month: 'Mar', sales: 4800000 },
    { month: 'Apr', sales: 6100000 },
    { month: 'May', sales: 5500000 },
    { month: 'Jun', sales: 6700000 },
  ];

  const formatCurrency = (val: number) => {
    if (val >= 10000000) return `₹ ${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹ ${(val / 100000).toFixed(2)} L`;
    return `₹ ${val.toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Indian Market Overview</h2>
          <p className="text-slate-500">Real-time performance across national manufacturing hubs.</p>
        </div>
        <div className="flex items-center space-x-3 bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex -space-x-2">
            {marketingTeam.map((member, i) => (
              <img 
                key={i} 
                className="w-8 h-8 rounded-full border-2 border-white shadow-sm object-cover" 
                src={member.avatar} 
                alt={member.name} 
                title={member.name}
              />
            ))}
          </div>
          <div className="text-left">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Marketing Team</p>
            <p className="text-xs font-bold text-slate-700 leading-none">{marketingTeam.length} Active Members</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Annual Revenue" 
          value={formatCurrency(totalTurnover)} 
          icon={TrendingUp} 
          trend="+12.5%" 
          positive={true} 
        />
        <StatCard 
          title="Active Customers" 
          value={totalCustomers.toString()} 
          icon={Users} 
          trend="+4 This Month" 
          positive={true} 
        />
        <StatCard 
          title="Project Pipeline" 
          value="₹ 8.42 Cr" 
          icon={Briefcase} 
          trend="-2.1%" 
          positive={false} 
        />
        <StatCard 
          title="Upcoming Expos" 
          value={upcomingExposCount.toString()} 
          icon={Calendar} 
          trend="National Sync" 
          positive={true} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-900">Monthly Sales (INR)</h3>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} tickFormatter={(val) => `₹${val/100000}L`} />
                  <Tooltip 
                    formatter={(val: number) => `₹ ${val.toLocaleString('en-IN')}`}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Data Ingestion Widget */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl text-white flex flex-col md:flex-row items-center justify-between shadow-xl shadow-blue-200">
            <div className="mb-6 md:mb-0">
              <h3 className="text-2xl font-black mb-2">Bulk Data Ingestion</h3>
              <p className="text-blue-100 text-sm max-w-md">Import all your sales leads, pricing records, and expo databases directly from Excel to sync with the national dashboard.</p>
            </div>
            <a href="#/data-mgmt" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('nav-tab', { detail: 'data-mgmt' })); }} className="px-8 py-4 bg-white text-blue-700 rounded-2xl font-bold shadow-lg hover:bg-blue-50 transition-all flex items-center group">
              <FileSpreadsheet size={20} className="mr-3" /> Start Import <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          {/* Marketing Team Showcase Section */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-slate-900 flex items-center">
                <ShieldCheck size={24} className="mr-3 text-emerald-500" /> Professional Marketing Team
              </h3>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Core Strategy Unit</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {marketingTeam.map((member, i) => (
                <div key={i} className="flex items-center p-4 bg-slate-50/50 rounded-[1.5rem] border border-slate-100 hover:bg-white hover:shadow-md transition-all group">
                  <img 
                    src={member.avatar} 
                    alt={member.name} 
                    className="w-12 h-12 rounded-2xl border-2 border-white shadow-sm object-cover group-hover:scale-105 transition-transform" 
                  />
                  <div className="ml-4">
                    <p className="text-sm font-bold text-slate-900 leading-tight">{member.name}</p>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-tighter mt-1">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-full">
          <h3 className="font-bold text-slate-900 mb-6">Technology Distribution</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={techUsageData.length > 0 ? techUsageData : [{ name: 'N/A', value: 1 }]}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {techUsageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                  {techUsageData.length === 0 && <Cell key="cell-empty" fill="#f1f5f9" />}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {techUsageData.map((item, i) => (
              <div key={item.name} className="flex items-center space-x-2 text-xs">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                <span className="text-slate-600 font-medium">{item.name}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-8 pt-8 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Quick Links</h4>
            <div className="space-y-3">
              <button className="w-full text-left text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors flex items-center">
                <FileSpreadsheet size={16} className="mr-2" /> Download Templates
              </button>
              <button className="w-full text-left text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors flex items-center">
                <Briefcase size={16} className="mr-2" /> Export Market Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ 
  title: string; 
  value: string; 
  icon: React.ElementType; 
  trend: string; 
  positive: boolean;
}> = ({ title, value, icon: Icon, trend, positive }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2.5 bg-slate-50 rounded-xl text-blue-600">
        <Icon size={24} />
      </div>
      <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-lg ${
        positive ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'
      }`}>
        {positive ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
        {trend}
      </div>
    </div>
    <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
    <p className="text-2xl font-bold text-slate-900">{value}</p>
  </div>
);
