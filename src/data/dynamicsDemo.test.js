import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createDynamicsWidget, createRevenueProjectionCard, opportunityOwnershipDemo } from './dynamicsDemo.js'

test('ETA widget retains confirmed owners and shows each customer close estimate', () => {
  const owners = { ...opportunityOwnershipDemo.confirmedOwners, 'Tailspin Toys': 'Emily Watson' }
  const original = createDynamicsWidget(owners)
  const updated = createDynamicsWidget(owners, opportunityOwnershipDemo.closeEstimates)

  assert.equal(updated.hasEtas, true)
  for (const estimate of opportunityOwnershipDemo.closeEstimates) {
    const row = updated.html.match(new RegExp(`<tr><td>${estimate.customer}</td>.*?</tr>`))[0]
    assert.ok(row.includes(`${owners[estimate.customer]}<small>Confirmed</small>`))
    assert.ok(row.includes(`<time datetime="${estimate.closeDate}">`))
  }
  assert.match(updated.html, /\$665,000/)
  assert.doesNotMatch(original.html, /<time datetime=/)
})

test('revenue chart orders owner ETAs chronologically and accumulates the matching deal values', () => {
  const estimates = Object.freeze([...opportunityOwnershipDemo.closeEstimates].reverse())
  const card = createRevenueProjectionCard(estimates)

  assert.deepEqual(card.bars.map(bar => [bar.label, bar.value]), [
    ['May 15, 2026', 240000],
    ['Jun 12, 2026', 390000],
    ['Jul 10, 2026', 570000],
    ['Aug 7, 2026', 665000],
  ])
  assert.equal(card.metrics[0].value, '$665,000')
  assert.equal(estimates[0].customer, 'Tailspin Toys')
})

test('changing a close ETA changes the projection timeline, not the deal amounts', () => {
  const estimates = opportunityOwnershipDemo.closeEstimates.map(estimate => estimate.customer === 'Fabrikam Logistics'
    ? { ...estimate, closeDate: '2026-04-30' }
    : estimate)
  const card = createRevenueProjectionCard(estimates)

  assert.deepEqual(card.bars.map(bar => [bar.label, bar.value]), [
    ['Apr 30, 2026', 180000],
    ['May 15, 2026', 420000],
    ['Jun 12, 2026', 570000],
    ['Aug 7, 2026', 665000],
  ])
})
