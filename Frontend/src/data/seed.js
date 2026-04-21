const addDays = (baseDate, days) => {
  const date = new Date(baseDate);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

const today = new Date();
const yesterday = addDays(today, -1);
const lastWeek = addDays(today, -7);

export const INITIAL_USERS = [
  {
    id: 'u1',
    name: 'Admin Boss',
    email: 'admin@synapse.ai',
    role: 'admin',
    designation: 'CEO',
    expertise: ['Management', 'Strategy'],
    kra: ['Overall Efficiency', 'Revenue'],
    integrations: { drive: true, mail: true, sheets: true, pingbix: true },
    phone: '+1234567890',
  },
  {
    id: 'u2',
    name: 'Alex Developer',
    email: 'alex@synapse.ai',
    role: 'developer',
    designation: 'Senior Frontend Eng',
    expertise: ['React', 'Node', 'API'],
    kra: ['Feature Delivery', 'Bug Free Code'],
    integrations: { drive: true, mail: true, sheets: false, pingbix: true },
    phone: '+1987654321',
  },
  {
    id: 'u3',
    name: 'Sam Presales',
    email: 'sam@synapse.ai',
    role: 'presales',
    designation: 'Solutions Architect',
    expertise: ['Product Demo', 'Negotiation', 'Cloud architecture'],
    kra: ['Proposal Conversion', 'Meeting Success'],
    integrations: { drive: true, mail: true, sheets: true, pingbix: true },
    phone: '+1122334455',
  },
  {
    id: 'u4',
    name: 'Taylor Support',
    email: 'taylor@synapse.ai',
    role: 'support',
    designation: 'L2 Support Eng',
    expertise: ['Customer Query', 'Troubleshooting', 'Clevertap'],
    kra: ['Ticket Resolution Time', 'CSAT'],
    integrations: { drive: true, mail: true, sheets: true, pingbix: true },
    phone: '+1555666777',
  },
];

export const INITIAL_TASKS = [
  {
    id: 't1',
    title: 'Fix Auth API bug',
    description: 'Clients are reporting 401s intermittently on the main dashboard.',
    assignee: 'u2',
    creator: 'u1',
    status: 'in-progress',
    deadline: addDays(today, 1),
    priority: 'high',
    type: 'development',
  },
  {
    id: 't2',
    title: 'Draft Acme Proposal',
    description: 'Based on yesterdays meeting, draft a $50k proposal for the SSO module.',
    assignee: 'u3',
    creator: 'u1',
    status: 'todo',
    deadline: addDays(today, 2),
    priority: 'high',
    type: 'presales',
  },
  {
    id: 't3',
    title: 'Client X Clevertap Setup Error',
    description: 'Client cannot find the integration keys. Need to share doc and assist.',
    assignee: 'u4',
    creator: 'u1',
    status: 'pending',
    deadline: addDays(today, 0),
    priority: 'urgent',
    type: 'support',
  },
  {
    id: 't4',
    title: 'Update internal documentation',
    description: 'Update the wiki with new API endpoints.',
    assignee: 'u2',
    creator: 'u1',
    status: 'completed',
    deadline: addDays(today, -1),
    priority: 'low',
    type: 'general',
  },
];

export const INITIAL_FILES = [
  {
    id: 'f1',
    name: 'Clevertap Integration Guide.pdf',
    owner: 'u4',
    type: 'doc',
    contentSnippet: 'Step 1: Go to Clevertap Dashboard. Step 2: Extract API keys from Settings -> Project.',
  },
  {
    id: 'f2',
    name: 'Q3 Product Roadmap.xlsx',
    owner: 'u1',
    type: 'sheet',
    contentSnippet: 'July: SSO Feature. August: Analytics Dashboard.',
  },
  {
    id: 'f3',
    name: 'Standard Proposal Template.docx',
    owner: 'u3',
    type: 'doc',
    contentSnippet: 'Company Name: [X]. Total Cost: $[Y]. Terms and conditions apply.',
  },
  {
    id: 'f4',
    name: 'API Authentication Flow.png',
    owner: 'u2',
    type: 'image',
    contentSnippet: 'Image containing diagram of OAuth2 flow.',
  },
];

export const INITIAL_EMAIL_THREADS = [
  {
    id: 'th1',
    subject: 'Meeting Summary: Acme Corp Requirement',
    participants: ['manager@company.com', 'sam@synapse.ai', 'alex@synapse.ai'],
    messages: [
      {
        id: 'm1',
        sender: 'manager@company.com',
        isMe: false,
        text: 'Hi team, great call with Acme just now. They loved the demo.',
        time: '10:00 AM',
      },
      {
        id: 'm2',
        sender: 'sam@synapse.ai',
        isMe: true,
        text: 'Agreed. They seemed very interested in the real-time analytics module.',
        time: '10:05 AM',
      },
      {
        id: 'm3',
        sender: 'manager@company.com',
        isMe: false,
        text: 'Yes. Here is the summary: They need a custom dashboard, SSO login integration, and real-time alerts. Sam, please draft a proposal based on these 3 points. Alex, I need you to check the feasibility of SSO with their legacy system by tomorrow.',
        time: '10:15 AM',
      },
    ],
    analyzed: false,
    aiSummary: null,
  },
  {
    id: 'th2',
    subject: 'Support Request: Where is the Clevertap Doc?',
    participants: ['partner@agency.com', 'taylor@synapse.ai'],
    messages: [
      {
        id: 'm4',
        sender: 'partner@agency.com',
        isMe: false,
        text: 'Hi Taylor, we are trying to set up the Clevertap events but are lost. Can someone send over the latest Clevertap documentation and integration guide? We need to know where to put the keys.',
        time: '11:15 AM',
      },
    ],
    analyzed: false,
    aiSummary: null,
  },
];

export const INITIAL_AUTOMATIONS = [
  { id: 'a1', name: 'Pingbix: Task Assignment Alert', trigger: 'task_assigned', action: 'send_whatsapp', active: true },
  { id: 'a2', name: 'Pingbix: Task Completion to Manager', trigger: 'task_completed', action: 'send_whatsapp_manager', active: true },
  { id: 'a3', name: 'Pingbix: Urgent Email Alert', trigger: 'urgent_email_received', action: 'send_whatsapp_assignee', active: true },
];

export const INITIAL_MEETINGS = [
  {
    id: 'mt1',
    title: 'Acme Corp SSO Architecture',
    date: addDays(today, 0),
    time: '10:00 AM',
    attendees: ['sam@synapse.ai', 'client@acme.com'],
    status: 'completed',
    aiSummary: null,
    type: 'external',
  },
  {
    id: 'mt2',
    title: 'Weekly Engineering Sync',
    date: yesterday,
    time: '02:00 PM',
    attendees: ['alex@synapse.ai', 'admin@synapse.ai'],
    status: 'completed',
    aiSummary: null,
    type: 'internal',
  },
  {
    id: 'mt3',
    title: 'Q3 Roadmap & Pingbix Planning',
    date: lastWeek,
    time: '11:00 AM',
    attendees: ['admin@synapse.ai', 'sam@synapse.ai'],
    status: 'completed',
    aiSummary:
      '✨ **AI Summary:**\n\n**Key Discussions:**\n- Evaluated Q3 roadmap priorities.\n- Discussed scaling the Pingbix WhatsApp integration for higher throughput.\n\n**Decisions:**\n- Analytics Dashboard is the P0 priority for July.\n\n**Action Items:**\n- Alex: Draft architecture doc for dashboard.\n- Sam: Follow up with Acme on SSO requirements.',
    type: 'internal',
  },
  {
    id: 'mt4',
    title: 'Client Onboarding: BetaTech',
    date: addDays(today, 0),
    time: '04:00 PM',
    attendees: ['taylor@synapse.ai', 'onboarding@betatech.com'],
    status: 'scheduled',
    aiSummary: null,
    type: 'external',
  },
];

