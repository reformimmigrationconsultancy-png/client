import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
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
} from '@heroicons/react/24/outline';

const InstagramIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
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
    
    // Poll logs every 10 seconds for real-time simulation
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

  // Derive webhook tunnel/endpoint URL dynamically from current location
  const derivedWebhookUrl = `${window.location.origin}/webhook/facebook`;
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
                 tokenStatus?.message || 'No expiry info available'}
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

      {/* Actions */}
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
          Displays the last 20 Facebook/Instagram/WhatsApp webhook events received by this server. Keep this screen open to debug arrivals instantly!
        </div>

        <div className="space-y-2.5 max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
          {webhookLogs.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs font-semibold">
              No webhook events logged yet. Trigger a Meta Ads test lead to see it arrive here instantly.
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
                      ID: <span className="font-mono text-slate-300">{log.eventId || 'None'}</span> · {new Date(log.processedAt).toLocaleTimeString()}
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

      {/* Instructions Link */}
      <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
        <p className="text-xs font-bold text-blue-700 mb-2">💡 How to generate tokens & configure leads:</p>
        <ol className="text-xs text-blue-600 space-y-1 list-decimal list-inside font-medium">
          <li>Access the <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="underline">Meta Graph Explorer</a>.</li>
          <li>Choose your App and Page from the drop-downs.</li>
          <li>Select required scopes: <code className="bg-blue-100 px-1 rounded">pages_messaging, pages_read_engagement, pages_manage_metadata, leads_retrieval</code>.</li>
          <li>Generate a User Token, paste it above, and our system will upgrade it to a **Permanent Page Token**.</li>
        </ol>
      </div>
    </div>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [activeIntegration, setActiveIntegration] = useState(null);

  const integrations = [
    { 
      name: 'Facebook Messenger', 
      platform: 'facebook', 
      icon: GlobeAltIcon, 
      color: 'text-blue-600', 
      bgColor: 'bg-blue-50',
      description: 'Receive and reply to Facebook Page messages.',
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
    },
    { 
      name: 'Email (SMTP/IMAP)', 
      platform: 'email', 
      icon: EnvelopeIcon, 
      color: 'text-amber-600', 
      bgColor: 'bg-amber-50',
      description: 'Sync your professional email inbox.',
      hasPanel: false,
    }
  ];

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-5xl mx-auto flex-1 overflow-y-auto">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">System Settings</h2>
        <p className="text-slate-500 mt-1 text-xs md:text-sm">Manage your CRM preferences and platform integrations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
        <div className="col-span-1 md:border-r md:border-slate-200 pb-2 md:pb-0 md:pr-8 flex flex-row md:flex-col overflow-x-auto no-scrollbar gap-2 shrink-0">
           <button 
             onClick={() => { setActiveTab('profile'); setActiveIntegration(null); }}
             className={`shrink-0 md:w-full text-left p-3 rounded-xl font-medium flex items-center gap-3 transition-all ${activeTab === 'profile' ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'text-slate-600 hover:bg-slate-50'}`}
           >
              <UserCircleIcon className="w-5 h-5" /> Profile
           </button>
           <button 
             onClick={() => { setActiveTab('integrations'); setActiveIntegration(null); }}
             className={`shrink-0 md:w-full text-left p-3 rounded-xl font-medium flex items-center gap-3 transition-all ${activeTab === 'integrations' ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'text-slate-600 hover:bg-slate-50'}`}
           >
              <GlobeAltIcon className="w-5 h-5" /> Integrations
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
             <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-1">
                   <h3 className="text-xl font-bold text-slate-900">Account Information</h3>
                   <p className="text-sm text-slate-500">Update your personal details and account status.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                      <input type="text" defaultValue={user?.name} className="w-full bg-slate-50 border-transparent focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10 rounded-xl py-3 px-4 font-medium transition-all" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                      <input type="email" defaultValue={user?.email} className="w-full bg-slate-50 border-transparent focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10 rounded-xl py-3 px-4 font-medium transition-all" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">User Role</label>
                      <div className="w-full bg-slate-100 rounded-xl py-3 px-4 font-bold text-slate-600 capitalize cursor-not-allowed">
                        {user?.role}
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Account Status</label>
                      <div className="flex items-center gap-2 text-emerald-600 font-bold px-1">
                        <CheckCircleIcon className="w-5 h-5" />
                        Active &amp; Verified
                      </div>
                   </div>
                </div>

                <div className="pt-10 flex justify-end">
                  <button className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95">
                     Save Changes
                  </button>
                </div>
             </div>
           )}

           {activeTab === 'integrations' && !activeIntegration && (
             <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-1">
                   <h3 className="text-xl font-bold text-slate-900">Platform Connections</h3>
                   <p className="text-sm text-slate-500">Manage connections to external messaging and communication platforms.</p>
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
                               Manage Token
                             </button>
                           )}
                        </div>
                     </div>
                   ))}
                </div>
                
                <div className="bg-blue-600 p-6 rounded-2xl text-white flex items-center justify-between">
                   <div className="space-y-1">
                      <h4 className="font-bold">Need more integrations?</h4>
                      <p className="text-xs text-blue-100 font-medium">Request custom API connectors for your business needs.</p>
                   </div>
                   <button className="bg-white text-blue-600 px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm hover:bg-blue-50 transition-colors">
                      Contact Support
                   </button>
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
                   <h3 className="text-xl font-bold text-slate-900">Facebook Messenger</h3>
                   <p className="text-sm text-slate-500">Manage your Meta Access Token and monitor real-time sync</p>
                 </div>
               </div>
               <FacebookTokenPanel />
             </div>
           )}

           {(activeTab === 'security' || activeTab === 'personalization') && (
             <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
                <Cog6ToothIcon className="w-12 h-12 opacity-20 animate-spin-slow" />
                <p className="font-bold text-sm tracking-widest uppercase">Coming Soon</p>
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
