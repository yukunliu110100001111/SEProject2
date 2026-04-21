import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { confirmAssistantAction, streamAssistantChat } from '../api/app';
import './Assistant.css';

const suggestedPrompts = [
  'Recommend three meals for me',
  'Why is the top recommendation first?',
  'Check order 1',
  'Search chicken meals',
];

const capabilityItems = [
  { title: 'Recommendation rationale', description: 'Explains why items rank first based on preferences, stock, and tags.' },
  { title: 'Order lookup', description: 'Reads your order status and suggests the next step.' },
  { title: 'Protected write actions', description: 'Always asks for confirmation before updating preferences or creating an order.' },
];

const Assistant = ({ auth, cartCount, onLogout }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'I am the GreenBite AI assistant. I can help with recommendations, meal details, and orders. Staff and admins can also view inventory summaries.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmingActionId, setConfirmingActionId] = useState('');
  const [error, setError] = useState('');

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
    <div className="assistant-page">
      <Navbar
        auth={auth}
        cartCount={cartCount}
        onOpenCart={() => {}}
        onLogout={onLogout}
      />

      <div className="assistant-shell">
        <section className="assistant-hero">
          <div className="assistant-hero-copy">
            <span className="assistant-kicker">Volcengine Ark Assistant</span>
            <h1>Ask directly. AI reads your product data through controlled backend tools.</h1>
            <p>
              Signed in as <strong>{auth.username}</strong>, role <strong>{auth.role}</strong>.
              Customers can view their own preferences, recommendations, and orders. Staff and admins can also access inventory summaries.
            </p>
          </div>
          <div className="assistant-hero-stats">
            <div className="assistant-stat-card">
              <span>Role</span>
              <strong>{auth.role}</strong>
            </div>
            <div className="assistant-stat-card">
              <span>Data access</span>
              <strong>Backend tools</strong>
            </div>
            <div className="assistant-stat-card">
              <span>Write actions</span>
              <strong>Confirmation required</strong>
            </div>
          </div>
        </section>

        <section className="assistant-layout">
          <aside className="assistant-sidecard">
            <div className="assistant-sidecard-block">
              <span className="assistant-sidecard-title">Quick prompts</span>
              <div className="assistant-suggestions">
                {suggestedPrompts.map((prompt) => (
                  <button key={prompt} type="button" onClick={() => submitMessage(prompt)}>
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            <div className="assistant-sidecard-block">
              <span className="assistant-sidecard-title">Capabilities</span>
              <div className="assistant-capability-list">
                {capabilityItems.map((item) => (
                  <article key={item.title} className="assistant-capability-item">
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </aside>

          <section className="assistant-panel">
            <div className="assistant-panel-header">
              <div>
                <span className="assistant-panel-kicker">Conversation</span>
                <h2>Conversation</h2>
              </div>
              <div className={`assistant-status-chip ${loading ? 'active' : ''}`}>
                {loading ? 'Processing' : 'Ready'}
              </div>
            </div>

            <div className="assistant-messages">
            {messages.map((message, index) => (
              <article
                key={`${message.role}-${index}`}
                className={`assistant-message ${message.role === 'user' ? 'user' : 'assistant'} ${message.isStreaming ? 'assistant-typing' : ''}`}
              >
                <div className="assistant-message-head">
                  <span className="assistant-role">
                    {message.role === 'user' ? 'You' : 'AI'}
                  </span>
                    <span className="assistant-message-tag">
                      {message.pendingAction ? 'Pending' : message.isStreaming ? 'Streaming' : 'Done'}
                    </span>
                  </div>
                  {message.isStreaming && !message.content ? (
                    <div className="assistant-typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  ) : (
                    <p>{message.content || '...'}</p>
                  )}
                  {message.pendingAction && (
                    <div className="assistant-action-card">
                      <div className="assistant-action-meta">
                        <strong>{message.pendingAction.actionType}</strong>
                        <span>Your confirmation is required before anything is written.</span>
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

            {error && <div className="assistant-error">{error}</div>}

            <form
              className="assistant-form"
              onSubmit={(event) => {
                event.preventDefault();
                submitMessage(input);
              }}
            >
              <div className="assistant-form-meta">
                <span>Ask about recommendations, orders, inventory, or preferences</span>
                <span>Protected write actions stay behind confirmation</span>
              </div>
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="For example: explain my top recommendation, or check order 1"
                rows={4}
              />
              <div className="assistant-form-actions">
                <span className="assistant-form-tip">
                  AI uses controlled backend tools instead of direct database access
                </span>
                <button type="submit" disabled={loading || !input.trim()}>
                  Send
                </button>
              </div>
            </form>
          </section>
        </section>
      </div>
    </div>
  );
};

export default Assistant;
