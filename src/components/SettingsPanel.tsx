import { useState, useEffect } from 'react';
import { getSettings, updateSettings, checkOllamaStatus } from '../lib/ollama';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  demoMode: boolean;
  onDemoModeChange: (enabled: boolean) => void;
}

export function SettingsPanel({ isOpen, onClose, demoMode, onDemoModeChange }: Props) {
  const [settings, setLocalSettings] = useState(getSettings());
  const [ollamaStatus, setOllamaStatus] = useState<{
    running: boolean;
    models: string[];
  } | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (isOpen) {
      handleCheckStatus();
    }
  }, [isOpen]);

  const handleCheckStatus = async () => {
    setChecking(true);
    const status = await checkOllamaStatus();
    setOllamaStatus(status);
    setChecking(false);

    if (!status.running) {
      onDemoModeChange(true);
    }
  };

  const handleSave = () => {
    updateSettings(settings);
    onClose();
  };

  if (!isOpen) return null;

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
          {/* Ollama Connection */}
          <div className="settings-section">
            <h3>Ollama Connection</h3>
            <div className="status-row">
              <div className={`status-indicator ${ollamaStatus?.running ? 'status-online' : 'status-offline'}`} />
              <span>
                {checking
                  ? 'Checking...'
                  : ollamaStatus?.running
                    ? `Connected (${ollamaStatus.models.length} models)`
                    : 'Not connected'}
              </span>
              <button className="check-btn" onClick={handleCheckStatus} disabled={checking}>
                Refresh
              </button>
            </div>

            <label className="settings-field">
              <span>Base URL</span>
              <input
                type="text"
                value={settings.baseUrl}
                onChange={(e) => setLocalSettings({ ...settings, baseUrl: e.target.value })}
                placeholder="http://localhost:11434"
              />
            </label>

            <label className="settings-field">
              <span>Model</span>
              {ollamaStatus?.models && ollamaStatus.models.length > 0 ? (
                <select
                  value={settings.model}
                  onChange={(e) => setLocalSettings({ ...settings, model: e.target.value })}
                >
                  {ollamaStatus.models.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={settings.model}
                  onChange={(e) => setLocalSettings({ ...settings, model: e.target.value })}
                  placeholder="llama3.2"
                />
              )}
            </label>

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

          {/* Demo Mode */}
          <div className="settings-section">
            <h3>Demo Mode</h3>
            <label className="toggle-field">
              <span>
                Use demo responses (no LLM required)
              </span>
              <div
                className={`toggle ${demoMode ? 'toggle-on' : ''}`}
                onClick={() => onDemoModeChange(!demoMode)}
              >
                <div className="toggle-thumb" />
              </div>
            </label>
            <p className="settings-hint">
              When enabled, the chatbot returns formatted excerpts from your documents
              instead of LLM-generated answers. Useful for demonstrating the RAG pipeline
              without running Ollama.
            </p>
          </div>

          {/* System Prompt */}
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
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSave}>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
