import { useEffect, useRef } from 'react'
import { copilotAgent, createDynamicsWidget, createRevenueProjectionCard, formatDynamicsCloseDate, opportunityOwnershipDemo as demo } from '../data'

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

export default function useOpportunityOwnershipDemo({ activeChatId, extraMessages, setExtraMessages, onDynamicsUpdated }) {
  const timers = useRef(new Set())
  const handled = useRef(new Set())
  const chatMessages = extraMessages[activeChatId] || []
  const root = chatMessages.find(item => String(item.id).startsWith('shared-') && item.widget?.title === 'Dynamics opportunities')
  const flowMessages = root ? chatMessages.filter(item => item.ownershipFlowId === root.id) : []
  const latest = flowMessages.filter(item => item.ownershipStage).at(-1)
  const stage = root ? latest?.ownershipStage || 'ask' : null
  const assignment = flowMessages.find(item => item.opportunityOwners)
  const closeEstimates = flowMessages.filter(item => item.closeEstimate).map(item => item.closeEstimate)
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
      : stage === 'complete' ? /close|eta/i.test(text)
      : stage === 'project' ? /@copilot/i.test(text) && /project|revenue|growth/i.test(text)
      : false
    if (!matches) return false
    const token = `${root.id}:${stage}`
    if (handled.current.has(token)) return true
    handled.current.add(token)
    const chatId = activeChatId
    const flowId = root.id
    append(chatId, flowId, [message('me', mentions(text), {
      ownershipStage: stage === 'ask' ? 'replies' : stage === 'complete' ? 'eta-replies' : stage,
    })])

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
    } else if (stage === 'suggest') {
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
    } else if (stage === 'complete') {
      demo.closeEstimates.forEach((estimate, index) => {
        schedule(() => {
          const replies = [message(
            estimate.senderId || assignment.tailspinOwnerId,
            `${estimate.customer}: targeting ${formatDynamicsCloseDate(estimate.closeDate)} to close. ${estimate.note}`,
            { closeEstimate: { customer: estimate.customer, closeDate: estimate.closeDate } },
          )]
          if (index === demo.closeEstimates.length - 1) {
            replies.push(message(copilotAgent.id,
              'I have a close ETA for each opportunity. Would you like me to update the opportunities widget with these ETAs?',
              {
                ownershipStage: 'eta-approval',
                cards: [{
                  accentColor: '#5B5FC7',
                  iconType: 'teams',
                  title: 'Add close ETAs to the opportunities widget?',
                  subtitle: 'Keep confirmed owners and estimated revenue unchanged.',
                  facts: [{ label: 'Close ETAs received', value: '4 of 4 opportunities' }],
                  actions: [{ id: 'update-etas', label: 'Yes, update widget', primary: true }],
                }],
              },
            ))
          }
          append(chatId, flowId, replies)
        }, (index + 1) * 700)
      })
    } else if (stage === 'project') {
      const projection = message(copilotAgent.id,
        'Here is the projected revenue growth from these four deals, based on the close ETAs you shared. The bars show cumulative deal value, not guaranteed revenue.',
        { ownershipStage: 'projection-reactions', cards: [createRevenueProjectionCard(closeEstimates)] },
      )
      append(chatId, flowId, [projection])
      demo.projectionReactions.forEach((_, index) => {
        schedule(() => {
          const reactions = []
          for (const reaction of demo.projectionReactions.slice(0, index + 1)) {
            let group = reactions.find(item => item.emoji === reaction.emoji)
            if (!group) {
              group = { emoji: reaction.emoji, count: 0, participantIds: [], byMe: false }
              reactions.push(group)
            }
            group.count += 1
            group.participantIds.push(reaction.senderId)
            group.byMe ||= reaction.senderId === 'me'
          }
          setExtraMessages(prev => ({
            ...prev,
            [chatId]: prev[chatId].map(item => item.id === projection.id ? {
              ...item,
              reactions,
              ownershipStage: index === demo.projectionReactions.length - 1 ? 'forecast-complete' : 'projection-reactions',
            } : item),
          }))
          if (index === demo.projectionReactions.length - 1) {
            append(chatId, flowId, [message(copilotAgent.id,
              'Would you like me to update Dynamics through Dynamics MCP with the latest information from this Teams collaboration?',
              {
                ownershipStage: 'sync-approval',
                targetedTo: 'me',
                isPrivate: true,
                cards: [{
                  accentColor: '#5B5FC7',
                  iconType: 'teams',
                  title: 'Update Dynamics with the latest information?',
                  subtitle: 'Save the confirmed owners and close ETAs for all four opportunities.',
                  badge: { text: 'Awaiting your approval', tone: 'amber' },
                  footer: 'Prototype update · No live Dynamics connection',
                  actions: [{ id: 'sync-dynamics', label: 'Yes, update Dynamics', primary: true }],
                }],
              },
            )])
          }
        }, (index + 1) * 500)
      })
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
    if (source.id === latest?.id && stage === 'sync-approval' && action === 'sync-dynamics') {
      if (handled.current.has(source.id)) return
      handled.current.add(source.id)
      setExtraMessages(prev => ({
        ...prev,
        [activeChatId]: prev[activeChatId].map(item => item.id === source.id ? {
          ...item,
          cards: item.cards.map(card => ({
            ...card,
            actionsDisabled: true,
            badge: { text: 'Updated in Dynamics', tone: 'green' },
          })),
        } : item),
      }))
      append(activeChatId, root.id, [message(copilotAgent.id,
        'Done — I have updated Dynamics with the confirmed owners and close ETAs. Open Copilot on the left rail to review the updated opportunities and revenue projection.',
        { ownershipStage: 'synced', targetedTo: 'me', isPrivate: true },
      )])
      onDynamicsUpdated({
        id: `dynamics-update-${root.id}-${activeChatId}`,
        chatId: activeChatId,
        sourceMessageId: root.id.replace(/^shared-/, ''),
        widget: flowMessages.findLast(item => item.widget?.hasEtas).widget,
        projectionCard: flowMessages.findLast(item => item.cards?.some(card => card.bars)).cards[0],
      })
      return
    }
    if (source.id === latest?.id && stage === 'eta-approval' && action === 'update-etas') {
      if (handled.current.has(source.id)) return
      handled.current.add(source.id)
      setExtraMessages(prev => ({
        ...prev,
        [activeChatId]: prev[activeChatId].map(item => item.id === source.id ? {
          ...item,
          cards: item.cards.map(card => ({ ...card, actionsDisabled: true })),
        } : item),
      }))
      append(activeChatId, root.id, [message(copilotAgent.id,
        'Updated the widget with the close ETAs confirmed by each opportunity owner. These are estimates, not commitments.',
        { ownershipStage: 'project', widget: createDynamicsWidget(assignment.opportunityOwners, closeEstimates) },
      )])
      return
    }
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
            opportunityOwners: { ...demo.confirmedOwners, 'Tailspin Toys': candidate.name },
            tailspinOwnerId: candidate.id,
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
    complete: 'All four opportunities have confirmed owners. Ask them for their close ETAs.',
    'eta-replies': 'Opportunity owners are sharing their expected close dates...',
    'eta-approval': 'Copilot has collected the close ETAs. Click Yes to update the public widget.',
    project: 'The widget now includes close ETAs. Ask Copilot to project revenue growth.',
    'projection-reactions': 'The group is reacting to the revenue projection...',
    'forecast-complete': 'Revenue projection shared. The group has reacted with Like and Love.',
    'sync-approval': 'Only you can see the Dynamics update card. Click Yes to save the latest information.',
    synced: 'Dynamics updated. Click Copilot on the left rail, then Show updates.',
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
