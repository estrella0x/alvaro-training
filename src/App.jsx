import React, { useState, useEffect, useRef, useCallback, useMemo, Component } from "react";

// ── TOAST SYSTEM ─────────────────────────────────────────────────────────────
let _pushToast = null;
let _toastCounter = 0;

function pushToast({type="success", text, duration=4000}){
  // Safe to call at any time — silently no-ops if container not mounted
  if(typeof _pushToast === "function"){
    _pushToast({type, text, duration, id: ++_toastCounter});
  }
}

function ToastContainer(){
  const [toasts, setToasts] = useState([]);

  useEffect(()=>{
    // Register global setter on mount
    _pushToast = (t) => setToasts(prev => [...prev.slice(-3), t]);
    // On unmount, clear the reference so pushToast silently no-ops
    return () => { _pushToast = null; };
  }, []);

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  function getStyle(type){
    // Monochrome base + subtle left-accent per type
    const accent={success:C.green,error:C.red,warning:C.orange,info:C.blue}[type]||C.green;
    return {bg:C.card, border:C.border, color:C.text, accent};
  }

  // Always renders the fixed container; individual items handle visibility
  return (
    <div style={{
      position: "fixed",
      top: 68,
      left: 12,
      right: 12,
      maxWidth: 460,
      margin: "0 auto",
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      gap: 8,
      pointerEvents: "none",
    }}>
      {toasts.map(t => (
        <ToastItem
          key={t.id}
          toast={t}
          style={getStyle(t.type)}
          onRemove={remove}
        />
      ))}
    </div>
  );
}

function ToastItem({toast, style, onRemove}){
  const [visible, setVisible] = useState(false);

  // Track ALL timers so we can cancel every one of them on unmount
  const timers = useRef([]);
  function schedule(fn, ms){
    const id = setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  }

  // dismissedRef: guarantees dismiss() is idempotent regardless of
  // how many times auto-close and manual click fire
  const dismissedRef = useRef(false);

  // Keep a stable ref to onRemove so the 280ms fade timer
  // always calls the current version, not a stale closure
  const onRemoveRef = useRef(onRemove);
  useEffect(() => { onRemoveRef.current = onRemove; }, [onRemove]);

  useEffect(() => {
    // Slide in after one frame
    schedule(() => setVisible(true), 16);
    // Auto-dismiss after duration
    schedule(() => dismiss(), toast.duration);
    // Cleanup: cancel every scheduled timer for this item
    return () => { timers.current.forEach(clearTimeout); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function dismiss(){
    if(dismissedRef.current) return; // idempotent guard
    dismissedRef.current = true;
    setVisible(false);
    // Fade out then remove from state
    schedule(() => onRemoveRef.current(toast.id), 280);
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      onClick={dismiss}
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
        borderLeft: `2px solid ${style.accent}`,
        borderRadius: 10,
        padding: "10px 14px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        pointerEvents: "all",
        cursor: "pointer",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-8px)",
        transition: "opacity 0.2s ease, transform 0.2s ease",
      }}
    >
      <p style={{
        color: style.color,
        fontSize: 13,
        fontWeight: 500,
        margin: 0,
        lineHeight: 1.4,
        flex: 1,
        letterSpacing: -0.1,
      }}>
        {toast.text}
      </p>
      <span
        aria-label="Cerrar"
        style={{color:C.textMuted, fontSize:12, flexShrink:0, lineHeight:1}}
      >
        ✕
      </span>
    </div>
  );
}


class ErrorBoundary extends Component {
  constructor(props){ super(props); this.state={error:null}; }
  static getDerivedStateFromError(e){ return {error:e}; }
  render(){
    if(this.state.error){
      const msg=this.state.error?.message||"Error desconocido";
      return (
        <div style={{padding:40,textAlign:"center",fontFamily:"-apple-system,sans-serif",background:"#0b0b13",minHeight:"100vh"}}>
          <p style={{fontSize:32,margin:"0 0 12px"}}>!</p>
          <p style={{fontSize:16,fontWeight:700,color:"#0a7aff",margin:"0 0 8px"}}>Algo salió mal</p>
          <p style={{fontSize:12,color:"#9292b2",margin:"0 0 24px",maxWidth:300,marginLeft:"auto",marginRight:"auto"}}>{msg}</p>
          <button onClick={()=>window.location.reload()} style={{background:"#c0392b",color:"#fff",border:"none",borderRadius:8,padding:"10px 24px",cursor:"pointer",fontSize:14,fontWeight:700}}>Recargar app</button>
          <p style={{fontSize:11,color:"#6b6b84",marginTop:16}}>Si el error persiste, exporta tus datos desde Ajustes antes de recargar.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── TOKENS ───────────────────────────────────────────────────────────────────
const DARK = {
  bg:          "#0a0a0a",
  surface:     "#111111",
  card:        "#1c1c1e",
  border:      "#2c2c2e",
  borderLight: "#3a3a3c",
  text:        "#f2f2f2",
  textSub:     "#a0a0a5",
  textMuted:   "#5a5a60",
  accent:      "#0a7aff",
  green:       "#30d158",
  red:         "#ff453a",
  orange:      "#ff9f0a",
  blue:        "#0a84ff",
  yellow:      "#ffd60a",
  purple:      "#bf5af2",
  gymColor:    "#0a7aff",
  cfColor:     "#0a7aff",
  calColor:    "#0a7aff",
  planColor:   "#0a7aff",
  shadow:      "0 1px 2px rgba(0,0,0,0.4)",
  shadowSm:    "0 1px 1px rgba(0,0,0,0.3)",
};
const LIGHT = {
  bg:          "#f2f2f7",
  surface:     "#ffffff",
  card:        "#f9f9f9",
  border:      "#d1d1d6",
  borderLight: "#e5e5ea",
  text:        "#1c1c1e",
  textSub:     "#6c6c70",
  textMuted:   "#b0b0b8",
  accent:      "#0071e3",
  green:       "#1c8a3a",
  red:         "#c0392b",
  orange:      "#b25000",
  blue:        "#0071e3",
  yellow:      "#9a6700",
  purple:      "#7d37ba",
  gymColor:    "#0071e3",
  cfColor:     "#0071e3",
  calColor:    "#0071e3",
  planColor:   "#0071e3",
  shadow:      "0 1px 2px rgba(0,0,0,0.07)",
  shadowSm:    "0 1px 1px rgba(0,0,0,0.05)",
};
let C = DARK;

// ── KEYS ─────────────────────────────────────────────────────────────────────
const K = {
  tabs:"pg_tabs", cargas:"pg_c", medidas:"pg_m",
  gymPlanos:"pg_gp", planWeek:"pg_pw", objectives:"pg_obj",
  rpe:"pg_rpe", snota:"pg_snota", customFoods:"pg_cf", supplements:"pg_sup",
  nutProfile:"pg_nup", mealPlan:"pg_mp", shopping:"pg_sh", proteinLog:"pg_pl",
};
function tabEjKey(id){ return "pg_ej_"+id; }
function tabDataKey(id){ return "pg_td_"+id; }

// ── SEEDS ────────────────────────────────────────────────────────────────────
const DEFAULT_TABS = [
  {id:"gym",    name:"Gym",          icon:"", color:"#0a7aff", type:"gym"},
  {id:"skills", name:"Skills",       icon:"", color:"#0a7aff", type:"cf"},
  {id:"powerlifting", name:"Power Lifting", icon:"", color:"#0a7aff", type:"cf"},
  {id:"wod",    name:"WOD",          icon:"", color:"#0a7aff", type:"cf"},
];

const SKILL_SEED = [
  {id:"cal1",nombre:"Muscle Up",      icon:"",niveles:["Negativas","Ring rows+dips","Kipping MU","Strict MU","Weighted MU"]},
  {id:"cal2",nombre:"Handstand/HSPU", icon:"",niveles:["Contra pared","Libre 5s","Libre 15s","1 HSPU asist.","HSPU estricto","HSPU déficit"]},
  {id:"cal3",nombre:"Front Lever",    icon:"",niveles:["Tucked","Tucked avanz.","Una pierna","Straddle","Full FL"]},
  {id:"cal4",nombre:"Pistol Squat",   icon:"",niveles:["Con banda","Con apoyo","Completo","Con lastre"]},
  {id:"cal5",nombre:"Planche",        icon:"",niveles:["Lean","Tucked","Adv. tucked","Straddle","Full planche"]},
  {id:"cal6",nombre:"L-sit",          icon:"",niveles:["5s","10s","20s","30s+"]},
  {id:"cal7",nombre:"Dominadas lastre",icon:"",niveles:["Max reps","5kg","10kg","15kg","20kg+"]},
  {id:"cal8",nombre:"Dips con lastre",icon:"",niveles:["Max reps","10kg","20kg","30kg","40kg+"]},
];
const PL_SEED = [
  {id:"pl1",nombre:"Snatch (Arrancada)",icon:"",niveles:[]},
  {id:"pl2",nombre:"Clean & Jerk",      icon:"",niveles:[]},
  {id:"pl3",nombre:"Power Clean",        icon:"",niveles:[]},
  {id:"pl4",nombre:"Power Snatch",       icon:"",niveles:[]},
  {id:"pl5",nombre:"Clean Pull",         icon:"",niveles:[]},
  {id:"pl6",nombre:"Snatch Pull",        icon:"",niveles:[]},
  {id:"pl7",nombre:"Front Squat",        icon:"",niveles:[]},
  {id:"pl8",nombre:"Overhead Squat",     icon:"",niveles:[]},
];
const WOD_SEED = [];

const PLANOS_SEED = {
  A:{nombre:"Espalda / Bíceps",color:"#0a7aff",ejercicios:[
    {id:"a1",nombre:"Barra fija con lastre",grupo:"Espalda",series:4,reps:"4-6",descanso:90},
    {id:"a2",nombre:"Pulldown en Polia",    grupo:"Espalda",series:4,reps:"10-8-8-6",descanso:60},
    {id:"a3",nombre:"Remada Landmine",      grupo:"Espalda",series:3,reps:"12-10-10",descanso:60},
    {id:"a4",nombre:"Bícep 7/21",           grupo:"Bíceps", series:3,reps:"21",descanso:60},
    {id:"a5",nombre:"Curl polea baja",      grupo:"Bíceps", series:3,reps:"12-10-10",descanso:60},
  ]},
  B:{nombre:"Pecho / Hombros / Tríceps",color:"#0a7aff",ejercicios:[
    {id:"b1",nombre:"Supino plano barra",    grupo:"Pecho",  series:4,reps:"4-6",descanso:90},
    {id:"b2",nombre:"Press cerrado barra",   grupo:"Tríceps",series:3,reps:"8-10",descanso:75},
    {id:"b3",nombre:"Supino inclinado halt.",grupo:"Pecho",  series:3,reps:"10-8-8",descanso:60},
    {id:"b4",nombre:"Press militar máquina", grupo:"Hombros",series:3,reps:"10-8-8",descanso:75},
    {id:"b5",nombre:"Elevación lateral",     grupo:"Hombros",series:2,reps:"12-10",descanso:60},
    {id:"b6",nombre:"Elevación posterior",   grupo:"Hombros",series:2,reps:"12-10",descanso:60},
    {id:"b7",nombre:"Pec Fly / Crossover",   grupo:"Pecho",  series:3,reps:"12-10-10",descanso:60},
    {id:"b8",nombre:"Trícep francés cuerda", grupo:"Tríceps",series:2,reps:"12-10",descanso:60},
  ]},
  C:{nombre:"Piernas / Core",color:"#0a7aff",ejercicios:[
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
// ── STORAGE ───────────────────────────────────────────────────────────────────
function load(k){try{const r=localStorage.getItem(k);return r?JSON.parse(r):null;}catch{return null;}}
function save(k,v){
  try{
    localStorage.setItem(k,JSON.stringify(v));
  }catch(e){
    // QuotaExceededError — notify once, don't crash
    if(e && (e.name==="QuotaExceededError"||e.code===22)){
      pushToast({type:"error",text:"Almacenamiento lleno. Exporta los datos y libera espacio."});
    }
  }
}
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

// Safety helpers ─────────────────────────────────────
// safeArr: always returns an array, never null/undefined/non-array
function safeArr(x){ return Array.isArray(x)?x:[]; }
// safeNum: parseFloat with fallback; returns fallback if NaN/null/undefined
function safeNum(x,fallback=0){ const n=parseFloat(x); return isFinite(n)?n:fallback; }
// safeMax: Math.max on non-empty array; returns fallback on empty or all-NaN
function safeMax(arr,fallback=0){ const a=safeArr(arr).map(Number).filter(isFinite); return a.length?Math.max(...a):fallback; }
// safeMin: same for min
function safeMin(arr,fallback=0){ const a=safeArr(arr).map(Number).filter(isFinite); return a.length?Math.min(...a):fallback; }
// safeDate: milliseconds between two YYYY-MM-DD strings; returns NaN-safe 0
function safeWeeksBetween(d1,d2){
  if(!d1||!d2) return 0;
  const ms=new Date(d2)-new Date(d1);
  return isFinite(ms)?Math.max(0,Math.floor(ms/(7*24*3600*1000))):0;
}

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
        byDate[e.fecha].set("gym_"+info.key,{tabId:"gym_"+info.key,tabName:"Gym",icon:"",color:info.color,planoKey:info.key});
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
  const allEjs=Object.values(planos).flatMap(p=>safeArr(p?.ejercicios));
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
  // Returns a plain object — caller is responsible for serialisation
  const data={};
  Object.entries(K).forEach(([k,v])=>{const d=load(v);if(d!==null)data[k]=d;});
  ["pg_sup_done"].forEach(k=>{const d=load(k);if(d!==null)data[k]=d;});
  loadTabs().forEach(t=>{
    const ej=load(tabEjKey(t.id));if(ej!==null)data[tabEjKey(t.id)]=ej;
    const td=load(tabDataKey(t.id));if(td!==null)data[tabDataKey(t.id)]=td;
  });
  return data; // plain object, not a string
}
function importData(file,onDone){
  const reader=new FileReader();
  reader.onerror=()=>onDone({ok:false,reason:"read_error"});
  reader.onload=e=>{
    try{
      const raw=e.target?.result;
      if(!raw) return onDone({ok:false,reason:"empty"});
      const p=JSON.parse(raw);
      // Accept both {version, data:{...}} and legacy {data:{...}} shapes
      const data=p?.data;
      if(!data||typeof data!=="object"||Array.isArray(data)){
        return onDone({ok:false,reason:"no_data"});
      }
      const keys=Object.keys(data);
      if(keys.length===0) return onDone({ok:false,reason:"empty_data"});
      // Only write keys that look like app keys (strings, non-empty values)
      let written=0;
      keys.forEach(k=>{
        if(typeof k==="string"&&k.length>0&&data[k]!==undefined){
          save(k,data[k]);written++;
        }
      });
      onDone({ok:true,count:written,version:p.version||1});
    }catch{
      onDone({ok:false,reason:"parse_error"});
    }
  };
  reader.readAsText(file);
}

function getInsight(data,unit){
  if(!data||data.length<2) return null;
  const vals=data.map(d=>safeNum(d.val,null)).filter(v=>v!==null);
  if(vals.length<2) return null;
  const first=vals[0],last=vals[vals.length-1],total=last-first;
  // safeWeeksBetween guards against missing/malformed fecha strings
  const weeks=Math.max(1,safeWeeksBetween(data[0].fecha, data[data.length-1].fecha));
  const perMonth=((total/weeks)*4).toFixed(1);
  const last3=vals.slice(-3);
  const stalled=last3.length>=3&&last3[last3.length-1]<=last3[0];
  const isRecord=last>=safeMax(vals,last); // safeMax avoids Math.max(...[]) crash
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
  return <div onClick={onClick} style={{
    background:C.card,
    border:`1px solid ${C.border}`,
    borderRadius:12,
    padding:16,
    boxShadow:C.shadow,
    cursor:onClick?"pointer":"default",
    ...style
  }}>{children}</div>;
}
function Btn({children,onClick,color,outline=false,style={}}){
  const bg=color||C.accent;
  return <button onClick={onClick} style={{
    background:outline?"transparent":bg,
    color:outline?bg:"#fff",
    border:`1px solid ${outline?bg+"55":bg}`,
    borderRadius:8,
    padding:"10px 18px",
    fontSize:13,
    fontWeight:500,
    cursor:"pointer",
    letterSpacing:-0.1,
    lineHeight:1.4,
    ...style
  }}>{children}</button>;
}
function Input({value,onChange,type="number",placeholder,style={},onEnter}){
  return <input
    type={type} value={value} onChange={onChange} placeholder={placeholder}
    onKeyDown={onEnter?e=>{if(e.key==="Enter"){e.preventDefault();onEnter();}}:undefined}
    style={{
      background:C.surface,
      border:`1px solid ${C.border}`,
      borderRadius:8,
      color:C.text,
      padding:"10px 14px",
      fontSize:13,
      width:"100%",
      boxSizing:"border-box",
      outline:"none",
      WebkitAppearance:"none",
      ...style
    }}
  />;
}
function Tag({children,color}){
  return <span style={{
    background:color+"16",
    color,
    fontSize:10,
    letterSpacing:0,
    padding:"2px 7px",
    borderRadius:6,
    fontWeight:500,
    display:"inline-flex",
    alignItems:"center",
  }}>{children}</span>;
}
function BackBtn({onClick}){
  return <button onClick={onClick} style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:12,marginBottom:16,padding:0,letterSpacing:-0.1,display:"flex",alignItems:"center",gap:4}}>
    ‹ Volver
  </button>;
}
function SectionLabel({children,style={}}){
  return <p style={{color:C.textMuted,fontSize:10,letterSpacing:1.2,textTransform:"uppercase",margin:"0 0 10px",fontWeight:500,...style}}>{children}</p>;
}
function SavedBadge({color}){
  return <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,padding:"5px 10px",marginBottom:10,color:C.textMuted,fontSize:11,fontWeight:400}}>Guardado</div>;
}
function ProgressBar({pct,color,height=3}){
  return <div style={{background:C.border,borderRadius:height,height,overflow:"hidden"}}>
    <div style={{background:color,borderRadius:height,height,width:`${Math.min(100,pct)}%`,transition:"width 0.4s ease"}}/>
  </div>;
}
function InsightBox({data,unit}){
  const ins=getInsight(data,unit);
  if(!ins) return null;
  const c={success:C.green,warn:C.orange,info:C.textMuted}[ins.type]||C.textMuted;
  const prefix={success:"↑",warn:"↓",info:"·"}[ins.type]||"·";
  return <div style={{marginTop:10,padding:"8px 12px",background:C.surface,borderRadius:6,borderLeft:`2px solid ${c}`}}>
    <p style={{color:c,fontSize:11,margin:0,fontWeight:400,letterSpacing:-0.1}}>{prefix} {ins.text}</p>
  </div>;
}
function BarChart({data,color,unit="kg"}){
  if(!data||data.length<2) return <p style={{color:C.textMuted,fontSize:12,textAlign:"center",padding:"16px 0"}}>Necesitas al menos 2 registros.</p>;
  const vals=data.map(d=>safeNum(d.val,null)).filter(v=>v!==null);
  if(!vals.length) return <p style={{color:C.textMuted,fontSize:11,padding:"16px 0",textAlign:"center"}}>Sin datos numéricos.</p>;
  const max=safeMax(vals,0),min=safeMin(vals,0),range=max-min||1;
  return(<div>
    <div style={{display:"flex",alignItems:"flex-end",gap:4,height:72}}>
      {data.slice(-14).map((d,i)=>{
        const isLast=i===data.slice(-14).length-1,ht=Math.max(6,((d.val-min)/range)*60+6);
        return <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
          {isLast&&<p style={{color:C.textSub,fontSize:10,margin:0,fontWeight:500}}>{d.val}{unit}</p>}
          <div style={{width:"100%",height:ht,background:isLast?color:C.border,borderRadius:"3px 3px 0 0",transition:"height 0.3s ease"}}/>
        </div>;
      })}
    </div>
    <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
      <p style={{color:C.textMuted,fontSize:10,margin:0}}>{fmt(data[Math.max(0,data.length-14)].fecha)}</p>
      <p style={{color:C.textMuted,fontSize:10,margin:0}}>{fmt(data[data.length-1].fecha)}</p>
    </div>
  </div>);
}

// ── CONFIRM DIALOG ────────────────────────────────────────────────────────────
function ConfirmDialog({msg,onConfirm,onCancel}){
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:"0 0 20px"}}>
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:20,maxWidth:480,width:"calc(100% - 32px)"}}>
      <p style={{color:C.text,fontSize:15,fontWeight:600,margin:"0 0 6px",letterSpacing:-0.3}}>Confirmar acción</p>
      <p style={{color:C.textSub,fontSize:13,margin:"0 0 18px",lineHeight:1.5}}>{msg}</p>
      <div style={{display:"flex",gap:8}}>
        <button onClick={onCancel} style={{flex:1,background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.textSub,padding:"10px",cursor:"pointer",fontSize:13,fontWeight:500}}>Cancelar</button>
        <Btn onClick={onConfirm} color={C.red} style={{flex:1,padding:"10px",justifyContent:"center"}}>Eliminar</Btn>
      </div>
    </div>
  </div>;
}

// ── REST TIMER ────────────────────────────────────────────────────────────────
function RestTimer({seconds,onClose}){
  const endAtRef=useRef(Date.now()+seconds*1000);
  const [initSecs,setInitSecs]=useState(seconds);
  const [remaining,setRemaining]=useState(seconds);

  // Recalculate from wall clock on every tick AND on visibility change
  function recalc(){
    const r=Math.max(0,Math.round((endAtRef.current-Date.now())/1000));
    setRemaining(r);
    if(r<=0) onClose();
  }

  useEffect(()=>{
    const id=setInterval(recalc,500);
    document.addEventListener("visibilitychange",recalc);
    return()=>{clearInterval(id);document.removeEventListener("visibilitychange",recalc);};
  },[]);

  function reset(s){
    setInitSecs(s);
    endAtRef.current=Date.now()+s*1000;
    setRemaining(s);
  }

  const pct=Math.min(100,((initSecs-remaining)/initSecs)*100);
  const color=remaining<=10?C.red:remaining<=20?C.orange:C.green;
  const mins=Math.floor(remaining/60),secs=remaining%60;
  return <div style={{position:"fixed",bottom:90,left:"50%",transform:"translateX(-50%)",background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 20px",zIndex:200,minWidth:220}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
      <p style={{color:C.textMuted,fontSize:10,letterSpacing:1.2,textTransform:"uppercase",margin:0,fontWeight:500}}>Descanso</p>
      <button onClick={onClose} style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:14,padding:0}}>✕</button>
    </div>
    <p style={{color:remaining<=10?C.red:C.text,fontSize:40,fontWeight:700,margin:"0 0 10px",textAlign:"center",fontFamily:"-apple-system,monospace",letterSpacing:-0.5,transition:"color 0.3s"}}>
      {mins>0?`${mins}:${String(secs).padStart(2,"0")}`:String(secs).padStart(2,"0")}
    </p>
    <ProgressBar pct={pct} color={remaining<=10?C.red:C.accent} height={3}/>
    <div style={{display:"flex",gap:5,marginTop:10}}>
      {[30,45,60,90].map(s=>(
        <button key={s} onClick={()=>reset(s)} style={{flex:1,background:initSecs===s?C.border:"transparent",color:initSecs===s?C.text:C.textMuted,border:`1px solid ${C.border}`,borderRadius:6,padding:"5px 0",fontSize:11,cursor:"pointer",fontWeight:initSecs===s?600:400}}>{s}s</button>
      ))}
    </div>
  </div>;
}

// ── SESSION TIMER (count up) ──────────────────────────────────────────────────
function SessionTimer({color,autoStart=false,onStarted}){
  const [active,setActive]=useState(false);
  const [seconds,setSeconds]=useState(0);
  const startAtRef=useRef(null);

  function recalc(){
    if(!startAtRef.current) return;
    setSeconds(Math.round((Date.now()-startAtRef.current)/1000));
  }

  useEffect(()=>{
    if(autoStart&&!active){
      startAtRef.current=Date.now();
      setActive(true);
      onStarted&&onStarted();
    }
  },[autoStart]);

  useEffect(()=>{
    if(!active) return;
    if(!startAtRef.current) startAtRef.current=Date.now();
    const id=setInterval(recalc,1000);
    document.addEventListener("visibilitychange",recalc);
    return()=>{clearInterval(id);document.removeEventListener("visibilitychange",recalc);};
  },[active]);

  function toggle(){
    if(active){setActive(false);setSeconds(0);startAtRef.current=null;}
    else{startAtRef.current=Date.now();setActive(true);}
  }

  const mins=Math.floor(seconds/60),secs=seconds%60;
  return <button onClick={toggle} style={{background:active?color+"22":C.surface,border:`1px solid ${active?color:C.border}`,borderRadius:8,padding:"5px 12px",cursor:"pointer",color:active?color:C.textMuted,fontSize:12,fontWeight:active?600:400}}>
    {active?`${String(mins).padStart(2,"0")}:${String(secs).padStart(2,"0")}`:"Iniciar"}
  </button>;
}
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
    <p style={{color:C.textMuted,fontSize:10,textTransform:"uppercase",letterSpacing:1.2,margin:"0 0 8px"}}>Registro de sesión</p>
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
            return <button key={n} onClick={()=>setRpe(r=>r===n?null:n)} style={{flex:1,background:rpe===n?rc:C.surface,color:rpe===n?"#000":C.textMuted,border:`1px solid ${rpe===n?rc:C.border}`,borderRadius:6,padding:"5px 2px",cursor:"pointer",fontSize:10,fontWeight:rpe===n?700:400}}>{n}</button>;
          })}
        </div>
      </div>
    </div>
    <Btn onClick={handleSave} color={color} style={{width:"100%",padding:"8px"}}>{saved?"✓ Guardado":" Guardar sesión"}</Btn>
  </div>;
}

// ── CF PANEL (generic: Skills, Power Lifting, WOD, custom) ───────────────────
function CFPanel({tab,onDeleteTab,autoStart=false,onSessionStarted}){
  const [exercises,setExercises]=useState(()=>loadTabEjs(tab.id));
  const [data,setData]=useState(()=>load(tabDataKey(tab.id))||{});
  const [mode,setMode]=useState("list"); // list | session | detail
  const [sessionEjs,setSessionEjs]=useState([]);
  const [sessionInputs,setSessionInputs]=useState({});
  const [detailId,setDetailId]=useState(null);
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
    saveExercises([...exercises,{id,nombre:newName.trim(),icon:"",niveles:[]}]);
    setNewName("");setAddOpen(false);
  }

  function deleteExercise(id){
    const ejName=exercises.find(e=>e.id===id)?.nombre||"Ejercicio";
    setConfirm({msg:`Eliminar "${ejName}" y todo su historial. No se puede deshacer.`,onConfirm:()=>{
      saveExercises(exercises.filter(e=>e.id!==id));
      const d={...data};delete d[id];saveData(d);
      setSessionEjs(s=>s.filter(x=>x!==id));
      pushToast({type:"warning",text:`"${ejName}" eliminado · historial conservado`});
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
            {maxVal&&<p style={{color,fontSize:13,margin:"4px 0 0"}}> Máximo: <strong>{maxVal}</strong></p>}
          </div>
          <button onClick={()=>deleteExercise(detailId)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,color:C.textMuted,padding:"6px 10px",cursor:"pointer",fontSize:12}}> Eliminar</button>
        </div>
        {pct>0&&<div style={{marginTop:10}}><ProgressBar pct={pct} color={color} height={3}/></div>}
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
              <button onClick={()=>updateNiveles(detailId,niveles.filter((_,idx)=>idx!==i))} style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:13}}>✕</button>
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
                  <p style={{color:C.textMuted,fontSize:11,margin:"0 0 2px"}}>{fmt(h.fecha)}</p>
                  {h.series&&<p style={{color:C.textMuted,fontSize:11,margin:0}}>{h.series}</p>}
                  {h.wod&&(()=>{
                    // Parse "TIPO: RESULTADO · RPE X/10" stored in h.wod
                    const parts=h.wod.split(" · ");
                    const mainPart=parts[0]||"";
                    const rpePart=parts.find(p=>p.startsWith("RPE"))||null;
                    const colonIdx=mainPart.indexOf(":");
                    const tipo=colonIdx>=0?mainPart.slice(0,colonIdx).trim():null;
                    const resultado=colonIdx>=0?mainPart.slice(colonIdx+1).trim():mainPart;
                    return <div style={{marginTop:3}}>
                      {tipo&&<p style={{color:C.textMuted,fontSize:10,textTransform:"uppercase",letterSpacing:1.2,margin:"0 0 2px"}}>{tipo}</p>}
                      <p style={{color:C.text,fontSize:12,fontWeight:500,margin:0}}>{resultado}</p>
                      {rpePart&&<p style={{color:C.textMuted,fontSize:10,margin:"2px 0 0"}}>{rpePart}</p>}
                    </div>;
                  })()}
                  {!h.wod&&h.nota&&<p style={{color:C.textMuted,fontSize:11,margin:"3px 0 0",fontStyle:"italic"}}>"{h.nota}"</p>}
                </div>
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  {h.val!==null&&h.val!==undefined&&<span style={{color:i===0?color:C.textSub,fontSize:14,fontWeight:i===0?700:400}}>{h.val}</span>}
                  {h.nivel!==null&&h.nivel!==undefined&&<span style={{color:i===0?color:C.textSub,fontSize:13,fontWeight:i===0?700:400}}>Nv.{h.nivel+1}</span>}
                  <button onClick={()=>{setEditEntry(i);setEditVal(h.val||"");}} style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:13}}>✏️</button>
                  <button onClick={()=>deleteEntry(detailId,i)} style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:13}}></button>
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
          <SessionTimer color={color} autoStart={autoStart} onStarted={onSessionStarted}/>
          <Tag color={color}>{savedCount}/{sessionEjs.length}</Tag>
        </div>
      </div>
      {restTimer&&<RestTimer seconds={restTimer} onClose={()=>setRestTimer(null)}/>}
      {/* WOD session result — shown for WOD tab, applies to whole session */}
      {tab.id==="wod"&&<Card style={{marginBottom:12,background:color+"0e",border:`1px solid ${color}33`}}>
        <p style={{color:C.textSub,fontSize:11,fontWeight:500,margin:"0 0 10px"}}> Resultado del WOD</p>
        <div style={{display:"flex",gap:8,marginBottom:8}}>
          <div style={{flex:1}}>
            <p style={{color:C.textMuted,fontSize:10,margin:"0 0 4px",textTransform:"uppercase",letterSpacing:1.2}}>Tipo</p>
            <select value={wodSessionType} onChange={e=>setWodSessionType(e.target.value)} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,color:C.text,padding:"10px 14px",fontSize:13,width:"100%"}}>
              <option value="">— Seleccionar —</option>
              {["AMRAP","For Time","EMOM","Chipper","Ladder","Hero WOD"].map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={{flex:1}}>
            <p style={{color:C.textMuted,fontSize:10,margin:"0 0 4px",textTransform:"uppercase",letterSpacing:1.2}}>Resultado</p>
            <Input type="text" value={wodSessionResult} onChange={e=>setWodSessionResult(e.target.value)} placeholder="Ej: 4:32 · 12rds · 185reps"/>
          </div>
        </div>
        <div style={{marginTop:8}}>
          <p style={{color:C.textMuted,fontSize:10,margin:"0 0 5px",textTransform:"uppercase",letterSpacing:1.2}}>RPE del WOD</p>
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
        return <div key={ejId} style={{background:done?color+"12":C.card,border:`1px solid ${done?color+"35":C.border}`,borderRadius:12,padding:14,marginBottom:12,transition:"all 0.2s"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
            <p style={{color:done?C.textMuted:C.text,fontSize:14,fontWeight:500,margin:0}}>{ej.icon} {ej.nombre}</p>
            {maxVal&&<Tag color={color}> {maxVal}</Tag>}
          </div>
          {lastVal&&!done&&<p style={{color:C.textMuted,fontSize:11,margin:"0 0 10px"}}> Objetivo: <strong>{(lastVal+2.5).toFixed(1)}</strong></p>}
          {!done&&<>
            {niveles.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:8}}>
              {niveles.map((n,i)=>(
                <button key={i} onClick={()=>setSessionInputs(s=>({...s,[ejId]:{...s[ejId],nivel:i}}))} style={{background:inp.nivel===i?color:C.surface,color:inp.nivel===i?"#000":C.textSub,border:`1px solid ${inp.nivel===i?color:C.borderLight}`,borderRadius:8,padding:"5px 10px",fontSize:10,cursor:"pointer",fontWeight:inp.nivel===i?700:400}}>{i+1}. {n}</button>
              ))}
            </div>}
            <div style={{display:"flex",gap:8,marginBottom:8}}>
              <div style={{flex:1}}>
                <p style={{color:C.textMuted,fontSize:10,margin:"0 0 4px",textTransform:"uppercase",letterSpacing:1.2}}>kg / reps</p>
                <Input value={inp.val||""} onChange={e=>setSessionInputs(s=>({...s,[ejId]:{...s[ejId],val:e.target.value}}))} placeholder={lastVal?`Último: ${lastVal}`:"Ej: 80"}/>
              </div>
              <div style={{flex:1}}>
                <p style={{color:C.textMuted,fontSize:10,margin:"0 0 4px",textTransform:"uppercase",letterSpacing:1.2}}>Series × kg</p>
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
              <button onClick={()=>setRestTimer(60)} style={{background:color+"28",border:`1px solid ${color}44`,borderRadius:8,color:C.text,padding:"10px 14px",cursor:"pointer",fontSize:12,fontWeight:700}}>⏱</button>
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
            pushToast({type:"success",text:`WOD guardado${wodSessionType?` · ${wodSessionType}`:""}${wodRPE?` · RPE ${wodRPE}/10`:""}`});
            setWodSessionType("");setWodSessionResult("");setWodRPE(null);
          }} color={color} style={{width:"100%"}}>Guardar resultado</Btn>
        </div>
      )}
    </div>;
  }

  // ── LIST ──
  return <div>
    {confirm&&<ConfirmDialog msg={confirm.msg} onConfirm={confirm.onConfirm} onCancel={()=>setConfirm(null)}/>}
    <Card style={{marginBottom:16,background:color+"0e",border:`1px solid ${color}33`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
        <p style={{color:C.text,fontSize:13,fontWeight:500,margin:0}}>{tab.icon} {tab.name}</p>
        <SessionTimer color={color} autoStart={autoStart} onStarted={onSessionStarted}/>
      </div>
      {tab.id==="powerlifting"&&<div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 10px",marginBottom:10,display:"flex",gap:8,alignItems:"center"}}>
        <span style={{fontSize:14}}>!</span>
        <p style={{color:C.textMuted,fontSize:11,margin:0}}>Calentamiento: — 5-10min movilidad + series progresivas al 40-60% del peso objetivo.</p>
      </div>}
      {tab.id==="skills"&&<SkillsSessionTracker color={color} tab={tab}/>}
      <p style={{color:C.textSub,fontSize:12,margin:"0 0 4px"}}>Selecciona los ejercicios de hoy:</p>
      <p style={{color:C.textMuted,fontSize:10,margin:"0 0 12px",fontStyle:"italic"}}>Mantén pulsado un ejercicio para eliminarlo</p>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
        {exercises.map(ej=><ExerciseChip key={ej.id} ej={ej} selected={sessionEjs.includes(ej.id)} color={color} onSelect={id=>setSessionEjs(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id])} onDelete={deleteExercise}/>)}
      </div>
      {sessionEjs.length>0&&<Btn onClick={()=>{setMode("session");setSessionInputs({});}} color={color} style={{width:"100%",marginBottom:8}}>Empezar ({sessionEjs.length} ejercicios)</Btn>}
      {!addOpen?(
        <button onClick={()=>setAddOpen(true)} style={{background:"none",border:`1px dashed ${C.border}`,borderRadius:8,color:C.textMuted,width:"100%",padding:"8px",cursor:"pointer",fontSize:12}}>+ Añadir ejercicio</button>
      ):(
        <div style={{display:"flex",gap:6}}>
          <Input type="text" value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Nombre del ejercicio..." style={{flex:1}}/>
          <Btn onClick={addExercise} color={color} style={{padding:"11px 12px",whiteSpace:"nowrap"}}>✓</Btn>
          <button onClick={()=>setAddOpen(false)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:10,color:C.textMuted,padding:"11px 10px",cursor:"pointer",fontSize:12}}>✕</button>
        </div>
      )}
    </Card>
    <p style={{color:C.textMuted,fontSize:10,letterSpacing:1.2,margin:"0 0 8px",fontStyle:"italic"}}>Mantén pulsado un ejercicio para eliminarlo</p>
    <SectionLabel>Historial por ejercicio</SectionLabel>
    {/* WOD session results shown separately */}
    {tab.id==="wod"&&(()=>{
      const wodKeys=Object.keys(data).filter(k=>k.startsWith("wod_session_"));
      if(!wodKeys.length) return null;
      const results=wodKeys.flatMap(k=>data[k]).sort((a,b)=>b.fecha.localeCompare(a.fecha)).slice(0,10);
      return <Card style={{marginBottom:12,background:color+"0a",border:`1px solid ${color}33`}}>
        <p style={{color:C.textSub,fontSize:11,fontWeight:500,margin:"0 0 10px"}}>Resultados WOD</p>
        {results.map((r,i)=>(
          <div key={i} style={{padding:"9px 0",borderBottom:i<results.length-1?`1px solid ${C.border}`:"none"}}>
            <p style={{color:C.textMuted,fontSize:11,margin:"0 0 3px"}}>{fmt(r.fecha)}</p>
            {(()=>{
              const raw=r.wod||r.nota||"";
              if(!raw) return <p style={{color:C.textMuted,fontSize:12,margin:0}}>—</p>;
              const parts=raw.split(" · ");
              const mainPart=parts[0]||"";
              const rpePart=parts.find(p=>p.startsWith("RPE"))||null;
              const colonIdx=mainPart.indexOf(":");
              const tipo=colonIdx>=0?mainPart.slice(0,colonIdx).trim():null;
              const resultado=colonIdx>=0?mainPart.slice(colonIdx+1).trim():mainPart;
              return <div>
                {tipo&&<p style={{color:C.textMuted,fontSize:10,textTransform:"uppercase",letterSpacing:1.2,margin:"0 0 1px"}}>{tipo}</p>}
                <p style={{color:C.text,fontSize:13,fontWeight:500,margin:0}}>{resultado}</p>
                {rpePart&&<p style={{color:C.textMuted,fontSize:10,margin:"2px 0 0"}}>{rpePart}</p>}
              </div>;
            })()}
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
          {maxVal?<><p style={{color:C.text,fontSize:15,fontWeight:600,margin:0}}>{maxVal}</p>{delta!==null&&<p style={{color:delta>=0?C.green:C.red,fontSize:10,margin:0}}>{delta>=0?"▲":"▼"}{Math.abs(delta)}</p>}</>:<p style={{color:C.textMuted,fontSize:12,margin:0}}>Sin registro</p>}
        </div>
      </div>;
    })}
    {/* Delete tab button */}
    <div style={{marginTop:20,paddingTop:16,borderTop:`1px solid ${C.border}`}}>
      <button onClick={()=>{if(onDeleteTab)onDeleteTab(tab.id);}} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:10,color:C.red,width:"100%",padding:"10px",cursor:"pointer",fontSize:13,fontWeight:600}}>
         Eliminar pestaña "{tab.name}"
      </button>
    </div>
  </div>;
}

// ── GYM PANEL ─────────────────────────────────────────────────────────────────
function GymPanel({initPlanoKey=null,autoStart=false,onSessionStarted}){
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
  const [addingPlano,setAddingPlano]=useState(false);
  const [newPlanoName,setNewPlanoName]=useState("");

  const plano=planos[planoSel]||Object.values(planos)[0]||{ejercicios:[],color:C.accent,nombre:"Plano"};

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
    const ejName=planos[planoSel]?.ejercicios.find(e=>e.id===ejId)?.nombre||"Ejercicio";
    setConfirm({msg:`Se eliminará "${ejName}" del plano. Los registros anteriores se conservan.`,onConfirm:()=>{
      const p=planos[planoSel];
      savePlanos({...planos,[planoSel]:{...p,ejercicios:p.ejercicios.filter(e=>e.id!==ejId)}});
      setConfirm(null);
      pushToast({type:"warning",text:`"${ejName}" eliminado del plano`});
    }});
  }

  function handleConfirmSerie(ejId,descanso){if(descanso) setTimerSecs({ejId,secs:descanso});}

  function handleSaveEj(ejId,descanso,numSeries){
    const arr=seriesInputs[ejId]||[];
    const vals=arr.map(v=>parseFloat(v)).filter(v=>!isNaN(v)&&v>0);
    if(vals.length<numSeries) return;
    const maxKg=Math.max(...vals);
    const ejName=plano.ejercicios.find(e=>e.id===ejId)?.nombre||"Ejercicio";
    const prev=(cargas[ejId]||[]).slice(-1)[0]?.kg;
    const trend=prev?maxKg>prev?" ↑":maxKg<prev?" ↓":"":"";
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
        const doneCount=pl.ejercicios.length;
        pushToast({
          type:"success",
          duration:5000,
          text:`Sesión ${planoSel} completada · ${doneCount} ejercicio${doneCount>1?"s":""}${sessionRPE?` · RPE ${sessionRPE}/10`:""}`,
        });
      }
      return next;
    });
  }

  function deleteCargas(ejId,idx){
    const ejName=plano.ejercicios.find(e=>e.id===ejId)?.nombre||"Ejercicio";
    const entry=(cargas[ejId]||[])[cargas[ejId]?.length-1-idx];
    const detail=entry?` (${entry.fecha} · ${entry.kg}kg)`:"";
    setConfirm({msg:`Eliminar registro de "${ejName}"${detail}. Esta acción no se puede deshacer.`,onConfirm:()=>{
      const arr=[...(cargas[ejId]||[])];arr.splice(arr.length-1-idx,1);
      saveCargas({...cargas,[ejId]:arr});setConfirm(null);
      pushToast({type:"warning",text:`Registro eliminado · ${ejName}${detail}`});
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
            <div key={k}><p style={{color:C.textMuted,fontSize:10,margin:"0 0 2px"}}>{k}</p><p style={{color:C.text,fontSize:15,fontWeight:600,margin:0}}>{v}</p></div>
          ))}
        </div>
      </Card>
      {chartData.length>1&&<Card style={{marginBottom:14}}>
        <SectionLabel>Progresión de carga</SectionLabel>
        <BarChart data={chartData} color={plano.color}/>
        <InsightBox data={chartData} unit="kg"/>
      </Card>}
      {(()=>{
        const planoKey=Object.entries(planos).find(([,p])=>safeArr(p.ejercicios).some(e=>e.id===histEj))?.[0];
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
            {(()=>{const n=safeNum(avg3,null);if(n===null)return "";return n>=8?" — alta fatiga, considera reducir carga":n<=5?" — margen disponible, puedes progresar":"";})()}
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
                <p style={{color:C.textMuted,fontSize:11,margin:"0 0 2px"}}>{fmt(h.fecha)}</p>
                {safeArr(h.series).length>0&&<p style={{color:C.textMuted,fontSize:11,margin:0}}>Series: {safeArr(h.series).join(" · ")}kg</p>}
                {(()=>{
                  const planoKey=Object.entries(loadGymPlanos()).find(([,p])=>safeArr(p.ejercicios).some(e=>e.id===histEj))?.[0];
                  const rpe=planoKey?getRPE(h.fecha,planoKey):null;
                  const nota=(load(K.snota)||{})[`${h.fecha}_${planoKey}`]||null;
                  return <>{rpe&&<p style={{color:C.textMuted,fontSize:10,margin:"2px 0 0"}}>RPE {rpe}/10</p>}{nota&&<p style={{color:C.textMuted,fontSize:10,margin:"1px 0 0",fontStyle:"italic"}}>"{nota}"</p>}</>;
                })()}
                {h.nota&&<p style={{color:C.textMuted,fontSize:11,margin:"2px 0 0",fontStyle:"italic"}}>"{h.nota}"</p>}
              </div>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <p style={{color:i===0?plano.color:C.textSub,fontSize:14,fontWeight:i===0?700:400,margin:0}}>{h.kg}kg</p>
                <button onClick={()=>{setEditEntry(i);setEditEntryVal(h.kg);}} style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:13}}>✏️</button>
                <button onClick={()=>deleteCargas(histEj,i)} style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:13}}></button>
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
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:18,marginBottom:16,boxShadow:C.shadow}}>
        <p style={{color:C.textMuted,fontSize:10,letterSpacing:1.2,textTransform:"uppercase",margin:"0 0 6px",fontWeight:500}}>Sesión completada</p>
        <p style={{color:C.text,fontSize:18,fontWeight:700,margin:"0 0 6px",letterSpacing:-0.3}}>Plano {planoSel} · {plano.nombre}</p>
        <div style={{display:"flex",gap:12,margin:"4px 0 12px",flexWrap:"wrap"}}>
          {sessionRPE&&<Tag color={sessionRPE<=5?C.green:sessionRPE<=8?C.orange:C.red}>RPE {sessionRPE}/10</Tag>}
          {sessionNota&&<p style={{color:C.textSub,fontSize:12,margin:0,fontStyle:"italic"}}>"{sessionNota}"</p>}
        </div>
        <div style={{display:"flex",gap:16}}>
          <div><p style={{color:C.text,fontSize:22,fontWeight:700,margin:0}}>{mejoras}</p><p style={{color:C.textMuted,fontSize:11,margin:0}}>Mejoras</p></div>
          <div><p style={{color:C.textSub,fontSize:22,fontWeight:700,margin:0}}>{records}</p><p style={{color:C.textMuted,fontSize:11,margin:0}}>Récords</p></div>
          <div><p style={{color:C.textMuted,fontSize:22,fontWeight:700,margin:0}}>{items.length}</p><p style={{color:C.textMuted,fontSize:11,margin:0}}>Ejercicios</p></div>
        </div>
      </div>
      {items.map(({ej,vals,maxKg,delta,isRecord},i)=>(
        <div key={i} style={{padding:"12px 0",borderBottom:`1px solid ${C.border}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div><p style={{color:C.text,fontSize:13,fontWeight:600,margin:"0 0 2px"}}>{ej.nombre}</p><p style={{color:C.textMuted,fontSize:11,margin:0}}>Series: {vals.join(" · ")}kg</p></div>
            <div style={{textAlign:"right"}}>
              <p style={{color:C.text,fontSize:15,fontWeight:600,margin:0}}>{maxKg}kg {isRecord&&delta>0?"":""}</p>
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
          <p style={{color:C.textMuted,fontSize:10,textTransform:"uppercase",letterSpacing:1.2,margin:"0 0 8px"}}>Volumen semanal acumulado</p>
          {grupos.map(g=>{
            const sets=vol[g]||0;
            const mev=MEV[g]||6;const mav=MAV[g]||14;
            const pct=Math.min(100,Math.round((sets/mav)*100));
            const color=sets<mev?C.orange:sets<=mav?C.green:C.red;
            const label=sets<mev?`${mev-sets} para MEV`:sets<=mav?"✓ Óptimo":"Sobre MAV";
            return <div key={g} style={{marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                <p style={{color:C.textSub,fontSize:11,margin:0}}>{g}</p>
                <p style={{color:C.textMuted,fontSize:11,fontWeight:400,margin:0}}>{sets} series · {label}</p>
              </div>
              <ProgressBar pct={pct} color={color} height={4}/>
            </div>;
          })}
        </div>;
      })()}
      {/* Post-session interpretation */}
      {(()=>{
        const vol2=getWeeklyVolume();
        const exceeded=Object.entries(vol2).filter(([g,s])=>s>(MAV[g]||14)).map(([g])=>g);
        const rpe=sessionRPE||0;
        const msg=exceeded.length>0?`${exceeded.join(", ")} supera el MAV esta semana. La semana que viene reduce 2 series.`:
          rpe>=9?"Sesión muy exigente. Prioriza proteína y sueño en las próximas 48h.":
          rpe>=7&&rpe<9?"Buen estímulo. Asegura la toma post-entreno en los próximos 60 min.":
          rpe>0?"Sesión completada.":null;
        if(!msg) return null;
        return <p style={{color:C.textMuted,fontSize:11,margin:"8px 0 0",fontStyle:"italic",textAlign:"center"}}> {msg}</p>;
      })()}
      <Btn onClick={()=>{setShowSummary(false);setSessionSaved({});setSessionRPE(null);setSessionNota("");}} color={plano.color} style={{width:"100%",marginTop:12}}>Nueva sesión</Btn>
    </div>;
  }

  // ── MAIN ──
  function handleAddPlano(){
    const key=(newPlanoName.trim().toUpperCase().slice(0,2))||String.fromCharCode(65+Object.keys(planos).length);
    if(planos[key]){pushToast({type:"warning",text:`El plano "${key}" ya existe`});return;}
    const upd={...planos,[key]:{nombre:`Plano ${key}`,color:"#0a7aff",ejercicios:[]}};
    savePlanos(upd);setPlanoSel(key);setAddingPlano(false);setNewPlanoName("");
    pushToast({type:"success",text:`Plano ${key} creado`});
  }
  function handleDeletePlano(k){
    const keys=Object.keys(planos);
    if(keys.length<=1){pushToast({type:"warning",text:"Necesitas al menos un plano"});return;}
    setConfirm({msg:`Eliminar Plano ${k}. Los registros de carga se conservan.`,onConfirm:()=>{
      const upd={...planos};delete upd[k];
      savePlanos(upd);setPlanoSel(Object.keys(upd)[0]);setConfirm(null);
      pushToast({type:"warning",text:`Plano ${k} eliminado`});
    }});
  }
  return <div>
    {confirm&&<ConfirmDialog msg={confirm.msg} onConfirm={confirm.onConfirm} onCancel={()=>setConfirm(null)}/>}

    {/* STICKY REST TIMER */}
    {timerSecs&&<div style={{position:"sticky",top:60,zIndex:10,marginBottom:10}}>
      <RestTimer seconds={timerSecs.secs} onClose={()=>setTimerSecs(null)}/>
    </div>}

    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
      <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
        {Object.entries(planos).map(([k,p])=>(
          <div key={k} style={{display:"flex",alignItems:"center",gap:1}}>
            <button onClick={()=>{setPlanoSel(k);setSessionSaved({});setSeriesInputs({});setSessionRPE(null);setSessionNota("");}}
              style={{background:planoSel===k?C.accent:C.surface,color:planoSel===k?"#fff":C.textSub,border:`1px solid ${planoSel===k?C.accent:C.border}`,borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:13,fontWeight:planoSel===k?600:400,transition:"all 0.15s"}}>
              {k}
            </button>
            {planoSel===k&&Object.keys(planos).length>1&&!addingPlano&&(
              <button onClick={()=>handleDeletePlano(k)} style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:11,padding:"4px 2px",lineHeight:1}}>✕</button>
            )}
          </div>
        ))}
        {addingPlano
          ?<div style={{display:"flex",gap:4,alignItems:"center"}}>
             <input value={newPlanoName} onChange={e=>setNewPlanoName(e.target.value)} placeholder="D" maxLength={2} autoFocus
               onKeyDown={e=>{if(e.key==="Enter")handleAddPlano();if(e.key==="Escape")setAddingPlano(false);}}
               style={{width:36,background:C.surface,border:`1px solid ${C.accent}`,borderRadius:6,color:C.text,padding:"6px 8px",fontSize:13,outline:"none"}}/>
             <button onClick={handleAddPlano} style={{background:C.accent,border:"none",borderRadius:6,color:"#fff",padding:"6px 10px",cursor:"pointer",fontSize:12,fontWeight:600}}>+</button>
             <button onClick={()=>{setAddingPlano(false);setNewPlanoName("");}} style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:12}}>✕</button>
           </div>
          :<button onClick={()=>setAddingPlano(true)} style={{background:"none",border:`1px dashed ${C.border}`,borderRadius:8,color:C.textMuted,padding:"8px 10px",cursor:"pointer",fontSize:16,lineHeight:1}}>+</button>
        }
      </div>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <SessionTimer color={plano.color} autoStart={autoStart} onStarted={()=>{onSessionStarted&&onSessionStarted();}}/>
        <button onClick={()=>setEditMode(e=>!e)} title="Editar ejercicios del plano" style={{background:editMode?plano.color+"22":C.surface,color:editMode?plano.color:C.textMuted,border:`1px solid ${editMode?plano.color+"55":C.border}`,borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:11,fontWeight:editMode?700:400,opacity:0.7}}>{editMode?"✓ Listo":"✏️"}</button>
      </div>
    </div>

    {doneCount>0&&!showSummary&&<div style={{marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
        <p style={{color:C.textSub,fontSize:12,margin:0}}>{doneCount}/{plano.ejercicios.length} ejercicios</p>
        {allDone&&<Btn onClick={()=>{setShowSummary(true);}} color={plano.color} style={{padding:"5px 12px",fontSize:11}}>Ver resumen →</Btn>}
      </div>
      <ProgressBar pct={(doneCount/plano.ejercicios.length)*100} color={plano.color} height={4}/>
    </div>}

    {/* RPE de sesión — only when session started */}
    {doneCount>0&&<div style={{marginBottom:14}}>
      <p style={{color:C.textMuted,fontSize:10,letterSpacing:1.2,textTransform:"uppercase",margin:"0 0 8px"}}>RPE — Esfuerzo percibido{!sessionRPE?" (opcional)":""}</p>
      <div style={{display:"flex",gap:3}}>
        {[1,2,3,4,5,6,7,8,9,10].map(n=>{
          const rc=n<=3?C.green:n<=6?C.blue:n<=8?C.orange:C.red;
          return <button key={n} onClick={()=>setSessionRPE(n===sessionRPE?null:n)} style={{flex:1,background:sessionRPE===n?rc:C.surface,color:sessionRPE===n?"#000":C.textMuted,border:`1px solid ${sessionRPE===n?rc:C.border}`,borderRadius:6,padding:"7px 2px",cursor:"pointer",fontSize:11,fontWeight:sessionRPE===n?700:400,transition:"all 0.15s"}}>{n}</button>;
        })}
      </div>
      {sessionRPE&&<p style={{color:C.textMuted,fontSize:10,margin:"5px 0 4px",fontStyle:"italic"}}>{sessionRPE<=3?"Muy fácil":sessionRPE<=5?"Moderado — zona de mantenimiento":sessionRPE<=7?"Óptimo — zona de progresión":sessionRPE<=8?"Duro — buen estímulo":sessionRPE<=9?"Muy duro — cerca del límite":"Al límite — necesitas recuperación extra"}</p>}
      <Input type="text" value={sessionNota} onChange={e=>setSessionNota(e.target.value)} placeholder="Nota de sesión: cómo te has sentido, contexto..." style={{fontSize:12,marginTop:6}}/>
    </div>}

    {safeArr(plano.ejercicios).map((ej,idx)=>{
      const hist=cargas[ej.id]||[];
      const last=hist[hist.length-1];
      const lastSeries=last?.series||[];
      const objetivo=(()=>{ const base=safeArr(last?.series).length?safeMax(last.series,0):safeNum(last?.kg,0); return base>0?base+2.5:null; })();
      const done=sessionSaved[ej.id];
      const sArr=seriesInputs[ej.id]||[];
      const filled=sArr.filter(v=>parseFloat(v)>0).length;
      const allFilled=filled>=ej.series;

      return <div key={ej.id} style={{background:done?C.accent+"12":C.card,border:`1px solid ${done?C.accent+"35":C.border}`,borderRadius:12,padding:14,marginBottom:10,transition:"all 0.2s"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
              {done&&<span style={{color:C.accent,fontSize:14}}>✓</span>}
              <p style={{color:done?C.textSub:C.text,fontSize:14,fontWeight:600,margin:0}}>{ej.nombre}</p>
            </div>
            <p style={{color:C.textMuted,fontSize:11,margin:0}}>{ej.series} series · {ej.reps} reps · {ej.descanso}s</p>
            {(()=>{
              if(!last||done) return null;
              const prev2=hist.length>=2?hist[hist.length-2]:null;
              const trend=prev2?last.kg>prev2.kg?"↑":last.kg<prev2.kg?"↓":"=":null;
              const trendColor=trend==="↑"?C.green:trend==="↓"?C.red:C.textMuted;
              const d=new Date(last.fecha+"T00:00:00");
              const fmtDate=`${d.getDate()} ${["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"][d.getMonth()]}`;
              return <p style={{color:C.textMuted,fontSize:11,margin:"2px 0 0"}}>
                Última: <span style={{color:C.textSub}}>{fmtDate}</span> · <span style={{color:plano.color,fontWeight:600}}>{last.kg}kg</span>{trend&&<span style={{color:trendColor,fontWeight:700}}> {trend}</span>}
              </p>;
            })()}
          </div>
          <div style={{textAlign:"right"}}>
            {done?<p style={{color:C.accent,fontSize:13,fontWeight:600,margin:0}}>{safeMax(done,0)}kg</p>:last?<p style={{color:C.textSub,fontSize:13,fontWeight:500,margin:0}}>{last.kg}kg</p>:null}
          </div>
        </div>

        {editMode&&<div style={{display:"flex",gap:6,marginBottom:8,borderTop:`1px solid ${C.border}`,paddingTop:8}}>
          <button onClick={()=>moveEj(planoSel,idx,-1)} disabled={idx===0} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,color:C.textSub,padding:"4px 8px",cursor:"pointer",fontSize:12,opacity:idx===0?0.3:1}}>↑</button>
          <button onClick={()=>moveEj(planoSel,idx,1)} disabled={idx===plano.ejercicios.length-1} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,color:C.textSub,padding:"4px 8px",cursor:"pointer",fontSize:12,opacity:idx===plano.ejercicios.length-1?0.3:1}}>↓</button>
          <button onClick={()=>deleteEj(ej.id)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:6,color:C.textMuted,padding:"4px 10px",cursor:"pointer",fontSize:12,marginLeft:"auto"}}> Eliminar</button>
        </div>}

        {!done&&!editMode&&<>
          {objetivo&&(()=>{
            const repsNum=parseInt((ej.reps||"8").split("-")[0])||8;
            // Only estimate 1RM for compound/strength ranges (≤8 reps), not isolation
            const isStrength=repsNum<=8;
            const est1RM=last&&isStrength&&repsNum>1?Math.round(last.kg*(1+repsNum/30)):null;
            return <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>
              <Tag color={C.orange}> {objetivo}kg</Tag>
              {est1RM&&<Tag color={C.purple}>~1RM: {est1RM}kg</Tag>}
            </div>;
          })()}
          {/* Precargar con últimos valores */}
          {!done&&safeArr(last?.series).length>0&&sArr.filter(v=>parseFloat(v)>0).length===0&&(
            <button
              onClick={()=>setSeriesInputs(i=>({...i,[ej.id]:safeArr(last.series).map(String).slice(0,ej.series)}))}
              style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,color:C.textSub,padding:"5px 12px",cursor:"pointer",fontSize:11,fontWeight:500,marginBottom:8,width:"100%",letterSpacing:-0.1}}
            >
              ↩ Precargar últimos valores ({safeArr(last.series).slice(0,ej.series).join(" · ")}kg)
            </button>
          )}
          <div style={{marginBottom:8}}>
            {Array.from({length:ej.series},(_,si)=>{
              const val=sArr[si]||"";const confirmed=parseFloat(val)>0;
              return <div key={si} style={{display:"flex",gap:6,alignItems:"center",marginBottom:5}}>
                <p style={{color:C.textMuted,fontSize:11,margin:0,minWidth:28,fontWeight:700}}>S{si+1}{lastSeries[si]?<span style={{fontWeight:400}}> ({lastSeries[si]})</span>:""}</p>
                <input type="number" value={val}
                  onChange={e=>{const a=[...(seriesInputs[ej.id]||Array(ej.series).fill(""))];a[si]=e.target.value;setSeriesInputs(i=>({...i,[ej.id]:a}));}}
                  onKeyDown={e=>{if(e.key==="Enter"&&parseFloat(val)>0){e.preventDefault();handleConfirmSerie(ej.id,ej.descanso);}}}
                  onBlur={()=>{
                    // Only start rest timer on blur if ALL series for this exercise are filled
                    const blurArr=seriesInputs[ej.id]||[];
                    const blurFilled=blurArr.filter(v=>parseFloat(v)>0).length;
                    if(parseFloat(val)>0 && blurFilled>=ej.series) handleConfirmSerie(ej.id,ej.descanso);
                  }}
                  placeholder={lastSeries[si]?`${lastSeries[si]}kg`:"kg"} style={{background:confirmed?C.green+"18":C.surface,border:`1px solid ${confirmed?C.green+"55":C.border}`,borderRadius:8,color:C.text,padding:"8px 10px",fontSize:13,flex:1,boxSizing:"border-box",outline:"none"}}/>
              </div>;
            })}
          </div>
          {/* Timer button inline — RestTimer shown as sticky overlay above */}
          <div style={{display:"flex",gap:8,marginBottom:6,alignItems:"center"}}>
            <Input type="text" value={notes[ej.id]||""} onChange={e=>setNotes(n=>({...n,[ej.id]:e.target.value}))} placeholder="Nota técnica..." style={{flex:1,fontSize:12}}/>
            <button onClick={()=>setTimerSecs({ejId:ej.id,secs:ej.descanso||90})} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.textMuted,padding:"9px 10px",cursor:"pointer",fontSize:14,lineHeight:1}}>⏱</button>
            <Btn onClick={()=>handleSaveEj(ej.id,ej.descanso,ej.series)} color={allFilled?plano.color:C.textMuted} style={{whiteSpace:"nowrap",padding:"11px 18px",fontSize:13,fontWeight:700,opacity:allFilled?1:0.35,transition:"all 0.15s",transform:allFilled?"scale(1.03)":"scale(1)"}}>{allFilled?`✓ Guardar`:`${filled}/${ej.series}`}</Btn>
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
function ScreenEntreno({initTab="gym",initPlanoKey=null,autoStart=false,onSessionStarted}){
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
    const tab={id,name:newTabName.trim(),icon:"",color:"#fbbf24",type:"cf"};
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
      {tabs.map(t=>(<button key={t.id} onClick={()=>setActiveTab(t.id)} style={{background:activeTab===t.id?C.accent:C.surface,color:activeTab===t.id?"#fff":C.textMuted,border:`1px solid ${activeTab===t.id?C.accent:C.border}`,borderRadius:8,padding:"9px 14px",fontSize:13,fontWeight:activeTab===t.id?500:400,cursor:"pointer",transition:"all 0.15s",whiteSpace:"nowrap",flexShrink:0}}>{t.icon} {t.name}</button>))}
      {!showAddTab?(
        <button onClick={()=>setShowAddTab(true)} style={{background:"none",border:`1.5px dashed ${C.borderLight}`,borderRadius:10,padding:"9px 14px",fontSize:13,color:C.textMuted,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>+ Añadir</button>
      ):(
        <div style={{display:"flex",gap:6,flexShrink:0}}>
          <Input type="text" value={newTabName} onChange={e=>setNewTabName(e.target.value)} placeholder="Nombre..." style={{width:130}}/>
          <Btn onClick={addTab} color={C.accent} style={{padding:"9px 12px",fontSize:12}}>✓</Btn>
          <button onClick={()=>setShowAddTab(false)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:10,color:C.textMuted,padding:"9px 10px",cursor:"pointer",fontSize:12}}>✕</button>
        </div>
      )}
    </div>
    {tab?.type==="gym"?<GymPanel initPlanoKey={initPlanoKey} autoStart={autoStart} onSessionStarted={onSessionStarted}/>:<CFPanel key={tab?.id} tab={tab} onDeleteTab={deleteTab} autoStart={autoStart} onSessionStarted={onSessionStarted}/>}
  </div>;
}

// ── MEDIDAS PANEL ─────────────────────────────────────────────────────────────
const MEDIDAS_FIELDS=[
  {id:"peso",     label:"Peso",       unit:"kg", icon:""},
  {id:"grasa",    label:"% Grasa",    unit:"%",  icon:""},
  {id:"masaMagra",label:"Masa Magra", unit:"kg", icon:""},
];
function MedidasPanel(){
  const [medidas,setMedidas]=useState(()=>load(K.medidas)||[]);
  const [mode,setMode]=useState("list");
  const [inputs,setInputs]=useState({});
  const [detailIdx,setDetailIdx]=useState(null);
  function handleAdd(){
    const entry={fecha:today(),...Object.fromEntries(MEDIDAS_FIELDS.map(f=>[f.id,parseFloat(inputs[f.id])||""]))};
    const upd=[entry,...medidas];setMedidas(upd);save(K.medidas,upd);setInputs({});setMode("list");
    const pesoVal=entry.peso||"";
    const grasaVal=entry.grasa||"";
    const toastText=pesoVal
      ?`Evaluación guardada · ${pesoVal}kg${grasaVal?` · ${grasaVal}% grasa`:""}`
      :"Evaluación física guardada";
    pushToast({type:"success",text:toastText});
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
      {detailIdx>=medidas.length-1&&<p style={{color:C.textMuted,fontSize:11,margin:"-8px 0 12px",fontStyle:"italic"}}>
        {medidas.length===1?"Primera evaluación — sin base comparativa todavía":"Evaluación más antigua — sin datos previos para comparar"}
      </p>}
      {(()=>{
        // Show all known fields plus any extra data in the entry
        const ALL_FIELDS=[
          {id:"peso",label:"Peso",unit:"kg"},{id:"grasa",label:"% Grasa",unit:"%"},
          {id:"masaMagra",label:"Masa Magra",unit:"kg"},{id:"bicepI",label:"Bícep",unit:"cm"},
          {id:"torax",label:"Tórax",unit:"cm"},{id:"abdomen",label:"Abdomen",unit:"cm"},
          {id:"musloD",label:"Muslo D",unit:"cm"},{id:"musloI",label:"Muslo I",unit:"cm"},
          {id:"gemelo",label:"Gemelo",unit:"cm"},
        ];
        const fieldsToShow=ALL_FIELDS.filter(f=>entry[f.id]!==undefined&&entry[f.id]!=="");
        return fieldsToShow;
      })().map(f=>{
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
    {!medidas.length&&<Card style={{textAlign:"center",padding:40}}><p style={{fontSize:32,margin:"0 0 8px"}}></p><p style={{color:C.textSub,fontSize:14}}>Sin evaluaciones aún.</p></Card>}
    {medidas.length>0&&<>
      <Card style={{marginBottom:14}}>
        <SectionLabel>Última — {fmt(medidas[0].fecha)}</SectionLabel>
        {medidas.length===1&&<p style={{color:C.textMuted,fontSize:11,margin:"4px 0 0"}}>
          Primera evaluación · añade otra para ver cambios
        </p>}
        <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:8}}>
          {MEDIDAS_FIELDS.slice(0,4).map(f=>(
            <div key={f.id} style={{background:C.surface,borderRadius:10,padding:"10px 14px"}}>
              <p style={{color:C.textMuted,fontSize:10,margin:"0 0 2px",textTransform:"uppercase",letterSpacing:1.2}}>{f.label}</p>
              <p style={{color:C.text,fontSize:15,fontWeight:600,margin:0}}>{medidas[0][f.id]||"—"}{medidas[0][f.id]?f.unit:""}</p>
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


// ── SUEÑO HOY ────────────────────────────────────────────────────────────────
function SuenoHoy(){
  const [sleepData,setSleepData]=useState(()=>(load(K.proteinLog)||{})[today()+"_sleep"]||{rating:0,hours:""});
  const hoursRef=useRef(null);
  function saveSleep(upd){setSleepData(upd);const all=load(K.proteinLog)||{};all[today()+"_sleep"]=upd;save(K.proteinLog,all);}
  const sc=sleepData.rating<=2?C.red:sleepData.rating===3?C.orange:C.green;
  const labels=["Muy mal","Mal","Regular","Bien","Muy bien"];
  return <Card style={{marginBottom:12}}>
    <p style={{color:C.text,fontSize:13,fontWeight:600,margin:"0 0 12px",letterSpacing:-0.2}}>Sueño</p>
    <div style={{display:"flex",gap:5,marginBottom:12}}>
      {labels.map((label,i)=>{
        const n=i+1;const active=sleepData.rating===n;
        return <button key={n} onClick={()=>saveSleep({...sleepData,rating:active?0:n})}
          style={{flex:1,background:active?C.accent:C.surface,border:`1px solid ${active?C.accent:C.border}`,borderRadius:8,padding:"8px 4px",cursor:"pointer"}}>
          <p style={{color:active?"#fff":C.textMuted,fontSize:10,margin:0,fontWeight:active?500:400,textAlign:"center"}}>{label}</p>
        </button>;
      })}
    </div>
    <div style={{display:"flex",gap:8,alignItems:"center"}}>
      <p style={{color:C.textMuted,fontSize:12,margin:0,flexShrink:0}}>Horas</p>
      <input
        ref={hoursRef}
        type="number"
        value={sleepData.hours}
        onChange={e=>saveSleep({...sleepData,hours:e.target.value})}
        onKeyDown={e=>{if(e.key==="Enter"||e.key==="Done"){e.preventDefault();hoursRef.current?.blur();}}}
        onBlur={()=>{}}
        placeholder="7.5"
        inputMode="decimal"
        style={{flex:1,background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,padding:"7px 10px",fontSize:12,outline:"none",WebkitAppearance:"none"}}
      />
      {sleepData.rating>0&&<button onClick={()=>saveSleep({rating:0,hours:""})} style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:11,padding:0,flexShrink:0}}>Limpiar</button>}
    </div>
    {sleepData.rating>0&&<p style={{color:sc,fontSize:11,margin:"8px 0 0",fontWeight:400}}>{labels[sleepData.rating-1]}{sleepData.hours?` · ${sleepData.hours}h`:""}</p>}
  </Card>;
}


function TrackerRow({icon,label,cur,tgt,unit,color,addButtons,onReset}){
  const pct=Math.min(100,Math.round((parseFloat(cur)/tgt)*100));
  const done=pct>=100;
  return <div style={{marginBottom:16}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:6}}>
      <p style={{color:C.textMuted,fontSize:11,fontWeight:400,margin:0,letterSpacing:0}}>{label}</p>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <p style={{color:done?C.green:C.text,fontSize:14,fontWeight:600,margin:0,letterSpacing:-0.3}}>
          {typeof cur==="number"&&cur%1!==0?cur.toFixed(1):cur}
          <span style={{color:C.textMuted,fontSize:11,fontWeight:400,letterSpacing:0}}> /{tgt}{unit}</span>
        </p>
        {parseFloat(cur)>0&&<button onClick={onReset} style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:11,padding:0,lineHeight:1}}>✕</button>}
      </div>
    </div>
    <ProgressBar pct={pct} color={done?C.green:color} height={3}/>
    <div style={{display:"flex",gap:5,marginTop:8}}>{addButtons}</div>
  </div>;
}


// ── NUTRICIÓN HOY ────────────────────────────────────────────────────────────
function NutricionHoy(){
  const nutColor=C.accent;
  const [proteinLog,setProteinLog]=useState(()=>(load(K.proteinLog)||{})[today()]||[]);
  const [hydration,setHydration]=useState(()=>(load(K.proteinLog)||{})[today()+"_h"]||0);
  const [fiberToday,setFiberToday]=useState(()=>(load(K.proteinLog)||{})[today()+"_f"]||0);
  const [supDone,setSupDone]=useState(()=>(load("pg_sup_done")||{})[today()]||{});
  const [customFoods,setCustomFoods]=useState(()=>load(K.customFoods)||[]);
  const [showProteinAdd,setShowProteinAdd]=useState(false);

  function saveProteinLog(upd){setProteinLog(upd);const all=load(K.proteinLog)||{};all[today()]=upd;save(K.proteinLog,all);}
  function saveHydration(val){const v=Math.max(0,Math.round(val*10)/10);setHydration(v);const all=load(K.proteinLog)||{};all[today()+"_h"]=v;save(K.proteinLog,all);}
  function saveFiber(val){const v=Math.max(0,val);setFiberToday(v);const all=load(K.proteinLog)||{};all[today()+"_f"]=v;save(K.proteinLog,all);}
  function saveSupDone(upd){setSupDone(upd);const all=load("pg_sup_done")||{};all[today()]=upd;save("pg_sup_done",all);}
  function saveCustomFoods(upd){setCustomFoods(upd);save(K.customFoods,upd);}

  const supplements=load(K.supplements)||[{id:"sup1",name:"Creatina",dose:"5g"},{id:"sup2",name:"Batido de proteínas",dose:"30g"}];
  const {pt,ht,kcalObj,isTrainingToday}=useMemo(()=>{
    const np=load(K.nutProfile)||NUT_PROFILE_SEED;
    const meds=load(K.medidas)||[];
    const pw=meds.length?parseFloat(meds[0].peso)||65.7:65.7;
    const gf=meds.length?parseFloat(meds[0].grasa)||10:10;
    const sx=gf<8?500:gf<12?400:gf<16?350:300;
    const bmr=Math.round(10*pw+6.25*np.altura-5*np.edad+5);
    const isTrainingToday=loadWeek()[(new Date().getDay()+6)%7]?.assignments?.length>0;
    const kcalObj=Math.round(bmr*np.actividad)+sx+(isTrainingToday?150:0);
    const pt=Math.round(pw*2);
    const ht=Math.round(pw*(isTrainingToday?42:35)/1000*10)/10;
    return {pt,ht,kcalObj,isTrainingToday};
  },[]);
  const ph=proteinLog.reduce((a,e)=>a+(e.prot||0),0);
  const allFoods=[...PROTEIN_FOODS,...customFoods];
  const supsDone=Object.values(supDone).filter(Boolean).length;
  const isWOD=loadWeek()[(new Date().getDay()+6)%7]?.assignments?.some(a=>a.tabId==="wod");
  const wtgt=isWOD?Math.round((ht+0.75)*10)/10:ht;

  // Weekly consistency
  const last7=useMemo(()=>[...Array(7)].map((_,i)=>{
    const d=new Date();d.setDate(d.getDate()-i);
    const ds=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    return ((load(K.proteinLog)||{})[ds]||[]).reduce((a,e)=>a+(e.prot||0),0)>=pt;
  }).reverse(),[]);
  const daysHit=last7.filter(Boolean).length;

  return <Card style={{marginBottom:14}}>
    {/* Header */}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
      <div>
        <p style={{color:C.text,fontSize:14,fontWeight:600,margin:"0 0 3px"}}>Nutrición</p>
        <div style={{display:"flex",gap:3}}>
          {last7.map((hit,i)=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:hit?C.green:C.borderLight}}/>)}
          <p style={{color:daysHit>=5?C.green:daysHit>=3?C.orange:C.red,fontSize:10,fontWeight:600,margin:"0 0 0 5px"}}>{daysHit}/7 días</p>
        </div>
      </div>
      <Tag color={nutColor}>{kcalObj} kcal</Tag>
    </div>

    {/* 3 BARS — always visible */}
    <TrackerRow icon="" label="Proteína" cur={ph} tgt={pt} unit="g" color={nutColor} onReset={()=>saveProteinLog([])}
      addButtons={<button onClick={()=>setShowProteinAdd(s=>!s)} style={{flex:1,background:showProteinAdd?C.accent+"22":C.surface,color:showProteinAdd?C.accent:C.textSub,border:`1px solid ${showProteinAdd?C.accent:C.border}`,borderRadius:8,padding:"7px 6px",cursor:"pointer",fontSize:11,fontWeight:500}}>+ Añadir</button>}/>

    {showProteinAdd&&<div style={{background:C.surface,borderRadius:12,padding:12,marginBottom:10,marginTop:-4}}>
      <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:8}}>
        {allFoods.map(f=><button key={f.name||f.id} onClick={()=>{saveProteinLog([...proteinLog,{name:f.name,prot:f.prot,time:new Date().toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"})}]);setShowProteinAdd(false);}} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,padding:"5px 9px",cursor:"pointer",fontSize:10,color:C.textSub}}>+{f.prot}g {f.name}</button>)}
      </div>
      <CustomProteinAdd onAdd={e=>{saveProteinLog([...proteinLog,e]);setShowProteinAdd(false);}} color={nutColor} onSaveFood={f=>saveCustomFoods([...customFoods,f])}/>
      {proteinLog.slice().reverse().slice(0,4).map((e,i)=>(
        <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderTop:`1px solid ${C.border}`}}>
          <p style={{color:C.textSub,fontSize:11,margin:0}}>{e.name}</p>
          <div style={{display:"flex",gap:8}}>
            <p style={{color:nutColor,fontSize:11,fontWeight:700,margin:0}}>+{e.prot}g</p>
            <button onClick={()=>{const upd=[...proteinLog];upd.splice(proteinLog.length-1-i,1);saveProteinLog(upd);}} style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:11}}>✕</button>
          </div>
        </div>
      ))}
    </div>}

    <TrackerRow icon="" label={isWOD?"Agua (WOD)":"Agua"} cur={hydration} tgt={wtgt} unit="L" color={C.blue} onReset={()=>saveHydration(0)}
      addButtons={<>{[0.25,0.5,0.75,1].map(v=><button key={v} onClick={()=>saveHydration(hydration+v)} style={{flex:1,background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 2px",cursor:"pointer",fontSize:10,color:C.textSub,fontWeight:600}}>+{v}L</button>)}</>}/>

    <TrackerRow icon="" label="Fibra" cur={fiberToday} tgt={32} unit="g" color={C.green} onReset={()=>saveFiber(0)}
      addButtons={<>{[5,10,15,20].map(g=><button key={g} onClick={()=>saveFiber(fiberToday+g)} style={{flex:1,background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 2px",cursor:"pointer",fontSize:10,color:C.textSub,fontWeight:600}}>+{g}g</button>)}</>}/>

    {/* VER MÁS — supplements + reloads */}
    <div style={{borderTop:`1px solid ${C.border}`,paddingTop:10,marginTop:4}}>
      <p style={{color:C.textMuted,fontSize:10,letterSpacing:1.2,textTransform:"uppercase",margin:"0 0 8px",fontWeight:500}}>Suplementos</p>
      {supplements.map(sup=>(
        <div key={sup.id} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0",borderBottom:`1px solid ${C.border}`}}>
          <button onClick={()=>{
            const nowDone=!supDone[sup.id];
            saveSupDone({...supDone,[sup.id]:nowDone});
            const m=sup.dose&&sup.dose.match(/(\d+)\s*g/i);
            const pg=m?parseInt(m[1]):0;
            const isp=pg>0&&(sup.name.toLowerCase().includes("proteí")||sup.name.toLowerCase().includes("batido")||sup.name.toLowerCase().includes("whey"));
            if(isp){if(nowDone)saveProteinLog([...proteinLog,{name:sup.name,prot:pg,time:new Date().toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"}),supId:sup.id}]);
            else saveProteinLog(proteinLog.filter(e=>e.supId!==sup.id));}
          }} style={{width:22,height:22,borderRadius:6,flexShrink:0,background:supDone[sup.id]?C.green:C.surface,border:`2px solid ${supDone[sup.id]?C.green:C.borderLight}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#000",fontSize:13,fontWeight:700}}>{supDone[sup.id]?"✓":""}</button>
          <p style={{color:supDone[sup.id]?C.textMuted:C.text,fontSize:13,margin:0,flex:1,textDecoration:supDone[sup.id]?"line-through":"none"}}>{sup.name}</p>
          <p style={{color:C.textMuted,fontSize:11,margin:0}}>{sup.dose}</p>
        </div>
      ))}

    </div>
  </Card>;
}


function ScreenHoyMerged({onEmpezar,onGoToNutricion,onGoToSemana,onGoToFisico,onGoToComidas}){
  const todayDate=today();
  const tabs=loadTabs();
  const weekPlan=loadWeek();
  const gymPlanos=loadGymPlanos();
  const cargas=load(K.cargas)||{};
  const dowMap={0:6,1:0,2:1,3:2,4:3,5:4,6:5};
  const planIdx=dowMap[new Date().getDay()];
  const todayAssignments=(weekPlan[planIdx]?.assignments)||[];
  const todaySessions=getTrainedSessions(todayDate);
  const allTrainedDates=getTrainedDates();
  const weekStart=new Date();weekStart.setDate(weekStart.getDate()-planIdx);
  const wsStr=`${weekStart.getFullYear()}-${String(weekStart.getMonth()+1).padStart(2,"0")}-${String(weekStart.getDate()).padStart(2,"0")}`;
  const daysThisWeek=new Set(Array.from(allTrainedDates).filter(d=>d>=wsStr&&d<=todayDate)).size;

  const streak=useMemo(()=>{
    let weeks=0;const now=new Date();
    for(let w=0;w<52;w++){
      const wEnd=new Date(now);wEnd.setDate(wEnd.getDate()-(w*7));
      const wStart=new Date(wEnd);wStart.setDate(wEnd.getDate()-6);
      const ws=`${wStart.getFullYear()}-${String(wStart.getMonth()+1).padStart(2,"0")}-${String(wStart.getDate()).padStart(2,"0")}`;
      const we=`${wEnd.getFullYear()}-${String(wEnd.getMonth()+1).padStart(2,"0")}-${String(wEnd.getDate()).padStart(2,"0")}`;
      if(Array.from(allTrainedDates).some(d=>d>=ws&&d<=we)) weeks++;
      else if(w>0) break;
    }
    return weeks;
  },[todayDate]);

  function getAssignmentColor(a){if(a.tabId==="gym") return gymPlanos[a.planoKey]?.color||C.accent;return tabs.find(t=>t.id===a.tabId)?.color||C.textMuted;}
  function getAssignmentLabel(a){if(a.tabId==="gym") return ` Gym — Plano ${a.planoKey||""}`;const t=tabs.find(t=>t.id===a.tabId);return t?`${t.icon} ${t.name}`:"Entreno";}

  const rpeLog=load(K.rpe)||{};
  const weeksSinceFirst=(()=>{
    const dates=Object.values(cargas).flatMap(h=>h.map(e=>e.fecha)).sort();
    if(!dates.length) return 0;
    const [y1,m1,d1]=dates[0].split("-").map(Number);
    const [y2,m2,d2]=todayDate.split("-").map(Number);
    return Math.max(0,Math.floor((new Date(y2,m2-1,d2)-new Date(y1,m1-1,d1))/(7*24*3600*1000)));
  })();
  const recentRPEs=Object.entries(rpeLog).sort(([a],[b])=>b.localeCompare(a)).slice(0,3).map(([,v])=>v);
  const avgRPE=recentRPEs.length?recentRPEs.reduce((a,v)=>a+v,0)/recentRPEs.length:0;
  const consecutiveHighRPE=(()=>{
    const sorted=Object.entries(rpeLog).sort(([a],[b])=>b.localeCompare(a));
    let count=0;for(const [,v] of sorted){if(v>=8.5)count++;else break;}
    return count;
  })();
  const showDeload=weeksSinceFirst>=4&&weeksSinceFirst%4===0;
  const showFatigue=!showDeload&&avgRPE>=8.5;
  const allGymEjs=Object.values(gymPlanos).flatMap(p=>safeArr(p?.ejercicios));
  const stalledEjs=useMemo(()=>Object.entries(cargas).filter(([,h])=>{
    if(h.length<3) return false;
    const last3=h.slice(-3);
    return !(last3[2].kg>last3[0].kg)&&!(last3[2].series&&last3[0].series&&last3[2].series.reduce((a,v)=>a+v,0)>last3[0].series.reduce((a,v)=>a+v,0));
  }).map(([id])=>allGymEjs.find(e=>e.id===id)).filter(Boolean).slice(0,1),[todayDate]);

  const yd=new Date();yd.setDate(yd.getDate()-1);
  const ydStr=`${yd.getFullYear()}-${String(yd.getMonth()+1).padStart(2,"0")}-${String(yd.getDate()).padStart(2,"0")}`;
  const ydSessions=getTrainedSessions(ydStr);
  const sleepToday=(load(K.proteinLog)||{})[todayDate+"_sleep"]||{};

  // Ayer protein
  const ydProtLog=(load(K.proteinLog)||{})[ydStr]||[];
  const ydProt=ydProtLog.reduce((a,e)=>a+(e.prot||0),0);
  const pw=load(K.medidas)?.length?parseFloat(load(K.medidas)[0].peso)||65.7:65.7;
  const pt=Math.round(pw*2);
  const ydProtPct=pt>0?Math.round((ydProt/pt)*100):100;

  // Cross-fatigue
  const crossFatigue=(()=>{
    if(!ydSessions.length||!todayAssignments.length) return null;
    const ydPlanos=ydSessions.filter(s=>s.planoKey).map(s=>s.planoKey);
    const todayPlanos=todayAssignments.filter(a=>a.planoKey).map(a=>a.planoKey);
    if(!ydPlanos.length||!todayPlanos.length) return null;
    const ydGrupos=ydPlanos.flatMap(k=>(gymPlanos[k]?.ejercicios||[]).map(e=>(e.grupo||"").toLowerCase()));
    const todayGrupos=todayPlanos.flatMap(k=>(gymPlanos[k]?.ejercicios||[]).map(e=>(e.grupo||"").toLowerCase()));
    const overlap=[...new Set(todayGrupos.filter(g=>g&&ydGrupos.some(yg=>yg.includes(g)||g.includes(yg))))];
    return overlap.length?overlap:null;
  })();

  // Alert dismissal state
  const [dismissed,setDismissed]=useState({});
  const dismiss=(key)=>setDismissed(d=>({...d,[key]:true}));

  // Build ordered alerts (one visible at a time unless dismissed)
  const alerts=[];
  if(showDeload&&!dismissed.deload) alerts.push({key:"deload",color:C.orange,icon:"!",title:`Deload — ${weeksSinceFirst} semanas`,body:"Reduce a 2 series y el 60-70% del peso esta semana."});
  if(showFatigue&&!dismissed.fatigue) alerts.push({key:"fatigue",color:C.red,icon:"×",title:`Fatiga alta — RPE ${avgRPE.toFixed(1)}/10`,body:consecutiveHighRPE>=2?"Dos sesiones seguidas de alto esfuerzo. ¿Estás durmiendo y comiendo suficiente? Revisa proteína e hidratación esta semana.":"Considera bajar la intensidad o descansar."});
  if(!showDeload&&!showFatigue&&stalledEjs.length>0&&!dismissed.stall) alerts.push({key:"stall",color:C.red,icon:"",title:`Estancamiento — ${stalledEjs[0]?.nombre}`,body:"Sin progreso en 3 sesiones. Cambia el estímulo."});
  if(crossFatigue&&!dismissed.cross) alerts.push({key:"cross",color:C.orange,icon:"—",title:`${crossFatigue.join(", ")} entrenados ayer`,body:"Considera ajustar la intensidad o el volumen hoy."});
  // Cross-area alerts
  if(sleepToday.rating>0&&sleepToday.rating<=2&&todayAssignments.length>0&&!dismissed.sleepLow){
    const isLeg=todayAssignments.some(a=>a.planoKey&&(gymPlanos[a.planoKey]?.ejercicios||[]).some(e=>(e.grupo||"").toLowerCase().includes("cuádr")||(e.grupo||"").toLowerCase().includes("glút")||(e.grupo||"").toLowerCase().includes("femor")));
    alerts.push({key:"sleepLow",color:C.red,icon:"—",title:"Sueño deficiente",body:isLeg?"Dormiste mal + sesión de piernas. Síntesis proteica reducida. Considera reducir el volumen al 80% hoy.":"Dormiste mal. La síntesis proteica está reducida. Considera bajar la intensidad de hoy."});
  }
  if(ydProtPct<60&&todayAssignments.length>0&&!dismissed.protLow){
    alerts.push({key:"protLow",color:C.orange,icon:"",title:`Proteína baja ayer (${ydProtPct}%)`,body:"Quedaste bajo en proteína ayer. Asegúrate de hacer la toma post-entreno hoy."});
  }
  // Show only first undismissed alert
  const activeAlert=alerts[0]||null;
  const pendingAlerts=alerts.length;

  // Estado del día pills
  const sleepLabels=["Muy mal","Mal","Regular","Bien","Muy bien"];
  const dayState=[
    {label:"Sueño",   val:sleepToday.rating>0?sleepLabels[sleepToday.rating-1].split(" ")[0]:"—",
                      color:!sleepToday.rating?C.textMuted:sleepToday.rating<=2?C.red:sleepToday.rating===3?C.orange:C.green,
                      ok:sleepToday.rating>=4},
    {label:"Prot ayer",val:ydProt>0?`${ydProtPct}%`:"—",
                        color:!ydProt?C.textMuted:ydProtPct<60?C.red:ydProtPct<90?C.orange:C.green,
                        ok:ydProtPct>=90},
  ];

  const [showYd,setShowYd]=useState(false);
  const hour=new Date().getHours();

  return <div>


    {/* TRAINING HERO */}
    {todayAssignments.length===0?(
      <Card style={{marginBottom:12,background:C.card}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
          <div style={{width:40,height:40,borderRadius:12,background:C.blue+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:300,color:C.textMuted}}>—</div>
          <div>
            <p style={{color:C.text,fontSize:15,fontWeight:600,margin:0}}>Día de descanso</p>
            <p style={{color:C.textMuted,fontSize:11,margin:0}}>Recuperación activa — parte del proceso</p>
          </div>
        </div>
        <button onClick={()=>onEmpezar("skills",null)} style={{width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.textSub,padding:"9px",cursor:"pointer",fontSize:11,fontWeight:500}}>Skills ligero</button>
      </Card>
    ):(
      <div style={{marginBottom:14}}>
        {todayAssignments.map((a,i)=>{
          const color=getAssignmentColor(a);
          const label=getAssignmentLabel(a);
          const done=a.tabId==="gym"?todaySessions.find(s=>s.planoKey===a.planoKey):todaySessions.find(s=>s.tabId===a.tabId);
          return <div key={i} style={{background:C.card,border:`1px solid ${done?C.accent+"44":C.border}`,borderRadius:14,padding:18,marginBottom:i<todayAssignments.length-1?10:0}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:done?6:12}}>
              <div>
                <p style={{color:C.textMuted,fontSize:10,letterSpacing:0,margin:"0 0 4px",textTransform:"uppercase"}}>Hoy</p>
                <p style={{color:C.text,fontSize:17,fontWeight:700,margin:0,letterSpacing:-0.3}}>{label}</p>
              </div>
              {done?<p style={{color:C.green,fontSize:11,fontWeight:500,margin:0}}>✓ Completado</p>:<div style={{width:8,height:8,borderRadius:"50%",background:color,marginTop:6}}/>}
            </div>
            {!done&&<button onClick={()=>onEmpezar(a.tabId,a.planoKey)} style={{width:"100%",background:C.accent,color:"#fff",border:"none",borderRadius:8,padding:"11px",cursor:"pointer",fontSize:14,fontWeight:600,letterSpacing:-0.2}}>Empezar →</button>}
            {done&&(()=>{const rpe=a.planoKey?rpeLog[`${todayDate}_${a.planoKey}`]:null;return <p style={{color:C.textMuted,fontSize:11,margin:0}}>Sesión completada{rpe?` · RPE ${rpe}/10`:""}</p>;})()}
          </div>;
        })}
      </div>
    )}

    {/* ESTADO DEL DÍA — pills */}
    {/* ESTADO DEL DÍA */}
    <div style={{display:"flex",gap:6,marginBottom:14}}>
      {dayState.map(({label,val,color,ok})=>{
        const isProtAyer=label==="Prot ayer";
        const Tag2=isProtAyer?"button":"div";
        return <Tag2 key={label} onClick={isProtAyer?onGoToComidas:undefined}
          style={{flex:1,background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 6px",textAlign:"center",cursor:isProtAyer?"pointer":"default"}}>
          <p style={{color:C.textMuted,fontSize:10,textTransform:"uppercase",letterSpacing:0,margin:"0 0 4px",fontWeight:500}}>{label}</p>
          <p style={{color:val==="—"?C.textMuted:C.text,fontSize:15,fontWeight:600,margin:0,lineHeight:1}}>{val}</p>
        </Tag2>;
      })}
      <button onClick={onGoToSemana} style={{flex:1,background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 6px",textAlign:"center",cursor:"pointer"}}>
        <p style={{color:C.textMuted,fontSize:10,textTransform:"uppercase",letterSpacing:0,margin:"0 0 4px",fontWeight:500}}>Semana</p>
        <p style={{color:C.text,fontSize:15,fontWeight:600,margin:0,lineHeight:1}}>{daysThisWeek}</p>
      </button>
    </div>
    {/* ACTIVE ALERT — dismissible */}
    {activeAlert&&<div style={{background:C.surface,border:`1px solid ${C.border}`,borderLeft:`2px solid ${activeAlert.color}`,borderRadius:8,padding:"10px 14px",marginBottom:12,display:"flex",gap:10,alignItems:"flex-start"}}>
      <div style={{flex:1}}>
        <p style={{color:C.text,fontSize:13,fontWeight:600,margin:"0 0 2px",letterSpacing:-0.2}}>{activeAlert.title}</p>
        <p style={{color:C.textSub,fontSize:12,margin:0,lineHeight:1.4}}>{activeAlert.body}</p>
      </div>
      <button onClick={()=>dismiss(activeAlert.key)} style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:13,padding:0,flexShrink:0,lineHeight:1}}>✕</button>
    </div>}
    {pendingAlerts>1&&<p style={{color:C.textMuted,fontSize:10,margin:"-6px 0 12px",textAlign:"right",letterSpacing:-0.1}}>{pendingAlerts-1} alerta{pendingAlerts-1>1?"s más":""} más</p>}

    {/* YESTERDAY — collapsed */}
    {ydSessions.length>0&&<button onClick={()=>setShowYd(s=>!s)} style={{width:"100%",background:"none",border:"none",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:showYd?8:12,padding:0}}>
      <p style={{color:C.textMuted,fontSize:11,margin:0}}>
        {ydSessions.map(s=>`${s.icon} ${s.tabName}${s.planoKey?` ${s.planoKey}`:""}`).join(" · ")}
        {(()=>{const rpe=ydSessions[0]?.planoKey?rpeLog[`${ydStr}_${ydSessions[0].planoKey}`]:null;return rpe?` · RPE ${rpe}`:"";})()}
      </p>
      <span style={{color:C.textMuted,fontSize:10}}>{showYd?"▲":"▼"}</span>
    </button>}
    {showYd&&ydSessions.length>0&&<Card style={{marginBottom:12}}>
      <p style={{color:C.textMuted,fontSize:10,textTransform:"uppercase",letterSpacing:1.2,margin:"0 0 7px"}}>Ayer</p>
      {ydSessions.map((s,i)=>{
        const rpe=s.planoKey?rpeLog[`${ydStr}_${s.planoKey}`]:null;
        return <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:i?"6px 0 0":"0"}}>
          <p style={{color:s.color||C.accent,fontSize:13,fontWeight:600,margin:0}}>{s.icon} {s.tabName}{s.planoKey?` ${s.planoKey}`:""}</p>
          {rpe&&<p style={{color:C.textMuted,fontSize:11,margin:0}}>RPE {rpe}/10</p>}
        </div>;
      })}
    </Card>}

    {/* OBJETIVO PROGRESO → Físico */}
    {(()=>{
      const objs=loadObjectives();
      const pesoObj=objs.find(o=>o.name?.toLowerCase().includes("peso")||o.unit==="kg");
      const m=safeArr(load(K.medidas))[0];
      const pesoActual=m?.peso;
      if(!pesoObj&&!pesoActual) return null;
      const target=pesoObj?.target||"";
      // Parse target: "70-75" → lower bound 70; or plain "70"
      const targetNum=target?parseFloat(target.split("-")[0]):null;
      // start = first recorded peso; current = latest
      const pesoInicial=safeArr(load(K.medidas)).slice(-1)[0]?.peso;
      const pct=(pesoActual&&targetNum&&pesoInicial&&targetNum>pesoInicial)
        ?Math.min(100,Math.round(((parseFloat(pesoActual)-parseFloat(pesoInicial))/(targetNum-parseFloat(pesoInicial)))*100))
        :null;
      return <button onClick={onGoToFisico} style={{width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px",cursor:"pointer",textAlign:"left",marginBottom:10}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:pct!==null?8:0}}>
          <div>
            <p style={{color:C.textMuted,fontSize:10,textTransform:"uppercase",letterSpacing:1.2,margin:"0 0 2px",fontWeight:500}}>Objetivo</p>
            <p style={{color:C.text,fontSize:13,fontWeight:500,margin:0}}>
              {pesoActual?`${pesoActual}kg`:"-"}
              {targetNum?` → ${targetNum}kg`:""}
            </p>
          </div>
          <span style={{color:C.textMuted,fontSize:16}}>›</span>
        </div>
        {pct!==null&&<ProgressBar pct={pct} color={pct>=100?C.green:C.accent} height={3}/>}
        {pct!==null&&<p style={{color:C.textMuted,fontSize:10,margin:"4px 0 0"}}>{pct}% completado</p>}
      </button>;
    })()}

    {/* DIVIDER */}
    <div style={{height:1,background:C.border,margin:"4px 0 14px"}}/>

    {/* SLEEP + NUTRITION */}
    <SuenoHoy/>
    <NutricionHoy/>
  </div>;
}


// ── SCREEN PROGRESO ───────────────────────────────────────────────────────────
function ScreenCalendario(){
  const [mesOffset,setMesOffset]=useState(0);
  const [selectedDay,setSelectedDay]=useState(null);

  const base=new Date();base.setDate(1);base.setMonth(base.getMonth()+mesOffset);
  const year=base.getFullYear(),month=base.getMonth();
  const mesNombre=base.toLocaleDateString("es-ES",{month:"long",year:"numeric"});
  const primerDia=new Date(year,month,1).getDay();
  const diasEnMes=new Date(year,month+1,0).getDate();
  const offset=primerDia===0?6:primerDia-1; // Monday-first grid

  function dateStr(day){
    return `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
  }
  function getDaySessions(day){ return getTrainedSessions(dateStr(day)); }

  const diasEntrenados=Array.from({length:diasEnMes},(_,i)=>i+1)
    .filter(d=>getDaySessions(d).length>0).length;

  // Day detail data
  const selSessions=safeArr(selectedDay?getDaySessions(selectedDay):null);
  const selRpeLog=load(K.rpe)||{};
  const selProtLog=selectedDay?(load(K.proteinLog)||{})[dateStr(selectedDay)]||[]:[];
  const selProt=selProtLog.reduce((a,e)=>a+(e.prot||0),0);
  const selSleep=selectedDay?(load(K.proteinLog)||{})[dateStr(selectedDay)+"_sleep"]||{}:{};
  const selNota=selectedDay?(load(K.snota)||{}):null;

  const todayStr=today();

  return <div>
    {/* Month navigation */}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
      <button onClick={()=>{setMesOffset(o=>o-1);setSelectedDay(null);}} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,color:C.text,padding:"8px 16px",cursor:"pointer",fontSize:16}}>‹</button>
      <p style={{color:C.text,fontSize:15,fontWeight:600,margin:0,textTransform:"capitalize"}}>{mesNombre}</p>
      <button onClick={()=>{setMesOffset(o=>o+1);setSelectedDay(null);}} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,color:C.text,padding:"8px 16px",cursor:"pointer",fontSize:16}}>›</button>
    </div>

    {/* Month stats */}
    <div style={{display:"flex",gap:8,marginBottom:14}}>
      <Card style={{flex:1,textAlign:"center",padding:12}}>
        <p style={{color:C.textMuted,fontSize:10,margin:"0 0 3px",textTransform:"uppercase",letterSpacing:1.2}}>Entrenados</p>
        <p style={{color:C.text,fontSize:20,fontWeight:700,margin:0}}>{diasEntrenados}</p>
      </Card>
      <Card style={{flex:1,textAlign:"center",padding:12}}>
        <p style={{color:C.textMuted,fontSize:10,margin:"0 0 3px",textTransform:"uppercase",letterSpacing:1.2}}>Descansos</p>
        <p style={{color:C.text,fontSize:20,fontWeight:700,margin:0}}>{diasEnMes-diasEntrenados}</p>
      </Card>
      <Card style={{flex:1,textAlign:"center",padding:12}}>
        <p style={{color:C.textMuted,fontSize:10,margin:"0 0 3px",textTransform:"uppercase",letterSpacing:1.2}}>Adherencia</p>
        <p style={{color:C.text,fontSize:20,fontWeight:700,margin:0}}>
          {diasEnMes>0?Math.round((diasEntrenados/diasEnMes)*100):0}%
        </p>
      </Card>
    </div>

    {/* Calendar grid */}
    <Card style={{marginBottom:14}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:6}}>
        {["L","M","X","J","V","S","D"].map(d=>(
          <p key={d} style={{color:C.textMuted,fontSize:10,textAlign:"center",margin:0,fontWeight:700}}>{d}</p>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
        {Array.from({length:offset}).map((_,i)=><div key={"e"+i}/>)}
        {Array.from({length:diasEnMes},(_,i)=>i+1).map(day=>{
          const sessions=getDaySessions(day);
          const trained=sessions.length>0;
          const ds=dateStr(day);
          const isToday=ds===todayStr;
          const isSelected=selectedDay===day;
          const colors=safeArr(sessions).map(s=>s.color||C.accent);
          return <button
            key={day}
            onClick={()=>setSelectedDay(isSelected?null:day)}
            style={{
              aspectRatio:"1",
              borderRadius:8,
              border:`1px solid ${isSelected?C.accent:isToday?"#ffffff44":"transparent"}`,
              background:trained?C.accent+"22":isToday?C.surface:"transparent",
              cursor:"pointer",
              display:"flex",
              flexDirection:"column",
              alignItems:"center",
              justifyContent:"center",
              padding:2,
              position:"relative",
            }}
          >
            <span style={{color:trained?colors[0]:isToday?C.text:C.textMuted,fontSize:12,fontWeight:trained||isToday?700:400,lineHeight:1}}>
              {day}
            </span>
            {trained&&colors.length>1&&(
              <div style={{display:"flex",gap:1,marginTop:1}}>
                {colors.slice(0,3).map((c,i)=>(
                  <div key={i} style={{width:4,height:4,borderRadius:"50%",background:c}}/>
                ))}
              </div>
            )}
            {trained&&colors.length===1&&(
              <div style={{width:4,height:4,borderRadius:"50%",background:colors[0],marginTop:1}}/>
            )}
          </button>;
        })}
      </div>
    </Card>

    {/* Day detail panel */}
    {selectedDay&&(
      <Card style={{border:`1px solid ${C.accent}33`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <p style={{color:C.text,fontSize:14,fontWeight:600,margin:0}}>
            {new Date(year,month,selectedDay).toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"})}
          </p>
          <button onClick={()=>setSelectedDay(null)} style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:16,padding:0}}>✕</button>
        </div>

        {selSessions.length===0?(
          <p style={{color:C.textMuted,fontSize:12,margin:0}}>Sin sesiones registradas</p>
        ):(
          selSessions.map((s,i)=>{
            const rpeKey=`${dateStr(selectedDay)}_${s.planoKey||s.tabId}`;
            const rpe=selRpeLog[rpeKey]||null;
            const notaKey=`${dateStr(selectedDay)}_${s.planoKey||s.tabId}`;
            const nota=selNota?selNota[notaKey]||null:null;
            return <div key={i} style={{marginBottom:i<selSessions.length-1?10:0,paddingBottom:i<selSessions.length-1?10:0,borderBottom:i<selSessions.length-1?`1px solid ${C.border}`:"none"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:nota?4:0}}>
                <p style={{color:s.color||C.accent,fontSize:13,fontWeight:600,margin:0}}>
                  {s.icon||""} {s.tabName||"Entreno"}{s.planoKey?` ${s.planoKey}`:""}
                </p>
                {rpe&&<p style={{color:C.textMuted,fontSize:11,margin:0}}>RPE {rpe}/10</p>}
              </div>
              {nota&&<p style={{color:C.textMuted,fontSize:11,margin:0,fontStyle:"italic"}}>"{nota}"</p>}
            </div>;
          })
        )}

        {/* Nutrition & sleep summary */}
        {(selProt>0||selSleep.rating>0)&&(
          <div style={{display:"flex",gap:8,marginTop:10,paddingTop:10,borderTop:`1px solid ${C.border}`}}>
            {selProt>0&&(
              <Tag color="#0a7aff"> {selProt}g prot</Tag>
            )}
            {selSleep.rating>0&&(
              <Tag color={selSleep.rating>=4?C.green:selSleep.rating===3?C.orange:C.red}>
                {["—","·","·","·","·"][selSleep.rating-1]} {selSleep.hours?selSleep.hours+"h":""}
              </Tag>
            )}
          </div>
        )}
      </Card>
    )}
  </div>;
}


function ScreenProgreso({initTab=null}){
  const [proTab,setProTab]=useState(initTab||"semana");
  useEffect(()=>{if(initTab)setProTab(initTab);},[initTab]);
  const proColor=C.accent;
  return <div>
    <div style={{display:"flex",gap:0,marginBottom:20,background:C.bg,borderRadius:10,padding:3,border:`1px solid ${C.border}`}}>
      {[["semana","Semana"],["historial","Mes"],["cuerpo","Físico"]].map(([id,label])=>(
        <button key={id} onClick={()=>setProTab(id)} style={{flex:1,background:proTab===id?C.card:"transparent",color:proTab===id?C.text:C.textMuted,border:proTab===id?`1px solid ${C.border}`:"1px solid transparent",borderRadius:8,padding:"8px 10px",fontSize:12,fontWeight:proTab===id?600:400,cursor:"pointer",transition:"all 0.12s",letterSpacing:-0.2,boxShadow:proTab===id?C.shadowSm:"none"}}>{label}</button>
      ))}
    </div>
    {proTab==="semana"&&<div><ProgresoSemana/><div style={{height:1,background:C.border,margin:"20px 0 14px"}}/><ProgresoPlantificar/></div>}
    {proTab==="cuerpo"&&<ProgresoCuerpo/>}
    {proTab==="historial"&&<ScreenCalendario/>}
  </div>;
}

function ProgresoSemana(){
  const dayNames=["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
  const todayDate=today();
  const cargas=load(K.cargas)||{};
  const allTrainedDates=getTrainedDates();
  const dowMap={0:6,1:0,2:1,3:2,4:3,5:4,6:5};
  const planIdx=dowMap[new Date().getDay()];
  const weekStart=new Date();weekStart.setDate(weekStart.getDate()-planIdx);
  const wsStr=`${weekStart.getFullYear()}-${String(weekStart.getMonth()+1).padStart(2,"0")}-${String(weekStart.getDate()).padStart(2,"0")}`;
  const weekDays=Array.from({length:7},(_,i)=>{const d=new Date(weekStart);d.setDate(weekStart.getDate()+i);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;});
  const weekSessions=weekDays.flatMap(d=>getTrainedSessions(d).map(s=>({...s,date:d})));
  const daysThisWeek=new Set(weekSessions.map(s=>s.date)).size;
  const pw=load(K.medidas)?.length?parseFloat(load(K.medidas)[0].peso)||65.7:65.7;
  const pt=Math.round(pw*2);
  const allLog=load(K.proteinLog)||{};
  const last7=[...Array(7)].map((_,i)=>{const d=new Date();d.setDate(d.getDate()-i);const ds=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;return (allLog[ds]||[]).reduce((a,e)=>a+(e.prot||0),0)>=pt;}).reverse();
  const daysHit=last7.filter(Boolean).length;
  const rpeLog=load(K.rpe)||{};
  const weekRPEs=weekDays.flatMap(d=>Object.entries(rpeLog).filter(([k])=>k.startsWith(d)).map(([,v])=>v));
  const avgRPE=weekRPEs.length?(weekRPEs.reduce((a,v)=>a+v,0)/weekRPEs.length).toFixed(1):null;
  const vol=getWeeklyVolume();
  const volEntries=Object.entries(vol);
  const weekPRs=Object.entries(cargas).filter(([,h])=>{
    if(!Array.isArray(h)||h.length<2) return false;
    const wh=h.filter(e=>e.fecha>=wsStr&&e.fecha<=todayDate&&isFinite(e.kg));
    if(!wh.length) return false;
    const maxW=safeMax(wh.map(e=>e.kg),0);
    const prevH=h.filter(e=>e.fecha<wsStr&&isFinite(e.kg));
    const maxP=prevH.length?safeMax(prevH.map(e=>e.kg),0):0;
    return maxW>0&&maxW>maxP;
  }).map(([id])=>Object.values(loadGymPlanos()).flatMap(p=>safeArr(p?.ejercicios)).find(e=>e.id===id)).filter(Boolean);

  // ── Plan vs ejecutado ──────────────────────────────────────────────────────
  const planVsReal=(()=>{
    const planned=weekDays.reduce((acc,dayStr,di)=>{
      const assignments=safeArr((loadWeek()[di])?.assignments);
      return acc+assignments.length;
    },0);
    const executed=weekSessions.length; // already calculated above
    // Which specific days were planned but not trained
    const missedDays=weekDays.reduce((acc,dayStr,di)=>{
      const assignments=safeArr((loadWeek()[di])?.assignments);
      if(assignments.length===0) return acc;
      const trained=getTrainedSessions(dayStr).length>0;
      if(!trained) acc.push(dayNames[di]);
      return acc;
    },[]);
    const adherence=planned>0?Math.round((Math.min(executed,planned)/planned)*100):null;
    return {planned,executed,missed:missedDays,adherence};
  })();

  // ── Previous-week data for comparison ───────────────────────────────────────
  const prevWeek=(()=>{
    const prevStart=new Date(weekStart);prevStart.setDate(prevStart.getDate()-7);
    const prevDays=Array.from({length:7},(_,i)=>{
      const d=new Date(prevStart);d.setDate(prevStart.getDate()+i);
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    });
    const prevSessions=prevDays.flatMap(d=>getTrainedSessions(d));
    // Count unique days trained in prev week
    const prevDone=new Set(prevDays.filter(d=>getTrainedSessions(d).length>0)).size;
    const prevRPEs=prevDays.flatMap(d=>Object.entries(load(K.rpe)||{}).filter(([k])=>k.startsWith(d)).map(([,v])=>v));
    const prevRPE=prevRPEs.length?(prevRPEs.reduce((a,v)=>a+v,0)/prevRPEs.length).toFixed(1):null;
    const prevProt=[...Array(7)].map((_,i)=>{
      const ds=prevDays[i];
      return ((load(K.proteinLog)||{})[ds]||[]).reduce((a,e)=>a+(e.prot||0),0)>=pt;
    }).filter(Boolean).length;
    return {days:prevDone,rpe:prevRPE,protDays:prevProt};
  })();

  // MAV exceeded groups
  const mavExceeded=Object.entries(vol).filter(([g,s])=>s>(MAV[g]||14)).map(([g])=>g);
  const belowMEV=Object.entries(vol).filter(([g,s])=>s<(MEV[g]||6)).map(([g])=>g);

  // Rich auto-interpretation
  const interpretation=(()=>{
    if(!daysThisWeek&&!avgRPE) return null;
    // Main conclusion
    const rpe=parseFloat(avgRPE)||0;
    const conclusion=
      daysThisWeek>=3&&rpe>=5&&rpe<8.5&&daysHit>=5?"Semana sólida. Buen ritmo para seguir progresando.":
      daysThisWeek>=3&&rpe>=8.5?"Alta carga esta semana. Considera reducir intensidad o añadir descanso.":
      daysThisWeek>=3&&daysHit<3?"Entrenamiento correcto pero proteína baja. La recuperación puede verse comprometida.":
      daysThisWeek>=4&&daysHit>=5&&rpe<8?"Semana muy completa. Si el RPE sigue bajo, puedes subir el volumen o la carga.":
      daysThisWeek<2&&daysHit>=5?"Buena nutrición pero pocos días de entreno. Revisa si el plan refleja tu semana real.":
      daysThisWeek<2?"Semana con poco entrenamiento. ¿Todo bien?":"Mantén el ritmo.";

    // Specific recommendations (up to 2)
    const recos=[];
    if(mavExceeded.length>0) recos.push(`Superaste el MAV en ${mavExceeded.join(", ")}. La semana que viene reduce 2 series en ese grupo.`);
    if(daysHit<3&&daysThisWeek>=2) recos.push(`Proteína baja esta semana. Asegura 2 tomas de 30g post-entreno los próximos días.`);
    if(weekPRs.length>0&&daysHit>=5) recos.push(`PR conseguido con buena nutrición. Esto confirma que la proteína alta facilita la progresión.`);
    if(rpe>=8.5&&daysHit<4) recos.push(`Fatiga alta + proteína baja = recuperación limitada. Prioriza descanso y proteína este fin de semana.`);
    if(rpe>=8.5&&daysHit>=4) recos.push(`Mantén el volumen, pero baja la intensidad en la próxima sesión.`);
    if(belowMEV.length>0&&daysThisWeek>=3) recos.push(`${belowMEV.join(", ")} por debajo del MEV esta semana. Añade 1 serie extra la próxima.`);
    // Half-week advice (Mon-Thu = days 0-3 of week)
    const isFirstHalf=new Date().getDay()>=1&&new Date().getDay()<=4;
    if(isFirstHalf&&daysThisWeek>=2&&rpe>=5&&rpe<8&&daysHit>=3) recos.push(`Buen arranque de semana. Estás en forma para la segunda mitad.`);

    return {conclusion,recos:recos.slice(0,2)};
  })();

  return <div>
    {/* ── RESUMEN CIERRE DE SEMANA ── */}
    {(()=>{
      const rpe=safeNum(avgRPE,0);
      const prevRpe=safeNum(prevWeek?.rpe,0);

      // Guard: interpretation may be null on new week with no data
      const interp=interpretation;
      const conclusion=interp?.conclusion||null;
      const recos=safeArr(interp?.recos);

      const adherenceTxt=planVsReal.adherence===null?"—":
        planVsReal.adherence>=100?"Completado":
        `${planVsReal.adherence}`;

      return <div style={{background:C.surface,borderRadius:12,padding:16,marginBottom:16}}>
        <p style={{color:C.text,fontSize:13,fontWeight:600,margin:"0 0 10px"}}>Esta semana</p>

        {/* Plan vs ejecutado */}
        {planVsReal.planned>0&&<div style={{marginBottom:10,paddingBottom:10,borderBottom:`1px solid ${C.border}`}}>
          <div style={{marginBottom:6}}>
            <p style={{color:C.textMuted,fontSize:11,margin:"0 0 3px",fontWeight:400}}>Adherencia</p>
            <p style={{color:planVsReal.adherence>=75?C.green:planVsReal.adherence>=50?C.orange:C.red,fontSize:13,fontWeight:600,margin:0,lineHeight:1}}>
              {adherenceTxt}{planVsReal.adherence!==null&&adherenceTxt!=="Completado"&&adherenceTxt!=="—"?<span style={{fontSize:11}}>%</span>:""}
              <span style={{color:C.textMuted,fontSize:11,fontWeight:400,marginLeft:8}}>{planVsReal.executed}/{planVsReal.planned} sesiones</span>
            </p>
          </div>
          <ProgressBar pct={planVsReal.adherence||0} color={planVsReal.adherence>=100?C.green:planVsReal.adherence>=75?C.accent:planVsReal.adherence>=50?C.orange:C.red} height={4}/>
          {planVsReal.missed.length>0&&<p style={{color:C.textMuted,fontSize:10,margin:"5px 0 0",lineHeight:1.3}}>Sin entrenar: {planVsReal.missed.join(", ")}</p>}
        </div>}

        {/* Auto-interpretation — only if data exists */}
        {conclusion&&<p style={{color:C.textSub,fontSize:12,margin:"0 0 8px",lineHeight:1.5}}>{conclusion}</p>}
        {recos.length>0&&<div style={{borderTop:`1px solid ${C.border}`,paddingTop:8,marginBottom:8}}>
          {recos.map((r,i)=><div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:i<recos.length-1?5:0}}>
            <span style={{color:C.textMuted,fontSize:11,flexShrink:0,marginTop:1}}>·</span>
            <p style={{color:C.textSub,fontSize:11,margin:0,lineHeight:1.4}}>{r}</p>
          </div>)}
        </div>}

        {/* Comparativa semana anterior */}
        <div style={{display:"flex",gap:12,flexWrap:"wrap",paddingTop:conclusion||recos.length>0?8:0,borderTop:conclusion||recos.length>0?`1px solid ${C.border}`:"none"}}>
          {[
            {label:"Sesiones",cur:daysThisWeek,prev:prevWeek?.days,unit:"",up:true},
            avgRPE?{label:"RPE medio",cur:rpe.toFixed(1),prev:prevRpe||null,unit:"/10",up:false}:null,
            {label:"Proteína",cur:daysHit,prev:prevWeek?.protDays,unit:"/7",up:true},
          ].filter(Boolean).map(({label,cur,prev,unit,up})=>(
            <div key={label} style={{flex:1,minWidth:70}}>
              <p style={{color:C.textMuted,fontSize:10,textTransform:"uppercase",letterSpacing:1.2,margin:"0 0 2px"}}>{label}</p>
              <p style={{color:C.text,fontSize:18,fontWeight:700,margin:"0 0 1px",lineHeight:1}}>{cur}{unit}</p>
              {prev!=null&&(()=>{
                const diff=parseFloat(cur)-parseFloat(prev);
                if(!isFinite(diff)) return null;
                if(diff===0) return <p style={{color:C.textMuted,fontSize:10,margin:0}}>= igual</p>;
                const better=(up&&diff>0)||(!up&&diff<0);
                return <p style={{color:better?C.green:C.textMuted,fontSize:10,margin:0}}>{diff>0?"+":"−"}{Math.abs(diff).toFixed(label==="RPE medio"?1:0)}{unit}</p>;
              })()}
            </div>
          ))}
        </div>
      </div>;
    })()}

    <SectionLabel>Esta semana</SectionLabel>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:20}}>
      {[{label:"Días",val:daysThisWeek,unit:"/ 7",status:daysThisWeek>=4?C.green:daysThisWeek>=2?C.orange:null},{label:"RPE",val:avgRPE||"—",unit:"/10",status:avgRPE>=8?C.red:null},{label:"Proteína",val:daysHit,unit:"/ 7",status:daysHit>=5?C.green:daysHit>=3?C.orange:C.red}].map(({label,val,unit,status})=>(
        <Card key={label} style={{padding:"14px 8px",textAlign:"center"}}>
          <p style={{color:C.textMuted,fontSize:10,textTransform:"uppercase",letterSpacing:1.2,margin:"0 0 6px",fontWeight:400,color:C.textMuted}}>{label}</p>
          <p style={{color:C.text,fontSize:22,fontWeight:700,margin:"0",lineHeight:1,letterSpacing:-0.5}}>{val}</p>
          <p style={{color:C.textMuted,fontSize:10,margin:"4px 0 0"}}>{unit}</p>
          {status&&<div style={{width:4,height:4,borderRadius:"50%",background:status,margin:"6px auto 0"}}/>}
        </Card>
      ))}
    </div>
    <Card style={{marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <SectionLabel>Consistencia proteína</SectionLabel>
        <p style={{color:daysHit>=5?C.green:daysHit>=3?C.orange:C.red,fontSize:12,fontWeight:700,margin:0}}>{Math.round((daysHit/7)*100)}%</p>
      </div>
      <div style={{display:"flex",gap:4,marginBottom:5}}>
        {last7.map((hit,i)=><div key={i} style={{flex:1,height:8,borderRadius:6,background:hit?C.green:C.borderLight}}/>)}
      </div>
      <p style={{color:C.textMuted,fontSize:10,margin:0}}>{daysHit>=5?"✓ Excelente":daysHit>=3?"Mejorable — objetivo: 5+ días con ≥"+pt+"g":" Baja — impacta directamente en el músculo"}</p>
    </Card>
    {volEntries.length>0&&<Card style={{marginBottom:14}}>
      <SectionLabel>Volumen por músculo</SectionLabel>
      {volEntries.map(([grupo,sets])=>{
        const mev=MEV[grupo]||6;const mav=MAV[grupo]||14;
        const pct=Math.min(100,Math.round((sets/mav)*100));
        const color=sets<mev?C.orange:sets<=mav?C.green:C.red;
        return <div key={grupo} style={{marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
            <p style={{color:C.textSub,fontSize:12,margin:0}}>{grupo}</p>
            <p style={{color:C.textMuted,fontSize:11,fontWeight:400,margin:0}}>{sets} series · {sets<mev?"bajo MEV":sets<=mav?"✓ óptimo":"sobre MAV"}</p>
          </div>
          <ProgressBar pct={pct} color={color} height={3}/>
        </div>;
      })}
    </Card>}
    {weekPRs.length>0&&<Card style={{marginBottom:12,background:C.surface,border:`1px solid ${C.border}`}}>
      <SectionLabel>PRs esta semana</SectionLabel>
      {weekPRs.map(ej=><p key={ej.id} style={{color:C.text,fontSize:13,fontWeight:500,margin:"0 0 4px"}}>{ej.nombre}</p>)}
    </Card>}
  </div>;
}

function ProgresoCuerpo(){
  const [objectives,setObjectives]=useState(()=>loadObjectives());
  function saveObjectives(upd){setObjectives(upd);save(K.objectives,upd);}
  const [profile,setProfile]=useState(()=>load(K.nutProfile)||NUT_PROFILE_SEED);
  function saveProfile(upd){setProfile(upd);save(K.nutProfile,upd);}
  const medidas=safeArr(load(K.medidas));
  const ultimaMedida=medidas.length?medidas[0]:null;
  const pesoActual=safeNum(ultimaMedida?.peso,65.7);
  const pesoInicial=medidas.length>1?safeNum(medidas[medidas.length-1]?.peso,pesoActual):pesoActual;
  const grasaActual=safeNum(ultimaMedida?.grasa,10);
  const BMR=Math.round(10*pesoActual+6.25*profile.altura-5*profile.edad+5);
  const TDEE=Math.round(BMR*profile.actividad);
  const surplusExtra=grasaActual<8?500:grasaActual<12?400:grasaActual<16?350:300;
  const surplus=TDEE+surplusExtra;
  const proteinTarget=Math.round(pesoActual*2);
  const fatTarget=Math.round((surplus*0.25)/9);
  const carbTarget=Math.round((surplus-proteinTarget*4-fatTarget*9)/4);
  const gainRate=medidas.length>1?(()=>{
    const n=safeNum(medidas[0]?.peso,0);
    const o=safeNum(medidas[medidas.length-1]?.peso,0);
    const w=Math.max(1,safeWeeksBetween(medidas[medidas.length-1]?.fecha, medidas[0]?.fecha));
    const rate=(n-o)/w;
    return isFinite(rate)?rate.toFixed(2):null;
  })():null;
  const gainOk=gainRate&&parseFloat(gainRate)>=0.15&&parseFloat(gainRate)<=0.5;
  const gainSlow=gainRate&&parseFloat(gainRate)<0.15;

  return <div>
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:18,marginBottom:14}}>
      <Tag color="#0a7aff">Ganancia masa · {grasaActual}% grasa</Tag>
      <p style={{color:C.text,fontSize:20,fontWeight:700,margin:"8px 0 2px"}}>{surplus} kcal/día</p>
      <p style={{color:C.textMuted,fontSize:11,margin:"0 0 14px"}}>TDEE {TDEE} + {surplusExtra} superávit · {pesoActual}kg</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
        {[["Proteínas",proteinTarget+"g"],["Carbohidratos",carbTarget+"g"],["Grasas",fatTarget+"g"]].map(([l,v])=>(
          <div key={l} style={{background:C.surface,borderRadius:8,padding:"9px 6px",textAlign:"center"}}>
            <p style={{color:C.textMuted,fontSize:10,margin:"0 0 3px"}}>{l}</p>
            <p style={{color:C.text,fontSize:16,fontWeight:700,margin:0}}>{v}</p>
          </div>
        ))}
      </div>
    </div>

    {/* Latest body metrics */}
    {ultimaMedida&&<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14}}>
      {[["Peso",ultimaMedida.peso,"kg"],["Grasa",ultimaMedida.grasa,"%"],["Masa magra",ultimaMedida.masaMagra,"kg"]].map(([l,v,u])=>(
        <Card key={l} style={{padding:"12px 8px",textAlign:"center"}}>
          <p style={{color:C.textMuted,fontSize:10,textTransform:"uppercase",letterSpacing:1.2,margin:"0 0 5px",fontWeight:400}}>{l}</p>
          <p style={{color:C.text,fontSize:20,fontWeight:700,margin:0,letterSpacing:-0.5}}>{v||"—"}<span style={{color:C.textMuted,fontSize:11,fontWeight:400}}>{v?u:""}</span></p>
        </Card>
      ))}
    </div>}

    {gainRate!==null?<Card style={{marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
        <SectionLabel>Velocidad de ganancia</SectionLabel>
        <span style={{color:C.textMuted,fontSize:11}}>{gainRate} kg/sem</span>
      </div>
      <p style={{color:C.textSub,fontSize:12,fontWeight:400,margin:"0 0 4px"}}>
        {gainOk?`✓ Ganando ${gainRate}kg/semana. Velocidad óptima para masa limpia.`:
         gainSlow?`! Ganando ${gainRate}kg/semana. Muy lento — sube 100-200 kcal/día.`:
         `! Ganando ${gainRate}kg/semana. Demasiado rápido — reduce 100 kcal para menos grasa.`}
      </p>
      <p style={{color:C.textMuted,fontSize:11,margin:0}}>{pesoInicial}kg → {pesoActual}kg · rango ideal: 0.15–0.5 kg/sem</p>
    </Card>:<Card style={{marginBottom:14}}>
      <p style={{color:C.textSub,fontSize:12,fontWeight:500,margin:"0 0 3px"}}>Velocidad de ganancia</p>
      <p style={{color:C.textMuted,fontSize:12,margin:0}}>Añade 2+ evaluaciones en Cuerpo para ver tu ritmo.</p>
    </Card>}
    <div style={{marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <SectionLabel>Objetivos</SectionLabel>
        <Btn onClick={()=>saveObjectives([...objectives,{id:"o"+Date.now(),name:"Nuevo objetivo",current:"",target:"",unit:""}])} color={C.accent} style={{padding:"5px 12px",fontSize:11}}>+ Añadir</Btn>
      </div>
      {objectives.map((obj,i)=>(
        <Card key={obj.id} style={{marginBottom:8}}>
          <div style={{display:"flex",gap:6,marginBottom:6}}>
            <Input type="text" value={obj.name} onChange={e=>{const upd=[...objectives];upd[i]={...upd[i],name:e.target.value};saveObjectives(upd);}} placeholder="Objetivo" style={{flex:2,fontSize:12}}/>
            <button onClick={()=>saveObjectives(objectives.filter(o=>o.id!==obj.id))} style={{background:"none",border:"none",color:C.red,cursor:"pointer",fontSize:14}}></button>
          </div>
          <div style={{display:"flex",gap:6}}>
            <div style={{flex:1}}><p style={{color:C.textMuted,fontSize:10,margin:"0 0 3px"}}>Actual</p><Input value={obj.current} onChange={e=>{const upd=[...objectives];upd[i]={...upd[i],current:e.target.value};saveObjectives(upd);}} style={{fontSize:12}}/></div>
            <div style={{flex:1}}><p style={{color:C.textMuted,fontSize:10,margin:"0 0 3px"}}>Meta</p><Input type="text" value={obj.target} onChange={e=>{const upd=[...objectives];upd[i]={...upd[i],target:e.target.value};saveObjectives(upd);}} style={{fontSize:12}}/></div>
            <div style={{flex:"0 0 55px"}}><p style={{color:C.textMuted,fontSize:10,margin:"0 0 3px"}}>Unidad</p><Input type="text" value={obj.unit} onChange={e=>{const upd=[...objectives];upd[i]={...upd[i],unit:e.target.value};}} style={{fontSize:12}}/></div>
          </div>
        </Card>
      ))}
    </div>
    <MedidasPanel/>
    <Card style={{marginTop:14}}>
      <SectionLabel>Perfil nutricional</SectionLabel>
      <div style={{display:"flex",gap:8,marginBottom:8}}>
        <div style={{flex:1}}><p style={{color:C.textMuted,fontSize:10,margin:"0 0 4px"}}>Altura (cm)</p><Input value={profile.altura} onChange={e=>saveProfile({...profile,altura:parseInt(e.target.value)||175})}/></div>
        <div style={{flex:1}}><p style={{color:C.textMuted,fontSize:10,margin:"0 0 4px"}}>Edad</p><Input value={profile.edad} onChange={e=>saveProfile({...profile,edad:parseInt(e.target.value)||31})}/></div>
      </div>
      {[[1.2,"Sedentario"],[1.375,"Ligero — 1-3 días/sem"],[1.55,"Moderado — 3-5 días/sem"],[1.725,"Activo — 6-7 días/sem"],[1.9,"Muy activo — 2x/día"]].map(([val,label])=>(
        <button key={val} onClick={()=>saveProfile({...profile,actividad:val})} style={{display:"block",width:"100%",background:profile.actividad===val?"#0a7aff"+"22":C.surface,color:profile.actividad===val?"#0a7aff":C.textSub,border:`1px solid ${profile.actividad===val?"#0a7aff"+"66":C.border}`,borderRadius:8,padding:"7px 12px",cursor:"pointer",fontSize:11,textAlign:"left",fontWeight:profile.actividad===val?700:400,marginBottom:4}}>{profile.actividad===val?"✓ ":""}{label}</button>
      ))}
    </Card>
  </div>;
}

function ProgresoPlantificar(){
  const [weekPlan,setWeekPlan]=useState(()=>loadWeek());
  const [templates,setTemplates]=useState(()=>load("pg_week_tpl")||[]);
  const [showTpl,setShowTpl]=useState(false);
  const tabs=loadTabs();
  const gymPlanos=loadGymPlanos();
  const dayNames=["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
  function saveWeek(upd){setWeekPlan(upd);save(K.planWeek,upd);}
  function saveTemplates(upd){setTemplates(upd);save("pg_week_tpl",upd);}

  function handleSaveTemplate(){
    // Summarise the plan into a label: "A·B·C" = gym planos used
    const label=dayNames.map((_,di)=>{
      const a=safeArr(weekPlan[di]?.assignments);
      if(!a.length) return null;
      return a.map(x=>(x.planoKey||x.tabId||"?")).join("/");
    }).filter(Boolean).join(" · ");
    const tpl={id:"tpl_"+Date.now(),saved:today(),label:label||"Plantilla",plan:JSON.parse(JSON.stringify(weekPlan))};
    // Keep last 5 templates
    saveTemplates([tpl,...templates].slice(0,5));
    pushToast({type:"success",text:"Plantilla guardada"});
  }

  function handleApplyTemplate(tpl){
    saveWeek(tpl.plan);
    setShowTpl(false);
    pushToast({type:"success",text:`Plantilla del ${tpl.saved} aplicada`});
  }
  const allTabOptions=[
    {tabId:"gym",label:" Gym A",planoKey:"A"},{tabId:"gym",label:" Gym B",planoKey:"B"},{tabId:"gym",label:" Gym C",planoKey:"C"},
    ...tabs.filter(t=>t.type!=="gym").map(t=>({tabId:t.id,label:`${t.icon} ${t.name}`,planoKey:null})),
  ];
  return <div>
    {/* Template controls */}
    <div style={{display:"flex",gap:8,marginBottom:12,alignItems:"center"}}>
      <p style={{color:C.text,fontSize:13,fontWeight:600,margin:0,flex:1}}>Planificar semana</p>
      <button onClick={handleSaveTemplate} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.textSub,padding:"5px 10px",cursor:"pointer",fontSize:11,fontWeight:500}}> Guardar plantilla</button>
      {templates.length>0&&<button onClick={()=>setShowTpl(s=>!s)} style={{background:showTpl?C.accent+"22":C.surface,border:`1px solid ${showTpl?C.accent:C.border}`,borderRadius:8,color:showTpl?C.accent:C.textSub,padding:"5px 10px",cursor:"pointer",fontSize:11,fontWeight:500}}> {templates.length}</button>}
    </div>
    {showTpl&&<div style={{background:C.surface,borderRadius:12,padding:12,marginBottom:14}}>
      <p style={{color:C.textSub,fontSize:11,fontWeight:700,margin:"0 0 8px"}}>Plantillas guardadas</p>
      {templates.map(tpl=>(
        <div key={tpl.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${C.border}`}}>
          <div>
            <p style={{color:C.text,fontSize:12,fontWeight:500,margin:0}}>{tpl.label}</p>
            <p style={{color:C.textMuted,fontSize:10,margin:0}}>Guardada el {tpl.saved}</p>
          </div>
          <div style={{display:"flex",gap:6}}>
            <button onClick={()=>handleApplyTemplate(tpl)} style={{background:C.accent,color:"#000",border:"none",borderRadius:8,padding:"5px 12px",cursor:"pointer",fontSize:11,fontWeight:700}}>Aplicar</button>
            <button onClick={()=>saveTemplates(templates.filter(t=>t.id!==tpl.id))} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,color:C.textMuted,padding:"5px 8px",cursor:"pointer",fontSize:11}}>✕</button>
          </div>
        </div>
      ))}
    </div>}
    {dayNames.map((day,di)=>{
      const assignments=weekPlan[di]?.assignments||[];
      return <Card key={di} style={{marginBottom:8}}>
        <p style={{color:C.text,fontSize:13,fontWeight:600,margin:"0 0 8px"}}>{day}</p>
        <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:6}}>
          {assignments.map((a,ai)=>{
            const color=gymPlanos[a.planoKey]?.color||tabs.find(t=>t.id===a.tabId)?.color||C.accent;
            const label=a.tabId==="gym"?` Gym ${a.planoKey}`:`${tabs.find(t=>t.id===a.tabId)?.icon||""} ${tabs.find(t=>t.id===a.tabId)?.name||a.tabId}`;
            return <div key={ai} style={{display:"flex",alignItems:"center",gap:4,background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,padding:"4px 10px"}}>
              <p style={{color:C.text,fontSize:11,fontWeight:400,margin:0}}>{label}</p>
              <button onClick={()=>{const upd=[...weekPlan];upd[di]={...upd[di],assignments:assignments.filter((_,i)=>i!==ai)};saveWeek(upd);}} style={{background:"none",border:"none",color,cursor:"pointer",fontSize:10,padding:0}}>✕</button>
            </div>;
          })}
        </div>
        <select onChange={e=>{if(!e.target.value) return;const opt=JSON.parse(e.target.value);const upd=[...weekPlan];upd[di]={...upd[di],assignments:[...assignments,opt]};saveWeek(upd);e.target.value="";}} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.textSub,padding:"7px 10px",fontSize:11,width:"100%"}}>
          <option value="">+ Añadir entreno</option>
          {allTabOptions.map((o,i)=><option key={i} value={JSON.stringify(o)}>{o.label}</option>)}
        </select>
      </Card>;
    })}
  </div>;
}



const CAT_LABELS={proteina:"Proteína",lacteos:"Lácteos",carbos:"Carbos",legumbres:"Legumbres",verduras:"Verduras",frutas:"Frutas",condimentos:"Condimentos",otros:"Otros"};
const CAT_ORDER=["proteina","lacteos","carbos","legumbres","verduras","frutas","condimentos","otros"];

function ShoppingAddForm({onAdd,color}){
  const [open,setOpen]=useState(false);
  const [name,setName]=useState("");
  const [cat,setCat]=useState("otros");
  if(!open) return <Btn onClick={()=>setOpen(true)} color={color} style={{padding:"6px 14px",fontSize:12}}>+ Añadir</Btn>;
  return <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:14,marginTop:8}}>
    <div style={{display:"flex",gap:8,marginBottom:8}}>
      <Input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Nombre del producto" style={{flex:2,fontSize:12}} onEnter={()=>{if(name.trim()){onAdd({id:"s_"+Date.now(),name:name.trim(),cat,done:false});setName("");setOpen(false);}}}/>
    </div>
    <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:10}}>
      {CAT_ORDER.map(c=>(
        <button key={c} onClick={()=>setCat(c)} style={{background:cat===c?color:C.surface,color:cat===c?"#000":C.textSub,border:`1px solid ${cat===c?color:C.border}`,borderRadius:8,padding:"4px 10px",fontSize:10,cursor:"pointer",fontWeight:cat===c?700:400}}>{CAT_LABELS[c]||c}</button>
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
  if(!open) return <button onClick={()=>setOpen(true)} style={{background:"none",border:`1px dashed ${color}44`,borderRadius:10,color,width:"100%",padding:"9px",cursor:"pointer",fontSize:12,marginBottom:12}}>+ Añadir alimento personalizado</button>;
  return <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:14,marginBottom:12}}>
    <div style={{display:"flex",gap:8,marginBottom:8}}>
      <Input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Nombre" style={{flex:2,fontSize:12}}/>
      <Input value={prot} onChange={e=>setProt(e.target.value)} placeholder="g prot" style={{flex:1,fontSize:12}}/>
    </div>
    <div style={{display:"flex",gap:8}}>
      <Btn onClick={()=>{if(!name.trim()||!prot)return;const e={name:name.trim(),prot:parseFloat(prot)||0,time:new Date().toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"})};onAdd(e);if(onSaveFood)onSaveFood({id:"cf_"+Date.now(),name:e.name,prot:e.prot});setName("");setProt("");setOpen(false);}} color={color} style={{flex:1}}>Añadir</Btn>
      <button onClick={()=>{setOpen(false);setName("");setProt("");}} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:10,color:C.textMuted,padding:"10px 14px",cursor:"pointer",fontSize:12}}>Cancelar</button>
    </div>
  </div>;
}


// Catalogue of suggestions per tag type. Extend here when needed.
const SUGGEST_CATALOGUE = {
  P: {foods:["Pollo","Atún","Huevos","Yogurt griego","Pechuga","Claras"],  cat:"proteina", max:3},
  C: {foods:["Arroz","Avena","Patata","Pan integral","Pasta integral"],    cat:"carbos",   max:2},
  M: {foods:["Manzana","Espinacas","Frutos secos","Zanahoria","Naranja"],  cat:"verduras", max:2},
};
const SUGGEST_FALLBACK = {
  P: {foods:["Pollo","Atún","Huevos"],        cat:"proteina", max:2},
  C: {foods:["Arroz","Avena"],                cat:"carbos",   max:2},
  M: {foods:["Manzana","Espinacas"],          cat:"verduras", max:1},
};

function SugerirItemsBtn({mealPlan,shopping,saveShopping}){
  function handle(){
    const allMeals  = Object.values(mealPlan||{}).flatMap(d=>d?.meals||[]);
    const hasPlan   = allMeals.some(m=>m?.desc?.trim());
    const tagCounts = {
      P: allMeals.filter(m=>m?.protTag==="P").length,
      C: allMeals.filter(m=>m?.protTag==="C").length,
      M: allMeals.filter(m=>m?.protTag==="M").length,
    };
    const hasTags = tagCounts.P+tagCounts.C+tagCounts.M > 0;

    // Pick catalogue: if the user tagged meals, use those signals;
    // if not but there is a plan (text), fall back to balanced defaults;
    // if there is no plan at all, say so.
    if(!hasPlan && !hasTags){
      pushToast({type:"info", text:"El plan de comidas está vacío. Añade comidas para obtener sugerencias."});
      return;
    }
    const catalogue = hasTags ? SUGGEST_CATALOGUE : SUGGEST_FALLBACK;

    // Dedup: exact match OR either string contains the other (handles "yogur" vs "yogurt griego")
    const inList = (name) => {
      const n = name.toLowerCase();
      return (shopping||[]).some(s=>{
        const existing = (s.name||"").toLowerCase();
        return existing===n || existing.includes(n) || n.includes(existing);
      });
    };

    // Build suggestions for each active tag (or all tags for fallback)
    const items = [];
    let idSeed = Date.now();
    Object.entries(catalogue).forEach(([tag, {foods, cat, max}])=>{
      // For catalogue mode: only include tag if user actually used it
      if(hasTags && tagCounts[tag]===0) return;
      foods.filter(f=>!inList(f)).slice(0,max).forEach(f=>{
        items.push({id:`g_${++idSeed}_${f}`, name:f, cat, done:false});
      });
    });

    if(items.length===0){
      const reason = hasTags
        ? "Ya tienes en lista todos los básicos que cuadran con tu plan."
        : "La lista ya tiene los básicos sugeridos.";
      pushToast({type:"info", text:reason});
      return;
    }

    saveShopping([...(shopping||[]),...items]);

    // Summarise names: "pollo, arroz y manzana"
    const names = items.map(i=>i.name.toLowerCase());
    const summary = names.length<=3
      ? names.slice(0,-1).join(", ")+(names.length>1?" y ":"")+names[names.length-1]
      : names.slice(0,3).join(", ")+` y ${names.length-3} más`;
    pushToast({
      type:"success",
      text:`Añadido${items.length>1?"s":""} ${items.length} item${items.length>1?"s":""}: ${summary}`,
    });
  }

  return (
    <button
      onClick={handle}
      style={{
        background:C.card,
        border:`1px solid ${C.border}`,
        borderRadius:8,
        color:C.textSub,
        padding:"5px 10px",
        cursor:"pointer",
        fontSize:11,
        fontWeight:500,
        whiteSpace:"nowrap",
      }}
    >
      Sugerir items
    </button>
  );
}

function ScreenNutricion(){
  const nutColor=C.accent;
  const [nutTab,setNutTab]=useState("comidas");
  const [mealPlan,setMealPlan]=useState(()=>load(K.mealPlan)||MEAL_PLAN_SEED);
  const [shopping,setShopping]=useState(()=>load(K.shopping)||SHOPPING_SEED);
  function saveMealPlan(upd){setMealPlan(upd);save(K.mealPlan,upd);}
  function saveShopping(upd){setShopping(upd);save(K.shopping,upd);}
  const todayDow=(new Date().getDay()+6)%7;
  const lastTrainedToday=getTrainedSessions(today()).length>0;
  const pw=load(K.medidas)?.length?parseFloat(load(K.medidas)[0].peso)||65.7:65.7;
  const pt=Math.round(pw*2);
  const allLog=load(K.proteinLog)||{};
  const last7=[...Array(7)].map((_,i)=>{
    const d=new Date();d.setDate(d.getDate()-i);
    const ds=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    return (allLog[ds]||[]).reduce((a,e)=>a+(e.prot||0),0)>=pt;
  }).reverse();
  const daysHit=last7.filter(Boolean).length;
  const dayNames=["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
  const orderedDays=Array.from({length:7},(_,i)=>(todayDow+i)%7);

  return <div>
    {/* Adherence header */}
    <div style={{background:C.surface,borderRadius:12,padding:"10px 14px",marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div>
        <p style={{color:C.text,fontSize:12,fontWeight:700,margin:"0 0 4px"}}>Proteína esta semana</p>
        <div style={{display:"flex",gap:3}}>{last7.map((hit,i)=><div key={i} style={{width:10,height:10,borderRadius:"50%",background:hit?C.green:C.borderLight}}/>)}</div>
      </div>
      <div style={{textAlign:"right"}}>
        <p style={{color:daysHit>=5?C.green:daysHit>=3?C.orange:C.red,fontSize:20,fontWeight:700,margin:0,lineHeight:1}}>{daysHit}/7</p>
        <p style={{color:C.textMuted,fontSize:10,margin:"2px 0 0"}}>{daysHit>=5?"✓ Excelente":daysHit>=3?"Mejorable":"Baja"}</p>
      </div>
    </div>
    <div style={{display:"flex",gap:0,marginBottom:16,background:C.bg,borderRadius:10,padding:3,border:`1px solid ${C.border}`}}>
      {[["comidas","Comidas"],["compra","Compra"]].map(([id,label])=>(
        <button key={id} onClick={()=>setNutTab(id)} style={{flex:1,background:nutTab===id?C.card:"transparent",color:nutTab===id?C.text:C.textMuted,border:nutTab===id?`1px solid ${C.border}`:"1px solid transparent",borderRadius:8,padding:"8px 10px",fontSize:12,fontWeight:nutTab===id?600:400,cursor:"pointer",transition:"all 0.12s",letterSpacing:-0.2,boxShadow:nutTab===id?C.shadowSm:"none"}}>{label}</button>
      ))}
    </div>
    {nutTab==="comidas"&&<div>
      {!lastTrainedToday&&loadWeek()[(new Date().getDay()+6)%7]?.assignments?.length>0&&(
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"12px 14px",marginBottom:12,display:"flex",gap:10}}>
          <span></span><div><p style={{color:C.textSub,fontSize:12,fontWeight:500,margin:"0 0 2px"}}>Pre-entreno</p><p style={{color:C.textSub,fontSize:12,margin:0}}>1-2h antes: <strong>40-60g carbos + 20g proteína</strong></p></div>
        </div>
      )}
      {lastTrainedToday&&<div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"12px 14px",marginBottom:12,display:"flex",gap:10}}>
        <span></span><div><p style={{color:C.textSub,fontSize:12,fontWeight:500,margin:"0 0 2px"}}>Post-entreno</p><p style={{color:C.textSub,fontSize:12,margin:0}}>En 60 min: <strong>30-40g proteína + 60-80g carbos</strong></p></div>
      </div>}
      {orderedDays.map((di)=>{
        const MEAL_TYPES=["Desayuno","Media mañana","Comida","Merienda","Cena"];
        const isToday=di===todayDow;
        return <Card key={di} style={{marginBottom:10,border:isToday?`2px solid ${nutColor}`:undefined}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <p style={{color:isToday?nutColor:C.text,fontSize:isToday?15:14,fontWeight:700,margin:0}}>{dayNames[di]}</p>
            {isToday&&<Tag color={nutColor}>Hoy</Tag>}
          </div>
          {MEAL_TYPES.map((mt,mi)=>{
            const val=(mealPlan[di]?.meals||[])[mi]?.desc||"";
            const protTag=(mealPlan[di]?.meals||[])[mi]?.protTag||"";
            return <div key={mi} style={{marginBottom:7}}>
              <p style={{color:C.textMuted,fontSize:10,margin:"0 0 3px",textTransform:"uppercase",letterSpacing:1.2}}>{mt}</p>
              <div style={{display:"flex",gap:5,alignItems:"center"}}>
                <Input type="text" value={val} onChange={e=>{const upd={...mealPlan};const meals=upd[di]?.meals||MEAL_TYPES.map(t=>({t,desc:"",protTag:""}));upd[di]={...upd[di],meals:meals.map((m,idx)=>idx===mi?{...m,desc:e.target.value}:m)};saveMealPlan(upd);}} placeholder="Ej: Avena con fruta y huevos" style={{flex:1,fontSize:12,padding:"7px 12px"}}/>
                <div style={{display:"flex",gap:3}}>
                  {[["Prot","P"],["Carb","C"],["Bal","M"]].map(([icon,code])=>(
                    <button key={code} onClick={()=>{const upd={...mealPlan};const meals=upd[di]?.meals||MEAL_TYPES.map(t=>({t,desc:"",protTag:""}));upd[di]={...upd[di],meals:meals.map((m,idx)=>idx===mi?{...m,protTag:protTag===code?"":code}:m)};saveMealPlan(upd);}} style={{background:protTag===code?code==="P"?C.red+"33":code==="C"?C.yellow+"33":C.blue+"22":C.surface,border:`1px solid ${protTag===code?code==="P"?C.red:code==="C"?C.yellow:C.blue:C.border}`,borderRadius:6,padding:"4px 6px",cursor:"pointer",fontSize:11}}>{icon}</button>
                  ))}
                </div>
              </div>
            </div>;
          })}
        </Card>;
      })}
    </div>}
    {nutTab==="compra"&&<div>
      {/* Plan-to-list connection */}
      <div style={{background:C.surface,borderRadius:12,padding:"10px 14px",marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <p style={{color:C.textSub,fontSize:11,margin:0}}>La lista debe reflejar tu plan semanal</p>
        <SugerirItemsBtn mealPlan={mealPlan} shopping={shopping} saveShopping={saveShopping}/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <p style={{color:C.textMuted,fontSize:12,margin:0}}>{shopping.filter(s=>s.done).length}/{shopping.length} comprados</p>
        <div style={{display:"flex",gap:6}}>
          <button onClick={()=>saveShopping(shopping.map(s=>({...s,done:false})))} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,color:C.textSub,padding:"5px 10px",cursor:"pointer",fontSize:11}}>Resetear ✓</button>
          <button onClick={()=>saveShopping([])} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,color:C.textMuted,padding:"5px 10px",cursor:"pointer",fontSize:11}}>Limpiar</button>
        </div>
      </div>
      <ProgressBar pct={Math.round((shopping.filter(s=>s.done).length/Math.max(1,shopping.length))*100)} color={C.green} height={4}/>
      <div style={{marginTop:12,marginBottom:4}}><ShoppingAddForm onAdd={item=>saveShopping([...shopping,item])} color={nutColor}/></div>
      <div style={{marginTop:14}}>
        {CAT_ORDER.map(cat=>{
          const items=shopping.filter(s=>s.cat===cat);
          if(!items.length) return null;
          const allDone=items.every(s=>s.done);
          return <div key={cat} style={{marginBottom:14}}>
            <p style={{color:allDone?C.textMuted:C.textSub,fontSize:11,fontWeight:700,margin:"0 0 6px",textDecoration:allDone?"line-through":"none"}}>{CAT_LABELS[cat]||cat}</p>
            {items.map(item=>(
              <div key={item.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
                <button onClick={()=>saveShopping(shopping.map(s=>s.id===item.id?{...s,done:!s.done}:s))} style={{width:22,height:22,borderRadius:6,background:item.done?C.green:C.surface,border:`2px solid ${item.done?C.green:C.borderLight}`,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",color:"#000",fontSize:13,fontWeight:700}}>{item.done?"✓":""}</button>
                <input value={item.name} onChange={e=>saveShopping(shopping.map(s=>s.id===item.id?{...s,name:e.target.value}:s))} style={{flex:1,background:"transparent",border:"none",color:item.done?C.textMuted:C.text,fontSize:13,padding:0,outline:"none",textDecoration:item.done?"line-through":"none",fontFamily:"inherit"}}/>
                <button onClick={()=>saveShopping(shopping.filter(s=>s.id!==item.id))} style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:12,opacity:0.5}}>✕</button>
              </div>
            ))}
          </div>;
        })}
      </div>
    </div>}
  </div>;
}


function BackupPanel({onClose}){
  const [jsonText,setJsonText]=useState("");
  const [mode,setMode]=useState(null); // "paste" | null
  const fileRef=useRef(null);

  function handleExport(){
    try{
      const data=exportData(); // plain object
      const keyCount=Object.keys(data).length;
      if(keyCount===0){
        pushToast({type:"warning",text:"No hay datos que exportar todavía."});
        return;
      }
      const payload={version:2,exported:today(),data};
      const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a");
      a.href=url;
      a.download=`alvaro-training-${today()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      pushToast({type:"success",text:`Exportado · ${keyCount} registros · ${today()}`});
    }catch(e){
      pushToast({type:"error",text:"No se pudo exportar. Inténtalo de nuevo."});
    }
  }

  function handlePasteImport(){
    if(!jsonText.trim()){
      pushToast({type:"warning",text:"El campo está vacío. Pega tu JSON primero."});
      return;
    }
    let parsed;
    try{ parsed=JSON.parse(jsonText); }
    catch{ pushToast({type:"error",text:"JSON inválido — revisa que el texto esté bien formado."}); return; }

    const data=parsed?.data;
    if(!data||typeof data!=="object"||Array.isArray(data)){
      pushToast({type:"error",text:"Estructura no compatible — el archivo no es de esta app."});
      return;
    }
    const keys=Object.keys(data);
    if(keys.length===0){
      pushToast({type:"warning",text:"El archivo está vacío o no contiene datos reconocibles."});
      return;
    }
    let written=0;
    keys.forEach(k=>{ if(typeof k==="string"&&k.length>0&&data[k]!==undefined){ save(k,data[k]); written++; } });
    setMode(null); setJsonText("");
    pushToast({type:"success",duration:6000,text:`Importación completada · ${written} registros · recarga la app`});
  }

  function handleFileImport(e){
    const file=e.target.files?.[0];
    if(!file) return;
    if(!file.name.endsWith(".json")){
      pushToast({type:"error",text:"El archivo debe ser un .json exportado desde esta app."});
      return;
    }
    importData(file,(result)=>{
      if(result.ok){
        pushToast({type:"success",duration:6000,
          text:`Importación completada · ${result.count} registros · recarga la app`});
      } else {
        const msgs={
          read_error: "No se pudo leer el archivo.",
          empty:      "El archivo está vacío.",
          parse_error:"El archivo no es JSON válido.",
          no_data:    "Estructura no compatible — el archivo no es de esta app.",
          empty_data: "El archivo no contiene datos reconocibles.",
        };
        pushToast({type:"error",text:msgs[result.reason]||"No se pudo importar el archivo."});
      }
    });
  }

  return <div style={{maxWidth:500,margin:"8px auto 0",background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
      <p style={{color:C.text,fontSize:14,fontWeight:600,margin:0}}>Ajustes</p>
      <button onClick={onClose} style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:18,padding:0}}>✕</button>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      <Btn onClick={handleExport} color={C.accent} style={{width:"100%",justifyContent:"center"}}>Exportar datos</Btn>
      <Btn onClick={()=>setMode(mode==="file"?null:"file")} color={C.blue} style={{width:"100%",justifyContent:"center"}}>Importar archivo JSON</Btn>
      {mode==="file"&&<input ref={fileRef} type="file" accept=".json" onChange={handleFileImport} style={{color:C.text,fontSize:12,padding:"6px 0"}}/>}
      <Btn onClick={()=>setMode(mode==="paste"?null:"paste")} color={C.purple} style={{width:"100%",justifyContent:"center"}}>Pegar JSON</Btn>
      {mode==="paste"&&<>
        <textarea value={jsonText} onChange={e=>setJsonText(e.target.value)} placeholder='Pega tu JSON aquí...' rows={5}
          style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,color:C.text,padding:10,fontSize:12,fontFamily:"monospace",resize:"vertical",width:"100%",boxSizing:"border-box"}}/>
        <Btn onClick={handlePasteImport} color={C.green} style={{width:"100%",justifyContent:"center"}}>✓ Importar</Btn>
      </>}
    </div>
  </div>;
}


function AppInner(){
  const [screen,setScreen]=useState("hoy");
  const [initProTab,setInitProTab]=useState(null);
  const [entrenTab,setEntrenTab]=useState("gym");
  const [entrenPlano,setEntrenPlano]=useState(null);
  const [showBackup,setShowBackup]=useState(false);

  // Follow device theme; manual override stored in localStorage
  const sysDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const [isDark,setIsDark]=useState(()=>{
    const stored=localStorage.getItem("pg_theme");
    return stored!==null ? stored==="dark" : sysDark;
  });

  useEffect(()=>{
    const mq=window.matchMedia("(prefers-color-scheme: dark)");
    const handler=(e)=>{
      if(localStorage.getItem("pg_theme")===null) setIsDark(e.matches);
    };
    mq.addEventListener("change",handler);
    return ()=>mq.removeEventListener("change",handler);
  },[]);

  C=isDark?DARK:LIGHT;

  const [entrenStarted,setEntrenStarted]=useState(false);
  function handleEmpezar(tabId,planoKey){
    setEntrenTab(tabId);
    setEntrenPlano(planoKey||null);
    setEntrenStarted(true);
    setScreen("entreno");
  }

  const nav=[
    {id:"hoy",    label:"Hoy"},
    {id:"entreno",label:"Entreno"},
    {id:"nutricion",label:"Nutrición"},
    {id:"progreso",label:"Progreso"},
  ];

  const titles={hoy:"Hoy",entreno:"Entrenamiento",progreso:"Progreso",nutricion:"Nutrición"};

  return <div style={{fontFamily:"-apple-system,'SF Pro Text','SF Pro Display',sans-serif",background:C.bg,minHeight:"100vh",color:C.text,paddingBottom:"max(72px,calc(52px + env(safe-area-inset-bottom,20px)))",transition:"background 0.25s,color 0.25s"}}>
    <ToastContainer/>
    {/* Header */}
    <div style={{background:C.bg,borderBottom:`1px solid ${C.border}`,padding:"13px 20px 11px",paddingTop:"max(13px,env(safe-area-inset-top,13px))",position:"sticky",top:0,zIndex:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",maxWidth:500,margin:"0 auto"}}>
        <h1 style={{fontSize:16,fontWeight:500,margin:0,letterSpacing:-0.2,color:C.text}}>{titles[screen]}</h1>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <button onClick={()=>setIsDark(d=>{const next=!d;localStorage.setItem("pg_theme",next?"dark":"light");return next;})} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,color:C.textSub,padding:"6px 9px",cursor:"pointer",fontSize:15,lineHeight:1,display:"flex",alignItems:"center"}}>
            {isDark?"☀️":"🌙"}
          </button>
          <button onClick={()=>setShowBackup(b=>!b)} style={{background:showBackup?C.surface:"none",border:`1px solid ${showBackup?C.border:"transparent"}`,borderRadius:8,color:showBackup?C.text:C.textSub,padding:"6px 9px",cursor:"pointer",fontSize:15,lineHeight:1,display:"flex",alignItems:"center"}}>⚙️</button>
        </div>
      </div>
      {showBackup&&<BackupPanel onClose={()=>setShowBackup(false)}/>}
    </div>

    {/* Content */}
    <div style={{padding:"20px 20px 0",maxWidth:500,margin:"0 auto"}}>
      {screen==="hoy"&&<ScreenHoyMerged
          onEmpezar={handleEmpezar}
          onGoToNutricion={()=>setScreen("nutricion")}
          onGoToSemana={()=>{setInitProTab("semana");setScreen("progreso");}}
          onGoToFisico={()=>{setInitProTab("cuerpo");setScreen("progreso");}}
          onGoToComidas={()=>setScreen("nutricion")}
        />}
      {screen==="entreno"&&<ScreenEntreno initTab={entrenTab} initPlanoKey={entrenPlano} autoStart={entrenStarted} onSessionStarted={()=>setEntrenStarted(false)}/>}
      {screen==="progreso"&&<ScreenProgreso initTab={initProTab}/>}
      {screen==="nutricion"&&<ScreenNutricion/>}
    </div>

    {/* Nav — text-only segment control */}
    <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:100,background:C.bg,borderTop:`1px solid ${C.border}`,display:"flex",padding:`8px 4px max(20px,env(safe-area-inset-bottom,20px))`,WebkitBackdropFilter:"blur(0)",transform:"translateZ(0)"}}>
      {nav.map(t=>{
        const isActive=screen===t.id;
        return <button key={t.id} onClick={()=>{setScreen(t.id);window.scrollTo({top:0,behavior:"instant"});}} style={{flex:1,background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",padding:"4px 0"}}>
          <span style={{fontSize:11,color:isActive?C.text:C.textMuted,fontWeight:isActive?500:400,letterSpacing:-0.1,transition:"color 0.15s"}}>{t.label}</span>
          <div style={{width:isActive?16:0,height:1.5,borderRadius:1,background:C.accent,marginTop:3,transition:"width 0.2s ease"}}/>
        </button>;
      })}
    </div>
  </div>;
}

export default function App(){ return <ErrorBoundary><AppInner/></ErrorBoundary>; }
