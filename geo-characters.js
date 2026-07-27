/* 凝光、纳维亚：独立延迟弹道与岩元素命中特效。 */
(() => {
  const GEO_COLOR = '#e5bd5b';
  const GEO_BRIGHT = '#fff0a6';
  let projectiles = [];
  let impacts = [];
  let nextCastId = 1;
  const naviaCasts = new Map();

  SKILL_INFO.凝光 =
    '初始法力10/60。星璇爆发：向当前目标发射一枚大型岩元素法球；法球接触目标后，造成150/300/600 + 攻击力×160%/220%/320%的岩元素伤害并施加岩元素附着。单体技能，不造成范围伤害；目标失效时重新选择合法目标。';
  SKILL_BRIEF.凝光 =
    '大型岩元素法球命中后，造成150/300/600 + 攻击力×160%/220%/320%的单体岩伤并附着。';
  SKILL_INFO.纳维亚 =
    '初始法力50/80。晶火裁断：锁定距离最近的3名敌人，从每名目标右上方约一个头像距离处召来大型岩元素弹，依次砸落。每名目标受到45/90/180 + 攻击力×80%/100%/150%的岩元素伤害，施加岩元素附着并独立触发反应。全部弹体结算后，纳维亚获得200/350/700 + 攻击力×180%/200%/300%的护盾，持续5秒。';
  SKILL_BRIEF.纳维亚 =
    '向最近3名敌人各砸下一枚岩弹，独立造成45/90/180 + 攻击力×80%/100%/150%岩伤并附着；结算后获得5秒护盾。';

  function livingEnemies(source) {
    return units
      .filter(unit => isValidCombatTarget(source, unit))
      .sort((a, b) => dist(source, a) - dist(source, b) || String(a.id).localeCompare(String(b.id)));
  }

  function lockCaster(unit, duration) {
    unit.mp = 0;
    unit.skillReady = false;
    unit.aiState = 'CASTING';
    unit.attackCd = Math.max(unit.attackCd || 0, duration);
    cancelCurrentPath(unit);
  }

  function releaseCaster(unit) {
    if (!unit?.alive) return;
    unit.aiState = 'IDLE';
    unit.decisionCooldown = .08;
    unit.target = getUnitById(unit.targetId) || null;
  }

  function castNingguang(unit) {
    const target = getUnitById(unit.targetId) || livingEnemies(unit)[0];
    if (!target) return;
    unit.targetId = target.id;
    unit.target = target;
    lockCaster(unit, .56);
    showReaction(unit, 'skill', '星璇爆发');
    projectiles.push({
      kind: 'ningguang',
      sourceId: unit.id,
      targetId: target.id,
      elapsed: 0,
      duration: .54,
      seed: Math.random() * Math.PI * 2
    });
  }

  function castNavia(unit) {
    const targets = livingEnemies(unit).slice(0, 3);
    if (!targets.length) return;
    const castId = nextCastId++;
    naviaCasts.set(castId, unit.id);
    lockCaster(unit, .76);
    showReaction(unit, 'skill', '晶火裁断');
    targets.forEach((target, index) => {
      projectiles.push({
        kind: 'navia',
        castId,
        sourceId: unit.id,
        targetId: target.id,
        elapsed: -index * .09,
        duration: .42,
        seed: Math.random() * Math.PI * 2
      });
    });
  }

  const previousCastSkill = castSkill;
  castSkill = function geoCharacterCastSkill(unit) {
    if (unit?.name === '凝光') return castNingguang(unit);
    if (unit?.name === '纳维亚') return castNavia(unit);
    return previousCastSkill(unit);
  };

  function retarget(projectile, source, reserved = new Set()) {
    const current = getUnitById(projectile.targetId);
    if (isValidCombatTarget(source, current)) return current;
    const replacement = livingEnemies(source).find(unit => !reserved.has(unit.id));
    projectile.targetId = replacement?.id ?? null;
    return replacement || null;
  }

  function impactPosition(target) {
    const p = unitVisualPos(target);
    return { x: p.x, y: p.y };
  }

  function resolveHit(projectile, source, target) {
    const p = impactPosition(target);
    impacts.push({
      x: p.x,
      y: p.y,
      elapsed: 0,
      duration: projectile.kind === 'navia' ? .52 : .42,
      size: projectile.kind === 'navia' ? 35 : 28,
      seed: projectile.seed
    });
    spawn(target, GEO_COLOR, projectile.kind === 'navia' ? 24 : 18);

    let raw;
    if (projectile.kind === 'ningguang') {
      raw = valueForStar(source, [150, 300, 600]) +
        effectiveAtk(source) * valueForStar(source, [1.6, 2.2, 3.2]);
    } else {
      raw = valueForStar(source, [45, 90, 180]) +
        effectiveAtk(source) * valueForStar(source, [.8, 1, 1.5]);
    }
    const dealt = damage(source, target, raw, {
      skill: true,
      elemental: true,
      damageElement: '岩'
    });
    if (target.alive) attachAndReact(source, target, dealt);
    addLog(`${source.name} 的【${projectile.kind === 'ningguang' ? '星璇爆发' : '晶火裁断'}】命中 ${target.name}，造成 ${Math.round(dealt)} 点岩元素伤害`, 'skill');
  }

  function applyNaviaShield(source) {
    if (!source?.alive) return;
    let amount = valueForStar(source, [200, 350, 700]) +
      effectiveAtk(source) * valueForStar(source, [1.8, 2, 3]);
    if (typeof applyEquipmentShieldAmount === 'function') {
      amount = applyEquipmentShieldAmount(source, amount);
    }
    source.naviaShield = { value: amount, max: amount, time: 5, source, label: '晶火护盾' };
    source.shieldingDone = (source.shieldingDone || 0) + amount;
    spawn(source, GEO_BRIGHT, 20);
    addLog(`${source.name} 获得 ${Math.round(amount)} 点【晶火护盾】，持续5秒`, 'skill');
    releaseCaster(source);
  }

  function tickGeoProjectiles(dt) {
    if (paused || ended || !started) return;
    const resolvedCasts = new Set();
    const remaining = [];
    for (const projectile of projectiles) {
      projectile.elapsed += dt;
      if (projectile.elapsed < 0) {
        remaining.push(projectile);
        continue;
      }
      const source = getUnitById(projectile.sourceId);
      if (!source?.alive) continue;
      const target = retarget(projectile, source);
      if (!target) {
        if (projectile.kind === 'ningguang') releaseCaster(source);
        if (projectile.castId) resolvedCasts.add(projectile.castId);
        continue;
      }
      if (projectile.elapsed < projectile.duration) {
        remaining.push(projectile);
        continue;
      }
      resolveHit(projectile, source, target);
      if (projectile.kind === 'ningguang') releaseCaster(source);
      if (projectile.castId) resolvedCasts.add(projectile.castId);
    }
    projectiles = remaining;

    for (const castId of resolvedCasts) {
      if (projectiles.some(p => p.castId === castId)) continue;
      const source = getUnitById(naviaCasts.get(castId));
      naviaCasts.delete(castId);
      if (source) applyNaviaShield(source);
    }

    for (const unit of units) {
      if (!unit.naviaShield) continue;
      unit.naviaShield.time -= dt;
      if (unit.naviaShield.time <= 0 || unit.naviaShield.value <= 0) {
        unit.naviaShield = null;
      }
    }
    impacts.forEach(impact => impact.elapsed += dt);
    impacts = impacts.filter(impact => impact.elapsed < impact.duration);
  }

  const previousTick = tick;
  tick = function geoCharacterTick(dt) {
    tickGeoProjectiles(dt);
    return previousTick(dt);
  };

  const previousGetUnitShield = getUnitShield;
  getUnitShield = function geoCharacterGetUnitShield(unit) {
    return previousGetUnitShield(unit) || unit?.naviaShield || null;
  };

  const previousAbsorbShieldDamage = absorbShieldDamage;
  absorbShieldDamage = function geoCharacterAbsorbShield(target, amount) {
    const active = getUnitShield(target);
    if (active !== target?.naviaShield) return previousAbsorbShieldDamage(target, amount);
    if (!active || active.value <= 0) return 0;
    const absorbed = Math.min(active.value, amount);
    active.value -= absorbed;
    if (active.value <= 0) {
      target.naviaShield = null;
      addLog(`${target.name} 的【晶火护盾】被打破`, 'reaction');
    }
    return absorbed;
  };

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function drawRockOrb(x, y, radius, rotation, alpha = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.globalAlpha = alpha;
    ctx.shadowBlur = radius * .5;
    ctx.shadowColor = 'rgba(230,177,61,.62)';
    ctx.fillStyle = '#bd8730';
    ctx.strokeStyle = '#f0cf73';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      const r = radius * (i % 2 ? .82 : 1);
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.globalAlpha = alpha * .66;
    ctx.fillStyle = '#f7dc82';
    ctx.beginPath();
    ctx.moveTo(-radius * .15, -radius * .65);
    ctx.lineTo(radius * .45, -radius * .05);
    ctx.lineTo(0, radius * .62);
    ctx.lineTo(-radius * .5, radius * .05);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawGeoProjectiles() {
    for (const projectile of projectiles) {
      if (projectile.elapsed < 0) continue;
      const source = getUnitById(projectile.sourceId);
      const target = getUnitById(projectile.targetId);
      if (!source?.alive || !target?.alive) continue;
      const targetPos = unitVisualPos(target);
      const t = Math.min(1, Math.max(0, projectile.elapsed / projectile.duration));
      let from;
      if (projectile.kind === 'ningguang') {
        from = unitVisualPos(source);
      } else {
        from = { x: targetPos.x + 42, y: targetPos.y - 42 };
      }
      const eased = easeOutCubic(t);
      const x = from.x + (targetPos.x - from.x) * eased;
      const baseY = from.y + (targetPos.y - from.y) * eased;
      const arc = projectile.kind === 'ningguang' ? -Math.sin(Math.PI * t) * 18 : -Math.sin(Math.PI * t) * 6;
      const y = baseY + arc;
      const radius = projectile.kind === 'ningguang' ? 15 : 19;

      ctx.save();
      for (let i = 1; i <= 4; i++) {
        const backT = Math.max(0, t - i * .045);
        const bx = from.x + (targetPos.x - from.x) * easeOutCubic(backT);
        const by = from.y + (targetPos.y - from.y) * easeOutCubic(backT) +
          (projectile.kind === 'ningguang' ? -Math.sin(Math.PI * backT) * 18 : -Math.sin(Math.PI * backT) * 6);
        ctx.globalAlpha = .15 * (1 - i / 5);
        ctx.fillStyle = '#dda83e';
        ctx.beginPath();
        ctx.arc(bx, by, Math.max(2, radius * (1 - i / 5) * .42), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      drawRockOrb(x, y, radius, projectile.seed + projectile.elapsed * 5);
    }
  }

  function drawGeoImpacts() {
    for (const impact of impacts) {
      const t = Math.min(1, impact.elapsed / impact.duration);
      const fade = 1 - t;
      ctx.save();
      ctx.translate(impact.x, impact.y);
      ctx.globalAlpha = fade * .5;
      ctx.strokeStyle = '#dfac43';
      ctx.shadowBlur = 6;
      ctx.shadowColor = 'rgba(226,171,59,.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 15, impact.size * t + 7, (impact.size * t + 7) * .34, 0, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 9; i++) {
        const a = impact.seed + i * Math.PI * 2 / 9;
        const r = 7 + impact.size * t;
        ctx.globalAlpha = fade * (.25 + (i % 3) * .08);
        ctx.fillStyle = i % 2 ? '#f0d47d' : '#c18b31';
        ctx.beginPath();
        ctx.arc(Math.cos(a) * r, 10 + Math.sin(a) * r * .45, 2.5 + (i % 3), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  const previousDraw = draw;
  draw = function geoCharacterDraw() {
    previousDraw();
    drawGeoProjectiles();
    drawGeoImpacts();
  };

  function clearGeoEffects() {
    projectiles = [];
    impacts = [];
    naviaCasts.clear();
    for (const unit of units) unit.naviaShield = null;
  }

  const previousEnterPreparation = enterPreparation;
  enterPreparation = function geoCharacterEnterPreparation(...args) {
    clearGeoEffects();
    return previousEnterPreparation(...args);
  };

  const previousStartBattle = startBattle;
  startBattle = function geoCharacterStartBattle(...args) {
    clearGeoEffects();
    return previousStartBattle(...args);
  };
})();
