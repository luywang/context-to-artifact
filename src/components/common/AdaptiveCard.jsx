import { Check } from './Icon'
import DemoArrow from './DemoArrow'
import './AdaptiveCard.css'

const icons = {
  word: { letter: 'W', bg: '#2B579A' },
  excel: { letter: 'X', bg: '#217346' },
  powerpoint: { letter: 'P', bg: '#B7472A' },
  outlook: { letter: 'O', bg: '#0078D4' },
  teams: { letter: 'T', bg: '#5B5FC7' },
}

function Facts({ facts }) {
  return <div className="card-facts">{facts.map((fact, i) => (
    <span key={i} className="card-fact"><span className="card-fact-label">{fact.label}:</span> {fact.value}</span>
  ))}</div>
}

export default function AdaptiveCard({ card, onAction, onChoice }) {
  const icon = icons[card.iconType]
  const max = card.bars?.reduce((value, bar) => Math.max(value, bar.value), 0) || 1
  return (
    <div className={`adaptive-card${card.actions?.some(action => typeof action === 'object') ? ' adaptive-card-interactive' : ''}`} style={{ borderLeftColor: card.accentColor }}>
      <div className="card-header">
        {icon && <div className="card-icon" style={{ background: icon.bg }}>{icon.letter}</div>}
        <div className="card-header-text">
          <div className="card-title-row">
            <span className="card-title">{card.title}</span>
            {card.badge && <span className={`card-badge card-badge-${card.badge.tone || 'neutral'}`}>{card.badge.text}</span>}
          </div>
          {card.subtitle && <div className="card-subtitle">{card.subtitle}</div>}
        </div>
      </div>
      {card.steps && <ol className="card-steps">{card.steps.map((step, i) => (
        <li key={i} className={`card-step card-step-${step.status || 'pending'}`}>
          <span className="card-step-marker" aria-hidden="true">{step.status === 'done' ? <Check size={11} /> : i + 1}</span>
          <span className="card-step-text">{step.text}</span>
        </li>
      ))}</ol>}
      {card.metrics && <div className="card-metrics">{card.metrics.map((metric, i) => (
        <div key={i} className="card-metric">
          <div className="card-metric-value">{metric.value}</div>
          <div className="card-metric-label">{metric.label}</div>
          {metric.delta && <div className={`card-metric-delta card-metric-delta-${metric.deltaTone || 'neutral'}`}>{metric.delta}</div>}
        </div>
      ))}</div>}
      {card.bars && <div className="card-bars">{card.bars.map((bar, i) => (
        <div key={i} className="card-bar-row">
          <div className="card-bar-label">{bar.label}</div>
          <div className="card-bar-track"><div className="card-bar-fill" style={{ width: `${bar.value / max * 100}%`, background: bar.color || undefined }} /></div>
          <div className="card-bar-value">{bar.valueLabel || bar.value}</div>
        </div>
      ))}</div>}
      {card.sections && <div className="card-sections">{card.sections.map((section, i) => (
        <div key={i} className="card-section">
          {section.heading && <div className="card-section-heading">{section.heading}</div>}
          {section.text && <div className="card-section-text">{section.text}</div>}
          {section.facts && <Facts facts={section.facts} />}
          {section.bullets && <ul className="card-bullets">{section.bullets.map((bullet, j) => <li key={j}>{bullet}</li>)}</ul>}
        </div>
      ))}</div>}
      {card.facts && <Facts facts={card.facts} />}
      {card.choice && <label className="card-choice">
        <span>{card.choice.label}</span>
        <select value={card.choice.value} disabled={card.actionsDisabled} onChange={event => onChoice?.(event.target.value)}>
          {card.choice.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>}
      {card.footer && <div className="card-footer">{card.footer}</div>}
      {card.actions && <div className="card-actions">{card.actions.map((action, i) => {
        const interactive = typeof action === 'object'
        return <span className="card-action-wrap" key={i}>
          <button type="button" className={`card-action-btn${action.primary ? ' card-action-primary' : ''}`} disabled={interactive && card.actionsDisabled} onClick={interactive ? () => onAction?.(action.id) : undefined}>
            {interactive ? action.label : action}
          </button>
          {interactive && action.primary && !card.actionsDisabled && <span className="card-action-hint"><DemoArrow direction="up" /></span>}
        </span>
      })}</div>}
    </div>
  )
}
