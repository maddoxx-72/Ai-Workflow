import React from 'react';
import { MessageCircle } from 'lucide-react';

export function PingbixQueue({ pingbixQueue }) {
  return (
    <div className="fixed bottom-10 right-10 z-50 flex flex-col gap-4">
      {pingbixQueue.map((message) => (
        <div key={message.id} className="bg-white shadow-2xl rounded-3xl p-5 w-80 animate-slide-up border-l-8 border-[#25D366]">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <MessageCircle size={14} className="text-[#25D366]" />
              <span className="text-[10px] font-black uppercase text-slate-400">Pingbix WA</span>
            </div>
            <span className="text-[10px] font-bold text-slate-300">Just Now</span>
          </div>
          <div className="text-xs leading-relaxed text-slate-700 bg-emerald-50/50 p-3 rounded-2xl font-medium">{message.message}</div>
        </div>
      ))}
    </div>
  );
}

