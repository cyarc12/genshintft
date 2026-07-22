const EQUIPMENT_CONFIG={
arcane_prism:{id:'arcane_prism',name:'秘法棱镜',icon:'assets/equipment/arcane_prism.png',stats:{critChance:.15,skillAmp:.10},statText:'暴击率＋15%，技能增幅＋10%',effectText:'技能伤害可以暴击。',effect:{type:'skill_can_crit'}},
battle_emblem:{id:'battle_emblem',name:'战意徽章',icon:'assets/equipment/battle_emblem.png',stats:{atkPercent:.10,hpPercent:.12},statText:'攻击力＋10%，最大生命＋12%',effectText:'普攻或完整技能造成有效伤害后获得1层战意；每层造成的伤害提高2%，最多5层。满层额外获得10抗性。',effect:{type:'battle_will_stacks',damageAmpPerStack:.02,maxStacks:5,fullStackRes:10}},
giant_slayer:{id:'giant_slayer',name:'巨人猎手',icon:'assets/equipment/giant_slayer.png',stats:{atkPercent:.16},statText:'攻击力＋16%',effectText:'对最终最大生命高于自己的目标造成的普攻和技能伤害提高22%。',effect:{type:'damage_amp_vs_higher_max_hp',value:.22}},
shieldbreaker_spear:{id:'shieldbreaker_spear',name:'破盾之矛',icon:'assets/equipment/shieldbreaker_spear.png',stats:{atkPercent:.12,skillAmp:.08},statText:'攻击力＋12%，技能增幅＋8%',effectText:'对伤害开始结算时拥有护盾的目标造成的普攻和技能伤害提高25%。',effect:{type:'damage_amp_vs_shield',value:.25}},
execution_blade:{id:'execution_blade',name:'处刑之刃',icon:'assets/equipment/execution_blade.png',stats:{critChance:.10,critDamage:.30},statText:'暴击率＋10%，暴击伤害＋30%',effectText:'对当前生命低于35%的目标造成的普攻和技能伤害提高24%。',effect:{type:'execute_damage_amp',hpThreshold:.35,value:.24}},
bloodthirst_blade:{id:'bloodthirst_blade',name:'饮血长刃',icon:'assets/equipment/bloodthirst_blade.png',stats:{atkPercent:.12,res:10},statText:'攻击力＋12%，抗性＋10',effectText:'将普攻和技能造成的实际生命伤害的20%转化为治疗。',effect:{type:'lifesteal_from_hp_damage',value:.20}},
judgment_emblem:{id:'judgment_emblem',name:'裁决徽记',icon:'assets/equipment/judgment_emblem.png',stats:{startMana:15,skillAmp:.08},statText:'初始法力＋15，技能增幅＋8%',effectText:'技能造成有效伤害时，对目标施加50%重伤，持续6秒；每个目标内置冷却2秒。',effect:{type:'grievous_on_skill_damage',grievous:.50,duration:6,perTargetCooldown:2}},
mana_ring:{id:'mana_ring',name:'回能指环',icon:'assets/equipment/mana_ring.png',stats:{attackSpeed:.10,startMana:5},statText:'攻击速度＋0.10，初始法力＋5',effectText:'普通攻击有效命中后额外恢复5点法力，内置冷却0.75秒。',effect:{type:'extra_mana_on_normal_hit',value:5,cooldown:.75}},
temporal_bowstring:{id:'temporal_bowstring',name:'时序弓弦',icon:'assets/equipment/temporal_bowstring.png',stats:{attackSpeed:.12,atkPercent:.10},statText:'攻击速度＋0.12，攻击力＋10%',effectText:'每3秒额外获得0.05攻击速度，最多6层。',effect:{type:'timed_attack_speed_stacks',interval:3,attackSpeedPerStack:.05,maxStacks:6}},
berserker_bracer:{id:'berserker_bracer',name:'狂战护腕',icon:'assets/equipment/berserker_bracer.png',stats:{hpPercent:.12,attackSpeed:.10},statText:'最大生命＋12%，攻击速度＋0.10',effectText:'生命低于50%时，额外获得0.32攻击速度。',effect:{type:'low_hp_attack_speed',hpThreshold:.5,value:.32}},
hunter_feather:{id:'hunter_feather',name:'追猎羽饰',icon:'assets/equipment/hunter_feather.png',stats:{startMana:12,attackSpeed:.10},statText:'初始法力＋12，攻击速度＋0.10',effectText:'完整释放技能后额外获得0.30攻击速度，持续5秒。',effect:{type:'attack_speed_after_cast',value:.30,duration:5}},
bulwark_armor:{id:'bulwark_armor',name:'坚壁重铠',icon:'assets/equipment/bulwark_armor.png',stats:{res:24},statText:'抗性＋24',effectText:'受到的敌方伤害降低10%。',effect:{type:'enemy_damage_reduction',value:.10}},
guardian_oath:{id:'guardian_oath',name:'守护之誓',icon:'assets/equipment/guardian_oath.png',stats:{hpPercent:.18},statText:'最大生命＋18%',effectText:'战斗开始时获得相当于26%最终最大生命的护盾，持续10秒。',effect:{type:'battle_start_shield',maxHpRatio:.26,duration:10}},
regeneration_pendant:{id:'regeneration_pendant',name:'再生坠饰',icon:'assets/equipment/regeneration_pendant.png',stats:{hpPercent:.16,healShieldPower:.10},statText:'最大生命＋16%，治疗护盾强度＋10%',effectText:'每2秒恢复3%最终最大生命。',effect:{type:'periodic_self_heal',interval:2,maxHpRatio:.03}},
emergency_pendant:{id:'emergency_pendant',name:'急救吊坠',icon:'assets/equipment/emergency_pendant.png',stats:{startMana:10,hpPercent:.12},statText:'初始法力＋10，最大生命＋12%',effectText:'每场战斗首次低于40%生命且仍存活时，恢复25%最终最大生命。',effect:{type:'once_low_hp_heal',hpThreshold:.40,maxHpRatio:.25}},
thornmail:{id:'thornmail',name:'荆棘胸甲',icon:'assets/equipment/thornmail.png',stats:{res:20,hpPercent:.10},statText:'抗性＋20，最大生命＋10%',effectText:'受到敌方普通攻击时，反弹15%有效承伤，单次最多45点。',effect:{type:'normal_attack_reflect',value:.15,perHitCap:45}},
quicksilver_cloak:{id:'quicksilver_cloak',name:'水银披风',icon:'assets/equipment/quicksilver_cloak.png',stats:{tenacity:.25,hpPercent:.10},statText:'韧性＋25%，最大生命＋10%',effectText:'每场战斗第一次即将受到硬控制时免疫该控制，并获得20%伤害减免，持续4秒。',effect:{type:'first_hard_control_immunity',damageReduction:.20,duration:4}},
redemption_lamp:{id:'redemption_lamp',name:'救赎灯盏',icon:'assets/equipment/redemption_lamp.png',stats:{startMana:15,healShieldPower:.18},statText:'初始法力＋15，治疗护盾强度＋18%',effectText:'每7秒治疗生命比例最低的友军：主目标获得装备者10%最终最大生命的治疗，其周围1格内其他友军获得5%治疗。',effect:{type:'periodic_area_heal',interval:7,mainTargetMaxHpRatio:.10,nearbyMaxHpRatio:.05,radius:1}}
};
const EQUIPMENT_WAREHOUSE_META={
  arcane_prism:{category:'damage',cardStatText:'暴击＋15% · 技能增幅＋10%',cardEffectText:'技能可暴击'},
  battle_emblem:{category:'damage',cardStatText:'攻击＋10% · 生命＋12%',cardEffectText:'战意叠层'},
  giant_slayer:{category:'damage',cardStatText:'攻击＋16%',cardEffectText:'对高血目标增伤'},
  shieldbreaker_spear:{category:'damage',cardStatText:'攻击＋12% · 技能增幅＋8%',cardEffectText:'对护盾增伤'},
  execution_blade:{category:'damage',cardStatText:'暴击＋10% · 暴伤＋30%',cardEffectText:'残血斩杀增伤'},
  bloodthirst_blade:{category:'damage',cardStatText:'攻击＋12% · 抗性＋10',cardEffectText:'伤害转化治疗'},
  judgment_emblem:{category:'tempo',cardStatText:'初始法力＋15 · 技能增幅＋8%',cardEffectText:'技能施加重伤'},
  mana_ring:{category:'tempo',cardStatText:'攻速＋0.10 · 初始法力＋5',cardEffectText:'普攻额外回蓝'},
  temporal_bowstring:{category:'tempo',cardStatText:'攻速＋0.12 · 攻击＋10%',cardEffectText:'周期叠加攻速'},
  berserker_bracer:{category:'tempo',cardStatText:'生命＋12% · 攻速＋0.10',cardEffectText:'低血提高攻速'},
  hunter_feather:{category:'tempo',cardStatText:'初始法力＋12 · 攻速＋0.10',cardEffectText:'施法后提高攻速'},
  bulwark_armor:{category:'defense',cardStatText:'抗性＋24',cardEffectText:'降低敌方伤害'},
  guardian_oath:{category:'defense',cardStatText:'最大生命＋18%',cardEffectText:'开局获得护盾'},
  thornmail:{category:'defense',cardStatText:'抗性＋20 · 生命＋10%',cardEffectText:'反弹普攻伤害'},
  quicksilver_cloak:{category:'defense',cardStatText:'韧性＋25% · 生命＋10%',cardEffectText:'首次免疫硬控'},
  regeneration_pendant:{category:'support',cardStatText:'生命＋16% · 治疗护盾＋10%',cardEffectText:'周期恢复生命'},
  emergency_pendant:{category:'support',cardStatText:'初始法力＋10 · 生命＋12%',cardEffectText:'低血触发急救'},
  redemption_lamp:{category:'support',cardStatText:'初始法力＋15 · 治疗护盾＋18%',cardEffectText:'周期治疗队友'}
};
for(const [id,meta] of Object.entries(EQUIPMENT_WAREHOUSE_META)){
  Object.assign(EQUIPMENT_CONFIG[id],meta,{detailText:EQUIPMENT_CONFIG[id].effectText,itemClass:'standard_completed'});
}
const CONSUMABLE_CONFIG={
  item_remover:{id:'item_remover',name:'装备拆卸器',icon:'assets/equipment/item_remover.png',category:'special',consumable:true,targetType:'equipped_unit',cardStatText:'一次性消耗品',cardEffectText:'卸下全部装备',detailText:'对拥有装备的棋子使用，将其全部装备卸下并放回装备仓库。使用成功后消耗。'},
  item_reforger:{id:'item_reforger',name:'装备重铸器',icon:'assets/equipment/item_reforger.png',category:'special',consumable:true,targetType:'equipped_unit',cardStatText:'一次性消耗品',cardEffectText:'重铸全部装备',detailText:'对拥有装备的棋子使用，将其全部装备卸下，并把每件装备随机重铸为另一件普通成装。新装备返回装备仓库，使用成功后消耗。'}
};
const EQUIPMENT_GLOBAL_CAPS={attackSpeed:5,critChance:1,tenacity:.50,skillAmpFromEquipment:.40,damageAmpFromEquipment:.45,damageReductionFromEquipment:.35,healShieldPowerFromEquipment:.50};
const equipmentIconImages={};
for(const config of Object.values(EQUIPMENT_CONFIG)){const image=new Image();image.src=config.icon;image.onerror=()=>console.warn('装备图标加载失败',config.id,config.icon);equipmentIconImages[config.id]=image}
