import React from 'react';

export function NavItem({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-xs ${
        active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-[1.02]' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
      }`}
    >
      {React.cloneElement(icon, { size: 18 })}
      {label}
    </button>
  );
}

