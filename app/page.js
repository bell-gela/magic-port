'use client';
import { useState, useEffect, useRef } from 'react';

// ━━━ ヘルスデータ（Phase 2で本物に差し替え）━━━━━━━
const DUMMY = { steps: 6800, sleep: 6.2, heartRate: 72 };

function calcHP({ steps, sleep, heartRate }) {
  return Math.round(
    Math.min(steps / 8000, 1) * 40 +
    Math.min(sleep / 7,    1) * 40 +
    (heartRate < 80 ? 20 : heartRate < 90 ? 10 : 0)
  );
}
function getCondition(hp) {
  if (hp >= 80) return { text: 'エネルギー充分です。クリエイティブな作業に最適な状態ですよ。', emoji: '🌟' };
  if (hp >= 60) return { text: '良い状態です。集中作業は午前中に終わらせておきましょう。', emoji: '😊' };
  if (hp >= 40) return { text: '少し疲れが出ています。今日の会議は最小限にしてください。', emoji: '🌿' };
  if (hp >= 20) return { text: '回復が必要です。重要な決断は明日に回してよいです。', emoji: '🍵' };
  return         { text: '今日は休む日です。自分を責めないでください。充電が最優先です。', emoji: '🛌' };
}
function getHPColor(hp) {
  if (hp >= 80) return '#4299e1';
  if (hp >= 60) return '#48bb78';
  if (hp >= 40) return '#ecc94b';
  return '#f56565';
}

// ━━━ タスクタブ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const INIT_TASKS = [
  { id:1, text:'企画書の提出',      quad:'do'       },
  { id:2, text:'チームMTGの準備',  quad:'do'       },
  { id:3, text:'note記事の下書き',  quad:'schedule' },
  { id:4, text:'スキルアップ読書',  quad:'schedule' },
  { id:5, text:'メールの返信',      quad:'delegate' },
  { id:6, text:'不要ファイル整理',  quad:'delete'   },
];
const QUADS = [
  { key:'do',       label:'今すぐ',   sub:'重要×緊急',       color:'#fc8181', bg:'#fff5f5' },
  { key:'schedule', label:'予定',     sub:'重要×非緊急',     color:'#63b3ed', bg:'#ebf8ff' },
  { key:'delegate', label:'委任',     sub:'緊急×非重要',     color:'#f6ad55', bg:'#fffaf0' },
  { key:'delete',   label:'やらない', sub:'非重要×非緊急',   color:'#a0aec0', bg:'#f7fafc' },
];

function TaskTab() {
  const [tasks, setTasks] = useState(INIT_TASKS);
  const [newTask, setNewTask] = useState('');
  const [quad, setQuad] = useState('do');
  function add() {
    if (!newTask.trim()) return;
    setTasks([...tasks, { id: Date.now(), text: newTask.trim(), quad }]);
    setNewTask('');
  }
  return (
    <div style={{ flex:1, minHeight:0, display:'flex', flexDirection:'column', gap:'8px' }}>
      <div style={{ display:'flex', gap:'6px', flexShrink:0 }}>
        <select value={quad} onChange={e => setQuad(e.target.value)}
          style={{ border:'1.5px solid #e2e8f0', borderRadius:'10px', padding:'6px 8px', fontSize:'12px', color:'#4a5568', background:'white', outline:'none' }}>
          {QUADS.map(q => <option key={q.key} value={q.key}>{q.label}</option>)}
        </select>
        <input value={newTask} onChange={e => setNewTask(e.target.value)}
          onKeyDown={e => e.key==='Enter' && add()} placeholder="タスクを追加..."
          style={{ flex:1, border:'1.5px solid #e2e8f0', borderRadius:'10px', padding:'6px 10px', fontSize:'12px', outline:'none', color:'#2d3748' }} />
        <button onClick={add}
          style={{ background:'#4a5568', color:'white', border:'none', borderRadius:'10px', padding:'6px 14px', fontSize:'16px', cursor:'pointer' }}>＋</button>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px', flex:1, minHeight:0 }}>
        {QUADS.map(q => (
          <div key={q.key} style={{ background:q.bg, borderRadius:'12px', padding:'8px', border:`1.5px solid ${q.color}33`, display:'flex', flexDirection:'column', overflow:'hidden' }}>
            <div style={{ flexShrink:0, marginBottom:'5px' }}>
              <div style={{ fontSize:'11px', fontWeight:'700', color:q.color }}>{q.label}</div>
              <div style={{ fontSize:'9px', color:'#a0aec0' }}>{q.sub}</div>
            </div>
            <div style={{ overflowY:'auto', flex:1, display:'flex', flexDirection:'column', gap:'4px' }}>
              {tasks.filter(t => t.quad===q.key).map(task => (
                <div key={task.id} style={{ background:'white', borderRadius:'7px', padding:'5px 7px', fontSize:'11px', color:'#4a5568', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 1px 3px rgba(0,0,0,.05)' }}>
                  <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{task.text}</span>
                  <button onClick={() => setTasks(tasks.filter(t => t.id!==task.id))}
                    style={{ background:'none', border:'none', color:'#cbd5e0', fontSize:'13px', cursor:'pointer', padding:'0 0 0 4px', flexShrink:0 }}>×</button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ━━━ マインドフルネスタブ ━━━━━━━━━━━━━━━━━━━━━━━━━
const BREATH = {
  inhale: { next:'hold',   dur:4, label:'吸う',   color:'#63b3ed' },
  hold:   { next:'exhale', dur:4, label:'止める', color:'#9f7aea' },
  exhale: { next:'inhale', dur:6, label:'吐く',   color:'#68d391' },
};

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function MindTab() {
  const [phase, setPhase]       = useState('idle');
  const [progress, setProgress] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [rounds, setRounds]     = useState(0);
  const [sessions, setSessions] = useState([]);
  const rafRef    = useRef(null);
  const startRef  = useRef(0);
  const phaseRef  = useRef('idle');
  const roundsRef = useRef(0);

  // localStorage ロード＆アンマウント時クリーンアップ
  useEffect(() => {
    try {
      const raw = localStorage.getItem('mp_mind_v1');
      if (raw) setSessions(JSON.parse(raw));
    } catch {}
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      // アンマウント時に完了済みラウンドを保存
      if (roundsRef.current > 0) {
        try {
          const raw = localStorage.getItem('mp_mind_v1');
          const prev = raw ? JSON.parse(raw) : [];
          const key = todayKey();
          const idx = prev.findIndex(s => s.date === key);
          const next = idx >= 0
            ? prev.map((s,i) => i===idx ? {...s, count: s.count + roundsRef.current} : s)
            : [...prev, { date: key, count: roundsRef.current }];
          localStorage.setItem('mp_mind_v1', JSON.stringify(next));
        } catch {}
      }
    };
  }, []);

  function persistSession(r) {
    if (r <= 0) return;
    const key = todayKey();
    setSessions(prev => {
      const idx = prev.findIndex(s => s.date === key);
      const next = idx >= 0
        ? prev.map((s,i) => i===idx ? {...s, count: s.count + r} : s)
        : [...prev, { date: key, count: r }];
      try { localStorage.setItem('mp_mind_v1', JSON.stringify(next)); } catch {}
      return next;
    });
  }

  // rAF ループ（滑らかなアニメーション）
  function runLoop() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    startRef.current = performance.now();
    function tick(now) {
      const elapsed = (now - startRef.current) / 1000;
      const cfg = BREATH[phaseRef.current];
      const prog = Math.min(elapsed / cfg.dur, 1);
      setProgress(prog);
      setCountdown(Math.max(0, Math.ceil(cfg.dur - elapsed)));
      if (prog >= 1) {
        const next = cfg.next;
        if (phaseRef.current === 'exhale') {
          roundsRef.current += 1;
          setRounds(roundsRef.current);
        }
        phaseRef.current = next;
        setPhase(next);
        startRef.current = performance.now();
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
  }

  function handleTap() {
    if (phase === 'idle') {
      roundsRef.current = 0;
      setRounds(0);
      phaseRef.current = 'inhale';
      setPhase('inhale');
      runLoop();
    } else {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      persistSession(roundsRef.current);
      phaseRef.current = 'idle';
      setPhase('idle');
      setProgress(0);
      setCountdown(0);
    }
  }

  const top3 = [...sessions].sort((a,b) => b.count - a.count).slice(0,3);
  const cfg   = phase !== 'idle' ? BREATH[phase] : null;
  const color = cfg?.color ?? '#e2e8f0';
  const R = 52, C = 2 * Math.PI * R;

  return (
    <div style={{ flex:1, minHeight:0, display:'flex', flexDirection:'column', gap:'10px', overflowY:'auto' }}>
      {/* ランキング */}
      {top3.length > 0 && (
        <div style={{ background:'#f8fafc', borderRadius:'14px', padding:'10px 12px', border:'1px solid #e2e8f0', flexShrink:0 }}>
          <div style={{ fontSize:'10px', color:'#a0aec0', letterSpacing:'1.5px', marginBottom:'6px' }}>🏆 BREATHING RECORD</div>
          <div style={{ display:'flex', gap:'6px' }}>
            {top3.map((s,i) => (
              <div key={s.date} style={{ flex:1, textAlign:'center', background:'white', borderRadius:'10px', padding:'7px 4px', border:`1.5px solid ${['#FFD70033','#C0C0C033','#CD7F3233'][i]}` }}>
                <div style={{ fontSize:'18px' }}>{['🥇','🥈','🥉'][i]}</div>
                <div style={{ fontSize:'16px', fontWeight:'800', color:'#2d3748' }}>
                  {s.count}<span style={{ fontSize:'10px', color:'#a0aec0' }}>回</span>
                </div>
                <div style={{ fontSize:'10px', color:'#a0aec0' }}>{s.date.slice(5).replace('-','/')}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* 呼吸サークル */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'12px' }}>
        <div style={{ fontSize:'11px', color:'#a0
