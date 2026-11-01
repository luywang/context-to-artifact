import { useEffect, useRef, useState } from 'react'
import { contacts, dynamicsDemo } from '../data'
import { Avatar, Close, DemoArrow, IconButton, Search, Send } from './common'
import './ShareToTeamsModal.css'

const groupChats = contacts.filter(contact => contact.isGroup)
  .sort((a, b) => Number(b.id === dynamicsDemo.targetChatId) - Number(a.id === dynamicsDemo.targetChatId))

export default function ShareToTeamsModal({ onDismiss, onSend }) {
  const [query, setQuery] = useState('')
  const [selectedChatId, setSelectedChatId] = useState(dynamicsDemo.targetChatId)
  const dialogRef = useRef(null)
  const searchRef = useRef(null)
  const selectedChat = groupChats.find(chat => chat.id === selectedChatId)
  const results = groupChats.filter(chat => chat.name.toLowerCase().includes(query.trim().toLowerCase()))

  useEffect(() => {
    const dialog = dialogRef.current
    const trigger = document.activeElement
    dialog.showModal()
    searchRef.current?.focus()
    return () => {
      dialog.close()
      trigger?.focus()
    }
  }, [])

  return (
    <dialog
      ref={dialogRef}
      className="share-teams-modal"
      aria-labelledby="share-teams-title"
      aria-describedby="share-teams-description"
      onCancel={event => {
        event.preventDefault()
        onDismiss()
      }}
      onKeyDown={event => {
        if (event.key !== 'Tab') return
        const controls = [...event.currentTarget.querySelectorAll('button:not(:disabled), input:not(:disabled)')]
        const first = controls[0]
        const last = controls[controls.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }}
      onClick={event => {
        if (event.target === event.currentTarget) onDismiss()
      }}
    >
      <form className="share-teams-panel" onSubmit={event => {
        event.preventDefault()
        if (selectedChat) onSend(selectedChat)
      }}>
        <header className="share-teams-header">
          <h2 id="share-teams-title">Share to Teams</h2>
          <IconButton label="Close share dialog" onClick={onDismiss}><Close size={20} /></IconButton>
        </header>
        <p id="share-teams-description">Choose a group chat. Copilot will send the complete message and widget.</p>
        <div className="share-teams-search">
          <Search size={20} />
          <input
            ref={searchRef}
            aria-label="Search Teams group chats"
            placeholder="Search group chats"
            value={query}
            onChange={event => setQuery(event.target.value)}
          />
        </div>
        <div className="share-teams-results" role="radiogroup" aria-label="Teams group chats">
          {results.map(chat => (
            <label key={chat.id} className={`share-teams-chat${chat.id === selectedChatId ? ' selected' : ''}`}>
              <Avatar contact={chat} size={32} />
              <span>{chat.name}</span>
              <input
                type="radio"
                name="share-teams-chat"
                value={chat.id}
                checked={chat.id === selectedChatId}
                onChange={() => setSelectedChatId(chat.id)}
              />
            </label>
          ))}
          {!results.length && <p className="share-teams-empty">No group chats found.</p>}
        </div>
        <p className="share-teams-selection">
          {selectedChat ? <>Send to <strong>{selectedChat.name}</strong></> : 'Select a group chat to continue.'}
        </p>
        <footer className="share-teams-footer">
          <button type="button" className="share-teams-cancel" onClick={onDismiss}>Cancel</button>
          <div className="share-teams-send-action">
            {selectedChat && <span className="share-teams-send-hint"><DemoArrow direction="right" /></span>}
            <button type="submit" className="share-teams-send" disabled={!selectedChat}><Send size={16} />Send</button>
          </div>
        </footer>
      </form>
    </dialog>
  )
}
