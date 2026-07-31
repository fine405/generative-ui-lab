import type {
  ChatMessage,
  ChatPart,
  ChatStreamEvent,
  ChatToolPart,
} from "@/lib/chat";

function updateMessage(
  messages: ChatMessage[],
  messageId: string,
  update: (message: ChatMessage) => ChatMessage,
) {
  return messages.map((message) =>
    message.id === messageId ? update(message) : message,
  );
}

function updateTool(
  messages: ChatMessage[],
  toolCallId: string,
  update: (part: ChatToolPart) => ChatToolPart,
) {
  return messages.map((message) => ({
    ...message,
    parts: message.parts.map((part) =>
      part.type === "tool" && part.toolCallId === toolCallId
        ? update(part)
        : part,
    ),
  }));
}

function upsertPart(
  parts: ChatPart[],
  sourceIndex: number,
  create: () => ChatPart,
  update: (part: ChatPart) => ChatPart,
) {
  const existing = parts.findIndex(
    (part) => part.sourceIndex === sourceIndex,
  );

  if (existing === -1) {
    return [...parts, create()].sort(
      (left, right) => left.sourceIndex - right.sourceIndex,
    );
  }

  return parts.map((part, index) => (index === existing ? update(part) : part));
}

export function applyChatStreamEvent(
  messages: ChatMessage[],
  event: ChatStreamEvent,
): ChatMessage[] {
  if (event.type === "message.start") {
    return [
      ...messages,
      {
        id: event.messageId,
        role: "assistant",
        parts: [],
        status: "running",
        createdAt: Date.now(),
      },
    ];
  }

  if (event.type === "text.delta") {
    return updateMessage(messages, event.messageId, (message) => ({
      ...message,
      parts: upsertPart(
        message.parts,
        event.sourceIndex,
        () => ({
          type: "text",
          sourceIndex: event.sourceIndex,
          text: event.delta,
        }),
        (part) =>
          part.type === "text"
            ? { ...part, text: part.text + event.delta }
            : part,
      ),
    }));
  }

  if (event.type === "tool.start") {
    return updateMessage(messages, event.messageId, (message) => ({
      ...message,
      parts: upsertPart(
        message.parts,
        event.sourceIndex,
        () => ({
          type: "tool",
          sourceIndex: event.sourceIndex,
          toolCallId: event.toolCallId,
          toolName: event.toolName,
          argsText: "",
          args: {},
        }),
        (part) => part,
      ),
    }));
  }

  if (event.type === "tool.args.delta") {
    return updateTool(messages, event.toolCallId, (part) => ({
      ...part,
      argsText: part.argsText + event.delta,
    }));
  }

  if (event.type === "tool.args.complete") {
    return updateTool(messages, event.toolCallId, (part) => ({
      ...part,
      args: event.args,
    }));
  }

  if (event.type === "tool.result") {
    return updateTool(messages, event.toolCallId, (part) => ({
      ...part,
      result: event.result,
      isError: event.isError,
    }));
  }

  if (event.type === "message.end") {
    return updateMessage(messages, event.messageId, (message) => ({
      ...message,
      status: message.status === "error" ? "error" : "complete",
    }));
  }

  if (event.type === "error") {
    const runningMessage = [...messages]
      .reverse()
      .find(
        (message) =>
          message.role === "assistant" && message.status === "running",
      );

    return runningMessage
      ? updateMessage(messages, runningMessage.id, (message) => ({
          ...message,
          status: "error",
        }))
      : messages;
  }

  return messages;
}
