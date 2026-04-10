import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { confirmAssistantAction, streamAssistantChat } from '../api/app';
import './Assistant.css';

const suggestedPrompts = [
  '根据我的偏好推荐三道菜',
  '帮我解释为什么当前推荐第一名排在前面',
  '查询我的订单状态，订单号是 1',
  '搜索鸡肉相关菜品',
];

const capabilityItems = [
  { title: '推荐解释', description: '解释当前推荐为什么靠前，关联偏好、库存和低碳标签。' },
  { title: '订单查询', description: '读取你的订单状态，并给出下一步操作建议。' },
  { title: '受限写操作', description: '更新偏好或创建订单前，都会先让你确认。' },
];

const Assistant = ({ auth, cartCount, onLogout }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '我是 GreenBite AI 助手，可以帮你查询推荐、菜品详情、订单状态；员工和管理员还可以查看库存摘要。',
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
            <h1>直接问业务问题，AI 会通过后端安全查询本地数据库</h1>
            <p>
              当前身份是 <strong>{auth.username}</strong>，角色 <strong>{auth.role}</strong>。
              普通用户可查自己的偏好、推荐和订单；员工和管理员可额外查询库存摘要。
            </p>
          </div>
          <div className="assistant-hero-stats">
            <div className="assistant-stat-card">
              <span>身份</span>
              <strong>{auth.role}</strong>
            </div>
            <div className="assistant-stat-card">
              <span>数据库访问</span>
              <strong>后端工具代理</strong>
            </div>
            <div className="assistant-stat-card">
              <span>写操作</span>
              <strong>必须确认</strong>
            </div>
          </div>
        </section>

        <section className="assistant-layout">
          <aside className="assistant-sidecard">
            <div className="assistant-sidecard-block">
              <span className="assistant-sidecard-title">快捷问题</span>
              <div className="assistant-suggestions">
                {suggestedPrompts.map((prompt) => (
                  <button key={prompt} type="button" onClick={() => submitMessage(prompt)}>
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            <div className="assistant-sidecard-block">
              <span className="assistant-sidecard-title">能力说明</span>
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
                <h2>业务问答面板</h2>
              </div>
              <div className={`assistant-status-chip ${loading ? 'active' : ''}`}>
                {loading ? 'AI 正在处理中' : '准备就绪'}
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
                    {message.role === 'user' ? '你' : 'AI'}
                  </span>
                    <span className="assistant-message-tag">
                      {message.pendingAction ? '待确认' : message.isStreaming ? '生成中' : '已完成'}
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
                        <span>需要你确认后才会真正写入数据库</span>
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

            {error && <div className="assistant-error">{error}</div>}

            <form
              className="assistant-form"
              onSubmit={(event) => {
                event.preventDefault();
                submitMessage(input);
              }}
            >
              <div className="assistant-form-meta">
                <span>直接提问推荐、订单、库存或偏好问题</span>
                <span>支持确认后执行写操作</span>
              </div>
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="例如：解释我的推荐理由，或者查询订单 1 的状态"
                rows={4}
              />
              <div className="assistant-form-actions">
                <span className="assistant-form-tip">
                  AI 不会直接访问数据库，只会通过后端受限工具查询
                </span>
                <button type="submit" disabled={loading || !input.trim()}>
                  发送
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
