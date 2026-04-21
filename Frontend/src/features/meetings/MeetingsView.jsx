import React, { useEffect, useState } from 'react';
import { RefreshCw, Video, Zap } from 'lucide-react';
import meetingsApi from '../../api/meetings';
import { getErrorMessage } from '../../utils/api';

function formatMeetingTimestamp(value) {
  if (!value) {
    return { date: 'TBD', time: 'TBD', isPast: false };
  }

  const date = new Date(value);

  return {
    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    isPast: date.getTime() <= Date.now(),
  };
}

function formatSummary(summary) {
  if (!summary) {
    return '';
  }

  if (typeof summary === 'string') {
    return summary;
  }

  const sections = [];

  if (summary.summary) {
    sections.push(`Summary\n${summary.summary}`);
  }

  if (summary.keyDiscussions?.length) {
    sections.push(`Key Discussions\n${summary.keyDiscussions.map((item) => `- ${item}`).join('\n')}`);
  }

  if (summary.decisions?.length) {
    sections.push(`Decisions\n${summary.decisions.map((item) => `- ${item}`).join('\n')}`);
  }

  if (summary.actionItems?.length) {
    sections.push(
      `Action Items\n${summary.actionItems.map((item) => `- ${item.task}${item.assignedTo ? ` (${item.assignedTo})` : ''}${item.dueDate ? ` - due ${item.dueDate}` : ''}`).join('\n')}`,
    );
  }

  return sections.join('\n\n');
}

function normalizeMeeting(meeting) {
  const { date, time, isPast } = formatMeetingTimestamp(meeting.startTime);

  return {
    ...meeting,
    attendees: (meeting.participants || []).map((participant) => participant.email || participant.name),
    aiSummary: formatSummary(meeting.aiSummary) || null,
    date,
    status: isPast ? 'completed' : 'scheduled',
    time,
  };
}

export function MeetingsView({ notify }) {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadMeetings() {
      try {
        const response = await meetingsApi.listMeetings({ daysBack: 7, daysAhead: 30 });

        if (isMounted) {
          setMeetings((response.meetings || []).map(normalizeMeeting));
        }
      } catch (error) {
        if (isMounted) {
          notify(getErrorMessage(error, 'Unable to load meetings.'), 'warning');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadMeetings();

    return () => {
      isMounted = false;
    };
  }, [notify]);

  const handleSummarize = async (meeting) => {
    setGenerating(meeting.id);

    try {
      let transcript = '';
      let transcriptNotice = '';

      if (meeting.spaceId) {
        try {
          const transcriptResponse = await meetingsApi.getTranscript(meeting.id, meeting.spaceId);
          transcript = transcriptResponse.transcript?.rawText || '';
          transcriptNotice = transcriptResponse.transcript?.reason || '';
        } catch (error) {
          transcriptNotice = getErrorMessage(error, 'Transcript could not be loaded, so Synapse used the meeting details instead.');
        }
      } else {
        transcriptNotice = 'This meeting does not expose a Google Meet transcript, so Synapse used the calendar details instead.';
      }

      const response = await meetingsApi.summarizeMeeting(meeting.id, {
        meetingTitle: meeting.title,
        meetingContext: {
          attendees: meeting.attendees,
          description: meeting.description,
          endTime: meeting.endTime,
          meetLink: meeting.meetLink,
          participants: meeting.participants,
          startTime: meeting.startTime,
          title: meeting.title,
        },
        ...(transcript ? { transcript } : {}),
      });

      const nextSummary = formatSummary(response.summary);

      setMeetings((prev) =>
        prev.map((entry) => (
          entry.id === meeting.id
            ? { ...entry, aiSummary: nextSummary }
            : entry
        )),
      );

      if (response.transcriptSource === 'metadata') {
        notify(transcriptNotice || 'Transcript was unavailable, so the summary was generated from meeting details.', 'warning');
      } else {
        const taskCount = response.tasksCreated?.length || 0;
        notify(
          taskCount > 0
            ? `Meeting summary generated and ${taskCount} follow-up tasks were captured.`
            : 'Meeting summary generated successfully.',
          'success',
        );
      }
    } catch (error) {
      notify(getErrorMessage(error, 'Unable to summarize the meeting.'), 'warning');
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-3">
        <Video className="text-indigo-600" /> Meeting Intelligence
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {meetings.map((meeting) => (
          <div key={meeting.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
            <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  {meeting.date} • {meeting.time}
                </div>
                <h4 className="font-bold text-slate-800">{meeting.title}</h4>
              </div>
              <div className={`p-2 rounded-lg ${meeting.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                <Video size={18} />
              </div>
            </div>
            <div className="p-6">
              {meeting.aiSummary ? (
                <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl text-[11px] leading-relaxed text-indigo-900 whitespace-pre-wrap font-sans">
                  <div className="font-bold mb-2 flex items-center gap-1.5">
                    <Zap size={12} /> AI Summary
                  </div>
                  {meeting.aiSummary}
                </div>
              ) : (
                <div className="text-center py-6">
                  {meeting.status === 'completed' ? (
                    <button onClick={() => handleSummarize(meeting)} disabled={generating === meeting.id} className="bg-slate-900 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 mx-auto">
                      {generating === meeting.id ? <RefreshCw className="animate-spin" size={14} /> : <Zap size={14} />} Generate Summary
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-widest italic">Upcoming Session</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {!loading && meetings.length === 0 && (
          <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200 p-10 text-center text-sm text-slate-400">
            No meetings found for the selected window.
          </div>
        )}
      </div>
    </div>
  );
}
