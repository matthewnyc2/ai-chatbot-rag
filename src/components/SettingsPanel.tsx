import { useState, useEffect } from 'react';
import {
  getSettings,
  updateSettings,
  checkOllamaStatus,
  OPENROUTER_MODELS,
} from '../lib/ollama';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  demoMode: boolean;
  onDemoModeChange: (enabled: boolean) => void;
}

export function SettingsPanel({ isOpen, onClose, demoMode, onDemoModeChange }: Props) {
  const [settings, setLocalSettings] = useState(getSettings());
  const [apiStatus, setApiStatus] = useState<{ running: boolean; models: string[] } | null>(null);
  const [checking, setChecking] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLocalSettings(getSettings());
      // Auto-check if there's already a key saved
      if (getSettings().apiKey) handleCheckStatus();
    }
  }, [isOpen]);

  const handleCheckStatus = async () => {
    setChecking(true);
    const status = await checkOllamaStatus();
    setApiStatus(status);
    setChecking(false);
    // If key is valid, auto-exit demo mode
    if (status.running) onDemoModeChange(false);
    else onDemoModeChange(true);
  };

  const handleSave = () => {
    updateSettings(settings);
    // Trigger status check after save so demo mode flips immediately
    handleCheckStatus();
    onClose();
  };

  if (!isOpen) return null;

  const keyMasked = settings.apiKey
    ? settings.apiKey.slice(0, 8) + '••••••••' + settings.apiKey.slice(-4)
    : '';

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="settings-close-btn" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="settings-body">

          {/* ── OpenRouter API ── */}
          <div className="settings-section">
            <h3>OpenRouter API</h3>

            {/* Status row */}
            <div className="status-row">
              <div className={`status-indicator ${apiStatus?.running ? 'status-online' : 'status-offline'}`} />
              <span>
                {checking
                  ? 'Checking key…'
                  : apiStatus?.running
                    ? 'API key valid — live mode active'
                    : settings.apiKey
                      ? 'Key set but not verified'
                      : 'No API key — demo mode'}
              </span>
              <button className="check-btn" onClick={handleCheckStatus} disabled={checking || !settings.apiKey}>
                {checking ? '…' : 'Test'}
              </button>
            </div>

            {/* API key input */}
            <label className="settings-field">
              <span>API Key</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type={showKey ? 'text' : 'password'}
                  value={settings.apiKey}
                  onChange={(e) => setLocalSettings({ ...settings, apiKey: e.target.value })}
                  placeholder="sk-or-v1-…"
                  style={{ flex: 1, fontFamily: 'monospace', fontSize: '13px' }}
                />
                <button
                  className="check-btn"
                  onClick={() => setShowKey((v) => !v)}
                  type="button"
                  style={{ padding: '4px 8px', fontSize: '12px' }}
                >
                  {showKey ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>

            <p className="settings-hint">
              Get a free key at{' '}
              <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer"
                 style={{ color: 'var(--accent, #60a5fa)', textDecoration: 'underline' }}>
                openrouter.ai/keys
              </a>
              . Free models in this list include Llama 3.1 8B, Mistral 7B, Qwen 3.6 Plus, and Step 3.5 Flash.
            </p>

            {/* Model selector */}
            <label className="settings-field">
              <span>Model</span>
              <select
                value={settings.model}
                onChange={(e) => setLocalSettings({ ...settings, model: e.target.value })}
              >
                {OPENROUTER_MODELS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </label>

            {/* Temperature */}
            <label className="settings-field">
              <span>Temperature: {settings.temperature.toFixed(1)}</span>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={settings.temperature}
                onChange={(e) =>
                  setLocalSettings({ ...settings, temperature: parseFloat(e.target.value) })
                }
              />
            </label>
          </div>

          {/* ── Demo Mode ── */}
          <div className="settings-section">
            <h3>Demo Mode</h3>
            <label className="toggle-field">
              <span>Use demo responses (no API key required)</span>
              <div
                className={`toggle ${demoMode ? 'toggle-on' : ''}`}
                onClick={() => onDemoModeChange(!demoMode)}
              >
                <div className="toggle-thumb" />
              </div>
            </label>
            <p className="settings-hint">
              {demoMode
                ? 'Demo mode ON — responses show document excerpts only. Add an API key above to get real AI answers.'
                : 'Demo mode OFF — using OpenRouter for real AI responses.'}
            </p>
          </div>

          {/* ── System Prompt ── */}
          <div className="settings-section">
            <h3>System Prompt</h3>
            <textarea
              className="system-prompt-input"
              value={settings.systemPrompt}
              onChange={(e) => setLocalSettings({ ...settings, systemPrompt: e.target.value })}
              rows={6}
            />
          </div>
        </div>

        <div className="settings-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>Save Settings</button>
        </div>
      </div>
    </div>
  );
}
