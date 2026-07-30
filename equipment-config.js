const EQUIPMENT_CONFIG={
arcane_prism:{id:'arcane_prism',name:'奥术棱镜',icon:'assets/equipment/arcane_prism.png',stats:{critChance:.25,damageAmp:.15},statText:'暴击率＋25%，增伤＋15%',effectText:'技能伤害可以暴击。',effect:{type:'skill_can_crit'}},
battle_emblem:{id:'battle_emblem',name:'战役勋章',icon:'assets/equipment/battle_emblem.png',stats:{atkFlat:15,hpFlat:150},statText:'攻击力＋15，最大生命＋150',effectText:'造成伤害或受到伤害时获得1层战斗印记。每层攻击力＋2、物理抗性＋1、元素抗性＋1，最多25层；满层额外增伤＋15%。',effect:{type:'battle_mark',maxStacks:25,atkPerStack:2,physicalResPerStack:1,elementResPerStack:1,fullStackDamageAmp:.15}},
giant_slayer:{id:'giant_slayer',name:'巨人杀手',icon:'assets/equipment/giant_slayer.png',stats:{atkFlat:40,damageAmp:.10},statText:'攻击力＋40，增伤＋10%',effectText:'对最大生命值高于自身的目标额外获得20%增伤。',effect:{type:'damage_amp_vs_higher_max_hp',value:.20}},
shieldbreaker_spear:{id:'shieldbreaker_spear',name:'破盾长枪',icon:'assets/equipment/shieldbreaker_spear.png',stats:{atkFlat:35,damageAmp:.10},statText:'攻击力＋35，增伤＋10%',effectText:'对拥有护盾的目标额外获得20%增伤；对护盾造成的伤害额外获得30%增伤。',effect:{type:'damage_amp_vs_shield',targetAmp:.20,shieldDamageAmp:.30}},
execution_blade:{id:'execution_blade',name:'处刑之刃',icon:'assets/equipment/execution_blade.png',stats:{critChance:.25,critDamage:.50,damageAmp:.10},statText:'暴击率＋25%，暴击伤害＋50%，增伤＋10%',effectText:'对生命值低于35%的目标额外获得20%增伤。',effect:{type:'execute_damage_amp',hpThreshold:.35,value:.20}},
bloodthirst_blade:{id:'bloodthirst_blade',name:'饮血剑',icon:'assets/equipment/bloodthirst_blade.png',stats:{atkFlat:30,hpFlat:200,physicalRes:15,lifesteal:.20},statText:'攻击力＋30，最大生命＋200，物理抗性＋15，吸血＋20%',effectText:'造成实际伤害时，按实际伤害的20%回复生命；护盾损失与生命损失均计入。',effect:{type:'lifesteal_from_actual_damage',value:.20}},
judgment_emblem:{id:'judgment_emblem',name:'裁决徽记',icon:'assets/equipment/judgment_emblem.png',stats:{startMana:20,damageAmp:.15},statText:'初始法力＋20，增伤＋15%',effectText:'技能造成伤害后，使目标受到30%重伤，持续6秒。',effect:{type:'grievous_on_skill_damage',grievous:.30,duration:6}},
mana_ring:{id:'mana_ring',name:'能量戒指',icon:'assets/equipment/mana_ring.png',stats:{atkFlat:20,attackSpeed:.25,manaPerSecond:1},statText:'攻击力＋20，攻击速度＋25%，每秒回蓝＋1',effectText:'普通攻击额外回复5点法力，无攻击间隔限制。',effect:{type:'extra_mana_on_normal_hit',value:5}},
temporal_bowstring:{id:'temporal_bowstring',name:'时序弓弦',icon:'assets/equipment/temporal_bowstring.png',stats:{atkFlat:25,attackSpeed:.25},statText:'攻击力＋25，攻击速度＋25%',effectText:'每3秒获得5%攻击速度，无成长上限。',effect:{type:'timed_attack_speed_stacks',interval:3,attackSpeedPerStack:.05}},
berserker_bracer:{id:'berserker_bracer',name:'狂战腕甲',icon:'assets/equipment/berserker_bracer.png',stats:{hpFlat:350,attackSpeed:.30},statText:'最大生命＋350，攻击速度＋30%',effectText:'每损失10%最大生命值，获得5%攻击速度。',effect:{type:'missing_hp_attack_speed',perMissingHp:.10,attackSpeedPerStep:.05}},
hunter_feather:{id:'hunter_feather',name:'猎手羽饰',icon:'assets/equipment/hunter_feather.png',stats:{startMana:20,attackSpeed:.40,atkFlat:15},statText:'初始法力＋20，攻击速度＋40%，攻击力＋15',effectText:'释放技能后获得40%攻击速度，持续3秒。',effect:{type:'attack_speed_after_cast',value:.40,duration:3}},
bulwark_armor:{id:'bulwark_armor',name:'坚固铠甲',icon:'assets/equipment/bulwark_armor.png',stats:{physicalRes:60,elementRes:50,damageReduction:.05},statText:'物理抗性＋60，元素抗性＋50',effectText:'获得5%减伤。',effect:{type:'enemy_damage_reduction',value:.05}},
guardian_oath:{id:'guardian_oath',name:'守护誓约',icon:'assets/equipment/guardian_oath.png',stats:{hpFlat:400,physicalRes:30,elementRes:20},statText:'最大生命＋400，物理抗性＋30，元素抗性＋20',effectText:'战斗开始获得300＋25%最大生命值的护盾，持续10秒。',effect:{type:'battle_start_shield',flat:300,maxHpRatio:.25,duration:10}},
regeneration_pendant:{id:'regeneration_pendant',name:'再生吊坠',icon:'assets/equipment/regeneration_pendant.png',stats:{hpFlat:300,manaPerSecond:2,damageReduction:.10},statText:'最大生命＋300，每秒回蓝＋2，减伤＋10%',effectText:'每2秒回复5%最大生命值。',effect:{type:'periodic_self_heal',interval:2,maxHpRatio:.05}},
emergency_pendant:{id:'emergency_pendant',name:'应急吊坠',icon:'assets/equipment/emergency_pendant.png',stats:{hpFlat:300,startMana:20},statText:'最大生命＋300，初始法力＋20',effectText:'第一次生命低于40%时，回复30%最大生命值，并获得15%减伤，持续5秒。',effect:{type:'once_low_hp_heal',hpThreshold:.40,maxHpRatio:.30,damageReduction:.15,duration:5}},
thornmail:{id:'thornmail',name:'荆棘铠甲',icon:'assets/equipment/thornmail.png',stats:{hpFlat:350,physicalRes:40},statText:'最大生命＋350，物理抗性＋40',effectText:'受到普通攻击时，反弹20%实际伤害。',effect:{type:'normal_attack_reflect',value:.20}},
quicksilver_cloak:{id:'quicksilver_cloak',name:'水银斗篷',icon:'assets/equipment/quicksilver_cloak.png',stats:{atkFlat:20,hpFlat:250,attackSpeed:.10},statText:'攻击力＋20，最大生命＋250，攻击速度＋10%',effectText:'生命首次低于40%时，清除自身当前仇恨、回复10%最大生命并解除自身控制。',effect:{type:'low_hp_cleanse_escape',hpThreshold:.40,healRatio:.10}},
redemption_lamp:{id:'redemption_lamp',name:'救赎之灯',icon:'assets/equipment/redemption_lamp.png',stats:{startMana:20,hpFlat:150},statText:'初始法力＋20，最大生命＋150',effectText:'每7秒治疗生命百分比最低的友军300生命，并额外回复其已损失生命值的15%。',effect:{type:'periodic_lowest_ally_heal',interval:7,flat:300,missingHpRatio:.15}}
,
eagle_scope:{id:'eagle_scope',name:'鹰眼瞄具',icon:'assets/equipment/eagle_scope.png',stats:{attackSpeed:.40},statText:'攻击速度＋40%',effectText:'攻击距离＋1；每参与一次击杀，攻击距离额外＋1。',effect:{type:'range_growth_on_takedown',baseRange:1,rangePerTakedown:1}},
pansheng_armor:{id:'pansheng_armor',name:'磐生重铠',icon:'assets/equipment/pansheng_armor.png',stats:{hpFlat:600,hpPercent:.10},statText:'最大生命＋600，最大生命提高10%',effectText:'无额外效果。',effect:{type:'pure_max_hp'}},
element_scroll:{id:'element_scroll',name:'元素卷轴',icon:'assets/equipment/element_scroll.png',stats:{startMana:20,manaPerSecond:3},statText:'初始法力＋20',effectText:'每秒自动回复3点法力。',effect:{type:'automatic_mana',value:3}},
berserker_rune:{id:'berserker_rune',name:'狂战符文',icon:'assets/equipment/berserker_rune.png',stats:{atkFlat:80},statText:'攻击力＋80',effectText:'无额外效果。',effect:{type:'pure_attack'}},
unyielding_armor:{id:'unyielding_armor',name:'不屈战甲',icon:'assets/equipment/unyielding_armor.png',stats:{atkFlat:50,hpFlat:400},statText:'攻击力＋50，最大生命＋400',effectText:'生命首次低于50%时，获得30%最大生命值的护盾，持续5秒。',effect:{type:'low_hp_shield',hpThreshold:.50,shieldRatio:.30,duration:5}},
domain_core_swift:{id:'domain_core_swift',name:'领域核心·迅捷',icon:'assets/equipment/domain_core_swift.png',stats:{hpFlat:150,startMana:10},statText:'最大生命＋150，初始法力＋10',effectText:'自身同一排左右各2格内的友军攻击速度＋20%。',effect:{type:'row_aura_attack_speed',range:2,value:.20}},
domain_core_battle:{id:'domain_core_battle',name:'领域核心·战意',icon:'assets/equipment/domain_core_battle.png',stats:{hpFlat:150,startMana:10},statText:'最大生命＋150，初始法力＋10',effectText:'自身同一排左右各2格内的友军攻击力＋15%。',effect:{type:'row_aura_attack',range:2,value:.15}},
domain_core_guard:{id:'domain_core_guard',name:'领域核心·守护',icon:'assets/equipment/domain_core_guard.png',stats:{hpFlat:150,startMana:10},statText:'最大生命＋150，初始法力＋10',effectText:'战斗开始时，自身同一排左右各2格内的友军获得200＋10%最大生命值的护盾，持续8秒。',effect:{type:'row_aura_battle_start_shield',range:2,flat:200,maxHpRatio:.10,duration:8}},
frozen_core:{id:'frozen_core',name:'冰封核心',icon:'assets/equipment/frozen_core.png',stats:{hpFlat:300,startMana:30},statText:'最大生命＋300，初始法力＋30',effectText:'生命首次低于50%时，回复20点法力并获得20%最大生命值的护盾，持续5秒。',effect:{type:'low_hp_mana_shield',hpThreshold:.50,mana:20,shieldRatio:.20,duration:5}}
};
const EQUIPMENT_WAREHOUSE_META={
  arcane_prism:{category:'damage',cardStatText:'暴击＋25% · 增伤＋15%',cardEffectText:'技能可暴击'},
  battle_emblem:{category:'damage',cardStatText:'攻击＋15 · 生命＋150',cardEffectText:'25层战斗印记'},
  giant_slayer:{category:'damage',cardStatText:'攻击＋40 · 增伤＋10%',cardEffectText:'对高血目标额外增伤'},
  shieldbreaker_spear:{category:'damage',cardStatText:'攻击＋35 · 增伤＋10%',cardEffectText:'破盾额外增伤'},
  execution_blade:{category:'damage',cardStatText:'暴击＋25% · 暴伤＋50%',cardEffectText:'残血额外增伤'},
  bloodthirst_blade:{category:'damage',cardStatText:'攻击＋30 · 生命＋200',cardEffectText:'实际伤害吸血20%'},
  judgment_emblem:{category:'tempo',cardStatText:'初始法力＋20 · 增伤＋15%',cardEffectText:'技能施加30%重伤'},
  mana_ring:{category:'tempo',cardStatText:'攻击＋20 · 攻速＋25%',cardEffectText:'每秒回蓝＋普攻回蓝'},
  temporal_bowstring:{category:'tempo',cardStatText:'攻击＋25 · 攻速＋25%',cardEffectText:'无限攻速成长'},
  berserker_bracer:{category:'tempo',cardStatText:'生命＋350 · 攻速＋30%',cardEffectText:'损血获得攻速'},
  hunter_feather:{category:'tempo',cardStatText:'初始法力＋20 · 攻速＋40%',cardEffectText:'施法后爆发攻速'},
  bulwark_armor:{category:'defense',cardStatText:'物抗＋60 · 元抗＋50',cardEffectText:'减伤5%'},
  guardian_oath:{category:'defense',cardStatText:'生命＋400 · 物抗＋30 · 元抗＋20',cardEffectText:'开局获得护盾'},
  thornmail:{category:'defense',cardStatText:'生命＋350 · 物抗＋40',cardEffectText:'反弹20%实际伤害'},
  quicksilver_cloak:{category:'defense',cardStatText:'攻击＋20 · 生命＋250 · 攻速＋10%',cardEffectText:'低血清仇恨、回血并解控'},
  regeneration_pendant:{category:'defense',cardStatText:'生命＋300 · 每秒回蓝＋2',cardEffectText:'每2秒恢复5%生命'},
  emergency_pendant:{category:'defense',cardStatText:'生命＋300 · 初始法力＋20',cardEffectText:'低血急救并减伤'},
  redemption_lamp:{category:'support',cardStatText:'初始法力＋20 · 生命＋150',cardEffectText:'周期治疗最低血友军'},
  eagle_scope:{category:'damage',cardStatText:'攻速＋40% · 距离＋1',cardEffectText:'参与击杀继续增加射程'},
  pansheng_armor:{category:'defense',cardStatText:'生命＋600 · 生命＋10%',cardEffectText:'纯生命坦克装备'},
  element_scroll:{category:'tempo',cardStatText:'初始法力＋20',cardEffectText:'每秒自动回复3点法力'},
  berserker_rune:{category:'damage',cardStatText:'攻击＋80',cardEffectText:'纯攻击力装备'},
  unyielding_armor:{category:'damage',cardStatText:'攻击＋50 · 生命＋400',cardEffectText:'半血触发护盾'},
  domain_core_swift:{category:'support',cardStatText:'生命＋150 · 初始法力＋10',cardEffectText:'横排友军攻速＋20%'},
  domain_core_battle:{category:'support',cardStatText:'生命＋150 · 初始法力＋10',cardEffectText:'横排友军攻击＋15%'},
  domain_core_guard:{category:'support',cardStatText:'生命＋150 · 初始法力＋10',cardEffectText:'开局为横排友军提供护盾'},
  frozen_core:{category:'defense',cardStatText:'生命＋300 · 初始法力＋30',cardEffectText:'半血回蓝并获得护盾'}
};
for(const [id,meta] of Object.entries(EQUIPMENT_WAREHOUSE_META)){
  Object.assign(EQUIPMENT_CONFIG[id],meta,{detailText:EQUIPMENT_CONFIG[id].effectText,itemClass:'standard_completed'});
}
const CONSUMABLE_CONFIG={
  item_remover:{id:'item_remover',name:'装备拆卸器',icon:'assets/equipment/item_remover.png',category:'special',consumable:true,targetType:'equipped_unit',cardStatText:'一次性消耗品',cardEffectText:'卸下全部装备',detailText:'对拥有装备的棋子使用，将其全部装备卸下并放回装备仓库。使用成功后消耗。'},
  item_reforger:{id:'item_reforger',name:'装备重铸器',icon:'assets/equipment/item_reforger.png',category:'special',consumable:true,targetType:'equipped_unit',cardStatText:'一次性消耗品',cardEffectText:'重铸全部装备',detailText:'对拥有装备的棋子使用，将其全部装备卸下，并把每件装备随机重铸为另一件普通成装。新装备返回装备仓库，使用成功后消耗。'}
};
const EQUIPMENT_GLOBAL_CAPS={attackSpeed:5,critChance:1,tenacity:.50,damageAmpFromEquipment:1,damageReductionFromEquipment:.80};
const equipmentIconImages={};
for(const config of Object.values(EQUIPMENT_CONFIG)){const image=new Image();image.src=config.icon;image.onerror=()=>console.warn('装备图标加载失败',config.id,config.icon);equipmentIconImages[config.id]=image}
