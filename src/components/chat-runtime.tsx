"use client";

import { CopilotKit } from "@copilotkit/react-core/v2";
import { useId, useState, useSyncExternalStore } from "react";
import type { FormEvent, ReactNode } from "react";
import type { ChatAvailability } from "@/lib/env";

const CHAT_API_KEY_HEADER = "x-chat-api-key";
const SESSION_KEY = "generative-ui-lab:chat-api-key:v1";
const SESSION_KEY_EVENT = "generative-ui-lab:chat-api-key-change";

function getSessionKeySnapshot() {
  try {
    return sessionStorage.getItem(SESSION_KEY)?.trim() ?? "";
  } catch {
    return "";
  }
}

function getServerSessionKeySnapshot() {
  return "";
}

function subscribeToSessionKey(onStoreChange: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key === SESSION_KEY) {
      onStoreChange();
    }
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener(SESSION_KEY_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(SESSION_KEY_EVENT, onStoreChange);
  };
}

type ChatRuntimeProps = {
  availability: ChatAvailability;
  children: ReactNode;
  openGenerativeUI?: {
    designSkill?: string;
  };
  runtimeUrl: string;
};

export function ChatRuntime({
  availability,
  children,
  openGenerativeUI,
  runtimeUrl,
}: ChatRuntimeProps) {
  const titleId = useId();
  const panelId = useId();
  const sessionKey = useSyncExternalStore(
    subscribeToSessionKey,
    getSessionKeySnapshot,
    getServerSessionKeySnapshot,
  );
  const [draftKey, setDraftKey] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [runtimeError, setRuntimeError] = useState("");

  const usingSessionKey = sessionKey.length > 0;
  const chatEnabled = availability.serverEnabled || usingSessionKey;
  const statusLabel = usingSessionKey
    ? "Session key"
    : availability.serverEnabled
      ? "Server key"
      : "Chat off";

  function openSettings() {
    setDraftKey("");
    setStorageError("");
    setSettingsOpen(true);
  }

  function saveKey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextKey = draftKey.trim();

    if (nextKey.length < 8) {
      setStorageError("Enter a valid API key.");
      return;
    }

    try {
      sessionStorage.setItem(SESSION_KEY, nextKey);
      window.dispatchEvent(new Event(SESSION_KEY_EVENT));
      setDraftKey("");
      setRuntimeError("");
      setSettingsOpen(false);
    } catch {
      setStorageError("This browser could not save the key for the session.");
    }
  }

  function clearKey() {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      setStorageError("This browser could not clear the stored key.");
      return;
    }

    window.dispatchEvent(new Event(SESSION_KEY_EVENT));
    setDraftKey("");
    setRuntimeError("");
    setSettingsOpen(false);
  }

  return (
    <div className="chat-runtime">
      <div className="chat-access-bar">
        <div>
          <span
            className={`chat-status ${chatEnabled ? "chat-status-on" : ""}`}
          >
            <span aria-hidden="true" />
            {statusLabel}
          </span>
          <span className="chat-model">
            {availability.provider} / {availability.model}
          </span>
        </div>
        <button
          aria-controls={panelId}
          aria-expanded={settingsOpen}
          className="chat-settings-trigger"
          onClick={() =>
            settingsOpen ? setSettingsOpen(false) : openSettings()
          }
          type="button"
        >
          Settings
        </button>
      </div>

      {settingsOpen ? (
        <form
          aria-labelledby={titleId}
          className="chat-settings"
          id={panelId}
          onSubmit={saveKey}
          role="dialog"
        >
          <div className="chat-settings-heading">
            <div>
              <h3 id={titleId}>Chat API key</h3>
              <p>
                Used with {availability.provider} for this browser tab only.
                The key is sent to this app when CopilotKit makes a request.
              </p>
            </div>
            <button
              aria-label="Close chat settings"
              className="chat-settings-close"
              onClick={() => setSettingsOpen(false)}
              type="button"
            >
              ×
            </button>
          </div>
          <label htmlFor={`${panelId}-key`}>API key</label>
          <input
            autoComplete="new-password"
            id={`${panelId}-key`}
            onChange={(event) => setDraftKey(event.target.value)}
            placeholder={
              usingSessionKey
                ? "A session key is already saved"
                : "Paste an OpenAI-compatible API key"
            }
            spellCheck={false}
            type="password"
            value={draftKey}
          />
          <p className="chat-settings-note">
            Session storage is cleared when the tab closes. The key is never
            written to the repository or a Vercel environment variable.
          </p>
          {storageError ? (
            <p className="chat-settings-error" role="alert">
              {storageError}
            </p>
          ) : null}
          <div className="chat-settings-actions">
            {usingSessionKey ? (
              <button
                className="chat-settings-clear"
                onClick={clearKey}
                type="button"
              >
                Clear session key
              </button>
            ) : (
              <span />
            )}
            <button
              className="chat-settings-save"
              disabled={draftKey.trim().length < 8}
              type="submit"
            >
              Save for this tab
            </button>
          </div>
        </form>
      ) : null}

      <div className="chat-runtime-content">
        {chatEnabled ? (
          <CopilotKit
            headers={
              usingSessionKey
                ? {
                    [CHAT_API_KEY_HEADER]: sessionKey,
                  }
                : undefined
            }
            onError={({ error }) => setRuntimeError(error.message)}
            openGenerativeUI={openGenerativeUI}
            runtimeUrl={runtimeUrl}
            useSingleEndpoint={false}
          >
            {runtimeError ? (
              <div className="chat-runtime-error" role="alert">
                {runtimeError}
              </div>
            ) : null}
            {children}
          </CopilotKit>
        ) : (
          <div className="chat-locked">
            <div className="chat-locked-icon" aria-hidden="true">
              ◌
            </div>
            <h3>Chat needs an API key</h3>
            <p>
              Add one for this tab, or enable the server configuration with
              <code> CHAT_ENABLED=true</code>.
            </p>
            {availability.issue ? (
              <p className="chat-locked-issue">{availability.issue}</p>
            ) : null}
            <button onClick={openSettings} type="button">
              Add API key
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
