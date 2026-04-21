import { useCallback, useMemo, useState } from 'react';
import { INITIAL_AUTOMATIONS, INITIAL_USERS } from '../data/seed';

const DEFAULT_INTEGRATIONS = {
  drive: true,
  mail: true,
  sheets: true,
  pingbix: true,
};

function normalizeCurrentUser(authUser) {
  return {
    id: authUser?.userId || authUser?.id || 'me',
    name: authUser?.name || authUser?.email || 'Workspace User',
    email: authUser?.email || '',
    picture: authUser?.picture || '',
    role: authUser?.role || 'admin',
    designation: authUser?.designation || 'Workspace Member',
    expertise: [],
    kra: [],
    integrations: DEFAULT_INTEGRATIONS,
    managerEmail: authUser?.managerEmail || '',
    managerName: authUser?.managerName || '',
    managerPhone: authUser?.managerPhone || '',
    phone: authUser?.phone || '',
  };
}

export function useWorkspace(authUser) {
  const currentUser = useMemo(() => normalizeCurrentUser(authUser), [authUser]);
  const [activeView, setActiveView] = useState('dashboard');
  const [notifications, setNotifications] = useState([]);
  const [pingbixQueue] = useState([]);

  const sidebarUsers = useMemo(() => [currentUser], [currentUser]);
  const teamMembers = useMemo(() => {
    const seedUsers = INITIAL_USERS.filter((user) => user.email !== currentUser.email);
    return [currentUser, ...seedUsers];
  }, [currentUser]);

  const notify = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, msg, type }]);

    window.setTimeout(() => {
      setNotifications((prev) => prev.filter((notification) => notification.id !== id));
    }, 5000);
  }, []);

  return {
    activeView,
    automations: INITIAL_AUTOMATIONS,
    currentUser,
    notifications,
    notify,
    pingbixQueue,
    setActiveView,
    setCurrentUser: () => {},
    sidebarUsers,
    teamMembers,
  };
}
