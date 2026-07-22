/* PVE挑战模式第一版：固定阵容槽位、固定12关、常驻商店与经济。 */
(function(){
'use strict';
const SLOT_KEY='element-auto-chess-pve-stage-slots-v1',RUN_KEY='element-auto-chess-pve-run-first-v1';
const ORDER=['1-1','1-2','1-3','1-4','1-5','2-1','2-2','2-3','2-4','3-1','3-2','3-3'];
const RULES={
 '1-1':{type:'normal',gold:2},'1-2':{type:'normal',gold:2},'1-3':{type:'normal',gold:3},
 '1-4':{type:'reward',variants:['easy','normal','hard']},'1-5':{type:'boss',gold:5},
 '2-1':{type:'normal',gold:3},'2-2':{type:'normal',gold:3},'2-3':{type:'reward',variants:['easy','normal','hard']},'2-4':{type:'boss',gold:6},
 '3-1':{type:'normal',gold:4},'3-2':{type:'normal',gold:4},'3-3':{type:'final_boss',gold:10}
};
const SLOT_DEFS=[];
for(const id of ORDER){const r=RULES[id];if(r.type==='reward')for(const variant of r.variants)SLOT_DEFS.push({key:`${id}:${variant}`,stageId:id,variant,label:`${id} 奖励关·${({easy:'简单',normal:'普通',hard:'困难'})[variant]}`});else SLOT_DEFS.push({key:id,stageId:id,variant:null,label:`${id} ${r.type==='normal'?'普通关':r.type==='boss'?'Boss':'最终Boss'}`})}
const LEVEL_TOTAL={3:0,4:6,5:26,6:58,7:106,8:166,9:238};
const SHOP_ODDS={3:[65,20,15,0,0],4:[50,30,20,0,0],5:[35,34,30,1,0],6:[25,40,29,5,1],7:[15,25,40,15,5],8:[15,15,30,30,10],9:[5,15,25,15,40]};
const POOL_COPIES={1:21,2:18,3:15,4:12,5:9};
const SELL_PRICE={1:[0,1,3,9],2:[0,2,5,17],3:[0,3,8,26],4:[0,4,11,35],5:[0,5,14,44]};
let mode='test',run=null,mainSnapshot=null,slotAction='save',selectedSlot=null,battlePlayerSnapshot=null,roundResultNext=null;
const $=s=>document.querySelector(s),clone=v=>JSON.parse(JSON.stringify(v));
const standardEquipmentIds=()=>Object.values(EQUIPMENT_CONFIG).filter(c=>c.itemClass==='standard_completed').map(c=>c.id);
function toast(text){if(typeof showEquipmentToast==='function')showEquipmentToast(text);else addLog(text,'reaction')}
function loadSlots(){try{return JSON.parse(localStorage.getItem(SLOT_KEY)||'{}')}catch{return{}}}
function saveSlots(v){localStorage.setItem(SLOT_KEY,JSON.stringify(v))}
function scanRed(){return units.filter(u=>u.alive&&!u.isDummy&&!u.isSummon&&!u.inWarehouse&&!u.onBench&&u.team==='red'&&u.row>=0&&u.row<=3).map(u=>({templateId:u.templateId,star:normalizeStarValue(u.star),row:u.row,col:u.col,equipmentIds:(u.equipment||[]).filter(Boolean).map(x=>x.equipmentId).filter(id=>EQUIPMENT_CONFIG[id]).slice(0,3)}))}
function clearRedBoard(){const removed=new Set(units.filter(u=>!u.inWarehouse&&!u.onBench&&u.team==='red'&&u.row>=0&&u.row<=3).map(u=>u.id));units=units.filter(u=>!removed.has(u.id));summons=summons.filter(s=>!removed.has(s.owner?.id));if(selectedUnit&&removed.has(selectedUnit.id)){selectedUnit=null;hideUnitInspect()}}
function unitFromSaved(saved,prefix='stage'){
  const name=Object.keys(PIECE_CONFIG).find(n=>PIECE_CONFIG[n].templateId===saved.templateId),d=name&&pieceDefByName(name);if(!d)return null;
  const u=makeUnit(d,`${prefix}-${Date.now()}-${nextPieceId++}`,saved.star);u.team='red';u.onBench=false;u.benchIndex=null;u.row=saved.row;u.col=saved.col;u.inWarehouse=false;u.warehouseIndex=null;ensureUnitEquipment(u);u.equipment=[null,null,null];
  (saved.equipmentIds||[]).slice(0,3).forEach((id,i)=>{if(EQUIPMENT_CONFIG[id])u.equipment[i]={instanceId:`pve-eq-${Date.now()}-${i}-${Math.random()}`,equipmentId:id}});recalculateUnitEquipmentStats(u,false);u.hp=u.maxHp;return u;
}
function loadSlotIntoRed(key){const data=loadSlots()[key];if(!data?.length){toast('该槽位尚未保存敌人阵容');return false}clearRedBoard();for(const saved of data){const u=unitFromSaved(saved,'slot');if(u)units.push(u)}updateAliveCounts();renderDamageStats();saveFormation();return true}
function openSlotDialog(action){slotAction=action;selectedSlot=null;$('#pveSlotTitle').textContent=action==='save'?'保存当前红方阵容':'载入挑战关卡阵容';renderSlotList();$('#pveSlotDialog').classList.remove('hidden')}
function renderSlotList(){const slots=loadSlots(),box=$('#pveSlotList');box.innerHTML=SLOT_DEFS.map(s=>{const enemies=slots[s.key]||[],preview=enemies.map(saved=>{const entry=Object.entries(PIECE_CONFIG).find(([,config])=>config.templateId===saved.templateId),name=entry?.[0]||'未知棋子',config=entry?.[1],color=ELEMENTS[config?.element]||'#70839d';return`<span class="pve-slot-unit" style="--slot-element:${color}" title="${name}"><img src="${config?.avatar||''}" alt="${name}"></span>`}).join('');return`<button data-slot-key="${s.key}" class="${selectedSlot===s.key?'active':''}"><span class="pve-slot-name">${s.label}</span>${preview?`<span class="pve-slot-units">${preview}</span>`:'<small class="pve-slot-empty">未保存</small>'}</button>`}).join('');requestAnimationFrame(()=>{const titles=[...box.querySelectorAll('.pve-slot-name')],width=Math.ceil(Math.max(0,...titles.map(title=>title.scrollWidth)));if(width)box.style.setProperty('--slot-title-width',`${width}px`)})}
function confirmSlotAction(){if(!selectedSlot){toast('请先选择关卡槽位');return}if(slotAction==='save'){const enemies=scanRed();if(!enemies.length){toast('红方棋盘没有可保存的正式棋子');return}const slots=loadSlots();if(slots[selectedSlot]?.length&&!confirm('该关卡已有阵容，是否覆盖？'))return;slots[selectedSlot]=enemies;saveSlots(slots);toast(`已保存 ${enemies.length} 名敌人到 ${selectedSlot}`)}else loadSlotIntoRed(selectedSlot);$('#pveSlotDialog').classList.add('hidden')}
function createPool(){const pool={};for(const name of PIECE_ORDER){const c=PIECE_CONFIG[name];pool[c.templateId]=POOL_COPIES[c.cost]}return pool}
function createRun(){return{version:2,state:'preparation',gold:20,level:3,xp:0,populationLimit:3,lives:3,maxLives:3,lossCount:0,round:0,winStreak:0,freeRefreshes:3,shopLocked:false,shopOffers:[],currentStageIndex:0,selectedVariant:null,cardPool:createPool(),equipmentInventory:[],removers:0,reforgers:0,formation:[],rewardHistory:[],claimedPhases:[]}}
function saveRun(captureFormation=true){if(!run)return;if(captureFormation)run.formation=formationSnapshot().filter(x=>x.team==='blue');localStorage.setItem(RUN_KEY,JSON.stringify(run))}
function loadRun(){try{const saved=JSON.parse(localStorage.getItem(RUN_KEY)||'null');if(!saved)return null;if(!saved.maxLives){saved.maxLives=3;saved.lives=Math.max(0,3-(saved.lossCount||0));saved.version=2}if(Array.isArray(saved.shopOffers))saved.shopOffers.sort((a,b)=>(a?.cost??99)-(b?.cost??99));return saved}catch{return null}}
function grantOpening(){if(run.openingClaimed)return;const ids=standardEquipmentIds();if(ids.length)run.equipmentInventory.push(ids[Math.floor(Math.random()*ids.length)]);run.removers+=2;run.reforgers+=1;run.openingClaimed=true;grantPhase(1)}
function grantPhase(phase){if(run.claimedPhases.includes(phase))return;run.claimedPhases.push(phase);run.removers+=2;run.reforgers+=1;const count=phase===2?1:phase===3?2:0,ids=standardEquipmentIds();for(let i=0;i<count&&ids.length;i++)run.equipmentInventory.push(ids[Math.floor(Math.random()*ids.length)])}
function stageId(){return ORDER[run.currentStageIndex]}
function stageKey(){const id=stageId(),r=RULES[id];return r.type==='reward'?`${id}:${run.selectedVariant||'easy'}`:id}
function ensureStageChoice(){const r=RULES[stageId()];if(r.type!=='reward')return true;if(run.selectedVariant)return true;$('#pveVariantDialog').classList.remove('hidden');return false}
function restorePlayerFormation(snapshot=null,loadEnemy=true){const player=clone(snapshot||run.formation||[]);run.formation=clone(player);enterPreparation(player);const rebuilt=[];for(const saved of player){const definition=pieceDefByName(saved.name);if(!definition)continue;const unit=makeUnit(definition,saved.id,saved.star||1);applyFormationState(unit,saved);unit.team='blue';unit.row=saved.row;unit.col=saved.col;unit.onBench=!!saved.onBench;unit.benchIndex=saved.benchIndex;unit.inWarehouse=false;unit.motion=null;unit.target=null;unit.targetId=null;unit.moveFromHex=null;unit.moveToHex=null;unit.moveProgress=0;unit.renderX=undefined;unit.renderY=undefined;unit.alive=true;unit.hp=unit.maxHp;unit.mp=Math.min(unit.mp,unit.maxMp);rebuilt.push(unit)}units=rebuilt;if(loadEnemy)loadCurrentEnemy();lastFormation=formationSnapshot();saveRun(false);updateAliveCounts();renderDamageStats()}
function loadCurrentEnemy(){if(!ensureStageChoice())return false;const data=loadSlots()[stageKey()];if(!data?.length){toast(`关卡 ${stageKey()} 尚未保存敌人阵容`);return false}clearRedBoard();for(const saved of data){const u=unitFromSaved(saved,'pve-enemy');if(u){u.isPveEnemy=true;units.push(u)}}updateAliveCounts();renderDamageStats();return true}
function activateChallenge(existing){
  if(mode==='test')mainSnapshot={formation:clone(formationSnapshot()),whState:clone(whState)};
  mode='challenge';window.PVE_FIRST_ACTIVE=true;run=existing||createRun();grantOpening();run.formation=run.formation||[];saveRun(false);
  $('#loadPveSlotBtn').classList.add('hidden');$('#savePveSlotBtn').classList.add('hidden');$('#openChallengeBtn').classList.add('hidden');$('#exitChallengeBtn').classList.remove('hidden');$('#settleChallengeBtn').classList.remove('hidden');
  $('#pveShopBar').classList.remove('hidden');$('#whPanel').classList.remove('hidden');$('.wh-title').textContent='挑战装备栏';$('[data-wh-tab="pieces"]').hidden=true;switchWarehouseTab('equip');renderChallengeInventory();restorePlayerFormation();if(!run.shopOffers.length)refreshShop(true);renderPveHud();$('#challengeDialog').classList.add('hidden');
}
function leaveChallenge(saveProgress=true,askConfirmation=true){if(askConfirmation&&!confirm('保存进度并退出挑战模式？'))return false;if(saveProgress)saveRun();else localStorage.removeItem(RUN_KEY);mode='test';window.PVE_FIRST_ACTIVE=false;$('#pveShopBar').classList.add('hidden');$('#exitChallengeBtn').classList.add('hidden');$('#settleChallengeBtn').classList.add('hidden');$('#loadPveSlotBtn').classList.remove('hidden');$('#savePveSlotBtn').classList.remove('hidden');$('#openChallengeBtn').classList.remove('hidden');$('.wh-title').textContent='测试仓库';$('[data-wh-tab="pieces"]').hidden=false;Object.assign(whState,mainSnapshot?.whState||{});enterPreparation(mainSnapshot?.formation||[]);switchWarehouseTab(whState.tab||'pieces');renderWhCards();renderWarehouseEquipmentCards();mainSnapshot=null;return true}
function exitChallenge(){return leaveChallenge(true,true)}
function openChallengeSettlement(){if(mode!=='challenge'||!run)return;$('#challengeSettlementConfirmDialog').classList.remove('hidden')}
function confirmChallengeSettlement(){$('#challengeSettlementConfirmDialog').classList.add('hidden');$('#challengeSettlementStage').textContent=`当前关卡：${stageId()||'已完成'}`;$('#challengeSettlementRound').textContent=`已完成回合：${run.round}`;$('#challengeSettlementDialog').classList.remove('hidden')}
function restartChallengeFromSettlement(){localStorage.removeItem(RUN_KEY);$('#challengeSettlementDialog').classList.add('hidden');activateChallenge(createRun())}
function finishChallengeToTest(){ $('#challengeSettlementDialog').classList.add('hidden');leaveChallenge(false,false) }
function rollCost(){const odds=SHOP_ODDS[run.level],x=Math.random()*100;let sum=0;for(let i=0;i<5;i++){sum+=odds[i];if(x<sum)return i+1}return 1}
function returnOffers(){for(const offer of run.shopOffers||[])if(offer&&!offer.bought)run.cardPool[offer.templateId]=(run.cardPool[offer.templateId]||0)+1}
function rollOffer(){for(let tries=0;tries<50;tries++){const cost=rollCost(),names=PIECE_ORDER.filter(n=>PIECE_CONFIG[n].cost===cost&&(run.cardPool[PIECE_CONFIG[n].templateId]||0)>0);if(!names.length)continue;const name=names[Math.floor(Math.random()*names.length)],cfg=PIECE_CONFIG[name];run.cardPool[cfg.templateId]--;return{templateId:cfg.templateId,name,cost,bought:false}}return null}
function refreshShop(initial=false){if(started)return;const cost=run.freeRefreshes>0?0:2;if(!initial&&run.gold<cost){toast('金币不足');return}if(!initial){run.gold-=cost;if(run.freeRefreshes>0)run.freeRefreshes--}returnOffers();run.shopOffers=Array.from({length:5},rollOffer).sort((a,b)=>(a?.cost??99)-(b?.cost??99));saveRun();renderPveHud()}
function emptyBlueBench(){for(let i=0;i<BENCH_SLOTS;i++)if(!benchOccupied('blue',i))return i;return-1}
function buyOffer(index){if(started)return;const offer=run.shopOffers[index];if(!offer)return;if(run.gold<offer.cost){toast('金币不足');return}const bench=emptyBlueBench();if(bench<0){toast('蓝方备战席已满');return}const d=pieceDefByName(offer.name),u=makeUnit(d,`pve-piece-${Date.now()}-${nextPieceId++}`,1);u.team='blue';u.onBench=true;u.benchIndex=bench;u.row=null;u.col=null;u.inWarehouse=false;units.push(u);run.gold-=offer.cost;run.shopOffers[index]=null;checkSynthesisAfterDrop('blue');saveRun();renderPveHud();updateAliveCounts()}
function buyXp(){if(started||run.level>=9)return;if(run.gold<4){toast('金币不足');return}run.gold-=4;gainXp(4);saveRun();renderPveHud()}
function poolCopiesForStar(star){return star===3?9:star===2?3:1}
function animateGoldGain(amount,onComplete){
  if(amount<=0){onComplete?.();return}
  const target=$('#pveGold'),rect=target?.getBoundingClientRect();
  if(!rect){onComplete?.();return}
  const effect=document.createElement('div');effect.className='pve-gold-gain';effect.innerHTML=`<img src="assets/two-coins.svg" alt=""><b>+${amount}</b>`;
  effect.style.left=`${rect.left+rect.width/2}px`;effect.style.top=`${rect.top-38}px`;document.body.appendChild(effect);
  requestAnimationFrame(()=>effect.classList.add('play'));
  let completed=false;const finish=()=>{if(completed)return;completed=true;effect.remove();onComplete?.()};
  effect.addEventListener('animationend',finish,{once:true});setTimeout(finish,900);
}
function sellChallengeUnit(unit,askConfirmation=false){
  if(mode!=='challenge'||started||!unit||unit.team!=='blue'||unit.isDummy||unit.isSummon)return false;
  const price=SELL_PRICE[unit.cost]?.[normalizeStarValue(unit.star)]||0;
  if(askConfirmation&&!confirm(`出售 ${unit.star}★ ${unit.name}，获得 ${price} 金币？`))return false;
  ensureUnitEquipment(unit);for(const item of unit.equipment||[])if(item?.equipmentId)run.equipmentInventory.push(item.equipmentId);
  run.cardPool[unit.templateId]=(run.cardPool[unit.templateId]||0)+poolCopiesForStar(normalizeStarValue(unit.star));units=units.filter(x=>x!==unit);if(selectedUnit===unit){selectedUnit=null;hideUnitInspect()}renderChallengeInventory();updateAliveCounts();renderDamageStats();
  animateGoldGain(price,()=>{run.gold+=price;saveRun();renderPveHud();toast(`已出售 ${unit.name}，获得 ${price} 金币`)});return true;
}
function isShopSellDrop(clientX,clientY,unit){if(mode!=='challenge'||started||!unit||unit.team!=='blue'||unit.isDummy||unit.isSummon)return false;const shop=$('#pveShopBar');if(!shop||shop.classList.contains('hidden'))return false;const rect=shop.getBoundingClientRect();return clientX>=rect.left&&clientX<=rect.right&&clientY>=rect.top&&clientY<=rect.bottom}
function positionShopSellOverlay(){const shop=$('#pveShopBar'),cards=$('#pveShopCards');if(!shop||!cards)return;const shopRect=shop.getBoundingClientRect(),cardsRect=cards.getBoundingClientRect();shop.style.setProperty('--sell-trash-x',`${cardsRect.left-shopRect.left+cardsRect.width/2}px`);shop.style.setProperty('--sell-trash-y',`${cardsRect.top-shopRect.top+cardsRect.height/2}px`)}
function updateShopSellFeedback(clientX,clientY,unit){const shop=$('#pveShopBar');if(!shop)return;const eligible=mode==='challenge'&&!started&&unit?.team==='blue'&&!unit.isDummy&&!unit.isSummon;if(eligible)positionShopSellOverlay();shop.classList.toggle('sell-drop-ready',eligible);shop.classList.toggle('sell-drop-active',eligible&&isShopSellDrop(clientX,clientY,unit))}
function clearShopSellFeedback(){$('#pveShopBar')?.classList.remove('sell-drop-ready','sell-drop-active')}
function returnChallengeUnitToBench(unit){if(mode!=='challenge'||started||!unit||unit.team!=='blue'||unit.onBench)return false;const bench=emptyBlueBench();if(bench<0){toast('蓝方备战席已满');return false}placeUnit(unit,{kind:'bench',team:'blue',index:bench});toast(`${unit.name} 已回到备战席`);return true}
function gainXp(amount){run.xp+=amount;while(run.level<9&&run.xp>=LEVEL_TOTAL[run.level+1]){run.level++;run.populationLimit=run.level;toast(`升级到 Lv${run.level}`)}}
function renderPveHud(){
  if(!run)return;
  const levelStart=LEVEL_TOTAL[run.level]||0,next=run.level<9?LEVEL_TOTAL[run.level+1]:LEVEL_TOTAL[9],levelXp=Math.max(0,run.xp-levelStart),levelNeed=Math.max(0,next-levelStart),onBoard=units.filter(u=>u.team==='blue'&&!u.onBench&&!u.inWarehouse&&u.alive).length;
  $('#pveLevel').textContent=`Lv${run.level}`;
  $('#pveXp').textContent=run.level>=9?'经验：满级':`经验 ${levelXp}/${levelNeed}`;
  $('#pveXpBarFill').style.width=`${run.level>=9?100:(levelNeed>0?Math.min(100,Math.max(0,levelXp/levelNeed*100)):0)}%`;
  $('#pvePopulation').textContent=`人口 ${onBoard}/${run.populationLimit}`;
  $('#pvePopulation').classList.toggle('full',onBoard>=run.populationLimit);
  $('#pveShopOdds').innerHTML=SHOP_ODDS[run.level].map((chance,index)=>`<span class="cost${index+1}">${index+1}费 <b>${chance}%</b></span>`).join('');
  $('#pveGoldValue').textContent=run.gold;
  $('#pveStage').textContent=`关卡 ${stageId()}`;
  $('#pveLives').textContent='♥'.repeat(Math.max(0,run.lives));
  $('#pveLives').title=`剩余失败机会：${run.lives}/3`;
  $('#pveStreakValue').textContent=run.winStreak;
  $('#buyXpBtn').innerHTML=`<span>购买经验</span><span class="pve-button-price"><img src="assets/two-coins.svg" alt="">4</span>`;
  $('#refreshShopBtn').innerHTML=run.freeRefreshes>0?`<span>刷新</span><span class="pve-free-price">免费×${run.freeRefreshes}</span>`:`<span>刷新</span><span class="pve-button-price"><img src="assets/two-coins.svg" alt="">2</span>`;
  $('#lockShopBtn').classList.toggle('active',run.shopLocked);$('#lockShopBtn').setAttribute('aria-pressed',String(run.shopLocked));$('#lockShopBtn').title=run.shopLocked?'点击解锁商店':'点击锁定商店';$('#lockShopBtn').innerHTML=`<img src="assets/${run.shopLocked?'shop-lock':'shop-unlock'}.svg" alt=""><span>${run.shopLocked?'已锁定':'未锁定'}</span>`;
  requestAnimationFrame(()=>{const lock=$('#lockShopBtn'),stage=$('#pveStage');if(lock&&stage&&lock.offsetWidth>0){stage.style.width=`${lock.offsetWidth}px`;stage.style.textAlign='center'}});
  $('#pveShopCards').innerHTML=(run.shopOffers||[]).map((o,i)=>o?`<button class="pve-shop-card cost${o.cost}" data-buy-offer="${i}" draggable="false" ${started?'disabled':''}><img src="${PIECE_CONFIG[o.name].avatar}" draggable="false"><span>${o.name}</span><small>${PIECE_CONFIG[o.name].element} · ${PIECE_CONFIG[o.name].weapon}</small></button>`:'<div class="pve-shop-slot-empty" aria-hidden="true"></div>').join('');
}
function renderChallengeInventory(){
  const box=$('#whEquipCards');if(!box)return;const counts={};for(const id of run.equipmentInventory)counts[id]=(counts[id]||0)+1;
  const cards=Object.entries(counts).map(([id,count])=>{const c=EQUIPMENT_CONFIG[id];return`<div class="wh-equip-card" data-item-id="${id}" data-item-kind="equipment"><img class="wh-equip-icon" src="${c.icon}" draggable="false"><div class="wh-equip-name">${c.name}</div><div class="wh-equip-stat">×${count}</div></div>`});
  if(run.removers)cards.push(`<div class="wh-equip-card special" data-item-id="item_remover" data-item-kind="consumable"><img class="wh-equip-icon" src="${CONSUMABLE_CONFIG.item_remover.icon}" draggable="false"><div class="wh-equip-name">拆卸器</div><div class="wh-equip-stat">×${run.removers}</div></div>`);
  if(run.reforgers)cards.push(`<div class="wh-equip-card special" data-item-id="item_reforger" data-item-kind="consumable"><img class="wh-equip-icon" src="${CONSUMABLE_CONFIG.item_reforger.icon}" draggable="false"><div class="wh-equip-name">重铸器</div><div class="wh-equip-stat">×${run.reforgers}</div></div>`);box.innerHTML=cards.join('')||'<p class="mode-muted">暂无装备</p>';
}
function randomStandardEquipment(){const ids=standardEquipmentIds();return ids.length?ids[Math.floor(Math.random()*ids.length)]:null}
function grantRandomCard(cost,star){
  const copies=star===2?3:1,bench=emptyBlueBench();if(bench<0)return null;
  const names=PIECE_ORDER.filter(name=>PIECE_CONFIG[name].cost===cost&&(run.cardPool[PIECE_CONFIG[name].templateId]||0)>=copies);if(!names.length)return null;
  const name=names[Math.floor(Math.random()*names.length)],config=PIECE_CONFIG[name],unit=makeUnit(pieceDefByName(name),`pve-loss-${Date.now()}-${nextPieceId++}`,star);
  run.cardPool[config.templateId]-=copies;unit.team='blue';unit.onBench=true;unit.benchIndex=bench;unit.row=null;unit.col=null;unit.inWarehouse=false;units.push(unit);return`${star}★ ${name}`;
}
function lossCompensationFor(count){if(count===1)return{gold:10,equipmentCount:1,cards:[{cost:2,star:2}]};if(count===2)return{gold:20,equipmentCount:2,cards:[{cost:3,star:2},{cost:4,star:1}]};return null}
function applyLossCompensation(plan){
  const reward={gold:plan.gold,equipment:[],cards:[]};run.gold+=plan.gold;
  for(let i=0;i<plan.equipmentCount;i++){const id=randomStandardEquipment();if(id){run.equipmentInventory.push(id);reward.equipment.push(EQUIPMENT_CONFIG[id]?.name||id)}}
  for(const card of plan.cards){const name=grantRandomCard(card.cost,card.star);reward.cards.push(name||`${card.star}★ ${card.cost}费卡（备战席已满）`)}
  checkSynthesisAfterDrop('blue');saveRun();renderChallengeInventory();renderPveHud();updateAliveCounts();return reward;
}
function showLossCompensation(reward,next){
  const rows=[`<div class="pve-loot-row"><span><img src="assets/two-coins.svg" alt="">金币</span><b>+${reward.gold}</b></div>`,...reward.equipment.map(name=>`<div class="pve-loot-row"><span>随机装备</span><b>${name}</b></div>`),...reward.cards.map(name=>`<div class="pve-loot-row"><span>随机棋子</span><b>${name}</b></div>`)];
  $('#pveLossRewardBody').innerHTML=rows.join('');roundResultNext=next;$('#pveLossRewardDialog').classList.remove('hidden');
}
function showRoundResult(win,reward,next){
  const dialog=$('#pveRoundResultDialog'),title=$('#pveRoundResultTitle'),body=$('#pveRoundResultBody');
  title.textContent=win?'关卡胜利':'挑战失败';
  dialog.classList.toggle('victory',win);dialog.classList.toggle('defeat',!win);
  if(win){
    const equipment=reward.equipment?`<div class="pve-loot-row"><span>装备</span><b>${reward.equipment}</b></div>`:'';
    body.innerHTML=`<div class="pve-victory-mark">胜利</div><div class="pve-loot-title">本回合战利品</div><div class="pve-loot-row"><span>金币</span><b class="pve-gold-breakdown"><span title="自然与关卡收入"><img src="assets/two-coins.svg" alt="金币">${reward.naturalGold}</span><em>+</em><span title="金币利息"><img src="assets/two-coins.svg" alt="金币">${reward.interestGold}</span></b></div><div class="pve-loot-row"><span>经验</span><b>+${reward.xp}</b></div>${equipment}`;
  }else{
    body.innerHTML=`<div class="pve-heart-break"><span class="lost-heart">♥</span><i></i></div><div class="pve-defeat-copy">失去一次失败机会</div><div class="pve-life-remain">${'♥'.repeat(Math.max(0,reward.lives))||'无剩余生命'}</div>`;
  }
  roundResultNext=next;dialog.classList.remove('hidden');
}
function settle(win){
  const previousFormation=clone(battlePlayerSnapshot||run.formation||[]);
  const startGold=run.gold,startStage=stageId();let gainedEquipment='',terminal='',lossCompensation=null;
  const interestGold=Math.floor(startGold/5);
  run.gold+=5+interestGold;gainXp(6);run.round++;
  if(win){
    run.winStreak++;run.gold+=run.winStreak>=7?3:run.winStreak>=5?2:run.winStreak>=3?1:0;
    const rule=RULES[startStage];run.gold+=rule.gold||0;
    if(rule.type==='reward'){
      const rewards={easy:{gold:4},normal:{gold:8},hard:{gold:12,equipment:1}}[run.selectedVariant];run.gold+=rewards.gold;
      if(rewards.equipment){const ids=standardEquipmentIds(),id=ids[Math.floor(Math.random()*ids.length)];if(id){run.equipmentInventory.push(id);gainedEquipment=EQUIPMENT_CONFIG[id]?.name||id}}
    }
    run.currentStageIndex++;run.selectedVariant=null;
    if(run.currentStageIndex>=ORDER.length){run.state='complete';terminal='挑战完成'}else{const phase=Number(stageId()[0]);grantPhase(phase)}
  }else{
    run.lives--;run.lossCount++;run.winStreak=0;
    lossCompensation=lossCompensationFor(run.lossCount);
    if(run.lives<=0){run.state='game_over';terminal='挑战失败'}
  }
  const totalGold=run.gold-startGold,reward={gold:totalGold,naturalGold:totalGold-interestGold,interestGold,xp:6,equipment:gainedEquipment,lives:run.lives};
  restorePlayerFormation(previousFormation,!terminal);battlePlayerSnapshot=null;saveRun(false);renderPveHud();
  showRoundResult(win,reward,()=>{
    if(terminal){showEnd(terminal);return}
    renderChallengeInventory();renderPveHud();
    const continueRound=()=>{if(!run.shopLocked)refreshShop(true);saveRun();renderPveHud()};
    if(!win&&lossCompensation){const compensation=applyLossCompensation(lossCompensation);showLossCompensation(compensation,continueRound)}else continueRound();
  });
}
function showEnd(text){$('#pveEndText').textContent=text;$('#pveEndDialog').classList.remove('hidden');renderPveHud()}
function startPveBattle(){if(mode!=='challenge')return true;if(!ensureStageChoice())return false;const count=units.filter(u=>u.team==='blue'&&!u.onBench&&!u.inWarehouse&&u.alive).length;if(count>run.populationLimit){toast(`上阵人数超过人口上限 ${run.populationLimit}`);return false}if(!units.some(u=>u.team==='red'&&!u.onBench&&!u.inWarehouse)){if(!loadCurrentEnemy())return false}battlePlayerSnapshot=clone(formationSnapshot().filter(x=>x.team==='blue'));run.formation=clone(battlePlayerSnapshot);saveRun(false);return true}
function installUi(){
  const actions=$('.actions');actions.insertAdjacentHTML('beforeend','<span class="pve-divider"></span><button class="btn" id="loadPveSlotBtn">载入挑战关卡阵容</button><button class="btn" id="savePveSlotBtn">保存当前红方阵容</button><button class="btn" id="openChallengeBtn">挑战模式</button><button class="btn hidden" id="settleChallengeBtn">结算对局</button><button class="btn hidden" id="exitChallengeBtn">返回测试模式</button>');
  $('.arena').insertAdjacentHTML('beforeend',`<div id="pveShopBar" class="pve-shop-bar hidden"><div class="pve-shop-meta"><div class="pve-pop-streak"><span id="pvePopulation">人口 0/3</span><span class="pve-streak" title="当前连胜"><i>🔥</i><b id="pveStreakValue">0</b></span></div><div id="pveShopOdds" class="pve-shop-odds"></div><span></span></div><div class="pve-shop-main"><div class="pve-shop-actions"><div class="pve-level-line"><b id="pveLevel">Lv3</b><span id="pveXp">经验 0/6</span></div><div id="pveXpBar" class="pve-xp-bar" aria-hidden="true"><i id="pveXpBarFill"></i></div><div class="pve-shop-action-buttons"><button id="buyXpBtn" title="花费4金币获得4经验"></button><button id="refreshShopBtn"></button></div></div><div id="pveShopCards" class="pve-shop-cards"></div><div class="pve-shop-state right"><div class="pve-shop-right-row"><button id="lockShopBtn">锁定</button><b id="pveGold" class="pve-gold" title="金币"><img src="assets/two-coins.svg" alt="金币"><span id="pveGoldValue">20</span></b></div><div class="pve-shop-right-row"><span id="pveStage">关卡 1-1</span><span id="pveLives" class="pve-lives" title="剩余失败机会：3/3">♥♥♥</span></div></div></div></div>`);
  document.body.insertAdjacentHTML('beforeend',`<div id="pveSlotDialog" class="pve-modal hidden"><div><h2 id="pveSlotTitle"></h2><div id="pveSlotList" class="pve-slot-list"></div><footer><button id="confirmPveSlotBtn">确认</button><button data-close-pve-modal>取消</button></footer></div></div><div id="challengeDialog" class="pve-modal hidden"><div><h2>挑战模式</h2><p>固定12关挑战，拥有独立金币、商店和装备库存。</p><footer><button id="newPveBtn">开始新挑战</button><button id="continuePveBtn">继续挑战</button><button data-close-pve-modal>关闭</button></footer></div></div><div id="pveVariantDialog" class="pve-modal hidden"><div><h2>选择奖励关难度</h2><footer><button data-pve-variant="easy">简单</button><button data-pve-variant="normal">普通</button><button data-pve-variant="hard">困难</button></footer></div></div><div id="pveEndDialog" class="pve-modal hidden"><div><h2 id="pveEndText"></h2><footer><button id="exitFinishedPveBtn">返回测试场</button></footer></div></div>`);
  document.body.insertAdjacentHTML('beforeend',`<div id="pveRoundResultDialog" class="pve-modal pve-round-result hidden"><div><h2 id="pveRoundResultTitle"></h2><div id="pveRoundResultBody"></div><footer><button id="continueRoundResultBtn">继续</button></footer></div></div>`);
  document.body.insertAdjacentHTML('beforeend',`<div id="pveLossRewardDialog" class="pve-modal pve-round-result victory hidden"><div><h2>扣血补偿</h2><div class="pve-victory-mark">补偿</div><div class="pve-loot-title">已获得以下逆风奖励</div><div id="pveLossRewardBody"></div><footer><button id="continueLossRewardBtn">收下并继续</button></footer></div></div>`);
  document.body.insertAdjacentHTML('beforeend',`<div id="challengeSettlementDialog" class="pve-modal hidden"><div class="pve-challenge-settlement"><h2>本次挑战结算</h2><div class="pve-settlement-progress"><b id="challengeSettlementStage">当前关卡：1-1</b><span id="challengeSettlementRound">已完成回合：0</span></div><p>要重新开始挑战，还是结束本次挑战并返回测试场？</p><footer><button id="restartChallengeBtn">重新挑战</button><button id="finishChallengeToTestBtn">回到测试场</button><button data-close-pve-modal>取消</button></footer></div></div>`);
  document.body.insertAdjacentHTML('beforeend',`<div id="challengeSettlementConfirmDialog" class="pve-modal hidden"><div class="pve-settlement-confirm"><h2>确认结算对局？</h2><p>结算后可以选择重新挑战，或结束挑战并回到测试场。</p><footer><button id="confirmChallengeSettlementBtn">确认结算</button><button data-close-pve-modal>继续挑战</button></footer></div></div>`);
  document.body.insertAdjacentHTML('beforeend',`<div id="newChallengeConfirmDialog" class="pve-modal hidden"><div class="pve-settlement-confirm"><h2>开始新的挑战？</h2><p>当前挑战进度将被覆盖，金币、阵容和关卡进度都会重新开始。</p><footer><button id="confirmNewChallengeBtn">开始新挑战</button><button data-close-pve-modal>取消</button></footer></div></div>`);
}
function installStyle(){const s=document.createElement('style');s.textContent=`.hidden{display:none!important}.pve-divider{width:1px;height:28px;background:#34445c}.pve-shop-bar{display:grid;grid-template-columns:145px minmax(0,1fr) 145px;gap:6px;align-items:stretch;width:100%;max-width:960px;min-height:96px;box-sizing:border-box;margin:8px auto 0;padding:12px 6px;border:1px solid #38506e;border-radius:9px;background:#0d1725;color:#dce8f7}.pve-shop-state{display:flex;flex-wrap:wrap;align-content:center;align-items:center;gap:5px;max-width:145px;font-size:10px}.pve-shop-state.right{justify-content:flex-end}.pve-shop-state button,.pve-modal button{border:1px solid #465a76;border-radius:5px;background:#172338;color:#e4edf9;padding:6px;font-size:10px}.pve-shop-cards{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:4px}.pve-shop-card{display:grid;grid-template-columns:60px minmax(0,1fr);grid-template-rows:1fr 1fr;align-items:center;min-width:0;padding:5px;border:1px solid #53647b;border-bottom-width:3px;border-radius:6px;background:#111c2b;color:#fff;text-align:left}.pve-shop-card img{grid-row:1/3;width:58px;height:58px;border-radius:50%;object-fit:cover}.pve-shop-card span,.pve-shop-card small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.pve-shop-card span{font-size:11px;font-weight:700}.pve-shop-card small{font-size:8px;color:#92a3ba}.pve-gold{display:inline-flex;align-items:center;gap:4px;color:#f2c85f}.pve-gold img{width:18px;height:18px}.pve-lives{min-width:52px;color:#ff7381;font-size:22px;line-height:1;letter-spacing:1px;font-family:Arial,sans-serif}#pvePopulation.full{color:#ff9c6b;font-weight:800}.pve-shop-card.cost1{border-bottom-color:#aeb6c2}.pve-shop-card.cost2{border-bottom-color:#51c878}.pve-shop-card.cost3{border-bottom-color:#4d9dff}.pve-shop-card.cost4{border-bottom-color:#aa6bff}.pve-shop-card.cost5{border-bottom-color:#f1c85e}.pve-modal{position:fixed;inset:0;z-index:2000;display:grid;place-items:center;background:#02060ac4}.pve-modal>div{width:min(620px,calc(100% - 30px));max-height:80vh;overflow:auto;padding:16px;border:1px solid #405572;border-radius:11px;background:#101a29;color:#e7effa}.pve-slot-list{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.pve-slot-list button{display:grid;grid-template-columns:var(--slot-title-width,132px) minmax(0,1fr);align-items:center;gap:8px;text-align:left}.pve-slot-list button.active{border-color:#f2c66d}.pve-slot-list small{color:#8193ad}.pve-slot-name{width:var(--slot-title-width,132px);font-weight:800;white-space:nowrap}.pve-slot-units{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));grid-auto-rows:auto;align-items:center;justify-items:center;gap:4px;width:100%;min-width:0}.pve-slot-unit{display:grid;place-items:center;width:min(28px,100%);aspect-ratio:1;border:2px solid var(--slot-element,#70839d);border-radius:50%;background:#0b1421;box-shadow:0 0 7px color-mix(in srgb,var(--slot-element,#70839d) 45%,transparent);overflow:hidden}.pve-slot-unit img{width:100%;height:100%;border-radius:50%;object-fit:cover}.pve-slot-empty{justify-self:start}.pve-modal footer{display:flex;justify-content:flex-end;gap:7px;margin-top:12px}@media(max-width:900px){.pve-shop-bar{grid-template-columns:1fr}.pve-shop-state{max-width:none}.pve-slot-list{grid-template-columns:1fr 1fr}}`;document.head.appendChild(s)}
function installShopLayoutStyle(){
  const style=document.createElement('style');
  style.textContent=`
    .pve-shop-bar{display:block;margin-top:28px;padding:8px 6px 12px}
    .pve-shop-meta,.pve-shop-main{display:grid;grid-template-columns:145px minmax(0,1fr) 145px;gap:6px}
    .pve-shop-meta{align-items:center;min-height:25px;margin-bottom:5px;padding-bottom:5px;border-bottom:1px solid rgba(72,93,121,.45);font-size:10px}
    #pvePopulation{justify-self:start;padding-left:5px;color:#cbd9eb}
    .pve-pop-streak{display:flex;align-items:center;justify-content:space-between;gap:8px;padding-right:4px}
    .pve-streak{display:inline-flex;align-items:center;gap:1px;color:#ff704f;font-size:14px;font-weight:900}.pve-streak i{font-style:normal;font-size:17px;filter:drop-shadow(0 0 4px rgba(255,70,35,.45))}
    .pve-shop-odds{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:4px;text-align:center;color:#9eafc4;font-size:12px}
    .pve-shop-odds span{white-space:nowrap;line-height:1.2}
    .pve-shop-odds b{color:#e8eff8;font-weight:800}
    .pve-shop-odds .cost1{color:#c5ccd5}.pve-shop-odds .cost2{color:#6cda8c}.pve-shop-odds .cost3{color:#70b4ff}.pve-shop-odds .cost4{color:#bd8cff}.pve-shop-odds .cost5{color:#f1cf73}
    .pve-shop-main{align-items:stretch}
    .pve-shop-card{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;touch-action:manipulation}
    .pve-shop-card img{pointer-events:none;-webkit-user-drag:none}
    .pve-shop-actions{display:grid;grid-template-rows:auto 7px 1fr;gap:5px;min-width:0}
    .pve-level-line{display:flex;align-items:center;justify-content:space-between;gap:4px;padding:0 3px;font-size:10px}
    .pve-xp-bar{height:7px;overflow:hidden;border:1px solid #405675;border-radius:999px;background:#08111d;box-shadow:inset 0 1px 3px rgba(0,0,0,.65)}
    .pve-xp-bar i{display:block;width:0;height:100%;border-radius:inherit;background:linear-gradient(90deg,#3979bf,#68b7ff);box-shadow:0 0 7px rgba(84,174,255,.5);transition:width .22s ease}
    .pve-shop-action-buttons{display:grid;grid-template-rows:1fr 1fr;gap:5px}
    .pve-shop-action-buttons button{display:flex;align-items:center;justify-content:space-between;width:100%;min-height:30px;padding:5px 7px;border:1px solid #465a76;border-radius:5px;background:#172338;color:#e4edf9;font-size:10px}
    #lockShopBtn{display:inline-flex;align-items:center;gap:4px;transition:border-color .15s ease,background .15s ease,color .15s ease}
    #lockShopBtn img{width:18px;height:18px}#lockShopBtn.active{border-color:#d5ad56;background:#332918;color:#f5d98d}
    .pve-shop-state.right{display:grid;grid-template-rows:1fr 1fr;align-content:stretch;width:145px;max-width:145px;gap:6px}
    .pve-shop-right-row{display:flex;align-items:center;justify-content:space-between;width:100%;min-width:0}
    .pve-shop-right-row:first-child{display:grid;grid-template-columns:minmax(0,1fr) auto;column-gap:14px}
    .pve-shop-right-row #pveStage{white-space:nowrap;font-size:14px;font-weight:800;letter-spacing:.3px}.pve-shop-right-row .pve-lives{display:inline-flex;justify-content:flex-end;min-width:0}
    .pve-button-price,.pve-free-price{display:inline-flex;align-items:center;gap:3px;color:#f2c85f;font-weight:800}
    .pve-button-price img{width:15px;height:15px}
    .pve-free-price{color:#79d69a}
    #pveGold{gap:6px;font-size:20px;font-weight:900;text-shadow:0 0 9px rgba(242,200,95,.32)}
    #pveGold img{width:29px;height:29px;filter:drop-shadow(0 0 6px rgba(242,200,95,.45))}
    .pve-lives{min-width:68px;font-size:29px;letter-spacing:2px;filter:drop-shadow(0 0 5px rgba(255,77,91,.3))}
    .pve-gold-gain{position:fixed;z-index:2600;display:flex;align-items:center;gap:7px;transform:translate(-50%,0) scale(.88);color:#ffe27f;font-size:23px;font-weight:900;opacity:0;pointer-events:none;text-shadow:0 2px 5px #000,0 0 12px rgba(255,210,74,.65)}
    .pve-gold-gain img{width:31px;height:31px;filter:drop-shadow(0 0 8px rgba(255,205,57,.7))}
    .pve-gold-gain.play{animation:pveGoldCollect .72s cubic-bezier(.2,.7,.25,1) both}
    @keyframes pveGoldCollect{0%{transform:translate(-50%,-8px) scale(.8);opacity:0}18%{transform:translate(-50%,0) scale(1.12);opacity:1}58%{transform:translate(-50%,19px) scale(1);opacity:1}100%{transform:translate(-50%,38px) scale(.62);opacity:0}}
    .pve-shop-slot-empty{min-width:0;visibility:hidden}
    #pveSlotDialog>div{width:min(1180px,calc(100% - 34px));max-height:92vh;padding:24px}
    #pveSlotDialog .pve-slot-list{grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
    #pveSlotDialog .pve-slot-list button{grid-template-rows:62px;min-height:86px;padding:10px 6px;font-size:14px;column-gap:3px}
    #pveSlotDialog .pve-slot-name{align-self:start;line-height:28px}
    #pveSlotDialog .pve-slot-units{box-sizing:border-box;grid-template-columns:repeat(5,28px);grid-template-rows:repeat(2,28px);grid-auto-rows:28px;column-gap:1px;row-gap:5px;align-content:start;justify-content:center;width:100%;height:61px;padding-inline:4px}
    #pveSlotDialog .pve-slot-unit{width:28px;height:28px;aspect-ratio:auto}
    .pve-shop-bar{position:relative;overflow:hidden;transition:border-color .16s ease,box-shadow .16s ease,filter .16s ease}
    .pve-shop-bar::before,.pve-shop-bar::after{position:absolute;inset:0;z-index:20;opacity:0;visibility:hidden;pointer-events:none;transition:opacity .16s ease,visibility 0s linear .16s}
    .pve-shop-bar::before{content:"";background:rgba(19,23,31,.68);backdrop-filter:blur(3px)}
    .pve-shop-bar::after{content:"";inset:var(--sell-trash-y,65%) auto auto var(--sell-trash-x,50%);width:88px;height:88px;transform:translate(-50%,-50%);background:url("assets/trash-can.svg") center/contain no-repeat;filter:drop-shadow(0 0 16px rgba(255,70,78,.6))}
    .pve-shop-bar.sell-drop-ready{border-color:rgba(255,96,105,.54);box-shadow:0 0 0 1px rgba(255,73,84,.16),0 0 15px rgba(255,48,60,.12)}
    .pve-shop-bar.sell-drop-ready::before{opacity:.22;visibility:visible;transition:opacity .16s ease}
    .pve-shop-bar.sell-drop-ready::after{opacity:.32;visibility:visible;transition:opacity .16s ease}
    .pve-shop-bar.sell-drop-active{border-color:rgba(255,78,89,.8);box-shadow:0 0 0 2px rgba(255,65,75,.2),0 0 20px rgba(255,48,60,.18)}
    .pve-shop-bar.sell-drop-active::before{opacity:.32}
    .pve-shop-bar.sell-drop-active::after{opacity:.48}
    .pve-round-result>div{width:min(430px,calc(100% - 30px));text-align:center;overflow:visible}
    .pve-challenge-settlement,.pve-settlement-confirm{width:min(480px,calc(100% - 30px));text-align:center}
    .pve-settlement-progress{display:grid;gap:8px;margin:14px 0;padding:15px;border:1px solid #405672;border-radius:9px;background:#0b1421}
    .pve-settlement-progress b{color:#f1cf73;font-size:22px}.pve-settlement-progress span{color:#b8c8dc;font-size:14px}
    .pve-round-result h2{margin:0 0 14px;font-size:25px;letter-spacing:2px}
    .pve-round-result.victory h2{color:#f3cf70}.pve-round-result.defeat h2{color:#ff7782}
    .pve-victory-mark{width:76px;height:76px;display:grid;place-items:center;margin:0 auto 12px;border:2px solid #e4bb59;border-radius:50%;background:radial-gradient(circle,#5d431b,#1b2030 68%);box-shadow:0 0 28px rgba(239,190,74,.35);color:#ffe09a;font-size:18px;font-weight:900}
    .pve-loot-title{margin-bottom:8px;color:#aebed2;font-size:12px}
    .pve-loot-row{display:flex;align-items:center;justify-content:space-between;margin:5px auto;padding:8px 12px;max-width:280px;border:1px solid #34475f;border-radius:7px;background:#0c1522}
    .pve-loot-row span{display:flex;align-items:center;gap:6px;color:#cbd8e9}.pve-loot-row span img{width:18px;height:18px}.pve-loot-row b{color:#f3cf70}
    .pve-loot-row .pve-gold-breakdown{display:inline-flex;align-items:center;gap:6px}.pve-gold-breakdown span{display:inline-flex;align-items:center;gap:3px;color:#f3cf70}.pve-gold-breakdown span img{width:20px;height:20px}.pve-gold-breakdown em{color:#8798ad;font-style:normal;font-weight:700}
    .pve-heart-break{position:relative;width:92px;height:92px;margin:4px auto 8px;display:grid;place-items:center}
    .lost-heart{color:#ee4658;font:76px/1 Arial,sans-serif;filter:drop-shadow(0 0 14px rgba(255,62,78,.55));animation:pveHeartBreak 1.05s ease both}
    .pve-heart-break i{position:absolute;width:5px;height:72px;background:#101a29;transform:rotate(17deg);clip-path:polygon(35% 0,100% 0,58% 42%,100% 42%,0 100%,34% 53%,0 53%);animation:pveHeartCrack .55s .18s ease both}
    .pve-defeat-copy{color:#ff9aa3;font-size:16px;font-weight:800}.pve-life-remain{min-height:34px;margin-top:10px;color:#ff6574;font:28px/1 Arial,sans-serif;letter-spacing:3px}
    @keyframes pveHeartBreak{0%{transform:scale(.65);opacity:0}25%{transform:scale(1.18);opacity:1}45%{transform:scale(1) rotate(-4deg)}60%{transform:translateX(-5px) rotate(4deg)}72%{transform:translateX(5px) rotate(-3deg)}100%{transform:scale(.82);opacity:.5}}
    @keyframes pveHeartCrack{0%{opacity:0;transform:scaleY(0) rotate(17deg)}100%{opacity:1;transform:scaleY(1) rotate(17deg)}}
    @media(max-width:900px){.pve-shop-meta,.pve-shop-main{grid-template-columns:1fr}.pve-shop-meta>span:last-child{display:none}.pve-shop-odds{grid-row:2}.pve-shop-action-buttons{grid-template-columns:1fr 1fr;grid-template-rows:1fr}}
  `;
  document.head.appendChild(style);
}
function installEvents(){
  $('#savePveSlotBtn').onclick=()=>openSlotDialog('save');$('#loadPveSlotBtn').onclick=()=>openSlotDialog('load');$('#openChallengeBtn').onclick=()=>$('#challengeDialog').classList.remove('hidden');$('#settleChallengeBtn').onclick=openChallengeSettlement;$('#confirmChallengeSettlementBtn').onclick=confirmChallengeSettlement;$('#exitChallengeBtn').onclick=exitChallenge;$('#restartChallengeBtn').onclick=restartChallengeFromSettlement;$('#finishChallengeToTestBtn').onclick=finishChallengeToTest;$('#confirmPveSlotBtn').onclick=confirmSlotAction;
  $('#pveSlotList').onclick=e=>{const b=e.target.closest('[data-slot-key]');if(b){selectedSlot=b.dataset.slotKey;renderSlotList()}};document.addEventListener('click',e=>{if(e.target.matches('[data-close-pve-modal]'))e.target.closest('.pve-modal').classList.add('hidden')});
  $('#newPveBtn').onclick=()=>$('#newChallengeConfirmDialog').classList.remove('hidden');$('#confirmNewChallengeBtn').onclick=()=>{$('#newChallengeConfirmDialog').classList.add('hidden');localStorage.removeItem(RUN_KEY);activateChallenge(createRun())};$('#continuePveBtn').onclick=()=>{const saved=loadRun();if(saved)activateChallenge(saved);else toast('没有挑战存档')};
  $('#buyXpBtn').onclick=buyXp;$('#refreshShopBtn').onclick=()=>refreshShop(false);$('#lockShopBtn').onclick=()=>{run.shopLocked=!run.shopLocked;saveRun();renderPveHud()};$('#pveShopCards').onclick=e=>{const b=e.target.closest('[data-buy-offer]');if(b)buyOffer(Number(b.dataset.buyOffer))};
  $('#pveShopCards').addEventListener('contextmenu',event=>event.preventDefault());$('#pveShopCards').addEventListener('dragstart',event=>event.preventDefault());
  $('#continueRoundResultBtn').onclick=()=>{const next=roundResultNext;roundResultNext=null;$('#pveRoundResultDialog').classList.add('hidden');if(next)next()};
  $('#continueLossRewardBtn').onclick=()=>{const next=roundResultNext;roundResultNext=null;$('#pveLossRewardDialog').classList.add('hidden');if(next)next()};
  $('#pveVariantDialog').onclick=e=>{const b=e.target.closest('[data-pve-variant]');if(!b)return;run.selectedVariant=b.dataset.pveVariant;$('#pveVariantDialog').classList.add('hidden');loadCurrentEnemy();saveRun();renderPveHud()};$('#exitFinishedPveBtn').onclick=exitChallenge;
}
installStyle();installShopLayoutStyle();installUi();installEvents();
const originalContextMenu=canvas.oncontextmenu;canvas.oncontextmenu=function(event){if(mode!=='challenge')return originalContextMenu?.call(canvas,event);event.preventDefault();if(started)return;const point=canvasPoint(event),unit=unitAt(point.x,point.y);if(unit?.team==='blue')returnChallengeUnitToBench(unit)};
const originalStart=startBattle;startBattle=function(){if(mode==='challenge'){if(!startPveBattle())return;const deployed=units.filter(unit=>unit.alive&&unit.team==='blue'&&!unit.onBench&&!unit.inWarehouse).length;if(deployed===0){started=true;ended=false;startBtn.disabled=true;clearBlueBtn.disabled=true;clearRedBtn.disabled=true;battleState.textContent='我方没有上阵棋子';toast('场上没有棋子，本回合直接判负');setTimeout(()=>finish('红方'),180);renderPveHud();return}}originalStart();renderPveHud()};
const originalFinish=finish;finish=function(team){originalFinish(team);if(mode==='challenge'){const win=team==='蓝方';setTimeout(()=>settle(win),650)}};
const originalEquip=equipItemToUnit;equipItemToUnit=function(unit,id){if(mode!=='challenge')return originalEquip(unit,id);const i=run.equipmentInventory.indexOf(id);if(i<0){toast('该装备库存不足');return false}const ok=originalEquip(unit,id);if(ok){run.equipmentInventory.splice(i,1);saveRun();renderChallengeInventory()}return ok};
const originalRemove=useItemRemover;useItemRemover=function(unit){if(mode==='challenge'&&run.removers<=0){toast('拆卸器不足');return false}const before=equipmentInventory.length,ok=originalRemove(unit);if(ok&&mode==='challenge'){run.removers--;const returned=equipmentInventory.splice(before).map(x=>x.equipmentId);run.equipmentInventory.push(...returned);saveRun();renderChallengeInventory()}return ok};
const originalReforge=useItemReforger;useItemReforger=function(unit){if(mode==='challenge'&&run.reforgers<=0){toast('重铸器不足');return false}const before=equipmentInventory.length,ok=originalReforge(unit);if(ok&&mode==='challenge'){run.reforgers--;const made=equipmentInventory.splice(before).map(x=>x.equipmentId);run.equipmentInventory.push(...made);saveRun();renderChallengeInventory()}return ok};
const originalRenderEquipment=renderWarehouseEquipmentCards;renderWarehouseEquipmentCards=function(){if(mode==='challenge')renderChallengeInventory();else originalRenderEquipment()};
const originalReturnUnit=returnUnitToWarehouse;returnUnitToWarehouse=function(unit){if(mode==='challenge'){toast('挑战模式请放回蓝方备战席；出售棋子请右键');return false}return originalReturnUnit(unit)};
const originalPlaceUnit=placeUnit;placeUnit=function(unit,destination){if(mode==='challenge'&&run&&!started&&unit?.onBench&&destination?.kind==='board'&&destination.row>=4&&!unitAtDestination(destination,unit)){const onBoard=units.filter(candidate=>candidate.alive&&candidate.team==='blue'&&!candidate.onBench&&!candidate.inWarehouse&&candidate!==unit).length;if(onBoard>=run.populationLimit){toast(`已达到人口上限 ${onBoard}/${run.populationLimit}`);renderPveHud();return false}}return originalPlaceUnit(unit,destination)};
const originalValidDrop=validDrop;validDrop=function(unit,destination){if(!originalValidDrop(unit,destination))return false;if(mode!=='challenge'||!run||started||!unit||!destination)return true;const isBlueBoard=destination.kind==='board'&&destination.row>=4;if(!isBlueBoard||!unit.onBench)return true;const occupying=unitAtDestination(destination,unit);if(occupying)return true;const onBoard=units.filter(candidate=>candidate.alive&&candidate.team==='blue'&&!candidate.onBench&&!candidate.inWarehouse&&candidate!==unit).length;if(onBoard>=run.populationLimit){toast(`已达到人口上限 ${onBoard}/${run.populationLimit}`);return false}return true};
const originalSaveFormation=saveFormation;saveFormation=function(){const value=originalSaveFormation();if(mode==='challenge'&&run&&!started){run.formation=formationSnapshot().filter(item=>item.team==='blue');localStorage.setItem(RUN_KEY,JSON.stringify(run));renderPveHud()}return value};
window.PVE_FIRST={ORDER,RULES,SLOT_DEFS,get mode(){return mode},get run(){return run},openSlotDialog,loadSlotIntoRed,activateChallenge,exitChallenge,isShopSellDrop,updateShopSellFeedback,clearShopSellFeedback,sellDraggedUnit:unit=>sellChallengeUnit(unit,false)};
})();
