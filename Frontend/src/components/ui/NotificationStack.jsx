import React from 'react';
import { AlertCircle, Check } from 'lucide-react';

export function NotificationStack({ notifications }) {
  return (
    <div className="fixed top-24 right-10 z-50 flex flex-col gap-3">
      {notifications.map((notification) => (
        <div key={notification.id} className="bg-slate-900 text-white shadow-2xl rounded-2xl p-4 flex items-center gap-3 min-w-[300px] border border-white/10 animate-fade-in">
          {notification.type === 'warning' ? <AlertCircle className="text-amber-400" size={18} /> : <Check className="text-emerald-400" size={18} />}
          <p className="text-xs font-bold">{notification.msg}</p>
        </div>
      ))}
    </div>
  );
}

