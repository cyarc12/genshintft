(()=>{
  'use strict';

  const STORAGE_KEY='element-auto-chess-tutorial-seen-v1';
  const legacySteps=[
    {
      eyebrow:'第 1 步 · 测试模式',
      title:'这里是自由测试场',
      icon:'⬡',
      body:'Demo 打开后默认进入测试模式。你可以自由配置蓝方与红方的棋子、星级、站位和装备，反复开始战斗，用来测试角色、阵容、元素反应与数值表现。',
      tips:['测试模式不使用金币、等级或商店限制','蓝色半场属于蓝方，红色半场属于红方','测试场阵容和装备会保存在当前浏览器']
    },
    {
      eyebrow:'第 2 步 · 放置棋子',
      title:'从仓库搭建双方阵容',
      icon:'♟',
      body:'从右侧测试仓库选择棋子，双击可加入备战席，也可以直接拖到棋盘。测试模式下，蓝方和红方都可以自由编辑。',
      tips:['短按棋子：查看详细属性与技能','长按棋子：拿起并调整站位','相同角色会按规则合成为更高星级']
    },
    {
      eyebrow:'第 3 步 · 开始战斗',
      title:'布阵完成后开始战斗',
      icon:'⚔',
      body:'点击顶部“开始战斗”，棋子会自动索敌、移动、攻击和施放技能。战斗中可以暂停或调整速度，结束后返回备战阶段。',
      tips:['前排适合坦克和近战棋子','弓与法器适合放在后排','右侧柱形图可查看伤害、承伤和治疗护盾']
    },
    {
      eyebrow:'第 4 步 · 法力与技能',
      title:'蓝条充满就会自动施法',
      icon:'✦',
      body:'普通角色通过攻击、受伤或自动回蓝积攒法力。蓝条达到上限后会自动释放技能；部分角色使用战意等独立技能条，不受普通回蓝影响。',
      tips:['选中棋子可查看当前法力和每秒回蓝','技能可能有飞行或延迟命中过程','沉默等状态会暂时阻止施法']
    },
    {
      eyebrow:'第 5 步 · 元素玩法',
      title:'搭配元素反应与元素共鸣',
      icon:'◉',
      body:'火、水、冰、雷、风、岩会产生不同元素反应。同元素的不同角色达到指定数量，还会激活元素共鸣，为全队提供额外效果。',
      tips:['重复的同名角色只计算一次共鸣人数','棋盘上方会显示双方当前共鸣层级','页面下方的效果表可查询完整反应说明']
    },
    {
      eyebrow:'第 6 步 · 装备',
      title:'用装备强化阵容',
      icon:'◆',
      body:'切换仓库的“装备”页，把装备拖到棋子身上。装备可提供攻击、防御、启动或团队辅助效果，每件装备按照自己的规则独立触发。',
      tips:['选中棋子可以查看已装备物品','拆卸器可取下装备，重铸器可更换装备','刷新页面会保留测试场棋子及其装备']
    },
    {
      eyebrow:'第 7 步 · 挑战模式',
      title:'准备好后尝试完整挑战',
      icon:'🏆',
      body:'挑战模式是独立于测试场的正式流程，可从顶部“挑战模式”入口进入。它包含20个预设关卡，并拥有独立金币、等级、商店、人口和失败机会；最终通过 EX-2 即完成挑战。',
      tips:['每回合胜利后获得资源和经验','商店概率会随等级变化','成功完成挑战后可保存并回顾每回合阵容与统计']
    }
  ];

  const steps=[
    {
      eyebrow:'第 1 步 · 游戏介绍',
      title:'欢迎来到《元素自走棋》',
      icon:'✦',
      body:'这是一款以<span class="tutorial-keyword">角色布阵</span>、<span class="tutorial-keyword">自动战斗</span>、<span class="tutorial-keyword">元素反应</span>和<span class="tutorial-keyword">元素共鸣</span>为核心的策略游戏。选择不同角色，为他们配置装备并调整站位。战斗开始后，棋子会自动移动、攻击和释放技能。',
      tips:[
        '合理搭配<span class="tutorial-keyword">阵容、元素与装备</span>，保护核心角色并击败敌方队伍',
        '不需要在战斗中手动操作角色，策略主要发生在<span class="tutorial-keyword">战斗开始前</span>'
      ]
    },
    {
      eyebrow:'第 2 步 · 自由测试',
      title:'这里是自由测试模式',
      image:'assets/avatars/training-dummy.png',
      imageAlt:'测试模式木桩',
      body:'你当前所在的是<span class="tutorial-keyword">自由测试模式</span>。在这里可以自由配置蓝方与红方阵容，调整角色星级、装备和站位，不受金币、等级、人口和商店限制。',
      tips:[
        '适合测试<span class="tutorial-keyword">角色技能、元素反应、元素共鸣</span>和装备效果',
        '蓝方与红方阵容都由你配置，红方不是系统预设的关卡敌人',
        '测试场的棋子和装备会保存在<span class="tutorial-keyword">当前浏览器</span>'
      ]
    },
    {
      eyebrow:'第 3 步 · 棋子操作',
      title:'放置和调整棋子',
      icon:'♟',
      body:'从角色列表中选择棋子，将其放到对应阵营的棋盘或备战席。<span class="tutorial-keyword">点击棋子</span>可以查看详细信息；<span class="tutorial-keyword">按住棋子约100毫秒</span>即可抓起，再拖到目标位置。',
      tips:[
        '在备战阶段可以<span class="tutorial-keyword">拖动棋子</span>调整站位',
        '也可以将棋子移回<span class="tutorial-keyword">备战席</span>',
        '相同角色可以上场，但元素共鸣只按照<span class="tutorial-keyword">不同角色</span>计算'
      ]
    },
    {
      eyebrow:'第 4 步 · 角色面板',
      title:'查看角色信息',
      image:'assets/avatars/keqing.png',
      imageAlt:'角色头像',
      body:'<span class="tutorial-keyword">点击棋盘或备战席上的棋子</span>即可打开详细面板。面板会显示生命、法力、武器、攻击力、攻击速度、暴击、双抗、攻击距离、增伤、减伤、武器特性和技能说明。',
      tips:[
        '角色升星后，面板会显示<span class="tutorial-keyword">当前星级</span>对应的属性与技能数值',
        '<span class="tutorial-keyword">法力条充满</span>后角色会自动释放技能',
        '战意等特殊资源不受普通回蓝效果影响'
      ]
    },
    {
      eyebrow:'第 5 步 · 元素玩法',
      title:'元素反应与元素共鸣',
      image:'assets/elements/cryo.svg',
      imageAlt:'冰元素图标',
      body:'火、水、雷、冰、风、岩等元素攻击可以与目标身上的元素附着产生<span class="tutorial-keyword">元素反应</span>。上阵多个不同的同元素角色，还可以激活<span class="tutorial-keyword">元素共鸣</span>。',
      tips:[
        '元素反应可能带来<span class="tutorial-keyword">额外伤害、控制、延迟结算</span>或范围效果',
        '棋盘上方会分别显示蓝方与红方的<span class="tutorial-keyword">共鸣层级</span>',
        '<span class="tutorial-keyword">点击共鸣图标</span>可查看效果和参与激活的角色'
      ]
    },
    {
      eyebrow:'第 6 步 · 装备系统',
      title:'为棋子配置装备',
      image:'assets/equipment/battle_emblem.png',
      imageAlt:'装备图标',
      body:'将装备<span class="tutorial-keyword">拖到棋子身上</span>，即可为角色提供属性或特殊效果。装备分为输出、防御和辅助等类型；同名装备可以同时佩戴，并且每件装备独立计算。',
      tips:[
        '部分装备会在<span class="tutorial-keyword">开战、低生命、击杀或施法</span>时触发',
        '<span class="tutorial-keyword">装备重铸器</span>可以更换装备',
        '<span class="tutorial-keyword">装备拆卸器</span>可以取下已佩戴的装备'
      ]
    },
    {
      eyebrow:'第 7 步 · 自动战斗',
      title:'开始一场战斗',
      icon:'⚔',
      body:'完成双方阵容配置后，点击<span class="tutorial-keyword">“开始战斗”</span>。棋子会自动选择目标、移动、普通攻击并释放技能，你不需要手动控制角色。',
      tips:[
        '战斗中可以观察<span class="tutorial-keyword">元素反应、护盾、治疗、控制</span>和技能联动',
        '右侧<span class="tutorial-keyword">战斗统计</span>可以查看伤害、承伤、治疗与护盾',
        '测试结束后可以<span class="tutorial-keyword">重新布阵</span>并继续调整阵容'
      ]
    },
    {
      eyebrow:'第 8 步 · 挑战模式',
      title:'进入正式挑战',
      icon:'🏆',
      body:'熟悉测试模式后，可以从页面上方进入<span class="tutorial-keyword">挑战模式</span>。这里拥有独立的关卡流程，包括金币、商店、等级、经验、人口、备战席、装备奖励和失败机会。',
      tips:[
        '通过<span class="tutorial-keyword">购买与合成棋子</span>提升阵容质量',
        '经营金币、升级人口并连续挑战<span class="tutorial-keyword">预设敌方阵容</span>',
        '测试模式用于自由验证；挑战模式包含<span class="tutorial-keyword">成长、资源管理与通关目标</span>'
      ]
    }
  ];

  let current=0;
  const style=document.createElement('style');
  style.textContent=`
    .tutorial-entry-btn{border-color:#8bc9ef!important;background:linear-gradient(180deg,#d9f3ff,#91caec)!important;color:#12304a!important;font-weight:800;box-shadow:0 0 0 1px #dff7ff55 inset,0 3px 12px #55b9ee28}
    .tutorial-entry-btn:hover{border-color:#c9efff!important;background:linear-gradient(180deg,#effaff,#a9daf3)!important;box-shadow:0 0 0 1px #fff8 inset,0 4px 16px #62c8ff45}
    .tutorial-modal{position:fixed;inset:0;z-index:3600;display:grid;place-items:center;padding:20px;background:rgba(2,6,12,.82);backdrop-filter:blur(7px)}
    .tutorial-modal[hidden]{display:none}
    .tutorial-card{position:relative;width:min(680px,100%);overflow:hidden;border:1px solid #4d6688;border-radius:16px;background:linear-gradient(145deg,#142239,#09111e 68%);box-shadow:0 28px 80px #000b,0 0 38px #3b79bf22;color:#edf4ff}
    .tutorial-card::before{content:"";position:absolute;inset:0 0 auto;height:3px;background:linear-gradient(90deg,#57aaff,#7ce5d2,#f2c66d)}
    .tutorial-head{display:flex;align-items:center;justify-content:space-between;padding:18px 22px 10px}
    .tutorial-brand{color:#9db0c9;font-size:12px;font-weight:800;letter-spacing:.12em}
    .tutorial-close{width:34px;height:34px;border:1px solid #425979;border-radius:50%;background:#101c2e;color:#aebed2;font-size:22px;line-height:28px;cursor:pointer}
    .tutorial-close:hover{color:#fff;border-color:#78a5db}
    .tutorial-content{display:grid;grid-template-columns:118px minmax(0,1fr);gap:22px;align-items:center;min-height:300px;padding:20px 34px 30px}
    .tutorial-icon{display:grid;width:108px;height:108px;place-items:center;border:1px solid #54749a;border-radius:50%;background:radial-gradient(circle,#284b72 0,#152941 48%,#0b1523 72%);box-shadow:0 0 0 8px #17294080,0 0 30px #59aaff3b;color:#f5d477;font-size:52px}
    .tutorial-icon img{display:block;width:76px;height:76px;object-fit:contain;border-radius:50%;filter:drop-shadow(0 4px 9px #0008)}
    .tutorial-icon img.tutorial-element-image{width:68px;height:68px;border-radius:0;filter:drop-shadow(0 0 9px #a9e9ff88)}
    .tutorial-icon img.tutorial-equipment-image{width:92px;height:92px;border-radius:22px}
    .tutorial-eyebrow{margin-bottom:8px;color:#69b9ff;font-size:12px;font-weight:800;letter-spacing:.08em}
    .tutorial-title{margin:0 0 12px;font-size:28px;line-height:1.25}
    .tutorial-body{margin:0;color:#b8c7da;font-size:15px;line-height:1.8}
    .tutorial-keyword{color:#f4ca69;font-weight:800;text-shadow:0 0 10px #d79a2933}
    .tutorial-tips{display:grid;gap:7px;margin:17px 0 0;padding:0;list-style:none}
    .tutorial-tips li{position:relative;padding-left:17px;color:#dbe6f4;font-size:13px;line-height:1.55}
    .tutorial-tips li::before{content:"";position:absolute;left:1px;top:.62em;width:6px;height:6px;border-radius:50%;background:#f0c867;box-shadow:0 0 7px #f0c86788}
    .tutorial-footer{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:14px;padding:15px 22px;border-top:1px solid #2c405b;background:#0b1422}
    .tutorial-progress{display:flex;justify-content:center;gap:7px}
    .tutorial-dot{width:8px;height:8px;padding:0;border:0;border-radius:50%;background:#344961;cursor:pointer;transition:.16s}
    .tutorial-dot.active{width:24px;border-radius:8px;background:#67b7ff;box-shadow:0 0 9px #67b7ff88}
    .tutorial-actions{display:flex;justify-content:flex-end;gap:8px}
    .tutorial-button{min-width:82px;padding:8px 14px;border:1px solid #465f80;border-radius:8px;background:#16253a;color:#dce8f7;cursor:pointer}
    .tutorial-button:hover{border-color:#79a7dc;background:#1c304b}
    .tutorial-button.primary{border-color:#c89c45;background:linear-gradient(#f9d986,#c89539);color:#201604;font-weight:800}
    .tutorial-count{color:#8295ad;font-size:12px}
    @media(max-width:620px){.tutorial-content{grid-template-columns:1fr;padding:12px 22px 24px}.tutorial-icon{width:72px;height:72px;font-size:34px}.tutorial-title{font-size:22px}.tutorial-footer{grid-template-columns:1fr}.tutorial-count{text-align:center}.tutorial-actions{justify-content:center}}
  `;
  document.head.appendChild(style);

  const modal=document.createElement('div');
  modal.id='gameTutorial';
  modal.className='tutorial-modal';
  modal.hidden=true;
  modal.setAttribute('role','dialog');
  modal.setAttribute('aria-modal','true');
  modal.setAttribute('aria-labelledby','tutorialTitle');
  modal.innerHTML=`
    <div class="tutorial-card">
      <div class="tutorial-head"><span class="tutorial-brand">元素自走棋 · 新手教程</span><button class="tutorial-close" type="button" aria-label="关闭教程">×</button></div>
      <div class="tutorial-content">
        <div class="tutorial-icon" aria-hidden="true"></div>
        <div>
          <div class="tutorial-eyebrow"></div>
          <h2 class="tutorial-title" id="tutorialTitle"></h2>
          <p class="tutorial-body"></p>
          <ul class="tutorial-tips"></ul>
        </div>
      </div>
      <div class="tutorial-footer">
        <span class="tutorial-count"></span>
        <div class="tutorial-progress"></div>
        <div class="tutorial-actions"><button class="tutorial-button tutorial-prev" type="button">上一步</button><button class="tutorial-button primary tutorial-next" type="button">下一步</button></div>
      </div>
    </div>`;
  document.body.appendChild(modal);

  const $=selector=>modal.querySelector(selector);
  function markSeen(){try{localStorage.setItem(STORAGE_KEY,'1')}catch(_){}}
  function closeTutorial(){markSeen();modal.hidden=true}
  function render(){
    const step=steps[current];
    const icon=$('.tutorial-icon');
    if(step.image){
      const imageClass=step.image.includes('/elements/')?'tutorial-element-image':step.image.includes('/equipment/')?'tutorial-equipment-image':'';
      icon.innerHTML=`<img class="${imageClass}" src="${step.image}" alt="${step.imageAlt||''}">`;
    }else{
      icon.textContent=step.icon;
    }
    $('.tutorial-eyebrow').textContent=step.eyebrow;
    $('.tutorial-title').textContent=step.title;
    $('.tutorial-body').innerHTML=step.body;
    $('.tutorial-tips').innerHTML=step.tips.map(text=>`<li>${text}</li>`).join('');
    $('.tutorial-count').textContent=`${current+1} / ${steps.length}`;
    $('.tutorial-prev').disabled=current===0;
    $('.tutorial-prev').style.visibility=current===0?'hidden':'visible';
    $('.tutorial-next').textContent=current===steps.length-1?'开始游玩':'下一步';
    $('.tutorial-progress').innerHTML=steps.map((_,index)=>`<button class="tutorial-dot${index===current?' active':''}" data-tutorial-step="${index}" aria-label="第${index+1}步"></button>`).join('');
  }
  function openTutorial(){current=0;render();modal.hidden=false}

  $('.tutorial-close').addEventListener('click',closeTutorial);
  $('.tutorial-prev').addEventListener('click',()=>{if(current>0){current--;render()}});
  $('.tutorial-next').addEventListener('click',()=>{if(current<steps.length-1){current++;render()}else closeTutorial()});
  $('.tutorial-progress').addEventListener('click',event=>{const button=event.target.closest('[data-tutorial-step]');if(button){current=Number(button.dataset.tutorialStep)||0;render()}});
  modal.addEventListener('click',event=>{if(event.target===modal)closeTutorial()});
  document.addEventListener('keydown',event=>{
    if(modal.hidden)return;
    if(event.key==='Escape')closeTutorial();
    if(event.key==='ArrowRight')$('.tutorial-next').click();
    if(event.key==='ArrowLeft'&&current>0)$('.tutorial-prev').click();
  });

  const actions=document.querySelector('.actions');
  if(actions){
    const button=document.createElement('button');
    button.id='openTutorialBtn';
    button.className='btn tutorial-entry-btn';
    button.type='button';
    button.textContent='玩法教程';
    button.addEventListener('click',openTutorial);
    actions.appendChild(button);
  }

  let seen=false;
  try{seen=localStorage.getItem(STORAGE_KEY)==='1'}catch(_){}
  if(!seen)setTimeout(openTutorial,260);
  window.openGameTutorial=openTutorial;
})();
