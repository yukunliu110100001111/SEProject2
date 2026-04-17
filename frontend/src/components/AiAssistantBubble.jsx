import React, { useEffect, useRef, useState } from 'react';
import { confirmAssistantAction, streamAssistantChat } from '../api/app';
import './AiAssistantBubble.css';

const suggestedPrompts = [
  '根据我的偏好推荐三道菜',
  '帮我解释为什么当前推荐第一名排在前面',
  '查询我的订单状态，订单号是 1',
  '搜索鸡肉相关菜品',
];

const AiAssistantBubble = ({ auth }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `我是 GreenBite AI 助手，当前登录用户是 ${auth?.username || '你'}。我可以帮你查询推荐、菜品详情和订单状态。`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmingActionId, setConfirmingActionId] = useState('');
  const [error, setError] = useState('');
  const messagesRef = useRef(null);

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
                      content: data.summary || '请确认是否执行该操作。',
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
                      content: data.reply || message.content || '暂时没有拿到可用回复。',
                      pendingAction: data.pendingAction || null,
                      isStreaming: false,
                    }
                  : message
              )
            );
            return;
          }

          if (event === 'error') {
            setError(data.message || 'AI 助手暂时不可用');
          }
        },
      });
    } catch (err) {
      setError(err.message || 'AI 助手暂时不可用');
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
          content: result.reply || '操作已执行。',
          pendingAction: null,
          isStreaming: false,
        },
      ]);
    } catch (err) {
      setError(err.message || '确认执行失败');
    } finally {
      setConfirmingActionId('');
    }
  };

  return (
    <>
      <button
        type="button"
        className={`ai-bubble-trigger ${isOpen ? 'hidden' : ''}`}
        onClick={() => setIsOpen(true)}
        aria-label="打开 AI 助手"
      >
        <span className="ai-bubble-icon">AI</span>
        <span className="ai-bubble-copy">
          <strong>智能助手</strong>
          <small>点击对话</small>
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
                <span className="ai-bubble-kicker">GreenBite AI</span>
                <h2>业务问答助手</h2>
              </div>
              <button
                type="button"
                className="ai-bubble-close"
                onClick={() => setIsOpen(false)}
                aria-label="关闭 AI 助手"
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
                    <span>{message.role === 'user' ? '你' : 'AI'}</span>
                    <span>
                      {message.pendingAction ? '待确认' : message.isStreaming ? '生成中' : '已完成'}
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
                        <span>确认后才会真正写入数据库</span>
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
                          ? '已确认'
                          : confirmingActionId === message.pendingAction.actionId
                            ? '确认中...'
                            : '确认执行'}
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
                placeholder="例如：解释我的推荐理由，或者查询订单 1 的状态"
                rows={3}
              />
              <div className="ai-bubble-form-actions">
                <span>当前身份：{auth?.role || 'user'}</span>
                <button type="submit" disabled={loading || !input.trim()}>
                  {loading ? '发送中...' : '发送'}
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
