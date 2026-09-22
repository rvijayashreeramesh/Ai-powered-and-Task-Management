'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import { copilotService, GeminiModelStatus } from '@/services/copilot';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ShieldCheck, 
  Cpu, 
  KeyRound, 
  RefreshCw, 
  Layers, 
  Zap 
} from 'lucide-react';

export default function SettingsPage() {
  const [modelStatus, setModelStatus] = useState<GeminiModelStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [probeStatus, setProbeStatus] = useState<string | null>(null);
  const [testingProbe, setTestingProbe] = useState(false);
  const [probeDetails, setProbeDetails] = useState<{ provider?: string; model?: string; ping?: string } | null>(null);

  // API Key management
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isUpdatingKey, setIsUpdatingKey] = useState(false);
  const [keyUpdateMsg, setKeyUpdateMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Model switching
  const [isSwitchingModel, setIsSwitchingModel] = useState(false);

  const fetchModelStatus = async () => {
    setLoadingStatus(true);
    try {
      const status = await copilotService.getModelStatus();
      setModelStatus(status);
    } catch {
      // Fallback if not authenticated or error
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchModelStatus();
  }, []);

  const testGeminiConnection = async () => {
    setTestingProbe(true);
    setProbeStatus(null);
    try {
      const res = await copilotService.checkHealth();
      setProbeDetails(res);
      setProbeStatus('SUCCESS');
      // Refresh model status to capture any auto-switched model
      await fetchModelStatus();
    } catch (err: any) {
      setProbeStatus('ERROR');
      setProbeDetails({ ping: err.message || 'Health check failed' });
    } finally {
      setTestingProbe(false);
    }
  };

  const handleUpdateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;

    setIsUpdatingKey(true);
    setKeyUpdateMsg(null);
    try {
      const updated = await copilotService.updateApiKey(apiKeyInput.trim());
      setModelStatus(updated);
      setKeyUpdateMsg({
        type: 'success',
        text: `API key updated successfully! Active model auto-detected: ${updated.active_model}`,
      });
      setApiKeyInput('');
    } catch (err: any) {
      setKeyUpdateMsg({
        type: 'error',
        text: err.message || 'Failed to update API key. Please verify key format.',
      });
    } finally {
      setIsUpdatingKey(false);
    }
  };

  const handleSwitchModel = async (modelName: string) => {
    if (modelName === modelStatus?.active_model) return;
    setIsSwitchingModel(true);
    try {
      const updated = await copilotService.switchModel(modelName);
      setModelStatus(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to switch model');
    } finally {
      setIsSwitchingModel(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
      <ScrollReveal>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">System Settings</h1>
          <p className="text-slate-500 mt-1">Configure workspace AI parameters and inspect model auto-switching cascade.</p>
        </div>
      </ScrollReveal>

      {/* AI Intelligence Engine */}
      <ScrollReveal delay={100}>
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu size={20} className="text-violet-600" />
                <h2 className="text-lg font-bold text-slate-900">AI Intelligence Engine</h2>
              </div>
              <button
                onClick={fetchModelStatus}
                disabled={loadingStatus}
                title="Refresh Status"
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <RefreshCw size={16} className={loadingStatus ? 'animate-spin' : ''} />
              </button>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Google Gemini configuration with automatic failover and token-exhaustion model cascade.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status Highlight Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gradient-to-r from-violet-50/70 to-slate-50 rounded-2xl border border-violet-100 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-violet-600 text-white flex items-center justify-center font-bold shadow-md shadow-violet-200">
                  <Sparkles size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900 text-sm">Google Gemini AI Engine</p>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-100 text-violet-700 text-xs font-semibold rounded-full">
                      <Zap size={10} className="fill-violet-700" />
                      100% Fully Automated
                    </span>
                  </div>
                  <p className="text-xs font-mono text-violet-900 mt-0.5">
                    Currently Operating On: <span className="font-bold">{modelStatus?.active_model || 'gemini-3.8-flash'}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-semibold text-emerald-700">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span>Autonomous Failover Active</span>
                </div>
              </div>
            </div>

            {/* Model Cascade Pipeline */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers size={16} className="text-slate-600" />
                  <h3 className="text-sm font-semibold text-slate-900">Autonomous Model Cascade (Zero Manual Action Required)</h3>
                </div>
                <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Self-Healing Engine
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                All Gemini models run <strong>completely automatically</strong>. If token limits, daily quotas (429), 
                or high demand spikes occur on any model, the system autonomously transitions to the next working Gemini model 
                in milliseconds without any manual intervention.
              </p>
              
              <div className="flex flex-wrap gap-2 pt-1">
                {(modelStatus?.cascade_models || [
                  'gemini-3.8-flash',
                  'gemini-3.7-flash',
                  'gemini-3.6-flash',
                  'gemini-3.5-flash',
                  'gemini-3.5-flash-lite',
                  'gemini-2.5-flash',
                  'gemini-2.5-flash-lite',
                  'gemini-flash-latest',
                  'gemini-flash-lite-latest'
                ]).map((m, idx) => {
                  const isActive = m === modelStatus?.active_model;
                  const isExhausted = modelStatus?.exhausted_models?.includes(m);
                  return (
                    <button
                      key={m}
                      onClick={() => handleSwitchModel(m)}
                      disabled={isSwitchingModel}
                      className={`inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-lg border transition-all ${
                        isActive
                          ? 'bg-violet-600 text-white border-violet-600 shadow-sm font-bold scale-[1.02]'
                          : isExhausted
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-violet-300 hover:bg-violet-50/50'
                      }`}
                      title={isActive ? 'Active Primary Model' : isExhausted ? 'Quota Cooling Down' : `Switch to ${m}`}
                    >
                      <span className="opacity-60 text-[10px]">{idx + 1}.</span>
                      <span>{m}</span>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>}
                      {isExhausted && !isActive && <span className="text-[10px] text-amber-600 font-sans font-bold">Quota Full</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* API Key Token Configuration Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
              <div className="flex items-center gap-2">
                <KeyRound size={16} className="text-violet-600" />
                <h3 className="text-sm font-semibold text-slate-900">Gemini API Key Token</h3>
              </div>
              <p className="text-xs text-slate-500">
                Current token status: <span className="font-mono font-medium text-slate-700">{modelStatus?.masked_key || 'Stored on Server'}</span>. 
                Enter a new API key to update it and auto-verify working models.
              </p>

              <form onSubmit={handleUpdateApiKey} className="flex flex-col sm:flex-row gap-2 pt-1">
                <input
                  type="password"
                  placeholder="Paste new Gemini API key token..."
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-slate-50/50"
                />
                <Button
                  type="submit"
                  disabled={isUpdatingKey || !apiKeyInput.trim()}
                  className="gap-2 shrink-0 bg-violet-600 hover:bg-violet-700 text-white text-xs h-9"
                >
                  {isUpdatingKey ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
                  {isUpdatingKey ? 'Verifying Key...' : 'Save & Auto-Detect Model'}
                </Button>
              </form>

              {keyUpdateMsg && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    keyUpdateMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {keyUpdateMsg.type === 'success' ? (
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle size={14} className="text-red-600 shrink-0" />
                  )}
                  <span>{keyUpdateMsg.text}</span>
                </div>
              )}
            </div>

            {/* Live Health Probe */}
            <div className="pt-2">
              <h3 className="text-sm font-semibold text-slate-900 mb-1">Live Health & Failover Probe</h3>
              <p className="text-xs text-slate-500 mb-4">
                Execute a minimal test ping (`GEMINI_CONNECTION_OK`) to verify backend connectivity and test the auto-model cascade.
              </p>

              <Button
                variant="secondary"
                onClick={testGeminiConnection}
                disabled={testingProbe}
                className="gap-2 border-violet-200 text-violet-700 hover:bg-violet-50"
              >
                {testingProbe ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {testingProbe ? 'Testing Connection...' : 'Test Gemini Connection'}
              </Button>

              {probeStatus === 'SUCCESS' && (
                <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Connection Verified Successfully</p>
                    <p className="text-xs mt-0.5 font-medium">Provider: {probeDetails?.provider} | Responding Model: {probeDetails?.model}</p>
                    <p className="text-xs font-mono mt-1 text-emerald-900">Ping Result: {probeDetails?.ping}</p>
                  </div>
                </div>
              )}

              {probeStatus === 'ERROR' && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm flex items-start gap-3">
                  <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Probe Result</p>
                    <p className="text-xs mt-0.5">{probeDetails?.ping}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </ScrollReveal>

      {/* Security Details */}
      <ScrollReveal delay={150}>
        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck size={20} className="text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-900">Security & Architecture</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-slate-600 space-y-2">
              <p>✓ <strong>Backend Security:</strong> All Gemini API keys are strictly isolated on the backend server environment.</p>
              <p>✓ <strong>Automatic Failover:</strong> When token limits, daily free quotas, or transient server loads occur on a model, the engine automatically switches models.</p>
              <p>✓ <strong>Client Protection:</strong> Secrets are never exposed directly to browser clients.</p>
              <p>✓ <strong>Authentication:</strong> All AI copilot endpoints require active, verified JWT Bearer tokens.</p>
            </div>
          </CardContent>
        </Card>
      </ScrollReveal>
    </div>
  );
}

