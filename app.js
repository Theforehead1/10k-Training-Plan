/*
 * 10K Project — no framework, subscriptions, backend or build step.
 * Edit WEEK_DATA to adapt the workouts. Dates use local calendar dates.
 * Training information is general guidance. Follow your physiotherapist's advice.
 */
'use strict';

const APP_VERSION = '1.0.0';
const STORAGE_KEY = 'tenk-project-log-v1';
const PLAN_START = '2026-11-23';  // Week 1, Monday
const INTRO_START = '2026-11-21'; // First workout, Saturday
const RACE_DATE = '2027-04-04';   // Provisional, Sunday

// Distances are planning guides in kilometres, not obligatory quotas.
// The weekly kilometre ranges include warm-ups, cool-downs and long runs.
const WEEK_DATA = [
  { range:[12,16], tue:4, fri:4, long:6, wed:0, focus:'Three easy runs. Physio assessment and symptom tracking.' },
  { range:[15,18], tue:4, fri:5, long:7, wed:0, focus:'Keep easy runs conversational. No pace targets.' },
  { range:[17,20], tue:5, fri:5, long:8, wed:0, focus:'Optional 4 × 15-second relaxed strides only if cleared.' },
  { range:[14,17], tue:4, fri:4, long:7, wed:0, focus:'Recovery week. Do not chase mileage.' },
  { range:[20,23], tue:4, fri:4, long:8, wed:6, focus:'3 × 5 min tempo; 2 min easy jog between repetitions.' },
  { range:[22,25], tue:5, fri:4, long:9, wed:6, focus:'3 × 6 min tempo; 2 min easy jog between repetitions.' },
  { range:[24,27], tue:5, fri:5, long:10, wed:7, focus:'3 × 7 min tempo; 2 min easy jog between repetitions.' },
  { range:[20,24], tue:4, fri:4, long:8, wed:7, focus:'5K benchmark, with easy warm-up and cool-down. Only if pain-free.' },
  { range:[26,29], tue:6, fri:5, long:10, wed:8, focus:'3 × 8 min threshold; 2 min jog recoveries.' },
  { range:[28,31], tue:6, fri:6, long:11, wed:8, focus:'5 × 3 min fast, controlled; 2 min jog recoveries.' },
  { range:[30,33], tue:6, fri:6, long:12, wed:9, focus:'2 × 12 min threshold; 3 min jog recovery.' },
  { range:[24,28], tue:5, fri:6, long:9, wed:7, focus:'4 × 3 min controlled. Recovery week.' },
  { range:[31,34], tue:7, fri:7, long:12, wed:8, focus:'5 × 800 m, around current 5K–10K effort; 2–3 min jog.' },
  { range:[33,36], tue:7, fri:7, long:12, wed:9, focus:'4 × 1 km around current 10K effort; 2–3 min jog.' },
  { range:[35,38], tue:8, fri:7, long:13, wed:9, focus:'6 × 800 m controlled; 2–3 min jog.' },
  { range:[27,32], tue:6, fri:5, long:10, wed:7, focus:'5K benchmark, with warm-up and cool-down.' },
  { range:[35,40], tue:8, fri:8, long:13, wed:10, focus:'3 × 2 km at current 10K effort; 3 min easy recovery.' },
  { range:[25,30], tue:6, fri:5, long:9, wed:8, focus:'4 × 1 km controlled, not all-out. Reduce total volume.' },
  { range:[19,23], tue:4, fri:3, long:10, wed:4, focus:'Race week: 3 × 1 min at intended 10K effort, full easy recovery.' }
];

const STRENGTH_A = [
  ['Squat variation (physio-approved)', '3 × 5–6'],
  ['Bench press', '3 × 5–8'],
  ['Pull-ups or lat pulldown', '3 × 6–10'],
  ['Romanian deadlift', '2 × 6–8']
];
const STRENGTH_B = [
  ['Overhead press', '3 × 5–8'],
  ['Chest-supported row', '3 × 6–10'],
  ['Trap-bar deadlift / light RDL', '2 × 4–6'],
  ['Step-up / split squat, if cleared', '2 × 6 each leg']
];
const INTRO_B = [
  ['Bench press or overhead press', '3 × 6–8'],
  ['Chest-supported row', '3 × 8–10'],
  ['Pull-ups or lat pulldown', '2 × 6–10'],
  ['Optional gentle leg exercise', '1–2 easy sets']
];
const TAPER_UPPER = [
  ['Bench or overhead press', '2 × 5–6, easy'],
  ['Chest-supported row', '2 × 6–8, easy'],
  ['Optional pull-ups / pulldown', '1–2 easy sets']
];

function parseDate(iso) { return new Date(`${iso}T12:00:00`); }
function iso(date) { const y = date.getFullYear(), m = String(date.getMonth()+1).padStart(2,'0'), d = String(date.getDate()).padStart(2,'0'); return `${y}-${m}-${d}`; }
function plusDays(day, amount) { const dt = parseDate(day); dt.setDate(dt.getDate()+amount); return iso(dt); }
function dayDifference(a,b) { return Math.round((parseDate(a)-parseDate(b))/86400000); }
function todayISO() { return iso(new Date()); }
function shortDate(day) { return parseDate(day).toLocaleDateString('en-GB',{day:'numeric',month:'short'}); }
function longDate(day) { return parseDate(day).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'}); }
function weekday(day) { return parseDate(day).toLocaleDateString('en-GB',{weekday:'short'}).toUpperCase(); }
function clamp(n,min,max) { return Math.min(max,Math.max(min,n)); }
function clean(text) { return String(text ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function weekPhase(n) { return n <= 4 ? 'Return to running' : n <= 8 ? 'Aerobic foundation' : n <= 12 ? 'Threshold + endurance' : n <= 17 ? 'Race-specific speed' : 'Taper + race'; }
function isWorkout(session) { return session.type !== 'rest'; }
function formatKm(n) { return Number(n).toLocaleString('en-GB',{maximumFractionDigits:1}); }

function makeSession(date, type, title, detail, options={}) {
  return { id:`${date}:${type}`, date, type, title, detail, ...options };
}
function phaseNote(weekNo) {
  if (weekNo<=4) return 'Three easy runs only. Wednesday is an extra recovery / physio day until running tolerance improves.';
  if (weekNo<=8) return 'Introduce one controlled quality session weekly. Keep the other runs truly easy.';
  if (weekNo<=12) return 'Develop threshold fitness. Faster does not mean flat-out.';
  if (weekNo<=17) return 'Use your latest 5K benchmark to calibrate intervals. Avoid forcing a predetermined pace.';
  return 'Maintain some intensity but reduce total fatigue. Arrive fresh.';
}
function qualityDetail(weekNo, data) {
  const benchmark = weekNo===8 || weekNo===16;
  return `${data.focus}\n\n${benchmark ? 'Build gradually into a hard but evenly paced 5K. Note your finishing time. It is a benchmark, not a requirement if knee symptoms persist.' : 'Warm up 10–15 min easy, then do the main set, then cool down 5–10 min easy. Tempo/threshold = RPE 6–7/10. Faster intervals = RPE 7–8/10. Never sprint to exhaustion.'}\n\nTotal distance shown is approximate and includes warm-up and cool-down.`;
}
function strengthDetail(kind, weekNo, intro=false) {
  if (intro) return 'INTRODUCTORY SESSION. Upper-body-focused compound work, 35–40 min. Keep any leg exercise comfortable or skip it. Leave 2–3 reps in reserve. Do not attempt a heavy squat or deadlift before your physio review.';
  if (weekNo===19) return 'Short, optional upper-body activation only. No heavy legs or delayed-onset muscle soreness this close to race day.';
  if (weekNo===18) return 'Taper: reduce sets and loads. Prioritise being fresh for Sunday.';
  if (kind==='strength-a') return '35–45 minutes. Main lower-body strength session. Superset bench and pull-ups if convenient. Keep 1–3 reps in reserve and use only knee-friendly, physio-approved squat variations.';
  return '35–45 minutes. Upper-body priority because your long run is tomorrow. Keep the hinge and any single-leg work light/moderate (about RPE 6–7) or omit if it causes fatigue/pain. Superset press and row if helpful.';
}
function exercisesFor(kind, weekNo, intro=false) {
  if (intro) return INTRO_B;
  if (weekNo>=18) return TAPER_UPPER;
  return kind==='strength-a' ? STRENGTH_A : STRENGTH_B;
}

function generatePlan() {
  const intro = [
    makeSession(INTRO_START,'strength-b','Intro strength · upper body',strengthDetail('strength-b',0,true),{exercises:INTRO_B,week:0}),
    makeSession(plusDays(INTRO_START,1),'easy','Optional easy run or walk', 'OPTIONAL: 4–5 km very easy on flat ground if running feels comfortable and there is no locking, swelling or gait change. Otherwise take a 25–35-minute walk or rest. Your physiotherapist can advise on the right starting load.',{km:4,optional:true,week:0})
  ];
  const weeks = WEEK_DATA.map((data, i) => {
    const n=i+1;
    const start=plusDays(PLAN_START,i*7);
    const getDay=d=>plusDays(start,d);
    const sessions=[
      makeSession(getDay(0),'rest','Rest day','Your weekday buffer for work, recovery and life. No training required.',{week:n}),
      makeSession(getDay(1),'easy','Easy run',`About ${data.tue} km at conversational effort (RPE 3–4/10). Stay comfortable. If knee pain is worsening or alters your stride, stop and reassess.`,{week:n,km:data.tue}),
      n<=4
        ? makeSession(getDay(2),'rest','Recovery / physio','No run today. Optional gentle mobility or prescribed knee rehab only.',{week:n})
        : makeSession(getDay(2),'quality',n===8||n===16?'5K benchmark':'Quality running',qualityDetail(n,data),{week:n,km:data.wed}),
      makeSession(getDay(3),'strength-a',n===19?'Optional light strength':'Strength A · full body',strengthDetail('strength-a',n),{week:n,exercises:exercisesFor('strength-a',n),optional:n===19}),
      makeSession(getDay(4),'easy',n===19?'Short easy shakeout':'Easy run',`About ${data.fri} km at conversational effort. ${n===19?'Optional if you feel better resting. Add 2–4 relaxed strides only if comfortable.':'Avoid turning this into another hard session.'}`,{week:n,km:data.fri,optional:n===19}),
      n===19
        ? makeSession(getDay(5),'rest','Pre-race rest','Lay out your kit, hydrate normally and keep walking light. No strength training today.',{week:n})
        : makeSession(getDay(5),'strength-b','Strength B · upper priority',strengthDetail('strength-b',n),{week:n,exercises:exercisesFor('strength-b',n),optional:n===18}),
      n===19
        ? makeSession(getDay(6),'race','10K race day','Goal range: 42–45 minutes is ambitious. Select a realistic start pace from your March 5K benchmark. Warm up gently, start controlled and aim to finish strongly. Enjoy the charity event!',{week:n,km:10})
        : makeSession(getDay(6),'long','Long easy run',`About ${data.long} km at easy conversational effort. Keep the pace comfortable and prioritise a settled knee over completing a distance target.`,{week:n,km:data.long})
    ];
    return {number:n,start,end:getDay(6),data,phase:weekPhase(n),sessions};
  });
  return {intro,weeks,all:[...intro,...weeks.flatMap(w=>w.sessions)]};
}
const PLAN = generatePlan();
let state = { logs:{}, screen:'home', selectedWeek:1 };
const $app = document.getElementById('app');
const $dialog = document.getElementById('session-dialog');

function loadLogs() {
  try {
    const data=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
    return data && typeof data==='object' && data.logs && typeof data.logs==='object' && !Array.isArray(data.logs) ? data.logs : {};
  } catch { return {}; }
}
function saveLogs() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({version:APP_VERSION,logs:state.logs})); }
  catch { alert('Your browser could not save training data. Use Export backup and check browser storage settings.'); }
}
function getLog(session) { return state.logs[session.id] || {}; }
function status(session) { return getLog(session).status || ''; }
function statusPill(session) {
  const s=status(session);
  return s==='done'?'<span class="badge done">✓ Done</span>':s==='skipped'?'<span class="badge skipped">Skipped</span>':'';
}
function kindBadge(session) {
  const map={easy:['run','Easy'],quality:['quality','Quality'],long:['run','Long'],race:['race','Race'],rest:['rest','Rest'],'strength-a':['strength','Strength'],'strength-b':['strength','Strength']};
  const [cls,label]=map[session.type];
  return `<span class="badge ${cls}">${label}</span>`;
}
function isRun(session) { return ['easy','quality','long','race'].includes(session.type); }
function actualKm(week) {
  return week.sessions.filter(isRun).reduce((sum,s)=>sum+(status(s)==='done' ? (Number(getLog(s).distance)||0):0),0);
}
function plannedKm(week) { return week.sessions.filter(isRun).reduce((sum,s)=>sum+(s.km||0),0); }
function workoutCount(week) { return week.sessions.filter(isWorkout).length; }
function doneCount(week) { return week.sessions.filter(s=>isWorkout(s) && status(s)==='done').length; }
function currentWeek() {
  const today=todayISO();
  if (today<PLAN_START) return 1;
  return clamp(Math.floor(dayDifference(today,PLAN_START)/7)+1,1,19);
}
function weeksActive() { return todayISO()>=PLAN_START && todayISO()<=RACE_DATE; }
function daysToRace() { return Math.max(0,dayDifference(RACE_DATE,todayISO())); }
function selectedWeek() { return PLAN.weeks[state.selectedWeek-1]; }
function sessionRow(s) {
  const date=parseDate(s.date);
  const suffix=s.type==='rest'?'Recovery':s.optional?'Optional':s.km?`~${s.km} km`:'35–45 min';
  return `<button type="button" class="session-row" data-open="${clean(s.id)}" aria-label="Open ${clean(s.title)} on ${clean(longDate(s.date))}">
    <span class="day-square"><span class="day-name">${weekday(s.date)}</span><span class="day-date">${date.getDate()}</span></span>
    <span class="session-info"><strong>${clean(s.title)}</strong><p>${clean(suffix)} ${s.type==='rest'?'':'· Tap to view or log'}</p></span>
    <span class="session-side">${statusPill(s) || kindBadge(s)}<span class="session-arrow">›</span></span>
  </button>`;
}
function sectionHeading(title, hint='') { return `<div class="section-title"><h2>${title}</h2><span>${clean(hint)}</span></div>`; }
function progressBar(percent) { return `<div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(percent)}"><div class="progress-fill" style="width:${clamp(percent,0,100)}%"></div></div>`; }
function countdownDescription() {
  const days=daysToRace();
  if(todayISO()>RACE_DATE)return 'The scheduled race date has passed. Your history is still here.';
  if(days===0)return 'Race day is here. You have done the work.';
  if(todayISO()<INTRO_START)return 'Training starts Saturday 21 November. First session: upper-body compounds.';
  if(todayISO()<PLAN_START)return 'Introductory weekend. Main 19-week block starts Monday 23 November.';
  return `${days} day${days===1?'':'s'} until the provisional charity 10K.`;
}
function nextWorkout() {
  const now=todayISO();
  return PLAN.all.find(s=>isWorkout(s) && s.date>=now && !['done','skipped'].includes(status(s))) || PLAN.all.find(s=>isWorkout(s) && s.date>=now) || null;
}
function header() {
  return `<header class="app-header"><div class="logo"><span class="logo-mark">10K</span><div class="logo-title">PROJECT PACE<span class="logo-sub">RUNNING + STRENGTH</span></div></div><span class="tag">42–45 MIN GOAL</span></header>`;
}
function nav() {
  const tabs=[['home','Home','<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>'],['plan','Plan','<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>'],['progress','Progress','<path d="M3 20V9m6 11V4m6 16v-8m6 8V7"/>'],['settings','Settings','<circle cx="12" cy="12" r="3"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>']];
  return `<nav class="bottom-nav" aria-label="Main navigation"><div class="nav-inner">${tabs.map(([key,label,path])=>`<button class="tab" type="button" data-tab="${key}" ${state.screen===key?'aria-current="page"':''}><svg aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">${path}</svg><span>${label}</span></button>`).join('')}</div></nav>`;
}
function homeScreen() {
  const week=PLAN.weeks[currentWeek()-1];
  const next=nextWorkout();
  const start= todayISO()<PLAN_START?INTRO_START:week.start;
  const nextSeven=PLAN.all.filter(s=>s.date>=todayISO() && s.date<=plusDays(todayISO(),6)).slice(0,7);
  const done=doneCount(week), total=workoutCount(week);
  const logDistance=actualKm(week);
  const weekTarget=plannedKm(week);
  return `<section class="hero"><div class="eyebrow">YOUR TRAINING BLOCK</div><h1>Stronger legs.<br>Faster 10K.</h1><p>${clean(countdownDescription())}</p><div class="hero-info"><span class="mini-pill">📅 <strong>4 Apr 2027</strong> provisional race</span><span class="mini-pill">🛟 <strong>Monday</strong> rest day</span><span class="mini-pill">🏋️ <strong>2</strong> gym sessions</span></div></section>
  ${sectionHeading(todayISO()<PLAN_START?'Getting started':`Week ${week.number} snapshot`,todayISO()<PLAN_START?'21–22 November':`${shortDate(week.start)} – ${shortDate(week.end)}`)}
  <div class="stats"><div class="stat"><div class="stat-label">Days to race</div><div class="stat-number">${daysToRace()}</div><div class="stat-note">Provisional date</div></div><div class="stat"><div class="stat-label">Weekly distance</div><div class="stat-number">${formatKm(logDistance)}<span class="stat-suffix"> km</span></div><div class="stat-note">~${formatKm(weekTarget)} km planned</div></div><div class="stat"><div class="stat-label">Sessions done</div><div class="stat-number">${done}<span class="stat-suffix"> / ${total}</span></div><div class="stat-note">This training week</div></div></div>
  ${sectionHeading('Up next',next?shortDate(next.date):'')}
  ${next?`<div class="card accent-card"><div class="week-label">${kindBadge(next)} ${statusPill(next)}</div><h3 style="margin-top:13px;font-size:22px">${clean(next.title)}</h3><p>${clean(longDate(next.date))} ${next.km?`· Approx. ${next.km} km`:''}</p><button class="button primary" data-open="${clean(next.id)}">Open session →</button></div>`:'<div class="card">No more planned sessions. Great work!</div>'}
  ${sectionHeading('Next 7 days','Tap any session')}
  <div class="stack">${nextSeven.map(sessionRow).join('')||'<div class="empty">No scheduled activities in the next seven days.</div>'}</div>
  ${sectionHeading('Training principle','')}
  <div class="notice">The knee determines progression. Pain that worsens, alters your gait, causes swelling or true locking is a reason to stop running and get clinical advice. A physio appointment is not automatic clearance for speedwork.</div>
  <p class="footer">Your training logs stay in this browser on this device. Use Settings → Export backup to keep a copy.</p>`;
}
function planScreen() {
  const week=selectedWeek();
  const total=workoutCount(week),done=doneCount(week);
  return `${sectionHeading('Training calendar','19-week programme')}
  <div class="week-controls"><button class="button" data-weekdelta="-1" ${week.number===1?'disabled':''} aria-label="Previous week">←</button>
    <select class="week-picker" aria-label="Choose training week" id="week-picker">${PLAN.weeks.map(w=>`<option value="${w.number}" ${w.number===week.number?'selected':''}>Week ${w.number} · ${shortDate(w.start)} – ${shortDate(w.end)}</option>`).join('')}</select>
    <button class="button" data-weekdelta="1" ${week.number===19?'disabled':''} aria-label="Next week">→</button></div>
  <section class="card weekly-heading"><div class="phase">${clean(week.phase)}</div><h2>Week ${week.number}</h2><p>${shortDate(week.start)} – ${shortDate(week.end)} · Suggested ${week.data.range[0]}–${week.data.range[1]} km</p><div class="progress-label"><span>Training sessions completed</span><strong>${done} / ${total}</strong></div>${progressBar(done/total*100)}<p style="margin-bottom:0;margin-top:13px">${clean(phaseNote(week.number))}</p></section>
  ${sectionHeading('This week','Mon → Sun')}
  <div class="workout-list">${week.sessions.map(sessionRow).join('')}</div>
  ${sectionHeading('Weekly focus','')}
  <div class="card"><h3>${clean(week.data.focus)}</h3><p>${clean(phaseNote(week.number))}</p></div>
  <div class="notice" style="margin-top:15px">All distances and paces are guides, not targets to force through knee pain. During weeks 1–4, the optional Wednesday rest is intentional.</div>`;
}
function progressScreen() {
  const allWorkouts=PLAN.all.filter(isWorkout);
  const completed=allWorkouts.filter(s=>status(s)==='done');
  const loggedRuns=completed.filter(isRun);
  const kilometres=loggedRuns.reduce((sum,s)=>sum+(Number(getLog(s).distance)||0),0);
  const allKnees=completed.map(s=>getLog(s).knee).filter(v=>v!==undefined && v!=='').map(Number);
  const kneeAvg=allKnees.length?(allKnees.reduce((a,b)=>a+b,0)/allKnees.length).toFixed(1):'—';
  const high=42;
  return `${sectionHeading('Your progress','Based on logged sessions')}
  <div class="stats"><div class="stat"><div class="stat-label">Completed</div><div class="stat-number">${completed.length}</div><div class="stat-note">Workouts</div></div><div class="stat"><div class="stat-label">Run distance</div><div class="stat-number">${formatKm(kilometres)}<span class="stat-suffix"> km</span></div><div class="stat-note">Actual logged</div></div><div class="stat"><div class="stat-label">Knee rating</div><div class="stat-number">${kneeAvg}</div><div class="stat-note">Avg. 0–10 pain</div></div></div>
  ${sectionHeading('Distance by week','Kilometres')}
  <div class="card"><div class="legend" style="margin-bottom:15px"><span><i class="dot" style="background:#476073"></i>Planned</span><span><i class="dot" style="background:var(--accent)"></i>Logged</span></div>
  <div class="bar-list">${PLAN.weeks.map(w=>{
    const planned=plannedKm(w),actual=actualKm(w);
    return `<div class="bar-item"><div class="bar-title"><span>W${String(w.number).padStart(2,'0')} <span class="subtle">${shortDate(w.start)}</span></span><span>${formatKm(actual)} / ${formatKm(planned)} km</span></div><div class="progress-track" style="height:5px"><div style="height:100%;width:${clamp(planned/high*100,0,100)}%;background:#476073;border-radius:9px"></div></div><div class="progress-track" style="height:7px"><div style="height:100%;width:${clamp(actual/high*100,0,100)}%;background:var(--accent);border-radius:9px"></div></div></div>`;
  }).join('')}</div></div>
  ${sectionHeading('Benchmarks','')}
  <div class="card"><p><strong>Week 8 (January):</strong> 5K time trial, if cleared.<br><strong>Week 16 (March):</strong> 5K time trial to set a realistic race pace.</p><p>Rough guide: a 21:30–21:40 5K suggests that sub-45 for 10K may be within reach with sufficient endurance. The 42-minute goal is a substantial stretch.</p></div>
  <p class="smallprint">Distances only appear once you mark a running session complete and enter the actual kilometres. Skipped sessions are not counted. Your pain ratings are self-reported observations, not a diagnosis.</p>`;
}
function settingsScreen() {
  return `${sectionHeading('App settings','Your data + guidance')}
  <div class="settings-grid"><div class="card"><h3>Training dates</h3><p><strong>First session:</strong> Saturday 21 November 2026<br><strong>Week 1:</strong> Monday 23 November 2026<br><strong>Provisional race:</strong> Sunday 4 April 2027</p><p>The programme is currently anchored to 4 April. Once your actual race date is confirmed, update <code>RACE_DATE</code> and the dated plan in <code>app.js</code>, or ask for a revised version.</p></div>
  <div class="card"><h3>Data backup</h3><p>Entries are stored locally in this browser. GitHub Pages hosts the app, <strong>not your personal workout logs</strong>. Deleting Safari website data, changing devices or reinstalling may erase progress. Export your backup regularly.</p>
  <div class="actions"><button class="button primary" data-action="export-json">↓ Export backup</button><button class="button" data-action="import-json">↑ Import backup</button></div>
  <div class="actions"><button class="button ghost" data-action="export-csv">↓ Export CSV</button><button class="button danger" data-action="reset">Reset logs</button></div></div>
  <div class="card"><h3>Effort guide</h3><p><strong>Easy:</strong> conversational, RPE 3–4/10.<br><strong>Threshold:</strong> controlled discomfort, RPE 6–7/10.<br><strong>Intervals:</strong> challenging, repeatable, RPE 7–8/10.<br><strong>Strength:</strong> mostly 1–3 reps in reserve; no grinding.</p></div>
  <div class="card"><h3>Knee first</h3><p>Get your physio's input on knee catching, pain around the kneecap, posterior knee symptoms and the big toe. Do not assume a single visit resolves them. Swap a run for low-impact exercise if directed, and reduce progression when symptoms increase.</p></div>
  <div class="card"><h3>Home Screen + offline</h3><p>Open your GitHub Pages URL in Safari → Share → Add to Home Screen. Once loaded, the app shell should also work offline. Online access is needed to publish code changes, but not to log workouts.</p></div></div>
  <p class="footer">10K Project v${APP_VERSION} · No account · No analytics · No third-party libraries</p>`;
}
function render() {
  const body={home:homeScreen,plan:planScreen,progress:progressScreen,settings:settingsScreen}[state.screen]();
  $app.innerHTML=`<div class="app-shell">${header()}<main id="main">${body}</main></div>${nav()}`;
}
function workoutModal(s) {
  const log=getLog(s);
  const rest=s.type==='rest';
  const rows=s.exercises?`<table class="exercise-table"><thead><tr><th>Compound exercise</th><th>Sets × reps</th></tr></thead><tbody>${s.exercises.map(([name,reps])=>`<tr><td>${clean(name)}</td><td>${clean(reps)}</td></tr>`).join('')}</tbody></table>`:'';
  $dialog.innerHTML=`<div class="dialog-content"><div class="dialog-top"><div>${kindBadge(s)}<h2 id="dialog-title">${clean(s.title)}</h2><div class="smallprint">${clean(longDate(s.date))}${s.km?` · Approx. ${s.km} km`:''}</div></div><button class="dialog-close" type="button" data-close aria-label="Close">×</button></div>
  <p class="workout-description">${clean(s.detail)}</p>${rows}
  ${rest?'<div class="notice good" style="margin-top:16px">Rest days do not need to be logged. Enjoy your recovery.</div>':`<form id="log-form" data-id="${clean(s.id)}">
  <div class="fields-3"><div class="field"><label for="distance">Distance (km)</label><input class="input" id="distance" name="distance" type="number" inputmode="decimal" min="0" max="100" step="0.1" value="${clean(log.distance ?? (isRun(s)?'':''))}" placeholder="${isRun(s)?s.km:'—'}" ${!isRun(s)?'disabled':''}></div>
  <div class="field"><label for="rpe">Effort (1–10)</label><input class="input" id="rpe" name="rpe" type="number" inputmode="numeric" min="1" max="10" value="${clean(log.rpe??'')}" placeholder="RPE"></div>
  <div class="field"><label for="knee">Knee pain (0–10)</label><input class="input" id="knee" name="knee" type="number" inputmode="numeric" min="0" max="10" value="${clean(log.knee??'')}" placeholder="Pain"></div></div>
  <div class="field"><label for="notes">Training notes</label><textarea class="input" id="notes" name="notes" placeholder="How did it feel? Pace, weights, knee symptoms, recovery…">${clean(log.notes||'')}</textarea></div>
  ${statusPill(s)?`<div class="smallprint">Currently logged as: ${status(s)==='done'?'completed':'skipped'}.</div>`:''}
  <div class="actions"><button type="button" class="button" data-save="notes">Save notes</button><button type="button" class="button primary" data-save="done">✓ Complete</button><button type="button" class="button ghost" data-save="skipped">Skip</button></div>
  </form>`}</div>`;
  $dialog.showModal();
}
function downloadFile(name, type, content) {
  const blob=new Blob([content],{type}); const url=URL.createObjectURL(blob);const a=document.createElement('a');
  a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function exportJSON() {
  downloadFile(`10k-project-backup-${todayISO()}.json`,'application/json',JSON.stringify({app:'10K Project',version:APP_VERSION,exportedAt:new Date().toISOString(),logs:state.logs},null,2));
}
function exportCSV() {
  const enc=v=>`"${String(v??'').replace(/"/g,'""')}"`;
  const header=['date','session','type','status','planned_km','actual_km','effort_1_10','knee_pain_0_10','notes'];
  const rows=PLAN.all.filter(isWorkout).map(s=>{const log=getLog(s);return [s.date,s.title,s.type,log.status||'',s.km||'',log.distance??'',log.rpe??'',log.knee??'',log.notes||''].map(enc).join(',');});
  downloadFile(`10k-project-log-${todayISO()}.csv`,'text/csv;charset=utf-8','\uFEFF'+[header.map(enc).join(','),...rows].join('\r\n'));
}
function saveSession(mode) {
  const form=$dialog.querySelector('#log-form');if(!form)return;
  const id=form.dataset.id;const s=PLAN.all.find(item=>item.id===id);if(!s)return;
  const existing=getLog(s);
  const read=name=>form.elements.namedItem(name).value.trim();
  const distance=read('distance'),rpe=read('rpe'),knee=read('knee');
  if (distance!=='' && (!Number.isFinite(Number(distance)) || Number(distance)<0 || Number(distance)>100)) {alert('Please enter a valid distance between 0 and 100 km.');return;}
  if (rpe!=='' && (!Number.isInteger(Number(rpe)) || Number(rpe)<1 || Number(rpe)>10)) {alert('Effort must be a whole number from 1 to 10.');return;}
  if (knee!=='' && (!Number.isInteger(Number(knee)) || Number(knee)<0 || Number(knee)>10)) {alert('Knee pain must be a whole number from 0 to 10.');return;}
  if (mode==='done' && isRun(s) && distance==='') {
    if(!confirm('No distance entered. Mark this running session complete without a distance? (It will not count towards your logged kilometres.)'))return;
  }
  state.logs[id]={
    ...existing,
    ...(mode==='notes'?{}:{status:mode}),
    distance:distance===''?'':Number(distance),
    rpe:rpe===''?'':Number(rpe),
    knee:knee===''?'':Number(knee),
    notes:read('notes').slice(0,10000),
    updatedAt:new Date().toISOString()
  };
  saveLogs();$dialog.close();render();
}

$app.addEventListener('click',event=>{
  const el=event.target.closest('[data-tab],[data-open],[data-weekdelta],[data-action]');if(!el)return;
  if(el.dataset.tab){state.screen=el.dataset.tab; if(state.screen==='plan' && !state.selectedWeek)state.selectedWeek=currentWeek();render();window.scrollTo(0,0);return;}
  if(el.dataset.open){const s=PLAN.all.find(item=>item.id===el.dataset.open);if(s)workoutModal(s);return;}
  if(el.dataset.weekdelta){state.selectedWeek=clamp(state.selectedWeek+Number(el.dataset.weekdelta),1,19);render();return;}
  if(el.dataset.action==='export-json')exportJSON();
  else if(el.dataset.action==='export-csv')exportCSV();
  else if(el.dataset.action==='import-json')document.getElementById('import-file').click();
  else if(el.dataset.action==='reset' && confirm('Delete ALL locally saved training logs on this device? This cannot be undone unless you have exported a backup.')) {state.logs={};saveLogs();render();}
});
$app.addEventListener('change',event=>{
  if(event.target.id==='week-picker') {state.selectedWeek=clamp(Number(event.target.value),1,19);render();}
});
$dialog.addEventListener('click',event=>{
  const close=event.target.closest('[data-close]');if(close){$dialog.close();return;}
  const save=event.target.closest('[data-save]');if(save)saveSession(save.dataset.save);
});
document.getElementById('import-file').addEventListener('change',async event=>{
  const file=event.target.files?.[0];if(!file)return;
  try {
    const parsed=JSON.parse(await file.text());
    if(!parsed || parsed.app!=='10K Project' || !parsed.logs || typeof parsed.logs!=='object' || Array.isArray(parsed.logs)) throw new Error('Wrong backup format.');
    if(!confirm('Restore the selected backup? This will replace the training logs currently on this device.'))return;
    state.logs=Object.fromEntries(Object.entries(parsed.logs).filter(([key,value])=>typeof key==='string' && value && typeof value==='object' && !Array.isArray(value)));
    saveLogs();render();alert('Backup restored.');
  } catch(err){alert(`Could not import file: ${err.message}`);}
  finally{event.target.value='';}
});

state.logs=loadLogs();
state.selectedWeek=currentWeek();
render();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
}
