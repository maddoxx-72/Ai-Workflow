import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogOut, Search } from 'lucide-react';

export function Header({ currentUser, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handlePointerDown(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, []);

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-10 sticky top-0 z-10">
      <div className="flex items-center gap-3 bg-slate-100 border border-slate-200 px-5 py-2.5 rounded-2xl w-96 focus-within:bg-white focus-within:border-indigo-500 transition-all">
        <Search size={16} className="text-slate-400" />
        <input type="text" placeholder="AI Command Search..." className="bg-transparent border-none outline-none text-xs w-full text-slate-700 font-bold" />
      </div>

      <div className="flex items-center gap-4 relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((current) => !current)}
          className="flex items-center gap-3 p-1.5 pr-4 bg-white border border-slate-200 rounded-full shadow-sm hover:border-slate-300 transition-all"
        >
          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">{currentUser.name.charAt(0)}</div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-bold">{currentUser.name}</div>
            {currentUser.email && <div className="text-[10px] text-slate-400 font-medium">{currentUser.email}</div>}
          </div>
          <ChevronDown size={16} className={`text-slate-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-[calc(100%+12px)] w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-2">
            <div className="px-3 py-3 border-b border-slate-100">
              <div className="text-xs font-bold text-slate-800">{currentUser.name}</div>
              {currentUser.email && <div className="text-[11px] text-slate-500 mt-1 break-all">{currentUser.email}</div>}
            </div>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onLogout?.();
              }}
              className="w-full mt-2 px-3 py-2.5 rounded-xl text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            >
              <LogOut size={16} className="text-slate-500" />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
