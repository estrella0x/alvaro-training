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
          <p style={{fontSize:11,color:"#6b6b84",marginTop:12}}>Si el error persiste, exporta tus datos desde Ajustes antes de recargar.</p>
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
  nutProfile:"pg_nup", mealPlan:"pg_mp", shopping:"pg_sh", proteinLog:"pg_pl", recipes:"pg_recipes", weeklyReview:"pg_wrev", weeklyProposal:"pg_wprop", weeklyProposalBackup:"pg_wprop_bak", nutGoal:"pg_nutgoal", trainingTemplate:"pg_tpl", trainingTemplateBackup:"pg_tpl_bak", onboarded:"pg_onboarded",
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
  A:{nombre:"Día A", color:"#8e8e93", ejercicios:[
    {id:"a1",nombre:"Sentadilla",           grupo:"Pierna",  series:4,reps:"6-8",  descanso:120},
    {id:"a2",nombre:"Press banca",          grupo:"Pecho",   series:4,reps:"6-8",  descanso:120},
    {id:"a3",nombre:"Remo con barra",       grupo:"Espalda", series:4,reps:"8-10", descanso:90},
    {id:"a4",nombre:"Curl de bíceps",       grupo:"Bíceps",  series:3,reps:"10-12",descanso:60},
  ]},
  B:{nombre:"Día B", color:"#8e8e93", ejercicios:[
    {id:"b1",nombre:"Peso muerto",          grupo:"Espalda", series:4,reps:"4-6",  descanso:150},
    {id:"b2",nombre:"Press militar",        grupo:"Hombros", series:4,reps:"6-8",  descanso:120},
    {id:"b3",nombre:"Dominadas",            grupo:"Espalda", series:4,reps:"6-10", descanso:90},
    {id:"b4",nombre:"Extensión de tríceps", grupo:"Tríceps", series:3,reps:"10-12",descanso:60},
  ]},
  C:{nombre:"Día C", color:"#8e8e93", ejercicios:[
    {id:"c1",nombre:"Prensa de pierna",     grupo:"Pierna",  series:4,reps:"10-12",descanso:90},
    {id:"c2",nombre:"Press inclinado",      grupo:"Pecho",   series:4,reps:"8-10", descanso:90},
    {id:"c3",nombre:"Jalón al pecho",       grupo:"Espalda", series:4,reps:"10-12",descanso:75},
    {id:"c4",nombre:"Elevaciones laterales",grupo:"Hombros", series:3,reps:"12-15",descanso:45},
  ]},
};

const DEFAULT_WEEK = [
  {dayIndex:0,assignments:[{tabId:"gym",planoKey:"A"}]},
  {dayIndex:1,assignments:[]},
  {dayIndex:2,assignments:[{tabId:"gym",planoKey:"B"}]},
  {dayIndex:3,assignments:[]},
  {dayIndex:4,assignments:[{tabId:"gym",planoKey:"C"}]},
  {dayIndex:5,assignments:[]},
  {dayIndex:6,assignments:[]},
];

  // ── V5: plantilla de entrenamiento por defecto (genérica). Solo instalación nueva. ──
  // Lo guardado (planWeek / gymPlanos) SIEMPRE prevalece vía load()||template.
  // Los wrappers devuelven COPIAS para no mutar la seed compartida.
  const DEFAULT_TRAINING_TEMPLATE_ID = "generic_3day";

  // ── V5: registro de plantillas de entrenamiento (capa de datos, sin UI grande). ──
  // generic_3day reutiliza las seeds actuales (DEFAULT_WEEK / PLANOS_SEED) → sin cambios.
  // Lo guardado (planWeek / gymPlanos) SIEMPRE prevalece; el template solo afecta al fallback.
  const TRAINING_TEMPLATES = {
    generic_3day: { label:"Genérica 3 días", defaultWeek:DEFAULT_WEEK, defaultPlanos:PLANOS_SEED },
    full_body_3day: {
      label:"Full body 3 días",
      defaultWeek:[
        {dayIndex:0,assignments:[{tabId:"gym",planoKey:"A"}]},
        {dayIndex:1,assignments:[]},
        {dayIndex:2,assignments:[{tabId:"gym",planoKey:"B"}]},
        {dayIndex:3,assignments:[]},
        {dayIndex:4,assignments:[{tabId:"gym",planoKey:"C"}]},
        {dayIndex:5,assignments:[]},
        {dayIndex:6,assignments:[]},
      ],
      defaultPlanos:{
        A:{nombre:"Full body A",color:"#8e8e93",ejercicios:[
          {id:"fa1",nombre:"Sentadilla",     grupo:"Pierna", series:3,reps:"5-8", descanso:120},
          {id:"fa2",nombre:"Press banca",    grupo:"Pecho",  series:3,reps:"5-8", descanso:120},
          {id:"fa3",nombre:"Remo con barra", grupo:"Espalda",series:3,reps:"8-10",descanso:90},
          {id:"fa4",nombre:"Press militar",  grupo:"Hombros",series:3,reps:"8-10",descanso:90},
        ]},
        B:{nombre:"Full body B",color:"#8e8e93",ejercicios:[
          {id:"fb1",nombre:"Peso muerto",     grupo:"Espalda",series:3,reps:"4-6", descanso:150},
          {id:"fb2",nombre:"Press inclinado", grupo:"Pecho",  series:3,reps:"8-10",descanso:90},
          {id:"fb3",nombre:"Dominadas",       grupo:"Espalda",series:3,reps:"6-10",descanso:90},
          {id:"fb4",nombre:"Zancadas",        grupo:"Pierna", series:3,reps:"10-12",descanso:75},
        ]},
        C:{nombre:"Full body C",color:"#8e8e93",ejercicios:[
          {id:"fc1",nombre:"Prensa de pierna",grupo:"Pierna", series:3,reps:"10-12",descanso:90},
          {id:"fc2",nombre:"Fondos",          grupo:"Pecho",  series:3,reps:"8-12", descanso:75},
          {id:"fc3",nombre:"Jalón al pecho",  grupo:"Espalda",series:3,reps:"10-12",descanso:75},
          {id:"fc4",nombre:"Curl de bíceps",  grupo:"Bíceps", series:3,reps:"10-12",descanso:60},
        ]},
      },
    },
    upper_lower_4day: {
      label:"Torso/Pierna 4 días",
      defaultWeek:[
        {dayIndex:0,assignments:[{tabId:"gym",planoKey:"A"}]},
        {dayIndex:1,assignments:[{tabId:"gym",planoKey:"B"}]},
        {dayIndex:2,assignments:[]},
        {dayIndex:3,assignments:[{tabId:"gym",planoKey:"C"}]},
        {dayIndex:4,assignments:[{tabId:"gym",planoKey:"D"}]},
        {dayIndex:5,assignments:[]},
        {dayIndex:6,assignments:[]},
      ],
      defaultPlanos:{
        A:{nombre:"Torso A",color:"#8e8e93",ejercicios:[
          {id:"ua1",nombre:"Press banca",         grupo:"Pecho",  series:4,reps:"6-8", descanso:120},
          {id:"ua2",nombre:"Remo con barra",      grupo:"Espalda",series:4,reps:"6-8", descanso:120},
          {id:"ua3",nombre:"Press militar",       grupo:"Hombros",series:3,reps:"8-10",descanso:90},
          {id:"ua4",nombre:"Dominadas",           grupo:"Espalda",series:3,reps:"6-10",descanso:90},
        ]},
        B:{nombre:"Pierna A",color:"#8e8e93",ejercicios:[
          {id:"la1",nombre:"Sentadilla",          grupo:"Pierna", series:4,reps:"6-8", descanso:150},
          {id:"la2",nombre:"Peso muerto rumano",  grupo:"Femoral",series:3,reps:"8-10",descanso:120},
          {id:"la3",nombre:"Prensa de pierna",    grupo:"Pierna", series:3,reps:"10-12",descanso:90},
          {id:"la4",nombre:"Gemelos de pie",      grupo:"Gemelos",series:3,reps:"12-15",descanso:45},
        ]},
        C:{nombre:"Torso B",color:"#8e8e93",ejercicios:[
          {id:"ub1",nombre:"Press inclinado",     grupo:"Pecho",  series:4,reps:"8-10",descanso:90},
          {id:"ub2",nombre:"Jalón al pecho",      grupo:"Espalda",series:4,reps:"8-10",descanso:90},
          {id:"ub3",nombre:"Elevaciones laterales",grupo:"Hombros",series:3,reps:"12-15",descanso:45},
          {id:"ub4",nombre:"Curl de bíceps",      grupo:"Bíceps", series:3,reps:"10-12",descanso:60},
        ]},
        D:{nombre:"Pierna B",color:"#8e8e93",ejercicios:[
          {id:"lb1",nombre:"Peso muerto",         grupo:"Espalda",series:4,reps:"4-6", descanso:150},
          {id:"lb2",nombre:"Zancadas",            grupo:"Pierna", series:3,reps:"10-12",descanso:75},
          {id:"lb3",nombre:"Curl femoral",        grupo:"Femoral",series:3,reps:"12-10-10",descanso:60},
          {id:"lb4",nombre:"Extensión de tríceps",grupo:"Tríceps",series:3,reps:"10-12",descanso:60},
        ]},
      },
    },
  };
  function getSelectedTrainingTemplateId(){ const s=load(K.trainingTemplate); return (s && TRAINING_TEMPLATES[s]) ? s : DEFAULT_TRAINING_TEMPLATE_ID; }
  function getTrainingTemplates(){ return Object.keys(TRAINING_TEMPLATES).map(id=>({ id, label:TRAINING_TEMPLATES[id].label })); }
  function getTrainingTemplateById(id){ return TRAINING_TEMPLATES[id] || TRAINING_TEMPLATES[DEFAULT_TRAINING_TEMPLATE_ID]; }
  function getTrainingTemplateLabel(id){ return (TRAINING_TEMPLATES[id] || TRAINING_TEMPLATES[DEFAULT_TRAINING_TEMPLATE_ID]).label; }
  // Aplica una plantilla ESCRIBIENDO planWeek y gymPlanos (acción explícita del usuario).
  // Fallback seguro a generic_3day si el id no es válido. Devuelve los datos aplicados.
  function applyTrainingTemplateById(id){
    const tplId=(id && TRAINING_TEMPLATES[id]) ? id : DEFAULT_TRAINING_TEMPLATE_ID;
    const tpl=getTrainingTemplateById(tplId);
    const week=JSON.parse(JSON.stringify(tpl.defaultWeek));
    const planos=JSON.parse(JSON.stringify(tpl.defaultPlanos));
    // Snapshot reversible (una sola "última aplicación"): estado actual exacto antes de escribir.
    save(K.trainingTemplateBackup, { savedAt:new Date().toISOString(), planWeek: load(K.planWeek), gymPlanos: load(K.gymPlanos) });
    save(K.planWeek, week);
    save(K.gymPlanos, planos);
    return { ok:true, id:tplId, label:tpl.label, week, planos };
  }
  // Revierte la última aplicación de plantilla (de un solo uso). Restaura el estado exacto.
  function revertLastTrainingTemplateApply(){
    const backup=load(K.trainingTemplateBackup);
    if(!backup || typeof backup!=="object") return { ok:false, reason:"no_backup" };
    save(K.planWeek, backup.planWeek);   // puede ser null (= usar plantilla por defecto), se restaura fiel
    save(K.gymPlanos, backup.gymPlanos);
    try{ localStorage.removeItem(K.trainingTemplateBackup); }catch(e){ save(K.trainingTemplateBackup, null); } // invalida → undo único
    return { ok:true, restored:true };
  }
  // Wrappers de fallback (saved-first se mantiene en loadWeek/loadGymPlanos). Devuelven COPIAS.
  function getDefaultWeekTemplate(){ return JSON.parse(JSON.stringify(getTrainingTemplateById(getSelectedTrainingTemplateId()).defaultWeek)); }
  function getDefaultPlanos(){ return JSON.parse(JSON.stringify(getTrainingTemplateById(getSelectedTrainingTemplateId()).defaultPlanos)); }
const DEFAULT_OBJECTIVES = [
  {id:"o1",name:"Peso corporal",current:"",target:"",unit:"kg"},
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
// ── SERIES MODEL (retrocompatible): números antiguos → {kg,reps,type} ──
function normSets(arr){ return safeArr(arr).map(s=>{ if(s&&typeof s==="object"){ const kg=safeNum(s.kg,0); const r=parseInt(s.reps); return {kg,reps:isNaN(r)?null:r,type:s.type||"normal"}; } const kg=parseFloat(s); return {kg:isNaN(kg)?0:kg,reps:null,type:"normal"}; }).filter(s=>s.kg>0); }
function setWeights(arr){ return normSets(arr).map(s=>s.kg); }
function fmtSet(s){ return s.reps!=null?`${s.kg}×${s.reps}`:`${s.kg}`; }
const SET_TYPES=["normal","warmup","drop","failure"];
function nextSetType(t){ const i=SET_TYPES.indexOf(t); return SET_TYPES[((i<0?0:i)+1)%SET_TYPES.length]; }
function pkg(v){ return parseFloat(String(v==null?"":v).replace(/,/g,".")); } // parse peso con coma o punto
function roundKg(n){ return Math.round(((Number(n)||0)/2.5))*2.5; } // redondeo a múltiplos de 2.5
const WU_SCHEME=[{pct:0.4,reps:8},{pct:0.6,reps:5},{pct:0.8,reps:3}]; // warm-up calculator: % del peso objetivo × reps (editable)
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
function loadGymPlanos(){return load(K.gymPlanos)||getDefaultPlanos();}
function loadWeek(){return load(K.planWeek)||getDefaultWeekTemplate();}
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
const SHOPPING_SEED = [];

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
  {name:"Avena, plátano y whey",        type:"Desayuno",     kcal:450, prot:35, ing:[{name:"Avena",cat:"carbos",qty:"60 g"},{name:"Plátano",cat:"frutas",qty:"1 ud"},{name:"Proteína whey",cat:"proteina",qty:"30 g"},{name:"Leche",cat:"lacteos",qty:"200 ml"}], steps:["Cuece la avena con la leche 3-4 min removiendo.","Añade el plátano en rodajas.","Retira del fuego y mezcla el cacito de whey."]},
  {name:"Tortilla de claras + tostadas", type:"Desayuno",     kcal:380, prot:30, ing:[{name:"Claras de huevo",cat:"proteina",qty:"200 g"},{name:"Pan integral",cat:"carbos",qty:"60 g"},{name:"Aceite de oliva",cat:"condimentos",qty:"5 ml"}], steps:["Cuaja las claras a fuego medio con unas gotas de aceite.","Tuesta el pan.","Sirve la tortilla sobre las tostadas."]},
  {name:"Yogur griego, granola y miel",  type:"Desayuno",     kcal:400, prot:25, ing:[{name:"Yogur griego",cat:"lacteos",qty:"200 g"},{name:"Granola",cat:"carbos",qty:"40 g"},{name:"Miel",cat:"condimentos",qty:"15 g"}], steps:["Pon el yogur en un bol.","Añade la granola.","Termina con un hilo de miel."]},
  {name:"Tostadas de aguacate y huevo",  type:"Desayuno",     kcal:420, prot:22, ing:[{name:"Pan integral",cat:"carbos",qty:"60 g"},{name:"Aguacate",cat:"verduras",qty:"1/2 ud"},{name:"Huevos",cat:"proteina",qty:"2 ud"}], steps:["Tuesta el pan y machaca el aguacate encima.","Haz los huevos a la plancha.","Coloca el huevo sobre la tostada y salpimienta."]},
  {name:"Tortitas de avena y plátano",   type:"Desayuno",     kcal:430, prot:28, ing:[{name:"Avena",cat:"carbos",qty:"60 g"},{name:"Huevos",cat:"proteina",qty:"2 ud"},{name:"Plátano",cat:"frutas",qty:"1 ud"}], steps:["Tritura avena, huevos y plátano.","Haz tortitas en sartén antiadherente 1-2 min por lado."]},
  {name:"Batido de proteína con avena",  type:"Media mañana", kcal:300, prot:30, ing:[{name:"Proteína whey",cat:"proteina",qty:"30 g"},{name:"Avena",cat:"carbos",qty:"40 g"},{name:"Leche",cat:"lacteos",qty:"250 ml"}], steps:["Echa todo en la batidora.","Bate 30 s hasta que quede homogéneo."]},
  {name:"Yogur griego y frutos rojos",   type:"Media mañana", kcal:180, prot:18, ing:[{name:"Yogur griego",cat:"lacteos",qty:"200 g"},{name:"Frutos rojos",cat:"frutas",qty:"80 g"}], steps:["Mezcla el yogur con los frutos rojos."]},
  {name:"Sándwich de pavo",              type:"Media mañana", kcal:320, prot:25, ing:[{name:"Pan integral",cat:"carbos",qty:"80 g"},{name:"Pavo",cat:"proteina",qty:"80 g"},{name:"Lechuga",cat:"verduras",qty:"20 g"},{name:"Tomate",cat:"verduras",qty:"1/2 ud"}], steps:["Monta el sándwich con pavo, lechuga y tomate.","Opcional: tuesta el pan."]},
  {name:"Tostada de pavo y queso",       type:"Media mañana", kcal:290, prot:22, ing:[{name:"Pan integral",cat:"carbos",qty:"60 g"},{name:"Pavo",cat:"proteina",qty:"60 g"},{name:"Queso fresco",cat:"lacteos",qty:"40 g"}], steps:["Monta la tostada con pavo y queso.","Tuesta 2 min si quieres."]},
  {name:"Plátano y nueces",              type:"Media mañana", kcal:280, prot:8,  ing:[{name:"Plátano",cat:"frutas",qty:"1 ud"},{name:"Nueces",cat:"otros",qty:"30 g"}], steps:["Toma el plátano con un puñado de nueces."]},
  {name:"Arroz, pollo y verduras",       type:"Comida",       kcal:600, prot:45, ing:[{name:"Arroz",cat:"carbos",qty:"80 g en crudo"},{name:"Pollo",cat:"proteina",qty:"150 g"},{name:"Verduras",cat:"verduras",qty:"150 g"},{name:"Aceite de oliva",cat:"condimentos",qty:"10 ml"}], steps:["Cuece el arroz.","Saltea el pollo troceado con un poco de aceite.","Añade las verduras y saltea 4-5 min.","Sirve sobre el arroz."]},
  {name:"Pasta con atún y tomate",       type:"Comida",       kcal:580, prot:38, ing:[{name:"Pasta",cat:"carbos",qty:"80 g en crudo"},{name:"Atún",cat:"proteina",qty:"120 g"},{name:"Tomate triturado",cat:"verduras",qty:"100 g"}], steps:["Cuece la pasta al dente.","Calienta el tomate y mezcla el atún escurrido.","Junta con la pasta."]},
  {name:"Salmón, patata y ensalada",     type:"Comida",       kcal:620, prot:40, ing:[{name:"Salmón",cat:"proteina",qty:"150 g"},{name:"Patata",cat:"carbos",qty:"200 g"},{name:"Ensalada",cat:"verduras",qty:"100 g"},{name:"Aceite de oliva",cat:"condimentos",qty:"10 ml"}], steps:["Hornea el salmón y la patata 18-20 min a 200°C.","Aliña la ensalada.","Sirve todo junto."]},
  {name:"Lentejas con arroz",            type:"Comida",       kcal:520, prot:24, ing:[{name:"Lentejas",cat:"legumbres",qty:"100 g en crudo"},{name:"Arroz",cat:"carbos",qty:"60 g en crudo"},{name:"Verduras",cat:"verduras",qty:"100 g"}], steps:["Cuece las lentejas con las verduras.","Cuece el arroz aparte.","Sirve las lentejas sobre el arroz."]},
  {name:"Bowl de quinoa, garbanzos y pollo", type:"Comida",   kcal:610, prot:42, ing:[{name:"Quinoa",cat:"carbos",qty:"70 g en crudo"},{name:"Garbanzos",cat:"legumbres",qty:"80 g"},{name:"Pollo",cat:"proteina",qty:"120 g"},{name:"Verduras",cat:"verduras",qty:"100 g"}], steps:["Cuece la quinoa.","Saltea el pollo y las verduras.","Monta el bowl y añade los garbanzos."]},
  {name:"Requesón con miel",             type:"Merienda",     kcal:220, prot:24, ing:[{name:"Requesón",cat:"lacteos",qty:"200 g"},{name:"Miel",cat:"condimentos",qty:"15 g"}], steps:["Mezcla el requesón con la miel."]},
  {name:"Tostada con crema de cacahuete",type:"Merienda",     kcal:300, prot:12, ing:[{name:"Pan integral",cat:"carbos",qty:"60 g"},{name:"Crema de cacahuete",cat:"otros",qty:"20 g"}], steps:["Tuesta el pan.","Unta la crema de cacahuete."]},
  {name:"Batido de proteína",            type:"Merienda",     kcal:150, prot:25, ing:[{name:"Proteína whey",cat:"proteina",qty:"30 g"},{name:"Leche",cat:"lacteos",qty:"200 ml"}], steps:["Bate la proteína con la leche."]},
  {name:"Yogur, avena y manzana",        type:"Merienda",     kcal:240, prot:16, ing:[{name:"Yogur griego",cat:"lacteos",qty:"150 g"},{name:"Avena",cat:"carbos",qty:"25 g"},{name:"Manzana",cat:"frutas",qty:"1 ud"}], steps:["Mezcla el yogur con la avena.","Añade la manzana troceada."]},
  {name:"Pollo a la plancha y verduras", type:"Cena",         kcal:480, prot:45, ing:[{name:"Pollo",cat:"proteina",qty:"180 g"},{name:"Verduras",cat:"verduras",qty:"200 g"},{name:"Aceite de oliva",cat:"condimentos",qty:"10 ml"}], steps:["Salpimienta el pollo y hazlo a la plancha 4-5 min por lado.","Saltea o asa las verduras.","Sirve con un hilo de aceite."]},
  {name:"Merluza al horno con verduras", type:"Cena",         kcal:420, prot:38, ing:[{name:"Merluza",cat:"proteina",qty:"200 g"},{name:"Verduras",cat:"verduras",qty:"200 g"},{name:"Aceite de oliva",cat:"condimentos",qty:"10 ml"}], steps:["Coloca la merluza y las verduras en una bandeja.","Riega con aceite y hornea 15-18 min a 200°C."]},
  {name:"Carne magra con boniato",       type:"Cena",         kcal:550, prot:42, ing:[{name:"Carne magra",cat:"proteina",qty:"180 g"},{name:"Boniato",cat:"carbos",qty:"200 g"}], steps:["Asa el boniato al horno 25-30 min.","Haz la carne a la plancha al punto deseado."]},
  {name:"Tortilla francesa y ensalada",  type:"Cena",         kcal:400, prot:28, ing:[{name:"Huevos",cat:"proteina",qty:"3 ud"},{name:"Ensalada",cat:"verduras",qty:"100 g"},{name:"Aceite de oliva",cat:"condimentos",qty:"5 ml"}], steps:["Bate los huevos y cuaja la tortilla.","Acompaña con la ensalada aliñada."]},
  {name:"Salteado de ternera y verduras", type:"Cena",        kcal:470, prot:40, ing:[{name:"Ternera magra",cat:"proteina",qty:"160 g"},{name:"Verduras",cat:"verduras",qty:"200 g"},{name:"Salsa de soja",cat:"condimentos",qty:"10 ml"},{name:"Aceite de oliva",cat:"condimentos",qty:"10 ml"}], steps:["Saltea la ternera en tiras a fuego fuerte.","Añade las verduras y la salsa de soja.","Saltea 3-4 min más."]},
];

const NUT_PROFILE_SEED = {altura:170, edad:30, actividad:1.55};

  // ── V5 (despersonalización): nombres neutros, defaults genéricos y wrappers ──
  // Regla de compatibilidad: lo que el usuario ya tenga guardado SIEMPRE prevalece
  // (todo se lee con load()||default). Estos defaults solo afectan a instalaciones
  // nuevas o a estados vacíos; nunca sobrescriben datos existentes.
  const APP_NAME = "Training Tracker";
  const APP_SLUG = "training-tracker";
  const PROFILE_DEFAULTS = { altura:170, edad:30, actividad:1.55 };
  function getNutProfile(){ return load(K.nutProfile) || PROFILE_DEFAULTS; }
  function getActivityFactor(){ return safeNum(getNutProfile().actividad, PROFILE_DEFAULTS.actividad); }

const PROTEIN_FOODS = [
  {name:"Pollo 100g",prot:31},{name:"Huevo",prot:6},{name:"Atún lata",prot:25},
  {name:"Yogurt griego",prot:10},{name:"Queso fresco 100g",prot:11},
  {name:"Jamón 50g",prot:13},{name:"Leche 250ml",prot:8},
  {name:"Lentejas 100g",prot:9},{name:"Garbanzos 100g",prot:8},
  {name:"Mantequilla cacahuete 2 cda",prot:8},{name:"Frutos secos 30g",prot:5},
];

// (build pública) sin siembra de medidas personales — los datos se restauran por import

// (V6.1 retirado) El entorno personal ya no se siembra desde código; se restaura vía Ajustes · Datos (import).

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

// ════════════════════════════════════════════════════════════════════════════
// V4 — Capa de cierre semanal y propuesta futura (helpers PUROS, sin UI todavía)
// Reutiliza SOLO datos ya existentes: planWeek, cargas, proteinLog, rpe, medidas,
// nutProfile, gymPlanos. Sin efectos secundarios (no persiste). Seguro ante null.
// ────────────────────────────────────────────────────────────────────────────
// Shapes (JS plano):
//   WeekRange   = { weekStart:"YYYY-MM-DD", weekEnd:"YYYY-MM-DD", weekDays:string[7] }
//   WeeklyReview= { referenceDate, weekStart, weekEnd, plannedSessions:int,
//                   completedSessions:int, adherencePct:int|null, missedDays:string[],
//                   trainedDays:int, avgRPE:number|null, proteinDaysHit:int,
//                   kcalDaysHit:int, weeklyProteinAvg:int, weeklyKcalAvg:int,
//                   weeklyVolume:int, prsCount:int, topPRs:{id,name,kg,prevKg}[],
//                   alerts:string[], previousWeekDelta:{trainedDays,avgRPE,
//                   proteinDaysHit,weeklyVolume} }
//   WeeklyProposal={ summary:string, reasons:string[],
//                    training:{action,note,deload}, nutrition:{action,note,focus},
//                    shopping:{action,items[],note} }
// ════════════════════════════════════════════════════════════════════════════

// Rango de semana Monday-first para una fecha (o hoy). Mismo criterio que ProgresoSemana.
function getWeekRangeFrom(dateStrOrToday){
  const base=(typeof dateStrOrToday==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(dateStrOrToday))
    ? (()=>{const [y,m,d]=dateStrOrToday.split("-").map(Number);return new Date(y,m-1,d);})()
    : new Date();
  const dowMap={0:6,1:0,2:1,3:2,4:3,5:4,6:5}; // domingo→6, lunes→0 (lunes primero)
  const planIdx=dowMap[base.getDay()];
  const ws=new Date(base); ws.setDate(base.getDate()-planIdx);
  const ymd=(dt)=>`${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`;
  const weekDays=Array.from({length:7},(_,i)=>{const d=new Date(ws);d.setDate(ws.getDate()+i);return ymd(d);});
  return { weekStart:weekDays[0], weekEnd:weekDays[6], weekDays };
}

// Objetivos de proteína/kcal alineados con ProgresoSemana (pt, kcalObj).
// ── V5: objetivo nutricional configurable (capa de lectura compatible) ──
// El DEFAULT reproduce EXACTAMENTE la lógica actual (2 g/kg + surcharge por % graso),
// de modo que los números efectivos de un usuario existente NO cambian.
// Lo guardado por el usuario (K.nutGoal) prevalece; si no hay nada, usa el default.
const NUTRITION_GOALS = {
  gain:     { proteinPerKg:2,   kcalSurcharge:(gf)=> gf<8?500:gf<12?400:gf<16?350:300 }, // = comportamiento actual
  maintain: { proteinPerKg:2,   kcalSurcharge:()=>0 },
  cut:      { proteinPerKg:2.2, kcalSurcharge:()=>-400 },
};
const DEFAULT_NUTRITION_GOAL_ID = "gain"; // compatibilidad: igual que la lógica actual
function getNutritionGoalConfig(){
  const saved=load(K.nutGoal);
  const id=(saved && NUTRITION_GOALS[saved]) ? saved : DEFAULT_NUTRITION_GOAL_ID;
  return { id, ...NUTRITION_GOALS[id] };
}
const NUTRITION_GOAL_LABELS = { gain:"Ganancia", maintain:"Mantenimiento", cut:"Definición" };
function getNutritionGoalLabel(id){ return NUTRITION_GOAL_LABELS[id] || NUTRITION_GOAL_LABELS[DEFAULT_NUTRITION_GOAL_ID]; }
function getNutritionGoalOptions(){ return Object.keys(NUTRITION_GOALS).map(id=>({ id, label:getNutritionGoalLabel(id) })); }

// ── V5: detección de primer arranque / app vacía (onboarding solo para usuarios nuevos) ──
// isFirstRun = no hay NINGÚN dato real guardado. Robusto: si tienes datos, devuelve false.
function isFirstRun(){
  return !load(K.nutProfile) && !load(K.medidas) && !load(K.planWeek) && !load(K.mealPlan) && !load(K.objectives) && !load(K.cargas);
}
function shouldShowOnboarding(){ return !load(K.onboarded) && isFirstRun(); }
function dismissOnboarding(){ try{ save(K.onboarded, true); }catch(e){} }
function computeProteinTarget(weightKg, goalCfg){
  const g=goalCfg||getNutritionGoalConfig();
  return Math.round(safeNum(weightKg,0)*safeNum(g.proteinPerKg,2));
}
function computeKcalSurcharge(bodyFatPct, goalCfg){
  const g=goalCfg||getNutritionGoalConfig();
  return (typeof g.kcalSurcharge==="function") ? g.kcalSurcharge(safeNum(bodyFatPct,0)) : 0;
}

// Objetivos nutricionales diarios (capa común para las pantallas). Reproduce la
// fórmula previa: BMR Mifflin + actividad + surcharge(objetivo) + bump día de entreno.
// pt = proteína objetivo, kcalObj = kcal objetivo, ht = agua (L). training opcional.
function computeDailyNutTargets(opts){
  opts=opts||{};
  const np=opts.profile||getNutProfile();
  const pw=safeNum(opts.weightKg,70);
  const gf=safeNum(opts.bodyFatPct,10);
  const training=!!opts.training;
  const goal=getNutritionGoalConfig();
  const bmr=Math.round(10*pw+6.25*safeNum(np.altura,175)-5*safeNum(np.edad,25)+5);
  const kcalObj=Math.round(bmr*safeNum(np.actividad,1.55))+computeKcalSurcharge(gf,goal)+(training?150:0);
  const pt=computeProteinTarget(pw,goal);
  const ht=Math.round(pw*(training?42:35)/1000*10)/10;
  return { pt, kcalObj, ht, training };
}

function _v4NutTargets(){
  const meds=load(K.medidas);
  const pw=Array.isArray(meds)&&meds.length?safeNum(meds[0]?.peso,70):70;
  const gf=Array.isArray(meds)&&meds.length?safeNum(meds[0]?.grasa,10):10;
  const np=getNutProfile();
  const goal=getNutritionGoalConfig();
  const sx=computeKcalSurcharge(gf, goal);
  const bmr=Math.round(10*pw+6.25*safeNum(np.altura,175)-5*safeNum(np.edad,25)+5);
  const kcalObj=Math.round(bmr*safeNum(np.actividad,1.55))+sx;
  return { pt:computeProteinTarget(pw, goal), kcalObj };
}

// Volumen de entreno (sets totales) dentro de un rango explícito. Misma idea que getWeeklyVolume.
function _v4WeeklyVolume(weekStart,weekEnd){
  const planos=loadGymPlanos()||{};
  const allEjs=Object.values(planos).flatMap(p=>safeArr(p?.ejercicios));
  const cargas=load(K.cargas)||{};
  let total=0;
  allEjs.forEach(ej=>{
    safeArr(cargas[ej?.id]).filter(h=>h&&h.fecha>=weekStart&&h.fecha<=weekEnd)
      .forEach(h=>{ total+=safeArr(h.series).length||safeNum(ej?.series,3); });
  });
  return total;
}

// Días con proteína/kcal cumplidos + medias, sobre un set de fechas (predicado de ProgresoSemana).
function _v4MacroDaysHit(weekDays,pt,kcalObj){
  const allLog=load(K.proteinLog)||{};
  let proteinDaysHit=0,kcalDaysHit=0,protSum=0,kcalSum=0,loggedDays=0;
  safeArr(weekDays).forEach(ds=>{
    const log=safeArr(allLog[ds]);
    const p=log.reduce((a,e)=>a+safeNum(e?.prot,0),0);
    const k=log.reduce((a,e)=>a+safeNum(e?.kcal,0),0);
    if(log.length){ loggedDays++; protSum+=p; kcalSum+=k; }
    if(p>=pt) proteinDaysHit++;
    if(kcalObj>0&&k>=kcalObj*0.8) kcalDaysHit++;
  });
  return {
    proteinDaysHit, kcalDaysHit,
    weeklyProteinAvg: loggedDays?Math.round(protSum/loggedDays):0,
    weeklyKcalAvg: loggedDays?Math.round(kcalSum/loggedDays):0,
  };
}

// Media de RPE sobre fechas (claves rpe = `${date}_${planoKey}`). Devuelve número o null.
function _v4AvgRPE(weekDays){
  const rpeLog=load(K.rpe)||{};
  const vals=safeArr(weekDays).flatMap(d=>Object.entries(rpeLog)
    .filter(([key])=>key.startsWith(d+"_")).map(([,v])=>safeNum(v,NaN)).filter(isFinite));
  return vals.length?Math.round((vals.reduce((a,v)=>a+v,0)/vals.length)*10)/10:null;
}

// PRs de la semana (máx kg en semana > máx kg previo). Mismo criterio que ProgresoSemana (usa e.kg).
function _v4WeekPRs(weekStart,weekEnd){
  const cargas=load(K.cargas)||{};
  const ejById={};
  Object.values(loadGymPlanos()||{}).forEach(p=>safeArr(p?.ejercicios).forEach(e=>{ if(e&&e.id!=null) ejById[e.id]=e; }));
  const prs=[];
  Object.entries(cargas).forEach(([id,h])=>{
    if(!Array.isArray(h)||h.length<2) return;
    const wk=h.filter(e=>e&&e.fecha>=weekStart&&e.fecha<=weekEnd&&isFinite(e.kg));
    if(!wk.length) return;
    const maxW=safeMax(wk.map(e=>e.kg),0);
    const prev=h.filter(e=>e&&e.fecha<weekStart&&isFinite(e.kg));
    const maxP=prev.length?safeMax(prev.map(e=>e.kg),0):0;
    if(maxW>0&&maxW>maxP){ const ej=ejById[id]; prs.push({ id, name:(ej&&ej.nombre)||"Ejercicio", kg:maxW, prevKg:maxP }); }
  });
  prs.sort((a,b)=>(b.kg-b.prevKg)-(a.kg-a.prevKg));
  return prs;
}

// Construye un objeto de cierre semanal estable desde datos reales. Puro, sin side-effects.
function buildWeeklyReview(referenceDate=today()){
  const { weekStart, weekEnd, weekDays }=getWeekRangeFrom(referenceDate);
  const dayNames=["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];

  // Entreno: planificado (plantilla semanal) vs completado (sesiones derivadas)
  const week=loadWeek()||{};
  const plannedSessions=weekDays.reduce((acc,_ds,di)=>acc+safeArr(week[di]?.assignments).length,0);
  const sessionsByDay=weekDays.map(ds=>safeArr(getTrainedSessions(ds)));
  const completedSessions=sessionsByDay.reduce((a,arr)=>a+arr.length,0);
  const trainedDays=sessionsByDay.filter(arr=>arr.length>0).length;
  const missedDays=weekDays.reduce((acc,ds,di)=>{
    if(safeArr(week[di]?.assignments).length>0 && safeArr(getTrainedSessions(ds)).length===0) acc.push(dayNames[di]);
    return acc;
  },[]);
  const adherencePct=plannedSessions>0?Math.round((Math.min(completedSessions,plannedSessions)/plannedSessions)*100):null;

  // Nutrición (alineada con ProgresoSemana)
  const { pt, kcalObj }=_v4NutTargets();
  const macro=_v4MacroDaysHit(weekDays,pt,kcalObj);

  const avgRPE=_v4AvgRPE(weekDays);
  const weeklyVolume=_v4WeeklyVolume(weekStart,weekEnd);
  const prs=_v4WeekPRs(weekStart,weekEnd);

  // Semana anterior (mismo rango desplazado -7 días)
  const prevRefDt=(()=>{const [y,m,d]=weekStart.split("-").map(Number);const dt=new Date(y,m-1,d);dt.setDate(dt.getDate()-7);return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`;})();
  const prev=getWeekRangeFrom(prevRefDt);
  const prevTrainedDays=prev.weekDays.map(ds=>safeArr(getTrainedSessions(ds))).filter(arr=>arr.length>0).length;
  const prevAvgRPE=_v4AvgRPE(prev.weekDays);
  const prevMacro=_v4MacroDaysHit(prev.weekDays,pt,kcalObj);
  const prevVolume=_v4WeeklyVolume(prev.weekStart,prev.weekEnd);
  const delta=(cur,old)=>(cur==null||old==null)?null:Math.round((cur-old)*10)/10;
  const previousWeekDelta={
    trainedDays: trainedDays-prevTrainedDays,
    avgRPE: delta(avgRPE,prevAvgRPE),
    proteinDaysHit: macro.proteinDaysHit-prevMacro.proteinDaysHit,
    weeklyVolume: weeklyVolume-prevVolume,
  };

  // Alertas: solo si se infieren con datos reales
  const alerts=[];
  if(avgRPE!=null && avgRPE>=8.5) alerts.push("fatigue");
  if(adherencePct!=null && adherencePct<60) alerts.push("low_adherence");
  if(macro.proteinDaysHit<3) alerts.push("protein_low");
  if(trainedDays>=3 && prs.length===0 && previousWeekDelta.weeklyVolume<=0) alerts.push("stagnation");

  return {
    referenceDate, weekStart, weekEnd,
    plannedSessions, completedSessions, adherencePct, missedDays, trainedDays,
    avgRPE,
    proteinDaysHit: macro.proteinDaysHit,
    kcalDaysHit: macro.kcalDaysHit,
    weeklyProteinAvg: macro.weeklyProteinAvg,
    weeklyKcalAvg: macro.weeklyKcalAvg,
    weeklyVolume,
    prsCount: prs.length,
    topPRs: prs.slice(0,3),
    alerts,
    previousWeekDelta,
  };
}

// Propuesta semanal (todavía NO aplica nada). Pura. Bloques estructurados.
// ── Plan de comidas actual: ¿poco relleno? (sparse) ─────────────────────────
function _v4MealPlanSparse(){
  const mp=load(K.mealPlan)||{};
  let filled=0, total=0;
  for(let di=0; di<7; di++){
    total+=5; // 5 tipos de comida (MEAL_TYPES)
    safeArr(mp[di]?.meals).forEach(m=>{ if((m?.desc||"").trim()) filled++; });
  }
  return total>0 ? (filled/total)<0.4 : true; // vacío o muy poco relleno
}

// ── Semana de entreno sugerida: copia segura de loadWeek(), aligerada si toca ──
// Respeta la forma real de planWeek: [{dayIndex, assignments:[{tabId, planoKey?}]}]
function _v4SuggestedWeek(action){
  const base=safeArr(loadWeek()).map((d,idx)=>({
    dayIndex: (d && d.dayIndex!=null) ? d.dayIndex : idx,
    assignments: safeArr(d?.assignments).map(a=>({...a})),
  }));
  if(action==="simplify"){
    // 1 asignación por día como máximo (semana más realista)
    return base.map(d=>({ dayIndex:d.dayIndex, assignments:d.assignments.slice(0,1) }));
  }
  if(action==="reduce"){
    // descarga: quita una asignación de los días con 2+ (sin eliminar días sueltos)
    return base.map(d=>({ dayIndex:d.dayIndex, assignments:d.assignments.length>1?d.assignments.slice(0,d.assignments.length-1):d.assignments }));
  }
  return base; // keep / increase / rebalance → copia segura sin cambios estructurales
}

// ── Plan de comidas sugerido desde el review. Reutiliza MEAL_SUGGESTIONS. ──────
// Devuelve la MISMA forma que mealPlan: { di:{ meals:[{t,desc,prot,kcal}] } }
function buildSuggestedMealPlanFromReview(review){
  const r=review||{};
  const { pt }=_v4NutTargets();
  const types=["Desayuno","Media mañana","Comida","Merienda","Cena"]; // = MEAL_TYPES real
  const proteinPush = safeNum(r.proteinDaysHit,0)<3 || safeNum(r.weeklyProteinAvg,0) < pt*0.85;
  const repeat = proteinPush || _v4MealPlanSparse(); // menos variedad: repetir comidas fiables
  const byType={};
  types.forEach(t=>{
    let list=safeArr(MEAL_SUGGESTIONS).filter(s=>s&&s.type===t);
    if(proteinPush) list=list.slice().sort((a,b)=>safeNum(b.prot,0)-safeNum(a.prot,0));
    byType[t]=list;
  });
  const plan={};
  for(let di=0; di<7; di++){
    const meals=types.map(t=>{
      const list=byType[t];
      if(!list.length) return { t, desc:"" };
      const pick = repeat ? list[0] : list[di % list.length]; // determinista
      return { t, desc:pick.name, prot:safeNum(pick.prot,0), kcal:safeNum(pick.kcal,0) };
    });
    plan[di]={ meals };
  }
  return plan;
}

// ── Compra derivada de un plan de comidas. Reutilizable y determinista. ────────
// Usa la forma real de items: {id,name,cat,done}. Dedup por nombre (substring,
// igual criterio que addRecipeToShopping) contra la compra actual y dentro del lote.
function deriveShoppingFromMealPlan(mealPlanDraft, currentShopping){
  const cur=safeArr(currentShopping);
  const sugByName={};
  safeArr(MEAL_SUGGESTIONS).forEach(s=>{ if(s&&s.name) sugByName[s.name.toLowerCase()]=s; });
  const inList=(name,names)=>{ const n=(name||"").toLowerCase(); return names.some(x=>{ const e=(x||"").toLowerCase(); return e&&(e===n||e.includes(n)||n.includes(e)); }); };
  const curNames=cur.map(s=>s?.name||"");
  const out=[], addedNames=[];
  const draft=mealPlanDraft||{};
  Object.keys(draft).forEach(di=>{
    safeArr(draft[di]?.meals).forEach(m=>{
      const rec=sugByName[(m?.desc||"").toLowerCase()];
      if(!rec) return;
      safeArr(rec.ing).forEach(ig=>{
        if(!ig||!ig.name) return;
        if(inList(ig.name,curNames)) return;   // ya está en la compra
        if(inList(ig.name,addedNames)) return;  // ya añadido en este lote
        addedNames.push(ig.name);
        out.push({ id:"v4_"+(ig.cat||"otros")+"_"+ig.name.toLowerCase().replace(/[^a-z0-9]+/g,"_"), name:ig.name, cat:ig.cat||"otros", done:false });
      });
    });
  });
  return out;
}

// ── Motor real de propuesta semanal. Determinista. No aplica nada (solo propone). ──
function buildWeeklyProposal(review){
  const r=review||{};
  const alerts=safeArr(r.alerts);
  const { pt, kcalObj }=_v4NutTargets();
  const reasons=[];

  // ── Entrenamiento ──
  const adh=r.adherencePct;
  const fatigue = alerts.includes("fatigue") || (r.avgRPE!=null && r.avgRPE>=8.5);
  let tAction="keep"; const tNotes=[];
  if(adh!=null && adh<60){ tAction="simplify"; tNotes.push("Adherencia <60%: plan más corto y realista, no subir carga."); reasons.push("Adherencia baja"); }
  else if(fatigue){ tAction="reduce"; tNotes.push("RPE alto: bajar intensidad/volumen (semana de descarga)."); reasons.push("Fatiga / RPE alto"); }
  else if(alerts.includes("stagnation")){ tAction="increase"; tNotes.push("Sin PRs y volumen estancado: subir carga o volumen de forma gradual."); reasons.push("Progreso estancado"); }
  else if(adh!=null && adh<80 && safeArr(r.missedDays).length>0){ tAction="rebalance"; tNotes.push("Días planificados sin entrenar: redistribuir la semana ("+safeArr(r.missedDays).join(", ")+")."); reasons.push("Días perdidos"); }
  else if(adh!=null && adh>=80 && safeNum(r.proteinDaysHit,0)>=5 && alerts.length===0 && safeNum(r.trainedDays,0)>=4){ tAction="increase"; tNotes.push("Semana sólida: margen para subir ligeramente carga o volumen."); reasons.push("Semana sólida"); }
  else { tNotes.push("Mantener el plan actual."); }
  const training={ action:tAction, notes:tNotes, suggestedWeek:_v4SuggestedWeek(tAction) };

  // ── Nutrición ──
  const proteinLow = safeNum(r.proteinDaysHit,0)<3 || safeNum(r.weeklyProteinAvg,0) < pt*0.85;
  const kcalLow = safeNum(r.kcalDaysHit,0)<=1;
  const sparse = _v4MealPlanSparse();
  let nAction="keep"; const nNotes=[];
  if(proteinLow){ nAction="increase_protein"; nNotes.push(`Proteína baja: objetivo ~${pt} g/día.`); reasons.push("Proteína por debajo del objetivo"); }
  else if(kcalLow){ nAction="stabilize_kcal"; nNotes.push(`Pocos días llegando a kcal: estabilizar ingesta (~${kcalObj} kcal/día).`); reasons.push("Kcal inestables"); }
  else if(sparse){ nAction="simplify_meals"; nNotes.push("Plan poco relleno: simplificar y repetir comidas fiables."); reasons.push("Plan de comidas irregular"); }
  else { nNotes.push("Mantener objetivos actuales."); }
  const suggestedMealPlan=buildSuggestedMealPlanFromReview(r);
  const nutrition={ action:nAction, notes:nNotes, suggestedMealPlan };

  // ── Compra ──
  const curShopping=safeArr(load(K.shopping));
  const suggestedItems=deriveShoppingFromMealPlan(suggestedMealPlan, curShopping);
  let sAction="none"; const sNotes=[];
  if(suggestedItems.length===0){ sAction="none"; sNotes.push("La compra ya cubre el plan propuesto."); }
  else if(nAction==="increase_protein"){ sAction="top_up_protein"; sNotes.push("Reforzar fuentes de proteína para la semana."); }
  else if(curShopping.length<5){ sAction="top_up_basics"; sNotes.push("Compra casi vacía: añadir básicos del plan."); }
  else { sAction="refresh_from_meal_plan"; sNotes.push("Añadir lo que falta según el plan propuesto."); }
  const shopping={ action:sAction, notes:sNotes, suggestedItems };

  const summary = reasons.length
    ? `Próxima semana: ${reasons.length} ajuste(s) — entreno:${training.action}, nutrición:${nutrition.action}, compra:${shopping.action}.`
    : `Próxima semana: mantener — entreno:${training.action}, nutrición:${nutrition.action}, compra:${shopping.action}.`;

  return { summary, reasons, training, nutrition, shopping };
}
// ════════════════════════════════════════════════════════════════════════════
// V4 — Capa de APLICACIÓN segura (persistir / aplicar / revertir). Sin UI.
// Usa load/save reales y shapes reales. Aplicación reversible (un solo backup).
// ════════════════════════════════════════════════════════════════════════════

// Merge determinista de compra: conserva los items actuales y añade los sugeridos
// solo si no existen (dedup simétrico por nombre, igual criterio que addRecipeToShopping).
function _v4MergeShopping(currentShopping, suggestedItems){
  const out=safeArr(currentShopping).map(s=>({...s}));
  const inList=(name,names)=>{ const n=(name||"").toLowerCase(); return names.some(x=>{ const e=(x||"").toLowerCase(); return e&&(e===n||e.includes(n)||n.includes(e)); }); };
  const names=out.map(s=>s?.name||"");
  safeArr(suggestedItems).forEach(it=>{
    if(!it||!it.name) return;
    if(inList(it.name,names)) return;
    names.push(it.name);
    out.push({
      id: it.id || ("v4_"+(it.cat||"otros")+"_"+String(it.name).toLowerCase().replace(/[^a-z0-9]+/g,"_")),
      name: it.name, cat: it.cat||"otros", done:false,
    });
  });
  return out;
}

// A) Calcula review+proposal y los persiste. Devuelve { review, proposal }.
function persistWeeklyArtifacts(referenceDate=today()){
  const review=buildWeeklyReview(referenceDate);
  const proposal=buildWeeklyProposal(review);
  const savedAt=new Date().toISOString();
  // weeklyProposal guarda el artefacto completo (incluye review y proposal)
  save(K.weeklyProposal, { savedAt, referenceDate:review.referenceDate, review, proposal });
  // weeklyReview guarda el review (subconjunto coherente)
  save(K.weeklyReview, { savedAt, referenceDate:review.referenceDate, review });
  return { review, proposal };
}

// B) Aplica la propuesta a week plan / meal plan / shopping. Reversible.
// options: { training?:bool, nutrition?:bool, shopping?:bool } (por defecto todas true).
// Aplicación por áreas (separadas, reutilizables). Cada una devuelve { ok, changed, message }.
function applyTrainingProposal(trainingProposal){
  const tp=trainingProposal;
  if(!tp || !Array.isArray(tp.suggestedWeek)) return { ok:false, changed:false, message:"Sin plan de entreno propuesto." };
  save(K.planWeek, tp.suggestedWeek);
  return { ok:true, changed:true, message:"Semana de entreno aplicada." };
}

function applyNutritionProposal(nutritionProposal){
  const np=nutritionProposal;
  if(!np || !np.suggestedMealPlan || typeof np.suggestedMealPlan!=="object") return { ok:false, changed:false, message:"Sin plan de comidas propuesto." };
  save(K.mealPlan, np.suggestedMealPlan);
  return { ok:true, changed:true, message:"Plan de comidas aplicado." };
}

function applyShoppingProposal(shoppingProposal, options){
  options=options||{};
  const items=safeArr(shoppingProposal&&shoppingProposal.suggestedItems).filter(it=>it&&it.name); // sin vacíos
  if(!items.length) return { ok:false, changed:false, message:"Sin items de compra propuestos." };
  if(options.replaceShopping===true){
    // Reemplaza por items limpios y normalizados {id,name,cat,done}, dedup dentro del lote.
    const clean=[], names=[];
    const inList=(name)=>{ const n=(name||"").toLowerCase(); return names.some(e=>e&&(e===n||e.includes(n)||n.includes(e))); };
    items.forEach(it=>{
      if(inList(it.name)) return;
      names.push(String(it.name).toLowerCase());
      clean.push({ id: it.id || ("v4_"+(it.cat||"otros")+"_"+String(it.name).toLowerCase().replace(/[^a-z0-9]+/g,"_")), name: it.name, cat: it.cat||"otros", done:false });
    });
    save(K.shopping, clean);
    return { ok:true, changed:true, message:"Compra reemplazada." };
  }
  save(K.shopping, _v4MergeShopping(load(K.shopping), items)); // merge dedup case-insensitive (helper existente)
  return { ok:true, changed:true, message:"Compra actualizada." };
}

// Orquestador: normaliza flags (alias nuevos + nombres viejos), guarda backup único y delega por áreas.
function applyWeeklyProposal(proposal, options){
  options=options||{};
  const doT = (options.applyTraining!==undefined ? options.applyTraining : options.training) !== false;
  const doN = (options.applyNutrition!==undefined ? options.applyNutrition : options.nutrition) !== false;
  const doS = (options.applyShopping!==undefined ? options.applyShopping : options.shopping) !== false;
  const replaceShopping = options.replaceShopping===true;

  // Fallback seguro: si no llega una propuesta válida, usa la persistida o recalcula.
  let prop=proposal;
  if(!prop || (!prop.training && !prop.nutrition && !prop.shopping)){
    const stored=load(K.weeklyProposal);
    prop=(stored&&stored.proposal)?stored.proposal:buildWeeklyProposal(buildWeeklyReview());
  }

  // Snapshot reversible (una sola "última acción"): copia exacta del estado actual. (sin cambios)
  save(K.weeklyProposalBackup, {
    savedAt:new Date().toISOString(),
    planWeek: load(K.planWeek),
    mealPlan: load(K.mealPlan),
    shopping: load(K.shopping),
  });

  const applied={ training:false, nutrition:false, shopping:false };
  const messages=[];
  if(doT && prop && prop.training){ const r=applyTrainingProposal(prop.training); applied.training=r.changed; if(r.changed) messages.push(r.message); }
  if(doN && prop && prop.nutrition){ const r=applyNutritionProposal(prop.nutrition); applied.nutrition=r.changed; if(r.changed) messages.push(r.message); }
  if(doS && prop && prop.shopping){ const r=applyShoppingProposal(prop.shopping, { replaceShopping }); applied.shopping=r.changed; if(r.changed) messages.push(r.message); }

  const parts=[];
  if(applied.training) parts.push("entreno");
  if(applied.nutrition) parts.push("nutrición");
  if(applied.shopping) parts.push(replaceShopping?"compra (reemplazada)":"compra");
  const summary = parts.length ? ("Aplicado a "+parts.join(", ")+".") : "Sin cambios aplicados.";
  return { ok:true, applied, backupSaved:true, summary, messages };
}

// C) Revierte la última aplicación (de una sola vez). Restaura el estado exacto.
function revertLastWeeklyProposal(){
  const backup=load(K.weeklyProposalBackup);
  if(!backup || typeof backup!=="object") return { ok:false, reason:"no_backup" };
  save(K.planWeek, backup.planWeek);   // puede ser null (= usar DEFAULT_WEEK), se restaura fiel
  save(K.mealPlan, backup.mealPlan);
  save(K.shopping, backup.shopping);
  try{ localStorage.removeItem(K.weeklyProposalBackup); }catch(e){ save(K.weeklyProposalBackup, null); }  // invalida el backup → revert único
  return { ok:true, restored:true };
}


// DEV (no intrusivo): para probar en consola, descomenta:
// console.log("v4 review", buildWeeklyReview()); console.log("v4 proposal", buildWeeklyProposal(buildWeeklyReview()));

function saveRPE(date,planoKey,rpe){
  const rpeLog=load(K.rpe)||{};
  rpeLog[`${date}_${planoKey}`]=rpe;
  save(K.rpe,rpeLog);
}
function getRPE(date,planoKey){
  return (load(K.rpe)||{})[`${date}_${planoKey}`]||null;
}

// ── V6.2: capa de backup explícito (export/import) ──────────────────────────────
// Sustituye la dependencia de seeds/bootstrap personal: tu entorno se restaura importando tu JSON.
// allowlist por CLAVE REAL de storage (pg_*) para que import escriba 1:1 (sin el bug nombre→clave).
const BACKUP_KEY_NAMES = ["tabs","cargas","medidas","gymPlanos","planWeek","objectives","rpe","snota","customFoods","supplements","nutProfile","mealPlan","shopping","proteinLog","recipes","nutGoal","trainingTemplate"];
const BACKUP_KEYS = BACKUP_KEY_NAMES.map(n=>K[n]).filter(Boolean);
function isBackupKey(k){ return typeof k==="string" && (BACKUP_KEYS.indexOf(k)>=0 || k.indexOf("pg_ej_")===0 || k.indexOf("pg_td_")===0 || k==="pg_sup_done"); }
function buildBackupPayload(){
  const payload={};
  BACKUP_KEYS.forEach(k=>{ const v=load(k); if(v!==null && v!==undefined) payload[k]=v; });
  const sd=load("pg_sup_done"); if(sd!==null && sd!==undefined) payload["pg_sup_done"]=sd;
  loadTabs().forEach(t=>{
    const ej=load(tabEjKey(t.id)); if(ej!==null && ej!==undefined) payload[tabEjKey(t.id)]=ej;
    const td=load(tabDataKey(t.id)); if(td!==null && td!==undefined) payload[tabDataKey(t.id)]=td;
  });
  return payload;
}
function exportData(){ return buildBackupPayload(); } // objeto plano keyed por storage key
// Parseo + validación + allowlist SIN escribir; la escritura ocurre tras confirmación explícita.
function parseBackup(raw){
  if(!raw) return {ok:false,reason:"empty"};
  let p; try{ p=JSON.parse(raw); }catch(e){ return {ok:false,reason:"parse_error"}; }
  let src=null, legacy=false;
  if(p && typeof p.payload==="object" && p.payload && !Array.isArray(p.payload)) src=p.payload;            // v3
  else if(p && typeof p.data==="object" && p.data && !Array.isArray(p.data)){ src=p.data; legacy=true; }    // v2/legacy
  if(!src) return {ok:false,reason:"no_data"};
  const entries=[];
  Object.keys(src).forEach(key=>{
    const sk = legacy ? (K[key]||key) : key; // legacy indexaba por nombre de propiedad → mapear a clave real
    if(isBackupKey(sk) && src[key]!==undefined) entries.push([sk, src[key]]);
  });
  if(entries.length===0) return {ok:false,reason:"empty_data"};
  return {ok:true, entries, count:entries.length};
}
function applyBackup(entries){ let n=0; (entries||[]).forEach(([k,v])=>{ save(k,v); n++; }); return n; }
function importData(file,onDone){
  const reader=new FileReader();
  reader.onerror=()=>onDone({ok:false,reason:"read_error"});
  reader.onload=e=>{ onDone(parseBackup(e.target?.result)); }; // valida/allowlist; NO escribe aquí
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
  return <button {...lp} onClick={()=>onSelect(ej.id)} style={{background:selected?C.card:C.surface,color:selected?C.text:C.textSub,border:`1px solid ${selected?C.text:C.border}`,borderRadius:8,padding:"7px 12px",fontSize:12,cursor:"pointer",fontWeight:selected?600:400,transition:"all 0.15s",userSelect:"none"}}>{ej.icon} {ej.nombre}</button>;
}

// ── UI ATOMS ──────────────────────────────────────────────────────────────────
function Card({children,style={},onClick}){
  return <div onClick={onClick} style={{
    background:C.card,
    border:`1px solid ${C.border}`,
    borderRadius:12,
    padding:13,
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
    padding:"9px 15px",
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
  return <button onClick={onClick} style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:12,marginBottom:10,padding:0,letterSpacing:-0.1,display:"flex",alignItems:"center",gap:4}}>
    ‹ Volver
  </button>;
}
function SectionLabel({children,style={}}){
  return <p style={{color:C.text,fontSize:13,fontWeight:600,margin:"0 0 8px",...style}}>{children}</p>;
}
function SavedBadge({color}){
  return <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,padding:"4px 10px",marginBottom:8,color:C.textMuted,fontSize:11,fontWeight:400}}>Guardado</div>;
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
  return <div style={{marginTop:10,padding:"7px 12px",background:C.surface,borderRadius:6,borderLeft:`2px solid ${c}`}}>
    <p style={{color:c,fontSize:11,margin:0,fontWeight:400,letterSpacing:-0.1}}>{prefix} {ins.text}</p>
  </div>;
}
function BarChart({data,color,unit="kg"}){
  if(!data||data.length<2) return <p style={{color:C.textMuted,fontSize:12,textAlign:"center",padding:"14px 0"}}>Necesitas 2+ registros.</p>;
  const vals=data.map(d=>safeNum(d.val,null)).filter(v=>v!==null);
  if(!vals.length) return <p style={{color:C.textMuted,fontSize:11,padding:"14px 0",textAlign:"center"}}>Sin datos numéricos.</p>;
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
// Host de nivel shell: el diálogo se renderiza fuera del contenedor con scroll (como los toasts),
// evitando el bug iOS de position:fixed dentro de overflow:auto. Solo APIs del stack actual (sin portales).
let _setConfirm = null;
// Refresco interno (soft) tras import: remonta el contenido para releer storage, sin recargar la app.
let _bumpData = null;
function bumpDataVersion(){ if(_bumpData) _bumpData(); }
function ConfirmDialog(props){
  // Compatibilidad total con los call sites existentes: {estado && <ConfirmDialog .../>}
  useEffect(()=>{
    if(_setConfirm) _setConfirm(props);          // captura props al montar
    return ()=>{ if(_setConfirm) _setConfirm(null); }; // limpia al desmontar
  }, []);
  return null; // no renderiza in-place; lo pinta ConfirmHost a nivel de shell
}
function ConfirmDialogView({msg,onConfirm,onCancel}){
  return (
    <div onClick={onCancel} style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.6)",zIndex:9998,display:"flex",alignItems:"center",justifyContent:"center",padding:16,boxSizing:"border-box"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,width:"100%",maxWidth:420,maxHeight:"calc(100% - 32px)",display:"flex",flexDirection:"column",boxSizing:"border-box",boxShadow:"0 12px 40px rgba(0,0,0,0.45)"}}>
        <div style={{flexShrink:0,padding:"18px 20px 8px"}}>
          <p style={{color:C.text,fontSize:15,fontWeight:600,margin:0}}>Confirmar acción</p>
        </div>
        <div style={{flex:"1 1 auto",overflowY:"auto",WebkitOverflowScrolling:"touch",padding:"0 20px 14px",minHeight:0}}>
          <p style={{color:C.textSub,fontSize:13,margin:0,lineHeight:1.5}}>{msg}</p>
        </div>
        <div style={{flexShrink:0,display:"flex",gap:8,padding:"12px 16px",borderTop:`1px solid ${C.border}`,paddingBottom:"calc(12px + env(safe-area-inset-bottom,0px))"}}>
          <button onClick={onCancel} style={{flex:1,background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.textSub,padding:"12px",cursor:"pointer",fontSize:13,fontWeight:500}}>Cancelar</button>
          <Btn onClick={onConfirm} color={C.text} style={{flex:1,padding:"12px",justifyContent:"center"}}>Confirmar</Btn>
        </div>
      </div>
    </div>
  );
}
function ConfirmHost(){
  const [cfg,setCfg]=useState(null);
  useEffect(()=>{ _setConfirm=setCfg; return ()=>{ _setConfirm=null; }; },[]);
  if(!cfg) return null;
  return <ConfirmDialogView msg={cfg.msg} onConfirm={cfg.onConfirm} onCancel={cfg.onCancel}/>;
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
      <Card accent={color} style={{marginBottom:12}}>
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
      <Card style={{marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <SectionLabel>Niveles de progresión</SectionLabel>
          <button onClick={()=>setEditingLevels(v=>!v)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,color:C.textSub,padding:"6px 12px",cursor:"pointer",fontSize:11}}>{editingLevels?"✓ Listo":"✏️ Editar"}</button>
        </div>
        {!editingLevels&&niveles.length===0&&<p style={{color:C.textMuted,fontSize:12,margin:0}}>Sin niveles. Toca ✏️ para añadir.</p>}
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
            <Btn onClick={()=>{if(!newLevel.trim())return;updateNiveles(detailId,[...niveles,newLevel.trim()]);setNewLevel("");}} color={color} style={{padding:"7px 12px",fontSize:12}}>+</Btn>
          </div>
        </div>}
      </Card>

      {chartData.length>1&&<Card style={{marginBottom:12}}><SectionLabel>Progresión</SectionLabel><BarChart data={chartData} color={color}/><InsightBox data={chartData} unit=""/></Card>}

      {/* Historial */}
      {hist.length>0&&<><SectionLabel>Historial</SectionLabel>
        {hist.map((h,i)=>(
          <div key={i} style={{padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
            {editEntry===i?(
              <div style={{display:"flex",gap:8}}>
                <Input value={editVal} onChange={e=>setEditVal(e.target.value)} placeholder="Nuevo valor" style={{flex:1}}/>
                <Btn onClick={()=>{const arr=[...(data[detailId]||[])];arr[arr.length-1-i]={...arr[arr.length-1-i],val:parseFloat(editVal)};saveData({...data,[detailId]:arr});setEditEntry(null);setEditVal("");}} color={color} style={{padding:"7px 12px",fontSize:12}}>✓</Btn>
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
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
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
        <div style={{marginTop:12,paddingTop:14,borderTop:`1px solid ${C.border}`}}>
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
    <Card style={{marginBottom:12,background:C.surface,border:`1px solid ${C.border}`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
        <p style={{color:C.text,fontSize:13,fontWeight:500,margin:0}}>{tab.icon} {tab.name}</p>
        <SessionTimer timerId={tab.id} color={color} autoStart={autoStart} onStarted={onSessionStarted}/>
      </div>
      {tab.id==="powerlifting"&&<div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"7px 12px",marginBottom:10,display:"flex",gap:8,alignItems:"center"}}>
        <span style={{fontSize:14}}>!</span>
        <p style={{color:C.textMuted,fontSize:11,margin:0}}>Calentamiento · 5-10 min de movilidad + series al 40-60%.</p>
      </div>}
      {tab.id==="skills"&&<SkillsSessionTracker color={color} tab={tab}/>}
      <p style={{color:C.textSub,fontSize:12,margin:"0 0 4px"}}>Ejercicios de hoy</p>
      <p style={{color:C.textMuted,fontSize:10,margin:"0 0 12px",fontStyle:"italic"}}>Mantén pulsado para eliminar</p>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
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
    <p style={{color:C.textMuted,fontSize:10,margin:"0 0 8px",fontStyle:"italic"}}>Mantén pulsado para eliminar</p>
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
    <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${C.border}`}}>
      <button onClick={()=>{if(onDeleteTab)onDeleteTab(tab.id);}} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:12,color:C.red,width:"100%",padding:"10px",cursor:"pointer",fontSize:13,fontWeight:600}}>
         Eliminar pestaña "{tab.name}"
      </button>
    </div>
  </div>;
}

// ── GYM PANEL ─────────────────────────────────────────────────────────────────
function GymPanel({initPlanoKey=null,autoStart=false,onSessionStarted}){
  const planos=loadGymPlanos(); // always fresh from storage
  const [,setPlanVer]=useState(0); // bump → re-render para releer planos de storage al instante
  const ejRefs=useRef({}); // refs por ejercicio para smart superset scrolling
  const [planoSel,setPlanoSel]=useState(()=>initPlanoKey||Object.keys(loadGymPlanos())[0]||"A");
  const [cargas,setCargas]=useState(()=>load(K.cargas)||{});
  const [seriesInputs,setSeriesInputs]=useState({});
  const [warmups,setWarmups]=useState({}); // warm-up sets por ejercicio (type:"warmup")
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
  const [editSets,setEditSets]=useState([]);
  const [editNota,setEditNota]=useState("");
  const [addingPlano,setAddingPlano]=useState(false);
  const [newPlanoName,setNewPlanoName]=useState("");
  const [focusPlanoName,setFocusPlanoName]=useState(false);
  const planoNameRef=useRef(null);
  useEffect(()=>{
    if(focusPlanoName && editMode){
      const raf=requestAnimationFrame(()=>{ try{ const el=planoNameRef.current; if(el){ el.focus(); el.select&&el.select(); } }catch(e){} });
      setFocusPlanoName(false);
      return ()=>cancelAnimationFrame(raf);
    }
  },[focusPlanoName,editMode]);

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

  function updateEj(ejId,patch){
    const p=planos[planoSel];
    savePlanos({...planos,[planoSel]:{...p,ejercicios:p.ejercicios.map(e=>e.id===ejId?{...e,...patch}:e)}});
  }
  function updatePlanoName(name){
    const p=planos[planoSel];
    savePlanos({...planos,[planoSel]:{...p,nombre:name}});
  }
  // Referencia "previous" global por NOMBRE (otro plano) — solo como fallback cuando no hay historial local
  function lastByName(name,excludeId){
    const nm=(name||"").trim().toLowerCase(); if(!nm) return null;
    let best=null,bestPlano=null;
    Object.entries(planos).forEach(([pk,p])=>{ safeArr(p.ejercicios).forEach(e=>{ if(e.id===excludeId) return; if((e.nombre||"").trim().toLowerCase()!==nm) return; const arr=safeArr(cargas[e.id]); const lst=arr[arr.length-1]; if(lst&&(!best||String(lst.fecha)>String(best.fecha))){ best=lst; bestPlano=p.nombre||pk; } }); });
    return best?{entry:best,planoName:bestPlano}:null;
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

  function handleConfirmSerie(ejId,descanso){if(descanso) setTimerSecs({ejId,secs:descanso,ts:Date.now()});}
  const ssColor=(gid)=>({A:C.yellow,B:C.purple,C:C.green,D:C.orange})[gid]||C.textSub;
  function ssNextType(gid){ const seq=["","A","B","C","D"]; const i=seq.indexOf(gid||""); return seq[((i<0?0:i)+1)%seq.length]; }
  function superInfo(ej){ if(!ej.groupId) return null; const members=safeArr(plano.ejercicios).filter(e=>e.groupId===ej.groupId); if(members.length<2) return {single:true}; const idx=members.findIndex(e=>e.id===ej.id); const isLast=idx===members.length-1; return {single:false,members,idx,isLast,next:isLast?members[0]:members[idx+1]}; }
  function confirmSet(ej,cur){ const si=superInfo(ej); let rest=(cur&&cur.type==="drop")?0:ej.descanso; if(si&&!si.single){ rest=(cur&&cur.type==="drop")?0:(si.isLast?ej.descanso:0); } handleConfirmSerie(ej.id,rest); if(si&&!si.single&&si.next){ const tgt=ejRefs.current[si.next.id]; if(tgt&&tgt.scrollIntoView) setTimeout(()=>{try{tgt.scrollIntoView({behavior:"smooth",block:"center"});}catch(e){}},50); } }

  function handleSaveEj(ejId,descanso,numSeries){
    const arr=seriesInputs[ejId]||[];
    const sets=arr.map(o=>{ const kg=pkg(o&&o.kg); const r=parseInt(o&&o.reps); return {kg:isNaN(kg)?0:kg,reps:isNaN(r)?null:r,type:(o&&o.type)||"normal"}; }).filter(s=>s.kg>0);
    if(sets.length<numSeries) return;
    const wu=(warmups[ejId]||[]).map(o=>{ const kg=pkg(o&&o.kg); const r=parseInt(o&&o.reps); return {kg:isNaN(kg)?0:kg,reps:isNaN(r)?null:r,type:"warmup"}; }).filter(s=>s.kg>0);
    const finalSets=[...wu,...sets];
    const vals=sets.map(s=>s.kg);
    const maxKg=Math.max(...vals);
    const ejName=plano.ejercicios.find(e=>e.id===ejId)?.nombre||"Ejercicio";
    const prev=(cargas[ejId]||[]).slice(-1)[0]?.kg;
    const trend=prev?maxKg>prev?" ↑":maxKg<prev?" ↓":"":"";
    const entry={fecha:today(),kg:maxKg,series:finalSets,nota:notes[ejId]||null};
    const newC={...cargas,[ejId]:[...(cargas[ejId]||[]),entry].slice(-30)};
    saveCargas(newC);
    setSeriesInputs(i=>({...i,[ejId]:[]}));
    setWarmups(W=>{ const n={...W}; delete n[ejId]; return n; });
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
      <Card accent={plano.color} style={{marginBottom:12}}>
        <Tag color={plano.color}>Plano {planoSel}</Tag>
        <p style={{color:C.text,fontSize:16,fontWeight:700,margin:"6px 0 0"}}>{ej?.nombre}</p>
        <div style={{display:"flex",gap:16,marginTop:8}}>
          {[["Récord",maxVal+"kg"],["Sesiones",hist.length]].map(([k,v])=>(
            <div key={k}><p style={{color:C.textMuted,fontSize:10,margin:"0 0 2px"}}>{k}</p><p style={{color:C.text,fontSize:14,fontWeight:600,margin:0}}>{v}</p></div>
          ))}
        </div>
      </Card>
      {chartData.length>1&&<Card style={{marginBottom:12}}>
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
        return <Card style={{marginBottom:12}}>
          <SectionLabel>Tendencia de RPE</SectionLabel>
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
            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:12}}>
              {editSets.map((es,si)=>{
                const tm=({normal:{ab:"N",c:C.textMuted},warmup:{ab:"W",c:C.yellow},drop:{ab:"D",c:C.purple},failure:{ab:"F",c:C.red}})[es.type||"normal"];
                const upd=(patch)=>setEditSets(a=>a.map((x,k)=>k===si?{...x,...patch}:x));
                return <div key={si} style={{display:"flex",gap:6,alignItems:"center",marginBottom:6}}>
                  <p style={{color:C.textMuted,fontSize:11,margin:0,minWidth:24,fontWeight:500}}>S{si+1}</p>
                  <button onClick={()=>upd({type:nextSetType(es.type||"normal")})} title={"Tipo: "+(es.type||"normal")} style={{background:"transparent",border:`1px solid ${tm.c}`,color:tm.c,borderRadius:8,width:30,height:34,boxSizing:"border-box",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,cursor:"pointer",flexShrink:0,padding:0}}>{tm.ab}</button>
                  <input type="text" inputMode="decimal" value={es.kg} onChange={e=>upd({kg:e.target.value.replace(/[^0-9.,]/g,"")})} placeholder="kg" style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,padding:"0 8px",height:34,flex:1,minWidth:0,boxSizing:"border-box",outline:"none",WebkitAppearance:"none",fontFamily:"inherit"}}/>
                  <span style={{color:C.textMuted,fontSize:10}}>kg</span>
                  <input type="number" inputMode="numeric" value={es.reps} onChange={e=>upd({reps:e.target.value})} placeholder="reps" style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,padding:"0 8px",height:34,width:56,boxSizing:"border-box",outline:"none",WebkitAppearance:"none",fontFamily:"inherit"}}/>
                  <span style={{color:C.textMuted,fontSize:10}}>reps</span>
                  <button onClick={()=>setEditSets(a=>a.filter((_,k)=>k!==si))} title="Quitar serie" style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:13,flexShrink:0}}>✕</button>
                </div>;
              })}
              <button onClick={()=>setEditSets(a=>[...a,{kg:"",reps:"",type:"normal"}])} style={{background:C.card,border:`1px dashed ${C.border}`,borderRadius:8,color:C.textSub,padding:"5px 10px",cursor:"pointer",fontSize:11,marginBottom:8}}>+ Serie</button>
              <input type="text" value={editNota} onChange={e=>setEditNota(e.target.value)} placeholder="Nota técnica (opcional)" style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,padding:"8px",width:"100%",boxSizing:"border-box",outline:"none",WebkitAppearance:"none",fontFamily:"inherit",marginBottom:8}}/>
              <div style={{display:"flex",gap:6}}>
                <Btn onClick={()=>{ const sets=editSets.map(o=>{const kg=pkg(o.kg);const r=parseInt(o.reps);return {kg:isNaN(kg)?0:kg,reps:isNaN(r)?null:r,type:o.type||"normal"};}).filter(s=>s.kg>0); if(!sets.length){setEditEntry(null);setEditSets([]);setEditNota("");return;} const maxKg=Math.max(...sets.map(s=>s.kg)); const arr=[...(cargas[histEj]||[])]; const idx=arr.length-1-i; arr[idx]={...arr[idx],kg:maxKg,series:sets,nota:editNota.trim()||null}; saveCargas({...cargas,[histEj]:arr}); setEditEntry(null);setEditSets([]);setEditNota(""); }} color={plano.color} style={{padding:"7px 14px",fontSize:12,justifyContent:"center",flex:1}}>Guardar</Btn>
                <button onClick={()=>{setEditEntry(null);setEditSets([]);setEditNota("");}} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,color:C.textMuted,cursor:"pointer",fontSize:12,padding:"7px 14px"}}>Cancelar</button>
              </div>
            </div>
          ):(
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <p style={{color:C.textMuted,fontSize:11,margin:"0 0 2px"}}>{fmt(h.fecha)}</p>
                {normSets(h.series).length>0&&<p style={{color:C.textMuted,fontSize:11,margin:0}}>Series: {normSets(h.series).map(s=>{const mk=(s.type&&s.type!=="normal")?(({warmup:"W",drop:"D",failure:"F"})[s.type]+" "):"";return mk+(s.reps!=null?`${s.kg}×${s.reps}`:`${s.kg}kg`);}).join(" · ")}</p>}
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
                <button onClick={()=>{ setEditEntry(i); const ns=normSets(h.series); setEditSets(ns.length?ns.map(s=>({kg:String(s.kg),reps:s.reps!=null?String(s.reps):"",type:s.type||"normal"})):[{kg:String(h.kg||""),reps:"",type:"normal"}]); setEditNota(h.nota||""); }} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,color:C.textSub,cursor:"pointer",fontSize:12,fontWeight:600,padding:"5px 12px"}}>Editar</button>
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
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16,marginBottom:12}}>
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
        return <div style={{marginTop:12,borderTop:`1px solid ${C.border}`,paddingTop:12}}>
          <p style={{color:C.text,fontSize:13,fontWeight:600,margin:"0 0 8px"}}>Volumen semanal</p>
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
  function nextPlanoKey(){ const keys=Object.keys(planos); for(let n=0;n<26;n++){ const ch=String.fromCharCode(65+n); if(!keys.includes(ch)) return ch; } return "P"+(keys.length+1); }
  function quickAddPlano(){
    const key=nextPlanoKey();
    const nuevo={nombre:`Plano ${key}`,color:"#8e8e93",ejercicios:[]};
    const upd={...planos,[key]:nuevo};
    savePlanos(upd); setPlanoSel(key); setEditMode(true); setFocusPlanoName(true);
    pushToast({type:"success",text:`Plano ${key} creado`});
  }
  function handleAddPlano(){
    const key=(newPlanoName.trim().toUpperCase().slice(0,2))||String.fromCharCode(65+Object.keys(planos).length);
    if(planos[key]){pushToast({type:"warning",text:`El plano "${key}" ya existe`});return;}
    const nuevo={nombre:`Plano ${key}`,color:"#8e8e93",ejercicios:[]};
    const upd={...planos,[key]:nuevo};
    savePlanos(upd);setPlanoSel(key);setEditMode(true);setAddingPlano(false);setNewPlanoName("");
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
      <RestTimer key={timerSecs.ts||0} seconds={timerSecs.secs} onClose={()=>setTimerSecs(null)}/>
    </div>}

    <div style={{marginBottom:12}}>
      <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",marginBottom:8}}>
        {Object.entries(planos).sort((a,b)=>a[0].localeCompare(b[0])).map(([k,p])=>(
          <div key={k} style={{display:"flex",alignItems:"center",gap:1,flexShrink:0}}>
            <button onClick={()=>{setPlanoSel(k);setSessionSaved({});setSeriesInputs({});setSessionRPE(null);setSessionNota("");}}
              style={{background:planoSel===k?C.card:C.surface,color:planoSel===k?C.text:C.textSub,border:`1px solid ${planoSel===k?C.text:C.border}`,borderRadius:8,padding:"6px 11px",cursor:"pointer",fontSize:12,fontWeight:planoSel===k?600:400,transition:"all 0.15s"}}>
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
             <button onClick={handleAddPlano} style={{background:C.text,border:`1px solid ${C.text}`,borderRadius:8,color:C.bg,padding:"6px 10px",cursor:"pointer",fontSize:12,fontWeight:600}}>+</button>
             <button onClick={()=>{setAddingPlano(false);setNewPlanoName("");}} style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:12}}>✕</button>
           </div>
          :<button onClick={quickAddPlano} style={{background:C.surface,border:`1px dashed ${C.border}`,borderRadius:8,color:C.textSub,padding:"6px 11px",cursor:"pointer",fontSize:12,fontWeight:400}}>+</button>
        }
      </div>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <SessionTimer timerId={`gym_${planoSel}`} color={plano.color} autoStart={autoStart} onStarted={()=>{onSessionStarted&&onSessionStarted();}}/>
        <button onClick={()=>setEditMode(e=>!e)} title="Editar el plan" style={{background:editMode?plano.color+"22":C.surface,color:editMode?plano.color:C.textSub,border:`1px solid ${editMode?plano.color+"55":C.border}`,borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:12,fontWeight:600}}>{editMode?"✓ Listo":"Editar"}</button>
      </div>
    </div>

    {doneCount>0&&!showSummary&&<div style={{marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
        <p style={{color:C.textSub,fontSize:12,margin:0}}>{doneCount}/{plano.ejercicios.length} ejercicios</p>
        {allDone&&<Btn onClick={()=>{setShowSummary(true);}} color={plano.color} style={{padding:"6px 12px",fontSize:11}}>Ver resumen →</Btn>}
      </div>
      <ProgressBar pct={(doneCount/Math.max(1,safeArr(plano.ejercicios).length))*100} color={plano.color} height={4}/>
    </div>}

    {/* RPE de sesión — only when session started */}
    {doneCount>0&&<div style={{marginBottom:12}}>
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

    {editMode&&<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16,marginBottom:12}}>
      <p style={{color:C.textMuted,fontSize:10,margin:"0 0 4px"}}>Nombre del plan</p>
      <input ref={planoNameRef} type="text" value={plano.nombre} onChange={e=>updatePlanoName(e.target.value)} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,padding:"6px 8px",width:"100%",boxSizing:"border-box",outline:"none",WebkitAppearance:"none",fontFamily:"inherit"}}/>
      <p style={{color:C.textMuted,fontSize:10,margin:"8px 0 0",lineHeight:1.4}}>Edita cada ejercicio abajo (nombre, series, reps, descanso) o usa "+ Añadir" al final. Pulsa "✓ Listo" cuando termines.</p>
    </div>}
    {safeArr(plano.ejercicios).map((ej,idx)=>{
      const hist=cargas[ej.id]||[];
      const lastLocal=hist[hist.length-1];
      const globalRef=!lastLocal?lastByName(ej.nombre,ej.id):null;
      const last=lastLocal||(globalRef&&globalRef.entry)||null;
      const lastFromOther=!lastLocal&&!!globalRef;
      const lastSets=normSets(last?.series);
      const objetivo=(()=>{ const ws=setWeights(last?.series); const base=ws.length?Math.max(...ws):safeNum(last?.kg,0); return base>0?base+2.5:null; })();
      const done=sessionSaved[ej.id];
      const sArr=seriesInputs[ej.id]||[];
      const filled=sArr.filter(o=>pkg(o&&o.kg)>0).length;
      const allFilled=filled>=ej.series;
      // PR inline: mejor peso histórico (excluye hoy y warm-ups) vs mejor introducido/guardado hoy
      const _prBestPrev=(()=>{ let m=0; safeArr(cargas[ej.id]).forEach(e=>{ if(e.fecha===today()) return; normSets(e.series).forEach(s=>{ if((s.type||"normal")!=="warmup"&&s.kg>m) m=s.kg; }); }); return m; })();
      const _prCur=done
        ? (()=>{ const t=safeArr(cargas[ej.id]).filter(e=>e.fecha===today()).slice(-1)[0]; const ws=t?normSets(t.series).filter(s=>(s.type||"normal")!=="warmup").map(s=>s.kg):[]; return ws.length?Math.max(...ws):0; })()
        : Math.max(0, ...sArr.map(o=>((o&&(o.type||"normal"))!=="warmup")?(pkg(o&&o.kg)||0):0));
      const isPR=_prBestPrev>0 && _prCur>_prBestPrev;
      // PR de volumen de set (kg×reps): solo cuando hay reps reales, excluye warm-ups y hoy
      const _volBestPrev=(()=>{ let m=0; safeArr(cargas[ej.id]).forEach(e=>{ if(e.fecha===today()) return; normSets(e.series).forEach(s=>{ if((s.type||"normal")!=="warmup"&&s.reps!=null){ const v=s.kg*s.reps; if(v>m) m=v; } }); }); return m; })();
      const _volCur=done
        ? (()=>{ const t=safeArr(cargas[ej.id]).filter(e=>e.fecha===today()).slice(-1)[0]; let m=0; if(t) normSets(t.series).forEach(s=>{ if((s.type||"normal")!=="warmup"&&s.reps!=null){ const v=s.kg*s.reps; if(v>m) m=v; } }); return m; })()
        : (()=>{ let m=0; safeArr(sArr).forEach(o=>{ if(o&&(o.type||"normal")!=="warmup"){ const kg=pkg(o.kg)||0; const r=parseInt(o.reps); if(!isNaN(r)&&r>0){ const v=kg*r; if(v>m) m=v; } } }); return m; })();
      const isVolPR=_volBestPrev>0 && _volCur>_volBestPrev && !isPR;

      return <div key={ej.id} ref={el=>{ejRefs.current[ej.id]=el;}} style={{background:done?C.text+"0d":C.card,border:`1px solid ${done?C.text+"35":C.border}`,borderLeft:ej.groupId?`3px solid ${ssColor(ej.groupId)}`:`1px solid ${done?C.text+"35":C.border}`,borderRadius:12,padding:16,marginBottom:12,transition:"all 0.2s"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
              {done&&<span style={{color:C.text,fontSize:14}}>✓</span>}
              <p style={{color:done?C.textSub:C.text,fontSize:14,fontWeight:600,margin:0}}>{ej.nombre}</p>
              {isPR?<Tag color={C.yellow}>PR</Tag>:isVolPR?<Tag color={C.yellow}>PR vol</Tag>:null}
              {ej.groupId&&<Tag color={ssColor(ej.groupId)}>SS {ej.groupId}</Tag>}
            </div>
            <p style={{color:C.textMuted,fontSize:11,margin:0}}>{ej.series} series · {ej.reps} reps · {ej.descanso}s</p>
            {(()=>{
              if(!last||done) return null;
              const prev2=hist.length>=2?hist[hist.length-2]:null;
              const trend=prev2?last.kg>prev2.kg?"↑":last.kg<prev2.kg?"↓":"=":null;
              const trendColor=trend==="↑"?C.green:trend==="↓"?C.red:C.textMuted;
              const d=new Date(last.fecha+"T00:00:00");
              const fmtDate=`${d.getDate()} ${["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"][d.getMonth()]}`;
              const setsPrev=normSets(last.series);
              return <p style={{color:C.textMuted,fontSize:11,margin:"2px 0 0"}}>
                Última: <span style={{color:C.textSub}}>{fmtDate}</span>{lastFromOther&&<span style={{color:C.textMuted}}> ({globalRef.planoName})</span>} · <span style={{color:plano.color,fontWeight:600}}>{last.kg}kg</span>{setsPrev.length>1&&<span style={{color:C.textMuted}}> · {setsPrev.map(fmtSet).join(" · ")}</span>}{trend&&<span style={{color:trendColor,fontWeight:700}}> {trend}</span>}
              </p>;
            })()}
          </div>
          <div style={{textAlign:"right"}}>
            {done?<p style={{color:C.text,fontSize:13,fontWeight:600,margin:0}}>{safeMax(done,0)}kg</p>:last?<p style={{color:C.textSub,fontSize:13,fontWeight:500,margin:0}}>{last.kg}kg</p>:null}
          </div>
        </div>

        {editMode&&<div style={{borderTop:`1px solid ${C.border}`,paddingTop:10,marginBottom:8}}>
          <p style={{color:C.textMuted,fontSize:10,margin:"0 0 4px"}}>Nombre del ejercicio</p>
          <Input type="text" value={ej.nombre} onChange={e=>updateEj(ej.id,{nombre:e.target.value})} style={{marginBottom:8}}/>
          <div style={{display:"flex",gap:6,marginBottom:10}}>
            <div style={{flex:1}}><p style={{color:C.textMuted,fontSize:10,margin:"0 0 4px"}}>Series</p><Input type="number" inputMode="numeric" value={ej.series} onChange={e=>updateEj(ej.id,{series:Math.max(0,parseInt(e.target.value)||0)})}/></div>
            <div style={{flex:1.2}}><p style={{color:C.textMuted,fontSize:10,margin:"0 0 4px"}}>Reps</p><Input type="text" value={ej.reps} onChange={e=>updateEj(ej.id,{reps:e.target.value})}/></div>
            <div style={{flex:1}}><p style={{color:C.textMuted,fontSize:10,margin:"0 0 4px"}}>Descanso (s)</p><Input type="number" inputMode="numeric" value={ej.descanso} onChange={e=>updateEj(ej.id,{descanso:Math.max(0,parseInt(e.target.value)||0)})}/></div>
          </div>
          <div style={{display:"flex",gap:6}}>
            <button onClick={()=>moveEj(planoSel,idx,-1)} disabled={idx===0} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.textSub,padding:"6px 12px",cursor:"pointer",fontSize:12,opacity:idx===0?0.3:1}}>↑</button>
            <button onClick={()=>moveEj(planoSel,idx,1)} disabled={idx===plano.ejercicios.length-1} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.textSub,padding:"6px 12px",cursor:"pointer",fontSize:12,opacity:idx===plano.ejercicios.length-1?0.3:1}}>↓</button>
            <button onClick={()=>updateEj(ej.id,{groupId:ssNextType(ej.groupId)||undefined})} title="Agrupar en superset (misma letra = mismo superset)" style={{background:ej.groupId?ssColor(ej.groupId)+"22":C.surface,border:`1px solid ${ej.groupId?ssColor(ej.groupId):C.border}`,borderRadius:8,color:ej.groupId?ssColor(ej.groupId):C.textSub,padding:"6px 12px",cursor:"pointer",fontSize:12,fontWeight:600}}>SS {ej.groupId||"–"}</button>
            <button onClick={()=>deleteEj(ej.id)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,color:C.textMuted,padding:"6px 12px",cursor:"pointer",fontSize:12,marginLeft:"auto"}}>Eliminar</button>
          </div>
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
          {!done&&normSets(last?.series).length>0&&sArr.filter(o=>pkg(o&&o.kg)>0).length===0&&(
            <button
              onClick={()=>setSeriesInputs(i=>({...i,[ej.id]:normSets(last.series).slice(0,ej.series).map(s=>({kg:String(s.kg),reps:s.reps!=null?String(s.reps):"",type:s.type||"normal"}))}))}
              style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.textSub,padding:"7px 12px",cursor:"pointer",fontSize:11,fontWeight:400,marginBottom:8,width:"100%"}}
            >
              ↩ Precargar últimos valores ({normSets(last.series).slice(0,ej.series).map(fmtSet).join(" · ")})
            </button>
          )}
          {(warmups[ej.id]&&warmups[ej.id].length>0)?<div style={{marginBottom:8}}>
            {warmups[ej.id].map((w,wi)=>{
              const updW=(patch)=>setWarmups(W=>({...W,[ej.id]:(W[ej.id]||[]).map((x,k)=>k===wi?{...x,...patch}:x)}));
              return <div key={"w"+wi} style={{display:"grid",gridTemplateColumns:"84px 30px minmax(0,1fr) auto 56px auto auto",gap:6,alignItems:"stretch",minHeight:36,marginBottom:6}}>
                <p style={{color:C.yellow,fontSize:11,margin:0,fontWeight:600,alignSelf:"center",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>W{wi+1}</p>
                <div style={{border:`1px solid ${C.yellow}`,color:C.yellow,borderRadius:8,alignSelf:"stretch",boxSizing:"border-box",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700}}>W</div>
                <input type="text" inputMode="decimal" value={w.kg} onChange={e=>updW({kg:e.target.value.replace(/[^0-9.,]/g,"")})} placeholder="kg" style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,padding:"0 8px",alignSelf:"stretch",width:"100%",minWidth:0,boxSizing:"border-box",outline:"none",WebkitAppearance:"none",fontFamily:"inherit"}}/>
                <span style={{color:C.textMuted,fontSize:10,alignSelf:"center"}}>kg</span>
                <input type="number" inputMode="numeric" value={w.reps} onChange={e=>updW({reps:e.target.value})} placeholder="reps" style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,padding:"0 8px",alignSelf:"stretch",width:"100%",boxSizing:"border-box",outline:"none",WebkitAppearance:"none",fontFamily:"inherit"}}/>
                <span style={{color:C.textMuted,fontSize:10,alignSelf:"center"}}>reps</span>
                <button onClick={()=>setWarmups(W=>({...W,[ej.id]:(W[ej.id]||[]).filter((_,k)=>k!==wi)}))} title="Quitar warm-up" style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,color:C.textMuted,alignSelf:"stretch",boxSizing:"border-box",display:"flex",alignItems:"center",justifyContent:"center",padding:"0 10px",cursor:"pointer",fontSize:13}}>✕</button>
              </div>;
            })}
          </div>:null}
          {(!warmups[ej.id]||warmups[ej.id].length===0)&&<button onClick={()=>{ const typedMax=Math.max(0,...(seriesInputs[ej.id]||[]).map(o=>pkg(o&&o.kg)||0)); const target=typedMax>0?typedMax:((last&&last.kg)?last.kg:0); setWarmups(W=>({...W,[ej.id]:WU_SCHEME.map(s=>({kg:target>0?String(roundKg(target*s.pct)):"",reps:String(s.reps),type:"warmup"}))})); if(target<=0) pushToast({text:"Sin peso objetivo: rellena las cargas de warm-up a mano"}); }} style={{background:C.surface,border:`1px dashed ${C.yellow}`,borderRadius:8,color:C.yellow,padding:"7px 12px",cursor:"pointer",fontSize:11,fontWeight:600,marginBottom:8,width:"100%"}}>+ Añadir warm-up sets</button>}
          <div style={{marginBottom:8}}>
            {Array.from({length:ej.series},(_,si)=>{
              const cur=sArr[si]||{kg:"",reps:"",type:"normal"};const confirmed=pkg(cur.kg)>0;const ref=lastSets[si];const tm=({normal:{ab:"N",c:C.textMuted},warmup:{ab:"W",c:C.yellow},drop:{ab:"D",c:C.purple},failure:{ab:"F",c:C.red}})[cur.type||"normal"];
              const setCur=(patch)=>{const a=[...(seriesInputs[ej.id]||[])];while(a.length<ej.series)a.push({kg:"",reps:"",type:"normal"});a[si]={...(a[si]||{kg:"",reps:"",type:"normal"}),...patch};setSeriesInputs(i=>({...i,[ej.id]:a}));};
              return <div key={si} style={{display:"grid",gridTemplateColumns:"84px 30px minmax(0,1fr) auto 56px auto auto",gap:6,alignItems:"stretch",minHeight:36,marginBottom:6}}>
                <p style={{color:C.textMuted,fontSize:11,margin:0,fontWeight:500,alignSelf:"center",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>S{si+1}{ref?<span style={{fontWeight:400}}> ({fmtSet(ref)})</span>:""}</p>
                <button onClick={()=>setCur({type:nextSetType(cur.type||"normal")})} title={"Tipo de serie: "+(cur.type||"normal")} style={{background:"transparent",border:`1px solid ${tm.c}`,color:tm.c,borderRadius:8,alignSelf:"stretch",boxSizing:"border-box",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,cursor:"pointer",padding:0}}>{tm.ab}</button>
                <input type="text" inputMode="decimal" value={cur.kg}
                  onChange={e=>setCur({kg:e.target.value.replace(/[^0-9.,]/g,"")})}
                  onKeyDown={e=>{if(e.key==="Enter"&&pkg(cur.kg)>0){e.preventDefault();confirmSet(ej,cur);}}}
                  placeholder={ref?`${ref.kg}`:"kg"} style={{background:confirmed?C.green+"18":C.surface,border:`1px solid ${confirmed?C.green+"55":C.border}`,borderRadius:8,color:C.text,padding:"0 8px",alignSelf:"stretch",width:"100%",minWidth:0,boxSizing:"border-box",outline:"none",WebkitAppearance:"none",fontFamily:"inherit"}}/>
                <span style={{color:C.textMuted,fontSize:10,alignSelf:"center"}}>kg</span>
                <input type="number" inputMode="numeric" value={cur.reps}
                  onChange={e=>setCur({reps:e.target.value})}
                  onKeyDown={e=>{if(e.key==="Enter"&&pkg(cur.kg)>0){e.preventDefault();confirmSet(ej,cur);}}}
                  placeholder={ref&&ref.reps!=null?`${ref.reps}`:"reps"} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,padding:"0 8px",alignSelf:"stretch",width:"100%",boxSizing:"border-box",outline:"none",WebkitAppearance:"none",fontFamily:"inherit"}}/>
                <span style={{color:C.textMuted,fontSize:10,alignSelf:"center"}}>reps</span>
                <button onClick={()=>{if(pkg(cur.kg)>0)confirmSet(ej,cur);}} title="Confirmar serie" style={{background:confirmed?C.green+"22":C.surface,border:`1px solid ${confirmed?C.green:C.border}`,borderRadius:8,color:confirmed?C.green:C.textMuted,alignSelf:"stretch",boxSizing:"border-box",display:"flex",alignItems:"center",justifyContent:"center",padding:"0 10px",cursor:"pointer",fontSize:13,fontWeight:700,opacity:confirmed?1:0.45}}>✓</button>
              </div>;
            })}
          </div>
          {/* Timer button inline — RestTimer shown as sticky overlay above */}
          <div style={{display:"flex",gap:8,marginBottom:6,alignItems:"center"}}>
            <Input type="text" value={notes[ej.id]||""} onChange={e=>setNotes(n=>({...n,[ej.id]:e.target.value}))} placeholder="Nota técnica..." style={{flex:1}}/>
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
function ScreenEntreno({initTab="gym",initPlanoKey=null,initEntTab="registro",autoStart=false,onSessionStarted}){
  const [entTab,setEntTab]=useState(initEntTab);
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
    <div style={{display:"flex",gap:0,marginBottom:12,background:C.bg,borderRadius:10,padding:3,border:`1px solid ${C.border}`}}>
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
             <Btn onClick={addTab} color={C.text} style={{padding:"7px 12px",fontSize:12}}>✓</Btn>
             <button onClick={()=>setShowAddTab(false)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,color:C.textMuted,padding:"7px 12px",cursor:"pointer",fontSize:12}}>✕</button>
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
    {medidas.length===0&&<p style={{color:C.textMuted,fontSize:12,textAlign:"center",padding:"14px 0",color:C.textMuted}}>Sin evaluaciones</p>}
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
  return <div style={{marginBottom:12}}>
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
    const np=getNutProfile();
    const meds=load(K.medidas)||[];
    const pw=meds.length?parseFloat(meds[0].peso)||70:70;
    const gf=meds.length?parseFloat(meds[0].grasa)||10:10;
    const isTrain=loadWeek()[(new Date().getDay()+6)%7]?.assignments?.length>0;
    const t=computeDailyNutTargets({weightKg:pw,bodyFatPct:gf,profile:np,training:isTrain});
    return {pt:t.pt,ht:t.ht,kcalObj:t.kcalObj,isTrainingToday:isTrain};
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

  return <Card style={{marginBottom:12}}>
    {/* Navigable header */}
    <button onClick={onNavigate} style={{width:"100%",background:"none",border:"none",cursor:onNavigate?"pointer":"default",display:"flex",justifyContent:"space-between",alignItems:"center",padding:0,marginBottom:10}}>
      <div style={{textAlign:"left"}}>
        <p style={{color:C.text,fontSize:13,fontWeight:600,margin:0}}>Nutrición</p>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        <p style={{color:C.textMuted,fontSize:11,margin:0}}>{kcalObj} kcal/día</p>
        {onNavigate&&<span style={{color:C.textMuted,fontSize:14}}>›</span>}
      </div>
    </button>

    {/* Yesterday low protein — contextual, sober */}

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


function ScreenHoyMerged({onEmpezar,onGoToNutricion,onGoToSemana,onGoToFisico,onGoToComidas,onGoToPlan}){
  const [showSleep,setShowSleep]=useState(false);
  // V5: onboarding (solo instalaciones nuevas / app vacía; no afecta a usuarios con datos)
  const [onboard,setOnboard]=useState(()=>shouldShowOnboarding());
  const [onbGoal,setOnbGoal]=useState(()=>{ const s=load(K.nutGoal); return (s&&NUTRITION_GOALS[s])?s:DEFAULT_NUTRITION_GOAL_ID; });
  const [onbTpl,setOnbTpl]=useState(()=>getSelectedTrainingTemplateId());
  const onbSetGoal=(id)=>{ if(!NUTRITION_GOALS[id]) return; save(K.nutGoal,id); setOnbGoal(id); pushToast({type:"success", text:`Objetivo: ${getNutritionGoalLabel(id)}`}); };
  const onbSetTpl=(id)=>{ if(!TRAINING_TEMPLATES[id]) return; save(K.trainingTemplate,id); setOnbTpl(id); pushToast({type:"success", text:`Plantilla: ${getTrainingTemplateLabel(id)}`}); };
  const onbFinish=()=>{ dismissOnboarding(); setOnboard(false); pushToast({type:"success", text:"¡Listo!"}); };
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
    return !(last3[2].kg>last3[0].kg)&&!(setWeights(last3[2].series).reduce((a,v)=>a+v,0)>setWeights(last3[0].series).reduce((a,v)=>a+v,0));
  }).map(([id])=>allGymEjs.find(e=>e.id===id)).filter(Boolean).slice(0,1),[todayDate]);

  const yd=new Date();yd.setDate(yd.getDate()-1);
  const ydStr=`${yd.getFullYear()}-${String(yd.getMonth()+1).padStart(2,"0")}-${String(yd.getDate()).padStart(2,"0")}`;
  const ydSessions=getTrainedSessions(ydStr);
  const [sleepToday,setSleepToday]=useState(()=>(load(K.proteinLog)||{})[todayDate+"_sleep"]||{});
  function saveSleepFromHoy(upd){setSleepToday(upd);const all=load(K.proteinLog)||{};all[todayDate+"_sleep"]=upd;save(K.proteinLog,all);}

  // Ayer protein
  const ydProtLog=(load(K.proteinLog)||{})[ydStr]||[];
  const ydProt=ydProtLog.reduce((a,e)=>a+(e.prot||0),0);
  const pw=load(K.medidas)?.length?parseFloat(load(K.medidas)[0].peso)||70:70;
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


    {onboard && <Card style={{marginBottom:12}}>
      <p style={{color:C.textMuted,fontSize:10,margin:"0 0 4px",textTransform:"uppercase",letterSpacing:1.2}}>Bienvenido</p>
      <p style={{color:C.textSub,fontSize:12,margin:"0 0 10px",lineHeight:1.4}}>Configura lo básico para empezar. Puedes cambiarlo cuando quieras.</p>
      <p style={{color:C.text,fontSize:11,fontWeight:600,margin:"0 0 5px"}}>Objetivo</p>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
        {getNutritionGoalOptions().map(o=>{ const a=o.id===onbGoal; return <button key={o.id} onClick={()=>onbSetGoal(o.id)} style={{background:"transparent",color:a?C.text:C.textSub,border:`1px solid ${a?C.text:C.border}`,borderRadius:8,padding:"6px 12px",fontSize:11,fontWeight:a?600:500,cursor:"pointer"}}>{o.label}</button>; })}
      </div>
      <p style={{color:C.text,fontSize:11,fontWeight:600,margin:"0 0 5px"}}>Plantilla base</p>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
        {getTrainingTemplates().map(t=>{ const a=t.id===onbTpl; return <button key={t.id} onClick={()=>onbSetTpl(t.id)} style={{background:"transparent",color:a?C.text:C.textSub,border:`1px solid ${a?C.text:C.border}`,borderRadius:8,padding:"6px 12px",fontSize:11,fontWeight:a?600:500,cursor:"pointer"}}>{t.label}</button>; })}
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        <Btn onClick={onGoToNutricion} outline style={{padding:"6px 12px",fontSize:11}}>Completar perfil</Btn>
        <Btn onClick={onbFinish} outline style={{padding:"6px 12px",fontSize:11}}>Empezar</Btn>
      </div>
    </Card>}
    {/* SUEÑO — primera tarjeta, ancho completo, accionable */}
    {(()=>{const d=dayState[0];return <button onClick={()=>setShowSleep(s=>!s)} style={{width:"100%",background:showSleep?C.card:C.surface,border:`1px solid ${showSleep?C.text:C.border}`,borderRadius:12,padding:"12px 14px",textAlign:"left",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:showSleep?8:12}}>
      <div>
        <p style={{color:C.text,fontSize:13,fontWeight:600,margin:"0 0 3px"}}>{d.label}</p>
        <p style={{color:d.val==="—"?C.textMuted:C.text,fontSize:11,margin:0}}>{d.val==="—"?"Toca para registrar tu descanso":d.val}</p>
      </div>
      <span style={{color:C.textMuted,fontSize:11,transform:`rotate(${showSleep?180:0}deg)`,transition:"transform 0.2s",display:"inline-block"}}>▼</span>
    </button>;})()}
    {showSleep&&<SuenoHoy sleepData={sleepToday} onSave={saveSleepFromHoy} onCollapse={()=>setShowSleep(false)}/>}

    {/* ENTRENAMIENTO */}
    <Card style={{marginBottom:12}}>
      <button onClick={onGoToPlan} style={{width:"100%",background:"none",border:"none",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",padding:0,marginBottom:10}}>
        <p style={{color:C.text,fontSize:13,fontWeight:600,margin:0}}>Entrenamiento</p>
        <span style={{color:C.textMuted,fontSize:14}}>›</span>
      </button>
      {todayAssignments.length===0?(
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:36,height:36,borderRadius:10,background:C.text+"12",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,color:C.textMuted}}>—</div>
          <div>
            <p style={{color:C.text,fontSize:14,fontWeight:600,margin:0,letterSpacing:-0.3}}>Día de descanso</p>
            <p style={{color:C.textMuted,fontSize:11,margin:0}}>Recuperación activa — parte del proceso</p>
          </div>
        </div>
      ):(
        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
          {todayAssignments.map((a,i)=>{
            const label=getAssignmentLabel(a);
            const done=a.tabId==="gym"?todaySessions.find(s=>s.planoKey===a.planoKey):todaySessions.find(s=>s.tabId===a.tabId);
            return <button key={i} onClick={()=>onEmpezar(a.tabId,a.planoKey)} style={{background:done?C.text+"0d":C.surface,border:`1px solid ${done?C.green:C.border}`,borderRadius:10,padding:"10px 14px",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:7}}>
              {done&&<span style={{color:C.green,fontSize:12}}>✓</span>}
              <span style={{color:C.text,fontSize:13,fontWeight:600,letterSpacing:-0.2}}>{label}</span>
            </button>;
          })}
        </div>
      )}
    </Card>

    {/* NUTRICIÓN */}
    <NutricionHoy onNavigate={onGoToNutricion} ydProtPct={ydProtPct}/>
    <div style={{height:1,background:C.border,margin:"12px 0"}}/>

    {/* PROGRESO — resumen compacto (entreno + nutrición), enlaza a la pestaña Progreso */}
    {(()=>{
      const rv=buildWeeklyReview();
      const stat=(label,val)=>(<div key={label} style={{flex:1,textAlign:"center"}}>
        <p style={{color:C.text,fontSize:15,fontWeight:600,margin:"0 0 2px",letterSpacing:-0.3}}>{val}</p>
        <p style={{color:C.textMuted,fontSize:10,margin:0}}>{label}</p>
      </div>);
      return <Card style={{marginBottom:12}}>
        <button onClick={onGoToSemana} style={{width:"100%",background:"none",border:"none",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",padding:0,marginBottom:10}}>
          <p style={{color:C.text,fontSize:13,fontWeight:600,margin:0}}>Progreso</p>
          <span style={{color:C.textMuted,fontSize:14}}>›</span>
        </button>
        <div style={{display:"flex",gap:4}}>
          {stat("Sesiones", `${rv.completedSessions}/${rv.plannedSessions}`)}
          {stat("Adherencia", `${rv.adherencePct}%`)}
          {stat("RPE medio", rv.avgRPE||"—")}
          {stat("Proteína", `${rv.proteinDaysHit}/7`)}
        </div>
      </Card>;
    })()}
    {/* ACTIVE ALERT — dismissible */}
    {activeAlert&&<div style={{background:C.surface,border:`1px solid ${C.border}`,borderLeft:`2px solid ${activeAlert.color}`,borderRadius:8,padding:"7px 12px",marginBottom:10,display:"flex",gap:8,alignItems:"center"}}>
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
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
      <button onClick={()=>{setMesOffset(o=>o-1);setSelectedDay(null);}} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,color:C.text,padding:"6px 14px",cursor:"pointer",fontSize:14}}>‹</button>
      <p style={{color:C.text,fontSize:14,fontWeight:600,margin:0,textTransform:"capitalize"}}>{mesNombre}</p>
      <button onClick={()=>{setMesOffset(o=>o+1);setSelectedDay(null);}} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,color:C.text,padding:"6px 14px",cursor:"pointer",fontSize:14}}>›</button>
    </div>

    {/* Month stats */}
    <div style={{display:"flex",gap:6,marginBottom:12}}>
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
    <Card style={{marginBottom:12}}>
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
          <p style={{color:C.textMuted,fontSize:12,margin:0}}>Sin sesiones</p>
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
    <div style={{display:"flex",gap:0,marginBottom:12,background:C.bg,borderRadius:10,padding:3,border:`1px solid ${C.border}`}}>
      {[["semana","Semana"],["historial","Mes"],["cuerpo","Físico"]].map(([id,label])=>(
        <button key={id} onClick={()=>setProTab(id)} style={{flex:1,background:proTab===id?C.card:"transparent",color:proTab===id?C.text:C.textMuted,border:proTab===id?`1px solid ${C.border}`:"1px solid transparent",borderRadius:8,padding:"7px 4px",fontSize:11,fontWeight:proTab===id?600:400,cursor:"pointer",transition:"all 0.12s",letterSpacing:proTab===id?-0.1:0}}>{label}</button>
      ))}
    </div>
    {proTab==="semana"&&<ProgresoSemana/>}
    {proTab==="cuerpo"&&<ProgresoCuerpo/>}
    {proTab==="historial"&&<ScreenCalendario/>}
  </div>;
}

// ── V4: helpers de presentación (puros, SOLO UI). No tocan lógica ni storage. ──
function v4ActionLabel(area, action){
  const a=String(action||"").trim();
  const M={
    training:{ keep:"Mantener plan", simplify:"Reducir carga", reduce:"Semana de descarga", deload:"Semana de descarga", increase:"Subir carga", rebalance:"Redistribuir semana" },
    nutrition:{ keep:"Mantener nutrición", increase_protein:"Subir proteína", increase_kcal:"Subir calorías", stabilize_kcal:"Estabilizar calorías", tighten:"Ordenar comidas", simplify_meals:"Ordenar comidas" },
    shopping:{ none:"Sin cambios", top_up_protein:"Añadir proteína", top_up_basics:"Reponer básicos", refresh_from_meal_plan:"Actualizar según plan" },
  };
  const byArea=M[area]||{};
  if(byArea[a]) return byArea[a];
  if(!a) return "—";
  const clean=a.replace(/_/g," ");
  return clean.charAt(0).toUpperCase()+clean.slice(1);
}

function v4ProposalHeadline(proposal){
  if(!proposal) return "Sin propuesta disponible.";
  const t=proposal.training&&proposal.training.action;
  const n=proposal.nutrition&&proposal.nutrition.action;
  const s=proposal.shopping&&proposal.shopping.action;
  const tMap={ simplify:"reducir carga", reduce:"semana de descarga", deload:"semana de descarga", increase:"subir carga", rebalance:"redistribuir la semana" };
  const nMap={ increase_protein:"reforzar proteína", increase_kcal:"subir calorías", stabilize_kcal:"ajustar calorías", tighten:"ordenar comidas", simplify_meals:"ordenar comidas" };
  const sMap={ top_up_protein:"añadir proteína a la compra", top_up_basics:"reponer básicos", refresh_from_meal_plan:"ajustar la compra" };
  const parts=[];
  if(t&&tMap[t]) parts.push(tMap[t]);
  if(n&&nMap[n]) parts.push(nMap[n]);
  if(s&&sMap[s]) parts.push(sMap[s]);
  let body;
  if(!parts.length) body="mantener el plan actual";
  else if(parts.length===1) body=parts[0];
  else body=parts.slice(0,-1).join(", ")+" y "+parts[parts.length-1];
  return "Propuesta para la próxima semana: "+body+".";
}

function v4ReviewLine(review){
  if(!review) return "Sin datos de la semana.";
  const td=safeNum(review.trainedDays,0), pd=safeNum(review.proteinDaysHit,0), kd=safeNum(review.kcalDaysHit,0);
  let line=`Esta semana: ${td} ${td===1?"día entrenado":"días entrenados"}, ${pd}/7 días de proteína y ${kd}/7 días de calorías.`;
  const rpe=safeNum(review.avgRPE,0);
  if(rpe>0) line+=` RPE medio ${rpe}.`;
  return line;
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
  const pw=load(K.medidas)?.length?parseFloat(load(K.medidas)[0].peso)||70:70;
  const gf=load(K.medidas)?.length?parseFloat(load(K.medidas)[0].grasa)||10:10;
  const np=getNutProfile();
  const _nt=computeDailyNutTargets({weightKg:pw,bodyFatPct:gf,profile:np,training:false});
  const pt=_nt.pt;
  const kcalObj=_nt.kcalObj;
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
  // ── V4: estado + acciones de propuesta semanal (UI mínima) ──
  const [v4, setV4] = useState(()=>({ review: load(K.weeklyReview), proposal: load(K.weeklyProposal) }));
  const [v4Confirm, setV4Confirm] = useState(null);
  const [v4Mode, setV4Mode] = useState("idle"); // "idle" | "decide" (decisión tras generar)
  const v4Reload = () => setV4({ review: load(K.weeklyReview), proposal: load(K.weeklyProposal) });
  const v4Generate = () => { persistWeeklyArtifacts(); v4Reload(); setV4Mode("decide"); pushToast({type:"success", text:"Propuesta lista · revisa y elige qué aplicar"}); };
  const v4RunApply = (opts, okMsg) => {
    const prop = load(K.weeklyProposal)?.proposal;
    if(!prop){ pushToast({type:"warning", text:"Genera la propuesta primero"}); return; }
    const r = applyWeeklyProposal(prop, opts);
    v4Reload();
    if(r && r.applied && !r.applied.training && !r.applied.nutrition && !r.applied.shopping){
      pushToast({type:"warning", text:"Propuesta vacía: nada que aplicar"});
    } else {
      pushToast({type:"success", text: okMsg || (r&&r.summary) || "Propuesta aplicada"});
    }
  };
  // Modo de compra según lo que decidió el motor (sin botón aparte): refresh→reemplazar, top_up→añadir, none→sin cambios
  const v4ShoppingMode = (prop) => { const a=prop&&prop.shopping&&prop.shopping.action; if(!a||a==="none") return "none"; return a==="refresh_from_meal_plan"?"replace":"add"; };
  const v4ApplyAll = () => { const prop=load(K.weeklyProposal)?.proposal; const sm=v4ShoppingMode(prop); v4RunApply({applyTraining:true,applyNutrition:true,applyShopping:sm!=="none",replaceShopping:sm==="replace"}, "Aplicado: semana, comidas y compra"); setV4Mode("idle"); };
  const v4ApplyWeek = () => { v4RunApply({applyTraining:true,applyNutrition:false,applyShopping:false}, "Aplicado: solo la semana"); setV4Mode("idle"); };
  const v4ApplyMeals = () => { v4RunApply({applyTraining:false,applyNutrition:true,applyShopping:false}, "Aplicado: solo las comidas"); setV4Mode("idle"); };
  const v4Discard = () => { setV4Mode("idle"); pushToast({type:"info", text:"Propuesta descartada · no se aplicó nada"}); };
  const v4Undo = () => setV4Confirm({ msg:"Esto revertirá la última propuesta aplicada: tu semana, tus comidas y tu lista de compra volverán a como estaban justo antes de aplicarla. ¿Continuar?", onConfirm:()=>{ setV4Confirm(null); const r=revertLastWeeklyProposal(); v4Reload(); pushToast((r&&r.ok)?{type:"success",text:"Última aplicación deshecha"}:{type:"warning",text:"No hay ninguna aplicación reciente que deshacer"}); } });
  // Propuesta siempre VIGENTE: firma de los inputs reales del motor. Si cambian (al abrir la
  // pantalla o tras registrar entrenos/proteína/medidas, o tras aplicar), se regenera sola.
  const v4Sig = JSON.stringify([
    today(),
    load(K.cargas), load(K.rpe), load(K.proteinLog),
    load(K.medidas), load(K.mealPlan), load(K.shopping),
    load(K.nutProfile), load(K.nutGoal), load(K.planWeek),
  ]);
  useEffect(()=>{ persistWeeklyArtifacts(); v4Reload(); }, [v4Sig]); // invalida+regenera; no toca el backup de "Deshacer"

  return <div>
    {/* ── V4: Propuesta semanal (UI mínima, solo lectura + acciones) ── */}
    <Card style={{marginBottom:12}}>
      <p style={{color:C.textMuted,fontSize:10,margin:"0 0 7px",textTransform:"uppercase",letterSpacing:1.2}}>Propuesta semanal</p>
      {(()=>{
        const art=v4.proposal;
        const rev=(art&&art.review)||(v4.review&&v4.review.review);
        const prop=art&&art.proposal;
        if(!rev&&!prop) return <p style={{color:C.textSub,fontSize:12,margin:"0 0 10px",lineHeight:1.4}}>Una propuesta analiza tu última semana (adherencia, RPE, proteína y PRs) y sugiere ajustes en tu plan de entreno, comidas y lista de compra. Genérala para revisarla antes de aplicar nada.</p>;
        const savedAt=String((art&&art.savedAt)||(v4.review&&v4.review.savedAt)||"").replace("T"," ").slice(0,16);
        const refDate=(art&&art.referenceDate)||(v4.review&&v4.review.referenceDate)||(rev&&rev.referenceDate);
        return <div style={{marginBottom:10}}>
          <p style={{color:C.textSub,fontSize:11,margin:"0 0 6px"}}>Semana ref: {refDate||"—"}{savedAt?` · guardada ${savedAt}`:""}</p>
          {prop&&<p style={{color:C.text,fontSize:12,fontWeight:600,margin:0,lineHeight:1.35}}>{v4ProposalHeadline(prop)}</p>}
        </div>;
      })()}
      {v4Mode!=="decide" && (()=>{
        const hasProp=v4.proposal&&v4.proposal.proposal;
        return <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
          {hasProp
            ? <Btn onClick={()=>setV4Mode("decide")} outline style={{padding:"6px 11px",fontSize:11}}>Aplicar propuesta</Btn>
            : <Btn onClick={v4Generate} outline style={{padding:"6px 11px",fontSize:11}}>Generar propuesta</Btn>}
          {load(K.weeklyProposalBackup)&&<Btn onClick={v4Undo} outline style={{padding:"6px 11px",fontSize:11}}>Deshacer última aplicación</Btn>}
        </div>;
      })()}
      {v4Mode==="decide" && (()=>{
        const prop=load(K.weeklyProposal)?.proposal;
        if(!prop) return <p style={{color:C.textSub,fontSize:12,margin:0}}>Genera una propuesta primero.</p>;
        const sm=v4ShoppingMode(prop);
        const shopTxt=sm==="replace"?"se reemplazará tu lista de compra por la del plan":sm==="add"?"se añadirán productos a tu lista de compra":"tu lista de compra no cambia";
        return <div style={{borderTop:`1px solid ${C.border}`,marginTop:4,paddingTop:10}}>
          <p style={{color:C.text,fontSize:12,fontWeight:600,margin:"0 0 6px"}}>¿Qué quieres aplicar?</p>
          <p style={{color:C.textSub,fontSize:11,margin:"0 0 10px",lineHeight:1.5}}>Si confirmas, se actualizará tu plan:<br/>· <b>Semana</b>: {v4ActionLabel("training",prop.training&&prop.training.action)}<br/>· <b>Comidas</b>: {v4ActionLabel("nutrition",prop.nutrition&&prop.nutrition.action)}<br/>· <b>Compra</b>: {shopTxt}.</p>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            <Btn onClick={v4ApplyAll} color={C.text} style={{justifyContent:"center",fontSize:12,padding:"9px"}}>Aplicar semana + comidas + compra</Btn>
            <div style={{display:"flex",gap:6}}>
              <Btn onClick={v4ApplyWeek} outline style={{flex:1,justifyContent:"center",fontSize:11}}>Solo semana</Btn>
              <Btn onClick={v4ApplyMeals} outline style={{flex:1,justifyContent:"center",fontSize:11}}>Solo comidas</Btn>
            </div>
            <button onClick={v4Discard} style={{background:"none",border:"none",color:C.textMuted,fontSize:11,padding:"6px",cursor:"pointer"}}>Cancelar</button>
          </div>
        </div>;
      })()}
    </Card>
    {v4Confirm && <ConfirmDialog msg={v4Confirm.msg} onConfirm={v4Confirm.onConfirm} onCancel={()=>setV4Confirm(null)}/>}
    {/* ── RESUMEN: ENTRENAMIENTO ── */}
    <SectionLabel>Entrenamiento</SectionLabel>
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

      return <Card style={{marginBottom:12}}>
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

        {/* Comparativa semana anterior — solo RPE (sesiones arriba; proteína en Nutrición) */}
        {avgRPE>0&&<div style={{display:"flex",gap:12,flexWrap:"wrap",paddingTop:conclusion||recos.length>0?8:0,borderTop:conclusion||recos.length>0?`1px solid ${C.border}`:"none"}}>
          {[
            {label:"RPE medio",cur:rpe.toFixed(1),prev:prevRpe||null,unit:"/10",up:false},
          ].map(({label,cur,prev,unit,up})=>(
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
        </div>}
      </Card>;
    })()}

    {volEntries.length>0&&<Card style={{marginBottom:12}}>
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
    {/* ── RESUMEN: NUTRICIÓN ── */}
    <SectionLabel>Nutrición</SectionLabel>
    <Card style={{marginBottom:12}}>
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

  </div>;
}

function ProgresoCuerpo(){
  const [objectives,setObjectives]=useState(()=>loadObjectives());
  function saveObjectives(upd){setObjectives(upd);save(K.objectives,upd);}
  const [profile,setProfile]=useState(()=>getNutProfile());
  function saveProfile(upd){setProfile(upd);save(K.nutProfile,upd);}
  const medidas=safeArr(load(K.medidas));
  const [editNutProfile,setEditNutProfile]=useState(false);
  const ACT_SHORT={1.2:"Sedentario",1.375:"Ligero",1.55:"Moderado",1.725:"Activo",1.9:"Muy activo"};
  const actLabel=ACT_SHORT[profile.actividad]||"—";
  const ultimaMedida=medidas.length?medidas[0]:null;
  const pesoActual=safeNum(ultimaMedida?.peso,70);
  const pesoInicial=medidas.length>1?safeNum(medidas[medidas.length-1]?.peso,pesoActual):pesoActual;
  const grasaActual=safeNum(ultimaMedida?.grasa,10);
  const BMR=Math.round(10*pesoActual+6.25*profile.altura-5*profile.edad+5);
  const TDEE=Math.round(BMR*profile.actividad);
  // FUENTE DE VERDAD ÚNICA: mismos targets que Hoy y Nutrición (respeta objetivo K.nutGoal + día de entreno).
  const _goalId=(load(K.nutGoal)&&NUTRITION_GOALS[load(K.nutGoal)])?load(K.nutGoal):DEFAULT_NUTRITION_GOAL_ID;
  const _goalCfg=getNutritionGoalConfig();
  const goalLabel=getNutritionGoalLabel(_goalId);
  const _isTrainToday=(loadWeek()[(new Date().getDay()+6)%7]?.assignments?.length||0)>0;
  const _tgt=computeDailyNutTargets({weightKg:pesoActual,bodyFatPct:grasaActual,profile,training:_isTrainToday});
  const surplusExtra=computeKcalSurcharge(grasaActual,_goalCfg);
  const surplus=_tgt.kcalObj;            // = TDEE + ajuste objetivo + (día entreno?150:0)
  const proteinTarget=_tgt.pt;
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
    {/* Latest body metrics */}
    {ultimaMedida&&<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12}}>
      {[["Peso",ultimaMedida.peso,"kg"],["Grasa",ultimaMedida.grasa,"%"],["Masa magra",ultimaMedida.masaMagra,"kg"]].map(([l,v,u])=>(
        <Card key={l} style={{padding:"12px 8px",textAlign:"center"}}>
          <p style={{color:C.text,fontSize:13,fontWeight:600,margin:"0 0 5px"}}>{l}</p>
          <p style={{color:C.text,fontSize:18,fontWeight:700,margin:0,letterSpacing:-0.5}}>{v||"—"}<span style={{color:C.textMuted,fontSize:11,fontWeight:400}}>{v?u:""}</span></p>
        </Card>
      ))}
    </div>}

    <MedidasPanel/>
    <Card style={{marginTop:12}}>
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
          <button key={val} onClick={()=>saveProfile({...profile,actividad:val})} style={{display:"block",width:"100%",background:profile.actividad===val?C.card:C.surface,color:profile.actividad===val?C.text:C.textSub,border:`1px solid ${C.border}`,borderRadius:8,padding:"7px 12px",cursor:"pointer",fontSize:11,textAlign:"left",fontWeight:profile.actividad===val?600:400,marginBottom:4}}>{profile.actividad===val?"✓ ":""}{label}</button>
        ))}
      </>}
    </Card>    <div style={{marginBottom:12}}>
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
    {gainRate!==null?<Card style={{marginBottom:12}}>
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
    </Card>:<Card style={{marginBottom:12}}>
      <p style={{color:C.text,fontSize:13,fontWeight:600,margin:"0 0 8px"}}>Velocidad de ganancia</p>
      <p style={{color:C.textMuted,fontSize:12,margin:0}}>Añade 2+ evaluaciones para ver tu ritmo.</p>
    </Card>}
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16,marginBottom:12}}>
      <p style={{color:C.text,fontSize:13,fontWeight:600,margin:"0 0 6px"}}>{goalLabel} · {grasaActual}% grasa</p>
      <p style={{color:C.text,fontSize:18,fontWeight:700,margin:"8px 0 2px"}}>{surplus} kcal/día</p>
      <p style={{color:C.textMuted,fontSize:11,margin:"0 0 14px"}}>TDEE {TDEE} {surplusExtra>=0?`+ ${surplusExtra}`:`− ${Math.abs(surplusExtra)}`} ({goalLabel}){_isTrainToday?` · +150 entreno`:``} · {pesoActual}kg</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
        {[["Proteínas",proteinTarget+"g"],["Carbohidratos",carbTarget+"g"],["Grasas",fatTarget+"g"]].map(([l,v])=>(
          <div key={l} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 6px",textAlign:"center"}}>
            <p style={{color:C.text,fontSize:13,fontWeight:600,margin:"0 0 5px"}}>{l}</p>
            <p style={{color:C.text,fontSize:16,fontWeight:700,margin:0}}>{v}</p>
          </div>
        ))}
      </div>
    </div>


  </div>;
}

function ProgresoPlantificar(){
  const [weekPlan,setWeekPlan]=useState(()=>loadWeek());
  const [confirmClearWeek,setConfirmClearWeek]=useState(false);
  const [templates,setTemplates]=useState(()=>load("pg_week_tpl")||[]);
  const [showTpl,setShowTpl]=useState(false);
  // V5: selección de plantilla (preferencia) + aplicación explícita con confirmación
  const [v5Tpl,setV5Tpl]=useState(()=>getSelectedTrainingTemplateId());
  const [v5TplConfirm,setV5TplConfirm]=useState(null);
  const [v5Mode,setV5Mode]=useState("idle"); // "idle" | "decide" (patrón Semana)
  const v5SelectTpl=(id)=>{ if(!TRAINING_TEMPLATES[id]) return; save(K.trainingTemplate,id); setV5Tpl(id); };
  const v5Generate=()=>{ setV5Mode("decide"); };
  const v5Apply=()=>{ const r=applyTrainingTemplateById(v5Tpl); setWeekPlan(r.week); setV5Mode("idle"); pushToast({type:"success", text:`Plan aplicado: ${r.label}`}); };
  const v5Discard=()=>{ setV5Mode("idle"); };
  const v5AskUndo=()=>{ setV5TplConfirm({ msg:"Esto revertirá la última plantilla aplicada: tu semana y tus planos volverán a como estaban justo antes de aplicarla. ¿Continuar?", onConfirm:()=>{ setV5TplConfirm(null); const r=revertLastTrainingTemplateApply(); if(r&&r.ok){ setWeekPlan(loadWeek()); pushToast({type:"success", text:"Última aplicación deshecha"}); } else { pushToast({type:"warning", text:"No hay nada que deshacer"}); } } }); };
  const tabs=loadTabs();
  const gymPlanos=loadGymPlanos();
  const dayNames=["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
  function saveWeek(upd){setWeekPlan(upd);save(K.planWeek,upd);}
  function clearWeek(){const empty={};for(let d=0;d<7;d++)empty[d]={assignments:[]};saveWeek(empty);setConfirmClearWeek(false);pushToast({type:"success",text:"Semana vaciada"});}
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
    pushToast({type:"success",text:"Plantilla cargada"});
  }
  const allTabOptions=[
    {tabId:"gym",label:" Gym A",planoKey:"A"},{tabId:"gym",label:" Gym B",planoKey:"B"},{tabId:"gym",label:" Gym C",planoKey:"C"},
    ...tabs.filter(t=>t.type!=="gym").map(t=>({tabId:t.id,label:`${t.icon} ${t.name}`,planoKey:null})),
  ];
  return <div>
    {/* ── V5: plantilla de entrenamiento (selector de preferencia + aplicar explícito) ── */}
    <Card style={{marginBottom:12}}>
      <p style={{color:C.textMuted,fontSize:10,margin:"0 0 7px",textTransform:"uppercase",letterSpacing:1.2}}>Plan de entrenamiento</p>
      {v5Mode!=="decide" ? <>
        <p style={{color:C.textSub,fontSize:11,margin:"0 0 10px",lineHeight:1.45}}>Genera una propuesta de plan a partir de una plantilla base. Podrás revisar qué cambia antes de aplicar nada.</p>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
          <Btn onClick={v5Generate} outline style={{padding:"6px 12px",fontSize:11}}>Generar plan de entrenamiento</Btn>
          {load(K.trainingTemplateBackup)&&<Btn onClick={v5AskUndo} outline style={{padding:"6px 12px",fontSize:11}}>Deshacer última aplicación</Btn>}
        </div>
      </> : <>
        <p style={{color:C.text,fontSize:12,fontWeight:600,margin:"0 0 6px"}}>Elige una plantilla base</p>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
          {getTrainingTemplates().map(t=>{
            const active=t.id===v5Tpl;
            return <button key={t.id} onClick={()=>v5SelectTpl(t.id)} style={{background:"transparent",color:active?C.text:C.textSub,border:`1px solid ${active?C.text:C.border}`,borderRadius:8,padding:"6px 12px",fontSize:11,fontWeight:active?600:500,cursor:"pointer"}}>{t.label}</button>;
          })}
        </div>
        <p style={{color:C.textSub,fontSize:11,margin:"0 0 10px",lineHeight:1.5}}>Si aplicas «{getTrainingTemplateLabel(v5Tpl)}», se reemplazará:<br/>· <b>Tu semana</b> (días y asignaciones de entreno)<br/>· <b>Tus planos de gimnasio</b> (A/B/C)<br/>Tu plan actual se sustituirá por esta plantilla.</p>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          <Btn onClick={v5Apply} color={C.text} style={{justifyContent:"center",fontSize:12,padding:"9px"}}>Aplicar plan</Btn>
          <button onClick={v5Discard} style={{background:"none",border:"none",color:C.textMuted,fontSize:11,padding:"6px",cursor:"pointer"}}>Cancelar</button>
        </div>
      </>}
    </Card>
    {v5TplConfirm && <ConfirmDialog msg={v5TplConfirm.msg} onConfirm={v5TplConfirm.onConfirm} onCancel={()=>setV5TplConfirm(null)}/>}
    {/* Template controls */}
    <div style={{display:"flex",gap:8,marginBottom:12,alignItems:"center"}}>
      <p style={{color:C.text,fontSize:13,fontWeight:600,margin:0,flex:1}}>Planificar semana</p>
      <button onClick={handleSaveTemplate} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.textSub,padding:"6px 12px",cursor:"pointer",fontSize:11,fontWeight:500}}>Guardar plan</button>
      <button onClick={()=>{confirmClearWeek?clearWeek():setConfirmClearWeek(true);}} style={{background:confirmClearWeek?C.text+"22":"none",border:`1px solid ${confirmClearWeek?C.text:C.border}`,borderRadius:8,color:C.text,padding:"6px 12px",cursor:"pointer",fontSize:11,fontWeight:500,whiteSpace:"nowrap"}}>{confirmClearWeek?"¿Seguro?":"Limpiar semana"}</button>
      {templates.length>0&&<button onClick={()=>setShowTpl(s=>!s)} style={{background:showTpl?C.text+"22":C.surface,border:`1px solid ${showTpl?C.text:C.border}`,borderRadius:8,color:showTpl?C.text:C.textSub,padding:"6px 12px",cursor:"pointer",fontSize:11,fontWeight:500}}> {templates.length}</button>}
    </div>
    {showTpl&&<div style={{background:C.surface,borderRadius:12,padding:12,marginBottom:12}}>
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
  // V5: objetivo nutricional (saved-first; default compatible si no hay nada guardado)
  const [nutGoalId,setNutGoalId]=useState(()=>{ const s=load(K.nutGoal); return (s&&NUTRITION_GOALS[s])?s:DEFAULT_NUTRITION_GOAL_ID; });
  const setGoal=(id)=>{ if(!NUTRITION_GOALS[id]) return; save(K.nutGoal,id); setNutGoalId(id); pushToast({type:"success", text:`Objetivo: ${getNutritionGoalLabel(id)} · kcal del día recalculadas`}); };
  const [newSupName,setNewSupName]=useState("");
  const [newSupDose,setNewSupDose]=useState("");
  const [newSupIsProtein,setNewSupIsProtein]=useState(false);
  const [newSupProtGrams,setNewSupProtGrams]=useState("");
  const [addingSup,setAddingSup]=useState(false);
  const [expandedDays,setExpandedDays]=useState({[((new Date().getDay()+6)%7)]:true});
  const [expandedSugs,setExpandedSugs]=useState(()=>({[`${(new Date().getDay()+6)%7}_${currentMealIdx()}`]:true}));
  const [confirmClearWeek,setConfirmClearWeek]=useState(false);
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
  function clearMeal(di,mi){const upd={...mealPlan};const ms=[...((upd[di]?.meals)||MEAL_TYPES.map(t=>({t,desc:"",prot:"",kcal:""})))];ms[mi]={...ms[mi],desc:"",prot:"",kcal:""};upd[di]={...upd[di],meals:ms};saveMealPlan(upd);}
  function clearDay(di){const upd={...mealPlan};upd[di]={...upd[di],meals:MEAL_TYPES.map(t=>({t,desc:"",prot:"",kcal:""}))};saveMealPlan(upd);}
  function clearWeek(){saveMealPlan(JSON.parse(JSON.stringify(MEAL_PLAN_SEED)));setConfirmClearWeek(false);pushToast({type:"success",text:"Plan semanal vaciado"});}
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
    pushToast({type:"success",text:"Plan cargado"});
  }
  // Saved shopping lists — same lightweight pattern, reusing the shopping item format.
  function saveShopLists(upd){setShopLists(upd);save("pg_shop_lists",upd);}
  function handleSaveShopList(){
    if(shopping.length===0){pushToast({type:"info",text:"Lista vacía."});return;}
    const name=shopListName.trim()||`Lista ${today()}`;
    const lst={id:"slist_"+Date.now(),saved:today(),label:name,items:JSON.parse(JSON.stringify(shopping))};
    saveShopLists([lst,...shopLists].slice(0,8));
    setShopListName("");setSavingShop(false);
    pushToast({type:"success",text:"Lista guardada"});
  }
  function handleLoadShopList(lst){
    saveShopping(JSON.parse(JSON.stringify(lst.items)));
    setShowShopLists(false);
    pushToast({type:"success",text:"Lista cargada"});
  }
  // ── Lightweight, deterministic suggestion ranking + labels ──
  // Considers meal moment (type), training/rest for the day, protein still
  // needed today, and variety vs the rest of the week. Only the top pick of a
  // slot is labelled, to orient without badge spam.
  function currentMealIdx(){const h=new Date().getHours();return h<11?0:h<13?1:h<16?2:h<19?3:4;}
  // At most one label per slot, and each label kept rare so they orient rather than decorate:
  //  · "Mejor ahora"  → only the slot matching the current time of day, today.
  //  · "Post-entreno"      → only the main post-training meal (Comida) on training days.
  //  · "Alta proteína"/"Ligera" → only a genuinely standout top pick.
  function sugLabelFor(s,idx,isNowSlot,trainingDay,behindProtein,mt){
    if(idx!==0) return null;
    if(isNowSlot&&(trainingDay||behindProtein)) return "Mejor ahora";
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
        .map((s,i)=>({...s,_label:i===0?"Cierra macros":null}));
    } else {
      list=rankMealSugs(mt,todayDow,nowIdx);
    }
    const eatenToday=(intakeLog||[]).map(e=>(e.name||"").toLowerCase());
    const items=list.filter(s=>!eatenToday.some(n=>n.includes(s.name.toLowerCase()))).slice(0,2);
    return {mt,items};
  }
  function quickAddRec(s){
    saveIntakeLog([...intakeLog,{name:s.name,prot:s.prot,kcal:s.kcal,time:new Date().toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"})}]);
    pushToast({type:"success",text:`Registrado · ${s.prot}g · ${s.kcal} kcal`});
  }
  function saveShopping(upd){setShopping(upd);save(K.shopping,upd);}
  function saveRecipes(upd){setRecipes(upd);save(K.recipes,upd);}
  function toggleRecipeFav(id){const upd=recipeFavs.includes(id)?recipeFavs.filter(x=>x!==id):[...recipeFavs,id];setRecipeFavs(upd);save("pg_rec_favs",upd);}
  const allRecipes=[...MEAL_SUGGESTIONS.map(r=>({...r,id:"seed_"+r.name,seed:true})),...recipes];
  // Surface practical recipes first: favorites, then most-used in the plan, then original order.
  const recipeUsage={};
  Object.values(mealPlan||{}).forEach(d=>safeArr(d?.meals).forEach(m=>{const n=(m?.desc||"").trim().toLowerCase();if(n)recipeUsage[n]=(recipeUsage[n]||0)+1;}));
  const nowMt=["Desayuno","Media mañana","Comida","Merienda","Cena"][currentMealIdx()];
  const orderedRecipes=allRecipes.map((r,i)=>({r,i})).sort((a,b)=>{
    const fa=recipeFavs.includes(a.r.id)?1:0,fb=recipeFavs.includes(b.r.id)?1:0;
    if(fb!==fa) return fb-fa;
    const ua=recipeUsage[a.r.name.toLowerCase()]||0,ub=recipeUsage[b.r.name.toLowerCase()]||0;
    if(ub!==ua) return ub-ua;
    const ra=a.r.type===nowMt?1:0,rb=b.r.type===nowMt?1:0;
    if(rb!==ra) return rb-ra;
    return a.i-b.i;
  }).map(x=>x.r);
  const recipesToShow=favOnly?orderedRecipes.filter(r=>recipeFavs.includes(r.id)):orderedRecipes;
  const topNowId=(recipesToShow.find(r=>r.type===nowMt)||{}).id;
  function findRecipe(name){const n=(name||"").trim().toLowerCase();return n?allRecipes.find(r=>r.name.toLowerCase()===n):null;}
  function openRecipeView(name){setOpenRecipeName(name);setNutTab("recetas");}
  const recInputStyle={WebkitAppearance:"none",fontFamily:"inherit",width:"100%",boxSizing:"border-box",background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,color:C.text,padding:"7px 9px",outline:"none"};
  function addRecipeToShopping(recipe){
    const inList=(name)=>{const n=name.toLowerCase();return (shopping||[]).some(s=>{const e=(s.name||"").toLowerCase();return e===n||e.includes(n)||n.includes(e);});};
    let idSeed=Date.now();
    const items=(recipe.ing||[]).filter(ig=>!inList(ig.name)).map(ig=>({id:`r_${++idSeed}_${ig.name}`,name:ig.name,cat:ig.cat||"otros",done:false}));
    if(items.length===0){pushToast({type:"info",text:"Ya están en tu lista."});return;}
    saveShopping([...(shopping||[]),...items]);
    pushToast({type:"success",text:`${items.length} ingrediente${items.length>1?"s":""} a la compra`});
  }
  function catForIngredient(name){
    const n=(name||"").toLowerCase(); const has=a=>a.some(w=>n.includes(w));
    if(has(["pollo","pavo","atún","atun","salmón","salmon","merluza","carne","ternera","huevo","clara","pescado","gamba","lomo","jamón","jamon","whey","proteína","proteina","tofu","seitán","seitan"])) return "proteina";
    if(has(["leche","yogur","queso","requesón","requeson","kéfir","kefir","cuajada","nata"])) return "lacteos";
    if(has(["arroz","pasta","pan","avena","patata","boniato","quinoa","cuscús","cuscus","cereal","granola","harina","tostada"])) return "carbos";
    if(has(["lenteja","garbanzo","alubia","judía","judia","soja","guisante"])) return "legumbres";
    if(has(["verdura","lechuga","tomate","espinaca","brócoli","brocoli","calabacín","calabacin","pimiento","cebolla","zanahoria","aguacate","ensalada","champiñón","champinon","pepino","ajo"])) return "verduras";
    if(has(["plátano","platano","manzana","fresa","frutos rojos","fruta","naranja","arándano","arandano","kiwi","pera","uva","mango"])) return "frutas";
    if(has(["aceite","sal ","pimienta","miel","especia","salsa","vinagre","mostaza","canela"])) return "condimentos";
    return "otros";
  }
  function addManualRecipe(){
    const name=recName.trim();if(!name)return;
    const ing=recIng.split(",").map(s=>s.trim()).filter(Boolean).map(s=>({name:s,cat:catForIngredient(s)}));
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
      if(kcal<=0&&prot<=0){pushToast({type:"info",text:"Añade kcal o proteína para registrarla."});return;}
      updated=[...dayLog,{name:`${MEAL_TYPES[mi]||meal.t||""}: ${meal.desc}`,prot,kcal,time:new Date().toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"}),mealId:id}];
      pushToast({type:"success",text:`Registrado · ${prot}g · ${kcal} kcal`});
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
    const np=getNutProfile();
    const meds=load(K.medidas)||[];
    const pw=meds.length?parseFloat(meds[0].peso)||70:70;
    const gf=meds.length?parseFloat(meds[0].grasa)||10:10;
    const isTrainingToday=loadWeek()[(new Date().getDay()+6)%7]?.assignments?.length>0;
    const t=computeDailyNutTargets({weightKg:pw,bodyFatPct:gf,profile:np,training:isTrainingToday});
    const {pt,ht,kcalObj}=t;
    return {pt,ht,kcalObj,isTrainingToday};
  },[nutGoalId]);

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

  // Acepta la sugerencia "Ahora": fija la comida del slot actual (ej. Cena) en el plan de HOY.
  function acceptSugToPlan(s){
    if(!s) return;
    const idx=currentMealIdx();
    const plan=JSON.parse(JSON.stringify(mealPlan||{}));
    if(!plan[todayDow]||typeof plan[todayDow]!=="object") plan[todayDow]={meals:[]};
    if(!Array.isArray(plan[todayDow].meals)) plan[todayDow].meals=[];
    while(plan[todayDow].meals.length<=idx) plan[todayDow].meals.push({desc:"",prot:0,kcal:0});
    plan[todayDow].meals[idx]={...plan[todayDow].meals[idx],desc:s.name,prot:s.prot,kcal:s.kcal};
    saveMealPlan(plan);
    pushToast({type:"success",text:`Añadido al plan de hoy · ${MEAL_TYPES[idx]}: ${s.name}`});
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
    <div style={{display:"flex",gap:0,marginBottom:12,background:C.bg,borderRadius:10,padding:3,border:`1px solid ${C.border}`}}>
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

      {/* Sugerencia contextual — "qué encaja ahora" (solo la mejor; al pulsar va al plan de hoy) */}
      {(()=>{
        const recs=nutRecommendations();
        const best=recs.items[0];
        const _sidx=currentMealIdx();
        const _scur=(mealPlan?.[todayDow]?.meals||[])[_sidx];
        const _slotFilled=!!(_scur&&typeof _scur.desc==="string"&&_scur.desc.trim());
        const hide=!best||_slotFilled||(totalProt>=pt&&_sidx===4);
        if(hide) return null;
        const protGap=Math.max(0,Math.round(pt-totalProt));
        const trainToday=safeArr(loadWeek()[todayDow]?.assignments).length>0;
        return <Card style={{marginBottom:12}}>
          <p style={{margin:"0 0 8px",fontSize:11,lineHeight:1.35}}><span style={{color:C.textMuted,textTransform:"uppercase",letterSpacing:1.2,fontSize:10}}>Ahora · {recs.mt}</span>{(trainToday||protGap>0)&&<span style={{color:C.text,fontWeight:600}}> — {trainToday?"entreno":""}{trainToday&&protGap>0?", ":""}{protGap>0?`faltan ${protGap}g de proteína`:""}</span>}</p>
          <button onClick={()=>acceptSugToPlan(best)} style={{width:"100%",background:C.text+"14",border:`1px solid ${C.text}`,borderRadius:8,padding:"10px 12px",cursor:"pointer",textAlign:"left",lineHeight:1.3}}>
            <span style={{color:C.text,fontSize:13,fontWeight:600,display:"block"}}>{best.name}</span>
            <span style={{color:C.textMuted,fontSize:10}}>{best.prot}g proteína · {best.kcal} kcal</span>
            <span style={{display:"block",marginTop:4,color:C.textSub,fontSize:10}}>Toca para fijarlo como tu {recs.mt.toLowerCase()} en el plan de hoy</span>
          </button>
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
                <button onClick={()=>clearMeal(todayDow,meal._idx)} aria-label="Eliminar comida" style={{background:"none",border:"none",cursor:"pointer",padding:"2px 0 2px 4px",color:C.textMuted,fontSize:12,flexShrink:0,lineHeight:1}}>✕</button>
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
              <button onClick={()=>saveIntakeLog(intakeLog.filter(e=>e.mealId!==undefined))} aria-label="Limpiar registro manual" style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:12,padding:0,lineHeight:1}}>✕</button>}
            <button onClick={()=>setShowManual(s=>!s)}
              style={{background:"none",border:`1px solid ${showManual?C.text:C.border}`,color:showManual?C.text:C.textSub,borderRadius:6,padding:"3px 10px",cursor:"pointer",fontSize:10,fontWeight:500}}>+ Añadir</button>
          </div>
        </div>

        {showManual&&<div style={{background:C.surface,borderRadius:8,padding:"10px",marginBottom:8}}>
          <input value={manualName} onChange={e=>setManualName(e.target.value)} placeholder="Nombre (ej: Pollo + arroz)"
            style={{WebkitAppearance:"none",fontFamily:"inherit",width:"100%",boxSizing:"border-box",background:C.bg,border:`1px solid ${C.border}`,borderRadius:6,color:C.text,padding:"7px 12px",outline:"none",marginBottom:8}}/>
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
              style={{background:"none",border:`1px solid ${C.border}`,borderRadius:6,color:C.textMuted,padding:"7px 12px",cursor:"pointer",fontSize:12}}>✕</button>
          </div>
        </div>}

        {intakeLog.filter(e=>e.mealId===undefined).length===0
          ?<p style={{color:C.textMuted,fontSize:11,margin:0}}>Sin entradas hoy</p>
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
          {hydration>0&&<button onClick={()=>saveHydration(0)} aria-label="Vaciar agua" style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:12,padding:"0 4px",lineHeight:1,flexShrink:0}}>✕</button>}
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
                 style={{background:"none",border:`1px solid ${C.border}`,borderRadius:6,color:C.textMuted,padding:"7px 12px",cursor:"pointer",fontSize:12}}>✕</button>
             </div>
           </div>
          :<button onClick={()=>setAddingSup(true)}
             style={{marginTop:6,background:"none",border:`1px solid ${C.border}`,color:C.textSub,borderRadius:6,padding:"3px 10px",cursor:"pointer",fontSize:10,fontWeight:500}}>+ Añadir suplemento</button>
        }
      </Card>
    </div>}

    {/* ── PLAN — weekly meal planning with prot/kcal per meal ── */}
    {nutTab==="plan"&&<div>
      {/* Plan nutricional — al inicio de Plan */}
      <Card style={{marginBottom:12}}>
        <p style={{color:C.textMuted,fontSize:10,margin:"0 0 7px",textTransform:"uppercase",letterSpacing:1.2}}>Plan nutricional</p>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {getNutritionGoalOptions().map(o=>{
            const active=o.id===nutGoalId;
            return <button key={o.id} onClick={()=>setGoal(o.id)} style={{
              background:"transparent",
              color: active?C.text:C.textSub,
              border:`1px solid ${active?C.text:C.border}`,
              borderRadius:8, padding:"6px 12px", fontSize:11, fontWeight:active?600:500, cursor:"pointer",
            }}>{o.label}</button>;
          })}
        </div>
        <p style={{color:C.textSub,fontSize:11,margin:"9px 0 0",lineHeight:1.45}}>
          {({gain:"Superávit calórico para ganar masa muscular.",maintain:"Calorías de mantenimiento para conservar tu peso.",cut:"Déficit calórico para perder grasa."})[nutGoalId]||""}
          <span style={{color:C.textMuted}}> Tu objetivo diario: {kcalObj} kcal · {pt}g proteína.</span>
        </p>
      </Card>

      {/* Saved weekly meal plans */}
      <div style={{display:"flex",gap:6,marginBottom:10,alignItems:"center"}}>
        <p style={{color:C.text,fontSize:13,fontWeight:600,margin:0,flex:1}}>Planificar semana</p>
        <button onClick={()=>setSavingTpl(v=>!v)} style={{background:savingTpl?C.text+"22":C.surface,border:`1px solid ${savingTpl?C.text:C.border}`,borderRadius:8,color:C.textSub,padding:"5px 11px",cursor:"pointer",fontSize:11,fontWeight:500}}>Guardar plan</button>
        {mealTemplates.length>0&&<button onClick={()=>setShowMealTpl(s=>!s)} style={{background:showMealTpl?C.text+"22":C.surface,border:`1px solid ${showMealTpl?C.text:C.border}`,borderRadius:8,color:C.textSub,padding:"5px 11px",cursor:"pointer",fontSize:11,fontWeight:500}}>Guardados ({mealTemplates.length})</button>}
        <button onClick={()=>{confirmClearWeek?clearWeek():setConfirmClearWeek(true);}} style={{background:confirmClearWeek?C.text+"22":"none",border:`1px solid ${confirmClearWeek?C.text:C.border}`,borderRadius:8,color:C.text,padding:"5px 11px",cursor:"pointer",fontSize:11,fontWeight:500,whiteSpace:"nowrap"}}>{confirmClearWeek?"¿Seguro?":"Limpiar semana"}</button>
      </div>
      {savingTpl&&<div style={{display:"flex",gap:6,marginBottom:12}}>
        <input value={tplName} onChange={e=>setTplName(e.target.value)} placeholder="Nombre del plan" style={{...recInputStyle,flex:1}}/>
        <button onClick={handleSaveMealTemplate} style={{background:C.text,color:C.bg,border:"none",borderRadius:8,padding:"0 16px",cursor:"pointer",fontSize:12,fontWeight:600,whiteSpace:"nowrap"}}>Guardar</button>
      </div>}
      {showMealTpl&&mealTemplates.length>0&&<div style={{background:C.surface,borderRadius:12,padding:12,marginBottom:12}}>
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
      {orderedDays.map((di)=>{
        const isToday=di===todayDow;
        const isExpanded=expandedDays[di]!==undefined?expandedDays[di]:isToday;
        const meals=mealPlan[di]?.meals||[];
        const filledCount=meals.filter(m=>m?.desc?.trim()).length;
        return <div key={di} style={{marginBottom:6}}>
          <button onClick={()=>setExpandedDays(p=>({...p,[di]:!isExpanded}))}
            style={{width:"100%",background:isToday?C.card:C.surface,border:`1px solid ${isToday?C.text+"44":C.border}`,borderRadius:8,padding:"7px 12px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",textAlign:"left"}}>
            <p style={{color:C.text,fontSize:12,fontWeight:isToday?600:400,margin:0}}>{dayNames[di]}{isToday&&<span style={{color:C.text,fontSize:10,fontWeight:700,marginLeft:6}}>HOY</span>}</p>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              {filledCount>0&&<p style={{color:C.textMuted,fontSize:10,margin:0}}>{filledCount}/{MEAL_TYPES.length}</p>}
              <span style={{color:C.textMuted,fontSize:10,display:"inline-block",transform:isExpanded?"rotate(180deg)":"none",transition:"transform 0.15s"}}>▼</span>
            </div>
          </button>
          {isExpanded&&<div style={{background:C.card,border:`1px solid ${C.border}`,borderTopWidth:0,borderRadius:"0 0 8px 8px",padding:"7px 12px"}}>
            {MEAL_TYPES.map((mt,mi)=>{
              const m=(mealPlan[di]?.meals||[])[mi]||{};
              const isEmptyMeal=!m.desc?.trim();
              const mealSugs=rankMealSugs(mt,di,mi);
              return <div key={mi} style={{marginBottom:8}}>
                <p style={{color:C.textMuted,fontSize:10,margin:"0 0 3px",textTransform:"uppercase",letterSpacing:1.2}}>{mt}</p>
                {isEmptyMeal&&mealSugs.length>0&&<div style={{marginBottom:5}}>
                  <button onClick={()=>setExpandedSugs(p=>({...p,[`${di}_${mi}`]:!p[`${di}_${mi}`]}))} style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:10,padding:"0 0 4px",display:"flex",alignItems:"center",gap:4}}>
                    <span style={{display:"inline-block",transform:expandedSugs[`${di}_${mi}`]?"rotate(180deg)":"none",transition:"transform 0.15s"}}>▼</span>Sugerencias ({mealSugs.length})
                  </button>
                  {expandedSugs[`${di}_${mi}`]&&<div>
                  {mealSugs.map((s,si)=>(
                    <button key={s.name} onClick={()=>{const upd={...mealPlan};const ms=[...((upd[di]?.meals)||MEAL_TYPES.map(t=>({t,desc:"",prot:"",kcal:""})))];ms[mi]={...ms[mi],desc:s.name,prot:s.prot,kcal:s.kcal};upd[di]={...upd[di],meals:ms};saveMealPlan(upd);}}
                      style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",gap:8,width:"100%",background:si===0?C.text+"0d":"none",border:"none",borderBottom:`1px solid ${C.border}`,padding:"6px 6px",cursor:"pointer",textAlign:"left"}}>
                      <span style={{color:C.text,fontSize:11,fontWeight:si===0?600:400,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name}{si===0&&s._label?<span style={{marginLeft:6,color:C.textSub,fontSize:8,fontWeight:600,letterSpacing:0.3,textTransform:"uppercase"}}>{s._label}</span>:null}</span>
                      <span style={{color:C.textMuted,fontSize:9,flexShrink:0}}>{s.prot}g · {s.kcal} kcal</span>
                    </button>
                  ))}
                  </div>}
                </div>}
                <input type="text" value={m.desc||""} onChange={e=>{const upd={...mealPlan};const ms=[...((upd[di]?.meals)||MEAL_TYPES.map(t=>({t,desc:"",prot:"",kcal:""})))];ms[mi]={...ms[mi],desc:e.target.value};upd[di]={...upd[di],meals:ms};saveMealPlan(upd);}}
                  placeholder="Descripción…" style={{WebkitAppearance:"none",fontFamily:"inherit",width:"100%",boxSizing:"border-box",background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,color:C.text,padding:"5px 7px",outline:"none",marginBottom:4}}/>
                <div style={{display:"flex",gap:5}}>
                  <input type="number" inputMode="numeric" value={m.prot||""} onChange={e=>{const upd={...mealPlan};const ms=[...((upd[di]?.meals)||MEAL_TYPES.map(t=>({t,desc:"",prot:"",kcal:""})))];ms[mi]={...ms[mi],prot:e.target.value};upd[di]={...upd[di],meals:ms};saveMealPlan(upd);}}
                    placeholder="Prot g" style={{WebkitAppearance:"none",fontFamily:"inherit",flex:1,minWidth:0,background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,color:C.text,padding:"4px 6px",outline:"none"}}/>
                  <input type="number" inputMode="numeric" value={m.kcal||""} onChange={e=>{const upd={...mealPlan};const ms=[...((upd[di]?.meals)||MEAL_TYPES.map(t=>({t,desc:"",prot:"",kcal:""})))];ms[mi]={...ms[mi],kcal:e.target.value};upd[di]={...upd[di],meals:ms};saveMealPlan(upd);}}
                    placeholder="Kcal" style={{WebkitAppearance:"none",fontFamily:"inherit",flex:1,minWidth:0,background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,color:C.text,padding:"4px 6px",outline:"none"}}/>
                </div>
                {!isEmptyMeal&&<div style={{textAlign:"right",marginTop:3}}><button onClick={()=>clearMeal(di,mi)} aria-label="Limpiar comida" style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:12,padding:0,lineHeight:1}}>✕</button></div>}
              </div>;
            })}
            <div style={{textAlign:"right",marginTop:2}}><button onClick={()=>clearDay(di)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:6,color:C.textMuted,cursor:"pointer",fontSize:10,padding:"4px 10px"}}>Limpiar día</button></div>
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
          <textarea value={recNotes} onChange={e=>setRecNotes(e.target.value)} placeholder="Preparación / notas (opcional)" style={{...recInputStyle,minHeight:50,resize:"vertical"}}/>
          <button onClick={addManualRecipe} style={{background:C.text,color:C.bg,border:"none",borderRadius:8,fontSize:12,fontWeight:600,padding:"9px 14px",cursor:"pointer",marginTop:8,width:"100%"}}>Guardar receta</button>
        </div>}
      </div>
      {recipesToShow.length===0&&<p style={{color:C.textMuted,fontSize:11,textAlign:"center",padding:"14px 0"}}>Sin favoritas aún.</p>}
      {recipesToShow.map(r=>{
        const isOpen=openRecipeName===r.name;
        const fav=recipeFavs.includes(r.id);
        return <div key={r.id} style={{marginBottom:6}}>
          <div style={{display:"flex",alignItems:"stretch",gap:6}}>
            <button onClick={()=>setOpenRecipeName(isOpen?null:r.name)} style={{flex:1,minWidth:0,background:isOpen?C.card:C.surface,border:`1px solid ${isOpen?C.text:C.border}`,borderRadius:8,padding:"7px 12px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{textAlign:"left",minWidth:0}}>
                <p style={{color:C.text,fontSize:12,fontWeight:500,margin:"0 0 2px"}}>{r.name} <span style={{fontSize:8,color:C.textMuted,border:`1px solid ${C.border}`,borderRadius:4,padding:"1px 4px",marginLeft:2,textTransform:"uppercase",letterSpacing:0.3,verticalAlign:"middle",whiteSpace:"nowrap"}}>{r.seed?"Sugerida":"Propia"}</span>{r.id===topNowId&&<span style={{fontSize:8,color:C.text,border:`1px solid ${C.text}`,borderRadius:4,padding:"1px 4px",marginLeft:4,textTransform:"uppercase",letterSpacing:0.3,verticalAlign:"middle",whiteSpace:"nowrap"}}>Ahora</span>}</p>
                <p style={{color:C.textMuted,fontSize:10,margin:0}}>{r.type} · {r.kcal} kcal · {r.prot}g prot{(recipeUsage[r.name.toLowerCase()]||0)>0?` · usada ${recipeUsage[r.name.toLowerCase()]}×`:""}</p>
              </div>
              <span style={{color:C.textMuted,fontSize:10,marginLeft:8,flexShrink:0,display:"inline-block",transition:"transform 0.15s",transform:isOpen?"rotate(180deg)":"none"}}>▼</span>
            </button>
            <button onClick={()=>toggleRecipeFav(r.id)} style={{background:"none",border:`1px solid ${fav?C.text:C.border}`,borderRadius:8,padding:"0 12px",cursor:"pointer",color:fav?C.text:C.textMuted,fontSize:14,flexShrink:0}}>{fav?"★":"☆"}</button>
          </div>
          {isOpen&&<div style={{background:C.card,border:`1px solid ${C.border}`,borderTopWidth:0,borderRadius:"0 0 8px 8px",padding:"10px 12px"}}>
            {r.ing&&r.ing.length>0&&<>
              <p style={{color:C.textMuted,fontSize:10,margin:"0 0 4px",textTransform:"uppercase",letterSpacing:1.2}}>Ingredientes</p>
              <div style={{margin:"0 0 10px"}}>{r.ing.map((i,k)=><p key={k} style={{color:C.text,fontSize:12,margin:"0 0 2px",lineHeight:1.4}}>{i.qty?<span style={{color:C.textMuted}}>{i.qty} · </span>:null}{i.name}</p>)}</div>
            </>}
            {((r.steps&&r.steps.length)||r.notes)&&<>
              <p style={{color:C.textMuted,fontSize:10,margin:"0 0 4px",textTransform:"uppercase",letterSpacing:1.2}}>Preparación</p>
              {r.steps&&r.steps.length?<div style={{margin:"0 0 10px"}}>{r.steps.map((st,k)=><p key={k} style={{color:C.textSub,fontSize:12,margin:"0 0 3px",lineHeight:1.45}}><span style={{color:C.textMuted}}>{k+1}. </span>{st}</p>)}</div>:<p style={{color:C.textSub,fontSize:12,margin:"0 0 10px",lineHeight:1.5}}>{r.notes}</p>}
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
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"7px 12px",marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
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
        {shopping.length===0&&<p style={{color:C.textMuted,fontSize:12,textAlign:"center",padding:"16px 0",lineHeight:1.4}}>Tu lista está vacía. Añade productos arriba, o genérala desde tu plan de comidas.</p>}
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
  const [confirmReset,setConfirmReset]=useState(false);
  const [mode,setMode]=useState(null);        // "paste" | "file" | null
  const [pending,setPending]=useState(null);   // import pendiente de confirmar
  const [exportText,setExportText]=useState(null); // JSON listo a exportar (vista fiable)
  const fileRef=useRef(null);
  const exportRef=useRef(null);

  // ── EXPORT: prepara el JSON y lo MUESTRA siempre (no depende de descarga invisible) ──
  function handleExport(){
    try{
      const payload=exportData();
      const keyCount=Object.keys(payload).length;
      if(keyCount===0){ pushToast({type:"warning",text:"No hay datos que exportar todavía."}); return; }
      const envelope={ app:APP_SLUG, version:3, exportedAt:today(), payload };
      setExportText(JSON.stringify(envelope,null,2));
      setMode(null);
      pushToast({type:"success",text:`Backup listo · ${keyCount} registros`});
    }catch(e){ pushToast({type:"error",text:"No se pudo preparar el backup."}); }
  }
  async function shareExport(){
    const fname=`${APP_SLUG}-${today()}.json`;
    try{
      if(typeof navigator!=="undefined" && navigator.canShare && typeof File!=="undefined"){
        const file=new File([exportText],fname,{type:"application/json"});
        if(navigator.canShare({files:[file]})){ await navigator.share({files:[file],title:fname}); return; }
      }
      if(typeof navigator!=="undefined" && navigator.share){ await navigator.share({title:fname,text:exportText}); return; }
      pushToast({type:"warning",text:"Compartir no disponible aquí — usa Copiar."});
    }catch(e){ /* cancelado o no permitido: no es error */ }
  }
  async function copyExport(){
    try{
      if(typeof navigator!=="undefined" && navigator.clipboard && navigator.clipboard.writeText){
        await navigator.clipboard.writeText(exportText);
        pushToast({type:"success",text:"JSON copiado al portapapeles"}); return;
      }
      throw new Error("no-clipboard");
    }catch(e){
      try{ const ta=exportRef.current; if(ta){ ta.focus(); ta.select(); document.execCommand("copy"); pushToast({type:"success",text:"JSON copiado"}); return; } }catch(e2){}
      pushToast({type:"warning",text:"Selecciona el texto y cópialo manualmente."});
    }
  }
  function downloadExport(){
    try{
      const blob=new Blob([exportText],{type:"application/json"});
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a");
      a.href=url; a.download=`${APP_SLUG}-${today()}.json`;
      document.body.appendChild(a); a.click();
      setTimeout(()=>{ try{ document.body.removeChild(a); URL.revokeObjectURL(url); }catch(e){} }, 1500);
      pushToast({type:"success",text:"Descarga iniciada (si el navegador lo permite)."});
    }catch(e){ pushToast({type:"error",text:"No se pudo descargar."}); }
  }

  // ── IMPORT (sin cambios de lógica) ──
  const IMPORT_ERR={ read_error:"No se pudo leer el archivo.", empty:"El archivo está vacío.", parse_error:"El archivo no es JSON válido.", no_data:"Estructura no compatible — el archivo no es de esta app.", empty_data:"El archivo no contiene datos reconocibles." };
  function stageResult(res){ if(res.ok) setPending(res); else pushToast({type:"error",text:IMPORT_ERR[res.reason]||"No se pudo importar el archivo."}); }
  function handlePasteImport(){
    if(!jsonText.trim()){ pushToast({type:"warning",text:"El campo está vacío. Pega tu JSON primero."}); return; }
    stageResult(parseBackup(jsonText));
  }
  function handleFileImport(e){
    const file=e.target.files?.[0];
    if(!file) return;
    if(!file.name.endsWith(".json")){ pushToast({type:"error",text:"El archivo debe ser un .json exportado desde esta app."}); return; }
    importData(file, stageResult);
  }
  function confirmImport(){
    const n=applyBackup(pending.entries);          // escribe storage (allowlist)
    setPending(null); setMode(null); setJsonText(""); setExportText(null);
    bumpDataVersion();                              // remonta el contenido → relee storage (sin recargar la app)
    if(typeof onClose==="function") onClose();      // cierra el panel de datos
    pushToast({type:"success",duration:4000,text:`Importados ${n} registros`});
  }

  // Borra TODOS los datos locales de la app conservando solo la preferencia de tema.
  function clearAllAppData(){
    const KEEP=new Set(["pg_theme"]);
    const del=new Set();
    try{ Object.values(K).forEach(k=>del.add(k)); }catch(e){}
    del.add("pg_sup_done");
    try{ safeArr(loadTabs()).forEach(t=>{ if(t&&t.id){ del.add(tabEjKey(t.id)); del.add(tabDataKey(t.id)); } }); }catch(e){}
    // Barrido por prefijo de la app (cubre tabs antiguas y restos). Seguro: solo claves "pg_*".
    try{ for(let i=localStorage.length-1;i>=0;i--){ const k=localStorage.key(i); if(k&&k.indexOf("pg_")===0) del.add(k); } }catch(e){}
    del.forEach(k=>{ if(!KEEP.has(k)){ try{ localStorage.removeItem(k); }catch(e){} } });
  }
  function doClearAll(){
    clearAllAppData();
    setConfirmReset(false);
    pushToast({type:"success", text:"Todos los datos borrados. Empiezas de cero."});
    bumpDataVersion();                         // refresco equivalente al de importar (UI relee storage limpio)
    if(typeof onClose==="function") onClose();
  }

  return <div style={{maxWidth:500,margin:"8px auto 0",background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
      <p style={{color:C.text,fontSize:14,fontWeight:600,margin:0}}>Ajustes · Datos</p>
      <button onClick={onClose} style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:14,padding:0}}>✕</button>
    </div>

    {!exportText && <>
      <p style={{color:C.textMuted,fontSize:11,margin:"0 0 12px",lineHeight:1.4}}>Exporta una copia de tus datos (medidas, entrenos, planes, nutrición) o restáuralos importando un JSON. La importación pide confirmación y solo escribe claves conocidas; el resto del storage no se toca.</p>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        <Btn onClick={handleExport} color={C.text} style={{width:"100%",justifyContent:"center"}}>Exportar datos</Btn>
        <Btn onClick={()=>setMode(mode==="file"?null:"file")} color={C.text} style={{width:"100%",justifyContent:"center"}}>Importar JSON</Btn>
        {mode==="file"&&<input ref={fileRef} type="file" accept=".json" onChange={handleFileImport} style={{color:C.text,padding:"6px 0"}}/>}
        <Btn onClick={()=>setMode(mode==="paste"?null:"paste")} color={C.purple} style={{width:"100%",justifyContent:"center"}}>Pegar JSON</Btn>
        {mode==="paste"&&<>
          <textarea value={jsonText} onChange={e=>setJsonText(e.target.value)} placeholder='Pega tu JSON aquí...' rows={5}
            style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,color:C.text,padding:10,fontFamily:"monospace",resize:"vertical",width:"100%",boxSizing:"border-box"}}/>
          <Btn onClick={handlePasteImport} color={C.green} style={{width:"100%",justifyContent:"center"}}>✓ Importar</Btn>
        </>}
      </div>
      <div style={{borderTop:`1px solid ${C.border}`,marginTop:16,paddingTop:14}}>
        <Btn onClick={()=>setConfirmReset(true)} color={C.red} style={{width:"100%",justifyContent:"center"}}>Eliminar todos los datos</Btn>
        <p style={{color:C.textMuted,fontSize:10,margin:"8px 0 0",lineHeight:1.45}}>Borra todos los datos locales de esta app en este dispositivo. No afecta a copias exportadas.</p>
      </div>
    </>}

    {exportText && <>
      <p style={{color:C.textMuted,fontSize:11,margin:"0 0 8px",lineHeight:1.4}}>Tu backup está aquí. Compártelo (guardar en Archivos, Notas, email…), cópialo, o descárgalo. En iPhone, "Compartir" o "Copiar" son lo más fiable.</p>
      <textarea ref={exportRef} readOnly value={exportText} rows={8} onFocus={e=>e.target.select()}
        style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,color:C.text,padding:10,fontFamily:"monospace",fontSize:11,resize:"vertical",width:"100%",boxSizing:"border-box",marginBottom:8}}/>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
        <Btn onClick={shareExport} color={C.text} style={{flex:"1 1 30%",justifyContent:"center"}}>Compartir</Btn>
        <Btn onClick={copyExport} color={C.green} style={{flex:"1 1 30%",justifyContent:"center"}}>Copiar</Btn>
        <Btn onClick={downloadExport} color={C.purple} style={{flex:"1 1 30%",justifyContent:"center"}}>Descargar</Btn>
      </div>
      <Btn onClick={()=>setExportText(null)} color={C.textMuted} style={{width:"100%",justifyContent:"center"}}>Cerrar</Btn>
    </>}

    {pending&&<ConfirmDialog
      msg={`Importar ${pending.count} ${pending.count===1?"registro":"registros"}? Se sobrescribirán esas claves con los datos del archivo. El resto no se toca.`}
      onConfirm={confirmImport}
      onCancel={()=>setPending(null)}/>}
    {confirmReset&&<ConfirmDialog
      msg={"¿Eliminar TODOS los datos guardados en este dispositivo? Se borrarán medidas, entrenos, planes, nutrición y ajustes. Esta acción no se puede deshacer — te recomendamos exportar una copia antes. Tu preferencia de tema (claro/oscuro) se conserva."}
      onConfirm={doClearAll}
      onCancel={()=>setConfirmReset(false)}/>}
  </div>;
}


function AppInner(){
  const [screen,setScreen]=useState("hoy");
  const [dataVersion,setDataVersion]=useState(0);
  useEffect(()=>{ _bumpData=()=>setDataVersion(v=>v+1); return ()=>{ _bumpData=null; }; },[]);
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
    s.textContent="html,body{overflow:hidden;overscroll-behavior:none;height:100%;position:fixed;width:100%;}*{-webkit-overflow-scrolling:touch;}input,textarea,select{font-size:16px!important;}";
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
  const [entrenEntTab,setEntrenEntTab]=useState("registro");
  function handleEmpezar(tabId,planoKey){
    setEntrenTab(tabId);
    setEntrenPlano(planoKey||null);
    setEntrenStarted(true);
    setEntrenEntTab("registro");
    setScreen("entreno");
  }

  const navItems=[
    {id:"hoy",    label:"Hoy"},
    {id:"entreno",label:"Entrenamiento"},
    {id:"nutricion",label:"Nutrición"},
    {id:"progreso",label:"Progreso"},
  ];

  const titles={hoy:"Hoy",entreno:"Entrenamiento",progreso:"Progreso",nutricion:"Nutrición"};

  useEffect(()=>{ if(scrollRef.current) scrollRef.current.scrollTop=0; },[screen]);
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
    <ConfirmHost/>

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
      <div key={dataVersion} style={{padding:"8px 8px 0",maxWidth:500,margin:"0 auto",paddingBottom:"max(24px,env(safe-area-inset-bottom,24px))"}}>
        {screen==="hoy"&&<ScreenHoyMerged
          onEmpezar={handleEmpezar}
          onGoToNutricion={()=>setScreen("nutricion")}
          onGoToSemana={()=>{setInitProTab("semana");setScreen("progreso");}}
          onGoToFisico={()=>{setInitProTab("cuerpo");setScreen("progreso");}}
          onGoToComidas={()=>setScreen("nutricion")}
          onGoToPlan={()=>{setEntrenEntTab("plan");setScreen("entreno");}}
        />}
        {screen==="entreno"&&<ScreenEntreno initTab={entrenTab} initPlanoKey={entrenPlano} initEntTab={entrenEntTab} autoStart={entrenStarted} onSessionStarted={()=>setEntrenStarted(false)}/>}
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
