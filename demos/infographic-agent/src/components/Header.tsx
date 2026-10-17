import React from 'react';
import { Sparkles, Key, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  apiKey: string | null;
  onOpenKeyDialog: () => void;
}

export const Header: React.FC<HeaderProps> = ({ apiKey, onOpenKeyDialog }) => {
  return (
    <header className="app-header">
      <div className="header-inner">
        <div className="brand-group">
          <a href="/" className="back-to-home" title="Back to Ryan Baumann">
            ← Home
          </a>
          <div className="brand-icon">
            <Sparkles size={20} aria-hidden="true" />
          </div>
          <div>
            <div className="brand-title">
              Infographic Agent
              <span className="brand-badge">Gemini 3.8 + 3.1</span>
            </div>
          </div>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="key-status-btn"
            onClick={onOpenKeyDialog}
            title={apiKey ? "Using your Gemini API key" : "Using the shared daily allowance"}
            aria-label={apiKey ? 'Manage personal Gemini API key' : 'Connect a Gemini API key'}
          >
            {apiKey ? (
              <>
                <CheckCircle2 size={15} color="#10b981" aria-hidden="true" />
                <span>Your key</span>
              </>
            ) : (
              <>
                <Key size={15} aria-hidden="true" />
                <span>Add API key</span>
                <span className="status-dot" aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
