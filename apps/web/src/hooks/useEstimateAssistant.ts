import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import {
  EstimateAssistantIntent,
  type EstimateAssistantChatMessage,
  type EstimateAssistantConfiguration,
  type EstimateAssistantContext,
  type EstimateAssistantCustomFunctionDraft,
  type EstimateAssistantRequest,
  type EstimateAssistantResponse,
} from '@pricefunc/shared';
import { api } from '../lib/api';

export const MAX_HISTORY_MESSAGE_LENGTH = 2_000;

export interface EstimateAssistantUiMessage extends EstimateAssistantChatMessage {
  id: string;
  intent?: EstimateAssistantIntent;
}

export interface EstimateAssistantAction {
  intent: EstimateAssistantIntent;
  visibleMessage: string;
  message?: string;
  customFunction?: EstimateAssistantCustomFunctionDraft;
}

interface EstimateAssistantAttempt {
  action: EstimateAssistantAction;
  baseMessages: readonly EstimateAssistantUiMessage[];
}

export function buildRequestHistory(
  messages: readonly EstimateAssistantChatMessage[],
  intent: EstimateAssistantIntent,
  historyLimit: number,
): EstimateAssistantChatMessage[] {
  if (intent !== EstimateAssistantIntent.CHAT || historyLimit <= 0) {
    return [];
  }

  return messages
    .map(({ role, content }) => ({
      role,
      content: content.trim().slice(0, MAX_HISTORY_MESSAGE_LENGTH),
    }))
    .filter((message) => message.content.length > 0)
    .slice(-historyLimit);
}

export function buildEstimateAssistantPayload(
  action: EstimateAssistantAction,
  context: EstimateAssistantContext,
  baseMessages: readonly EstimateAssistantChatMessage[],
  historyLimit: number,
): EstimateAssistantRequest {
  return {
    intent: action.intent,
    context,
    history: buildRequestHistory(baseMessages, action.intent, historyLimit),
    ...(action.message ? { message: action.message } : {}),
    ...(action.customFunction ? { customFunction: action.customFunction } : {}),
  };
}

function readAssistantError(error: unknown): string {
  if (axios.isCancel(error)) return 'Análise cancelada. A estimativa não foi alterada.';
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(' ');
    if (typeof message === 'string') return message;
  }
  return 'O assistente está temporariamente indisponível. Sua estimativa não foi alterada.';
}

export function useEstimateAssistant(context: EstimateAssistantContext) {
  const [messages, setMessages] = useState<EstimateAssistantUiMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configuration, setConfiguration] = useState<EstimateAssistantConfiguration | null>(null);
  const [configurationLoading, setConfigurationLoading] = useState(true);
  const controllerRef = useRef<AbortController | null>(null);
  const sendingRef = useRef(false);
  const messagesRef = useRef<EstimateAssistantUiMessage[]>(messages);
  const lastAttemptRef = useRef<EstimateAssistantAttempt | null>(null);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    let active = true;
    api.get<EstimateAssistantConfiguration>('/ai/estimate-assistant/configuration')
      .then((response) => {
        if (active) setConfiguration(response.data);
      })
      .catch(() => {
        if (active) setConfiguration({ enabled: false, maxHistoryMessages: 10 });
      })
      .finally(() => {
        if (active) setConfigurationLoading(false);
      });
    return () => {
      active = false;
      controllerRef.current?.abort();
    };
  }, []);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const cancel = useCallback(() => controllerRef.current?.abort(), []);

  const clear = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    sendingRef.current = false;
    lastAttemptRef.current = null;
    messagesRef.current = [];
    setMessages([]);
    setError(null);
    setIsSending(false);
  }, []);

  const performAction = useCallback(async (
    attempt: EstimateAssistantAttempt,
    appendVisibleMessage: boolean,
  ) => {
    if (sendingRef.current || !configuration?.enabled) return;

    sendingRef.current = true;
    setIsOpen(true);
    setIsSending(true);
    setError(null);
    lastAttemptRef.current = attempt;

    if (appendVisibleMessage) {
      const userMessage: EstimateAssistantUiMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: attempt.action.visibleMessage,
        intent: attempt.action.intent,
      };
      const nextMessages = [...attempt.baseMessages, userMessage];
      messagesRef.current = nextMessages;
      setMessages(nextMessages);
    }

    const controller = new AbortController();
    controllerRef.current = controller;
    const payload = buildEstimateAssistantPayload(
      attempt.action,
      context,
      attempt.baseMessages,
      configuration.maxHistoryMessages,
    );

    try {
      const response = await api.post<EstimateAssistantResponse>(
        '/ai/estimate-assistant/messages',
        payload,
        { signal: controller.signal },
      );
      const assistantMessage: EstimateAssistantUiMessage = {
        id: response.data.requestId,
        role: 'assistant',
        content: response.data.message,
        intent: response.data.intent,
      };
      setMessages((current) => {
        const updated = [...current, assistantMessage];
        messagesRef.current = updated;
        return updated;
      });
    } catch (requestError) {
      setError(readAssistantError(requestError));
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null;
      sendingRef.current = false;
      setIsSending(false);
    }
  }, [configuration, context]);

  const sendAction = useCallback((action: EstimateAssistantAction) => (
    performAction({ action, baseMessages: messagesRef.current }, true)
  ), [performAction]);

  const retry = useCallback(() => {
    if (!lastAttemptRef.current) return Promise.resolve();
    return performAction(lastAttemptRef.current, false);
  }, [performAction]);

  const sendChat = useCallback((message: string) => sendAction({
    intent: EstimateAssistantIntent.CHAT,
    visibleMessage: message,
    message,
  }), [sendAction]);

  return {
    messages,
    isOpen,
    isSending,
    error,
    enabled: configuration?.enabled ?? false,
    configurationLoading,
    open,
    close,
    cancel,
    clear,
    retry,
    sendAction,
    sendChat,
  };
}
