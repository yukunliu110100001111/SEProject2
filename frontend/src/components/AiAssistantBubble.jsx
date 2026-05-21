import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { confirmAssistantAction, streamAssistantChat } from '../api/app';
import { useI18n } from '../i18n';
import './AiAssistantBubble.css';

const suggestedPrompts = [
  'promptRecommend',
  'promptWhyTop',
  'promptCheckOrder',
  'promptSearchChicken',
];

const assistantAnimationSrc =
  'https://lottie.host/467cdd67-0db0-4297-b1bf-5a584298dfa4/gmkRwSfgvr.lottie';

const assistantAnimationEvents = [
  'yesClick',
  'noClick',
  'alertClick',
  'thinkClick',
  'jumpClick',
];

const AiAssistantBubble = ({ auth }) => {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: t('helloUser', { name: auth?.username || t('there') }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmingActionId, setConfirmingActionId] = useState('');
  const [error, setError] = useState('');
  const [isAssistantJumping, setIsAssistantJumping] = useState(false);
  const messagesRef = useRef(null);
  const assistantLottieRef = useRef(null);
  const animationEventIndexRef = useRef(0);
  const assistantJumpTimerRef = useRef(null);

  const cycleAssistantAnimation = useCallback(() => {
    const dotLottie = assistantLottieRef.current;
    if (!dotLottie?.stateMachineFireEvent) {
      return;
    }

    const eventName =
      assistantAnimationEvents[
        animationEventIndexRef.current % assistantAnimationEvents.length
    ];
    animationEventIndexRef.current += 1;
    dotLottie.stateMachineFireEvent(eventName);

    if (eventName === 'jumpClick') {
      if (assistantJumpTimerRef.current) {
        window.clearTimeout(assistantJumpTimerRef.current);
      }
      setIsAssistantJumping(true);
      assistantJumpTimerRef.current = window.setTimeout(() => {
        setIsAssistantJumping(false);
        assistantJumpTimerRef.current = null;
      }, 780);
    }
  }, []);

  const handleAssistantLottieRef = useCallback((dotLottie) => {
    assistantLottieRef.current = dotLottie;
    dotLottie?.stateMachineStart?.();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(cycleAssistantAnimation, 4200);
    return () => {
      window.clearInterval(timer);
      if (assistantJumpTimerRef.current) {
        window.clearTimeout(assistantJumpTimerRef.current);
      }
    };
  }, [cycleAssistantAnimation]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const container = messagesRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [isOpen, messages]);

  const submitMessage = async (content) => {
    const nextContent = content.trim();
    if (!nextContent || loading) {
      return;
    }

    const nextMessages = [
      ...messages,
      { role: 'user', content: nextContent },
      { role: 'assistant', content: '', pendingAction: null, isStreaming: true },
    ];
    const streamIndex = nextMessages.length - 1;
    setIsOpen(true);
    setMessages(nextMessages);
    setInput('');
    setError('');
    setLoading(true);

    try {
      await streamAssistantChat(nextMessages.slice(0, -1), {
        onEvent: ({ event, data }) => {
          if (event === 'delta') {
            setMessages((current) =>
              current.map((message, index) =>
                index === streamIndex
                  ? { ...message, content: `${message.content}${data.content || ''}` }
                  : message
              )
            );
            return;
          }

          if (event === 'action_required') {
            setMessages((current) =>
              current.map((message, index) =>
                index === streamIndex
                  ? {
                      ...message,
                      content: data.summary || t('confirmActionPrompt'),
                      pendingAction: data,
                      isStreaming: false,
                    }
                  : message
              )
            );
            return;
          }

          if (event === 'done') {
            setMessages((current) =>
              current.map((message, index) =>
                index === streamIndex
                  ? {
                      ...message,
                      content: data.reply || message.content || t('noResponse'),
                      pendingAction: data.pendingAction || null,
                      isStreaming: false,
                    }
                  : message
              )
            );
            return;
          }

          if (event === 'error') {
            setError(data.message || t('aiUnavailable'));
            setMessages((current) =>
              current.map((message, index) =>
                index === streamIndex
                  ? {
                      ...message,
                      content:
                        message.content ||
                        data.message ||
                        t('aiUnavailable'),
                      isStreaming: false,
                    }
                  : message
              )
            );
          }
        },
      });
    } catch (err) {
      setError(err.message || t('aiUnavailable'));
      setMessages((current) =>
        current.map((message, index) =>
          index === streamIndex ? { ...message, isStreaming: false } : message
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = async (pendingAction) => {
    if (!pendingAction?.actionId || confirmingActionId) {
      return;
    }

    setConfirmingActionId(pendingAction.actionId);
    setError('');

    try {
      const result = await confirmAssistantAction(pendingAction.actionId);
      setMessages((current) =>
        current.map((message) =>
          message.pendingAction?.actionId === pendingAction.actionId
            ? {
                ...message,
                pendingAction: {
                  ...message.pendingAction,
                  confirmed: true,
                },
              }
            : message
        )
      );
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: result.reply || t('assistantDone'),
          pendingAction: null,
          isStreaming: false,
        },
      ]);
    } catch (err) {
      setError(err.message || t('confirmationFailed'));
    } finally {
      setConfirmingActionId('');
    }
  };

  return (
    <>
      <button
        type="button"
        className={`ai-bubble-trigger ${isOpen ? 'is-open' : ''} ${
          isAssistantJumping ? 'is-jumping' : ''
        }`}
        onClick={() => setIsOpen(true)}
        aria-label={t('openAssistant')}
      >
        <span className="ai-bubble-icon" aria-hidden="true">
          <DotLottieReact
            src={assistantAnimationSrc}
            stateMachineId="StateMachine1"
            dotLottieRefCallback={handleAssistantLottieRef}
            className="ai-bubble-lottie"
          />
        </span>
      </button>

      {isOpen && (
        <div className="ai-bubble-overlay" onClick={() => setIsOpen(false)}>
          <section
            className="ai-bubble-dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="ai-bubble-header">
              <div>
                <span className="ai-bubble-kicker">GreenBite</span>
                <h2>{t('assistant')}</h2>
              </div>
              <button
                type="button"
                className="ai-bubble-close"
                onClick={() => setIsOpen(false)}
                aria-label={t('closeAssistant')}
              >
                ×
              </button>
            </header>

            <div className="ai-bubble-suggestions">
              {suggestedPrompts.map((promptKey) => (
                <button key={promptKey} type="button" onClick={() => submitMessage(t(promptKey))}>
                  {t(promptKey)}
                </button>
              ))}
            </div>

            <div className="ai-bubble-messages" ref={messagesRef}>
              {messages.map((message, index) => (
                <article
                  key={`${message.role}-${index}`}
                  className={`ai-bubble-message ${message.role === 'user' ? 'user' : 'assistant'} ${message.isStreaming ? 'typing' : ''}`}
                >
                  <div className="ai-bubble-message-head">
                    <span>{message.role === 'user' ? t('you') : 'AI'}</span>
                    <span>
                      {message.pendingAction ? t('pending') : message.isStreaming ? t('streaming') : t('done')}
                    </span>
                  </div>
                  {message.isStreaming && !message.content ? (
                    <div className="ai-bubble-typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  ) : (
                    <p>{message.content || '...'}</p>
                  )}
                  {message.pendingAction && (
                    <div className="ai-bubble-action-card">
                      <div>
                        <strong>{message.pendingAction.actionType}</strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleConfirmAction(message.pendingAction)}
                        disabled={
                          Boolean(confirmingActionId) ||
                          Boolean(message.pendingAction.confirmed)
                        }
                      >
                        {message.pendingAction.confirmed
                          ? t('confirmed')
                          : confirmingActionId === message.pendingAction.actionId
                            ? t('confirming')
                            : t('confirm')}
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>

            {error && <div className="ai-bubble-error">{error}</div>}

            <form
              className="ai-bubble-form"
              onSubmit={(event) => {
                event.preventDefault();
                submitMessage(input);
              }}
            >
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={t('typeMessage')}
                rows={3}
              />
              <div className="ai-bubble-form-actions">
                <button type="submit" disabled={loading || !input.trim()}>
                  {loading ? t('sending') : t('send')}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
};

export default AiAssistantBubble;
