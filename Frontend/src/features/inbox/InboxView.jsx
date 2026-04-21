import React, { useEffect, useMemo, useState } from 'react';
import { Mail, Zap } from 'lucide-react';
import inboxApi from '../../api/inbox';
import { getErrorMessage } from '../../utils/api';

export function InboxView({ notify }) {
  const [emails, setEmails] = useState([]);
  const [selectedEmailId, setSelectedEmailId] = useState(null);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [loadingList, setLoadingList] = useState(true);
  const [drafting, setDrafting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadEmails() {
      try {
        const response = await inboxApi.listEmails();
        const nextEmails = response.emails || [];

        if (isMounted) {
          setEmails(nextEmails);
          setSelectedEmailId(nextEmails[0]?.id || null);
        }
      } catch (error) {
        if (isMounted) {
          notify(getErrorMessage(error, 'Unable to load inbox.'), 'warning');
        }
      } finally {
        if (isMounted) {
          setLoadingList(false);
        }
      }
    }

    loadEmails();

    return () => {
      isMounted = false;
    };
  }, [notify]);

  useEffect(() => {
    let isMounted = true;

    async function loadEmailDetail() {
      if (!selectedEmailId) {
        setSelectedEmail(null);
        return;
      }

      setSelectedEmail(null);

      try {
        const response = await inboxApi.getEmail(selectedEmailId);

        if (isMounted) {
          setSelectedEmail(response.email || null);
        }
      } catch (error) {
        if (isMounted) {
          notify(getErrorMessage(error, 'Unable to load email details.'), 'warning');
        }
      }
    }

    loadEmailDetail();

    return () => {
      isMounted = false;
    };
  }, [notify, selectedEmailId]);

  const selectedDraft = useMemo(
    () => drafts[selectedEmailId] || '',
    [drafts, selectedEmailId],
  );

  async function handleDraftReply() {
    if (!selectedEmail) {
      return;
    }

    setDrafting(true);

    try {
      const emailThread = [
        `Subject: ${selectedEmail.subject}`,
        `From: ${selectedEmail.from}`,
        `To: ${selectedEmail.to}`,
        `Date: ${selectedEmail.date}`,
        '',
        selectedEmail.body || selectedEmail.snippet || '',
      ].join('\n');

      const response = await inboxApi.draftReply({
        emailThread,
        replyIntent: 'Acknowledge the request, answer clearly, and suggest the next step.',
      });

      setDrafts((prev) => ({
        ...prev,
        [selectedEmail.id]: response.draft || '',
      }));
      notify('Draft reply generated successfully.', 'success');
    } catch (error) {
      notify(getErrorMessage(error, 'Unable to draft a reply.'), 'warning');
    } finally {
      setDrafting(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex h-[80vh]">
      <div className="w-80 border-r border-slate-200 flex flex-col bg-slate-50">
        <div className="p-4 border-b border-slate-200 font-bold flex items-center gap-2">
          <Mail size={18} className="text-indigo-600" /> Mail Center
        </div>
        <div className="flex-1 overflow-y-auto">
          {emails.map((email) => (
            <div
              key={email.id}
              onClick={() => setSelectedEmailId(email.id)}
              className={`p-4 border-b border-slate-100 cursor-pointer transition-all ${
                selectedEmailId === email.id ? 'bg-white border-l-4 border-indigo-600 shadow-sm' : 'hover:bg-slate-100 border-l-4 border-transparent'
              }`}
            >
              <div className="font-bold text-xs text-slate-800 truncate mb-1">{email.subject || '(No subject)'}</div>
              <div className="text-[10px] text-slate-500 truncate">{email.from || 'Unknown sender'}</div>
            </div>
          ))}
          {!loadingList && emails.length === 0 && (
            <div className="p-4 text-xs text-slate-400 italic">Your inbox is empty.</div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedEmail ? (
          <>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white shadow-sm">
              <div>
                <h2 className="text-lg font-bold text-slate-800">{selectedEmail.subject || '(No subject)'}</h2>
                <div className="text-xs text-slate-400 mt-1">{selectedEmail.from}</div>
              </div>
              <button
                onClick={handleDraftReply}
                disabled={drafting}
                className="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
              >
                <Zap size={14} className={drafting ? 'animate-pulse' : ''} />
                {drafting ? 'Drafting...' : 'Draft Reply'}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/20">
              {selectedDraft && (
                <div className="bg-indigo-600 text-white p-5 rounded-2xl text-xs leading-relaxed shadow-lg whitespace-pre-wrap">
                  <div className="font-bold mb-2 flex items-center gap-2">
                    <Zap size={14} /> Draft Reply
                  </div>
                  {selectedDraft}
                </div>
              )}

              <div className="flex flex-col items-start">
                <div className="text-[10px] text-slate-400 mb-1 px-1">{selectedEmail.from}</div>
                <div className="p-4 rounded-2xl text-sm max-w-[80%] shadow-sm bg-white text-slate-800 border border-slate-100 whitespace-pre-wrap">
                  {selectedEmail.body || selectedEmail.snippet || 'No email body available.'}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            {loadingList ? 'Loading inbox...' : 'Select an email.'}
          </div>
        )}
      </div>
    </div>
  );
}
