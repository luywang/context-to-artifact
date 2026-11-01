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

const widget = {
  title: 'Dynamics opportunities',
  mimeType: 'text/html',
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
footer { margin-top: 12px; color: #616161; font-size: 11px; }
@media (max-width: 480px) { body { padding: 12px; } td { padding: 12px 6px; font-size: 12px; } th { padding: 8px 6px; font-size: 11px; } h1 { font-size: 18px; } }
</style>
</head>
<body>
<header><div><div class="source">Dynamics 365 Sales</div><h1>Open opportunities</h1></div><span class="badge">Dynamics MCP</span></header>
<table aria-label="All open Dynamics opportunities">
<thead><tr><th scope="col">Potential customer</th><th scope="col">Topic</th><th scope="col">Estimated revenue</th></tr></thead>
<tbody>${opportunities.map(opportunity => `<tr><td>${opportunity.customer}</td><td>${opportunity.topic}</td><td>${currency.format(opportunity.revenue)}</td></tr>`).join('')}</tbody>
<tfoot><tr><td colspan="2">Total estimated revenue</td><td>${currency.format(totalRevenue)}</td></tr></tfoot>
</table>
<footer>${opportunities.length} open opportunities · USD · Sample Dynamics MCP result</footer>
</body>
</html>`,
}

export const dynamicsDemo = {
  title: 'Dynamics opportunities',
  prompt: 'show me all opportunities in Dynamics.',
  targetChatId: 21,
  reply: {
    role: 'assistant',
    text: 'Here are all 4 open opportunities in Dynamics, with potential customers, topics, and estimated revenue. The total estimated revenue is $665,000.',
    widget,
  },
}
