(function () {
  const profileApi = window.TabbyProfiles;
  const GAME_KEY = 'carnival';
  const PLUS_GAME_KEY = 'tabbyplus';
  const PLUS_KEY = 'tabby_plus_tier_v1';
  const TIER_LEVEL = { free: 0, plus: 1, premium: 2 };
  const DEFAULT_TOKENS = 250;
  const SYMBOLS = ['🍒', '🍋', '🔔', '⭐', '7️⃣', '💎'];
  const SUITS = ['♠', '♥', '♦', '♣'];
  const RANKS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
  const RANK_LABEL = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
  const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

  const tokenCountEl = document.getElementById('token-count');
  const buyTokensBtn = document.getElementById('buy-tokens-btn');
  const pricingModal = document.getElementById('pricing-modal');
  const pricingOffersEl = document.getElementById('pricing-offers');
  const closePricingBtn = document.getElementById('close-pricing');
  const toastEl = document.getElementById('toast');

  const slotBetEl = document.getElementById('slot-bet');
  const spinBtn = document.getElementById('spin-btn');
  const slotResultEl = document.getElementById('slot-result');
  const reels = [...document.querySelectorAll('.reel')];

  const rouletteGridEl = document.getElementById('roulette-grid');
  const rouletteBtn = document.getElementById('roulette-btn');
  const rouletteClearBtn = document.getElementById('roulette-clear');
  const rouletteResultEl = document.getElementById('roulette-result');
  const rouletteDisplayEl = document.getElementById('roulette-display');
  const rouletteColorEl = document.getElementById('roulette-color');
  const rouletteSelectedEl = document.getElementById('roulette-selected');
  const rouletteBetslipEl = document.getElementById('roulette-betslip');
  const rouletteOutsideButtons = [...document.querySelectorAll('.roulette-outside button')];
  const rouletteZeroBtn = document.querySelector('.roulette-zero-row .roulette-num');
  const rouletteChipButtons = [...document.querySelectorAll('.chip-btn')];

  const bjBetEl = document.getElementById('bj-bet');
  const bjDealBtn = document.getElementById('bj-deal');
  const bjHitBtn = document.getElementById('bj-hit');
  const bjStandBtn = document.getElementById('bj-stand');
  const bjDoubleBtn = document.getElementById('bj-double');
  const bjSplitBtn = document.getElementById('bj-split');
  const bjInsuranceBtn = document.getElementById('bj-insurance');
  const bjDealerCardsEl = document.getElementById('bj-dealer-cards');
  const bjPlayerCardsEl = document.getElementById('bj-player-cards');
  const bjDealerTotalEl = document.getElementById('bj-dealer-total');
  const bjPlayerTotalEl = document.getElementById('bj-player-total');
  const bjResultEl = document.getElementById('bj-result');

  const bacBetEl = document.getElementById('bac-bet');
  const bacWagerEl = document.getElementById('bac-wager');
  const bacPlayBtn = document.getElementById('bac-play');
  const bacPlayerCardsEl = document.getElementById('bac-player-cards');
  const bacBankerCardsEl = document.getElementById('bac-banker-cards');
  const bacPlayerTotalEl = document.getElementById('bac-player-total');
  const bacBankerTotalEl = document.getElementById('bac-banker-total');
  const bacResultEl = document.getElementById('bac-result');

  const thBetEl = document.getElementById('th-bet');
  const thRaiseEl = document.getElementById('th-raise');
  const thPlayBtn = document.getElementById('th-play');
  const thCallBtn = document.getElementById('th-call');
  const thRaiseBtn = document.getElementById('th-raise-btn');
  const thFoldBtn = document.getElementById('th-fold');
  const thBoardEl = document.getElementById('th-board');
  const thDealerEl = document.getElementById('th-dealer');
  const thPlayerEl = document.getElementById('th-player');
  const thDealerRankEl = document.getElementById('th-dealer-rank');
  const thPlayerRankEl = document.getElementById('th-player-rank');
  const thStageEl = document.getElementById('th-stage');
  const thPotEl = document.getElementById('th-pot');
  const thResultEl = document.getElementById('th-result');

  const drawBetEl = document.getElementById('draw-bet');
  const drawPlayBtn = document.getElementById('draw-play');
  const drawDealerEl = document.getElementById('draw-dealer');
  const drawPlayerEl = document.getElementById('draw-player');
  const drawDealerRankEl = document.getElementById('draw-dealer-rank');
  const drawPlayerRankEl = document.getElementById('draw-player-rank');
  const drawResultEl = document.getElementById('draw-result');

  const pagaoBetEl = document.getElementById('pagao-bet');
  const pagaoPlayBtn = document.getElementById('pagao-play');
  const pagaoBankerEl = document.getElementById('pagao-banker');
  const pagaoPlayerEl = document.getElementById('pagao-player');
  const pagaoBankerRankEl = document.getElementById('pagao-banker-rank');
  const pagaoPlayerRankEl = document.getElementById('pagao-player-rank');
  const pagaoResultEl = document.getElementById('pagao-result');
  const plusGatedCards = [...document.querySelectorAll('.plus-gated')];

  let tokens = DEFAULT_TOKENS;
  let membershipTier = 'free';
  let offers = [];
  let toastTimer = null;
  let slotBusy = false;
  let rouletteBusy = false;
  let rouletteChip = 10;
  let rouletteSelectedTarget = null;
  let rouletteBets = [];
  let blackjackRound = null;
  let texasRound = null;

  function getStats() {
    return profileApi?.getProfileGameStats?.(GAME_KEY) || {};
  }

  function normalizeTier(tier) {
    const t = String(tier || '').toLowerCase();
    if (t === 'premium' || t === 'plus') return t;
    return 'free';
  }

  function tierRank(tier) {
    return TIER_LEVEL[normalizeTier(tier)] || 0;
  }

  function hasPlusAccess() {
    return tierRank(membershipTier) >= TIER_LEVEL.plus;
  }

  function loadMembershipTier() {
    const localTier = normalizeTier(localStorage.getItem(PLUS_KEY));
    const profileTier = normalizeTier(profileApi?.getProfileGameStats?.(PLUS_GAME_KEY)?.tier);
    membershipTier = tierRank(profileTier) >= tierRank(localTier) ? profileTier : localTier;
    if (membershipTier === 'free') membershipTier = localTier || profileTier || 'free';
  }

  function applyMembershipGates() {
    const locked = !hasPlusAccess();
    plusGatedCards.forEach(card => {
      card.classList.toggle('locked-tier', locked);
      card.querySelectorAll('button, input, select, textarea').forEach(el => {
        el.disabled = locked;
      });
    });
    if (locked) {
      setText(bjResultEl, 'Tabby Plus required for Blackjack.');
      setText(thResultEl, 'Tabby Plus required for Texas Hold\'em.');
      setText(drawResultEl, 'Tabby Plus required for 5 Card Draw.');
      setText(pagaoResultEl, 'Tabby Plus required for Pagao Poker.');
      blackjackRound = null;
      texasRound = null;
    }
  }

  function requirePlusAccess() {
    if (hasPlusAccess()) return true;
    showToast('Tabby Plus is required for this table.');
    applyMembershipGates();
    return false;
  }

  function saveStats(patch = {}) {
    const current = getStats();
    profileApi?.setProfileGameStat?.(GAME_KEY, Object.assign({}, current, patch));
  }

  function loadTokens() {
    const stats = getStats();
    tokens = Number.isFinite(Number(stats.tokens)) ? Number(stats.tokens) : DEFAULT_TOKENS;
    renderTokens();
  }

  function renderTokens() {
    if (tokenCountEl) tokenCountEl.textContent = String(Math.max(0, Math.floor(tokens)));
  }

  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.add('hidden'), 2200);
  }

  function clampBet(value) {
    const bet = Math.floor(Number(value) || 0);
    return Math.max(1, Math.min(Math.max(1, Math.floor(tokens)), bet));
  }

  function trackWin(payout) {
    const prior = Number(getStats().biggestWin || 0);
    return { biggestWin: Math.max(prior, payout) };
  }

  function changeTokens(delta, meta = {}) {
    tokens = Math.max(0, Math.floor(tokens + delta));
    saveStats(Object.assign({
      tokens,
      gamesPlayed: Number(getStats().gamesPlayed || 0) + (meta.gamesPlayed ? 1 : 0),
      lastUpdated: Date.now(),
    }, meta.patch || {}));
    renderTokens();
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function randomCard() {
    return { rank: RANKS[randomInt(0, RANKS.length - 1)], suit: SUITS[randomInt(0, SUITS.length - 1)] };
  }

  function cardLabel(card) {
    const r = RANK_LABEL[card.rank] || String(card.rank);
    return `${r}${card.suit}`;
  }

  function cardColor(card) {
    return card.suit === '♥' || card.suit === '♦' ? 'red' : 'black';
  }

  function renderCards(el, cards) {
    if (!el) return;
    el.innerHTML = '';
    cards.forEach(card => {
      const node = document.createElement('span');
      node.className = `card ${cardColor(card)}`;
      node.textContent = cardLabel(card);
      el.appendChild(node);
    });
  }

  function handValueBlackjack(cards) {
    let total = 0;
    let aces = 0;
    cards.forEach(card => {
      if (card.rank === 14) {
        total += 11;
        aces += 1;
      } else if (card.rank >= 11) total += 10;
      else total += card.rank;
    });
    while (total > 21 && aces > 0) {
      total -= 10;
      aces -= 1;
    }
    return total;
  }

  function baccaratTotal(cards) {
    const sum = cards.reduce((acc, card) => {
      if (card.rank >= 10) return acc;
      if (card.rank === 14) return acc + 1;
      return acc + card.rank;
    }, 0);
    return sum % 10;
  }

  function countRanks(cards) {
    const map = new Map();
    cards.forEach(card => map.set(card.rank, (map.get(card.rank) || 0) + 1));
    return map;
  }

  function straightHigh(sortedRanks) {
    const unique = [...new Set(sortedRanks)].sort((a, b) => b - a);
    if (unique.length < 5) return 0;
    for (let i = 0; i <= unique.length - 5; i += 1) {
      const slice = unique.slice(i, i + 5);
      if (slice[0] - slice[4] === 4) return slice[0];
    }
    if (unique.includes(14) && unique.includes(5) && unique.includes(4) && unique.includes(3) && unique.includes(2)) return 5;
    return 0;
  }

  function evaluateFive(cards) {
    const ranksDesc = cards.map(c => c.rank).sort((a, b) => b - a);
    const flush = cards.every(c => c.suit === cards[0].suit);
    const sHigh = straightHigh(ranksDesc);
    const counts = [...countRanks(cards).entries()].sort((a, b) => {
      if (a[1] !== b[1]) return b[1] - a[1];
      return b[0] - a[0];
    });
    let rank = 0;
    let tiebreak = [];
    let label = 'High Card';
    if (flush && sHigh) {
      rank = 8; tiebreak = [sHigh]; label = 'Straight Flush';
    } else if (counts[0][1] === 4) {
      rank = 7; tiebreak = [counts[0][0], counts[1][0]]; label = 'Four of a Kind';
    } else if (counts[0][1] === 3 && counts[1][1] === 2) {
      rank = 6; tiebreak = [counts[0][0], counts[1][0]]; label = 'Full House';
    } else if (flush) {
      rank = 5; tiebreak = ranksDesc; label = 'Flush';
    } else if (sHigh) {
      rank = 4; tiebreak = [sHigh]; label = 'Straight';
    } else if (counts[0][1] === 3) {
      rank = 3; tiebreak = [counts[0][0], ...counts.slice(1).map(c => c[0]).sort((a, b) => b - a)]; label = 'Three of a Kind';
    } else if (counts[0][1] === 2 && counts[1][1] === 2) {
      const pairRanks = [counts[0][0], counts[1][0]].sort((a, b) => b - a);
      rank = 2; tiebreak = [...pairRanks, counts[2][0]]; label = 'Two Pair';
    } else if (counts[0][1] === 2) {
      rank = 1; tiebreak = [counts[0][0], ...counts.slice(1).map(c => c[0]).sort((a, b) => b - a)]; label = 'One Pair';
    } else {
      tiebreak = ranksDesc;
    }
    return { rank, tiebreak, label };
  }

  function compareEval(a, b) {
    if (a.rank !== b.rank) return a.rank > b.rank ? 1 : -1;
    const len = Math.max(a.tiebreak.length, b.tiebreak.length);
    for (let i = 0; i < len; i += 1) {
      const av = a.tiebreak[i] || 0;
      const bv = b.tiebreak[i] || 0;
      if (av !== bv) return av > bv ? 1 : -1;
    }
    return 0;
  }

  function combinations(arr, choose) {
    const out = [];
    function rec(start, pick) {
      if (pick.length === choose) return out.push([...pick]);
      for (let i = start; i < arr.length; i += 1) {
        pick.push(arr[i]);
        rec(i + 1, pick);
        pick.pop();
      }
    }
    rec(0, []);
    return out;
  }

  function bestOfSeven(cards) {
    let best = null;
    combinations(cards, 5).forEach(combo => {
      const current = evaluateFive(combo);
      if (!best || compareEval(current, best) > 0) best = current;
    });
    return best;
  }

  function bestLowTwo(cards) {
    const combos = combinations(cards, 2).map(pair => {
      const sorted = pair.map(c => c.rank).sort((a, b) => b - a);
      const isPair = sorted[0] === sorted[1];
      return { isPair, pairRank: isPair ? sorted[0] : 0, high: sorted[0], low: sorted[1] };
    });
    combos.sort((a, b) => {
      if (a.isPair !== b.isPair) return a.isPair ? -1 : 1;
      if (a.pairRank !== b.pairRank) return b.pairRank - a.pairRank;
      if (a.high !== b.high) return b.high - a.high;
      return b.low - a.low;
    });
    return combos[0];
  }

  function lowTwoLabel(v) {
    if (v.isPair) return `Pair ${RANK_LABEL[v.pairRank] || v.pairRank}`;
    return `${RANK_LABEL[v.high] || v.high}-${RANK_LABEL[v.low] || v.low} High`;
  }

  function rouletteColor(num) {
    if (num === 0) return 'green';
    return RED_NUMBERS.has(num) ? 'red' : 'black';
  }

  function buildOffers() {
    const seen = new Set();
    offers = [];
    while (offers.length < 4) {
      const price = Math.max(5, Math.round(randomInt(5, 100) / 5) * 5);
      if (seen.has(price)) continue;
      seen.add(price);
      offers.push({ price, tokens: price * randomInt(10, 18) });
    }
    offers.sort((a, b) => a.price - b.price);
    renderOffers();
  }

  function openPricing() {
    buildOffers();
    pricingModal?.classList.remove('hidden');
    pricingModal?.setAttribute('aria-hidden', 'false');
  }

  function closePricing() {
    pricingModal?.classList.add('hidden');
    pricingModal?.setAttribute('aria-hidden', 'true');
  }

  function renderOffers() {
    if (!pricingOffersEl) return;
    pricingOffersEl.innerHTML = '';
    offers.forEach((offer, index) => {
      const card = document.createElement('article');
      card.className = 'offer-card';
      card.innerHTML = `
        <div class="offer-top">
          <strong>${offer.tokens} tokens</strong>
          <span class="game-badge">$${offer.price}</span>
        </div>
        <div class="offer-meta">Click buy to add this bundle instantly.</div>
        <button type="button" class="shop-btn">Buy bundle ${index + 1}</button>
      `;
      card.querySelector('button').addEventListener('click', () => {
        changeTokens(offer.tokens, { patch: { purchases: Number(getStats().purchases || 0) + 1 } });
        showToast(`Added ${offer.tokens} tokens to your profile for free.`);
        closePricing();
      });
      pricingOffersEl.appendChild(card);
    });
  }

  function setText(el, msg) {
    if (el) el.textContent = msg;
  }

  function buildRouletteTable() {
    if (!rouletteGridEl) return;
    rouletteGridEl.innerHTML = '';
    for (let row = 12; row >= 1; row -= 1) {
      for (let col = 3; col >= 1; col -= 1) {
        const num = (row - 1) * 3 + col;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `roulette-num ${rouletteColor(num) === 'red' ? 'roulette-red' : 'roulette-black'}`;
        btn.dataset.betType = 'number';
        btn.dataset.betValue = String(num);
        btn.dataset.betLabel = `Number ${num}`;
        btn.textContent = String(num);
        btn.addEventListener('click', () => placeRouletteBet(btn, 'number', String(num), `Number ${num}`));
        rouletteGridEl.appendChild(btn);
      }
    }
    rouletteOutsideButtons.forEach(btn => {
      btn.dataset.betLabel = btn.textContent.trim();
      btn.addEventListener('click', () => placeRouletteBet(btn, 'outside', btn.dataset.betValue, btn.dataset.betLabel));
    });
    if (rouletteZeroBtn) {
      rouletteZeroBtn.dataset.betLabel = 'Number 0';
      rouletteZeroBtn.addEventListener('click', () => placeRouletteBet(rouletteZeroBtn, 'number', '0', 'Number 0'));
    }
  }

  function renderRouletteBets() {
    if (!rouletteBetslipEl) return;
    if (!rouletteBets.length) {
      rouletteBetslipEl.textContent = 'No active bets.';
      return;
    }
    rouletteBetslipEl.innerHTML = rouletteBets.map(b => `${b.label}: ${b.amount}`).join('<br>');
  }

  function clearRouletteSelection() {
    document.querySelectorAll('.roulette-num, .roulette-outside button').forEach(btn => btn.classList.remove('selected'));
  }

  function setRouletteChip(value) {
    rouletteChip = value;
    rouletteChipButtons.forEach(btn => btn.classList.toggle('active', Number(btn.dataset.chip) === rouletteChip));
  }

  function placeRouletteBet(element, type, value, label) {
    rouletteSelectedTarget = { type, value, label };
    clearRouletteSelection();
    element?.classList.add('selected');
    const key = `${type}:${value}`;
    const found = rouletteBets.find(b => b.key === key);
    if (found) found.amount += rouletteChip;
    else rouletteBets.push({ key, type, value, label, amount: rouletteChip });
    setText(rouletteSelectedEl, `Selected target: ${label}`);
    renderRouletteBets();
  }

  function roulettePayoutForBet(result, betEntry) {
    const bet = betEntry.amount;
    if (betEntry.type === 'number') return Number(betEntry.value) === result ? bet * 36 : 0;
    const outside = betEntry.value;
    if (outside === 'red' || outside === 'black') return rouletteColor(result) === outside ? bet * 2 : 0;
    if (outside === 'odd') return result !== 0 && result % 2 === 1 ? bet * 2 : 0;
    if (outside === 'even') return result !== 0 && result % 2 === 0 ? bet * 2 : 0;
    if (outside === 'low') return result >= 1 && result <= 18 ? bet * 2 : 0;
    if (outside === 'high') return result >= 19 && result <= 36 ? bet * 2 : 0;
    if (outside === 'dozen1') return result >= 1 && result <= 12 ? bet * 3 : 0;
    if (outside === 'dozen2') return result >= 13 && result <= 24 ? bet * 3 : 0;
    if (outside === 'dozen3') return result >= 25 && result <= 36 ? bet * 3 : 0;
    if (outside === 'column1') return result !== 0 && result % 3 === 1 ? bet * 3 : 0;
    if (outside === 'column2') return result !== 0 && result % 3 === 2 ? bet * 3 : 0;
    if (outside === 'column3') return result !== 0 && result % 3 === 0 ? bet * 3 : 0;
    return 0;
  }

  function spinRoulette() {
    if (rouletteBusy) return;
    if (!rouletteBets.length) {
      showToast('Place at least one bet first.');
      return;
    }
    const totalBet = rouletteBets.reduce((sum, b) => sum + b.amount, 0);
    if (tokens < totalBet) {
      showToast('Not enough tokens for stacked bets.');
      return;
    }
    rouletteBusy = true;
    rouletteBtn.disabled = true;
    changeTokens(-totalBet, { gamesPlayed: true });
    const result = randomInt(0, 36);
    const color = rouletteColor(result);
    setText(rouletteDisplayEl, String(result));
    setText(rouletteColorEl, color);
    const payout = rouletteBets.reduce((sum, b) => sum + roulettePayoutForBet(result, b), 0);
    if (payout > 0) {
      changeTokens(payout, { patch: trackWin(payout) });
      setText(rouletteResultEl, `Ball landed on ${result} (${color}). Total wager ${totalBet}, payout ${payout}.`);
    } else {
      setText(rouletteResultEl, `Ball landed on ${result} (${color}). Lost ${totalBet} tokens.`);
    }
    rouletteBusy = false;
    rouletteBtn.disabled = false;
  }

  function clearRouletteBets() {
    rouletteBets = [];
    rouletteSelectedTarget = null;
    clearRouletteSelection();
    setText(rouletteSelectedEl, 'Selected target: none');
    renderRouletteBets();
  }

  function spinSlots() {
    if (slotBusy) return;
    const bet = clampBet(slotBetEl?.value || 10);
    if (tokens < bet) return showToast('Not enough tokens.');
    slotBusy = true;
    spinBtn.disabled = true;
    changeTokens(-bet, { gamesPlayed: true });
    let ticks = 0;
    const timer = setInterval(() => {
      reels.forEach(reel => { reel.textContent = SYMBOLS[randomInt(0, SYMBOLS.length - 1)]; });
      ticks += 1;
      if (ticks < 10) return;
      clearInterval(timer);
      const result = [0, 1, 2].map(() => SYMBOLS[randomInt(0, SYMBOLS.length - 1)]);
      result.forEach((sym, idx) => { reels[idx].textContent = sym; });
      const unique = new Set(result);
      let payout = 0;
      if (unique.size === 1) payout = bet * 8;
      else if (unique.size === 2) payout = bet * 3;
      if (payout > 0) {
        changeTokens(payout, { patch: trackWin(payout) });
        setText(slotResultEl, `Reels: ${result.join(' ')}. Win ${payout} tokens.`);
      } else setText(slotResultEl, `Reels: ${result.join(' ')}. No hit this round.`);
      slotBusy = false;
      spinBtn.disabled = false;
    }, 100);
  }

  function currentBlackjackHand() {
    if (!blackjackRound) return null;
    return blackjackRound.hands[blackjackRound.activeIndex] || null;
  }

  function canSplitHand(hand) {
    return !!(hand && hand.cards.length === 2 && hand.cards[0].rank === hand.cards[1].rank);
  }

  function renderBlackjackRound(revealDealer) {
    if (!blackjackRound) return;
    const hand = currentBlackjackHand();
    renderCards(bjPlayerCardsEl, hand ? hand.cards : []);
    if (revealDealer) {
      renderCards(bjDealerCardsEl, blackjackRound.dealer);
      bjDealerTotalEl.textContent = String(handValueBlackjack(blackjackRound.dealer));
    } else {
      bjDealerCardsEl.innerHTML = '';
      const first = document.createElement('span');
      first.className = `card ${cardColor(blackjackRound.dealer[0])}`;
      first.textContent = cardLabel(blackjackRound.dealer[0]);
      const hidden = document.createElement('span');
      hidden.className = 'card';
      hidden.textContent = '##';
      bjDealerCardsEl.appendChild(first);
      bjDealerCardsEl.appendChild(hidden);
      bjDealerTotalEl.textContent = '?';
    }
    bjPlayerTotalEl.textContent = hand ? String(handValueBlackjack(hand.cards)) : '0';
  }

  function setBlackjackControls(active) {
    const hand = currentBlackjackHand();
    const canAct = !!(active && hand);
    bjHitBtn.disabled = !canAct;
    bjStandBtn.disabled = !canAct;
    bjDoubleBtn.disabled = !(canAct && hand.cards.length === 2 && tokens >= hand.bet);
    bjSplitBtn.disabled = !(canAct && !blackjackRound.splitUsed && canSplitHand(hand) && tokens >= hand.bet);
    bjInsuranceBtn.disabled = !(canAct && blackjackRound.insuranceOffered && !blackjackRound.insuranceTaken && tokens >= Math.floor(blackjackRound.baseBet / 2));
  }

  function startBlackjack() {
    if (!requirePlusAccess()) return;
    const bet = clampBet(bjBetEl?.value || 25);
    if (tokens < bet) return showToast('Not enough tokens.');
    changeTokens(-bet, { gamesPlayed: true });
    blackjackRound = {
      baseBet: bet,
      hands: [{ cards: [randomCard(), randomCard()], bet, done: false }],
      activeIndex: 0,
      dealer: [randomCard(), randomCard()],
      insuranceOffered: false,
      insuranceTaken: false,
      insuranceBet: 0,
      splitUsed: false,
      active: true,
    };
    blackjackRound.insuranceOffered = blackjackRound.dealer[0].rank === 14;
    renderBlackjackRound(false);
    setBlackjackControls(true);
    setText(bjResultEl, blackjackRound.insuranceOffered ? 'Dealer shows Ace. You can buy insurance.' : 'Hand started. Hit or stand.');
    const hand = currentBlackjackHand();
    if (handValueBlackjack(hand.cards) === 21 || handValueBlackjack(blackjackRound.dealer) === 21) {
      settleBlackjack();
    }
  }

  function moveToNextHandOrDealer() {
    if (!blackjackRound) return;
    for (let i = 0; i < blackjackRound.hands.length; i += 1) {
      if (!blackjackRound.hands[i].done) {
        blackjackRound.activeIndex = i;
        renderBlackjackRound(false);
        setBlackjackControls(true);
        setText(bjResultEl, `Playing hand ${i + 1}/${blackjackRound.hands.length}.`);
        return;
      }
    }
    settleBlackjack();
  }

  function hitBlackjack() {
    if (!blackjackRound?.active) return;
    const hand = currentBlackjackHand();
    if (!hand) return;
    hand.cards.push(randomCard());
    const total = handValueBlackjack(hand.cards);
    if (total >= 21) hand.done = true;
    renderBlackjackRound(false);
    if (total > 21) setText(bjResultEl, `Hand ${blackjackRound.activeIndex + 1} busts at ${total}.`);
    if (hand.done) moveToNextHandOrDealer();
    else setBlackjackControls(true);
  }

  function standBlackjack() {
    if (!blackjackRound?.active) return;
    const hand = currentBlackjackHand();
    if (!hand) return;
    hand.done = true;
    moveToNextHandOrDealer();
  }

  function doubleBlackjack() {
    if (!blackjackRound?.active) return;
    const hand = currentBlackjackHand();
    if (!hand || hand.cards.length !== 2) return;
    if (tokens < hand.bet) return showToast('Not enough tokens to double down.');
    changeTokens(-hand.bet);
    hand.bet *= 2;
    hand.cards.push(randomCard());
    hand.done = true;
    renderBlackjackRound(false);
    moveToNextHandOrDealer();
  }

  function splitBlackjack() {
    if (!blackjackRound?.active) return;
    const hand = currentBlackjackHand();
    if (!canSplitHand(hand) || blackjackRound.splitUsed) return;
    if (tokens < hand.bet) return showToast('Not enough tokens to split.');
    changeTokens(-hand.bet);
    const left = { cards: [hand.cards[0], randomCard()], bet: hand.bet, done: false };
    const right = { cards: [hand.cards[1], randomCard()], bet: hand.bet, done: false };
    blackjackRound.hands.splice(blackjackRound.activeIndex, 1, left, right);
    blackjackRound.splitUsed = true;
    renderBlackjackRound(false);
    setBlackjackControls(true);
    setText(bjResultEl, 'Hand split. Play each hand in order.');
  }

  function insuranceBlackjack() {
    if (!blackjackRound?.active || !blackjackRound.insuranceOffered || blackjackRound.insuranceTaken) return;
    const insurance = Math.floor(blackjackRound.baseBet / 2);
    if (tokens < insurance) return showToast('Not enough tokens for insurance.');
    blackjackRound.insuranceTaken = true;
    blackjackRound.insuranceBet = insurance;
    changeTokens(-insurance);
    setBlackjackControls(true);
    setText(bjResultEl, `Insurance placed (${insurance} tokens).`);
  }

  function settleBlackjack() {
    if (!blackjackRound?.active) return;
    while (handValueBlackjack(blackjackRound.dealer) < 17) {
      blackjackRound.dealer.push(randomCard());
    }
    const dealerTotal = handValueBlackjack(blackjackRound.dealer);
    const dealerBlackjack = blackjackRound.dealer.length === 2 && dealerTotal === 21;
    let payout = 0;
    const lines = [];
    blackjackRound.hands.forEach((hand, idx) => {
      const total = handValueBlackjack(hand.cards);
      const natural = hand.cards.length === 2 && total === 21 && !blackjackRound.splitUsed;
      if (total > 21) {
        lines.push(`H${idx + 1} busts.`);
        return;
      }
      if (dealerBlackjack && natural) {
        payout += hand.bet;
        lines.push(`H${idx + 1} push vs dealer blackjack.`);
        return;
      }
      if (dealerBlackjack) {
        lines.push(`H${idx + 1} loses to dealer blackjack.`);
        return;
      }
      if (natural) {
        const win = Math.floor(hand.bet * 2.5);
        payout += win;
        lines.push(`H${idx + 1} blackjack pays ${win}.`);
        return;
      }
      if (dealerTotal > 21 || total > dealerTotal) {
        payout += hand.bet * 2;
        lines.push(`H${idx + 1} wins.`);
      } else if (total === dealerTotal) {
        payout += hand.bet;
        lines.push(`H${idx + 1} push.`);
      } else lines.push(`H${idx + 1} loses.`);
    });

    if (blackjackRound.insuranceTaken && dealerBlackjack) {
      const insuranceWin = blackjackRound.insuranceBet * 3;
      payout += insuranceWin;
      lines.push(`Insurance pays ${insuranceWin}.`);
    }
    if (payout > 0) changeTokens(payout, { patch: trackWin(payout) });
    blackjackRound.active = false;
    renderBlackjackRound(true);
    setBlackjackControls(false);
    setText(bjResultEl, `Dealer ${dealerTotal}. ${lines.join(' ')}`);
  }

  function playBaccarat() {
    const bet = clampBet(bacBetEl?.value || 20);
    if (tokens < bet) return showToast('Not enough tokens.');
    const wager = bacWagerEl?.value || 'player';
    changeTokens(-bet, { gamesPlayed: true });
    const player = [randomCard(), randomCard()];
    const banker = [randomCard(), randomCard()];
    let p = baccaratTotal(player);
    let b = baccaratTotal(banker);
    if (p <= 5) player.push(randomCard());
    p = baccaratTotal(player);
    if (b <= 5) banker.push(randomCard());
    b = baccaratTotal(banker);
    renderCards(bacPlayerCardsEl, player);
    renderCards(bacBankerCardsEl, banker);
    bacPlayerTotalEl.textContent = String(p);
    bacBankerTotalEl.textContent = String(b);
    let winner = 'tie';
    if (p > b) winner = 'player';
    else if (b > p) winner = 'banker';
    let payout = 0;
    if (wager === winner) {
      payout = winner === 'tie' ? bet * 9 : bet * 2;
      changeTokens(payout, { patch: trackWin(payout) });
    }
    setText(bacResultEl, `Player ${p} vs Banker ${b}. Winner: ${winner}. ${payout ? `Win ${payout} tokens.` : `Lost ${bet} tokens.`}`);
  }

  function texasStageName(index) {
    return ['preflop', 'flop', 'turn', 'river', 'showdown'][index] || 'idle';
  }

  function updateTexasControls(active) {
    thCallBtn.disabled = !active;
    thRaiseBtn.disabled = !active;
    thFoldBtn.disabled = !active;
  }

  function renderTexasBoard(round) {
    const count = round.stageIndex === 0 ? 0 : round.stageIndex === 1 ? 3 : round.stageIndex === 2 ? 4 : 5;
    renderCards(thBoardEl, round.board.slice(0, count));
    thStageEl.textContent = texasStageName(round.stageIndex);
    thPotEl.textContent = String(round.pot);
  }

  function finishTexas(showdownMessage, payout, playerEval, dealerEval) {
    if (!texasRound) return;
    texasRound.stageIndex = 4;
    renderTexasBoard(texasRound);
    renderCards(thBoardEl, texasRound.board);
    if (playerEval) thPlayerRankEl.textContent = playerEval.label;
    if (dealerEval) thDealerRankEl.textContent = dealerEval.label;
    if (payout > 0) changeTokens(payout, { patch: trackWin(payout) });
    texasRound.active = false;
    updateTexasControls(false);
    setText(thResultEl, showdownMessage);
  }

  function showdownTexas() {
    if (!texasRound?.active) return;
    const pEval = bestOfSeven([...texasRound.player, ...texasRound.board]);
    const dEval = bestOfSeven([...texasRound.dealer, ...texasRound.board]);
    thPlayerRankEl.textContent = pEval.label;
    thDealerRankEl.textContent = dEval.label;
    const cmp = compareEval(pEval, dEval);
    if (cmp > 0) return finishTexas(`Player wins pot ${texasRound.pot} with ${pEval.label}.`, texasRound.pot, pEval, dEval);
    if (cmp === 0) return finishTexas(`Push on ${pEval.label}. Returned ${texasRound.playerInvested}.`, texasRound.playerInvested, pEval, dEval);
    return finishTexas(`Dealer wins with ${dEval.label}.`, 0, pEval, dEval);
  }

  function advanceTexasStage() {
    if (!texasRound?.active) return;
    if (texasRound.stageIndex >= 3) return showdownTexas();
    texasRound.stageIndex += 1;
    renderTexasBoard(texasRound);
    setText(thResultEl, `Moved to ${texasStageName(texasRound.stageIndex)}.`);
  }

  function startTexas() {
    if (!requirePlusAccess()) return;
    const bet = clampBet(thBetEl?.value || 30);
    if (tokens < bet) return showToast('Not enough tokens.');
    changeTokens(-bet, { gamesPlayed: true });
    texasRound = {
      active: true,
      stageIndex: 0,
      board: [randomCard(), randomCard(), randomCard(), randomCard(), randomCard()],
      player: [randomCard(), randomCard()],
      dealer: [randomCard(), randomCard()],
      playerInvested: bet,
      pot: bet * 2,
    };
    renderCards(thPlayerEl, texasRound.player);
    renderCards(thDealerEl, texasRound.dealer);
    thPlayerRankEl.textContent = '-';
    thDealerRankEl.textContent = '-';
    renderTexasBoard(texasRound);
    updateTexasControls(true);
    setText(thResultEl, 'New hand: preflop. Use call/check, raise, or fold.');
  }

  function callTexas() {
    if (!texasRound?.active) return;
    advanceTexasStage();
  }

  function raiseTexas() {
    if (!texasRound?.active) return;
    const raise = Math.max(1, Math.floor(Number(thRaiseEl?.value || 1)));
    if (tokens < raise) return showToast('Not enough tokens to raise.');
    changeTokens(-raise);
    texasRound.playerInvested += raise;
    texasRound.pot += raise * 2;
    advanceTexasStage();
  }

  function foldTexas() {
    if (!texasRound?.active) return;
    texasRound.active = false;
    updateTexasControls(false);
    setText(thResultEl, `Player folds. Lost ${texasRound.playerInvested} tokens.`);
  }

  function playDraw() {
    if (!requirePlusAccess()) return;
    const bet = clampBet(drawBetEl?.value || 20);
    if (tokens < bet) return showToast('Not enough tokens.');
    changeTokens(-bet, { gamesPlayed: true });
    const dealer = [randomCard(), randomCard(), randomCard(), randomCard(), randomCard()];
    const player = [randomCard(), randomCard(), randomCard(), randomCard(), randomCard()];
    renderCards(drawDealerEl, dealer);
    renderCards(drawPlayerEl, player);
    const dEval = evaluateFive(dealer);
    const pEval = evaluateFive(player);
    drawDealerRankEl.textContent = dEval.label;
    drawPlayerRankEl.textContent = pEval.label;
    const cmp = compareEval(pEval, dEval);
    let payout = 0;
    if (cmp > 0) payout = bet * 2;
    else if (cmp === 0) payout = bet;
    if (payout > 0) changeTokens(payout, { patch: trackWin(payout) });
    setText(drawResultEl, cmp > 0 ? `Player wins with ${pEval.label}. +${payout} tokens.` : cmp === 0 ? 'Tie hand. Bet returned.' : `Dealer wins with ${dEval.label}.`);
  }

  function compareLowTwo(a, b) {
    if (a.isPair !== b.isPair) return a.isPair ? 1 : -1;
    if (a.pairRank !== b.pairRank) return a.pairRank > b.pairRank ? 1 : -1;
    if (a.high !== b.high) return a.high > b.high ? 1 : -1;
    if (a.low !== b.low) return a.low > b.low ? 1 : -1;
    return 0;
  }

  function playPagao() {
    if (!requirePlusAccess()) return;
    const bet = clampBet(pagaoBetEl?.value || 25);
    if (tokens < bet) return showToast('Not enough tokens.');
    changeTokens(-bet, { gamesPlayed: true });
    const banker = [randomCard(), randomCard(), randomCard(), randomCard(), randomCard(), randomCard(), randomCard()];
    const player = [randomCard(), randomCard(), randomCard(), randomCard(), randomCard(), randomCard(), randomCard()];
    renderCards(pagaoBankerEl, banker);
    renderCards(pagaoPlayerEl, player);
    const bHigh = bestOfSeven(banker);
    const pHigh = bestOfSeven(player);
    const bLow = bestLowTwo(banker);
    const pLow = bestLowTwo(player);
    pagaoBankerRankEl.textContent = `High: ${bHigh.label} | Low: ${lowTwoLabel(bLow)}`;
    pagaoPlayerRankEl.textContent = `High: ${pHigh.label} | Low: ${lowTwoLabel(pLow)}`;
    const highCmp = compareEval(pHigh, bHigh);
    const lowCmp = compareLowTwo(pLow, bLow);
    let payout = 0;
    let msg = '';
    if (highCmp > 0 && lowCmp > 0) {
      payout = bet * 3;
      msg = `Player wins both hands. +${payout} tokens.`;
    } else if ((highCmp > 0 && lowCmp === 0) || (highCmp === 0 && lowCmp > 0) || (highCmp === 0 && lowCmp === 0) || (highCmp > 0 && lowCmp < 0) || (highCmp < 0 && lowCmp > 0)) {
      payout = bet;
      msg = `Split decision. Bet returned (${bet}).`;
    } else {
      msg = `Banker takes both hands. Lost ${bet} tokens.`;
    }
    if (payout > 0) changeTokens(payout, { patch: trackWin(payout) });
    setText(pagaoResultEl, msg);
  }

  function syncFromProfile() {
    loadMembershipTier();
    applyMembershipGates();
    loadTokens();
  }

  buyTokensBtn?.addEventListener('click', openPricing);
  closePricingBtn?.addEventListener('click', closePricing);
  pricingModal?.addEventListener('click', ev => { if (ev.target === pricingModal) closePricing(); });

  rouletteChipButtons.forEach(btn => {
    btn.addEventListener('click', () => setRouletteChip(Number(btn.dataset.chip)));
  });
  rouletteBtn?.addEventListener('click', spinRoulette);
  rouletteClearBtn?.addEventListener('click', clearRouletteBets);

  spinBtn?.addEventListener('click', spinSlots);

  bjDealBtn?.addEventListener('click', startBlackjack);
  bjHitBtn?.addEventListener('click', hitBlackjack);
  bjStandBtn?.addEventListener('click', standBlackjack);
  bjDoubleBtn?.addEventListener('click', doubleBlackjack);
  bjSplitBtn?.addEventListener('click', splitBlackjack);
  bjInsuranceBtn?.addEventListener('click', insuranceBlackjack);

  bacPlayBtn?.addEventListener('click', playBaccarat);

  thPlayBtn?.addEventListener('click', startTexas);
  thCallBtn?.addEventListener('click', callTexas);
  thRaiseBtn?.addEventListener('click', raiseTexas);
  thFoldBtn?.addEventListener('click', foldTexas);

  drawPlayBtn?.addEventListener('click', playDraw);
  pagaoPlayBtn?.addEventListener('click', playPagao);

  document.addEventListener('tabby-profile-change', syncFromProfile);
  window.addEventListener('storage', ev => {
    if (ev.key !== PLUS_KEY) return;
    loadMembershipTier();
    applyMembershipGates();
  });

  setRouletteChip(10);
  buildRouletteTable();
  clearRouletteBets();
  setBlackjackControls(false);
  updateTexasControls(false);
  loadMembershipTier();
  applyMembershipGates();
  syncFromProfile();
})();
