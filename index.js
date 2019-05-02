module.exports = function bam_hp_bar(mod) {
	
	const command = mod.command;
	
	var	enabled = true,
		hooks = [],
		gage_info ={id: 0n,
					huntingZoneId: 0,
					templateId: 0,
					target: 0n,
					unk1: 0,
					unk2: 0,
					curHp: 16000000000n,
					maxHp: 16000000000n,
					unk3: 1};
	
	function update_hp()
	{
		mod.toClient('S_BOSS_GAGE_INFO', 3, gage_info);
	}
	
	// 0: 0% <= hp < 20%, 1: 20% <= hp < 40%, 2: 40% <= hp < 60%, 3: 60% <= hp < 80%, 4: 80% <= hp < 100%, 5: 100% hp
	function correct_hp(stage)
	{
		let boss_hp_stage = BigInt(20*(1+stage));
		if(gage_info.curHp * 100n / gage_info.maxHp > boss_hp_stage) // we missed some part of the fight?
		{
			//command.message("correcting bam hp from " + String(gage_info.curHp) + " (" + String(gage_info.curHp * 100n / gage_info.maxHp) + "%) to " + String(gage_info.maxHp * boss_hp_stage / 100n) + " (" + String((gage_info.maxHp * boss_hp_stage / 100n) * 100n / gage_info.maxHp) + "%)");
			gage_info.curHp = gage_info.maxHp * boss_hp_stage / 100n;
			update_hp();
			command.message('Correcting boss hp down to <font color="#E69F00">' + String(boss_hp_stage) + '</font>%');
		}
	}
	
	mod.hook('S_SPAWN_NPC', 11, (event) => {
		if (!enabled || event.walkSpeed != 240) return;
		
		switch (event.templateId)
		{
			case 5001: // Ortan
				event.shapeId = 303730;
				event.templateId = 7000;
				event.huntingZoneId = 434;
				load(event);
				return true;
			case 4001: // Cerrus
				event.shapeId = 303750;
				event.templateId = 1000;
				event.huntingZoneId = 994;
				load(event);
				return true;
			case 501:  // Hazard
				event.shapeId = 303740;
				event.templateId = 77730;
				event.huntingZoneId = 777;
				load(event);
				return true;
		}
	});

	command.add('bamhp', () => {
		enabled = !enabled;
		command.message((enabled ? '<font color="#56B4E9">enabled</font>' : '<font color="#E69F00">disabled</font>'));
	})

function load(e)
{
	//console.log("BAM " + event.templateId + " FOUND, and his name is: " + event.npcName + ", id: " + String(event.gameId));
	gage_info.id = e.gameId;
	gage_info.curHp = gage_info.maxHp;
	correct_hp(e.hpLevel);
	if(e.mode)
	{
		command.message('You missed ~ <font color="#E69F00">' + Math.round((99999999 - event.remainingEnrageTime)/1000) + '</font> sec. of the fight');
	}
	if(e.hpLevel == 5)
	{
		command.message("BAM is at full 100% hp, nobody touched it");
	}
	else if(e.hpLevel == 0)
	{
		command.message("BAM is likely far below 20% hp, it may die any moment now");
	}
	if(!hooks.length)
	{
		setTimeout(update_hp, 1000);
		hook('S_NPC_STATUS', 2, (event) => {
			if (event.gameId === gage_info.id)
			{
				correct_hp(event.hpLevel);
			}
		});
		
		hook('S_EACH_SKILL_RESULT', 13, (event) => {
			if (event.target === gage_info.id && event.type === 1)
			{
				gage_info.curHp -= event.value;
				update_hp();
			}
		});
		
		hook('S_DESPAWN_NPC', 3, (event) => {
			if (event.gameId === gage_info.id)
			{
				//console.log("BAM " + gage_info.templateId + " Despawned " + event.type + ", ID: " + String(event.gameId));
				unload();
			}
		});
	}
}
	
	function unload()
	{
		if(hooks.length)
		{
			for(let h of hooks) mod.unhook(h);

			hooks = []
		}
	}

	function hook()
	{
		hooks.push(mod.hook(...arguments));
	}
}
