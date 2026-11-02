import { useState } from 'react'
import { agentLogos } from '../shared/agentLogos'
import { contacts, currentUser } from '../data'
import { AdaptiveCard, Avatar, LinkCard, PrivateDisclaimer, ChainOfThought, McpWidget } from './common'
import MessageActions from './MessageActions'

// File extensions per type, used to suffix the displayed filename so it
// reads "Brief.docx" but the stored `name` stays clean.
const FILE_EXTENSIONS = {
  word: '.docx',
  excel: '.xlsx',
  powerpoint: '.pptx',
}

const base = import.meta.env.BASE_URL

// Teams-style file artifact card: app logo + filename / visibility subtitle.
// Compact horizontal layout that mirrors `LinkCard` (Figma/Jira/GitHub) so
// shared files and shared links read as the same family of attachment.
function FileCard({ card }) {
  const ext = FILE_EXTENSIONS[card.fileType] || ''
  return (
    <div className={`file-card file-card-${card.fileType}`}>
      <img
        className="file-card-logo"
        src={`${base}file-icons/${card.fileType}.png`}
        alt=""
      />
      <div className="file-card-text">
        <div className="file-card-title">{card.name}{ext}</div>
        <div className="file-card-subtitle">{card.subtitle}</div>
      </div>
    </div>
  )
}

// Local choices override scripted reactions without counting the user twice.
function buildReactionList(baseReactions, myChoices) {
  const map = new Map()
  for (const r of baseReactions || []) {
    map.set(r.emoji, { ...r, byMe: !!r.byMe })
  }
  for (const [emoji, byMe] of myChoices) {
    const existing = map.get(emoji) || { emoji, count: 0, byMe: false }
    map.set(emoji, {
      ...existing,
      count: existing.count + Number(byMe) - Number(existing.byMe),
      byMe,
      participantIds: existing.participantIds
        ? [...existing.participantIds.filter(id => id !== 'me'), ...(byMe ? ['me'] : [])]
        : undefined,
    })
  }
  return [...map.values()].filter(reaction => reaction.count > 0)
}

function ThreadReplyBadge({ reply, onClick }) {
  const ids = reply.participantIds || (reply.agentId ? [reply.agentId] : [])
  const participants = ids
    .map((id) => (id === 'me' ? currentUser : contacts.find((c) => c.id === id)))
    .filter(Boolean)
  if (!participants.length) return null
  const label = reply.count === 1 ? '1 reply' : `${reply.count} replies`
  return (
    <button type="button" className="message-thread-replies" onClick={onClick}>
      <span className="message-thread-replies-avatars">
        {participants.map((p, i) => (
          <span
            key={i}
            className="message-thread-replies-avatar"
            style={{ background: p.avatar ? 'transparent' : p.color || '#6264A7' }}
          >
            {p.avatar ? (
              <img src={p.avatar} alt="" />
            ) : p.isAgent ? (
              agentLogos[p.logo](10)
            ) : (
              p.initials
            )}
          </span>
        ))}
      </span>
      <span className="message-thread-replies-label">{label}</span>
    </button>
  )
}

export default function MessageRow({ message, activeContact, onOpenThread, onCardAction, onCardChoice }) {
  const isMe = message.senderId === 'me'
  const isMultiParty = activeContact.isGroup || activeContact.isChannel
  const sender = isMe
    ? currentUser
    : isMultiParty
      ? contacts.find(c => c.id === message.senderId)
      : activeContact

  const [myReactions, setMyReactions] = useState(() => new Map())
  const toggleReaction = (emoji) => {
    setMyReactions(prev => {
      const current = buildReactionList(message.reactions, prev).find(reaction => reaction.emoji === emoji)
      return new Map(prev).set(emoji, !current?.byMe)
    })
  }
  const reactions = buildReactionList(message.reactions, myReactions)

  return (
    <div
      className={`message-row ${isMe ? 'message-mine' : ''}${message.widget ? ' message-row-widget' : ''}${message.cards?.some(card => card.bars) ? ' message-row-chart' : ''}${message.targetedTo === 'me' ? ' message-row-targeted' : ''}`}
      data-message-id={message.id}
      data-targeted-to={message.targetedTo}
    >
      {!isMe && (
        <div className="message-avatar-col">
          <Avatar contact={sender} size={32} />
        </div>
      )}
      <div className="message-content-wrap">
        <div className="message-meta">
          {!isMe && <span className="message-sender-name">{sender.name}</span>}
          <span className="message-timestamp">{message.time}</span>
        </div>
        <div className={`message-bubble ${message.isPrivate ? 'message-bubble-private' : ''}`}>
          <MessageActions onReact={toggleReaction} />
          {message.isPrivate && <PrivateDisclaimer text={message.targetedTo === 'me' ? 'Targeted message · Only you can see this message' : undefined} />}
          {message.forwardedFrom && (
            <div className="forwarded-message">
              <div className="forwarded-sender">{message.forwardedFrom.sender}</div>
              <div className="forwarded-text">{message.forwardedFrom.text}</div>
            </div>
          )}
          {message.subject && <div className="message-subject">{message.subject}</div>}
          {Array.isArray(message.text)
            ? message.text.map((part, i) =>
                typeof part === 'string' ? part : <span key={i} className="mention">{part.name}</span>
              )
            : message.text}
          {message.widget && <McpWidget widget={message.widget} />}
          {message.link && <LinkCard link={message.link} />}
          {message.cards && (
            <div className="message-cards">
              {message.cards.map((card, i) => card.type === 'file' ? (
                <FileCard key={i} card={card} />
              ) : (
                <AdaptiveCard key={i} card={card} onAction={action => onCardAction?.(message, action)} onChoice={value => onCardChoice?.(message, value)} />
              ))}
            </div>
          )}
          {message.chainOfThought && (
            <ChainOfThought steps={message.chainOfThought} />
          )}
        </div>
        {reactions.length > 0 && (
          <div className="message-reactions-bar">
            {reactions.map((r) => (
              <button
                key={r.emoji}
                type="button"
                className={`reaction-pill ${r.byMe ? 'reaction-pill-mine' : ''}`}
                onClick={() => toggleReaction(r.emoji)}
                aria-label={`${r.byMe ? 'Remove' : 'Add'} reaction ${r.emoji}`}
                title={r.participantIds?.map(id => id === 'me' ? currentUser.name : contacts.find(contact => contact.id === id)?.name).filter(Boolean).join(', ')}
              >
                <span aria-hidden="true">{r.emoji}</span>
                {r.count > 1 && <span className="reaction-pill-count">{r.count}</span>}
              </button>
            ))}
          </div>
        )}
        {message.threadReply && (
          <ThreadReplyBadge
            reply={message.threadReply}
            onClick={() => onOpenThread?.(message)}
          />
        )}
      </div>
      {isMe && isMultiParty && (
        <div className="message-avatar-col">
          <Avatar contact={currentUser} size={32} />
        </div>
      )}
    </div>
  )
}
