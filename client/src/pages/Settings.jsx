import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api, { BACKEND_URL } from '../utils/api';
import toast from 'react-hot-toast';
import { 
  Cog6ToothIcon, 
  ShieldCheckIcon, 
  UserCircleIcon, 
  AdjustmentsHorizontalIcon,
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ArrowPathIcon,
  KeyIcon,
  ClipboardDocumentIcon,
  EyeIcon,
  EyeSlashIcon,
  PaperAirplaneIcon,
  CodeBracketIcon,
  LockClosedIcon,
  CheckBadgeIcon,
  UserGroupIcon,
  UserPlusIcon,
  TrashIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';

const InstagramIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const GoogleIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
  </svg>
);

function TokenStatusBadge({ status, daysLeft, loading }) {
  if (loading) return (
    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-500">
      <ArrowPathIcon className="w-3 h-3 animate-spin" /> Checking...
    </span>
  );

  const configs = {
    valid: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500', label: daysLeft != null ? `Valid · ${daysLeft}d left` : 'Valid · Never Expires' },
    expiring_soon: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500', label: `Expiring in ${daysLeft}d` },
    expired: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500', label: 'Expired' },
    missing: { bg: 'bg-slate-100', text: 'text-slate-500', dot: 'bg-slate-400', label: 'Not Set' },
    error: { bg: 'bg-red-100', text: 'text-red-600', dot: 'bg-red-500', label: 'Error' },
  };

  const c = configs[status] || configs.missing;
  return (
    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${c.bg} ${c.text}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

function FacebookTokenPanel() {
  const [tokenStatus, setTokenStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [testingLead, setTestingLead] = useState(false);
  const [syncingHistorical, setSyncingHistorical] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showManual, setShowManual] = useState(false);
  
  // Webhook Monitor state
  const [webhookLogs, setWebhookLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [selectedPayload, setSelectedPayload] = useState(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings/facebook/token-status');
      setTokenStatus(res.data);
    } catch (err) {
      setTokenStatus({ status: 'error', message: err.response?.data?.message || err.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await api.get('/settings/facebook/webhook-logs');
      setWebhookLogs(res.data.logs || []);
    } catch (err) {
      console.error('Failed to fetch webhook logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => { 
    fetchStatus(); 
    fetchLogs();
    
    // Poll logs every 10 seconds for real-time feed
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    const tId = toast.loading('Upgrading and fetching Permanent Page Token...');
    try {
      const res = await api.post('/settings/facebook/refresh-token');
      toast.success(res.data.message, { id: tId });
      fetchStatus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Refresh failed', { id: tId });
    } finally {
      setRefreshing(false);
    }
  };

  const handleManualUpdate = async (e) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    setUpdating(true);
    const tId = toast.loading('Upgrading token to Permanent Page Access Token...');
    try {
      const res = await api.post('/settings/facebook/update-token', { token: manualToken });
      toast.success(res.data.message, { id: tId });
      setManualToken('');
      setShowManual(false);
      fetchStatus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed', { id: tId });
    } finally {
      setUpdating(false);
    }
  };

  const handleSubscribePage = async () => {
    setSubscribing(true);
    const tId = toast.loading('Subscribing Facebook Page to Lead Ads Webhooks...');
    try {
      const res = await api.post('/settings/facebook/subscribe-page');
      toast.success(res.data.message || 'Page subscribed to Webhooks!', { id: tId });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Subscription failed', { id: tId });
    } finally {
      setSubscribing(false);
    }
  };

  const handleSendTestLead = async () => {
    setTestingLead(true);
    const tId = toast.loading('Sending simulated Meta Lead Ad to CRM pipeline...');
    try {
      await api.post('/settings/test-lead', { source: 'facebook' });
      toast.success('🎉 Test Meta Lead sent! Check your Revenue Pipeline!', { id: tId });
      fetchLogs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Test lead failed', { id: tId });
    } finally {
      setTestingLead(false);
    }
  };

  const handleSyncHistorical = async () => {
    setSyncingHistorical(true);
    const tId = toast.loading('Fetching all historical leads from Facebook Leadgen Forms...');
    try {
      const res = await api.post('/clients/sync-meta-leads');
      const count = res.data.count || 0;
      if (count > 0) {
        toast.success(`🎉 Synced ${count} new leads from Meta!`, { id: tId });
      } else {
        toast.success('All leads from Meta forms are already up to date!', { id: tId });
      }
      fetchLogs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Historical sync failed', { id: tId });
    } finally {
      setSyncingHistorical(false);
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'url') {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
    toast.success('Copied to clipboard');
  };

  const isExpiredOrError = tokenStatus?.status === 'expired' || tokenStatus?.status === 'error' || tokenStatus?.status === 'missing';
  const isExpiringSoon = tokenStatus?.status === 'expiring_soon';
  const isPermanent = tokenStatus?.neverExpires === true || tokenStatus?.expiresAt === 'Never Expires';

  const derivedWebhookUrl = `${BACKEND_URL}/webhook/facebook`;
  const defaultVerifyToken = "manpreet";

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className={`rounded-2xl border p-5 transition-all ${
        isExpiredOrError ? 'border-red-200 bg-red-50/50' :
        isExpiringSoon ? 'border-amber-200 bg-amber-50/50' :
        'border-emerald-200 bg-emerald-50/50'
      }`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${
              isExpiredOrError ? 'bg-red-100 text-red-600' :
              isExpiringSoon ? 'bg-amber-100 text-amber-600' :
              'bg-emerald-100 text-emerald-600'
            }`}>
              {isExpiredOrError ? <XCircleIcon className="w-5 h-5" /> :
               isExpiringSoon ? <ExclamationTriangleIcon className="w-5 h-5" /> :
               <CheckCircleIcon className="w-5 h-5" />}
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Meta Page Access Token</h4>
              <p className="text-xs text-slate-500 mt-0.5 font-semibold">
                {loading ? 'Checking token status...' :
                 isPermanent ? 'Permanent Page Token (Never Expires)' :
                 tokenStatus?.expiresAt ? `Expires: ${new Date(tokenStatus.expiresAt).toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit' })}` :
                 tokenStatus?.message || 'Active Page Token'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <TokenStatusBadge status={tokenStatus?.neverExpires ? 'valid' : tokenStatus?.status} daysLeft={tokenStatus?.neverExpires ? null : tokenStatus?.daysLeft} loading={loading} />
            <button onClick={fetchStatus} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-all" title="Refresh status">
              <ArrowPathIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {tokenStatus?.scopes?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tokenStatus.scopes.map(scope => (
              <span key={scope} className="px-2 py-0.5 bg-white/70 text-slate-600 text-[10px] font-bold rounded-md border border-slate-200">
                {scope}
              </span>
            ))}
          </div>
        )}

        {isExpiredOrError && (
          <div className="mt-4 p-3 bg-white border border-red-200 rounded-xl text-xs text-red-700 font-medium leading-relaxed">
            <strong>⚠️ Token Setup Required:</strong> Your Facebook access token is invalid or expired. Real-time leads will not sync and Facebook messaging will be disabled until a token is set below.
          </div>
        )}
      </div>

      {/* Quick Diagnostic & Action Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={handleSubscribePage}
          disabled={subscribing}
          className="p-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <ArrowPathIcon className="w-4 h-4" />
          <span>{subscribing ? 'Subscribing...' : '1. Subscribe Page to Webhooks'}</span>
        </button>

        <button
          onClick={handleSyncHistorical}
          disabled={syncingHistorical}
          className="p-3.5 bg-white border border-slate-200 hover:border-blue-400 text-slate-700 hover:text-blue-600 rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <ArrowPathIcon className={`w-4 h-4 ${syncingHistorical ? 'animate-spin' : ''}`} />
          <span>{syncingHistorical ? 'Syncing...' : '2. Sync All Meta Leads'}</span>
        </button>

        <button
          onClick={handleSendTestLead}
          disabled={testingLead}
          className="p-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <PaperAirplaneIcon className="w-4 h-4" />
          <span>{testingLead ? 'Sending...' : '3. Send Test Lead'}</span>
        </button>
      </div>

      {/* Token Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Auto Refresh */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-center gap-2">
            <ArrowPathIcon className="w-4 h-4 text-blue-600" />
            <h5 className="font-bold text-slate-800 text-sm">Convert to Permanent Token</h5>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Exchange your current token for a <strong>Permanent Page Access Token</strong> that will never expire and completely prevents session time-outs.
          </p>
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm shadow-blue-200"
          >
            <ArrowPathIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Upgrading Token...' : 'Generate Permanent Token'}
          </button>
          <p className="text-[10px] text-slate-400 text-center">Requires a valid User Token in your environment</p>
        </div>

        {/* Manual Paste */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-center gap-2">
            <KeyIcon className="w-4 h-4 text-purple-600" />
            <h5 className="font-bold text-slate-800 text-sm">Paste New Token</h5>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Generate a fresh token from the <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-semibold">Meta Graph Explorer</a> and paste it here.
          </p>
          <button
            onClick={() => setShowManual(!showManual)}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-purple-600 text-white text-xs font-bold rounded-xl hover:bg-purple-700 transition-all active:scale-95 shadow-sm shadow-purple-200"
          >
            <ClipboardDocumentIcon className="w-4 h-4" />
            {showManual ? 'Cancel' : 'Paste Token'}
          </button>
          <p className="text-[10px] text-slate-400 text-center">Automatically resolves and saves as Permanent Page Token</p>
        </div>
      </div>

      {/* Manual Token Input */}
      {showManual && (
        <form onSubmit={handleManualUpdate} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">New Access Token</label>
          <div className="relative">
            <input
              type={showToken ? 'text' : 'password'}
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              placeholder="EAAuu4aS1G9s..."
              className="w-full bg-white border border-slate-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 rounded-xl py-2.5 px-4 pr-10 text-sm font-mono transition-all"
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showToken ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4 text-slate-400" />}
            </button>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!manualToken.trim() || updating}
              className="flex-1 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-95"
            >
              {updating ? 'Upgrading...' : 'Save & Make Permanent'}
            </button>
            <button
              type="button"
              onClick={() => { setShowManual(false); setManualToken(''); }}
              className="px-4 py-2.5 bg-white text-slate-600 text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* WEBHOOK TUNNEL AND CONFIG cockpit */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GlobeAltIcon className="w-5 h-5 text-indigo-600" />
            <h5 className="font-bold text-slate-800 text-sm">Meta Webhook Configuration</h5>
          </div>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
            Active Hook
          </span>
        </div>
        
        <p className="text-xs text-slate-500 leading-relaxed">
          Configure this Webhook URL and Verification Token in your Meta Developer Console under **Webhooks → Page → leadgen**.
        </p>

        <div className="space-y-3 pt-1">
          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Callback URL</label>
            <div className="flex gap-2">
              <input
                readOnly
                type="text"
                value={derivedWebhookUrl}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-mono select-all focus:outline-none"
              />
              <button
                onClick={() => copyToClipboard(derivedWebhookUrl, 'url')}
                className="px-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all"
              >
                {copiedUrl ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Verification Token</label>
            <div className="flex gap-2">
              <input
                readOnly
                type="text"
                value={defaultVerifyToken}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-mono select-all focus:outline-none"
              />
              <button
                onClick={() => copyToClipboard(defaultVerifyToken, 'token')}
                className="px-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all"
              >
                {copiedToken ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* WEBHOOK LIVE MONITOR PANEL */}
      <div className="p-5 bg-slate-900 rounded-2xl text-slate-300 space-y-4 shadow-xl border border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 absolute"></span>
            <h5 className="font-bold text-white text-sm ml-3">Webhook Real-Time Monitor</h5>
          </div>
          <button 
            onClick={fetchLogs} 
            disabled={logsLoading} 
            className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowPathIcon className={`w-3.5 h-3.5 ${logsLoading ? 'animate-spin' : ''}`} />
            Refresh Feed
          </button>
        </div>

        <div className="text-xs text-slate-400 leading-relaxed">
          Displays the last 20 Facebook/Instagram/WhatsApp/Google/Website webhook events received by this server.
        </div>

        <div className="space-y-2.5 max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
          {webhookLogs.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs font-semibold">
              No webhook events logged yet. Trigger a test lead above to see it arrive here instantly.
            </div>
          ) : (
            webhookLogs.map((log) => {
              let statusColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25';
              let statusLabel = 'Success';
              if (log.status === 'duplicate') {
                statusColor = 'bg-blue-500/10 text-blue-400 border-blue-500/25';
                statusLabel = 'Duplicate (Skipped)';
              } else if (log.status === 'failed') {
                statusColor = 'bg-red-500/10 text-red-400 border-red-500/25';
                statusLabel = 'Failed';
              } else if (log.status === 'ignored') {
                statusColor = 'bg-slate-500/10 text-slate-400 border-slate-500/25';
                statusLabel = 'Ignored';
              }

              return (
                <div key={log._id} className="p-3 bg-slate-800/60 hover:bg-slate-850 rounded-xl border border-slate-800 flex items-center justify-between gap-4 transition-all">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-slate-700 text-slate-200">
                        {log.platform}
                      </span>
                      <span className="text-[10px] font-bold text-slate-300">
                        {log.eventType === 'leadgen' ? 'Leadgen Form' : 'Direct Message'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border uppercase ${statusColor}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      ID: <span className="font-mono text-slate-300">{log.eventId || 'None'}</span> · {new Date(log.processedAt || log.createdAt).toLocaleTimeString()}
                    </div>
                    {log.errorMessage && (
                      <div className="text-[10px] text-red-400 font-semibold bg-red-950/20 px-2 py-0.5 rounded border border-red-900/30">
                        Error: {log.errorMessage}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedPayload(log.payload)}
                    className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-[10px] font-bold transition-all shrink-0"
                  >
                    View Payload
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* JSON Payload Detail Modal */}
      {selectedPayload && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-850">
              <h3 className="font-black text-white text-xs uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span> Raw Webhook Event Payload
              </h3>
              <button 
                onClick={() => setSelectedPayload(null)} 
                className="text-slate-400 hover:text-white px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-xs font-bold transition-colors"
              >
                Close
              </button>
            </div>
            <div className="p-6">
              <pre className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-[11px] font-mono text-emerald-400 overflow-auto max-h-[350px] custom-scrollbar select-all">
                {JSON.stringify(selectedPayload, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GoogleAdsPanel() {
  const [testing, setTesting] = useState(false);
  const webhookUrl = `${BACKEND_URL}/webhook/google`;
  const webhookKey = "manpreet_google_key";

  const handleTestGoogleLead = async () => {
    setTesting(true);
    const tId = toast.loading('Sending test lead to Google Ads webhook...');
    try {
      await api.post('/settings/test-lead', { source: 'google' });
      toast.success('🎉 Test Google Lead received! Check your Pipeline.', { id: tId });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Test failed', { id: tId });
    } finally {
      setTesting(false);
    }
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="space-y-6">
      <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-50 text-red-600">
              <GoogleIcon className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Google Ads Lead Form Webhook</h4>
              <p className="text-xs text-slate-500">Connect Google Ads Lead Form extensions directly to CRM</p>
            </div>
          </div>
          <button
            onClick={handleTestGoogleLead}
            disabled={testing}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-200 active:scale-95"
          >
            {testing ? 'Sending...' : 'Send Test Google Lead'}
          </button>
        </div>

        <div className="space-y-3 pt-2">
          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Webhook URL</label>
            <div className="flex gap-2">
              <input readOnly type="text" value={webhookUrl} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-mono select-all focus:outline-none" />
              <button onClick={() => copy(webhookUrl)} className="px-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all">Copy</button>
            </div>
          </div>

          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Google Key (Webhook Key)</label>
            <div className="flex gap-2">
              <input readOnly type="text" value={webhookKey} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-mono select-all focus:outline-none" />
              <button onClick={() => copy(webhookKey)} className="px-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all">Copy</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WebsiteLeadsPanel() {
  const [testing, setTesting] = useState(false);
  const webhookUrl = `${BACKEND_URL}/api/leads/public`;

  const handleTestWebsiteLead = async () => {
    setTesting(true);
    const tId = toast.loading('Sending test lead to Website Webhook...');
    try {
      await api.post('/settings/test-lead', { source: 'website' });
      toast.success('🎉 Test Website Lead received! Check your Pipeline.', { id: tId });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Test failed', { id: tId });
    } finally {
      setTesting(false);
    }
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const sampleSnippet = `// Send Lead to CRM from your Website Form (JavaScript / HTML)
fetch('${webhookUrl}', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fullName: 'John Doe',
    email: 'john@example.com',
    phone: '+1 (555) 234-5678',
    loanAmount: 650000,
    propertyValue: 850000,
    message: 'Interested in mortgage pre-approval',
    source: 'website'
  })
})
.then(res => res.json())
.then(data => console.log('Lead saved:', data));`;

  return (
    <div className="space-y-6">
      <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <CodeBracketIcon className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Website &amp; Webhook API Endpoint</h4>
              <p className="text-xs text-slate-500">Integrate WordPress, Webflow, Landing Pages, or Zapier</p>
            </div>
          </div>
          <button
            onClick={handleTestWebsiteLead}
            disabled={testing}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-200 active:scale-95"
          >
            {testing ? 'Sending...' : 'Send Test Website Lead'}
          </button>
        </div>

        <div className="space-y-3 pt-2">
          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Public Endpoint URL (CORS Enabled)</label>
            <div className="flex gap-2">
              <input readOnly type="text" value={webhookUrl} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-mono select-all focus:outline-none" />
              <button onClick={() => copy(webhookUrl)} className="px-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all">Copy</button>
            </div>
          </div>

          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Example Code Snippet</label>
            <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl text-[11px] font-mono overflow-auto max-h-[220px] select-all custom-scrollbar">
              {sampleSnippet}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Settings() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [activeIntegration, setActiveIntegration] = useState('facebook');

  // Profile Form State
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfileEmail(user.email || '');
    }
  }, [user]);

  // Password / Security Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const handleUpdateProfile = async (e) => {
    if (e) e.preventDefault();
    if (!profileName.trim() || !profileEmail.trim()) {
      toast.error('Name and email cannot be empty');
      return;
    }
    setSavingProfile(true);
    const tId = toast.loading('Saving account details...');
    try {
      const res = await api.put('/auth/update-profile', {
        name: profileName.trim(),
        email: profileEmail.trim()
      });
      if (res.data.success) {
        toast.success(res.data.message || 'Profile updated successfully!', { id: tId });
        if (updateUser) {
          updateUser(res.data.user);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update profile', { id: tId });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    if (e) e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }

    setUpdatingPassword(true);
    const tId = toast.loading('Updating password...');
    try {
      const res = await api.put('/auth/update-password', {
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim()
      });
      if (res.data.success) {
        toast.success(res.data.message || 'Password updated successfully!', { id: tId });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        if (updateUser && res.data.user) {
          updateUser(res.data.user, res.data.token);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update password', { id: tId });
    } finally {
      setUpdatingPassword(false);
    }
  };

  const PERMISSION_CONFIG = [
    { key: 'viewAllLeads', label: 'View All CRM Leads', desc: 'If unchecked, employee can ONLY see leads assigned to them.' },
    { key: 'editLeads', label: 'Edit & Update Leads', desc: 'Allows modifying client details, stages, and status updates.' },
    { key: 'deleteLeads', label: 'Delete Leads', desc: 'Allows permanently deleting leads from the pipeline.' },
    { key: 'exportLeads', label: 'Export Leads CSV', desc: 'Allows downloading lead contact lists to spreadsheet files.' },
    { key: 'viewFinancials', label: 'View Financial / Deal Values', desc: 'Displays revenue, fee values, and deal sizes.' },
    { key: 'manageFollowUps', label: 'Manage Follow-ups & Reminders', desc: 'Allows scheduling, snoozing, and logging client calls.' },
    { key: 'accessAutomations', label: 'Workflow Rules & Email Templates', desc: 'Allows viewing and configuring background automation rules.' },
    { key: 'accessSettings', label: 'Access System Settings', desc: 'Grants access to CRM configuration settings.' },
  ];

  // Team Management State
  const [teamList, setTeamList] = useState([]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const [isEditPermissionsModalOpen, setIsEditPermissionsModalOpen] = useState(false);
  const [isResetPassModalOpen, setIsResetPassModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // New Employee Form
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpPassword, setNewEmpPassword] = useState('');
  const [showNewEmpPassword, setShowNewEmpPassword] = useState(false);
  const [creatingEmployee, setCreatingEmployee] = useState(false);
  const [newEmpPermissions, setNewEmpPermissions] = useState({
    viewAllLeads: false,
    editLeads: true,
    deleteLeads: false,
    exportLeads: false,
    viewFinancials: false,
    manageFollowUps: true,
    accessAutomations: false,
    accessSettings: false,
  });

  // Edit Permissions
  const [editingPermissions, setEditingPermissions] = useState({});
  const [savingPermissions, setSavingPermissions] = useState(false);

  // Reset Password for Employee
  const [resetEmpPassword, setResetEmpPassword] = useState('');
  const [showResetEmpPassword, setShowResetEmpPassword] = useState(false);
  const [savingResetPass, setSavingResetPass] = useState(false);

  const fetchTeamMembers = async () => {
    if (user?.role !== 'admin') return;
    setLoadingTeam(true);
    try {
      const res = await api.get('/auth/users');
      if (res.data?.success) {
        setTeamList(res.data.users || []);
      }
    } catch (err) {
      console.error('Failed to fetch team members:', err);
    } finally {
      setLoadingTeam(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'team') {
      fetchTeamMembers();
    }
  }, [activeTab]);

  const handleCreateEmployee = async (e) => {
    if (e) e.preventDefault();
    if (!newEmpName.trim()) return toast.error('Employee name is required');
    if (!newEmpEmail.trim()) return toast.error('Employee email is required');
    if (!newEmpPassword.trim() || newEmpPassword.trim().length < 6) {
      return toast.error('Password must be at least 6 characters');
    }

    setCreatingEmployee(true);
    const tId = toast.loading('Creating employee account...');
    try {
      const res = await api.post('/auth/create-employee', {
        name: newEmpName.trim(),
        email: newEmpEmail.trim(),
        password: newEmpPassword.trim(),
        permissions: newEmpPermissions
      });
      if (res.data?.success) {
        toast.success(res.data.message || 'Employee created successfully!', { id: tId });
        setIsAddEmployeeModalOpen(false);
        setNewEmpName('');
        setNewEmpEmail('');
        setNewEmpPassword('');
        setNewEmpPermissions({
          viewAllLeads: false,
          editLeads: true,
          deleteLeads: false,
          exportLeads: false,
          viewFinancials: false,
          manageFollowUps: true,
          accessAutomations: false,
          accessSettings: false,
        });
        fetchTeamMembers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create employee', { id: tId });
    } finally {
      setCreatingEmployee(false);
    }
  };

  const handleOpenEditPermissions = (employee) => {
    setSelectedEmployee(employee);
    setEditingPermissions({
      viewAllLeads: false,
      editLeads: true,
      deleteLeads: false,
      exportLeads: false,
      viewFinancials: false,
      manageFollowUps: true,
      accessAutomations: false,
      accessSettings: false,
      ...(employee.permissions || {})
    });
    setIsEditPermissionsModalOpen(true);
  };

  const handleSavePermissions = async () => {
    if (!selectedEmployee) return;
    setSavingPermissions(true);
    const tId = toast.loading('Saving permissions...');
    try {
      const res = await api.put(`/auth/users/${selectedEmployee._id}`, {
        permissions: editingPermissions
      });
      if (res.data?.success) {
        toast.success(`Permissions updated for ${selectedEmployee.name}!`, { id: tId });
        setIsEditPermissionsModalOpen(false);
        fetchTeamMembers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save permissions', { id: tId });
    } finally {
      setSavingPermissions(false);
    }
  };

  const handleOpenResetPassword = (employee) => {
    setSelectedEmployee(employee);
    setResetEmpPassword('');
    setIsResetPassModalOpen(true);
  };

  const handleSaveResetPassword = async () => {
    if (!selectedEmployee) return;
    if (!resetEmpPassword.trim() || resetEmpPassword.trim().length < 6) {
      return toast.error('New password must be at least 6 characters');
    }
    setSavingResetPass(true);
    const tId = toast.loading('Updating employee password...');
    try {
      const res = await api.put(`/auth/users/${selectedEmployee._id}`, {
        password: resetEmpPassword.trim()
      });
      if (res.data?.success) {
        toast.success(`Password updated for ${selectedEmployee.name}! They can now log in with this new password.`, { id: tId });
        setIsResetPassModalOpen(false);
        setResetEmpPassword('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update employee password', { id: tId });
    } finally {
      setSavingResetPass(false);
    }
  };

  const handleDeleteEmployee = async (employee) => {
    if (!window.confirm(`Are you sure you want to permanently delete employee '${employee.name}'? All leads assigned to them will become unassigned.`)) {
      return;
    }
    const tId = toast.loading('Deleting employee...');
    try {
      const res = await api.delete(`/auth/users/${employee._id}`);
      if (res.data?.success) {
        toast.success(res.data.message || 'Employee deleted', { id: tId });
        fetchTeamMembers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete employee', { id: tId });
    }
  };

  const handleToggleActive = async (employee) => {
    const tId = toast.loading(employee.isActive ? 'Deactivating employee...' : 'Activating employee...');
    try {
      const res = await api.put(`/auth/users/${employee._id}`, {
        isActive: !employee.isActive
      });
      if (res.data?.success) {
        toast.success(`Employee ${employee.isActive ? 'deactivated' : 'activated'}`, { id: tId });
        fetchTeamMembers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update employee status', { id: tId });
    }
  };

  const integrations = [
    { 
      name: 'Facebook Lead Ads & Messenger', 
      platform: 'facebook', 
      icon: GlobeAltIcon, 
      color: 'text-blue-600', 
      bgColor: 'bg-blue-50',
      description: 'Real-time Facebook Page & Instagram Lead Ads and Chat.',
      hasPanel: true,
    },
    { 
      name: 'Google Ads Webhook', 
      platform: 'google', 
      icon: GoogleIcon, 
      color: 'text-red-600', 
      bgColor: 'bg-red-50',
      description: 'Receive Google Ads lead form extensions instantly.',
      hasPanel: true,
    },
    { 
      name: 'Website & Custom Forms API', 
      platform: 'website', 
      icon: CodeBracketIcon, 
      color: 'text-indigo-600', 
      bgColor: 'bg-indigo-50',
      description: 'Connect WordPress, Webflow, landing pages, or Zapier webhooks.',
      hasPanel: true,
    },
    { 
      name: 'Instagram Direct', 
      platform: 'instagram', 
      icon: InstagramIcon, 
      color: 'text-pink-600', 
      bgColor: 'bg-pink-50',
      description: 'Manage Instagram Business account direct messages.',
      hasPanel: false,
    },
    { 
      name: 'WhatsApp Business', 
      platform: 'whatsapp', 
      icon: DevicePhoneMobileIcon, 
      color: 'text-emerald-600', 
      bgColor: 'bg-emerald-50',
      description: 'Connect your WhatsApp Business API for official messaging.',
      hasPanel: false,
    }
  ];

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-5xl mx-auto flex-1 overflow-y-auto">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">System Settings</h2>
        <p className="text-slate-500 mt-1 text-xs md:text-sm">Manage your CRM preferences and platform lead integrations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
        <div className="col-span-1 md:border-r md:border-slate-200 pb-2 md:pb-0 md:pr-8 flex flex-row md:flex-col overflow-x-auto no-scrollbar gap-2 shrink-0">
           {user?.role === 'admin' && (
             <button 
               onClick={() => { setActiveTab('team'); setActiveIntegration(null); }}
               className={`shrink-0 md:w-full text-left p-3 rounded-xl font-medium flex items-center gap-3 transition-all ${activeTab === 'team' ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'text-slate-600 hover:bg-slate-50'}`}
             >
                <UserGroupIcon className="w-5 h-5" /> Team &amp; Staff
             </button>
           )}
           <button 
             onClick={() => { setActiveTab('integrations'); setActiveIntegration('facebook'); }}
             className={`shrink-0 md:w-full text-left p-3 rounded-xl font-medium flex items-center gap-3 transition-all ${activeTab === 'integrations' ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'text-slate-600 hover:bg-slate-50'}`}
           >
              <GlobeAltIcon className="w-5 h-5" /> Integrations
           </button>
           <button 
             onClick={() => { setActiveTab('profile'); setActiveIntegration(null); }}
             className={`shrink-0 md:w-full text-left p-3 rounded-xl font-medium flex items-center gap-3 transition-all ${activeTab === 'profile' ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'text-slate-600 hover:bg-slate-50'}`}
           >
              <UserCircleIcon className="w-5 h-5" /> Profile
           </button>
           <button 
             onClick={() => { setActiveTab('security'); setActiveIntegration(null); }}
             className={`shrink-0 md:w-full text-left p-3 rounded-xl font-medium flex items-center gap-3 transition-all ${activeTab === 'security' ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'text-slate-600 hover:bg-slate-50'}`}
           >
              <ShieldCheckIcon className="w-5 h-5" /> Security
           </button>
           <button 
             onClick={() => { setActiveTab('personalization'); setActiveIntegration(null); }}
             className={`shrink-0 md:w-full text-left p-3 rounded-xl font-medium flex items-center gap-3 transition-all ${activeTab === 'personalization' ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'text-slate-600 hover:bg-slate-50'}`}
           >
              <AdjustmentsHorizontalIcon className="w-5 h-5" /> Appearance
           </button>
        </div>

        <div className="col-span-1 md:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-8 min-h-[500px]">
           {activeTab === 'profile' && (
             <form onSubmit={handleUpdateProfile} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-1">
                   <h3 className="text-xl font-bold text-slate-900">Account Information</h3>
                   <p className="text-sm text-slate-500">Update your personal details and account status.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                      <input 
                        type="text" 
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        placeholder="Admin Full Name"
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 rounded-xl py-3 px-4 font-medium transition-all text-slate-800 text-sm" 
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                      <input 
                        type="email" 
                        value={profileEmail}
                        onChange={(e) => setProfileEmail(e.target.value)}
                        placeholder="admin@crm.com"
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 rounded-xl py-3 px-4 font-medium transition-all text-slate-800 text-sm" 
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">User Role</label>
                      <div className="w-full bg-slate-100/90 rounded-xl py-3 px-4 font-bold text-slate-600 capitalize cursor-not-allowed border border-slate-200/50 text-sm">
                        {user?.role || 'Admin'}
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Account Status</label>
                      <div className="flex items-center gap-2 text-emerald-600 font-bold px-1 py-2.5 text-sm">
                        <CheckCircleIcon className="w-5 h-5" />
                        Active &amp; Verified Administrator
                      </div>
                   </div>
                </div>

                <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <ShieldCheckIcon className="w-5 h-5 text-blue-600 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">Want to customize your login password?</p>
                      <p className="text-[11px] text-slate-500">You can set your own personalized password anytime from the Security tab.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('security')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline shrink-0"
                  >
                    Go to Security &rarr;
                  </button>
                </div>

                <div className="pt-2 flex justify-end">
                  <button 
                    type="submit"
                    disabled={savingProfile}
                    className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-50"
                  >
                     {savingProfile ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
             </form>
           )}

           {activeTab === 'integrations' && !activeIntegration && (
             <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-1">
                   <h3 className="text-xl font-bold text-slate-900">Lead &amp; Platform Connections</h3>
                   <p className="text-sm text-slate-500">Manage connections to external lead generation platforms and webhooks.</p>
                </div>

                <div className="grid grid-cols-1 gap-4 pt-4">
                   {integrations.map((int) => (
                     <div key={int.platform} className="group flex items-center justify-between p-5 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                        <div className="flex items-center gap-5">
                           <div className={`p-3 rounded-xl ${int.bgColor} ${int.color} group-hover:scale-110 transition-transform`}>
                              <int.icon className="w-6 h-6" />
                           </div>
                           <div>
                              <h4 className="font-bold text-slate-800">{int.name}</h4>
                              <p className="text-xs text-slate-500 font-medium">{int.description}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-3">
                           {int.hasPanel && (
                             <button
                               onClick={() => setActiveIntegration(int.platform)}
                               className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-lg hover:bg-blue-50 border border-blue-200 transition-all"
                             >
                               <KeyIcon className="w-3.5 h-3.5" />
                               Configure &amp; Test
                             </button>
                           )}
                        </div>
                     </div>
                   ))}
                </div>
             </div>
           )}

           {activeTab === 'integrations' && activeIntegration === 'facebook' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
               <div className="flex items-center gap-3">
                 <button
                   onClick={() => setActiveIntegration(null)}
                   className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all font-bold text-lg"
                 >
                   &larr;
                 </button>
                 <div>
                   <h3 className="text-xl font-bold text-slate-900">Facebook &amp; Meta Lead Ads</h3>
                   <p className="text-sm text-slate-500">Manage your Meta Access Token, Webhook subscription, and monitor real-time lead sync</p>
                 </div>
               </div>
               <FacebookTokenPanel />
             </div>
           )}

           {activeTab === 'integrations' && activeIntegration === 'google' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
               <div className="flex items-center gap-3">
                 <button
                   onClick={() => setActiveIntegration(null)}
                   className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all font-bold text-lg"
                 >
                   &larr;
                 </button>
                 <div>
                   <h3 className="text-xl font-bold text-slate-900">Google Ads Webhook</h3>
                   <p className="text-sm text-slate-500">Receive leads from Google Ads Lead Form extensions</p>
                 </div>
               </div>
               <GoogleAdsPanel />
             </div>
           )}

           {activeTab === 'integrations' && activeIntegration === 'website' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
               <div className="flex items-center gap-3">
                 <button
                   onClick={() => setActiveIntegration(null)}
                   className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all font-bold text-lg"
                 >
                   &larr;
                 </button>
                 <div>
                   <h3 className="text-xl font-bold text-slate-900">Website &amp; Custom Form API</h3>
                   <p className="text-sm text-slate-500">Embed leads from WordPress, Webflow, landing pages, or Zapier</p>
                 </div>
               </div>
               <WebsiteLeadsPanel />
             </div>
           )}

           {activeTab === 'security' && (
             <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-slate-900">Security &amp; Login Password</h3>
                  <p className="text-sm text-slate-500">
                    Set and customize your admin login password according to your choice.
                  </p>
                </div>

                {/* Password Change Form Card */}
                <form onSubmit={handleUpdatePassword} className="space-y-6 pt-1">
                  <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-5">
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-200/70">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                        <LockClosedIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Change Admin Password</h4>
                        <p className="text-xs text-slate-500">Enter your new desired password below to replace the default credentials.</p>
                      </div>
                    </div>

                    {/* Current Password Field */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                          Current Password
                        </label>
                        <span className="text-[11px] text-slate-400 font-medium">Default was 123456</span>
                      </div>
                      <div className="relative">
                        <input
                          type={showCurrentPass ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter current password (or default: 123456)"
                          className="w-full bg-white border border-slate-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 rounded-xl py-3 pl-4 pr-11 text-sm font-medium transition-all text-slate-800"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPass(!showCurrentPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                          tabIndex="-1"
                        >
                          {showCurrentPass ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* New Password Field */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                          New Password *
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPass ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password (min. 6 characters)"
                            required
                            minLength={6}
                            className="w-full bg-white border border-slate-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 rounded-xl py-3 pl-4 pr-11 text-sm font-medium transition-all text-slate-800"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPass(!showNewPass)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                            tabIndex="-1"
                          >
                            {showNewPass ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                          </button>
                        </div>
                        {newPassword && newPassword.length < 6 && (
                          <p className="text-[11px] text-amber-600 font-semibold">
                            ⚠️ Password must be at least 6 characters long ({newPassword.length}/6)
                          </p>
                        )}
                      </div>

                      {/* Confirm New Password Field */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                          Confirm New Password *
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPass ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter new password"
                            required
                            className={`w-full bg-white border rounded-xl py-3 pl-4 pr-11 text-sm font-medium transition-all text-slate-800 ${
                              confirmPassword && confirmPassword !== newPassword
                                ? 'border-rose-300 focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10'
                                : confirmPassword && confirmPassword === newPassword
                                ? 'border-emerald-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10'
                                : 'border-slate-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPass(!showConfirmPass)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                            tabIndex="-1"
                          >
                            {showConfirmPass ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                          </button>
                        </div>
                        {confirmPassword && confirmPassword !== newPassword && (
                          <p className="text-[11px] text-rose-600 font-semibold">
                            ✕ Passwords do not match
                          </p>
                        )}
                        {confirmPassword && confirmPassword === newPassword && (
                          <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                            ✓ Passwords match
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={updatingPassword || !newPassword || newPassword.length < 6 || newPassword !== confirmPassword}
                        className="bg-blue-600 text-white px-7 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 shadow-md shadow-blue-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <LockClosedIcon className="w-4 h-4" />
                        {updatingPassword ? 'Updating Password...' : 'Update Login Password'}
                      </button>
                    </div>
                  </div>
                </form>

                {/* Account Security Information Card */}
                <div className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-2xs space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                      <CheckBadgeIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Active Login Credentials</h4>
                      <p className="text-xs text-slate-500">Your current administrator login details.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Login Email</p>
                      <p className="text-xs font-bold text-slate-800 truncate mt-0.5">{user?.email || 'admin@crm.com'}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Account Type</p>
                      <p className="text-xs font-bold text-slate-800 capitalize mt-0.5">{user?.role || 'Administrator'}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Session Status</p>
                      <p className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 mt-0.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Active &amp; Secured
                      </p>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    💡 <strong>Tip:</strong> Once you update your password, use your email (<strong>{user?.email || 'admin@crm.com'}</strong>) and your new password to log in next time.
                  </p>
                </div>
             </div>
           )}

           {activeTab === 'team' && user?.role === 'admin' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Header & Add Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Employee &amp; Team Management</h3>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Create staff accounts, set login passwords, and grant specific dashboard permissions.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAddEmployeeModalOpen(true)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all shrink-0 hover:-translate-y-0.5 cursor-pointer"
                  >
                    <UserPlusIcon className="w-4 h-4" />
                    <span>+ Add Employee</span>
                  </button>
                </div>

                {/* Team Stats Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Accounts</p>
                    <p className="text-2xl font-black text-slate-900 mt-1">{teamList.length}</p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-200/80 bg-blue-50/50">
                    <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Staff Employees</p>
                    <p className="text-2xl font-black text-blue-700 mt-1">
                      {teamList.filter(u => u.role === 'staff').length}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-200/80 bg-emerald-50/50">
                    <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Active Accounts</p>
                    <p className="text-2xl font-black text-emerald-700 mt-1">
                      {teamList.filter(u => u.isActive !== false).length}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-200/80 bg-purple-50/50">
                    <p className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Assigned Leads</p>
                    <p className="text-2xl font-black text-purple-700 mt-1">
                      {teamList.reduce((acc, u) => acc + (u.assignedLeadCount || 0), 0)}
                    </p>
                  </div>
                </div>

                {/* Team Members List */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                  {loadingTeam ? (
                    <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                      <ArrowPathIcon className="w-6 h-6 animate-spin text-indigo-600" />
                      <span className="text-sm font-semibold">Loading team members...</span>
                    </div>
                  ) : teamList.length === 0 ? (
                    <div className="py-16 text-center">
                      <UserGroupIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-600 font-semibold text-sm">No employees created yet.</p>
                      <button
                        onClick={() => setIsAddEmployeeModalOpen(true)}
                        className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                      >
                        + Create First Employee
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                          <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                            <th className="py-3 px-4">Employee</th>
                            <th className="py-3 px-4">Role</th>
                            <th className="py-3 px-4">Assigned Leads</th>
                            <th className="py-3 px-4">Dashboard Permissions</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-[13px]">
                          {teamList.map((emp) => {
                            const isEmpAdmin = emp.role === 'admin';
                            const isSelf = String(emp._id) === String(user?._id);
                            const perms = emp.permissions || {};

                            return (
                              <tr key={emp._id} className="hover:bg-slate-50/60 transition-colors">
                                {/* Employee Info */}
                                <td className="py-3.5 px-4 whitespace-nowrap">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                                      {emp.name ? emp.name.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-900 truncate">{emp.name}</span>
                                        {isSelf && (
                                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                                            You
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-xs text-slate-400 font-medium truncate">{emp.email}</span>
                                    </div>
                                  </div>
                                </td>

                                {/* Role */}
                                <td className="py-3.5 px-4 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                                    isEmpAdmin ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                  }`}>
                                    {emp.role}
                                  </span>
                                </td>

                                {/* Assigned Leads */}
                                <td className="py-3.5 px-4 whitespace-nowrap">
                                  <span className="font-bold text-slate-800">
                                    {emp.assignedLeadCount || 0} leads
                                  </span>
                                </td>

                                {/* Permissions Preview */}
                                <td className="py-3.5 px-4 max-w-xs">
                                  {isEmpAdmin ? (
                                    <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                                      Full Access (Administrator)
                                    </span>
                                  ) : (
                                    <div className="flex flex-wrap gap-1">
                                      <span className={`text-[11px] px-2 py-0.5 rounded font-semibold ${
                                        perms.viewAllLeads 
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                                      }`}>
                                        {perms.viewAllLeads ? '👁️ All Leads' : '🔒 Assigned Only'}
                                      </span>
                                      {perms.editLeads && (
                                        <span className="text-[11px] px-1.5 py-0.5 rounded font-semibold bg-slate-100 text-slate-700">
                                          ✏️ Edit
                                        </span>
                                      )}
                                      {perms.deleteLeads && (
                                        <span className="text-[11px] px-1.5 py-0.5 rounded font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                          🗑️ Delete
                                        </span>
                                      )}
                                      {perms.exportLeads && (
                                        <span className="text-[11px] px-1.5 py-0.5 rounded font-semibold bg-indigo-50 text-indigo-700">
                                          📥 Export
                                        </span>
                                      )}
                                      {perms.viewFinancials && (
                                        <span className="text-[11px] px-1.5 py-0.5 rounded font-semibold bg-green-50 text-green-700">
                                          💰 Financials
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </td>

                                {/* Status */}
                                <td className="py-3.5 px-4 whitespace-nowrap">
                                  <button
                                    onClick={() => !isSelf && handleToggleActive(emp)}
                                    disabled={isSelf}
                                    title={isSelf ? 'Cannot deactivate yourself' : 'Click to toggle status'}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                                      emp.isActive !== false
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                        : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                                    } ${isSelf ? 'cursor-default' : 'cursor-pointer'}`}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${emp.isActive !== false ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                    {emp.isActive !== false ? 'Active' : 'Disabled'}
                                  </button>
                                </td>

                                {/* Actions */}
                                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {!isEmpAdmin && (
                                      <button
                                        onClick={() => handleOpenEditPermissions(emp)}
                                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-slate-200 hover:border-indigo-200 transition-all cursor-pointer"
                                        title="Edit Permissions"
                                      >
                                        <ShieldCheckIcon className="w-4 h-4" />
                                      </button>
                                    )}

                                    <button
                                      onClick={() => handleOpenResetPassword(emp)}
                                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-slate-200 hover:border-blue-200 transition-all cursor-pointer"
                                      title="Reset Employee Password"
                                    >
                                      <KeyIcon className="w-4 h-4" />
                                    </button>

                                    {!isSelf && (
                                      <button
                                        onClick={() => handleDeleteEmployee(emp)}
                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 hover:border-rose-200 transition-all cursor-pointer"
                                        title="Delete Employee Account"
                                      >
                                        <TrashIcon className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* MODAL 1: ADD EMPLOYEE */}
                {isAddEmployeeModalOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
                    <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar border border-slate-200">
                      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <UserPlusIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-slate-900">Create Employee Account</h3>
                            <p className="text-xs text-slate-500">Set login credentials and choose dashboard permissions.</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setIsAddEmployeeModalOpen(false)}
                          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                        >
                          <XCircleIcon className="w-5 h-5" />
                        </button>
                      </div>

                      <form onSubmit={handleCreateEmployee} className="space-y-4 mt-5">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Rahul Sharma"
                            value={newEmpName}
                            onChange={(e) => setNewEmpName(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Work Email Address (For Login) *
                          </label>
                          <input
                            type="email"
                            required
                            placeholder="e.g. rahul@reform.com"
                            value={newEmpEmail}
                            onChange={(e) => setNewEmpEmail(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Login Password (Given by Admin) *
                          </label>
                          <div className="relative">
                            <input
                              type={showNewEmpPassword ? 'text' : 'password'}
                              required
                              minLength={6}
                              placeholder="Set employee password (e.g. Rahul@123)"
                              value={newEmpPassword}
                              onChange={(e) => setNewEmpPassword(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewEmpPassword(!showNewEmpPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              {showNewEmpPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Admin will share this email &amp; password with employee to log in.
                          </p>
                        </div>

                        {/* Permissions Grid */}
                        <div className="pt-2 border-t border-slate-100">
                          <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2.5">
                            Select Permissions for Employee Dashboard
                          </label>
                          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                            {PERMISSION_CONFIG.map((p) => {
                              const checked = Boolean(newEmpPermissions[p.key]);
                              return (
                                <label
                                  key={p.key}
                                  className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                                    checked 
                                      ? 'bg-indigo-50/50 border-indigo-200' 
                                      : 'bg-slate-50/50 border-slate-200 hover:bg-slate-50'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => setNewEmpPermissions({
                                      ...newEmpPermissions,
                                      [p.key]: e.target.checked
                                    })}
                                    className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                  />
                                  <div className="flex flex-col text-left">
                                    <span className="text-[13px] font-bold text-slate-900 leading-snug">
                                      {p.label}
                                    </span>
                                    <span className="text-[11px] text-slate-500 leading-snug mt-0.5">
                                      {p.desc}
                                    </span>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setIsAddEmployeeModalOpen(false)}
                            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={creatingEmployee}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all disabled:opacity-50 cursor-pointer"
                          >
                            {creatingEmployee && <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />}
                            <span>{creatingEmployee ? 'Creating Account...' : 'Create Employee Account'}</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* MODAL 2: EDIT PERMISSIONS */}
                {isEditPermissionsModalOpen && selectedEmployee && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
                    <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar border border-slate-200">
                      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <div>
                          <h3 className="text-base font-bold text-slate-900">
                            Edit Permissions: {selectedEmployee.name}
                          </h3>
                          <p className="text-xs text-slate-500">
                            Control which features and leads this employee can see.
                          </p>
                        </div>
                        <button 
                          onClick={() => setIsEditPermissionsModalOpen(false)}
                          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                        >
                          <XCircleIcon className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="space-y-2.5 my-5 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                        {PERMISSION_CONFIG.map((p) => {
                          const checked = Boolean(editingPermissions[p.key]);
                          return (
                            <label
                              key={p.key}
                              className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                                checked 
                                  ? 'bg-indigo-50/50 border-indigo-200' 
                                  : 'bg-slate-50/50 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => setEditingPermissions({
                                  ...editingPermissions,
                                  [p.key]: e.target.checked
                                })}
                                className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              />
                              <div className="flex flex-col text-left">
                                <span className="text-[13px] font-bold text-slate-900 leading-snug">
                                  {p.label}
                                </span>
                                <span className="text-[11px] text-slate-500 leading-snug mt-0.5">
                                  {p.desc}
                                </span>
                              </div>
                            </label>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setIsEditPermissionsModalOpen(false)}
                          className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={savingPermissions}
                          onClick={handleSavePermissions}
                          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {savingPermissions && <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />}
                          <span>{savingPermissions ? 'Saving...' : 'Save Permissions'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* MODAL 3: RESET PASSWORD FOR EMPLOYEE */}
                {isResetPassModalOpen && selectedEmployee && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
                      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <KeyIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-slate-900">Reset Employee Password</h3>
                            <p className="text-xs text-slate-500">Set a new password for {selectedEmployee.name}.</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setIsResetPassModalOpen(false)}
                          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                        >
                          <XCircleIcon className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="space-y-4 my-5">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            New Password (Set by Admin) *
                          </label>
                          <div className="relative">
                            <input
                              type={showResetEmpPassword ? 'text' : 'password'}
                              required
                              minLength={6}
                              placeholder="Enter new employee password"
                              value={resetEmpPassword}
                              onChange={(e) => setResetEmpPassword(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowResetEmpPassword(!showResetEmpPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              {showResetEmpPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">
                            After updating, share this new password with the employee so they can log in.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setIsResetPassModalOpen(false)}
                          className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={savingResetPass}
                          onClick={handleSaveResetPassword}
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-blue-200 transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {savingResetPass && <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />}
                          <span>{savingResetPass ? 'Updating...' : 'Set New Password'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
           )}


           {activeTab === 'personalization' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-slate-900">Appearance &amp; Display</h3>
                  <p className="text-sm text-slate-500">Customize visual theme and typography preferences.</p>
                </div>

                <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-800">Interface Theme</p>
                      <p className="text-xs text-slate-500">Clean Commercial Light Mode (Active)</p>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
                      Light Mode
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-200/70">
                    <div>
                      <p className="text-sm font-bold text-slate-800">Typography Scale</p>
                      <p className="text-xs text-slate-500">Plus Jakarta Sans &amp; Inter Executive Scale</p>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-700 rounded-full">
                      Optimized
                    </span>
                  </div>
                </div>
             </div>
           )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}} />
    </div>
  );
}
