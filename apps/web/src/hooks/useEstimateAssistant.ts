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
  const messagesRef = useRef(messages);
  const lastActionRef = useRef<EstimateAssistantAction | null>(null);

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

  const performAction = useCallback(async (
    action: EstimateAssistantAction,
    appendVisibleMessage: boolean,
  ) => {
    if (sendingRef.current || !configuration?.enabled) return;

    sendingRef.current = true;
    setIsOpen(true);
    setIsSending(true);
    setError(null);
    lastActionRef.current = action;
    const previousMessages = messagesRef.current;
    const userMessage: EstimateAssistantUiMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: action.visibleMessage,
      intent: action.intent,
    };
    if (appendVisibleMessage) {
      setMessages((current) => [...current, userMessage]);
    }

    const controller = new AbortController();
    controllerRef.current = controller;
    const historyLimit = configuration.maxHistoryMessages;
    const payload: EstimateAssistantRequest = {
      intent: action.intent,
      context,
      history: previousMessages.slice(-historyLimit).map(({ role, content }) => ({ role, content })),
      ...(action.message ? { message: action.message } : {}),
      ...(action.customFunction ? { customFunction: action.customFunction } : {}),
    };

    try {
      const response = await api.post<EstimateAssistantResponse>(
        '/ai/estimate-assistant/messages',
        payload,
        { signal: controller.signal },
      );
      setMessages((current) => [...current, {
        id: response.data.requestId,
        role: 'assistant',
        content: response.data.message,
        intent: response.data.intent,
      }]);
    } catch (requestError) {
      setError(readAssistantError(requestError));
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null;
      sendingRef.current = false;
      setIsSending(false);
    }
  }, [configuration, context]);

  const sendAction = useCallback((action: EstimateAssistantAction) => (
    performAction(action, true)
  ), [performAction]);

  const retry = useCallback(() => {
    if (!lastActionRef.current) return Promise.resolve();
    return performAction(lastActionRef.current, false);
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
    retry,
    sendAction,
    sendChat,
  };
}
