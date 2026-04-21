import React, { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import analyticsApi from '../../api/analytics';
import { getErrorMessage } from '../../utils/api';

export function AnalyticsView({ notify }) {
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadAnalytics() {
      try {
        const response = await analyticsApi.getDashboardStats();

        if (isMounted) {
          setAnalytics(response);
        }
      } catch (error) {
        if (isMounted) {
          notify(getErrorMessage(error, 'Unable to load analytics.'), 'warning');
        }
      }
    }

    loadAnalytics();

    return () => {
      isMounted = false;
    };
  }, [notify]);

  const trend = analytics?.trend || [];
  const workload = analytics?.workload || [];
  const totalTasks = analytics?.totalTasks || 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-3">
        <BarChart3 className="text-indigo-600" /> Insight Center
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white p-8 rounded-3xl border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-8">Work Efficiency (7 Day Rollup)</h3>
          <div className="h-64 flex items-end justify-between gap-2 border-b border-slate-100 pb-2">
            {trend.map((value) => {
              const percent = value.total ? Math.round((value.completed / value.total) * 100) : 0;

              return (
                <div key={value.day} className="w-full bg-indigo-50 rounded-t-xl group relative cursor-pointer hover:bg-indigo-100 transition-all" style={{ height: `${Math.max(percent, 8)}%` }}>
                  <div className="absolute bottom-0 w-full bg-indigo-600 rounded-t-xl" style={{ height: `${Math.max(percent * 0.7, 6)}%` }} />
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">{percent}%</div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {trend.map((value) => (
              <span key={value.day}>{value.day}</span>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-8">Departmental Load</h3>
          <div className="flex items-center justify-center py-10">
            <div className="w-40 h-40 rounded-full border-[15px] border-indigo-600 relative flex items-center justify-center">
              <div className="absolute inset-[-15px] rounded-full border-[15px] border-emerald-400" style={{ clipPath: 'polygon(50% 50%, 100% 0, 100% 100%, 0 100%, 0 0)' }} />
              <div className="text-center">
                <div className="text-2xl font-black text-slate-800">{totalTasks}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Tasks</div>
              </div>
            </div>
          </div>
          <div className="space-y-3 mt-6">
            {workload.map((entry, index) => (
              <div key={entry.department} className="flex justify-between text-xs font-bold">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-indigo-600' : index === 1 ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  {entry.department}
                </div>
                <span>{entry.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
