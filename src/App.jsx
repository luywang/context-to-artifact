import { useState, useCallback } from 'react'
import { agentSessions as initialSessions, activityEvents as seedActivityEvents, contacts, copilotAgent } from './data'
import NavRail from './components/NavRail'
import ChatList from './components/ChatList'
import ChatView from './components/ChatView'
import ActivityList from './components/ActivityList'
import TitleBar from './components/TitleBar'
import CopilotView from './components/CopilotView'
import { FreModal } from './components/common'
import './App.css'

export default function App() {
  const [activeView, setActiveView] = useState('copilot') // 'chat' | 'activity' | 'copilot'
  const [activeChatId, setActiveChatId] = useState(1)
  const [readChatIds, setReadChatIds] = useState(() => new Set([1]))
  const [sessions, setSessions] = useState(initialSessions)
  const [dynamicSessionMessages, setDynamicSessionMessages] = useState({})
  const [extraMessages, setExtraMessages] = useState({})
  const [pendingSharedMessage, setPendingSharedMessage] = useState(null)
  // Activity feed: persist which events the user has opened so unread decorations clear.
  const [activityEvents, setActivityEvents] = useState(seedActivityEvents)
  const [activeActivityId, setActiveActivityId] = useState(null)
  // When navigating to a chat, optionally tell ChatView to open a specific
  // session (sessions rail), open a specific channel thread, or flash a
  // specific message so the user can see where a notification landed.
  const [navIntent, setNavIntent] = useState(null)
  // FRE shows on every load while iterating on the prototype — dismiss only
  // hides it for the current session. Swap to localStorage gating later if a
  // real first-run-only behavior is needed.
  const [showFre, setShowFre] = useState(true)

  const dismissFre = useCallback(() => setShowFre(false), [])

  const selectChat = useCallback((chatId) => {
    setActiveChatId(chatId)
    setReadChatIds(prev => (prev.has(chatId) ? prev : new Set(prev).add(chatId)))
    if (pendingSharedMessage?.chatId === chatId) {
      setNavIntent({ chatId, highlightMessageId: pendingSharedMessage.messageId })
      setPendingSharedMessage(null)
    }
  }, [pendingSharedMessage])

  const shareCopilotMessage = useCallback((message, chatId) => {
    if (!contacts.some(contact => contact.id === chatId && contact.isGroup)) return null
    const id = `shared-${message.id}`
    const sharedMessage = {
      ...message,
      id,
      senderId: copilotAgent.id,
      time: new Date().toLocaleTimeString('en-US', { timeZone: 'America/Los_Angeles', hour: 'numeric', minute: '2-digit' }),
    }
    setExtraMessages(prev => {
      const messages = prev[chatId] || []
      if (messages.some(item => item.id === id)) return prev
      return { ...prev, [chatId]: [...messages, sharedMessage] }
    })
    setReadChatIds(prev => {
      const next = new Set(prev)
      next.delete(chatId)
      return next
    })
    setPendingSharedMessage({ chatId, messageId: id })
    return id
  }, [])

  const navigateToChat = useCallback((chatId, { showSessions, sessionId } = {}) => {
    selectChat(chatId)
    if (showSessions) setNavIntent({ chatId, sessionId: sessionId || null })
  }, [selectChat])

  const clearNavIntent = useCallback(() => setNavIntent(null), [])

  const addSession = useCallback((agentId, session, messages) => {
    setSessions(prev => ({
      ...prev,
      [agentId]: [session, ...(prev[agentId] || [])],
    }))
    if (messages) {
      setDynamicSessionMessages(prev => ({ ...prev, [session.id]: messages }))
    }
  }, [])

  const updateSession = useCallback((agentId, sessionId, updates) => {
    setSessions(prev => ({
      ...prev,
      [agentId]: (prev[agentId] || []).map(s =>
        s.id === sessionId ? { ...s, ...updates } : s
      ),
    }))
  }, [])

  const updateSessionMessages = useCallback((sessionId, messages) => {
    setDynamicSessionMessages(prev => ({ ...prev, [sessionId]: messages }))
  }, [])

  const selectActivity = useCallback((event) => {
    setActiveActivityId(event.id)
    setActivityEvents(prev =>
      prev.map(e => (e.id === event.id && e.unread ? { ...e, unread: false } : e))
    )
    setActiveChatId(event.chatId)
    setReadChatIds(prev => (prev.has(event.chatId) ? prev : new Set(prev).add(event.chatId)))
    setNavIntent({
      chatId: event.chatId,
      channelThreadPostId: event.postId || null,
      highlightMessageId: event.messageId || null,
    })
  }, [])

  const activityUnreadCount = activityEvents.reduce((n, e) => n + (e.unread ? 1 : 0), 0)
  const incomingChatIds = new Set(Object.entries(extraMessages)
    .filter(([, messages]) => messages.some(message => message.senderId === copilotAgent.id))
    .map(([chatId]) => Number(chatId)))

  return (
    <div className="app">
      <TitleBar onShowFre={() => setShowFre(true)} />
      <div className="app-body">
        <NavRail
          activeView={activeView}
          onSelectView={setActiveView}
          activityUnreadCount={activityUnreadCount}
        />
        <div className="teams-workspace" hidden={activeView === 'copilot'}>
          {activeView === 'activity' ? (
            <ActivityList
              events={activityEvents}
              activeEventId={activeActivityId}
              onSelectEvent={selectActivity}
            />
          ) : (
            <ChatList
              activeChatId={activeChatId}
              onSelectChat={selectChat}
              readChatIds={readChatIds}
              hintChatId={pendingSharedMessage?.chatId}
              incomingChatIds={incomingChatIds}
            />
          )}
          <ChatView
            activeChatId={activeChatId}
            onSelectChat={navigateToChat}
            sessions={sessions}
            addSession={addSession}
            updateSession={updateSession}
            updateSessionMessages={updateSessionMessages}
            dynamicSessionMessages={dynamicSessionMessages}
            extraMessages={extraMessages}
            setExtraMessages={setExtraMessages}
            navIntent={navIntent}
            clearNavIntent={clearNavIntent}
          />
        </div>
        <CopilotView
          hidden={activeView !== 'copilot'}
          onShareMessage={shareCopilotMessage}
          pendingSharedMessageId={pendingSharedMessage?.messageId}
          onOpenChat={(chatId, highlightMessageId) => {
            setActiveView('chat')
            selectChat(chatId)
            if (highlightMessageId) setNavIntent({ chatId, highlightMessageId })
          }}
        />
      </div>
      {showFre && (
        <FreModal
          title="From Dynamics to your team"
          subtitle="Find opportunities in Copilot, then bring the complete result into a Teams group chat."
          onDismiss={dismissFre}
          dismissLabel="Start demo"
        >
          <h3 className="fre-section-title">1. Send</h3>
          <p>Alex's Dynamics prompt is ready. Click Send to see potential customers, topics, and estimated revenue in an HTML widget returned by the Dynamics MCP demo.</p>
          <h3 className="fre-section-title">2. Share</h3>
          <p>Click Share beneath Copilot's answer, search for a Teams group chat, select it, then click Send to post the complete message and widget.</p>
          <h3 className="fre-section-title">3. Open the group chat</h3>
          <p>Follow the red arrow to your selected group chat. The same result appears in Teams, sent by the Copilot agent.</p>
          <p className="fre-modal-footnote">Interactive prototype with fictional customer data. No live Dynamics or MCP connection.</p>
        </FreModal>
      )}
    </div>
  )
}
