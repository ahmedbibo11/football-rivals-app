/* FOOTBALL RIVALS 4.0 — deterministic event-derived simulation model.
 * A shot outcome is resolved only when the model reaches that shot; results are
 * not pre-assigned to the final score. Runs identically in live and instant mode.
 */
(function(root,factory){const mod=factory();if(typeof module==='object'&&module.exports)module.exports=mod;root.FRSim=mod})(typeof globalThis==='undefined'?this:globalThis,function(){'use strict';
const POS=['GK','RB','CB','CB','LB','CM','CDM','CM','RW','LW','ST'];
const F433=[[.5,.94],[.83,.79],[.60,.82],[.40,.82],[.17,.79],[.76,.57],[.5,.67],[.24,.57],[.81,.31],[.19,.31],[.5,.23]];
const F4231=[[.5,.94],[.83,.79],[.60,.82],[.40,.82],[.17,.79],[.65,.67],[.38,.66],[.51,.48],[.83,.33],[.17,.33],[.5,.22]];
const F442=[[.5,.94],[.83,.79],[.60,.82],[.40,.82],[.17,.79],[.66,.57],[.51,.63],[.32,.57],[.85,.43],[.41,.29],[.60,.27]];
const FORMATIONS={'4-3-3':F433,'4-2-3-1':F4231,'4-4-2':F442};
const TACTICS=['balanced','attack','counter','press'];const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
function prng(o){o.rng=(Math.imul(o.rng,1664525)+1013904223)>>>0;return o.rng/4294967296}
function pick(o,arr){return arr[Math.floor(prng(o)*arr.length)]}
function attributes(card,slot){const o=clamp(+card?.ovr||76,58,99),r=Array.isArray(card?.stats)?card.stats.map(Number):[];const a=['ST','LW','RW'].includes(slot),d=['GK','RB','CB','LB','CDM'].includes(slot);
 const keeper=slot==='GK'?clamp((r[0]||o)*.25+(r[1]||o)*.15+(r[3]||o)*.35+(r[5]||o)*.25,40,99):15;
 const value=(i,fallback,min)=>Number.isFinite(r[i])&&r[i]>=0&&r[i]<=99?r[i]:clamp(fallback,min,99);
 return{ovr:o,pace:value(0,o+(a?3:d?-5:0),40),shot:value(1,o+(a?3:d?-13:0),32),pass:value(2,o+(slot==='CM'?4:-2),40),dribble:value(3,o+(a?3:d?-7:0),40),def:value(4,o+(d?5:a?-17:0),34),phys:value(5,o+(d?2:0),40),save:keeper}}
function squadFrom(src){return src.map((s,n)=>{const card=s.card||s,slot=s.slot||POS[n];return {id:String(card.id||`sample_${n}`),name:String(card.name||`PLAYER ${n+1}`).slice(0,36),slot,number:n+1,attr:attributes(card,slot),stamina:100,flag:String(card.flag||''),sprite:card.sprite||null}})}
function create(rosters,opts={}){if(!Array.isArray(rosters)||rosters.length!==2||rosters.some(r=>!Array.isArray(r.squad)||r.squad.length!==11))throw Error('لازم تشكيلتين من 11 لاعب');
const seed=(Number(opts.seed)||Math.floor(Math.random()*4294967295)||1)>>>0;const id=String(opts.id||`fr4-${seed}-${Date.now()}`);
const s={version:4,id,seed,rng:seed,minute:0,mode:opts.mode||'broadcast',paused:false,done:false,half:false,pending:null,score:[0,0],possession:0,zone:50,carrier:7,lastEvent:null,events:[],goals:[],frames:[],teams:rosters.map((r,i)=>({name:String(r.name||`TEAM ${i+1}`).slice(0,24),tactic:TACTICS.includes(r.tactic)?r.tactic:'balanced',formation:'4-3-3',chemistry:clamp(+r.chemistry||0,0,11),players:squadFrom(r.squad)})),stats:[0,1].map(()=>({shots:0,onTarget:0,passes:0,completed:0,turnovers:0,tackles:0,interceptions:0,saves:0,fouls:0,corners:0,xg:0,poss:0,attacks:0,highChances:0})),fixture:opts.fixture||null};
 s.possession=prng(s)<.5?0:1;record(s,'kickoff','⚽ صافرة البداية في RIVALS ARENA',{team:s.possession});frame(s);return s}
function teamPower(s,side,type){const t=s.teams[side],weights={att:[8,9,10,5,7],mid:[5,6,7,8,9],def:[0,1,2,3,4,6]}[type];let total=0;for(const index of weights){const p=t.players[index];if(!p)continue;const a=p.attr;total+=(type==='att'?(a.shot*.3+a.pace*.26+a.dribble*.26+a.pass*.18):type==='mid'?(a.pass*.47+a.dribble*.3+a.phys*.23):(a.def*.65+a.phys*.20+a.pace*.15))*(.67+p.stamina/300)}return total/(weights.length||1)+t.chemistry*.55}
function record(s,type,message,extra={}){const e={id:s.events.length,minute:s.minute,type,message,...extra};s.events.push(e);s.lastEvent=e;return e}
function frame(s){const pos=s.possession,p=s.teams[pos].players[s.carrier]||s.teams[pos].players[7];const formation=s.teams.map(t=>t.formation);const bpos=pos===0?1-s.zone/100:s.zone/100;
 const all=s.teams.map((team,side)=>team.players.map((pl,n)=>{const b=FORMATIONS[formation[side]][n];const isAtt=side===pos;const sx=side===0?b[0]:1-b[0],sy=side===0?b[1]:1-b[1];let x=sx+(isAtt?(.08*(.5-sx)):.1*(.5-sx));let y=isAtt?(sy+(.5-bpos)*.33):(sy+(.5-bpos)*.19);if(isAtt&&n===s.carrier){x=clamp(.5+(n===8?.26:n===9?-.26:(prng(s)-.5)*.21),.08,.92);y=clamp(bpos,.09,.91)}return {x:clamp(x,.04,.96),y:clamp(y,.04,.96),stamina:pl.stamina}}));
 const ball=all[pos][s.carrier];s.frames.push({minute:s.minute,score:s.score.slice(),possession:s.possession,carrier:s.carrier,players:all,ball:{x:ball.x,y:ball.y},type:s.lastEvent?.type||'play',event:s.lastEvent?.message||''});if(s.frames.length>180)s.frames.shift()}
function rating(p,key){return (p?.attr?.[key]||70)*(.75+(p?.stamina||100)/400)}
function chooseCarrier(s,side){const forward=[5,7,8,9,10],weights=forward.map(n=>Math.max(1,rating(s.teams[side].players[n],'shot')*(n>=8?1.5:1)));let sum=weights.reduce((x,y)=>x+y,0),r=prng(s)*sum;for(let i=0;i<weights.length;i++){r-=weights[i];if(r<=0)return forward[i]}return 10}
function step(s,decision){if(s.done)return s;if(s.pending){if(!decision)return s;resolveChance(s,s.pending,decision);s.pending=null;advance(s);return s}
 if(s.minute>=90){finish(s);return s}
 s.minute++;if(s.minute===46&&!s.half){s.half=true;record(s,'halftime','☕ الشوط الثاني بدأ');}
 const a=s.possession,b=1-a;const tactic=s.teams[a].tactic,oppTactic=s.teams[b].tactic;
 const power=teamPower(s,a,'mid'),opp=teamPower(s,b,'def');const attackers=teamPower(s,a,'att'),defenders=teamPower(s,b,'def');
 const posRate=clamp(.51+(power-opp)*.006+(tactic==='attack'?.038:tactic==='counter'?.01:tactic==='press'?.02:0)-(oppTactic==='press'?.035:0),.29,.73);
 s.stats[a].poss+=clamp(posRate*1.15,.35,.85);s.stats[b].poss+=1-clamp(posRate*1.15,.35,.85);
 const actions=2+Math.floor(prng(s)*3);let failed=false;
 for(let i=0;i<actions;i++){
 const passer=s.teams[a].players[s.carrier],opponent=s.teams[b].players[2+Math.floor(prng(s)*6)];const prob=clamp(.76+(rating(passer,'pass')-rating(opponent,'def'))*.0036+s.teams[a].chemistry*.008-(oppTactic==='press'?.066:0),.42,.96);
 s.stats[a].passes++;if(prng(s)>prob){s.stats[a].turnovers++;s.stats[b].interceptions++;s.stats[b].tackles++;s.possession=b;s.zone=clamp(100-s.zone+prng(s)*12-6,18,75);s.carrier=chooseCarrier(s,b);failed=true;if(prng(s)<.19)record(s,'interception',`🛡️ ${s.teams[b].players[6].name} قطع التمريرة`,{team:b});break}
 s.stats[a].completed++;const from=s.carrier;s.zone=clamp(s.zone+(7+prng(s)*14)*(tactic==='counter'?1.2:tactic==='attack'?1.13:.9),13,95);s.carrier=chooseCarrier(s,a);if(s.minute%4===0&&i===1)record(s,'pass',`↗ ${s.teams[a].players[from].name} مرّر إلى ${s.teams[a].players[s.carrier].name}`,{team:a});
 }
 if(!failed&&s.possession===a){s.stats[a].attacks++;const shootProb=clamp((s.zone-47)*.012+(.04+(attackers-defenders)*.003)+(tactic==='attack'?.065:tactic==='counter'?.03:0),0,.57);
 if(s.zone>=54&&prng(s)<shootProb){const shooter=s.teams[a].players[s.carrier],distance=clamp(33-s.zone*.29,7,29);const chance={team:a,shooter:s.carrier,minute:s.minute,zone:s.zone,distance,xg:clamp(.020+(s.zone-53)*.0055+(rating(shooter,'shot')-75)*.002+(attackers-defenders)*.0017,.025,.53)};
 if(s.mode==='hybrid'&&chance.xg>.10){s.pending=chance;record(s,'decision',`🎮 فرصة حاسمة لـ ${shooter.name}: اختار القرار`,{team:a});frame(s);return s}
 resolveChance(s,chance,'shoot');
 }}
 // Two-sided tactics change the real event model and stamina cost.
 for(let side=0;side<2;side++){const t=s.teams[side],loss=(t.tactic==='press'?.26:t.tactic==='attack'?.19:.11);for(const p of t.players)p.stamina=clamp(p.stamina-loss*(p.slot==='GK'?.25:1)+(s.minute===46?6:0),38,100)}
 advance(s);return s}
function resolveChance(s,c,decision){const a=c.team,b=1-a,shooter=s.teams[a].players[c.shooter];let xg=c.xg;if(decision==='pass'){const passerChance=clamp(.52+(rating(shooter,'pass')-70)*.006-(teamPower(s,b,'def')-75)*.002,.30,.83);s.stats[a].passes++;if(prng(s)>passerChance){s.stats[a].turnovers++;s.stats[b].interceptions++;s.possession=b;s.zone=38;s.carrier=6;record(s,'lose',`❌ ${shooter.name} أضاع الفرصة بتمريرة مقطوعة`,{team:a});return}xg=clamp(xg*1.25+.027,.04,.71);s.stats[a].completed++;s.carrier=10;record(s,'build','🔗 تمريرة حاسمة داخل المنطقة',{team:a})}
 if(decision==='dribble'){if(prng(s)>clamp(.48+(rating(shooter,'dribble')-77)*.007,.22,.76)){s.stats[b].tackles++;s.possession=b;s.zone=30;s.carrier=6;record(s,'lose',`🛡️ ${shooter.name} فقد الكرة أثناء المراوغة`,{team:a});return}xg=clamp(xg*1.36+.025,.04,.75);record(s,'dribble',`✨ ${shooter.name} تخطّى المدافع`,{team:a})}
 const onTarget=clamp(.43+(rating(shooter,'shot')-72)*.008+(xg-.15)*.2,.28,.88),gk=s.teams[b].players[0],keeperSave=clamp(.30+(rating(gk,'save')-75)*.007-(xg-.10)*.37,.15,.62),goalChance=clamp(xg*.70+(1-keeperSave)*.20,.07,.71),expectedGoal=onTarget*goalChance;
 s.stats[a].shots++;s.stats[a].xg+=expectedGoal;const isTarget=prng(s)<onTarget;if(!isTarget){record(s,'miss',`↗ ${shooter.name} سدّد خارج المرمى`,{team:a,player:shooter.name,xg:expectedGoal});s.possession=b;s.zone=24;s.carrier=1;return}
 s.stats[a].onTarget++;if(prng(s)<goalChance){s.score[a]++;s.goals.push({team:a,player:shooter.name,id:shooter.id,minute:s.minute,xg:expectedGoal,assist:decision==='pass'?s.teams[a].players[7].name:null});record(s,'goal',`⚽ جووووول! ${shooter.name} ${s.minute}'`,{team:a,player:shooter.name,xg:expectedGoal});s.possession=b;s.zone=50;s.carrier=7}else{s.stats[b].saves++;if(prng(s)<.28){s.stats[a].corners++;s.zone=77;s.carrier=8}else{s.possession=b;s.zone=21;s.carrier=1}record(s,'save',`🧤 ${gk.name} يتصدّى لتسديدة ${shooter.name}`,{team:b,player:gk.name,xg:expectedGoal})}}
function advance(s){frame(s);if(s.minute>=90)finish(s)}
function finish(s){if(s.done)return s;s.done=true;s.pending=null;s.minute=90;record(s,'fulltime',`🏁 النهاية · ${s.teams[0].name} ${s.score[0]} — ${s.score[1]} ${s.teams[1].name}`);frame(s);return s}
function simulate(s,decision='shoot'){let guard=0;while(!s.done&&guard++<400){step(s,s.pending?decision:undefined)}if(guard>=400)throw Error('Simulation did not converge');return s}
function changeTactic(s,team,tactic,formation){if(s.done)return;if(![0,1].includes(team))throw Error('invalid team');if(!TACTICS.includes(tactic)||!FORMATIONS[formation])throw Error('invalid tactic');s.teams[team].tactic=tactic;s.teams[team].formation=formation;record(s,'tactic',`📋 ${s.teams[team].name}: ${tactic} · ${formation}`,{team})}
function analysis(s){const a=s.stats[0],b=s.stats[1];const total=a.poss+b.poss||1;const insights=[];const dif=s.score[0]-s.score[1];insights.push(dif>0?`🏆 ${s.teams[0].name} تفوّق بالنتيجة ${s.score.join(' - ')}`:dif<0?`🏆 ${s.teams[1].name} تفوّق بالنتيجة ${s.score.join(' - ')}`:'🤝 انتهت المواجهة بالتعادل');
 for(let i=0;i<2;i++){const o=1-i,st=s.stats[i],op=s.stats[o],nm=s.teams[i].name,acc=st.passes?Math.round(st.completed/st.passes*100):0;if(st.xg>op.xg+.5&&s.score[i]<=s.score[o])insights.push(`🎯 ${nm} صنع فرصًا أعلى (${st.xg.toFixed(2)} xG) لكنه لم يستغلها بما يكفي؛ تحسين اللمسة الأخيرة مهم.`);if(acc<67)insights.push(`🔄 تمريرات ${nm} الناجحة ${acc}% فقط؛ خطة متوازنة قد تقلّل فقدان الكرة.`);if(st.poss/total<.42&&st.shots<op.shots)insights.push(`📉 ${nm} فقد السيطرة على الوسط؛ جرّب ضغطًا أعلى أو تغيير توزيع خط الوسط.`);if(st.turnovers>op.turnovers+5)insights.push(`⚠️ ${nm} خسر الكرة ${st.turnovers} مرة مقابل ${op.turnovers}؛ تقليل الاندفاع قد يساعد.`);if(st.shots>7&&st.onTarget/st.shots<.4)insights.push(`🎯 ${nm} يحتاج إلى دقة تسديد أفضل: ${st.onTarget} من ${st.shots} فقط على المرمى.`)}
 if(insights.length===1)insights.push(`📊 الاستحواذ: ${Math.round(a.poss/total*100)}% مقابل ${Math.round(b.poss/total*100)}%، والفرص المتوقعة: ${a.xg.toFixed(2)} مقابل ${b.xg.toFixed(2)}.`);return insights}
function summary(s){return{id:s.id,minute:s.minute,seed:s.seed,fixture:s.fixture,teams:s.teams.map(t=>t.name),score:s.score.slice(),stats:s.stats.map(x=>({...x})),goals:s.goals.map(x=>({...x})),done:s.done,at:new Date().toISOString()}}
function createSchedule(teams){if(teams.length%2)throw Error('need even teams');const n=teams.length,arr=teams.map((_,i)=>i),pairs=[];for(let r=0;r<n-1;r++){for(let i=0;i<n/2;i++){const home=(r+i)%2?arr[n-1-i]:arr[i],away=(r+i)%2?arr[i]:arr[n-1-i];pairs.push({id:`r${r+1}m${i+1}`,round:r+1,home,away,result:null})}arr.splice(1,0,arr.pop())}const b=pairs.map((p,i)=>({...p,id:`r${p.round+n-1}m${i%n+1}`,round:p.round+n-1,home:p.away,away:p.home,result:null}));return pairs.concat(b)}
function table(season){const rows=season.teams.map((t,id)=>({id,name:t.name,p:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,pts:0}));for(const f of season.fixtures){if(!f.result)continue;const a=rows[f.home],b=rows[f.away],x=f.result.score[0],y=f.result.score[1];a.p++;b.p++;a.gf+=x;a.ga+=y;b.gf+=y;b.ga+=x;if(x>y){a.w++;b.l++;a.pts+=3}else if(x<y){b.w++;a.l++;b.pts+=3}else{a.d++;b.d++;a.pts++;b.pts++}}
 for(const r of rows)r.gd=r.gf-r.ga;return rows.sort((a,b)=>b.pts-a.pts||b.gd-a.gd||b.gf-a.gf||a.name.localeCompare(b.name))}
function scorers(season){const map=new Map();for(const f of season.fixtures){for(const g of f.result?.goals||[]){const team=f[g.team===0?'home':'away'];const key=`${team}::${g.id||g.player}`,v=map.get(key)||{player:g.player,team:season.teams[team].name,goals:0};v.goals++;map.set(key,v)}}return Array.from(map.values()).sort((a,b)=>b.goals-a.goals||a.player.localeCompare(b.player))}
function makeSeason(teams,seed=2026){return {version:4,id:`season-${Date.now()}`,seed,teams,fixtures:createSchedule(teams),createdAt:new Date().toISOString(),finished:false}}
function simulateFixture(season,f){if(f.result)return f.result;const sides=[season.teams[f.home],season.teams[f.away]];const id=`${season.id}-${f.id}`;const key=seedHash(`${season.seed}/${id}`);const m=create(sides,{seed:key,id,mode:'instant',fixture:f.id});simulate(m);f.result=summary(m);season.finished=season.fixtures.every(x=>x.result);return f.result}
function seedHash(str){let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
return{POS,FORMATIONS,TACTICS,attributes,create,step,simulate,changeTactic,analysis,summary,makeSeason,simulateFixture,table,scorers,seedHash};
});

