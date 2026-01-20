
import React, { useState } from 'react';
import { 
  Mail, 
  Phone, 
  ExternalLink, 
  ShieldCheck, 
  Award, 
  MessageSquare, 
  Users, 
  Plus, 
  Edit3, 
  X, 
  Save,
  UserPlus,
  Trash2
} from 'lucide-react';
import { User } from '../types';

interface MarketingTeamMember {
  name: string;
  role: string;
  avatar: string;
  email: string;
  phone: string;
  bio: string;
}

interface MarketingTeamViewProps {
  team: MarketingTeamMember[];
  setTeam: React.Dispatch<React.SetStateAction<MarketingTeamMember[]>>;
  currentUser: User;
}

export const MarketingTeamView: React.FC<MarketingTeamViewProps> = ({ team, setTeam, currentUser }) => {
  const [editingMember, setEditingMember] = useState<MarketingTeamMember | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Member Form State
  const [newMember, setNewMember] = useState({
    name: '',
    role: '',
    email: '',
    phone: '',
    bio: ''
  });

  const handleEditClick = (member: MarketingTeamMember, index: number) => {
    setEditingMember({ ...member });
    setEditIndex(index);
  };

  const handleSaveEdit = () => {
    if (editingMember && editIndex !== null) {
      setTeam(prev => {
        const next = [...prev];
        next[editIndex] = editingMember;
        return next;
      });
      setEditingMember(null);
      setEditIndex(null);
    }
  };

  const handleRemoveMember = (index: number) => {
    const member = team[index];
    if (member.name === currentUser.name) {
      alert("You cannot remove your own active profile.");
      return;
    }
    
    // Safety check for critical admins
    if (['Mr. Bharat', 'Salil Anand'].includes(member.name)) {
      alert("System Administrators cannot be removed from the core registry.");
      return;
    }

    if (window.confirm(`Personnel ${currentUser.name}, are you sure you want to remove "${member.name}" from the active marketing unit?`)) {
      setTeam(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name || !newMember.role) return;

    const member: MarketingTeamMember = {
      ...newMember,
      avatar: `https://picsum.photos/seed/${newMember.name}/128/128`
    };

    setTeam(prev => [...prev, member]);
    setShowAddModal(false);
    setNewMember({ name: '', role: '', email: '', phone: '', bio: '' });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Core Strategy Unit</h2>
          <p className="text-slate-500 text-lg">Managing the specialists driving national growth and market insights.</p>
        </div>
        <div className="px-6 py-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center shadow-sm">
          <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3 animate-pulse"></div>
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Active Collaboration</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {team.map((member, i) => (
          <div 
            key={i} 
            className="group bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-2xl hover:border-blue-200 transition-all duration-300"
          >
            <div className="p-8 pb-4 relative">
              <div className="absolute top-8 right-8 flex space-x-2 opacity-0 group-hover:opacity-100 transition-all">
                <button 
                  onClick={() => handleEditClick(member, i)}
                  className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                  title="Edit Personal Details"
                >
                  <Edit3 size={18} />
                </button>
                <button 
                  onClick={() => handleRemoveMember(i)}
                  className="p-2.5 bg-rose-50 rounded-xl text-rose-400 hover:text-rose-600 hover:bg-rose-100 transition-all"
                  title="Remove Personnel"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <img 
                    src={member.avatar} 
                    alt={member.name} 
                    className="w-24 h-24 rounded-3xl object-cover border-4 border-slate-50 shadow-lg group-hover:scale-105 transition-transform duration-500"
                  />
                  {(member.role.toLowerCase().includes('admin') || member.name === currentUser.name) && (
                    <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-1.5 rounded-xl shadow-lg ring-2 ring-white">
                      <ShieldCheck size={14} />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
                    {member.name}
                  </h3>
                  <div className="inline-flex items-center px-3 py-1 bg-slate-100 rounded-full mt-2 border border-slate-200">
                    <Award size={12} className="mr-1.5 text-blue-600" />
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                      {member.role}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-8 py-6 space-y-6 flex-1">
              <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 group-hover:bg-blue-50/30 transition-colors h-[100px] overflow-hidden">
                <p className="text-xs text-slate-600 leading-relaxed font-medium line-clamp-4">
                  "{member.bio || 'Key contributor to Mark-Eng Enterprise operations and market growth strategy.'}"
                </p>
              </div>

              <div className="space-y-3">
                <a 
                  href={`mailto:${member.email}`} 
                  className="flex items-center p-3 rounded-xl border border-transparent hover:border-slate-200 hover:bg-white text-sm text-slate-600 font-bold transition-all"
                >
                  <Mail size={16} className="mr-3 text-blue-500" />
                  <span className="truncate">{member.email}</span>
                </a>
                <a 
                  href={`tel:${member.phone}`} 
                  className="flex items-center p-3 rounded-xl border border-transparent hover:border-slate-200 hover:bg-white text-sm text-slate-600 font-bold transition-all"
                >
                  <Phone size={16} className="mr-3 text-indigo-500" />
                  {member.phone}
                </a>
              </div>
            </div>

            <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors">
                <MessageSquare size={14} className="mr-2" /> Direct Message
              </button>
              <button className="p-2 bg-white rounded-lg border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm">
                <ExternalLink size={16} />
              </button>
            </div>
          </div>
        ))}

        {/* Dynamic Join Card */}
        <div 
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center text-white shadow-xl shadow-blue-200 relative overflow-hidden group cursor-pointer active:scale-95 transition-all"
        >
          <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:rotate-12 transition-transform duration-1000">
            <Users size={120} />
          </div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <Plus size={32} />
            </div>
            <h3 className="text-2xl font-black mb-3">Onboard Specialist</h3>
            <p className="text-blue-100 text-sm max-w-xs mb-8">
              Logged in: <span className="font-black underline">{currentUser.name}</span>. Add marketing specialists or sales leads to the unit.
            </p>
            <button className="w-full py-4 bg-white text-blue-700 rounded-2xl font-bold shadow-lg hover:bg-blue-50 transition-all uppercase tracking-widest text-xs">
              Add New Member
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingMember && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                  <Edit3 size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">Edit Member Profile</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Update personal details</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingMember(null)}
                className="p-3 hover:bg-slate-50 rounded-full text-slate-400"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                  <input 
                    type="text"
                    value={editingMember.name}
                    onChange={(e) => setEditingMember({...editingMember, name: e.target.value})}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Designation</label>
                  <input 
                    type="text"
                    value={editingMember.role}
                    onChange={(e) => setEditingMember({...editingMember, role: e.target.value})}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
                  <input 
                    type="email"
                    value={editingMember.email}
                    onChange={(e) => setEditingMember({...editingMember, email: e.target.value})}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</label>
                  <input 
                    type="tel"
                    value={editingMember.phone}
                    onChange={(e) => setEditingMember({...editingMember, phone: e.target.value})}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Professional Bio</label>
                <textarea 
                  value={editingMember.bio}
                  rows={4}
                  onChange={(e) => setEditingMember({...editingMember, bio: e.target.value})}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium text-slate-600 outline-none resize-none"
                />
              </div>
            </div>

            <div className="p-8 bg-slate-50 flex items-center justify-end space-x-4">
              <button onClick={() => setEditingMember(null)} className="px-6 py-3 text-sm font-bold text-slate-500">Cancel</button>
              <button onClick={handleSaveEdit} className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl flex items-center">
                <Save size={18} className="mr-2" /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <form onSubmit={handleAddMember}>
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                    <UserPlus size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Add Team Member</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Manual Personnel Onboarding</p>
                  </div>
                </div>
                <button type="button" onClick={() => setShowAddModal(false)} className="p-3 hover:bg-slate-50 rounded-full text-slate-400">
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name*</label>
                    <input required type="text" value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Designation*</label>
                    <input required type="text" value={newMember.role} onChange={e => setNewMember({...newMember, role: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
                    <input type="email" value={newMember.email} onChange={e => setNewMember({...newMember, email: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</label>
                    <input type="tel" value={newMember.phone} onChange={e => setNewMember({...newMember, phone: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Professional Bio</label>
                  <textarea rows={4} value={newMember.bio} onChange={e => setNewMember({...newMember, bio: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-600 outline-none resize-none" />
                </div>
              </div>

              <div className="p-8 bg-slate-50 flex items-center justify-end space-x-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-3 text-sm font-bold text-slate-500">Cancel</button>
                <button type="submit" className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl flex items-center">
                  <Save size={18} className="mr-2" /> Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
