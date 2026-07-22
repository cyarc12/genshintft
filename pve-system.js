/* PVE挑战模式与关卡编辑器（V2唯一实现口径）
 * 本文件只管理模式、关卡配置和编辑预览，不创建第二套战斗引擎。
 */
(function(){
'use strict';

const APP_MODE={MAIN:'main',CHALLENGE:'challenge',STAGE_EDITOR:'stage_editor'};
const ACTIVE_WINDOW={NONE:'none',CHALLENGE:'challenge',STAGE_EDITOR:'stage_editor'};
const STAGE_TYPE={NORMAL:'normal',SPECIAL:'special',BOSS:'boss',FINAL_BOSS:'final_boss'};
const FAILURE_POLICY={ADVANCE:'advance',RETRY:'retry',END_RUN:'end_run'};
const REWARD_MODE={NONE:'none',FIXED:'fixed',RANDOM:'random',CHOICE:'choice'};
const DEFAULT_STAGE_ORDER=['1-1','1-2','1-3','1-4','1-5','2-1','2-2','2-3','2-4','3-1','3-2','3-3'];
const STAGE_EDITOR_STORAGE_KEY='element-auto-chess-stage-editor-v1';
const PVE_STORAGE_KEY='element-auto-chess-pve-run-v1';

let appMode=APP_MODE.MAIN;
let activeWindow=ACTIVE_WINDOW.NONE;
let mainInterfaceSnapshot=null;
let pendingEditorTemplateId=null;
let editorPreviewCanvas=null;
let editorPreviewContext=null;
let editorImportInput=null;
let editorTemplateDrag=null;

const clone=value=>JSON.parse(JSON.stringify(value));
const clamp=(value,min,max)=>Math.max(min,Math.min(max,Number(value)));
const escapeHtml=value=>String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
const byId=id=>document.getElementById(id);

function stageTemplateIdAt(index){
  const names=Array.isArray(PIECE_ORDER)?PIECE_ORDER:[];
  const name=names[index%Math.max(1,names.length)];
  return PIECE_CONFIG[name]?.templateId||'';
}
function createEnemy(index=0,row=1,col=3){
  return{editorId:`enemy-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,templateId:stageTemplateIdAt(index),star:1,row,col,statMultiplier:1,equipmentIds:[],isBoss:false};
}
function emptyReward(mode=REWARD_MODE.NONE){return{mode,choiceCount:mode===REWARD_MODE.CHOICE?3:1,pool:[]}}
function createStage(id='custom-1',type=STAGE_TYPE.NORMAL,index=0){
  const phase=clamp(parseInt(String(id).split('-')[0])||1,1,3);
  const order=Math.max(1,index+1);
  const base={version:1,id,phase,order,name:`关卡 ${id}`,description:'',type,timeLimit:45,playerUnitLimit:3,failurePolicy:type===STAGE_TYPE.BOSS||type===STAGE_TYPE.FINAL_BOSS?FAILURE_POLICY.RETRY:FAILURE_POLICY.ADVANCE,fixedClearGold:0,bossBonusGold:0};
  if(type===STAGE_TYPE.SPECIAL){
    base.playerUnitLimit=4;
    base.variants=['easy','normal','hard'].map((variantId,variantIndex)=>({id:variantId,name:['简单','普通','困难'][variantIndex],enemies:[createEnemy(index+variantIndex,1,2+variantIndex)],clearReward:emptyReward(REWARD_MODE.RANDOM)}));
  }else{
    base.enemies=[createEnemy(index,1,3)];
    base.enemies[0].isBoss=type===STAGE_TYPE.BOSS||type===STAGE_TYPE.FINAL_BOSS;
    base.clearReward=emptyReward(REWARD_MODE.CHOICE);
  }
  return base;
}
function createDefaultStageSet(){
  const types={"1-4":STAGE_TYPE.SPECIAL,"1-5":STAGE_TYPE.BOSS,"2-3":STAGE_TYPE.SPECIAL,"2-4":STAGE_TYPE.BOSS,"3-3":STAGE_TYPE.FINAL_BOSS};
  const stages=DEFAULT_STAGE_ORDER.map((id,index)=>createStage(id,types[id]||STAGE_TYPE.NORMAL,index));
  stages.forEach((stage,index)=>{stage.phase=parseInt(stage.id[0]);stage.order=index+1;stage.name=stage.type===STAGE_TYPE.SPECIAL?`${stage.phase}阶段特殊挑战`:stage.type===STAGE_TYPE.BOSS?`${stage.phase}阶段首领`:stage.type===STAGE_TYPE.FINAL_BOSS?'终局首领':`${stage.phase}阶段遭遇 ${stage.id}`});
  return{version:1,name:'默认PVE关卡组',stageOrder:[...DEFAULT_STAGE_ORDER],stages};
}
function createEmptyStageSet(){return{version:1,name:'默认PVE关卡组',stageOrder:[...DEFAULT_STAGE_ORDER],stages:[]}}
function currentEnemies(stage=stageEditor.draft){
  if(stage?.type!==STAGE_TYPE.SPECIAL)return stage?.enemies||[];
  return stage.variants?.find(variant=>variant.id===stageEditor.selectedVariantId)?.enemies||[];
}
function currentReward(stage=stageEditor.draft){
  if(stage?.type!==STAGE_TYPE.SPECIAL)return stage?.clearReward;
  return stage.variants?.find(variant=>variant.id===stageEditor.selectedVariantId)?.clearReward;
}
function pieceNameFromTemplateId(templateId){return Object.keys(PIECE_CONFIG).find(name=>PIECE_CONFIG[name]?.templateId===templateId)||templateId}
function templateExists(templateId){return Object.values(PIECE_CONFIG).some(config=>config.templateId===templateId)}
function standardEquipmentIds(){return Object.keys(EQUIPMENT_CONFIG||{})}

let stageEditor={selectedStageId:null,selectedEnemyEditorId:null,selectedVariantId:'easy',dirty:false,draft:createStage('1-1'),stageSet:createEmptyStageSet()};

function validateEnemyList(enemies,label='敌人'){
  const errors=[];
  if(!Array.isArray(enemies)||!enemies.length)return[`${label}不能为空`];
  const cells=new Set();
  for(const enemy of enemies){
    if(!enemy?.editorId)errors.push(`${label}缺少editorId`);
    if(!templateExists(enemy?.templateId))errors.push(`${label}${enemy?.editorId||''}角色ID不存在`);
    if(![1,2,3].includes(Number(enemy?.star)))errors.push(`${label}${enemy?.editorId||''}星级必须为1～3`);
    if(!Number.isInteger(enemy?.row)||enemy.row<0||enemy.row>3||!Number.isInteger(enemy?.col)||enemy.col<0||enemy.col>6)errors.push(`${label}${enemy?.editorId||''}只能位于红方0～3行、0～6列`);
    const cell=`${enemy?.row}:${enemy?.col}`;
    if(cells.has(cell))errors.push(`${label}${enemy?.editorId||''}与其他敌人占用同一格`);cells.add(cell);
    const multiplier=Number(enemy?.statMultiplier);
    if(!Number.isFinite(multiplier)||multiplier<.1||multiplier>5)errors.push(`${label}${enemy?.editorId||''}属性倍率必须为0.1～5`);
    if(!Array.isArray(enemy?.equipmentIds)||enemy.equipmentIds.length>3)errors.push(`${label}${enemy?.editorId||''}装备最多3件`);
    const ids=enemy?.equipmentIds||[];
    if(new Set(ids).size!==ids.length)errors.push(`${label}${enemy?.editorId||''}不能装备同名装备`);
    for(const id of ids)if(!EQUIPMENT_CONFIG[id]||CONSUMABLE_CONFIG?.[id])errors.push(`${label}${enemy?.editorId||''}包含非法装备 ${id}`);
  }
  return errors;
}
function validateReward(reward,label='奖励'){
  if(!reward||!Object.values(REWARD_MODE).includes(reward.mode))return[`${label}配置不合法`];
  if(reward._jsonError)return[`${label}池JSON格式错误`];
  if(!Number.isInteger(Number(reward.choiceCount))||Number(reward.choiceCount)<1)return[`${label}选择数量必须大于0`];
  if(!Array.isArray(reward.pool))return[`${label}池必须是数组`];
  return[];
}
function validateStageConfig(stage,stageSet=stageEditor.stageSet){
  const errors=[];
  if(!stage?.id?.trim())errors.push('关卡ID不能为空');
  const duplicate=stageSet?.stages?.some(item=>item.id===stage.id&&item!==stage&&item.id!==stageEditor.selectedStageId);
  if(duplicate)errors.push(`关卡ID ${stage.id} 已存在`);
  if(![1,2,3].includes(Number(stage?.phase)))errors.push('所属阶段只能为1、2、3');
  if(!Number.isInteger(Number(stage?.order))||Number(stage.order)<1)errors.push('推进顺序必须为正整数');
  if(!Object.values(STAGE_TYPE).includes(stage?.type))errors.push('关卡类型不合法');
  if(Number(stage?.timeLimit)<=0)errors.push('战斗时间必须大于0');
  if(Number(stage?.playerUnitLimit)<=0)errors.push('玩家上阵限制必须大于0');
  if(!Object.values(FAILURE_POLICY).includes(stage?.failurePolicy))errors.push('失败方式不合法');
  if(stage?.type===STAGE_TYPE.SPECIAL){
    const ids=(stage.variants||[]).map(item=>item.id);
    for(const id of ['easy','normal','hard'])if(!ids.includes(id))errors.push(`特殊关缺少${id}配置`);
    for(const variant of stage.variants||[]){errors.push(...validateEnemyList(variant.enemies,`${variant.name||variant.id}难度敌人`));errors.push(...validateReward(variant.clearReward,`${variant.name||variant.id}难度奖励`))}
  }else{errors.push(...validateEnemyList(stage?.enemies));errors.push(...validateReward(stage?.clearReward))}
  return{valid:errors.length===0,errors};
}
function validateStageSet(stageSet){
  const errors=[];
  if(stageSet?.version!==1)errors.push('关卡组version必须为1');
  if(!Array.isArray(stageSet?.stageOrder))errors.push('stageOrder必须是数组');
  if(!Array.isArray(stageSet?.stages))errors.push('stages必须是数组');
  const ids=new Set();
  for(const stage of stageSet?.stages||[]){if(ids.has(stage.id))errors.push(`关卡ID ${stage.id} 重复`);ids.add(stage.id);errors.push(...validateStageConfig(stage,{stages:[]} ).errors.map(error=>`${stage.id}：${error}`))}
  for(const id of stageSet?.stageOrder||[])if(!ids.has(id))errors.push(`推进顺序中的关卡 ${id} 不存在`);
  return{valid:errors.length===0,errors};
}

function loadStageEditorData(){
  let loaded=null;
  try{loaded=JSON.parse(localStorage.getItem(STAGE_EDITOR_STORAGE_KEY)||'null')}catch{}
  const checked=loaded&&validateStageSet(loaded);
  stageEditor.stageSet=checked?.valid?loaded:createDefaultStageSet();
  const first=stageEditor.stageSet.stageOrder.find(id=>stageEditor.stageSet.stages.some(stage=>stage.id===id))||stageEditor.stageSet.stages[0]?.id;
  loadStageDraft(first);
}
function persistStageSet(){localStorage.setItem(STAGE_EDITOR_STORAGE_KEY,JSON.stringify(stageEditor.stageSet))}
function loadStageDraft(stageId){
  const source=stageEditor.stageSet.stages.find(stage=>stage.id===stageId);
  if(!source)return false;
  stageEditor.selectedStageId=source.id;stageEditor.selectedEnemyEditorId=null;stageEditor.selectedVariantId='easy';stageEditor.draft=clone(source);stageEditor.dirty=false;
  renderStageEditor();renderStagePreview();return true;
}
function saveStageDraft(){
  syncStageFormToDraft();
  const validation=validateStageConfig(stageEditor.draft);
  if(!validation.valid){showModeToast(validation.errors.join('\n'),'error');return false}
  const copy=clone(stageEditor.draft),index=stageEditor.stageSet.stages.findIndex(stage=>stage.id===stageEditor.selectedStageId);
  if(index>=0)stageEditor.stageSet.stages[index]=copy;else stageEditor.stageSet.stages.push(copy);
  if(stageEditor.selectedStageId!==copy.id){const orderIndex=stageEditor.stageSet.stageOrder.indexOf(stageEditor.selectedStageId);if(orderIndex>=0)stageEditor.stageSet.stageOrder[orderIndex]=copy.id}
  if(!stageEditor.stageSet.stageOrder.includes(copy.id))stageEditor.stageSet.stageOrder.push(copy.id);
  stageEditor.selectedStageId=copy.id;stageEditor.dirty=false;persistStageSet();renderStageEditor();showModeToast('关卡已保存');return true;
}
function markEditorDirty(){stageEditor.dirty=true;renderEditorTitleState()}

function formationSnapshotSafe(){try{return clone(formationSnapshot())}catch{return[]}}
function saveMainInterfaceSnapshot(){if(mainInterfaceSnapshot)return;mainInterfaceSnapshot={formation:formationSnapshotSafe(),warehouseState:clone(whState)}}
function restoreMainInterface(){
  if(mainInterfaceSnapshot){Object.assign(whState,mainInterfaceSnapshot.warehouseState||{});selectedSpawnStar=whState.star||1;enterPreparation(mainInterfaceSnapshot.formation||[]);mainInterfaceSnapshot=null}else enterPreparation();
  renderWhCards();document.querySelector('#whPanel')?.classList.remove('hidden');
}
function clearEditorRuntime(){units=[];summons=[];selectedUnit=null;hideUnitInspect();updateAliveCounts();renderDamageStats()}

function closeAllModeWindows(){byId('challengeWindow')?.classList.add('hidden');byId('stageEditorWindow')?.classList.add('hidden');byId('modeBackdrop')?.classList.add('hidden')}
function openModeWindow(type){closeAllModeWindows();activeWindow=type;if(type===ACTIVE_WINDOW.CHALLENGE){renderChallengeWindow();byId('challengeWindow').classList.remove('hidden');byId('modeBackdrop').classList.remove('hidden')}if(type===ACTIVE_WINDOW.STAGE_EDITOR){byId('stageEditorWindow').classList.remove('hidden')}}
function closeModeWindow(){closeAllModeWindows();activeWindow=ACTIVE_WINDOW.NONE}
function updateModeButtons(){byId('openChallengeWindow')?.classList.toggle('active',appMode===APP_MODE.CHALLENGE);byId('openStageEditorWindow')?.classList.toggle('active',appMode===APP_MODE.STAGE_EDITOR)}

function activateStageEditorMode(){
  if(appMode===APP_MODE.CHALLENGE&&!confirm('退出当前挑战并进入编辑模式？'))return;
  if(appMode===APP_MODE.MAIN)saveMainInterfaceSnapshot();
  appMode=APP_MODE.STAGE_EDITOR;activeWindow=ACTIVE_WINDOW.STAGE_EDITOR;enterPreparation([]);clearEditorRuntime();loadStageEditorData();
  document.querySelector('.wh-title').textContent='关卡敌人模板';whState.team='red';whState.cost='all';whState.tab='pieces';switchWarehouseTab('pieces');renderWhCards();updateModeButtons();renderStagePreview();
  setTimeout(()=>{if(appMode===APP_MODE.STAGE_EDITOR)openModeWindow(ACTIVE_WINDOW.STAGE_EDITOR)},100);
}
function exitStageEditorMode(force=false){
  if(!force&&stageEditor.dirty){const save=confirm('当前关卡有未保存修改。\n确定：保存并退出；取消：继续编辑。');if(!save)return;if(!saveStageDraft())return}
  pendingEditorTemplateId=null;appMode=APP_MODE.MAIN;activeWindow=ACTIVE_WINDOW.NONE;closeAllModeWindows();document.querySelector('.wh-title').textContent='测试仓库';restoreMainInterface();hideStagePreview();updateModeButtons();
}

function createEmptyPveRun(){return{version:1,state:'setup',gold:20,level:3,xp:0,populationLimit:3,lives:2,lossCount:0,round:0,winStreak:0,freeRefreshes:3,shopLocked:false,shopOffers:[],currentStageId:'1-1',selectedSpecialVariantId:null,completedStageIds:[],claimedPhaseStartRewards:[],openingResourcesClaimed:false,firstLossCompensationClaimed:false,cardPool:{},roster:[],equipmentInventory:[],consumableInventory:[],formation:[],currentBattleId:null,lastSettledBattleId:null,stageSetSnapshot:clone(stageEditor.stageSet?.stages?.length?stageEditor.stageSet:createDefaultStageSet()),rewardHistory:[]}}
function loadPveRun(){try{return JSON.parse(localStorage.getItem(PVE_STORAGE_KEY)||'null')}catch{return null}}
function savePveRun(run){localStorage.setItem(PVE_STORAGE_KEY,JSON.stringify(run))}
function activateChallengeMode(run){
  if(appMode===APP_MODE.STAGE_EDITOR){showModeToast('请先退出编辑模式');return}
  if(appMode===APP_MODE.MAIN)saveMainInterfaceSnapshot();
  appMode=APP_MODE.CHALLENGE;activeWindow=ACTIVE_WINDOW.NONE;window.pveRun=run;savePveRun(run);closeAllModeWindows();document.querySelector('.wh-title').textContent='挑战库存';updateModeButtons();showModeToast('挑战存档已载入；经济与战斗推进将在后续阶段接入')
}
function exitChallengeMode(){if(appMode!==APP_MODE.CHALLENGE){closeModeWindow();return}if(!confirm('保存进度并退出挑战模式？'))return;if(window.pveRun)savePveRun(window.pveRun);appMode=APP_MODE.MAIN;activeWindow=ACTIVE_WINDOW.NONE;closeAllModeWindows();document.querySelector('.wh-title').textContent='测试仓库';restoreMainInterface();updateModeButtons()}

function renderChallengeWindow(){
  const run=loadPveRun(),content=byId('challengeContent');if(!content)return;
  if(!run){content.innerHTML=`<p class="mode-muted">尚无挑战存档。</p><div class="mode-actions-row"><button class="btn primary" id="newChallengeBtn">开始新挑战</button><button class="btn" data-close-mode>关闭</button></div>`}
  else content.innerHTML=`<div class="challenge-stats"><span>关卡<b>${escapeHtml(run.currentStageId)}</b></span><span>等级<b>Lv.${run.level}</b></span><span>经验<b>${run.xp}</b></span><span>金币<b>${run.gold}</b></span><span>失败机会<b>${run.lives}</b></span><span>连胜<b>${run.winStreak}</b></span></div><div class="mode-actions-row"><button class="btn primary" id="continueChallengeBtn">继续挑战</button><button class="btn" id="restartChallengeBtn">重新开始</button><button class="btn" id="exitChallengeBtn">退出挑战模式</button><button class="btn" data-close-mode>关闭</button></div>`;
}

function editorField(id,label,type='text',attrs=''){return`<label class="editor-field"><span>${label}</span><input id="${id}" type="${type}" ${attrs}></label>`}
function renderStageEditor(){
  const list=byId('stageList'),form=byId('stageBaseForm'),rewardForm=byId('stageRewardForm'),variantBar=byId('variantBar');if(!list||!form)return;
  list.innerHTML=stageEditor.stageSet.stageOrder.map(id=>stageEditor.stageSet.stages.find(stage=>stage.id===id)).filter(Boolean).map(stage=>`<button class="stage-list-item ${stage.id===stageEditor.selectedStageId?'active':''}" data-stage-id="${escapeHtml(stage.id)}"><b>${escapeHtml(stage.id)} · ${escapeHtml(stage.name)}</b><small>阶段${stage.phase} · ${stageTypeName(stage.type)} · ${enemyCount(stage)}名敌人</small></button>`).join('');
  const stage=stageEditor.draft;
  form.innerHTML=`${editorField('stageIdInput','关卡ID')} ${editorField('stageNameInput','名称')}<label class="editor-field wide"><span>描述</span><textarea id="stageDescriptionInput"></textarea></label>${editorField('stagePhaseInput','阶段','number','min="1" max="3"')}${editorField('stageOrderInput','顺序','number','min="1"')}${selectField('stageTypeInput','类型',[[STAGE_TYPE.NORMAL,'普通'],[STAGE_TYPE.SPECIAL,'特殊'],[STAGE_TYPE.BOSS,'Boss'],[STAGE_TYPE.FINAL_BOSS,'终局Boss']])}${editorField('stageTimeInput','时间（秒）','number','min="1"')}${editorField('stageLimitInput','上阵上限','number','min="1"')}${selectField('stageFailureInput','失败方式',[[FAILURE_POLICY.ADVANCE,'推进'],[FAILURE_POLICY.RETRY,'重试'],[FAILURE_POLICY.END_RUN,'结束挑战']])}${editorField('stageGoldInput','通关金币','number','min="0"')}${editorField('stageBossGoldInput','Boss金币','number','min="0"')}`;
  setValue('stageIdInput',stage.id);setValue('stageNameInput',stage.name);setValue('stageDescriptionInput',stage.description);setValue('stagePhaseInput',stage.phase);setValue('stageOrderInput',stage.order);setValue('stageTypeInput',stage.type);setValue('stageTimeInput',stage.timeLimit);setValue('stageLimitInput',stage.playerUnitLimit);setValue('stageFailureInput',stage.failurePolicy);setValue('stageGoldInput',stage.fixedClearGold);setValue('stageBossGoldInput',stage.bossBonusGold);
  const reward=currentReward(stage)||emptyReward();
  rewardForm.innerHTML=`${selectField('rewardModeInput','奖励方式',[[REWARD_MODE.NONE,'无'],[REWARD_MODE.FIXED,'固定'],[REWARD_MODE.RANDOM,'随机'],[REWARD_MODE.CHOICE,'三选一']])}${editorField('rewardChoiceInput','候选数量','number','min="1"')}<label class="editor-field wide"><span>奖励池 JSON</span><textarea id="rewardPoolInput" spellcheck="false"></textarea></label>`;
  setValue('rewardModeInput',reward.mode);setValue('rewardChoiceInput',reward.choiceCount);setValue('rewardPoolInput',JSON.stringify(reward.pool||[],null,2));
  variantBar.hidden=stage.type!==STAGE_TYPE.SPECIAL;variantBar.querySelectorAll('[data-variant]').forEach(button=>button.classList.toggle('active',button.dataset.variant===stageEditor.selectedVariantId));
  renderEnemyEditor();renderEditorTitleState();
}
function setValue(id,value){const element=byId(id);if(element)element.value=value??''}
function selectField(id,label,items){return`<label class="editor-field"><span>${label}</span><select id="${id}">${items.map(([value,text])=>`<option value="${value}">${text}</option>`).join('')}</select></label>`}
function stageTypeName(type){return({normal:'普通',special:'特殊',boss:'Boss',final_boss:'终局Boss'})[type]||type}
function enemyCount(stage){return stage.type===STAGE_TYPE.SPECIAL?(stage.variants||[]).reduce((sum,variant)=>sum+(variant.enemies?.length||0),0):(stage.enemies?.length||0)}
function syncStageFormToDraft(){
  const stage=stageEditor.draft;if(!byId('stageIdInput'))return;
  stage.id=byId('stageIdInput').value.trim();stage.name=byId('stageNameInput').value.trim();stage.description=byId('stageDescriptionInput').value;stage.phase=Number(byId('stagePhaseInput').value);stage.order=Number(byId('stageOrderInput').value);stage.timeLimit=Number(byId('stageTimeInput').value);stage.playerUnitLimit=Number(byId('stageLimitInput').value);stage.failurePolicy=byId('stageFailureInput').value;stage.fixedClearGold=Math.max(0,Number(byId('stageGoldInput').value)||0);stage.bossBonusGold=Math.max(0,Number(byId('stageBossGoldInput').value)||0);
  const nextType=byId('stageTypeInput').value;if(stage.type!==nextType){stage.type=nextType;if(nextType===STAGE_TYPE.SPECIAL&&!stage.variants)stage.variants=['easy','normal','hard'].map((id,index)=>({id,name:['简单','普通','困难'][index],enemies:[],clearReward:emptyReward(REWARD_MODE.RANDOM)}));if(nextType!==STAGE_TYPE.SPECIAL&&!stage.enemies)stage.enemies=[]}
  const reward=currentReward(stage);if(reward&&byId('rewardModeInput')){reward.mode=byId('rewardModeInput').value;reward.choiceCount=Math.max(1,Number(byId('rewardChoiceInput').value)||1);try{reward.pool=JSON.parse(byId('rewardPoolInput').value||'[]');delete reward._jsonError}catch{reward._jsonError=true}}
}
function renderEditorTitleState(){const state=byId('editorDirtyState');if(state)state.textContent=stageEditor.dirty?'● 未保存':'已保存'}
function renderEnemyEditor(){
  const list=byId('enemyList'),panel=byId('enemySettings');if(!list||!panel)return;const enemies=currentEnemies();
  list.innerHTML=enemies.length?enemies.map(enemy=>`<button class="enemy-list-item ${enemy.editorId===stageEditor.selectedEnemyEditorId?'active':''}" data-enemy-id="${enemy.editorId}"><b>${escapeHtml(pieceNameFromTemplateId(enemy.templateId))} ${enemy.star}★</b><small>(${enemy.row}, ${enemy.col}) · ×${enemy.statMultiplier}${enemy.isBoss?' · Boss':''}</small></button>`).join(''):'<p class="mode-muted">尚无敌人。先点击仓库角色，再点击红方棋盘格放置。</p>';
  const enemy=enemies.find(item=>item.editorId===stageEditor.selectedEnemyEditorId);if(!enemy){panel.innerHTML='<p class="mode-muted">选择敌人后可设置星级、倍率和装备。</p>';return}
  const cfg=Object.entries(EQUIPMENT_CONFIG).map(([id,item])=>`<option value="${id}">${escapeHtml(item.name)}</option>`).join('');
  panel.innerHTML=`<h4>${escapeHtml(pieceNameFromTemplateId(enemy.templateId))}</h4><div class="enemy-setting-grid">${selectField('enemyStarInput','星级',[[1,'1★'],[2,'2★'],[3,'3★']])}${editorField('enemyMultiplierInput','属性倍率','number','min="0.1" max="5" step="0.1"')}${editorField('enemyRowInput','行','number','min="0" max="3"')}${editorField('enemyColInput','列','number','min="0" max="6"')}<label class="editor-check"><input id="enemyBossInput" type="checkbox"> Boss标记</label></div><div class="enemy-equipment"><span>装备 ${enemy.equipmentIds.length}/3</span><div>${enemy.equipmentIds.map(id=>`<button data-remove-enemy-equip="${id}" title="卸下">${escapeHtml(EQUIPMENT_CONFIG[id]?.name||id)} ×</button>`).join('')||'无'}</div><select id="enemyEquipmentSelect"><option value="">添加装备…</option>${cfg}</select></div><button class="btn danger small" id="deleteEnemyBtn">删除敌人</button>`;
  setValue('enemyStarInput',enemy.star);setValue('enemyMultiplierInput',enemy.statMultiplier);setValue('enemyRowInput',enemy.row);setValue('enemyColInput',enemy.col);byId('enemyBossInput').checked=!!enemy.isBoss;
}
function syncSelectedEnemy(){
  const enemy=currentEnemies().find(item=>item.editorId===stageEditor.selectedEnemyEditorId);if(!enemy||!byId('enemyStarInput'))return;
  enemy.star=Number(byId('enemyStarInput').value);enemy.statMultiplier=clamp(byId('enemyMultiplierInput').value,.1,5);enemy.row=Math.round(clamp(byId('enemyRowInput').value,0,3));enemy.col=Math.round(clamp(byId('enemyColInput').value,0,6));enemy.isBoss=byId('enemyBossInput').checked;markEditorDirty();renderEnemyEditor();renderStagePreview();
}
function addEnemyAt(row,col){
  if(!pendingEditorTemplateId){showModeToast('请先在仓库选择一个角色模板');return}
  const enemies=currentEnemies();const occupied=enemies.find(enemy=>enemy.row===row&&enemy.col===col);if(occupied){stageEditor.selectedEnemyEditorId=occupied.editorId;renderEnemyEditor();return}
  const enemy=createEnemy(0,row,col);enemy.templateId=pendingEditorTemplateId;enemies.push(enemy);stageEditor.selectedEnemyEditorId=enemy.editorId;markEditorDirty();renderEnemyEditor();renderStagePreview();showModeToast(`${pieceNameFromTemplateId(enemy.templateId)} 已加入关卡`);
}
function beginEditorTemplatePointer(event,card){
  const name=card.dataset.whName;
  if(name==='木桩'){showModeToast('木桩不能作为正式关卡敌人','error');return}
  const templateId=PIECE_CONFIG[name]?.templateId;if(!templateId)return;
  editorTemplateDrag={name,templateId,startX:event.clientX,startY:event.clientY,x:event.clientX,y:event.clientY,moved:false};
  pendingEditorTemplateId=templateId;
  document.querySelectorAll('.wh-card').forEach(item=>item.classList.toggle('active-card',item===card));
}
function updateEditorTemplateDrag(event){
  if(!editorTemplateDrag||appMode!==APP_MODE.STAGE_EDITOR)return;
  editorTemplateDrag.x=event.clientX;editorTemplateDrag.y=event.clientY;
  if(!editorTemplateDrag.moved&&Math.hypot(event.clientX-editorTemplateDrag.startX,event.clientY-editorTemplateDrag.startY)>=6){
    editorTemplateDrag.moved=true;
    const config=PIECE_CONFIG[editorTemplateDrag.name];showPieceDragGhost({name:editorTemplateDrag.name,element:config.element,star:1,isDummy:false},event.clientX,event.clientY);
  }
  if(editorTemplateDrag.moved){event.preventDefault();movePieceDragGhost(event.clientX,event.clientY)}
}
function finishEditorTemplateDrag(event){
  if(!editorTemplateDrag)return;
  const drag=editorTemplateDrag;editorTemplateDrag=null;hidePieceDragGhost();
  if(!drag.moved){showModeToast(`已选择 ${drag.name}，点击红方棋盘格放置`);return}
  const rect=canvas.getBoundingClientRect();
  if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom){showModeToast('未放到棋盘，已取消');return}
  const point=canvasPoint(event),cell=cellAt(point.x,point.y);
  if(!cell||cell.row>3){showModeToast('敌人只能放在红方0～3行','error');return}
  addEnemyAt(cell.row,cell.col);
}

function ensurePreviewCanvas(){
  if(editorPreviewCanvas)return;const arenaInner=document.querySelector('.arena-inner');editorPreviewCanvas=document.createElement('canvas');editorPreviewCanvas.id='stagePreviewOverlay';editorPreviewCanvas.width=canvas.width;editorPreviewCanvas.height=canvas.height;arenaInner.appendChild(editorPreviewCanvas);editorPreviewContext=editorPreviewCanvas.getContext('2d');positionPreviewCanvas();window.addEventListener('resize',positionPreviewCanvas);
}
function positionPreviewCanvas(){if(!editorPreviewCanvas)return;editorPreviewCanvas.style.left=canvas.offsetLeft+'px';editorPreviewCanvas.style.top=canvas.offsetTop+'px';editorPreviewCanvas.style.width=canvas.offsetWidth+'px';editorPreviewCanvas.style.height=canvas.offsetHeight+'px'}
function renderStagePreview(){
  ensurePreviewCanvas();positionPreviewCanvas();const c=editorPreviewContext;c.clearRect(0,0,editorPreviewCanvas.width,editorPreviewCanvas.height);if(appMode!==APP_MODE.STAGE_EDITOR){editorPreviewCanvas.hidden=true;return}editorPreviewCanvas.hidden=false;
  for(const enemy of currentEnemies()){const p=hexPos(enemy.row,enemy.col),name=pieceNameFromTemplateId(enemy.templateId),image=avatarImages[name];c.save();c.beginPath();c.arc(p.x,p.y,29,0,Math.PI*2);c.fillStyle=enemy.editorId===stageEditor.selectedEnemyEditorId?'rgba(242,198,109,.35)':'rgba(255,102,115,.20)';c.fill();c.lineWidth=enemy.isBoss?4:2;c.strokeStyle=enemy.isBoss?'#f2c66d':'#ff6673';c.stroke();c.clip();if(image?.complete)c.drawImage(image,p.x-25,p.y-25,50,50);c.restore();c.fillStyle='#fff';c.font='bold 11px Microsoft YaHei';c.textAlign='center';c.fillText(`${enemy.star}★ ×${enemy.statMultiplier}`,p.x,p.y+40)}
}
function hideStagePreview(){if(editorPreviewCanvas){editorPreviewContext.clearRect(0,0,editorPreviewCanvas.width,editorPreviewCanvas.height);editorPreviewCanvas.hidden=true}}

function exportStageSet(){
  if(stageEditor.dirty&&!saveStageDraft())return;const blob=new Blob([JSON.stringify(stageEditor.stageSet,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),anchor=document.createElement('a');anchor.href=url;anchor.download=`${stageEditor.stageSet.name||'pve-stages'}.json`;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),0);
}
function importStageSet(file){
  if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const data=JSON.parse(reader.result),validation=validateStageSet(data);if(!validation.valid)throw new Error(validation.errors.join('\n'));if(!confirm(`导入关卡组“${data.name}”并覆盖当前编辑器内容？`))return;stageEditor.stageSet=clone(data);persistStageSet();loadStageDraft(data.stageOrder[0]);showModeToast('关卡组已导入')}catch(error){showModeToast(error.message,'error')}};reader.readAsText(file,'utf-8');
}
function duplicateStage(){syncStageFormToDraft();const copy=clone(stageEditor.draft),base=copy.id;let number=1;while(stageEditor.stageSet.stages.some(stage=>stage.id===`${base}-copy${number}`))number++;copy.id=`${base}-copy${number}`;copy.name=`${copy.name} 副本`;copy.order=stageEditor.stageSet.stageOrder.length+1;for(const enemy of allStageEnemies(copy))enemy.editorId=`enemy-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;stageEditor.stageSet.stages.push(copy);stageEditor.stageSet.stageOrder.push(copy.id);persistStageSet();loadStageDraft(copy.id);stageEditor.dirty=true;renderStageEditor();showModeToast('已创建副本，请保存')}
function allStageEnemies(stage){return stage.type===STAGE_TYPE.SPECIAL?(stage.variants||[]).flatMap(variant=>variant.enemies||[]):stage.enemies||[]}
function deleteStage(){if(stageEditor.stageSet.stages.length<=1){showModeToast('至少保留一个关卡','error');return}if(!confirm(`删除关卡 ${stageEditor.draft.id}？`))return;const id=stageEditor.selectedStageId;stageEditor.stageSet.stages=stageEditor.stageSet.stages.filter(stage=>stage.id!==id);stageEditor.stageSet.stageOrder=stageEditor.stageSet.stageOrder.filter(item=>item!==id);persistStageSet();loadStageDraft(stageEditor.stageSet.stageOrder[0]);showModeToast('关卡已删除')}
function newStage(){const stage=createStage(`custom-${Date.now().toString().slice(-5)}`,STAGE_TYPE.NORMAL,stageEditor.stageSet.stages.length);stage.enemies=[];stageEditor.selectedStageId=null;stageEditor.selectedEnemyEditorId=null;stageEditor.draft=stage;stageEditor.dirty=true;renderStageEditor();renderStagePreview()}

function showModeToast(message,type='ok'){const toast=byId('modeToast');if(!toast)return;toast.textContent=message;toast.className=`mode-toast show ${type}`;clearTimeout(showModeToast.timer);showModeToast.timer=setTimeout(()=>toast.classList.remove('show'),2800)}

function installUi(){
  const actions=document.querySelector('.actions');actions.insertAdjacentHTML('beforeend','<span class="mode-action-divider"></span><button class="btn" id="openChallengeWindow">挑战模式</button><button class="btn" id="openStageEditorWindow">编辑模式</button>');
  const arena=document.querySelector('.arena');arena.insertAdjacentHTML('beforeend',`<div id="modeBackdrop" class="mode-backdrop hidden"></div><div id="modeWindowLayer" class="mode-window-layer"><section id="challengeWindow" class="mode-window challenge-window hidden"><header><h2>挑战模式</h2><button class="mode-close" data-close-mode>×</button></header><div id="challengeContent" class="mode-window-body"></div></section><section id="stageEditorWindow" class="mode-window stage-editor-window hidden"><header><div><h2>编辑模式</h2><small id="editorDirtyState">已保存</small></div><div class="window-head-actions"><button id="collapseEditorBtn">折叠</button><button id="exitEditorBtn">退出</button></div></header><div class="editor-content"><div class="editor-toolbar"><button id="newStageBtn">新建</button><button id="saveStageBtn">保存</button><button id="duplicateStageBtn">复制</button><button id="deleteStageBtn">删除</button><button id="importStagesBtn">导入</button><button id="exportStagesBtn">导出</button><button id="testStageBtn" disabled title="将在阶段E接入现有战斗引擎">测试关卡</button></div><div class="editor-scroll"><section><h3>关卡列表</h3><div id="stageList" class="stage-list"></div></section><section><h3>基础设置</h3><div id="stageBaseForm" class="editor-form"></div><div id="variantBar" class="variant-bar" hidden><span>编辑难度</span><button data-variant="easy" class="active">简单</button><button data-variant="normal">普通</button><button data-variant="hard">困难</button></div></section><section><h3>奖励配置</h3><div id="stageRewardForm" class="editor-form"></div></section><section><h3>敌人配置</h3><p class="editor-help">点击或拖动仓库角色到红方0～3行；预览不会写入正式战斗单位。</p><div id="enemyList" class="enemy-list"></div><div id="enemySettings" class="enemy-settings"></div></section></div></div></section></div><input id="stageImportInput" type="file" accept="application/json,.json" hidden><div id="modeToast" class="mode-toast"></div>`);
  editorImportInput=byId('stageImportInput');ensurePreviewCanvas();
}
function installStyle(){
  const style=document.createElement('style');style.textContent=`
.mode-action-divider{width:1px;height:28px;background:#34445c;align-self:center;margin:0 2px}.mode-window-layer{position:absolute;inset:0;z-index:1200;pointer-events:none}.mode-window{position:absolute;pointer-events:auto;background:rgba(12,20,32,.98);border:1px solid #344b6b;border-radius:12px;box-shadow:0 14px 40px rgba(0,0,0,.58);color:#eaf2ff}.mode-window.hidden,.mode-backdrop.hidden{display:none}.mode-window>header{display:flex;align-items:center;justify-content:space-between;padding:12px 15px;border-bottom:1px solid #2b3b54}.mode-window h2{margin:0;font-size:17px}.mode-window h3{margin:0 0 8px;color:#f2c66d;font-size:12px}.mode-close{border:0;background:transparent;color:#aebdd0;font-size:24px;cursor:pointer}.mode-window-body{padding:16px}.mode-backdrop{position:absolute;inset:0;z-index:1190;background:rgba(3,6,10,.42);backdrop-filter:blur(1px)}.challenge-window{width:min(520px,calc(100% - 32px));max-height:calc(100% - 40px);left:50%;top:50%;transform:translate(-50%,-50%);overflow-y:auto}.challenge-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.challenge-stats span{padding:9px;border:1px solid #2b3b54;border-radius:7px;color:#8fa0ba}.challenge-stats b{display:block;margin-top:3px;color:#fff}.mode-actions-row{display:flex;flex-wrap:wrap;gap:7px;margin-top:15px}.mode-muted{color:#8fa0ba;line-height:1.6}.stage-editor-window{width:360px;max-height:calc(100% - 40px);left:18px;top:20px;overflow:hidden}.stage-editor-window.collapsed{width:255px}.stage-editor-window.collapsed .editor-content{display:none}.window-head-actions{display:flex;gap:5px}.window-head-actions button,.editor-toolbar button,.variant-bar button{border:1px solid #40516e;border-radius:5px;background:#172236;color:#c9d5e5;padding:5px 7px;cursor:pointer;font-size:10px}.editor-content{display:flex;flex-direction:column;max-height:690px}.editor-toolbar{display:flex;flex-wrap:wrap;gap:4px;padding:9px;border-bottom:1px solid #26364d}.editor-toolbar button:disabled{opacity:.35;cursor:not-allowed}.editor-scroll{padding:10px;overflow-y:auto}.editor-scroll section{margin-bottom:12px;padding:10px;border:1px solid #26364d;border-radius:8px;background:#0e1725}.stage-list,.enemy-list{display:grid;gap:5px;max-height:170px;overflow:auto}.stage-list-item,.enemy-list-item{display:grid;gap:2px;text-align:left;padding:7px;border:1px solid #2a3a52;border-radius:6px;background:#111c2b;color:#dce7f7;cursor:pointer}.stage-list-item small,.enemy-list-item small{color:#8193ad}.stage-list-item.active,.enemy-list-item.active{border-color:#e0b653;background:#202635}.editor-form,.enemy-setting-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}.editor-field{display:grid;gap:3px;color:#8fa0ba;font-size:10px}.editor-field.wide{grid-column:1/-1}.editor-field input,.editor-field select,.editor-field textarea,.enemy-equipment select{width:100%;border:1px solid #344761;border-radius:5px;background:#09111d;color:#eaf2ff;padding:6px;font-size:11px}.editor-field textarea{min-height:48px;resize:vertical}.variant-bar{display:flex;align-items:center;gap:4px;margin-top:9px}.variant-bar span{margin-right:auto;color:#8fa0ba;font-size:10px}.variant-bar button.active{border-color:#f2c66d;color:#fff}.editor-help{color:#7f90aa;font-size:10px;line-height:1.5}.enemy-settings{margin-top:8px;padding-top:8px;border-top:1px solid #26364d}.enemy-settings h4{margin:0 0 7px}.editor-check{grid-column:1/-1;color:#bac8da;font-size:11px}.enemy-equipment{display:grid;gap:6px;margin:9px 0;color:#8fa0ba;font-size:10px}.enemy-equipment button{margin:2px;border:1px solid #435671;border-radius:4px;background:#182438;color:#dce7f7;padding:4px;font-size:9px}.btn.danger{border-color:#753944;color:#ffb0b8}.btn.small{padding:5px 8px;font-size:10px}#stagePreviewOverlay{position:absolute;z-index:35;pointer-events:none}.mode-toast{position:fixed;left:50%;bottom:30px;z-index:1500;max-width:520px;transform:translate(-50%,15px);padding:9px 14px;border:1px solid #4b627f;border-radius:7px;background:#101a29;color:#dce8f8;opacity:0;pointer-events:none;white-space:pre-line;transition:.18s}.mode-toast.show{opacity:1;transform:translate(-50%,0)}.mode-toast.error{border-color:#9b4650;color:#ffc1c7}@media(max-width:800px){.stage-editor-window{left:8px;top:8px;width:min(360px,calc(100% - 16px))}}
  `;document.head.appendChild(style);
}

function installEvents(){
  byId('openChallengeWindow').onclick=event=>{event.preventDefault();event.stopImmediatePropagation();if(appMode===APP_MODE.STAGE_EDITOR){showModeToast('请先退出编辑模式');return}openModeWindow(ACTIVE_WINDOW.CHALLENGE)};
  byId('openStageEditorWindow').onclick=event=>{event.preventDefault();event.stopImmediatePropagation();if(appMode!==APP_MODE.STAGE_EDITOR)activateStageEditorMode();openModeWindow(ACTIVE_WINDOW.STAGE_EDITOR)};
  byId('modeWindowLayer').addEventListener('click',event=>{if(event.target.closest('[data-close-mode]'))closeModeWindow()});
  /* 遮罩只负责视觉，不用点击关闭，避免模式切换时的同一点击误关新窗口。 */
  byId('challengeWindow').addEventListener('click',event=>{if(event.target.id==='newChallengeBtn'){loadStageEditorData();const run=createEmptyPveRun();savePveRun(run);activateChallengeMode(run)}if(event.target.id==='continueChallengeBtn')activateChallengeMode(loadPveRun());if(event.target.id==='restartChallengeBtn'&&confirm('确定彻底清空旧挑战并重新开始？')){loadStageEditorData();const run=createEmptyPveRun();savePveRun(run);activateChallengeMode(run)}if(event.target.id==='exitChallengeBtn')exitChallengeMode()});
  byId('collapseEditorBtn').onclick=()=>{const windowElement=byId('stageEditorWindow');windowElement.classList.toggle('collapsed');byId('collapseEditorBtn').textContent=windowElement.classList.contains('collapsed')?'展开':'折叠'};
  byId('exitEditorBtn').onclick=()=>exitStageEditorMode();byId('newStageBtn').onclick=newStage;byId('saveStageBtn').onclick=saveStageDraft;byId('duplicateStageBtn').onclick=duplicateStage;byId('deleteStageBtn').onclick=deleteStage;byId('exportStagesBtn').onclick=exportStageSet;byId('importStagesBtn').onclick=()=>editorImportInput.click();editorImportInput.onchange=()=>{importStageSet(editorImportInput.files[0]);editorImportInput.value=''};
  byId('stageList').onclick=event=>{const button=event.target.closest('[data-stage-id]');if(!button)return;if(stageEditor.dirty&&!confirm('放弃当前未保存修改并切换关卡？'))return;loadStageDraft(button.dataset.stageId)};
  byId('stageBaseForm').addEventListener('input',()=>{syncStageFormToDraft();markEditorDirty();renderStagePreview()});
  byId('stageBaseForm').addEventListener('change',()=>{syncStageFormToDraft();markEditorDirty();renderStageEditor();renderStagePreview()});
  byId('stageRewardForm').addEventListener('input',()=>{syncStageFormToDraft();markEditorDirty()});
  byId('variantBar').onclick=event=>{const button=event.target.closest('[data-variant]');if(!button)return;stageEditor.selectedVariantId=button.dataset.variant;stageEditor.selectedEnemyEditorId=null;renderStageEditor();renderStagePreview()};
  byId('enemyList').onclick=event=>{const button=event.target.closest('[data-enemy-id]');if(!button)return;stageEditor.selectedEnemyEditorId=button.dataset.enemyId;renderEnemyEditor();renderStagePreview()};
  byId('enemySettings').addEventListener('change',event=>{if(event.target.id==='enemyEquipmentSelect'){const enemy=currentEnemies().find(item=>item.editorId===stageEditor.selectedEnemyEditorId),id=event.target.value;if(enemy&&id&&enemy.equipmentIds.length<3&&!enemy.equipmentIds.includes(id)){enemy.equipmentIds.push(id);markEditorDirty();renderEnemyEditor()}return}syncSelectedEnemy()});
  byId('enemySettings').addEventListener('click',event=>{const remove=event.target.closest('[data-remove-enemy-equip]'),enemy=currentEnemies().find(item=>item.editorId===stageEditor.selectedEnemyEditorId);if(remove&&enemy){enemy.equipmentIds=enemy.equipmentIds.filter(id=>id!==remove.dataset.removeEnemyEquip);markEditorDirty();renderEnemyEditor()}if(event.target.id==='deleteEnemyBtn'&&enemy){const list=currentEnemies(),index=list.indexOf(enemy);if(index>=0)list.splice(index,1);stageEditor.selectedEnemyEditorId=null;markEditorDirty();renderEnemyEditor();renderStagePreview()}});
  document.querySelector('#whPanel').addEventListener('pointerdown',event=>{if(appMode!==APP_MODE.STAGE_EDITOR)return;const card=event.target.closest('.wh-card');if(!card)return;event.preventDefault();event.stopImmediatePropagation();beginEditorTemplatePointer(event,card)},true);
  document.querySelector('#whPanel').addEventListener('click',event=>{if(appMode!==APP_MODE.STAGE_EDITOR)return;if(event.target.closest('.wh-card')){event.preventDefault();event.stopImmediatePropagation()}},true);
  window.addEventListener('pointermove',updateEditorTemplateDrag,{passive:false});
  window.addEventListener('pointerup',finishEditorTemplateDrag);
  window.addEventListener('pointercancel',()=>{editorTemplateDrag=null;hidePieceDragGhost()});
  canvas.addEventListener('click',event=>{if(appMode!==APP_MODE.STAGE_EDITOR)return;event.preventDefault();event.stopImmediatePropagation();const point=canvasPoint(event),cell=cellAt(point.x,point.y);if(!cell||cell.row>3){showModeToast('敌人只能放在红方0～3行','error');return}const existing=currentEnemies().find(enemy=>enemy.row===cell.row&&enemy.col===cell.col);if(existing){stageEditor.selectedEnemyEditorId=existing.editorId;renderEnemyEditor();renderStagePreview();return}addEnemyAt(cell.row,cell.col)},true);
}

installStyle();installUi();installEvents();loadStageEditorData();updateModeButtons();
window.PVE_V2={APP_MODE,ACTIVE_WINDOW,STAGE_TYPE,FAILURE_POLICY,REWARD_MODE,DEFAULT_STAGE_ORDER,get appMode(){return appMode},get activeWindow(){return activeWindow},get stageEditor(){return stageEditor},validateStageConfig,validateStageSet,createDefaultStageSet,openModeWindow,activateStageEditorMode,exitStageEditorMode};
})();
