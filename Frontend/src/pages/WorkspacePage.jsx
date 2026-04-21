import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { NotificationStack } from '../components/ui/NotificationStack';
import { PingbixQueue } from '../components/ui/PingbixQueue';
import { AnalyticsView } from '../features/analytics/AnalyticsView';
import { AutomationsView } from '../features/automations/AutomationsView';
import { DashboardView } from '../features/dashboard/DashboardView';
import { SmartDriveView } from '../features/drive/SmartDriveView';
import { InboxView } from '../features/inbox/InboxView';
import { MeetingsView } from '../features/meetings/MeetingsView';
import { ReportsView } from '../features/reports/ReportsView';
import { TaskTrackerView } from '../features/tasks/TaskTrackerView';
import { useWorkspace } from '../hooks/useWorkspace';

export function WorkspacePage() {
  const auth = useOutletContext();
  const workspace = useWorkspace(auth.user);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 flex overflow-hidden selection:bg-indigo-100">
      <Sidebar
        currentUser={workspace.currentUser}
        users={workspace.sidebarUsers}
        activeView={workspace.activeView}
        setActiveView={workspace.setActiveView}
        setCurrentUser={workspace.setCurrentUser}
      />

      <div className="flex-1 ml-[280px] flex flex-col h-screen relative">
        <Header currentUser={workspace.currentUser} onLogout={auth.logout} />

        <NotificationStack notifications={workspace.notifications} />
        <PingbixQueue pingbixQueue={workspace.pingbixQueue} />

        <main className="flex-1 p-10 overflow-y-auto">
          {workspace.activeView === 'dashboard' && (
            <DashboardView
              currentUser={workspace.currentUser}
              automations={workspace.automations}
              notify={workspace.notify}
            />
          )}
          {workspace.activeView === 'tasks' && (
            <TaskTrackerView
              currentUser={workspace.currentUser}
              notify={workspace.notify}
              users={workspace.teamMembers}
            />
          )}
          {workspace.activeView === 'inbox' && <InboxView notify={workspace.notify} />}
          {workspace.activeView === 'meetings' && <MeetingsView notify={workspace.notify} />}
          {workspace.activeView === 'drive' && <SmartDriveView notify={workspace.notify} />}
          {workspace.activeView === 'reports' && (
            <ReportsView currentUser={workspace.currentUser} notify={workspace.notify} />
          )}
          {workspace.activeView === 'automations' && (
            <AutomationsView automations={workspace.automations} notify={workspace.notify} />
          )}
          {workspace.activeView === 'analytics' && <AnalyticsView notify={workspace.notify} />}
        </main>
      </div>
    </div>
  );
}
