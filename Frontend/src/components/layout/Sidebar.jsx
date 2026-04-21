import React from 'react';
import {
  BarChart3,
  CheckSquare,
  FileText,
  HardDrive,
  LayoutDashboard,
  Mail,
  Settings2,
  Video,
  Zap,
} from 'lucide-react';
import { NavItem } from '../ui/NavItem';

export function Sidebar({ currentUser, users, activeView, setActiveView, setCurrentUser }) {
  return (
    <aside className="w-[280px] bg-[#090E17] text-slate-300 flex flex-col h-screen fixed left-0 top-0 shadow-2xl z-20">
      <div className="p-6 flex items-center gap-3 text-white font-bold text-2xl tracking-tighter border-b border-white/5">
        <div className="bg-indigo-600 p-1.5 rounded-lg">
          <Zap size={24} />
        </div>
        Synapse OS
      </div>

      <div className="p-5 border-b border-white/5 bg-white/5">
        <select
          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs font-bold text-white outline-none cursor-pointer"
          value={currentUser.id}
          onChange={(event) => setCurrentUser(users.find((user) => user.id === event.target.value) || currentUser)}
        >
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <NavItem active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} icon={<LayoutDashboard />} label="Dashboard" />
        <NavItem active={activeView === 'tasks'} onClick={() => setActiveView('tasks')} icon={<CheckSquare />} label="Task Flow" />
        <NavItem active={activeView === 'inbox'} onClick={() => setActiveView('inbox')} icon={<Mail />} label="AI Inbox" />
        <NavItem active={activeView === 'meetings'} onClick={() => setActiveView('meetings')} icon={<Video />} label="Meetings" />

        <div className="pt-6 pb-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest px-4">Workspace Tools</div>
        <NavItem active={activeView === 'drive'} onClick={() => setActiveView('drive')} icon={<HardDrive />} label="Knowledge Base" />
        <NavItem active={activeView === 'reports'} onClick={() => setActiveView('reports')} icon={<FileText />} label="Auto Reports" />
        <NavItem active={activeView === 'analytics'} onClick={() => setActiveView('analytics')} icon={<BarChart3 />} label="System Intel" />

        {currentUser.role === 'admin' && (
          <>
            <div className="pt-6 pb-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest px-4">Administration</div>
            <NavItem active={activeView === 'automations'} onClick={() => setActiveView('automations')} icon={<Settings2 />} label="Pingbix Engine" />
          </>
        )}
      </nav>
    </aside>
  );
}
