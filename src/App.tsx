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
    const accent={success:C.green,error:C.red,warning:C.orange,info:C.text}[type]||C.green;
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
          <p style={{fontSize:16,fontWeight:700,color:"#8e8e93",margin:"0 0 8px"}}>Algo salió mal</p>
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
  accent:      "#8e8e93",
  green:       "#30d158",
  red:         "#ff453a",
  orange:      "#ff9f0a",
  blue:        "#8e8e93",
  yellow:      "#ffd60a",
  purple:      "#bf5af2",
  gymColor:    "#8e8e93",
  cfColor:     "#8e8e93",
  calColor:    "#8e8e93",
  planColor:   "#8e8e93",
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
  accent:      "#8e8e93",
  green:       "#1c8a3a",
  red:         "#c0392b",
  orange:      "#b25000",
  blue:        "#8e8e93",
  yellow:      "#9a6700",
  purple:      "#7d37ba",
  gymColor:    "#8e8e93",
  cfColor:     "#8e8e93",
  calColor:    "#8e8e93",
  planColor:   "#8e8e93",
  shadow:      "0 1px 2px rgba(0,0,0,0.07)",
  shadowSm:    "0 1px 1px rgba(0,0,0,0.05)",
};
let C = DARK;

// ── KEYS ─────────────────────────────────────────────────────────────────────
const K = {
  tabs:"pg_tabs", cargas:"pg_c", medidas:"pg_m",
  gymPlanos:"pg_gp", planWeek:"pg_pw", objectives:"pg_obj",
  rpe:"pg_rpe", snota:"pg_snota", customFoods:"pg_cf", supplements:"pg_sup",
  nutProfile:"pg_nup", mealPlan:"pg_mp", shopping:"pg_sh", proteinLog:"pg_pl", recipes:"pg_recipes",
};
function tabEjKey(id){ return "pg_ej_"+id; }
function tabDataKey(id){ return "pg_td_"+id; }

// ── SEEDS ────────────────────────────────────────────────────────────────────
const DEFAULT_TABS = [
  {id:"gym",    name:"Gym",          icon:"", color:"#8e8e93", type:"gym"},
  {id:"skills", name:"Skills",       icon:"", color:"#8e8e93", type:"cf"},
  {id:"powerlifting", name:"Power Lifting", icon:"", color:"#8e8e93", type:"cf"},
  {id:"wod",    name:"WOD",          icon:"", color:"#8e8e93", type:"cf"},
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
  A:{nombre:"Espalda / Bíceps",color:"#8e8e93",ejercicios:[
    {id:"a1",nombre:"Barra fija con lastre",grupo:"Espalda",series:4,reps:"4-6",descanso:90},
    {id:"a2",nombre:"Pulldown en Polia",    grupo:"Espalda",series:4,reps:"10-8-8-6",descanso:60},
    {id:"a3",nombre:"Remada Landmine",      grupo:"Espalda",series:3,reps:"12-10-10",descanso:60},
    {id:"a4",nombre:"Bícep 7/21",           grupo:"Bíceps", series:3,reps:"21",descanso:60},
    {id:"a5",nombre:"Curl polea baja",      grupo:"Bíceps", series:3,reps:"12-10-10",descanso:60},
  ]},
  B:{nombre:"Pecho / Hombros / Tríceps",color:"#8e8e93",ejercicios:[
    {id:"b1",nombre:"Supino plano barra",    grupo:"Pecho",  series:4,reps:"4-6",descanso:90},
    {id:"b2",nombre:"Press cerrado barra",   grupo:"Tríceps",series:3,reps:"8-10",descanso:75},
    {id:"b3",nombre:"Supino inclinado halt.",grupo:"Pecho",  series:3,reps:"10-8-8",descanso:60},
    {id:"b4",nombre:"Press militar máquina", grupo:"Hombros",series:3,reps:"10-8-8",descanso:75},
    {id:"b5",nombre:"Elevación lateral",     grupo:"Hombros",series:2,reps:"12-10",descanso:60},
    {id:"b6",nombre:"Elevación posterior",   grupo:"Hombros",series:2,reps:"12-10",descanso:60},
    {id:"b7",nombre:"Pec Fly / Crossover",   grupo:"Pecho",  series:3,reps:"12-10-10",descanso:60},
    {id:"b8",nombre:"Trícep francés cuerda", grupo:"Tríceps",series:2,reps:"12-10",descanso:60},
  ]},
  C:{nombre:"Piernas / Core",color:"#8e8e93",ejercicios:[
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
const DEFAULT_SUPPLEMENTS=[
  {id:"sup1",name:"Creatina",dose:"5g",isProtein:false,proteinGrams:0},
  {id:"sup2",name:"Batido de proteínas",dose:"30g",isProtein:true,proteinGrams:30},
];
// ── STORAGE ───────────────────────────────────────────────────────────────────
function load(k){try{const r=localStorage.getItem(k);return r?JSON.parse(r):null;}catch(e){return null;}}
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

// Suggested meals for weekly planning — practical, repeatable, high-protein.
// Stored as app data so it can be reused and evolved later.
const MEAL_SUGGESTIONS = [
  {name:"Avena, plátano y whey",        type:"Desayuno",     kcal:450, prot:35, ing:[{name:"Avena",cat:"carbos"},{name:"Plátano",cat:"frutas"},{name:"Proteína whey",cat:"proteina"},{name:"Leche",cat:"lacteos"}], notes:"Cuece la avena con la leche, añade el plátano en rodajas y mezcla el cacito de whey al final."},
  {name:"Tortilla de claras + tostadas", type:"Desayuno",     kcal:380, prot:30, ing:[{name:"Claras de huevo",cat:"proteina"},{name:"Pan integral",cat:"carbos"},{name:"Aceite de oliva",cat:"condimentos"}], notes:"Cuaja las claras a fuego medio y acompaña con pan tostado."},
  {name:"Yogur griego, granola y miel",  type:"Desayuno",     kcal:400, prot:25, ing:[{name:"Yogur griego",cat:"lacteos"},{name:"Granola",cat:"carbos"},{name:"Miel",cat:"condimentos"}], notes:"Monta en capas el yogur, la granola y un hilo de miel."},
  {name:"Tostadas de aguacate y huevo",  type:"Desayuno",     kcal:420, prot:22, ing:[{name:"Pan integral",cat:"carbos"},{name:"Aguacate",cat:"verduras"},{name:"Huevos",cat:"proteina"}], notes:"Tuesta el pan, machaca el aguacate y corona con huevo a la plancha."},
  {name:"Batido de proteína con avena",  type:"Media mañana", kcal:300, prot:30, ing:[{name:"Proteína whey",cat:"proteina"},{name:"Avena",cat:"carbos"},{name:"Leche",cat:"lacteos"}], notes:"Bate todo hasta que quede homogéneo."},
  {name:"Yogur griego y frutos rojos",   type:"Media mañana", kcal:180, prot:18, ing:[{name:"Yogur griego",cat:"lacteos"},{name:"Frutos rojos",cat:"frutas"}], notes:""},
  {name:"Sándwich de pavo",              type:"Media mañana", kcal:320, prot:25, ing:[{name:"Pan integral",cat:"carbos"},{name:"Pavo",cat:"proteina"},{name:"Lechuga",cat:"verduras"},{name:"Tomate",cat:"verduras"}], notes:""},
  {name:"Plátano y puñado de nueces",    type:"Media mañana", kcal:280, prot:8,  ing:[{name:"Plátano",cat:"frutas"},{name:"Nueces",cat:"otros"}], notes:""},
  {name:"Arroz, pollo y verduras",       type:"Comida",       kcal:600, prot:45, ing:[{name:"Arroz",cat:"carbos"},{name:"Pollo",cat:"proteina"},{name:"Verduras",cat:"verduras"}], notes:"Saltea el pollo, añade las verduras y sirve sobre arroz cocido."},
  {name:"Pasta con atún y tomate",       type:"Comida",       kcal:580, prot:38, ing:[{name:"Pasta",cat:"carbos"},{name:"Atún",cat:"proteina"},{name:"Tomate",cat:"verduras"}], notes:"Cuece la pasta y mezcla con atún y salsa de tomate."},
  {name:"Salmón, patata y ensalada",     type:"Comida",       kcal:620, prot:40, ing:[{name:"Salmón",cat:"proteina"},{name:"Patata",cat:"carbos"},{name:"Ensalada",cat:"verduras"}], notes:"Hornea el salmón con la patata y acompaña con ensalada."},
  {name:"Lentejas con arroz",            type:"Comida",       kcal:520, prot:24, ing:[{name:"Lentejas",cat:"legumbres"},{name:"Arroz",cat:"carbos"}], notes:"Guiso clásico; combina proteína vegetal completa."},
  {name:"Requesón con miel",             type:"Merienda",     kcal:220, prot:24, ing:[{name:"Requesón",cat:"lacteos"},{name:"Miel",cat:"condimentos"}], notes:""},
  {name:"Tostada con crema de cacahuete",type:"Merienda",     kcal:300, prot:12, ing:[{name:"Pan integral",cat:"carbos"},{name:"Crema de cacahuete",cat:"otros"}], notes:""},
  {name:"Batido de proteína",            type:"Merienda",     kcal:150, prot:25, ing:[{name:"Proteína whey",cat:"proteina"},{name:"Leche",cat:"lacteos"}], notes:""},
  {name:"Fruta y queso fresco",          type:"Merienda",     kcal:200, prot:15, ing:[{name:"Fruta",cat:"frutas"},{name:"Queso fresco",cat:"lacteos"}], notes:""},
  {name:"Pollo a la plancha y verduras", type:"Cena",         kcal:480, prot:45, ing:[{name:"Pollo",cat:"proteina"},{name:"Verduras",cat:"verduras"},{name:"Aceite de oliva",cat:"condimentos"}], notes:"A la plancha con un chorrito de aceite."},
  {name:"Merluza al horno con verduras", type:"Cena",         kcal:420, prot:38, ing:[{name:"Merluza",cat:"proteina"},{name:"Verduras",cat:"verduras"}], notes:"Hornea 15-18 min a 200°C."},
  {name:"Carne magra con boniato",       type:"Cena",         kcal:550, prot:42, ing:[{name:"Carne magra",cat:"proteina"},{name:"Boniato",cat:"carbos"}], notes:""},
  {name:"Tortilla francesa y ensalada",  type:"Cena",         kcal:400, prot:28, ing:[{name:"Huevos",cat:"proteina"},{name:"Ensalada",cat:"verduras"}], notes:""},
];

const NUT_PROFILE_SEED = {altura:175, edad:31, actividad:1.55};

const PROTEIN_FOODS = [
  {name:"Pollo 100g",prot:31},{name:"Huevo",prot:6},{name:"Atún lata",prot:25},
  {name:"Yogurt griego",prot:10},{name:"Queso fresco 100g",prot:11},
  {name:"Jamón 50g",prot:13},{name:"Leche 250ml",prot:8},
  {name:"Lentejas 100g",prot:9},{name:"Garbanzos 100g",prot:8},
  {name:"Mantequilla cacahuete 2 cda",prot:8},{name:"Frutos secos 30g",prot:5},
];

// seed medidas
(function(){
  const REF={
    "2025-11-18":{peso:65.7,grasa:7.6,masaMagra:57.7,masaOsea:3.0,imc:21.5,tmb:1742,edadMetabolica:16,aguaCorporal:67.0,grasaVisceral:1.0,altura:175,nivelFisico:8,presionSistolica:111,presionDiastolica:69,frecuenciaCardiaca:75,bicepD:33,bicepI:33,torax:99,abdomen:79.5,cadera:91,musloD:46,musloI:46,gemelo:33,gemeloI:32.5},
    "2025-08-05":{peso:61.4,grasa:8.0,masaMagra:53.6,masaOsea:2.8,imc:20.0,tmb:1625,edadMetabolica:15,aguaCorporal:66.2,altura:175,nivelFisico:8,presionSistolica:108,presionDiastolica:64,frecuenciaCardiaca:51,bicepD:30.5,bicepI:30.5,torax:90.5,abdomen:76,cadera:88,musloD:44.5,musloI:44.5,gemelo:32.5,gemeloI:32.0},
  };
  if(!load(K.medidas)?.length){
    save(K.medidas,[{fecha:"2025-11-18",...REF["2025-11-18"]},{fecha:"2025-08-05",...REF["2025-08-05"]}]);
  } else {
    const stored=load(K.medidas);
    const updated=stored.map(entry=>{const ref=REF[entry.fecha];return ref?{...ref,...entry}:entry;});
    save(K.medidas,updated);
  }
})();

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
    }catch(e){
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
  return <button {...lp} onClick={()=>onSelect(ej.id)} style={{background:selected?C.card:C.surface,color:selected?C.text:C.textSub,border:`1px solid ${selected?C.text:C.border}`,borderRadius:8,padding:"8px 12px",fontSize:12,cursor:"pointer",fontWeight:selected?600:400,transition:"all 0.15s",userSelect:"none"}}>{ej.icon} {ej.nombre}</button>;
}

// ── UI ATOMS ──────────────────────────────────────────────────────────────────
function Card({children,style={},onClick}){
  return <div onClick={onClick} style={{
    background:C.card,
    border:`1px solid ${C.border}`,
    borderRadius:12,
    padding:16,
    cursor:onClick?"pointer":"default",
    ...style
  }}>{children}</div>;
}
function Btn({children,onClick,color,outline=false,style={}}){
  const bg=color||C.text;
  const solidText=bg===C.text?C.bg:"#fff";
  return <button onClick={onClick} style={{
    background:outline?"transparent":bg,
    color:outline?bg:solidText,
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
      padding:"6px 8px",
      width:"100%",
      boxSizing:"border-box",
      outline:"none",
      WebkitAppearance:"none",
      fontFamily:"inherit",
      ...style
    }}
  />;
}
function Tag({children,color}){
  return <span style={{
    background:C.surface,
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
  return <button onClick={onClick} style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:12,marginBottom:14,padding:0,letterSpacing:-0.1,display:"flex",alignItems:"center",gap:4}}>
    ‹ Volver
  </button>;
}
function SectionLabel({children,style={}}){
  return <p style={{color:C.text,fontSize:13,fontWeight:600,margin:"0 0 8px",...style}}>{children}</p>;
}
function SavedBadge({color}){
  return <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,padding:"6px 12px",marginBottom:10,color:C.textMuted,fontSize:11,fontWeight:400}}>Guardado</div>;
}
function ProgressBar({pct,color,height=4}){
  return <div style={{background:C.border,borderRadius:height,height,overflow:"hidden"}}>
    <div style={{background:color,borderRadius:height,height,width:`${Math.min(100,Math.max(0,pct||0))}%`,transition:"width 0.35s ease"}}/>
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
      <p style={{color:C.text,fontSize:14,fontWeight:600,margin:"0 0 6px"}}>Confirmar acción</p>
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
    <ProgressBar pct={pct} color={remaining<=10?C.red:C.text} height={3}/>
    <div style={{display:"flex",gap:5,marginTop:10}}>
      {[30,45,60,90].map(s=>(
        <button key={s} onClick={()=>reset(s)} style={{flex:1,background:initSecs===s?C.border:"transparent",color:initSecs===s?C.text:C.textMuted,border:`1px solid ${C.border}`,borderRadius:6,padding:"5px 0",fontSize:11,cursor:"pointer",fontWeight:initSecs===s?600:400}}>{s}s</button>
      ))}
    </div>
  </div>;
}

// ── SESSION TIMER (count up) ──────────────────────────────────────────────────
// Module-level map: tabId → startTimestamp (survives tab switches)
function SessionTimer({color,autoStart=false,onStarted,timerId="default"}){
  const SK=`st_${timerId}`;
  const [active,setActive]=useState(()=>{
    try{const t=sessionStorage.getItem(SK);return t!=null&&(Date.now()-parseInt(t))<3*60*60*1000;}catch(e){return false;}
  });
  const [seconds,setSeconds]=useState(()=>{
    try{const t=sessionStorage.getItem(SK);return t!=null?Math.max(0,Math.round((Date.now()-parseInt(t))/1000)):0;}catch(e){return 0;}
  });
  const startAtRef=useRef((()=>{
    try{const t=sessionStorage.getItem(SK);return t!=null?parseInt(t):null;}catch(e){return null;}
  })());

  function recalc(){
    if(!startAtRef.current) return;
    setSeconds(Math.max(0,Math.round((Date.now()-startAtRef.current)/1000)));
  }

  useEffect(()=>{
    if(autoStart&&!active) start();
  },[autoStart]);

  useEffect(()=>{
    if(!active) return;
    const id=setInterval(recalc,1000);
    document.addEventListener("visibilitychange",recalc);
    return()=>{clearInterval(id);document.removeEventListener("visibilitychange",recalc);};
  },[active]);

  function start(){
    const t=Date.now();
    startAtRef.current=t;
    try{sessionStorage.setItem(SK,String(t));}catch(e){}
    setActive(true);setSeconds(0);
    onStarted&&onStarted();
  }

  function stop(){
    startAtRef.current=null;
    try{sessionStorage.removeItem(SK);}catch(e){}
    setActive(false);setSeconds(0);
  }

  function toggle(){ active?stop():start(); }

  const mins=Math.floor(seconds/60),secs=seconds%60;
  return <button onClick={toggle} style={{background:active?color+"22":C.surface,border:`1px solid ${active?color:C.border}`,borderRadius:8,padding:"6px 12px",cursor:"pointer",color:active?color:C.textMuted,fontSize:12,fontWeight:active?600:400}}>
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
  return <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:12,marginBottom:12}}>
    <p style={{color:C.text,fontSize:13,fontWeight:600,margin:"0 0 8px"}}>Registro de sesión</p>
    <div style={{display:"flex",gap:8,marginBottom:8}}>
      <div style={{flex:1}}>
        <p style={{color:C.textMuted,fontSize:11,margin:"0 0 4px"}}>Minutos practicados</p>
        <Input value={minutes} onChange={e=>setMinutes(e.target.value)} placeholder="Ej: 45" style={{}}/>
      </div>
      <div style={{flex:1}}>
        <p style={{color:C.textMuted,fontSize:11,margin:"0 0 4px"}}>RPE</p>
        <div style={{display:"flex",gap:2}}>
          {[1,2,3,4,5,6,7,8,9,10].map(n=>{
            const rc=n<=3?C.green:n<=6?C.yellow:n<=8?C.orange:C.red;
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
            <p style={{color:C.text,fontSize:16,fontWeight:700,margin:"6px 0 0"}}>{ej.icon} {ej.nombre}</p>
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
          <button onClick={()=>setEditingLevels(v=>!v)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,color:C.textSub,padding:"6px 12px",cursor:"pointer",fontSize:11}}>{editingLevels?"✓ Listo":"✏️ Editar"}</button>
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
              <Input type="text" value={n} onChange={e=>{const arr=[...niveles];arr[i]=e.target.value;updateNiveles(detailId,arr);}} style={{flex:1,padding:"6px 8px"}}/>
              <button onClick={()=>updateNiveles(detailId,niveles.filter((_,idx)=>idx!==i))} style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:13}}>✕</button>
            </div>
          ))}
          <div style={{display:"flex",gap:6,marginTop:8}}>
            <Input type="text" value={newLevel} onChange={e=>setNewLevel(e.target.value)} placeholder="Nuevo nivel..." style={{flex:1,padding:"6px 8px"}}/>
            <Btn onClick={()=>{if(!newLevel.trim())return;updateNiveles(detailId,[...niveles,newLevel.trim()]);setNewLevel("");}} color={color} style={{padding:"8px 12px",fontSize:12}}>+</Btn>
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
                  <button onClick={()=>deleteEntry(detailId,i)} style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:13}}>✕</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </>}

      {/* Añadir sesión anterior */}
      {!addPastOpen?(
        <button onClick={()=>setAddPastOpen(true)} style={{background:"none",border:`1px solid ${C.border}`,color:C.textSub,borderRadius:6,padding:"3px 10px",cursor:"pointer",fontSize:10,fontWeight:500,marginTop:10}}>+ Añadir sesión anterior</button>
      ):(
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:14,marginTop:10}}>
          <p style={{color:C.text,fontSize:13,fontWeight:600,margin:"0 0 10px"}}>Añadir sesión anterior</p>
          <div style={{display:"flex",gap:8,marginBottom:8}}>
            <div style={{flex:1}}><p style={{color:C.textMuted,fontSize:11,margin:"0 0 4px"}}>Fecha</p><Input type="text" value={pastFecha} onChange={e=>setPastFecha(e.target.value)} placeholder="2025-11-20"/></div>
            <div style={{flex:1}}><p style={{color:C.textMuted,fontSize:11,margin:"0 0 4px"}}>Valor (kg/reps)</p><Input value={pastVal} onChange={e=>setPastVal(e.target.value)} placeholder="Ej: 80"/></div>
          </div>
          <Input type="text" value={pastNota} onChange={e=>setPastNota(e.target.value)} placeholder="Nota (opcional)" style={{marginBottom:8}}/>
          <div style={{display:"flex",gap:8}}>
            <Btn onClick={()=>{
              if(!isValidDate(pastFecha)){alert("Fecha inválida. Usa formato YYYY-MM-DD");return;}
              const prev=data[detailId]||[];
              const entry={fecha:pastFecha,val:parseFloat(pastVal)||null,nota:pastNota||null};
              saveData({...data,[detailId]:[...prev,entry].sort((a,b)=>a.fecha.localeCompare(b.fecha)).slice(-30)});
              setPastVal("");setPastNota("");setAddPastOpen(false);
            }} color={color} style={{flex:1}}>Añadir</Btn>
            <button onClick={()=>setAddPastOpen(false)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:12,color:C.textMuted,padding:"10px 14px",cursor:"pointer",fontSize:12}}>Cancelar</button>
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
          <SessionTimer timerId={tab.id} color={color} autoStart={autoStart} onStarted={onSessionStarted}/>
          <Tag color={color}>{savedCount}/{sessionEjs.length}</Tag>
        </div>
      </div>
      {restTimer&&<RestTimer seconds={restTimer} onClose={()=>setRestTimer(null)}/>}
      {/* WOD session result — shown for WOD tab, applies to whole session */}
      {tab.id==="wod"&&<Card style={{marginBottom:12,background:C.surface,border:`1px solid ${C.border}`}}>
        <p style={{color:C.textSub,fontSize:11,fontWeight:500,margin:"0 0 10px"}}> Resultado del WOD</p>
        <div style={{display:"flex",gap:8,marginBottom:8}}>
          <div style={{flex:1}}>
            <p style={{color:C.textMuted,fontSize:10,margin:"0 0 4px",textTransform:"uppercase",letterSpacing:1.2}}>Tipo</p>
            <select value={wodSessionType} onChange={e=>setWodSessionType(e.target.value)} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,color:C.text,padding:"7px 10px",fontSize:12,width:"100%"}}>
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
              const rc=n<=3?C.green:n<=6?C.yellow:n<=8?C.orange:C.red;
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
            <p style={{color:done?C.textSub:C.text,fontSize:14,fontWeight:600,margin:0}}>{ej.icon} {ej.nombre}</p>
            {maxVal&&<Tag color={color}> {maxVal}</Tag>}
          </div>
          {lastVal&&!done&&<p style={{color:C.textMuted,fontSize:11,margin:"0 0 10px"}}> Objetivo: <strong>{(lastVal+2.5).toFixed(1)}</strong></p>}
          {!done&&<>
            {niveles.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:8}}>
              {niveles.map((n,i)=>(
                <button key={i} onClick={()=>setSessionInputs(s=>({...s,[ejId]:{...s[ejId],nivel:i}}))} style={{background:inp.nivel===i?C.card:C.surface,color:inp.nivel===i?C.text:C.textSub,border:`1px solid ${inp.nivel===i?C.text:C.border}`,borderRadius:8,padding:"6px 12px",fontSize:10,cursor:"pointer",fontWeight:inp.nivel===i?600:400}}>{i+1}. {n}</button>
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

            <Input type="text" value={inp.nota||""} onChange={e=>setSessionInputs(s=>({...s,[ejId]:{...s[ejId],nota:e.target.value}}))} placeholder="Nota técnica..." style={{marginBottom:8}}/>
            <div style={{display:"flex",gap:8}}>
              <Btn onClick={()=>{
                const series=inp.sN&&inp.sK?`${inp.sN}×${inp.sK}kg`:null;
                const nivelToSave=inp.nivel!==undefined?inp.nivel:null;
                const entry={fecha:today(),val:parseFloat(inp.val)||null,nivel:nivelToSave,nota:inp.nota||null,series};
                saveData({...data,[ejId]:[...(data[ejId]||[]),entry].slice(-30)});
                setSessionInputs(s=>({...s,[ejId]:{...s[ejId],_saved:true}}));
              }} color={color} style={{flex:1}}>Guardar</Btn>
              <button onClick={()=>setRestTimer(60)} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,padding:"10px 14px",cursor:"pointer",fontSize:12,fontWeight:700}}>⏱</button>
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
    <Card style={{marginBottom:14,background:C.surface,border:`1px solid ${C.border}`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
        <p style={{color:C.text,fontSize:13,fontWeight:500,margin:0}}>{tab.icon} {tab.name}</p>
        <SessionTimer timerId={tab.id} color={color} autoStart={autoStart} onStarted={onSessionStarted}/>
      </div>
      {tab.id==="powerlifting"&&<div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",marginBottom:10,display:"flex",gap:8,alignItems:"center"}}>
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
        <button onClick={()=>setAddOpen(true)} style={{background:"none",border:`1px solid ${C.border}`,color:C.textSub,borderRadius:6,padding:"3px 10px",cursor:"pointer",fontSize:10,fontWeight:500}}>+ Añadir ejercicio</button>
      ):(
        <div style={{display:"flex",gap:6}}>
          <Input type="text" value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Nombre del ejercicio..." style={{flex:1}}/>
          <Btn onClick={addExercise} color={color} style={{padding:"11px 12px",whiteSpace:"nowrap"}}>✓</Btn>
          <button onClick={()=>setAddOpen(false)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:12,color:C.textMuted,padding:"11px 10px",cursor:"pointer",fontSize:12}}>✕</button>
        </div>
      )}
    </Card>
    <p style={{color:C.textMuted,fontSize:10,margin:"0 0 8px",fontStyle:"italic"}}>Mantén pulsado un ejercicio para eliminarlo</p>
    <SectionLabel>Historial por ejercicio</SectionLabel>
    {/* WOD session results shown separately */}
    {tab.id==="wod"&&(()=>{
      const wodKeys=Object.keys(data).filter(k=>k.startsWith("wod_session_"));
      if(!wodKeys.length) return null;
      const results=wodKeys.flatMap(k=>data[k]).sort((a,b)=>b.fecha.localeCompare(a.fecha)).slice(0,10);
      return <Card style={{marginBottom:12,background:C.surface,border:`1px solid ${C.border}`}}>
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
          {maxVal?<><p style={{color:C.text,fontSize:14,fontWeight:600,margin:0}}>{maxVal}</p>{delta!==null&&<p style={{color:delta>=0?C.green:C.red,fontSize:10,margin:0}}>{delta>=0?"▲":"▼"}{Math.abs(delta)}</p>}</>:<p style={{color:C.textMuted,fontSize:12,margin:0}}>Sin registro</p>}
        </div>
      </div>;
    })}
    {/* Delete tab button */}
    <div style={{marginTop:20,paddingTop:16,borderTop:`1px solid ${C.border}`}}>
      <button onClick={()=>{if(onDeleteTab)onDeleteTab(tab.id);}} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:12,color:C.red,width:"100%",padding:"10px",cursor:"pointer",fontSize:13,fontWeight:600}}>
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

  const plano=planos[planoSel]||Object.values(planos)[0]||{ejercicios:[],color:C.text,nombre:"Plano"};

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
      if(entry?.fecha===today()){setSessionSaved(prev=>{const u={...prev};delete u[ejId];return u;});}
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
        <p style={{color:C.text,fontSize:16,fontWeight:700,margin:"6px 0 0"}}>{ej?.nombre}</p>
        <div style={{display:"flex",gap:16,marginTop:8}}>
          {[["Récord",maxVal+"kg"],["Sesiones",hist.length]].map(([k,v])=>(
            <div key={k}><p style={{color:C.textMuted,fontSize:10,margin:"0 0 2px"}}>{k}</p><p style={{color:C.text,fontSize:14,fontWeight:600,margin:0}}>{v}</p></div>
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
                <button onClick={()=>deleteCargas(histEj,i)} style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:13}}>✕</button>
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
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16,marginBottom:14}}>
        <p style={{color:C.textMuted,fontSize:10,letterSpacing:1.2,textTransform:"uppercase",margin:"0 0 6px",fontWeight:500}}>Sesión completada</p>
        <p style={{color:C.text,fontSize:14,fontWeight:600,margin:"0 0 6px"}}>Plano {planoSel} · {plano.nombre}</p>
        <div style={{display:"flex",gap:12,margin:"4px 0 12px",flexWrap:"wrap"}}>
          {sessionRPE&&<Tag color={sessionRPE<=5?C.green:sessionRPE<=8?C.orange:C.red}>RPE {sessionRPE}/10</Tag>}
          {sessionNota&&<p style={{color:C.textSub,fontSize:12,margin:0,fontStyle:"italic"}}>"{sessionNota}"</p>}
        </div>
        <div style={{display:"flex",gap:16}}>
          <div><p style={{color:C.text,fontSize:18,fontWeight:700,margin:0}}>{mejoras}</p><p style={{color:C.textMuted,fontSize:11,margin:0}}>Mejoras</p></div>
          <div><p style={{color:C.textSub,fontSize:18,fontWeight:700,margin:0}}>{records}</p><p style={{color:C.textMuted,fontSize:11,margin:0}}>Récords</p></div>
          <div><p style={{color:C.textMuted,fontSize:18,fontWeight:700,margin:0}}>{items.length}</p><p style={{color:C.textMuted,fontSize:11,margin:0}}>Ejercicios</p></div>
        </div>
      </div>
      {items.map(({ej,vals,maxKg,delta,isRecord},i)=>(
        <div key={i} style={{padding:"12px 0",borderBottom:`1px solid ${C.border}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div><p style={{color:C.text,fontSize:13,fontWeight:600,margin:"0 0 2px"}}>{ej.nombre}</p><p style={{color:C.textMuted,fontSize:11,margin:0}}>Series: {vals.join(" · ")}kg</p></div>
            <div style={{textAlign:"right"}}>
              <p style={{color:C.text,fontSize:14,fontWeight:600,margin:0}}>{maxKg}kg {isRecord&&delta>0?"":""}</p>
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
          <p style={{color:C.text,fontSize:13,fontWeight:600,margin:"0 0 8px"}}>Volumen semanal acumulado</p>
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
    const upd={...planos,[key]:{nombre:`Plano ${key}`,color:"#8e8e93",ejercicios:[]}};
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
    {timerSecs&&<div style={{position:"sticky",top:0,zIndex:10,marginBottom:10}}>
      <RestTimer seconds={timerSecs.secs} onClose={()=>setTimerSecs(null)}/>
    </div>}

    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
      <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
        {Object.entries(planos).map(([k,p])=>(
          <div key={k} style={{display:"flex",alignItems:"center",gap:1}}>
            <button onClick={()=>{setPlanoSel(k);setSessionSaved({});setSeriesInputs({});setSessionRPE(null);setSessionNota("");}}
              style={{background:planoSel===k?C.card:C.surface,color:planoSel===k?C.text:C.textSub,border:`1px solid ${planoSel===k?C.text:C.border}`,borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:12,fontWeight:planoSel===k?600:400,transition:"all 0.15s"}}>
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
               style={{WebkitAppearance:"none",fontFamily:"inherit",width:36,background:C.surface,border:`1px solid ${C.text}`,borderRadius:6,color:C.text,padding:"5px 8px",outline:"none"}}/>
             <button onClick={handleAddPlano} style={{background:C.card,border:`1px solid ${C.text}`,borderRadius:8,color:C.text,padding:"6px 10px",cursor:"pointer",fontSize:12,fontWeight:600}}>+</button>
             <button onClick={()=>{setAddingPlano(false);setNewPlanoName("");}} style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:12}}>✕</button>
           </div>
          :<button onClick={()=>setAddingPlano(true)} style={{background:C.surface,border:`1px dashed ${C.border}`,borderRadius:8,color:C.textSub,padding:"8px 14px",cursor:"pointer",fontSize:12,fontWeight:400}}>+</button>
        }
      </div>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <SessionTimer timerId={`gym_${planoSel}`} color={plano.color} autoStart={autoStart} onStarted={()=>{onSessionStarted&&onSessionStarted();}}/>
        <button onClick={()=>setEditMode(e=>!e)} title="Editar ejercicios del plano" style={{background:editMode?plano.color+"22":C.surface,color:editMode?plano.color:C.textMuted,border:`1px solid ${editMode?plano.color+"55":C.border}`,borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:11,fontWeight:editMode?700:400,opacity:0.7}}>{editMode?"✓ Listo":"✏️"}</button>
      </div>
    </div>

    {doneCount>0&&!showSummary&&<div style={{marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
        <p style={{color:C.textSub,fontSize:12,margin:0}}>{doneCount}/{plano.ejercicios.length} ejercicios</p>
        {allDone&&<Btn onClick={()=>{setShowSummary(true);}} color={plano.color} style={{padding:"6px 12px",fontSize:11}}>Ver resumen →</Btn>}
      </div>
      <ProgressBar pct={(doneCount/plano.ejercicios.length)*100} color={plano.color} height={4}/>
    </div>}

    {/* RPE de sesión — only when session started */}
    {doneCount>0&&<div style={{marginBottom:14}}>
      <p style={{color:C.text,fontSize:13,fontWeight:600,margin:"0 0 8px"}}>RPE — Esfuerzo percibido{!sessionRPE?" (opcional)":""}</p>
      <div style={{display:"flex",gap:3}}>
        {[1,2,3,4,5,6,7,8,9,10].map(n=>{
          const rc=n<=3?C.green:n<=6?C.yellow:n<=8?C.orange:C.red;
          return <button key={n} onClick={()=>setSessionRPE(n===sessionRPE?null:n)} style={{flex:1,background:sessionRPE===n?rc:C.surface,color:sessionRPE===n?"#000":C.textMuted,border:`1px solid ${sessionRPE===n?rc:C.border}`,borderRadius:8,padding:"7px 2px",cursor:"pointer",fontSize:11,fontWeight:sessionRPE===n?600:400,transition:"all 0.15s"}}>{n}</button>;
        })}
      </div>
      {sessionRPE&&<p style={{color:C.textMuted,fontSize:10,margin:"5px 0 4px",fontStyle:"italic"}}>{sessionRPE<=3?"Muy fácil":sessionRPE<=5?"Moderado — zona de mantenimiento":sessionRPE<=7?"Óptimo — zona de progresión":sessionRPE<=8?"Duro — buen estímulo":sessionRPE<=9?"Muy duro — cerca del límite":"Al límite — necesitas recuperación extra"}</p>}
      <Input type="text" value={sessionNota} onChange={e=>setSessionNota(e.target.value)} placeholder="Nota de sesión: cómo te has sentido, contexto..." style={{marginTop:6}}/>
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

      return <div key={ej.id} style={{background:done?C.text+"0d":C.card,border:`1px solid ${done?C.text+"35":C.border}`,borderRadius:12,padding:16,marginBottom:12,transition:"all 0.2s"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
              {done&&<span style={{color:C.text,fontSize:14}}>✓</span>}
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
            {done?<p style={{color:C.text,fontSize:13,fontWeight:600,margin:0}}>{safeMax(done,0)}kg</p>:last?<p style={{color:C.textSub,fontSize:13,fontWeight:500,margin:0}}>{last.kg}kg</p>:null}
          </div>
        </div>

        {editMode&&<div style={{display:"flex",gap:6,marginBottom:8,borderTop:`1px solid ${C.border}`,paddingTop:8}}>
          <button onClick={()=>moveEj(planoSel,idx,-1)} disabled={idx===0} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.textSub,padding:"6px 12px",cursor:"pointer",fontSize:12,opacity:idx===0?0.3:1}}>↑</button>
          <button onClick={()=>moveEj(planoSel,idx,1)} disabled={idx===plano.ejercicios.length-1} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.textSub,padding:"6px 12px",cursor:"pointer",fontSize:12,opacity:idx===plano.ejercicios.length-1?0.3:1}}>↓</button>
          <button onClick={()=>deleteEj(ej.id)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,color:C.textMuted,padding:"6px 12px",cursor:"pointer",fontSize:12,marginLeft:"auto"}}> Eliminar</button>
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
              style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.textSub,padding:"8px 12px",cursor:"pointer",fontSize:11,fontWeight:400,marginBottom:8,width:"100%"}}
            >
              ↩ Precargar últimos valores ({safeArr(last.series).slice(0,ej.series).join(" · ")}kg)
            </button>
          )}
          <div style={{marginBottom:8}}>
            {Array.from({length:ej.series},(_,si)=>{
              const val=sArr[si]||"";const confirmed=parseFloat(val)>0;
              return <div key={si} style={{display:"flex",gap:6,alignItems:"center",marginBottom:6}}>
                <p style={{color:C.textMuted,fontSize:11,margin:0,minWidth:28,fontWeight:500}}>S{si+1}{lastSeries[si]?<span style={{fontWeight:400}}> ({lastSeries[si]})</span>:""}</p>
                <input type="number" value={val}
                  onChange={e=>{const a=[...(seriesInputs[ej.id]||Array(ej.series).fill(""))];a[si]=e.target.value;setSeriesInputs(i=>({...i,[ej.id]:a}));}}
                  onKeyDown={e=>{if(e.key==="Enter"&&parseFloat(val)>0){e.preventDefault();handleConfirmSerie(ej.id,ej.descanso);}}}
                  onBlur={()=>{}}
                  placeholder={lastSeries[si]?`${lastSeries[si]}kg`:"kg"} style={{background:confirmed?C.green+"18":C.surface,border:`1px solid ${confirmed?C.green+"55":C.border}`,borderRadius:8,color:C.text,padding:"6px 8px",flex:1,boxSizing:"border-box",outline:"none",WebkitAppearance:"none",fontFamily:"inherit"}}/>
              </div>;
            })}
          </div>
          {/* Timer button inline — RestTimer shown as sticky overlay above */}
          <div style={{display:"flex",gap:8,marginBottom:6,alignItems:"center"}}>
            <Input type="text" value={notes[ej.id]||""} onChange={e=>setNotes(n=>({...n,[ej.id]:e.target.value}))} placeholder="Nota técnica..." style={{flex:1}}/>
            <button onClick={()=>setTimerSecs({ejId:ej.id,secs:ej.descanso||90})} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.textMuted,padding:"8px 12px",cursor:"pointer",fontSize:12,lineHeight:1}}>⏱</button>
            <Btn onClick={()=>handleSaveEj(ej.id,ej.descanso,ej.series)} color={allFilled?plano.color:C.textMuted} style={{whiteSpace:"nowrap",padding:"10px 16px",fontSize:12,fontWeight:600,opacity:allFilled?1:0.3,transition:"opacity 0.15s"}}>{allFilled?`✓ Guardar`:`${filled}/${ej.series}`}</Btn>
          </div>
        </>}
        <button onClick={()=>setHistEj(ej.id)} style={{background:"none",border:"none",color:C.textMuted,fontSize:11,cursor:"pointer",padding:"6px 0",color:C.textMuted}}>Ver historial</button>
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
  const [entTab,setEntTab]=useState("registro");
  const [tabsVer,setTabsVer]=useState(0);
  const tabs=loadTabs();
  const [activeTab,setActiveTab]=useState(initTab);
  const [showAddTab,setShowAddTab]=useState(false);
  const [newTabName,setNewTabName]=useState("");
  const [confirm,setConfirm]=useState(null);

  function saveTabs(upd){save(K.tabs,upd);setTabsVer(v=>v+1);}

  function addTab(){
    if(!newTabName.trim()) return;
    const id="tab_"+Date.now();
    const tab={id,name:newTabName.trim(),icon:"",type:"cf",color:C.text};
    saveTabs([...tabs,tab]);
    setActiveTab(id);setNewTabName("");setShowAddTab(false);
  }

  function deleteTab(id){
    setConfirm({msg:"Eliminar esta pestaña de entrenamiento. Los registros se conservan.",onConfirm:()=>{
      saveTabs(tabs.filter(t=>t.id!==id));
      setActiveTab(tabs.find(t=>t.id!==id)?.id||"gym");
      setConfirm(null);
    }});
  }

  const tab=tabs.find(t=>t.id===activeTab)||tabs[0];

  const ENT_TABS=[["registro","Registro"],["plan","Plan"]];

  return <div style={{padding:"2px 8px 100px"}}>
    {confirm&&<ConfirmDialog msg={confirm.msg} onConfirm={confirm.onConfirm} onCancel={()=>setConfirm(null)}/>}
    {/* Top-level Entrenamiento tabs */}
    <div style={{display:"flex",gap:0,marginBottom:14,background:C.bg,borderRadius:10,padding:3,border:`1px solid ${C.border}`}}>
      {ENT_TABS.map(([id,label])=>(
        <button key={id} onClick={()=>setEntTab(id)}
          style={{flex:1,background:entTab===id?C.card:"transparent",color:entTab===id?C.text:C.textMuted,border:entTab===id?`1px solid ${C.border}`:"1px solid transparent",borderRadius:8,padding:"7px 4px",fontSize:11,fontWeight:entTab===id?600:400,cursor:"pointer",transition:"all 0.12s",letterSpacing:entTab===id?-0.1:0}}>
          {label}
        </button>
      ))}
    </div>

    {/* ── REGISTRO: choose and start training ── */}
    {entTab==="registro"&&<div>
      {/* Training type selector */}
      <div style={{display:"flex",gap:6,marginBottom:12,overflowX:"auto",paddingBottom:2}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)}
            style={{background:activeTab===t.id?C.card:C.surface,color:activeTab===t.id?C.text:C.textSub,border:`1px solid ${activeTab===t.id?C.text:C.border}`,borderRadius:8,padding:"7px 14px",fontSize:11,fontWeight:activeTab===t.id?600:400,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,transition:"all 0.15s"}}>
            {t.icon?t.icon+" ":""}{t.name}
          </button>
        ))}
        {!showAddTab
          ?<button onClick={()=>setShowAddTab(true)} style={{background:C.surface,border:`1px dashed ${C.border}`,color:C.textSub,borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:11,fontWeight:400,whiteSpace:"nowrap",flexShrink:0}}>+</button>
          :<div style={{display:"flex",gap:6,flexShrink:0}}>
             <Input value={newTabName} onChange={e=>setNewTabName(e.target.value)} placeholder="Nombre..." style={{width:120}}/>
             <Btn onClick={addTab} color={C.text} style={{padding:"8px 12px",fontSize:12}}>✓</Btn>
             <button onClick={()=>setShowAddTab(false)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,color:C.textMuted,padding:"8px 12px",cursor:"pointer",fontSize:12}}>✕</button>
           </div>
        }
      </div>
      {/* Active training module */}
      {tab?.type==="gym"
        ?<GymPanel initPlanoKey={initPlanoKey} autoStart={autoStart} onSessionStarted={onSessionStarted}/>
        :<CFPanel key={tab?.id} tab={tab} onDeleteTab={deleteTab} autoStart={autoStart} onSessionStarted={onSessionStarted}/>
      }
    </div>}

    {/* ── PLAN: weekly training assignment ── */}
    {entTab==="plan"&&<ProgresoPlantificar/>}
  </div>;
}


// ── MEDIDAS / EVALUACIONES ───────────────────────────────────────────────────
const MEDIDAS_FIELDS=[
  {id:"peso",              label:"Peso",             unit:"kg",   icon:""},
  {id:"grasa",             label:"% Grasa",           unit:"%",    icon:""},
  {id:"masaMagra",         label:"Masa Magra",        unit:"kg",   icon:""},
  {id:"masaOsea",          label:"Masa Ósea",         unit:"kg",   icon:""},
  {id:"imc",               label:"IMC",               unit:"",     icon:""},
  {id:"tmb",               label:"TMB",               unit:"kcal", icon:""},
  {id:"edadMetabolica",    label:"Edad Metabólica",   unit:"años", icon:""},
  {id:"aguaCorporal",      label:"Agua Corporal",     unit:"%",    icon:""},
  {id:"grasaVisceral",     label:"Grasa Visceral",    unit:"",     icon:""},
  {id:"altura",            label:"Altura",            unit:"cm",   icon:""},
  {id:"nivelFisico",       label:"Nivel Físico",      unit:"",     icon:""},
  {id:"presionSistolica",  label:"P. Sistólica",      unit:"mmHg", icon:""},
  {id:"presionDiastolica", label:"P. Diastólica",     unit:"mmHg", icon:""},
  {id:"frecuenciaCardiaca",label:"FC Reposo",         unit:"bpm",  icon:""},
  {id:"bicepD",            label:"Bícep D",           unit:"cm",   icon:""},
  {id:"bicepI",            label:"Bícep I",           unit:"cm",   icon:""},
  {id:"torax",             label:"Tórax",             unit:"cm",   icon:""},
  {id:"abdomen",           label:"Abdomen",           unit:"cm",   icon:""},
  {id:"cadera",            label:"Cadera",            unit:"cm",   icon:""},
  {id:"musloD",            label:"Muslo D",           unit:"cm",   icon:""},
  {id:"musloI",            label:"Muslo I",           unit:"cm",   icon:""},
  {id:"gemelo",            label:"Gemelo D",          unit:"cm",   icon:""},
  {id:"gemeloI",           label:"Gemelo I",          unit:"cm",   icon:""},
];


function MedidasPanel(){
  const [medidas,setMedidas]=useState(()=>load(K.medidas)||[]);
  const [mode,setMode]=useState("list");
  const [openIdx,setOpenIdx]=useState(null);
  const [form,setForm]=useState({});

  function handleAdd(){
    if(!Object.values(form).some(v=>v)) return;
    const entry={...form,fecha:today()};
    const upd=[entry,...medidas];
    setMedidas(upd);save(K.medidas,upd);
    setForm({});setMode("list");setOpenIdx(0);
  }

  function getDelta(fieldId,idx){
    if(idx>=medidas.length-1) return null;
    const curr=parseFloat(medidas[idx]?.[fieldId]);
    const prev=parseFloat(medidas[idx+1]?.[fieldId]);
    if(isNaN(curr)||isNaN(prev)) return null;
    return (curr-prev).toFixed(1);
  }

  if(mode==="add") return <div>
    <BackBtn onClick={()=>setMode("list")}/>
    <p style={{color:C.text,fontSize:13,fontWeight:600,margin:"0 0 14px"}}>Nueva evaluación</p>
    {MEDIDAS_FIELDS.map(f=><div key={f.id} style={{marginBottom:12}}>
      <p style={{color:C.textMuted,fontSize:12,margin:"0 0 4px"}}>{f.label}{f.unit?` (${f.unit})`:""}</p>
      <Input value={form[f.id]||""} onChange={e=>setForm({...form,[f.id]:e.target.value})} placeholder={f.label}/>
    </div>)}
    <Btn onClick={handleAdd} color={C.text} style={{width:"100%",padding:"12px",marginTop:4}}>Guardar evaluación</Btn>
  </div>;

  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
      <SectionLabel>Evaluaciones</SectionLabel>
      <button onClick={()=>setMode("add")} style={{background:"none",border:`1px solid ${C.border}`,color:C.textSub,borderRadius:6,padding:"3px 10px",cursor:"pointer",fontSize:10,fontWeight:500}}>+ Añadir</button>
    </div>
    {medidas.length===0&&<p style={{color:C.textMuted,fontSize:12,textAlign:"center",padding:"16px 0",color:C.textMuted}}>Sin evaluaciones registradas</p>}
    {medidas.map((entry,i)=>{
      const isOpen=openIdx===i;
      return <div key={i} style={{marginBottom:8}}>
        <div style={{display:"flex",alignItems:"stretch",gap:6}}>
          <button onClick={()=>setOpenIdx(isOpen?null:i)}
            style={{flex:1,background:isOpen?C.card:C.surface,border:`1px solid ${isOpen?C.text:C.border}`,borderRadius:8,padding:"10px 14px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",textAlign:"left"}}>
            <div>
              <p style={{color:C.text,fontSize:13,fontWeight:500,margin:"0 0 2px"}}>{fmt(entry.fecha)}</p>
              <p style={{color:C.textMuted,fontSize:11,margin:0}}>
                {[entry.peso&&`${entry.peso}kg`,entry.grasa&&`${entry.grasa}% grasa`,entry.masaMagra&&`${entry.masaMagra}kg magra`].filter(Boolean).join(" · ")||"Sin datos clave"}
              </p>
            </div>
            <span style={{color:C.textMuted,fontSize:12,marginLeft:8,flexShrink:0,display:"inline-block",transition:"transform 0.2s",transform:isOpen?"rotate(180deg)":"rotate(0deg)"}}>▼</span>
          </button>
          <button onClick={()=>{const upd=medidas.filter((_,j)=>j!==i);setMedidas(upd);save(K.medidas,upd);if(openIdx===i)setOpenIdx(null);else if(openIdx!==null&&openIdx>i)setOpenIdx(openIdx-1);}}
            style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,padding:"0 12px",cursor:"pointer",color:C.textMuted,fontSize:13,flexShrink:0}}>✕</button>
        </div>
        {isOpen&&<div style={{background:C.card,border:`1px solid ${C.border}`,borderTopWidth:0,borderRadius:"0 0 8px 8px",padding:"12px 14px"}}>
          {i>=medidas.length-1&&<p style={{color:C.textMuted,fontSize:11,margin:"0 0 10px",fontStyle:"italic"}}>
            {medidas.length===1?"Primera evaluación — sin base comparativa":"Evaluación más antigua"}
          </p>}
          {MEDIDAS_FIELDS.filter(f=>entry[f.id]!==undefined&&entry[f.id]!=="").map(f=>{
            const delta=getDelta(f.id,i);
            return <div key={f.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
              <p style={{color:C.textSub,fontSize:13,margin:0}}>{f.label}</p>
              <div style={{textAlign:"right"}}>
                <p style={{color:C.text,fontSize:14,fontWeight:600,margin:0}}>{entry[f.id]}{f.unit}</p>
                {delta!==null&&<p style={{color:C.textMuted,fontSize:11,margin:"2px 0 0"}}>{parseFloat(delta)>=0?"+":""}{delta}{f.unit}</p>}
              </div>
            </div>;
          })}
        </div>}
      </div>;
    })}
  </div>;
}

function SuenoHoy({sleepData,onSave,onCollapse}){
  // Bare form — no Card, no title, no inner toggle.
  // The pill in Hoy is the toggle; this is just the form content.
  const hoursRef=useRef(null);
  const labels=["Muy mal","Mal","Regular","Bien","Muy bien"];
  return <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"12px 14px",marginBottom:12}}>
    <div style={{display:"flex",gap:5,marginBottom:10}}>
      {labels.map((label,i)=>{
        const n=i+1;const active=sleepData.rating===n;
        return <button key={n} onClick={()=>onSave({...sleepData,rating:active?0:n})}
          style={{flex:1,minWidth:0,background:active?C.card:C.bg,border:`1px solid ${active?C.text:C.border}`,borderRadius:8,padding:"8px 2px",cursor:"pointer"}}>
          <p style={{color:active?C.text:C.textMuted,fontSize:10,margin:0,fontWeight:active?500:400,textAlign:"center"}}>{label}</p>
        </button>;
      })}
    </div>
    <div style={{display:"flex",gap:8,alignItems:"center"}}>
      <p style={{color:C.textMuted,fontSize:12,margin:0,flexShrink:0}}>Horas</p>
      <input
        ref={hoursRef}
        type="number"
        value={sleepData.hours}
        onChange={e=>onSave({...sleepData,hours:e.target.value})}
        onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();hoursRef.current?.blur();}}}
        onBlur={()=>{if(onCollapse)onCollapse();}}
        placeholder="7.5"
        inputMode="decimal"
        style={{flex:1,minWidth:0,boxSizing:"border-box",background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,color:C.text,padding:"4px 6px",outline:"none",WebkitAppearance:"none",fontFamily:"inherit"}}
      />
      {sleepData.rating>0&&<button onClick={()=>onSave({rating:0,hours:""})} style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:11,padding:0,flexShrink:0}}>Limpiar</button>}
    </div>
  </div>;
}


function TrackerRow({icon,label,cur,tgt,unit,color,addButtons,onReset}){
  const pct=Math.min(100,Math.round((parseFloat(cur)/tgt)*100));
  const done=pct>=100;
  return <div style={{marginBottom:14}}>
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
function NutricionHoy({onNavigate,ydProtPct=100}){
  // ── Summary-only card: reads shared K.proteinLog, no logging actions ──────
  const nutColor=C.text;
  const proteinLog=((load(K.proteinLog)||{})[today()])||[];
  const hydration=(load(K.proteinLog)||{})[today()+"_h"]||0;

  const {pt,ht,kcalObj,isTrainingToday}=useMemo(()=>{
    const np=load(K.nutProfile)||NUT_PROFILE_SEED;
    const meds=load(K.medidas)||[];
    const pw=meds.length?parseFloat(meds[0].peso)||65.7:65.7;
    const gf=meds.length?parseFloat(meds[0].grasa)||10:10;
    const sx=gf<8?500:gf<12?400:gf<16?350:300;
    const bmr=Math.round(10*pw+6.25*np.altura-5*np.edad+5);
    const isTrain=loadWeek()[(new Date().getDay()+6)%7]?.assignments?.length>0;
    const kcalObj=Math.round(bmr*np.actividad)+sx+(isTrain?150:0);
    return {pt:Math.round(pw*2),ht:Math.round(pw*(isTrain?42:35)/1000*10)/10,kcalObj,isTrainingToday:isTrain};
  },[]);

  const ph=proteinLog.reduce((a,e)=>a+(e.prot||0),0);
  const totalKcal=proteinLog.reduce((a,e)=>a+(e.kcal||0),0);
  const isWOD=loadWeek()[(new Date().getDay()+6)%7]?.assignments?.some(a=>a.tabId==="wod");
  const wtgt=isWOD?Math.round((ht+0.75)*10)/10:ht;
  const protDone=ph>=pt;
  const watDone=hydration>=wtgt;

  // Weekly protein adherence dots (last 7 days)
  const last7=useMemo(()=>[...Array(7)].map((_,i)=>{
    const d=new Date();d.setDate(d.getDate()-i);
    const ds=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    return ((load(K.proteinLog)||{})[ds]||[]).reduce((a,e)=>a+(e.prot||0),0)>=pt;
  }).reverse(),[pt]);
  const daysHit=last7.filter(d=>d.prot).length;

  return <Card style={{marginBottom:14}}>
    {/* Navigable header */}
    <button onClick={onNavigate} style={{width:"100%",background:"none",border:"none",cursor:onNavigate?"pointer":"default",display:"flex",justifyContent:"space-between",alignItems:"center",padding:0,marginBottom:10}}>
      <div style={{textAlign:"left"}}>
        <p style={{color:C.text,fontSize:13,fontWeight:600,margin:"0 0 3px"}}>Nutrición</p>
        <div style={{display:"flex",gap:3,alignItems:"center"}}>
          {last7.map((hit,i)=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:hit?C.green:C.borderLight}}/>)}
          <p style={{color:daysHit>=5?C.green:daysHit>=3?C.orange:C.red,fontSize:10,fontWeight:600,margin:"0 0 0 5px"}}>{daysHit}/7</p>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        <p style={{color:C.textMuted,fontSize:11,margin:0}}>{kcalObj} kcal/día</p>
        {onNavigate&&<span style={{color:C.textMuted,fontSize:14}}>›</span>}
      </div>
    </button>

    {/* Yesterday low protein — contextual, sober */}
    {ydProtPct<60&&<p style={{color:C.textMuted,fontSize:11,margin:"-2px 0 8px",fontWeight:400}}>Ayer: {ydProtPct}% proteína</p>}

    {/* Protein + Kcal bars */}
    <div style={{display:"flex",gap:0,marginBottom:10}}>
      <div style={{flex:1,paddingRight:10,borderRight:`1px solid ${C.border}`}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
          <p style={{color:C.textMuted,fontSize:10,margin:0}}>Proteína</p>
          <p style={{color:protDone?C.green:C.textMuted,fontSize:10,fontWeight:600,margin:0}}>{protDone?"✓":ph+"/"+pt+"g"}</p>
        </div>
        <ProgressBar pct={Math.min(100,Math.round((ph/pt)*100))} color={protDone?C.green:ph/pt>=0.7?C.orange:nutColor} height={4}/>
      </div>
      <div style={{flex:1,paddingLeft:10}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
          <p style={{color:C.textMuted,fontSize:10,margin:0}}>Kcal</p>
          <p style={{color:totalKcal>=kcalObj?C.green:C.textMuted,fontSize:10,fontWeight:600,margin:0}}>{totalKcal>=kcalObj?"✓":totalKcal+"/"+kcalObj}</p>
        </div>
        <ProgressBar pct={Math.min(100,Math.round((totalKcal/kcalObj)*100))} color={totalKcal>=kcalObj?C.green:nutColor} height={4}/>
      </div>
    </div>

    {/* Water — read-only summary */}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
      <p style={{color:C.textMuted,fontSize:10,margin:0}}>Agua{isWOD?" · WOD":""}</p>
      <p style={{color:watDone?C.green:C.textMuted,fontSize:10,fontWeight:600,margin:0}}>{watDone?"✓":hydration+"/"+wtgt+"L"}</p>
    </div>
    <ProgressBar pct={Math.min(100,Math.round((hydration/wtgt)*100))} color={watDone?C.green:C.text} height={4}/>

    {/* Supplements — status dots only */}
    {(()=>{
      const sups=load(K.supplements)||DEFAULT_SUPPLEMENTS;
      const done=load("pg_sup_done")||{};
      const doneCount=sups.filter(s=>done[s.id]).length;
      if(!sups.length) return null;
      return <div style={{display:"flex",alignItems:"center",gap:5,marginTop:8}}>
        {sups.map(s=><div key={s.id} style={{width:7,height:7,borderRadius:"50%",background:done[s.id]?C.green:C.borderLight}}/>)}
        <p style={{color:C.textMuted,fontSize:10,margin:0}}>{doneCount}/{sups.length} supl.</p>
      </div>;
    })()}
  </Card>;
}


function ScreenHoyMerged({onEmpezar,onGoToNutricion,onGoToSemana,onGoToFisico,onGoToComidas}){
  const [showSleep,setShowSleep]=useState(false);
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

  function getAssignmentColor(a){if(a.tabId==="gym") return gymPlanos[a.planoKey]?.color||C.text;return tabs.find(t=>t.id===a.tabId)?.color||C.textMuted;}
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
  const [sleepToday,setSleepToday]=useState(()=>(load(K.proteinLog)||{})[todayDate+"_sleep"]||{});
  function saveSleepFromHoy(upd){setSleepToday(upd);const all=load(K.proteinLog)||{};all[todayDate+"_sleep"]=upd;save(K.proteinLog,all);}

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

  // Show only first undismissed alert
  const activeAlert=alerts[0]||null;
  const pendingAlerts=alerts.length;

  // Estado del día pills
  const sleepLabels=["Muy mal","Mal","Regular","Bien","Muy bien"];
  const dayState=[
    {label:"Sueño",   val:sleepToday.rating>0?(sleepLabels[sleepToday.rating-1].split(" ")[0]+(sleepToday.hours?` · ${sleepToday.hours}h`:"")):"—",
                      color:!sleepToday.rating?C.textMuted:sleepToday.rating<=2?C.red:sleepToday.rating===3?C.orange:C.green,
                      ok:sleepToday.rating>=4},
    {label:"Prot ayer",val:ydProt>0?`${ydProtPct}%`:"—",
                        color:!ydProt?C.textMuted:ydProtPct<60?C.red:ydProtPct<90?C.orange:C.green,
                        ok:ydProtPct>=90},
  ];

  const [showYd,setShowYd]=useState(false);
  const hour=new Date().getHours();

  return <div style={{padding:"2px 8px 100px"}}>


    {/* TRAINING HERO */}
    {todayAssignments.length===0?(
      <Card style={{marginBottom:12,background:C.card}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
          <div style={{width:40,height:40,borderRadius:12,background:C.text+"12",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:400,color:C.textMuted}}>—</div>
          <div>
            <p style={{color:C.text,fontSize:15,fontWeight:600,margin:0,letterSpacing:-0.3}}>Día de descanso</p>
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
          return <div key={i} style={{background:C.card,border:`1px solid ${done?C.text+"44":C.border}`,borderRadius:12,padding:14,marginBottom:i<todayAssignments.length-1?8:0}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:done?4:8}}>
              <div>
                <p style={{color:C.text,fontSize:15,fontWeight:600,margin:0,letterSpacing:-0.3}}>{label}</p>
              </div>
              {done&&<p style={{color:C.green,fontSize:11,fontWeight:500,margin:0}}>✓ Completado</p>}
            </div>
            {!done&&<button onClick={()=>onEmpezar(a.tabId,a.planoKey)} style={{width:"100%",background:C.text,color:C.bg,border:"none",borderRadius:8,padding:"11px",cursor:"pointer",fontSize:14,fontWeight:600,letterSpacing:-0.2}}>Empezar →</button>}
            {done&&(()=>{const rpe=a.planoKey?rpeLog[`${todayDate}_${a.planoKey}`]:null;return <p style={{color:C.textMuted,fontSize:11,margin:0}}>Sesión completada{rpe?` · RPE ${rpe}/10`:""}</p>;})()}
          </div>;
        })}
      </div>
    )}

    {/* ESTADO DEL DÍA */}
    <div style={{display:"flex",gap:6,marginBottom:showSleep?8:14}}>
      {/* Sueño — toggles inline form */}
      {(()=>{const d=dayState[0];return <button onClick={()=>setShowSleep(s=>!s)} style={{flex:1,background:showSleep?C.card:C.surface,border:`1px solid ${showSleep?C.text:C.border}`,borderRadius:8,padding:"8px 6px",textAlign:"center",cursor:"pointer",position:"relative"}}>
        <p style={{color:C.text,fontSize:13,fontWeight:600,margin:"0 0 4px"}}>{d.label}</p>
        <p style={{color:d.val==="—"?C.textMuted:C.text,fontSize:14,fontWeight:600,margin:0,lineHeight:1}}>{d.val}</p>
        <span style={{position:"absolute",right:4,top:"50%",transform:`translateY(-50%) rotate(${showSleep?180:0}deg)`,color:C.textMuted,fontSize:10,display:"inline-block",transition:"transform 0.2s"}}>▼</span>
      </button>;})()}
      {/* Semana — navigates to Progreso/Semana */}
      <button onClick={onGoToSemana} style={{flex:1,background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 6px",textAlign:"center",cursor:"pointer",position:"relative"}}>
        <p style={{color:C.text,fontSize:13,fontWeight:600,margin:"0 0 4px"}}>Semana</p>
        <p style={{color:C.text,fontSize:14,fontWeight:600,margin:0,lineHeight:1}}>{daysThisWeek}</p>
        <span style={{position:"absolute",right:4,top:"50%",transform:"translateY(-50%)",color:C.textMuted,fontSize:10}}>›</span>
      </button>
    </div>
    {/* INLINE SUEÑO */}
    {showSleep&&<SuenoHoy sleepData={sleepToday} onSave={saveSleepFromHoy} onCollapse={()=>setShowSleep(false)}/>}
    {/* ACTIVE ALERT — dismissible */}
    {activeAlert&&<div style={{background:C.surface,border:`1px solid ${C.border}`,borderLeft:`2px solid ${activeAlert.color}`,borderRadius:8,padding:"8px 12px",marginBottom:10,display:"flex",gap:8,alignItems:"center"}}>
      <div style={{flex:1}}>
        <p style={{color:C.text,fontSize:12,fontWeight:500,margin:0}}>{activeAlert.title}</p>
        {activeAlert.body&&<p style={{color:C.textSub,fontSize:11,margin:"2px 0 0",lineHeight:1.4}}>{activeAlert.body}</p>}
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
          <p style={{color:s.color||C.text,fontSize:13,fontWeight:600,margin:0}}>{s.icon} {s.tabName}{s.planoKey?` ${s.planoKey}`:""}</p>
          {rpe&&<p style={{color:C.textMuted,fontSize:11,margin:0}}>RPE {rpe}/10</p>}
        </div>;
      })}
    </Card>}

    {/* SLEEP + NUTRITION */}
    <NutricionHoy onNavigate={onGoToNutricion} ydProtPct={ydProtPct}/>
    {/* DIVIDER */}
    <div style={{height:1,background:C.border,margin:"14px 0"}}/>

    {/* OBJETIVO PROGRESO → Físico */}
    {(()=>{
      const objs=loadObjectives();
      if(!objs.length) return null;
      const mAll=safeArr(load(K.medidas));
      const pesoActual=mAll.length?parseFloat(mAll[0].peso):null;
      const pesoInicial=mAll.length>1?parseFloat(mAll[mAll.length-1].peso):pesoActual;
      return objs.map(obj=>{
        const isPeso=obj.unit==="kg"||obj.name?.toLowerCase().includes("peso");
        const targetRaw=obj.target||"";
        const targetNum=targetRaw?parseFloat(targetRaw.split("-")[0]):null;

        // Weight objectives: use medidas for current value + oldest as baseline
        // Other objectives: use obj.current as current and obj.current as baseline start —
        //   baseline is the value when obj was created; user updates obj.current over time.
        //   We store the original start in obj.start (if set); fall back to the first ever obj.current.
        let fromNum, currentNum;
        if(isPeso){
          fromNum=pesoInicial;
          currentNum=pesoActual;
        } else {
          // Non-weight: progress = current / target (0 → goal)
          // No baseline needed — shows how much of the goal is reached.
          const cur=obj.current!==undefined&&obj.current!==""?parseFloat(obj.current):null;
          fromNum=0;
          currentNum=cur;
        }

        const pct=(currentNum!==null&&targetNum!==null&&isFinite(currentNum)&&isFinite(targetNum)&&targetNum!==0)
          ?Math.min(100,Math.max(0,Math.round((isPeso
              ?(currentNum-fromNum)/(targetNum-fromNum)  // weight: (actual-initial)/(target-initial)
              :currentNum/targetNum                       // non-weight: current/target
            )*100)))
          :null;
        const displayCur=isPeso&&pesoActual?`${pesoActual}kg`:obj.current||"—";
        return <button key={obj.id} onClick={onGoToFisico} style={{width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"10px 14px",cursor:"pointer",textAlign:"left",marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:pct!==null?8:0}}>
            <div>
              <p style={{color:C.text,fontSize:13,fontWeight:600,margin:"0 0 3px"}}>{obj.name||"Objetivo"}</p>
              <p style={{color:C.text,fontSize:13,fontWeight:500,margin:0}}>
                {displayCur}{targetRaw?` → ${targetRaw}`:""}
              </p>
            </div>
            <span style={{color:C.textMuted,fontSize:16}}>›</span>
          </div>
          {pct!==null&&<ProgressBar pct={pct} color={pct>=100?C.green:C.text} height={3}/>}
          {pct!==null&&<p style={{color:C.textMuted,fontSize:10,margin:"4px 0 0"}}>{pct}% completado</p>}
        </button>;
      });
    })()}

  </div>;
}


// ── SCREEN PROGRESO ───────────────────────────────────────────────────────────
function ScreenCalendario(){
  const [mesOffset,setMesOffset]=useState(0);
  const [selectedDay,setSelectedDay]=useState(null);

  const base=new Date();base.setDate(1);base.setMonth(base.getMonth()+mesOffset);
  const year=base.getFullYear(),month=base.getMonth();
  const mesNombre=base.toLocaleDateString("es-ES",{month:"long"}).replace(/^./,c=>c.toUpperCase())+" "+base.getFullYear();
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
      <button onClick={()=>{setMesOffset(o=>o-1);setSelectedDay(null);}} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,color:C.text,padding:"6px 14px",cursor:"pointer",fontSize:14}}>‹</button>
      <p style={{color:C.text,fontSize:14,fontWeight:600,margin:0,textTransform:"capitalize"}}>{mesNombre}</p>
      <button onClick={()=>{setMesOffset(o=>o+1);setSelectedDay(null);}} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,color:C.text,padding:"6px 14px",cursor:"pointer",fontSize:14}}>›</button>
    </div>

    {/* Month stats */}
    <div style={{display:"flex",gap:6,marginBottom:14}}>
      <Card style={{flex:1,minWidth:0,textAlign:"center",padding:"10px 6px"}}>
        <p style={{color:C.text,fontSize:13,fontWeight:600,margin:"0 0 3px"}}>Entrenados</p>
        <p style={{color:C.text,fontSize:16,fontWeight:700,margin:0}}>{diasEntrenados}</p>
      </Card>
      <Card style={{flex:1,minWidth:0,textAlign:"center",padding:"10px 6px"}}>
        <p style={{color:C.text,fontSize:13,fontWeight:600,margin:"0 0 3px"}}>Descansos</p>
        <p style={{color:C.text,fontSize:16,fontWeight:700,margin:0}}>{diasEnMes-diasEntrenados}</p>
      </Card>
      <Card style={{flex:1,minWidth:0,textAlign:"center",padding:"10px 6px"}}>
        <p style={{color:C.text,fontSize:13,fontWeight:600,margin:"0 0 3px"}}>Adherencia</p>
        <p style={{color:C.text,fontSize:16,fontWeight:700,margin:0}}>
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
          const colors=safeArr(sessions).map(s=>s.color||C.text);
          return <button
            key={day}
            onClick={()=>setSelectedDay(isSelected?null:day)}
            style={{
              aspectRatio:"1",
              borderRadius:8,
              border:`1px solid ${isSelected?C.text:isToday?"#ffffff44":"transparent"}`,
              background:trained?C.text+"22":isToday?C.surface:"transparent",
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
      <Card style={{border:`1px solid ${C.text}33`}}>
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
                <p style={{color:s.color||C.text,fontSize:13,fontWeight:600,margin:0}}>
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
              <Tag color={C.text}> {selProt}g prot</Tag>
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
  const proColor=C.text;
  return <div style={{padding:"2px 8px 100px"}}>
    <div style={{display:"flex",gap:0,marginBottom:14,background:C.bg,borderRadius:10,padding:3,border:`1px solid ${C.border}`}}>
      {[["semana","Semana"],["historial","Mes"],["cuerpo","Físico"]].map(([id,label])=>(
        <button key={id} onClick={()=>setProTab(id)} style={{flex:1,background:proTab===id?C.card:"transparent",color:proTab===id?C.text:C.textMuted,border:proTab===id?`1px solid ${C.border}`:"1px solid transparent",borderRadius:8,padding:"7px 4px",fontSize:11,fontWeight:proTab===id?600:400,cursor:"pointer",transition:"all 0.12s",letterSpacing:proTab===id?-0.1:0}}>{label}</button>
      ))}
    </div>
    {proTab==="semana"&&<ProgresoSemana/>}
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
  const gf=load(K.medidas)?.length?parseFloat(load(K.medidas)[0].grasa)||10:10;
  const np=load(K.nutProfile)||NUT_PROFILE_SEED;
  const sx=gf<8?500:gf<12?400:gf<16?350:300;
  const bmr=Math.round(10*pw+6.25*(np.altura||175)-5*(np.edad||25)+5);
  const kcalObj=Math.round(bmr*(np.actividad||1.55))+sx;
  const allLog=load(K.proteinLog)||{};
  const last7=[...Array(7)].map((_,i)=>{
    const d=new Date();d.setDate(d.getDate()-i);
    const ds=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    const log=allLog[ds]||[];
    return {prot:log.reduce((a,e)=>a+(e.prot||0),0)>=pt, kcal:kcalObj>0&&log.reduce((a,e)=>a+(e.kcal||0),0)>=kcalObj*0.8};
  }).reverse();
  const daysHit=last7.filter(d=>d.prot).length;
  const kcalDaysHit=last7.filter(d=>d.kcal).length;
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

      return <Card style={{marginBottom:14}}>
        <p style={{color:C.text,fontSize:13,fontWeight:600,margin:"0 0 12px"}}>Esta semana</p>

        {/* Plan vs ejecutado */}
        {planVsReal.planned>0&&<div style={{marginBottom:10,paddingBottom:10,borderBottom:`1px solid ${C.border}`}}>
          <div style={{marginBottom:6}}>
            <p style={{color:C.textMuted,fontSize:11,margin:"0 0 3px",fontWeight:400}}>Adherencia</p>
            <p style={{color:planVsReal.adherence>=75?C.green:planVsReal.adherence>=50?C.orange:C.red,fontSize:13,fontWeight:600,margin:0,lineHeight:1}}>
              {adherenceTxt}{planVsReal.adherence!==null&&adherenceTxt!=="Completado"&&adherenceTxt!=="—"?<span style={{fontSize:11}}>%</span>:""}
              <span style={{color:C.textMuted,fontSize:11,fontWeight:400,marginLeft:8}}>{planVsReal.executed}/{planVsReal.planned} sesiones</span>
            </p>
          </div>
          <ProgressBar pct={planVsReal.adherence||0} color={planVsReal.adherence>=100?C.green:planVsReal.adherence>=75?C.yellow:planVsReal.adherence>=50?C.orange:C.red} height={4}/>
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
      </Card>;
    })()}

    <SectionLabel>Esta semana</SectionLabel>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14}}>
      {[{label:"Días",val:daysThisWeek,unit:"/ 7",status:daysThisWeek>=4?C.green:daysThisWeek>=2?C.orange:null},{label:"RPE",val:avgRPE||"—",unit:"/10",status:avgRPE>=8?C.red:null},{label:"Proteína",val:daysHit,unit:"/ 7",status:daysHit>=5?C.green:daysHit>=3?C.orange:C.red}].map(({label,val,unit,status})=>(
        <Card key={label} style={{padding:"12px 8px",textAlign:"center"}}>
          <p style={{color:C.text,fontSize:13,fontWeight:600,margin:"0 0 6px"}}>{label}</p>
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
        {last7.map((d,i)=><div key={i} style={{flex:1,height:8,borderRadius:6,background:d.prot?C.green:C.borderLight}}/>)}
      </div>
      <p style={{color:C.textMuted,fontSize:10,margin:0}}>{daysHit>=5?"Excelente":daysHit>=3?`Mejorable — 5+ días con ≥${pt}g`:"Baja — impacta en recuperación"}</p>
    </Card>
    {kcalObj>0&&<Card style={{marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <p style={{color:C.text,fontSize:13,fontWeight:600,margin:0}}>Kcal</p>
        <p style={{color:kcalDaysHit>=5?C.green:kcalDaysHit>=3?C.orange:C.textMuted,fontSize:12,fontWeight:700,margin:0}}>{kcalDaysHit}/7</p>
      </div>
      <div style={{display:"flex",gap:4,marginBottom:4}}>
        {last7.map((d,i)=><div key={i} style={{flex:1,height:6,borderRadius:6,background:d.kcal?C.text+"88":C.borderLight}}/>)}
      </div>
      <p style={{color:C.textMuted,fontSize:10,margin:0}}>Días ≥80% del objetivo ({kcalObj} kcal)</p>
    </Card>}
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
  const [editNutProfile,setEditNutProfile]=useState(false);
  const ACT_SHORT={1.2:"Sedentario",1.375:"Ligero",1.55:"Moderado",1.725:"Activo",1.9:"Muy activo"};
  const actLabel=ACT_SHORT[profile.actividad]||"—";
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
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16,marginBottom:14}}>
      <p style={{color:C.text,fontSize:13,fontWeight:600,margin:"0 0 6px"}}>Ganancia masa · {grasaActual}% grasa</p>
      <p style={{color:C.text,fontSize:18,fontWeight:700,margin:"8px 0 2px"}}>{surplus} kcal/día</p>
      <p style={{color:C.textMuted,fontSize:11,margin:"0 0 14px"}}>TDEE {TDEE} + {surplusExtra} superávit · {pesoActual}kg</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
        {[["Proteínas",proteinTarget+"g"],["Carbohidratos",carbTarget+"g"],["Grasas",fatTarget+"g"]].map(([l,v])=>(
          <div key={l} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 6px",textAlign:"center"}}>
            <p style={{color:C.text,fontSize:13,fontWeight:600,margin:"0 0 5px"}}>{l}</p>
            <p style={{color:C.text,fontSize:16,fontWeight:700,margin:0}}>{v}</p>
          </div>
        ))}
      </div>
    </div>

    {/* Latest body metrics */}
    {ultimaMedida&&<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14}}>
      {[["Peso",ultimaMedida.peso,"kg"],["Grasa",ultimaMedida.grasa,"%"],["Masa magra",ultimaMedida.masaMagra,"kg"]].map(([l,v,u])=>(
        <Card key={l} style={{padding:"12px 8px",textAlign:"center"}}>
          <p style={{color:C.text,fontSize:13,fontWeight:600,margin:"0 0 5px"}}>{l}</p>
          <p style={{color:C.text,fontSize:18,fontWeight:700,margin:0,letterSpacing:-0.5}}>{v||"—"}<span style={{color:C.textMuted,fontSize:11,fontWeight:400}}>{v?u:""}</span></p>
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
      <p style={{color:C.text,fontSize:13,fontWeight:600,margin:"0 0 8px"}}>Velocidad de ganancia</p>
      <p style={{color:C.textMuted,fontSize:12,margin:0}}>Añade 2+ evaluaciones en Cuerpo para ver tu ritmo.</p>
    </Card>}
    <div style={{marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <SectionLabel>Objetivos</SectionLabel>
        <button onClick={()=>saveObjectives([...objectives,{id:"o"+Date.now(),name:"Nuevo objetivo",start:"",current:"",target:"",unit:""}])} style={{background:"none",border:`1px solid ${C.border}`,color:C.textSub,borderRadius:6,padding:"3px 10px",cursor:"pointer",fontSize:10,fontWeight:500}}>+ Añadir</button>
      </div>
      {objectives.map((obj,i)=>(
        <Card key={obj.id} style={{marginBottom:8}}>
          <div style={{display:"flex",gap:6,marginBottom:6}}>
            <Input type="text" value={obj.name} onChange={e=>{const upd=[...objectives];upd[i]={...upd[i],name:e.target.value};saveObjectives(upd);}} placeholder="Objetivo" style={{flex:2}}/>
            <button onClick={()=>saveObjectives(objectives.filter(o=>o.id!==obj.id))} style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:14}}>✕</button>
          </div>
          <div style={{display:"flex",gap:6}}>
            <div style={{flex:1}}><p style={{color:C.textMuted,fontSize:11,margin:"0 0 3px"}}>Actual</p><Input value={obj.current} onChange={e=>{const upd=[...objectives];upd[i]={...upd[i],current:e.target.value};saveObjectives(upd);}} style={{}}/></div>
            <div style={{flex:1}}><p style={{color:C.textMuted,fontSize:11,margin:"0 0 3px"}}>Meta</p><Input type="text" value={obj.target} onChange={e=>{const upd=[...objectives];upd[i]={...upd[i],target:e.target.value};saveObjectives(upd);}} style={{}}/></div>
            <div style={{flex:"0 0 55px"}}><p style={{color:C.textMuted,fontSize:11,margin:"0 0 3px"}}>Unidad</p><Input type="text" value={obj.unit} onChange={e=>{const upd=[...objectives];upd[i]={...upd[i],unit:e.target.value};saveObjectives(upd);}} style={{}}/></div>
          </div>
        </Card>
      ))}
    </div>
    <MedidasPanel/>
    <Card style={{marginTop:14}}>
      <button onClick={()=>setEditNutProfile(v=>!v)} style={{width:"100%",background:"none",border:"none",padding:0,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:editNutProfile?10:0}}>
        <div style={{textAlign:"left"}}>
          <p style={{color:C.text,fontSize:13,fontWeight:600,margin:editNutProfile?0:"0 0 3px"}}>Datos base</p>
          {!editNutProfile&&<p style={{color:C.textMuted,fontSize:11,margin:0}}>{profile.altura}cm · {profile.edad}a · {actLabel}</p>}
        </div>
        <span style={{color:C.textMuted,fontSize:12,marginLeft:8,flexShrink:0,display:"inline-block",transition:"transform 0.2s",transform:editNutProfile?"rotate(180deg)":"rotate(0deg)"}}>▼</span>
      </button>
      {editNutProfile&&<>
        <div style={{display:"flex",gap:8,marginBottom:8}}>
          <div style={{flex:1}}><p style={{color:C.textMuted,fontSize:11,margin:"0 0 4px"}}>Altura (cm)</p><Input value={profile.altura} onChange={e=>saveProfile({...profile,altura:parseInt(e.target.value)||175})}/></div>
          <div style={{flex:1}}><p style={{color:C.textMuted,fontSize:11,margin:"0 0 4px"}}>Edad</p><Input value={profile.edad} onChange={e=>saveProfile({...profile,edad:parseInt(e.target.value)||31})}/></div>
        </div>
        {[[1.2,"Sedentario"],[1.375,"Ligero — 1-3 días/sem"],[1.55,"Moderado — 3-5 días/sem"],[1.725,"Activo — 6-7 días/sem"],[1.9,"Muy activo — 2x/día"]].map(([val,label])=>(
          <button key={val} onClick={()=>saveProfile({...profile,actividad:val})} style={{display:"block",width:"100%",background:profile.actividad===val?C.card:C.surface,color:profile.actividad===val?C.text:C.textSub,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",cursor:"pointer",fontSize:11,textAlign:"left",fontWeight:profile.actividad===val?600:400,marginBottom:4}}>{profile.actividad===val?"✓ ":""}{label}</button>
        ))}
      </>}
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
      <button onClick={handleSaveTemplate} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.textSub,padding:"6px 12px",cursor:"pointer",fontSize:11,fontWeight:500}}> Guardar plantilla</button>
      {templates.length>0&&<button onClick={()=>setShowTpl(s=>!s)} style={{background:showTpl?C.text+"22":C.surface,border:`1px solid ${showTpl?C.text:C.border}`,borderRadius:8,color:showTpl?C.text:C.textSub,padding:"6px 12px",cursor:"pointer",fontSize:11,fontWeight:500}}> {templates.length}</button>}
    </div>
    {showTpl&&<div style={{background:C.surface,borderRadius:12,padding:12,marginBottom:14}}>
      <p style={{color:C.text,fontSize:13,fontWeight:600,margin:"0 0 8px"}}>Plantillas guardadas</p>
      {templates.map(tpl=>(
        <div key={tpl.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${C.border}`}}>
          <div>
            <p style={{color:C.text,fontSize:12,fontWeight:500,margin:0}}>{tpl.label}</p>
            <p style={{color:C.textMuted,fontSize:10,margin:0}}>Guardada el {tpl.saved}</p>
          </div>
          <div style={{display:"flex",gap:6}}>
            <button onClick={()=>handleApplyTemplate(tpl)} style={{background:C.text,color:C.bg,border:"none",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:11,fontWeight:700}}>Aplicar</button>
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
            const color=gymPlanos[a.planoKey]?.color||tabs.find(t=>t.id===a.tabId)?.color||C.text;
            const label=a.tabId==="gym"?` Gym ${a.planoKey}`:`${tabs.find(t=>t.id===a.tabId)?.icon||""} ${tabs.find(t=>t.id===a.tabId)?.name||a.tabId}`;
            return <div key={ai} style={{display:"flex",alignItems:"center",gap:4,background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,padding:"6px 12px"}}>
              <p style={{color:C.text,fontSize:11,fontWeight:400,margin:0}}>{label}</p>
              <button onClick={()=>{const upd=[...weekPlan];upd[di]={...upd[di],assignments:assignments.filter((_,i)=>i!==ai)};saveWeek(upd);}} style={{background:"none",border:"none",color,cursor:"pointer",fontSize:10,padding:0}}>✕</button>
            </div>;
          })}
        </div>
        <select onChange={e=>{if(!e.target.value) return;const opt=JSON.parse(e.target.value);const upd=[...weekPlan];upd[di]={...upd[di],assignments:[...assignments,opt]};saveWeek(upd);e.target.value="";}} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.textSub,padding:"6px 8px",fontSize:11,width:"100%"}}>
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
  if(!open) return <button onClick={()=>setOpen(true)} style={{background:"none",border:`1px solid ${C.border}`,color:C.textSub,borderRadius:6,padding:"3px 10px",cursor:"pointer",fontSize:10,fontWeight:500}}>+ Añadir</button>;
  return <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:14,marginTop:8}}>
    <div style={{display:"flex",gap:8,marginBottom:8}}>
      <Input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Nombre del producto" style={{flex:2}} onEnter={()=>{if(name.trim()){onAdd({id:"s_"+Date.now(),name:name.trim(),cat,done:false});setName("");setOpen(false);}}}/>
    </div>
    <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:10}}>
      {CAT_ORDER.map(c=>(
        <button key={c} onClick={()=>setCat(c)} style={{background:cat===c?C.card:C.surface,color:cat===c?C.text:C.textSub,border:`1px solid ${cat===c?C.text:C.border}`,borderRadius:8,padding:"6px 12px",fontSize:10,cursor:"pointer",fontWeight:cat===c?600:400}}>{CAT_LABELS[c]||c}</button>
      ))}
    </div>
    <div style={{display:"flex",gap:8}}>
      <Btn onClick={()=>{if(!name.trim())return;onAdd({id:"s_"+Date.now(),name:name.trim(),cat,done:false});setName("");setOpen(false);}} color={color} style={{flex:1}}>Añadir</Btn>
      <button onClick={()=>{setOpen(false);setName("");}} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:12,color:C.textMuted,padding:"10px 14px",cursor:"pointer",fontSize:12}}>Cancelar</button>
    </div>
  </div>;
}

function CustomProteinAdd({onAdd,color,onSaveFood}){
  const [name,setName]=useState("");
  const [prot,setProt]=useState("");
  const [open,setOpen]=useState(false);
  if(!open) return <button onClick={()=>setOpen(true)} style={{background:"none",border:`1px solid ${C.border}`,color:C.textSub,borderRadius:6,padding:"3px 10px",cursor:"pointer",fontSize:10,fontWeight:500,marginBottom:12}}>+ Añadir alimento personalizado</button>;
  return <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:14,marginBottom:12}}>
    <div style={{display:"flex",gap:8,marginBottom:8}}>
      <Input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Nombre" style={{flex:2}}/>
      <Input value={prot} onChange={e=>setProt(e.target.value)} placeholder="g prot" style={{flex:1}}/>
    </div>
    <div style={{display:"flex",gap:8}}>
      <Btn onClick={()=>{if(!name.trim()||!prot)return;const e={name:name.trim(),prot:parseFloat(prot)||0,time:new Date().toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"})};onAdd(e);if(onSaveFood)onSaveFood({id:"cf_"+Date.now(),name:e.name,prot:e.prot});setName("");setProt("");setOpen(false);}} color={color} style={{flex:1}}>Añadir</Btn>
      <button onClick={()=>{setOpen(false);setName("");setProt("");}} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:12,color:C.textMuted,padding:"10px 14px",cursor:"pointer",fontSize:12}}>Cancelar</button>
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
        padding:"6px 12px",
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

function ScreenNutricion({initTab="registro"}){
  const nutColor=C.text;
  const [nutTab,setNutTab]=useState(initTab==="hoy"?"registro":initTab);

  // ── State ─────────────────────────────────────────────────────────────────
  const [mealPlan,setMealPlan]=useState(()=>load(K.mealPlan)||MEAL_PLAN_SEED);
  const [shopping,setShopping]=useState(()=>load(K.shopping)||SHOPPING_SEED);
  const [intakeLog,setIntakeLog]=useState(()=>(load(K.proteinLog)||{})[today()]||[]);
  const [hydration,setHydration]=useState(()=>(load(K.proteinLog)||{})[today()+"_h"]||0);
  const [supDone,setSupDone]=useState(()=>load("pg_sup_done")||{});
  const [customFoods,setCustomFoods]=useState(()=>load(K.customFoods)||[]);
  const [supplements,setSupplements]=useState(()=>load(K.supplements)||DEFAULT_SUPPLEMENTS);
  const [newSupName,setNewSupName]=useState("");
  const [newSupDose,setNewSupDose]=useState("");
  const [newSupIsProtein,setNewSupIsProtein]=useState(false);
  const [newSupProtGrams,setNewSupProtGrams]=useState("");
  const [addingSup,setAddingSup]=useState(false);
  const [expandedDays,setExpandedDays]=useState({[((new Date().getDay()+6)%7)]:true});
  // Manual entry
  const [manualName,setManualName]=useState("");
  const [manualProt,setManualProt]=useState("");
  const [manualKcal,setManualKcal]=useState("");
  const [showManual,setShowManual]=useState(false);
  // Recipes
  const [recipes,setRecipes]=useState(()=>load(K.recipes)||[]);
  const [openRecipeName,setOpenRecipeName]=useState(null);
  const [logBump,setLogBump]=useState(0);
  const [expandedMeal,setExpandedMeal]=useState(null);
  const [mealTemplates,setMealTemplates]=useState(()=>load("pg_meal_tpl")||[]);
  const [showMealTpl,setShowMealTpl]=useState(false);
  const [savingTpl,setSavingTpl]=useState(false);
  const [tplName,setTplName]=useState("");
  const [shopLists,setShopLists]=useState(()=>load("pg_shop_lists")||[]);
  const [showShopLists,setShowShopLists]=useState(false);
  const [savingShop,setSavingShop]=useState(false);
  const [shopListName,setShopListName]=useState("");
  const [recipeFavs,setRecipeFavs]=useState(()=>load("pg_rec_favs")||[]);
  const [favOnly,setFavOnly]=useState(false);
  const [showAddRecipe,setShowAddRecipe]=useState(false);
  const [recName,setRecName]=useState("");
  const [recType,setRecType]=useState("Comida");
  const [recIng,setRecIng]=useState("");
  const [recKcal,setRecKcal]=useState("");
  const [recProt,setRecProt]=useState("");
  const [recNotes,setRecNotes]=useState("");

  function saveMealPlan(upd){setMealPlan(upd);save(K.mealPlan,upd);}
  // Saved weekly meal plans — adapted from the training week-template pattern.
  function saveMealTemplates(upd){setMealTemplates(upd);save("pg_meal_tpl",upd);}
  function handleSaveMealTemplate(){
    const name=tplName.trim()||`Plan ${today()}`;
    const tpl={id:"mtpl_"+Date.now(),saved:today(),label:name,plan:JSON.parse(JSON.stringify(mealPlan))};
    saveMealTemplates([tpl,...mealTemplates].slice(0,8));
    setTplName("");setSavingTpl(false);
    pushToast({type:"success",text:"Plan guardado"});
  }
  function handleApplyMealTemplate(tpl){
    saveMealPlan(JSON.parse(JSON.stringify(tpl.plan)));
    setShowMealTpl(false);
    pushToast({type:"success",text:`Plan "${tpl.label}" cargado`});
  }
  // Saved shopping lists — same lightweight pattern, reusing the shopping item format.
  function saveShopLists(upd){setShopLists(upd);save("pg_shop_lists",upd);}
  function handleSaveShopList(){
    if(shopping.length===0){pushToast({type:"info",text:"La lista está vacía."});return;}
    const name=shopListName.trim()||`Lista ${today()}`;
    const lst={id:"slist_"+Date.now(),saved:today(),label:name,items:JSON.parse(JSON.stringify(shopping))};
    saveShopLists([lst,...shopLists].slice(0,8));
    setShopListName("");setSavingShop(false);
    pushToast({type:"success",text:"Lista guardada"});
  }
  function handleLoadShopList(lst){
    saveShopping(JSON.parse(JSON.stringify(lst.items)));
    setShowShopLists(false);
    pushToast({type:"success",text:`Lista "${lst.label}" cargada`});
  }
  // ── Lightweight, deterministic suggestion ranking + labels ──
  // Considers meal moment (type), training/rest for the day, protein still
  // needed today, and variety vs the rest of the week. Only the top pick of a
  // slot is labelled, to orient without badge spam.
  function currentMealIdx(){const h=new Date().getHours();return h<11?0:h<13?1:h<16?2:h<19?3:4;}
  // At most one label per slot, and each label kept rare so they orient rather than decorate:
  //  · "Buen encaje ahora" → only the slot matching the current time of day, today.
  //  · "Post-entreno"      → only the main post-training meal (Comida) on training days.
  //  · "Alta proteína"/"Ligera" → only a genuinely standout top pick.
  function sugLabelFor(s,idx,isNowSlot,trainingDay,behindProtein,mt){
    if(idx!==0) return null;
    if(isNowSlot&&(trainingDay||behindProtein)) return "Buen encaje ahora";
    if(trainingDay&&mt==="Comida"&&s.prot>=35) return "Post-entreno";
    if(s.prot>=40) return "Alta proteína";
    if(s.kcal<=220) return "Ligera";
    return null;
  }
  function rankMealSugs(mt,di,mi){
    const sugs=MEAL_SUGGESTIONS.filter(s=>s.type===mt);
    const trainingDay=safeArr(loadWeek()[di]?.assignments).length>0;
    const isTodayDi=di===todayDow;
    const behindProtein=isTodayDi&&(pt-totalProt)>pt*0.4;
    const isNowSlot=isTodayDi&&mi===currentMealIdx();
    const usage={};
    Object.values(mealPlan||{}).forEach(d=>safeArr(d?.meals).forEach(m=>{const n=(m?.desc||"").trim().toLowerCase();if(n)usage[n]=(usage[n]||0)+1;}));
    const scored=sugs.map(s=>{
      let score=0;
      if(trainingDay) score+=s.prot>=40?3:s.prot>=30?2:s.prot>=20?1:0;
      if(behindProtein) score+=s.prot>=35?3:s.prot>=25?2:s.prot>=15?1:0;
      if(isNowSlot) score+=1;
      score-=(usage[s.name.toLowerCase()]||0);
      return {s,score};
    }).sort((a,b)=>b.score-a.score||b.s.prot-a.s.prot);
    return scored.map((x,idx)=>({...x.s,_label:sugLabelFor(x.s,idx,isNowSlot,trainingDay,behindProtein,mt)}));
  }
  // ── Light contextual layer: 1-2 "what fits now" picks from existing context ──
  function nutRecommendations(){
    const nowIdx=currentMealIdx();
    const mt=MEAL_TYPES[nowIdx];
    const proteinMet=totalProt>=pt;
    let list;
    if(proteinMet){
      list=MEAL_SUGGESTIONS.filter(s=>s.type===mt).slice().sort((a,b)=>a.kcal-b.kcal)
        .map((s,i)=>({...s,_label:i===0?"Ligera para cerrar macros":null}));
    } else {
      list=rankMealSugs(mt,todayDow,nowIdx);
    }
    return {mt,items:list.slice(0,2)};
  }
  function quickAddRec(s){
    saveIntakeLog([...intakeLog,{name:s.name,prot:s.prot,kcal:s.kcal,time:new Date().toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"})}]);
    pushToast({type:"success",text:`Registrado: ${s.prot}g prot · ${s.kcal} kcal`});
  }
  function saveShopping(upd){setShopping(upd);save(K.shopping,upd);}
  function saveRecipes(upd){setRecipes(upd);save(K.recipes,upd);}
  function toggleRecipeFav(id){const upd=recipeFavs.includes(id)?recipeFavs.filter(x=>x!==id):[...recipeFavs,id];setRecipeFavs(upd);save("pg_rec_favs",upd);}
  const allRecipes=[...MEAL_SUGGESTIONS.map(r=>({...r,id:"seed_"+r.name,seed:true})),...recipes];
  // Surface practical recipes first: favorites, then most-used in the plan, then original order.
  const recipeUsage={};
  Object.values(mealPlan||{}).forEach(d=>safeArr(d?.meals).forEach(m=>{const n=(m?.desc||"").trim().toLowerCase();if(n)recipeUsage[n]=(recipeUsage[n]||0)+1;}));
  const orderedRecipes=allRecipes.map((r,i)=>({r,i})).sort((a,b)=>{
    const fa=recipeFavs.includes(a.r.id)?1:0,fb=recipeFavs.includes(b.r.id)?1:0;
    if(fb!==fa) return fb-fa;
    const ua=recipeUsage[a.r.name.toLowerCase()]||0,ub=recipeUsage[b.r.name.toLowerCase()]||0;
    if(ub!==ua) return ub-ua;
    return a.i-b.i;
  }).map(x=>x.r);
  const recipesToShow=favOnly?orderedRecipes.filter(r=>recipeFavs.includes(r.id)):orderedRecipes;
  function findRecipe(name){const n=(name||"").trim().toLowerCase();return n?allRecipes.find(r=>r.name.toLowerCase()===n):null;}
  function openRecipeView(name){setOpenRecipeName(name);setNutTab("recetas");}
  const recInputStyle={WebkitAppearance:"none",fontFamily:"inherit",width:"100%",boxSizing:"border-box",background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,color:C.text,padding:"7px 9px",outline:"none"};
  function addRecipeToShopping(recipe){
    const inList=(name)=>{const n=name.toLowerCase();return (shopping||[]).some(s=>{const e=(s.name||"").toLowerCase();return e===n||e.includes(n)||n.includes(e);});};
    let idSeed=Date.now();
    const items=(recipe.ing||[]).filter(ig=>!inList(ig.name)).map(ig=>({id:`r_${++idSeed}_${ig.name}`,name:ig.name,cat:ig.cat||"otros",done:false}));
    if(items.length===0){pushToast({type:"info",text:"Ya tienes esos ingredientes en la lista de compra."});return;}
    saveShopping([...(shopping||[]),...items]);
    pushToast({type:"success",text:`Añadido${items.length>1?"s":""} ${items.length} ingrediente${items.length>1?"s":""} a la compra`});
  }
  function addManualRecipe(){
    const name=recName.trim();if(!name)return;
    const ing=recIng.split(",").map(s=>s.trim()).filter(Boolean).map(s=>({name:s,cat:"otros"}));
    const r={id:"r_"+Date.now(),name,type:recType,kcal:parseInt(recKcal)||0,prot:parseInt(recProt)||0,ing,notes:recNotes.trim()};
    saveRecipes([...recipes,r]);
    setRecName("");setRecIng("");setRecKcal("");setRecProt("");setRecNotes("");setShowAddRecipe(false);
    pushToast({type:"success",text:"Receta añadida"});
  }
  // ── Auto-log on meal completion (writes into existing daily intake log) ──
  // Identity = day's date bucket + slot; mealId matches Registro's scheme so the
  // same meal completed in Semana or in "Plan de hoy" never double-logs.
  function dowDateStr(di){const d=new Date();const cur=(d.getDay()+6)%7;d.setDate(d.getDate()+(di-cur));return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
  function isMealLogged(di,mi){const _=logBump;const ds=dowDateStr(di);const dayLog=ds===today()?intakeLog:((load(K.proteinLog)||{})[ds]||[]);return dayLog.some(e=>String(e.mealId)===`${di}_${mi}`);}
  function toggleMealLogged(di,mi){
    const meal=(mealPlan[di]?.meals||[])[mi]||{};
    const ds=dowDateStr(di);
    const id=`${di}_${mi}`;
    const kcal=parseInt(meal.kcal)||0, prot=parseInt(meal.prot)||0;
    const all=load(K.proteinLog)||{};
    const dayLog=ds===today()?intakeLog:(all[ds]||[]);
    const already=dayLog.some(e=>String(e.mealId)===id);
    let updated;
    if(already){
      updated=dayLog.filter(e=>String(e.mealId)!==id);
    } else {
      if(kcal<=0&&prot<=0){pushToast({type:"info",text:"Sin kcal ni proteína: añade datos para poder registrar esta comida."});return;}
      updated=[...dayLog,{name:`${MEAL_TYPES[mi]||meal.t||""}: ${meal.desc}`,prot,kcal,time:new Date().toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"}),mealId:id}];
      pushToast({type:"success",text:`Registrado: ${prot}g prot · ${kcal} kcal`});
    }
    if(ds===today()){saveIntakeLog(updated);} else {all[ds]=updated;save(K.proteinLog,all);setLogBump(b=>b+1);}
  }
  function saveIntakeLog(upd){setIntakeLog(upd);const all=load(K.proteinLog)||{};all[today()]=upd;save(K.proteinLog,all);}
  function saveHydration(val){const v=Math.max(0,Math.round(val*10)/10);setHydration(v);const all=load(K.proteinLog)||{};all[today()+"_h"]=v;save(K.proteinLog,all);}
  function saveSupDone(upd){setSupDone(upd);save("pg_sup_done",upd);}
  function saveCustomFoods(upd){setCustomFoods(upd);save(K.customFoods,upd);}
  function saveSupplements(upd){setSupplements(upd);save(K.supplements,upd);}
  function deleteSup(id){setSupplements(prev=>{const u=prev.filter(s=>s.id!==id);save(K.supplements,u);return u;});saveSupDone({...supDone,[id]:false});saveIntakeLog(intakeLog.filter(e=>e.supId!==id));}
  function addSup(){if(!newSupName.trim())return;const pg=newSupIsProtein?parseInt(newSupProtGrams)||0:0;const ns={id:"sup_"+Date.now(),name:newSupName.trim(),dose:newSupDose.trim(),isProtein:newSupIsProtein,proteinGrams:pg};saveSupplements([...supplements,ns]);setNewSupName("");setNewSupDose("");setNewSupIsProtein(false);setNewSupProtGrams("");setAddingSup(false);}
  function getSupPg(sup){if(sup.isProtein===true)return sup.proteinGrams||0;if(sup.isProtein===false)return 0;const n=(sup.name||"").toLowerCase();if(!n.includes("proteí")&&!n.includes("batido")&&!n.includes("whey")&&!n.includes("caseína"))return 0;const m=sup.dose&&sup.dose.match(/(\d+)\s*g/i);return m?parseInt(m[1]):0;}

  // ── Targets ────────────────────────────────────────────────────────────────
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

  // ── Totals ─────────────────────────────────────────────────────────────────
  const totalProt=intakeLog.reduce((a,e)=>a+(e.prot||0),0);
  const totalKcal=intakeLog.reduce((a,e)=>a+(e.kcal||0),0);
  const protDone=totalProt>=pt;
  const watDone=hydration>=ht;
  const isWOD=loadWeek()[(new Date().getDay()+6)%7]?.assignments?.some(a=>a.tabId==="wod");
  const wtgt=isWOD?Math.round((ht+0.75)*10)/10:ht;

  // ── Helpers ────────────────────────────────────────────────────────────────
  const todayDow=(new Date().getDay()+6)%7;
  const lastTrainedToday=getTrainedSessions(today()).length>0;
  const dayNames=["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
  const orderedDays=Array.from({length:7},(_,i)=>(todayDow+i)%7);
  const MEAL_TYPES=["Desayuno","Media mañana","Comida","Merienda","Cena"];
  const todayMeals=(mealPlan[todayDow]?.meals||[]).map((m,i)=>({...m,_idx:i})).filter(m=>m.desc?.trim());
  // Which planned meals have been consumed today (by mealId)
  const consumedIds=new Set(intakeLog.filter(e=>e.mealId!==undefined).map(e=>String(e.mealId)));

  function consumeMeal(meal){
    const id=`${todayDow}_${meal._idx}`;
    if(consumedIds.has(id)){
      saveIntakeLog(intakeLog.filter(e=>String(e.mealId)!==id));
    } else {
      saveIntakeLog([...intakeLog,{
        name:`${MEAL_TYPES[meal._idx]||meal.t}: ${meal.desc}`,
        prot:parseInt(meal.prot)||0,
        kcal:parseInt(meal.kcal)||0,
        time:new Date().toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"}),
        mealId:id,
      }]);
    }
  }

  function addManual(){
    if(!manualName.trim()&&!manualProt&&!manualKcal) return;
    saveIntakeLog([...intakeLog,{
      name:manualName.trim()||"Sin nombre",
      prot:parseInt(manualProt)||0,
      kcal:parseInt(manualKcal)||0,
      time:new Date().toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"}),
    }]);
    setManualName("");setManualProt("");setManualKcal("");setShowManual(false);
  }

  const TABS=[["registro","Registro"],["plan","Plan"],["recetas","Recetas"],["compra","Compra"]];

  return <div style={{padding:"2px 8px 100px"}}>
    {/* Tab bar */}
    <div style={{display:"flex",gap:0,marginBottom:14,background:C.bg,borderRadius:10,padding:3,border:`1px solid ${C.border}`}}>
      {TABS.map(([id,label])=>(
        <button key={id} onClick={()=>setNutTab(id)} style={{flex:1,background:nutTab===id?C.card:"transparent",color:nutTab===id?C.text:C.textMuted,border:nutTab===id?`1px solid ${C.border}`:"1px solid transparent",borderRadius:8,padding:"7px 4px",fontSize:11,fontWeight:nutTab===id?600:400,cursor:"pointer",transition:"all 0.12s",letterSpacing:nutTab===id?-0.1:0}}>{label}</button>
      ))}
    </div>

    {/* ── REGISTRO: daily intake log ── */}
    {nutTab==="registro"&&<div>

      {/* Macro summary */}
      <Card style={{marginBottom:12}}>
        <div style={{display:"flex",gap:0}}>
          <div style={{flex:1,paddingRight:12,borderRight:`1px solid ${C.border}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:4}}>
              <p style={{color:C.text,fontSize:13,fontWeight:600,margin:0}}>Proteína</p>
              <p style={{color:protDone?C.green:C.textMuted,fontSize:10,fontWeight:600,margin:0}}>{protDone?"✓":pt-totalProt+"g"}</p>
            </div>
            <p style={{color:C.text,fontSize:16,fontWeight:700,margin:"0 0 4px",lineHeight:1,letterSpacing:-0.3}}>{totalProt}<span style={{color:C.textMuted,fontSize:11,fontWeight:400}}>/{pt}g</span></p>
            <ProgressBar pct={Math.min(100,Math.round((totalProt/pt)*100))} color={protDone?C.green:totalProt/pt>=0.7?C.orange:nutColor} height={4}/>
          </div>
          <div style={{flex:1,paddingLeft:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:4}}>
              <p style={{color:C.text,fontSize:13,fontWeight:600,margin:0}}>Kcal</p>
              <p style={{color:totalKcal>=kcalObj?C.green:C.textMuted,fontSize:10,fontWeight:600,margin:0}}>{totalKcal>=kcalObj?"✓":kcalObj-totalKcal}</p>
            </div>
            <p style={{color:C.text,fontSize:16,fontWeight:700,margin:"0 0 4px",lineHeight:1,letterSpacing:-0.3}}>{totalKcal}<span style={{color:C.textMuted,fontSize:11,fontWeight:400}}>/{kcalObj}</span></p>
            <ProgressBar pct={Math.min(100,Math.round((totalKcal/kcalObj)*100))} color={totalKcal>=kcalObj?C.green:C.text} height={4}/>
          </div>
        </div>
      </Card>

      {/* Light contextual recommendation — "what fits now" */}
      {(()=>{
        const recs=nutRecommendations();
        const hide=recs.items.length===0||(totalProt>=pt&&currentMealIdx()===4);
        if(hide) return null;
        return <Card style={{marginBottom:12}}>
          <p style={{color:C.textMuted,fontSize:10,margin:"0 0 7px",textTransform:"uppercase",letterSpacing:1.2}}>Para ahora · {recs.mt}</p>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {recs.items.map(s=>(
              <button key={s.name} onClick={()=>quickAddRec(s)} style={{flex:"1 1 0",minWidth:120,background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"7px 9px",cursor:"pointer",textAlign:"left",lineHeight:1.25}}>
                <span style={{color:C.text,fontSize:11,fontWeight:500,display:"block"}}>{s.name}</span>
                <span style={{color:C.textMuted,fontSize:9}}>{s.kcal} kcal · {s.prot}g</span>
                {s._label&&<span style={{display:"inline-block",marginTop:3,color:C.textSub,fontSize:8,fontWeight:600,letterSpacing:0.3,textTransform:"uppercase",border:`1px solid ${C.border}`,borderRadius:4,padding:"1px 5px"}}>{s._label}</span>}
              </button>
            ))}
          </div>
        </Card>;
      })()}

      {/* Today's planned meals */}
      {todayMeals.length>0&&<Card style={{marginBottom:12}}>
        <p style={{color:C.text,fontSize:13,fontWeight:600,margin:"0 0 8px"}}>Plan de hoy</p>
        {todayMeals.map((meal)=>{
          const id=`${todayDow}_${meal._idx}`;
          const done=consumedIds.has(id);
          const mt=MEAL_TYPES[meal._idx]||meal.t||"";
          const rec=findRecipe(meal.desc);
          const isOpen=expandedMeal===id;
          return <div key={meal._idx} style={{borderTop:`1px solid ${C.border}`}}>
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0"}}>
              <button onClick={()=>consumeMeal(meal)}
                style={{width:20,height:20,borderRadius:6,flexShrink:0,background:done?C.green:C.surface,border:`2px solid ${done?C.green:C.borderLight}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:11,fontWeight:700}}>
                {done?"✓":""}
              </button>
              <div style={{flex:1,minWidth:0}}>
                <p style={{color:done?C.textMuted:C.text,fontSize:12,margin:0,textDecoration:done?"line-through":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{mt}: {meal.desc}</p>
              </div>
              <div style={{display:"flex",gap:6,flexShrink:0,alignItems:"center"}}>
                {meal.prot>0&&<p style={{color:C.textMuted,fontSize:10,margin:0}}>{meal.prot}g</p>}
                {meal.kcal>0&&<p style={{color:C.textMuted,fontSize:10,margin:0}}>{meal.kcal}kcal</p>}
                {rec&&<button onClick={()=>setExpandedMeal(isOpen?null:id)} style={{background:"none",border:"none",cursor:"pointer",padding:"2px 0 2px 4px",color:C.textMuted,fontSize:10,flexShrink:0}}>
                  <span style={{display:"inline-block",transition:"transform 0.15s",transform:isOpen?"rotate(180deg)":"none"}}>▼</span>
                </button>}
              </div>
            </div>
            {isOpen&&rec&&<div style={{display:"flex",flexWrap:"wrap",gap:6,padding:"0 0 9px 28px"}}>
              <button onClick={()=>openRecipeView(rec.name)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:6,color:C.textSub,fontSize:10,fontWeight:500,padding:"3px 10px",cursor:"pointer"}}>Ver receta</button>
              <button onClick={()=>addRecipeToShopping(rec)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:6,color:C.textSub,fontSize:10,fontWeight:500,padding:"3px 10px",cursor:"pointer"}}>Añadir a la compra</button>
            </div>}
          </div>;
        })}
      </Card>}

      {/* Manual entry + log */}
      <Card style={{marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <p style={{color:C.text,fontSize:13,fontWeight:600,margin:0}}>Registro manual</p>
          <div style={{display:"flex",gap:8}}>
            {intakeLog.filter(e=>e.mealId===undefined).length>0&&
              <button onClick={()=>saveIntakeLog(intakeLog.filter(e=>e.mealId!==undefined))} style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:10,padding:0}}>↺</button>}
            <button onClick={()=>setShowManual(s=>!s)}
              style={{background:"none",border:`1px solid ${showManual?C.text:C.border}`,color:showManual?C.text:C.textSub,borderRadius:6,padding:"3px 10px",cursor:"pointer",fontSize:10,fontWeight:500}}>+ Añadir</button>
          </div>
        </div>

        {showManual&&<div style={{background:C.surface,borderRadius:8,padding:"10px",marginBottom:8}}>
          <input value={manualName} onChange={e=>setManualName(e.target.value)} placeholder="Nombre (ej: Pollo + arroz)"
            style={{WebkitAppearance:"none",fontFamily:"inherit",width:"100%",boxSizing:"border-box",background:C.bg,border:`1px solid ${C.border}`,borderRadius:6,color:C.text,padding:"8px 12px",outline:"none",marginBottom:8}}/>
          <div style={{display:"flex",gap:8,marginBottom:8}}>
            <div style={{flex:1}}>
              <p style={{color:C.textMuted,fontSize:11,margin:"0 0 3px"}}>Proteína (g)</p>
              <input value={manualProt} onChange={e=>setManualProt(e.target.value)} type="number" inputMode="numeric" placeholder="0"
                style={{WebkitAppearance:"none",fontFamily:"inherit",width:"100%",boxSizing:"border-box",background:C.bg,border:`1px solid ${C.border}`,borderRadius:6,color:C.text,padding:"6px 8px",outline:"none"}}/>
            </div>
            <div style={{flex:1}}>
              <p style={{color:C.textMuted,fontSize:11,margin:"0 0 3px"}}>Kcal</p>
              <input value={manualKcal} onChange={e=>setManualKcal(e.target.value)} type="number" inputMode="numeric" placeholder="0"
                style={{WebkitAppearance:"none",fontFamily:"inherit",width:"100%",boxSizing:"border-box",background:C.bg,border:`1px solid ${C.border}`,borderRadius:6,color:C.text,padding:"6px 8px",outline:"none"}}/>
            </div>
          </div>
          <div style={{display:"flex",gap:6}}>
            <button onClick={addManual} style={{flex:1,background:C.text,border:"none",borderRadius:8,color:C.bg,padding:"8px",cursor:"pointer",fontSize:12,fontWeight:600}}>Añadir</button>
            <button onClick={()=>{setShowManual(false);setManualName("");setManualProt("");setManualKcal("");}}
              style={{background:"none",border:`1px solid ${C.border}`,borderRadius:6,color:C.textMuted,padding:"8px 12px",cursor:"pointer",fontSize:12}}>✕</button>
          </div>
        </div>}

        {intakeLog.filter(e=>e.mealId===undefined).length===0
          ?<p style={{color:C.textMuted,fontSize:11,margin:0}}>Sin entradas manuales hoy</p>
          :intakeLog.filter(e=>e.mealId===undefined).slice().reverse().map((e,i,arr)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderTop:`1px solid ${C.border}`}}>
              <div style={{flex:1,minWidth:0}}>
                <p style={{color:C.textSub,fontSize:12,margin:0}}>{e.name}</p>
                {e.time&&<p style={{color:C.textMuted,fontSize:10,margin:"1px 0 0"}}>{e.time}</p>}
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
                {e.prot>0&&<p style={{color:nutColor,fontSize:11,fontWeight:700,margin:0}}>+{e.prot}g</p>}
                {e.kcal>0&&<p style={{color:C.textMuted,fontSize:10,margin:0}}>{e.kcal}kcal</p>}
                <button onClick={()=>{const origIdx=intakeLog.length-1-arr.length+arr.length-1-i;const u=intakeLog.filter((_,j)=>j!==intakeLog.lastIndexOf(e));saveIntakeLog(u.filter(x=>x.mealId===undefined||consumedIds.has(String(x.mealId)))||intakeLog.filter((_,j)=>{
                  let cnt=0;for(let k=0;k<intakeLog.length;k++){if(intakeLog[k]===e){cnt++;if(cnt===arr.length-i)return k!==intakeLog.indexOf(e,intakeLog.lastIndexOf(e)-1);}return true;}
                }));const clean=[...intakeLog];clean.splice(intakeLog.length-1-i,1);saveIntakeLog(clean);}}
                  style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:10,padding:0}}>✕</button>
              </div>
            </div>
          ))
        }
      </Card>

      {/* Water */}
      <Card style={{marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:6}}>
          <p style={{color:C.text,fontSize:13,fontWeight:600,margin:0}}>Agua{isWOD?" · WOD":""}</p>
          <p style={{color:watDone?C.green:C.textMuted,fontSize:11,margin:0}}>{hydration}/{wtgt}L{watDone?" ✓":""}</p>
        </div>
        <ProgressBar pct={Math.min(100,Math.round((hydration/wtgt)*100))} color={watDone?C.green:C.text} height={4}/>
        <div style={{display:"flex",gap:4,marginTop:8}}>
          {[0.25,0.5,0.75,1].map(v=><button key={v} onClick={()=>saveHydration(hydration+v)}
            style={{flex:1,background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,padding:"5px 0",cursor:"pointer",fontSize:10,color:C.textSub}}>+{v}L</button>)}
          {hydration>0&&<button onClick={()=>saveHydration(0)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:6,padding:"5px 7px",cursor:"pointer",fontSize:10,color:C.textMuted}}>↺</button>}
        </div>
      </Card>

      {/* Supplements */}
      <Card>
        <p style={{color:C.text,fontSize:13,fontWeight:600,margin:"0 0 8px"}}>Suplementos</p>
        {supplements.map(sup=>(
          <div key={sup.id} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderTop:`1px solid ${C.border}`}}>
            <button onClick={()=>{const nowDone=!supDone[sup.id];saveSupDone({...supDone,[sup.id]:nowDone});const pg=getSupPg(sup);if(pg>0){if(nowDone)saveIntakeLog([...intakeLog,{name:sup.name,prot:pg,kcal:0,time:new Date().toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"}),supId:sup.id}]);else saveIntakeLog(intakeLog.filter(e=>e.supId!==sup.id));}}}
              style={{width:18,height:18,borderRadius:6,flexShrink:0,background:supDone[sup.id]?C.green:C.surface,border:`2px solid ${supDone[sup.id]?C.green:C.borderLight}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:10,fontWeight:700}}>{supDone[sup.id]?"✓":""}</button>
            <p style={{color:supDone[sup.id]?C.textMuted:C.text,fontSize:12,margin:0,flex:1,textDecoration:supDone[sup.id]?"line-through":"none"}}>{sup.name}</p>
            <p style={{color:C.textMuted,fontSize:10,margin:0}}>{sup.dose}</p>
            <button onClick={()=>deleteSup(sup.id)} style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:12,padding:0,lineHeight:1}}>✕</button>
          </div>
        ))}
        {addingSup
          ?<div style={{marginTop:8,width:"100%",boxSizing:"border-box",background:C.surface,borderRadius:8,padding:"10px",border:`1px solid ${C.border}`}}>
             <div style={{display:"flex",gap:6,marginBottom:8}}>
               <input value={newSupName} onChange={e=>setNewSupName(e.target.value)} placeholder="Nombre" style={{WebkitAppearance:"none",fontFamily:"inherit"}} onKeyDown={e=>{if(e.key==="Enter")addSup();}}
                 style={{flex:1,minWidth:0,boxSizing:"border-box",background:C.bg,border:`1px solid ${C.border}`,borderRadius:6,color:C.text,padding:"5px 8px",outline:"none"}}/>
               <input value={newSupDose} onChange={e=>setNewSupDose(e.target.value)} placeholder="Dosis" style={{WebkitAppearance:"none",fontFamily:"inherit"}}
                 style={{flex:"0 0 66px",minWidth:0,boxSizing:"border-box",background:C.bg,border:`1px solid ${C.border}`,borderRadius:6,color:C.text,padding:"5px 8px",outline:"none"}}/>
             </div>
             <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:newSupIsProtein?8:10}}>
               <p style={{color:C.textMuted,fontSize:12,margin:0,flex:1}}>¿Proteína?</p>
               <button onClick={()=>setNewSupIsProtein(v=>!v)}
                 style={{background:newSupIsProtein?C.card:C.bg,border:`1px solid ${newSupIsProtein?C.text:C.border}`,borderRadius:6,color:newSupIsProtein?C.text:C.textMuted,padding:"4px 12px",cursor:"pointer",fontSize:12,fontWeight:500}}>
                 {newSupIsProtein?"Sí":"No"}
               </button>
             </div>
             {newSupIsProtein&&<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
               <p style={{color:C.textMuted,fontSize:12,margin:0,flex:1}}>g por toma</p>
               <input value={newSupProtGrams} onChange={e=>setNewSupProtGrams(e.target.value)} placeholder="25" type="number" inputMode="numeric" style={{WebkitAppearance:"none",fontFamily:"inherit"}}
                 style={{width:60,boxSizing:"border-box",background:C.bg,border:`1px solid ${C.border}`,borderRadius:6,color:C.text,padding:"5px 8px",outline:"none"}}/>
             </div>}
             <div style={{display:"flex",gap:6}}>
               <button onClick={addSup} style={{flex:1,background:C.text,border:"none",borderRadius:8,color:C.bg,padding:"7px",cursor:"pointer",fontSize:12,fontWeight:600}}>Añadir</button>
               <button onClick={()=>{setAddingSup(false);setNewSupName("");setNewSupDose("");setNewSupIsProtein(false);setNewSupProtGrams("");}}
                 style={{background:"none",border:`1px solid ${C.border}`,borderRadius:6,color:C.textMuted,padding:"8px 12px",cursor:"pointer",fontSize:12}}>✕</button>
             </div>
           </div>
          :<button onClick={()=>setAddingSup(true)}
             style={{marginTop:6,background:"none",border:`1px solid ${C.border}`,color:C.textSub,borderRadius:6,padding:"3px 10px",cursor:"pointer",fontSize:10,fontWeight:500}}>+ Añadir suplemento</button>
        }
      </Card>
    </div>}

    {/* ── PLAN — weekly meal planning with prot/kcal per meal ── */}
    {nutTab==="plan"&&<div>
      {/* Saved weekly meal plans */}
      <div style={{display:"flex",gap:6,marginBottom:10,alignItems:"center"}}>
        <p style={{color:C.text,fontSize:13,fontWeight:600,margin:0,flex:1}}>Planificar semana</p>
        <button onClick={()=>setSavingTpl(v=>!v)} style={{background:savingTpl?C.text+"22":C.surface,border:`1px solid ${savingTpl?C.text:C.border}`,borderRadius:8,color:C.textSub,padding:"5px 11px",cursor:"pointer",fontSize:11,fontWeight:500}}>Guardar plan</button>
        {mealTemplates.length>0&&<button onClick={()=>setShowMealTpl(s=>!s)} style={{background:showMealTpl?C.text+"22":C.surface,border:`1px solid ${showMealTpl?C.text:C.border}`,borderRadius:8,color:C.textSub,padding:"5px 11px",cursor:"pointer",fontSize:11,fontWeight:500}}>Guardados ({mealTemplates.length})</button>}
      </div>
      {savingTpl&&<div style={{display:"flex",gap:6,marginBottom:12}}>
        <input value={tplName} onChange={e=>setTplName(e.target.value)} placeholder="Nombre del plan" style={{...recInputStyle,flex:1}}/>
        <button onClick={handleSaveMealTemplate} style={{background:C.text,color:C.bg,border:"none",borderRadius:8,padding:"0 16px",cursor:"pointer",fontSize:12,fontWeight:600,whiteSpace:"nowrap"}}>Guardar</button>
      </div>}
      {showMealTpl&&mealTemplates.length>0&&<div style={{background:C.surface,borderRadius:12,padding:12,marginBottom:14}}>
        <p style={{color:C.text,fontSize:13,fontWeight:600,margin:"0 0 8px"}}>Planes guardados</p>
        {mealTemplates.map(tpl=>(
          <div key={tpl.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,padding:"7px 0",borderBottom:`1px solid ${C.border}`}}>
            <div style={{minWidth:0,flex:1}}>
              <p style={{color:C.text,fontSize:12,fontWeight:500,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{tpl.label}</p>
              <p style={{color:C.textMuted,fontSize:10,margin:0}}>Guardado el {tpl.saved}</p>
            </div>
            <div style={{display:"flex",gap:6,flexShrink:0}}>
              <button onClick={()=>handleApplyMealTemplate(tpl)} style={{background:C.text,color:C.bg,border:"none",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:11,fontWeight:700}}>Cargar</button>
              <button onClick={()=>saveMealTemplates(mealTemplates.filter(t=>t.id!==tpl.id))} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,color:C.textMuted,padding:"5px 10px",cursor:"pointer",fontSize:13}}>✕</button>
            </div>
          </div>
        ))}
      </div>}
      {(lastTrainedToday||(!lastTrainedToday&&loadWeek()[(new Date().getDay()+6)%7]?.assignments?.length>0))&&(
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",marginBottom:10}}>
          <p style={{color:C.textSub,fontSize:11,margin:0}}>
            {lastTrainedToday?"Post: 30-40g prot + 60-80g carbos en 60 min":"Pre: 40-60g carbos + 20g prot 1-2h antes"}
          </p>
        </div>
      )}
      {orderedDays.map((di)=>{
        const isToday=di===todayDow;
        const isExpanded=expandedDays[di]!==undefined?expandedDays[di]:isToday;
        const meals=mealPlan[di]?.meals||[];
        const filledCount=meals.filter(m=>m?.desc?.trim()).length;
        return <div key={di} style={{marginBottom:6}}>
          <button onClick={()=>setExpandedDays(p=>({...p,[di]:!isExpanded}))}
            style={{width:"100%",background:isToday?C.card:C.surface,border:`1px solid ${isToday?C.text+"44":C.border}`,borderRadius:8,padding:"9px 12px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",textAlign:"left"}}>
            <p style={{color:C.text,fontSize:12,fontWeight:isToday?600:400,margin:0}}>{dayNames[di]}{isToday&&<span style={{color:C.text,fontSize:10,fontWeight:700,marginLeft:6}}>HOY</span>}</p>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              {filledCount>0&&<p style={{color:C.textMuted,fontSize:10,margin:0}}>{filledCount}/{MEAL_TYPES.length}</p>}
              <span style={{color:C.textMuted,fontSize:10,display:"inline-block",transform:isExpanded?"rotate(180deg)":"none",transition:"transform 0.15s"}}>▼</span>
            </div>
          </button>
          {isExpanded&&<div style={{background:C.card,border:`1px solid ${C.border}`,borderTopWidth:0,borderRadius:"0 0 8px 8px",padding:"8px 12px"}}>
            {MEAL_TYPES.map((mt,mi)=>{
              const m=(mealPlan[di]?.meals||[])[mi]||{};
              const isEmptyMeal=!m.desc?.trim();
              const mealSugs=rankMealSugs(mt,di,mi);
              return <div key={mi} style={{marginBottom:8}}>
                <p style={{color:C.textMuted,fontSize:10,margin:"0 0 3px",textTransform:"uppercase",letterSpacing:1.2}}>{mt}</p>
                {isEmptyMeal&&mealSugs.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:5}}>
                  {mealSugs.map(s=>(
                    <button key={s.name} onClick={()=>{const upd={...mealPlan};const ms=[...((upd[di]?.meals)||MEAL_TYPES.map(t=>({t,desc:"",prot:"",kcal:""})))];ms[mi]={...ms[mi],desc:s.name,prot:s.prot,kcal:s.kcal};upd[di]={...upd[di],meals:ms};saveMealPlan(upd);}}
                      style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,padding:"4px 8px",cursor:"pointer",textAlign:"left",lineHeight:1.25}}>
                      <span style={{color:C.text,fontSize:11,display:"block"}}>{s.name}</span>
                      <span style={{color:C.textMuted,fontSize:9}}>{s.kcal} kcal · {s.prot}g</span>
                      {s._label&&<span style={{display:"inline-block",marginTop:3,color:C.textSub,fontSize:8,fontWeight:600,letterSpacing:0.3,textTransform:"uppercase",border:`1px solid ${C.border}`,borderRadius:4,padding:"1px 5px"}}>{s._label}</span>}
                    </button>
                  ))}
                </div>}
                <input type="text" value={m.desc||""} onChange={e=>{const upd={...mealPlan};const ms=[...((upd[di]?.meals)||MEAL_TYPES.map(t=>({t,desc:"",prot:"",kcal:""})))];ms[mi]={...ms[mi],desc:e.target.value};upd[di]={...upd[di],meals:ms};saveMealPlan(upd);}}
                  placeholder="Descripción…" style={{WebkitAppearance:"none",fontFamily:"inherit",width:"100%",boxSizing:"border-box",background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,color:C.text,padding:"5px 7px",outline:"none",marginBottom:4}}/>
                <div style={{display:"flex",gap:5}}>
                  <input type="number" inputMode="numeric" value={m.prot||""} onChange={e=>{const upd={...mealPlan};const ms=[...((upd[di]?.meals)||MEAL_TYPES.map(t=>({t,desc:"",prot:"",kcal:""})))];ms[mi]={...ms[mi],prot:e.target.value};upd[di]={...upd[di],meals:ms};saveMealPlan(upd);}}
                    placeholder="Prot g" style={{WebkitAppearance:"none",fontFamily:"inherit",flex:1,minWidth:0,background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,color:C.text,padding:"4px 6px",outline:"none"}}/>
                  <input type="number" inputMode="numeric" value={m.kcal||""} onChange={e=>{const upd={...mealPlan};const ms=[...((upd[di]?.meals)||MEAL_TYPES.map(t=>({t,desc:"",prot:"",kcal:""})))];ms[mi]={...ms[mi],kcal:e.target.value};upd[di]={...upd[di],meals:ms};saveMealPlan(upd);}}
                    placeholder="Kcal" style={{WebkitAppearance:"none",fontFamily:"inherit",flex:1,minWidth:0,background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,color:C.text,padding:"4px 6px",outline:"none"}}/>
                </div>
              </div>;
            })}
          </div>}
        </div>;
      })}
    </div>}

    {/* ── RECETAS ── */}
    {nutTab==="recetas"&&<div>
      <div style={{marginBottom:12}}>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <button onClick={()=>setShowAddRecipe(v=>!v)} style={{background:"none",border:`1px solid ${showAddRecipe?C.text:C.border}`,borderRadius:6,color:C.textSub,fontSize:10,fontWeight:500,padding:"3px 10px",cursor:"pointer"}}>{showAddRecipe?"Cancelar":"+ Añadir receta"}</button>
          {recipeFavs.length>0&&<button onClick={()=>setFavOnly(v=>!v)} style={{background:favOnly?C.text+"22":"none",border:`1px solid ${favOnly?C.text:C.border}`,borderRadius:6,color:favOnly?C.text:C.textSub,fontSize:10,fontWeight:500,padding:"3px 10px",cursor:"pointer"}}>★ Favoritas</button>}
        </div>
        {showAddRecipe&&<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:12,marginTop:8}}>
          <input value={recName} onChange={e=>setRecName(e.target.value)} placeholder="Nombre de la receta" style={recInputStyle}/>
          <div style={{display:"flex",flexWrap:"wrap",gap:4,margin:"8px 0"}}>
            {MEAL_TYPES.map(t=><button key={t} onClick={()=>setRecType(t)} style={{background:recType===t?C.card:C.surface,border:`1px solid ${recType===t?C.text:C.border}`,borderRadius:6,color:recType===t?C.text:C.textSub,fontSize:10,padding:"4px 9px",cursor:"pointer"}}>{t}</button>)}
          </div>
          <input value={recIng} onChange={e=>setRecIng(e.target.value)} placeholder="Ingredientes (separados por comas)" style={recInputStyle}/>
          <div style={{display:"flex",gap:5,margin:"8px 0"}}>
            <input type="number" inputMode="numeric" value={recKcal} onChange={e=>setRecKcal(e.target.value)} placeholder="Kcal" style={{...recInputStyle,flex:1,minWidth:0,width:"auto"}}/>
            <input type="number" inputMode="numeric" value={recProt} onChange={e=>setRecProt(e.target.value)} placeholder="Prot g" style={{...recInputStyle,flex:1,minWidth:0,width:"auto"}}/>
          </div>
          <textarea value={recNotes} onChange={e=>setRecNotes(e.target.value)} placeholder="Preparación / notas (opcional)" style={{...recInputStyle,minHeight:50,resize:"vertical",fontSize:12}}/>
          <button onClick={addManualRecipe} style={{background:C.text,color:C.bg,border:"none",borderRadius:8,fontSize:12,fontWeight:600,padding:"9px 14px",cursor:"pointer",marginTop:8,width:"100%"}}>Guardar receta</button>
        </div>}
      </div>
      {recipesToShow.length===0&&<p style={{color:C.textMuted,fontSize:11,textAlign:"center",padding:"16px 0"}}>No hay recetas favoritas todavía.</p>}
      {recipesToShow.map(r=>{
        const isOpen=openRecipeName===r.name;
        const fav=recipeFavs.includes(r.id);
        return <div key={r.id} style={{marginBottom:6}}>
          <div style={{display:"flex",alignItems:"stretch",gap:6}}>
            <button onClick={()=>setOpenRecipeName(isOpen?null:r.name)} style={{flex:1,minWidth:0,background:isOpen?C.card:C.surface,border:`1px solid ${isOpen?C.text:C.border}`,borderRadius:8,padding:"9px 12px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{textAlign:"left",minWidth:0}}>
                <p style={{color:C.text,fontSize:12,fontWeight:500,margin:"0 0 2px"}}>{r.name} <span style={{fontSize:8,color:C.textMuted,border:`1px solid ${C.border}`,borderRadius:4,padding:"1px 4px",marginLeft:2,textTransform:"uppercase",letterSpacing:0.3,verticalAlign:"middle",whiteSpace:"nowrap"}}>{r.seed?"Sugerida":"Propia"}</span></p>
                <p style={{color:C.textMuted,fontSize:10,margin:0}}>{r.type} · {r.kcal} kcal · {r.prot}g prot</p>
              </div>
              <span style={{color:C.textMuted,fontSize:10,marginLeft:8,flexShrink:0,display:"inline-block",transition:"transform 0.15s",transform:isOpen?"rotate(180deg)":"none"}}>▼</span>
            </button>
            <button onClick={()=>toggleRecipeFav(r.id)} style={{background:"none",border:`1px solid ${fav?C.text:C.border}`,borderRadius:8,padding:"0 12px",cursor:"pointer",color:fav?C.text:C.textMuted,fontSize:14,flexShrink:0}}>{fav?"★":"☆"}</button>
          </div>
          {isOpen&&<div style={{background:C.card,border:`1px solid ${C.border}`,borderTopWidth:0,borderRadius:"0 0 8px 8px",padding:"10px 12px"}}>
            {r.ing&&r.ing.length>0&&<>
              <p style={{color:C.textMuted,fontSize:10,margin:"0 0 4px",textTransform:"uppercase",letterSpacing:1.2}}>Ingredientes</p>
              <p style={{color:C.text,fontSize:12,margin:"0 0 10px",lineHeight:1.5}}>{r.ing.map(i=>i.name).join(" · ")}</p>
            </>}
            {r.notes&&<>
              <p style={{color:C.textMuted,fontSize:10,margin:"0 0 4px",textTransform:"uppercase",letterSpacing:1.2}}>Preparación</p>
              <p style={{color:C.textSub,fontSize:12,margin:"0 0 10px",lineHeight:1.5}}>{r.notes}</p>
            </>}
            <div style={{display:"flex",gap:6}}>
              <button onClick={()=>addRecipeToShopping(r)} style={{flex:1,background:"none",border:`1px solid ${C.border}`,borderRadius:6,color:C.textSub,fontSize:11,fontWeight:500,padding:"6px 10px",cursor:"pointer"}}>Añadir a la compra</button>
              {!r.seed&&<button onClick={()=>{saveRecipes(recipes.filter(x=>x.id!==r.id));if(openRecipeName===r.name)setOpenRecipeName(null);}} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:6,color:C.textMuted,fontSize:13,padding:"0 12px",cursor:"pointer"}}>✕</button>}
            </div>
          </div>}
        </div>;
      })}
    </div>}

    {/* ── COMPRA ── */}
    {nutTab==="compra"&&<div>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <p style={{color:C.textSub,fontSize:11,margin:0}}>Refleja tu plan semanal</p>
        <SugerirItemsBtn mealPlan={mealPlan} shopping={shopping} saveShopping={saveShopping}/>
      </div>
      {/* Saved shopping lists */}
      <div style={{display:"flex",gap:6,marginBottom:10,alignItems:"center"}}>
        <button onClick={()=>setSavingShop(v=>!v)} style={{flex:1,background:savingShop?C.text+"22":C.surface,border:`1px solid ${savingShop?C.text:C.border}`,borderRadius:8,color:C.textSub,padding:"6px 11px",cursor:"pointer",fontSize:11,fontWeight:500}}>Guardar lista</button>
        {shopLists.length>0&&<button onClick={()=>setShowShopLists(s=>!s)} style={{flex:1,background:showShopLists?C.text+"22":C.surface,border:`1px solid ${showShopLists?C.text:C.border}`,borderRadius:8,color:C.textSub,padding:"6px 11px",cursor:"pointer",fontSize:11,fontWeight:500}}>Guardadas ({shopLists.length})</button>}
      </div>
      {savingShop&&<div style={{display:"flex",gap:6,marginBottom:10}}>
        <input value={shopListName} onChange={e=>setShopListName(e.target.value)} placeholder="Nombre de la lista" style={{...recInputStyle,flex:1}}/>
        <button onClick={handleSaveShopList} style={{background:C.text,color:C.bg,border:"none",borderRadius:8,padding:"0 16px",cursor:"pointer",fontSize:12,fontWeight:600,whiteSpace:"nowrap"}}>Guardar</button>
      </div>}
      {showShopLists&&shopLists.length>0&&<div style={{background:C.surface,borderRadius:12,padding:12,marginBottom:12}}>
        <p style={{color:C.text,fontSize:13,fontWeight:600,margin:"0 0 8px"}}>Listas guardadas</p>
        {shopLists.map(lst=>(
          <div key={lst.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,padding:"7px 0",borderBottom:`1px solid ${C.border}`}}>
            <div style={{minWidth:0,flex:1}}>
              <p style={{color:C.text,fontSize:12,fontWeight:500,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{lst.label}</p>
              <p style={{color:C.textMuted,fontSize:10,margin:0}}>{lst.items.length} items · {lst.saved}</p>
            </div>
            <div style={{display:"flex",gap:6,flexShrink:0}}>
              <button onClick={()=>handleLoadShopList(lst)} style={{background:C.text,color:C.bg,border:"none",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:11,fontWeight:700}}>Cargar</button>
              <button onClick={()=>saveShopLists(shopLists.filter(x=>x.id!==lst.id))} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,color:C.textMuted,padding:"5px 10px",cursor:"pointer",fontSize:13}}>✕</button>
            </div>
          </div>
        ))}
      </div>}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
        <p style={{color:C.textMuted,fontSize:11,margin:0}}>{shopping.filter(s=>s.done).length}/{shopping.length} comprados</p>
        <div style={{display:"flex",gap:6}}>
          <button onClick={()=>saveShopping(shopping.map(s=>({...s,done:false})))} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:6,color:C.textSub,padding:"6px 12px",cursor:"pointer",fontSize:10}}>Resetear</button>
          <button onClick={()=>saveShopping([])} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:6,color:C.textMuted,padding:"6px 12px",cursor:"pointer",fontSize:10}}>Limpiar</button>
        </div>
      </div>
      <ProgressBar pct={Math.round((shopping.filter(s=>s.done).length/Math.max(1,shopping.length))*100)} color={C.green} height={3}/>
      <div style={{marginTop:10,marginBottom:4}}><ShoppingAddForm onAdd={item=>saveShopping([...shopping,item])} color={nutColor}/></div>
      <div style={{marginTop:12}}>
        {CAT_ORDER.map(cat=>{
          const items=shopping.filter(s=>s.cat===cat);
          if(!items.length) return null;
          const allDone=items.every(s=>s.done);
          return <div key={cat} style={{marginBottom:12}}>
            <p style={{color:allDone?C.textMuted:C.textSub,fontSize:10,fontWeight:700,margin:"0 0 5px",textDecoration:allDone?"line-through":"none"}}>{CAT_LABELS[cat]||cat}</p>
            {items.map(item=>(
              <div key={item.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:`1px solid ${C.border}`}}>
                <button onClick={()=>saveShopping(shopping.map(s=>s.id===item.id?{...s,done:!s.done}:s))}
                  style={{width:20,height:20,borderRadius:6,background:item.done?C.green:C.surface,border:`2px solid ${item.done?C.green:C.borderLight}`,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:11,fontWeight:700}}>{item.done?"✓":""}</button>
                <input value={item.name} onChange={e=>saveShopping(shopping.map(s=>s.id===item.id?{...s,name:e.target.value}:s))}
                  style={{flex:1,background:"transparent",border:"none",color:item.done?C.textMuted:C.text,padding:0,outline:"none",textDecoration:item.done?"line-through":"none",fontFamily:"inherit",WebkitAppearance:"none"}}/>
                <button onClick={()=>saveShopping(shopping.filter(s=>s.id!==item.id))} style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:11,opacity:0.5}}>✕</button>
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
    catch(e){ pushToast({type:"error",text:"JSON inválido — revisa que el texto esté bien formado."}); return; }

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
      <button onClick={onClose} style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:14,padding:0}}>✕</button>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      <Btn onClick={handleExport} color={C.text} style={{width:"100%",justifyContent:"center"}}>Exportar datos</Btn>
      <Btn onClick={()=>setMode(mode==="file"?null:"file")} color={C.text} style={{width:"100%",justifyContent:"center"}}>Importar archivo JSON</Btn>
      {mode==="file"&&<input ref={fileRef} type="file" accept=".json" onChange={handleFileImport} style={{color:C.text,padding:"6px 0"}}/>}
      <Btn onClick={()=>setMode(mode==="paste"?null:"paste")} color={C.purple} style={{width:"100%",justifyContent:"center"}}>Pegar JSON</Btn>
      {mode==="paste"&&<>
        <textarea value={jsonText} onChange={e=>setJsonText(e.target.value)} placeholder='Pega tu JSON aquí...' rows={5}
          style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,color:C.text,padding:10,fontFamily:"monospace",resize:"vertical",width:"100%",boxSizing:"border-box"}}/>
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
  const scrollRef=useRef(null);

  const sysDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const [isDark,setIsDark]=useState(()=>{
    const stored=localStorage.getItem("pg_theme");
    return stored!==null ? stored==="dark" : sysDark;
  });

  // Lock body scroll + prevent overscroll bounce
  useEffect(()=>{
    // Prevent body/html scrolling — the app uses its own scroll container
    const prev=[document.body.style.overflow,document.body.style.position,
                document.documentElement.style.overflow];
    document.body.style.overflow="hidden";
    document.body.style.position="fixed";
    document.body.style.width="100%";
    document.documentElement.style.overflow="hidden";

    // Lock scroll and prevent overscroll bounce
    const s=document.createElement("style");
    s.textContent="html,body{overflow:hidden;overscroll-behavior:none;height:100%;position:fixed;width:100%;}*{-webkit-overflow-scrolling:touch;}input,textarea,select{font-size:13px;}";
    document.head.appendChild(s);

    let vp=document.querySelector("meta[name='viewport']");
    if(!vp){vp=document.createElement("meta");vp.name="viewport";document.head.appendChild(vp);}
    vp.content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover";

    return()=>{
      document.body.style.overflow=prev[0];
      document.body.style.position=prev[1];
      document.body.style.width="";
      document.documentElement.style.overflow=prev[2];
      document.head.removeChild(s);
    };
  },[]);

  useEffect(()=>{
    const mq=window.matchMedia("(prefers-color-scheme: dark)");
    const handler=(e)=>{if(localStorage.getItem("pg_theme")===null) setIsDark(e.matches);};
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

  const navItems=[
    {id:"hoy",    label:"Hoy"},
    {id:"entreno",label:"Entreno"},
    {id:"nutricion",label:"Nutrición"},
    {id:"progreso",label:"Progreso"},
  ];

  const titles={hoy:"Hoy",entreno:"Entrenamiento",progreso:"Progreso",nutricion:"Nutrición"};

  function goTo(id){
    setScreen(id);
    if(scrollRef.current) scrollRef.current.scrollTop=0;
  }

  // Full-screen fixed container — prevents body scroll and overscroll bounce
  return <div style={{
    position:"fixed",top:0,right:0,bottom:0,left:0,
    display:"flex",flexDirection:"column",
    background:C.bg,color:C.text,
    fontFamily:"-apple-system,'SF Pro Text','SF Pro Display',sans-serif",
    transition:"background 0.25s,color 0.25s",
    touchAction:"pan-x pan-y",
    overflow:"hidden",
  }}>
    <ToastContainer/>

    {/* Header — fixed flex child, never scrolls */}
    <div style={{
      flexShrink:0,
      background:C.bg,
      borderBottom:`1px solid ${C.border}`,
      padding:"13px 20px 11px",
      paddingTop:"max(13px,env(safe-area-inset-top,13px))",
      zIndex:20,
    }}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",maxWidth:500,margin:"0 auto"}}>
        <h1 style={{fontSize:16,fontWeight:500,margin:0,letterSpacing:-0.2,color:C.text}}>{titles[screen]}</h1>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <button onClick={()=>setIsDark(d=>{const next=!d;localStorage.setItem("pg_theme",next?"dark":"light");return next;})}
            style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,color:C.textSub,padding:"6px 9px",cursor:"pointer",fontSize:14,lineHeight:1,display:"flex",alignItems:"center"}}>
            {isDark?"☀️":"🌙"}
          </button>
          <button onClick={()=>setShowBackup(b=>!b)}
            style={{background:showBackup?C.surface:"none",border:`1px solid ${showBackup?C.border:"transparent"}`,borderRadius:8,color:showBackup?C.text:C.textSub,padding:"6px 9px",cursor:"pointer",fontSize:14,lineHeight:1,display:"flex",alignItems:"center"}}>⚙️</button>
        </div>
      </div>
      {showBackup&&<BackupPanel onClose={()=>setShowBackup(false)}/>}
    </div>

    {/* Scroll container — only this area scrolls */}
    <div ref={scrollRef} style={{
      flex:1,
      overflowY:"auto",
      overflowX:"hidden",
      WebkitOverflowScrolling:"touch",
      overscrollBehavior:"none",
      background:C.bg,
    }}>
      <div style={{padding:"8px 8px 0",maxWidth:500,margin:"0 auto",paddingBottom:"max(24px,env(safe-area-inset-bottom,24px))"}}>
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
    </div>

    {/* Bottom nav — fixed flex child, always visible */}
    <div style={{
      flexShrink:0,
      background:C.bg,
      borderTop:`1px solid ${C.border}`,
      display:"flex",
      padding:`8px 4px`,
      paddingBottom:"max(12px,env(safe-area-inset-bottom,12px))",
      zIndex:100,
    }}>
      {navItems.map(t=>{
        const isActive=screen===t.id;
        return <button key={t.id} onClick={()=>goTo(t.id)}
          style={{flex:1,background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",padding:"4px 0"}}>
          <span style={{fontSize:11,color:isActive?C.text:C.textMuted,fontWeight:isActive?600:400,transition:"color 0.15s"}}>{t.label}</span>
          <div style={{width:4,height:4,borderRadius:"50%",background:isActive?C.text:"transparent",marginTop:3,transition:"background 0.2s"}}/>
        </button>;
      })}
    </div>
  </div>;
}


export default function App(){ return <ErrorBoundary><AppInner/></ErrorBoundary>; }
