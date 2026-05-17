(function () {
  const profileApi = window.TabbyProfiles;
  const GAME_KEY = 'carnival';
  const DEFAULT_TOKENS = 250;
  const SYMBOLS = ['🍒', '🍋', '🔔', '⭐', '7️⃣', '💎'];
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

  const rouletteBetEl = document.getElementById('roulette-bet');
  const rouletteGuessEl = document.getElementById('roulette-guess');
  const rouletteNumberEl = document.getElementById('roulette-number');
  const numberWrapEl = document.getElementById('number-wrap');
  const rouletteBtn = document.getElementById('roulette-btn');
  const rouletteResultEl = document.getElementById('roulette-result');
  const rouletteDisplayEl = document.getElementById('roulette-display');

  const cardBetEl = document.getElementById('card-bet');
  const higherBtn = document.getElementById('higher-btn');
  const lowerBtn = document.getElementById('lower-btn');
  const cardResultEl = document.getElementById('card-result');
  const cardCurrentEl = document.getElementById('card-current');
  const cardNextEl = document.getElementById('card-next');

  let tokens = DEFAULT_TOKENS;
  let offers = [];
  let toastTimer = null;
  let slotBusy = false;
  let rouletteBusy = false;
  let cardBusy = false;
  let currentCard = randomCard();

  function getStats() {
    return profileApi?.getProfileGameStats?.(GAME_KEY) || {};
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
    return randomInt(1, 13);
  }

  function clampNumberGuess(value) {
    const guess = Math.floor(Number(value));
    if (!Number.isFinite(guess)) return 0;
    return Math.max(0, Math.min(36, guess));
  }

  function cardLabel(value) {
    if (value === 1) return 'A';
    if (value === 11) return 'J';
    if (value === 12) return 'Q';
    if (value === 13) return 'K';
    return String(value);
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
      offers.push({
        price,
        tokens: price * randomInt(10, 18),
      });
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
        <div class="offer-meta">Fake checkout. Clicking buy adds this bundle to your profile for free.</div>
        <button type="button" class="shop-btn">Buy bundle ${index + 1}</button>
      `;
      card.querySelector('button').addEventListener('click', () => {
        changeTokens(offer.tokens, { gamesPlayed: false, patch: { purchases: Number(getStats().purchases || 0) + 1 } });
        showToast(`Added ${offer.tokens} tokens to your profile for free.`);
        closePricing();
      });
      pricingOffersEl.appendChild(card);
    });
  }

  function setSlotMessage(text) {
    if (slotResultEl) slotResultEl.textContent = text;
  }

  function setRouletteMessage(text) {
    if (rouletteResultEl) rouletteResultEl.textContent = text;
  }

  function setCardMessage(text) {
    if (cardResultEl) cardResultEl.textContent = text;
  }

  function spinSlots() {
    if (slotBusy) return;
    const bet = clampBet(slotBetEl?.value || 10);
    if (tokens < bet) {
      showToast('Not enough tokens.');
      return;
    }
    slotBusy = true;
    spinBtn.disabled = true;
    changeTokens(-bet, { gamesPlayed: true });
    let ticks = 0;
    const timer = setInterval(() => {
      reels.forEach(reel => {
        reel.textContent = SYMBOLS[randomInt(0, SYMBOLS.length - 1)];
      });
      ticks += 1;
      if (ticks >= 10) {
        clearInterval(timer);
        const result = [0, 1, 2].map(() => SYMBOLS[randomInt(0, SYMBOLS.length - 1)]);
        result.forEach((sym, idx) => {
          reels[idx].textContent = sym;
        });
        const unique = new Set(result);
        let payout = 0;
        if (unique.size === 1) {
          payout = bet * 8;
          setSlotMessage(`Jackpot! Three ${result[0]} symbols. +${payout} tokens.`);
        } else if (unique.size === 2) {
          payout = bet * 3;
          setSlotMessage(`Nice hit. Pair bonus payout: +${payout} tokens.`);
        } else {
          setSlotMessage(`No match. The house keeps the ${bet} token bet.`);
        }
        if (payout > 0) changeTokens(payout, { patch: { biggestWin: Math.max(Number(getStats().biggestWin || 0), payout) } });
        slotBusy = false;
        spinBtn.disabled = false;
      }
    }, 100);
  }

  function playRoulette() {
    if (rouletteBusy) return;
    const bet = clampBet(rouletteBetEl?.value || 10);
    if (tokens < bet) {
      showToast('Not enough tokens.');
      return;
    }
    rouletteBusy = true;
    rouletteBtn.disabled = true;
    changeTokens(-bet, { gamesPlayed: true });
    const rolled = randomInt(0, 36);
    const color = rouletteColor(rolled);
    if (rouletteDisplayEl) rouletteDisplayEl.textContent = String(rolled);

    const guess = rouletteGuessEl?.value || 'red';
    const numberGuess = clampNumberGuess(rouletteNumberEl?.value || 0);
    let payout = 0;
    let message = `Wheel landed on ${rolled} (${color}). `;

    if (guess === 'number') {
      if (rolled === numberGuess) {
        payout = bet * 36;
        message += `Exact hit! +${payout} tokens.`;
      } else {
        message += `No exact match.`;
      }
    } else if (color === guess) {
      payout = bet * 2;
      message += `Color match! +${payout} tokens.`;
    } else {
      message += `Wrong color.`;
    }

    if (payout > 0) changeTokens(payout, { patch: { biggestWin: Math.max(Number(getStats().biggestWin || 0), payout) } });
    setRouletteMessage(message);
    rouletteBusy = false;
    rouletteBtn.disabled = false;
  }

  function playCard(guessHigher) {
    if (cardBusy) return;
    const bet = clampBet(cardBetEl?.value || 10);
    if (tokens < bet) {
      showToast('Not enough tokens.');
      return;
    }
    cardBusy = true;
    higherBtn.disabled = true;
    lowerBtn.disabled = true;
    changeTokens(-bet, { gamesPlayed: true });
    const next = randomCard();
    if (cardCurrentEl) cardCurrentEl.textContent = cardLabel(currentCard);
    if (cardNextEl) cardNextEl.textContent = cardLabel(next);
    const success = guessHigher ? next > currentCard : next < currentCard;
    const tie = next === currentCard;
    let payout = 0;
    if (success) {
      payout = Math.floor(bet * 1.9);
      setCardMessage(`${guessHigher ? 'Higher' : 'Lower'} was right. +${payout} tokens.`);
    } else if (tie) {
      payout = bet;
      setCardMessage(`Pair draw. Your bet was returned.`);
    } else {
      setCardMessage(`${guessHigher ? 'Higher' : 'Lower'} missed. Better luck next round.`);
    }
    if (payout > 0) changeTokens(payout, { patch: { biggestWin: Math.max(Number(getStats().biggestWin || 0), payout) } });
    currentCard = next;
    cardBusy = false;
    higherBtn.disabled = false;
    lowerBtn.disabled = false;
  }

  function syncFromProfile() {
    loadTokens();
    if (tokenCountEl) tokenCountEl.textContent = String(Math.max(0, Math.floor(tokens)));
  }

  buyTokensBtn?.addEventListener('click', openPricing);
  closePricingBtn?.addEventListener('click', closePricing);
  pricingModal?.addEventListener('click', ev => {
    if (ev.target === pricingModal) closePricing();
  });
  spinBtn?.addEventListener('click', spinSlots);
  rouletteBtn?.addEventListener('click', playRoulette);
  rouletteGuessEl?.addEventListener('change', () => {
    numberWrapEl?.classList.toggle('hidden', rouletteGuessEl.value !== 'number');
  });
  higherBtn?.addEventListener('click', () => playCard(true));
  lowerBtn?.addEventListener('click', () => playCard(false));
  document.addEventListener('tabby-profile-change', syncFromProfile);

  if (cardCurrentEl) cardCurrentEl.textContent = cardLabel(currentCard);
  if (rouletteDisplayEl) rouletteDisplayEl.textContent = '0';
  numberWrapEl?.classList.toggle('hidden', rouletteGuessEl?.value !== 'number');

  syncFromProfile();
})();
