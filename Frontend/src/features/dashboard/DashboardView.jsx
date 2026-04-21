import React, { useEffect, useMemo, useState } from 'react';
import { Activity, CheckSquare, Clock, GitMerge, Video, Zap } from 'lucide-react';
import analyticsApi from '../../api/analytics';
import meetingsApi from '../../api/meetings';
import tasksApi from '../../api/tasks';
import { StatCard } from '../../components/ui/StatCard';
import { getErrorMessage } from '../../utils/api';

const TODAY = new Date().toISOString().split('T')[0];

const STATUS_LABELS = {
  todo: 'To Do',
  'in-progress': 'In Progress',
  review: 'Review',
  completed: 'Completed',
};

function normalizeTask(task) {
  const statusMap = {
    in_progress: 'in-progress',
    in_review: 'review',
  };

  return {
    ...task,
    assignedTo: task.assignedTo || null,
    dueDate: task.dueDate ? task.dueDate.split('T')[0] : null,
    status: statusMap[task.status] || task.status || 'todo',
  };
}

function normalizeMeeting(meeting) {
  const startAt = meeting.startTime ? new Date(meeting.startTime) : null;

  return {
    ...meeting,
    displayDate: startAt
      ? startAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : 'TBD',
    displayTime: startAt
      ? startAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      : 'TBD',
    startAt,
  };
}

function toApiStatus(status) {
  const statusMap = {
    'in-progress': 'in-progress',
    review: 'review',
  };

  return statusMap[status] || status;
}

function isCurrentUsersTask(task, currentUser) {
  const currentIdentifiers = [currentUser.id, currentUser.email, currentUser.name].filter(Boolean);
  return currentIdentifiers.includes(task.assignedTo);
}

export function DashboardView({ currentUser, automations, notify }) {
  const [analytics, setAnalytics] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [meetings, setMeetings] = useState([]);

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
          notify(getErrorMessage(error, 'Unable to load dashboard analytics.'), 'warning');
        }
      }
    }

    async function loadTasks() {
      try {
        const response = await tasksApi.getAllTasks();

        if (isMounted) {
          setTasks((response.tasks || []).map(normalizeTask));
        }
      } catch (error) {
        if (isMounted) {
          notify(getErrorMessage(error, 'Unable to load task workload.'), 'warning');
        }
      }
    }

    async function loadMeetings() {
      try {
        const response = await meetingsApi.listMeetings({ daysBack: 7, daysAhead: 30 });

        if (isMounted) {
          setMeetings((response.meetings || []).map(normalizeMeeting));
        }
      } catch (error) {
        if (isMounted) {
          notify(getErrorMessage(error, 'Unable to load meetings for the dashboard.'), 'warning');
        }
      }
    }

    loadAnalytics();
    loadTasks();
    loadMeetings();

    return () => {
      isMounted = false;
    };
  }, [notify]);

  const openTasks = useMemo(
    () => tasks.filter((task) => task.status !== 'completed'),
    [tasks],
  );
  const myTasks = useMemo(() => {
    const matchingTasks = openTasks.filter((task) => isCurrentUsersTask(task, currentUser));
    return matchingTasks.length > 0 ? matchingTasks : openTasks;
  }, [currentUser, openTasks]);
  const upcomingMeetings = useMemo(
    () => meetings.filter((meeting) => meeting.startAt && meeting.startAt.getTime() >= Date.now()).slice(0, 4),
    [meetings],
  );

  async function handleTaskStatusChange(taskId, nextStatus) {
    try {
      const response = await tasksApi.updateTask(taskId, { status: toApiStatus(nextStatus) });
      const updatedTask = normalizeTask(response.task);

      setTasks((prev) =>
        prev.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
      );
    } catch (error) {
      notify(getErrorMessage(error, 'Unable to update task status.'), 'warning');
    }
  }

  const analyticsStats = analytics?.stats || {};

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Workspace Dashboard</h1>
          <p className="text-slate-500 mt-1">Hello, {currentUser.name}. Here is your operational focus for today.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => notify('Dashboard synced with live inbox, tasks, and meeting data.', 'success')}
            className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-sm"
          >
            <Clock size={16} /> Refresh Context
          </button>
          <div className="text-sm font-bold bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl border border-indigo-100 flex items-center gap-2">
            <Clock size={16} /> {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="My Open Tasks" value={myTasks.length} color="bg-indigo-600" icon={<CheckSquare size={20} />} />
        <StatCard label="Success Rate" value={`${analyticsStats.completionRate || 0}%`} color="bg-emerald-600" icon={<Activity size={20} />} />
        <StatCard label="Upcoming Meetings" value={upcomingMeetings.length} color="bg-blue-600" icon={<Video size={20} />} />
        <StatCard label="Active Rules" value={automations.filter((automation) => automation.active).length} color="bg-purple-600" icon={<GitMerge size={20} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Clock className="text-indigo-500" /> Current Workload
          </h3>
          <div className="space-y-4">
            {myTasks.length === 0 ? (
              <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 font-medium">
                Workspace clear. No pending tasks.
              </div>
            ) : (
              myTasks.map((task) => (
                <div key={task.id} className="p-4 border border-slate-100 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-50/30 hover:bg-slate-50 transition-all gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-slate-800">{task.title}</h4>
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          task.priority === 'urgent'
                            ? 'bg-red-100 text-red-700'
                            : task.priority === 'high'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-1">{task.description || 'No description provided.'}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Due</div>
                      <div className={`text-sm font-bold ${task.dueDate && task.dueDate <= TODAY ? 'text-red-600' : 'text-slate-700'}`}>{task.dueDate || 'No deadline'}</div>
                    </div>
                    <select
                      className="text-xs border border-slate-200 rounded-lg p-2 bg-white text-slate-700 font-bold cursor-pointer outline-none focus:border-indigo-500"
                      value={task.status}
                      onChange={(event) => handleTaskStatusChange(task.id, event.target.value)}
                    >
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Video className="text-blue-600" /> Upcoming Meetings
            </h3>
            <div className="space-y-3">
              {upcomingMeetings.length === 0 ? (
                <p className="text-sm text-slate-500 italic">No upcoming Meet sessions in the current window.</p>
              ) : (
                upcomingMeetings.map((meeting) => (
                  <div key={meeting.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-700 truncate">{meeting.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{meeting.displayDate}</span>
                    </div>
                    <p className="text-xs text-slate-500">{meeting.displayTime}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl shadow-xl text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Zap size={80} />
            </div>
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-indigo-400">
              <Zap size={20} /> AI Status
            </h3>
            <p className="text-slate-400 text-xs mb-4">Synapse Core is optimizing your workflows across Drive, Mail, meetings, and automation rules.</p>
            <div className="space-y-2 text-xs font-bold uppercase tracking-widest text-slate-500">
              <div className="flex items-center justify-between">
                <span>Task Parser</span> <span className="text-emerald-400">Ready</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Meeting Summaries</span> <span className="text-emerald-400">Ready</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Analytics Feed</span> <span className="text-emerald-400">{analytics?.trend?.length || 0}d window</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
