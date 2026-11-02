# Design Guide

## Color Palette

### Layout Surfaces

| Element | Hex | Usage |
|---------|-----|-------|
| Title Bar | `#EBEBEB` | Top header bar containing search and navigation |
| App Bar (Nav Rail) | `#EBEBEB` | Far-left vertical icon navigation |
| Search Bar | `#FAFAFA` | Search input in the title bar |
| Chat List | `#F5F5F5` | Chat list panel (right of the app bar) |
| Chat Canvas | `#FFFFFF` | Main area where chat messages are displayed |
| Agents Rail | `#FAFAFA` | Right-side rail for per-conversation agents |
| Channel Thread Rail | `#FFFFFF` | Right-side rail for a channel post's replies |
| Copilot Navigation | `#F5F5F5` | Microsoft 365 Copilot sidebar, inside the Teams frame |
| Copilot Workspace | `#FFFFFF` | Full-app Copilot canvas; replaces the chat list and canvas, not Teams chrome |

The title bar, app bar, and chat list form a cool neutral palette that matches current Microsoft Teams. The chat list is slightly lighter than the chrome so its surface reads as a container nested inside it. The search bar is the lightest surface in the header, floating on top of the title bar.

### Message Bubbles

| Element | Hex | Alignment |
|---------|-----|-----------|
| Other User | `#F5F5F5` | Left-aligned |
| Current User | `#E8EBFA` | Right-aligned |

### Chat List

| Element | Hex | Notes |
|---------|-----|-------|
| Chat item hover + selected | `#FCFBFA` | Same fill for both states — a chat doesn't get a separate "selected" treatment. Subtle off-white above the `#F5F5F5` panel. |
| Active tab text | `#242424` | Bold, no background fill |
| Inactive tab text | `#616161` | Regular weight, no background fill |

**Shape:** hover/selected fills render as a rounded rectangle with side insets (`margin: 0 8px`, `border-radius: 4px`, content `padding` reduced by the same amount) — the highlight does **not** stretch full-width of the panel. Applies uniformly to chat items, pinned items (Copilot / Quick views), team rows, and channel rows.

## Typography

Sourced from live Teams (dev-tools inspection).

### Font Stack

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui,
             'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Web', sans-serif;
```

Set globally on `body` in `src/index.css`. All components should inherit — avoid overriding `font-family` in component CSS.

### Base Body Text

- **Size:** `14px` (Teams expresses this as `1.4rem` on a `10px` root; we use px directly)
- **Line height:** `1.4286` (unitless, inherited; produces 20px for 14px text)

### Chat List Item Names

- Size: 14px
- Weight: `400` regular, `600` when the chat is bold/unread

### Chat Header Name

- Size: 18px
- Weight: `700`
- Line height: inherits the body `1.4286` (≈25.7px at 18px)

### Chat Header Tabs

- Size: 14px
- Weight: `400` inactive, `600` active
- Color: `#424242` inactive, `#242424` active
- Spacing: `6px` gap between tabs
- Truncation: `max-width: 150px` with `text-overflow: ellipsis` and `white-space: nowrap` — keeps long chat names from breaking the header layout
- Active tab marker: 3px underline in Teams purple (`#6264A7`), `2px` border-radius, spans the tab label width only (not the full button click area — rendered via `::after` on the content box)

## Avatar Sizing

Pass `size` to the common `Avatar` component. Established sizes:

| Surface | Size |
|---|---|
| Chat list item | `20` |
| Title bar (current user) | `28` |
| Chat view header | `28` |
| Message row | `32` |
| Agents rail list + detail header | `24` |
| Prompt-suggestions empty state | `72` |

The status dot scales automatically (~28% of avatar size, min 6px) — no need to tune it per surface. Matches real Teams: 20px avatar → 6px dot, 28px → 8px, 32px → 9px, 36px → 10px.

### Avatar Shape

- **People, groups, agents:** circle (`border-radius: 50%`).
- **Channels** (`contact.isChannel`): rounded square. Radius is ~18% of size (min 3px) so it scales with the surface — matches the way Teams visually distinguishes channels from chats in the unified chat list.

## Dividers

Standard divider used throughout the app (chat list header rows, chat view tab bar, section separators):

- **Style:** `1px solid #E8E8E8`
- Use consistently anywhere a subtle horizontal rule is needed between sections.

## Iconography

When you need a new icon, start your search at [fluenticons.co](https://fluenticons.co/) — it's the Fluent UI icon set that matches Teams' visual language.

Before adding an icon inline, check `src/components/common/Icon.jsx` — the shared library already covers common cases (`Close`, `Plus`, `ChevronDown`, `ChevronLeft`, `Send`, `Clock`, `Search`, `Dots`, `EmojiAdd`, `Edit`, `Lock`). Add new reusable icons there rather than inlining SVG in feature components.

### App Bar (Nav Rail) Icons

- **Size:** 24×24 SVG inside a 28×28 wrap (larger than Teams' typical 20px — the icons read more clearly at this size and the prototype skews the detail up slightly)
- **Inactive state:** Outlined icons, `#666666`
- **Active state:** Filled icons, Teams purple (`#5B5FC7`); same color drives a 3px left-edge active indicator spanning the **full height of the nav-item row** (flush top to bottom, not capped) and an 8% tinted background fill (`rgba(91, 95, 199, 0.08)`)
- **Clickable surfaces:** `chat` and `activity` toggle the left pane (ChatList ↔ ActivityList). `copilot`, below Calls, opens the full Copilot workspace. Others are decorative for now.

## Copilot in Teams

Copilot follows the Microsoft 365 Copilot chat layout embedded below the Teams title bar and to the right of the Teams app bar. Keep both pieces of Teams chrome visible; this is an app surface, not a 1:1 chat or a browser iframe.

- **Navigation:** 260px neutral sidebar with Microsoft 365 Copilot branding, New chat, conversation search, Chat, pinned agents, and recent conversations. Use inset rounded hover/selected rows.
- **Header:** 64px with sidebar toggle, app/agent name, and a rounded Work/Web grounding control.
- **Empty state:** centered Copilot logo, greeting, 30px/600 heading, prompt composer, then three scenario-specific suggestion cards. Do not hardcode the current user's name.
- **Composer:** 16px radius, thin neutral border, purple focus ring, reference action, and circular purple send button. Enter sends; Shift+Enter adds a line.
- **Conversation:** right-aligned user prompts on `#E8EBFA`; unboxed Copilot answers on white, with compact clickable Teams reference chips. The composer stays below the scrollable history.
- **Prototype behavior:** use mocked Northwind context and label responses as sample data. Web mode must not imply access to work content or live web search.
- **Responsive:** narrow the sidebar on smaller screens, stack suggestion cards below 800px, and allow the sidebar to be collapsed.

### Dynamics MCP sharing demo

- Launch in Copilot with **Show me the top revenue opportunities in Dynamics** prefilled. After Send, show **Connecting to Dynamics MCP...** for **2 seconds**, then replace the status with the opportunity result and enable Share. Guide Send, Share, and Open group chat with ephemeral `DemoArrow` hints. This connection step is simulated, not a live MCP call.
- Keep the opening Copilot scene free of a demo-note banner above the prompt composer; retain the prefilled prompt and Send hint.
- The Dynamics MCP result is a **self-contained HTML widget**, not an Adaptive Card or screenshot. This scenario intentionally preserves the tool-returned HTML; render it with the shared `McpWidget` in both Copilot and Teams.
- Widget anatomy: Dynamics 365 Sales heading, Dynamics MCP badge, potential-customer / topic / estimated-revenue table, USD total, and sample-data footer. Use existing neutral surfaces, dividers, typography, and Teams purple.
- Isolate HTML in a scriptless, sandboxed iframe. Share the original message text and unchanged widget HTML, never rebuild a different Teams summary.
- Share is a secondary action beneath the answer. It opens a Teams-style modal with group-chat search, single selection, Cancel, and Send. Preselect **Northwind Sales** on every opening so Send is immediately enabled and guided, while allowing users to search and choose another group. Opening or cancelling the modal must not post a message.
- Send posts the unchanged payload to the selected group. Confirm the actual destination without navigating automatically; the viewer clicks Open group chat or the guided group row. The modal traps focus, supports Escape dismissal, and guides its Send action after selection.
- Teams displays the shared message as an incoming **Copilot** agent message. Mark the group unread on share, highlight the shared message on opening, and remove hints after their targets are clicked.

### Opportunity ownership walkthrough

- After sharing, prefill Alex's next message and guide Send with `DemoArrow`: mention Everyone, collect three check-ins, ask Copilot to add confirmed owners, then request a recommendation for the uncovered Tailspin Toys opportunity.
- Ownership widgets retain the original customers, topics, revenues, and total, adding a **Confirmed owner** column. Explicitly label the uncovered opportunity **Unassigned / No active engagement**. Keep the original shared widget unchanged; publish new widgets as ownership is confirmed.
- Recommendations and final accepted ownership are public. Approval cards and acknowledgements are **targeted to Alex**, with a lock disclaimer, thin neutral border, `#FAFAFA` fill, and no implication that the group sees them.
- Use an Adaptive Card with proposed owner, prior engagement, and **Confirm assignment**, **Suggest a different person**, and **Cancel**. Confirm is a purple primary button; other actions are neutral. **Suggest a different person** reveals an accessible owner dropdown in place within the same card, without sending another message or card. Keep Confirm and Cancel enabled while choosing. Disable settled actions and remove their hint arrows.
- Confirm first acknowledges the privately notified person to Alex. After **2 seconds**, simulate their private acceptance and publish a new group-visible widget with all four confirmed owners. Cancel sends no notification or public assignment. The demo must hide other recipients' targeted messages from Alex, and timers must keep updating the originating group after navigation.

### Close ETAs and revenue projection

- After ownership is confirmed, guide Alex to ask the owners for close dates. Each opportunity gets a public owner reply. Use the actual chosen Tailspin owner, not always Emily.
- Copilot proactively offers to add ETAs in a **public** Adaptive Card with **Yes, update widget**. Do not update the widget before approval. After Yes, publish a new HTML widget with close dates beneath each confirmed owner in the **Owner / close ETA** column; preserve the prior widgets and all opportunity values.
- Alex then asks for revenue growth. Reuse the Adaptive Card bar-chart and metric patterns: chronological close dates, cumulative deal value in USD, clear incremental closes, and a $0 baseline for these opportunities only. Label the chart **Illustrative forecast** and explain that full estimated values closing on owner-provided dates are assumed, not guaranteed or accounting-recognized revenue. Do not invent percentage growth without an existing revenue baseline.
- Script native Like/Love reaction pills counting up under the chart for the nine group participants at **2 reactions per second**, reaching 5 Likes and 4 Loves after about 4.5 seconds. Preserve Alex's ability to add/remove reactions without double-counting a scripted reaction; participant names are available on hover.

### Dynamics write-back and return to Copilot

- After the last reaction, send a **targeted-to-Alex** Adaptive Card asking permission to update Dynamics through Dynamics MCP. **Yes, update Dynamics** settles the card, simulates writing confirmed owners and close ETAs, and sends a targeted completion message. Do not write back or show a completion notification before approval.
- Guide the viewer to the existing Copilot app-rail button with an ephemeral `DemoArrow`. Do not navigate automatically; remove the rail hint when clicked.
- On opening Copilot, return to the originating Dynamics conversation and show a neutral, outlined **System message** that Dynamics MCP was updated from the named Teams collaboration. Guide **Show updates**. This explicit action reveals the unchanged latest owner/ETA HTML widget and the same revenue projection card; preserve the original conversation and results.
- Use the shared `AdaptiveCard` renderer on both Teams and Copilot. Keep the system notification visually distinct from an agent answer, retain sample-data disclaimers, and do not imply a live Dynamics integration.

## Message Patterns

### Bubble / compose alignment

Bubble edges line up with the edges of the compose field in all chat canvases (1:1, group, and channel) so the conversation reads as a single vertical column anchored to the same left/right rails as input:

- Others' bubble **left** edge aligns with compose left edge
- Mine bubble **right** edge aligns with compose right edge
- Avatars extend **past** those rails (to the left for others, to the right for mine in group chats)

Implemented by setting `.messages-container` side padding to `24px` (matching `.chat-compose`), then pulling the message row horizontally with `margin-left: -40px` (others) / `margin-right: -40px` (mine + avatar) so the 32px avatar + 8px gap lands outside the compose rail. In 1:1 chats my own messages have no avatar, so the mine row sits flush with no negative margin.

### Reactions

Reaction pills render under the bubble (left-aligned for others' messages, right-aligned for mine). Pills are oval (`border-radius: 12px`, `height: 24px`), white background with a `1px solid #E0E0E0` border. A reaction the current user has added flips the border to Teams purple (`#6264A7`) so "mine" vs "theirs" is visually clear.

- **Hover toolbar** (`MessageActions`) appears above the bubble on hover: four quick-reaction emojis (`👍 ❤️ 😂 😮`), a full emoji-picker trigger, a divider, then `Edit` and `More options`. Quick reactions toggle the current-user flag on that emoji when clicked.

### Thread reply indicator

Under a bubble that has replies (channel posts with `replies`, private agent threads with a `threadReply` badge), a small pill shows:
- Up to 3 participant avatars (18px, overlapping `-6px` with a 1.5px white ring)
- `1 reply` / `N replies` label in 12px/600 Teams purple (`#6264A7`)
- Hover fills with `#F0F0F0`

Click behavior depends on surface:
- **Channel post:** opens `ChannelThreadRail` with root + replies + compose
- **Private agent thread (Jira demo flow):** toggles the `AgentsRail` open/closed on the agent who owns the thread

### Private (only-you) bubble

Used for the anchor message of an agent thread that's visible only to the user and the agent:
- A `PrivateDisclaimer` strip at the top: lock icon + `Only you can see this conversation` in 11px `#616161`
- A thin `1px solid #BDBDBD` border around the whole bubble
- Background stays the standard mine color (`#E8EBFA`)

### Channel posts

Channel chats render a "Threads" layout. Each post has a `subject` (15px/600) rendered inside the bubble above the body. Posts live in `src/data/channelPosts.js` keyed by channel contact id. Replies are shown in `ChannelThreadRail`, not in the main canvas — the main canvas only shows the root posts.

Channel post bubbles get a slightly wider max-width (`80%` vs the default `65%`) because they tend to be announcement-style and run longer.

### Prompt suggestions

New-session empty state for an agent chat: centered 72px avatar + agent name + short description + a 2×3 grid of suggestion cards. Defined in `src/data/promptSuggestions.js` keyed by agent contact id; each card has a `title`, `description`, the `text` to send, and a canned `response`.

## Adaptive Cards

**Agents send rich, interactive content via the [Adaptive Cards framework](https://adaptivecards.microsoft.com/)** — the format the Teams team recommends for agent-authored content. When the user asks you to have an agent send content (status summaries, ticket details, action prompts, etc.), reach for an adaptive card rather than freeform text when the content is structured.

In the prototype's message model, adaptive cards attach to a message via `message.cards` — an array of card objects. The shared `components/common/AdaptiveCard.jsx` renderer, used by `MessageRow` and `CopilotView`, currently supports:

```js
{
  accentColor: '#5B5FC7',                  // left border color (3px stripe)

  // Header row — optional Office-app icon tile + title + optional badge.
  iconType: 'word',                        // 'word' | 'excel' | 'powerpoint' | 'outlook' | 'teams'
  title: 'Northwind partner readout — Brief.docx',
  subtitle: 'One-pager covering scope, status, key risks, and partner asks.',
  badge: { text: 'Ready', tone: 'green' }, // tone: 'amber' | 'green' | 'purple' | 'neutral'

  // Plan steps with status pips (pending → running → done).
  steps: [
    { text: 'Aggregate context from the last 30 days', status: 'done' },
    { text: 'Pull external signals with citations', status: 'running' },
    { text: 'Draft one-page brief in Word', status: 'pending' },
  ],

  // Grouped sections — each can mix headings, bullets, free text, and facts.
  sections: [
    { heading: 'Sources', bullets: ['Northwind launch channel', '3 partner email threads'] },
    { heading: 'Output', text: 'One-page Word summary with inline citations.' },
  ],

  // Inline label/value pairs (still useful for compact metadata).
  facts: [
    { label: 'Citations', value: '8 sources' },
    { label: 'Saved to', value: 'Northwind / Launch /' },
  ],

  // Subtle metadata strip with a top divider — good for "Generated by..." lines.
  footer: 'Generated by Cowork · Mon 9:11 AM',

  // Link-style action buttons.
  actions: ['Open in Word', 'Show citations'],
}
```

Schema rules:
- **Interactive actions** may be objects `{ id, label, primary? }` instead of legacy string labels. `MessageRow` dispatches `onCardAction(message, id)`; `actionsDisabled` settles all actions. Optional `choice: { label, value, options: [{ value, label }] }` dispatches `onCardChoice(message, value)`.
- **Office-app icon tiles** (`iconType: 'word' | 'excel' | 'powerpoint' | 'outlook' | 'teams'`) render a 32px rounded-square tile with the brand color and capital letter — use them for **artifact cards** so generated deliverables read as M365 outputs at a glance. Pair with `accentColor` matching the brand color (`#2B579A` Word, `#217346` Excel, `#B7472A` PowerPoint, `#0078D4` Outlook, `#5B5FC7` Teams).
- **Plan cards** should use `iconType: 'teams'`, `badge: { text: 'Awaiting approval', tone: 'amber' }`, and `steps` with all `status: 'pending'`. Use `actions: ['Approve & run', 'Edit plan']` (or similar) so the plan reads as a checkpoint.
- **Artifact cards** (a deliverable Cowork produced) should use the matching Office `iconType`, a `subtitle` describing what the artifact is, optionally a `badge: { text: 'Ready', tone: 'green' }`, and a `footer: 'Generated by Cowork · <time>'`.
- **Daily/recurring outputs** (digests, summaries, reports) should use `sections` with one heading per theme — preserves the "scannable, themed" reading pattern users expect from agent reports.

Real Adaptive Cards support richer elements still (images, input fields, action sets, containers, choice sets). Extend `components/common/AdaptiveCard.jsx` and its sibling CSS as the prototype needs them — match the [official Adaptive Cards samples](https://adaptivecards.microsoft.com/) and the [design best-practices guide](https://adaptivecards.microsoft.com/?topic=design-best-practices) for visual fidelity.

## Teams and channels

Channels appear in the chat list grouped under their parent team:
- Teams are defined in `contacts.js` via the `teams` export (id, name, initials, color, `channels: [{ id, bold? }]`).
- Team icons use the rounded-square treatment (same as channel avatars), indent-aligned with their channel rows.
- Clicking a channel selects it; channel chats use the "Conversation" / "Shared" tabs (vs "Chat" / "Shared" / "Recap" / "Storyline" for regular chats).

## Demo Hint Arrows

Red pulsing arrows (`#E8173A`) cue the viewer to the next click target during a prototype walkthrough. Use the reusable **`DemoArrow`** component in `components/common/` — do not inline a new SVG arrow.

**Visual spec:**
- Color: `#E8173A`
- Animation: ~1.5s opacity (`1` → `0.4`) + `translate` nudge (3px) toward the target
- Directions: `'left' | 'right' | 'up' | 'down'`
- Size: 24px default, caller-tunable

**Usage rules:**
- **Positioning is the caller's job.** Typically `position: absolute` anchored near the target, inside a wrapper with `pointer-events: none` so clicks pass through to the target underneath. Wrap `DemoArrow` in a positioning `<span>` / `<div>` rather than relying on the arrow's own layout.
- **Arrows are ephemeral.** Track a `show/hide` state wherever the target's click handler lives and unmount the arrow once the target is clicked so it doesn't linger after the action is taken. Clearing persistently (rather than toggling) matches demo/tutorial conventions.
- One arrow per target at a time — don't stack hints.

The disabled scripted Jira flow in `ChatView.jsx` retains pre-`DemoArrow` inline arrow styles (`.main-compose-hint-arrow`, `.demo-hint-arrow-send` in `Compose.css`; `.agent-chat-hint-arrow` in `AgentsRail.css`) as a reference pattern only. Any new walkthrough should use `DemoArrow` instead.
