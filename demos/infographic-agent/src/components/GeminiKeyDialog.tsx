import React, { useState, useEffect, useRef } from 'react';
import { X, Key, ExternalLink, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { validateApiKey } from '../services/api.ts';

interface GeminiKeyDialogProps {
  open: boolean;
  onClose: () => void;
  apiKey: string | null;
  onSaveKey: (key: string | null) => void;
}

export const GeminiKeyDialog: React.FC<GeminiKeyDialogProps> = ({
  open,
  onClose,
  apiKey,
  onSaveKey,
}) => {
  const [inputVal, setInputVal] = useState(apiKey || '');
  const [isValidating, setIsValidating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    setInputVal(apiKey || '');
    setErrorMsg(null);
    setSuccessMsg(null);
    setShowKey(false);
  }, [open, apiKey]);

  useEffect(() => {
    if (!open) return;

    previouslyFocusedRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const focusFrame = window.requestAnimationFrame(() => inputRef.current?.focus());
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener('keydown', handleKeyDown);
      previouslyFocusedRef.current?.focus();
    };
  }, [open]);

  if (!open) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputVal.trim();
    if (!trimmed) {
      onSaveKey(null);
      onClose();
      return;
    }

    setIsValidating(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const valid = await validateApiKey(trimmed);
      if (valid) {
        setSuccessMsg('Key works. Connecting…');
        setTimeout(() => {
          onSaveKey(trimmed);
          onClose();
        }, 600);
      } else {
        setErrorMsg('Gemini rejected that key. Check it in Google AI Studio and try again.');
      }
    } catch {
      setErrorMsg('Could not reach Gemini to check the key. Check your connection and try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleClear = () => {
    setInputVal('');
    onSaveKey(null);
    setErrorMsg(null);
    setSuccessMsg(null);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={dialogRef}
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="byok-title"
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Key size={18} color="#3b82f6" aria-hidden="true" />
            <h3 id="byok-title" className="modal-title">Gemini API key</h3>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.4' }}>
          This demo runs on a shared daily allowance. Add your own Gemini API key to keep generating after the allowance runs out.
        </p>

        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label" htmlFor="api-key-input">API key</label>
            <div style={{ position: 'relative' }}>
              <input
                ref={inputRef}
                id="api-key-input"
                type={showKey ? 'text' : 'password'}
                className="form-input"
                placeholder="AIzaSy..."
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                autoComplete="off"
                spellCheck="false"
                aria-describedby="api-key-storage-note"
                style={{ paddingRight: '3rem' }}
              />
              <button
                type="button"
                className="key-visibility-btn"
                onClick={() => setShowKey((v) => !v)}
                aria-label={showKey ? 'Hide API key' : 'Show API key'}
              >
                {showKey ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
              </button>
            </div>
            <p id="api-key-storage-note" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>
              Kept in this tab's memory only. It is never written to localStorage or stored on the server.
            </p>
          </div>

          {errorMsg && (
            <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171', fontSize: '0.8125rem', marginBottom: '1rem' }}>
              <AlertCircle size={16} aria-hidden="true" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div role="status" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4ade80', fontSize: '0.8125rem', marginBottom: '1rem' }}>
              <Check size={16} aria-hidden="true" />
              <span>{successMsg}</span>
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <span>Get a free Gemini API key in Google AI Studio</span>
              <ExternalLink size={13} aria-hidden="true" />
            </a>
          </div>

          <div className="modal-footer">
            {apiKey && (
              <button
                type="button"
                className="btn-secondary"
                onClick={handleClear}
                style={{ marginRight: 'auto', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}
              >
                Remove key
              </button>
            )}
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" style={{ width: 'auto' }} disabled={isValidating}>
              {isValidating ? 'Checking…' : 'Save key'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
