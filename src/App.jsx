import { useState, useEffect, useRef, useCallback, Component } from "react";

class ErrorBoundary extends Component {
  constructor(props){ super(props); this.state={error:null}; }
  static getDerivedStateFromError(e){ return {error:e}; }
  render(){
    if(this.state.error) return (
      <div style={{background:"#0c0c14",color:"#f43f5e",padding:24,fontFamily:"monospace",fontSize:12,minHeight:"100vh"}}>
        <p style={{fontSize:18,fontWeight:700,marginBottom:16}}>⚠️ Error de carga</p>
        <p style={{color:"#eee",marginBottom:8}}>{this.state.error.message}</p>
        <pre style={{background:"#1c1c2a",padding:12,borderRadius:8,overflow:"auto",fontSize:10,color:"#9090b0"}}>
          {this.state.error.stack}
        </pre>
        <button onClick={()=>window.location.reload()} style={{marginTop:16,background:"#00c896",color:"#000",border:"none",borderRadius:8,padding:"10px 20px",cursor:"pointer",fontWeight:700}}>
          Recargar
        </button>
      </div>
    );
    return this.props.children;
  }
}

// ── TOKENS ───────────────────────────────────────────────────────────────────
const DARK = {
  bg:"#0c0c14",surface:"#14141f",card:"#1c1c2a",border:"#26263a",borderLight:"#34344a",
  text:"#eeeef8",textSub:"#9090b0",textMuted:"#55556a",
  green:"#00c896",purple:"#8b5cf6",orange:"#f97316",red:"#f43f5e",blue:"#38bdf8",yellow:"#fbbf24",
  gymColor:"#00c896",cfColor:"#8b5cf6",calColor:"#38bdf8",planColor:"#f97316",
};
const LIGHT = {
  bg:"#f3f3ee",surface:"#eaeae5",card:"#ffffff",border:"#ddddd8",borderLight:"#c8c8c2",
  text:"#1a1a22",textSub:"#555566",textMuted:"#999aaa",
  green:"#008f6a",purple:"#6d28d9",orange:"#ea6c0a",red:"#dc2448",blue:"#0284c7",yellow:"#d97706",
  gymColor:"#008f6a",cfColor:"#6d28d9",calColor:"#0284c7",planColor:"#ea6c0a",
};
let C = DARK;

// ── KEYS ─────────────────────────────────────────────────────────────────────
const K = {
  tabs:"pg_tabs", cargas:"pg_c", medidas:"pg_m",
  gymPlanos:"pg_gp", planWeek:"pg_pw", objectives:"pg_obj", libre:"pg_lib",
  rpe:"pg_rpe", snota:"pg_snota",
};
function tabEjKey(id){ return "pg_ej_"+id; }
function tabDataKey(id){ return "pg_td_"+id; }

// ── SEEDS ────────────────────────────────────────────────────────────────────
const DEFAULT_TABS = [
  {id:"gym",    name:"Gym",          icon:"🏋️", color:"#00c896", type:"gym"},
  {id:"skills", name:"Skills",       icon:"🤸", color:"#38bdf8", type:"cf"},
  {id:"powerlifting", name:"Power Lifting", icon:"⚡", color:"#8b5cf6", type:"cf"},
  {id:"wod",    name:"WOD",          icon:"🔥", color:"#f97316", type:"cf"},
];

const SKILL_SEED = [
  {id:"cal1",nombre:"Muscle Up",      icon:"🔄",niveles:["Negativas","Ring rows+dips","Kipping MU","Strict MU","Weighted MU"]},
  {id:"cal2",nombre:"Handstand/HSPU", icon:"🤸",niveles:["Contra pared","Libre 5s","Libre 15s","1 HSPU asist.","HSPU estricto","HSPU déficit"]},
  {id:"cal3",nombre:"Front Lever",    icon:"🎯",niveles:["Tucked","Tucked avanz.","Una pierna","Straddle","Full FL"]},
  {id:"cal4",nombre:"Pistol Squat",   icon:"🦵",niveles:["Con banda","Con apoyo","Completo","Con lastre"]},
  {id:"cal5",nombre:"Planche",        icon:"✈️",niveles:["Lean","Tucked","Adv. tucked","Straddle","Full planche"]},
  {id:"cal6",nombre:"L-sit",          icon:"💺",niveles:["5s","10s","20s","30s+"]},
  {id:"cal7",nombre:"Dominadas lastre",icon:"⚖️",niveles:["Max reps","5kg","10kg","15kg","20kg+"]},
  {id:"cal8",nombre:"Dips con lastre",icon:"⬇️",niveles:["Max reps","10kg","20kg","30kg","40kg+"]},
];
const PL_SEED = [
  {id:"pl1",nombre:"Snatch (Arrancada)",icon:"🔺",niveles:[]},
  {id:"pl2",nombre:"Clean & Jerk",      icon:"⚡",niveles:[]},
  {id:"pl3",nombre:"Power Clean",        icon:"💥",niveles:[]},
  {id:"pl4",nombre:"Power Snatch",       icon:"🔥",niveles:[]},
  {id:"pl5",nombre:"Clean Pull",         icon:"⬆️",niveles:[]},
  {id:"pl6",nombre:"Snatch Pull",        icon:"⬆️",niveles:[]},
  {id:"pl7",nombre:"Front Squat",        icon:"🦵",niveles:[]},
  {id:"pl8",nombre:"Overhead Squat",     icon:"🙌",niveles:[]},
];
const WOD_SEED = [];

const PLANOS_SEED = {
  A:{nombre:"Espalda / Bíceps",color:"#00c896",ejercicios:[
    {id:"a1",nombre:"Barra fija con lastre",grupo:"Espalda",series:4,reps:"4-6",descanso:90},
    {id:"a2",nombre:"Pulldown en Polia",    grupo:"Espalda",series:4,reps:"10-8-8-6",descanso:60},
    {id:"a3",nombre:"Remada Landmine",      grupo:"Espalda",series:3,reps:"12-10-10",descanso:60},
    {id:"a4",nombre:"Bícep 7/21",           grupo:"Bíceps", series:3,reps:"21",descanso:60},
    {id:"a5",nombre:"Curl polea baja",      grupo:"Bíceps", series:3,reps:"12-10-10",descanso:60},
  ]},
  B:{nombre:"Pecho / Hombros / Tríceps",color:"#f43f5e",ejercicios:[
    {id:"b1",nombre:"Supino plano barra",    grupo:"Pecho",  series:4,reps:"4-6",descanso:90},
    {id:"b2",nombre:"Press cerrado barra",   grupo:"Tríceps",series:3,reps:"8-10",descanso:75},
    {id:"b3",nombre:"Supino inclinado halt.",grupo:"Pecho",  series:3,reps:"10-8-8",descanso:60},
    {id:"b4",nombre:"Press militar máquina", grupo:"Hombros",series:3,reps:"10-8-8",descanso:75},
    {id:"b5",nombre:"Elevación lateral",     grupo:"Hombros",series:2,reps:"12-10",descanso:60},
    {id:"b6",nombre:"Elevación posterior",   grupo:"Hombros",series:2,reps:"12-10",descanso:60},
    {id:"b7",nombre:"Pec Fly / Crossover",   grupo:"Pecho",  series:3,reps:"12-10-10",descanso:60},
    {id:"b8",nombre:"Trícep francés cuerda", grupo:"Tríceps",series:2,reps:"12-10",descanso:60},
  ]},
  C:{nombre:"Piernas / Core",color:"#f97316",ejercicios:[
    {id:"c1",nombre:"Sentadilla barra",      grupo:"Cuádriceps",series:4,reps:"6-8",descanso:90},
    {id:"c2",nombre:"Prensa vertical",       grupo:"Cuádriceps",series:3,reps:"10-8-8",descanso:60},
    {id:"c3",nombre:"Hip thrust",            grupo:"Glúteos",  series:3,reps:"10-8-8",descanso:60},
    {id:"c4",nombre:"Curl femoral máquina",  grupo:"Femorales",series:3,reps:"12-10-10",descanso:60},
    {id:"c5",nombre:"Gemelos de pie",        grupo:"Gemelos",  series:3,reps:"15-15-12",descanso:45},
    {id:"c6",nombre:"Abducción cadera",      grupo:"Cadera",   series:2,reps:"15-12",descanso:45},
    {id:"c7",nombre:"Ab wheel rollout",      grupo:"Core",     series:3,reps:"8-10",descanso:45},
    {id:"c8",nombre:"Stir the Pot",          grupo:"Core",     series:2,reps:"6+6",descanso:45},
  ]},
};

const DEFAULT_WEEK = [
  {dayIndex:0,assignments:[{tabId:"skills"},{tabId:"wod"}]},
  {dayIndex:1,assignments:[{tabId:"gym",planoKey:"A"}]},
  {dayIndex:2,assignments:[]},
  {dayIndex:3,assignments:[{tabId:"gym",planoKey:"B"}]},
  {dayIndex:4,assignments:[{tabId:"powerlifting"}]},
  {dayIndex:5,assignments:[{tabId:"gym",planoKey:"C"}]},
  {dayIndex:6,assignments:[]},
];
const DEFAULT_OBJECTIVES = [
  {id:"o1",name:"Peso corporal",current:"65.7",target:"70-75",unit:"kg"},
];
const DEFAULT_LIBRE = [
  {id:"l1",icon:"🔄",name:"Calistenia técnica",     detail:"Muscle ups, handstand, front lever. 30-45min, no al fallo.",dia:"Miércoles"},
  {id:"l2",icon:"🚴",name:"Bici",                    detail:"20-30min intensidad baja. Recuperación activa.",dia:"Domingo"},
  {id:"l3",icon:"🏊",name:"Nadar",                   detail:"Cualquier estilo a intensidad baja-media.",dia:"Domingo"},
  {id:"l4",icon:"⚖️",name:"Slackline",               detail:"10-15min. Propiocepción tobillo/rodilla.",dia:"Libre"},
  {id:"l5",icon:"⚡",name:"Comba rápida",             detail:"10-15min intervals. Complemento cardiovascular.",dia:"Libre"},
];

// ── STORAGE ───────────────────────────────────────────────────────────────────
function load(k){try{const r=localStorage.getItem(k);return r?JSON.parse(r):null;}catch{return null;}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch{}}
function today(){
  const d=new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function fmt(d){
  // Parse YYYY-MM-DD as local date to avoid UTC midnight timezone shift
  const [y,m,day]=d.split("-").map(Number);
  return new Date(y,m-1,day).toLocaleDateString("es-ES",{day:"2-digit",month:"short",year:"2-digit"});
}
function isValidDate(s){return /^\d{4}-\d{2}-\d{2}$/.test(s)&&!isNaN(new Date(s).getTime());}

function loadTabs(){return load(K.tabs)||DEFAULT_TABS;}
function loadTabEjs(id){
  const stored=load(tabEjKey(id));
  if(stored) return stored;
  if(id==="skills") return SKILL_SEED;
  if(id==="powerlifting") return PL_SEED;
  if(id==="wod") return WOD_SEED;
  return [];
}
function loadGymPlanos(){return load(K.gymPlanos)||PLANOS_SEED;}
function loadWeek(){return load(K.planWeek)||DEFAULT_WEEK;}
function loadObjectives(){return load(K.objectives)||DEFAULT_OBJECTIVES;}
function loadLibre(){return load(K.libre)||DEFAULT_LIBRE;}

// ── Derive trained sessions from actual data ────────────────────────────────
function buildPlanoMap(){
  const planos=loadGymPlanos();
  const map={};
  Object.entries(planos).forEach(([key,plano])=>{
    plano.ejercicios.forEach(ej=>{ map[ej.id]={key,color:plano.color,nombre:plano.nombre}; });
  });
  return map;
}

// ── Memoized session cache — rebuilt once per render cycle ────────────────────
let _sessionCache = null;
let _sessionCacheKey = "";

function buildSessionCache(){
  // Cache key: stringify lengths of all data sources
  const cargas=load(K.cargas)||{};
  const tabs=loadTabs();
  // Use last-entry dates for a more reliable cache key
  const cargasKey=Object.values(cargas).map(h=>h[h.length-1]?.fecha||"").join(",");
  const cfKey=tabs.filter(t=>t.type==="cf").map(t=>{
    const d=load(tabDataKey(t.id))||{};
    return Object.values(d).map(h=>h[h.length-1]?.fecha||"").join(":");
  }).join("|");
  const key=`${cargasKey}||${cfKey}`;
  if(key===_sessionCacheKey&&_sessionCache) return _sessionCache;

  const byDate={};
  const planoMap=buildPlanoMap();

  // Gym
  Object.entries(cargas).forEach(([ejId,hist])=>{
    const info=planoMap[ejId];if(!info) return;
    hist.forEach(e=>{
      if(!byDate[e.fecha]) byDate[e.fecha]=new Map();
      if(!byDate[e.fecha].has("gym_"+info.key))
        byDate[e.fecha].set("gym_"+info.key,{tabId:"gym_"+info.key,tabName:`Gym — Plano ${info.key}`,icon:"🏋️",color:info.color,planoKey:info.key});
    });
  });

  // CF tabs
  tabs.filter(t=>t.type==="cf").forEach(tab=>{
    const data=load(tabDataKey(tab.id))||{};
    Object.values(data).forEach(hist=>hist.forEach(e=>{
      if(!byDate[e.fecha]) byDate[e.fecha]=new Map();
      if(!byDate[e.fecha].has(tab.id))
        byDate[e.fecha].set(tab.id,{tabId:tab.id,tabName:tab.name,icon:tab.icon,color:tab.color});
    }));
  });

  // Convert maps to arrays
  const result={};
  Object.entries(byDate).forEach(([date,map])=>{ result[date]=Array.from(map.values()); });
  _sessionCache=result;
  _sessionCacheKey=key;
  return result;
}

function getTrainedSessions(dateStr){
  return buildSessionCache()[dateStr]||[];
}

function getTrainedDates(){
  return new Set(Object.keys(buildSessionCache()));
}

// seed medidas
(function(){if(!load(K.medidas)?.length) save(K.medidas,[
  {fecha:"2025-11-18",peso:65.7,grasa:7.6,masaMagra:57.7,bicepD:33,bicepI:33,torax:99,abdomen:79.5,musloD:46,musloI:46,gemelo:33},
  {fecha:"2025-08-05",peso:61.4,grasa:8.0,masaMagra:53.6,bicepD:30.5,bicepI:30.5,torax:90.5,abdomen:76,musloD:44.5,musloI:44.5,gemelo:32.5},
])})();

function saveRPE(date,planoKey,rpe){
  const rpeLog=load(K.rpe)||{};
  rpeLog[`${date}_${planoKey}`]=rpe;
  save(K.rpe,rpeLog);
}
function getRPE(date,planoKey){
  return (load(K.rpe)||{})[`${date}_${planoKey}`]||null;
}

function exportData(){
  const data={};
  Object.entries(K).forEach(([k,v])=>{const d=load(v);if(d)data[k]=d;});
  loadTabs().forEach(t=>{
    const ej=load(tabEjKey(t.id));if(ej)data[tabEjKey(t.id)]=ej;
    const td=load(tabDataKey(t.id));if(td)data[tabDataKey(t.id)]=td;
  });
  return JSON.stringify({version:2,exported:today(),data},null,2);
}
function importData(file,onDone){
  const reader=new FileReader();
  reader.onload=e=>{
    try{
      const p=JSON.parse(e.target.result);
      if(!p.data) return onDone(false);
      Object.entries(p.data).forEach(([k,v])=>save(k,v));
      onDone(true);
    }catch{onDone(false);}
  };
  reader.readAsText(file);
}

function getInsight(data,unit){
  if(!data||data.length<2) return null;
  const vals=data.map(d=>d.val);
  const first=vals[0],last=vals[vals.length-1],total=last-first;
  const weeks=Math.max(1,Math.round((new Date(data[data.length-1].fecha)-new Date(data[0].fecha))/(7*24*3600*1000)));
  const perMonth=((total/weeks)*4).toFixed(1);
  const last3=vals.slice(-3);
  const stalled=last3.length>=3&&last3[last3.length-1]<=last3[0];
  const isRecord=last>=Math.max(...vals);
  if(stalled) return{type:"warn",text:`Sin mejora en las últimas 3 sesiones.`};
  if(isRecord&&total>0) return{type:"success",text:`Récord activo · +${total.toFixed(1)}${unit} en ${weeks}sem (+${perMonth}${unit}/mes)`};
  if(total>0) return{type:"info",text:`+${total.toFixed(1)}${unit} en ${weeks}sem (+${perMonth}${unit}/mes)`};
  return null;
}

// ── LONG PRESS HOOK ──────────────────────────────────────────────────────────
function useLongPress(onLongPress, ms=600){
  const timer=useRef(null);
  const start=useCallback(()=>{timer.current=setTimeout(()=>onLongPress(),ms);},[onLongPress,ms]);
  const stop=useCallback(()=>{if(timer.current){clearTimeout(timer.current);timer.current=null;}},[]);
  return{onTouchStart:start,onTouchEnd:stop,onTouchCancel:stop,onMouseDown:start,onMouseUp:stop,onMouseLeave:stop};
}

function ExerciseChip({ej,selected,color,onSelect,onDelete}){
  const lp=useLongPress(()=>onDelete(ej.id));
  return <button {...lp} onClick={()=>onSelect(ej.id)} style={{background:selected?color:C.card,color:selected?"#000":C.textSub,border:`1px solid ${selected?color:C.borderLight}`,borderRadius:8,padding:"7px 12px",fontSize:12,cursor:"pointer",fontWeight:selected?700:400,transition:"all 0.15s",userSelect:"none"}}>{ej.icon} {ej.nombre}</button>;
}

// ── UI ATOMS ──────────────────────────────────────────────────────────────────
function Card({children,style={},onClick,accent}){
  return <div onClick={onClick} style={{background:C.card,border:`1px solid ${accent||C.border}`,borderLeft:accent?`3px solid ${accent}`:`1px solid ${C.border}`,borderRadius:18,padding:16,cursor:onClick?"pointer":"default",...style}}>{children}</div>;
}
function Btn({children,onClick,color,outline=false,style={}}){
  const bg=color||C.green;
  return <button onClick={onClick} style={{background:outline?"transparent":bg,color:outline?bg:"#000",border:`1.5px solid ${bg}`,borderRadius:10,padding:"11px 18px",fontSize:13,fontWeight:700,cursor:"pointer",...style}}>{children}</button>;
}
function Input({value,onChange,type="number",placeholder,style={},onEnter}){
  return <input
    type={type} value={value} onChange={onChange} placeholder={placeholder}
    onKeyDown={onEnter?e=>{if(e.key==="Enter"){e.preventDefault();onEnter();}}:undefined}
    style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,color:C.text,padding:"11px 14px",fontSize:14,width:"100%",boxSizing:"border-box",outline:"none",...style}}
  />;
}
function Tag({children,color}){return <span style={{background:color+"22",color,fontSize:10,letterSpacing:1,textTransform:"uppercase",padding:"3px 8px",borderRadius:20,fontWeight:700}}>{children}</span>;}
function BackBtn({onClick}){return <button onClick={onClick} style={{background:"none",border:"none",color:C.textSub,cursor:"pointer",fontSize:13,marginBottom:14,padding:0}}>← Volver</button>;}
function SectionLabel({children}){return <p style={{color:C.textMuted,fontSize:10,letterSpacing:3,textTransform:"uppercase",margin:"0 0 10px",fontWeight:700}}>{children}</p>;}
function SavedBadge({color}){return <div style={{background:(color||C.green)+"22",border:`1px solid ${(color||C.green)}44`,borderRadius:8,padding:"8px 14px",marginBottom:12,color:color||C.green,fontSize:12,fontWeight:700}}>✓ Guardado</div>;}
function ProgressBar({pct,color,height=5}){return <div style={{background:C.borderLight,borderRadius:height,height,overflow:"hidden"}}><div style={{background:color,borderRadius:height,height,width:`${Math.min(100,pct)}%`,transition:"width 0.4s ease"}}/></div>;}
function InsightBox({data,unit}){
  const ins=getInsight(data,unit);
  if(!ins) return null;
  const m={success:{bg:"#001a0f",border:C.green,color:C.green,icon:"🏆"},warn:{bg:"#1a0800",border:C.orange,color:C.orange,icon:"⚡"},info:{bg:"#000d1a",border:C.blue,color:C.blue,icon:"📈"}}[ins.type];
  return <div style={{marginTop:10,padding:"9px 12px",background:m.bg,borderRadius:8,borderLeft:`3px solid ${m.border}`}}><p style={{color:m.color,fontSize:12,margin:0}}>{m.icon} {ins.text}</p></div>;
}
function BarChart({data,color,unit="kg"}){
  if(!data||data.length<2) return <p style={{color:C.textMuted,fontSize:12,textAlign:"center",padding:"16px 0"}}>Necesitas al menos 2 registros.</p>;
  const vals=data.map(d=>d.val),max=Math.max(...vals),min=Math.min(...vals),range=max-min||1;
  return(<div>
    <div style={{display:"flex",alignItems:"flex-end",gap:4,height:72}}>
      {data.slice(-14).map((d,i)=>{
        const isLast=i===data.slice(-14).length-1,ht=Math.max(6,((d.val-min)/range)*60+6);
        return <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
          {isLast&&<p style={{color,fontSize:9,margin:0,fontWeight:700}}>{d.val}{unit}</p>}
          <div style={{width:"100%",height:ht,background:isLast?color:color+"35",borderRadius:"3px 3px 0 0",transition:"height 0.3s ease"}}/>
        </div>;
      })}
    </div>
    <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
      <p style={{color:C.textMuted,fontSize:9,margin:0}}>{fmt(data[Math.max(0,data.length-14)].fecha)}</p>
      <p style={{color:C.textMuted,fontSize:9,margin:0}}>{fmt(data[data.length-1].fecha)}</p>
    </div>
  </div>);
}

// ── CONFIRM DIALOG ────────────────────────────────────────────────────────────
function ConfirmDialog({msg,onConfirm,onCancel}){
  return <div style={{position:"fixed",inset:0,background:"#000a",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:24,maxWidth:320,width:"100%"}}>
      <p style={{color:C.text,fontSize:15,fontWeight:700,margin:"0 0 8px"}}>¿Confirmar?</p>
      <p style={{color:C.textSub,fontSize:13,margin:"0 0 20px",lineHeight:1.5}}>{msg}</p>
      <div style={{display:"flex",gap:10}}>
        <button onClick={onCancel} style={{flex:1,background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,color:C.textSub,padding:"11px",cursor:"pointer",fontSize:13}}>Cancelar</button>
        <Btn onClick={onConfirm} color={C.red} style={{flex:1,padding:"11px"}}>Eliminar</Btn>
      </div>
    </div>
  </div>;
}

// ── REST TIMER ────────────────────────────────────────────────────────────────
function RestTimer({seconds,onClose}){
  const [remaining,setRemaining]=useState(seconds);
  const [initSecs,setInitSecs]=useState(seconds);
  useEffect(()=>{
    if(remaining<=0){onClose();return;}
    const id=setTimeout(()=>setRemaining(r=>r-1),1000);
    return()=>clearTimeout(id);
  },[remaining]);
  const pct=Math.min(100,((initSecs-remaining)/initSecs)*100);
  const color=remaining<=10?C.red:remaining<=20?C.orange:C.green;
  const mins=Math.floor(remaining/60),secs=remaining%60;
  return <div style={{position:"fixed",bottom:90,left:"50%",transform:"translateX(-50%)",background:C.card,border:`2px solid ${color}`,borderRadius:20,padding:"16px 22px",zIndex:200,minWidth:240,boxShadow:`0 8px 32px ${color}33`}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
      <Tag color={color}>Descanso</Tag>
      <button onClick={onClose} style={{background:"none",border:"none",color:C.textSub,cursor:"pointer",fontSize:18,padding:0}}>✕</button>
    </div>
    <p style={{color,fontSize:44,fontWeight:900,margin:"0 0 10px",textAlign:"center",fontFamily:"monospace",letterSpacing:3}}>
      {mins>0?`${mins}:${String(secs).padStart(2,"0")}`:String(secs).padStart(2,"0")}
    </p>
    <ProgressBar pct={pct} color={color} height={4}/>
    <div style={{display:"flex",gap:6,marginTop:10}}>
      {[30,45,60,90].map(s=>(
        <button key={s} onClick={()=>{setInitSecs(s);setRemaining(s);}} style={{flex:1,background:initSecs===s?color:C.surface,color:initSecs===s?"#000":C.textSub,border:`1px solid ${initSecs===s?color:C.borderLight}`,borderRadius:8,padding:"6px 0",fontSize:11,cursor:"pointer",fontWeight:700}}>{s}s</button>
      ))}
    </div>
  </div>;
}

// ── SESSION TIMER (count up) ──────────────────────────────────────────────────
function SessionTimer({color}){
  const [active,setActive]=useState(false);
  const [seconds,setSeconds]=useState(0);
  useEffect(()=>{
    if(!active) return;
    const id=setInterval(()=>setSeconds(s=>s+1),1000);
    return()=>clearInterval(id);
  },[active]);
  const mins=Math.floor(seconds/60),secs=seconds%60;
  return <div style={{display:"flex",alignItems:"center",gap:8}}>
    {active?(
      <>
        <p style={{color,fontSize:13,fontWeight:700,margin:0,fontFamily:"monospace"}}>{mins>0?`${mins}:${String(secs).padStart(2,"0")}`:String(secs).padStart(2,"0")}s</p>
        <button onClick={()=>{setActive(false);setSeconds(0);}} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,color:C.textMuted,padding:"4px 8px",cursor:"pointer",fontSize:11}}>✕</button>
      </>
    ):(
      <button onClick={()=>setActive(true)} style={{background:color+"22",border:`1px solid ${color}44`,borderRadius:8,color,padding:"5px 10px",cursor:"pointer",fontSize:12,fontWeight:700}}>⏱ Timer</button>
    )}
  </div>;
}

// ── CF PANEL (generic: Skills, Power Lifting, WOD, custom) ───────────────────
function CFPanel({tab,onDeleteTab}){
  const [exercises,setExercises]=useState(()=>loadTabEjs(tab.id));
  const [data,setData]=useState(()=>load(tabDataKey(tab.id))||{});
  const [mode,setMode]=useState("list"); // list | session | detail
  const [sessionEjs,setSessionEjs]=useState([]);
  const [sessionInputs,setSessionInputs]=useState({});
  const [detailId,setDetailId]=useState(null);
  const [savedId,setSavedId]=useState(null);
  const [addOpen,setAddOpen]=useState(false);
  const [newName,setNewName]=useState("");
  const [editingLevels,setEditingLevels]=useState(false);
  const [newLevel,setNewLevel]=useState("");
  const [addPastOpen,setAddPastOpen]=useState(false);
  const [pastFecha,setPastFecha]=useState(today());
  const [pastVal,setPastVal]=useState("");
  const [pastNota,setPastNota]=useState("");
  const [editEntry,setEditEntry]=useState(null);
  const [editVal,setEditVal]=useState("");
  const [confirm,setConfirm]=useState(null);
  const [restTimer,setRestTimer]=useState(null);
  const [wodSessionType,setWodSessionType]=useState("");
  const [wodSessionResult,setWodSessionResult]=useState("");
  const color=tab.color;

  function saveExercises(upd){setExercises(upd);save(tabEjKey(tab.id),upd);}
  function saveData(upd){setData(upd);save(tabDataKey(tab.id),upd);_sessionCacheKey="";}
  function getNiveles(ejId){return(exercises.find(e=>e.id===ejId)||{}).niveles||[];}
  function updateNiveles(ejId,niveles){saveExercises(exercises.map(e=>e.id===ejId?{...e,niveles}:e));}

  function addExercise(){
    if(!newName.trim()) return;
    const id=tab.id+"_"+Date.now();
    saveExercises([...exercises,{id,nombre:newName.trim(),icon:"⭐",niveles:[]}]);
    setNewName("");setAddOpen(false);
  }

  function deleteExercise(id){
    setConfirm({msg:"Se eliminará el ejercicio y todo su historial.",onConfirm:()=>{
      saveExercises(exercises.filter(e=>e.id!==id));
      const d={...data};delete d[id];saveData(d);
      setSessionEjs(s=>s.filter(x=>x!==id));
      if(detailId===id){setDetailId(null);setMode("list");}
      setConfirm(null);
    }});
  }

  function deleteEntry(ejId,idx){
    setConfirm({msg:"Se eliminará este registro del historial.",onConfirm:()=>{
      const arr=[...(data[ejId]||[])];arr.splice(arr.length-1-idx,1);
      saveData({...data,[ejId]:arr});setConfirm(null);
    }});
  }

  
  // ── DETAIL ──
  if(mode==="detail"&&detailId){
    const ej=exercises.find(e=>e.id===detailId);
    if(!ej){setMode("list");return null;}
    const hist=[...(data[detailId]||[])].reverse();
    const niveles=getNiveles(detailId);
    const nivelActual=(data[detailId]||[]).filter(e=>e.nivel!==null&&e.nivel!==undefined).slice(-1)[0]?.nivel??null;
    const chartData=(data[detailId]||[]).filter(e=>e.val).map(e=>({val:e.val,fecha:e.fecha}));
    const maxVal=chartData.length?Math.max(...chartData.map(d=>d.val)):null;
    const pct=niveles.length&&nivelActual!==null?Math.round(((nivelActual+1)/niveles.length)*100):0;

    return <div>
      {confirm&&<ConfirmDialog msg={confirm.msg} onConfirm={confirm.onConfirm} onCancel={()=>setConfirm(null)}/>}
      <BackBtn onClick={()=>{setMode("list");setEditEntry(null);setEditingLevels(false);setAddPastOpen(false);}}/>
      <Card accent={color} style={{marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div style={{flex:1}}>
            <Tag color={color}>{tab.name}{pct>0?` · ${pct}%`:""}</Tag>
            <p style={{color:C.text,fontSize:18,fontWeight:700,margin:"6px 0 0"}}>{ej.icon} {ej.nombre}</p>
            {maxVal&&<p style={{color,fontSize:13,margin:"4px 0 0"}}>🏆 Máximo: <strong>{maxVal}</strong></p>}
          </div>
          <button onClick={()=>deleteExercise(detailId)} style={{background:"none",border:`1px solid ${C.red}44`,borderRadius:8,color:C.red,padding:"6px 10px",cursor:"pointer",fontSize:12}}>🗑 Eliminar</button>
        </div>
        {pct>0&&<div style={{marginTop:10}}><ProgressBar pct={pct} color={color} height={5}/></div>}
      </Card>

      {/* Niveles */}
      <Card style={{marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <SectionLabel>Niveles de progresión</SectionLabel>
          <button onClick={()=>setEditingLevels(v=>!v)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,color:C.textSub,padding:"4px 10px",cursor:"pointer",fontSize:11}}>{editingLevels?"✓ Listo":"✏️ Editar"}</button>
        </div>
        {!editingLevels&&niveles.length===0&&<p style={{color:C.textMuted,fontSize:12,margin:0}}>Sin niveles. Toca ✏️ Editar para añadir.</p>}
        {!editingLevels&&niveles.map((n,i)=>{
          const alc=nivelActual!==null&&i<=nivelActual,esAct=nivelActual===i;
          return <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:i<niveles.length-1?`1px solid ${C.border}`:"none"}}>
            <div style={{width:26,height:26,borderRadius:"50%",flexShrink:0,background:esAct?color:alc?color+"33":C.surface,border:`2px solid ${alc?color:C.borderLight}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:esAct?"#000":alc?color:C.textMuted,fontWeight:700}}>{alc?"✓":i+1}</div>
            <p style={{color:esAct?color:alc?C.textSub:C.textMuted,fontSize:13,margin:0,fontWeight:esAct?700:400}}>{n}</p>
            {esAct&&<Tag color={color}>actual</Tag>}
          </div>;
        })}
        {editingLevels&&<div>
          {niveles.map((n,i)=>(
            <div key={i} style={{display:"flex",gap:6,alignItems:"center",marginBottom:6}}>
              <span style={{color:C.textMuted,fontSize:11,minWidth:20}}>{i+1}.</span>
              <Input type="text" value={n} onChange={e=>{const arr=[...niveles];arr[i]=e.target.value;updateNiveles(detailId,arr);}} style={{flex:1,fontSize:12,padding:"7px 10px"}}/>
              <button onClick={()=>updateNiveles(detailId,niveles.filter((_,idx)=>idx!==i))} style={{background:"none",border:"none",color:C.red,cursor:"pointer",fontSize:13}}>✕</button>
            </div>
          ))}
          <div style={{display:"flex",gap:6,marginTop:8}}>
            <Input type="text" value={newLevel} onChange={e=>setNewLevel(e.target.value)} placeholder="Nuevo nivel..." style={{flex:1,fontSize:12,padding:"7px 10px"}}/>
            <Btn onClick={()=>{if(!newLevel.trim())return;updateNiveles(detailId,[...niveles,newLevel.trim()]);setNewLevel("");}} color={color} style={{padding:"7px 12px",fontSize:12}}>+</Btn>
          </div>
        </div>}
      </Card>

      {chartData.length>1&&<Card style={{marginBottom:14}}><SectionLabel>Progresión</SectionLabel><BarChart data={chartData} color={color}/><InsightBox data={chartData} unit=""/></Card>}

      {/* Historial */}
      {hist.length>0&&<><SectionLabel>Historial</SectionLabel>
        {hist.map((h,i)=>(
          <div key={i} style={{padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
            {editEntry===i?(
              <div style={{display:"flex",gap:8}}>
                <Input value={editVal} onChange={e=>setEditVal(e.target.value)} placeholder="Nuevo valor" style={{flex:1}}/>
                <Btn onClick={()=>{const arr=[...(data[detailId]||[])];arr[arr.length-1-i]={...arr[arr.length-1-i],val:parseFloat(editVal)};saveData({...data,[detailId]:arr});setEditEntry(null);setEditVal("");}} color={color} style={{padding:"8px 12px",fontSize:12}}>✓</Btn>
                <button onClick={()=>setEditEntry(null)} style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:14}}>✕</button>
              </div>
            ):(
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div>
                  <p style={{color:C.textSub,fontSize:12,margin:"0 0 2px"}}>{fmt(h.fecha)}</p>
                  {h.series&&<p style={{color:C.textMuted,fontSize:11,margin:0}}>{h.series}</p>}
                  {h.wod&&<p style={{color,fontSize:12,fontWeight:700,margin:"2px 0"}}>{h.wod}</p>}
                  {!h.wod&&h.nota&&<p style={{color:C.textMuted,fontSize:11,margin:0,fontStyle:"italic"}}>"{h.nota}"</p>}
                </div>
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  {h.val!==null&&h.val!==undefined&&<span style={{color:i===0?color:C.textSub,fontSize:14,fontWeight:i===0?700:400}}>{h.val}</span>}
                  {h.nivel!==null&&h.nivel!==undefined&&<span style={{color:i===0?color:C.textSub,fontSize:13,fontWeight:i===0?700:400}}>Nv.{h.nivel+1}</span>}
                  <button onClick={()=>{setEditEntry(i);setEditVal(h.val||"");}} style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:13}}>✏️</button>
                  <button onClick={()=>deleteEntry(detailId,i)} style={{background:"none",border:"none",color:C.red,cursor:"pointer",fontSize:13}}>🗑</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </>}

      {/* Añadir sesión anterior */}
      {!addPastOpen?(
        <button onClick={()=>setAddPastOpen(true)} style={{background:"none",border:`1px dashed ${C.borderLight}`,borderRadius:10,color:C.textMuted,width:"100%",padding:"10px",cursor:"pointer",fontSize:12,marginTop:10}}>+ Añadir sesión anterior</button>
      ):(
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:14,marginTop:10}}>
          <p style={{color:C.textSub,fontSize:12,fontWeight:700,margin:"0 0 10px"}}>Añadir sesión anterior</p>
          <div style={{display:"flex",gap:8,marginBottom:8}}>
            <div style={{flex:1}}><p style={{color:C.textMuted,fontSize:10,margin:"0 0 4px"}}>Fecha</p><Input type="text" value={pastFecha} onChange={e=>setPastFecha(e.target.value)} placeholder="2025-11-20"/></div>
            <div style={{flex:1}}><p style={{color:C.textMuted,fontSize:10,margin:"0 0 4px"}}>Valor (kg/reps)</p><Input value={pastVal} onChange={e=>setPastVal(e.target.value)} placeholder="Ej: 80"/></div>
          </div>
          <Input type="text" value={pastNota} onChange={e=>setPastNota(e.target.value)} placeholder="Nota (opcional)" style={{marginBottom:8,fontSize:12}}/>
          <div style={{display:"flex",gap:8}}>
            <Btn onClick={()=>{
              if(!isValidDate(pastFecha)){alert("Fecha inválida. Usa formato YYYY-MM-DD");return;}
              const prev=data[detailId]||[];
              const entry={fecha:pastFecha,val:parseFloat(pastVal)||null,nota:pastNota||null};
              saveData({...data,[detailId]:[...prev,entry].sort((a,b)=>a.fecha.localeCompare(b.fecha)).slice(-30)});
              setPastVal("");setPastNota("");setAddPastOpen(false);
            }} color={color} style={{flex:1}}>Añadir</Btn>
            <button onClick={()=>setAddPastOpen(false)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:10,color:C.textMuted,padding:"10px 14px",cursor:"pointer",fontSize:12}}>Cancelar</button>
          </div>
        </div>
      )}
    </div>;
  }

  // ── SESSION ──
  if(mode==="session"){
    const savedCount=sessionEjs.filter(id=>sessionInputs[id]?._saved).length;
    return <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <BackBtn onClick={()=>setMode("list")}/>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <SessionTimer color={color}/>
          <Tag color={color}>{savedCount}/{sessionEjs.length}</Tag>
        </div>
      </div>
      {restTimer&&<RestTimer seconds={restTimer} onClose={()=>setRestTimer(null)}/>}
      {savedId&&<SavedBadge color={color}/>}
      {/* WOD session result — shown for WOD tab, applies to whole session */}
      {tab.id==="wod"&&<Card style={{marginBottom:14,background:color+"0e",border:`1px solid ${color}33`}}>
        <p style={{color,fontSize:12,fontWeight:700,margin:"0 0 10px"}}>🔥 Resultado del WOD</p>
        <div style={{display:"flex",gap:8,marginBottom:8}}>
          <div style={{flex:1}}>
            <p style={{color:C.textMuted,fontSize:10,margin:"0 0 4px",textTransform:"uppercase",letterSpacing:1}}>Tipo</p>
            <select value={wodSessionType} onChange={e=>setWodSessionType(e.target.value)} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,color:C.text,padding:"10px 12px",fontSize:13,width:"100%"}}>
              <option value="">— Seleccionar —</option>
              {["AMRAP","For Time","EMOM","Chipper","Ladder","Hero WOD"].map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={{flex:1}}>
            <p style={{color:C.textMuted,fontSize:10,margin:"0 0 4px",textTransform:"uppercase",letterSpacing:1}}>Resultado</p>
            <Input type="text" value={wodSessionResult} onChange={e=>setWodSessionResult(e.target.value)} placeholder="Ej: 4:32 · 12rds · 185reps"/>
          </div>
        </div>
        {wodSessionType&&wodSessionResult&&<p style={{color:C.textMuted,fontSize:11,margin:0}}>Se guardará: <strong style={{color}}>{wodSessionType}: {wodSessionResult}</strong></p>}
      </Card>}
      {sessionEjs.map(ejId=>{
        const ej=exercises.find(e=>e.id===ejId);if(!ej) return null;
        const inp=sessionInputs[ejId]||{};
        const hist=data[ejId]||[];
        const lastVal=hist.filter(e=>e.val).slice(-1)[0]?.val;
        const maxVal=hist.filter(e=>e.val).length?Math.max(...hist.filter(e=>e.val).map(e=>e.val)):null;
        const niveles=getNiveles(ejId);
        const nivelActual=hist.filter(e=>e.nivel!==null&&e.nivel!==undefined).slice(-1)[0]?.nivel??null;
        const done=inp._saved;
        return <div key={ejId} style={{background:done?color+"12":C.card,border:`1px solid ${done?color+"35":C.border}`,borderRadius:16,padding:14,marginBottom:12,transition:"all 0.2s"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
            <p style={{color:done?C.textSub:C.text,fontSize:15,fontWeight:700,margin:0}}>{done?"✓ ":""}{ej.icon} {ej.nombre}</p>
            {maxVal&&<Tag color={color}>🏆 {maxVal}</Tag>}
          </div>
          {lastVal&&!done&&<p style={{color:C.orange,fontSize:11,margin:"0 0 10px"}}>🎯 Objetivo: <strong>{(lastVal+2.5).toFixed(1)}</strong></p>}
          {!done&&<>
            {niveles.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:8}}>
              {niveles.map((n,i)=>(
                <button key={i} onClick={()=>setSessionInputs(s=>({...s,[ejId]:{...s[ejId],nivel:i}}))} style={{background:inp.nivel===i?color:C.surface,color:inp.nivel===i?"#000":C.textSub,border:`1px solid ${inp.nivel===i?color:C.borderLight}`,borderRadius:8,padding:"5px 10px",fontSize:10,cursor:"pointer",fontWeight:inp.nivel===i?700:400}}>{i+1}. {n}</button>
              ))}
            </div>}
            <div style={{display:"flex",gap:8,marginBottom:8}}>
              <div style={{flex:1}}>
                <p style={{color:C.textMuted,fontSize:10,margin:"0 0 4px",textTransform:"uppercase",letterSpacing:1}}>kg / reps</p>
                <Input value={inp.val||""} onChange={e=>setSessionInputs(s=>({...s,[ejId]:{...s[ejId],val:e.target.value}}))} placeholder={lastVal?`Último: ${lastVal}`:"Ej: 80"}/>
              </div>
              <div style={{flex:1}}>
                <p style={{color:C.textMuted,fontSize:10,margin:"0 0 4px",textTransform:"uppercase",letterSpacing:1}}>Series × kg</p>
                <div style={{display:"flex",gap:4}}>
                  <Input value={inp.sN||""} onChange={e=>setSessionInputs(s=>({...s,[ejId]:{...s[ejId],sN:e.target.value}}))} placeholder="3" style={{flex:1}}/>
                  <Input value={inp.sK||""} onChange={e=>setSessionInputs(s=>({...s,[ejId]:{...s[ejId],sK:e.target.value}}))} placeholder="70" style={{flex:1}}/>
                </div>
              </div>
            </div>

            <Input type="text" value={inp.nota||""} onChange={e=>setSessionInputs(s=>({...s,[ejId]:{...s[ejId],nota:e.target.value}}))} placeholder="Nota técnica..." style={{marginBottom:8,fontSize:12}}/>
            <div style={{display:"flex",gap:8}}>
              <Btn onClick={()=>{
                const series=inp.sN&&inp.sK?`${inp.sN}×${inp.sK}kg`:null;
                const nivelToSave=inp.nivel!==undefined?inp.nivel:null;
                const entry={fecha:today(),val:parseFloat(inp.val)||null,nivel:nivelToSave,nota:inp.nota||null,series};
                saveData({...data,[ejId]:[...(data[ejId]||[]),entry].slice(-30)});
                setSessionInputs(s=>({...s,[ejId]:{...s[ejId],_saved:true}}));
              }} color={color} style={{flex:1}}>Guardar</Btn>
              <button onClick={()=>setRestTimer(60)} style={{background:color+"22",border:`1px solid ${color}44`,borderRadius:10,color,padding:"10px 12px",cursor:"pointer",fontSize:12,fontWeight:700}}>⏱</button>
            </div>
          </>}
        </div>;
      })}
      {tab.id==="wod"&&wodSessionType&&wodSessionResult&&(
        <div style={{marginTop:14,paddingTop:14,borderTop:`1px solid ${C.border}`}}>
          <Btn onClick={()=>{
            const entry={fecha:today(),val:null,nota:`${wodSessionType}: ${wodSessionResult}`,series:null,wod:`${wodSessionType}: ${wodSessionResult}`};
            const key="wod_session_"+today()+"_"+Date.now().toString(36);
            saveData({...data,[key]:[...(data[key]||[]),entry].slice(-30)});
            setWodSessionType("");setWodSessionResult("");
          }} color={color} style={{width:"100%"}}>💾 Guardar resultado del WOD</Btn>
        </div>
      )}
    </div>;
  }

  // ── LIST ──
  return <div>
    {confirm&&<ConfirmDialog msg={confirm.msg} onConfirm={confirm.onConfirm} onCancel={()=>setConfirm(null)}/>}
    <Card style={{marginBottom:16,background:color+"0e",border:`1px solid ${color}33`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
        <p style={{color,fontSize:13,fontWeight:700,margin:0}}>{tab.icon} {tab.name}</p>
        <SessionTimer color={color}/>
      </div>
      <p style={{color:C.textSub,fontSize:12,margin:"0 0 12px"}}>Selecciona los ejercicios de hoy:</p>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
        {exercises.map(ej=><ExerciseChip key={ej.id} ej={ej} selected={sessionEjs.includes(ej.id)} color={color} onSelect={id=>setSessionEjs(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id])} onDelete={deleteExercise}/>)}
      </div>
      {sessionEjs.length>0&&<Btn onClick={()=>{setMode("session");setSessionInputs({});}} color={color} style={{width:"100%",marginBottom:8}}>Empezar ({sessionEjs.length} ejercicios)</Btn>}
      {!addOpen?(
        <button onClick={()=>setAddOpen(true)} style={{background:"none",border:`1px dashed ${color}44`,borderRadius:8,color,width:"100%",padding:"8px",cursor:"pointer",fontSize:12}}>+ Añadir ejercicio</button>
      ):(
        <div style={{display:"flex",gap:6}}>
          <Input type="text" value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Nombre del ejercicio..." style={{flex:1}}/>
          <Btn onClick={addExercise} color={color} style={{padding:"11px 12px",whiteSpace:"nowrap"}}>✓</Btn>
          <button onClick={()=>setAddOpen(false)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:10,color:C.textMuted,padding:"11px 10px",cursor:"pointer",fontSize:12}}>✕</button>
        </div>
      )}
    </Card>
    <p style={{color:C.textMuted,fontSize:10,letterSpacing:1,margin:"0 0 8px",fontStyle:"italic"}}>Mantén pulsado un ejercicio para eliminarlo</p>
    <SectionLabel>Historial por ejercicio</SectionLabel>
    {/* WOD session results shown separately */}
    {tab.id==="wod"&&(()=>{
      const wodKeys=Object.keys(data).filter(k=>k.startsWith("wod_session_"));
      if(!wodKeys.length) return null;
      const results=wodKeys.flatMap(k=>data[k]).sort((a,b)=>b.fecha.localeCompare(a.fecha)).slice(0,10);
      return <Card style={{marginBottom:14,background:color+"0a",border:`1px solid ${color}33`}}>
        <p style={{color,fontSize:12,fontWeight:700,margin:"0 0 10px"}}>🏆 Resultados WOD</p>
        {results.map((r,i)=>(
          <div key={i} style={{padding:"7px 0",borderBottom:i<results.length-1?`1px solid ${C.border}`:"none"}}>
            <p style={{color:C.textSub,fontSize:11,margin:"0 0 2px"}}>{fmt(r.fecha)}</p>
            <p style={{color,fontSize:13,fontWeight:700,margin:0}}>{r.nota||r.wod||"—"}</p>
          </div>
        ))}
      </Card>;
    })()}
    <SectionLabel>Movimientos</SectionLabel>
    {exercises.map(ej=>{
      const hist=data[ej.id]||[];
      const vals=hist.filter(e=>e.val).map(e=>e.val);
      const maxVal=vals.length?Math.max(...vals):null;
      const lastEntry=hist.slice(-1)[0];
      const prevEntry=hist.slice(-2)[0];
      const delta=lastEntry?.val&&prevEntry?.val?lastEntry.val-prevEntry.val:null;
      return <div key={ej.id} onClick={()=>{setDetailId(ej.id);setMode("detail");}} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"12px 14px",marginBottom:8,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{flex:1}}>
          <p style={{color:C.text,fontSize:13,fontWeight:600,margin:"0 0 2px"}}>{ej.icon} {ej.nombre}</p>
          <p style={{color:C.textMuted,fontSize:11,margin:0}}>{hist.length} reg{lastEntry?` · ${fmt(lastEntry.fecha)}`:""}</p>
        </div>
        <div style={{textAlign:"right",minWidth:60}}>
          {maxVal?<><p style={{color,fontSize:15,fontWeight:700,margin:0}}>{maxVal}</p>{delta!==null&&<p style={{color:delta>=0?C.green:C.red,fontSize:10,margin:0}}>{delta>=0?"▲":"▼"}{Math.abs(delta)}</p>}</>:<p style={{color:C.textMuted,fontSize:12,margin:0}}>Sin registro</p>}
        </div>
      </div>;
    })}
    {/* Delete tab button */}
    <div style={{marginTop:20,paddingTop:16,borderTop:`1px solid ${C.border}`}}>
      <button onClick={()=>{if(onDeleteTab)onDeleteTab(tab.id);}} style={{background:"none",border:`1px solid ${C.red}44`,borderRadius:10,color:C.red,width:"100%",padding:"10px",cursor:"pointer",fontSize:13,fontWeight:600}}>
        🗑 Eliminar pestaña "{tab.name}"
      </button>
    </div>
  </div>;
}

// ── GYM PANEL ─────────────────────────────────────────────────────────────────
function GymPanel(){
  const planos=loadGymPlanos(); // always fresh from storage
  const [planoSel,setPlanoSel]=useState(()=>Object.keys(loadGymPlanos())[0]||"A");
  const [cargas,setCargas]=useState(()=>load(K.cargas)||{});
  const [seriesInputs,setSeriesInputs]=useState({});
  const [notes,setNotes]=useState({});
  const [sessionRPE,setSessionRPE]=useState(null);
  const [sessionNota,setSessionNota]=useState("");
  const [timerSecs,setTimerSecs]=useState(null);
  const [sessionSaved,setSessionSaved]=useState({});
  const [showSummary,setShowSummary]=useState(false);
  const [histEj,setHistEj]=useState(null);
  const [editMode,setEditMode]=useState(false);
  const [newEjName,setNewEjName]=useState("");
  const [confirm,setConfirm]=useState(null);
  const [editEntry,setEditEntry]=useState(null);
  const [editEntryVal,setEditEntryVal]=useState("");

  const plano=planos[planoSel]||Object.values(planos)[0];

  function savePlanos(upd){save(K.gymPlanos,upd);setPlanVer(v=>v+1);}
  function saveCargas(upd){setCargas(upd);save(K.cargas,upd);_sessionCacheKey="";}

  function moveEj(planoKey,idx,dir){
    const p={...planos[planoKey]};
    const arr=[...p.ejercicios];
    const ni=idx+dir;
    if(ni<0||ni>=arr.length) return;
    [arr[idx],arr[ni]]=[arr[ni],arr[idx]];
    savePlanos({...planos,[planoKey]:{...p,ejercicios:arr}});
  }

  function addEj(){
    if(!newEjName.trim()) return;
    const id=planoSel.toLowerCase()+"_"+Date.now();
    const ej={id,nombre:newEjName.trim(),grupo:"",series:3,reps:"8-10",descanso:60};
    const p=planos[planoSel];
    savePlanos({...planos,[planoSel]:{...p,ejercicios:[...p.ejercicios,ej]}});
    setNewEjName("");
  }

  function deleteEj(ejId){
    setConfirm({msg:"Se eliminará el ejercicio del plano. Los registros anteriores se conservan.",onConfirm:()=>{
      const p=planos[planoSel];
      savePlanos({...planos,[planoSel]:{...p,ejercicios:p.ejercicios.filter(e=>e.id!==ejId)}});
      setConfirm(null);
    }});
  }

  function handleConfirmSerie(ejId,descanso){setTimerSecs(descanso);}

  function handleSaveEj(ejId,descanso,numSeries){
    const arr=seriesInputs[ejId]||[];
    const vals=arr.map(v=>parseFloat(v)).filter(v=>!isNaN(v)&&v>0);
    if(vals.length<numSeries) return;
    const maxKg=Math.max(...vals);
    const entry={fecha:today(),kg:maxKg,series:vals,nota:notes[ejId]||null};
    const newC={...cargas,[ejId]:[...(cargas[ejId]||[]),entry].slice(-30)};
    saveCargas(newC);
    setSeriesInputs(i=>({...i,[ejId]:[]}));
    setNotes(n=>({...n,[ejId]:""}));
    setSessionSaved(s=>{
      const next={...s,[ejId]:vals};
      const pl=loadGymPlanos()[planoSel];
      if(pl&&pl.ejercicios.every(e=>next[e.id])){
        if(sessionRPE) saveRPE(today(),planoSel,sessionRPE);
        if(sessionNota.trim()){
          const notaLog=load(K.snota)||{};
          notaLog[`${today()}_${planoSel}`]=sessionNota.trim();
          save(K.snota,notaLog);
        }
      }
      return next;
    });
  }

  function deleteCargas(ejId,idx){
    setConfirm({msg:"Se eliminará este registro.",onConfirm:()=>{
      const arr=[...(cargas[ejId]||[])];arr.splice(arr.length-1-idx,1);
      saveCargas({...cargas,[ejId]:arr});setConfirm(null);
    }});
  }

  const allDone=plano.ejercicios.every(ej=>sessionSaved[ej.id]);
  const doneCount=plano.ejercicios.filter(ej=>sessionSaved[ej.id]).length;

  // ── HIST DETAIL ──
  if(histEj){
    const ej=Object.values(planos).flatMap(p=>p.ejercicios).find(e=>e.id===histEj);
    const hist=[...(cargas[histEj]||[])].reverse();
    const chartData=(cargas[histEj]||[]).map(h=>({val:h.kg,fecha:h.fecha}));
    const maxVal=chartData.length?Math.max(...chartData.map(d=>d.val)):0;
    return <div>
      {confirm&&<ConfirmDialog msg={confirm.msg} onConfirm={confirm.onConfirm} onCancel={()=>setConfirm(null)}/>}
      <BackBtn onClick={()=>{setHistEj(null);setEditEntry(null);}}/>
      <Card accent={plano.color} style={{marginBottom:14}}>
        <Tag color={plano.color}>Plano {planoSel}</Tag>
        <p style={{color:C.text,fontSize:17,fontWeight:700,margin:"6px 0 0"}}>{ej?.nombre}</p>
        <div style={{display:"flex",gap:16,marginTop:8}}>
          {[["Récord",maxVal+"kg"],["Sesiones",hist.length]].map(([k,v])=>(
            <div key={k}><p style={{color:C.textMuted,fontSize:10,margin:"0 0 2px"}}>{k}</p><p style={{color:plano.color,fontSize:16,fontWeight:700,margin:0}}>{v}</p></div>
          ))}
        </div>
      </Card>
      {chartData.length>1&&<Card style={{marginBottom:14}}>
        <SectionLabel>Progresión de carga</SectionLabel>
        <BarChart data={chartData} color={plano.color}/>
        <InsightBox data={chartData} unit="kg"/>
      </Card>}
      {(()=>{
        const planoKey=Object.entries(planos).find(([,p])=>p.ejercicios.some(e=>e.id===histEj))?.[0];
        if(!planoKey) return null;
        const rpeLog=load(K.rpe)||{};
        const rpeDates=[...(cargas[histEj]||[])].map(h=>h.fecha).filter((d,i,a)=>a.indexOf(d)===i);
        const rpeData=rpeDates.map(d=>({val:rpeLog[`${d}_${planoKey}`]||null,fecha:d})).filter(e=>e.val);
        if(rpeData.length<2) return null;
        const lastRPE=rpeData[rpeData.length-1].val;
        const rpeColor=lastRPE>=8?C.red:lastRPE>=6?C.orange:C.green;
        const avg3=(rpeData.slice(-3).reduce((a,d)=>a+d.val,0)/Math.min(3,rpeData.length)).toFixed(1);
        return <Card style={{marginBottom:14}}>
          <SectionLabel>Tendencia RPE de sesión</SectionLabel>
          <BarChart data={rpeData} color={rpeColor} unit="/10"/>
          <p style={{color:C.textMuted,fontSize:11,margin:"6px 0 0",fontStyle:"italic"}}>
            Media últimas 3 sesiones: RPE {avg3}/10
            {parseFloat(avg3)>=8?" — alta fatiga, considera reducir carga":parseFloat(avg3)<=5?" — margen disponible, puedes progresar":""}
          </p>
        </Card>;
      })()}
      <SectionLabel>Historial</SectionLabel>
      {hist.map((h,i)=>(
        <div key={i} style={{padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
          {editEntry===i?(
            <div style={{display:"flex",gap:8}}>
              <Input value={editEntryVal} onChange={e=>setEditEntryVal(e.target.value)} placeholder="Nuevo máx kg" style={{flex:1}}/>
              <Btn onClick={()=>{const arr=[...(cargas[histEj]||[])];arr[arr.length-1-i]={...arr[arr.length-1-i],kg:parseFloat(editEntryVal)};saveCargas({...cargas,[histEj]:arr});setEditEntry(null);setEditEntryVal("");}} color={plano.color} style={{padding:"8px 12px",fontSize:12}}>✓</Btn>
              <button onClick={()=>setEditEntry(null)} style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:14}}>✕</button>
            </div>
          ):(
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <p style={{color:C.textSub,fontSize:12,margin:"0 0 2px"}}>{fmt(h.fecha)}</p>
                {h.series&&<p style={{color:C.textMuted,fontSize:11,margin:0}}>Series: {h.series.join(" · ")}kg</p>}
                {(()=>{
                  const planoKey=Object.entries(loadGymPlanos()).find(([,p])=>p.ejercicios.some(e=>e.id===histEj))?.[0];
                  const rpe=planoKey?getRPE(h.fecha,planoKey):null;
                  const nota=(load(K.snota)||{})[`${h.fecha}_${planoKey}`]||null;
                  return <>{rpe&&<p style={{color:rpe<=5?C.green:rpe<=8?C.orange:C.red,fontSize:10,margin:"2px 0 0"}}>RPE sesión: {rpe}/10</p>}{nota&&<p style={{color:C.textMuted,fontSize:10,margin:"1px 0 0",fontStyle:"italic"}}>"{nota}"</p>}</>;
                })()}
                {h.nota&&<p style={{color:C.textMuted,fontSize:11,margin:"2px 0 0",fontStyle:"italic"}}>"{h.nota}"</p>}
              </div>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <p style={{color:i===0?plano.color:C.textSub,fontSize:14,fontWeight:i===0?700:400,margin:0}}>{h.kg}kg</p>
                <button onClick={()=>{setEditEntry(i);setEditEntryVal(h.kg);}} style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:13}}>✏️</button>
                <button onClick={()=>deleteCargas(histEj,i)} style={{background:"none",border:"none",color:C.red,cursor:"pointer",fontSize:13}}>🗑</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>;
  }

  // ── SUMMARY ──
  if(showSummary){
    const items=plano.ejercicios.map(ej=>{
      const vals=sessionSaved[ej.id];if(!vals) return null;
      const maxKg=Math.max(...vals);
      const h=cargas[ej.id]||[];
      const prevMax=h.slice(-2)[0]?.kg;
      const delta=prevMax?maxKg-prevMax:null;
      const rec=h.length?Math.max(...h.map(e=>e.kg)):maxKg;
      return{ej,vals,maxKg,delta,isRecord:maxKg>=rec};
    }).filter(Boolean);
    const mejoras=items.filter(i=>i.delta>0).length;
    const records=items.filter(i=>i.isRecord&&i.delta>0).length;
    return <div>
      <div style={{background:`linear-gradient(135deg,${plano.color}22,${C.surface})`,border:`1px solid ${plano.color}44`,borderRadius:20,padding:20,marginBottom:20}}>
        <Tag color={plano.color}>Sesión completada</Tag>
        <p style={{color:C.text,fontSize:20,fontWeight:800,margin:"8px 0 6px"}}>Plano {planoSel} — {plano.nombre}</p>
        <div style={{display:"flex",gap:12,margin:"4px 0 12px",flexWrap:"wrap"}}>
          {sessionRPE&&<Tag color={sessionRPE<=5?C.green:sessionRPE<=8?C.orange:C.red}>RPE {sessionRPE}/10</Tag>}
          {sessionNota&&<p style={{color:C.textSub,fontSize:12,margin:0,fontStyle:"italic"}}>"{sessionNota}"</p>}
        </div>
        <div style={{display:"flex",gap:20}}>
          <div><p style={{color:C.green,fontSize:26,fontWeight:900,margin:0}}>{mejoras}</p><p style={{color:C.textMuted,fontSize:11,margin:0}}>Mejoras</p></div>
          <div><p style={{color:C.yellow,fontSize:26,fontWeight:900,margin:0}}>{records}</p><p style={{color:C.textMuted,fontSize:11,margin:0}}>Récords</p></div>
          <div><p style={{color:C.text,fontSize:26,fontWeight:900,margin:0}}>{items.length}</p><p style={{color:C.textMuted,fontSize:11,margin:0}}>Ejercicios</p></div>
        </div>
      </div>
      {items.map(({ej,vals,maxKg,delta,isRecord},i)=>(
        <div key={i} style={{padding:"12px 0",borderBottom:`1px solid ${C.border}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div><p style={{color:C.text,fontSize:13,fontWeight:600,margin:"0 0 2px"}}>{ej.nombre}</p><p style={{color:C.textMuted,fontSize:11,margin:0}}>Series: {vals.join(" · ")}kg</p></div>
            <div style={{textAlign:"right"}}>
              <p style={{color:plano.color,fontSize:15,fontWeight:700,margin:0}}>{maxKg}kg {isRecord&&delta>0?"🏆":""}</p>
              {delta!==null&&<p style={{color:delta>0?C.green:delta<0?C.red:C.textMuted,fontSize:11,margin:0}}>{delta>0?"▲":delta<0?"▼":"="}{Math.abs(delta)}kg</p>}
            </div>
          </div>
        </div>
      ))}
      <Btn onClick={()=>{setShowSummary(false);setSessionSaved({});setSessionRPE(null);setSessionNota("");}} color={plano.color} style={{width:"100%",marginTop:20}}>Nueva sesión</Btn>
    </div>;
  }

  // ── MAIN ──
  return <div>
    {confirm&&<ConfirmDialog msg={confirm.msg} onConfirm={confirm.onConfirm} onCancel={()=>setConfirm(null)}/>}
    {timerSecs&&<RestTimer seconds={timerSecs} onClose={()=>setTimerSecs(null)}/>}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
      <div style={{display:"flex",gap:8}}>
        {Object.entries(planos).map(([k,p])=>(
          <button key={k} onClick={()=>{setPlanoSel(k);setSessionSaved({});setSeriesInputs({});setSessionRPE(null);setSessionNota("");}} style={{background:planoSel===k?p.color:C.card,color:planoSel===k?"#000":p.color,border:`1.5px solid ${planoSel===k?p.color:p.color+"44"}`,borderRadius:12,padding:"8px 14px",cursor:"pointer",fontSize:13,fontWeight:700,transition:"all 0.15s"}}>
            {k}
          </button>
        ))}
      </div>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <SessionTimer color={plano.color}/>
        <button onClick={()=>setEditMode(e=>!e)} style={{background:editMode?plano.color:C.card,color:editMode?"#000":C.textSub,border:`1px solid ${editMode?plano.color:C.border}`,borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:11,fontWeight:700}}>{editMode?"✓ Listo":"✏️"}</button>
      </div>
    </div>

    {doneCount>0&&!showSummary&&<div style={{marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
        <p style={{color:C.textSub,fontSize:12,margin:0}}>{doneCount}/{plano.ejercicios.length} ejercicios</p>
        {allDone&&<Btn onClick={()=>setShowSummary(true)} color={plano.color} style={{padding:"5px 12px",fontSize:11}}>Ver resumen →</Btn>}
      </div>
      <ProgressBar pct={(doneCount/plano.ejercicios.length)*100} color={plano.color} height={4}/>
    </div>}

    {/* RPE de sesión — only when session started */}
    {doneCount>0&&<div style={{marginBottom:14}}>
      <p style={{color:C.textMuted,fontSize:10,letterSpacing:2,textTransform:"uppercase",margin:"0 0 8px"}}>RPE — Esfuerzo percibido{!sessionRPE?" (opcional)":""}</p>
      <div style={{display:"flex",gap:3}}>
        {[1,2,3,4,5,6,7,8,9,10].map(n=>{
          const rc=n<=3?C.green:n<=6?C.blue:n<=8?C.orange:C.red;
          return <button key={n} onClick={()=>setSessionRPE(n===sessionRPE?null:n)} style={{flex:1,background:sessionRPE===n?rc:C.surface,color:sessionRPE===n?"#000":C.textMuted,border:`1px solid ${sessionRPE===n?rc:C.border}`,borderRadius:6,padding:"7px 2px",cursor:"pointer",fontSize:11,fontWeight:sessionRPE===n?700:400,transition:"all 0.15s"}}>{n}</button>;
        })}
      </div>
      {sessionRPE&&<p style={{color:C.textMuted,fontSize:10,margin:"5px 0 4px",fontStyle:"italic"}}>{sessionRPE<=3?"Muy fácil":sessionRPE<=5?"Moderado — zona de mantenimiento":sessionRPE<=7?"Óptimo — zona de progresión":sessionRPE<=8?"Duro — buen estímulo":sessionRPE<=9?"Muy duro — cerca del límite":"Al límite — necesitas recuperación extra"}</p>}
      <Input type="text" value={sessionNota} onChange={e=>setSessionNota(e.target.value)} placeholder="Nota de sesión: cómo te has sentido, contexto..." style={{fontSize:12,marginTop:6}}/>
    </div>}

    {plano.ejercicios.map((ej,idx)=>{
      const hist=cargas[ej.id]||[];
      const last=hist[hist.length-1];
      const lastSeries=last?.series||[];
      const objetivo=last?Math.max(...(last.series||[last.kg]))+2.5:null;
      const done=sessionSaved[ej.id];
      const sArr=seriesInputs[ej.id]||[];
      const filled=sArr.filter(v=>parseFloat(v)>0).length;
      const allFilled=filled>=ej.series;

      return <div key={ej.id} style={{background:done?C.gymColor+"12":C.card,border:`1px solid ${done?C.gymColor+"35":C.border}`,borderRadius:16,padding:14,marginBottom:10,transition:"all 0.2s"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
              {done&&<span style={{color:C.gymColor,fontSize:14}}>✓</span>}
              <p style={{color:done?C.textSub:C.text,fontSize:14,fontWeight:700,margin:0}}>{ej.nombre}</p>
            </div>
            <p style={{color:C.textMuted,fontSize:11,margin:0}}>{ej.series} series · {ej.reps} reps · {ej.descanso}s</p>
          </div>
          <div style={{textAlign:"right"}}>
            {done?<p style={{color:C.gymColor,fontSize:13,fontWeight:700,margin:0}}>{Math.max(...done)}kg</p>:last?<p style={{color:plano.color,fontSize:13,fontWeight:700,margin:0}}>{last.kg}kg</p>:null}
          </div>
        </div>

        {editMode&&<div style={{display:"flex",gap:6,marginBottom:8,borderTop:`1px solid ${C.border}`,paddingTop:8}}>
          <button onClick={()=>moveEj(planoSel,idx,-1)} disabled={idx===0} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,color:C.textSub,padding:"4px 8px",cursor:"pointer",fontSize:12,opacity:idx===0?0.3:1}}>↑</button>
          <button onClick={()=>moveEj(planoSel,idx,1)} disabled={idx===plano.ejercicios.length-1} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,color:C.textSub,padding:"4px 8px",cursor:"pointer",fontSize:12,opacity:idx===plano.ejercicios.length-1?0.3:1}}>↓</button>
          <button onClick={()=>deleteEj(ej.id)} style={{background:"none",border:`1px solid ${C.red}44`,borderRadius:6,color:C.red,padding:"4px 10px",cursor:"pointer",fontSize:12,marginLeft:"auto"}}>🗑 Eliminar</button>
        </div>}

        {!done&&!editMode&&<>
          {objetivo&&(()=>{
            const repsNum=parseInt((ej.reps||"8").split("-")[0])||8;
            // Only estimate 1RM for compound/strength ranges (≤8 reps), not isolation
            const isStrength=repsNum<=8;
            const est1RM=last&&isStrength&&repsNum>1?Math.round(last.kg*(1+repsNum/30)):null;
            return <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>
              <Tag color={C.orange}>🎯 {objetivo}kg</Tag>
              {est1RM&&<Tag color={C.purple}>~1RM: {est1RM}kg</Tag>}
            </div>;
          })()}
          <div style={{marginBottom:8}}>
            {Array.from({length:ej.series},(_,si)=>{
              const val=sArr[si]||"";const confirmed=parseFloat(val)>0;
              return <div key={si} style={{display:"flex",gap:6,alignItems:"center",marginBottom:5}}>
                <p style={{color:C.textMuted,fontSize:11,margin:0,minWidth:28,fontWeight:700}}>S{si+1}{lastSeries[si]?<span style={{fontWeight:400}}> ({lastSeries[si]})</span>:""}</p>
                <input type="number" value={val} onChange={e=>{const a=[...(seriesInputs[ej.id]||Array(ej.series).fill(""))];a[si]=e.target.value;setSeriesInputs(i=>({...i,[ej.id]:a}));}} onKeyDown={e=>{if(e.key==="Enter"&&parseFloat(val)>0){e.preventDefault();handleConfirmSerie(ej.id,ej.descanso);}}} placeholder={lastSeries[si]?`${lastSeries[si]}kg`:"kg"} style={{background:confirmed?C.green+"18":C.surface,border:`1px solid ${confirmed?C.green+"55":C.border}`,borderRadius:8,color:C.text,padding:"8px 10px",fontSize:13,flex:1,boxSizing:"border-box",outline:"none"}}/>
                <button onClick={()=>handleConfirmSerie(ej.id,ej.descanso)} disabled={!confirmed} style={{background:confirmed?C.green+"22":C.surface,border:`1px solid ${confirmed?C.green+"55":C.border}`,borderRadius:8,color:confirmed?C.green:C.textMuted,padding:"8px 10px",cursor:confirmed?"pointer":"default",fontSize:12,fontWeight:700,whiteSpace:"nowrap"}}>⏱</button>
              </div>;
            })}
          </div>
          <div style={{display:"flex",gap:8,marginBottom:6}}>
            <Input type="text" value={notes[ej.id]||""} onChange={e=>setNotes(n=>({...n,[ej.id]:e.target.value}))} placeholder="Nota técnica..." style={{flex:1,fontSize:12}}/>
            <Btn onClick={()=>handleSaveEj(ej.id,ej.descanso,ej.series)} color={allFilled?plano.color:C.textMuted} style={{whiteSpace:"nowrap",padding:"11px 14px",opacity:allFilled?1:0.4}}>{filled}/{ej.series} ✓</Btn>
          </div>
        </>}
        <button onClick={()=>setHistEj(ej.id)} style={{background:"none",border:"none",color:C.textMuted,fontSize:11,cursor:"pointer",padding:"4px 0",textDecoration:"underline"}}>Ver historial</button>
      </div>;
    })}

    {editMode&&<div style={{marginTop:8}}>
      <div style={{display:"flex",gap:8}}>
        <Input type="text" value={newEjName} onChange={e=>setNewEjName(e.target.value)} placeholder="Nombre del ejercicio..." style={{flex:1}}/>
        <Btn onClick={addEj} color={plano.color} style={{padding:"11px 14px",whiteSpace:"nowrap"}}>+ Añadir</Btn>
      </div>
    </div>}
  </div>;
}

// ── SCREEN ENTRENO ────────────────────────────────────────────────────────────
function ScreenEntreno({initTab="gym"}){
  const [tabsVer,setTabsVer]=useState(0); // increment to force re-read
  const tabs=loadTabs(); // always fresh from storage
  const [activeTab,setActiveTab]=useState(initTab);
  const [showAddTab,setShowAddTab]=useState(false);
  const [newTabName,setNewTabName]=useState("");
  const [confirm,setConfirm]=useState(null);

  function saveTabs(upd){save(K.tabs,upd);setTabsVer(v=>v+1);}

  function addTab(){
    if(!newTabName.trim()) return;
    const id="tab_"+Date.now();
    const tab={id,name:newTabName.trim(),icon:"⭐",color:"#fbbf24",type:"cf"};
    saveTabs([...tabs,tab]);
    setNewTabName("");setShowAddTab(false);setActiveTab(id);
  }

  function deleteTab(id){
    setConfirm({msg:"Se eliminará esta pestaña. Los registros de ejercicios se conservan.",onConfirm:()=>{
      // Remove tab
      const upd=tabs.filter(t=>t.id!==id);
      saveTabs(upd);
      // Clean weekPlan assignments that reference deleted tab
      const week=loadWeek();
      const cleanedWeek=week.map(d=>({...d,assignments:(d.assignments||[]).filter(a=>a.tabId!==id)}));
      save(K.planWeek,cleanedWeek);
      if(activeTab===id) setActiveTab(upd[0]?.id||"gym");
      setConfirm(null);
    }});
  }

  const tab=tabs.find(t=>t.id===activeTab)||tabs[0];

  return <div>
    {confirm&&<ConfirmDialog msg={confirm.msg} onConfirm={confirm.onConfirm} onCancel={()=>setConfirm(null)}/>}
    {/* Tab bar */}
    <div style={{display:"flex",gap:6,marginBottom:20,overflowX:"auto",paddingBottom:4}}>
      {tabs.map(t=>(<button key={t.id} onClick={()=>setActiveTab(t.id)} style={{background:activeTab===t.id?t.color:C.card,color:activeTab===t.id?"#000":C.textSub,border:`1.5px solid ${activeTab===t.id?t.color:C.border}`,borderRadius:10,padding:"9px 14px",fontSize:13,fontWeight:activeTab===t.id?700:400,cursor:"pointer",transition:"all 0.15s",whiteSpace:"nowrap",flexShrink:0}}>{t.icon} {t.name}</button>))}
      {!showAddTab?(
        <button onClick={()=>setShowAddTab(true)} style={{background:"none",border:`1.5px dashed ${C.borderLight}`,borderRadius:10,padding:"9px 14px",fontSize:13,color:C.textMuted,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>+ Añadir</button>
      ):(
        <div style={{display:"flex",gap:6,flexShrink:0}}>
          <Input type="text" value={newTabName} onChange={e=>setNewTabName(e.target.value)} placeholder="Nombre..." style={{width:130}}/>
          <Btn onClick={addTab} color={C.gymColor} style={{padding:"9px 12px",fontSize:12}}>✓</Btn>
          <button onClick={()=>setShowAddTab(false)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:10,color:C.textMuted,padding:"9px 10px",cursor:"pointer",fontSize:12}}>✕</button>
        </div>
      )}
    </div>
    {tab?.type==="gym"?<GymPanel/>:<CFPanel key={tab?.id} tab={tab} onDeleteTab={deleteTab}/>}
  </div>;
}

// ── MEDIDAS PANEL ─────────────────────────────────────────────────────────────
const MEDIDAS_FIELDS=[
  {id:"peso",label:"Peso",unit:"kg",icon:"⚖️"},{id:"grasa",label:"% Grasa",unit:"%",icon:"📊"},
  {id:"masaMagra",label:"Masa Magra",unit:"kg",icon:"💪"},{id:"bicepD",label:"Bícep D",unit:"cm",icon:"📏"},
  {id:"bicepI",label:"Bícep I",unit:"cm",icon:"📏"},{id:"torax",label:"Tórax",unit:"cm",icon:"📏"},
  {id:"abdomen",label:"Abdomen",unit:"cm",icon:"📏"},{id:"musloD",label:"Muslo D",unit:"cm",icon:"📏"},
  {id:"musloI",label:"Muslo I",unit:"cm",icon:"📏"},{id:"gemelo",label:"Gemelo",unit:"cm",icon:"📏"},
];
function MedidasPanel(){
  const [medidas,setMedidas]=useState(()=>load(K.medidas)||[]);
  const [mode,setMode]=useState("list");
  const [inputs,setInputs]=useState({});
  const [detailIdx,setDetailIdx]=useState(null);
  function handleAdd(){
    const entry={fecha:today(),...Object.fromEntries(MEDIDAS_FIELDS.map(f=>[f.id,parseFloat(inputs[f.id])||""]))};
    const upd=[entry,...medidas];setMedidas(upd);save(K.medidas,upd);setInputs({});setMode("list");
  }
  function getDelta(field,idx){
    if(idx>=medidas.length-1) return null;
    const curr=medidas[idx][field],prev=medidas[idx+1][field];
    if(!curr||!prev) return null;
    return(curr-prev).toFixed(1);
  }
  if(mode==="add") return <div>
    <BackBtn onClick={()=>setMode("list")}/>
    <p style={{color:C.text,fontSize:16,fontWeight:700,margin:"0 0 16px"}}>Nueva evaluación — {today()}</p>
    {MEDIDAS_FIELDS.map(f=><div key={f.id} style={{marginBottom:12}}>
      <p style={{color:C.textSub,fontSize:11,margin:"0 0 5px"}}>{f.icon} {f.label} ({f.unit})</p>
      <Input value={inputs[f.id]||""} onChange={e=>setInputs(i=>({...i,[f.id]:e.target.value}))} placeholder={`Ej: ${f.id==="grasa"?"7.6":f.id==="peso"?"65.7":"33"}`}/>
    </div>)}
    <Btn onClick={handleAdd} style={{width:"100%",marginTop:8}}>Guardar evaluación</Btn>
  </div>;
  if(mode==="detail"&&detailIdx!==null){
    const entry=medidas[detailIdx];
    return <div>
      <BackBtn onClick={()=>setMode("list")}/>
      <p style={{color:C.text,fontSize:16,fontWeight:700,margin:"0 0 16px"}}>Evaluación — {fmt(entry.fecha)}</p>
      {MEDIDAS_FIELDS.map(f=>{
        const delta=getDelta(f.id,detailIdx);
        return <div key={f.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:`1px solid ${C.border}`}}>
          <p style={{color:C.textSub,fontSize:13,margin:0}}>{f.icon} {f.label}</p>
          <div style={{textAlign:"right"}}>
            <p style={{color:C.text,fontSize:15,fontWeight:600,margin:0}}>{entry[f.id]||"—"}{entry[f.id]?f.unit:""}</p>
            {delta!==null&&<p style={{color:parseFloat(delta)>=0?C.green:C.red,fontSize:11,margin:0}}>{parseFloat(delta)>=0?"▲":"▼"}{Math.abs(delta)}{f.unit}</p>}
          </div>
        </div>;
      })}
    </div>;
  }
  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
      <SectionLabel>Evaluaciones ({medidas.length})</SectionLabel>
      <Btn onClick={()=>setMode("add")} style={{padding:"7px 14px",fontSize:12}}>+ Nueva</Btn>
    </div>
    {!medidas.length&&<Card style={{textAlign:"center",padding:40}}><p style={{fontSize:32,margin:"0 0 8px"}}>📋</p><p style={{color:C.textSub,fontSize:14}}>Sin evaluaciones aún.</p></Card>}
    {medidas.length>0&&<>
      <Card accent={C.gymColor} style={{marginBottom:14}}>
        <SectionLabel>Última — {fmt(medidas[0].fecha)}</SectionLabel>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:8}}>
          {MEDIDAS_FIELDS.slice(0,4).map(f=>(
            <div key={f.id} style={{background:C.surface,borderRadius:10,padding:"10px 14px"}}>
              <p style={{color:C.textMuted,fontSize:10,margin:"0 0 2px",textTransform:"uppercase",letterSpacing:1}}>{f.label}</p>
              <p style={{color:C.gymColor,fontSize:15,fontWeight:700,margin:0}}>{medidas[0][f.id]||"—"}{medidas[0][f.id]?f.unit:""}</p>
            </div>
          ))}
        </div>
      </Card>
      {medidas.map((entry,i)=>(
        <div key={i} onClick={()=>{setDetailIdx(i);setMode("detail");}} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"12px 14px",marginBottom:8,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <p style={{color:i===0?C.text:C.textSub,fontSize:14,fontWeight:i===0?700:400,margin:"0 0 2px"}}>{fmt(entry.fecha)}</p>
            <p style={{color:C.textMuted,fontSize:12,margin:0}}>{entry.peso?`${entry.peso}kg`:""}{entry.grasa?` · ${entry.grasa}%`:""}{entry.masaMagra?` · ${entry.masaMagra}kg magra`:""}</p>
          </div>
          <span style={{color:C.textMuted,fontSize:18}}>›</span>
        </div>
      ))}
    </>}
  </div>;
}

// ── SCREEN HOY ────────────────────────────────────────────────────────────────
function ScreenHoy({onNavigate}){
  const [showLastSession,setShowLastSession]=useState(false);
  const tabs=loadTabs();
  const weekPlan=loadWeek();
  const objectives=loadObjectives();
  const cargas=load(K.cargas)||{};

  const todayDate=today();
  const dowIndex=new Date().getDay();
  const dowMap={0:6,1:0,2:1,3:2,4:3,5:4,6:5};
  const planIdx=dowMap[dowIndex];
  const todayPlan=weekPlan[planIdx]||{assignments:[]};
  const todayAssignments=todayPlan.assignments||[];

  // Derive sessions from actual data — always in sync with deletions
  const todaySessions=getTrainedSessions(todayDate);
  const trainedToday=todaySessions.length>0;

  const allTrainedDates=getTrainedDates();
  const weekStart=new Date();weekStart.setDate(weekStart.getDate()-planIdx);
  const weekStartStr=`${weekStart.getFullYear()}-${String(weekStart.getMonth()+1).padStart(2,"0")}-${String(weekStart.getDate()).padStart(2,"0")}`;
  const daysThisWeek=new Set(Array.from(allTrainedDates).filter(d=>d>=weekStartStr&&d<=todayDate)).size;

  // Racha: count consecutive weeks with at least one training day
  const streak=(()=>{
    let weeks=0;
    const now=new Date();
    for(let w=0;w<52;w++){
      const wEnd=new Date(now);wEnd.setDate(wEnd.getDate()-(w*7));
      const wStart=new Date(wEnd);wStart.setDate(wEnd.getDate()-6);
      const wStartStr=`${wStart.getFullYear()}-${String(wStart.getMonth()+1).padStart(2,"0")}-${String(wStart.getDate()).padStart(2,"0")}`;
      const wEndStr=`${wEnd.getFullYear()}-${String(wEnd.getMonth()+1).padStart(2,"0")}-${String(wEnd.getDate()).padStart(2,"0")}`;
      const hasTraining=Array.from(allTrainedDates).some(d=>d>=wStartStr&&d<=wEndStr);
      if(hasTraining) weeks++;
      else if(w>0) break; // gap found — stop counting (skip current partial week check)
    }
    return weeks;
  })();

  // Load once, reuse everywhere in this render
  const gymPlanos=loadGymPlanos();
  const allGymEjs=Object.values(gymPlanos).flatMap(p=>p.ejercicios);

  const stalledEjs=Object.entries(cargas).filter(([,h])=>{
    if(h.length<3) return false;
    const last3=h.slice(-3);
    const kgProgress=last3[2].kg>last3[0].kg;
    // Also check volume (max series kg) — if reps increased, not stalled
    const lastSeries=last3[2].series||[];const firstSeries=last3[0].series||[];
    const volProgress=lastSeries.length>0&&firstSeries.length>0&&
      lastSeries.reduce((a,v)=>a+v,0)>firstSeries.reduce((a,v)=>a+v,0);
    return !kgProgress&&!volProgress;
  }).map(([id])=>allGymEjs.find(e=>e.id===id)).filter(Boolean).slice(0,3);

  const recentPRs=Object.entries(cargas).filter(([,h])=>{
    if(h.length<2) return false;
    const last=h[h.length-1];
    return last.fecha===todayDate&&last.kg>Math.max(...h.slice(0,-1).map(e=>e.kg));
  }).map(([id])=>allGymEjs.find(e=>e.id===id)).filter(Boolean);

  // CF stall detection
  const cfStalledEjs=loadTabs().filter(t=>t.type==="cf").flatMap(tab=>{
    const tabData=load(tabDataKey(tab.id))||{};
    return Object.entries(tabData).filter(([k,h])=>{
      if(k.startsWith("wod_session_")) return false;
      const valH=h.filter(e=>e.val!==null&&e.val!==undefined);
      if(valH.length<3) return false;
      const last3=valH.slice(-3).map(e=>e.val);
      return last3[2]<=last3[0];
    }).map(([ejId])=>{
      const ejs=loadTabEjs(tab.id);
      const ej=ejs.find(e=>e.id===ejId);
      return ej?{...ej,tabName:tab.name,tabColor:tab.color}:null;
    }).filter(Boolean);
  }).slice(0,2);

  const dayNames=["L","M","X","J","V","S","D"];

  // Deload: check weeks since first gym session
  const allCargaDates=Object.values(cargas).flatMap(h=>h.map(e=>e.fecha)).sort();
  const firstCargaDate=allCargaDates[0];
  const weeksSinceFirst=firstCargaDate?(()=>{
    const [fy,fm,fd]=firstCargaDate.split("-").map(Number);
    const [ty,tm,td]=todayDate.split("-").map(Number);
    const ms=new Date(ty,tm-1,td)-new Date(fy,fm-1,fd);
    return Math.floor(ms/(7*24*3600*1000));
  })():0;
  const showDeload=weeksSinceFirst>=4&&weeksSinceFirst%4===0;
  // Also warn if avg RPE last 3 gym sessions >= 8.5 (fatigue accumulation)
  const recentRPEs=(()=>{
    const rpeLog=load(K.rpe)||{};
    const planoKeys=Object.keys(loadGymPlanos());
    const allRPEs=Object.entries(rpeLog)
      .filter(([k])=>planoKeys.some(pk=>k.endsWith("_"+pk)))
      .sort(([a],[b])=>b.localeCompare(a)).slice(0,3).map(([,v])=>v);
    return allRPEs;
  })();
  const avgRecentRPE=recentRPEs.length>=2?(recentRPEs.reduce((a,v)=>a+v,0)/recentRPEs.length):0;
  const showFatigueWarning=!showDeload&&avgRecentRPE>=8.5;

  function getAssignmentColor(assignment){
    if(assignment.tabId==="gym") return gymPlanos[assignment.planoKey]?.color||C.gymColor;
    const tab=tabs.find(t=>t.id===assignment.tabId);
    return tab?.color||C.textMuted;
  }
  function getAssignmentLabel(assignment){
    if(assignment.tabId==="gym") return `🏋️ Gym — Plano ${assignment.planoKey||""}`;
    const tab=tabs.find(t=>t.id===assignment.tabId);
    return tab?`${tab.icon} ${tab.name}`:"Entreno";
  }

  function getLastSessionDate(planoKey){
    const plano=gymPlanos[planoKey];if(!plano) return null;
    const dates=plano.ejercicios.flatMap(ej=>(cargas[ej.id]||[]).map(h=>h.fecha));
    return dates.sort().slice(-1)[0]||null;
  }

  function getLastSessionData(planoKey){
    const plano=gymPlanos[planoKey];if(!plano) return [];
    return plano.ejercicios.map(ej=>{
      const hist=cargas[ej.id]||[];
      const last=hist[hist.length-1];
      return last?{nombre:ej.nombre,kg:last.kg,series:last.series,fecha:last.fecha}:null;
    }).filter(Boolean);
  }

  return <div style={{paddingBottom:8}}>
    {/* HERO */}
    <div style={{background:`linear-gradient(160deg,${todayAssignments.length?getAssignmentColor(todayAssignments[0])+"14":C.textMuted+"14"} 0%,${C.surface} 60%)`,border:`1px solid ${C.border}`,borderRadius:20,padding:20,marginBottom:16}}>
      <p style={{color:C.textMuted,fontSize:10,letterSpacing:2,textTransform:"uppercase",margin:"0 0 6px"}}>
        {new Date().toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"})}
      </p>
      {todayAssignments.length===0?(
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:28}}>😴</span>
          <p style={{color:C.text,fontSize:18,fontWeight:700,margin:0}}>Descanso activo</p>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {todayAssignments.map((a,i)=>{
            const color=getAssignmentColor(a);
            const label=getAssignmentLabel(a);
            const doneSess=a.tabId==="gym"
              ? todaySessions.find(s=>s.planoKey===a.planoKey)
              : todaySessions.find(s=>s.tabId===a.tabId);
            return <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:color+"10",border:`1px solid ${color}33`,borderRadius:12,padding:"10px 14px"}}>
              <p style={{color:C.text,fontSize:15,fontWeight:700,margin:0}}>{label}</p>
              {doneSess?<Tag color={C.green}>✅ Hecho</Tag>:<button onClick={()=>onNavigate(a.tabId)} style={{background:color,color:"#000",border:"none",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:12,fontWeight:700}}>Empezar →</button>}
            </div>;
          })}
        </div>
      )}
      {trainedToday&&todaySessions.length>0&&<div style={{borderTop:`1px solid ${C.border}`,paddingTop:10,marginTop:10}}>
        <p style={{color:C.textMuted,fontSize:10,letterSpacing:2,textTransform:"uppercase",margin:"0 0 6px"}}>Sesiones completadas hoy</p>
        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
          {todaySessions.map((s,i)=><Tag key={i} color={s.color||C.green}>{s.icon} {s.tabName}{s.extra?` ${s.extra}`:""}</Tag>)}
        </div>
      </div>}
    </div>

    {/* ÚLTIMA SESIÓN PREVIEW */}
    {!trainedToday&&todayAssignments.some(a=>a.tabId==="gym")&&(()=>{
      const gymA=todayAssignments.find(a=>a.tabId==="gym");
      if(!gymA?.planoKey) return null;
      const lastDate=getLastSessionDate(gymA.planoKey);
      if(!lastDate) return null;
      const lastData=getLastSessionData(gymA.planoKey);
      const rpe=getRPE(lastDate,gymA.planoKey);
      const nota=(load(K.snota)||{})[`${lastDate}_${gymA.planoKey}`]||null;
      return <Card style={{marginBottom:16}}>
        <button onClick={()=>setShowLastSession(s=>!s)} style={{background:"none",border:"none",color:C.textSub,cursor:"pointer",fontSize:13,padding:0,width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span>📋 Última sesión — {fmt(lastDate)}</span>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            {rpe&&<Tag color={rpe<=5?C.green:rpe<=8?C.orange:C.red}>RPE {rpe}/10</Tag>}
            <span style={{fontSize:12,color:C.textMuted}}>{showLastSession?"▲":"▼"}</span>
          </div>
        </button>
        {showLastSession&&<div style={{marginTop:10,borderTop:`1px solid ${C.border}`,paddingTop:10}}>
          {nota&&<p style={{color:C.textMuted,fontSize:11,fontStyle:"italic",margin:"0 0 8px"}}>"{nota}"</p>}
          {lastData.map((d,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:`1px solid ${C.border}`}}>
              <p style={{color:C.textSub,fontSize:12,margin:0}}>{d.nombre}</p>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                {d.series&&<span style={{color:C.textMuted,fontSize:10}}>{d.series.join("·")}kg</span>}
                <span style={{color:C.text,fontSize:12,fontWeight:600}}>{d.kg}kg</span>
                <span style={{color:gymPlanos[gymA.planoKey]?.color||C.gymColor,fontSize:12,fontWeight:700}}>→ {(d.kg+2.5)}kg</span>
              </div>
            </div>
          ))}
        </div>}
      </Card>;
    })()}

    {/* SEMANA — strip + plan */}
    <Card style={{marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <SectionLabel>Plan de la semana</SectionLabel>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          {streak>1&&<Tag color={C.yellow}>🔥 {streak} semanas</Tag>}
          <Tag color={C.green}>{daysThisWeek} días</Tag>
        </div>
      </div>
      {/* Day strip */}
      <div style={{display:"flex",gap:4,marginBottom:16}}>
        {weekPlan.map((d,i)=>{
          const dayDate=new Date(weekStart);dayDate.setDate(dayDate.getDate()+i);
          const dateStr=`${dayDate.getFullYear()}-${String(dayDate.getMonth()+1).padStart(2,"0")}-${String(dayDate.getDate()).padStart(2,"0")}`;
          // Check actual data for this date
          const daySessions=getTrainedSessions(dateStr);
          const trained=daySessions.length>0;
          const isToday=i===planIdx;
          const planColor=d.assignments?.length>0?getAssignmentColor(d.assignments[0]):C.textMuted;
          const trainedColor=daySessions.length>0?daySessions[0].color:C.textMuted;
          return <div key={i} style={{flex:1,textAlign:"center"}}>
            <p style={{color:isToday?C.text:C.textMuted,fontSize:9,margin:"0 0 4px",fontWeight:isToday?700:400}}>{dayNames[i]}</p>
            <div style={{height:32,borderRadius:7,background:trained?trainedColor+"28":isToday?C.surface:C.bg,border:isToday?`1.5px solid ${planColor}`:trained?`1px solid ${trainedColor}55`:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
              {trained
              ?<div style={{display:"flex",gap:2}}>{daySessions.slice(0,2).map((s,si)=><div key={si} style={{width:5,height:5,borderRadius:"50%",background:s.color}}/>)}</div>
              :isToday?<div style={{width:4,height:4,borderRadius:"50%",background:planColor}}/>
              :null}
            </div>
          </div>;
        })}
      </div>
      {/* Day-by-day plan */}
      {weekPlan.map((d,i)=>{
        const isToday=i===planIdx;
        const assignments=d.assignments||[];
        return <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"9px 0",borderBottom:i<6?`1px solid ${C.border}`:"none"}}>
          <div style={{minWidth:28,textAlign:"center"}}>
            <p style={{color:isToday?C.text:C.textSub,fontSize:11,fontWeight:isToday?700:400,margin:0}}>{dayNames[i]}</p>
            {isToday&&<div style={{width:4,height:4,borderRadius:"50%",background:C.gymColor,margin:"3px auto 0"}}/>}
          </div>
          <div style={{flex:1}}>
            {assignments.length===0?(
              <p style={{color:C.textMuted,fontSize:12,margin:0,fontStyle:"italic"}}>Descanso</p>
            ):(
              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                {assignments.map((a,j)=>{
                  const tab=tabs.find(t=>t.id===a.tabId);
                  const color=tab?.color||C.gymColor;
                  const label=a.tabId==="gym"?`🏋️ Gym ${a.planoKey||""}`:`${tab?.icon||""} ${tab?.name||a.tabId}`;
                  return <button key={j} onClick={()=>onNavigate(a.tabId)} style={{background:color+"18",border:`1px solid ${color}44`,borderRadius:8,color,padding:"4px 10px",cursor:"pointer",fontSize:12,fontWeight:600}}>
                    {label} →
                  </button>;
                })}
              </div>
            )}
          </div>
        </div>;
      })}
    </Card>

    {/* DELOAD */}
    {showDeload&&(
      <div style={{background:C.orange+"18",border:`1px solid ${C.orange}44`,borderRadius:12,padding:"12px 16px",marginBottom:14,display:"flex",gap:10,alignItems:"flex-start"}}>
        <span style={{fontSize:20}}>⚠️</span>
        <div>
          <p style={{color:C.orange,fontSize:13,fontWeight:700,margin:"0 0 2px"}}>Semana de deload — {weeksSinceFirst} semanas acumuladas</p>
          <p style={{color:C.textSub,fontSize:12,margin:0}}>Reduce a 2 series por ejercicio y el peso al 60-70%. Mantén la técnica, no llegues al fallo.</p>
        </div>
      </div>
    )}
    {showFatigueWarning&&(
      <div style={{background:C.red+"14",border:`1px solid ${C.red}44`,borderRadius:12,padding:"12px 16px",marginBottom:14,display:"flex",gap:10,alignItems:"flex-start"}}>
        <span style={{fontSize:20}}>🔴</span>
        <div>
          <p style={{color:C.red,fontSize:13,fontWeight:700,margin:"0 0 2px"}}>Fatiga acumulada detectada</p>
          <p style={{color:C.textSub,fontSize:12,margin:0}}>RPE medio últimas sesiones: {avgRecentRPE.toFixed(1)}/10. Considera una sesión más ligera o un día de descanso extra.</p>
        </div>
      </div>
    )}

    {/* ALERTAS */}
    {recentPRs.length>0&&<div style={{background:C.yellow+"18",border:`1px solid ${C.yellow}55`,borderRadius:12,padding:"12px 16px",marginBottom:14}}>
      <p style={{color:C.yellow,fontSize:13,fontWeight:700,margin:"0 0 6px"}}>🏆 Récords hoy</p>
      {recentPRs.map(ej=><p key={ej.id} style={{color:C.textSub,fontSize:12,margin:"0 0 2px"}}>✓ {ej.nombre}</p>)}
    </div>}
    {(stalledEjs.length>0||cfStalledEjs.length>0)&&<Card accent={C.red} style={{marginBottom:14}}>
      <p style={{color:C.red,fontSize:12,fontWeight:700,margin:"0 0 8px"}}>⚡ Sin progreso en 3 sesiones</p>
      {stalledEjs.map(ej=>{
        const last3=(cargas[ej.id]||[]).slice(-3);
        return <div key={ej.id} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${C.border}`}}>
          <div><p style={{color:C.textSub,fontSize:12,margin:0}}>{ej.nombre}</p><p style={{color:C.textMuted,fontSize:10,margin:0}}>Gym</p></div>
          <p style={{color:C.red,fontSize:12,margin:0}}>{last3.map(h=>h.kg+"kg").join(" · ")}</p>
        </div>;
      })}
      {cfStalledEjs.map(ej=>(
        <div key={ej.id} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${C.border}`}}>
          <div><p style={{color:C.textSub,fontSize:12,margin:0}}>{ej.icon} {ej.nombre}</p><p style={{color:C.textMuted,fontSize:10,margin:0}}>{ej.tabName}</p></div>
          <p style={{color:C.red,fontSize:12,margin:0}}>Sin mejora</p>
        </div>
      ))}
      <p style={{color:C.textMuted,fontSize:11,margin:"8px 0 0",fontStyle:"italic"}}>Considera cambiar estímulo: baja el peso y sube las reps, o prueba una variación.</p>
    </Card>}

    {/* OBJETIVOS */}
    <Card style={{marginBottom:16}}>
      <SectionLabel>Objetivos</SectionLabel>
      {objectives.map(obj=>{
        const curr=parseFloat(obj.current),tgt=parseFloat(obj.target);
        // For ranges like "70-75", use midpoint
        const tgtNum=obj.target.includes("-")?
          (parseFloat(obj.target.split("-")[0])+parseFloat(obj.target.split("-")[1]))/2:tgt;
        // Use first medida as baseline for more accurate progress bar
        const medidas=load(K.medidas)||[];
        const baseline=obj.name.toLowerCase().includes("peso")&&medidas.length>1?
          parseFloat(medidas[medidas.length-1][Object.keys(medidas[0]).find(k=>k==="peso")])||0:0;
        const range=tgtNum-(baseline||0);
        const pct=tgtNum&&curr?Math.min(100,Math.max(0,range>0?((curr-(baseline||0))/range)*100:(curr/tgtNum)*100)):0;
        const remaining=tgtNum&&curr?(tgtNum-curr).toFixed(1):null;
        const objColor=pct>=100?C.green:pct>70?C.blue:C.gymColor;
        return <div key={obj.id} style={{marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:4}}>
            <p style={{color:C.textSub,fontSize:13,margin:0}}>{obj.name}</p>
            <div style={{textAlign:"right"}}>
              <p style={{color:objColor,fontSize:13,fontWeight:700,margin:0}}>
                {obj.current}{obj.unit} → {obj.target}{obj.unit}
              </p>
              {remaining!==null&&parseFloat(remaining)>0&&
                <p style={{color:C.textMuted,fontSize:10,margin:0}}>Faltan {remaining}{obj.unit}</p>}
            </div>
          </div>
          {tgtNum&&curr&&<ProgressBar pct={pct} color={objColor} height={6}/>}
        </div>;
      })}
      {/* Weight evolution mini-chart */}
      {(()=>{
        const medidas=load(K.medidas)||[];
        const weightData=medidas.filter(m=>m.peso).map(m=>({val:parseFloat(m.peso),fecha:m.fecha})).reverse();
        if(weightData.length<2) return null;
        return <div style={{marginTop:12,borderTop:`1px solid ${C.border}`,paddingTop:12}}>
          <p style={{color:C.textMuted,fontSize:10,letterSpacing:2,textTransform:"uppercase",margin:"0 0 8px"}}>Evolución del peso</p>
          <BarChart data={weightData} color={C.gymColor} unit="kg"/>
        </div>;
      })()}
    </Card>
  </div>;
}

// ── SCREEN PLAN ───────────────────────────────────────────────────────────────
function ScreenPlan(){
  const [planTab,setPlanTab]=useState("semana");
  const [planVer,setPlanVer]=useState(0); // bump to force re-read
  const tabs=loadTabs();           // always fresh
  const [weekPlan,setWeekPlan]=useState(()=>loadWeek());
  const [objectives,setObjectives]=useState(()=>loadObjectives());
  const [libre,setLibre]=useState(()=>loadLibre());
  const planos=loadGymPlanos();    // always fresh

  const dayNames=["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];

  function saveWeek(upd){setWeekPlan(upd);save(K.planWeek,upd);}
  function saveObjectives(upd){setObjectives(upd);save(K.objectives,upd);}
  function saveLibre(upd){setLibre(upd);save(K.libre,upd);}
  function savePlanos(upd){save(K.gymPlanos,upd);setPlanVer(v=>v+1);}

  return <div>
    <div style={{display:"flex",gap:6,marginBottom:18,overflowX:"auto"}}>
      {[["semana","Semana"],["gym","Gym"],["libre","Libre"],["medidas","Medidas"]].map(([id,label])=>(
        <button key={id} onClick={()=>setPlanTab(id)} style={{flex:"0 0 auto",background:planTab===id?C.planColor:C.card,color:planTab===id?"#000":C.textSub,border:`1.5px solid ${planTab===id?C.planColor:C.border}`,borderRadius:10,padding:"9px 16px",fontSize:12,fontWeight:planTab===id?700:400,cursor:"pointer",transition:"all 0.15s"}}>{label}</button>
      ))}
    </div>

    {/* SEMANA */}
    {planTab==="semana"&&<div>
      <SectionLabel>Planificación semanal</SectionLabel>
      {weekPlan.map((dayPlan,i)=>{
        const assignments=dayPlan.assignments||[];
        return <Card key={i} style={{marginBottom:10}}>
          <p style={{color:C.text,fontSize:14,fontWeight:700,margin:"0 0 8px"}}>{dayNames[i]}</p>
          {assignments.length===0&&<p style={{color:C.textMuted,fontSize:12,margin:"0 0 8px",fontStyle:"italic"}}>Descanso</p>}
          {assignments.map((a,j)=>{
            const tab=tabs.find(t=>t.id===a.tabId);
            const color=tab?.color||C.gymColor;
            return <div key={j} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <Tag color={color}>{tab?`${tab.icon} ${tab.name}`:a.tabId}{a.planoKey?` ${a.planoKey}`:""}</Tag>
              <button onClick={()=>{
                const upd=[...weekPlan];upd[i]={...upd[i],assignments:upd[i].assignments.filter((_,idx)=>idx!==j)};saveWeek(upd);
              }} style={{background:"none",border:"none",color:C.red,cursor:"pointer",fontSize:12}}>✕</button>
            </div>;
          })}
          {/* Add assignment */}
          <AddDayAssignment tabs={tabs} onAdd={assignment=>{
            const upd=[...weekPlan];upd[i]={...upd[i],assignments:[...(upd[i].assignments||[]),assignment]};saveWeek(upd);
          }}/>
        </Card>;
      })}

      {/* Objectives editor */}
      <div style={{marginTop:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <SectionLabel>Objetivos</SectionLabel>
          <Btn onClick={()=>saveObjectives([...objectives,{id:"o"+Date.now(),name:"Nuevo objetivo",current:"",target:"",unit:""}])} color={C.planColor} style={{padding:"5px 12px",fontSize:11}}>+ Añadir</Btn>
        </div>
        {objectives.map((obj,i)=>(
          <Card key={obj.id} style={{marginBottom:8}}>
            <div style={{display:"flex",gap:6,marginBottom:6}}>
              <Input type="text" value={obj.name} onChange={e=>{const upd=[...objectives];upd[i]={...upd[i],name:e.target.value};saveObjectives(upd);}} placeholder="Nombre objetivo" style={{flex:2,fontSize:12}}/>
              <button onClick={()=>saveObjectives(objectives.filter(o=>o.id!==obj.id))} style={{background:"none",border:"none",color:C.red,cursor:"pointer",fontSize:14}}>🗑</button>
            </div>
            <div style={{display:"flex",gap:6}}>
              <div style={{flex:1}}><p style={{color:C.textMuted,fontSize:10,margin:"0 0 3px"}}>Actual</p><Input value={obj.current} onChange={e=>{const upd=[...objectives];upd[i]={...upd[i],current:e.target.value};saveObjectives(upd);}} placeholder="Ej: 65.7" style={{fontSize:12}}/></div>
              <div style={{flex:1}}><p style={{color:C.textMuted,fontSize:10,margin:"0 0 3px"}}>Objetivo</p><Input type="text" value={obj.target} onChange={e=>{const upd=[...objectives];upd[i]={...upd[i],target:e.target.value};saveObjectives(upd);}} placeholder="Ej: 70-75" style={{fontSize:12}}/></div>
              <div style={{flex:"0 0 60px"}}><p style={{color:C.textMuted,fontSize:10,margin:"0 0 3px"}}>Unidad</p><Input type="text" value={obj.unit} onChange={e=>{const upd=[...objectives];upd[i]={...upd[i],unit:e.target.value};saveObjectives(upd);}} placeholder="kg" style={{fontSize:12}}/></div>
            </div>
          </Card>
        ))}
      </div>
    </div>}

    {/* GYM */}
    {planTab==="gym"&&<div>
      <SectionLabel>Planos de gimnasio</SectionLabel>
      {Object.entries(planos).map(([key,plano])=>(
        <Card key={key} accent={plano.color} style={{marginBottom:14}}>
          <p style={{color:plano.color,fontSize:15,fontWeight:700,margin:"0 0 2px"}}>Plano {key} — {plano.nombre}</p>
          <p style={{color:C.textMuted,fontSize:11,margin:"0 0 10px"}}>{plano.ejercicios.length} ejercicios</p>
          {plano.ejercicios.map((ej,idx)=>(
            <div key={ej.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:`1px solid ${C.border}`}}>
              <div style={{display:"flex",gap:4}}>
                <button onClick={()=>{if(idx===0)return;const arr=[...plano.ejercicios];[arr[idx],arr[idx-1]]=[arr[idx-1],arr[idx]];savePlanos({...planos,[key]:{...plano,ejercicios:arr}});}} style={{background:"none",border:"none",color:idx===0?C.textMuted:C.textSub,cursor:"pointer",fontSize:12}}>↑</button>
                <button onClick={()=>{if(idx===plano.ejercicios.length-1)return;const arr=[...plano.ejercicios];[arr[idx],arr[idx+1]]=[arr[idx+1],arr[idx]];savePlanos({...planos,[key]:{...plano,ejercicios:arr}});}} style={{background:"none",border:"none",color:idx===plano.ejercicios.length-1?C.textMuted:C.textSub,cursor:"pointer",fontSize:12}}>↓</button>
              </div>
              <Input type="text" value={ej.nombre} onChange={e=>{const arr=[...plano.ejercicios];arr[idx]={...arr[idx],nombre:e.target.value};savePlanos({...planos,[key]:{...plano,ejercicios:arr}});}} style={{flex:1,fontSize:12,padding:"6px 10px"}}/>
              <Input type="number" value={ej.series} onChange={e=>{const arr=[...plano.ejercicios];arr[idx]={...arr[idx],series:parseInt(e.target.value)||3};savePlanos({...planos,[key]:{...plano,ejercicios:arr}});}} style={{width:44,fontSize:12,padding:"6px 8px",textAlign:"center"}}/>
              <button onClick={()=>{const arr=plano.ejercicios.filter((_,i)=>i!==idx);savePlanos({...planos,[key]:{...plano,ejercicios:arr}});}} style={{background:"none",border:"none",color:C.red,cursor:"pointer",fontSize:13}}>🗑</button>
            </div>
          ))}
          <button onClick={()=>{const id=key.toLowerCase()+"_"+Date.now();savePlanos({...planos,[key]:{...plano,ejercicios:[...plano.ejercicios,{id,nombre:"Nuevo ejercicio",grupo:"",series:3,reps:"8-10",descanso:60}]}});}} style={{background:"none",border:`1px dashed ${plano.color}44`,borderRadius:8,color:plano.color,width:"100%",padding:"8px",cursor:"pointer",fontSize:12,marginTop:8}}>+ Añadir ejercicio</button>
        </Card>
      ))}
    </div>}

    {/* LIBRE */}
    {planTab==="libre"&&<div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <SectionLabel>Actividades libres</SectionLabel>
        <Btn onClick={()=>saveLibre([...libre,{id:"l"+Date.now(),icon:"⭐",name:"Nueva actividad",detail:"",dia:"Libre"}])} color={C.planColor} style={{padding:"5px 12px",fontSize:11}}>+ Añadir</Btn>
      </div>
      {libre.map((act,i)=>(
        <Card key={act.id} style={{marginBottom:10}}>
          <div style={{display:"flex",gap:8,marginBottom:6}}>
            <Input type="text" value={act.icon} onChange={e=>{const upd=[...libre];upd[i]={...upd[i],icon:e.target.value};saveLibre(upd);}} style={{width:50,textAlign:"center",fontSize:18,padding:"6px 8px"}}/>
            <Input type="text" value={act.name} onChange={e=>{const upd=[...libre];upd[i]={...upd[i],name:e.target.value};saveLibre(upd);}} placeholder="Nombre" style={{flex:1,fontSize:13}}/>
            <Input type="text" value={act.dia} onChange={e=>{const upd=[...libre];upd[i]={...upd[i],dia:e.target.value};saveLibre(upd);}} placeholder="Día" style={{width:80,fontSize:12}}/>
            <button onClick={()=>saveLibre(libre.filter(l=>l.id!==act.id))} style={{background:"none",border:"none",color:C.red,cursor:"pointer",fontSize:14}}>🗑</button>
          </div>
          <Input type="text" value={act.detail} onChange={e=>{const upd=[...libre];upd[i]={...upd[i],detail:e.target.value};saveLibre(upd);}} placeholder="Descripción..." style={{fontSize:12}}/>
        </Card>
      ))}
    </div>}

    {/* MEDIDAS */}
    {planTab==="medidas"&&<MedidasPanel/>}
  </div>;
}

// Helper for adding day assignment
function AddDayAssignment({tabs,onAdd}){
  const [open,setOpen]=useState(false);
  const [selTab,setSelTab]=useState(tabs[0]?.id||"");
  const [selPlano,setSelPlano]=useState("A");
  if(!open) return <button onClick={()=>setOpen(true)} style={{background:"none",border:`1px dashed ${C.borderLight}`,borderRadius:8,color:C.textMuted,padding:"6px 12px",cursor:"pointer",fontSize:11}}>+ Añadir entrenamiento</button>;
  const tab=tabs.find(t=>t.id===selTab);
  return <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:4}}>
    <select value={selTab} onChange={e=>setSelTab(e.target.value)} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,padding:"6px 10px",fontSize:12,flex:1}}>
      {tabs.map(t=><option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
    </select>
    {selTab==="gym"&&<select value={selPlano} onChange={e=>setSelPlano(e.target.value)} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,padding:"6px 10px",fontSize:12,width:60}}>
      {["A","B","C"].map(k=><option key={k} value={k}>Plano {k}</option>)}
    </select>}
    <Btn onClick={()=>{onAdd({tabId:selTab,planoKey:selTab==="gym"?selPlano:null});setOpen(false);}} color={C.planColor} style={{padding:"6px 12px",fontSize:12}}>✓</Btn>
    <button onClick={()=>setOpen(false)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,color:C.textMuted,padding:"6px 10px",cursor:"pointer",fontSize:12}}>✕</button>
  </div>;
}

// ── SCREEN CALENDARIO ─────────────────────────────────────────────────────────
function ScreenCalendario(){
  const [mesOffset,setMesOffset]=useState(0);

  const now=new Date();now.setMonth(now.getMonth()+mesOffset);
  const year=now.getFullYear(),month=now.getMonth();
  const mesNombre=now.toLocaleDateString("es-ES",{month:"long",year:"numeric"});
  const primerDia=new Date(year,month,1).getDay();
  const diasEnMes=new Date(year,month+1,0).getDate();
  const offset=primerDia===0?6:primerDia-1;

  // Derive trained data from actual records — always in sync with deletions
  function getDaySessions(day){
    const dateStr=`${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    return getTrainedSessions(dateStr);
  }

  const diasEntrenados=Array.from({length:diasEnMes},(_,i)=>i+1).filter(d=>getDaySessions(d).length>0).length;
  const calTabs=loadTabs();

  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <button onClick={()=>setMesOffset(o=>o-1)} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,color:C.text,padding:"8px 16px",cursor:"pointer",fontSize:16}}>‹</button>
      <p style={{color:C.text,fontSize:15,fontWeight:700,margin:0,textTransform:"capitalize"}}>{mesNombre}</p>
      <button onClick={()=>setMesOffset(o=>o+1)} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,color:C.text,padding:"8px 16px",cursor:"pointer",fontSize:16}}>›</button>
    </div>
    <div style={{display:"flex",gap:10,marginBottom:16}}>
      <Card style={{flex:1,textAlign:"center",padding:14}}>
        <p style={{color:C.textMuted,fontSize:10,margin:"0 0 4px",textTransform:"uppercase",letterSpacing:1}}>Entrenados</p>
        <p style={{color:C.gymColor,fontSize:26,fontWeight:800,margin:0}}>{diasEntrenados}</p>
      </Card>
      <Card style={{flex:1,textAlign:"center",padding:14}}>
        <p style={{color:C.textMuted,fontSize:10,margin:"0 0 4px",textTransform:"uppercase",letterSpacing:1}}>Descansos</p>
        <p style={{color:C.orange,fontSize:26,fontWeight:800,margin:0}}>{diasEnMes-diasEntrenados}</p>
      </Card>
    </div>
    <Card>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:8}}>
        {["L","M","X","J","V","S","D"].map(d=><p key={d} style={{color:C.textMuted,fontSize:10,textAlign:"center",margin:0,fontWeight:700}}>{d}</p>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
        {Array.from({length:offset}).map((_,i)=><div key={"e"+i}/>)}
        {Array.from({length:diasEnMes},(_,i)=>i+1).map(day=>{
          const sessions=getDaySessions(day);
          const dateStr=`${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
          const trained=sessions.length>0;
          const isToday=dateStr===today();
          const mainColor=trained?sessions[0].color:C.textMuted;
          return <div key={day} style={{background:trained?mainColor+"20":C.surface,border:isToday?`2px solid ${mainColor}`:trained?`1px solid ${mainColor}44`:`1px solid ${C.border}`,borderRadius:8,minHeight:44,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,transition:"all 0.2s"}}>
            <p style={{color:isToday?mainColor:trained?C.text:C.textMuted,fontSize:11,fontWeight:isToday||trained?700:400,margin:0}}>{day}</p>
            {trained&&<div style={{display:"flex",gap:3,justifyContent:"center"}}>
              {sessions.slice(0,3).map((s,i)=>(
                <div key={i} style={{width:5,height:5,borderRadius:"50%",background:s.color}}/>
              ))}
            </div>}
          </div>;
        })}
      </div>
    </Card>
    {/* Legend */}
    <div style={{display:"flex",gap:10,marginTop:14,flexWrap:"wrap"}}>
      {Object.entries(loadGymPlanos()).map(([key,plano])=>(
        <div key={key} style={{display:"flex",alignItems:"center",gap:5}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:plano.color}}/>
          <p style={{color:C.textMuted,fontSize:11,margin:0}}>Gym {key}</p>
        </div>
      ))}
      {calTabs.filter(t=>t.type==="cf").map(t=>(
        <div key={t.id} style={{display:"flex",alignItems:"center",gap:5}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:t.color}}/>
          <p style={{color:C.textMuted,fontSize:11,margin:0}}>{t.name}</p>
        </div>
      ))}
      <div style={{display:"flex",alignItems:"center",gap:5}}>
        <div style={{width:8,height:8,borderRadius:2,border:`2px solid ${C.text}`,background:"transparent"}}/>
        <p style={{color:C.textMuted,fontSize:11,margin:0}}>Hoy</p>
      </div>
    </div>
  </div>;
}

// ── BACKUP PANEL ──────────────────────────────────────────────────────────────
function BackupPanel({onClose,setImportMsg}){
  const [showJson,setShowJson]=useState(false);
  const [jsonText,setJsonText]=useState("");
  const [copied,setCopied]=useState(false);
  function handleExport(){setJsonText(exportData());setShowJson(true);}
  function handleCopy(){
    navigator.clipboard?.writeText(jsonText).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);})
    .catch(()=>{const el=document.getElementById("bkp-json");if(el){el.select();document.execCommand("copy");}setCopied(true);setTimeout(()=>setCopied(false),2000);});
  }
  return <div style={{maxWidth:500,margin:"10px auto 0",padding:"14px",background:C.card,borderRadius:14,border:`1px solid ${C.border}`}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
      <p style={{color:C.textSub,fontSize:11,margin:0,fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>Backup</p>
      <button onClick={onClose} style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:16}}>✕</button>
    </div>
    {!showJson?<>
      <div style={{display:"flex",gap:8,marginBottom:8}}>
        <button onClick={handleExport} style={{flex:1,background:C.gymColor,color:"#000",border:"none",borderRadius:10,padding:"11px",fontSize:12,fontWeight:700,cursor:"pointer"}}>📋 Ver JSON</button>
        <label style={{flex:1,background:C.surface,color:C.text,border:`1px solid ${C.borderLight}`,borderRadius:10,padding:"11px",fontSize:12,fontWeight:700,cursor:"pointer",textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center"}}>
          ⬆️ Importar<input type="file" accept=".json" style={{display:"none"}} onChange={e=>{if(!e.target.files[0])return;importData(e.target.files[0],ok=>{setImportMsg(ok?"✓ Datos importados":"✗ Error");onClose();setTimeout(()=>setImportMsg(null),3000);});}}/>
        </label>
      </div>
      <p style={{color:C.textMuted,fontSize:10,margin:0}}>⚠️ Los datos no persisten entre sesiones del artifact. Copia el JSON y guárdalo.</p>
    </>:<>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
        <p style={{color:C.textSub,fontSize:12,margin:0}}>Copia este JSON:</p>
        <button onClick={handleCopy} style={{background:copied?C.gymColor:C.surface,color:copied?"#000":C.text,border:`1px solid ${C.border}`,borderRadius:8,padding:"5px 12px",fontSize:11,fontWeight:700,cursor:"pointer"}}>{copied?"✓ Copiado":"Copiar"}</button>
      </div>
      <textarea id="bkp-json" readOnly value={jsonText} style={{width:"100%",height:140,background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.textSub,fontSize:10,padding:10,boxSizing:"border-box",resize:"none",fontFamily:"monospace"}}/>
      <button onClick={()=>setShowJson(false)} style={{background:"none",border:"none",color:C.textMuted,fontSize:12,cursor:"pointer",padding:"6px 0 0"}}>← Volver</button>
    </>}
  </div>;
}

// ── APP ───────────────────────────────────────────────────────────────────────
function AppInner(){
  const [screen,setScreen]=useState("hoy");
  const [entrenTab,setEntrenTab]=useState("gym");
  const [isDark,setIsDark]=useState(true);
  const [showBackup,setShowBackup]=useState(false);
  const [importMsg,setImportMsg]=useState(null);

  C=isDark?DARK:LIGHT;

  const nav=[
    {id:"hoy",label:"Hoy",icon:"⚡"},
    {id:"entreno",label:"Entreno",icon:"🏋️"},
    {id:"plan",label:"Plan",icon:"📋"},
    {id:"calendario",label:"Cal.",icon:"📅"},
  ];
  const hour=new Date().getHours();
  const greeting=hour<12?"Buenos días":hour<19?"Buenas tardes":"Buenas noches";
  const titles={hoy:`${greeting}, Alvaro`,entreno:"Entreno",plan:"Mi Plan",calendario:"Calendario"};
  const msgBg=importMsg?.startsWith("✓")?(isDark?"#001a0f":"#e6fff5"):(isDark?"#1a000a":"#fff0f3");

  return <div style={{fontFamily:"-apple-system,'SF Pro Display',sans-serif",background:C.bg,minHeight:"100vh",color:C.text,paddingBottom:75,transition:"background 0.3s,color 0.3s"}}>
    {/* Header */}
    <div style={{background:C.bg+"ee",backdropFilter:"blur(10px)",borderBottom:`1px solid ${C.border}`,padding:"14px 20px 12px",position:"sticky",top:0,zIndex:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",maxWidth:500,margin:"0 auto"}}>
        <div>
          <p style={{color:C.gymColor,fontSize:9,letterSpacing:3,textTransform:"uppercase",margin:"0 0 1px",fontWeight:700}}>Alvaro · 2026</p>
          <h1 style={{fontSize:18,fontWeight:800,margin:0,letterSpacing:-0.5,color:C.text}}>{titles[screen]}</h1>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button onClick={()=>setIsDark(d=>!d)} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:"5px 6px",cursor:"pointer",display:"flex",alignItems:"center",gap:0,width:52,justifyContent:"space-between"}}>
            <span style={{fontSize:14}}>🌙</span>
            <div style={{width:18,height:18,borderRadius:"50%",background:C.gymColor,transition:"transform 0.2s",flexShrink:0}}/>
            <span style={{fontSize:14}}>☀️</span>
          </button>
          <button onClick={()=>setShowBackup(b=>!b)} style={{background:showBackup?C.card:"transparent",border:`1px solid ${showBackup?C.border:"transparent"}`,borderRadius:8,color:showBackup?C.text:C.textMuted,padding:"6px 10px",cursor:"pointer",fontSize:16}}>⚙️</button>
        </div>
      </div>
      {showBackup&&<BackupPanel onClose={()=>setShowBackup(false)} setImportMsg={setImportMsg}/>}
      {importMsg&&<div style={{maxWidth:500,margin:"8px auto 0",padding:"8px 12px",background:msgBg,borderRadius:8,border:`1px solid ${importMsg.startsWith("✓")?C.green+44:C.red+"44"}`}}>
        <p style={{color:importMsg.startsWith("✓")?C.green:C.red,fontSize:12,margin:0,fontWeight:700}}>{importMsg}</p>
      </div>}
    </div>

    {/* Content */}
    <div style={{padding:"16px 20px 0",maxWidth:500,margin:"0 auto"}}>
      {screen==="hoy"&&<ScreenHoy onNavigate={tab=>{setEntrenTab(tab);setScreen("entreno");}}/>}
      {screen==="entreno"&&<ScreenEntreno initTab={entrenTab}/>}
      {screen==="plan"&&<ScreenPlan/>}
      {screen==="calendario"&&<ScreenCalendario/>}
    </div>

    {/* Nav */}
    <div style={{position:"fixed",bottom:0,left:0,right:0,background:C.surface+"f2",backdropFilter:"blur(14px)",borderTop:`1px solid ${C.border}`,display:"flex",padding:"8px 0 14px"}}>
      {nav.map(t=>{
        const isActive=screen===t.id;
        return <button key={t.id} onClick={()=>setScreen(t.id)} style={{flex:1,background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"4px 0"}}>
          <span style={{fontSize:20}}>{t.icon}</span>
          <span style={{fontSize:9,color:isActive?C.gymColor:C.textMuted,fontWeight:isActive?700:400,letterSpacing:0.5}}>{t.label}</span>
          {isActive&&<div style={{width:20,height:3,borderRadius:3,background:C.gymColor,marginTop:1}}/>}
        </button>;
      })}
    </div>
  </div>;
}

export default function App(){ return <ErrorBoundary><AppInner/></ErrorBoundary>; }
