let nextEquipmentInstanceId=1,equipmentDragState=null,consumableDragState=null,equipmentHoverUnit=null,selectedEquipmentId=null,suppressEquipmentClick=false;
window.unitEquipmentHovering=false;

function ensureUnitEquipment(unit){
  if(!unit)return;
  const seen=new Set(),clean=[];
  for(const item of Array.isArray(unit.equipment)?unit.equipment:[]){
    const id=item?.equipmentId;
    if(!id||!EQUIPMENT_CONFIG[id]||seen.has(id))continue;
    seen.add(id);clean.push({instanceId:item.instanceId||`equip-${Date.now()}-${nextEquipmentInstanceId++}`,equipmentId:id});
    if(clean.length===3)break;
  }
  while(clean.length<3)clean.push(null);
  unit.equipment=clean;
  if(!unit.equipmentRuntime)resetEquipmentRuntime(unit);
}
function resetEquipmentRuntime(unit){unit.equipmentRuntime={timers:{regeneration:0,redemption:0,temporal:0},cooldowns:{manaRing:0},stacks:{battleWill:0,temporalBow:0},triggered:{emergencyPendant:false,mercuryCloak:false},targetCooldowns:{}}}
function equipmentConfig(unit,id){ensureUnitEquipment(unit);return unit.equipment.some(x=>x?.equipmentId===id)?EQUIPMENT_CONFIG[id]:null}
function hasEquipment(unit,id){return!!equipmentConfig(unit,id)}
function collectEquipmentStats(unit){
  ensureUnitEquipment(unit);
  const out={atkPercent:0,hpPercent:0,res:0,attackSpeed:0,startMana:0,critChance:0,critDamage:0,skillAmp:0,healShieldPower:0,tenacity:0};
  for(const item of unit.equipment){const stats=item&&EQUIPMENT_CONFIG[item.equipmentId]?.stats;if(!stats)continue;for(const key in out)out[key]+=stats[key]||0}
  out.skillAmp=Math.min(EQUIPMENT_GLOBAL_CAPS.skillAmpFromEquipment,out.skillAmp);out.healShieldPower=Math.min(EQUIPMENT_GLOBAL_CAPS.healShieldPowerFromEquipment,out.healShieldPower);out.tenacity=Math.min(EQUIPMENT_GLOBAL_CAPS.tenacity,out.tenacity);return out;
}
function recalculateUnitEquipmentStats(unit,resetMana=false){
  if(!unit||unit.isDummy)return;
  ensureUnitEquipment(unit);const cfg=PIECE_CONFIG[unit.name];if(!cfg)return;
  const base=statsForStar(cfg,unit.star||1),oldMax=Math.max(1,unit.maxHp||base.hp),ratio=Math.max(0,Math.min(1,(unit.hp??oldMax)/oldMax)),s=collectEquipmentStats(unit);
  unit.equipmentStats=s;unit.baseStartMana=base.initialMana;unit.maxHp=Math.round(base.hp*(1+s.hpPercent));unit.atk=Math.round(base.atk*(1+s.atkPercent));unit.def=base.resist+s.res;unit.as=Math.min(EQUIPMENT_GLOBAL_CAPS.attackSpeed,base.as+s.attackSpeed);unit.range=base.range;unit.maxMp=base.maxMana;unit.critRate=Math.min(EQUIPMENT_GLOBAL_CAPS.critChance,.2+s.critChance);unit.critDamage=1.4+s.critDamage;unit.hp=Math.max(unit.alive===false?0:1,Math.round(unit.maxHp*ratio));
  if(resetMana)unit.mp=Math.min(unit.maxMp,base.initialMana+s.startMana);
}
function canViewUnitEquipment(unit){if(!unit||unit.inWarehouse||unit.isWarehousePreview||unit.isStageEditorPreview||unit.isSummon||unit.isDummy)return false;const validBench=unit.onBench===true&&Number.isInteger(unit.benchIndex)&&unit.benchIndex>=0&&unit.benchIndex<BENCH_SLOTS;const validBoard=unit.onBench===false&&Number.isInteger(unit.row)&&Number.isInteger(unit.col)&&unit.row>=0&&unit.row<ROWS&&unit.col>=0&&unit.col<COLS;return validBench||validBoard}
function canEquipUnit(unit){return!started&&!ended&&unit?.alive&&!(window.PVE_FIRST_ACTIVE&&unit.team==='red')&&canViewUnitEquipment(unit)}
function previewEquipItem(unit,equipmentId){if(!canEquipUnit(unit))return{valid:false,reason:'该目标不能装备'};if(!EQUIPMENT_CONFIG[equipmentId])return{valid:false,reason:'装备不存在'};ensureUnitEquipment(unit);if(unit.equipment.some(x=>x?.equipmentId===equipmentId))return{valid:false,reason:'不能装备两件同名装备'};const slot=unit.equipment.findIndex(x=>x===null);return slot<0?{valid:false,reason:'装备栏已满'}:{valid:true,slot}}
function showEquipmentToast(text){let el=document.querySelector('#equipmentToast');if(!el){el=document.createElement('div');el.id='equipmentToast';document.body.appendChild(el)}el.textContent=text;el.classList.add('show');clearTimeout(el._timer);el._timer=setTimeout(()=>el.classList.remove('show'),1500)}
function equipItemToUnit(unit,equipmentId){const p=previewEquipItem(unit,equipmentId);if(!p.valid){showEquipmentToast(p.reason);return false}unit.equipment[p.slot]={instanceId:`equip-${Date.now()}-${nextEquipmentInstanceId++}`,equipmentId};recalculateUnitEquipmentStats(unit,false);saveFormation();renderUnitInspect(unit);showEquipmentToast(`${unit.name}装备了${EQUIPMENT_CONFIG[equipmentId].name}`);return true}
const _makeUnitBeforeEquipment=makeUnit;
makeUnit=function(...args){const unit=_makeUnitBeforeEquipment(...args);ensureUnitEquipment(unit);if(!unit.isDummy)recalculateUnitEquipmentStats(unit,false);return unit};
for(const unit of units){ensureUnitEquipment(unit);if(!unit.isDummy)recalculateUnitEquipmentStats(unit,false)}

const _formationSnapshotBeforeEquipment=formationSnapshot;
formationSnapshot=function(){const list=_formationSnapshotBeforeEquipment();for(const saved of list){const unit=units.find(x=>x.id===saved.id);ensureUnitEquipment(unit);saved.equipment=unit?.equipment?.map(x=>x?{instanceId:x.instanceId,equipmentId:x.equipmentId}:null)||[null,null,null]}return list};
const _applyFormationStateBeforeEquipment=applyFormationState;
applyFormationState=function(unit,saved){_applyFormationStateBeforeEquipment(unit,saved);unit.equipment=Array.isArray(saved.equipment)?saved.equipment:[null,null,null];ensureUnitEquipment(unit);if(!unit.isDummy)recalculateUnitEquipmentStats(unit,false);return unit};
const _prepareUnitsBeforeEquipment=prepareUnits;
prepareUnits=function(...args){_prepareUnitsBeforeEquipment(...args);for(const unit of units){ensureUnitEquipment(unit);if(!unit.isDummy)recalculateUnitEquipmentStats(unit,false)}};
const _processUpgradeQueueBeforeEquipment=processUpgradeQueue;
processUpgradeQueue=function(...args){const result=_processUpgradeQueueBeforeEquipment(...args);for(const unit of units){ensureUnitEquipment(unit);if(!unit.isDummy)recalculateUnitEquipmentStats(unit,false)}return result};

const _getFinalStatBeforeEquipment=getFinalStat;
getFinalStat=function(unit,key){let value=_getFinalStatBeforeEquipment(unit,key);if(!unit?.equipmentRuntime)return value;const rt=unit.equipmentRuntime;
  if(key==='as'){const temporal=hasEquipment(unit,'temporal_bowstring')?(rt.stacks.temporalBow||0)*EQUIPMENT_CONFIG.temporal_bowstring.effect.attackSpeedPerStack:0,berserk=hasEquipment(unit,'berserker_bracer')&&unit.hp/unit.maxHp<.5?EQUIPMENT_CONFIG.berserker_bracer.effect.value:0,hunter=has(unit,'equipmentHunter')?.value||0;value=Math.min(EQUIPMENT_GLOBAL_CAPS.attackSpeed,value+temporal+berserk+hunter)}
  if(key==='dmgOut'&&hasEquipment(unit,'battle_emblem'))value+=Math.min(5,rt.stacks.battleWill||0)*.02;
  if(key==='dmgIn'&&has(unit,'equipmentMercuryDR'))value-=has(unit,'equipmentMercuryDR').value||.2;
  return Math.round(value*100)/100;
};
const _panelAsBeforeEquipment=panelAs;
panelAs=function(unit){return Number(getFinalStat(unit,'as')).toFixed(2)};
function equipmentHealShieldPower(unit){return unit?.equipmentStats?.healShieldPower||0}
function applyEquipmentShieldAmount(source,amount){return amount*(1+equipmentHealShieldPower(source))}
const _healUnitBeforeEquipment=healUnit;
healUnit=function(target,amount,source=target){return _healUnitBeforeEquipment(target,amount*(1+equipmentHealShieldPower(source)),source)};

function equipmentShieldValue(unit){return unit?.equipmentShield?.value>0?unit.equipmentShield:null}
const _getUnitShieldBeforeEquipment=getUnitShield;
getUnitShield=function(unit){return equipmentShieldValue(unit)||_getUnitShieldBeforeEquipment(unit)};

const _effectBeforeEquipment=effect;
effect=function(unit,type,duration,value=0){
  if(type==='stun'&&unit?.alive){ensureUnitEquipment(unit);const q=EQUIPMENT_CONFIG.quicksilver_cloak.effect,rt=unit.equipmentRuntime;if(hasEquipment(unit,'quicksilver_cloak')&&!rt.triggered.mercuryCloak){rt.triggered.mercuryCloak=true;_effectBeforeEquipment(unit,'equipmentMercuryDR',q.duration,q.damageReduction);showEquipmentToast(`${unit.name}的水银披风免疫了控制`);return false}duration*=1-Math.min(EQUIPMENT_GLOBAL_CAPS.tenacity,unit.equipmentStats?.tenacity||0)}
  return _effectBeforeEquipment(unit,type,duration,value);
};
function applyEquipmentHardControl(unit,duration,type='control'){ensureUnitEquipment(unit);const q=EQUIPMENT_CONFIG.quicksilver_cloak.effect,rt=unit.equipmentRuntime;if(hasEquipment(unit,'quicksilver_cloak')&&!rt.triggered.mercuryCloak){rt.triggered.mercuryCloak=true;_effectBeforeEquipment(unit,'equipmentMercuryDR',q.duration,q.damageReduction);return 0}return duration*(1-Math.min(EQUIPMENT_GLOBAL_CAPS.tenacity,unit.equipmentStats?.tenacity||0))}

function gainBattleWill(unit){if(!hasEquipment(unit,'battle_emblem'))return;const rt=unit.equipmentRuntime;rt.stacks.battleWill=Math.min(5,(rt.stacks.battleWill||0)+1)}
function onEquipmentNormalHit(unit){const rt=unit.equipmentRuntime;gainBattleWill(unit);if(hasEquipment(unit,'mana_ring')&&(rt.cooldowns.manaRing||0)<=0){unit.mp=Math.min(unit.maxMp,unit.mp+5);rt.cooldowns.manaRing=.75}}
function onEquipmentSkillCast(unit){gainBattleWill(unit);if(hasEquipment(unit,'hunter_feather'))effect(unit,'equipmentHunter',5,.30)}

const _damageBeforeEquipment=damage;
damage=function(source,target,raw,options={}){
  if(!source||!target)return 0;ensureUnitEquipment(source);ensureUnitEquipment(target);
  const isTransfer=!!options.transfer,isDirect=!!options.direct,isEquipment=!!options.equipment,isSummon=!!options.summon,isSkill=!!options.skill&&!isDirect&&!isTransfer&&!isEquipment&&!isSummon,isNormal=!options.skill&&!isDirect&&!isTransfer&&!isEquipment&&!isSummon;
  let amp=0;if((isSkill||isNormal)&&target.maxHp>source.maxHp&&hasEquipment(source,'giant_slayer'))amp+=.22;if((isSkill||isNormal)&&getUnitShield(target)?.value>0&&hasEquipment(source,'shieldbreaker_spear'))amp+=.25;if((isSkill||isNormal)&&target.hp/target.maxHp<.35&&hasEquipment(source,'execution_blade'))amp+=.24;if(isSkill)amp+=source.equipmentStats?.skillAmp||0;amp=Math.min(EQUIPMENT_GLOBAL_CAPS.damageAmpFromEquipment,amp);raw*=1+amp;
  if(isSkill&&hasEquipment(source,'arcane_prism')&&Math.random()<(source.critRate||0))raw*=source.critDamage||1.4;
  let reduction=0;if(source.team!==target.team&&hasEquipment(target,'bulwark_armor'))reduction+=.10;raw*=1-Math.min(EQUIPMENT_GLOBAL_CAPS.damageReductionFromEquipment,reduction);
  const shieldBefore=getUnitShield(target)?.value||0,hpDamage=_damageBeforeEquipment(source,target,raw,options),shieldAfter=getUnitShield(target)?.value||0,absorbed=Math.max(0,shieldBefore-shieldAfter),effective=hpDamage+absorbed;
  if(effective>0&&isNormal)onEquipmentNormalHit(source);
  if(hpDamage>0&&(isNormal||isSkill)&&hasEquipment(source,'bloodthirst_blade'))healUnit(source,hpDamage*.20,source);
  if(hpDamage>0&&isSkill&&hasEquipment(source,'judgment_emblem')){const rt=source.equipmentRuntime,key=`grievous:${target.id}`;if((rt.targetCooldowns[key]||0)<=0){effect(target,'grievous',6,.50);rt.targetCooldowns[key]=2}}
  if(effective>0&&isNormal&&source!==target&&hasEquipment(target,'thornmail')&&target.alive&&source.alive){const reflect=Math.min(45,effective*.15);damage(target,source,reflect,{skill:true,direct:true,equipment:true})}
  if(target.alive&&target.hp/target.maxHp<.40&&hasEquipment(target,'emergency_pendant')&&!target.equipmentRuntime.triggered.emergencyPendant){target.equipmentRuntime.triggered.emergencyPendant=true;healUnit(target,target.maxHp*.25,target)}
  return hpDamage;
};

const _castSkillBeforeEquipment=castSkill;
castSkill=function(unit){const before=unit.mp;const result=_castSkillBeforeEquipment(unit);if(unit.mp<before||unit.mp===0)onEquipmentSkillCast(unit);return result};

function tickEquipmentRuntime(dt){for(const unit of units){if(!unit.alive||unit.onBench||unit.isDummy)continue;ensureUnitEquipment(unit);const rt=unit.equipmentRuntime;rt.cooldowns.manaRing=Math.max(0,(rt.cooldowns.manaRing||0)-dt);for(const key of Object.keys(rt.targetCooldowns))rt.targetCooldowns[key]=Math.max(0,rt.targetCooldowns[key]-dt);
    if(unit.equipmentShield){unit.equipmentShield.time-=dt;if(unit.equipmentShield.time<=0)unit.equipmentShield=null}
    if(hasEquipment(unit,'temporal_bowstring')){rt.timers.temporal+=dt;while(rt.timers.temporal>=3&&rt.stacks.temporalBow<6){rt.timers.temporal-=3;rt.stacks.temporalBow++}}
    if(hasEquipment(unit,'regeneration_pendant')){rt.timers.regeneration+=dt;if(rt.timers.regeneration>=2){rt.timers.regeneration-=2;healUnit(unit,unit.maxHp*.03,unit)}}
    if(hasEquipment(unit,'redemption_lamp')){rt.timers.redemption+=dt;if(rt.timers.redemption>=7){rt.timers.redemption-=7;const allies=units.filter(x=>x.alive&&!x.onBench&&x.team===unit.team&&x.hp<x.maxHp).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp||a.hp-b.hp||String(a.id).localeCompare(String(b.id)));const main=allies[0];if(main){healUnit(main,unit.maxHp*.10,unit);for(const ally of allies.filter(x=>x!==main&&dist(x,main)<=1))healUnit(ally,unit.maxHp*.05,unit)}}}
  }}
const _tickBeforeEquipment=tick;
tick=function(dt){_tickBeforeEquipment(dt);if(started&&!paused&&!ended)tickEquipmentRuntime(dt)};

function initializeEquipmentBattle(){for(const unit of units){ensureUnitEquipment(unit);recalculateUnitEquipmentStats(unit,true);resetEquipmentRuntime(unit);const stats=collectEquipmentStats(unit);unit.mp=Math.min(unit.maxMp,unit.baseStartMana+stats.startMana);if(hasEquipment(unit,'guardian_oath')){const amount=unit.maxHp*.26*(1+equipmentHealShieldPower(unit));unit.equipmentShield={value:amount,max:amount,time:10};unit.shieldingDone=(unit.shieldingDone||0)+amount}}}
const _startBattleBeforeEquipment=startBattle;
startBattle=function(){const result=_startBattleBeforeEquipment();if(started)initializeEquipmentBattle();return result};startBtn.onclick=startBattle;

function escapeEquipmentHtml(text){return String(text??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function warehouseEquipmentEntries(){return[...Object.values(EQUIPMENT_CONFIG).map(config=>({config,kind:'equipment'})),...Object.values(CONSUMABLE_CONFIG).map(config=>({config,kind:'consumable'}))]}
function renderWarehouseEquipmentCards(){const box=document.querySelector('#whEquipCards');if(!box)return;const category=whState.equipmentCategory||'all';const list=warehouseEquipmentEntries().filter(({config})=>category==='all'||config.category===category);box.innerHTML=list.map(({config:c,kind})=>`<div class="wh-equip-card ${kind==='consumable'?'special':''}" data-item-id="${c.id}" data-item-kind="${kind}" title="${escapeEquipmentHtml(c.name)}"><img class="wh-equip-icon" src="${c.icon}" alt="${escapeEquipmentHtml(c.name)}" draggable="false"><div class="wh-equip-name">${c.name}</div><div class="wh-equip-stat">${c.cardStatText||c.statText||''}</div><div class="wh-equip-effect">${c.cardEffectText||c.effectText||''}</div></div>`).join('')}
function getWarehouseItemConfig(itemId){return EQUIPMENT_CONFIG[itemId]||CONSUMABLE_CONFIG[itemId]}
function renderEquipmentInspect(itemId){const c=getWarehouseItemConfig(itemId);if(!c)return;selectedEquipmentId=itemId;selectedUnit=null;hoverInspectUnitId=null;inspect.classList.remove('team-blue','team-red','panel-arranged');inspect.classList.add('show','team-neutral');document.querySelector('.tabs').hidden=true;logPane.hidden=true;inspect.innerHTML=`<div class="equipment-inspect-head"><img src="${c.icon}" alt="${escapeEquipmentHtml(c.name)}"><h3>${c.name}</h3></div><div class="equipment-inspect-stat">${c.cardStatText||c.statText||''}</div><div class="equipment-inspect-detail">${c.detailText||c.effectText||''}</div>`}
function renderEquipmentPanel(unit){if(!canViewUnitEquipment(unit))return;ensureUnitEquipment(unit);const host=document.createElement('div');host.className='unit-equipment-section';const count=unit.equipment.filter(Boolean).length;host.innerHTML=`<div class="unit-equipment-title"><span>装备</span><b>${count}/3</b></div><div class="unit-equipment-slots">${unit.equipment.map((item,i)=>item?`<span class="unit-equipment-slot filled" data-equip-slot="${i}" data-equipment-id="${item.equipmentId}"><img src="${EQUIPMENT_CONFIG[item.equipmentId].icon}" alt=""></span>`:`<span class="unit-equipment-slot empty"></span>`).join('')}</div><div class="unit-equipment-description">${count?'悬停图标查看装备效果。使用装备拆卸器可卸下全部装备。':'该棋子尚未装备物品。'}</div>`;inspect.appendChild(host)}
const _renderUnitInspectBeforeEquipment=renderUnitInspect;
renderUnitInspect=function(unit){selectedEquipmentId=null;_renderUnitInspectBeforeEquipment(unit);renderEquipmentPanel(unit)};
inspect.addEventListener('pointerover',event=>{const slot=event.target.closest('[data-equipment-id]');if(!slot)return;window.unitEquipmentHovering=true;const c=EQUIPMENT_CONFIG[slot.dataset.equipmentId],desc=inspect.querySelector('.unit-equipment-description');if(c&&desc)desc.innerHTML=`<strong>${c.name}</strong><br>${c.statText}<br>${c.effectText}`});
inspect.addEventListener('pointerout',event=>{if(event.relatedTarget&&inspect.contains(event.relatedTarget)&&event.relatedTarget.closest?.('[data-equipment-id]'))return;window.unitEquipmentHovering=false});

function equipmentDropUnit(clientX,clientY){const rect=canvas.getBoundingClientRect(),x=(clientX-rect.left)*canvas.width/rect.width,y=(clientY-rect.top)*canvas.height/rect.height;const unit=unitAt(x,y);return canEquipUnit(unit)?unit:null}
function showEquipmentGhost(config,x,y){const g=document.querySelector('#equipmentDragGhost'),img=g?.querySelector('img');if(!g||!img)return;img.src=config.icon;g.style.left=x+'px';g.style.top=y+'px';g.classList.add('visible')}
function clearEquipmentDrag(){equipmentDragState=null;equipmentHoverUnit=null;document.querySelector('#equipmentDragGhost')?.classList.remove('visible')}
let equipmentInventory=[];
function canUseEquipmentConsumable(unit,consumableId){if(started||ended)return{valid:false,reason:'战斗阶段不能使用'};if(!CONSUMABLE_CONFIG[consumableId])return{valid:false,reason:'道具不存在'};if(window.PVE_FIRST_ACTIVE&&unit?.team==='red')return{valid:false,reason:'挑战模式不能修改敌方棋子'};if(!unit||!unit.alive||!canViewUnitEquipment(unit))return{valid:false,reason:'该目标不能使用道具'};ensureUnitEquipment(unit);const equippedItems=unit.equipment.filter(Boolean);return equippedItems.length?{valid:true,equippedItems}:{valid:false,reason:'该棋子没有装备'}}
function standardReforgePool(originalId){return Object.values(EQUIPMENT_CONFIG).filter(c=>c.itemClass==='standard_completed'&&c.id!==originalId).map(c=>c.id)}
function rollReforgedEquipmentId(originalId){const pool=standardReforgePool(originalId);return pool.length?pool[Math.floor(Math.random()*pool.length)]:null}
function refreshAfterConsumable(unit){recalculateUnitEquipmentStats(unit,false);saveFormation();renderUnitInspect(unit);renderWarehouseEquipmentCards()}
function useItemRemover(unit){const check=canUseEquipmentConsumable(unit,'item_remover');if(!check.valid){showEquipmentToast(check.reason);return false}const snapshot=unit.equipment.map(item=>item?{...item}:null);try{equipmentInventory.push(...check.equippedItems.map(item=>({...item})));unit.equipment=[null,null,null];refreshAfterConsumable(unit);showEquipmentToast(`已卸下${unit.name}的全部装备`);return true}catch(error){unit.equipment=snapshot;recalculateUnitEquipmentStats(unit,false);console.error('拆卸器使用失败',error);return false}}
function showReforgeResult(unit,oldItems,newItems){let panel=document.querySelector('#reforgeResult');if(!panel){panel=document.createElement('div');panel.id='reforgeResult';panel.style.cssText='position:fixed;left:50%;top:18%;transform:translateX(-50%);z-index:1400;min-width:260px;max-width:420px;padding:12px 14px;border:1px solid #d49a38;border-radius:9px;background:rgba(12,18,29,.96);color:#dce8f7;box-shadow:0 10px 32px #000a;font:12px/1.55 Microsoft YaHei;pointer-events:none';document.body.appendChild(panel)}panel.innerHTML=`<b style="color:#f2cb71">${escapeEquipmentHtml(unit.name)} · 重铸结果</b><br>${oldItems.map((oldItem,index)=>`${escapeEquipmentHtml(EQUIPMENT_CONFIG[oldItem.equipmentId].name)} → <span style="color:#8fd8ff">${escapeEquipmentHtml(EQUIPMENT_CONFIG[newItems[index].equipmentId].name)}</span>`).join('<br>')}`;panel.style.display='block';clearTimeout(panel._timer);panel._timer=setTimeout(()=>panel.style.display='none',2200)}
function useItemReforger(unit){const check=canUseEquipmentConsumable(unit,'item_reforger');if(!check.valid){showEquipmentToast(check.reason);return false}const oldItems=check.equippedItems.map(item=>({...item})),newItems=[];for(const oldItem of oldItems){const equipmentId=rollReforgedEquipmentId(oldItem.equipmentId);if(!equipmentId){showEquipmentToast('该装备没有可用的重铸结果');return false}newItems.push({instanceId:`equip-${Date.now()}-${nextEquipmentInstanceId++}`,equipmentId})}const snapshot=unit.equipment.map(item=>item?{...item}:null);try{unit.equipment=[null,null,null];equipmentInventory.push(...newItems);refreshAfterConsumable(unit);showReforgeResult(unit,oldItems,newItems);showEquipmentToast(`已重铸${oldItems.length}件装备并放回仓库`);return true}catch(error){unit.equipment=snapshot;recalculateUnitEquipmentStats(unit,false);console.error('重铸器使用失败',error);return false}}
function clearConsumableDrag(){consumableDragState=null;equipmentHoverUnit=null;document.querySelector('#equipmentDragGhost')?.classList.remove('visible')}
document.querySelector('#equipmentWarehouseControls').addEventListener('click',event=>{const button=event.target.closest('[data-equipment-category]');if(!button)return;whState.equipmentCategory=button.dataset.equipmentCategory;document.querySelectorAll('[data-equipment-category]').forEach(b=>b.classList.toggle('active',b===button));renderWarehouseEquipmentCards()});
document.querySelector('#whEquipCards').addEventListener('click',event=>{if(suppressEquipmentClick){event.preventDefault();return}const card=event.target.closest('[data-item-id]');if(card)renderEquipmentInspect(card.dataset.itemId)});
document.querySelector('#whEquipCards').addEventListener('dblclick',event=>{event.preventDefault();event.stopPropagation()});
document.querySelector('#whEquipCards').addEventListener('pointerdown',event=>{const card=event.target.closest('[data-item-id]');if(!card||started||ended)return;event.preventDefault();event.stopPropagation();const id=card.dataset.itemId,kind=card.dataset.itemKind,base={pointerId:event.pointerId,startClientX:event.clientX,startClientY:event.clientY,moved:false};if(kind==='consumable')consumableDragState={...base,sourceType:'consumableWarehouse',consumableId:id,instanceId:`consumable-${id}-${Date.now()}`};else equipmentDragState={...base,sourceType:'equipmentWarehouse',equipmentId:id};showEquipmentGhost(getWarehouseItemConfig(id),event.clientX,event.clientY)},true);
window.addEventListener('pointermove',event=>{const state=consumableDragState||equipmentDragState;if(!state)return;event.preventDefault();event.stopImmediatePropagation();if(Math.hypot(event.clientX-state.startClientX,event.clientY-state.startClientY)>=5)state.moved=true;const g=document.querySelector('#equipmentDragGhost');if(g){g.style.left=event.clientX+'px';g.style.top=event.clientY+'px'}equipmentHoverUnit=state.moved?equipmentDropUnit(event.clientX,event.clientY):null},true);
window.addEventListener('pointerup',event=>{const state=consumableDragState||equipmentDragState;if(!state)return;event.preventDefault();event.stopImmediatePropagation();const moved=state.moved,unit=moved?equipmentDropUnit(event.clientX,event.clientY):null;if(consumableDragState){if(unit){const check=canUseEquipmentConsumable(unit,state.consumableId);if(check.valid){state.consumableId==='item_remover'?useItemRemover(unit):useItemReforger(unit)}else showEquipmentToast(check.reason)}clearConsumableDrag()}else{if(unit)equipItemToUnit(unit,state.equipmentId);clearEquipmentDrag()}if(moved){suppressEquipmentClick=true;setTimeout(()=>{suppressEquipmentClick=false},0)}},true);
window.addEventListener('pointercancel',event=>{if(!equipmentDragState&&!consumableDragState)return;event.stopImmediatePropagation();consumableDragState?clearConsumableDrag():clearEquipmentDrag()},true);
const _drawBeforeEquipment=draw;
draw=function(){_drawBeforeEquipment();const state=consumableDragState||equipmentDragState;if(!state||!equipmentHoverUnit)return;const p=unitVisualPos(equipmentHoverUnit),valid=consumableDragState?canUseEquipmentConsumable(equipmentHoverUnit,state.consumableId).valid:previewEquipItem(equipmentHoverUnit,state.equipmentId).valid;ctx.save();ctx.beginPath();ctx.arc(p.x,p.y,34,0,Math.PI*2);ctx.strokeStyle=valid?'#65e8a8':'#ff5b6b';ctx.lineWidth=4;ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=12;ctx.stroke();ctx.restore()};

renderWarehouseEquipmentCards();
