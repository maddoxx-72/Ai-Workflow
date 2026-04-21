import React, { useEffect, useMemo, useState } from 'react';
import { GitMerge, MessageCircle, Settings2 } from 'lucide-react';
import webhooksApi from '../../api/webhooks';
import { getErrorMessage } from '../../utils/api';

function formatWebhookTimestamp(value) {
  if (!value) {
    return 'No events received yet';
  }

  return new Date(value).toLocaleString('en-US', {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  });
}

export function AutomationsView({ automations, notify }) {
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [webhookConfig, setWebhookConfig] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadWebhookConfig() {
      try {
        const response = await webhooksApi.getWebhookConfig();

        if (isMounted) {
          setWebhookConfig(response);
        }
      } catch (error) {
        if (isMounted) {
          notify(getErrorMessage(error, 'Unable to load Pingbix webhook settings.'), 'warning');
        }
      } finally {
        if (isMounted) {
          setLoadingConfig(false);
        }
      }
    }

    loadWebhookConfig();

    return () => {
      isMounted = false;
    };
  }, [notify]);

  const webhookUsage = useMemo(() => {
    const eventCount = webhookConfig?.eventCount || 0;
    return eventCount > 0 ? Math.min(eventCount * 8, 100) : 0;
  }, [webhookConfig?.eventCount]);

  const handleConfigureWebhook = async () => {
    if (!webhookConfig?.webhookUrl) {
      notify(
        webhookConfig?.warnings?.[0] || 'Add BACKEND_PUBLIC_URL or a public Pingbix webhook URL first.',
        'warning',
      );
      return;
    }

    try {
      await navigator.clipboard.writeText(webhookConfig.webhookUrl);
      notify(
        webhookConfig.configured
          ? 'Webhook URL copied. Paste it into the Pingbix dashboard if it is not already configured.'
          : webhookConfig.warnings?.[0] || 'Webhook URL copied, but it still needs a public callback address.',
        webhookConfig.configured ? 'success' : 'warning',
      );
    } catch {
      notify(
        webhookConfig.configured
          ? `Webhook URL ready: ${webhookConfig.webhookUrl}`
          : webhookConfig.warnings?.[0] || `Webhook URL ready: ${webhookConfig.webhookUrl}`,
        webhookConfig.configured ? 'success' : 'warning',
      );
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-3">
        <Settings2 className="text-slate-600" /> Pingbix Engine
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-bold text-slate-800 text-sm mb-4 uppercase tracking-widest border-b pb-2">Rule Stack</h3>
          {automations.map((rule) => (
            <div key={rule.id} className="p-5 bg-white rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${rule.active ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                  <GitMerge size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800">{rule.name}</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-mono">IF {rule.trigger} THEN {rule.action}</p>
                </div>
              </div>
              <div className={`w-10 h-5 rounded-full relative transition-all cursor-pointer ${rule.active ? 'bg-[#25D366]' : 'bg-slate-300'}`}>
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${rule.active ? 'right-1' : 'left-1'}`} />
              </div>
            </div>
          ))}
        </div>
        <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-2xl h-fit">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-[#25D366] p-2 rounded-xl text-white">
              <MessageCircle size={24} />
            </div>
            <div>
              <h3 className="font-bold">Pingbix WA Gateway</h3>
              <p className="text-xs text-slate-400">Enterprise Messaging v4.2</p>
            </div>
          </div>
          <div className="space-y-4 mb-8">
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <div className="text-[10px] font-bold text-slate-500 mb-1 uppercase">API Health</div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${webhookConfig?.configured ? 'bg-emerald-400 shadow-[0_0_10px_#10b981]' : 'bg-amber-400 shadow-[0_0_10px_#f59e0b]'}`} />
                <span className="text-sm font-bold">
                  {loadingConfig
                    ? 'Checking webhook state...'
                    : webhookConfig?.configured
                      ? 'Configured and ready'
                      : 'Webhook needs setup'}
                </span>
              </div>
            </div>
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <div className="text-[10px] font-bold text-slate-500 mb-1 uppercase">Webhook Events</div>
              <div className="w-full h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-[#25D366]" style={{ width: `${webhookUsage}%` }} />
              </div>
              <div className="text-[10px] text-slate-400 mt-2">
                {loadingConfig
                  ? 'Loading recent webhook activity...'
                  : `${webhookConfig?.eventCount || 0} events stored • last event ${formatWebhookTimestamp(webhookConfig?.lastEventAt)}`}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleConfigureWebhook}
            className="w-full py-4 bg-white text-slate-900 font-bold rounded-2xl hover:bg-slate-100 transition-all"
          >
            Configure API Webhooks
          </button>
        </div>
      </div>
    </div>
  );
}

