/* PVE挑战模式：固定20关、常驻商店、胜利经济与掉血补偿。 */
(function(){
'use strict';
const OLD_SLOT_KEY='element-auto-chess-pve-stage-slots-v1',SLOT_KEY='element-auto-chess-pve-stage-slots-v2',DEFAULT_SLOT_KEY='element-auto-chess-pve-default-stages-v1',RUN_KEY='element-auto-chess-pve-run-v3',ARCHIVE_KEY='element-auto-chess-pve-success-archives-v1';
const ORDER=['1-1','1-2','1-3','1-4','1-5','1-6','2-1','2-2','2-3','2-4','2-5','2-6','3-1','3-2','3-3','3-4','3-5','3-6','EX-1','EX-2'];
const RULES={};
for(const id of ORDER){
  const step=Number(id.split('-')[1]);
  RULES[id]={type:step===5?'fun':step===6?'boss':step===4?'pressure':'normal'};
}
const SLOT_DEFS=ORDER.map(id=>({
  key:id,
  stageId:id,
  label:id.startsWith('EX-')
    ?id
    :`${id} ${RULES[id].type==='fun'?'奖励关':RULES[id].type==='boss'?'Boss关':'普通关'}`
}));
const OLD_SLOT_ORDER=['1-1','1-2','1-3','1-4:easy','1-4:normal','1-4:hard','1-5','2-1','2-2','2-3:easy','2-3:normal','2-3:hard','2-4','3-1','3-2','3-3'];
const MAX_LEVEL=10;
const LEVEL_TOTAL={3:0,4:6,5:24,6:52,7:92,8:140,9:212,10:304};
const SHOP_ODDS={
  3:[65,20,15,0,0],
  4:[50,30,20,0,0],
  5:[40,35,25,0,0],
  6:[28,40,30,2,0],
  7:[19.5,35,40,5,.5],
  8:[18,21,40,19,2],
  9:[10,16,40,24,10],
  10:[5,15,20,35,25]
};
for(const [level,odds] of Object.entries(SHOP_ODDS)){
  const total=odds.reduce((sum,chance)=>sum+chance,0);
  if(Math.abs(total-100)>.0001)throw new Error(`Lv${level} 商店概率合计不是100%`);
}
const POOL_COPIES={1:21,2:18,3:15,4:12,5:9};
const SELL_PRICE={1:[0,1,3,9],2:[0,2,5,17],3:[0,3,8,26],4:[0,4,11,35],5:[0,5,14,44]};
let mode='test',run=null,mainSnapshot=null,slotAction='save',selectedSlot=null,battlePlayerSnapshot=null,activeBattleRecord=null,exBattleSnapshot=null,roundResultNext=null,roundResultRewardFx=null,pendingRewardNext=null,previousRoundStatUnits=null,phaseThreeContinue=null,reviewArchive=null,reviewDetailContext=null,selectedArchiveSlot=0,pendingCompletedArchive=null;
const PVE_SLOT_LAYOUT_LOCK=Object.freeze({avatarSize:32,avatarColumns:5,avatarGap:2,titleWidth:78});
let lockedSlotTitleWidth=null,lockedSlotTitleStart=null;
const PVE_TUTORIAL_STEPS=[
  {icon:'◆',title:'欢迎来到挑战模式',eyebrow:'01 · 模式介绍',body:`<p>挑战模式是这款元素自走棋的完整实战流程。你会从固定初始资源出发，经历连续关卡，通过<mark>购买棋子</mark>、<mark>调整站位</mark>、<mark>升级人口</mark>和<mark>搭配装备</mark>逐步强化阵容。</p><div class="pve-tutorial-callout">目标：通过第三阶段 Boss；之后还可以带着阵容继续挑战 EX 关卡。</div>`},
  {icon:'⬢',title:'关卡、阶段与 Boss',eyebrow:'02 · 挑战路线',body:`<p>挑战由三个常规阶段和两场 EX 关组成。每阶段包含<mark>普通关</mark>、<mark>奖励关</mark>和<mark>Boss 关</mark>。</p><ul><li>普通关用于检验阵容强度。</li><li>奖励关会提供额外金币或装备。</li><li>Boss 关难度更高，但会掉落更多<mark>金币、装备和免费刷新</mark>。</li></ul><div class="pve-tutorial-callout">通过 3-6 Boss 后即可保存挑战回顾；EX 失败也不会失去保存资格。</div>`},
  {icon:'🔥',title:'连胜、失败与战斗节奏',eyebrow:'03 · 胜负状态',body:`<p>连续获胜会累积<mark>连胜数</mark>并提供额外金币；战斗失败会把连胜归零，同时停留在当前关卡重新挑战。</p><p>战斗开始后棋子会自动移动、索敌、普攻与释放技能，但你仍可在战斗期间<mark>购买或出售棋子</mark>。</p><div class="pve-tutorial-callout">每场战斗开始时会记录你的站位，结算后棋子会恢复到开战位置。</div>`},
  {icon:'▦',title:'商店与费用概率',eyebrow:'04 · 获取棋子',body:`<p>商店每次展示五张牌。上方的<mark>1费 / 2费 / 3费 / 4费 / 5费概率</mark>会随玩家等级变化，高等级更容易找到高费棋子。</p><ul><li>点击刷新可更换商店。</li><li>锁定商店后，下一回合不会自动刷新。</li><li>已经拥有同名棋子时，对应商店牌顶部会显示金线。</li></ul>`},
  {icon:'↔',title:'买牌、卖牌与合成',eyebrow:'05 · 阵容操作',body:`<p><mark>点击商店卡牌</mark>购买棋子，棋子会进入备战席；金币不足或备战席已满时无法购买。</p><p>长按抓起棋子并拖回商店区域即可<mark>出售</mark>。三个同名同星棋子会自动合成更高星级；达到三星后该牌暂时不会再刷出，出售三星后重新开放。</p><div class="pve-tutorial-callout">右键棋子只会让它返回备战席，不会出售。</div>`},
  {icon:'Lv',title:'等级、经验与人口',eyebrow:'06 · 成长上限',body:`<p>玩家等级决定<mark>人口上限</mark>和商店概率。胜利获得经验，也可以花费<mark>4金币购买4经验</mark>。</p><ul><li>等级提升后人口上限同步提高。</li><li>超过人口上限时不能继续往棋盘放置棋子。</li><li>最高等级为 <mark>Lv10</mark>，满级后无法继续购买经验。</li></ul>`},
  {icon:'●',title:'金币、基础收入与利息',eyebrow:'07 · 经济运营',body:`<p>每场战斗结束后获得<mark>3金币基础收入</mark>。结算时每持有10金币，再获得1金币利息，利息最多10金币。</p><p>连胜、奖励关、Boss 奖励和出售棋子都会带来额外金币。商店消费发生在利息结算前还是结算后，会直接影响下一回合收入。</p><div class="pve-tutorial-callout">回合资源框会分别显示基础收入、利息和其他奖励。</div>`},
  {icon:'◇',title:'装备栏与装备操作',eyebrow:'08 · 强化棋子',body:`<p>挑战装备存放在右侧<mark>挑战装备栏</mark>。将装备拖到棋子身上即可穿戴，每名棋子最多携带三件装备。</p><ul><li>装备提供攻击、防御、回蓝或特殊触发效果。</li><li>拆卸器用于取下装备。</li><li>重铸器用于把装备转换为其他装备。</li></ul><div class="pve-tutorial-callout">装备效果彼此独立；相同装备也可以重复佩戴并分别触发。</div>`},
  {icon:'♥',title:'血量、失败机会与补偿',eyebrow:'09 · 生存规则',body:`<p>挑战开始时拥有三颗<mark>红心</mark>。常规关卡失败会失去一颗心，红心耗尽则本次挑战结束。</p><p>第一次和第二次掉血后会出现<mark>逆风补偿</mark>。确认领取后，金币、装备和棋子才会正式进入库存；备战席满时可以先隐藏奖励页，整理后再领取。</p>`},
  {icon:'⚔',title:'角色定位与站位',eyebrow:'10 · 实战布阵',body:`<p>角色的<mark>武器、攻击距离、技能和元素</mark>决定其定位。坦克与近战通常放在前排承伤，弓与法器角色适合后排输出或支援。</p><p>同元素不同角色可以激活<mark>元素共鸣</mark>；技能施加元素后还能触发元素反应。点击角色可查看血量、法力、双抗、攻击、攻速、距离、技能与装备。</p><div class="pve-tutorial-callout">相同角色不会重复计算共鸣人数，阵容多样性同样重要。</div>`},
  {icon:'▶',title:'准备好开始挑战',eyebrow:'11 · 开始实战',body:`<p>备战阶段先观察敌方阵容，再决定购买、装备和站位。点击<mark>开始战斗</mark>后关注技能释放、元素反应和右侧战斗统计。</p><p>回合结束后领取奖励、调整阵容，再进入下一关。现在可以开始你的第一场挑战了。</p>`}
];
PVE_TUTORIAL_STEPS.splice(1,0,{title:'初始资源',eyebrow:'02 · 开局配置',body:`<p>每次开始新挑战时，你会获得固定的开局资源：<mark>30金币</mark>、<mark>Lv3与0/6经验</mark>、<mark>3人口</mark>、<mark>3颗红心</mark>、<mark>3次免费刷新</mark>以及<mark>🔥0连胜</mark>。</p><p>装备栏还会获得<mark>2件随机成装</mark>、<mark>1个拆卸器</mark>和<mark>2个重铸器</mark>。</p><div class="pve-tutorial-callout">挑战资源独立保存，不会改动测试模式的棋盘、阵容和装备。</div>`});
const tutorialVisual=index=>{
  const visuals=[
    `<div class="tutorial-mode-card"><b>元素自走棋</b><span>挑战模式</span><small>固定20关 · 独立经济与阵容成长</small></div>`,
    `<div class="tutorial-resource-board"><div class="tutorial-gold"><img src="assets/two-coins.svg"><b>30</b></div><div class="tutorial-hearts">♥♥♥</div><div class="tutorial-level"><b>Lv3</b><span>经验 0/6</span><i></i><button>购买经验　<img src="assets/two-coins.svg"> 4</button><button>刷新　<strong>免费×3</strong></button></div><div class="tutorial-streak">🔥 <b>0</b></div></div>`,
    `<div class="tutorial-stage-card"><small>回合</small><b>1-1</b><i></i><span>第一阶段</span><strong>Boss 1-6</strong><em>奖励关 · Boss关 · EX关</em></div>`,
    `<div class="tutorial-battle-state"><div class="tutorial-streak">🔥 <b>0</b></div><span>胜利后数字增加</span><i>失败后归零并重试本关</i></div>`,
    `<div class="tutorial-shop-demo"><div class="tutorial-odds"><span>1费 <b>65%</b></span><span>2费 <b>20%</b></span><span>3费 <b>15%</b></span></div><div class="tutorial-cards">${['迪卢克','妮露','莱依拉','宵宫','芙宁娜'].map(name=>`<i><img src="${PIECE_CONFIG[name]?.avatar||''}"><small>${name}</small></i>`).join('')}</div></div>`,
    `<div class="tutorial-buy-sell"><div><img src="${PIECE_CONFIG.迪卢克?.avatar||''}"><span>购买</span></div><b>→</b><div class="bench-slot">备战席</div><b>⇄</b><div class="shop-drop">拖回商店出售</div></div>`,
    `<div class="tutorial-level"><b>Lv3</b><span>经验 0/6</span><i></i><button>购买经验　<img src="assets/two-coins.svg"> 4</button><small>人口 0/3　·　最高 Lv10</small></div>`,
    `<div class="tutorial-economy"><div class="tutorial-gold"><img src="assets/two-coins.svg"><b>30</b></div><p><mark>基础收入 3</mark><span>＋</span><mark>利息</mark><span>＋</span><mark>关卡奖励</mark></p><small>每持有10金币，结算时获得1利息</small></div>`,
    `<div class="tutorial-equipment"><div class="equipment-slots"><i>装备</i><i>装备</i><i>装备</i></div><b>拖到棋子身上</b><div class="tool-row"><span>拆卸器 ×1</span><span>重铸器 ×2</span></div></div>`,
    `<div class="tutorial-health"><div class="tutorial-hearts">♥♥♥</div><p>每次失败减少一颗</p><span>♥♥♡</span><small>前两次掉血可领取逆风补偿</small></div>`,
    `<div class="tutorial-position"><div class="back">后排：弓 · 法器 · 辅助</div><div class="hex-row">⬡　⬡　⬡　⬡　⬡</div><div class="hex-row offset">⬡　⬡　⬡　⬡</div><div class="front">前排：坦克 · 近战</div></div>`,
    `<div class="tutorial-ready"><b>检查阵容</b><span>人口　站位　装备　共鸣</span><button>开始战斗</button></div>`
  ];
  return visuals[index]||'';
};
let pveTutorialIndex=0,pveTutorialLaunchesChallenge=true;
function beginNewChallengeAfterTutorial(){
  $('#pveTutorialPromptDialog')?.classList.add('hidden');
  $('#pveTutorialDialog')?.classList.add('hidden');
  localStorage.removeItem(RUN_KEY);
  activateChallenge(createRun());
}
function renderPveTutorial(){
  const step=PVE_TUTORIAL_STEPS[pveTutorialIndex];
  if(!step)return;
  $('#pveTutorialIcon').innerHTML=tutorialVisual(pveTutorialIndex);
  $('#pveTutorialEyebrow').textContent=step.eyebrow.replace(/^\d+/,String(pveTutorialIndex+1).padStart(2,'0'));
  $('#pveTutorialTitle').textContent=step.title;
  $('#pveTutorialBody').innerHTML=step.body;
  $('#pveTutorialProgress').textContent=`${pveTutorialIndex+1} / ${PVE_TUTORIAL_STEPS.length}`;
  $('#prevPveTutorialBtn').disabled=pveTutorialIndex===0;
  $('#nextPveTutorialBtn').textContent=pveTutorialIndex===PVE_TUTORIAL_STEPS.length-1?(pveTutorialLaunchesChallenge?'进入挑战':'完成'):'下一步';
  $('#pveTutorialDots').innerHTML=PVE_TUTORIAL_STEPS.map((_,index)=>`<button class="${index===pveTutorialIndex?'active':''}" data-pve-tutorial-step="${index}" aria-label="第${index+1}步"></button>`).join('');
}
function openPveTutorial(launchesChallenge=true){
  $('#pveTutorialPromptDialog')?.classList.add('hidden');
  pveTutorialLaunchesChallenge=launchesChallenge;
  pveTutorialIndex=0;
  renderPveTutorial();
  $('#pveTutorialDialog')?.classList.remove('hidden');
}
function movePveTutorial(delta){
  if(delta>0&&pveTutorialIndex===PVE_TUTORIAL_STEPS.length-1){if(pveTutorialLaunchesChallenge)beginNewChallengeAfterTutorial();else $('#pveTutorialDialog').classList.add('hidden');return}
  pveTutorialIndex=Math.max(0,Math.min(PVE_TUTORIAL_STEPS.length-1,pveTutorialIndex+delta));
  renderPveTutorial();
}
const $=s=>document.querySelector(s),clone=v=>JSON.parse(JSON.stringify(v));
const standardEquipmentIds=()=>Object.values(EQUIPMENT_CONFIG).filter(c=>c.itemClass==='standard_completed').map(c=>c.id);
function toast(text){if(typeof showEquipmentToast==='function')showEquipmentToast(text);else addLog(text,'reaction')}
function loadSlots(){
  try{
    // 1. Always start from built-in defaults (source file is authoritative)
    const builtIn=window.PVE_DEFAULT_STAGES&&clone(window.PVE_DEFAULT_STAGES);
    if(!builtIn||!ORDER.every(id=>Array.isArray(builtIn[id]))){
      // No built-in data: try old migration as last resort
      const old=JSON.parse(localStorage.getItem(OLD_SLOT_KEY)||'{}'),migrated={};
      OLD_SLOT_ORDER.forEach((oldKey,index)=>{if(old[oldKey]?.length)migrated[ORDER[index]]=old[oldKey]});
      localStorage.setItem(SLOT_KEY,JSON.stringify(migrated));
      return migrated;
    }
    // 2. Apply user overrides from localStorage (only stages the user has customized)
    const userSlots=JSON.parse(localStorage.getItem(SLOT_KEY)||'null');
    if(userSlots){
      for(const id of ORDER){
        if(Array.isArray(userSlots[id])&&userSlots[id].length>0){
          builtIn[id]=userSlots[id];
        }
      }
    }
    // 3. Write merged result to SLOT_KEY for runtime compatibility
    localStorage.setItem(SLOT_KEY,JSON.stringify(builtIn));
    return builtIn;
  }catch{return{}}
}
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
function enforceSlotLayoutLock(box){if(!box)return;const {avatarSize,avatarColumns,avatarGap}=PVE_SLOT_LAYOUT_LOCK;box.dataset.layoutLocked='true';box.querySelectorAll('.pve-slot-units').forEach(group=>{group.style.setProperty('--slot-avatar-size',`${avatarSize}px`);group.style.setProperty('grid-template-columns',`repeat(${avatarColumns},${avatarSize}px)`,'important');group.style.setProperty('justify-content','start','important');group.style.setProperty('justify-self','center','important');group.style.setProperty('width','max-content','important');group.style.setProperty('transform','translateX(4px)','important');group.style.setProperty('column-gap',`${avatarGap}px`,'important');group.style.setProperty('row-gap','6px','important');group.style.setProperty('padding','0','important')});box.querySelectorAll('.pve-slot-unit').forEach(avatar=>{for(const property of ['width','min-width','max-width','height','min-height','max-height'])avatar.style.setProperty(property,`${avatarSize}px`,'important')})}
function renderSlotList(){const slots=loadSlots(),box=$('#pveSlotList');box.innerHTML=SLOT_DEFS.map(s=>{const enemies=slots[s.key]||[],preview=enemies.map(saved=>{const entry=Object.entries(PIECE_CONFIG).find(([,config])=>config.templateId===saved.templateId),name=entry?.[0]||'未知棋子',config=entry?.[1],color=ELEMENTS[config?.element]||'#70839d',star=Math.max(1,Math.min(3,normalizeStarValue(saved.star)));return`<span class="pve-slot-unit" style="--slot-element:${color}" title="${name} · ${star}星"><img src="${config?.avatar||''}" alt="${name}"><i class="pve-slot-stars">${'★'.repeat(star)}</i></span>`}).join('');return`<button data-slot-key="${s.key}" class="${selectedSlot===s.key?'active':''}"><span class="pve-slot-name">${s.label}</span>${preview?`<span class="pve-slot-units">${preview}</span>`:'<small class="pve-slot-empty">未保存</small>'}</button>`}).join('');requestAnimationFrame(()=>{const titles=[...box.querySelectorAll('.pve-slot-name')];if(lockedSlotTitleWidth===null)lockedSlotTitleWidth=Math.min(PVE_SLOT_LAYOUT_LOCK.titleWidth,Math.ceil(Math.max(0,...titles.map(title=>title.scrollWidth))));if(!lockedSlotTitleWidth)return;box.style.setProperty('--slot-title-width',`${lockedSlotTitleWidth}px`);requestAnimationFrame(()=>{if(lockedSlotTitleStart===null){const firstAvatar=box.querySelector('.pve-slot-unit'),button=firstAvatar?.closest('button');if(firstAvatar&&button){const available=firstAvatar.getBoundingClientRect().left-button.getBoundingClientRect().left;lockedSlotTitleStart=Math.max(2,Math.round((available-lockedSlotTitleWidth)/2))}}if(lockedSlotTitleStart!==null)box.style.setProperty('--slot-title-start',`${lockedSlotTitleStart}px`);enforceSlotLayoutLock(box)})})}
function confirmSlotAction(){if(!selectedSlot){toast('请先选择关卡槽位');return}if(slotAction==='save'){const enemies=scanRed();if(!enemies.length){toast('红方棋盘没有可保存的正式棋子');return}const slots=loadSlots();if(slots[selectedSlot]?.length&&!confirm('该关卡已有阵容，是否覆盖？'))return;slots[selectedSlot]=enemies;saveSlots(slots);toast(`已保存 ${enemies.length} 名敌人到 ${selectedSlot}`)}else loadSlotIntoRed(selectedSlot);$('#pveSlotDialog').classList.add('hidden')}
function createPool(){const pool={};for(const name of PIECE_ORDER){const c=PIECE_CONFIG[name];pool[c.templateId]=POOL_COPIES[c.cost]}return pool}
function createRun(){return{version:3,state:'preparation',gold:30,level:3,xp:0,populationLimit:3,lives:3,maxLives:3,lossCount:0,round:0,winStreak:0,freeRefreshes:3,shopLocked:false,shopOffers:[],currentStageIndex:0,archiveEligible:false,cardPool:createPool(),equipmentInventory:[],removers:0,reforgers:0,formation:[],rewardHistory:[],battleHistory:[],pendingRewardPlan:null}}
function saveRun(captureFormation=true){if(!run)return;if(captureFormation)run.formation=formationSnapshot().filter(x=>x.team==='blue');localStorage.setItem(RUN_KEY,JSON.stringify(run))}
function loadRun(){try{const saved=JSON.parse(localStorage.getItem(RUN_KEY)||'null');if(!saved||saved.version!==3)return null;saved.level=Math.max(3,Math.min(MAX_LEVEL,Math.round(Number(saved.level)||3)));saved.xp=Math.max(LEVEL_TOTAL[saved.level]||0,Number(saved.xp)||0);if(saved.level>=MAX_LEVEL)saved.xp=LEVEL_TOTAL[MAX_LEVEL];saved.populationLimit=saved.level;if(Array.isArray(saved.shopOffers))saved.shopOffers.sort((a,b)=>(a?.cost??99)-(b?.cost??99));saved.pendingRewardPlan=saved.pendingRewardPlan||null;saved.battleHistory=Array.isArray(saved.battleHistory)?saved.battleHistory:[];saved.archiveEligible=!!saved.archiveEligible||saved.currentStageIndex>=18;delete saved.lockedInterest;return saved}catch{return null}}
function grantOpening(){if(run.openingClaimed)return;const ids=standardEquipmentIds();for(let i=0;i<2&&ids.length;i++)run.equipmentInventory.push(ids[Math.floor(Math.random()*ids.length)]);run.removers=1;run.reforgers=2;run.openingClaimed=true}
function stageId(){return ORDER[run.currentStageIndex]}
function stageKey(){return stageId()}
function ensureStageChoice(){return true}
let stageTransitionTimer=null;
function stageTransitionInfo(id){
  if(!id)return null;
  if(id==='1-1')return{kind:'phase',eyebrow:'挑战开始',title:'第一阶段',subtitle:'六场战斗等待你的挑战',progress:'0 / 20'};
  if(id==='2-1')return{kind:'phase',eyebrow:'已完成第一阶段',title:'第二阶段',subtitle:'敌方阵容与奖励将进一步提升',progress:'6 / 20'};
  if(id==='3-1')return{kind:'phase',eyebrow:'已完成第二阶段',title:'第三阶段',subtitle:'最终常规阶段现已开启',progress:'12 / 20'};
  if(id==='EX-1')return{kind:'ex',eyebrow:'三阶段挑战完成',title:'EX 阶段',subtitle:'突破极限，完成最后两场挑战',progress:'18 / 20'};
  if(RULES[id]?.type==='boss'){
    const completed=Math.max(0,ORDER.indexOf(id));
    return{kind:'boss',eyebrow:`本阶段前五关已完成`,title:'Boss 挑战',subtitle:`即将进入 ${id} · 击败阶段首领`,progress:`${completed} / 20`};
  }
  return null;
}
function hideStageTransition(){
  clearTimeout(stageTransitionTimer);
  stageTransitionTimer=null;
  $('#pveStageTransition')?.classList.add('hidden');
}
function showStageTransition(id){
  const info=stageTransitionInfo(id),overlay=$('#pveStageTransition');
  if(!info||!overlay)return;
  clearTimeout(stageTransitionTimer);
  overlay.className=`pve-stage-transition ${info.kind}`;
  $('#pveStageTransitionEyebrow').textContent=info.eyebrow;
  $('#pveStageTransitionTitle').textContent=info.title;
  $('#pveStageTransitionSubtitle').textContent=info.subtitle;
  $('#pveStageTransitionProgress').textContent=`挑战进度 ${info.progress}`;
  void overlay.offsetWidth;
  overlay.classList.add('playing');
  stageTransitionTimer=setTimeout(hideStageTransition,2300);
}
function restorePlayerFormation(snapshot=null,loadEnemy=true){const player=clone(snapshot||run.formation||[]);run.formation=clone(player);enterPreparation(player);const rebuilt=[];for(const saved of player){const definition=pieceDefByName(saved.name);if(!definition)continue;const unit=makeUnit(definition,saved.id,saved.star||1);applyFormationState(unit,saved);unit.team='blue';unit.row=saved.row;unit.col=saved.col;unit.onBench=!!saved.onBench;unit.benchIndex=saved.benchIndex;unit.inWarehouse=false;unit.motion=null;unit.target=null;unit.targetId=null;unit.moveFromHex=null;unit.moveToHex=null;unit.moveProgress=0;unit.renderX=undefined;unit.renderY=undefined;unit.alive=true;unit.hp=unit.maxHp;unit.mp=Math.min(unit.mp,unit.maxMp);rebuilt.push(unit)}units=rebuilt;if(loadEnemy)loadCurrentEnemy();lastFormation=formationSnapshot();saveRun(false);if(mode==='challenge'){resetBtn.disabled=true;resetBtn.title='挑战模式中不可重新布阵'}updateAliveCounts();renderDamageStats()}
function loadCurrentEnemy(){if(!ensureStageChoice())return false;const data=loadSlots()[stageKey()];if(!data?.length){toast(`关卡 ${stageKey()} 尚未保存敌人阵容`);return false}clearRedBoard();for(const saved of data){const u=unitFromSaved(saved,'pve-enemy');if(u){u.isPveEnemy=true;units.push(u)}}updateAliveCounts();renderDamageStats();return true}
function activateChallenge(existing){
  if(mode==='test')mainSnapshot={formation:clone(formationSnapshot()),whState:clone(whState)};
  mode='challenge';window.PVE_FIRST_ACTIVE=true;previousRoundStatUnits=null;run=existing||createRun();grantOpening();run.formation=run.formation||[];saveRun(false);
  $('#loadPveSlotBtn').classList.add('hidden');$('#savePveSlotBtn').classList.add('hidden');$('#openChallengeBtn').classList.add('hidden');$('#pveTutorialReplayBtn').classList.remove('hidden');$('#exitChallengeBtn').classList.remove('hidden');$('#settleChallengeBtn').classList.remove('hidden');
  $('#pveShopBar').classList.remove('hidden');$('#whPanel').classList.remove('hidden');$('.wh-title').textContent='挑战装备栏';$('[data-wh-tab="pieces"]').hidden=true;switchWarehouseTab('equip');renderChallengeInventory();restorePlayerFormation();resetBtn.disabled=true;resetBtn.title='挑战模式中不可重新布阵';if(!run.shopOffers.length)refreshShop(true);renderPveHud();$('#challengeDialog').classList.add('hidden');if(run.round===0&&run.currentStageIndex===0)setTimeout(()=>showStageTransition('1-1'),180);
}
function leaveChallenge(saveProgress=true){if(saveProgress)saveRun();else localStorage.removeItem(RUN_KEY);mode='test';window.PVE_FIRST_ACTIVE=false;previousRoundStatUnits=null;$('#pveShopBar').classList.add('hidden');$('#pvePendingRewardDock')?.classList.add('hidden');$('#pveTutorialReplayBtn').classList.add('hidden');$('#exitChallengeBtn').classList.add('hidden');$('#settleChallengeBtn').classList.add('hidden');$('#loadPveSlotBtn').classList.remove('hidden');$('#savePveSlotBtn').classList.remove('hidden');$('#openChallengeBtn').classList.remove('hidden');$('.wh-title').textContent='测试仓库';$('[data-wh-tab="pieces"]').hidden=false;Object.assign(whState,mainSnapshot?.whState||{});enterPreparation(mainSnapshot?.formation||[]);resetBtn.disabled=false;resetBtn.title='';switchWarehouseTab(whState.tab||'pieces');renderWhCards();renderWarehouseEquipmentCards();mainSnapshot=null;return true}
function exitChallenge(){if(mode!=='challenge')return false;$('#exitChallengeConfirmDialog').classList.remove('hidden');return true}
function confirmExitChallenge(){$('#exitChallengeConfirmDialog').classList.add('hidden');return leaveChallenge(true)}
function openChallengeSettlement(){if(mode!=='challenge'||!run)return;$('#challengeSettlementConfirmDialog').classList.remove('hidden')}
function confirmChallengeSettlement(){$('#challengeSettlementConfirmDialog').classList.add('hidden');$('#challengeSettlementStage').textContent=`当前关卡：${stageId()||'已完成'}`;$('#challengeSettlementRound').textContent=`已完成回合：${run.round}`;$('#challengeSettlementDialog').classList.remove('hidden')}
function restartChallengeFromSettlement(){localStorage.removeItem(RUN_KEY);$('#challengeSettlementDialog').classList.add('hidden');activateChallenge(createRun())}
function finishChallengeToTest(){$('#challengeSettlementDialog').classList.add('hidden');if(run?.archiveEligible)completeChallengeArchive();else leaveChallenge(false)}
function rollCost(){const odds=SHOP_ODDS[run.level],x=Math.random()*100;let sum=0;for(let i=0;i<5;i++){sum+=odds[i];if(x<sum)return i+1}return 1}
function returnOffers(){for(const offer of run.shopOffers||[])if(offer&&!offer.bought)run.cardPool[offer.templateId]=(run.cardPool[offer.templateId]||0)+1}
function hasOwnedThreeStar(templateId){return units.some(unit=>!unit.inWarehouse&&!unit.isSummon&&unit.team==='blue'&&unit.templateId===templateId&&normalizeStarValue(unit.star)>=3)}
function syncThreeStarShopBan(){
  if(!run?.shopOffers)return;
  let changed=false;
  run.shopOffers=run.shopOffers.map(offer=>{
    if(!offer||!hasOwnedThreeStar(offer.templateId))return offer;
    run.cardPool[offer.templateId]=(run.cardPool[offer.templateId]||0)+1;
    changed=true;
    return null;
  });
  if(changed)localStorage.setItem(RUN_KEY,JSON.stringify(run));
}
function rollOffer(){for(let tries=0;tries<50;tries++){const cost=rollCost(),names=PIECE_ORDER.filter(n=>PIECE_CONFIG[n].cost===cost&&(run.cardPool[PIECE_CONFIG[n].templateId]||0)>0&&!hasOwnedThreeStar(PIECE_CONFIG[n].templateId));if(!names.length)continue;const name=names[Math.floor(Math.random()*names.length)],cfg=PIECE_CONFIG[name];run.cardPool[cfg.templateId]--;return{templateId:cfg.templateId,name,cost,bought:false}}return null}
function refreshShop(initial=false){if(started)return;const cost=run.freeRefreshes>0?0:2;if(!initial&&run.gold<cost){toast('金币不足');return}if(!initial){run.gold-=cost;if(run.freeRefreshes>0)run.freeRefreshes--}returnOffers();run.shopOffers=Array.from({length:5},rollOffer).sort((a,b)=>(a?.cost??99)-(b?.cost??99));saveRun();renderPveHud()}
function emptyBlueBench(){for(let i=0;i<BENCH_SLOTS;i++)if(!benchOccupied('blue',i))return i;return-1}
function buyOffer(index){const offer=run.shopOffers[index];if(!offer)return;if(run.gold<offer.cost){toast('金币不足，无法购买');return}const bench=emptyBlueBench();if(bench<0){toast('蓝方备战席已满');return}const d=pieceDefByName(offer.name),u=makeUnit(d,`pve-piece-${Date.now()}-${nextPieceId++}`,1);u.team='blue';u.onBench=true;u.benchIndex=bench;u.row=null;u.col=null;u.inWarehouse=false;units.push(u);if(started&&Array.isArray(battlePlayerSnapshot))battlePlayerSnapshot.push({id:u.id,templateId:u.templateId,name:u.name,star:u.star,team:'blue',row:null,col:null,onBench:true,benchIndex:bench,inWarehouse:false,warehouseIndex:null});run.gold-=offer.cost;run.shopOffers[index]=null;checkSynthesisAfterDrop('blue');saveRun();renderPveHud();updateAliveCounts()}
function buyXp(){if(started)return;if(run.level>=MAX_LEVEL){toast('已达到最高等级');return}if(run.gold<4){toast('金币不足');return}run.gold-=4;gainXp(4);saveRun();renderPveHud()}
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
  if(mode!=='challenge'||!unit||unit.team!=='blue'||unit.isDummy||unit.isSummon)return false;
  const price=SELL_PRICE[unit.cost]?.[normalizeStarValue(unit.star)]||0;
  if(askConfirmation&&!confirm(`出售 ${unit.star}★ ${unit.name}，获得 ${price} 金币？`))return false;
  ensureUnitEquipment(unit);for(const item of unit.equipment||[])if(item?.equipmentId)run.equipmentInventory.push(item.equipmentId);
  run.cardPool[unit.templateId]=(run.cardPool[unit.templateId]||0)+poolCopiesForStar(normalizeStarValue(unit.star));units=units.filter(x=>x!==unit);if(selectedUnit===unit){selectedUnit=null;hideUnitInspect()}renderChallengeInventory();updateAliveCounts();renderDamageStats();
  if(started&&Array.isArray(battlePlayerSnapshot))battlePlayerSnapshot=battlePlayerSnapshot.filter(saved=>saved.id!==unit.id);
  animateGoldGain(price,()=>{run.gold+=price;saveRun();renderPveHud();toast(`已出售 ${unit.name}，获得 ${price} 金币`)});return true;
}
function isShopSellDrop(clientX,clientY,unit){if(mode!=='challenge'||!unit||unit.team!=='blue'||unit.isDummy||unit.isSummon)return false;const shop=$('#pveShopBar');if(!shop||shop.classList.contains('hidden'))return false;const rect=shop.getBoundingClientRect();return clientX>=rect.left&&clientX<=rect.right&&clientY>=rect.top&&clientY<=rect.bottom}
function positionShopSellOverlay(){const shop=$('#pveShopBar'),cards=$('#pveShopCards');if(!shop||!cards)return;const shopRect=shop.getBoundingClientRect(),cardsRect=cards.getBoundingClientRect();shop.style.setProperty('--sell-trash-x',`${cardsRect.left-shopRect.left+cardsRect.width/2}px`);shop.style.setProperty('--sell-trash-y',`${cardsRect.top-shopRect.top+cardsRect.height/2}px`)}
function updateShopSellFeedback(clientX,clientY,unit){const shop=$('#pveShopBar');if(!shop)return;const eligible=mode==='challenge'&&unit?.team==='blue'&&!unit.isDummy&&!unit.isSummon;if(eligible)positionShopSellOverlay();shop.classList.toggle('sell-drop-ready',eligible);shop.classList.toggle('sell-drop-active',eligible&&isShopSellDrop(clientX,clientY,unit))}
function clearShopSellFeedback(){$('#pveShopBar')?.classList.remove('sell-drop-ready','sell-drop-active')}
function returnChallengeUnitToBench(unit){if(mode!=='challenge'||started||!unit||unit.team!=='blue'||unit.onBench)return false;const bench=emptyBlueBench();if(bench<0){toast('蓝方备战席已满');return false}placeUnit(unit,{kind:'bench',team:'blue',index:bench});toast(`${unit.name} 已回到备战席`);return true}
function gainXp(amount){
  if(run.level>=MAX_LEVEL)return;
  run.xp+=Math.max(0,Number(amount)||0);
  while(run.level<MAX_LEVEL&&run.xp>=LEVEL_TOTAL[run.level+1]){
    run.level++;
    run.populationLimit=run.level;
    toast(`升级到 Lv${run.level}`);
  }
  if(run.level>=MAX_LEVEL)run.xp=LEVEL_TOTAL[MAX_LEVEL];
}
function renderPveHud(){
  if(!run)return;
  syncThreeStarShopBan();
  const isMaxLevel=run.level>=MAX_LEVEL,levelStart=LEVEL_TOTAL[run.level]||0,next=isMaxLevel?LEVEL_TOTAL[MAX_LEVEL]:LEVEL_TOTAL[run.level+1],levelXp=Math.max(0,run.xp-levelStart),levelNeed=Math.max(0,next-levelStart),onBoard=units.filter(u=>u.team==='blue'&&!u.onBench&&!u.inWarehouse&&u.alive).length,ownedNames=new Set(units.filter(u=>u.alive&&u.team==='blue'&&!u.inWarehouse&&!u.isDummy&&!u.isSummon).map(u=>u.name));
  $('#pveLevel').textContent=`Lv${run.level}`;
  $('#pveXp').textContent=isMaxLevel?'经验：满级':`经验 ${levelXp}/${levelNeed}`;
  $('#pveXpBarFill').style.width=`${isMaxLevel?100:(levelNeed>0?Math.min(100,Math.max(0,levelXp/levelNeed*100)):0)}%`;
  $('#pvePopulation').textContent=`人口 ${onBoard}/${run.populationLimit}`;
  $('#pvePopulation').classList.toggle('full',onBoard>=run.populationLimit);
  $('#pveShopOdds').innerHTML=SHOP_ODDS[run.level].map((chance,index)=>`<span class="cost${index+1}">${index+1}费 <b>${chance}%</b></span>`).join('');
  $('#pveGoldValue').textContent=run.gold;
  $('#pveStage').textContent=`回合 ${stageId()||'已完成'}`;
  $('#pveLives').textContent='♥'.repeat(Math.max(0,run.lives));
  $('#pveLives').title=`剩余失败机会：${run.lives}/3`;
  $('#pveStreakValue').textContent=run.winStreak;
  $('#buyXpBtn').disabled=isMaxLevel||started;
  $('#buyXpBtn').title=isMaxLevel?'已达到最高等级':'花费4金币获得4经验';
  $('#buyXpBtn').innerHTML=isMaxLevel?'<span>已满级</span>':`<span>购买经验</span><span class="pve-button-price"><img src="assets/two-coins.svg" alt="">4</span>`;
  $('#refreshShopBtn').innerHTML=run.freeRefreshes>0?`<span>刷新</span><span class="pve-free-price">免费×${run.freeRefreshes}</span>`:`<span>刷新</span><span class="pve-button-price"><img src="assets/two-coins.svg" alt="">2</span>`;
  $('#lockShopBtn').classList.toggle('active',run.shopLocked);$('#lockShopBtn').setAttribute('aria-pressed',String(run.shopLocked));$('#lockShopBtn').title=run.shopLocked?'点击解锁商店':'点击锁定商店';$('#lockShopBtn').innerHTML=`<img src="assets/${run.shopLocked?'shop-lock':'shop-unlock'}.svg" alt=""><span>${run.shopLocked?'已锁定':'未锁定'}</span>`;
  requestAnimationFrame(()=>{const lock=$('#lockShopBtn'),stage=$('#pveStage');if(lock&&stage&&lock.offsetWidth>0){stage.style.width=`${lock.offsetWidth}px`;stage.style.textAlign='center'}});
  $('#pveShopCards').innerHTML=(run.shopOffers||[]).map((o,i)=>o?`<button class="pve-shop-card cost${o.cost}${ownedNames.has(o.name)?' owned-copy':''}" data-buy-offer="${i}" draggable="false"><img src="${PIECE_CONFIG[o.name].avatar}" draggable="false"><span>${o.name}</span><small>${PIECE_CONFIG[o.name].element} · ${PIECE_CONFIG[o.name].weapon}</small></button>`:'<div class="pve-shop-slot-empty" aria-hidden="true"></div>').join('');
  $('#pvePendingRewardDock')?.classList.toggle('hidden',!run.pendingRewardPlan);
}
function renderChallengeInventory(){
  const box=$('#whEquipCards');if(!box)return;const counts={};for(const id of run.equipmentInventory)counts[id]=(counts[id]||0)+1;
  const cards=Object.entries(counts).map(([id,count])=>{const c=EQUIPMENT_CONFIG[id];return`<div class="wh-equip-card" data-item-id="${id}" data-item-kind="equipment"><img class="wh-equip-icon" src="${c.icon}" draggable="false"><div class="wh-equip-name">${c.name}</div><div class="wh-equip-stat pve-equip-count">×${count}</div></div>`});
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
function lossCompensationFor(count){if(count===1)return{gold:10,equipmentCount:1,cards:[]};if(count===2)return{gold:10,equipmentCount:1,cards:[{cost:4,star:1},{cost:4,star:1}]};return null}
function applyLossCompensation(plan){
  const reward={gold:plan.gold,equipment:[],cards:[]};run.gold+=plan.gold;
  for(let i=0;i<plan.equipmentCount;i++){const id=randomStandardEquipment();if(id){run.equipmentInventory.push(id);reward.equipment.push(EQUIPMENT_CONFIG[id]?.name||id)}}
  for(const card of plan.cards){const name=grantRandomCard(card.cost,card.star);reward.cards.push(name||`${card.star}★ ${card.cost}费卡（卡池库存不足）`)}
  checkSynthesisAfterDrop('blue');saveRun();renderChallengeInventory();renderPveHud();updateAliveCounts();return reward;
}
function freeBlueBenchCount(){let count=0;for(let i=0;i<BENCH_SLOTS;i++)if(!benchOccupied('blue',i))count++;return count}
function showPendingLossReward(){
  const plan=run?.pendingRewardPlan;if(!plan)return;
  const rows=[`<div class="pve-loot-row"><span><img src="assets/two-coins.svg" alt="">金币</span><b>+${plan.gold}</b></div>`,...Array.from({length:plan.equipmentCount},()=>`<div class="pve-loot-row"><span>随机装备</span><b>1件</b></div>`),...plan.cards.map(card=>`<div class="pve-loot-row"><span>随机棋子</span><b>${card.star}★ ${card.cost}费卡</b></div>`)];
  $('#pveLossRewardBody').innerHTML=rows.join('');$('#pveLossRewardDialog').classList.remove('hidden');$('#pvePendingRewardDock').classList.remove('hidden');
}
function queueLossCompensation(plan,next){run.pendingRewardPlan=clone(plan);pendingRewardNext=next;saveRun(false);renderPveHud();showPendingLossReward()}
function hidePendingLossReward(){$('#pveLossRewardDialog').classList.add('hidden')}
function claimPendingLossReward(){
  const plan=run?.pendingRewardPlan;if(!plan)return;
  if(freeBlueBenchCount()<plan.cards.length){$('#pveLossRewardDialog').classList.add('hidden');$('#pveBenchFullRewardDialog').classList.remove('hidden');return}
  const neededByCost=plan.cards.reduce((map,card)=>(map[card.cost]=(map[card.cost]||0)+1,map),{});
  for(const [cost,count] of Object.entries(neededByCost)){
    const available=PIECE_ORDER.filter(name=>PIECE_CONFIG[name].cost===Number(cost)).reduce((sum,name)=>sum+(run.cardPool[PIECE_CONFIG[name].templateId]||0),0);
    if(available<count){toast(`${cost}费共享卡池库存不足，暂时无法领取`);return}
  }
  const dialog=$('#pveLossRewardDialog'),claimButton=$('#continueLossRewardBtn');
  claimButton.disabled=true;
  animateRewardCollection({gold:plan.gold,equipment:plan.equipmentCount,cards:plan.cards.length},dialog,()=>{
    const reward=applyLossCompensation(plan);run.pendingRewardPlan=null;dialog.classList.add('hidden');$('#pvePendingRewardDock').classList.add('hidden');saveRun(false);toast(`奖励已领取：${reward.cards.join('、')}`);
    claimButton.disabled=false;
    const next=pendingRewardNext;pendingRewardNext=null;(next||(()=>{if(!run.shopLocked)refreshShop(true);saveRun();renderPveHud()}))();
  });
}
function showRoundResult(win,reward,next){
  const dialog=$('#pveRoundResultDialog'),title=$('#pveRoundResultTitle'),body=$('#pveRoundResultBody');
  roundResultRewardFx={
    gold:Math.max(0,(Number(reward.baseGold)||0)+(Number(reward.interestGold)||0)+(Number(reward.streakGold)||0)+(Number(reward.stageGold)||0)),
    equipment:Math.max(0,(Number(reward.equipmentCount)||0)+(reward.phaseSupply?3:0)),
    cards:0
  };
  title.textContent=win?'关卡胜利':'挑战失败';
  dialog.classList.toggle('victory',win);dialog.classList.toggle('defeat',!win);
  if(win){
    const stageGold=reward.stageGold?`<div class="pve-loot-row"><span>${reward.stageType==='fun'?'奖励关':'Boss关'}金币</span><b>+${reward.stageGold}</b></div>`:'';
    const equipment=reward.equipmentCount?`<div class="pve-loot-row"><span>随机装备</span><b>+${reward.equipmentCount}件</b></div>`:'';
    const extraRefresh=reward.extraRefreshes?`<div class="pve-loot-row"><span>Boss额外刷新</span><b>+${reward.extraRefreshes}</b></div>`:'';
    const phaseSupply=reward.phaseSupply?`<div class="pve-loot-row"><span>新阶段补给</span><b>拆卸器×2 · 重铸器×1</b></div>`:'';
    body.innerHTML=`<div class="pve-victory-mark">胜利</div><div class="pve-loot-title">本回合战利品</div><div class="pve-loot-row"><span>基础资金</span><b>+${reward.baseGold}</b></div><div class="pve-loot-row"><span>经验</span><b>+6</b></div><div class="pve-loot-row"><span>利息</span><b>+${reward.interestGold}</b></div><div class="pve-loot-row"><span>连胜奖励</span><b>+${reward.streakGold}</b></div>${stageGold}${equipment}${extraRefresh}${phaseSupply}`;
  }else if(reward.exRetry){
    body.innerHTML=`<div class="pve-victory-mark">EX</div><div class="pve-defeat-copy">本次挑战未通过</div><div class="pve-loot-row"><span>基础资金</span><b>+${reward.baseGold}</b></div><div class="pve-loot-title">EX关失败不会扣除生命，也不会推进关卡</div>`;
  }else{
    body.innerHTML=`<div class="pve-heart-break"><span class="lost-heart">♥</span><i></i></div><div class="pve-defeat-copy">失去1点生命 · 连胜已中断</div><div class="pve-loot-row"><span>基础资金</span><b>+${reward.baseGold}</b></div><div class="pve-loot-title">本场无经验、利息、免费刷新与胜利奖励</div><div class="pve-life-remain">${'♥'.repeat(Math.max(0,reward.lives))||'无剩余生命'}</div>`;
  }
  roundResultNext=next;dialog.classList.remove('hidden');
}
function compactFormation(team){
  return units.filter(u=>u.alive&&!u.onBench&&!u.inWarehouse&&!u.isSummon&&u.team===team).map(u=>({
    name:u.name,templateId:u.templateId,star:normalizeStarValue(u.star),row:u.row,col:u.col,
    equipmentIds:(u.equipment||[]).filter(Boolean).map(item=>item.equipmentId)
  }));
}
function teamRoundStats(team){
  const members=units.filter(u=>!u.onBench&&!u.inWarehouse&&!u.isSummon&&u.team===team);
  return{
    damage:Math.round(members.reduce((sum,u)=>sum+(Number(u.damageDealt)||0),0)),
    taken:Math.round(members.reduce((sum,u)=>sum+(Number(u.damageTaken)||0),0)),
    support:Math.round(members.reduce((sum,u)=>sum+(Number(u.healingDone)||0)+(Number(u.shieldingDone)||0),0))
  };
}
function recordBattleReview(stage,win){
  if(!run)return;
  run.battleHistory=Array.isArray(run.battleHistory)?run.battleHistory:[];
  const unitDetails=units.filter(u=>!u.onBench&&!u.inWarehouse&&!u.isSummon).map(u=>({
    name:u.name,templateId:u.templateId,star:normalizeStarValue(u.star),team:u.team,
    damageDealt:Math.round(Number(u.damageDealt)||0),damageTaken:Math.round(Number(u.damageTaken)||0),
    healingDone:Math.round(Number(u.healingDone)||0),shieldingDone:Math.round(Number(u.shieldingDone)||0),
    damageByType:{...(u.damageByType||{})},takenByType:{...(u.takenByType||{})}
  }));
  const entry={
    round:run.round+1,stage,win,
    playerFormation:clone(activeBattleRecord?.playerFormation||[]),
    enemyFormation:clone(activeBattleRecord?.enemyFormation||[]),
    playerStats:teamRoundStats('blue'),
    enemyStats:teamRoundStats('red'),
    unitDetails
  };
  run.battleHistory.push(entry);
  activeBattleRecord=null;
  return entry;
}
function reviewAvatar(saved){
  const entry=Object.entries(PIECE_CONFIG).find(([name,cfg])=>name===saved.name||cfg.templateId===saved.templateId);
  const name=entry?.[0]||saved.name||'未知棋子',cfg=entry?.[1],elementColor=ELEMENTS[cfg?.element]||'#547399';
  return `<span class="pve-review-unit" style="--archive-element:${elementColor}" title="${name} · ${saved.star||1}星"><img src="${cfg?.avatar||''}" alt="${name}"><i>${'★'.repeat(saved.star||1)}</i></span>`;
}
function reviewBoard(item){
  const pieces=[...(item.enemyFormation||[]).map(unit=>({...unit,team:'red'})),...(item.playerFormation||[]).map(unit=>({...unit,team:'blue'}))];
  return `<div class="pve-review-board">${Array.from({length:56},(_,index)=>{const row=Math.floor(index/7);return`<i class="pve-review-hex ${row<4?'red':'blue'} ${row%2?'odd':''}" style="--row:${row};--col:${index%7}"></i>`}).join('')}${pieces.map(saved=>{const entry=Object.entries(PIECE_CONFIG).find(([name,cfg])=>name===saved.name||cfg.templateId===saved.templateId),name=entry?.[0]||saved.name||'未知棋子',cfg=entry?.[1];return`<span class="pve-review-piece ${saved.team} ${saved.row%2?'odd':''}" style="--row:${saved.row};--col:${saved.col}" title="${name} · ${saved.star||1}星"><img src="${cfg?.avatar||''}" alt="${name}"><i>${'★'.repeat(saved.star||1)}</i></span>`}).join('')}</div>`;
}
function reviewSide(title,team,stats,historyIndex){
  const values=[['造成伤害',stats?.damage||0,'#56a9ff'],['承受伤害',stats?.taken||0,'#ff6d7a'],['治疗与护盾',stats?.support||0,'#74e6b1']],max=Math.max(1,...values.map(value=>value[1]));
  return `<section><h4>${title}</h4><button class="pve-review-stats" data-review-details="${historyIndex}" data-review-team="${team}" title="点击查看逐角色战斗统计">${values.map(([label,value,color])=>`<span><em>${label}</em><i><u style="width:${value/max*100}%;background:${color}"></u></i><b>${value}</b></span>`).join('')}</button></section>`;
}
function openChallengeReview(source=null){
  reviewArchive=source&&source.battleHistory?source:null;
  const reviewSource=reviewArchive||run;if(!reviewSource)return;
  const history=reviewSource.battleHistory||[],body=$('#pveReviewBody');
  body.innerHTML=history.length?history.map((item,index)=>`<article><header><b>回合 ${item.stage}</b><span class="${item.win?'win':'loss'}">${item.win?'胜利':'失败'}</span></header>${reviewBoard(item)}${reviewSide('我方战斗统计','blue',item.playerStats,index)}${reviewSide('敌方战斗统计','red',item.enemyStats,index)}</article>`).join(''):'<p class="pve-review-empty">尚无已完成的战斗记录</p>';
  $('#pveReviewDialog').classList.remove('hidden');
}
function statTypeText(values){const rows=Object.entries(values||{}).map(([type,value])=>`${type} ${Math.round(value)}`);return rows.join(' · ')||'无'}
function openReviewDetails(historyIndex,team){
  const item=(reviewArchive||run)?.battleHistory?.[historyIndex];if(!item)return;
  reviewDetailContext={historyIndex,team,mode:'dealt'};
  const list=(item.unitDetails||[]).filter(unit=>unit.team===team);
  $('#pveReviewDetailTitle').textContent=`回合 ${item.stage} · ${team==='blue'?'我方':'敌方'}逐角色统计`;
  renderReviewDetailBars();
  $('#pveReviewDetailDialog').classList.remove('hidden');
}
function renderReviewDetailBars(){
  if(!reviewDetailContext)return;
  const item=(reviewArchive||run)?.battleHistory?.[reviewDetailContext.historyIndex];if(!item)return;
  const mode=reviewDetailContext.mode,list=(item.unitDetails||[]).filter(unit=>unit.team===reviewDetailContext.team);
  const valueOf=unit=>mode==='dealt'?unit.damageDealt:mode==='taken'?unit.damageTaken:unit.healingDone+unit.shieldingDone;
  const sorted=list.slice().sort((a,b)=>valueOf(b)-valueOf(a)),max=Math.max(1,...sorted.map(valueOf));
  $('#pveReviewDetailModes').querySelectorAll('button').forEach(button=>button.classList.toggle('active',button.dataset.reviewStatMode===mode));
  $('#pveReviewDetailTotal').textContent=mode==='support'?`有效治疗 ${sorted.reduce((sum,u)=>sum+u.healingDone,0)} · 护盾 ${sorted.reduce((sum,u)=>sum+u.shieldingDone,0)}`:`总${mode==='taken'?'承受':'造成'}伤害 ${sorted.reduce((sum,u)=>sum+valueOf(u),0)}`;
  $('#pveReviewDetailBody').innerHTML=sorted.length?sorted.map(unit=>{
    const breakdown=mode==='dealt'?unit.damageByType:mode==='taken'?unit.takenByType:null;
    const parts=mode==='support'?[{type:'治疗',value:unit.healingDone,color:'#74e6b1'},{type:'护盾',value:unit.shieldingDone,color:'#66bfff'}].filter(part=>part.value>0):Object.entries(breakdown||{}).map(([type,value])=>({type,value,color:DAMAGE_TYPE_COLORS[type]||'#8aa0ba'}));
    const bars=parts.map(part=>`<i class="damage-fill" title="${part.type} ${Math.round(part.value)}" style="width:${part.value/max*100}%;background:${part.color}"></i>`).join('');
    const display=mode==='support'?`治${unit.healingDone}/盾${unit.shieldingDone}`:Math.round(valueOf(unit)).toLocaleString();
    return `<div class="damage-row" title="${parts.map(part=>`${part.type} ${Math.round(part.value)}`).join(' · ')}"><i class="team-dot" style="background:${unit.team==='blue'?'#54a7ff':'#ff6673'}"></i><span class="damage-name">${unit.name}</span><span class="damage-track">${bars}</span><b class="damage-value">${display}</b></div>`;
  }).join(''):'<p>没有角色数据</p>';
}
function showExFailureChoice(){
  $('#pveExFailureDialog').classList.remove('hidden');
}
function retryExStage(){
  $('#pveExFailureDialog').classList.add('hidden');
  saveRun();renderPveHud();
}
function endExChallenge(){
  $('#pveExFailureDialog').classList.add('hidden');
  if(run?.archiveEligible)completeChallengeArchive();
  else{openChallengeReview();$('#pveReviewDialog').dataset.exitAfterReview='true'}
}
function showPhaseThreeChoice(continueRound){
  phaseThreeContinue=continueRound;
  $('#pvePhaseThreeDialog').classList.remove('hidden');
}
function enterExStages(){
  $('#pvePhaseThreeDialog').classList.add('hidden');
  run.gold+=50;
  toast('获得50金币，进入EX关卡');
  const next=phaseThreeContinue;phaseThreeContinue=null;
  if(next)next();else{saveRun();renderPveHud()}
}
function replayAfterPhaseThree(){
  $('#pvePhaseThreeDialog').classList.add('hidden');
  phaseThreeContinue=null;
  localStorage.removeItem(RUN_KEY);
  activateChallenge(createRun());
}
function finishAfterPhaseThree(){
  $('#pvePhaseThreeDialog').classList.add('hidden');
  phaseThreeContinue=null;
  completeChallengeArchive();
}
function loadArchives(){try{const value=JSON.parse(localStorage.getItem(ARCHIVE_KEY)||'[]');return Array.from({length:5},(_,index)=>value[index]||null)}catch{return Array(5).fill(null)}}
function saveArchives(value){localStorage.setItem(ARCHIVE_KEY,JSON.stringify(value))}
function archiveFinalAvatars(archive){
  const formation=archive?.finalFormation||[];
  return formation.filter(unit=>!unit.onBench).slice(0,10).map(reviewAvatar).join('')||'<em>空档案</em>';
}
function renderArchiveSlots(){
  const archives=loadArchives(),box=$('#pveArchiveSlots');if(!box)return;
  box.innerHTML=archives.map((archive,index)=>`<button class="pve-archive-slot ${archive?'filled':'empty'}" data-archive-slot="${index}"><b>${archive?.name||`挑战档案 ${index+1}`}</b><span>${archive?archiveFinalAvatars(archive):'空槽位'}</span><small>${archive?`${archive.completedAt||''} · ${archive.battleHistory?.length||0}场战斗`:'点击查看或保存'}</small></button>`).join('');
}
function openArchiveSave(){
  selectedArchiveSlot=loadArchives().findIndex(value=>!value);if(selectedArchiveSlot<0)selectedArchiveSlot=0;
  $('#pveArchiveName').value=`挑战回顾 ${new Date().toLocaleDateString()}`;
  renderArchiveSaveSlots();$('#pveArchiveSaveDialog').classList.remove('hidden');
}
function renderArchiveSaveSlots(){
  const archives=loadArchives(),box=$('#pveArchiveSaveSlots');
  box.innerHTML=archives.map((archive,index)=>`<button data-save-archive-slot="${index}" class="${selectedArchiveSlot===index?'active':''}">${index+1}号槽${archive?'（覆盖）':'（空）'}</button>`).join('');
}
function confirmArchiveSave(){
  if(!pendingCompletedArchive)return;
  const name=$('#pveArchiveName').value.trim()||`挑战回顾档案 ${selectedArchiveSlot+1}`,archives=loadArchives();
  archives[selectedArchiveSlot]={...clone(pendingCompletedArchive),name,completedAt:new Date().toLocaleString()};
  saveArchives(archives);pendingCompletedArchive=null;$('#pveArchiveSaveDialog').classList.add('hidden');renderArchiveSlots();toast('挑战回顾档案已保存');leaveChallenge(false);
}
function openArchiveSlot(index){
  const archive=loadArchives()[index];if(!archive){toast('该成功档案槽为空');return}
  openChallengeReview(archive);
}
function completeChallengeArchive(){
  pendingCompletedArchive={battleHistory:clone(run.battleHistory||[]),finalFormation:clone(run.formation||[]),round:run.round};
  localStorage.removeItem(RUN_KEY);
  $('#pveEndText').textContent='挑战完成';
  $('#pveEndDialog').classList.add('hidden');
  openArchiveSave();
}
function settle(win){
  const previousFormation=clone(battlePlayerSnapshot||run.formation||[]);
  previousRoundStatUnits=clone(units.filter(u=>!u.onBench&&!u.inWarehouse).map(u=>({
    name:u.name,
    team:u.team,
    onBench:false,
    damageDealt:Number(u.damageDealt)||0,
    damageTaken:Number(u.damageTaken)||0,
    damageByType:{...(u.damageByType||{})},
    takenByType:{...(u.takenByType||{})},
    healingDone:Number(u.healingDone)||0,
    shieldingDone:Number(u.shieldingDone)||0
  })));
  const startStage=stageId(),isExStage=startStage?.startsWith('EX-'),phaseThreeCleared=win&&startStage==='3-6';let terminal='',lossCompensation=null,exRetry=false;
  let baseGold=3,interestGold=0,streakGold=0,stageGold=0,equipmentCount=0,extraRefreshes=0,phaseSupply=false;
  const reviewEntry=recordBattleReview(startStage,win);
  if(isExStage&&!win&&exBattleSnapshot){
    const snapshot=clone(exBattleSnapshot);
    run=snapshot.run;
    run.battleHistory=Array.isArray(run.battleHistory)?run.battleHistory:[];
    run.battleHistory.push(reviewEntry);
    exRetry=true;
    previousRoundStatUnits=clone(reviewEntry.unitDetails||[]);
    restorePlayerFormation(snapshot.formation,true);
    battlePlayerSnapshot=null;exBattleSnapshot=null;
    saveRun(false);renderPveHud();
    showRoundResult(false,{baseGold:0,interestGold:0,streakGold:0,stageGold:0,equipmentCount:0,extraRefreshes:0,phaseSupply:false,xp:0,lives:run.lives,exRetry:true},showExFailureChoice);
    return;
  }
  run.round++;
  interestGold=Math.min(10,Math.floor(Math.max(0,run.gold)/10));
  run.gold+=baseGold+interestGold;
  if(win){
    gainXp(6);
    run.winStreak++;streakGold=run.winStreak>=6?5:run.winStreak>=3?3:1;run.gold+=streakGold;
    const rule=RULES[startStage];
    if(rule.type==='fun'){stageGold=10;equipmentCount=1}
    else if(rule.type==='boss'){stageGold=10;equipmentCount=2;extraRefreshes=3}
    run.gold+=stageGold;run.freeRefreshes+=extraRefreshes;
    const ids=standardEquipmentIds();for(let i=0;i<equipmentCount&&ids.length;i++)run.equipmentInventory.push(ids[Math.floor(Math.random()*ids.length)]);
    if(startStage==='EX-1')run.currentStageIndex=19;
    else if(startStage==='EX-2'){run.state='complete';terminal='挑战完成'}
    else run.currentStageIndex++;
    if(phaseThreeCleared)run.archiveEligible=true;
    if(run.currentStageIndex===6||run.currentStageIndex===12){
      run.removers+=2;
      run.reforgers+=1;
      phaseSupply=true;
    }
    if(run.currentStageIndex>=ORDER.length)run.currentStageIndex=ORDER.length-1;
  }else{
    run.winStreak=0;
    if(isExStage)exRetry=true;
    else{
      run.lives--;run.lossCount++;
      lossCompensation=lossCompensationFor(run.lossCount);
      if(run.lives<=0){run.state='game_over';terminal='挑战失败'}
    }
  }
  const reward={baseGold,interestGold,streakGold,stageGold,stageType:RULES[startStage]?.type,equipmentCount,extraRefreshes,phaseSupply,xp:win?6:0,lives:run.lives,exRetry};
  restorePlayerFormation(previousFormation,!terminal);battlePlayerSnapshot=null;
  if(run.state==='game_over')localStorage.removeItem(RUN_KEY);
  else saveRun(false);
  renderPveHud();
  showRoundResult(win,reward,()=>{
    if(terminal){showEnd(terminal);return}
    renderChallengeInventory();renderPveHud();
    const continueRound=()=>{if(!run.shopLocked)refreshShop(true);saveRun();renderPveHud();if(win)setTimeout(()=>showStageTransition(stageId()),180)};
    if(phaseThreeCleared){showPhaseThreeChoice(continueRound);return}
    if(exRetry){showExFailureChoice();return}
    if(!win&&lossCompensation)queueLossCompensation(lossCompensation,continueRound);else continueRound();
  });
}
function showEnd(text){$('#pveRoundResultDialog').classList.add('hidden');if(text==='挑战完成'){completeChallengeArchive();return}$('#pveEndText').textContent=text;$('#pveEndDialog').classList.remove('hidden');renderPveHud()}
function retryFinishedChallenge(){$('#pveEndDialog').classList.add('hidden');localStorage.removeItem(RUN_KEY);activateChallenge(createRun())}
function exitFinishedChallenge(){$('#pveEndDialog').classList.add('hidden');leaveChallenge(false)}
function startPveBattle(){if(mode!=='challenge')return true;if(run.pendingRewardPlan){toast('请先领取上一回合奖励');showPendingLossReward();return false}const count=units.filter(u=>u.team==='blue'&&!u.onBench&&!u.inWarehouse&&u.alive).length;if(count>run.populationLimit){toast(`上阵人数超过人口上限 ${run.populationLimit}`);return false}if(!units.some(u=>u.team==='red'&&!u.onBench&&!u.inWarehouse)){if(!loadCurrentEnemy())return false}battlePlayerSnapshot=clone(formationSnapshot().filter(x=>x.team==='blue'));activeBattleRecord={stage:stageId(),playerFormation:compactFormation('blue'),enemyFormation:compactFormation('red')};run.formation=clone(battlePlayerSnapshot);if(stageId()?.startsWith('EX-'))exBattleSnapshot={run:clone(run),formation:clone(battlePlayerSnapshot)};else exBattleSnapshot=null;saveRun(false);return true}
function installUi(){
  const actions=$('.actions');actions.insertAdjacentHTML('beforeend','<span class="pve-divider"></span><button class="btn" id="loadPveSlotBtn">载入挑战关卡阵容</button><button class="btn" id="savePveSlotBtn">保存当前红方阵容</button><button class="btn" id="openChallengeBtn">挑战模式</button><button class="btn" id="openChallengeArchiveBtn">挑战档案</button><button class="btn hidden pve-tutorial-replay" id="pveTutorialReplayBtn">查看教程</button><button class="btn hidden" id="settleChallengeBtn">结算对局</button><button class="btn hidden" id="exitChallengeBtn">返回测试模式</button>');
  $('#whEquipCards')?.insertAdjacentHTML('afterend','<div id="pvePendingRewardDock" class="pve-pending-reward-dock hidden"><button id="pendingRewardBtn"><strong>领取待处理奖励</strong><span>奖励已保留，点击重新打开领取页面</span></button></div>');
  $('.arena').insertAdjacentHTML('beforeend',`<div id="pveShopBar" class="pve-shop-bar hidden"><div class="pve-shop-meta"><div class="pve-pop-streak"><span id="pvePopulation">人口 0/3</span><span class="pve-streak" title="当前连胜"><i>🔥</i><b id="pveStreakValue">0</b></span></div><div id="pveShopOdds" class="pve-shop-odds"></div><span></span></div><div class="pve-shop-main"><div class="pve-shop-actions"><div class="pve-level-line"><b id="pveLevel">Lv3</b><span id="pveXp">经验 0/6</span></div><div id="pveXpBar" class="pve-xp-bar" aria-hidden="true"><i id="pveXpBarFill"></i></div><div class="pve-shop-action-buttons"><button id="buyXpBtn" title="花费4金币获得4经验"></button><button id="refreshShopBtn"></button></div></div><div id="pveShopCards" class="pve-shop-cards"></div><div class="pve-shop-state right"><div class="pve-shop-right-row"><button id="lockShopBtn">锁定</button><b id="pveGold" class="pve-gold" title="金币"><img src="assets/two-coins.svg" alt="金币"><span id="pveGoldValue">30</span></b></div><div class="pve-shop-right-row"><span id="pveStage">回合 1-1</span><span id="pveLives" class="pve-lives" title="剩余失败机会：3/3">♥♥♥</span></div></div></div></div>`);
  document.body.insertAdjacentHTML('beforeend',`<div id="pveSlotDialog" class="pve-modal hidden"><div><h2 id="pveSlotTitle"></h2><div id="pveSlotList" class="pve-slot-list"></div><footer><button id="confirmPveSlotBtn">确认</button><button data-close-pve-modal>取消</button></footer></div></div><div id="challengeDialog" class="pve-modal hidden"><div><h2>挑战模式</h2><p>固定20关挑战，拥有独立金币、商店、装备库存与三次失败机会。</p><footer><button id="newPveBtn">开始新挑战</button><button id="continuePveBtn">继续挑战</button><button id="challengeTutorialBtn" class="pve-tutorial-primary">挑战教程</button><button data-close-pve-modal>关闭</button></footer></div></div><div id="pveArchiveDialog" class="pve-modal hidden"><div class="pve-challenge-home"><h2>成功挑战回顾</h2><p>通过三阶段 Boss 后即可保存挑战结果；进入 EX 后即使后续失败，也能保存包含这些战斗在内的完整回顾。档案仅供回顾，不能载入或继续挑战。</p><div id="pveArchiveSlots" class="pve-archive-slots"></div><footer><button data-close-pve-modal>关闭</button></footer></div></div><div id="pveEndDialog" class="pve-modal hidden"><div><h2 id="pveEndText"></h2><footer><button id="retryFinishedPveBtn">再来一次</button><button id="exitFinishedPveBtn">返回测试场</button></footer></div></div>`);
  document.body.insertAdjacentHTML('beforeend',`<div id="pveRoundResultDialog" class="pve-modal pve-round-result hidden"><div><h2 id="pveRoundResultTitle"></h2><div id="pveRoundResultBody"></div><footer><button id="continueRoundResultBtn">继续</button></footer></div></div>`);
  document.body.insertAdjacentHTML('beforeend',`<div id="pveLossRewardDialog" class="pve-modal pve-round-result victory hidden"><div><h2>扣血补偿</h2><div class="pve-victory-mark">补偿</div><div class="pve-loot-title">确认后发放以下逆风奖励</div><div id="pveLossRewardBody"></div><footer><button id="hideLossRewardBtn">暂时隐藏</button><button id="continueLossRewardBtn">确认领取</button></footer></div></div>`);
  document.body.insertAdjacentHTML('beforeend',`<div id="pveBenchFullRewardDialog" class="pve-modal hidden"><div><h2>备战席已满</h2><p>当前没有足够空位领取棋子奖励。奖励已经保留，你可以先隐藏窗口、整理或出售备战席棋子，再点击“待领取奖励”重新打开。</p><footer><button id="hideBenchFullRewardBtn">整理备战席</button><button id="reopenPendingRewardBtn">返回奖励</button></footer></div></div>`);
  document.body.insertAdjacentHTML('beforeend',`<div id="challengeSettlementDialog" class="pve-modal hidden"><div class="pve-challenge-settlement"><h2>本次挑战结算</h2><div class="pve-settlement-progress"><b id="challengeSettlementStage">当前关卡：1-1</b><span id="challengeSettlementRound">已完成回合：0</span></div><p>要查看挑战回顾、重新开始挑战，还是结束本次挑战并返回测试场？</p><footer><button id="openChallengeReviewBtn">挑战回顾</button><button id="restartChallengeBtn">重新挑战</button><button id="finishChallengeToTestBtn">回到测试场</button><button data-close-pve-modal>取消</button></footer></div></div>`);
  document.body.insertAdjacentHTML('beforeend',`<div id="challengeSettlementConfirmDialog" class="pve-modal hidden"><div class="pve-settlement-confirm"><h2>确认结算对局？</h2><p>结算后可以选择重新挑战，或结束挑战并回到测试场。</p><footer><button id="confirmChallengeSettlementBtn">确认结算</button><button data-close-pve-modal>继续挑战</button></footer></div></div>`);
  document.body.insertAdjacentHTML('beforeend',`<div id="newChallengeConfirmDialog" class="pve-modal hidden"><div class="pve-settlement-confirm"><h2>开始新的挑战？</h2><p>当前挑战进度将被覆盖，金币、阵容和关卡进度都会重新开始。</p><footer><button id="confirmNewChallengeBtn">开始新挑战</button><button data-close-pve-modal>取消</button></footer></div></div>`);
  document.body.insertAdjacentHTML('beforeend',`<div id="pveTutorialPromptDialog" class="pve-modal hidden"><div class="pve-tutorial-prompt"><span>挑战开始前</span><h2>需要查看挑战教程吗？</h2><p>教程会介绍关卡、Boss、经济、商店、装备和实战布阵。第一次体验挑战模式时建议先看一遍。</p><footer><button id="openPveTutorialBtn" class="pve-tutorial-primary">查看挑战教程</button><button id="skipPveTutorialPromptBtn">直接开始</button></footer></div></div>`);
  document.body.insertAdjacentHTML('beforeend',`<div id="pveTutorialDialog" class="pve-modal hidden"><div class="pve-tutorial-panel"><header><span id="pveTutorialProgress">1 / 12</span><b>挑战模式教程</b></header><main><div id="pveTutorialIcon" class="pve-tutorial-visual"></div><section><small id="pveTutorialEyebrow"></small><h2 id="pveTutorialTitle"></h2><div id="pveTutorialBody" class="pve-tutorial-body"></div></section></main><div id="pveTutorialDots" class="pve-tutorial-dots"></div><footer><button id="skipPveTutorialBtn">跳过教程</button><i></i><button id="prevPveTutorialBtn">上一步</button><button id="nextPveTutorialBtn" class="pve-tutorial-primary">下一步</button></footer></div></div>`);
  document.body.insertAdjacentHTML('beforeend',`<div id="exitChallengeConfirmDialog" class="pve-modal hidden"><div class="pve-settlement-confirm"><h2>返回测试模式？</h2><p>当前挑战进度将自动保存，之后可以继续挑战。</p><footer><button id="confirmExitChallengeBtn">保存并返回</button><button data-close-pve-modal>取消</button></footer></div></div>`);
  document.body.insertAdjacentHTML('beforeend',`<div id="pvePhaseThreeDialog" class="pve-modal hidden"><div class="pve-settlement-confirm"><h2>三阶段挑战完成</h2><p>你可以获得50金币并进入EX-1与EX-2，也可以结束本次挑战，或重新开始一把。EX失败可以原状态重试，EX-2胜利后挑战完成。</p><footer><button id="enterExStagesBtn">领取50金币并进入EX</button><button id="reviewPhaseThreeBtn">挑战回顾</button><button id="replayPhaseThreeBtn">再来一把</button><button id="finishPhaseThreeBtn">回到测试场</button></footer></div></div>`);
  document.body.insertAdjacentHTML('beforeend',`<div id="pveExFailureDialog" class="pve-modal hidden"><div class="pve-settlement-confirm"><h2>EX挑战失败</h2><p>EX关卡可以无限挑战。要重新挑战本关，还是结束本次挑战？</p><footer><button id="retryExStageBtn">重新挑战本关</button><button id="reviewExBtn">挑战回顾</button><button id="endExChallengeBtn">结束挑战</button></footer></div></div>`);
  document.body.insertAdjacentHTML('beforeend',`<div id="pveReviewDialog" class="pve-modal hidden"><div class="pve-review-panel"><button id="closeChallengeReviewTopBtn" class="pve-review-close" title="返回挑战档案" aria-label="关闭回顾">×</button><h2>挑战回顾</h2><div id="pveReviewBody" class="pve-review-body"></div><footer><button id="closeChallengeReviewBtn">关闭回顾</button></footer></div></div>`);
  document.body.insertAdjacentHTML('beforeend',`<div id="pveReviewDetailDialog" class="pve-modal hidden"><div class="pve-review-detail-panel"><div class="pve-review-detail-title"><h2 id="pveReviewDetailTitle">逐角色统计</h2><span id="pveReviewDetailTotal"></span></div><div id="pveReviewDetailModes" class="damage-switch"><button class="active" data-review-stat-mode="dealt">造成伤害</button><button data-review-stat-mode="taken">承受伤害</button><button data-review-stat-mode="support">治疗/护盾</button></div><div id="pveReviewDetailBody" class="pve-review-detail-body damage-list"></div><footer><button data-close-pve-modal>关闭</button></footer></div></div>`);
  document.body.insertAdjacentHTML('beforeend',`<div id="pveArchiveSaveDialog" class="pve-modal hidden"><div class="pve-archive-save-panel"><h2>保存挑战回顾档案</h2><label>档案名称<input id="pveArchiveName" maxlength="30" placeholder="输入档案名字"></label><div id="pveArchiveSaveSlots" class="pve-archive-save-slots"></div><footer><button id="confirmArchiveSaveBtn">保存档案</button><button id="skipArchiveSaveBtn">不保存并返回测试场</button></footer></div></div>`);
  document.body.insertAdjacentHTML('beforeend',`<div id="pveStageTransition" class="pve-stage-transition hidden" role="status" aria-live="polite"><div class="pve-stage-transition-flare"></div><div class="pve-stage-transition-card"><span id="pveStageTransitionEyebrow"></span><h2 id="pveStageTransitionTitle"></h2><i></i><p id="pveStageTransitionSubtitle"></p><b id="pveStageTransitionProgress"></b><small>点击任意位置跳过</small></div></div>`);
  renderArchiveSlots();
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
    .pve-shop-card.owned-copy{border-top:3px solid #f1c85e;box-shadow:inset 0 3px 0 rgba(255,232,151,.16)}
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
    .pve-shop-right-row{display:grid;grid-template-columns:minmax(0,1fr) 68px;column-gap:14px}
    .pve-shop-right-row #pveStage{justify-self:center}
    .pve-shop-right-row .pve-lives{justify-self:center}
    .pve-shop-right-row #pveGold{box-sizing:border-box;width:68px;justify-self:center;justify-content:space-between}
    .pve-shop-right-row #pveStage{white-space:nowrap;font-size:14px;font-weight:800;letter-spacing:.3px}.pve-shop-right-row .pve-lives{display:inline-flex;justify-content:flex-end;min-width:0}
    .pve-button-price,.pve-free-price{display:inline-flex;align-items:center;gap:3px;color:#f2c85f;font-weight:800}
    .pve-button-price img{width:15px;height:15px}
    .pve-free-price{color:#79d69a}
    #pveGold{gap:6px;font-size:20px;font-weight:900;text-shadow:0 0 9px rgba(242,200,95,.32)}
    #pveGold img{width:29px;height:29px;filter:drop-shadow(0 0 6px rgba(242,200,95,.45))}
    .pve-lives{display:inline-flex;box-sizing:border-box;align-items:center;justify-content:center;width:68px;min-width:68px;font-size:29px;letter-spacing:2px;filter:drop-shadow(0 0 5px rgba(255,77,91,.3))}
    .pve-gold-gain{position:fixed;z-index:2600;display:flex;align-items:center;gap:7px;transform:translate(-50%,0) scale(.88);color:#ffe27f;font-size:23px;font-weight:900;opacity:0;pointer-events:none;text-shadow:0 2px 5px #000,0 0 12px rgba(255,210,74,.65)}
    .pve-gold-gain img{width:31px;height:31px;filter:drop-shadow(0 0 8px rgba(255,205,57,.7))}
    .pve-gold-gain.play{animation:pveGoldCollect .72s cubic-bezier(.2,.7,.25,1) both}
    @keyframes pveGoldCollect{0%{transform:translate(-50%,-8px) scale(.8);opacity:0}18%{transform:translate(-50%,0) scale(1.12);opacity:1}58%{transform:translate(-50%,19px) scale(1);opacity:1}100%{transform:translate(-50%,38px) scale(.62);opacity:0}}
    .pve-reward-particle{position:fixed;z-index:2700;width:8px;height:8px;border-radius:50%;pointer-events:none;background:#ffd765;box-shadow:0 0 6px #ffc84b,0 0 13px rgba(255,194,51,.8);animation:pveRewardFly .82s var(--reward-delay,0s) cubic-bezier(.32,.05,.3,1) both}.pve-reward-particle.equipment{width:9px;height:9px;border-radius:2px;transform:rotate(45deg);background:#ffedaa;box-shadow:0 0 7px #ffd560,0 0 16px rgba(255,202,74,.9)}.pve-reward-particle.card{width:7px;height:11px;border-radius:2px;background:#ffe7a0;box-shadow:0 0 7px #ffca4f,0 0 14px rgba(255,190,48,.85)}
    @keyframes pveRewardFly{0%{opacity:0;transform:translate(-50%,-50%) scale(.35) rotate(0)}18%{opacity:1;transform:translate(-50%,-50%) scale(1.2) rotate(70deg)}75%{opacity:1}100%{opacity:0;transform:translate(calc(var(--reward-x) - 50%),calc(var(--reward-y) - 50%)) scale(.25) rotate(260deg)}}
    .pve-shop-slot-empty{min-width:0;visibility:hidden}
    #pveSlotDialog>div{width:min(1180px,calc(100% - 34px));max-height:92vh;padding:24px}
    #pveSlotDialog .pve-slot-list{grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
    #pveSlotDialog .pve-slot-list button{grid-template-columns:var(--slot-title-width,112px) minmax(0,1fr);grid-template-rows:74px;min-height:98px;padding:10px 2px;font-size:14px;column-gap:0}
    #pveSlotDialog .pve-slot-name{align-self:start;justify-self:start;width:var(--slot-title-width,112px);font-size:14px;line-height:28px;white-space:nowrap;text-align:left;transform:translateX(var(--slot-title-start,5px))}
    #pveSlotDialog .pve-slot-units{--slot-avatar-size:32px;box-sizing:border-box;grid-template-columns:repeat(5,var(--slot-avatar-size));grid-template-rows:repeat(2,var(--slot-avatar-size));grid-auto-rows:var(--slot-avatar-size);column-gap:2px;row-gap:6px;align-content:start;justify-content:start;justify-self:center;width:max-content;height:70px;padding:0;transform:translateX(4px)}
    #pveSlotDialog .pve-slot-unit{position:relative;flex:0 0 32px;width:32px;min-width:32px;max-width:32px;height:32px;min-height:32px;max-height:32px;aspect-ratio:auto;overflow:visible}
    #pveSlotDialog .pve-slot-stars{position:absolute;left:50%;bottom:-4px;z-index:2;transform:translateX(-50%);color:#ffd86a;font:700 7px/1 Arial,sans-serif;font-style:normal;letter-spacing:-1px;white-space:nowrap;text-shadow:0 1px 2px #000,0 0 4px rgba(255,190,50,.8);pointer-events:none}
    .pve-pending-reward-dock{flex:0 0 auto;padding:10px;border-top:1px solid rgba(91,118,156,.38);background:linear-gradient(180deg,rgba(13,24,39,.2),rgba(20,34,53,.92))}
    .pve-pending-reward-dock button{width:100%;padding:11px 10px;border:1px solid #e3bc61;border-radius:8px;background:linear-gradient(135deg,#5d4218,#273954);color:#fff4c7;box-shadow:0 0 14px rgba(227,188,97,.24);cursor:pointer;text-align:center}
    .pve-pending-reward-dock strong,.pve-pending-reward-dock span{display:block}
    .pve-pending-reward-dock strong{font-size:14px;letter-spacing:.5px}
    .pve-pending-reward-dock span{margin-top:3px;color:#d9cda9;font-size:10px}
    .pve-pending-reward-dock button:hover{border-color:#ffe08a;box-shadow:0 0 18px rgba(227,188,97,.4)}
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
    #pveEndDialog>div{width:min(520px,calc(100% - 30px));text-align:center}
    #pveEndDialog h2{margin:12px 0 24px;text-align:center;font-size:30px;letter-spacing:2px}
    #pveEndDialog footer{justify-content:center}
    .pve-modal footer button{min-width:104px;padding:9px 15px;font-size:14px;font-weight:700}
    .pve-challenge-settlement,.pve-settlement-confirm{width:min(480px,calc(100% - 30px));text-align:center}
    .pve-tutorial-prompt{width:min(500px,calc(100% - 30px))!important;text-align:center}.pve-tutorial-prompt>span{display:inline-block;padding:4px 10px;border:1px solid #6597c6;border-radius:999px;color:#9dcbf2;font-size:11px;font-weight:800;letter-spacing:2px}.pve-tutorial-prompt h2{margin:16px 0 8px;font-size:26px}.pve-tutorial-prompt p{color:#aebfd3;line-height:1.75}.pve-tutorial-prompt footer{justify-content:center}
    .pve-tutorial-primary{border-color:#78bdf2!important;background:linear-gradient(135deg,#275e8c,#173958)!important;color:#eaf7ff!important;box-shadow:0 0 15px rgba(77,165,232,.2)}
    .pve-tutorial-panel{width:min(820px,calc(100% - 30px))!important;max-height:88vh!important;padding:0!important;overflow:hidden!important}.pve-tutorial-panel>header{display:flex;align-items:center;justify-content:space-between;padding:13px 19px;border-bottom:1px solid #344d6b;background:#0b1523;color:#8eb6dc}.pve-tutorial-panel>header b{color:#dbe9f8;font-size:13px;letter-spacing:3px}.pve-tutorial-panel>main{display:grid;grid-template-columns:150px minmax(0,1fr);gap:24px;align-items:center;min-height:330px;padding:25px 30px}.pve-tutorial-icon{display:grid;place-items:center;width:126px;height:126px;border:1px solid #50769e;border-radius:50%;background:radial-gradient(circle,#193a5c 0,#10243a 58%,#091523 70%);box-shadow:0 0 28px rgba(66,145,211,.18),inset 0 0 18px rgba(100,177,235,.12);color:#f1d179;font-size:42px;font-weight:900}.pve-tutorial-panel section>small{color:#79b5e5;font-weight:800;letter-spacing:2px}.pve-tutorial-panel section h2{margin:7px 0 13px;font-size:27px}.pve-tutorial-body{color:#b9c9db;font-size:14px;line-height:1.75}.pve-tutorial-body p{margin:7px 0}.pve-tutorial-body ul{margin:8px 0;padding-left:20px}.pve-tutorial-body mark{padding:0 2px;background:none;color:#f2cd6f;font-weight:900}.pve-tutorial-callout{margin-top:13px;padding:10px 12px;border-left:3px solid #d7ac4e;border-radius:0 6px 6px 0;background:rgba(176,126,35,.1);color:#e7d7ab}.pve-tutorial-dots{display:flex;justify-content:center;gap:7px;padding:0 20px 12px}.pve-tutorial-dots button{width:7px;min-width:7px;height:7px;padding:0;border:0;border-radius:50%;background:#40536c}.pve-tutorial-dots button.active{width:22px;background:#79bceb}.pve-tutorial-panel>footer{align-items:center;margin:0!important;padding:13px 18px;border-top:1px solid #344d6b;background:#0b1523}.pve-tutorial-panel>footer i{flex:1}.pve-tutorial-panel button:disabled{opacity:.35;cursor:not-allowed}
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
	    .pve-review-panel{position:relative;width:min(820px,calc(100% - 30px))!important;max-height:90vh!important;padding:12px!important}.pve-review-panel h2{margin:0 0 7px;text-align:center}.pve-review-close{position:sticky!important;z-index:8!important;top:0!important;float:right!important;width:34px!important;min-width:34px!important;height:34px!important;padding:0!important;border-radius:50%!important;font-size:24px!important;line-height:30px!important}
	    .pve-review-body{display:grid;gap:8px}.pve-review-body article{padding:8px 12px 9px;border:1px solid #3a506c;border-radius:9px;background:#0b1523}
	    .pve-review-body article>header{display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;font-size:16px}.pve-review-body header .win{color:#f1cf73}.pve-review-body header .loss{color:#ff7e89}
	    .pve-review-body section{display:grid;grid-template-columns:116px minmax(0,1fr);align-items:center;gap:8px;padding:5px 0;border-top:1px solid rgba(72,94,124,.35)}
	    .pve-review-body h4{margin:0;color:#b8c9dd;font-size:12px}.pve-review-units{display:flex;flex-wrap:wrap;gap:5px;min-height:38px;align-items:center}.pve-review-units em{color:#71839a;font-size:11px}
	    .pve-review-unit{position:relative;width:36px;height:36px;border:2px solid #547399;border-radius:50%;background:#0a111c}.pve-review-unit img{width:100%;height:100%;border-radius:50%;object-fit:cover}.pve-review-unit i{position:absolute;left:50%;bottom:-4px;transform:translateX(-50%);color:#ffd56d;font:700 7px/1 Arial;font-style:normal;white-space:nowrap;text-shadow:0 1px 2px #000}
	    .pve-review-empty{text-align:center;color:#8ea0b7}
	    .pve-review-board{position:relative;width:380px;height:330px;margin:3px auto 6px;background:#091321;border:1px solid #405674;border-radius:9px;overflow:hidden}
	    .pve-review-hex{position:absolute;left:calc(21px + var(--col)*45px);top:calc(2px + var(--row)*39px);width:45px;height:52px;clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%);background:rgba(111,142,178,.62)}.pve-review-hex::after{content:"";position:absolute;inset:1.5px;clip-path:inherit;background:#182638}.pve-review-hex.red::after{background:#351d27}.pve-review-hex.blue::after{background:#17334f}.pve-review-hex.odd{margin-left:22.5px}
	    .pve-review-piece{position:absolute;z-index:2;left:calc(26.5px + var(--col)*45px);top:calc(11px + var(--row)*39px);width:34px;height:34px;border:2px solid #5cb2ff;border-radius:50%;background:#0b1421}.pve-review-piece.odd{margin-left:22.5px}.pve-review-piece.red{border-color:#ff6874}.pve-review-piece img{width:100%;height:100%;border-radius:50%;object-fit:cover}.pve-review-piece i{position:absolute;left:50%;top:-5px;transform:translateX(-50%);color:#ffd86a;font:700 7px/1 Arial;font-style:normal;white-space:nowrap;text-shadow:0 1px 2px #000}
	    .pve-review-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;width:100%;padding:5px;border:1px solid #3d536f;border-radius:6px;background:#0e1a2a;color:#aebfd2;cursor:pointer}.pve-review-stats:hover{border-color:#71a9df;background:#13243a}.pve-review-stats span{display:grid;grid-template-columns:auto minmax(45px,1fr) auto;align-items:center;gap:5px;min-width:0}.pve-review-stats em{font-size:9px;font-style:normal;white-space:nowrap}.pve-review-stats span>i{height:7px;border-radius:5px;background:#26344a;overflow:hidden}.pve-review-stats u{display:block;height:100%;border-radius:inherit;text-decoration:none}.pve-review-stats b{min-width:28px;color:#e7eff9;font-size:11px;text-align:right}
	    .pve-review-detail-panel{width:min(660px,calc(100% - 30px))!important}.pve-review-detail-title{display:flex;align-items:center;justify-content:space-between;gap:10px}.pve-review-detail-title h2{margin:0}.pve-review-detail-title span{color:#9eb0c6;font-size:11px}.pve-review-detail-panel .damage-switch{margin:10px 0}.pve-review-detail-body{display:grid;gap:6px;min-height:80px;padding:10px;border:1px solid #30445f;border-radius:8px;background:#09131f}.pve-review-detail-body .damage-row{grid-template-columns:12px 82px 1fr 86px}
	    .pve-challenge-home{width:min(1080px,calc(100% - 30px))!important}.pve-archive-slots{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}.pve-archive-slot{min-width:0;min-height:144px;padding:9px;border:1px solid #405675;border-radius:8px;background:#0b1523;color:#dce7f6}.pve-archive-slot>span{display:grid;grid-template-columns:repeat(5,32px);grid-template-rows:repeat(2,32px);justify-content:center;align-content:center;gap:6px 3px;min-height:70px;margin:8px 0}.pve-archive-slot .pve-review-unit{box-sizing:border-box;width:32px;height:32px;border-color:var(--archive-element,#547399);overflow:visible}.pve-archive-slot small{display:block;color:#8194ad;font-size:8px}.pve-archive-slot.filled{border-color:#b68b3f;box-shadow:inset 0 0 12px rgba(221,170,66,.08)}
	    .pve-archive-save-panel{width:min(560px,calc(100% - 30px))!important}.pve-archive-save-panel label{display:grid;gap:5px;color:#aebfd3}.pve-archive-save-panel input{padding:9px;border:1px solid #405675;border-radius:6px;background:#091321;color:#eef4fc}.pve-archive-save-slots{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-top:12px}.pve-archive-save-slots button.active{border-color:#f1c85e;background:#3a2d16;color:#ffe5a1}
      .pve-stage-transition{position:fixed;inset:0;z-index:2600;display:grid;place-items:center;overflow:hidden;background:radial-gradient(circle at 50% 48%,rgba(45,91,145,.3),rgba(2,7,14,.86) 58%);cursor:pointer}.pve-stage-transition-flare{position:absolute;width:min(760px,85vw);height:2px;background:linear-gradient(90deg,transparent,#76bdff 25%,#e5f5ff 50%,#76bdff 75%,transparent);box-shadow:0 0 24px #4aa8ff;transform:scaleX(0)}.pve-stage-transition-card{position:relative;display:grid;justify-items:center;width:min(620px,86vw);padding:28px 24px;text-align:center;color:#eaf4ff}.pve-stage-transition-card span{color:#8eb8df;font-size:14px;font-weight:800;letter-spacing:5px}.pve-stage-transition-card h2{margin:8px 0 7px;color:#f4f8ff;font-size:48px;line-height:1;text-shadow:0 0 22px rgba(100,177,255,.55)}.pve-stage-transition-card i{width:180px;height:1px;background:linear-gradient(90deg,transparent,#7ab8ee,transparent)}.pve-stage-transition-card p{margin:13px 0 7px;color:#b9cbe0;font-size:16px}.pve-stage-transition-card b{color:#f1d27a;font-size:14px;letter-spacing:2px}.pve-stage-transition-card small{margin-top:20px;color:#647b95;font-size:10px}.pve-stage-transition.boss{background:radial-gradient(circle at 50% 48%,rgba(135,37,48,.34),rgba(7,4,9,.9) 60%)}.pve-stage-transition.boss .pve-stage-transition-flare{background:linear-gradient(90deg,transparent,#d95a62 25%,#ffd2b5 50%,#d95a62 75%,transparent);box-shadow:0 0 28px #a52639}.pve-stage-transition.boss h2{color:#ffd0c5;text-shadow:0 0 25px rgba(255,67,75,.65)}.pve-stage-transition.boss span{color:#e58a89}.pve-stage-transition.ex h2{color:#e3c3ff;text-shadow:0 0 25px rgba(173,91,255,.65)}.pve-stage-transition.playing .pve-stage-transition-flare{animation:pveStageFlare 2.2s ease both}.pve-stage-transition.playing .pve-stage-transition-card{animation:pveStageCard 2.2s ease both}
      .pve-equip-count{font-size:14px!important;line-height:1.15!important;font-weight:900!important;color:#f3d273!important;text-shadow:0 1px 3px #000}
      .pve-tutorial-replay{border-color:#65a9da!important;color:#a9d9f8!important}.pve-tutorial-panel>main{grid-template-columns:250px minmax(0,1fr)!important;gap:25px!important;min-height:350px!important}.pve-tutorial-visual{display:grid;place-items:center;width:230px;min-height:230px;padding:12px;box-sizing:border-box;border:1px solid #3f5f80;border-radius:14px;background:linear-gradient(145deg,#0b1523,#10243a);box-shadow:0 0 25px rgba(47,121,184,.13);color:#dbe9f8}.pve-tutorial-visual img{object-fit:contain}.pve-tutorial-body mark,.tutorial-economy mark{padding:0 2px;background:none;color:#f2cd6f;font-weight:900}
      .tutorial-mode-card,.tutorial-stage-card,.tutorial-battle-state,.tutorial-economy,.tutorial-health,.tutorial-ready{display:grid;justify-items:center;gap:10px;text-align:center}.tutorial-mode-card b{color:#f1d078;font-size:22px}.tutorial-mode-card span,.tutorial-stage-card b{font-size:28px;font-weight:900}.tutorial-mode-card small,.tutorial-stage-card em,.tutorial-health small{color:#849ab4}.tutorial-resource-board{display:grid;grid-template-columns:1fr 1fr;gap:11px;width:100%}.tutorial-gold{display:flex;align-items:center;justify-content:center;gap:7px;color:#f1c756;font-size:26px}.tutorial-gold img{width:30px;height:30px}.tutorial-hearts{color:#ff7180;font:30px/1 Arial;letter-spacing:1px}.tutorial-level{display:grid;grid-template-columns:1fr 1fr;gap:7px;width:100%;padding:9px;box-sizing:border-box;border:1px solid #3f5573;border-radius:8px;background:#0d1827}.tutorial-level>span{text-align:right}.tutorial-level>i{grid-column:1/3;height:7px;border:1px solid #46617f;border-radius:8px;background:#07101b}.tutorial-level button{grid-column:1/3;display:flex;justify-content:space-between;padding:7px;border:1px solid #435a78;border-radius:5px;background:#17243a;color:#e6eef8}.tutorial-level button img{width:17px}.tutorial-level strong{color:#75e2b0}.tutorial-level small{grid-column:1/3;color:#9db0c7}.tutorial-streak{display:flex;align-items:center;justify-content:center;color:#ff694e;font-size:23px}.tutorial-stage-card i{width:150px;height:1px;background:linear-gradient(90deg,transparent,#6faee1,transparent)}.tutorial-stage-card strong{color:#ff9b92}.tutorial-battle-state span{color:#f1d078}.tutorial-battle-state i{color:#8da2ba;font-style:normal}.tutorial-shop-demo{width:100%}.tutorial-odds{display:flex;justify-content:space-between;color:#91a4ba;font-size:10px}.tutorial-odds b{color:#e7eff9}.tutorial-cards{display:grid;grid-template-columns:repeat(5,1fr);gap:3px;margin-top:9px}.tutorial-cards i{display:grid;gap:3px;min-width:0;padding:4px 2px;border:1px solid #445a76;border-bottom:3px solid #5cce83;border-radius:5px;background:#111d2d;font-style:normal}.tutorial-cards img{width:32px;height:32px;margin:auto;border-radius:50%}.tutorial-cards small{overflow:hidden;color:#aebed1;font-size:7px;white-space:nowrap}.tutorial-buy-sell{display:grid;grid-template-columns:52px auto 50px auto 58px;align-items:center;gap:5px;text-align:center;font-size:9px}.tutorial-buy-sell img{width:42px;height:42px;border-radius:50%}.tutorial-buy-sell div{display:grid;gap:5px}.bench-slot,.shop-drop{padding:8px 4px;border:1px solid #4d6685;border-radius:7px;background:#111d2c}.shop-drop{border-color:#a9555d;color:#ff9aa2}.tutorial-economy p{display:flex;flex-wrap:wrap;justify-content:center;gap:4px}.tutorial-economy small{color:#93a7bf}.tutorial-equipment{display:grid;justify-items:center;gap:13px;width:100%}.equipment-slots{display:flex;gap:6px}.equipment-slots i{display:grid;place-items:center;width:49px;height:49px;border:2px solid #b78a42;border-radius:9px;background:linear-gradient(145deg,#65421c,#17243a);color:#f3d98d;font-size:10px;font-style:normal}.tutorial-equipment>b{color:#81bee9}.tool-row{display:flex;gap:7px}.tool-row span{padding:6px;border:1px solid #475f7e;border-radius:6px;font-size:10px}.tutorial-health>span{color:#ff7885;font:25px Arial}.tutorial-position{display:grid;gap:10px;text-align:center}.tutorial-position .back{color:#83c6f2}.tutorial-position .front{color:#ff8c93}.hex-row{color:#456c93;font-size:27px;letter-spacing:-7px}.hex-row.offset{transform:translateX(13px)}.tutorial-ready span{color:#9eb0c5}.tutorial-ready button{padding:10px 25px!important;border-color:#62a6d9!important;background:#1d4e73!important;color:#fff!important;font-size:15px!important}
      @keyframes pveStageFlare{0%{opacity:0;transform:scaleX(0)}18%{opacity:1;transform:scaleX(1)}75%{opacity:.75;transform:scaleX(.72)}100%{opacity:0;transform:scaleX(.4)}}@keyframes pveStageCard{0%{opacity:0;transform:scale(.9) translateY(12px)}18%{opacity:1;transform:scale(1) translateY(0)}78%{opacity:1;transform:scale(1) translateY(0)}100%{opacity:0;transform:scale(1.035) translateY(-5px)}}
	    @keyframes pveHeartBreak{0%{transform:scale(.65);opacity:0}25%{transform:scale(1.18);opacity:1}45%{transform:scale(1) rotate(-4deg)}60%{transform:translateX(-5px) rotate(4deg)}72%{transform:translateX(5px) rotate(-3deg)}100%{transform:scale(.82);opacity:.5}}
    @keyframes pveHeartCrack{0%{opacity:0;transform:scaleY(0) rotate(17deg)}100%{opacity:1;transform:scaleY(1) rotate(17deg)}}
	    @media(max-width:900px){.pve-shop-meta,.pve-shop-main{grid-template-columns:1fr}.pve-shop-meta>span:last-child{display:none}.pve-shop-odds{grid-row:2}.pve-shop-action-buttons{grid-template-columns:1fr 1fr;grid-template-rows:1fr}.pve-review-body section{grid-template-columns:1fr}.pve-review-stats{grid-template-columns:repeat(3,1fr)}.pve-tutorial-panel>main{grid-template-columns:1fr;justify-items:center;padding:20px}.pve-tutorial-panel section{width:100%}.pve-tutorial-icon{width:82px;height:82px;font-size:30px}.pve-tutorial-panel section h2{text-align:center}}
  `;
  document.head.appendChild(style);
}
function installEvents(){
  $('#savePveSlotBtn').onclick=()=>openSlotDialog('save');$('#loadPveSlotBtn').onclick=()=>openSlotDialog('load');$('#openChallengeBtn').onclick=()=>{const hasSave=!!loadRun();$('#continuePveBtn').classList.toggle('hidden',!hasSave);$('#challengeDialog').classList.remove('hidden')};$('#openChallengeArchiveBtn').onclick=()=>{renderArchiveSlots();$('#pveArchiveDialog').classList.remove('hidden')};$('#settleChallengeBtn').onclick=openChallengeSettlement;$('#confirmChallengeSettlementBtn').onclick=confirmChallengeSettlement;$('#exitChallengeBtn').onclick=exitChallenge;$('#confirmExitChallengeBtn').onclick=confirmExitChallenge;$('#restartChallengeBtn').onclick=restartChallengeFromSettlement;$('#finishChallengeToTestBtn').onclick=finishChallengeToTest;$('#confirmPveSlotBtn').onclick=confirmSlotAction;
  $('#pveSlotList').onclick=e=>{const b=e.target.closest('[data-slot-key]');if(b){selectedSlot=b.dataset.slotKey;renderSlotList()}};document.addEventListener('click',e=>{if(e.target.matches('[data-close-pve-modal]'))e.target.closest('.pve-modal').classList.add('hidden')});
  $('#newPveBtn').onclick=()=>$('#newChallengeConfirmDialog').classList.remove('hidden');$('#confirmNewChallengeBtn').onclick=()=>{$('#newChallengeConfirmDialog').classList.add('hidden');$('#pveTutorialPromptDialog').classList.remove('hidden')};$('#continuePveBtn').onclick=()=>{const saved=loadRun();if(saved)activateChallenge(saved);else toast('没有挑战存档')};
  $('#openPveTutorialBtn').onclick=openPveTutorial;
  $('#skipPveTutorialPromptBtn').onclick=beginNewChallengeAfterTutorial;
  $('#challengeTutorialBtn').onclick=()=>{$('#challengeDialog').classList.add('hidden');openPveTutorial(false)};
  $('#pveTutorialReplayBtn').onclick=()=>openPveTutorial(false);
  $('#skipPveTutorialBtn').onclick=()=>{if(pveTutorialLaunchesChallenge)beginNewChallengeAfterTutorial();else $('#pveTutorialDialog').classList.add('hidden')};
  $('#prevPveTutorialBtn').onclick=()=>movePveTutorial(-1);
  $('#nextPveTutorialBtn').onclick=()=>movePveTutorial(1);
  $('#pveTutorialDots').onclick=event=>{const button=event.target.closest('[data-pve-tutorial-step]');if(button){pveTutorialIndex=Number(button.dataset.pveTutorialStep)||0;renderPveTutorial()}};
  $('#buyXpBtn').onclick=buyXp;$('#refreshShopBtn').onclick=()=>refreshShop(false);$('#lockShopBtn').onclick=()=>{run.shopLocked=!run.shopLocked;saveRun();renderPveHud()};$('#pveShopCards').onclick=e=>{const b=e.target.closest('[data-buy-offer]');if(b)buyOffer(Number(b.dataset.buyOffer))};
  $('#pveShopCards').addEventListener('contextmenu',event=>event.preventDefault());$('#pveShopCards').addEventListener('dragstart',event=>event.preventDefault());
  $('#continueRoundResultBtn').onclick=()=>{
    const next=roundResultNext,fx=roundResultRewardFx,dialog=$('#pveRoundResultDialog'),button=$('#continueRoundResultBtn');
    roundResultNext=null;roundResultRewardFx=null;button.disabled=true;
    animateRewardCollection(fx,dialog,()=>{dialog.classList.add('hidden');button.disabled=false;if(next)next()});
  };
  $('#continueLossRewardBtn').onclick=claimPendingLossReward;
  $('#hideLossRewardBtn').onclick=hidePendingLossReward;
  $('#pendingRewardBtn').onclick=showPendingLossReward;
  $('#hideBenchFullRewardBtn').onclick=()=>$('#pveBenchFullRewardDialog').classList.add('hidden');
  $('#reopenPendingRewardBtn').onclick=()=>{$('#pveBenchFullRewardDialog').classList.add('hidden');showPendingLossReward()};
  $('#retryFinishedPveBtn').onclick=retryFinishedChallenge;
  $('#exitFinishedPveBtn').onclick=exitFinishedChallenge;
  $('#openChallengeReviewBtn').onclick=openChallengeReview;
  $('#enterExStagesBtn').onclick=enterExStages;
  $('#replayPhaseThreeBtn').onclick=replayAfterPhaseThree;
  $('#finishPhaseThreeBtn').onclick=finishAfterPhaseThree;
  $('#reviewPhaseThreeBtn').onclick=openChallengeReview;
  $('#retryExStageBtn').onclick=retryExStage;
  $('#reviewExBtn').onclick=openChallengeReview;
  $('#endExChallengeBtn').onclick=endExChallenge;
  const closeChallengeReview=()=>{
    const dialog=$('#pveReviewDialog'),shouldExit=dialog.dataset.exitAfterReview==='true';
    dialog.classList.add('hidden');delete dialog.dataset.exitAfterReview;
    if(shouldExit)leaveChallenge(false);
  };
  $('#closeChallengeReviewBtn').onclick=closeChallengeReview;
  $('#closeChallengeReviewTopBtn').onclick=closeChallengeReview;
  $('#pveReviewBody').onclick=event=>{
    const details=event.target.closest('[data-review-details]');if(details){openReviewDetails(Number(details.dataset.reviewDetails),details.dataset.reviewTeam);return}
  };
  $('#pveReviewDetailModes').onclick=event=>{const button=event.target.closest('[data-review-stat-mode]');if(button&&reviewDetailContext){reviewDetailContext.mode=button.dataset.reviewStatMode;renderReviewDetailBars()}};
  $('#pveArchiveSlots').onclick=event=>{const slot=event.target.closest('[data-archive-slot]');if(slot)openArchiveSlot(Number(slot.dataset.archiveSlot))};
  $('#pveArchiveSaveSlots').onclick=event=>{const slot=event.target.closest('[data-save-archive-slot]');if(slot){selectedArchiveSlot=Number(slot.dataset.saveArchiveSlot);renderArchiveSaveSlots()}};
  $('#confirmArchiveSaveBtn').onclick=confirmArchiveSave;
  $('#skipArchiveSaveBtn').onclick=()=>{pendingCompletedArchive=null;$('#pveArchiveSaveDialog').classList.add('hidden');leaveChallenge(false)};
  $('#pveStageTransition').onclick=hideStageTransition;
}
function rewardDestination(kind){
  if(kind==='gold')return $('#pveGold');
  if(kind==='equipment')return $('#whEquipCards')||$('#whPanel');
  if(kind==='card'){
    const game=$('#game'),rect=game?.getBoundingClientRect();
    if(rect)return{x:rect.left+rect.width*.5,y:rect.top+rect.height*.91};
  }
  return null;
}
function rewardDestinationPoint(kind){
  const destination=rewardDestination(kind);
  if(destination?.x!==undefined)return destination;
  const rect=destination?.getBoundingClientRect();
  return rect?{x:rect.left+rect.width/2,y:rect.top+rect.height/2}:null;
}
function launchRewardParticles(kind,amount,sourcePoint,delay=0){
  const target=rewardDestinationPoint(kind);if(!target)return;
  const count=Math.max(7,Math.min(16,7+(Number(amount)||0)));
  for(let index=0;index<count;index++){
    const particle=document.createElement('i');
    particle.className=`pve-reward-particle ${kind}`;
    const angle=(index/count)*Math.PI*2,spread=18+(index%4)*7;
    const startX=sourcePoint.x+Math.cos(angle)*spread,startY=sourcePoint.y+Math.sin(angle)*spread*.55;
    particle.style.left=`${startX}px`;particle.style.top=`${startY}px`;
    particle.style.setProperty('--reward-x',`${target.x-startX}px`);
    particle.style.setProperty('--reward-y',`${target.y-startY}px`);
    particle.style.setProperty('--reward-delay',`${delay+index*.025}s`);
    document.body.appendChild(particle);
    setTimeout(()=>particle.remove(),1300+(delay*1000));
  }
}
function animateRewardCollection(reward,sourceElement,onComplete){
  const rect=sourceElement?.getBoundingClientRect(),sourcePoint=rect
    ?{x:rect.left+rect.width/2,y:rect.top+rect.height/2}
    :{x:innerWidth/2,y:innerHeight/2};
  const groups=[];
  if((reward?.gold||0)>0)groups.push({kind:'gold',amount:reward.gold});
  if((reward?.equipment||0)>0)groups.push({kind:'equipment',amount:reward.equipment});
  if((reward?.cards||0)>0)groups.push({kind:'card',amount:reward.cards});
  if(!groups.length){onComplete?.();return}
  groups.forEach((group,index)=>launchRewardParticles(group.kind,group.amount,sourcePoint,index*.12));
  if((reward?.gold||0)>0)setTimeout(()=>animateGoldGain(reward.gold),520);
  setTimeout(()=>onComplete?.(),900+Math.max(0,groups.length-1)*120);
}
installStyle();installShopLayoutStyle();installUi();installEvents();
const originalContextMenu=canvas.oncontextmenu;canvas.oncontextmenu=function(event){if(mode!=='challenge')return originalContextMenu?.call(canvas,event);event.preventDefault();if(started)return;const point=canvasPoint(event),unit=unitAt(point.x,point.y);if(unit?.team==='blue')returnChallengeUnitToBench(unit)};
const originalRenderDamageStats=renderDamageStats;renderDamageStats=function(){if(mode!=='challenge'||started||!previousRoundStatUnits)return originalRenderDamageStats();const currentUnits=units;try{units=previousRoundStatUnits;return originalRenderDamageStats()}finally{units=currentUnits}};
const originalStart=startBattle;startBattle=function(){if(mode==='challenge'){if(!startPveBattle())return;previousRoundStatUnits=null;const deployed=units.filter(unit=>unit.alive&&unit.team==='blue'&&!unit.onBench&&!unit.inWarehouse).length;if(deployed===0){started=true;ended=false;startBtn.disabled=true;clearBlueBtn.disabled=true;clearRedBtn.disabled=true;battleState.textContent='我方没有上阵棋子';toast('场上没有棋子，本回合直接判负');setTimeout(()=>finish('红方'),180);renderDamageStats();renderPveHud();return}}originalStart();renderPveHud()};
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
