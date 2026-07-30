(()=>{
  'use strict';

  const STORAGE_KEY='element-auto-chess-tutorial-seen-v1';
  const steps=[
    {
      eyebrow:'第 1 步 · 认识棋盘',
      title:'先把棋子放上场',
      icon:'⬡',
      body:'从右侧测试仓库选择棋子，双击可加入备战席，也可以直接拖到棋盘。蓝色半场属于我方，红色半场属于敌方。',
      tips:['短按棋子：查看详细属性与技能','长按棋子：拿起并调整站位','相同角色会按规则合成为更高星级']
    },
    {
      eyebrow:'第 2 步 · 开始战斗',
      title:'布阵完成后开始战斗',
      icon:'⚔',
      body:'点击顶部“开始战斗”，棋子会自动索敌、移动、攻击和施放技能。战斗中可以暂停或调整速度，结束后返回备战阶段。',
      tips:['前排适合坦克和近战棋子','弓与法器适合放在后排','右侧柱形图可查看伤害、承伤和治疗护盾']
    },
    {
      eyebrow:'第 3 步 · 法力与技能',
      title:'蓝条充满就会自动施法',
      icon:'✦',
      body:'普通角色通过攻击、受伤或自动回蓝积攒法力。蓝条达到上限后会自动释放技能；部分角色使用战意等独立技能条，不受普通回蓝影响。',
      tips:['选中棋子可查看当前法力和每秒回蓝','技能可能有飞行或延迟命中过程','沉默等状态会暂时阻止施法']
    },
    {
      eyebrow:'第 4 步 · 元素玩法',
      title:'搭配元素反应与元素共鸣',
      icon:'◉',
      body:'火、水、冰、雷、风、岩会产生不同元素反应。同元素的不同角色达到指定数量，还会激活元素共鸣，为全队提供额外效果。',
      tips:['重复的同名角色只计算一次共鸣人数','棋盘上方会显示双方当前共鸣层级','页面下方的效果表可查询完整反应说明']
    },
    {
      eyebrow:'第 5 步 · 装备',
      title:'用装备强化阵容',
      icon:'◆',
      body:'切换仓库的“装备”页，把装备拖到棋子身上。装备可提供攻击、防御、启动或团队辅助效果，每件装备按照自己的规则独立触发。',
      tips:['选中棋子可以查看已装备物品','拆卸器可取下装备，重铸器可更换装备','刷新页面会保留测试场棋子及其装备']
    },
    {
      eyebrow:'第 6 步 · 挑战模式',
      title:'准备好后尝试完整挑战',
      icon:'🏆',
      body:'挑战模式包含20个预设关卡，拥有独立金币、等级、商店、人口和失败机会。购买棋子、升级人口并持续强化阵容，最终通过 EX-2 即完成挑战。',
      tips:['每回合胜利后获得资源和经验','商店概率会随等级变化','成功完成挑战后可保存并回顾每回合阵容与统计']
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
    .tutorial-eyebrow{margin-bottom:8px;color:#69b9ff;font-size:12px;font-weight:800;letter-spacing:.08em}
    .tutorial-title{margin:0 0 12px;font-size:28px;line-height:1.25}
    .tutorial-body{margin:0;color:#b8c7da;font-size:15px;line-height:1.8}
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
    $('.tutorial-icon').textContent=step.icon;
    $('.tutorial-eyebrow').textContent=step.eyebrow;
    $('.tutorial-title').textContent=step.title;
    $('.tutorial-body').textContent=step.body;
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
