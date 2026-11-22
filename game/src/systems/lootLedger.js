// The money: loot banked in the van, what the tools cost, and the itemised receipt the getaway
// screen prints. Tools are paid for out of the take, so every gadget is a bet.
import { MAX_SELVES, TICK, TOOLS } from '../config.js';

export function createLootLedger() {
  return { banked: [], toolsUsed: { smoke: 0, emp: 0, coin: 0 }, toolSpend: 0 };
}

export function bankLoot(ledger, item) {
  item.banked = true;
  ledger.banked.push(item);
}

export function chargeForTool(ledger, kind) {
  ledger.toolsUsed[kind] += 1;
  ledger.toolSpend += TOOLS[kind].price;
}

export function stolenTotal(ledger) {
  let total = 0;
  for (const item of ledger.banked) total += item.value;
  return total;
}

/** The value of loot picked up but not yet in the van. */
export function valueInHand(loot) {
  let total = 0;
  for (const item of loot) if (item.carrier) total += item.value;
  return total;
}

export function netTake(ledger) {
  return stolenTotal(ledger) - ledger.toolSpend;
}

/** $1,200K style: every price in the game is a round number of thousands. */
export function formatMoney(amount) {
  const sign = amount < 0 ? '-' : '';
  return `${sign}$${Math.round(Math.abs(amount) / 1000).toLocaleString('en-US')}K`;
}

function crewRating(net, loopsUsed, lootCount) {
  if (lootCount === 3 && loopsUsed <= 3) return 'PERFECT CREW OF ONE';
  if (lootCount === 3) return 'CLEAN SWEEP';
  if (net >= 900000) return 'CROWN JOB';
  if (net >= 300000) return 'SOLID NIGHT';
  return net > 0 ? 'POCKET CHANGE' : 'IN THE RED';
}

/** The getaway receipt: one line per stolen item and per tool, then loops, clock and the net. */
export function buildGetawayReceipt(world, loopsUsed) {
  const ledger = world.ledger;
  const lines = ledger.banked.map((item) => ({ label: item.name, amount: item.value }));
  for (const kind of Object.keys(TOOLS)) {
    const count = ledger.toolsUsed[kind];
    if (count > 0) lines.push({ label: `${TOOLS[kind].label} x${count}`, amount: -count * TOOLS[kind].price });
  }
  const net = netTake(ledger);
  return {
    lines,
    stolen: stolenTotal(ledger),
    toolSpend: ledger.toolSpend,
    net,
    loopsUsed,
    maxLoops: MAX_SELVES,
    seconds: world.tick * TICK,
    alarmPeak: Math.round(world.alarm.peak),
    rating: crewRating(net, loopsUsed, ledger.banked.length),
  };
}
