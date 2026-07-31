"use client";

import { CopilotKit } from "@copilotkit/react-core/v2";
import { useId, useMemo, useState, useSyncExternalStore } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  CHAT_API_KEY_HEADER,
  CHAT_MODEL_HEADER,
  type ChatAvailability,
} from "@/lib/chat";

const SESSION_KEYS = "generative-ui-lab:provider-api-keys:v2";
const LEGACY_SESSION_KEY = "generative-ui-lab:chat-api-key:v1";
const SESSION_KEYS_EVENT = "generative-ui-lab:provider-api-keys-change";

function getSessionKeysSnapshot() {
  try {
    const current = sessionStorage.getItem(SESSION_KEYS);

    if (current) {
      return current;
    }

    const legacyDeepSeekKey =
      sessionStorage.getItem(LEGACY_SESSION_KEY)?.trim() ?? "";

    return legacyDeepSeekKey
      ? JSON.stringify({ deepseek: legacyDeepSeekKey })
      : "{}";
  } catch {
    return "{}";
  }
}

function getServerSessionKeysSnapshot() {
  return "{}";
}

function parseSessionKeys(value: string) {
  try {
    const parsed = JSON.parse(value);

    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, string] =>
          typeof entry[1] === "string" && entry[1].trim().length >= 8,
      ),
    );
  } catch {
    return {};
  }
}

function subscribeToSessionKeys(onStoreChange: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key === SESSION_KEYS || event.key === LEGACY_SESSION_KEY) {
      onStoreChange();
    }
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener(SESSION_KEYS_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(SESSION_KEYS_EVENT, onStoreChange);
  };
}

function writeSessionKeys(keys: Record<string, string>) {
  if (Object.keys(keys).length === 0) {
    sessionStorage.removeItem(SESSION_KEYS);
  } else {
    sessionStorage.setItem(SESSION_KEYS, JSON.stringify(keys));
  }
  sessionStorage.removeItem(LEGACY_SESSION_KEY);
  window.dispatchEvent(new Event(SESSION_KEYS_EVENT));
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
  const sessionKeysSnapshot = useSyncExternalStore(
    subscribeToSessionKeys,
    getSessionKeysSnapshot,
    getServerSessionKeysSnapshot,
  );
  const sessionKeys = useMemo(
    () => parseSessionKeys(sessionKeysSnapshot),
    [sessionKeysSnapshot],
  );
  const providers = useMemo(
    () =>
      new Map(
        availability.providers.map((provider) => [provider.id, provider]),
      ),
    [availability.providers],
  );
  const defaultProvider =
    availability.models.find((model) => model.id === availability.defaultModel)
      ?.provider ??
    availability.providers[0]?.id ??
    "";
  const [selectedModelId, setSelectedModelId] = useState(
    availability.defaultModel,
  );
  const [settingsProviderId, setSettingsProviderId] =
    useState(defaultProvider);
  const [draftKey, setDraftKey] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [runtimeError, setRuntimeError] = useState("");

  function modelIsEnabled(model: ChatAvailability["models"][number]) {
    return (
      providers.get(model.provider)?.serverEnabled ||
      Boolean(sessionKeys[model.provider])
    );
  }

  const requestedModel = availability.models.find(
    (model) => model.id === selectedModelId,
  );
  const activeModel =
    requestedModel && modelIsEnabled(requestedModel)
      ? requestedModel
      : availability.models.find(modelIsEnabled);
  const activeProvider = activeModel
    ? providers.get(activeModel.provider)
    : undefined;
  const activeSessionKey = activeModel
    ? sessionKeys[activeModel.provider]
    : undefined;
  const settingsProvider = providers.get(settingsProviderId);
  const usingSessionKey = Boolean(activeSessionKey);
  const chatEnabled = Boolean(activeModel);
  const statusLabel = usingSessionKey
    ? "Session key"
    : activeProvider?.serverEnabled
      ? "Server key"
      : "Chat off";

  function openSettings() {
    setSettingsProviderId(activeModel?.provider ?? defaultProvider);
    setDraftKey("");
    setStorageError("");
    setSettingsOpen(true);
  }

  function saveKey() {
    const nextKey = draftKey.trim();

    if (!settingsProvider || nextKey.length < 8) {
      setStorageError("Choose a provider and enter a valid API key.");
      return;
    }

    try {
      writeSessionKeys({
        ...sessionKeys,
        [settingsProvider.id]: nextKey,
      });
      const firstProviderModel = availability.models.find(
        (model) => model.provider === settingsProvider.id,
      );

      if (firstProviderModel) {
        setSelectedModelId(firstProviderModel.id);
      }

      setDraftKey("");
      setRuntimeError("");
      setSettingsOpen(false);
    } catch {
      setStorageError("This browser could not save the key for the session.");
    }
  }

  function clearKey() {
    if (!settingsProvider) {
      return;
    }

    try {
      const nextKeys = { ...sessionKeys };
      delete nextKeys[settingsProvider.id];
      writeSessionKeys(nextKeys);
    } catch {
      setStorageError("This browser could not clear the stored key.");
      return;
    }

    setDraftKey("");
    setRuntimeError("");
    setSettingsOpen(false);
  }

  function submitSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent)
      .submitter as HTMLButtonElement | null;

    if (submitter?.value === "clear") {
      clearKey();
      return;
    }

    saveKey();
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
          <select
            aria-label="Chat model"
            className="chat-model-select"
            onChange={(event) => {
              setSelectedModelId(event.target.value);
              setRuntimeError("");
            }}
            value={activeModel?.id ?? ""}
          >
            <option disabled value="">
              Select a configured model
            </option>
            {availability.providers.map((provider) => (
              <optgroup key={provider.id} label={provider.name}>
                {availability.models
                  .filter((model) => model.provider === provider.id)
                  .map((model) => {
                    const enabled = modelIsEnabled(model);

                    return (
                      <option disabled={!enabled} key={model.id} value={model.id}>
                        {model.name}
                        {enabled ? "" : " — key required"}
                      </option>
                    );
                  })}
              </optgroup>
            ))}
          </select>
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
          onSubmit={submitSettings}
          role="dialog"
        >
          <div className="chat-settings-heading">
            <div>
              <h3 id={titleId}>Provider API key</h3>
              <p>
                Adds a provider for this browser tab. pi-ai owns model routing
                and authentication.
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
          <label htmlFor={`${panelId}-provider`}>Provider</label>
          <select
            id={`${panelId}-provider`}
            onChange={(event) => {
              setSettingsProviderId(event.target.value);
              setDraftKey("");
              setStorageError("");
            }}
            value={settingsProviderId}
          >
            {availability.providers.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
                {provider.serverEnabled ? " — server key configured" : ""}
              </option>
            ))}
          </select>
          <label htmlFor={`${panelId}-key`}>
            {settingsProvider?.name ?? "Provider"} API key
          </label>
          <input
            autoComplete="new-password"
            id={`${panelId}-key`}
            onChange={(event) => setDraftKey(event.target.value)}
            placeholder={
              sessionKeys[settingsProviderId]
                ? "A session key is already saved"
                : `Set ${settingsProvider?.keyEnv ?? "the provider API key"}`
            }
            spellCheck={false}
            type="password"
            value={draftKey}
          />
          <p className="chat-settings-note">
            Session storage is cleared when the tab closes. The key is sent
            only to this app and is not written to Vercel or a server-side
            store.
          </p>
          {storageError ? (
            <p className="chat-settings-error" role="alert">
              {storageError}
            </p>
          ) : null}
          <div className="chat-settings-actions">
            {sessionKeys[settingsProviderId] ? (
              <button
                className="chat-settings-clear"
                name="intent"
                type="submit"
                value="clear"
              >
                Clear {settingsProvider?.name} key
              </button>
            ) : (
              <span />
            )}
            <button
              className="chat-settings-save"
              disabled={!settingsProvider || draftKey.trim().length < 8}
              type="submit"
            >
              Save for this tab
            </button>
          </div>
        </form>
      ) : null}

      <div className="chat-runtime-content">
        {activeModel ? (
          <CopilotKit
            headers={{
              [CHAT_MODEL_HEADER]: activeModel.id,
              ...(activeSessionKey
                ? { [CHAT_API_KEY_HEADER]: activeSessionKey }
                : {}),
            }}
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
            <h3>No configured model</h3>
            <p>
              Configure a provider API key in the environment, or add one for
              this browser tab.
            </p>
            {availability.issue ? (
              <p className="chat-locked-issue">{availability.issue}</p>
            ) : null}
            <button onClick={openSettings} type="button">
              Add provider key
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
