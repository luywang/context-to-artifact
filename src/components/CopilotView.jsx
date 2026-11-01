import { useEffect, useRef, useState } from 'react'
import { contacts, copilotAgents, copilotConversations, copilotPrompts, copilotReferences, currentUser, copilotAgent, dynamicsDemo } from '../data'
import { Avatar, ChatMultiple, Check, ChevronRight, Close, DemoArrow, Edit, IconButton, Lock, McpWidget, PanelLeft, Plus, Search, Send, Share } from './common'
import './CopilotView.css'
import ShareToTeamsModal from './ShareToTeamsModal'

const logo = copilotAgent.avatar

function sampleReply(text, mode, agent) {
  if (mode === 'Web') {
    return {
      role: 'assistant',
      text: 'Web mode does not use your Teams conversations or work files. This prototype is not connected to live web search.\n\nSwitch to Work to explore the Northwind sample context, or tell me which research question you want to frame.',
    }
  }

  if (!agent && /dynamics|opportunit/i.test(text)) return dynamicsDemo.reply

  const match = /draft|update|rachel/i.test(text) ? 'draft'
    : /api|review|schema|prepare/i.test(text) ? 'prepare'
    : /northwind|launch|catch|readiness|handoff/i.test(text) ? 'catch-up'
    : agent?.promptId
  const prompt = copilotPrompts.find(item => item.id === match)
  return prompt
    ? { role: 'assistant', text: prompt.response, sources: prompt.sources }
    : {
      role: 'assistant',
      text: 'I can help with the Northwind launch readout, a stakeholder draft for Rachel, or preparation for the API review using the sample context.\n\nWhich outcome do you need, and is there a specific conversation I should use?',
    }
}

export default function CopilotView({ hidden, onOpenChat, onShareMessage, pendingSharedMessageId }) {
  const [conversations, setConversations] = useState(copilotConversations)
  const [activeId, setActiveId] = useState(null)
  const [agentId, setAgentId] = useState(null)
  const [mode, setMode] = useState('Work')
  const [input, setInput] = useState(dynamicsDemo.prompt)
  const [demoStep, setDemoStep] = useState({ stage: 'send' })
  const [sharedMessages, setSharedMessages] = useState({})
  const [messageToShare, setMessageToShare] = useState(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [referencesOpen, setReferencesOpen] = useState(false)
  const inputRef = useRef(null)
  const messagesEndRef = useRef(null)
  const activeConversation = conversations.find(chat => chat.id === activeId)
  const agent = copilotAgents.find(item => item.id === agentId)
  const messages = activeConversation?.messages || []
  const filteredConversations = conversations.filter(chat =>
    `${chat.title} ${chat.messages.map(message => message.text).join(' ')}`.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    if (!hidden) {
      messagesEndRef.current?.scrollIntoView({ block: 'end' })
      inputRef.current?.focus()
    }
  }, [hidden, activeId, messages.length])

  function newChat(nextAgentId = null) {
    setActiveId(null)
    setAgentId(nextAgentId)
    setInput('')
    setDemoStep(null)
    setReferencesOpen(false)
    inputRef.current?.focus()
  }

  function startDynamicsDemo() {
    newChat()
    setMode('Work')
    setInput(dynamicsDemo.prompt)
    setDemoStep({ stage: 'send' })
  }

  function selectConversation(chat) {
    setActiveId(chat.id)
    setAgentId(chat.agentId)
    setMode(chat.mode)
    setInput('')
    setReferencesOpen(false)
  }

  function sendMessage(event) {
    event.preventDefault()
    const text = input.trim()
    if (!text) return
    const reply = { ...sampleReply(text, mode, agent), id: crypto.randomUUID() }
    const nextMessages = [
      ...messages,
      { role: 'user', text },
      reply,
    ]
    setDemoStep(reply.widget ? { stage: 'share', messageId: reply.id } : null)
    if (activeId) {
      setConversations(prev => prev.map(chat => chat.id === activeId
        ? { ...chat, messages: nextMessages, mode }
        : chat
      ))
    } else {
      const id = `copilot-${crypto.randomUUID()}`
      setConversations(prev => [{
        id,
        title: text.length > 54 ? `${text.slice(0, 54)}...` : text,
        agentId,
        mode,
        messages: nextMessages,
      }, ...prev])
      setActiveId(id)
    }
    setInput('')
    setReferencesOpen(false)
    inputRef.current?.focus()
  }

  function dismissShareModal() {
    setDemoStep({ stage: 'share', messageId: messageToShare.id })
    setMessageToShare(null)
  }

  function shareMessage(chat) {
    if (!messageToShare || sharedMessages[messageToShare.id]) return
    const id = onShareMessage(messageToShare, chat.id)
    if (!id) return
    setSharedMessages(prev => ({ ...prev, [messageToShare.id]: { messageId: id, chatId: chat.id } }))
    setDemoStep({ stage: 'open', messageId: messageToShare.id })
    setMessageToShare(null)
  }

  const composer = (
    <form className="copilot-composer" onSubmit={sendMessage}>
      <textarea
        ref={inputRef}
        aria-label={`Message ${agent?.name || 'Copilot'}`}
        placeholder={mode === 'Work' ? 'Message Copilot. Try referencing a file, meeting, or person.' : 'Message Copilot about a topic on the web.'}
        value={input}
        onChange={event => setInput(event.target.value)}
        onKeyDown={event => {
          if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault()
            event.currentTarget.form.requestSubmit()
          }
          if (event.key === 'Escape') setReferencesOpen(false)
        }}
      />
      <div className="copilot-composer-tools">
        <div className="copilot-reference-control">
          <IconButton
            label="Add work reference"
            title={mode === 'Work' ? 'Add work reference' : 'Work references are unavailable in Web mode'}
            disabled={mode === 'Web'}
            aria-expanded={referencesOpen}
            aria-controls="copilot-references"
            onClick={() => setReferencesOpen(prev => !prev)}
          >
            <Plus size={20} />
          </IconButton>
          {referencesOpen && mode === 'Work' && (
            <div className="copilot-reference-menu" id="copilot-references">
              <p>Reference a Teams conversation</p>
              {copilotReferences.map(reference => (
                <button
                  type="button"
                  key={reference.chatId}
                  onClick={() => {
                    setInput(prev => `${prev}${prev ? ' ' : ''}/${reference.label} `)
                    setReferencesOpen(false)
                    inputRef.current?.focus()
                  }}
                >
                  <ChatMultiple size={16} />
                  {reference.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <span className="copilot-compose-hint">{mode === 'Work' ? 'Work content and the web' : 'Web content only'}</span>
        <div className="copilot-demo-action">
          {demoStep?.stage === 'send' && mode === 'Work' && !agent && /dynamics|opportunit/i.test(input) && (
            <span className="copilot-send-hint"><DemoArrow direction="right" /></span>
          )}
          <IconButton label="Send message" className="copilot-send" type="submit" disabled={!input.trim()}>
            <Send size={20} />
          </IconButton>
        </div>
      </div>
    </form>
  )

  return (
    <section className="copilot-app" hidden={hidden} aria-label="Copilot in Teams">
      {messageToShare && <ShareToTeamsModal onDismiss={dismissShareModal} onSend={shareMessage} />}
      {sidebarOpen && (
        <aside className="copilot-sidebar" aria-label="Copilot navigation">
          <div className="copilot-brand">
            <img src={logo} alt="" />
            <span>Microsoft 365 <strong>Copilot</strong></span>
          </div>
          <div className="copilot-sidebar-actions">
            <button type="button" onClick={() => newChat()}><Edit size={18} />New chat</button>
            <button type="button" aria-expanded={searchOpen} onClick={() => {
              setSearchOpen(prev => !prev)
              setQuery('')
            }}><Search size={18} />Search conversations</button>
            {searchOpen && (
              <input
                className="copilot-search"
                aria-label="Search Copilot conversations"
                placeholder="Search conversations"
                value={query}
                onChange={event => setQuery(event.target.value)}
                autoFocus
              />
            )}
            <button type="button" className={!agentId ? 'selected' : ''} aria-pressed={!agentId} onClick={() => newChat()}>
              <ChatMultiple size={18} />Chat
            </button>
          </div>
          <div className="copilot-sidebar-section">
            <h2>Agents</h2>
            {copilotAgents.map(item => (
              <button type="button" key={item.id} className={agentId === item.id ? 'selected' : ''} aria-pressed={agentId === item.id} onClick={() => newChat(item.id)}>
                <Avatar contact={item} size={24} />
                {item.name}
              </button>
            ))}
          </div>
          <div className="copilot-sidebar-section copilot-history">
            <h2>Conversations</h2>
            <p className="copilot-history-label">Recent</p>
            {filteredConversations.map(chat => (
              <button
                type="button"
                key={chat.id}
                title={chat.title}
                className={activeId === chat.id ? 'selected' : ''}
                aria-current={activeId === chat.id ? 'true' : undefined}
                onClick={() => selectConversation(chat)}
              >
                <span>{chat.title}</span>
              </button>
            ))}
            {!filteredConversations.length && <p className="copilot-no-results">No conversations found.</p>}
          </div>
          <div className="copilot-sidebar-account"><Lock size={14} />Work account</div>
        </aside>
      )}
      <main className="copilot-main">
        <header className="copilot-header">
          <div className="copilot-header-title">
            <IconButton label={sidebarOpen ? 'Hide Copilot sidebar' : 'Show Copilot sidebar'} aria-expanded={sidebarOpen} onClick={() => setSidebarOpen(prev => !prev)}>
              <PanelLeft />
            </IconButton>
            <span>{agent?.name || 'Copilot'}</span>
          </div>
          <div className="copilot-mode" role="group" aria-label="Copilot grounding">
            {['Work', 'Web'].map(item => (
              <button type="button" key={item} aria-pressed={mode === item} className={mode === item ? 'active' : ''} onClick={() => {
                setMode(item)
                setReferencesOpen(false)
              }}>
                {item === 'Work' && <Lock size={12} />}{item}
              </button>
            ))}
          </div>
          <IconButton label="Start new Copilot chat" onClick={() => newChat(agentId)}><Edit size={20} /></IconButton>
        </header>
        <div className={`copilot-content${messages.length ? ' has-conversation' : ''}`}>
          {messages.length ? (
            <>
              <div className="copilot-messages" role="log" aria-label="Copilot conversation" aria-live="polite">
                <h1>{activeConversation.title}</h1>
                {messages.map((message, index) => {
                  const shared = sharedMessages[message.id]
                  const destination = shared && contacts.find(contact => contact.id === shared.chatId)
                  return (
                  <article className={`copilot-message copilot-message-${message.role}`} key={index} aria-label={message.role === 'user' ? 'You' : agent?.name || 'Copilot'}>
                    {message.role === 'assistant' && (
                      <div className="copilot-answer-author">
                        {agent ? <Avatar contact={agent} size={24} /> : <img src={logo} alt="" />}
                        <span>{agent?.name || 'Copilot'}</span>
                      </div>
                    )}
                    <p>{message.text}</p>
                    {message.widget && <McpWidget widget={message.widget} />}
                    {message.sources?.length > 0 && (
                      <div className="copilot-sources" aria-label="Sample references">
                        {message.sources.map(source => (
                          <button type="button" key={source.chatId} onClick={() => onOpenChat(source.chatId)}>
                            <ChatMultiple size={14} />{source.label}<ChevronRight size={12} />
                          </button>
                        ))}
                      </div>
                    )}
                    {message.widget && (
                      <div className="copilot-message-share">
                        <div className="copilot-demo-action">
                          <button
                            type="button"
                            className="copilot-share-button"
                            aria-label="Share Copilot message to Teams"
                            disabled={!!shared}
                            onClick={() => {
                              setMessageToShare(message)
                              setDemoStep({ stage: 'choose', messageId: message.id })
                            }}
                          >
                            <Share size={16} />
                            {shared ? 'Shared' : 'Share'}
                          </button>
                          {demoStep?.stage === 'share' && demoStep.messageId === message.id && (
                            <span className="copilot-share-hint"><DemoArrow direction="left" /></span>
                          )}
                        </div>
                        {!shared && <span className="copilot-share-target">to a Teams group chat</span>}
                        {shared && (
                          <div className="copilot-share-confirmation" role="status">
                            <span><Check size={14} />Shared with {destination.name}</span>
                            <div className="copilot-demo-action">
                              <button
                                type="button"
                                className="copilot-open-chat"
                                onClick={() => {
                                  setDemoStep(null)
                                  onOpenChat(shared.chatId, shared.messageId)
                                }}
                              >
                                Open group chat<ChevronRight size={14} />
                              </button>
                              {demoStep?.stage === 'open' && demoStep.messageId === message.id && pendingSharedMessageId === shared.messageId && (
                                <span className="copilot-share-hint"><DemoArrow direction="left" /></span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>
              <div className="copilot-bottom-compose">{composer}</div>
            </>
          ) : (
            <div className="copilot-welcome">
              {agent ? <Avatar contact={agent} size={56} /> : <img className="copilot-welcome-logo" src={logo} alt="" />}
              <p className="copilot-greeting">{agent ? agent.name : `Hi, ${currentUser.name.split(' ')[0]}`}</p>
              <h1>{agent ? 'What would you like to explore?' : 'How can I help you today?'}</h1>
              <p className="copilot-welcome-description">{agent?.description || 'Bring your work together with Copilot.'}</p>
              {!agent && (
                <div className="copilot-demo-banner">
                  <div><strong>Dynamics to Teams</strong><span>Send the prompt, share the widget, then open your chosen group chat.</span></div>
                  <button type="button" onClick={startDynamicsDemo}>Try Dynamics demo</button>
                </div>
              )}
              {composer}
              {mode === 'Work' && <div className="copilot-suggestions" aria-label="Suggested prompts">
                {copilotPrompts.map(prompt => (
                  <button type="button" key={prompt.id} onClick={() => {
                    setInput(prompt.text)
                    inputRef.current?.focus()
                  }}>
                    <span className="copilot-suggestion-icon">{prompt.id === 'draft' ? <Edit size={20} /> : prompt.id === 'prepare' ? <Search size={20} /> : <ChatMultiple size={20} />}</span>
                    <strong>{prompt.title}</strong>
                    <span>{prompt.description}</span>
                    <ChevronRight size={16} />
                  </button>
                ))}
              </div>}
            </div>
          )}
        </div>
        <footer className="copilot-footer">
          <span>AI-generated content may be incorrect. Prototype responses use sample data.</span>
          {agent && <IconButton label="Return to Copilot" onClick={() => newChat()}><Close size={14} /></IconButton>}
        </footer>
      </main>
    </section>
  )
}
