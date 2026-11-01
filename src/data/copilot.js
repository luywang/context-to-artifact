export const copilotReferences = [
  { label: 'Northwind launch', chatId: 23 },
  { label: 'Launch readiness', chatId: 27 },
  { label: 'Northwind General', chatId: 25 },
]

export const copilotPrompts = [
  {
    id: 'catch-up',
    title: 'Catch up on Northwind',
    description: 'Get the latest on launch readiness',
    text: 'catch me up on Northwind launch readiness. what needs my attention?',
    response: 'The April 25 milestone is the focus. Start with the launch-readiness thread, then confirm the remaining auth and migration-docs work with Kevin Park and David Nguyen.\n\nJames Kim has the handoff reason enum live in staging. Ask Emma Larsen to include timeout and fallback paths in the smoke-test readout.\n\nBefore the next checkpoint with Rachel Thompson, separate launch blockers from follow-up work so the go/no-go discussion stays focused.',
    sources: [{ label: 'Launch readiness', chatId: 27 }, { label: 'Northwind launch', chatId: 23 }],
  },
  {
    id: 'draft',
    title: 'Draft a stakeholder update',
    description: 'Turn launch context into a concise readout',
    text: 'draft a short Northwind launch update for Rachel. keep it focused on risks and next steps.',
    response: 'Here is a draft to review before sending:\n\nRachel - quick checkpoint on Agents Platform v2 ahead of April 25. Handoff telemetry is in staging; the next step is a smoke-test readout covering timeout and fallback paths.\n\nI want to confirm auth readiness with Kevin and the migration-guide status with David before calling the remaining work launch-ready. Can we use the next checkpoint to agree on the blocker list, owners, and go/no-go criteria?',
    sources: [{ label: 'Rachel Thompson', chatId: 12 }, { label: 'Northwind launch', chatId: 23 }],
  },
  {
    id: 'prepare',
    title: 'Prepare for the API review',
    description: 'Pull together the decisions and pre-reads',
    text: 'help me prepare for the Northwind API review. what decisions should we make?',
    response: 'Use the 45-minute review to land three decisions: manifest schema v2 required/optional semantics, plugin lifecycle hooks, and the v1 endpoint sunset policy.\n\nBring the nested-parameter edge case for the schema discussion. David has suggested a nine-month default sunset, with twelve months only when a major partner flags migration risk.\n\nThe pre-reads are in Agent Platform / API Review / April 24. Send Rachel the decision list beforehand so the easy questions can be resolved async.',
    sources: [{ label: 'Northwind General', chatId: 25 }],
  },
]

export const copilotAgents = [
  { id: 'researcher', name: 'Researcher', initials: 'R', color: '#5B5FC7', isAgent: true, description: 'Explore a topic and build a grounded brief', promptId: 'prepare' },
  { id: 'analyst', name: 'Analyst', initials: 'A', color: '#0078D4', isAgent: true, description: 'Make sense of data and find the next question', promptId: 'catch-up' },
]

export const copilotConversations = copilotPrompts.map(prompt => ({
  id: `copilot-${prompt.id}`,
  title: prompt.title,
  agentId: null,
  mode: 'Work',
  messages: [
    { role: 'user', text: prompt.text },
    { role: 'assistant', text: prompt.response, sources: prompt.sources },
  ],
}))
