(() => {
  const ELEMENT_RESONANCE_CONFIG = [
    {
      element: '火',
      icon: 'assets/elements/pyro.svg',
      name: '热情之火',
      tiers: [2, 3, 4, 5],
      effects: [
        '2火：全队攻击力提高20%。',
        '3火：全队攻击力提高30%。',
        '4火：全队攻击力提高35%，全队增伤提高15%。',
        '5火：全队攻击力提高50%，全队增伤提高25%；释放技能后获得30%攻击速度，持续5秒。'
      ]
    },
    {
      element: '水',
      icon: 'assets/elements/hydro.svg',
      name: '生命之泉',
      tiers: [2, 3, 4],
      effects: [
        '2水：全队最大生命值提高15%。',
        '3水：全队最大生命值提高20%。',
        '4水：全队最大生命值提高30%，每秒回复2%最大生命值。'
      ]
    },
    {
      element: '冰',
      icon: 'assets/elements/cryo.svg',
      name: '粉碎之霜',
      tiers: [2, 3, 4, 5],
      effects: [
        '2冰：全队暴击率提高15%。',
        '3冰：全队暴击率提高20%。',
        '4冰：全队暴击率提高25%，暴击伤害提高20%。',
        '5冰：全队暴击率提高30%，暴击伤害提高30%；战斗开始8秒后冻结所有敌人2秒。'
      ]
    },
    {
      element: '雷',
      icon: 'assets/elements/electro.svg',
      name: '强能之雷',
      tiers: [2, 3, 4, 5],
      effects: [
        '2雷：全队每秒回复1点法力。',
        '3雷：全队每秒回复2点法力。',
        '4雷：全队每秒回复3点法力，初始法力提高10点。',
        '5雷：全队每秒回复5点法力，初始法力额外提高10点；释放技能后立即回复10点法力。'
      ]
    },
    {
      element: '风',
      icon: 'assets/elements/anemo.svg',
      name: '迅捷之风',
      tiers: [2, 3, 4],
      effects: [
        '2风：全队攻击速度提高15%。',
        '3风：全队攻击速度提高30%。',
        '4风：全队攻击速度提高45%；战斗开始8秒后对所有敌人造成一次可触发扩散的风元素伤害。'
      ]
    },
    {
      element: '岩',
      icon: 'assets/elements/geo.svg',
      name: '坚定之岩',
      tiers: [2, 3],
      effects: [
        '2岩：全队物理抗性和元素抗性分别提高15点。',
        '3岩：全队物理抗性和元素抗性分别提高25点，结晶提供的属性收益变为1.5倍。'
      ]
    }
  ];

  const style = document.createElement('style');
  style.textContent = `
    .element-resonance-slot{
      height:116px;
      box-sizing:border-box;
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:center;
      padding:8px 18px;
      border-bottom:1px solid rgba(47,66,94,.68);
      background:linear-gradient(180deg,rgba(8,14,24,.72),rgba(12,20,33,.42));
      position:relative;
      z-index:8;
    }
    .element-resonance-team-row{
      width:100%;
      display:grid;
      grid-template-columns:42px minmax(0,1fr);
      align-items:center;
      gap:8px;
    }
    .element-resonance-team-row + .element-resonance-team-row{margin-top:6px}
    .element-resonance-team-label{
      font-size:12px;
      font-weight:900;
      text-align:center;
      white-space:nowrap;
    }
    .element-resonance-team-row.red .element-resonance-team-label{color:#ff929a}
    .element-resonance-team-row.blue .element-resonance-team-label{color:#8ac5ff}
    .element-resonance-row{
      width:100%;
      display:grid;
      grid-template-columns:repeat(6,minmax(0,1fr));
      align-items:center;
      justify-items:center;
      gap:8px;
    }
    .element-resonance-item{
      min-width:0;
      height:44px;
      display:flex;
      align-items:center;
      justify-content:center;
      gap:7px;
      padding:0 7px;
      border:1px solid rgba(71,91,121,.5);
      border-radius:10px;
      background:rgba(14,23,37,.72);
      color:#728096;
      cursor:help;
      transition:border-color .18s ease,background .18s ease,box-shadow .18s ease,opacity .18s ease;
      opacity:.66;
    }
    .element-resonance-item.active{
      opacity:1;
      border-color:var(--resonance-color);
      background:linear-gradient(180deg,color-mix(in srgb,var(--resonance-color) 14%,#101a2a),rgba(13,21,34,.9));
      box-shadow:0 0 12px color-mix(in srgb,var(--resonance-color) 24%,transparent);
    }
    .element-resonance-icons{
      flex:0 0 auto;
      display:flex;
      align-items:center;
      gap:2px;
    }
    .element-resonance-icons img{
      width:20px;
      height:20px;
      object-fit:contain;
      filter:grayscale(.7) brightness(.68);
    }
    .element-resonance-item.active .element-resonance-icons img{
      filter:drop-shadow(0 0 4px var(--resonance-color));
    }
    .element-resonance-times{
      color:#65738a;
      font-size:11px;
      font-weight:900;
      line-height:1;
    }
    .element-resonance-levels{
      min-width:0;
      display:flex;
      align-items:center;
      gap:3px;
      font-size:13px;
      font-weight:900;
      white-space:nowrap;
    }
    .element-resonance-levels .slash{color:#4e5c72;font-weight:600}
    .element-resonance-levels .tier{color:#59677d}
    .element-resonance-levels .tier.lit{
      color:#fff2b8;
      text-shadow:0 0 7px var(--resonance-color),0 1px 2px #000;
    }
    .element-resonance-item.resonance-upgraded{
      animation:resonanceBarPulse .78s ease-out;
    }
    .element-resonance-item.resonance-upgraded .tier.new-tier{
      animation:resonanceTierPulse .78s ease-out;
    }
    .element-resonance-activation-label{
      position:absolute;
      left:50%;
      top:50%;
      z-index:4;
      transform:translate(-50%,-50%);
      padding:5px 12px;
      border:1px solid var(--activation-color);
      border-radius:999px;
      background:rgba(7,12,21,.94);
      color:#fff4c6;
      font-size:13px;
      font-weight:900;
      letter-spacing:.5px;
      pointer-events:none;
      animation:resonanceLabelRise .9s ease-out forwards;
      box-shadow:0 0 18px color-mix(in srgb,var(--activation-color) 48%,transparent);
    }
    @keyframes resonanceBarPulse{
      0%{transform:scale(1);box-shadow:0 0 0 transparent}
      36%{transform:scale(1.07);border-color:#fff4bf;box-shadow:0 0 24px var(--resonance-color)}
      100%{transform:scale(1);box-shadow:0 0 12px color-mix(in srgb,var(--resonance-color) 24%,transparent)}
    }
    @keyframes resonanceTierPulse{
      0%{transform:scale(.72);filter:brightness(.8)}
      42%{transform:scale(1.55);filter:brightness(1.8)}
      100%{transform:scale(1);filter:brightness(1)}
    }
    @keyframes resonanceLabelRise{
      0%{opacity:0;transform:translate(-50%,-35%) scale(.86)}
      24%{opacity:1;transform:translate(-50%,-50%) scale(1)}
      72%{opacity:1}
      100%{opacity:0;transform:translate(-50%,-80%) scale(.96)}
    }
    .element-resonance-tooltip{
      position:fixed;
      z-index:5000;
      width:310px;
      display:none;
      pointer-events:none;
      padding:12px 14px;
      border:1px solid #4a607f;
      border-radius:10px;
      background:rgba(8,14,24,.97);
      box-shadow:0 14px 34px rgba(0,0,0,.58);
      color:#cbd7e8;
      font-size:12px;
      line-height:1.62;
    }
    .element-resonance-tooltip.show{display:block}
    .element-resonance-tooltip strong{display:block;margin-bottom:5px;color:#f6d88d;font-size:14px}
    .element-resonance-tooltip .current{margin-bottom:7px;color:#91a7c4}
    .element-resonance-tooltip .effect.active{color:#fff1b1}
    .element-resonance-roster{
      display:flex;
      flex-wrap:wrap;
      gap:6px;
      margin:8px 0 9px;
      padding:8px;
      border:1px solid #293a52;
      border-radius:8px;
      background:rgba(16,25,40,.82);
    }
    .element-resonance-roster-avatar{
      position:relative;
      width:34px;
      height:34px;
      flex:0 0 34px;
      border:2px solid #41516a;
      border-radius:50%;
      overflow:hidden;
      background:#101827;
      opacity:.32;
      filter:grayscale(1);
    }
    .element-resonance-roster-avatar.active{
      opacity:1;
      filter:none;
      border-color:var(--avatar-element-color);
      box-shadow:0 0 8px color-mix(in srgb,var(--avatar-element-color) 55%,transparent);
    }
    .element-resonance-roster-avatar img{
      width:100%;
      height:100%;
      display:block;
      object-fit:cover;
    }
    body.pve-resonance-layout .element-resonance-slot{
      position:absolute;
      left:0;
      right:0;
      top:52px;
      height:116px;
      border-bottom:0;
      background:linear-gradient(180deg,rgba(8,14,24,.76),rgba(8,14,24,.16));
    }
    body.pve-resonance-layout #game{margin-top:0}
    @media(max-width:760px){
      .element-resonance-slot{padding-left:10px;padding-right:10px}
      .element-resonance-row{gap:4px}
      .element-resonance-item{gap:3px;padding:0 3px}
      .element-resonance-icons img{width:16px;height:16px}
      .element-resonance-levels{font-size:11px;gap:2px}
    }
  `;
  document.head.appendChild(style);

  const colorMap = {
    火: '#ff6b4a',
    水: '#53b9ff',
    冰: '#9de8ff',
    雷: '#b58cff',
    风: '#70e0bd',
    岩: '#e3bd62'
  };
  const resonancePulseState = new Map();
  const resonanceUnitFlashes = [];

  const slot = document.getElementById('elementResonanceSlot');
  if (!slot) return;
  const tooltip = document.createElement('div');
  tooltip.className = 'element-resonance-tooltip';
  document.body.appendChild(tooltip);

  const countElements = team => {
    if (typeof started !== 'undefined' && started && window.elementResonanceBattleCounts?.[team]) {
      return { ...window.elementResonanceBattleCounts[team] };
    }
    const result = Object.fromEntries(ELEMENT_RESONANCE_CONFIG.map(item => [item.element, 0]));
    if (typeof units === 'undefined') return result;
    const seen = Object.fromEntries(ELEMENT_RESONANCE_CONFIG.map(item => [item.element, new Set()]));
    for (const unit of units) {
      if (!unit || !unit.alive || unit.isDummy || unit.isSummon || unit.inWarehouse || unit.onBench) continue;
      if (unit.team !== team || !(unit.element in result)) continue;
      const identity = unit.templateId || unit.name;
      if (seen[unit.element].has(identity)) continue;
      seen[unit.element].add(identity);
      result[unit.element] += 1;
    }
    return result;
  };

  const activeElementIdentities = (team, element) => {
    const identities = new Set();
    if (typeof units === 'undefined') return identities;
    for (const unit of units) {
      if (!unit || !unit.alive || unit.isDummy || unit.isSummon || unit.inWarehouse || unit.onBench) continue;
      if (unit.team !== team || unit.element !== element) continue;
      identities.add(unit.templateId || unit.name);
    }
    return identities;
  };

  const elementRoster = element => Object.entries(PIECE_CONFIG)
    .filter(([, config]) => config?.element === element)
    .map(([name, config], order) => ({
      name,
      identity: config.templateId || name,
      avatar: config.avatar || '',
      cost: Number(config.cost) || 0,
      order
    }))
    .sort((left, right) => left.cost - right.cost || left.order - right.order);

  const tierMarkup = (tiers, count) => tiers.map((tier, index) => {
    const slash = index ? '<span class="slash">/</span>' : '';
    return `${slash}<span class="tier ${count >= tier ? 'lit' : ''}">${tier}</span>`;
  }).join('');

  function renderTeam(team) {
    const counts = countElements(team);
    return `<div class="element-resonance-team-row ${team}">
      <span class="element-resonance-team-label">${team === 'red' ? '红方' : '蓝方'}</span>
      <div class="element-resonance-row">${ELEMENT_RESONANCE_CONFIG.map(config => {
      const count = counts[config.element] || 0;
      const active = count >= config.tiers[0];
      const pulse = resonancePulseState.get(`${team}:${config.element}`);
      const pulsing = pulse && pulse.until > performance.now();
      return `
        <div class="element-resonance-item ${active ? 'active' : ''} ${pulsing ? 'resonance-upgraded' : ''}"
             data-resonance-element="${config.element}"
             data-resonance-team="${team}"
             style="--resonance-color:${colorMap[config.element]}">
          <span class="element-resonance-icons">
            <img src="${config.icon}" alt="${config.element}">
            <span class="element-resonance-times">×</span>
            <img src="${config.icon}" alt="${config.element}">
          </span>
          <span class="element-resonance-levels">${config.tiers.map((tier, index) => {
            const slash = index ? '<span class="slash">/</span>' : '';
            const newest = pulsing && pulse.tier === tier ? 'new-tier' : '';
            return `${slash}<span class="tier ${count >= tier ? 'lit' : ''} ${newest}">${tier}</span>`;
          }).join('')}</span>
        </div>`;
      }).join('')}</div>
    </div>`;
  }

  let lastRenderKey = '';
  function render(force = false) {
    const renderKey = JSON.stringify({
      red: countElements('red'),
      blue: countElements('blue'),
      pve: !!window.PVE_FIRST_ACTIVE
    });
    if (!force && renderKey === lastRenderKey) {
      document.body.classList.toggle('pve-resonance-layout', !!window.PVE_FIRST_ACTIVE);
      return;
    }
    lastRenderKey = renderKey;
    slot.innerHTML = renderTeam('red') + renderTeam('blue');
    document.body.classList.toggle('pve-resonance-layout', !!window.PVE_FIRST_ACTIVE);
    if (!started && selectedUnit && inspect?.classList.contains('show')) {
      requestAnimationFrame(() => renderUnitInspect(selectedUnit));
    }
  }

  function triggerResonanceActivation(team, element, tier) {
    const config = ELEMENT_RESONANCE_CONFIG.find(item => item.element === element);
    if (!config) return;
    const now = performance.now();
    resonancePulseState.set(`${team}:${element}`, { tier, until: now + 900 });
    for (const unit of units) {
      if (!unit?.alive || unit.onBench || unit.inWarehouse || unit.isDummy || unit.isSummon) continue;
      if (unit.team !== team || unit.element !== element) continue;
      resonanceUnitFlashes.push({
        unitId: unit.id,
        color: colorMap[element],
        start: now,
        duration: 720
      });
      spawn(unit, colorMap[element], 16);
    }
    render(true);
    const label = document.createElement('div');
    label.className = 'element-resonance-activation-label';
    label.style.setProperty('--activation-color', colorMap[element]);
    label.textContent = `${team === 'red' ? '红方' : '蓝方'} · ${config.name} · ${tier}${element}`;
    slot.appendChild(label);
    setTimeout(() => {
      label.remove();
      resonancePulseState.delete(`${team}:${element}`);
      for (const unit of units) {
        if (unit?.team === team && unit.element === element && !started) unit.flash = 0;
      }
      render(true);
    }, 920);
  }

  function showTooltip(item, event) {
    const config = ELEMENT_RESONANCE_CONFIG.find(entry => entry.element === item.dataset.resonanceElement);
    if (!config) return;
    const team = item.dataset.resonanceTeam || 'blue';
    const count = countElements(team)[config.element] || 0;
    const activeIdentities = activeElementIdentities(team, config.element);
    const roster = elementRoster(config.element);
    const currentTier = [...config.tiers].reverse().find(tier => count >= tier) || 0;
    tooltip.innerHTML = `
      <strong>${team === 'red' ? '红方' : '蓝方'} · ${config.element}元素共鸣 · ${config.name}</strong>
      <div class="current">当前场上不同${config.element}元素角色：${count}　当前档位：${currentTier || '未激活'}<br>同名角色只计算一次。</div>
      <div class="element-resonance-roster">${roster.map(role => `
        <span class="element-resonance-roster-avatar ${activeIdentities.has(role.identity) ? 'active' : ''}"
              style="--avatar-element-color:${colorMap[config.element]}"
              title="${role.name}">
          <img src="${role.avatar}" alt="${role.name}">
        </span>
      `).join('')}</div>
      ${config.effects.map((text, index) => `<div class="effect ${count >= config.tiers[index] ? 'active' : ''}">${text}</div>`).join('')}
    `;
    tooltip.classList.add('show');
    moveTooltip(event);
  }

  function moveTooltip(event) {
    const gap = 16;
    const width = 310;
    const x = Math.min(window.innerWidth - width - 12, event.clientX + gap);
    const y = Math.min(window.innerHeight - tooltip.offsetHeight - 12, event.clientY + gap);
    tooltip.style.left = `${Math.max(12, x)}px`;
    tooltip.style.top = `${Math.max(12, y)}px`;
  }

  slot.addEventListener('pointerover', event => {
    const item = event.target.closest('.element-resonance-item');
    if (item) showTooltip(item, event);
  });
  slot.addEventListener('pointermove', event => {
    if (tooltip.classList.contains('show')) moveTooltip(event);
  });
  slot.addEventListener('pointerout', event => {
    if (!event.relatedTarget?.closest?.('.element-resonance-item')) tooltip.classList.remove('show');
  });

  window.renderElementResonance = render;

  const highestTier = (element, count) => {
    const config = ELEMENT_RESONANCE_CONFIG.find(item => item.element === element);
    return [...(config?.tiers || [])].reverse().find(tier => count >= tier) || 0;
  };

  const resonanceTier = (unit, element) => {
    if (!unit?.team) return 0;
    const counts = window.elementResonanceBattleCounts?.[unit.team] || countElements(unit.team);
    return highestTier(element, counts?.[element] || 0);
  };

  const buildBattleCounts = () => {
    window.elementResonanceBattleCounts = null;
    window.elementResonanceBattleCounts = {
      red: countElements('red'),
      blue: countElements('blue')
    };
    for (const unit of units) {
      if (!unit || unit.onBench || unit.inWarehouse || unit.isDummy || unit.isSummon) continue;
      unit.elementResonanceTeam = unit.team;
    }
  };

  const applyOpeningResonance = () => {
    buildBattleCounts();
    for (const unit of units) {
      if (!unit?.alive || unit.onBench || unit.inWarehouse || unit.isDummy || unit.isSummon) continue;
      const waterTier = resonanceTier(unit, '水');
      const iceTier = resonanceTier(unit, '冰');
      const electroTier = resonanceTier(unit, '雷');
      const resonanceManaPerSecond = electroTier >= 5 ? 5 : electroTier >= 4 ? 3 : electroTier >= 3 ? 2 : electroTier >= 2 ? 1 : 0;
      unit._battleResonanceTiers = {
        fire: resonanceTier(unit, '火'),
        water: waterTier,
        ice: iceTier,
        electro: electroTier,
        wind: resonanceTier(unit, '风'),
        geo: resonanceTier(unit, '岩')
      };
      const hpBonus = waterTier >= 4 ? .30 : waterTier >= 3 ? .20 : waterTier >= 2 ? .15 : 0;
      unit._resonanceHpApplied = hpBonus;
      unit._resonanceManaPerSecond = resonanceManaPerSecond;
      unit.equipmentStats ||= {};
      unit.equipmentStats.manaPerSecond = (Number(unit.equipmentStats.manaPerSecond) || 0) + resonanceManaPerSecond;
      unit._resonanceBaseMaxHp = unit.maxHp;
      if (hpBonus > 0) {
        unit.maxHp = Math.round(unit._resonanceBaseMaxHp * (1 + hpBonus));
        unit.hp = unit.maxHp;
      }
      const critBonus = iceTier >= 5 ? .30 : iceTier >= 4 ? .25 : iceTier >= 3 ? .20 : iceTier >= 2 ? .15 : 0;
      if (critBonus > 0 && !unit._resonanceCritApplied) {
        unit._resonanceCritApplied = critBonus;
        unit.critRate += critBonus;
        if (iceTier >= 4) unit.critDamage += iceTier >= 5 ? .30 : .20;
      }
      if (electroTier >= 4) unit.mp = Math.min(unit.maxMp, unit.mp + (electroTier >= 5 ? 20 : 10));
    }
    window.elementResonanceRuntime = {
      secondAccumulator: 0,
      iceTriggered: { red: false, blue: false },
      windTriggered: { red: false, blue: false }
    };
    render();
  };

  const previousGetFinalStat = getFinalStat;
  getFinalStat = function(unit, key) {
    let value = previousGetFinalStat(unit, key);
    if (!unit?.team) return value;
    if (key === 'atk') {
      const tier = resonanceTier(unit, '火');
      const ratio = tier >= 5 ? .50 : tier >= 4 ? .35 : tier >= 3 ? .30 : tier >= 2 ? .20 : 0;
      value *= 1 + ratio;
    }
    if (key === 'as') {
      const tier = resonanceTier(unit, '风');
      const ratio = tier >= 4 ? .45 : tier >= 3 ? .30 : tier >= 2 ? .15 : 0;
      value *= 1 + ratio;
      const fireBurst = has(unit, 'fireResonanceBurst');
      if (fireBurst) value *= 1 + (Number(fireBurst.value) || .30);
    }
    return Math.round(value * 100) / 100;
  };

  const previousOutgoingDamageModifier = outgoingDamageModifier;
  outgoingDamageModifier = function(unit, target) {
    let value = previousOutgoingDamageModifier(unit, target);
    const tier = resonanceTier(unit, '火');
    if (tier >= 5) value += .25;
    else if (tier >= 4) value += .15;
    return Math.round(value * 100) / 100;
  };

  const waterHpRatio = unit => {
    const tier = resonanceTier(unit, '水');
    return tier >= 4 ? .30 : tier >= 3 ? .20 : tier >= 2 ? .15 : 0;
  };

  const iceCritBonus = unit => {
    const tier = resonanceTier(unit, '冰');
    return tier >= 5 ? .30 : tier >= 4 ? .25 : tier >= 3 ? .20 : tier >= 2 ? .15 : 0;
  };

  const iceCritDamageBonus = unit => {
    const tier = resonanceTier(unit, '冰');
    return tier >= 5 ? .30 : tier >= 4 ? .20 : 0;
  };

  function refreshResonanceInspect(unit) {
    if (!unit || !inspect?.classList.contains('show') || selectedUnit !== unit) return;
    const apply = () => {
      if (!inspect?.classList.contains('show') || selectedUnit !== unit) return;
      const hpRatio = waterHpRatio(unit);
      if (hpRatio > 0 && !started) {
        const maxHp = Math.round(unit.maxHp * (1 + hpRatio));
        const hp = Math.round((unit.hp / Math.max(1, unit.maxHp)) * maxHp);
        const hpHead = [...inspect.querySelectorAll('.resource-head')]
          .find(node => node.querySelector('span')?.textContent.trim() === '生命');
        if (hpHead?.querySelector('b')) hpHead.querySelector('b').textContent = `${hp} / ${maxHp}`;
        const hpFill = hpHead?.parentElement?.querySelector('.resource-fill.hp');
        if (hpFill) hpFill.style.width = `${Math.max(0, Math.min(100, hp / maxHp * 100))}%`;
      }
      if (!started) {
        const electroTier = resonanceTier(unit, '雷');
        const openingMana = electroTier >= 5 ? 20 : electroTier >= 4 ? 10 : 0;
        if (openingMana > 0) {
          const mpHead = [...inspect.querySelectorAll('.resource-head')]
            .find(node => node.querySelector('span')?.textContent.trim() === '法力');
          const shownMp = Math.min(unit.maxMp, unit.mp + openingMana);
          if (mpHead?.querySelector('b')) mpHead.querySelector('b').textContent = `${Math.floor(shownMp)} / ${unit.maxMp}`;
          const mpFill = mpHead?.parentElement?.querySelector('.resource-fill.mp');
          if (mpFill) mpFill.style.width = `${Math.max(0, Math.min(100, shownMp / Math.max(1, unit.maxMp) * 100))}%`;
        }
      }
      const panelElectroTier = resonanceTier(unit, '雷');
      const resonanceManaRate = panelElectroTier >= 5 ? 5 : panelElectroTier >= 4 ? 3 : panelElectroTier >= 3 ? 2 : panelElectroTier >= 2 ? 1 : 0;
      const baseManaRate = (unit.weapon === '法器' ? 5 : 0) + (Number(unit.equipmentStats?.manaPerSecond) || 0);
      const visibleManaRate = baseManaRate + (!started ? resonanceManaRate : 0);
      const manaRateNode = inspect.querySelector('.mana-regen-rate');
      if (manaRateNode) manaRateNode.textContent = visibleManaRate > 0 ? `+${Number.isInteger(visibleManaRate) ? visibleManaRate : visibleManaRate.toFixed(1)}/s` : '';
      const critItem = [...inspect.querySelectorAll('.stat-item')]
        .find(node => node.querySelector('span')?.textContent.trim() === '暴击');
      if (critItem?.querySelector('b')) {
        critItem.querySelector('b').textContent = `${Math.round(((unit.critRate || 0) + (!started ? iceCritBonus(unit) : 0)) * 100)}%`;
      }
      const critDamageItem = [...inspect.querySelectorAll('.stat-item')]
        .find(node => node.querySelector('span')?.textContent.trim() === '暴伤');
      if (critDamageItem?.querySelector('b')) {
        critDamageItem.querySelector('b').textContent = `${Math.round(((unit.critDamage || 0) + (!started ? iceCritDamageBonus(unit) : 0)) * 100)}%`;
      }
    };
    requestAnimationFrame(() => requestAnimationFrame(apply));
  }

  const previousRenderUnitInspect = renderUnitInspect;
  renderUnitInspect = function(unit) {
    const result = previousRenderUnitInspect(unit);
    refreshResonanceInspect(unit);
    return result;
  };

  const previousResistanceFlatBonus = resistanceFlatBonus;
  resistanceFlatBonus = function(unit) {
    let value = previousResistanceFlatBonus(unit);
    const tier = resonanceTier(unit, '岩');
    if (tier >= 3) value += 25;
    else if (tier >= 2) value += 15;
    if (tier >= 3 && has(unit, 'geoResonanceDef')) value += 10;
    return value;
  };

  const previousEffect = effect;
  effect = function(unit, type, duration, value = 0) {
    if (type === 'geoResonanceAtk' && resonanceTier(unit, '岩') >= 3) value = 20;
    return previousEffect(unit, type, duration, value);
  };

  const previousCastSkill = castSkill;
  castSkill = function(unit) {
    const wasAbleToCast = unit?.alive && unit.mp >= unit.maxMp;
    const result = previousCastSkill(unit);
    if (wasAbleToCast && unit?.alive) {
      if (resonanceTier(unit, '火') >= 5) effect(unit, 'fireResonanceBurst', 5, .30);
      if (resonanceTier(unit, '雷') >= 5) unit.mp = Math.min(unit.maxMp, unit.mp + 10);
    }
    return result;
  };

  const previousStartBattle = startBattle;
  startBattle = function() {
    previousStartBattle();
    if (started && !ended) applyOpeningResonance();
  };
  if (startBtn) startBtn.onclick = startBattle;

  const freezeEnemyTeam = team => {
    for (const target of units.filter(unit => unit.alive && !unit.onBench && unit.team !== team)) {
      const duration = typeof applyEquipmentHardControl === 'function'
        ? applyEquipmentHardControl(target, 2, 'freeze')
        : 2;
      target.hardFreeze = Math.max(target.hardFreeze || 0, duration);
      triggerElementalHit(target, '冰');
      spawn(target, colorMap.冰, 14);
    }
    addLog(`${team === 'blue' ? '蓝方' : '红方'}触发【粉碎之霜】：冻结全部敌人2秒`, 'reaction');
  };

  const triggerWindStrike = team => {
    const windUnits = units
      .filter(unit => unit.alive && !unit.onBench && unit.team === team && unit.element === '风')
      .sort((a, b) => effectiveAtk(b) - effectiveAtk(a));
    const source = windUnits[0];
    if (!source) return;
    for (const target of units.filter(unit => unit.alive && !unit.onBench && unit.team !== team)) {
      const dealt = damage(source, target, effectiveAtk(source), {
        skill: true,
        elemental: true,
        damageElement: '风'
      });
      if (target.alive) attachAndReact(source, target, dealt);
      spawn(target, colorMap.风, 16);
    }
    addLog(`${team === 'blue' ? '蓝方' : '红方'}触发【迅捷之风】：风元素冲击全部敌人`, 'reaction');
  };

  const previousTick = tick;
  tick = function(dt) {
    previousTick(dt);
    if (!started || ended || paused) return;
    const runtime = window.elementResonanceRuntime;
    if (!runtime) return;
    runtime.secondAccumulator += dt;
    while (runtime.secondAccumulator >= 1) {
      runtime.secondAccumulator -= 1;
      for (const unit of units) {
        if (!unit?.alive || unit.onBench || unit.inWarehouse || unit.isDummy || unit.isSummon) continue;
        const waterTier = unit._battleResonanceTiers?.water ?? resonanceTier(unit, '水');
        const electroTier = unit._battleResonanceTiers?.electro ?? resonanceTier(unit, '雷');
        if (waterTier >= 4) healUnit(unit, unit.maxHp * .02, unit, false);
      }
    }
    for (const team of ['red', 'blue']) {
      const counts = window.elementResonanceBattleCounts?.[team] || {};
      if (!runtime.iceTriggered[team] && time >= 8 && (counts.冰 || 0) >= 5) {
        runtime.iceTriggered[team] = true;
        freezeEnemyTeam(team);
      }
      if (!runtime.windTriggered[team] && time >= 8 && (counts.风 || 0) >= 4) {
        runtime.windTriggered[team] = true;
        triggerWindStrike(team);
      }
    }
  };

  const previousPlaceUnit = placeUnit;
  placeUnit = function(unit, destination) {
    const before = {
      red: countElements('red'),
      blue: countElements('blue')
    };
    const result = previousPlaceUnit(unit, destination);
    let activated = false;
    if (!started && !ended) {
      const after = {
        red: countElements('red'),
        blue: countElements('blue')
      };
      for (const team of ['red', 'blue']) {
        for (const config of ELEMENT_RESONANCE_CONFIG) {
          const oldTier = highestTier(config.element, before[team][config.element] || 0);
          const newTier = highestTier(config.element, after[team][config.element] || 0);
          if (newTier > oldTier) {
            activated = true;
            triggerResonanceActivation(team, config.element, newTier);
          }
        }
      }
    }
    if (!activated) render(true);
    if (selectedUnit) refreshResonanceInspect(selectedUnit);
    return result;
  };

  const previousDraw = draw;
  draw = function() {
    previousDraw();
    const now = performance.now();
    for (let index = resonanceUnitFlashes.length - 1; index >= 0; index--) {
      const flash = resonanceUnitFlashes[index];
      const unit = typeof getUnitById === 'function' ? getUnitById(flash.unitId) : null;
      const progress = (now - flash.start) / flash.duration;
      if (!unit?.alive || unit.onBench || progress >= 1) {
        resonanceUnitFlashes.splice(index, 1);
        continue;
      }
      const position = unitVisualPos(unit);
      const ease = 1 - Math.pow(1 - Math.max(0, progress), 3);
      const alpha = Math.sin(Math.min(1, progress) * Math.PI);
      ctx.save();
      ctx.globalAlpha = alpha * .78;
      ctx.strokeStyle = flash.color;
      ctx.lineWidth = 4 - progress * 2;
      ctx.shadowColor = flash.color;
      ctx.shadowBlur = 18 * alpha;
      ctx.beginPath();
      ctx.arc(position.x, position.y, 28 + ease * 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = alpha * .34;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(position.x, position.y, 22 + ease * 29, 0, Math.PI * 2);
      ctx.stroke();
      for (let ray = 0; ray < 6; ray++) {
        const angle = ray * Math.PI / 3 + progress * .35;
        const inner = 30 + ease * 5;
        const outer = 38 + ease * 16;
        ctx.beginPath();
        ctx.moveTo(position.x + Math.cos(angle) * inner, position.y + Math.sin(angle) * inner);
        ctx.lineTo(position.x + Math.cos(angle) * outer, position.y + Math.sin(angle) * outer);
        ctx.stroke();
      }
      ctx.restore();
    }
  };

  render();
  setInterval(render, 250);
})();
