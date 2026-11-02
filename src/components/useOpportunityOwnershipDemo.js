import { useEffect, useRef } from 'react'
import { copilotAgent, createDynamicsWidget, opportunityOwnershipDemo as demo } from '../data'

function message(senderId, text, fields = {}) {
  return {
    id: `ownership-${crypto.randomUUID()}`,
    senderId,
    text,
    time: new Date().toLocaleTimeString('en-US', { timeZone: 'America/Los_Angeles', hour: 'numeric', minute: '2-digit' }),
    ...fields,
  }
}

function mentions(text) {
  return text.split(/(@Everyone|@Copilot)/g).map(part =>
    part.startsWith('@') ? { type: 'mention', name: part } : part
  )
}

function approvalCard(candidate, alternate = false) {
  return {
    accentColor: '#5B5FC7',
    iconType: 'teams',
    title: 'Assign Tailspin Toys',
    subtitle: 'Partner support automation · $95,000 estimated revenue',
    badge: { text: 'Awaiting your approval', tone: 'amber' },
    facts: [{ label: 'Proposed owner', value: candidate.name }],
    sections: [{ heading: 'Why this person', text: candidate.reason }],
    ...(alternate ? {
      choice: {
        label: 'Choose a different owner',
        value: candidate.id,
        options: demo.candidates.map(person => ({ value: person.id, label: person.name })),
      },
    } : {}),
    actions: [
      { id: 'confirm-owner', label: 'Confirm assignment', primary: true },
      ...(!alternate ? [{ id: 'different-owner', label: 'Suggest a different person' }] : []),
      { id: 'cancel-owner', label: 'Cancel' },
    ],
  }
}

export default function useOpportunityOwnershipDemo({ activeChatId, extraMessages, setExtraMessages }) {
  const timers = useRef(new Set())
  const handled = useRef(new Set())
  const chatMessages = extraMessages[activeChatId] || []
  const root = chatMessages.find(item => String(item.id).startsWith('shared-') && item.widget?.title === 'Dynamics opportunities')
  const flowMessages = root ? chatMessages.filter(item => item.ownershipFlowId === root.id) : []
  const latest = flowMessages.filter(item => item.ownershipStage).at(-1)
  const stage = root ? latest?.ownershipStage || 'ask' : null
  const prompt = demo.prompts[stage] || ''

  useEffect(() => {
    const activeTimers = timers.current
    return () => activeTimers.forEach(timer => clearTimeout(timer))
  }, [])

  function schedule(callback, delay) {
    const timer = setTimeout(() => {
      timers.current.delete(timer)
      callback()
    }, delay)
    timers.current.add(timer)
  }

  function append(chatId, flowId, messages) {
    setExtraMessages(prev => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), ...messages.map(item => ({ ...item, ownershipFlowId: flowId }))],
    }))
  }

  function handleSend(text) {
    const matches = stage === 'ask' ? /@everyone/i.test(text)
      : stage === 'update' ? /@copilot/i.test(text) && /updat|owner/i.test(text)
      : stage === 'suggest' ? /@copilot/i.test(text) && /suggest|who|owner/i.test(text)
      : false
    if (!matches) return false
    const token = `${root.id}:${stage}`
    if (handled.current.has(token)) return true
    handled.current.add(token)
    const chatId = activeChatId
    const flowId = root.id
    append(chatId, flowId, [message('me', mentions(text), { ownershipStage: stage === 'ask' ? 'replies' : stage })])

    if (stage === 'ask') {
      demo.replies.forEach((reply, index) => {
        schedule(() => append(chatId, flowId, [
          message(reply.senderId, reply.text, index === demo.replies.length - 1 ? { ownershipStage: 'update' } : {}),
        ]), (index + 1) * 700)
      })
    } else if (stage === 'update') {
      append(chatId, flowId, [message(copilotAgent.id,
        'Updated with ownership confirmed in this group: Rachel, James, and Olivia are covering three opportunities. Tailspin Toys is still unassigned; no active engagement has been confirmed.',
        { ownershipStage: 'suggest', widget: createDynamicsWidget(demo.confirmedOwners) },
      )])
    } else {
      const candidate = demo.candidates[0]
      append(chatId, flowId, [
        message(copilotAgent.id, `I suggest ${candidate.name} for Tailspin Toys. ${candidate.reason} This is a recommendation, not a confirmed assignment.`),
        message(copilotAgent.id, 'Please confirm the assignment, suggest a different person, or cancel. I will not notify anyone until you confirm.', {
          ownershipStage: 'approval',
          targetedTo: 'me',
          isPrivate: true,
          candidateId: candidate.id,
          cards: [approvalCard(candidate)],
        }),
      ])
    }
    return true
  }

  function changeCandidate(source, value) {
    if (source.id !== latest?.id || stage !== 'alternate') return
    const candidate = demo.candidates.find(person => person.id === Number(value))
    if (!candidate) return
    setExtraMessages(prev => ({
      ...prev,
      [activeChatId]: prev[activeChatId].map(item => item.id === source.id
        ? { ...item, candidateId: candidate.id, cards: [approvalCard(candidate, true)] }
        : item),
    }))
  }

  function handleAction(source, action) {
    if (source.id !== latest?.id || !['approval', 'alternate'].includes(stage)) return
    if (!['confirm-owner', 'different-owner', 'cancel-owner'].includes(action)) return
    if (handled.current.has(source.id)) return
    const chatId = activeChatId
    const flowId = root.id
    const candidate = demo.candidates.find(person => person.id === source.candidateId)
    if (action === 'different-owner') {
      if (stage !== 'approval') return
      const alternative = demo.candidates.find(person => person.id !== candidate.id)
      setExtraMessages(prev => ({
        ...prev,
        [chatId]: prev[chatId].map(item => item.id === source.id ? {
          ...item,
          ownershipStage: 'alternate',
          candidateId: alternative.id,
          cards: [approvalCard(alternative, true)],
        } : item),
      }))
      return
    }
    handled.current.add(source.id)
    const cancelled = action === 'cancel-owner'
    setExtraMessages(prev => ({
      ...prev,
      [chatId]: prev[chatId].map(item => item.id === source.id ? {
        ...item,
        cards: item.cards.map(card => ({
          ...card,
          actionsDisabled: true,
          badge: { text: cancelled ? 'Cancelled' : 'Notified · awaiting reply', tone: 'neutral' },
        })),
      } : item),
    }))
    if (cancelled) {
      append(chatId, flowId, [message(copilotAgent.id,
        'Cancelled. I have not notified anyone or assigned Tailspin Toys. It remains unassigned.',
        { targetedTo: 'me', isPrivate: true, ownershipStage: 'cancelled' },
      )])
    } else {
      append(chatId, flowId, [
        message(copilotAgent.id, `I have notified ${candidate.name} in a targeted message about the Tailspin Toys opportunity. Waiting for confirmation.`, {
          targetedTo: 'me', isPrivate: true, ownershipStage: 'notified',
        }),
        message(copilotAgent.id, 'Alex approved you as the proposed owner of Tailspin Toys. Can you confirm that you will cover the partner support automation opportunity?', {
          targetedTo: candidate.id, isPrivate: true,
        }),
      ])
      schedule(() => {
        append(chatId, flowId, [
          message(candidate.id, 'Confirmed - I will own Tailspin Toys and follow up with their support lead.', { targetedTo: copilotAgent.id }),
          message(copilotAgent.id, `${candidate.name} has confirmed the Tailspin Toys assignment. All four opportunities now have confirmed owners. Here is the updated widget for everyone.`, {
            ownershipStage: 'complete',
            widget: createDynamicsWidget({ ...demo.confirmedOwners, 'Tailspin Toys': candidate.name }),
          }),
        ])
      }, 2000)
    }
  }

  const hints = {
    ask: 'Ask the group who is already working with these customers.',
    replies: 'Group members are checking in...',
    update: 'Ask Copilot to add the ownership confirmed in this group.',
    suggest: 'Tailspin Toys is unassigned. Ask Copilot to suggest an owner.',
    approval: 'Review the targeted card below. Only you can see it.',
    alternate: 'Choose another person in the targeted card, then confirm.',
    notified: 'Owner notified privately. Waiting for their confirmation...',
    complete: 'All four owners confirmed. The updated widget is visible to the group.',
    cancelled: 'Assignment cancelled. Tailspin Toys remains unassigned.',
  }

  return {
    prompt,
    hint: hints[stage],
    handleSend,
    handleAction,
    changeCandidate,
  }
}
