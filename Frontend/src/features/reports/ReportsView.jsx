import React, { useEffect, useState } from 'react';
import { FileText, RefreshCw, Zap } from 'lucide-react';
import reportsApi from '../../api/reports';
import { getErrorMessage } from '../../utils/api';

function formatReportOutput(report) {
  if (!report) {
    return '';
  }

  const sections = [
    `Week of: ${report.weekOf || 'N/A'}`,
    '',
    `Summary\n${report.summary || 'No summary available.'}`,
    '',
    `Completed\n${(report.completed || []).map((item) => `- ${item.task}: ${item.impact}`).join('\n') || '- None'}`,
    '',
    `In Progress\n${(report.inProgress || []).map((item) => `- ${item.task}${item.blockers ? ` | blocker: ${item.blockers}` : ''}${item.eta ? ` | ETA: ${item.eta}` : ''}`).join('\n') || '- None'}`,
    '',
    `Blockers\n${(report.blockers || []).map((item) => `- ${item}`).join('\n') || '- None'}`,
    '',
    `Next Week\n${(report.nextWeek || []).map((item) => `- ${item}`).join('\n') || '- None'}`,
  ];

  return sections.join('\n');
}

export function ReportsView({ currentUser, notify }) {
  const [formattedReport, setFormattedReport] = useState(null);
  const [managerEmail, setManagerEmail] = useState('');
  const [managerName, setManagerName] = useState('');
  const [text, setText] = useState('');
  const [processing, setProcessing] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setManagerEmail(currentUser.managerEmail || '');
    setManagerName(currentUser.managerName || '');
  }, [currentUser.managerEmail, currentUser.managerName]);

  const handleFormalize = async () => {
    if (!text.trim()) {
      notify('Add some report notes before formatting.', 'warning');
      return;
    }

    setProcessing(true);

    try {
      const response = await reportsApi.formatReport(text);
      setFormattedReport(response.report);
      setText(formatReportOutput(response.report));
      notify('Notes transformed into formal report format.', 'success');
    } catch (error) {
      notify(getErrorMessage(error, 'Unable to format the report.'), 'warning');
    } finally {
      setProcessing(false);
    }
  };

  const handleSendReport = async () => {
    if (!text.trim()) {
      notify('Add report content before sending.', 'warning');
      return;
    }

    if (!managerEmail.trim()) {
      notify('Add the manager email before sending the report.', 'warning');
      return;
    }

    setSending(true);

    try {
      await reportsApi.sendReport({
        formattedReport,
        managerEmail: managerEmail.trim(),
        managerName: managerName.trim(),
        rawContent: text,
      });
      notify('Report dispatched successfully.', 'success');
    } catch (error) {
      notify(getErrorMessage(error, 'Unable to send the report.'), 'warning');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-3">
        <FileText className="text-orange-500" /> AI Reporting
      </h1>
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Workspace Context / Rough Notes</label>
          <button
            onClick={() => {
              setFormattedReport(null);
              setText('Worked on API bugs. Completed 2. Blocked on design.');
            }}
            className="text-[10px] bg-slate-100 px-2 py-1 rounded font-bold text-slate-600"
          >
            Load Draft
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <input
            type="text"
            value={managerName}
            onChange={(event) => setManagerName(event.target.value)}
            className="w-full bg-slate-50 rounded-2xl px-4 py-3 border-2 border-slate-100 outline-none focus:border-indigo-500 text-sm transition-all"
            placeholder="Manager name"
          />
          <input
            type="email"
            value={managerEmail}
            onChange={(event) => setManagerEmail(event.target.value)}
            className="w-full bg-slate-50 rounded-2xl px-4 py-3 border-2 border-slate-100 outline-none focus:border-indigo-500 text-sm transition-all"
            placeholder="Manager email"
          />
        </div>
        <textarea
          value={text}
          onChange={(event) => {
            setFormattedReport(null);
            setText(event.target.value);
          }}
          className="w-full h-80 bg-slate-50 rounded-2xl p-6 border-2 border-slate-100 outline-none focus:border-indigo-500 font-mono text-xs mb-6 transition-all"
          placeholder="Jot down your progress..."
        />
        <div className="flex gap-4">
          <button onClick={handleFormalize} disabled={processing} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all flex items-center justify-center gap-2">
            {processing ? <RefreshCw className="animate-spin" size={20} /> : <Zap size={20} />}
            {processing ? 'AI Formatting...' : 'Formalize with AI'}
          </button>
          <button onClick={handleSendReport} disabled={sending} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold">
            {sending ? 'Sending...' : 'Send Report'}
          </button>
        </div>
      </div>
    </div>
  );
}
