import React, { useState, useEffect, useRef, useCallback, useMemo, Component } from "react";

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
  bg:"#0b0b13",surface:"#13131e",card:"#1a1a28",border:"#252538",borderLight:"#32324a",
  text:"#eeeef8",textSub:"#9292b2",textMuted:"#6b6b84",
  green:"#00c896",purple:"#8b5cf6",orange:"#f97316",red:"#f43f5e",blue:"#38bdf8",yellow:"#fbbf24",
  gymColor:"#00c896",cfColor:"#8b5cf6",calColor:"#38bdf8",planColor:"#f97316",
  shadow:"0 2px 12px rgba(0,0,0,0.45)",shadowSm:"0 1px 4px rgba(0,0,0,0.3)",
};
const LIGHT = {
  bg:"#f0f0eb",surface:"#e3e3dd",card:"#ffffff",border:"#d2d2cc",borderLight:"#bebeb8",
  text:"#18181f",textSub:"#44445a",textMuted:"#7a7a8e",
  green:"#007a5a",purple:"#5b21b6",orange:"#d95f00",red:"#c41a3a",blue:"#0275b8",yellow:"#b45309",
  gymColor:"#007a5a",cfColor:"#5b21b6",calColor:"#0275b8",planColor:"#d95f00",
  shadow:"0 1px 6px rgba(0,0,0,0.08),0 3px 16px rgba(0,0,0,0.05)",shadowSm:"0 1px 3px rgba(0,0,0,0.06)",
};
let C = DARK;

// ── KEYS ─────────────────────────────────────────────────────────────────────
const K = {
  tabs:"pg_tabs", cargas:"pg_c", medidas:"pg_m",
  gymPlanos:"pg_gp", planWeek:"pg_pw", objectives:"pg_obj", libre:"pg_lib",
  rpe:"pg_rpe", snota:"pg_snota", customFoods:"pg_cf", supplements:"pg_sup",
  nutProfile:"pg_nup", mealPlan:"pg_mp", shopping:"pg_sh", proteinLog:"pg_pl",
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

// ── NUTRITION SEEDS ──────────────────────────────────────────────────────────
const SHOPPING_SEED = [
  {id:"s1", name:"Alubias",         cat:"legumbres", done:false},
  {id:"s2", name:"Lentejas",        cat:"legumbres", done:false},
  {id:"s3", name:"Garbanzos",       cat:"legumbres", done:false},
  {id:"s4", name:"Pasta",           cat:"carbos",    done:false},
  {id:"s5", name:"Avena",           cat:"carbos",    done:false},
  {id:"s6", name:"Cereales",        cat:"carbos",    done:false},
  {id:"s7", name:"Tortitas",        cat:"carbos",    done:false},
  {id:"s8", name:"Maiz",            cat:"carbos",    done:false},
  {id:"s9", name:"Pan",             cat:"carbos",    done:false},
  {id:"s10",name:"Patata",          cat:"carbos",    done:false},
  {id:"s11",name:"Pollo",           cat:"proteina",  done:false},
  {id:"s12",name:"Atún",            cat:"proteina",  done:false},
  {id:"s13",name:"Atún lata",       cat:"proteina",  done:false},
  {id:"s14",name:"Jamón",           cat:"proteina",  done:false},
  {id:"s15",name:"Chorizo",         cat:"proteina",  done:false},
  {id:"s16",name:"Huevos",          cat:"proteina",  done:false},
  {id:"s17",name:"Queso fresco",    cat:"lacteos",   done:false},
  {id:"s18",name:"Queso parmigiano",cat:"lacteos",   done:false},
  {id:"s19",name:"Yogurt",          cat:"lacteos",   done:false},
  {id:"s20",name:"Leche",           cat:"lacteos",   done:false},
  {id:"s21",name:"Nata",            cat:"lacteos",   done:false},
  {id:"s22",name:"Tomate",          cat:"verduras",  done:false},
  {id:"s23",name:"Tomate triturado",cat:"verduras",  done:false},
  {id:"s24",name:"Champiñón",       cat:"verduras",  done:false},
  {id:"s25",name:"Pimiento",        cat:"verduras",  done:false},
  {id:"s26",name:"Zanahoria",       cat:"verduras",  done:false},
  {id:"s27",name:"Lechuga",         cat:"verduras",  done:false},
  {id:"s28",name:"Aguacate",        cat:"verduras",  done:false},
  {id:"s29",name:"Cebolla",         cat:"verduras",  done:false},
  {id:"s30",name:"Ajos",            cat:"verduras",  done:false},
  {id:"s31",name:"Fruta",           cat:"frutas",    done:false},
  {id:"s32",name:"Humus",           cat:"otros",     done:false},
  {id:"s33",name:"Mantequilla de cacahuete",cat:"otros",done:false},
  {id:"s34",name:"Semillas",        cat:"otros",     done:false},
  {id:"s35",name:"Frutos secos",    cat:"otros",     done:false},
  {id:"s36",name:"Olivas",          cat:"otros",     done:false},
  {id:"s37",name:"Tramussos",       cat:"otros",     done:false},
  {id:"s38",name:"Aceite",          cat:"condimentos",done:false},
  {id:"s39",name:"Sal",             cat:"condimentos",done:false},
  {id:"s40",name:"Pimienta",        cat:"condimentos",done:false},
  {id:"s41",name:"Pimenton",        cat:"condimentos",done:false},
  {id:"s42",name:"Curry",           cat:"condimentos",done:false},
  {id:"s43",name:"Pastillas caldo", cat:"condimentos",done:false},
  {id:"s44",name:"Laurel",          cat:"condimentos",done:false},
  {id:"s45",name:"Guisantes",       cat:"legumbres", done:false},
];

const MEAL_PLAN_SEED = {
  0:{meals:[{t:"Desayuno",desc:""},{t:"Media mañana",desc:""},{t:"Comida",desc:""},{t:"Merienda",desc:""},{t:"Cena",desc:""}]},
  1:{meals:[{t:"Desayuno",desc:""},{t:"Media mañana",desc:""},{t:"Comida",desc:""},{t:"Merienda",desc:""},{t:"Cena",desc:""}]},
  2:{meals:[{t:"Desayuno",desc:""},{t:"Media mañana",desc:""},{t:"Comida",desc:""},{t:"Merienda",desc:""},{t:"Cena",desc:""}]},
  3:{meals:[{t:"Desayuno",desc:""},{t:"Media mañana",desc:""},{t:"Comida",desc:""},{t:"Merienda",desc:""},{t:"Cena",desc:""}]},
  4:{meals:[{t:"Desayuno",desc:""},{t:"Media mañana",desc:""},{t:"Comida",desc:""},{t:"Merienda",desc:""},{t:"Cena",desc:""}]},
  5:{meals:[{t:"Desayuno",desc:""},{t:"Media mañana",desc:""},{t:"Comida",desc:""},{t:"Merienda",desc:""},{t:"Cena",desc:""}]},
  6:{meals:[{t:"Desayuno",desc:""},{t:"Media mañana",desc:""},{t:"Comida",desc:""},{t:"Merienda",desc:""},{t:"Cena",desc:""}]},
};

const NUT_PROFILE_SEED = {altura:175, edad:31, actividad:1.55};

const PROTEIN_FOODS = [
  {name:"Pollo 100g",prot:31},{name:"Huevo",prot:6},{name:"Atún lata",prot:25},
  {name:"Yogurt griego",prot:10},{name:"Queso fresco 100g",prot:11},
  {name:"Jamón 50g",prot:13},{name:"Leche 250ml",prot:8},
  {name:"Lentejas 100g",prot:9},{name:"Garbanzos 100g",prot:8},
  {name:"Mantequilla cacahuete 2 cda",prot:8},{name:"Frutos secos 30g",prot:5},
];

// seed medidas
(function(){if(!load(K.medidas)?.length) save(K.medidas,[
  {fecha:"2025-11-18",peso:65.7,grasa:7.6,masaMagra:57.7,bicepD:33,bicepI:33,torax:99,abdomen:79.5,musloD:46,musloI:46,gemelo:33},
  {fecha:"2025-08-05",peso:61.4,grasa:8.0,masaMagra:53.6,bicepD:30.5,bicepI:30.5,torax:90.5,abdomen:76,musloD:44.5,musloI:44.5,gemelo:32.5},
])})();

function getWeeklyVolume(){
  // Calculate weekly sets per muscle group across all gym planos
  const planos=loadGymPlanos();
  const allEjs=Object.values(planos).flatMap(p=>p.ejercicios);
  const cargas=load(K.cargas)||{};
  const now=new Date();
  const weekStart=new Date(now);weekStart.setDate(now.getDate()-((now.getDay()+6)%7));
  const wsStr=`${weekStart.getFullYear()}-${String(weekStart.getMonth()+1).padStart(2,"0")}-${String(weekStart.getDate()).padStart(2,"0")}`;
  const todStr=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;

  const vol={};
  allEjs.forEach(ej=>{
    const hist=cargas[ej.id]||[];
    const weekHist=hist.filter(h=>h.fecha>=wsStr&&h.fecha<=todStr);
    if(weekHist.length>0){
      const grupo=ej.grupo||"Otros";
      const sets=weekHist.reduce((a,h)=>a+(h.series?.length||ej.series||3),0);
      vol[grupo]=(vol[grupo]||0)+sets;
    }
  });
  return vol;
}
// MEV/MAV guidelines (approximate for hypertrophy)
const MEV={Espalda:10,Bíceps:8,Pecho:10,Hombros:8,Tríceps:6,Cuádriceps:8,Glúteos:8,Femorales:6,Gemelos:6,Core:8,Cadera:4};
const MAV={Espalda:18,Bíceps:14,Pecho:18,Hombros:15,Tríceps:12,Cuádriceps:14,Glúteos:16,Femorales:12,Gemelos:10,Core:16,Cadera:8};

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
  ["pg_sup_done"].forEach(k=>{const d=load(k);if(d)data[k]=d;});
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
function Card({children,style={},onClick,accent,raised=false}){
  const elev=C.shadow?{boxShadow:raised?C.shadow:C.shadowSm}:{};
  return <div onClick={onClick} style={{background:C.card,border:`1px solid ${accent||C.border}`,borderLeft:accent?`3px solid ${accent}`:`1px solid ${C.border}`,borderRadius:18,padding:16,cursor:onClick?"pointer":"default",...elev,...style}}>{children}</div>;
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
function Tag({children,color}){
  // Use higher opacity background for better readability
  return <span style={{background:color+"28",color,fontSize:10,letterSpacing:0.8,textTransform:"uppercase",padding:"3px 9px",borderRadius:20,fontWeight:700,display:"inline-flex",alignItems:"center"}}>{children}</span>;
}
function BackBtn({onClick}){return <button onClick={onClick} style={{background:"none",border:"none",color:C.textSub,cursor:"pointer",fontSize:13,marginBottom:14,padding:0}}>← Volver</button>;}
function SectionLabel({children}){return <p style={{color:C.textSub,fontSize:9.5,letterSpacing:2.5,textTransform:"uppercase",margin:"0 0 10px",fontWeight:700,opacity:0.8}}>{children}</p>;}
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
      <button onClick={()=>setActive(true)} style={{background:color+"28",border:`1px solid ${color}44`,borderRadius:8,color,padding:"5px 10px",cursor:"pointer",fontSize:12,fontWeight:700}}>⏱ Timer</button>
    )}
  </div>;
}

// ── SKILLS SESSION TRACKER ───────────────────────────────────────────────────
function SkillsSessionTracker({color,tab}){
  const [rpe,setRpe]=useState(null);
  const [minutes,setMinutes]=useState("");
  const [saved,setSaved]=useState(false);
  function handleSave(){
    if(!rpe&&!minutes) return;
    const log=load("pg_skills_sessions")||[];
    log.push({tabId:tab.id,fecha:today(),rpe:rpe||null,minutes:parseFloat(minutes)||null});
    save("pg_skills_sessions",log);
    setSaved(true);setTimeout(()=>setSaved(false),2000);
  }
  return <div style={{background:color+"0e",border:`1px solid ${color}22`,borderRadius:12,padding:12,marginBottom:12}}>
    <p style={{color:C.textMuted,fontSize:10,textTransform:"uppercase",letterSpacing:2,margin:"0 0 8px"}}>Registro de sesión</p>
    <div style={{display:"flex",gap:8,marginBottom:8}}>
      <div style={{flex:1}}>
        <p style={{color:C.textMuted,fontSize:10,margin:"0 0 4px"}}>Minutos practicados</p>
        <Input value={minutes} onChange={e=>setMinutes(e.target.value)} placeholder="Ej: 45" style={{fontSize:12}}/>
      </div>
      <div style={{flex:1}}>
        <p style={{color:C.textMuted,fontSize:10,margin:"0 0 4px"}}>RPE</p>
        <div style={{display:"flex",gap:2}}>
          {[1,2,3,4,5,6,7,8,9,10].map(n=>{
            const rc=n<=3?C.green:n<=6?C.blue:n<=8?C.orange:C.red;
            return <button key={n} onClick={()=>setRpe(r=>r===n?null:n)} style={{flex:1,background:rpe===n?rc:C.surface,color:rpe===n?"#000":C.textMuted,border:`1px solid ${rpe===n?rc:C.border}`,borderRadius:4,padding:"5px 2px",cursor:"pointer",fontSize:10,fontWeight:rpe===n?700:400}}>{n}</button>;
          })}
        </div>
      </div>
    </div>
    <Btn onClick={handleSave} color={color} style={{width:"100%",padding:"8px"}}>{saved?"✓ Guardado":"💾 Guardar sesión"}</Btn>
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
  const [wodRPE,setWodRPE]=useState(null);
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
        <div style={{marginTop:8}}>
          <p style={{color:C.textMuted,fontSize:10,margin:"0 0 5px",textTransform:"uppercase",letterSpacing:1}}>RPE del WOD</p>
          <div style={{display:"flex",gap:3}}>
            {[1,2,3,4,5,6,7,8,9,10].map(n=>{
              const rc=n<=3?C.green:n<=6?C.blue:n<=8?C.orange:C.red;
              return <button key={n} onClick={()=>setWodRPE(wr=>wr===n?null:n)} style={{flex:1,background:wodRPE===n?rc:C.surface,color:wodRPE===n?"#000":C.textMuted,border:`1px solid ${wodRPE===n?rc:C.border}`,borderRadius:6,padding:"6px 2px",cursor:"pointer",fontSize:11,fontWeight:wodRPE===n?700:400}}>{n}</button>;
            })}
          </div>
        </div>
        {wodSessionType&&wodSessionResult&&<p style={{color:C.textMuted,fontSize:11,margin:"8px 0 0"}}>Se guardará: <strong style={{color}}>{wodSessionType}: {wodSessionResult}{wodRPE?` · RPE ${wodRPE}/10`:""}</strong></p>}
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
              <button onClick={()=>setRestTimer(60)} style={{background:color+"28",border:`1px solid ${color}44`,borderRadius:10,color,padding:"10px 12px",cursor:"pointer",fontSize:12,fontWeight:700}}>⏱</button>
            </div>
          </>}
        </div>;
      })}
      {tab.id==="wod"&&wodSessionType&&wodSessionResult&&(
        <div style={{marginTop:14,paddingTop:14,borderTop:`1px solid ${C.border}`}}>
          <Btn onClick={()=>{
            const entry={fecha:today(),val:null,nota:`${wodSessionType}: ${wodSessionResult}`,series:null,wod:`${wodSessionType}: ${wodSessionResult}${wodRPE?` · RPE ${wodRPE}/10`:""}`};
            const key="wod_session_"+today()+"_"+Date.now().toString(36);
            saveData({...data,[key]:[...(data[key]||[]),entry].slice(-30)});
            setWodSessionType("");setWodSessionResult("");setWodRPE(null);
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
      {tab.id==="powerlifting"&&<div style={{background:C.orange+"18",border:`1px solid ${C.orange}44`,borderRadius:8,padding:"8px 10px",marginBottom:10,display:"flex",gap:8,alignItems:"center"}}>
        <span style={{fontSize:14}}>⚠️</span>
        <p style={{color:C.orange,fontSize:11,margin:0}}>Calentamiento obligatorio — 5-10min movilidad + series progresivas al 40-60% del peso objetivo.</p>
      </div>}
      {tab.id==="skills"&&<SkillsSessionTracker color={color} tab={tab}/>}
      <p style={{color:C.textSub,fontSize:12,margin:"0 0 4px"}}>Selecciona los ejercicios de hoy:</p>
      <p style={{color:C.textMuted,fontSize:10,margin:"0 0 12px",fontStyle:"italic"}}>Mantén pulsado un ejercicio para eliminarlo</p>
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
function GymPanel({initPlanoKey=null}){
  const planos=loadGymPlanos(); // always fresh from storage
  const [planoSel,setPlanoSel]=useState(()=>initPlanoKey||Object.keys(loadGymPlanos())[0]||"A");
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
      {/* Weekly volume */}
      {(()=>{
        const vol=getWeeklyVolume();
        const grupos=plano.ejercicios.map(e=>e.grupo).filter((g,i,a)=>g&&a.indexOf(g)===i);
        if(!grupos.length) return null;
        return <div style={{marginTop:16,borderTop:`1px solid ${C.border}`,paddingTop:12}}>
          <p style={{color:C.textMuted,fontSize:10,textTransform:"uppercase",letterSpacing:2,margin:"0 0 8px"}}>Volumen semanal acumulado</p>
          {grupos.map(g=>{
            const sets=vol[g]||0;
            const mev=MEV[g]||6;const mav=MAV[g]||14;
            const pct=Math.min(100,Math.round((sets/mav)*100));
            const color=sets<mev?C.orange:sets<=mav?C.green:C.red;
            const label=sets<mev?`${mev-sets} para MEV`:sets<=mav?"✓ Óptimo":"Sobre MAV";
            return <div key={g} style={{marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                <p style={{color:C.textSub,fontSize:11,margin:0}}>{g}</p>
                <p style={{color,fontSize:11,fontWeight:600,margin:0}}>{sets} series · {label}</p>
              </div>
              <ProgressBar pct={pct} color={color} height={4}/>
            </div>;
          })}
        </div>;
      })()}
      <Btn onClick={()=>{setShowSummary(false);setSessionSaved({});setSessionRPE(null);setSessionNota("");}} color={plano.color} style={{width:"100%",marginTop:16}}>Nueva sesión</Btn>
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
function ScreenEntreno({initTab="gym",initPlanoKey=null}){
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
    {tab?.type==="gym"?<GymPanel initPlanoKey={initPlanoKey}/>:<CFPanel key={tab?.id} tab={tab} onDeleteTab={deleteTab}/>}
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
// ── SUEÑO HOY ────────────────────────────────────────────────────────────────
function SuenoHoy(){
  const [sleepData,setSleepData]=useState(()=>(load(K.proteinLog)||{})[today()+"_sleep"]||{rating:0,hours:""});
  function saveSleep(upd){setSleepData(upd);const all=load(K.proteinLog)||{};all[today()+"_sleep"]=upd;save(K.proteinLog,all);}
  const sc=sleepData.rating<=2?C.red:sleepData.rating===3?C.yellow:C.green;
  return <Card style={{marginBottom:14}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
      <p style={{color:C.text,fontSize:14,fontWeight:700,margin:0}}>😴 Sueño</p>
      {sleepData.rating>0
        ?<div style={{display:"flex",gap:8,alignItems:"center"}}>
            <Tag color={sc}>{["😴","💤","😐","😊","🌟"][sleepData.rating-1]} {sleepData.hours?sleepData.hours+"h":["Muy mal","Mal","Regular","Bien","Muy bien"][sleepData.rating-1]}</Tag>
            <button onClick={()=>saveSleep({rating:0,hours:""})} style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:11,padding:0}}>✕</button>
          </div>
        :<p style={{color:C.textMuted,fontSize:11,margin:0}}>¿Cómo has dormido?</p>
      }
    </div>
    <div style={{display:"flex",gap:5,marginBottom:sleepData.rating>0?8:0}}>
      {[1,2,3,4,5].map(n=>{
        const c2=n<=2?C.red:n===3?C.yellow:C.green;
        return <button key={n} onClick={()=>saveSleep({...sleepData,rating:sleepData.rating===n?0:n})} style={{flex:1,background:sleepData.rating===n?c2+"22":C.surface,border:`1.5px solid ${sleepData.rating===n?c2:C.border}`,borderRadius:8,padding:"7px 3px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
          <span style={{fontSize:15}}>{["😴","💤","😐","😊","🌟"][n-1]}</span>
          <p style={{color:sleepData.rating===n?c2:C.textMuted,fontSize:8,margin:0}}>{["Muy mal","Mal","Regular","Bien","Muy bien"][n-1]}</p>
        </button>;
      })}
    </div>
    {sleepData.rating>0&&<div style={{display:"flex",gap:8,alignItems:"center",marginTop:4}}>
      <p style={{color:C.textMuted,fontSize:12,margin:0,flexShrink:0}}>Horas:</p>
      <Input value={sleepData.hours} onChange={e=>saveSleep({...sleepData,hours:e.target.value})} placeholder="7.5" style={{flex:1,fontSize:12,padding:"6px 10px"}}/>
    </div>}
    {sleepData.rating>0&&<div style={{marginTop:8}}>
      <p style={{color:C.textMuted,fontSize:10,margin:"0 0 5px"}}>Recuperación muscular percibida</p>
      <div style={{display:"flex",gap:5}}>
        {[["😩","Cargado"],["😐","Regular"],["😊","Fresco"]].map(([emoji,label],n)=>{
          const cur=sleepData.recovery||null;
          const sc=n===0?C.red:n===1?C.yellow:C.green;
          return <button key={n} onClick={()=>saveSleep({...sleepData,recovery:cur===n?null:n})} style={{flex:1,background:cur===n?sc+"22":C.surface,border:`1.5px solid ${cur===n?sc:C.border}`,borderRadius:8,padding:"6px 4px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
            <span style={{fontSize:14}}>{emoji}</span>
            <p style={{color:cur===n?sc:C.textMuted,fontSize:9,margin:0}}>{label}</p>
          </button>;
        })}
      </div>
    </div>}
    {sleepData.rating>0&&sleepData.rating<=2&&<p style={{color:C.red,fontSize:11,margin:"7px 0 0"}}>⚠️ Sueño deficiente — considera reducir la intensidad hoy.</p>}
    {sleepData.rating>=4&&<p style={{color:C.green,fontSize:11,margin:"7px 0 0"}}>✅ Buen descanso — condiciones óptimas para crecer.</p>}
    {sleepData.rating>0&&(()=>{
      const todayLog=(load(K.proteinLog)||{})[today()]||[];
      const todayProt=todayLog.reduce((a,e)=>a+(e.prot||0),0);
      const pw=load(K.medidas)?.length?parseFloat(load(K.medidas)[0].peso)||65.7:65.7;
      const pt=Math.round(pw*2);
      if(todayProt>=pt*0.8) return <p style={{color:C.textMuted,fontSize:10,margin:"6px 0 0",fontStyle:"italic"}}>💡 Proteína antes de dormir: 30-40g caseína o requesón mejora síntesis nocturna.</p>;
      return null;
    })()}
  </Card>;
}


// ── NUTRICIÓN HOY ─────────────────────────────────────────────────────────────
function NutricionHoy(){
  const nutColor="#f97316";
  const [proteinLog,setProteinLog]=useState(()=>(load(K.proteinLog)||{})[today()]||[]);
  const [hydration,setHydration]=useState(()=>(load(K.proteinLog)||{})[today()+"_h"]||0);
  const [fiberToday,setFiberToday]=useState(()=>(load(K.proteinLog)||{})[today()+"_f"]||0);
  const [supDone,setSupDone]=useState(()=>(load("pg_sup_done")||{})[today()]||{});
  const [customFoods,setCustomFoods]=useState(()=>load(K.customFoods)||[]);
  const [showProteinAdd,setShowProteinAdd]=useState(false);

  function saveProteinLog(upd){setProteinLog(upd);const all=load(K.proteinLog)||{};all[today()]=upd;save(K.proteinLog,all);}
  function saveHydration(val){setHydration(Math.max(0,Math.round(val*10)/10));const all=load(K.proteinLog)||{};all[today()+"_h"]=Math.max(0,Math.round(val*10)/10);save(K.proteinLog,all);}
  function saveFiber(val){setFiberToday(Math.max(0,val));const all=load(K.proteinLog)||{};all[today()+"_f"]=Math.max(0,val);save(K.proteinLog,all);}
  function saveSupDone(upd){setSupDone(upd);const all=load("pg_sup_done")||{};all[today()]=upd;save("pg_sup_done",all);}
  function saveCustomFoods(upd){setCustomFoods(upd);save(K.customFoods,upd);}

  // Memoized — only recalculate when protein log changes
  const {np,pw,gf,sx,kcalObj,pt,ht,isTrainingToday}=useMemo(()=>{
    const np=load(K.nutProfile)||NUT_PROFILE_SEED;
    const meds=load(K.medidas)||[];
    const pw=meds.length?parseFloat(meds[0].peso)||65.7:65.7;
    const gf=meds.length?parseFloat(meds[0].grasa)||10:10;
    const sx=gf<8?500:gf<12?400:gf<16?350:300;
    const bmr=Math.round(10*pw+6.25*np.altura-5*np.edad+5);
    const isTrainingToday=loadWeek()[(new Date().getDay()+6)%7]?.assignments?.length>0;
    // Adaptive calories: +150 kcal carbos on training days
    const kcalObj=Math.round(bmr*np.actividad)+sx+(isTrainingToday?150:0);
    const pt=Math.round(pw*2);
    const ht=Math.round(pw*(isTrainingToday?42:35)/1000*10)/10;
    return {np,pw,gf,sx,kcalObj,pt,ht,isTrainingToday};
  },[]);
  // Always re-read supplements from storage so Plan > Métricas edits sync
  const supplements=load(K.supplements)||[{id:"sup1",name:"Creatina",dose:"5g"},{id:"sup2",name:"Batido de proteínas",dose:"30g"}];
  const ph=proteinLog.reduce((a,e)=>a+(e.prot||0),0);
  const allFoods=[...PROTEIN_FOODS,...customFoods];

  // Helper: tracker row with progress bar, add buttons, reset
  function TrackerRow({icon,label,cur,tgt,unit,color,addButtons,onReset}){
    const pct=Math.min(100,Math.round((parseFloat(cur)/tgt)*100));
    return <div style={{marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
        <p style={{color:C.textSub,fontSize:12,fontWeight:600,margin:0}}>{icon} {label}</p>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <p style={{color:pct>=100?C.green:C.text,fontSize:13,fontWeight:700,margin:0}}>{typeof cur==="number"&&cur%1!==0?cur.toFixed(1):cur}<span style={{color:C.textMuted,fontSize:11,fontWeight:400}}>/{tgt}{unit}</span></p>
          {cur>0&&<button onClick={onReset} style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:11,padding:0,lineHeight:1}}>✕</button>}
        </div>
      </div>
      <ProgressBar pct={pct} color={pct>=100?C.green:color} height={6}/>
      <div style={{display:"flex",gap:5,marginTop:7}}>
        {addButtons}
      </div>
    </div>;
  }

  return <Card style={{marginBottom:14}}>
    {(()=>{
      // Weekly protein consistency
      const allLog=load(K.proteinLog)||{};
      const last7=[...Array(7)].map((_,i)=>{
        const d=new Date();d.setDate(d.getDate()-i);
        const ds=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
        const dayProt=(allLog[ds]||[]).reduce((a,e)=>a+(e.prot||0),0);
        return dayProt>=pt;
      });
      const daysHit=last7.filter(Boolean).length;
      const consistency=Math.round((daysHit/7)*100);
      return <div style={{marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
          <p style={{color:C.text,fontSize:14,fontWeight:700,margin:0}}>🥗 Nutrición</p>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            {isTrainingToday&&<Tag color={C.blue}>🏋️ +150 kcal</Tag>}
            <Tag color={nutColor}>{kcalObj} kcal</Tag>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
          <div style={{display:"flex",gap:3}}>
            {last7.reverse().map((hit,i)=>(
              <div key={i} style={{width:8,height:8,borderRadius:"50%",background:hit?C.green:C.borderLight}}/>
            ))}
          </div>
          <p style={{color:daysHit>=5?C.green:daysHit>=3?C.orange:C.red,fontSize:11,fontWeight:600,margin:0}}>
            {daysHit}/7 días con proteína completa
          </p>
        </div>
      </div>;
    })()}

    {/* Proteína */}
    <TrackerRow
      icon="💪" label="Proteína" cur={ph} tgt={pt} unit="g" color={nutColor}
      onReset={()=>saveProteinLog([])}
      addButtons={<>
        <button onClick={()=>setShowProteinAdd(s=>!s)} style={{flex:1,background:showProteinAdd?nutColor:C.surface,color:showProteinAdd?"#000":C.textSub,border:`1.5px solid ${showProteinAdd?nutColor:C.border}`,borderRadius:8,padding:"7px 6px",cursor:"pointer",fontSize:11,fontWeight:600}}>+ Añadir</button>
      </>}
    />
    {showProteinAdd&&<div style={{background:C.surface,borderRadius:12,padding:12,marginBottom:10,marginTop:-4}}>
      <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:8}}>
        {allFoods.map(f=>(
          <button key={f.name||f.id} onClick={()=>{saveProteinLog([...proteinLog,{name:f.name,prot:f.prot,time:new Date().toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"})}]);setShowProteinAdd(false);}} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"5px 10px",cursor:"pointer",fontSize:10,color:C.textSub}}>
            +{f.prot}g {f.name}
          </button>
        ))}
      </div>
      <CustomProteinAdd onAdd={entry=>{saveProteinLog([...proteinLog,entry]);setShowProteinAdd(false);}} color={nutColor} onSaveFood={food=>saveCustomFoods([...customFoods,food])}/>
      {proteinLog.length>0&&proteinLog.slice().reverse().slice(0,4).map((e,i)=>(
        <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderTop:`1px solid ${C.border}`}}>
          <p style={{color:C.textSub,fontSize:11,margin:0}}>{e.name}</p>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <p style={{color:nutColor,fontSize:11,fontWeight:700,margin:0}}>+{e.prot}g</p>
            <button onClick={()=>{const upd=[...proteinLog];upd.splice(proteinLog.length-1-i,1);saveProteinLog(upd);}} style={{background:"none",border:"none",color:C.red,cursor:"pointer",fontSize:11}}>✕</button>
          </div>
        </div>
      ))}
    </div>}

    {/* Agua */}
    {(()=>{
      const isWOD=loadWeek()[(new Date().getDay()+6)%7]?.assignments?.some(a=>a.tabId==="wod");
      const wtgt=isWOD?Math.round((ht+0.75)*10)/10:ht;
      return <TrackerRow
        icon="💧" label={isWOD?`Agua (WOD +0.75L)`:"Agua"} cur={hydration} tgt={wtgt} unit="L" color={C.blue}
        onReset={()=>saveHydration(0)}
        addButtons={<>
          {[0.25,0.33,0.5,1].map(v=>(
            <button key={v} onClick={()=>saveHydration(hydration+v)} style={{flex:1,background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 2px",cursor:"pointer",fontSize:10,color:C.textSub,fontWeight:600}}>+{v}L</button>
          ))}
        </>}
      />;
    })()}

    {/* Fibra */}
    <TrackerRow
      icon="🌿" label="Fibra" cur={fiberToday} tgt={32} unit="g" color={C.green}
      onReset={()=>saveFiber(0)}
      addButtons={<>
        {[5,10,15,20].map(g=>(
          <button key={g} onClick={()=>saveFiber(fiberToday+g)} style={{flex:1,background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 2px",cursor:"pointer",fontSize:10,color:C.textSub,fontWeight:600}}>+{g}g</button>
        ))}
      </>}
    />

    {/* Recarga / comida libre */}
    {(()=>{
      const reloads=load("pg_reloads")||{};
      const todayReload=reloads[today()]||null;
      return <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderTop:`1px solid ${C.border}`,marginBottom:0}}>
        <button onClick={()=>{
          const upd={...reloads,[today()]:todayReload?"libre":todayReload===null?"recarga":null};
          if(!todayReload&&todayReload!=="recarga") upd[today()]="recarga";
          else if(todayReload==="recarga") upd[today()]="libre";
          else upd[today()]=null;
          save("pg_reloads",upd);
        }} style={{background:todayReload?C.yellow+"22":C.surface,border:`1.5px solid ${todayReload?C.yellow:C.border}`,borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:11,color:todayReload?C.yellow:C.textMuted,fontWeight:todayReload?700:400}}>
          {todayReload==="recarga"?"🔄 Recarga":todayReload==="libre"?"🍕 Comida libre":"+ Marcar recarga/libre"}
        </button>
        {todayReload&&<p style={{color:C.textMuted,fontSize:10,margin:0}}>
          {todayReload==="recarga"?"Carbos altos (+200-300g). Bueno para leptina y rendimiento.":"Comida libre registrada. Vuelve al plan mañana."}
        </p>}
      </div>;
    })()}

    {/* Suplementos */}
    <div style={{borderTop:`1px solid ${C.border}`,paddingTop:12,marginTop:8}}>
      <p style={{color:C.textSub,fontSize:11,fontWeight:600,margin:"0 0 8px"}}>💊 Suplementos</p>
      {supplements.map(sup=>(
        <div key={sup.id} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0",borderBottom:`1px solid ${C.border}`}}>
          <button onClick={()=>{
            const nowDone=!supDone[sup.id];
            saveSupDone({...supDone,[sup.id]:nowDone});
            const protMatch=sup.dose&&sup.dose.match(/(\d+)\s*g/i);
            const protG=protMatch?parseInt(protMatch[1]):0;
            const isProtSup=protG>0&&(sup.name.toLowerCase().includes("proteí")||sup.name.toLowerCase().includes("whey")||sup.name.toLowerCase().includes("batido"));
            if(isProtSup){
              if(nowDone) saveProteinLog([...proteinLog,{name:sup.name,prot:protG,time:new Date().toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"}),supId:sup.id}]);
              else saveProteinLog(proteinLog.filter(e=>e.supId!==sup.id));
            }
          }} style={{width:22,height:22,borderRadius:6,flexShrink:0,background:supDone[sup.id]?C.green:C.surface,border:`2px solid ${supDone[sup.id]?C.green:C.borderLight}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#000",fontSize:13,fontWeight:700}}>
            {supDone[sup.id]?"✓":""}
          </button>
          <p style={{color:supDone[sup.id]?C.textMuted:C.text,fontSize:13,margin:0,flex:1,textDecoration:supDone[sup.id]?"line-through":"none"}}>{sup.name}</p>
          <p style={{color:C.textMuted,fontSize:11,margin:0}}>{sup.dose}</p>
        </div>
      ))}
    </div>
  </Card>;
}


function ScreenHoy({onNavigate,onGoToNutricion}){
  const [showLastSession,setShowLastSession]=useState(false);
  const [showWeekPlan,setShowWeekPlan]=useState(false);
  const [showObjetivos,setShowObjetivos]=useState(false);
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

  // Racha: memoized
  const streak=useMemo(()=>{
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
  },[todayDate]);

  // Load once, reuse everywhere in this render
  const gymPlanos=loadGymPlanos();
  const allGymEjs=Object.values(gymPlanos).flatMap(p=>p.ejercicios);

  const stalledEjs=useMemo(()=>Object.entries(cargas).filter(([,h])=>{
    if(h.length<3) return false;
    const last3=h.slice(-3);
    const kgProgress=last3[2].kg>last3[0].kg;
    // Also check volume (max series kg) — if reps increased, not stalled
    const lastSeries=last3[2].series||[];const firstSeries=last3[0].series||[];
    const volProgress=lastSeries.length>0&&firstSeries.length>0&&
      lastSeries.reduce((a,v)=>a+v,0)>firstSeries.reduce((a,v)=>a+v,0);
    return !kgProgress&&!volProgress;
  }).map(([id])=>allGymEjs.find(e=>e.id===id)).filter(Boolean).slice(0,3),[todayDate]);

  const recentPRs=useMemo(()=>Object.entries(cargas).filter(([,h])=>{
    if(h.length<2) return false;
    const last=h[h.length-1];
    return last.fecha===todayDate&&last.kg>Math.max(...h.slice(0,-1).map(e=>e.kg));
  }).map(([id])=>allGymEjs.find(e=>e.id===id)).filter(Boolean),[todayDate]);

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
    const planoKeys=Object.keys(gymPlanos);
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
    <div style={{background:`linear-gradient(160deg,${todayAssignments.length?getAssignmentColor(todayAssignments[0])+"18":C.textMuted+"12"} 0%,${C.card} 60%)`,border:`1px solid ${todayAssignments.length?getAssignmentColor(todayAssignments[0])+"40":C.border}`,borderRadius:20,padding:20,marginBottom:16,boxShadow:C.shadow||"none"}}>
      <p style={{color:C.textMuted,fontSize:10,letterSpacing:2,textTransform:"uppercase",margin:"0 0 6px"}}>
        {new Date().toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"})}
      </p>
      {(()=>{
        // Cross-fatigue: detect if muscle groups trained yesterday overlap with today
        const yd=new Date();yd.setDate(yd.getDate()-1);
        const ydStr=`${yd.getFullYear()}-${String(yd.getMonth()+1).padStart(2,"0")}-${String(yd.getDate()).padStart(2,"0")}`;
        const ydSessions=getTrainedSessions(ydStr);
        if(!ydSessions.length||!todayAssignments.length) return null;
        const ydPlanos=ydSessions.filter(s=>s.planoKey).map(s=>s.planoKey);
        const todayPlanos=todayAssignments.filter(a=>a.planoKey).map(a=>a.planoKey);
        if(!ydPlanos.length||!todayPlanos.length) return null;
        const planos=gymPlanos;
        const ydGrupos=ydPlanos.flatMap(k=>(planos[k]?.ejercicios||[]).map(e=>(e.grupo||"").toLowerCase()));
        const todayGrupos=todayPlanos.flatMap(k=>(planos[k]?.ejercicios||[]).map(e=>(e.grupo||"").toLowerCase()));
        const overlap=todayGrupos.filter(g=>g&&ydGrupos.some(yg=>yg.includes(g)||g.includes(yg)));
        const uniqOverlap=[...new Set(overlap)];
        if(!uniqOverlap.length) return null;
        return <p style={{color:C.orange,fontSize:10,margin:"0 0 6px"}}>⚠️ {uniqOverlap.join(", ")} entrenados ayer — considera ajustar intensidad</p>;
      })()}
      {todayAssignments.length===0?(
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
            <span style={{fontSize:28}}>😴</span>
            <p style={{color:C.text,fontSize:18,fontWeight:700,margin:0}}>Descanso activo</p>
          </div>
          <p style={{color:C.textMuted,fontSize:12,margin:"0 0 10px"}}>Recuperación = parte del entrenamiento. Aprovecha para movilidad, foam roll o un paseo.</p>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>onNavigate&&onNavigate("skills")} style={{flex:1,background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,color:C.textSub,padding:"8px",cursor:"pointer",fontSize:11}}>🤸 Skills ligero</button>
            <button onClick={()=>onGoToNutricion&&onGoToNutricion()} style={{flex:1,background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,color:C.textSub,padding:"8px",cursor:"pointer",fontSize:11}}>🥗 Revisar nutrición</button>
          </div>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {todayAssignments.map((a,i)=>{
            const color=getAssignmentColor(a);
            const label=getAssignmentLabel(a);
            const doneSess=a.tabId==="gym"?todaySessions.find(s=>s.planoKey===a.planoKey):todaySessions.find(s=>s.tabId===a.tabId);
            return <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:color+"10",border:`1px solid ${color}33`,borderRadius:12,padding:"10px 14px"}}>
              <p style={{color:C.text,fontSize:15,fontWeight:700,margin:0}}>{label}</p>
              {doneSess?<Tag color={C.green}>✅ Hecho</Tag>:<button onClick={()=>onNavigate(a.tabId,a.planoKey)} style={{background:color,color:"#000",border:"none",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:12,fontWeight:700}}>Empezar →</button>}
            </div>;
          })}
        </div>
      )}
      {trainedToday&&<div style={{borderTop:`1px solid ${C.border}`,paddingTop:10,marginTop:10}}>
        <p style={{color:C.textMuted,fontSize:10,letterSpacing:2,textTransform:"uppercase",margin:"0 0 6px"}}>Completadas hoy</p>
        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
          {todaySessions.map((s,i)=><Tag key={i} color={s.color||C.green}>{s.icon} {s.tabName}</Tag>)}
        </div>
      </div>}
    </div>

    {/* ÚLTIMA SESIÓN — colapsible */}
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
          {lastData.map((d,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:`1px solid ${C.border}`}}>
            <p style={{color:C.textSub,fontSize:12,margin:0}}>{d.nombre}</p>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              {d.series&&<span style={{color:C.textMuted,fontSize:10}}>{d.series.join("·")}kg</span>}
              <span style={{color:C.text,fontSize:12,fontWeight:600}}>{d.kg}kg</span>
              <span style={{color:gymPlanos[gymA.planoKey]?.color||C.gymColor,fontSize:12,fontWeight:700}}>→ {d.kg+2.5}kg</span>
            </div>
          </div>)}
        </div>}
      </Card>;
    })()}

    {/* SUEÑO */}
    <div style={{height:1,background:`linear-gradient(90deg,transparent,${C.border},transparent)`,margin:"4px 0 14px"}}/>
    <SuenoHoy/>

    {/* NUTRICIÓN HOY */}
    <NutricionHoy/>

    {/* ALERTAS */}
    {showDeload&&<div style={{background:C.orange+"18",border:`1px solid ${C.orange}44`,borderRadius:12,padding:"12px 16px",marginBottom:14,display:"flex",gap:10}}>
      <span style={{fontSize:20}}>⚠️</span>
      <div>
        <p style={{color:C.orange,fontSize:13,fontWeight:700,margin:"0 0 2px"}}>Deload — {weeksSinceFirst} semanas</p>
        <p style={{color:C.textSub,fontSize:12,margin:0}}>Reduce a 2 series y el peso al 60-70%.</p>
      </div>
    </div>}
    {showFatigueWarning&&<div style={{background:C.red+"14",border:`1px solid ${C.red}44`,borderRadius:12,padding:"12px 16px",marginBottom:14,display:"flex",gap:10}}>
      <span style={{fontSize:20}}>🔴</span>
      <div>
        <p style={{color:C.red,fontSize:13,fontWeight:700,margin:"0 0 2px"}}>Fatiga alta — RPE {avgRecentRPE.toFixed(1)}/10</p>
        <p style={{color:C.textSub,fontSize:12,margin:0}}>Sesión más ligera o descanso extra.</p>
      </div>
    </div>}
    {recentPRs.length>0&&<div style={{background:C.yellow+"18",border:`1px solid ${C.yellow}55`,borderRadius:12,padding:"12px 16px",marginBottom:14}}>
      <p style={{color:C.yellow,fontSize:13,fontWeight:700,margin:"0 0 6px"}}>🏆 Récords hoy</p>
      {recentPRs.map(ej=><p key={ej.id} style={{color:C.textSub,fontSize:12,margin:"0 0 2px"}}>✓ {ej.nombre}</p>)}
    </div>}
    {(stalledEjs.length>0||cfStalledEjs.length>0)&&<Card accent={C.red} style={{marginBottom:14}}>
      <p style={{color:C.red,fontSize:12,fontWeight:700,margin:"0 0 8px"}}>⚡ Sin progreso en 3 sesiones</p>
      {stalledEjs.map(ej=>{
        const grupo=(ej.grupo||"").toLowerCase();
        const sugg=grupo.includes("espalda")||grupo.includes("bícep")?"Prueba reps diferentes (4-6↔8-12) o variante unilateral":
          grupo.includes("pecho")||grupo.includes("trícep")?"Añade pre-fatiga con aislamiento, o reduce peso 10% y sube volumen":
          grupo.includes("hombro")?"Cambia a cables o mancuernas para más rango":
          grupo.includes("cuádr")||grupo.includes("femor")||grupo.includes("glút")?"Cambia ángulo/variante o añade pausa en el punto de máxima tensión":
          "Reset al 80%, sube 1.25kg/sesión durante 3-4 semanas";
        return <div key={ej.id} style={{padding:"7px 0",borderBottom:`1px solid ${C.border}`}}>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            <div><p style={{color:C.textSub,fontSize:12,margin:0}}>{ej.nombre}</p><p style={{color:C.textMuted,fontSize:10,margin:0}}>Gym</p></div>
            <p style={{color:C.red,fontSize:12,margin:0}}>{(cargas[ej.id]||[]).slice(-3).map(h=>h.kg+"kg").join(" · ")}</p>
          </div>
          <p style={{color:C.textMuted,fontSize:10,margin:"3px 0 0",fontStyle:"italic"}}>💡 {sugg}</p>
        </div>;
      })}
      {cfStalledEjs.map(ej=>(
        <div key={ej.id} style={{padding:"7px 0",borderBottom:`1px solid ${C.border}`}}>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            <div><p style={{color:C.textSub,fontSize:12,margin:0}}>{ej.icon} {ej.nombre}</p><p style={{color:C.textMuted,fontSize:10,margin:0}}>{ej.tabName}</p></div>
            <p style={{color:C.red,fontSize:12,margin:0}}>Sin mejora</p>
          </div>
          <p style={{color:C.textMuted,fontSize:10,margin:"3px 0 0",fontStyle:"italic"}}>💡 Varía el estímulo: cambia el enfoque o añade tempo (3s excéntrica)</p>
        </div>
      ))}
    </Card>}

    {/* PLAN SEMANA — colapsible */}
    <Card style={{marginBottom:10,borderLeft:`3px solid ${C.calColor}`}}>
      <button onClick={()=>setShowWeekPlan(s=>!s)} style={{width:"100%",background:"none",border:"none",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",padding:0}}>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <div style={{width:30,height:30,borderRadius:8,background:C.calColor+"1a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>📅</div>
          <div>
            <p style={{color:C.text,fontSize:13,fontWeight:700,margin:0,lineHeight:1.3}}>Plan semanal</p>
            <p style={{color:C.textMuted,fontSize:10,margin:0}}>{showWeekPlan?`${daysThisWeek} días entrenados${streak>1?` · 🔥 ${streak} sem`:""}`:(`${daysThisWeek} días${streak>1?` · 🔥 ${streak} sem`:""}`)} </p>
          </div>
        </div>
        <span style={{color:C.textMuted,fontSize:18,lineHeight:1,transition:"transform 0.2s",display:"inline-block",transform:showWeekPlan?"rotate(90deg)":"rotate(0deg)"}}>›</span>
      </button>
      {showWeekPlan&&<div style={{marginTop:12}}>
        <div style={{display:"flex",gap:4,marginBottom:14}}>
          {weekPlan.map((d,i)=>{
            const dd=new Date(weekStart);dd.setDate(dd.getDate()+i);
            const ds=`${dd.getFullYear()}-${String(dd.getMonth()+1).padStart(2,"0")}-${String(dd.getDate()).padStart(2,"0")}`;
            const ss=getTrainedSessions(ds);
            const isToday=i===planIdx;
            const pc=d.assignments?.length>0?getAssignmentColor(d.assignments[0]):C.textMuted;
            return <div key={i} style={{flex:1,textAlign:"center"}}>
              <p style={{color:isToday?C.text:C.textMuted,fontSize:9,margin:"0 0 4px",fontWeight:isToday?700:400}}>{dayNames[i]}</p>
              <div style={{height:32,borderRadius:7,background:ss.length>0?ss[0].color+"28":isToday?C.surface:C.bg,border:isToday?`1.5px solid ${pc}`:ss.length>0?`1px solid ${ss[0].color}55`:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                {ss.length>0?<div style={{display:"flex",gap:2}}>{ss.slice(0,2).map((s,si)=><div key={si} style={{width:5,height:5,borderRadius:"50%",background:s.color}}/>)}</div>
                :isToday?<div style={{width:4,height:4,borderRadius:"50%",background:pc}}/>:null}
              </div>
            </div>;
          })}
        </div>
        {weekPlan.map((d,i)=>{
          const isToday=i===planIdx;
          return <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"8px 0",borderBottom:i<6?`1px solid ${C.border}`:"none"}}>
            <p style={{color:isToday?C.text:C.textSub,fontSize:11,fontWeight:isToday?700:400,margin:0,minWidth:24}}>{dayNames[i]}</p>
            <div style={{flex:1}}>
              {(!d.assignments||!d.assignments.length)?<p style={{color:C.textMuted,fontSize:12,margin:0,fontStyle:"italic"}}>Descanso</p>:(
                <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                  {d.assignments.map((a,j)=>{
                    const tab=tabs.find(t=>t.id===a.tabId);
                    const color=tab?.color||C.gymColor;
                    const label=a.tabId==="gym"?`🏋️ Gym ${a.planoKey||""}`:`${tab?.icon||""} ${tab?.name||a.tabId}`;
                    return <button key={j} onClick={()=>onNavigate(a.tabId,a.planoKey)} style={{background:color+"18",border:`1px solid ${color}44`,borderRadius:8,color,padding:"4px 10px",cursor:"pointer",fontSize:12,fontWeight:600}}>{label} →</button>;
                  })}
                </div>
              )}
            </div>
          </div>;
        })}
      </div>}
    </Card>

    {/* OBJETIVOS — colapsible */}
    <Card style={{marginBottom:16,borderLeft:`3px solid ${C.gymColor}`}}>
      <button onClick={()=>setShowObjetivos(s=>!s)} style={{width:"100%",background:"none",border:"none",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",padding:0}}>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <div style={{width:30,height:30,borderRadius:8,background:C.gymColor+"1a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>🎯</div>
          <div>
            <p style={{color:C.text,fontSize:13,fontWeight:700,margin:0,lineHeight:1.3}}>Objetivos</p>
            <p style={{color:C.textMuted,fontSize:10,margin:0}}>{objectives.length} objetivo{objectives.length!==1?"s":""}</p>
          </div>
        </div>
        <span style={{color:C.textMuted,fontSize:18,lineHeight:1,display:"inline-block",transform:showObjetivos?"rotate(90deg)":"none",transition:"transform 0.2s"}}>›</span>
      </button>
      {showObjetivos&&<div style={{marginTop:12}}>
        {objectives.map(obj=>{
          const curr=parseFloat(obj.current),tgt=parseFloat(obj.target);
          const tgtNum=obj.target.includes("-")?(parseFloat(obj.target.split("-")[0])+parseFloat(obj.target.split("-")[1]))/2:tgt;
          const meds=load(K.medidas)||[];
          const baseline=obj.name.toLowerCase().includes("peso")&&meds.length>1?parseFloat(meds[meds.length-1]?.peso)||0:0;
          const range=tgtNum-(baseline||0);
          const pct=tgtNum&&curr?Math.min(100,Math.max(0,range>0?((curr-(baseline||0))/range)*100:(curr/tgtNum)*100)):0;
          const objColor=pct>=100?C.green:pct>70?C.blue:C.gymColor;
          return <div key={obj.id} style={{marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <p style={{color:C.textSub,fontSize:13,margin:0}}>{obj.name}</p>
              <p style={{color:objColor,fontSize:13,fontWeight:700,margin:0}}>{obj.current}{obj.unit} → {obj.target}{obj.unit}</p>
            </div>
            {tgtNum&&curr&&<ProgressBar pct={pct} color={objColor} height={6}/>}
          </div>;
        })}
        {(()=>{
          const meds=load(K.medidas)||[];
          const wd=meds.filter(m=>m.peso).map(m=>({val:parseFloat(m.peso),fecha:m.fecha})).reverse();
          if(wd.length<2) return null;
          return <div style={{marginTop:8,borderTop:`1px solid ${C.border}`,paddingTop:10}}>
            <p style={{color:C.textMuted,fontSize:10,letterSpacing:2,textTransform:"uppercase",margin:"0 0 8px"}}>Evolución del peso</p>
            <BarChart data={wd} color={C.gymColor} unit="kg"/>
          </div>;
        })()}
      </div>}
    </Card>
  </div>
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
      {[["semana","Semana"],["cuerpo","Métricas"],["gym","Ejercicios"],["libre","Libre"]].map(([id,label])=>(
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

    {/* CUERPO */}
    {planTab==="cuerpo"&&(()=>{
      const profile=load(K.nutProfile)||NUT_PROFILE_SEED;
      function saveProfile(upd){save(K.nutProfile,upd);}
      const medidas=load(K.medidas)||[];
      const pesoActual=medidas.length?parseFloat(medidas[0].peso)||65.7:65.7;
      const pesoInicial=medidas.length>1?parseFloat(medidas[medidas.length-1].peso)||pesoActual:pesoActual;
      const grasaActual=medidas.length?parseFloat(medidas[0].grasa)||10:10;
      const BMR=Math.round(10*pesoActual+6.25*profile.altura-5*profile.edad+5);
      const TDEE=Math.round(BMR*profile.actividad);
      const surplusExtra=grasaActual<8?500:grasaActual<12?400:grasaActual<16?350:300;
      const surplus=TDEE+surplusExtra;
      const proteinTarget=Math.round(pesoActual*2);
      const proteinKcal=proteinTarget*4;
      const fatTarget=Math.round((surplus*0.25)/9);
      const fatKcal=fatTarget*9;
      const carbTarget=Math.round((surplus-proteinKcal-fatKcal)/4);
      const fiberTarget=32;
      const hydroTarget=Math.round(pesoActual*40/1000*10)/10;
      const gainRate=medidas.length>1?(()=>{
        const newest=parseFloat(medidas[0].peso)||0;
        const oldest=parseFloat(medidas[medidas.length-1].peso)||0;
        const [y1,m1,d1]=medidas[medidas.length-1].fecha.split("-").map(Number);
        const [y2,m2,d2]=medidas[0].fecha.split("-").map(Number);
        const weeks=Math.max(1,Math.floor((new Date(y2,m2-1,d2)-new Date(y1,m1-1,d1))/(7*24*3600*1000)));
        return ((newest-oldest)/weeks).toFixed(2);
      })():null;
      const gainOk=gainRate&&parseFloat(gainRate)>=0.15&&parseFloat(gainRate)<=0.5;
      const gainSlow=gainRate&&parseFloat(gainRate)<0.15;
      return <div>
        {/* Calories hero */}
        <div style={{background:`linear-gradient(135deg,#f97316"18",${C.surface})`,border:`1px solid #f9731644`,borderRadius:20,padding:18,marginBottom:14}}>
          <Tag color="#f97316">Ganancia de masa limpia</Tag>
          <p style={{color:C.text,fontSize:24,fontWeight:800,margin:"8px 0 2px"}}>{surplus} kcal/día</p>
          <p style={{color:C.textMuted,fontSize:11,margin:"0 0 14px"}}>TDEE {TDEE} + {surplusExtra} superávit ({grasaActual}% grasa) · {pesoActual}kg</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:6}}>
            {[["🥩 Proteína",proteinTarget+"g",C.red],["🌾 Carbos",carbTarget+"g",C.yellow],["🫒 Grasa",fatTarget+"g",C.blue]].map(([label,val,color])=>(
              <div key={label} style={{background:C.card,borderRadius:10,padding:"10px 6px",textAlign:"center"}}>
                <p style={{color:C.textMuted,fontSize:9,margin:"0 0 3px"}}>{label}</p>
                <p style={{color,fontSize:17,fontWeight:800,margin:0}}>{val}</p>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:6}}>
            {[["💧 Agua",hydroTarget+"L",C.blue],["🌿 Fibra",fiberTarget+"g",C.green]].map(([label,val,color])=>(
              <div key={label} style={{flex:1,background:C.card,borderRadius:10,padding:"8px 6px",textAlign:"center"}}>
                <p style={{color:C.textMuted,fontSize:9,margin:"0 0 2px"}}>{label}</p>
                <p style={{color,fontSize:14,fontWeight:700,margin:0}}>{val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Weight gain rate */}
        {gainRate!==null?<Card style={{marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <SectionLabel>Velocidad de ganancia</SectionLabel>
            <Tag color={gainOk?C.green:gainSlow?C.orange:C.red}>{gainRate} kg/sem</Tag>
          </div>
          <p style={{color:gainOk?C.green:gainSlow?C.orange:C.red,fontSize:12,margin:"0 0 4px",fontWeight:700}}>
            {gainOk?"✅ Ritmo ideal":gainSlow?"⚠️ Muy lento — sube 100-200 kcal":"⚠️ Demasiado rápido — reduce 100 kcal"}
          </p>
          <p style={{color:C.textMuted,fontSize:11,margin:0}}>{pesoInicial}kg → {pesoActual}kg · rango ideal 0.15–0.5 kg/sem</p>
        </Card>:<Card style={{marginBottom:14}}>
          <p style={{color:C.textSub,fontSize:13,fontWeight:600,margin:"0 0 4px"}}>📊 Velocidad de ganancia</p>
          <p style={{color:C.textMuted,fontSize:12,margin:0}}>Necesitas al menos 2 evaluaciones para calcular tu ritmo. Añádelas en Medidas.</p>
        </Card>}

        {/* Objetivos editor */}
        <div style={{marginTop:6,marginBottom:14}}>
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

        {/* Medidas */}
        <MedidasPanel/>

        {/* Perfil nutricional */}
        <Card style={{marginTop:14}}>
          <SectionLabel>Perfil nutricional</SectionLabel>
          <div style={{display:"flex",gap:8,marginBottom:8}}>
            <div style={{flex:1}}><p style={{color:C.textMuted,fontSize:10,margin:"0 0 4px"}}>Altura (cm)</p>
              <Input value={profile.altura} onChange={e=>saveProfile({...profile,altura:parseInt(e.target.value)||175})} placeholder="175"/></div>
            <div style={{flex:1}}><p style={{color:C.textMuted,fontSize:10,margin:"0 0 4px"}}>Edad</p>
              <Input value={profile.edad} onChange={e=>saveProfile({...profile,edad:parseInt(e.target.value)||31})} placeholder="31"/></div>
          </div>
          <p style={{color:C.textMuted,fontSize:10,margin:"0 0 6px"}}>Nivel de actividad</p>
          {[[1.2,"Sedentario"],[1.375,"Ligero — 1-3 días/sem"],[1.55,"Moderado — 3-5 días/sem"],[1.725,"Activo — 6-7 días/sem"],[1.9,"Muy activo — 2x/día"]].map(([val,label])=>(
            <button key={val} onClick={()=>saveProfile({...profile,actividad:val})} style={{display:"block",width:"100%",background:profile.actividad===val?"#f97316"+"22":C.surface,color:profile.actividad===val?"#f97316":C.textSub,border:`1px solid ${profile.actividad===val?"#f97316"+"66":C.border}`,borderRadius:8,padding:"7px 12px",cursor:"pointer",fontSize:11,textAlign:"left",fontWeight:profile.actividad===val?700:400,marginBottom:4}}>
              {profile.actividad===val?"✓ ":""}{label}
            </button>
          ))}
        </Card>

        {/* Micronutrientes */}
        <Card style={{marginTop:14}}>
          <SectionLabel>Micronutrientes clave</SectionLabel>
          <p style={{color:C.textMuted,fontSize:11,margin:"0 0 10px"}}>Impactan directamente en testosterona y recuperación muscular.</p>
          {[
            {name:"Zinc",sources:"Ostras, carne roja, semillas de calabaza",dose:"11mg/día",emoji:"🦪"},
            {name:"Magnesio",sources:"Espinacas, frutos secos, legumbres",dose:"400mg/día",emoji:"🥬"},
            {name:"Vitamina D",sources:"Sol 20min/día o suplemento 2000-4000 UI",dose:"600-4000 UI/día",emoji:"☀️"},
            {name:"Omega-3",sources:"Salmón, sardinas, nueces, lino",dose:"2-3g EPA/DHA/día",emoji:"🐟"},
          ].map(m=>(
            <div key={m.name} style={{padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}>
                <p style={{color:C.text,fontSize:13,fontWeight:600,margin:0}}>{m.emoji} {m.name}</p>
                <Tag color={C.gymColor}>{m.dose}</Tag>
              </div>
              <p style={{color:C.textMuted,fontSize:11,margin:0}}>{m.sources}</p>
            </div>
          ))}
        </Card>
      </div>;
    })()}
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
  const [selectedDay,setSelectedDay]=useState(null);

  const now=new Date();now.setMonth(now.getMonth()+mesOffset);
  const year=now.getFullYear(),month=now.getMonth();
  const mesNombre=now.toLocaleDateString("es-ES",{month:"long",year:"numeric"});
  const primerDia=new Date(year,month,1).getDay();
  const diasEnMes=new Date(year,month+1,0).getDate();
  const offset=primerDia===0?6:primerDia-1;

  function getDaySessions(day){
    const dateStr=`${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    return getTrainedSessions(dateStr);
  }

  function getDayDateStr(day){
    return `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
  }

  function getDaySummary(day){
    const dateStr=getDayDateStr(day);
    const sessions=getDaySessions(day);
    const rpeLog=load(K.rpe)||{};
    const snotaLog=load(K.snota)||{};
    const sleep=(load(K.proteinLog)||{})[dateStr+"_sleep"]||null;
    const protLog=(load(K.proteinLog)||{})[dateStr]||[];
    const protTotal=protLog.reduce((a,e)=>a+(e.prot||0),0);
    return {sessions,dateStr,rpeLog,snotaLog,sleep,protTotal};
  }

  const diasEntrenados=Array.from({length:diasEnMes},(_,i)=>i+1).filter(d=>getDaySessions(d).length>0).length;
  const calTabs=loadTabs();
  const sel=selectedDay?getDaySummary(selectedDay):null;

  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <button onClick={()=>{setMesOffset(o=>o-1);setSelectedDay(null);}} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,color:C.text,padding:"8px 16px",cursor:"pointer",fontSize:16}}>‹</button>
      <p style={{color:C.text,fontSize:15,fontWeight:700,margin:0,textTransform:"capitalize"}}>{mesNombre}</p>
      <button onClick={()=>{setMesOffset(o=>o+1);setSelectedDay(null);}} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,color:C.text,padding:"8px 16px",cursor:"pointer",fontSize:16}}>›</button>
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

    {/* Day summary panel */}
    {sel&&<Card style={{marginBottom:14,border:`1px solid ${C.gymColor}44`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <p style={{color:C.text,fontSize:13,fontWeight:700,margin:0}}>{fmt(sel.dateStr)}</p>
        <button onClick={()=>setSelectedDay(null)} style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:16}}>✕</button>
      </div>
      {sel.sessions.length===0?<p style={{color:C.textMuted,fontSize:12,margin:0,fontStyle:"italic"}}>Día de descanso</p>:<>
        {sel.sessions.map((s,i)=>{
          const planoKey=s.planoKey;
          const rpe=planoKey?sel.rpeLog[`${sel.dateStr}_${planoKey}`]:null;
          const nota=planoKey?sel.snotaLog[`${sel.dateStr}_${planoKey}`]:null;
          return <div key={i} style={{marginBottom:8,paddingBottom:8,borderBottom:`1px solid ${C.border}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <p style={{color:s.color||C.gymColor,fontSize:13,fontWeight:700,margin:0}}>{s.icon} {s.tabName}{planoKey?` ${planoKey}`:""}</p>
              {rpe&&<Tag color={rpe<=5?C.green:rpe<=8?C.orange:C.red}>RPE {rpe}/10</Tag>}
            </div>
            {nota&&<p style={{color:C.textMuted,fontSize:11,margin:"3px 0 0",fontStyle:"italic"}}>"{nota}"</p>}
          </div>;
        })}
      </>}
      <div style={{display:"flex",gap:12,marginTop:6,flexWrap:"wrap"}}>
        {sel.protTotal>0&&<p style={{color:C.textMuted,fontSize:11,margin:0}}>💪 {sel.protTotal}g proteína</p>}
        {sel.sleep?.rating>0&&<p style={{color:C.textMuted,fontSize:11,margin:0}}>{["😴","💤","😐","😊","🌟"][sel.sleep.rating-1]} {sel.sleep.hours?sel.sleep.hours+"h sueño":"sueño"}</p>}
      </div>
    </Card>}

    <Card>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:8}}>
        {["L","M","X","J","V","S","D"].map(d=><p key={d} style={{color:C.textMuted,fontSize:10,textAlign:"center",margin:0,fontWeight:700}}>{d}</p>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
        {Array.from({length:offset}).map((_,i)=><div key={`e${i}`}/>)}
        {Array.from({length:diasEnMes},(_,i)=>i+1).map(day=>{
          const sessions=getDaySessions(day);
          const isToday=year===new Date().getFullYear()&&month===new Date().getMonth()&&day===new Date().getDate();
          const isSelected=selectedDay===day;
          return <button key={day} onClick={()=>setSelectedDay(selectedDay===day?null:day)} style={{
            background:isSelected?C.gymColor+"33":sessions.length>0?sessions[0].color+"18":isToday?C.surface:"transparent",
            border:`1.5px solid ${isSelected?C.gymColor:sessions.length>0?sessions[0].color+"55":isToday?C.borderLight:C.border}`,
            borderRadius:8,padding:"6px 2px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,
            minHeight:36,
          }}>
            <p style={{color:isToday?C.gymColor:isSelected?C.gymColor:C.textSub,fontSize:11,margin:0,fontWeight:isToday||isSelected?700:400,lineHeight:1}}>{day}</p>
            {sessions.length>0&&<div style={{display:"flex",gap:2}}>
              {sessions.slice(0,2).map((s,si)=><div key={si} style={{width:4,height:4,borderRadius:"50%",background:s.color}}/>)}
            </div>}
          </button>;
        })}
      </div>
    </Card>

    {/* Legend */}
    <div style={{marginTop:12,display:"flex",flexWrap:"wrap",gap:8}}>
      {calTabs.map(t=>(
        <div key={t.id} style={{display:"flex",alignItems:"center",gap:5}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:t.color}}/>
          <p style={{color:C.textMuted,fontSize:10,margin:0}}>{t.name}</p>
        </div>
      ))}
    </div>
  </div>;
}


// ── SCREEN NUTRICION ─────────────────────────────────────────────────────────
const CAT_LABELS = {
  proteina:"🥩 Proteína", lacteos:"🥛 Lácteos", carbos:"🌾 Carbos",
  legumbres:"🫘 Legumbres", verduras:"🥦 Verduras", frutas:"🍎 Frutas",
  condimentos:"🧂 Condimentos", otros:"🥜 Otros"
};
const CAT_ORDER = ["proteina","lacteos","carbos","legumbres","verduras","frutas","condimentos","otros"];

function ShoppingAddForm({onAdd,color}){
  const [open,setOpen]=useState(false);
  const [name,setName]=useState("");
  const [cat,setCat]=useState("otros");
  if(!open) return <Btn onClick={()=>setOpen(true)} color={color} style={{padding:"6px 14px",fontSize:12}}>+ Añadir</Btn>;
  return <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:14,marginTop:8}}>
    <div style={{display:"flex",gap:8,marginBottom:8}}>
      <Input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Nombre del producto" style={{flex:2,fontSize:12}} onEnter={()=>{if(name.trim()){onAdd({id:"s_"+Date.now(),name:name.trim(),cat,done:false});setName("");setOpen(false);}}}/>
    </div>
    <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:10}}>
      {CAT_ORDER.map(c=>(
        <button key={c} onClick={()=>setCat(c)} style={{background:cat===c?color:C.surface,color:cat===c?"#000":C.textSub,border:`1px solid ${cat===c?color:C.border}`,borderRadius:8,padding:"4px 10px",fontSize:10,cursor:"pointer",fontWeight:cat===c?700:400}}>
          {CAT_LABELS[c]||c}
        </button>
      ))}
    </div>
    <div style={{display:"flex",gap:8}}>
      <Btn onClick={()=>{if(!name.trim())return;onAdd({id:"s_"+Date.now(),name:name.trim(),cat,done:false});setName("");setOpen(false);}} color={color} style={{flex:1}}>Añadir</Btn>
      <button onClick={()=>{setOpen(false);setName("");}} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:10,color:C.textMuted,padding:"10px 14px",cursor:"pointer",fontSize:12}}>Cancelar</button>
    </div>
  </div>;
}

function CustomProteinAdd({onAdd,color,onSaveFood}){
  const [name,setName]=useState("");
  const [prot,setProt]=useState("");
  const [open,setOpen]=useState(false);
  if(!open) return <button onClick={()=>setOpen(true)} style={{background:"none",border:`1px dashed ${color}44`,borderRadius:10,color:color,width:"100%",padding:"9px",cursor:"pointer",fontSize:12,marginBottom:12}}>+ Añadir alimento personalizado</button>;
  return <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:14,marginBottom:12}}>
    <div style={{display:"flex",gap:8,marginBottom:8}}>
      <Input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Nombre del alimento" style={{flex:2,fontSize:12}}/>
      <Input value={prot} onChange={e=>setProt(e.target.value)} placeholder="g prot" style={{flex:1,fontSize:12}}/>
    </div>
    <div style={{display:"flex",gap:8}}>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        <Btn onClick={()=>{if(!name||!prot)return;onAdd({name,prot:parseFloat(prot)||0,time:new Date().toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"})});setName("");setProt("");setOpen(false);}} color={color} style={{width:"100%"}}>Añadir una vez</Btn>
        {onSaveFood&&<button onClick={()=>{if(!name||!prot)return;onSaveFood({id:"cf_"+Date.now(),name,prot:parseFloat(prot)||0});onAdd({name,prot:parseFloat(prot)||0,time:new Date().toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"})});setName("");setProt("");setOpen(false);}} style={{background:color+"28",border:`1px solid ${color}44`,borderRadius:10,color,padding:"9px",cursor:"pointer",fontSize:12,fontWeight:700}}>⭐ Añadir y guardar en favoritos</button>}
      </div>
      <button onClick={()=>setOpen(false)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:10,color:C.textMuted,padding:"10px 14px",cursor:"pointer",fontSize:12}}>Cancelar</button>
    </div>
  </div>;
}

function ScreenNutricion(){
  const nutColor="#f97316";
  const [nutTab,setNutTab]=useState("shop");
  const [mealPlan,setMealPlan]=useState(()=>load(K.mealPlan)||MEAL_PLAN_SEED);
  const [shopping,setShopping]=useState(()=>load(K.shopping)||SHOPPING_SEED);

  function saveMealPlan(upd){setMealPlan(upd);save(K.mealPlan,upd);}
  function saveShopping(upd){setShopping(upd);save(K.shopping,upd);}

  const dayNames=["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
  const todayDow=(new Date().getDay()+6)%7;
  const lastTrainedToday=getTrainedSessions(today()).length>0;

  return <div>
    {/* Tab bar */}
    <div style={{display:"flex",gap:6,marginBottom:18}}>
      {[["shop","🛒 Compra"],["meals","🍽 Comidas"]].map(([id,label])=>(
        <button key={id} onClick={()=>setNutTab(id)} style={{flex:1,background:nutTab===id?nutColor:C.card,color:nutTab===id?"#000":C.textSub,border:`1.5px solid ${nutTab===id?nutColor:C.border}`,borderRadius:10,padding:"10px 14px",fontSize:13,fontWeight:nutTab===id?700:400,cursor:"pointer",transition:"all 0.15s"}}>
          {label}
        </button>
      ))}
    </div>

    {/* ── COMPRA ── */}
    {nutTab==="shop"&&<div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <p style={{color:C.textMuted,fontSize:12,margin:0}}>{shopping.filter(s=>s.done).length}/{shopping.length} comprados</p>
        <button onClick={()=>saveShopping(shopping.map(s=>({...s,done:false})))} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,color:C.textSub,padding:"5px 10px",cursor:"pointer",fontSize:11}}>Resetear</button>
      </div>
      <ProgressBar pct={Math.round((shopping.filter(s=>s.done).length/Math.max(1,shopping.length))*100)} color={C.green} height={4}/>
      <div style={{marginTop:12,marginBottom:4}}>
        <ShoppingAddForm onAdd={item=>saveShopping([...shopping,item])} color={nutColor}/>
      </div>
      <div style={{marginTop:14}}>
        {CAT_ORDER.map(cat=>{
          const items=shopping.filter(s=>s.cat===cat);
          if(!items.length) return null;
          const allDone=items.every(s=>s.done);
          return <div key={cat} style={{marginBottom:14}}>
            <p style={{color:allDone?C.textMuted:C.textSub,fontSize:11,fontWeight:700,margin:"0 0 6px",textDecoration:allDone?"line-through":"none"}}>{CAT_LABELS[cat]||cat}</p>
            {items.map(item=>(
              <div key={item.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
                <button onClick={()=>saveShopping(shopping.map(s=>s.id===item.id?{...s,done:!s.done}:s))} style={{width:22,height:22,borderRadius:6,background:item.done?C.green:C.surface,border:`2px solid ${item.done?C.green:C.borderLight}`,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",color:"#000",fontSize:13,fontWeight:700}}>
                  {item.done?"✓":""}
                </button>
                <input value={item.name} onChange={e=>saveShopping(shopping.map(s=>s.id===item.id?{...s,name:e.target.value}:s))} style={{flex:1,background:"transparent",border:"none",color:item.done?C.textMuted:C.text,fontSize:13,padding:0,outline:"none",textDecoration:item.done?"line-through":"none",fontFamily:"inherit"}}/>
                <button onClick={()=>saveShopping(shopping.filter(s=>s.id!==item.id))} style={{background:"none",border:"none",color:C.red,cursor:"pointer",fontSize:12,opacity:0.6}}>✕</button>
              </div>
            ))}
          </div>;
        })}
      </div>
    </div>}

    {/* ── COMIDAS ── */}
    {nutTab==="meals"&&<div>
      {/* Pre/post workout guidance */}
      {!lastTrainedToday&&loadWeek()[(new Date().getDay()+6)%7]?.assignments?.length>0&&(
        <div style={{background:C.blue+"15",border:`1px solid ${C.blue}44`,borderRadius:12,padding:"12px 14px",marginBottom:14,display:"flex",gap:10}}>
          <span style={{fontSize:18}}>⚡</span>
          <div>
            <p style={{color:C.blue,fontSize:13,fontWeight:700,margin:"0 0 2px"}}>Hoy toca entrenar — recuerda el pre-entreno</p>
            <p style={{color:C.textSub,fontSize:12,margin:0}}>1-2h antes: <strong>40-60g carbos + 20g proteína</strong></p>
          </div>
        </div>
      )}
      {lastTrainedToday&&<div style={{background:C.green+"15",border:`1px solid ${C.green}44`,borderRadius:12,padding:"12px 14px",marginBottom:14,display:"flex",gap:10}}>
        <span style={{fontSize:18}}>💪</span>
        <div>
          <p style={{color:C.green,fontSize:13,fontWeight:700,margin:"0 0 2px"}}>Entrenaste hoy — recuerda el post-entreno</p>
          <p style={{color:C.textSub,fontSize:12,margin:0}}>En 60 min: <strong>30-40g proteína + 60-80g carbos</strong></p>
        </div>
      </div>}
      <SectionLabel>Plan semanal</SectionLabel>
      {dayNames.map((dayName,di)=>{
        const MEAL_TYPES=["Desayuno","Media mañana","Comida","Merienda","Cena"];
        const isToday=di===todayDow;
        return <Card key={di} style={{marginBottom:10,border:isToday?`1.5px solid ${nutColor}`:undefined}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <p style={{color:isToday?nutColor:C.text,fontSize:14,fontWeight:700,margin:0}}>{dayName}</p>
            {isToday&&<Tag color={nutColor}>Hoy</Tag>}
          </div>
          {MEAL_TYPES.map((mt,mi)=>{
            const val=(mealPlan[di]?.meals||[])[mi]?.desc||"";
            const protTag=(mealPlan[di]?.meals||[])[mi]?.protTag||"";
            return <div key={mi} style={{marginBottom:7}}>
              <p style={{color:C.textMuted,fontSize:9,margin:"0 0 3px",textTransform:"uppercase",letterSpacing:1}}>{mt}</p>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <Input type="text" value={val} onChange={e=>{
                  const upd={...mealPlan};
                  const meals=upd[di]?.meals||MEAL_TYPES.map(t=>({t,desc:"",protTag:""}));
                  upd[di]={...upd[di],meals:meals.map((m,idx)=>idx===mi?{...m,desc:e.target.value}:m)};
                  saveMealPlan(upd);
                }} placeholder={`Ej: Avena con fruta y huevos`} style={{flex:1,fontSize:12,padding:"7px 12px"}}/>
                <div style={{display:"flex",gap:3}}>
                  {[["🥩","P"],["🌾","C"],["⚖️","M"]].map(([icon,code])=>(
                    <button key={code} onClick={()=>{
                      const upd={...mealPlan};
                      const meals=upd[di]?.meals||MEAL_TYPES.map(t=>({t,desc:"",protTag:""}));
                      upd[di]={...upd[di],meals:meals.map((m,idx)=>idx===mi?{...m,protTag:protTag===code?"":code}:m)};
                      saveMealPlan(upd);
                    }} style={{background:protTag===code?code==="P"?C.red+"33":code==="C"?C.yellow+"33":C.blue+"22":C.surface,border:`1px solid ${protTag===code?code==="P"?C.red:code==="C"?C.yellow:C.blue:C.border}`,borderRadius:6,padding:"4px 6px",cursor:"pointer",fontSize:12}}>{icon}</button>
                  ))}
                </div>
              </div>
            </div>;
          })}
        </Card>;
      })}
    </div>}
  </div>;
}

// ── APP ───────────────────────────────────────────────────────────────────────
function AppInner(){
  const [screen,setScreen]=useState("hoy");
  const [entrenTab,setEntrenTab]=useState("gym");
  const [entrenPlano,setEntrenPlano]=useState(null);
  const [isDark,setIsDark]=useState(true);
  const [showBackup,setShowBackup]=useState(false);
  const [importMsg,setImportMsg]=useState(null);

  C=isDark?DARK:LIGHT;

  const nav=[
    {id:"hoy",label:"Hoy",icon:"⚡"},
    {id:"plan",label:"Plan",icon:"📋"},
    {id:"entreno",label:"Entrenamiento",icon:"🏋️"},
    {id:"nutricion",label:"Nutrición",icon:"🥗"},
    {id:"calendario",label:"Cal.",icon:"📅"},
  ];
  const hour=new Date().getHours();
  const greeting=hour<12?"Buenos días":hour<19?"Buenas tardes":"Buenas noches";
  const titles={hoy:`${greeting}, Alvaro`,entreno:"Entrenamiento",plan:"Plan",nutricion:"Nutrición",calendario:"Calendario"};
  const msgBg=importMsg?.startsWith("✓")?(isDark?"#001a0f":"#e6fff5"):(isDark?"#1a000a":"#fff0f3");

  return <div style={{fontFamily:"-apple-system,'SF Pro Display',sans-serif",background:C.bg,minHeight:"100vh",color:C.text,paddingBottom:75,transition:"background 0.3s,color 0.3s"}}>
    {/* Header */}
    <div style={{background:C.bg+"ee",backdropFilter:"blur(10px)",borderBottom:`1px solid ${C.border}`,padding:"14px 20px 12px",position:"sticky",top:0,zIndex:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",maxWidth:500,margin:"0 auto"}}>
        <div>
          <p style={{color:C.gymColor,fontSize:9,letterSpacing:3,textTransform:"uppercase",margin:"0 0 2px",fontWeight:700}}>Alvaro · 2026</p>
          <h1 style={{fontSize:20,fontWeight:800,margin:0,letterSpacing:-0.5,color:C.text,lineHeight:1.15}}>{titles[screen]}</h1>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button onClick={()=>setIsDark(d=>!d)} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"6px 10px",cursor:"pointer",display:"flex",alignItems:"center",gap:5,boxShadow:C.shadowSm||"none"}}>
            <span style={{fontSize:13,opacity:isDark?1:0.4}}>🌙</span>
            <span style={{fontSize:13,opacity:isDark?0.4:1}}>☀️</span>
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
      {screen==="hoy"&&<ScreenHoy onNavigate={(tab,planoKey)=>{setEntrenTab(tab);setEntrenPlano(planoKey||null);setScreen("entreno");}} onGoToNutricion={()=>setScreen("nutricion")}/>}
      {screen==="entreno"&&<ScreenEntreno initTab={entrenTab} initPlanoKey={entrenPlano}/>}
      {screen==="plan"&&<ScreenPlan/>}
      {screen==="nutricion"&&<ScreenNutricion/>}
      {screen==="calendario"&&<ScreenCalendario/>}
    </div>

    {/* Nav */}
    <div style={{position:"fixed",bottom:0,left:0,right:0,background:C.bg+"f5",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderTop:`1px solid ${C.border}`,display:"flex",padding:"6px 2px 16px"}}>
      {nav.map(t=>{
        const isActive=screen===t.id;
        return <button key={t.id} onClick={()=>setScreen(t.id)} style={{flex:1,background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"2px 0"}}>
          <div style={{width:44,height:28,borderRadius:10,background:isActive?C.gymColor+"22":"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"background 0.2s"}}>
            <span style={{fontSize:18,opacity:isActive?1:0.45,transition:"opacity 0.2s"}}>{t.icon}</span>
          </div>
          <span style={{fontSize:9,color:isActive?C.gymColor:C.textMuted,fontWeight:isActive?700:500,letterSpacing:0.2,transition:"color 0.2s"}}>{t.label}</span>
        </button>;
      })}
    </div>
  </div>;
}

export default function App(){ return <ErrorBoundary><AppInner/></ErrorBoundary>; }
function tabEjKey(id){ return "pg_ej_"+id; }
