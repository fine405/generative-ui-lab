"use client";

import {
  AssistantRuntimeProvider,
  AuiIf,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useLocalRuntime,
  type ChatModelAdapter,
  type ThreadAssistantMessagePart,
  type ThreadMessage,
  type ToolCallMessagePartComponent,
  type ToolCallMessagePartProps,
} from "@assistant-ui/react";
import { useMemo, useRef, useState } from "react";
import type {
  AgentMode,
  ChatMessage,
  ChatStreamEvent,
  JsonValue,
} from "@/lib/chat";
import { applyChatStreamEvent } from "@/lib/chat-stream";

type ChatThreadProps = {
  headers: Record<string, string>;
  inputPlaceholder: string;
  mode: AgentMode;
  toolComponents: Record<string, ToolCallMessagePartComponent>;
  welcomeMessage: string;
};

function toWireMessages(messages: readonly ThreadMessage[]): ChatMessage[] {
  return messages.flatMap((message) => {
    if (message.role === "system") {
      return [];
    }

    const parts: ChatMessage["parts"] = [];

    for (const [sourceIndex, part] of message.content.entries()) {
      if (part.type === "text") {
        parts.push({
          type: "text",
          sourceIndex,
          text: part.text,
        });
      } else if (part.type === "tool-call") {
        parts.push({
          type: "tool",
          sourceIndex,
          toolCallId: part.toolCallId,
          toolName: part.toolName,
          argsText: part.argsText,
          args: part.args as { [key: string]: JsonValue },
          ...(part.result === undefined
            ? {}
            : { result: part.result as JsonValue }),
          ...(part.isError === undefined
            ? {}
            : { isError: part.isError }),
        });
      }
    }

    return [
      {
        id: message.id,
        role: message.role,
        createdAt: message.createdAt.getTime(),
        status:
          message.role === "assistant" &&
          message.status.type === "incomplete" &&
          message.status.reason === "error"
            ? ("error" as const)
            : ("complete" as const),
        parts,
      },
    ];
  });
}

function toAssistantContent(
  messages: ChatMessage[],
): ThreadAssistantMessagePart[] {
  return messages
    .filter((message) => message.role === "assistant")
    .flatMap((message) =>
      message.parts.map((part) => {
        if (part.type === "text") {
          return { type: "text" as const, text: part.text };
        }

        return {
          type: "tool-call" as const,
          toolCallId: part.toolCallId,
          toolName: part.toolName,
          argsText: part.argsText,
          args: part.args,
          ...(part.result === undefined ? {} : { result: part.result }),
          ...(part.isError === undefined ? {} : { isError: part.isError }),
        };
      }),
    );
}

async function readError(response: Response) {
  try {
    const body = (await response.json()) as { error?: unknown };
    return typeof body.error === "string"
      ? body.error
      : "The chat request failed.";
  } catch {
    return "The chat request failed.";
  }
}

function TextPart({ text }: { text: string }) {
  return <p className="chat-message-text">{text}</p>;
}

function EmptyPart() {
  return (
    <span className="chat-thinking">
      <span aria-hidden="true" />
      Thinking
    </span>
  );
}

function FallbackTool({
  isError,
  toolName,
}: ToolCallMessagePartProps) {
  return (
    <div className="tool-fallback">
      <span>{toolName}</span>
      <strong>{isError ? "Tool failed" : "Running tool…"}</strong>
    </div>
  );
}

function UserMessage() {
  return (
    <MessagePrimitive.Root className="chat-message chat-message-user">
      <MessagePrimitive.Content components={{ Text: TextPart }} />
    </MessagePrimitive.Root>
  );
}

function AssistantMessage({
  toolComponents,
}: {
  toolComponents: Record<string, ToolCallMessagePartComponent>;
}) {
  return (
    <MessagePrimitive.Root className="chat-message chat-message-assistant">
      <MessagePrimitive.Content
        components={{
          Empty: EmptyPart,
          Text: TextPart,
          tools: {
            by_name: toolComponents,
            Fallback: FallbackTool,
          },
        }}
      />
    </MessagePrimitive.Root>
  );
}

function ChatInterface({
  inputPlaceholder,
  toolComponents,
  welcomeMessage,
}: Pick<
  ChatThreadProps,
  "inputPlaceholder" | "toolComponents" | "welcomeMessage"
>) {
  return (
    <ThreadPrimitive.Root className="agent-thread">
      <ThreadPrimitive.Viewport className="agent-thread-viewport">
        <AuiIf
          condition={(state) =>
            state.thread.messages.length === 0 && !state.thread.isLoading
          }
        >
          <div className="chat-welcome">
            <div aria-hidden="true">✦</div>
            <h3>Generative UI agent</h3>
            <p>{welcomeMessage}</p>
          </div>
        </AuiIf>

        <ThreadPrimitive.Messages>
          {({ message }) =>
            message.role === "user" ? (
              <UserMessage />
            ) : (
              <AssistantMessage toolComponents={toolComponents} />
            )
          }
        </ThreadPrimitive.Messages>

        <ThreadPrimitive.ViewportFooter className="agent-thread-footer">
          <ComposerPrimitive.Root className="agent-composer">
            <ComposerPrimitive.Input
              aria-label="Message"
              className="agent-composer-input"
              placeholder={inputPlaceholder}
              rows={1}
            />
            <AuiIf condition={(state) => !state.thread.isRunning}>
              <ComposerPrimitive.Send className="agent-composer-action">
                Send
              </ComposerPrimitive.Send>
            </AuiIf>
            <AuiIf condition={(state) => state.thread.isRunning}>
              <ComposerPrimitive.Cancel className="agent-composer-action">
                Stop
              </ComposerPrimitive.Cancel>
            </AuiIf>
          </ComposerPrimitive.Root>
          <p className="agent-composer-note">
            pi-agent-core → project NDJSON protocol → host renderer
          </p>
        </ThreadPrimitive.ViewportFooter>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  );
}

export function ChatThread({
  headers,
  inputPlaceholder,
  mode,
  toolComponents,
  welcomeMessage,
}: ChatThreadProps) {
  const [runtimeError, setRuntimeError] = useState("");
  const threadId = useRef(crypto.randomUUID());

  const chatModel = useMemo<ChatModelAdapter>(
    () => ({
      async *run({ messages, abortSignal }) {
        setRuntimeError("");
        let runMessages: ChatMessage[] = [];
        let streamError = "";
        const response = await fetch(`/api/chat/${mode}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
          body: JSON.stringify({
            messages: toWireMessages(messages),
            threadId: threadId.current,
          }),
          signal: abortSignal,
        });

        if (!response.ok) {
          const message = await readError(response);
          setRuntimeError(message);
          throw new Error(message);
        }

        if (!response.body) {
          throw new Error("The chat response did not include a stream.");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          buffer += decoder.decode(value, { stream: !done });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.trim()) {
              continue;
            }

            const event = JSON.parse(line) as ChatStreamEvent;
            runMessages = applyChatStreamEvent(runMessages, event);

            if (event.type === "error") {
              setRuntimeError(event.message);
              streamError = event.message;
            }

            yield { content: toAssistantContent(runMessages) };
          }

          if (done) {
            break;
          }
        }

        if (streamError) {
          throw new Error(streamError);
        }
      },
    }),
    [headers, mode],
  );
  const runtime = useLocalRuntime(chatModel, {
    maxSteps: 1,
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {runtimeError ? (
        <div className="chat-runtime-error" role="alert">
          {runtimeError}
        </div>
      ) : null}
      <ChatInterface
        inputPlaceholder={inputPlaceholder}
        toolComponents={toolComponents}
        welcomeMessage={welcomeMessage}
      />
    </AssistantRuntimeProvider>
  );
}
