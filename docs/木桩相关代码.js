/*
 * 木桩相关代码（独立整理版）
 *
 * 用途：
 * - 集中保存木桩头像、单位数据、仓库卡片与绘制逻辑。
 * - 本文件是便于复制和后续重构的参考模块。
 * - 当前游戏仍由 index.html 中的原有逻辑运行。
 */

const DUMMY_AVATAR_PATH = 'assets/avatars/training-dummy.png';

const DUMMY_CONFIG = {
  templateId: 'dummy',
  name: '木桩',
  cost: 0,
  element: '火',
  weapon: '双手剑',
  avatar: DUMMY_AVATAR_PATH,

  hp: 2000,
  maxHp: 2000,
  atk: 0,
  attackSpeed: 0,
  critRate: 0,
  critDamage: 0,
  range: 0,
  resist: 40,
  mana: 0,
  maxMana: 0
};

function createDummyUnit(id, team, row, col, onBench = false, benchIndex = null) {
  return {
    id,
    name: DUMMY_CONFIG.name,
    templateId: DUMMY_CONFIG.templateId,
    cost: DUMMY_CONFIG.cost,
    star: 1,

    team,
    row,
    col,
    onBench,
    benchIndex,
    inWarehouse: false,

    element: DUMMY_CONFIG.element,
    weapon: DUMMY_CONFIG.weapon,
    isDummy: true,
    isSummon: false,

    hp: DUMMY_CONFIG.hp,
    maxHp: DUMMY_CONFIG.maxHp,
    atk: DUMMY_CONFIG.atk,
    as: DUMMY_CONFIG.attackSpeed,
    critRate: DUMMY_CONFIG.critRate,
    critDamage: DUMMY_CONFIG.critDamage,
    range: DUMMY_CONFIG.range,
    def: DUMMY_CONFIG.resist,
    mp: DUMMY_CONFIG.mana,
    maxMp: DUMMY_CONFIG.maxMana,

    alive: true,
    skillReady: false,
    target: null,
    targetId: null,
    attach: null,
    effects: [],

    damageDealt: 0,
    damageTaken: 0,
    damageByType: {},
    takenByType: {},
    healingDone: 0,
    shieldingDone: 0,

    equipment: [null, null, null],
    equipmentRuntime: {
      timers: {},
      cooldowns: {},
      stacks: {},
      triggered: {},
      targetCooldowns: {}
    }
  };
}

function getDummyWarehouseCardConfig() {
  return {
    cost: DUMMY_CONFIG.cost,
    element: DUMMY_CONFIG.element,
    weapon: DUMMY_CONFIG.weapon,
    avatar: DUMMY_CONFIG.avatar
  };
}

function drawDummyAvatar(ctx, unit, position, avatarImages, selectedUnit) {
  const image = avatarImages.木桩;

  ctx.save();
  ctx.beginPath();
  ctx.arc(position.x, position.y, 21, 0, Math.PI * 2);
  ctx.clip();

  ctx.fillStyle = '#f6f2e8';
  ctx.fillRect(
    position.x - 22,
    position.y - 22,
    44,
    44
  );

  if (
    image &&
    image.complete &&
    image.naturalWidth > 0
  ) {
    ctx.drawImage(
      image,
      position.x - 23,
      position.y - 23,
      46,
      46
    );
  }

  ctx.restore();

  // 恢复头像外圈路径，供主绘制函数继续描边。
  ctx.beginPath();
  ctx.arc(
    position.x,
    position.y,
    unit === selectedUnit ? 28 : 25,
    0,
    Math.PI * 2
  );
}

function resetDummyAfterDamage(unit) {
  if (!unit?.isDummy) return false;

  if (unit.hp <= 0) {
    unit.hp = unit.maxHp;
    unit.alive = true;
  }

  return true;
}

function canDummyAct(unit) {
  return !unit?.isDummy;
}

function canDummyEquip(unit) {
  return !unit?.isDummy;
}

