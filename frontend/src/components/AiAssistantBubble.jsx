import React, { useEffect, useRef, useState } from 'react';
import { confirmAssistantAction, streamAssistantChat } from '../api/app';
import './AiAssistantBubble.css';

const suggestedPrompts = [
  'Recommend 3 meals',
  'Why is the top result first?',
  'Check order 1',
  'Search chicken',
];

const ambientPrompts = [
  'Want to see the best picks for you today?',
  'I can check your order status.',
  'Tap me for three quick picks.',
  'Looking for something lighter?',
  'You can search chicken too.',
  'Want a higher-protein option today?',
];

const AiAssistantBubble = ({ auth }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [ambientText, setAmbientText] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi, ${auth?.username || 'there'}`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmingActionId, setConfirmingActionId] = useState('');
  const [error, setError] = useState('');
  const messagesRef = useRef(null);
  const ambientTimerRef = useRef(null);
  const ambientHideTimerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const container = messagesRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [isOpen, messages]);

  useEffect(() => {
    const clearAmbientTimers = () => {
      if (ambientTimerRef.current) {
        clearTimeout(ambientTimerRef.current);
        ambientTimerRef.current = null;
      }
      if (ambientHideTimerRef.current) {
        clearTimeout(ambientHideTimerRef.current);
        ambientHideTimerRef.current = null;
      }
    };

    if (isOpen) {
      setAmbientText('');
      clearAmbientTimers();
      return clearAmbientTimers;
    }

    const scheduleAmbientPrompt = () => {
      const nextDelay = 9000 + Math.floor(Math.random() * 9000);
      ambientTimerRef.current = window.setTimeout(() => {
        const nextText =
          ambientPrompts[Math.floor(Math.random() * ambientPrompts.length)];
        setAmbientText(nextText);
        ambientHideTimerRef.current = window.setTimeout(() => {
          setAmbientText('');
          scheduleAmbientPrompt();
        }, 3600);
      }, nextDelay);
    };

    scheduleAmbientPrompt();
    return clearAmbientTimers;
  }, [isOpen]);

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
                      content: data.summary || 'Please confirm this action.',
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
                      content: data.reply || message.content || 'No response available right now.',
                      pendingAction: data.pendingAction || null,
                      isStreaming: false,
                    }
                  : message
              )
            );
            return;
          }

          if (event === 'error') {
            setError(data.message || 'AI assistant is temporarily unavailable.');
            setMessages((current) =>
              current.map((message, index) =>
                index === streamIndex
                  ? {
                      ...message,
                      content:
                        message.content ||
                        data.message ||
                        'AI assistant is temporarily unavailable.',
                      isStreaming: false,
                    }
                  : message
              )
            );
          }
        },
      });
    } catch (err) {
      setError(err.message || 'AI assistant is temporarily unavailable.');
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
          content: result.reply || 'Done.',
          pendingAction: null,
          isStreaming: false,
        },
      ]);
    } catch (err) {
      setError(err.message || 'Confirmation failed.');
    } finally {
      setConfirmingActionId('');
    }
  };

  return (
    <>
      <button
        type="button"
        className={`ai-bubble-trigger ${isOpen ? 'hidden' : ''}`}
        onClick={() => {
          setAmbientText('');
          setIsOpen(true);
        }}
        aria-label="Open AI assistant"
      >
        <span className={`ai-bubble-ambient ${ambientText ? 'visible' : ''}`}>
          {ambientText}
        </span>
        <span className="ai-bubble-icon">AI</span>
        <span className="ai-bubble-copy">
          <strong>Assistant</strong>
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
                <h2>Assistant</h2>
              </div>
              <button
                type="button"
                className="ai-bubble-close"
                onClick={() => setIsOpen(false)}
                aria-label="Close AI assistant"
              >
                ×
              </button>
            </header>

            <div className="ai-bubble-suggestions">
              {suggestedPrompts.map((prompt) => (
                <button key={prompt} type="button" onClick={() => submitMessage(prompt)}>
                  {prompt}
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
                    <span>{message.role === 'user' ? 'You' : 'AI'}</span>
                    <span>
                      {message.pendingAction ? 'Pending' : message.isStreaming ? 'Streaming' : 'Done'}
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
                          ? 'Confirmed'
                          : confirmingActionId === message.pendingAction.actionId
                            ? 'Confirming...'
                            : 'Confirm'}
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
                placeholder="Type a message"
                rows={3}
              />
              <div className="ai-bubble-form-actions">
                <button type="submit" disabled={loading || !input.trim()}>
                  {loading ? 'Sending...' : 'Send'}
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
