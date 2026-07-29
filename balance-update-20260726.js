/*
 * 2026-07-26 confirmed balance/mechanics layer.
 * This file intentionally changes combat data and rules only. It does not
 * change board, shop, warehouse, inspect-panel, or PVE layout.
 */
(function(){
'use strict';

const WEAPON_NORMAL={
  '双手剑':[20,.35],
  '单手剑':[20,.65],
  '长柄':[20,.70],
  '弓':[20,.85],
  '法器':[20,.20]
};
const B={
  优菈:{hp:[1020,1683,2856],atk:[30,45,70],pr:55,er:45,as:.70,range:1,mana:[40,80]},
  迪卢克:{hp:[900,1485,2520],atk:[40,60,90],pr:45,er:35,as:.80,range:1,mana:[30,70]},
  妮露:{hp:[760,1254,1976],atk:[55,85,125],pr:40,er:35,as:1,range:1,mana:[10,55]},
  芙宁娜:{hp:[920,1518,2392],atk:[40,60,90],pr:40,er:35,as:.90,range:1,mana:[30,90]},
  莱依拉:{hp:[700,1120,1645],atk:[35,55,80],pr:30,er:35,as:.85,range:4,mana:[20,90]},
  芭芭拉:{hp:[760,1216,1786],atk:[30,45,70],pr:30,er:35,as:.85,range:4,mana:[0,75]},
  夏洛蒂:{hp:[680,1088,1598],atk:[40,60,90],pr:30,er:35,as:.90,range:4,mana:[40,80]},
  宵宫:{hp:[560,896,1316],atk:[50,80,125],pr:30,er:30,as:1.05,range:4,mana:[20,50]},
  早柚:{hp:[950,1568,2660],atk:[25,40,60],pr:55,er:45,as:.75,range:1,mana:[40,90]},
  申鹤:{hp:[800,1240,1800],atk:[45,70,100],pr:40,er:35,as:.95,range:2,mana:[35,85]},
  久岐忍:{hp:[850,1405,2210],atk:[55,85,125],pr:55,er:50,as:.95,range:1,mana:[20,75]},
  可莉:{hp:[650,1040,1528],atk:[60,90,135],pr:30,er:35,as:.95,range:4,mana:[10,60]},
  夜兰:{hp:[600,960,1410],atk:[35,65,105],pr:30,er:30,as:1,range:4,mana:[20,70]},
  神里绫华:{hp:[800,1320,2080],atk:[55,85,125],pr:40,er:35,as:1,range:1,mana:[30,85]},
  克洛琳德:{hp:[850,1405,2210],atk:[75,100,135],pr:40,er:35,as:.85,range:1,mana:[30,80]},
  珊瑚宫心海:{hp:[1600,2460,3585],atk:[20,30,45],pr:25,er:30,as:.85,range:4,mana:[35,90]},
  刻晴:{hp:[900,1485,2340],atk:[50,75,115],pr:40,er:35,as:1,range:1,mana:[30,50]},
  阿蕾奇诺:{hp:[950,1475,2140],atk:[60,90,135],pr:40,er:35,as:.95,range:2,mana:[25,75]},
  达达利亚:{hp:[625,1000,1470],atk:[50,80,125],pr:30,er:30,as:1,range:4,mana:[30,70]},
  那维莱特:{hp:[900,1440,2115],atk:[35,55,80],pr:30,er:40,as:.85,range:4,mana:[50,120]},
  枫原万叶:{hp:[1050,1735,2730],atk:[45,70,105],pr:45,er:40,as:.95,range:1,mana:[40,90]},
  菲谢尔:{hp:[650,1170,3250],atk:[55,90,140],pr:30,er:30,as:1,range:4,mana:[20,70]},
  琴:{hp:[1200,2160,6000],atk:[40,60,100],pr:50,er:45,as:.90,range:1,mana:[40,95]},
  安柏:{hp:[600,1080,3000],atk:[30,50,90],pr:30,er:30,as:.90,range:4,mana:[40,120]},
  诺艾尔:{hp:[800,1440,3600],atk:[15,25,40],pr:[80,85,90],er:[70,75,80],as:.70,range:1,mana:[30,100]},
  雷电将军:{hp:[1000,1800,5000],atk:[55,85,130],pr:45,er:40,as:1,range:1,mana:[40,80]},
  玛薇卡:{hp:[1250,2250,4050],atk:[52,78,117],pr:50,er:50,as:.60,range:1,mana:[0,0]},
  胡桃:{hp:[1100,1980,5500],atk:[55,85,140],pr:40,er:35,as:1.10,range:2,mana:[20,70]},
  甘雨:{hp:[900,1620,4500],atk:[70,115,200],pr:30,er:30,as:.95,range:4,mana:[20,80]},
  八重神子:{hp:[900,1620,4500],atk:[55,95,170],pr:30,er:35,as:.80,range:5,mana:[10,60]}
};
for(const [name,b] of Object.entries(B)){
  const cfg=PIECE_CONFIG[name];if(!cfg)continue;
  const [normalBaseDamage,normalAtkRatio]=WEAPON_NORMAL[cfg.weapon]||[20,1];
  Object.assign(cfg,{
    hp:b.hp.slice(),atk:b.atk.slice(),physicalResist:b.pr,elementResist:b.er,
    resist:Array.isArray(b.pr)?b.pr[0]:b.pr,as:b.as,range:cfg.weapon==='法器'?5:b.range,
    normalBaseDamage,normalAtkRatio
  });
  cfg.mana={initial:[b.mana[0],b.mana[0],b.mana[0]],max:b.mana[1]};
}

statsForStar=function(cfg,star){
  const i=Math.max(0,Math.min(2,(Number(star)||1)-1));
  const initialMana=Array.isArray(cfg.mana.initial)?(cfg.mana.initial[i]??cfg.mana.initial[0]):cfg.mana.initial;
  const pick=v=>Array.isArray(v)?(v[i]??v[0]):v;
  return{
    hp:cfg.hp[i]??cfg.hp[0],atk:cfg.atk[i]??cfg.atk[0],
    resist:pick(cfg.physicalResist??cfg.resist),
    physicalResist:pick(cfg.physicalResist??cfg.resist),
    elementResist:pick(cfg.elementResist),
    as:cfg.as,range:cfg.range,initialMana,maxMana:cfg.mana.max,cost:cfg.cost,
    normalBaseDamage:cfg.normalBaseDamage,normalAtkRatio:cfg.normalAtkRatio
  };
};

const previousEffectiveAtk=effectiveAtk;
effectiveAtk=function(u){
  let value=previousEffectiveAtk(u);
  value+=Number(u?.crystalAtkFlat)||0;
  return Math.max(0,Math.round(value));
};
function initializeConfirmedUnit(u,resetRatio=false){
  if(!u||u.isDummy)return;
  const cfg=PIECE_CONFIG[u.name];if(!cfg)return;
  const oldMax=Math.max(1,u.maxHp||1),hpRatio=resetRatio?1:Math.max(0,Math.min(1,u.hp/oldMax));
  const s=statsForStar(cfg,u.star||1),eq=typeof collectEquipmentStats==='function'?collectEquipmentStats(u):{hpPercent:0,atkPercent:0,res:0,attackSpeed:0,startMana:0};
  u.maxHp=Math.round((s.hp+(eq.hpFlat||0))*(1+(eq.hpPercent||0)));u.hp=Math.max(u.alive===false?0:1,Math.round(u.maxHp*hpRatio));
  u.atk=Math.round(s.atk*(1+(eq.atkPercent||0))+(eq.atkFlat||0));u.baseAtkForGrowth=s.atk;
  u.def=s.physicalResist+(eq.res||0)+(eq.physicalRes||0);u.elementDef=s.elementResist+(eq.res||0)+(eq.elementRes||0);
  u.basePhysicalResist=s.physicalResist;u.baseElementResist=s.elementResist;
  const scopeBase=typeof equipmentCount==='function'?equipmentCount(u,'eagle_scope'):0;
  const scopeGrowth=typeof equipmentStackTotal==='function'?equipmentStackTotal(u,'eagle_scope'):0;
  u.as=Math.min(5,s.as+(eq.attackSpeed||0));u.baseAsForGrowth=s.as;u.range=s.range+scopeBase+scopeGrowth;
  u.resourceType=cfg.resourceType||(cfg.conditionSkillGauge?'condition':'mana');
  u.maxMp=u.resourceType==='mana'?s.maxMana:0;if(u.resourceType!=='mana')u.mp=0;
  u.baseStartMana=u.resourceType==='mana'?s.initialMana:0;u.normalBaseDamage=s.normalBaseDamage;u.normalAtkRatio=s.normalAtkRatio;
}
for(const u of units)initializeConfirmedUnit(u);
const priorRecalc=typeof recalculateUnitEquipmentStats==='function'?recalculateUnitEquipmentStats:null;
if(priorRecalc)recalculateUnitEquipmentStats=function(unit,resetMana=false){priorRecalc(unit,resetMana);initializeConfirmedUnit(unit);if(resetMana&&usesManaResource(unit)){const eq=typeof collectEquipmentStats==='function'?collectEquipmentStats(unit):{startMana:0};unit.mp=Math.min(unit.maxMp,unit.baseStartMana+(eq.startMana||0))}};

// New reaction runtime.
let vaporMarks=[],electroLinks=[],confirmedSuperconductZones=[],confirmedOverloadEffects=[],confirmedMeltEffects=[],yelanBindings=[],confirmedNeuvilletteFloorWaves=[];
const crystallizedByTeam={blue:new Set(),red:new Set()};
function shieldAmount(u){return Math.max(0,Number(getUnitShield(u)?.value)||0)}
function unitById(id){return units.find(u=>u.id===id)}
function actualEvent(source,target,raw,beforeHp,beforeShield,afterHp,afterShield,options,returned){
  const shieldDamage=Math.max(0,beforeShield-afterShield),hpDamage=Math.max(0,beforeHp-afterHp);
  return{
    source,target,rawDamage:raw,finalDamage:shieldDamage+hpDamage,shieldDamage,hpDamage,
    actualTakenDamage:shieldDamage+hpDamage,
    damageType:options.trueDamage?'true':(options.elemental?(options.damageElement||source?.element):'physical'),
    element:options.damageElement||(options.elemental?source?.element:null),
    isReaction:!!options.reaction,isSkill:!!options.skill,isNormalAttack:!options.skill&&!options.direct&&!options.reaction,
    isTrueDamage:!!options.trueDamage,isExecute:!!options.execute,isElectroTransfer:!!options.electroTransfer,
    allowReaction:options.allowReaction!==false,allowElectroTransfer:options.allowElectroTransfer!==false,
    allowVaporRecord:options.allowVaporRecord!==false,returned
  };
}
function applyUnifiedLifesteal(event){
  const s=event.source;if(!s||!s.alive||event.actualTakenDamage<=0)return;
  let ratio=Number(s.lifesteal)||0;
  if(event.isNormalAttack)ratio+=Number(s.normalLifesteal)||0;
  if(event.isSkill)ratio+=Number(s.skillLifesteal)||0;
  if(s.weapon==='长柄'&&s.hp/s.maxHp<=.5)ratio+=.15;
  if(ratio>0)healUnit(s,event.actualTakenDamage*ratio,s);
}
function recordVapor(event){
  if(!event.allowVaporRecord||event.isExecute||event.actualTakenDamage<=0)return;
  for(const mark of vaporMarks){
    if(mark.targetId!==event.target.id||mark.settling)continue;
    mark.recorded+=event.actualTakenDamage;
  }
}
function conductElectro(event){
  if(!event.allowElectroTransfer||event.isElectroTransfer||event.isExecute||event.actualTakenDamage<=0)return;
  const groups=electroLinks.filter(g=>g.time>0&&g.ids.includes(event.target.id));
  for(const group of groups){
    for(const id of group.ids){
      if(id===event.target.id)continue;const other=unitById(id);if(!other?.alive)continue;
      damage(group.source||event.source,other,event.actualTakenDamage*.15,{trueDamage:true,reaction:true,electroTransfer:true,allowReaction:false,allowElectroTransfer:false});
    }
  }
}
const damageBeforeConfirmed=damage;
damage=function(source,target,raw,options={}){
  if(!source||!target?.alive)return 0;
  const beforeHp=target.hp,beforeShield=shieldAmount(target);
  let returned;
  if(options.trueDamage)returned=damageBeforeConfirmed(source,target,raw,{...options,direct:true,transfer:true});
  else returned=damageBeforeConfirmed(source,target,raw,options);
  if(target.name==='胡桃'&&target.hutaoPassiveUsed){
    // 三星胡桃保留原有10秒绝境无敌；一、二星仍限制为2秒。
    const inv=has(target,'invulnerable');if(inv&&target.star<3)inv.time=Math.min(inv.time,2);
    if(!target.hutaoLastStandLifestealGranted){
      target.hutaoLastStandLifestealGranted=true;
      target.lifesteal=(Number(target.lifesteal)||0)+.20;
    }
  }
  const event=actualEvent(source,target,raw,beforeHp,beforeShield,target.hp,shieldAmount(target),options,returned);
  source.lastDamageEvent=event;target.lastTakenEvent=event;
  applyUnifiedLifesteal(event);recordVapor(event);conductElectro(event);
  return returned;
};

function consumeAttachment(target){const old=target.attach?.element||null;target.attach=null;return old}
function reactionName(old,now){return REACTIONS[old+now]||null}
function createVaporMark(source,target,element,triggerDamage=0){
  let mark=vaporMarks.find(m=>m.targetId===target.id&&!m.settling);
  if(mark){
    if((Number(mark.triggerCount)||1)>=2)return mark;
    // 重复触发只提高本次标记的结算系数，不续时、不更换伤害归属。
    mark.triggerCount=2;
    mark.rate=(Number(mark.rate)||.80)+1.20;
    return mark;
  }
  const lastEvent=target.lastTakenEvent;
  const confirmedTriggerDamage=
    lastEvent?.source===source&&lastEvent?.target===target
      ?Math.max(0,Number(lastEvent.actualTakenDamage)||0)
      :Math.max(0,Number(triggerDamage)||0);
  mark={
    source,
    targetId:target.id,
    element:element||source?.element||'水',
    time:4,
    maxTime:4,
    recorded:confirmedTriggerDamage,
    rate:.80,
    triggerCount:1,
    settling:false
  };
  vaporMarks.push(mark);
  return mark;
}
function settleConfirmedVaporMark(mark){
  const target=unitById(mark.targetId);
  if(!target)return;
  const element=mark.element||mark.source?.element||'水';
  const recorded=Math.max(0,Number(mark.recorded)||0);
  const rate=Math.max(0,Number(mark.rate)||.80);
  const raw=recorded*rate;
  let settled=0;
  if(target.alive&&raw>0){
    const beforeTaken=Math.max(0,Number(target.damageTaken)||0);
    damage(mark.source||target,target,raw,{
      skill:true,
      elemental:true,
      damageElement:element,
      reaction:true,
      allowReaction:false,
      allowVaporRecord:false,
      vaporSettlement:true
    });
    settled=Math.max(
      0,
      (Math.max(0,Number(target.damageTaken)||0)-beforeTaken)
    );
  }
  // 结算显示与是否实际造成伤害分离；0 伤害也必须明确反馈。
  if(typeof triggerVaporEffect==='function')triggerVaporEffect(target,settled,element);
  if(typeof showVaporDamageNumber==='function')showVaporDamageNumber(target,settled,element);
  if(typeof addLog==='function')addLog(
    `${target.name} 的【蒸汽标记】结算：记录 ${Math.round(recorded)} 点伤害，`+
    `系数 ${Math.round(rate*100)}%，生成 ${Math.round(raw)} 点${element}元素伤害，`+
    `实际造成 ${Math.round(settled)} 点蒸发伤害`,
    'reaction'
  );
}
function isElectroLinkableUnit(unit){
  return !!(
    unit?.alive&&
    !unit.onBench&&
    !unit.inWarehouse&&
    !unit.isSummon&&
    Number.isInteger(unit.row)&&
    Number.isInteger(unit.col)
  );
}
function createElectroLink(source,target){
  if(!isElectroLinkableUnit(target))return;
  const candidates=units.filter(u=>
    isElectroLinkableUnit(u)&&
    u.team===target.team&&
    u!==target&&
    u.attach&&
    ['水','雷'].includes(u.attach.element)
  ).sort((a,b)=>dist(a,target)-dist(b,target)).slice(0,2);
  const all=[target,...candidates];if(all.length<2)return;
  candidates.forEach(consumeAttachment);
  const ids=[...new Set(all.map(u=>u.id))].slice(0,3);
  electroLinks=electroLinks.filter(g=>!g.ids.some(id=>ids.includes(id)));
  electroLinks.push({source,ids,time:8});
}
function applyCrystal(source,element){
  const key=source.team+':'+element,set=crystallizedByTeam[source.team]||(crystallizedByTeam[source.team]=new Set());
  const repeated=set.has(key);
  if(!repeated)set.add(key);
  const geoTier=window.elementResonanceBattleCounts?.[source.team]?.岩>=3;
  const baseBonus=repeated?5:15;
  const bonus=geoTier?baseBonus*1.5:baseBonus;
  const attackWeapons=new Set(['法器','弓','长柄']);
  const defenseWeapons=new Set(['单手剑','双手剑']);
  const affected=units.filter(x=>x.alive&&!x.onBench&&x.team===source.team&&(x.element===element||x.element==='岩'));
  for(const u of affected){
    const isGeo=u.element==='岩';
    if(isGeo||attackWeapons.has(u.weapon))u.crystalAtkFlat=(u.crystalAtkFlat||0)+bonus;
    if(isGeo||defenseWeapons.has(u.weapon)){
      u.crystalPhysicalFlat=(u.crystalPhysicalFlat||0)+bonus;
      u.crystalElementFlat=(u.crystalElementFlat||0)+bonus;
    }
  }
  addLog(`${source.name}触发【结晶·${element}】：${repeated?'重复触发，较低收益；':'首次触发；'}${element}元素角色中法器、弓、长柄攻击力+${bonus}，单手剑、双手剑双抗+${bonus}；岩元素角色同时获得两项加成${geoTier?'（3岩共鸣使收益变为1.5倍）':''}`,'reaction');
}
attachAndReact=function(source,target,baseDamage=0){
  if(!source||!target?.alive)return;
  const el=source.element;triggerElementalHit(target,el);
  if(el==='风'){
    const spread=target.attach?.element;if(!spread||spread==='岩')return;
    const victims=[target,...units.filter(u=>u.alive&&!u.onBench&&u.team===target.team&&u!==target&&dist(u,target)<=2)];
    for(const v of victims){applyElementResistanceReduction(v,spread,.30,5,'swirl');damage(source,v,50+effectiveAtk(source),{skill:true,elemental:true,damageElement:spread,reaction:true,allowReaction:false})}
    showReaction(target,'扩散');return;
  }
  if(!target.attach||target.attach.element===el){target.attach={element:el};return}
  const old=consumeAttachment(target),name=reactionName(old,el);if(!name)return;
  if(name==='融化'){
    damage(source,target,Math.max(0,baseDamage),{direct:true,reaction:true,elemental:true,damageElement:el,allowReaction:false});
    {const p=unitVisualPos(target);confirmedMeltEffects.push({x:p.x,y:p.y,time:0,duration:.72,seed:Math.random()*Math.PI*2});}
    showReaction(target,'融化','融化 ×2');
  }else if(name==='蒸发'){
    createVaporMark(source,target,el,baseDamage);showReaction(target,'蒸发');
  }else if(name==='超载'){
    const victims=units.filter(u=>u.alive&&!u.onBench&&u.team===target.team&&dist(u,target)<=1.5);
    for(const v of victims)damage(source,v,250+effectiveAtk(source)*1.5,{skill:true,elemental:true,damageElement:el,reaction:true,allowReaction:false});
    {const p=unitVisualPos(target);confirmedOverloadEffects.push({x:p.x,y:p.y,time:0,duration:.62,seed:Math.random()*Math.PI*2});}
    showReaction(target,'超载');
  }else if(name==='冻结'){
    const duration=typeof applyEquipmentHardControl==='function'?applyEquipmentHardControl(target,2,'freeze'):2;
    target.hardFreeze=Math.max(target.hardFreeze||0,duration);triggerFreeze(target);showReaction(target,'冻结');
  }else if(name==='超导'){
    const center={row:target.row,col:target.col};
    const cells=[center,...neighbors(center)];
    const cellKeySet=new Set(cells.map(cell=>`${cell.row},${cell.col}`));
    const existing=confirmedSuperconductZones.find(zone=>
      zone.team===source.team&&
      zone.cells.length===cells.length&&
      zone.cells.every(cell=>cellKeySet.has(`${cell.row},${cell.col}`))
    );
    if(existing){
      existing.time=8;
      existing.source=source;
    }else{
      confirmedSuperconductZones.push({source,team:source.team,cells,time:8,triggered:new Set()});
    }
    showReaction(target,'超导');
  }else if(name==='感电链'){
    createElectroLink(source,target);showReaction(target,'感电');
  }else if(name==='结晶'){
    applyCrystal(source,el==='岩'?old:el);showReaction(target,'结晶');
  }
};

function drawConfirmedReactionEffects(){
  const now=performance.now()/1000;

  for(const wave of confirmedNeuvilletteFloorWaves){
    for(const cell of wave.cells){
      const local=wave.time-cell.delay;
      if(local<=0)continue;
      const charge=Math.min(1,local/cell.charge);
      const fadeStart=cell.charge+cell.hold;
      const fade=local<=fadeStart?1:Math.max(0,1-(local-fadeStart)/cell.fade);
      if(fade<=0)continue;
      const p=hexPos(cell.row,cell.col);
      const radius=S-3;
      ctx.save();
      ctx.globalCompositeOperation='source-over';
      ctx.lineCap='round';
      ctx.lineJoin='round';
      ctx.strokeStyle=`rgba(145,220,255,${(.10+.34*charge)*fade})`;
      ctx.shadowColor=`rgba(105,200,255,${.38*fade})`;
      ctx.shadowBlur=4+3*charge;
      ctx.lineWidth=2+1*charge;
      ctx.beginPath();
      for(let side=0;side<6;side++){
        const sideProgress=Math.max(0,Math.min(1,charge*6-side));
        if(sideProgress<=0)break;
        const a0=-Math.PI/2+side*Math.PI/3;
        const a1=a0+Math.PI/3*sideProgress;
        const x0=p.x+Math.cos(a0)*radius,y0=p.y+Math.sin(a0)*radius;
        const x1=p.x+Math.cos(a1)*radius,y1=p.y+Math.sin(a1)*radius;
        ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  for(const effectData of confirmedOverloadEffects){
    const progress=Math.min(1,effectData.time/effectData.duration);
    const fade=Math.max(0,1-progress);
    const radius=18+progress*76;
    ctx.save();
    ctx.globalCompositeOperation='lighter';
    const glow=ctx.createRadialGradient(effectData.x,effectData.y,0,effectData.x,effectData.y,radius);
    glow.addColorStop(0,`rgba(255,249,195,${.95*fade})`);
    glow.addColorStop(.22,`rgba(255,109,35,${.9*fade})`);
    glow.addColorStop(.62,`rgba(196,67,255,${.58*fade})`);
    glow.addColorStop(1,'rgba(95,25,205,0)');
    ctx.fillStyle=glow;
    ctx.beginPath();ctx.arc(effectData.x,effectData.y,radius,0,Math.PI*2);ctx.fill();
    ctx.lineCap='round';
    for(let ray=0;ray<12;ray++){
      const angle=effectData.seed+ray*Math.PI/6;
      const inner=12+progress*16,outer=radius*(.72+(ray%3)*.08);
      ctx.globalAlpha=fade*(ray%2?.85:.65);
      ctx.strokeStyle=ray%2?'#ff742f':'#c36bff';
      ctx.lineWidth=ray%3===0?5:3;
      ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=9;
      ctx.beginPath();
      ctx.moveTo(effectData.x+Math.cos(angle)*inner,effectData.y+Math.sin(angle)*inner);
      ctx.lineTo(effectData.x+Math.cos(angle)*outer,effectData.y+Math.sin(angle)*outer);
      ctx.stroke();
    }
    ctx.restore();
  }

  for(const effectData of confirmedMeltEffects){
    const progress=Math.min(1,effectData.time/effectData.duration);
    const fade=Math.max(0,1-progress);
    ctx.save();
    ctx.globalCompositeOperation='lighter';
    const radius=16+progress*48;
    ctx.globalAlpha=fade*.78;
    ctx.strokeStyle=progress<.42?'#bff5ff':'#ffb04f';
    ctx.lineWidth=5-progress*2;
    ctx.shadowColor=progress<.42?'#72dcff':'#ff7b2f';
    ctx.shadowBlur=16;
    ctx.beginPath();ctx.arc(effectData.x,effectData.y,radius,0,Math.PI*2);ctx.stroke();
    for(let shard=0;shard<10;shard++){
      const angle=effectData.seed+shard*Math.PI/5;
      const travel=12+progress*(30+(shard%3)*7);
      const x=effectData.x+Math.cos(angle)*travel;
      const y=effectData.y+Math.sin(angle)*travel;
      ctx.save();ctx.translate(x,y);ctx.rotate(angle+progress*2);
      ctx.globalAlpha=fade*(shard%2?.72:.92);
      ctx.fillStyle=progress<.48?'#c9f7ff':'#ff9a45';
      ctx.beginPath();ctx.moveTo(7,0);ctx.lineTo(-4,-3);ctx.lineTo(-2,4);ctx.closePath();ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha=fade*.42;
    ctx.fillStyle='#fff2d2';
    ctx.beginPath();ctx.arc(effectData.x,effectData.y,12+progress*18,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }

  // 超导领域：新版反应使用独立数据数组，因此在这里恢复中心格与周围六格的冰雷法阵。
  for(const zone of confirmedSuperconductZones){
    const fade=Math.min(1,Math.max(0,zone.time)*2.5);
    for(const [cellIndex,cell] of zone.cells.entries()){
      const p=hexPos(cell.row,cell.col);
      const pulse=.035+.01*Math.sin(now*4.6+cellIndex*.8);
      ctx.save();
      // 领域只作为地面范围提示，避免加色混合把头像、血条和状态图标冲白。
      ctx.globalCompositeOperation='source-over';
      ctx.beginPath();
      for(let side=0;side<6;side++){
        const angle=(60*side+30)*Math.PI/180;
        const x=p.x+(S-5)*Math.cos(angle);
        const y=p.y+(S-5)*Math.sin(angle);
        side?ctx.lineTo(x,y):ctx.moveTo(x,y);
      }
      ctx.closePath();
      const glow=ctx.createRadialGradient(p.x,p.y,3,p.x,p.y,S);
      glow.addColorStop(0,`rgba(190,242,255,${pulse*fade})`);
      glow.addColorStop(.5,`rgba(76,154,232,${.028*fade})`);
      glow.addColorStop(1,`rgba(141,74,220,${.018*fade})`);
      ctx.fillStyle=glow;
      ctx.shadowColor='#7dcfff';ctx.shadowBlur=3;
      ctx.fill();
      ctx.strokeStyle=`rgba(181,228,255,${.18*fade})`;
      ctx.lineWidth=1.35;
      ctx.stroke();

      ctx.translate(p.x,p.y);
      ctx.rotate(now*(cellIndex%2?-.55:.55)+cellIndex*.4);
      ctx.strokeStyle=`rgba(202,170,255,${.13*fade})`;
      ctx.lineWidth=1.15;
      ctx.shadowColor='#ae73ff';ctx.shadowBlur=2;
      for(let ring=0;ring<2;ring++){
        const radius=11+ring*9;
        ctx.beginPath();
        for(let arc=0;arc<3;arc++){
          const start=arc*Math.PI*2/3+ring*.35;
          ctx.arc(0,0,radius,start,start+.72);
        }
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // 感电链：在被连接棋子的实时位置之间绘制双层、轻微跳动的雷电线。
  for(const group of electroLinks){
    const linked=group.ids.map(unitById).filter(isElectroLinkableUnit);
    for(let fromIndex=0;fromIndex<linked.length-1;fromIndex++){
      for(let toIndex=fromIndex+1;toIndex<linked.length;toIndex++){
      const index=fromIndex*linked.length+toIndex;
      const from=unitVisualPos(linked[fromIndex]);
      const to=unitVisualPos(linked[toIndex]);
      const dx=to.x-from.x,dy=to.y-from.y;
      const length=Math.max(1,Math.hypot(dx,dy));
      const nx=-dy/length,ny=dx/length;
      const points=[{x:from.x,y:from.y}];
      const segments=Math.max(4,Math.ceil(length/22));
      for(let step=1;step<segments;step++){
        const ratio=step/segments;
        const jitter=Math.sin(now*18+step*4.7+index)*5;
        points.push({x:from.x+dx*ratio+nx*jitter,y:from.y+dy*ratio+ny*jitter});
      }
      points.push({x:to.x,y:to.y});
      const stroke=()=>{
        ctx.beginPath();
        ctx.moveTo(points[0].x,points[0].y);
        for(let p=1;p<points.length;p++)ctx.lineTo(points[p].x,points[p].y);
        ctx.stroke();
      };
      ctx.save();
      ctx.lineCap='round';ctx.lineJoin='round';
      ctx.globalAlpha=.32;ctx.strokeStyle='#7b5cff';ctx.lineWidth=7;
      ctx.shadowColor='#805dff';ctx.shadowBlur=12;stroke();
      ctx.globalAlpha=.92;ctx.strokeStyle='#92ecff';ctx.lineWidth=2;
      ctx.shadowColor='#64dfff';ctx.shadowBlur=5;stroke();
      ctx.restore();
      }
    }
  }

  // 蒸发：标记存在期间，从目标棋子底部持续冒出半透明热气。
  for(const mark of vaporMarks){
    const target=unitById(mark.targetId);
    if(!target?.alive||target.onBench)continue;
    const p=unitVisualPos(target);
    ctx.save();
    ctx.lineCap='round';
    for(let stream=0;stream<3;stream++){
      const phase=(now*.55+stream*.31+(Number(target.id)||0)*.07)%1;
      const rise=phase*28;
      const sway=Math.sin(now*3.2+stream*2.1+phase*5)*4;
      ctx.beginPath();
      ctx.moveTo(p.x-8+stream*8,p.y+23);
      ctx.bezierCurveTo(
        p.x-9+stream*8+sway,p.y+17-rise*.3,
        p.x-5+stream*8-sway,p.y+13-rise*.72,
        p.x-7+stream*8+sway*.4,p.y+10-rise
      );
      ctx.globalAlpha=.22+(1-phase)*.62;
      ctx.strokeStyle=stream===1?'#fff8e9':'#e6fbff';
      ctx.lineWidth=5-phase*1.7;
      ctx.shadowColor='#ff9f43';ctx.shadowBlur=9;
      ctx.stroke();
    }
    ctx.restore();
  }
}

const drawBeforeConfirmedReactions=draw;
draw=function(){
  drawBeforeConfirmedReactions();
  drawConfirmedReactionEffects();
  drawYelanBindings();
  drawDelayedRaidenBursts();
};

let delayedRaidenBursts=[];
function drawDelayedRaidenBursts(){
  for(const burst of delayedRaidenBursts){
    const source=unitById(burst.sourceId),target=unitById(burst.targetId);
    const from=source?.alive?unitVisualPos(source):burst.from;
    const to=target?.alive?unitVisualPos(target):burst.to;
    if(!from||!to)continue;
    burst.from=from;burst.to=to;
    const dx=to.x-from.x,dy=to.y-from.y,angle=Math.atan2(dy,dx)+Math.PI/2;
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.translate(to.x,to.y);ctx.rotate(angle);
    if(burst.time<burst.explodeAt){
      const appear=Math.min(1,burst.time/.22),charge=Math.max(0,(burst.time-.22)/(burst.explodeAt-.22));
      const halfLength=46*appear;
      ctx.shadowColor='#8f49ff';ctx.shadowBlur=10+charge*10;
      ctx.globalAlpha=.5;ctx.strokeStyle='#5e268c';ctx.lineWidth=7-charge*2;
      ctx.beginPath();ctx.moveTo(-halfLength,0);ctx.quadraticCurveTo(0,charge*2,halfLength,0);ctx.stroke();
      ctx.globalAlpha=.92;ctx.strokeStyle='#bd72ff';ctx.lineWidth=2.4-charge*.7;
      ctx.beginPath();ctx.moveTo(-halfLength,0);ctx.quadraticCurveTo(0,-charge*1.5,halfLength,0);ctx.stroke();
      ctx.globalAlpha=.72+.2*Math.sin(charge*Math.PI*6);ctx.strokeStyle='#f4e7ff';ctx.lineWidth=.9;
      ctx.beginPath();ctx.moveTo(-halfLength*.82,0);ctx.lineTo(halfLength*.82,0);ctx.stroke();
      for(const side of [-1,1]){ctx.globalAlpha=.48*charge;ctx.strokeStyle='#9b4ee8';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(side*halfLength*.25,0);ctx.lineTo(side*halfLength*.48,-5-side*2);ctx.lineTo(side*halfLength*.68,0);ctx.stroke()}
    }else{
      const p=Math.min(1,(burst.time-burst.explodeAt)/(burst.duration-burst.explodeAt)),fade=1-p;
      const open=Math.sin(Math.min(1,p*1.18)*Math.PI),halfLength=43+6*p,lid=4+11*open;
      ctx.shadowColor='#b45cff';ctx.shadowBlur=18;
      ctx.globalAlpha=.82*fade;ctx.fillStyle='rgba(75,20,112,.72)';
      ctx.beginPath();ctx.moveTo(-halfLength,0);ctx.quadraticCurveTo(0,-lid,halfLength,0);ctx.quadraticCurveTo(0,lid,-halfLength,0);ctx.closePath();ctx.fill();
      ctx.strokeStyle='#c875ff';ctx.lineWidth=3;
      ctx.beginPath();ctx.moveTo(-halfLength,0);ctx.quadraticCurveTo(0,-lid,halfLength,0);ctx.quadraticCurveTo(0,lid,-halfLength,0);ctx.stroke();
      ctx.globalAlpha=.96*fade;ctx.fillStyle='#f5eaff';ctx.shadowBlur=26;
      ctx.beginPath();ctx.ellipse(0,0,4+6*open,2+7*open,0,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=.72*fade;ctx.strokeStyle='#a44dff';ctx.lineWidth=2;
      for(let i=0;i<6;i++){const x=-34+i*13.5;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+(i%2?4:-4),-lid-6-7*p);ctx.stroke();ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+(i%2?-4:4),lid+6+7*p);ctx.stroke()}
    }
    ctx.restore();
  }
}

function drawYelanBindings(){
  for(const binding of yelanBindings){
    const target=unitById(binding.targetId);
    const p=target?.alive&&!target.onBench?unitVisualPos(target):binding.fallback;
    if(!p)continue;
    const progress=Math.min(1,binding.time/binding.wrapDuration);
    const tighten=Math.min(1,progress);
    const remaining=Math.max(0,binding.duration-binding.time);
    const fade=Math.min(1,remaining/.22);
    const radius=35-11*Math.pow(tighten,1.7);
    ctx.save();ctx.translate(p.x,p.y);ctx.globalCompositeOperation='lighter';
    ctx.lineCap='round';ctx.shadowColor='#39bfff';ctx.shadowBlur=7;
    for(let strand=0;strand<4;strand++){
      const y=-15+strand*10,vertical=7-2.5*tighten;
      ctx.globalAlpha=(.48+strand*.05)*fade;
      ctx.strokeStyle=strand%2?'#b8efff':'#48c9ff';
      ctx.lineWidth=strand%2?1.1:1.55;
      ctx.beginPath();
      ctx.ellipse(0,y,radius*(.92+strand*.025),vertical,0,0,Math.PI*2);
      ctx.stroke();
    }
    const pull=Math.max(0,(progress-.35)/.65);
    for(const side of [-1,1]){
      ctx.globalAlpha=.68*fade;ctx.strokeStyle='#d8f8ff';ctx.lineWidth=1.1;
      ctx.beginPath();
      ctx.moveTo(side*(radius+5)*(1-pull),-20+pull*10);
      ctx.quadraticCurveTo(side*(radius*.55),0,side*(5+radius*.12*(1-pull)),15-pull*8);
      ctx.stroke();
    }
    ctx.restore();
  }
}

const tickBeforeConfirmed=tick;
tick=function(dt){
  tickBeforeConfirmed(dt);if(!started||paused||ended)return;
  mavuikaSlashes.forEach(slash=>slash.time+=dt);
  mavuikaSlashes=mavuikaSlashes.filter(slash=>slash.time<slash.duration);
  for(const unit of units){
    if(!unit.mavuikaShield)continue;
    unit.mavuikaShield.time-=dt;
    if(unit.mavuikaShield.time<=0)unit.mavuikaShield=null;
  }
  for(const wave of confirmedNeuvilletteFloorWaves){
    wave.time+=dt;
    for(const cell of wave.cells){
      if(cell.hit||wave.time<cell.delay+cell.charge)continue;
      cell.hit=true;
      const targets=units.filter(target=>
        target.alive&&!target.onBench&&target.team!==wave.team&&
        target.row===cell.row&&target.col===cell.col
      );
      for(const target of targets){
        confirmedElementHit(wave.source,target,wave.raw,true);
        if(!target.alive)continue;
        const duration=typeof applyEquipmentHardControl==='function'
          ?applyEquipmentHardControl(target,wave.stunDuration,'stun')
          :wave.stunDuration;
        if(duration>0)effect(target,'stun',duration,1);
      }
    }
  }
  confirmedNeuvilletteFloorWaves=confirmedNeuvilletteFloorWaves.filter(wave=>wave.time<wave.duration);
  confirmedOverloadEffects.forEach(effectData=>effectData.time+=dt);
  confirmedOverloadEffects=confirmedOverloadEffects.filter(effectData=>effectData.time<effectData.duration);
  confirmedMeltEffects.forEach(effectData=>effectData.time+=dt);
  confirmedMeltEffects=confirmedMeltEffects.filter(effectData=>effectData.time<effectData.duration);
  yelanBindings.forEach(binding=>binding.time+=dt);
  yelanBindings=yelanBindings.filter(binding=>{const target=unitById(binding.targetId);return binding.time<binding.duration&&target?.alive&&has(target,'silence')});
  for(const mark of vaporMarks){
    mark.time-=dt;
    mark.maxTime-=dt;
    if((mark.time<=0||mark.maxTime<=0)&&!mark.settling){
      mark.settling=true;
      settleConfirmedVaporMark(mark);
    }
  }
  vaporMarks=vaporMarks.filter(mark=>!mark.settling);
  electroLinks.forEach(g=>g.time-=dt);
  electroLinks=electroLinks.filter(g=>
    g.time>0&&
    g.ids.map(unitById).filter(isElectroLinkableUnit).length>=2
  );
  for(const z of confirmedSuperconductZones){z.time-=dt;for(const u of units.filter(x=>x.alive&&!x.onBench&&x.team!==z.team&&!z.triggered.has(x.id)&&z.cells.some(c=>c.row===x.row&&c.col===x.col))){z.triggered.add(u.id);u.mp=Math.max(0,u.mp-20);effect(u,'physicalResistFlatDown',5,20)}}
  confirmedSuperconductZones=confirmedSuperconductZones.filter(z=>z.time>0);
  for(const burst of delayedRaidenBursts){
    burst.time+=dt;
    if(!burst.resolved&&burst.time>=burst.explodeAt){
      burst.resolved=true;
      const source=unitById(burst.sourceId);
      if(!source?.alive)continue;
      for(const id of burst.targetIds){
        const target=unitById(id);if(!target?.alive)continue;
        confirmedElementHit(source,target,effectiveAtk(source)*burst.dmgPct,true);
        triggerElementalHit(target,'雷');
        spawn(target,'#b869ff',18);
      }
      effect(source,'raidenEmpower',5,burst.atkBoost);
      source.raidenHitCount=0;source.aiState='IDLE';source.decisionCooldown=.12;
      spawn(source,'#9c57ff',22);
      addLog(`${source.name}的延时刀光爆发，命中${burst.targetIds.length}名目标并进入梦想一心5秒`,'reaction');
    }
  }
  delayedRaidenBursts=delayedRaidenBursts.filter(burst=>burst.time<burst.duration&&unitById(burst.sourceId)?.alive);
  for(const noelle of units.filter(u=>u.alive&&!u.onBench&&u.name==='诺艾尔')){
    if(noelle.noellePassivePaused)continue;
    const activeIds=new Set(units
      .filter(e=>e.alive&&!e.onBench&&e.team!==noelle.team&&(e.target===noelle||e.targetId===noelle.id))
      .map(e=>String(e.id)));
    const sources=noelle.noellePassiveSources||(noelle.noellePassiveSources={});
    for(const id of activeIds)sources[id]=2;
    for(const id of Object.keys(sources)){
      if(activeIds.has(id))continue;
      sources[id]-=dt;
      if(sources[id]<=0)delete sources[id];
    }
    noelle.noelleExtraRes=Object.keys(sources).length*confirmedValue(noelle,[8,10,15]);
  }
  for(const arle of units.filter(u=>u.alive&&!u.onBench&&u.name==='阿蕾奇诺'&&u.arlecchinoAttachEndPending&&!has(u,'arlecchinoEmpower'))){
    arle.arlecchinoAttachEndPending=false;const t=confirmedTarget(arle);if(t?.alive)attachAndReact(arle,t,0);
  }
};
getPhysicalResistance=function(u){
  const battleWill=typeof hasEquipment==='function'&&hasEquipment(u,'battle_emblem')?(u?.equipmentRuntime?.stacks?.battleWill||0):0;
  const base=Math.max(0,(Number(u.def)||0)+resistanceFlatBonus(u)+battleWill+(Number(u.crystalPhysicalFlat)||0));
  const fixed=(u.effects||[]).filter(e=>e.type==='physicalResistFlatDown').reduce((s,e)=>s+(Number(e.value)||0),0);
  const percent=resistanceReductionTotal(u,e=>e.type==='physicalResistDown');
  return Math.max(0,(base-fixed)*(1-percent));
};
getElementResistanceBeforeReduction=function(u){
  const battleWill=typeof hasEquipment==='function'&&hasEquipment(u,'battle_emblem')?(u?.equipmentRuntime?.stacks?.battleWill||0):0;
  const raw=Number.isFinite(u.elementDef)?Number(u.elementDef):(Number(u.def)||0)-(u.isDummy?0:(ELEMENT_RESISTANCE_GAP[u.weapon]??0));
  return Math.max(0,raw+resistanceFlatBonus(u)+battleWill+(Number(u.crystalElementFlat)||0));
};
getElementResistance=function(u,element){
  const fixed=(u.effects||[]).filter(e=>e.type==='elementResistFlatDown'&&(!e.element||e.element===element)).reduce((s,e)=>s+(Number(e.value)||0),0);
  const all=resistanceReductionTotal(u,e=>e.type==='allResistDown'||e.type==='allElementResistDown');
  const specific=resistanceReductionTotal(u,e=>e.type===`resistDown:${element}`||(e.type==='resistDown'&&e.value===element));
  return Math.max(0,(getElementResistanceBeforeReduction(u)-fixed)*(1-Math.min(.70,all+specific)));
};

// ---------------------------------------------------------------------------
// Confirmed character skills.  These overrides deliberately reuse the current
// board, particles and status UI; only combat data and mechanics are replaced.
// ---------------------------------------------------------------------------
function confirmedTarget(u){return u.target?.alive?u.target:findTarget(u)}
function confirmedEnemies(u){return units.filter(x=>x.alive&&!x.onBench&&x.team!==u.team)}
function confirmedAllies(u){return units.filter(x=>x.alive&&!x.onBench&&x.team===u.team)}
function confirmedFinish(u){u.mp=0;u.skillReady=false;spawn(u,ELEMENTS[u.element]||'#fff',14)}
function confirmedElementHit(u,t,raw,attach=true,options={}){
  if(!t?.alive)return 0;
  const dealt=damage(u,t,raw,{skill:true,elemental:true,damageElement:u.element,...options});
  if(attach&&t.alive)attachAndReact(u,t,dealt);
  return dealt;
}
function confirmedLowest(list,count=1){return [...list].sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp).slice(0,count)}
function confirmedNearest(u,list,count=1){return [...list].sort((a,b)=>dist(u,a)-dist(u,b)).slice(0,count)}
function confirmedValue(u,values){return values[Math.max(0,Math.min(2,u.star-1))]}
const incomingBeforeConfirmed=incomingDamageModifier;
incomingDamageModifier=function(u,source){
  let value=incomingBeforeConfirmed(u,source);
  if(jeanZones.some(z=>z.confirmedJean&&z.team===u.team&&z.time<z.duration&&unitInJeanZone(u,z)))value-=.10;
  return value;
};

castDilucSkill=function(u){
  const t=confirmedTarget(u);if(!t)return false;
  const tpl=SKILL_TEMPLATES.PROJECTILE;
  const raw=confirmedValue(u,[30,45,90])+effectiveAtk(u)*confirmedValue(u,[.75,.95,1.20]);
  const lifesteal=confirmedValue(u,[1.8,2.2,4]);
  confirmedFinish(u);u.aiState='CASTING';
  skillActions.push({
    id:`diluc-slash-${u.id}-${Date.now()}`,sourceId:u.id,targetId:t.id,template:'PROJECTILE',
    phase:'WINDUP',elapsed:0,windupDuration:.16,travelDuration:.20,impactDuration:0,recoveryDuration:.26,
    meta:{skillName:'逆焰之刃',isElementalSlash:true,isCenteredSlash:true,slashElement:'火',slashStyle:'heavy',raw,lifesteal},
    onImpact:(source,action)=>{
      const target=getUnitById(action.targetId);if(!target?.alive)return;
      const dealt=confirmedElementHit(source,target,action.meta.raw,true);
      healUnit(source,dealt*action.meta.lifesteal,source);
    }
  });
  return true;
};
castNilouSkill=function(u){
  const target=confirmedTarget(u);if(!target)return false;
  u.nilouCastCount=(Number(u.nilouCastCount)||0)%3+1;
  const third=u.nilouCastCount===3;
  const raw=third
    ?confirmedValue(u,[80,150,350])+effectiveAtk(u)*confirmedValue(u,[1.50,1.75,2.20])
    :confirmedValue(u,[30,55,110])+effectiveAtk(u)*confirmedValue(u,[.70,.80,1.00]);
  confirmedFinish(u);u.aiState='CASTING';
  skillActions.push({
    id:`nilou-slash-${u.id}-${u.nilouCastCount}-${Date.now()}`,sourceId:u.id,targetId:target.id,template:'PROJECTILE',
    phase:'WINDUP',elapsed:0,windupDuration:.13,travelDuration:.18,impactDuration:0,recoveryDuration:.22,
    meta:{skillName:'七域舞步',isElementalSlash:true,isNilouSlash:true,slashElement:'水',slashStyle:third?'finisher':'light',raw},
    onImpact:(source,action)=>{
      const enemy=getUnitById(action.targetId);if(!enemy?.alive)return;
      confirmedElementHit(source,enemy,action.meta.raw,true);
    }
  });
  return true;
};
castBarbaraSkill=function(u){
  for(const ally of confirmedAllies(u))healUnit(ally,confirmedValue(u,[55,95,180]),u);
  const t=confirmedTarget(u);if(t)confirmedElementHit(u,t,confirmedValue(u,[5,10,20])+effectiveAtk(u)*confirmedValue(u,[.10,.10,.15]),true);
  confirmedFinish(u);return true;
};
castCharlotteSkill=function(u){
  const targets=confirmedNearest(u,confirmedEnemies(u),2);if(!targets.length)return false;
  const raw=confirmedValue(u,[20,40,100])+effectiveAtk(u)*confirmedValue(u,[.35,.45,.65]);
  const duration=confirmedValue(u,[5,6,8]),tpl=SKILL_TEMPLATES.PROJECTILE;
  confirmedFinish(u);u.aiState='CASTING';
  targets.forEach((target,index)=>skillActions.push({
    id:`charlotte-orb-${u.id}-${index}-${Date.now()}`,sourceId:u.id,targetId:target.id,template:'PROJECTILE',
    phase:'WINDUP',elapsed:index*.05,windupDuration:tpl.windup,
    travelDuration:Math.max(.22,dist(u,target)*tpl.travel),impactDuration:0,recoveryDuration:tpl.recovery,
    meta:{skillName:'定格·全方位确证',isCharlotteOrb:true,raw,duration},
    onImpact:(source,action)=>{
      const enemy=getUnitById(action.targetId);if(!enemy?.alive)return;
      confirmedElementHit(source,enemy,action.meta.raw,true);
      effect(enemy,'grievous',action.meta.duration,.30);
    }
  }));
  return true;
};
castKukiSkill=function(u){
  u.hp=Math.max(1,u.hp-u.hp*.20);
  for(const ally of confirmedLowest(confirmedAllies(u).filter(x=>x!==u),2))healUnit(ally,confirmedValue(u,[180,240,400]),u);
  const t=confirmedNearest(u,confirmedEnemies(u),1)[0];
  if(t)confirmedElementHit(u,t,confirmedValue(u,[15,30,70])+effectiveAtk(u)*confirmedValue(u,[.35,.45,.60]),true);
  confirmedFinish(u);return true;
};
castKleeSkill=function(u){
  const t=confirmedTarget(u);if(!t)return false;
  kleeBombs.push({source:u,targetId:t.id,cell:{row:t.row,col:t.col},time:0,explodeAt:1.5,duration:1.8,resolved:false,confirmed:true});
  confirmedFinish(u);return true;
};
tickKleeBombs=function(dt){
  for(const b of kleeBombs){
    b.time+=dt;if(b.resolved||b.time<b.explodeAt)continue;b.resolved=true;
    const main=unitById(b.targetId),center=main?.alive?{row:main.row,col:main.col}:b.cell;
    const targets=confirmedEnemies(b.source).filter(e=>dist(e,center)<=1);
    const mainRaw=confirmedValue(b.source,[200,350,650])+effectiveAtk(b.source)*confirmedValue(b.source,[1.6,1.95,2.2]);
    for(const e of targets){
      const isMain=e.id===b.targetId,raw=isMain?mainRaw:mainRaw*.70;
      confirmedElementHit(b.source,e,raw,isMain);
    }
  }
  kleeBombs=kleeBombs.filter(b=>b.time<b.duration);
};
castYelanSkill=function(u){
  const enemies=confirmedEnemies(u);if(!enemies.length)return false;
  const t=[...enemies].sort((a,b)=>(b.damageDealt||0)-(a.damageDealt||0))[0];
  const silenceDuration=confirmedValue(u,[2.5,3.5,5]);
  yelanBindings.push({targetId:t.id,fallback:unitVisualPos(t),time:0,wrapDuration:.72,duration:silenceDuration});
  confirmedElementHit(u,t,confirmedValue(u,[90,160,320])+effectiveAtk(u)*confirmedValue(u,[.90,1.05,1.30]),true);
  t.mp=Math.max(0,t.mp-confirmedValue(u,[15,20,30]));
  effect(t,'silence',silenceDuration,1);
  confirmedFinish(u);return true;
};
castAyakaSkill=function(u){
  const targets=confirmedNearest(u,confirmedEnemies(u),3);if(!targets.length)return false;
  const raw=confirmedValue(u,[100,180,400])+effectiveAtk(u)*confirmedValue(u,[1,1.2,1.55]);
  confirmedFinish(u);u.aiState='CASTING';
  targets.forEach((target,index)=>skillActions.push({
    id:`ayaka-triple-slash-${u.id}-${index}-${Date.now()}`,
    sourceId:u.id,targetId:target.id,template:'PROJECTILE',
    phase:'WINDUP',elapsed:index*.035,windupDuration:.12,
    travelDuration:.34,impactDuration:0,recoveryDuration:.22,
    meta:{skillName:'神里流·霜灭',isAyakaTripleSlash:true,raw},
    onImpact:(source,action)=>{
      const enemy=getUnitById(action.targetId);if(!enemy?.alive)return;
      confirmedElementHit(source,enemy,action.meta.raw,true);
    }
  }));
  return true;
};
castClorindeSkill=function(u){
  const t=confirmedTarget(u);if(!t)return false;
  confirmedElementHit(u,t,confirmedValue(u,[60,120,280]),true);
  applyTaunt(u,t,5);
  effect(u,'clorindeDuel',5,1);effect(u,'clorindeDamageBoost',5,confirmedValue(u,[.20,.30,.50]));
  effect(u,'clorindeGuard',5,-confirmedValue(u,[.10,.15,.20]));
  effect(u,'clorindeAttackSpeed',5,confirmedValue(u,[.50,.65,1]));
  effect(t,'weaken',5,confirmedValue(u,[.20,.30,.50]));
  u.clorindeHitCount=0;confirmedFinish(u);return true;
};
castYoimiyaSkill=function(u){
  effect(u,'yoimiyaEmpower',5,1);
  u.yoimiyaRapidShots=0;u.yoimiyaHitCount=0;confirmedFinish(u);return true;
};
castLaylaSkill=function(u){
  const target=confirmedLowest(confirmedAllies(u),1)[0];if(!target)return false;
    const shieldValue=confirmedValue(u,[280,300,850]);
  u.mp=0;u.skillReady=false;u.aiState='CASTING';
  launchFriendlyOrbs(u,[target],'冰',(source,ally)=>{
    ally.laylaShield={value:shieldValue,max:shieldValue,time:5,source};
    source.shieldingDone+=shieldValue;
    effect(source,'laylaEnchant',30,1);
    showReaction(ally,'skill','安眠帷幕');
  },'shield');
  spawn(u,ELEMENTS.冰,14);return true;
};
castFurinaSkill=function(u){
  // 优先支援其他友军。只有全队只剩芙宁娜和至多一名队友时，
  // 芙宁娜才会成为受益者；两段回蓝始终不能落在同一单位上。
  u.mp=0;
  const living=confirmedAllies(u);
  const otherAllies=living
    .filter(ally=>ally!==u)
    .sort((a,b)=>(a.mp/Math.max(1,a.maxMp))-(b.mp/Math.max(1,b.maxMp)));
  let targets;
  if(otherAllies.length>=2){
    targets=otherAllies.slice(0,2);
  }else if(otherAllies.length===1){
    targets=[otherAllies[0],u];
  }else{
    targets=[u];
  }
  const mana=confirmedValue(u,[15,20,25]);
  u.skillReady=false;u.aiState='CASTING';
  launchFriendlyOrbs(u,targets,'水',(source,ally)=>{
    if(typeof gainMana==='function')gainMana(ally,mana,true);
    else ally.mp=Math.min(ally.maxMp,ally.mp+mana);
    const t=ally.target?.alive?ally.target:confirmedNearest(ally,confirmedEnemies(u),1)[0];
    if(t)confirmedElementHit(source,t,confirmedValue(source,[10,20,50])+effectiveAtk(source)*confirmedValue(source,[.30,.40,.50]),true);
  },'mana');
  spawn(u,ELEMENTS[u.element]||'#fff',14);return true;
};
castSayuSkill=function(u){
  healUnit(u,confirmedValue(u,[300,520,900]),u);
  effect(u,'sayuGuard',6,confirmedValue(u,[.15,.20,.25]));u.sayuCleanCd=2;
  const t=confirmedNearest(u,confirmedEnemies(u),1)[0];
  if(t)confirmedElementHit(u,t,confirmedValue(u,[10,25,60])+effectiveAtk(u)*confirmedValue(u,[.25,.35,.50]),true);
  confirmedFinish(u);return true;
};
castShenheSkill=function(u){
  for(const ally of confirmedAllies(u))ally.effects=ally.effects.filter(e=>e.type!=='shenheBuff');
  const amount=effectiveAtk(u)*confirmedValue(u,[.30,.35,.50]);
  const allies=[...confirmedAllies(u).filter(x=>x!==u)].sort((a,b)=>effectiveAtk(b)-effectiveAtk(a)).slice(0,2);
  launchFriendlyOrbs(u,allies,'冰',(source,ally)=>effect(ally,'shenheBuff',8,amount),'attack');
  for(const t of confirmedNearest(u,confirmedEnemies(u),2))
    confirmedElementHit(u,t,confirmedValue(u,[20,40,90])+effectiveAtk(u)*confirmedValue(u,[.45,.55,.70]),true);
  confirmedFinish(u);return true;
};
castAmberSkill=function(u){
  const cell=amberBombCell(u);if(!cell)return false;
  amberBombs.push({
    source:u,
    team:u.team,
    from:{...unitVisualPos(u)},
    cell,
    time:0,
    landingAt:.32,
    explodeAt:1,
    duration:1.4,
    resolved:false,
    confirmed:true
  });
  confirmedFinish(u);return true;
};
castJeanSkill=function(u){
  const center={row:u.row,col:u.col},cells=[center,...neighbors(center)];
  jeanZones.push({source:u,team:u.team,cells,time:0,duration:8,healCd:0,healCount:0,triggered:new Set(),confirmedJean:true});
  confirmedFinish(u);return true;
};
castKazuhaSkill=function(u){
  const cells=[];
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)if(dist(u,{row:r,col:c})<=2)cells.push({row:r,col:c});
  jeanZones.push({source:u,team:u.team,cells,time:0,duration:6,healCd:1.5,hitCount:0,triggered:new Set(),kazuha:true,confirmedKazuha:true});
  confirmedFinish(u);return true;
};
tickJeanZones=function(dt){
  for(const z of jeanZones){
    z.time+=dt;z.healCd-=dt;
    if(z.confirmedKazuha){
      while(z.healCd<=0&&z.hitCount<4){
        z.healCd+=1.5;z.hitCount++;
        for(const enemy of confirmedEnemies(z.source).filter(e=>unitInJeanZone(e,z))){
          const dealt=damage(z.source,enemy,confirmedValue(z.source,[20,35,80])+effectiveAtk(z.source)*confirmedValue(z.source,[.55,.65,.90]),{skill:true,elemental:true,damageElement:'风'});
          if((z.hitCount===2||z.hitCount===4)&&enemy.alive)attachAndReact(z.source,enemy,dealt);
        }
      }
      continue;
    }
    if(z.confirmedJean){
      while(z.healCd<=0&&z.healCount<4){
        z.healCd+=2;z.healCount++;
        confirmedAllies(z.source).filter(a=>unitInJeanZone(a,z)).forEach(a=>healUnit(a,confirmedValue(z.source,[100,165,520]),z.source));
      }
      for(const enemy of confirmedEnemies(z.source).filter(e=>unitInJeanZone(e,z)&&!z.triggered.has(e.id))){
        z.triggered.add(enemy.id);
        const dealt=damage(z.source,enemy,confirmedValue(z.source,[10,20,100]),{skill:true,elemental:true,damageElement:'风'});
        if(enemy.alive)attachAndReact(z.source,enemy,dealt);
      }
    }
  }
  jeanZones=jeanZones.filter(z=>z.time<z.duration);
};
tickAmberBombs=function(dt){
  for(const b of amberBombs){
    b.time+=dt;if(b.resolved||b.time<b.explodeAt)continue;b.resolved=true;
    for(const e of confirmedEnemies(b.source).filter(x=>dist(x,b.cell)<=1.5))
      confirmedElementHit(b.source,e,effectiveAtk(b.source)*confirmedValue(b.source,[7,9,22]),true);
  }
  amberBombs=amberBombs.filter(b=>b.time<b.duration);
};
function keqingTarget(u){
  const candidates=confirmedEnemies(u).filter(e=>isValidCombatTarget(u,e)&&dist(u,e)<=4);
  if(!candidates.length)return null;
  const backlineScore=e=>u.team==='blue'?e.row:-e.row;
  candidates.sort((a,b)=>dist(u,b)-dist(u,a)||(a.hp/a.maxHp-b.hp/b.maxHp)||backlineScore(b)-backlineScore(a)||(Math.random()-.5));
  return candidates[0];
}
function keqingLandingCandidates(u,target){
  const origin={row:u.row,col:u.col},cells=[];
  for(let row=0;row<ROWS;row++)for(let col=0;col<COLS;col++){
    const cell={row,col};
    if(!isWalkableHex(cell,u))continue;
    cells.push(cell);
  }
  cells.sort((a,b)=>dist(a,target)-dist(b,target)||dist(b,origin)-dist(a,origin)||a.row-b.row||a.col-b.col);
  return cells;
}
function clearKeqingOrdinaryAggro(u){
  u.target=null;u.targetId=null;cancelCurrentPath(u);
  if(typeof transferAggroAwayFrom==='function')transferAggroAwayFrom(u,1.5);
}
function resetKeqingTargetAfterLanding(u,activate=true){
  const forced=resolveForcedTarget(u),next=forced||acquireNearestTarget(u);
  u.target=next||null;u.targetId=next?.id??null;cancelCurrentPath(u);
  if(activate)requestDecisionImmediately(u);else u.aiState='CASTING';
}
castKeqingSkill=function(u){
  const target=keqingTarget(u);if(!target)return false;
  const origin={row:u.row,col:u.col},landingOptions=keqingLandingCandidates(u,target);
  let land=landingOptions.find(cell=>tryReserveHex(cell,u.id))||origin;
  clearKeqingOrdinaryAggro(u);
  confirmedFinish(u);u.aiState='CASTING';
  const tpl=SKILL_TEMPLATES.DASH_SLASH;
  skillActions.push({
    id:`keqing-dash-${u.id}-${Date.now()}`,sourceId:u.id,targetId:target.id,
    template:'DASH_SLASH',anchorMode:SKILL_ANCHOR.FIXED_HEX,fixedRow:land.row,fixedCol:land.col,
    phase:'WINDUP',elapsed:0,windupDuration:tpl.windup,travelDuration:tpl.travel,
    impactDuration:0,recoveryDuration:tpl.recovery,
    meta:{skillName:'星斗归位',targetRow:target.row,targetCol:target.col,land},
    onImpact:(source,action)=>{
      const liveTarget=getUnitById(action.targetId);
      if(!isWalkableHex(action.meta.land,source)){
        releaseReservation(action.meta.land,source.id);
        action.meta.land=keqingLandingCandidates(source,liveTarget?.alive?liveTarget:{row:action.meta.targetRow,col:action.meta.targetCol})[0]||{row:source.row,col:source.col};
      }
      releaseReservation(action.meta.land,source.id);
      source.row=action.meta.land.row;source.col=action.meta.land.col;
      source.renderX=undefined;source.renderY=undefined;source.motion=null;
      const center=liveTarget?.alive?{row:liveTarget.row,col:liveTarget.col}:{row:action.meta.targetRow,col:action.meta.targetCol};
      const raw=confirmedValue(source,[55,110,220])+effectiveAtk(source)*confirmedValue(source,[.50,.65,.85]);
      for(const enemy of confirmedEnemies(source).filter(e=>dist(e,center)<=1.5))
        confirmedElementHit(source,enemy,raw,enemy.id===action.targetId);
      effect(source,'elementalInfusion',3,'雷');
      spawn(source,ELEMENTS.雷,20);
      addLog(`${source.name} 脱离普通仇恨并瞬移至 ${target.name} 附近，造成范围雷伤并进入3秒雷元素附魔状态`,'reaction');
      resetKeqingTargetAfterLanding(source,false);
    },
    onComplete:source=>resetKeqingTargetAfterLanding(source)
  });
  return true;
};
castTartagliaSkill=function(u){
  const t=confirmedTarget(u);if(!t)return false;
  const tpl=SKILL_TEMPLATES.PROJECTILE;
  const raw=confirmedValue(u,[100,180,420])+effectiveAtk(u)*confirmedValue(u,[1.2,1.45,1.9]);
  const travelDuration=Math.max(.22,dist(u,t)*tpl.travel);
  confirmedFinish(u);u.aiState='CASTING';
  skillActions.push({
    id:`tartaglia-water-arrow-${u.id}-${Date.now()}`,
    sourceId:u.id,
    targetId:t.id,
    template:'PROJECTILE',
    phase:'WINDUP',
    elapsed:0,
    windupDuration:tpl.windup,
    travelDuration,
    impactDuration:0,
    recoveryDuration:tpl.recovery,
    meta:{skillName:'尽灭水光',isTartagliaArrow:true,raw},
    onImpact:(source,action)=>{
      const target=getUnitById(action.targetId);
      if(!target?.alive)return;
      const dealt=confirmedElementHit(source,target,action.meta.raw,true);
      spawn(target,ELEMENTS.水,18);
      addLog(`${source.name} 的强化水箭命中 ${target.name}，造成 ${Math.round(dealt)} 点水元素伤害并附着`,'reaction');
    }
  });
  return true;
};
castNeuvilletteSkill=function(u){
  const t=confirmedTarget(u);if(!t)return false;
  const stunDuration=confirmedValue(u,[1,2,3]);
  const raw=confirmedValue(u,[30,55,120])+effectiveAtk(u)*confirmedValue(u,[.30,.40,.55]);
  const spreadDelay=.11,charge=.18,fade=.32;
  const cells=[];
  for(let col=0;col<COLS;col++){
    const distance=Math.abs(col-t.col);
    cells.push({
      row:t.row,col,
      delay:distance*spreadDelay,
      charge,hold:stunDuration,fade,
      hit:false
    });
  }
  confirmedNeuvilletteFloorWaves.push({
    source:u,team:u.team,time:0,cells,raw,stunDuration,
    duration:Math.max(t.col,COLS-1-t.col)*spreadDelay+charge+stunDuration+fade
  });
  confirmedFinish(u);return true;
};
castKokomiSkill=function(u){
  u.kokomiAttackCount=0;effect(u,'kokomiCeremony',8,1);confirmedFinish(u);return true;
};
castArlecchinoSkill=function(u){
  effect(u,'arlecchinoEmpower',7,confirmedValue(u,[.40,.55,.80]));
  const t=confirmedTarget(u);if(t?.alive)attachAndReact(u,t,0);
  u.arlecchinoAttachEndPending=true;confirmedFinish(u);return true;
};
castRaidenSkill=function(u){
  const t=confirmedTarget(u);if(!t)return false;
  const victims=confirmedEnemies(u).filter(e=>e===t||(e.row===t.row&&Math.abs(e.col-t.col)<=3)).slice(0,4);
  confirmedFinish(u);u.aiState='CASTING';
  delayedRaidenBursts.push({sourceId:u.id,targetId:t.id,targetIds:victims.map(e=>e.id),from:unitVisualPos(u),to:unitVisualPos(t),time:0,explodeAt:.58,duration:.92,resolved:false,dmgPct:confirmedValue(u,[3,5,12]),atkBoost:confirmedValue(u,[20,50,120])});
  showReaction(u,'skill','奥义·梦想真说');
  return true;
};

// Correct the status-derived panel/combat values introduced by the confirmed
// versions without changing any panel fields or layout.
const finalStatBeforeConfirmed=getFinalStat;
getFinalStat=function(u,statType){
  let v=finalStatBeforeConfirmed(u,statType);
  if(statType==='as'){
    const duel=has(u,'clorindeAttackSpeed');if(duel)v+=Number(duel.value)||0;
    const arle=has(u,'arlecchinoEmpower');if(arle)v+=Number(arle.value)||0;
    v=Math.min(5,v);
  }
  if(statType==='atk'&&u.name==='胡桃'&&has(u,'hutaoEmpower')){
    v+=confirmedValue(u,[90,170,450]);
  }
  if(statType==='dmgOut'&&u.name==='胡桃'){
    const missing=Math.max(0,1-u.hp/Math.max(1,u.maxHp));
    v+=missing*.30;
  }
  return v;
};

castNoelleSkill=function(u){
  const t=confirmedTarget(u);if(!t)return false;
  const victims=confirmedEnemies(u).filter(e=>e===t||dist(e,t)<=2);
  victims.forEach(e=>applyTaunt(u,e,5));
  const currentAttackers=confirmedEnemies(u).filter(e=>e.target===u||e.targetId===u.id);
  const sources=u.noellePassiveSources||(u.noellePassiveSources={});
  currentAttackers.forEach(e=>sources[String(e.id)]=2);
  u.noelleExtraRes=Object.keys(sources).length*confirmedValue(u,[8,10,15]);
  const currentRes=getPhysicalResistance(u)+getElementResistance(u,u.element);
  const baseValue=confirmedValue(u,[250,400,1200])+currentRes*confirmedValue(u,[1,2,5]);
  const value=typeof applyEquipmentShieldAmount==='function'?applyEquipmentShieldAmount(u,baseValue):baseValue;
  u.noelleShield={value,max:value,time:5,source:u};u.shieldingDone+=value;u.noellePassivePaused=true;
  confirmedFinish(u);return true;
};
castYaeSkill=function(u){
  const teamYae=units.filter(x=>x.alive&&!x.onBench&&x.team===u.team&&x.name==='八重神子');
  const teamTrees=summons.filter(s=>s.team===u.team);
  if(teamTrees.length<3&&u.skillStage<3){
    const summonCount=u.star>=3?3:1;
    for(let index=0;index<summonCount;index++){
      if(summons.filter(s=>s.team===u.team).length>=3)break;
      const slot=summonBenchSlot(u);if(slot<0){if(index===0)return false;break}
      summons.push({id:`yae-${u.id}-${Date.now()}-${index}`,owner:u,team:u.team,benchIndex:slot,advanced:false,attackCd:2.5,hitCount:0});
    }
    if(summons.filter(s=>s.team===u.team).length>=3){
      summons.filter(s=>s.team===u.team).forEach(s=>s.advanced=true);
      teamYae.forEach(y=>{y.mp=0;y.maxMp=y.star>=3?50:120;y.skillStage=3});
    }
    confirmedFinish(u);return true;
  }
  if(u.star>=3){
    // 三星专属：十段全屏天雷，每段500%，合计5000%攻击力。
    const attachHits=new Set([0,3,6,9]);
    for(let strikeIndex=0;strikeIndex<10;strikeIndex++){
      combatEventQueue.push({
        type:'yaeBurstStrike',sourceId:u.id,elapsed:0,time:.30+strikeIndex*.22,
        strikeIndex,dmgMultiplier:5,attaches:attachHits.has(strikeIndex)
      });
    }
    u.mp=0;spawn(u,ELEMENTS.雷,24);return true;
  }
  const targets=confirmedEnemies(u).map(target=>({
    target,
    raw:effectiveAtk(u)*confirmedValue(u,[2,3.5,3.5]),
    attaches:true,
    grievous:true,
    label:'大密法·天狐显真'
  }));
  launchSkyLightning(u,unitVisualPos(u),targets,'burst',true);
  confirmedFinish(u);return true;
};
tickSummons=function(dt){
  summons=summons.filter(s=>s.owner.alive&&!s.owner.onBench);
  for(const s of summons){
    s.attackCd-=dt;if(s.attackCd>0)continue;s.attackCd+=2.5;
    const target=pickSummonTarget(s);if(!target)continue;
    s.hitCount=(s.hitCount||0)+1;
    const raw=effectiveAtk(s.owner)*confirmedValue(s.owner,s.advanced?[1.3125,1.6875,4.5]:[.875,1.125,3]);
    launchSkyLightning(
      s.owner,
      benchPos(s.team,s.benchIndex),
      [{target,raw,attaches:s.hitCount%2===0,label:s.advanced?'高阶杀生樱落雷':'杀生樱落雷'}],
      'summon',
      s.advanced
    );
  }
};
castGanyuSkill=function(u){
  const t=confirmedTarget(u);if(!t)return false;
  const center={row:t.row,col:t.col},cells=[];
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
    if(u.star>=3||dist(center,{row:r,col:c})<=2.5)cells.push({row:r,col:c});
  }
  ganyuZones.push({
    source:u,cells,time:0,duration:u.star>=3?30:6,tickCd:0,tickCount:0,
    maxTicks:u.star>=3?15:3,confirmed:true,freezeDone:false
  });
  confirmedFinish(u);return true;
};
castFischlSkill=function(u){
  const t=confirmedTarget(u);
  if(t)triggerOzAttack(u,t);
  effect(u,'fischlElectro',3,1);
  if(!u.fischlConfirmedStacks)u.fischlConfirmedStacks=0;
  u.fischlConfirmedStacks++;
  u.as+=u.baseAsForGrowth*valueForStar(u,[.12,.18,.30]);
  confirmedFinish(u);return true;
};
tickOz=function(dt){
  ozSummons=ozSummons.filter(o=>o.owner.alive&&!o.owner.onBench);
  for(const bolt of ozBolts){
    bolt.time+=dt;
    if(!bolt.resolved&&bolt.time>=bolt.duration){
      bolt.resolved=true;const owner=bolt.owner,t=bolt.target;if(!t?.alive)continue;
      owner.ozConfirmedHits=(owner.ozConfirmedHits||0)+1;
      const raw=confirmedValue(owner,[45,80,240])+effectiveAtk(owner)*confirmedValue(owner,[.90,1.15,2.20]);
      const dealt=damage(owner,t,raw,{skill:true,elemental:true,damageElement:'雷',summon:true});
      if(owner.ozConfirmedHits%2===0&&t.alive)attachAndReact(owner,t,dealt);
    }
  }
  ozBolts=ozBolts.filter(b=>b.time<b.duration+.16&&b.owner.alive);
};
tickGanyuZones=function(dt){
  for(const z of ganyuZones){
    z.time+=dt;z.tickCd-=dt;
    while(z.tickCd<=0&&z.tickCount<(z.maxTicks||3)){
      z.tickCd+=2;z.tickCount++;
      for(const enemy of confirmedEnemies(z.source).filter(e=>unitInGanyuZone(e,z)))
        damage(z.source,enemy,confirmedValue(z.source,[60,90,260]),{skill:true,elemental:true,damageElement:'冰'});
    }
    if(!z.freezeDone&&z.time>=4){
      z.freezeDone=true;
      for(const enemy of confirmedEnemies(z.source).filter(e=>unitInGanyuZone(e,z))){
        if(enemy.alive)attachAndReact(z.source,enemy,0);
        const baseDuration=z.source.star>=3?10:2;
        const duration=typeof applyEquipmentHardControl==='function'?applyEquipmentHardControl(enemy,baseDuration,'freeze'):baseDuration;
        enemy.hardFreeze=Math.max(enemy.hardFreeze||0,duration);triggerFreeze(enemy);
      }
    }
  }
  ganyuZones=ganyuZones.filter(z=>z.time<z.duration);
};

// Hu Tao is dispatched directly because the original implementation embeds
// obsolete percentage multipliers and damage reduction in castSkill itself.
const castSkillBeforeConfirmed=castSkill;
castSkill=function(u){
  if(u?.name!=='胡桃')return castSkillBeforeConfirmed(u);
  u.skillReady=false;u.attackCd=Math.max(u.attackCd,.5);u.mp=0;u.hutaoAttackCount=0;
  if(typeof onEquipmentSkillCast==='function')onEquipmentSkillCast(u);
  const cost=u.hp*.30;u.hp=Math.max(1,u.hp-cost);effect(u,'hutaoEmpower',8,1);
  spawn(u,ELEMENTS.火,18);return true;
};
const CONFIRMED_SKILL_NAMES={
  优菈:'冰潮的涡旋',迪卢克:'逆焰之刃',妮露:'七域舞步',芙宁娜:'众水的歌者',
  莱依拉:'垂裳端凝之夜',芭芭拉:'闪耀奇迹',夏洛蒂:'定格·全方位确证',宵宫:'焰硝庭火舞',
  早柚:'呜呼流·影貉缭乱',申鹤:'仰灵威召将役咒',久岐忍:'越祓雷草之轮',可莉:'蹦蹦炸弹',
  夜兰:'萦络纵命索',神里绫华:'神里流·霜灭',克洛琳德:'逐影之誓',珊瑚宫心海:'海人化羽',
  刻晴:'星斗归位',阿蕾奇诺:'厄月将升',达达利亚:'尽灭水光',那维莱特:'衡平推裁',
  枫原万叶:'万叶之一刀',菲谢尔:'至夜幻现',琴:'蒲公英之风',安柏:'爆弹玩偶',
  诺艾尔:'护心岩铠',雷电将军:'奥义·梦想真说',玛薇卡:'烈阳挥斩',胡桃:'彼岸蝶舞',甘雨:'降众天华'
};
const castSkillBeforeMavuika=castSkill;
castSkill=function(u){
  if(u?.name!=='玛薇卡')return castSkillBeforeMavuika(u);
  u.skillReady=false;u.attackCd=Math.max(u.attackCd,.5);
  if(typeof onEquipmentSkillCast==='function')onEquipmentSkillCast(u);
  return castMavuikaSkill(u);
};
const castSkillBeforeNamePopup=castSkill;
castSkill=function(u){
  const popupStart=reactionPopups.length;
  const actionStart=skillActions.length;
  const skillName=u?.name==='八重神子'
    ?(u.skillStage>=3?'天狐显真':'野干役咒·杀生樱')
    :CONFIRMED_SKILL_NAMES[u?.name];
  const result=castSkillBeforeNamePopup(u);
  for(let index=actionStart;index<skillActions.length;index++){
    skillActions[index].meta=skillActions[index].meta||{};
    skillActions[index].meta.suppressSkillNamePopup=true;
  }
  const alreadyShown=reactionPopups.slice(popupStart).some(popup=>popup.name==='skill');
  if(skillName&&!alreadyShown)showReaction(u,'skill',skillName);
  return result;
};
if(startBtn)startBtn.onclick=startBattle;

const resolveHitBeforeConfirmed=resolveHit;
function spawnElementSplashParticles(target,color,count=12){
  const origin=unitVisualPos(target);
  for(let index=0;index<count;index++){
    const angle=Math.random()*Math.PI*2;
    const speed=55+Math.random()*55;
    particles.push({
      x:origin.x,y:origin.y,
      vx:Math.cos(angle)*speed,
      vy:Math.sin(angle)*speed,
      time:.48+Math.random()*.12,
      color,
      size:5
    });
  }
}
resolveHit=function(a){
  const u=a?.source,t=a?.target;
  if(!u||!t?.alive||a.resolved)return;
  // All normal attacks now use their profession's shared base + ATK ratio.
  a.resolved=true;
  const catalyst=u.weapon==='法器',hutao=has(u,'hutaoEmpower'),raiden=has(u,'raidenEmpower');
  const yoimiya=has(u,'yoimiyaEmpower'),kokomi=has(u,'kokomiCeremony');
  const clorinde=has(u,'clorindeDuel'),fischl=has(u,'fischlElectro');
  const layla=has(u,'laylaEnchant'),arle=u.name==='阿蕾奇诺';
  let elemental=catalyst||hutao||raiden||yoimiya||kokomi||clorinde||fischl||arle||layla;
  let raw=(Number(u.normalBaseDamage)||20)+effectiveAtk(u)*(Number(u.normalAtkRatio)||1);
  let attach=false;

  if(u.name==='甘雨'){
    u.ganyuAttackCount=(u.ganyuAttackCount||0)+1;
    if(u.ganyuAttackCount%3===0){
      elemental=true;raw=effectiveAtk(u)*confirmedValue(u,[2.2,3.2,8]);
      const main=damage(u,t,raw,{elemental:true,damageElement:'冰'});if(t.alive)attachAndReact(u,t,main);
      const victims=confirmedEnemies(u).filter(e=>e!==t&&dist(e,t)<=1.5);
      victims.forEach(e=>damage(u,e,raw*.60,{skill:true,elemental:true,damageElement:'冰'}));
      victims.forEach(enemy=>spawnElementSplashParticles(enemy,ELEMENTS.冰||'#8ee7ff',12));
      u.mp=Math.min(u.maxMp,u.mp+10);return;
    }
  }
  if(u.name==='八重神子'){elemental=true;raw=10}
  if(yoimiya){
    u.yoimiyaRapidShots=(u.yoimiyaRapidShots||0)+1;
    const first=u.yoimiyaRapidShots===1;
    raw=confirmedValue(u,first?[40,80,180]:[25,45,90])+effectiveAtk(u)*confirmedValue(u,first?[1,1.15,1.45]:[.95,1.05,1.2]);
    attach=first;
  }
  if(kokomi)raw+=u.maxHp*confirmedValue(u,[.10,.12,.15]);
  const dealt=damage(u,t,raw,{elemental,damageElement:elemental?u.element:null});
  if(attach&&t.alive)attachAndReact(u,t,dealt);
  if(clorinde&&t.alive){
    const extraRaw=effectiveAtk(u)*confirmedValue(u,[.8,1,1.3]);
    const extraDealt=damage(u,t,extraRaw,{
      elemental:true,
      damageElement:'雷',
      allowReaction:false
    });
    addLog(`${u.name}的强化普攻追加${Math.round(extraDealt)}点雷伤（不附着）`,'reaction');
  }
  if(raiden&&dealt>0){
    u.raidenHitCount=(u.raidenHitCount||0)+1;
    if(u.raidenHitCount%4===0){
      const recipients=units
        .filter(ally=>ally.alive&&!ally.onBench&&!ally.inWarehouse&&!ally.isSummon&&!ally.isDummy&&ally.team===u.team&&ally!==u&&ally.maxMp>0)
        .sort((a,b)=>(a.mp/Math.max(1,a.maxMp))-(b.mp/Math.max(1,b.maxMp))||a.mp-b.mp)
        .slice(0,3);
      recipients.forEach(ally=>gainMana(ally,10,true));
      if(recipients.length)addLog(`${u.name}的梦想一心第4次普攻为${recipients.map(ally=>ally.name).join('、')}各回复10点法力`,'reaction');
    }
  }
  const manaLocked=hutao||raiden||yoimiya||kokomi||clorinde||has(u,'arlecchinoEmpower');
  if(!manaLocked)u.mp=Math.min(u.maxMp,u.mp+10);
  if(layla&&t.alive){attachAndReact(u,t,dealt);layla.value=(Number(layla.value)||1)-1;if(layla.value<=0)u.effects=u.effects.filter(e=>e!==layla)}
  if(hutao){
    u.hutaoAttackCount=(u.hutaoAttackCount||0)+1;
    if(u.hutaoAttackCount%3===0&&t.alive)attachAndReact(u,t,dealt);
  }
  if(kokomi){
    u.kokomiAttackCount=(u.kokomiAttackCount||0)+1;
    if(u.kokomiAttackCount%3===0&&t.alive)attachAndReact(u,t,dealt);
    const ally=confirmedLowest(confirmedAllies(u),1)[0];if(ally)healUnit(ally,u.maxHp*confirmedValue(u,[.03,.04,.06]),u);
  }
  if(arle){
    const pct=has(u,'arlecchinoEmpower')?confirmedValue(u,[.45,.55,.70]):confirmedValue(u,[.30,.35,.45]);
    const victims=confirmedEnemies(u).filter(e=>e!==t&&dist(e,t)<=1);
    victims.forEach(e=>damage(u,e,effectiveAtk(u)*pct,{elemental:true,damageElement:'火'}));
    victims.forEach(enemy=>spawnElementSplashParticles(enemy,'#ff4938',14));
  }
  if(u.name==='菲谢尔'){
    u.fischlNormalCount=(u.fischlNormalCount||0)+1;
    if(u.fischlNormalCount%4===0)triggerOzAttack(u,t.alive?t:confirmedTarget(u));
  }
};

// Latest skill copy.  Warehouse previews retain all three slash-separated
// values; placed units continue to be filtered to their current star.
Object.assign(SKILL_INFO,{
  '玛薇卡':'无普通法力。\\n【战意】上限12层，开战获得5层；其他存活友军每完成一次技能施放获得1层，同一技能只计算一次。普通攻击、装备、反应、被动与召唤物攻击均不提供战意。\\n【烈阳挥斩】战意满层时立即朝当前目标方向挥出120°、1格半径的重斩，造成元素攻击力200%/300%/700%火伤并附着；随后获得最大生命值25%/35%/65%的护盾，持续6/6/8秒。护盾不叠加，新护盾覆盖旧护盾。',
  '优菈':'初始法力40/80。\\n【R·冰潮的涡旋】对前方扇形造成10/20/40 + 攻击力10%/10%/15%冰伤并附着；获得300/500/900护盾5秒。护盾自然结束时，对周围1格造成剩余护盾80%/100%/120%冰伤并附着。',
  '迪卢克':'初始法力30/70。\\n【R·逆焰之刃】对当前目标造成30/45/90 + 攻击力75%/95%/120%火伤并附着；本次伤害拥有180%/220%/400%技能吸血。',
  '妮露':'初始法力10/55。\\n【R·七域舞步】每次施放先播放水元素挥砍，命中时才结算。前两次对当前目标造成30/55/110 + 攻击力70%/80%/100%水伤并附着；第三次改为更强的单体终结挥砍，造成80/150/350 + 攻击力150%/175%/220%水伤并附着。',
  '芙宁娜':'初始法力30/90。\\n【R·众水的歌者】令法力比例最低的两名不同友军回复15/20/25法力，可选择自己；每名受益者生成水泡，造成10/20/50 + 芙宁娜攻击力30%/40%/50%水伤并附着。只剩自己时仅生效一次。',
    '莱依拉':'初始法力20/90。\\n【R·垂裳端凝之夜】为生命比例最低友军提供280/300/850护盾5秒；莱依拉下一次普攻施加冰附着。',
  '芭芭拉':'初始法力0/75。\\n【R·闪耀奇迹】治疗全体友军55/95/180；对当前目标造成5/10/20 + 攻击力10%/10%/15%水伤并附着。',
  '夏洛蒂':'初始法力40/80。\\n【R·定格·全方位确证】向最近两名敌人分别发射冰元素技能球；技能球命中时造成20/40/100 + 攻击力35%/45%/65%冰伤并附着，同时施加30%重伤5/6/8秒。',
  '宵宫':'初始法力20/50。\\n【R·焰硝庭火舞】强化5秒，期间普攻转火伤且不能回蓝。第一发造成40/80/180 + 攻击力100%/115%/145%并附着；后续造成25/45/90 + 攻击力95%/105%/120%，不附着。',
  '夜兰':'初始法力20/70。\\n【R·萦络纵命索】全屏锁定累计伤害最高敌人，造成90/160/320 + 攻击力90%/105%/130%水伤并附着；削减15/20/30当前法力并沉默2.5/3.5/5秒。',
  '神里绫华':'初始法力30/75。\\n【神里流·霜灭】隔空斩击最近三名不同敌人；每名目标身上依次显现三道大型冰元素斩痕，三段动画完成时统一造成一次100/180/400 + 攻击力100%/120%/155%冰伤并附着。',
  '克洛琳德':'初始法力30/80。\\n【逐影之誓】开启时对目标造成60/120/280雷伤并附着，嘲讽目标5秒。期间自身攻速+50%/65%/100%、增伤+20%/30%/50%、减伤10%/15%/20%，目标增伤降低20%/30%/50%；普攻转雷伤，并额外追加攻击力80%/100%/130%的雷伤。强化普攻及追加雷伤均不附着，期间不能通过普攻回复法力。',
  '早柚':'初始法力40/90。\\n【R·呜呼流·影貉缭乱】回复自身300/520/900生命，获得15%/20%/25%减伤6秒并每2秒清除自身附着；同时对最近敌人造成10/25/60 + 攻击力25%/35%/50%风伤并可扩散。',
  '申鹤':'初始法力35/85。\\n【R·仰灵威召将役咒】向攻击力最高的两名其他友军分别发射增益球；增益球抵达后，使其获得申鹤攻击力30%/35%/50%的固定攻击力8秒。并对最近两名敌人造成20/40/90 + 攻击力45%/55%/70%冰伤并附着。',
  '久岐忍':'初始法力20/75。\\n【R·越祓雷草之轮】消耗当前生命20%，治疗生命比例最低的两名其他友军180/240/400；对最近敌人造成15/30/70 + 攻击力35%/45%/60%雷伤并附着。',
  '可莉':'初始法力10/60。\\n【R·蹦蹦炸弹】1.5秒后对主目标造成200/350/650 + 攻击力160%/195%/220%火伤并附着；周围1格敌人承受主伤害70%，不附着。',
  '珊瑚宫心海':'初始法力35/90。\\n【海人化羽】强化8秒并锁蓝。普攻追加最大生命10%/12%/15%水伤；每次为最低生命友军治疗心海最大生命3%/4%/6%；每第3次强化普攻附着水元素。',
  '刻晴':'初始法力30/50。\\n【R·星斗归位】释放时清除自身旧目标与移动路径，并使当前以刻晴为普通攻击目标的敌人失去锁定、重新索敌。刻晴选择自身4格内距离最远的敌人，瞬移至其附近合法空格，对目标周围1.5格所有敌人造成55/110/220 + 攻击力50%/65%/85%雷伤，仅主目标附着。随后进入3秒雷元素附魔状态，普通攻击倍率不变，仅转化为雷元素伤害。落地后重新索敌；已发射弹道与持续伤害不会消失，仍在持续的强制嘲讽不会解除。',
  '阿蕾奇诺':'初始法力25/75。\\n普通攻击永久转为火伤且不附着，并对周围1格造成攻击力30%/35%/45%溅射。技能强化7秒，攻速+40%/55%/80%，溅射提高至45%/55%/70%，状态开始与结束各附着一次。',
  '达达利亚':'初始法力30/70。\\n【R·尽灭水光】向当前目标射出一支强化水箭；水箭抵达目标时造成100/180/420 + 攻击力120%/145%/190%水伤并附着。参与击杀可永久获得攻击与攻速成长，本回合最多4层。',
  '那维莱特':'初始法力50/120。\\n【衡平推裁】目标格的六边形边框先逐步亮起，达到命中亮度时造成30/55/120 + 攻击力30%/40%/55%水伤、附着并眩晕1/2/3秒；水格随后快速向目标所在行的两侧逐格扩散。蓝色边框在眩晕期间维持，结束后逐渐熄灭。',
  '枫原万叶':'初始法力40/90。\\n【R·万叶之一刀】自身半径2格生成风域6秒，每1.5秒造成20/35/80 + 攻击力55%/65%/90%风伤，共4段；第2、4段可触发扩散。',
  '菲谢尔':'初始法力20/70。\\n开战召唤奥兹；菲谢尔每4次普攻令奥兹协同一次，奥兹造成45/80/240 + 攻击力90%/115%/220%雷伤，每第2次附着。技能令奥兹立即攻击，永久获得12%/18%/30%基础攻速，不设叠层上限，并令普攻转雷伤3秒。',
  '琴':'初始法力40/95。\\n【R·蒲公英之风】自身与周围六格生成领域8秒，立即并每2秒治疗100/165/520，共4次；领域内友军减伤10%。每名敌人首次进入受到10/20/100风伤并可扩散。',
  '安柏':'初始法力40/120。\\n【R·爆弹玩偶】延迟1秒后对半径1.5格敌人造成攻击力700%/900%/2200%火伤，全部附着。',
  '诺艾尔':'初始法力30/100。\\n【被动·守护之心】每名正以诺艾尔为目标的敌人使物理抗性和元素抗性分别提高8/10/15点；敌人切换目标或死亡后，对应层数延迟2秒移除。护盾存在期间层数冻结，不新增也不衰减。\\n【R·护心岩铠】嘲讽当前目标所在格周围2格内的敌人5秒，并获得250/400/1200 + (当前物理抗性 + 当前元素抗性)×1/2/5的护盾，持续5秒。技能不造成伤害，也不施加岩元素附着。',
  '雷电将军':'初始法力40/80。\\n【R·奥义·梦想真说】对当前目标及同行最多3格造成攻击力300%/500%/1200%雷伤并附着；随后5秒攻速+100%、固定攻击+20/50/120，普攻转雷伤且锁蓝、不附着。强化期间每第4次有效普攻，为除自身外法力比例最低的3名友军各回复10点法力。',
  '胡桃':'初始法力20/70。\\n【被动】根据已损失生命比例获得增伤，最高30%。\\n【R·彼岸蝶舞】消耗当前生命30%，8秒内固定攻击+90/170/450，普攻转火伤、每第3次附着并锁蓝。首次致死保留1生命、免费刷新技能并永久获得20%额外吸血；一、二星无敌2秒，三星无敌10秒。三星强化期间额外获得3.0攻速与30%减伤。',
  '甘雨':'初始法力20/80。\\n每第3次普攻替换为霜华矢，造成攻击力220%/320%/800%冰伤并仅对主目标附着，周围1.5格承受60%。\\n【R·降众天华】一、二星在目标周围2.5格生成6秒领域；三星生成覆盖全棋盘的30秒领域。每2秒造成60/90/260冰伤；停留4秒后，一、二星冻结2秒，三星冻结10秒。',
  '八重神子':'召唤阶段10/60；大招阶段一、二星0/120，三星0/50。普通攻击固定10雷伤、不附着。杀生樱每2.5秒攻击，倍率87.5%/112.5%/300%，每第2次附着；三星第一次释放直接召唤3株杀生樱。同队3株后升阶至131.25%/168.75%/450%并切换大招。天狐显真：一星全屏200%攻击雷伤，二星全屏350%；三星十段全屏天雷，每段500%，总计5000%。首击永久施加30%重伤。'
});

// The brief copy is derived from the confirmed detailed copy so the two
// panels cannot drift apart after balance changes.
for(const name of Object.keys(B)){
  const detail=String(SKILL_INFO[name]||'')
    .replace(/\\n/g,'\n')
    .replace(/【R[·・]/g,'【')
    .trim();
  if(!detail)continue;
  SKILL_INFO[name]=detail;
  const clean=detail
    .replace(/^初始法力[^。]*。\s*/,'')
    .replace(/\n+/g,' ')
    .replace(/\s+/g,' ')
    .trim();
  const sentences=clean.split('。').map(text=>text.trim()).filter(Boolean);
  SKILL_BRIEF[name]=sentences.slice(0,2).join('。')+(sentences.length?'。':'');
}
SKILL_BRIEF['诺艾尔']='被动：每名正在攻击诺艾尔的敌人使双抗分别提高8/10/15点；失去目标后延迟2秒移除，护盾期间层数冻结。护心岩铠：嘲讽当前目标格及周围六格5秒，获得250/400/1200 + 当前双抗总和×1/2/5的护盾5秒；无伤害、无岩附着。';

// Keep only effects that can still be produced by confirmed characters,
// equipment, or the new reaction system.
const confirmedEffectGroupData=[['持续状态',[
  [STATUS_ICON_PATH.weaken,'增伤降低','造成的伤害降低；当前由克洛琳德决斗等效果触发'],
  [STATUS_ICON_PATH.grievous,'重伤','受到的治疗降低30%'],
  [STATUS_ICON_PATH.invulnerable,'无敌','持续期间受到的所有伤害变为0'],
  ['assets/broken-shield.svg','元素减抗','对应元素抗性降低30%，持续5秒'],
  ['assets/broken-shield.svg','物理减抗','物理抗性固定降低20点，持续5秒'],
  [STATUS_ICON_PATH.frozenControl,'冻结','无法移动、普攻或释放技能，基础持续2秒'],
  [STATUS_ICON_PATH.stun,'眩晕','无法移动、普攻或释放技能'],
  [STATUS_ICON_PATH.taunt,'嘲讽','强制把嘲讽来源作为攻击目标'],
  [STATUS_ICON_PATH.silence,'沉默','可以移动和普攻，但不能释放技能']
]]];
const effectHost=document.querySelector('#effectGroups');
if(effectHost)effectHost.innerHTML=`<div class="effect-items">${confirmedEffectGroupData[0][1].map(([src,name,desc])=>`<div class="effect-item"><img src="${src}" alt=""><span>${name}<small>${desc}</small></span></div>`).join('')}</div>`;
const confirmedReactionGuide=[
  ['蒸发','火 + 水','生成4秒蒸发标记，记录目标实际损失的护盾与生命；首次触发结算系数为80%，第二次触发提高至200%且不延长时间。标记结算前第三次及后续触发无效。'],
  ['感电链','水 + 雷','连接同阵营2～3名敌人8秒；任一成员承受伤害时，其余成员各受到原始实际伤害15%的真实传导伤害。传导伤害不递归。'],
  ['冻结','水 + 冰','立即完全冻结2秒；期间无法移动、普攻或施放技能。韧性正常影响持续时间，不叠层、不减速。'],
  ['融化','火 + 冰','本次总伤害×2.0；不再附加易伤状态。'],
  ['超载','火 + 雷','对目标周围1.5格造成250 + 触发者攻击力150%的范围元素伤害；不附着，可触发感电传导。'],
  ['超导','冰 + 雷','生成中心与周围六格领域8秒。敌人首次进入失去20法力，并固定降低20物理抗性5秒。'],
  ['扩散','风 + 已附着元素','目标及附近敌人受到50 + 触发者攻击力100%的对应元素伤害，并降低30%对应元素抗性5秒；不附着。'],
  ['结晶','岩 + 火/水/冰/雷','每种元素每队首次触发：对应元素角色中，法器、弓、长柄攻击力+15；单手剑、双手剑物理抗性与元素抗性各+15。岩元素角色同时获得攻击力与双抗。后续重复触发同种结晶时，各项仅+5；3岩共鸣使每次结晶收益变为1.5倍。']
];
const reactionHost=document.querySelector('#bottomReaction');
if(reactionHost)reactionHost.innerHTML=`<h3>元素反应效果表</h3><p style="font-size:12px;color:#aab7c9;margin:5px 0 8px;line-height:1.55">实际伤害等于护盾损失与生命损失之和，不计算溢出；触发反应后消耗元素附着。固定减抗先结算，百分比减抗后结算。</p><table class="reaction-table"><thead><tr><th>反应</th><th>组合</th><th>效果与公式</th></tr></thead><tbody>${confirmedReactionGuide.map(r=>`<tr><td><img class="table-icon" src="${REACTION_ICON_PATH[r[0]]||''}" alt="">${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table>`;

function resetConfirmedRuntime(){
  vaporMarks=[];electroLinks=[];confirmedSuperconductZones=[];confirmedOverloadEffects=[];confirmedMeltEffects=[];yelanBindings=[];confirmedNeuvilletteFloorWaves=[];delayedRaidenBursts=[];mavuikaSlashes=[];
  crystallizedByTeam.blue?.clear();crystallizedByTeam.red?.clear();
  for(const u of units){initializeConfirmedUnit(u,true);u.lifesteal=0;u.normalLifesteal=0;u.skillLifesteal=0;u.hutaoLastStandLifestealGranted=false;u.crystalAtkFlat=0;u.crystalPhysicalFlat=0;u.crystalElementFlat=0;delete u.crystalAtkPercent;delete u.crystalPhysicalPercent;delete u.crystalElementPercent;u.fischlConfirmedStacks=0;u.fischlNormalCount=0;u.ozConfirmedHits=0;u.noellePassiveSources={};u.noelleExtraRes=0;u.noellePassivePaused=false}
  for(const u of units.filter(x=>x.alive&&!x.onBench&&x.name==='菲谢尔')){
    const cell=neighbors(u).find(c=>!occupied(c,u));
    if(cell)ozSummons.push({owner:u,team:u.team,row:cell.row,col:cell.col,hitCount:0});
  }
}
// 重新布阵会直接返回准备阶段，不一定再次经过战斗初始化；
// 因此在准备阶段入口立即清掉所有仅属于上一场战斗的反应特效。
const enterPreparationBeforeConfirmed=enterPreparation;
enterPreparation=function(...args){
  vaporMarks=[];
  electroLinks=[];
  confirmedSuperconductZones=[];
  confirmedOverloadEffects=[];
  confirmedMeltEffects=[];
  yelanBindings=[];
  confirmedNeuvilletteFloorWaves=[];
  delayedRaidenBursts=[];
  mavuikaSlashes=[];
  return enterPreparationBeforeConfirmed(...args);
};
const startBeforeConfirmed=startBattle;
startBattle=function(){const result=startBeforeConfirmed();if(started)resetConfirmedRuntime();return result};
if(startBtn)startBtn.onclick=startBattle;

})();
