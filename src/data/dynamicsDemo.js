const opportunities = [
  { customer: 'Contoso Retail', topic: 'Agent-assisted partner onboarding', revenue: 240000 },
  { customer: 'Fabrikam Logistics', topic: 'Operations agent rollout', revenue: 180000 },
  { customer: 'Adventure Works', topic: 'Customer service handoff', revenue: 150000 },
  { customer: 'Tailspin Toys', topic: 'Partner support automation', revenue: 95000 },
]

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})
const totalRevenue = opportunities.reduce((sum, opportunity) => sum + opportunity.revenue, 0)

export function formatDynamicsCloseDate(date) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function createDynamicsWidget(owners, closeEstimates = []) {
  const hasOwners = !!owners
  const hasEtas = closeEstimates.length > 0
  return {
    title: 'Dynamics opportunities',
    mimeType: 'text/html',
    hasOwners,
    hasEtas,
    html: `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
<style>
* { box-sizing: border-box; }
body { margin: 0; padding: 20px; background: #FFFFFF; color: #242424; font: 14px/1.4286 -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; }
header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 20px; }
.source { color: #5B5FC7; font-size: 12px; font-weight: 600; }
h1 { margin: 4px 0 0; font-size: 20px; font-weight: 600; }
.badge { padding: 5px 9px; border: 1px solid #E8E8E8; border-radius: 6px; font-size: 11px; color: #616161; white-space: nowrap; }
table { width: 100%; border-collapse: collapse; table-layout: fixed; }
th { padding: 10px 8px; background: #F5F5F5; color: #616161; font-size: 12px; font-weight: 600; text-align: left; }
td { padding: 14px 8px; border-bottom: 1px solid #E8E8E8; overflow-wrap: anywhere; vertical-align: top; }
th:first-child { width: 31%; }
th:nth-child(2) { width: 44%; }
th:last-child { width: 25%; text-align: right; }
td:last-child { text-align: right; font-weight: 600; white-space: nowrap; }
tfoot td { padding-top: 16px; border-bottom: 0; font-weight: 600; }
.ownership th:first-child { width: 23%; }
.ownership th:nth-child(2) { width: 30%; }
.ownership th:nth-child(3) { width: 22%; text-align: right; }
.ownership th:last-child { width: 25%; text-align: left; }
.ownership td:nth-child(3) { text-align: right; white-space: nowrap; }
.ownership td:last-child { text-align: left; white-space: normal; font-size: 12px; }
.ownership tfoot td:last-child { text-align: right; white-space: nowrap; font-size: 14px; }
.ownership small { display: block; margin-top: 4px; color: #616161; font-weight: 400; }
.ownership .close-eta { margin-top: 8px; }
.close-eta time { display: block; color: #242424; }
.unassigned { color: #B14E0F; }
footer { margin-top: 12px; color: #616161; font-size: 11px; }
@media (max-width: 480px) { body { padding: 12px; } td { padding: 12px 6px; font-size: 12px; } th { padding: 8px 6px; font-size: 11px; } h1 { font-size: 18px; } }
</style>
</head>
<body>
<header><div><div class="source">Dynamics 365 Sales</div><h1>Open opportunities</h1></div><span class="badge">Dynamics MCP</span></header>
<table class="${hasOwners ? 'ownership' : ''}" aria-label="All open Dynamics opportunities">
<thead><tr><th scope="col">Potential customer</th><th scope="col">Topic</th><th scope="col">Estimated revenue</th>${hasOwners ? `<th scope="col">${hasEtas ? 'Owner / close ETA' : 'Confirmed owner'}</th>` : ''}</tr></thead>
<tbody>${opportunities.map(opportunity => {
    const owner = owners?.[opportunity.customer]
    const closeDate = closeEstimates.find(estimate => estimate.customer === opportunity.customer)?.closeDate
    const eta = closeDate ? `<small class="close-eta">Close ETA<time datetime="${closeDate}">${formatDynamicsCloseDate(closeDate)}</time></small>` : ''
    return `<tr><td>${opportunity.customer}</td><td>${opportunity.topic}</td><td>${currency.format(opportunity.revenue)}</td>${hasOwners ? `<td>${owner ? `${owner}<small>Confirmed</small>${eta}` : '<span class="unassigned">Unassigned</span><small>No active engagement</small>'}</td>` : ''}</tr>`
  }).join('')}</tbody>
<tfoot><tr><td colspan="${hasOwners ? 3 : 2}">Total estimated revenue</td><td>${currency.format(totalRevenue)}</td></tr></tfoot>
</table>
<footer>${opportunities.length} open opportunities · USD · ${hasEtas ? 'Owner-provided close estimates, not commitments · ' : ''}Sample Dynamics MCP result</footer>
</body>
</html>`,
  }
}

export function createRevenueProjectionCard(closeEstimates) {
  let cumulative = 0
  const points = [...closeEstimates]
    .sort((a, b) => a.closeDate.localeCompare(b.closeDate))
    .map(estimate => {
      const opportunity = opportunities.find(item => item.customer === estimate.customer)
      cumulative += opportunity.revenue
      return { ...estimate, revenue: opportunity.revenue, cumulative }
    })
  return {
    accentColor: '#5B5FC7',
    iconType: 'teams',
    title: 'Projected revenue growth',
    subtitle: 'Cumulative opportunity value by expected close date · USD',
    badge: { text: 'Illustrative forecast', tone: 'purple' },
    metrics: [
      { label: 'Potential additional booked revenue', value: currency.format(cumulative) },
      { label: 'Deals with owner-provided ETAs', value: String(points.length) },
    ],
    bars: points.map(point => ({
      label: formatDynamicsCloseDate(point.closeDate),
      value: point.cumulative,
      valueLabel: currency.format(point.cumulative),
    })),
    sections: [
      {
        heading: 'Expected closes',
        bullets: points.map(point => `${formatDynamicsCloseDate(point.closeDate)}: ${point.customer} +${currency.format(point.revenue)}`),
      },
      {
        heading: 'Assumptions',
        text: 'Starts at $0 for these four deals only. Assumes every deal closes at its estimated value on the owner-provided ETA. Not probability-weighted, guaranteed revenue, or an accounting revenue-recognition forecast.',
      },
    ],
    footer: 'Sample sales scenario · Based on the group’s close ETAs',
  }
}

const widget = createDynamicsWidget()

export const dynamicsDemo = {
  title: 'Dynamics opportunities',
  prompt: 'Show me the top revenue opportunities in Dynamics',
  targetChatId: 21,
  reply: {
    role: 'assistant',
    text: 'Here are the top 4 revenue opportunities in Dynamics, ordered by estimated revenue, with potential customers and topics. The total estimated revenue is $665,000.',
    widget,
  },
}

export const opportunityOwnershipDemo = {
  prompts: {
    ask: '@Everyone is anyone already looking at some of these sales opportunities?',
    update: '@Copilot update the opportunities widget with confirmed ownership from this group.',
    suggest: '@Copilot who should take ownership of Tailspin Toys? suggest someone with previous customer engagement.',
    complete: '@Everyone confirmed owners, when do you expect to close your deals? please share a close ETA for each opportunity.',
    project: '@Copilot project the revenue growth based on these deal close ETAs.',
  },
  replies: [
    { senderId: 12, text: "i'm working with Contoso Retail on partner onboarding. happy to own that opportunity." },
    { senderId: 7, text: "i've got Fabrikam Logistics. we're scoping their operations agent rollout." },
    { senderId: 9, text: "i'm working with Adventure Works on the service handoff. no one is actively covering Tailspin Toys as far as i know." },
  ],
  confirmedOwners: {
    'Contoso Retail': 'Rachel Thompson',
    'Fabrikam Logistics': 'James Kim',
    'Adventure Works': 'Olivia Martinez',
  },
  candidates: [
    { id: 5, name: 'Emily Watson', reason: "Emily led Tailspin Toys' earlier partner-support pilot and already knows their support lead." },
    { id: 17, name: 'Natalie Brooks', reason: "Natalie joined Tailspin Toys' follow-up discovery sessions and has the account notes." },
    { id: 12, name: 'Rachel Thompson', reason: 'Rachel supported the earlier Tailspin Toys engagement, but is already covering Contoso Retail.' },
  ],
  closeEstimates: [
    { customer: 'Contoso Retail', senderId: 12, closeDate: '2026-05-15', note: 'Procurement review is the next step.' },
    { customer: 'Fabrikam Logistics', senderId: 7, closeDate: '2026-07-10', note: 'That leaves time for their operations pilot and budget sign-off.' },
    { customer: 'Adventure Works', senderId: 9, closeDate: '2026-06-12', note: 'Targeting that after the service handoff discovery and proposal review.' },
    { customer: 'Tailspin Toys', closeDate: '2026-08-07', note: 'I will validate the support automation scope with their support lead first.' },
  ],
  projectionReactions: [
    { senderId: 12, emoji: '👍' },
    { senderId: 7, emoji: '❤️' },
    { senderId: 9, emoji: '👍' },
    { senderId: 5, emoji: '❤️' },
    { senderId: 15, emoji: '👍' },
    { senderId: 1, emoji: '❤️' },
    { senderId: 17, emoji: '👍' },
    { senderId: 10, emoji: '👍' },
    { senderId: 'me', emoji: '❤️' },
  ],
}
