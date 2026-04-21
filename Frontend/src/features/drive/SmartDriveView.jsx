import React, { useEffect, useState } from 'react';
import { Database, Eye, FileText, HardDrive, RefreshCw, Search } from 'lucide-react';
import driveApi from '../../api/drive';
import { getErrorMessage } from '../../utils/api';

function formatExecutionLog(result) {
  const lines = [];

  if (result.intent) {
    lines.push(`Intent: ${result.intent.action || 'find'}`);
    lines.push(`Search query: ${result.intent.searchQuery || 'n/a'}`);
    if (result.intent.recipient) {
      lines.push(`Recipient: ${result.intent.recipient}`);
    }
  }

  if (result.files?.length) {
    lines.push('');
    lines.push('Matched files:');
    result.files.forEach((file) => {
      lines.push(`- ${file.name} (${file.type})`);
    });
  } else {
    lines.push('');
    lines.push('Matched files: none');
  }

  if (result.shareResult?.shareableLink) {
    lines.push('');
    lines.push(`Share link: ${result.shareResult.shareableLink}`);
  }

  return lines.join('\n');
}

export function SmartDriveView({ notify }) {
  const [query, setQuery] = useState('');
  const [log, setLog] = useState('');
  const [searching, setSearching] = useState(false);
  const [files, setFiles] = useState([]);
  const [displayFiles, setDisplayFiles] = useState([]);

  useEffect(() => {
    let isMounted = true;

    async function loadFiles() {
      try {
        const response = await driveApi.listFiles();
        const nextFiles = response.files || [];

        if (isMounted) {
          setFiles(nextFiles);
          setDisplayFiles(nextFiles);
        }
      } catch (error) {
        if (isMounted) {
          notify(getErrorMessage(error, 'Unable to load drive files.'), 'warning');
        }
      }
    }

    loadFiles();

    return () => {
      isMounted = false;
    };
  }, [notify]);

  const handleSearch = async () => {
    if (!query.trim()) {
      notify('Enter a drive query to continue.', 'warning');
      return;
    }

    setSearching(true);

    try {
      const response = await driveApi.executeQuery(query.trim());
      setLog(formatExecutionLog(response));
      setDisplayFiles(response.files?.length ? response.files : files);
      notify('Drive query executed successfully.', 'success');
    } catch (error) {
      notify(getErrorMessage(error, 'Unable to execute the drive query.'), 'warning');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-3">
        <HardDrive className="text-blue-500" /> Semantic Drive
      </h1>
      <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5">
          <Database size={150} />
        </div>
        <h2 className="text-xl font-bold mb-2">Internal Knowledge Retrieval</h2>
        <p className="text-slate-400 text-sm mb-6">Search your organization's entire data lake using natural language.</p>
        <div className="flex gap-3">
          <input value={query} onChange={(event) => setQuery(event.target.value)} type="text" placeholder="e.g. Find the latest Clevertap guide..." className="flex-1 bg-white/10 border border-white/20 rounded-xl px-5 py-3 text-sm outline-none focus:border-indigo-400 transition-all" />
          <button onClick={handleSearch} disabled={searching} className="bg-indigo-600 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-500 transition-all">
            {searching ? <RefreshCw className="animate-spin" size={18} /> : <Search size={18} />} Search
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 h-64 overflow-y-auto">
          <h3 className="font-bold text-slate-800 text-sm mb-4 border-b pb-2">Execution Log</h3>
          <div className="text-xs text-slate-500 font-mono leading-relaxed whitespace-pre-wrap">{log || 'Awaiting search parameters...'}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 h-64 overflow-y-auto space-y-2">
          <h3 className="font-bold text-slate-800 text-sm mb-4 border-b pb-2">Indexed Documents</h3>
          {displayFiles.map((file) => (
            <div key={file.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between hover:bg-indigo-50 transition-all">
              <div className="flex items-center gap-3">
                <FileText size={16} className="text-indigo-500" />
                <span className="text-xs font-bold text-slate-700">{file.name}</span>
              </div>
              <Eye size={14} className="text-slate-400" />
            </div>
          ))}
          {displayFiles.length === 0 && (
            <div className="text-xs text-slate-400 italic">No files available.</div>
          )}
        </div>
      </div>
    </div>
  );
}
