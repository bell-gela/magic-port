'use client';
import { useState, useEffect, useRef } from 'react';

// ━━━ HP計算 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function calcHP({ steps, sleep, heartRate }) {
  return Math.round(
    Math.min(steps / 8000, 1) * 40 +
    Math.min(sleep / 7,    1) * 40 +
    (heartRate < 80 ? 20 : heartRate < 90 ? 10 : 0)
  );
}

// 時間経過による減衰（1時間ごとに約1.5ポイント減）
function calcDecayedHP(baseHP, updatedAt) {
  if (!updatedAt) return baseHP;
  const hours = (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60);
  const decay = Math.floor(hours * 1.5);
  return Math.max(baseHP - decay, 0);
}

function getHPColor(hp) {
  if (hp >= 80) return '#4299e1';
  if (hp >= 60) return '#48bb78';
  if (hp >= 40) return '#ecc94b';
  return '#f56565';
}

// ━━━ ベイマックスのセリフ ━━━━━━━━━━━━━━━━━━━━━━━━
function getBaymaxLine(hp, hour, day) {
  const isWeekend = day === 0 || day === 6;
  const lines = [
    // 朝・高HP
    hp >= 80 && hour < 12  && 'スキャン完了。今日のコンディションは最高です。',
    hp >= 80 && hour < 12  && 'おはようございます。エネルギー充填率100%です。',
    // 朝・低HP
    hp <  60 && hour < 12  && 'おはようございます。今日はゆっくり始めましょう。',
    hp <  40 && hour < 12  && '昨夜の疲れが残っています。無理しないでください。',
    // 昼・高HP
    hp >= 70 && hour >= 12 && hour < 15 && 'ランチ休憩、取れましたか？充電も大切です。',
    // 夕方
    hour >= 15 && hour < 18 && hp >= 60 && '午後も順調です。あと少し、一緒に乗り越えましょう。',
    hour >= 15 && hour < 18 && hp <  60 && '疲れてきた頃ですね。深呼吸を3回してみてください。',
    // 夜
    hour >= 18 && '今日もお疲れさまでした。ゆっくり休んでください。',
    // 週末
    isWeekend && hp >= 70 && '今日はお休みですね。自分のための時間を楽しんでください。',
    isWeekend && hp <  60 && '週末こそ充電日です。何もしない時間も必要ですよ。',
    // HP緊急
    hp < 20 && '今すぐ休んでください。それが今日一番大切なタスクです。',
  ].filter(Boolean);

  // 汎用フォールバック
  const fallback = [
    'いつもそばにいます。何かあれば話しかけてください。',
    'あなたの健康が、私の最優先事項です。',
    '今日も一緒にいます。安心してください。',
    'HSPは才能です。あなたの感性を大切に。',
    '無理しなくていいです。今日もよく頑張っています。',
  ];

  const pool = lines.length > 0 ? lines : fallback;
  return pool[Math.floor(Date.now() / 60000) % pool.length];
}

// ━━━ タスクタブ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const QUADS = [
  { key:'do',       label:'今すぐ',   sub:'重要×緊急',     color:'#fc8181', bg:'#fff5f5' },
  { key:'schedule', label:'予定',     sub:'重要×非緊急',   color:'#63b3ed', bg:'#ebf8ff' },
  { key:'delegate', label:'委任',     sub:'緊急×非重要',   color:'#f6ad55', bg:'#fffaf0' },
  { key:'delete',   label:'やらない', sub:'非重要×非緊急', color:'#a0aec0', bg:'#f7fafc' },
];

function TaskTab({ tasks, setTasks }) {
  const [newTask, setNewTask] = useState('');
  const [quad, setQuad] = useState('do');
  function add() {
    if (!newTask.trim()) return;
    setTasks(prev => [...prev, { id: Date.now(), text: newTask.trim(), quad }]);
    setNewTask('');
  }
  return (
    <div style={{ flex:1, minHeight:0, display:'flex', flexDirection:'column', gap:'8px' }}>
      {/* 4象限 */}
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
                  <button onClick={() => setTasks(prev => prev.filter(t => t.id!==task.id))}
                    style={{ background:'none', border:'none', color:'#cbd5e0', fontSize:'13px', cursor:'pointer', padding:'0 0 0 4px', flexShrink:0 }}>×</button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* 入力欄（下部） */}
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
    </div>
  );
}

// ━━━ マインドフルネスタブ ━━━━━━━━━━━━━━━━━━━━━━━━
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
  const [phase, setPhase]=useState('idle');
  const [progress, setProgress]=useState(0);
  const [countdown, setCountdown]=useState(0);
  const [rounds, setRounds]=useState(0);
  const [sessions, setSessions]=useState([]);
  const rafRef=useRef(null); const startRef=useRef(0); const phaseRef=useRef('idle'); const roundsRef=useRef(0);

  useEffect(() => {
    try { const r=localStorage.getItem('mp_mind_v1'); if(r) setSessions(JSON.parse(r)); } catch {}
    return () => {
      if(rafRef.current) cancelAnimationFrame(rafRef.current);
      if(roundsRef.current>0) {
        try {
          const r=localStorage.getItem('mp_mind_v1'); const prev=r?JSON.parse(r):[];
          const key=todayKey(); const idx=prev.findIndex(s=>s.date===key);
          const next=idx>=0?prev.map((s,i)=>i===idx?{...s,count:s.count+roundsRef.current}:s):[...prev,{date:key,count:roundsRef.current}];
          localStorage.setItem('mp_mind_v1',JSON.stringify(next));
        } catch {}
      }
    };
  }, []);

  function persist(r) {
    if(r<=0) return; const key=todayKey();
    setSessions(prev => {
      const idx=prev.findIndex(s=>s.date===key);
      const next=idx>=0?prev.map((s,i)=>i===idx?{...s,count:s.count+r}:s):[...prev,{date:key,count:r}];
      try { localStorage.setItem('mp_mind_v1',JSON.stringify(next)); } catch {}
      return next;
    });
  }

  function runLoop() {
    if(rafRef.current) cancelAnimationFrame(rafRef.current);
    startRef.current=performance.now();
    function tick(now) {
      const elapsed=(now-startRef.current)/1000; const cfg=BREATH[phaseRef.current];
      const prog=Math.min(elapsed/cfg.dur,1); setProgress(prog); setCountdown(Math.max(0,Math.ceil(cfg.dur-elapsed)));
      if(prog>=1) { if(phaseRef.current==='exhale'){roundsRef.current+=1;setRounds(roundsRef.current);} phaseRef.current=cfg.next;setPhase(cfg.next);startRef.current=performance.now(); }
      rafRef.current=requestAnimationFrame(tick);
    }
    rafRef.current=requestAnimationFrame(tick);
  }

  function handleTap() {
    if(phase==='idle'){roundsRef.current=0;setRounds(0);phaseRef.current='inhale';setPhase('inhale');runLoop();}
    else{cancelAnimationFrame(rafRef.current);rafRef.current=null;persist(roundsRef.current);phaseRef.current='idle';setPhase('idle');setProgress(0);setCountdown(0);}
  }

  const top3=[...sessions].sort((a,b)=>b.count-a.count).slice(0,3);
  const cfg=phase!=='idle'?BREATH[phase]:null; const color=cfg?.color??'#e2e8f0';
  const R=52, C=2*Math.PI*R;

  return (
    <div style={{ flex:1, minHeight:0, display:'flex', flexDirection:'column', gap:'10px', overflowY:'auto' }}>
      {top3.length>0 && (
        <div style={{ background:'#f8fafc', borderRadius:'14px', padding:'10px 12px', border:'1px solid #e2e8f0', flexShrink:0 }}>
          <div style={{ fontSize:'10px', color:'#a0aec0', letterSpacing:'1.5px', marginBottom:'6px' }}>🏆 BREATHING RECORD</div>
          <div style={{ display:'flex', gap:'6px' }}>
            {top3.map((s,i) => (
              <div key={s.date} style={{ flex:1, textAlign:'center', background:'white', borderRadius:'10px', padding:'7px 4px', border:`1.5px solid ${['#FFD70033','#C0C0C033','#CD7F3233'][i]}` }}>
                <div style={{ fontSize:'18px' }}>{['🥇','🥈','🥉'][i]}</div>
                <div style={{ fontSize:'16px', fontWeight:'800', color:'#2d3748' }}>{s.count}<span style={{ fontSize:'10px', color:'#a0aec0' }}>回</span></div>
                <div style={{ fontSize:'10px', color:'#a0aec0' }}>{s.date.slice(5).replace('-','/')}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'12px' }}>
        <div style={{ fontSize:'11px', color:'#a0aec0', letterSpacing:'1px' }}>4-4-6 呼吸法{rounds>0?` · ${rounds}回完了 🌿`:''}</div>
        <div onClick={handleTap} style={{ position:'relative', width:'130px', height:'130px', cursor:'pointer' }}>
          <svg width="130" height="130" style={{ position:'absolute', top:0, left:0, transform:'rotate(-90deg)' }}>
            <circle cx="65" cy="65" r={R} fill="none" stroke="#edf2f7" strokeWidth="6"/>
            <circle cx="65" cy="65" r={R} fill="none" stroke={color} strokeWidth="6" strokeDasharray={C} strokeDashoffset={C*(1-progress)} strokeLinecap="round" style={{ transition:'stroke 0.5s ease' }}/>
          </svg>
          <div style={{ position:'absolute', inset:0, borderRadius:'50%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:phase!=='idle'?`${color}18`:'#f0f4ff', boxShadow:phase!=='idle'?`0 0 28px ${color}44`:'none', transition:'background 0.5s, box-shadow 0.5s' }}>
            {phase==='idle'
              ? <span style={{ fontSize:'12px', color:'#a0aec0', textAlign:'center', lineHeight:1.6 }}>タップで<br/>開始</span>
              : <><span style={{ fontSize:'13px', fontWeight:'700', color, marginBottom:'2px' }}>{cfg.label}</span><span style={{ fontSize:'38px', fontWeight:'800', color, lineHeight:1 }}>{countdown}</span></>
            }
          </div>
        </div>
        <p style={{ fontSize:'12px', color:'#718096', textAlign:'center', maxWidth:'220px', lineHeight:'1.7', margin:0 }}>
          {phase==='idle'?'HSPの神経系を落ち着かせる呼吸法。\n会議前に3セットやってみましょう。':'タップで終了・セッションを保存します'}
        </p>
      </div>
    </div>
  );
}

// ━━━ クレンズタブ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const TYPE_CONFIG = {
  trash: { label:'ゴミ箱へ',   emoji:'🗑️', color:'#a0aec0', bg:'#f7fafc' },
  idea:  { label:'アイデア！', emoji:'💡', color:'#f6ad55', bg:'#fffaf0' },
  task:  { label:'タスクへ',   emoji:'📋', color:'#63b3ed', bg:'#ebf8ff' },
};

function CleanseTab({ onAddTask }) {
  const [input, setInput]=useState('');
  const [loading, setLoading]=useState(false);
  const [result, setResult]=useState(null);
  const [history, setHistory]=useState([]);

  async function analyse() {
    if(!input.trim()||loading) return;
    setLoading(true); setResult(null);
    try {
      const res=await fetch('/api/cleanse',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({text:input}) });
      const data=await res.json();
      setResult(data);
      setHistory(prev=>[{...data, text:input, id:Date.now()},...prev.slice(0,9)]);
      if(data.type==='task') onAddTask(data.summary, data.quad);
      setInput('');
    } catch(e) {
      setResult({ type:'error', comment:'エラーが発生しました。もう一度試してください。' });
    } finally { setLoading(false); }
  }

  return (
    <div style={{ flex:1, minHeight:0, display:'flex', flexDirection:'column', gap:'10px', overflow:'hidden' }}>
      <div style={{ flexShrink:0 }}>
        <textarea value={input} onChange={e=>setInput(e.target.value)}
          placeholder="頭の中のモヤモヤ、アイデア、やること…なんでも吐き出してください"
          style={{ width:'100%', minHeight:'80px', border:'1.5px solid #e2e8f0', borderRadius:'14px', padding:'10px 12px', fontSize:'13px', color:'#2d3748', resize:'none', outline:'none', fontFamily:'inherit', boxSizing:'border-box', lineHeight:'1.6' }}/>
        <button onClick={analyse} disabled={loading||!input.trim()}
          style={{ width:'100%', marginTop:'6px', padding:'10px', borderRadius:'12px', border:'none', background:loading||!input.trim()?'#e2e8f0':'linear-gradient(135deg,#667eea,#764ba2)', color:loading||!input.trim()?'#a0aec0':'white', fontSize:'13px', fontWeight:'700', cursor:loading||!input.trim()?'not-allowed':'pointer', transition:'all 0.3s' }}>
          {loading?'🤖 分析中...':'✨ クレンジング'}
        </button>
      </div>
      {result && !result.error && (
        <div style={{ background:TYPE_CONFIG[result.type]?.bg??'#f7fafc', borderRadius:'14px', padding:'12px 14px', border:`1.5px solid ${TYPE_CONFIG[result.type]?.color??'#a0aec0'}44`, flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'6px' }}>
            <span style={{ fontSize:'22px' }}>{TYPE_CONFIG[result.type]?.emoji}</span>
            <span style={{ fontSize:'12px', fontWeight:'700', color:TYPE_CONFIG[result.type]?.color }}>{TYPE_CONFIG[result.type]?.label}</span>
            <span style={{ fontSize:'12px', color:'#4a5568', flex:1 }}>「{result.summary}」</span>
          </div>
          <p style={{ fontSize:'12px', color:'#718096', lineHeight:'1.6', margin:0 }}>🤖 {result.comment}</p>
          {result.type==='task' && <div style={{ fontSize:'10px', color:'#63b3ed', marginTop:'4px' }}>→ タスク行列に自動追加しました</div>}
        </div>
      )}
      <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:'5px' }}>
        {history.length>0 && <div style={{ fontSize:'10px', color:'#a0aec0', letterSpacing:'1px', marginBottom:'2px', flexShrink:0 }}>HISTORY</div>}
        {history.map(h => (
          <div key={h.id} style={{ display:'flex', alignItems:'center', gap:'8px', background:'white', borderRadius:'10px', padding:'7px 10px', border:'1px solid #e2e8f0', flexShrink:0 }}>
            <span style={{ fontSize:'16px' }}>{TYPE_CONFIG[h.type]?.emoji??'❓'}</span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:'12px', color:'#4a5568', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{h.text}</div>
              <div style={{ fontSize:'10px', color:'#a0aec0', marginTop:'1px' }}>{TYPE_CONFIG[h.type]?.label} · {h.summary}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ━━━ SAFEタブ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function SafeTab({ hp, barrier, setBarrier }) {
  const [report, setReport]=useState(null);
  const [reporting, setReporting]=useState(false);
  const [reported, setReported]=useState(false);

  async function fetchReport() {
    setReporting(true);
    try {
      const res=await fetch('/api/health?mode=weekly');
      const { days }=await res.json();
      const res2=await fetch('/api/report',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({days}) });
      const data=await res2.json();
      setReport(data); setReported(true);
    } catch(e){console.error(e);}
    finally{setReporting(false);}
  }

  const alerts=[hp<60&&'⚠️ エネルギーが低下中。重要な決断は避けましょう','📅 連続会議：2件（14:00〜）'].filter(Boolean);

  return (
    <div style={{ flex:1, minHeight:0, overflowY:'auto', display:'flex', flexDirection:'column', gap:'8px' }}>
      <div onClick={()=>setBarrier(!barrier)}
        style={{ background:barrier?'linear-gradient(135deg,#1e0a4e,#2d1b69)':'#f7fafc', borderRadius:'16px', padding:'14px 16px', border:`2px solid ${barrier?'#7c3aed':'#e2e8f0'}`, cursor:'pointer', display:'flex', alignItems:'center', gap:'12px', transition:'all 0.5s', boxShadow:barrier?'0 0 28px #7c3aed55':'none', flexShrink:0 }}>
        <span style={{ fontSize:'32px', filter:barrier?'drop-shadow(0 0 10px #a78bfa)':'none', transition:'filter 0.5s' }}>{barrier?'🛡️':'🔓'}</span>
        <div>
          <div style={{ fontSize:'15px', fontWeight:'700', color:barrier?'#e9d8fd':'#4a5568', transition:'color 0.5s' }}>{barrier?'バリアモード ON':'バリアモード OFF'}</div>
          <div style={{ fontSize:'11px', color:barrier?'#a78bfa':'#a0aec0', marginTop:'2px', transition:'color 0.5s' }}>{barrier?'精神的な防御シールドが展開されています':'タップして精神的バリアを張る'}</div>
        </div>
      </div>
      {alerts.map((a,i)=>(<div key={i} style={{ background:'#fffaf0', borderRadius:'10px', padding:'9px 12px', fontSize:'12px', color:'#744210', border:'1px solid #fbd38d', flexShrink:0 }}>{a}</div>))}
      <div style={{ background:'#f0fff4', borderRadius:'10px', padding:'10px 12px', border:'1px solid #c6f6d5', flexShrink:0 }}>
        <div style={{ fontSize:'11px', fontWeight:'700', color:'#276749', marginBottom:'4px' }}>💚 今日のHSPケア</div>
        <div style={{ fontSize:'12px', color:'#2f855a', lineHeight:'1.7' }}>会議の合間に2分間、目を閉じて静かな場所へ。感覚のリセットが疲労を和らげます。</div>
      </div>
      {!reported && (
        <button onClick={fetchReport} disabled={reporting}
          style={{ width:'100%', padding:'12px', borderRadius:'14px', border:'none', background:reporting?'#e2e8f0':'linear-gradient(135deg,#667eea,#764ba2)', color:reporting?'#a0aec0':'white', fontSize:'13px', fontWeight:'700', cursor:reporting?'not-allowed':'pointer', transition:'all 0.3s', flexShrink:0 }}>
          {reporting?'🤖 AIが分析中...':'📊 今週のエネルギーレポートを生成'}
        </button>
      )}
      {report && !report.error && (
        <div style={{ background:'white', borderRadius:'16px', padding:'14px', border:'1px solid #e2e8f0', display:'flex', flexDirection:'column', gap:'10px', flexShrink:0 }}>
          <div style={{ fontSize:'10px', color:'#a0aec0', letterSpacing:'1.5px' }}>📊 WEEKLY ENERGY REPORT</div>
          <div style={{ background:'linear-gradient(135deg,#f0f4ff,#e9d8fd22)', borderRadius:'12px', padding:'10px 12px', border:'1px solid #e9d8fd' }}>
            <p style={{ fontSize:'13px', color:'#2d3748', lineHeight:'1.7', margin:0, fontWeight:'600' }}>{report.overall}</p>
          </div>
          <div style={{ display:'flex', gap:'8px' }}>
            {[{label:'睡眠スコア',value:report.sleepScore,color:'#9f7aea'},{label:'活動スコア',value:report.activityScore,color:'#63b3ed'}].map(s=>(
              <div key={s.label} style={{ flex:1, background:'#f8fafc', borderRadius:'10px', padding:'8px', border:'1px solid #e2e8f0', textAlign:'center' }}>
                <div style={{ fontSize:'9px', color:'#a0aec0', marginBottom:'4px' }}>{s.label}</div>
                <div style={{ fontSize:'22px', fontWeight:'800', color:s.color }}>{s.value}</div>
                <div style={{ height:'4px', borderRadius:'4px', background:'#edf2f7', marginTop:'4px', overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${s.value}%`, borderRadius:'4px', background:s.color }}/>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:'8px' }}>
            <div style={{ flex:1, background:'#f0fff4', borderRadius:'10px', padding:'8px', border:'1px solid #c6f6d5', textAlign:'center' }}>
              <div style={{ fontSize:'9px', color:'#38a169', marginBottom:'2px' }}>⚡ ベストデイ</div>
              <div style={{ fontSize:'12px', fontWeight:'700', color:'#276749' }}>{report.bestDay?.slice(5).replace('-','/')}</div>
            </div>
            <div style={{ flex:1, background:'#fff5f5', borderRadius:'10px', padding:'8px', border:'1px solid #fed7d7', textAlign:'center' }}>
              <div style={{ fontSize:'9px', color:'#e53e3e', marginBottom:'2px' }}>🔋 要回復デイ</div>
              <div style={{ fontSize:'12px', fontWeight:'700', color:'#c53030' }}>{report.worstDay?.slice(5).replace('-','/')}</div>
            </div>
          </div>
          <div style={{ background:'#fffaf0', borderRadius:'10px', padding:'9px 12px', border:'1px solid #fbd38d' }}>
            <div style={{ fontSize:'9px', color:'#d69e2e', marginBottom:'3px', fontWeight:'700' }}>🔍 今週のパターン</div>
            <p style={{ fontSize:'12px', color:'#744210', lineHeight:'1.6', margin:0 }}>{report.pattern}</p>
          </div>
          <div style={{ background:'linear-gradient(135deg,#ebf8ff,#e9d8fd22)', borderRadius:'10px', padding:'10px 12px', border:'1px solid #bee3f8' }}>
            <div style={{ fontSize:'9px', color:'#3182ce', marginBottom:'3px', fontWeight:'700' }}>🤖 ベイマックスより</div>
            <p style={{ fontSize:'12px', color:'#2c5282', lineHeight:'1.7', margin:0 }}>{report.advice}</p>
          </div>
          <button onClick={()=>{setReported(false);setReport(null);}}
            style={{ background:'none', border:'1px solid #e2e8f0', borderRadius:'10px', padding:'7px', fontSize:'11px', color:'#a0aec0', cursor:'pointer' }}>↻ 再生成</button>
        </div>
      )}
    </div>
  );
}

// ━━━ ベイマックスの顔コンポーネント ━━━━━━━━━━━━━━
function BaymaxFace({ barrier, onTap, hpColor }) {
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    const iv = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(iv);
  }, []);

  const faceColor = barrier ? '#a78bfa' : hpColor;

  return (
    <div onClick={onTap} style={{ cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'4px', userSelect:'none' }}>
      {/* 顔本体 */}
      <div style={{ position:'relative', width:'64px', height:'40px', background: barrier ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.8)', borderRadius:'20px', border:`2px solid ${faceColor}44`, display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', boxShadow:`0 2px 12px ${faceColor}22`, transition:'all 0.5s' }}>
        {/* 左目 */}
        <div style={{ width:'10px', height: blink ? '2px' : '10px', borderRadius:'50%', background:faceColor, transition:'height 0.08s ease', marginTop: blink ? '4px' : '0' }}/>
        {/* 右目 */}
        <div style={{ width:'10px', height: blink ? '2px' : '10px', borderRadius:'50%', background:faceColor, transition:'height 0.08s ease', marginTop: blink ? '4px' : '0' }}/>
      </div>
      {/* タップヒント */}
      <div style={{ fontSize:'9px', color: barrier ? '#a78bfa' : '#a0aec0', letterSpacing:'0.5px', transition:'color 0.5s' }}>
        {barrier ? '🛡️ BARRIER ON' : 'tap to barrier'}
      </div>
    </div>
  );
}

// ━━━ ホーム画面 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function HomeView({ hp, baseHP, cond, hpColor, barrier, setBarrier, now, healthStats, isDemo, loading, updatedAt }) {
  const hh=String(now.getHours()).padStart(2,'0'); const mm=String(now.getMinutes()).padStart(2,'0'); const ss=String(now.getSeconds()).padStart(2,'0');
  const dateStr=now.toLocaleDateString('ja-JP',{month:'long',day:'numeric',weekday:'long'});
  const baymaxLine = getBaymaxLine(hp, now.getHours(), now.getDay());
  const b=barrier;
  const tCol=b?'#e9d8fd':'#1a202c'; const sCol=b?'#a78bfa':'#a0aec0';
  const cBg=b?'rgba(255,255,255,0.08)':'white'; const cBdr=b?'rgba(167,139,250,0.25)':'#e8edf5';
  const subBg=b?'rgba(255,255,255,0.05)':'#f8fafc'; const subBdr=b?'rgba(167,139,250,0.15)':'#e8edf5';
  const updatedStr=updatedAt?new Date(updatedAt).toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'}):null;

  // アプリショートカット
  const apps = [
    { name:'LINE',     icon:'💬', url:'line://',      show: true          },
    { name:'X',        icon:'𝕏',  url:'twitter://',  show: !barrier      },
    { name:'Kindle',   icon:'📚', url:'kindle://',    show: true          },
    { name:'Obsidian', icon:'🔮', url:'obsidian://',  show: true          },
  ].filter(a => a.show);

  return (
    <div style={{ flex:1, minHeight:0, display:'flex', flexDirection:'column', position:'relative', overflow:'hidden' }}>
      {/* 背景装飾 */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden' }}>
        {!b ? (<>
          <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(circle, #c0caf522 1px, transparent 1px)', backgroundSize:'26px 26px' }}/>
          <svg style={{ position:'absolute', top:'-8%', left:'50%', transform:'translateX(-50%)', width:'90vw', maxWidth:'420px', opacity:0.13 }} viewBox="0 0 400 400">
            <circle cx="200" cy="200" r="170" fill="none" stroke="#4299e1" strokeWidth="1"/>
            <circle cx="200" cy="200" r="130" fill="none" stroke="#ecc94b" strokeWidth="0.7"/>
            <circle cx="200" cy="200" r="90"  fill="none" stroke="#4299e1" strokeWidth="0.5"/>
            <line x1="30" y1="200" x2="370" y2="200" stroke="#ecc94b" strokeWidth="0.5"/>
            <line x1="200" y1="30" x2="200" y2="370" stroke="#4299e1" strokeWidth="0.5"/>
            <circle cx="200" cy="200" r="4" fill="#ecc94b" opacity="0.6"/>
          </svg>
        </>) : (<>
          <svg style={{ position:'absolute', top:'-5%', left:'50%', transform:'translateX(-50%)', width:'100vw', maxWidth:'480px', opacity:0.18 }} viewBox="0 0 400 400">
            <circle cx="200" cy="200" r="175" fill="none" stroke="#a78bfa" strokeWidth="1"/>
            <circle cx="200" cy="200" r="135" fill="none" stroke="#7c3aed" strokeWidth="0.7"/>
            <circle cx="200" cy="200" r="95"  fill="none" stroke="#a78bfa" strokeWidth="0.5"/>
            <polygon points="200,25 228,108 318,108 246,160 272,243 200,191 128,243 154,160 82,108 172,108" fill="none" stroke="#a78bfa" strokeWidth="0.6"/>
          </svg>
          {[...Array(26)].map((_,i) => (<div key={i} style={{ position:'absolute', width:i%4===0?'2.5px':'1.5px', height:i%4===0?'2.5px':'1.5px', borderRadius:'50%', background:'#a78bfa', opacity:0.4+(i%3)*0.15, top:`${(i*73)%97}%`, left:`${(i*137.5)%97}%` }}/>))}
        </>)}
      </div>

      {/* クロック（上部） */}
      <div style={{ flex:'0 0 28%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', position:'relative', zIndex:1 }}>
        <div style={{ fontSize:'clamp(52px,16vw,72px)', fontWeight:'700', letterSpacing:'-4px', color:tCol, fontVariantNumeric:'tabular-nums', lineHeight:1, textShadow:b?'0 0 32px #a78bfa55':'none', transition:'color 0.8s' }}>
          {hh}<span style={{ color:b?'rgba(167,139,250,0.25)':'#c0c8d8' }}>:</span>{mm}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'8px', marginTop:'6px' }}>
          <span style={{ fontSize:'12px', fontWeight:'700', fontVariantNumeric:'tabular-nums', color:b?'#9f7aea':'#4299e1', background:b?'rgba(159,122,234,0.15)':'rgba(66,153,225,0.1)', padding:'2px 8px', borderRadius:'6px', border:`1px solid ${b?'rgba(159,122,234,0.3)':'rgba(66,153,225,0.2)'}` }}>
            {ss}<span style={{ fontSize:'9px', marginLeft:'1px', opacity:0.7 }}>s</span>
          </span>
          <span style={{ fontSize:'11px', color:sCol }}>{dateStr}</span>
        </div>
      </div>

      {/* ベイマックスの顔 + セリフ */}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'6px', position:'relative', zIndex:1, flexShrink:0, padding:'4px 0' }}>
        <BaymaxFace barrier={barrier} onTap={() => setBarrier(b => !b)} hpColor={hpColor} />
        <div style={{ fontSize:'12px', color:b?'#c4b5fd':sCol, textAlign:'center', maxWidth:'260px', lineHeight:'1.5', padding:'0 16px', fontStyle:'italic', transition:'color 0.8s' }}>
          「{baymaxLine}」
        </div>
      </div>

      {/* エネルギーカード（拡大） */}
      <div style={{ flex:1, padding:'6px 12px 8px', display:'flex', flexDirection:'column', justifyContent:'center', position:'relative', zIndex:1 }}>
        <div style={{ background:cBg, borderRadius:'22px', padding:'14px 16px', boxShadow:b?'0 4px 28px rgba(124,58,237,0.25)':'0 4px 20px rgba(0,0,0,0.07)', border:`1px solid ${cBdr}`, backdropFilter:b?'blur(12px)':'none', WebkitBackdropFilter:b?'blur(12px)':'none', transition:'all 0.8s', height:'100%', display:'flex', flexDirection:'column', justifyContent:'space-between' }}>

          {/* HP行 */}
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
              <span style={{ fontSize:'10px', color:sCol, letterSpacing:'1px' }}>ENERGY</span>
              <span style={{ fontSize:'13px', fontWeight:'800', color:b?'#a78bfa':hpColor, marginLeft:'auto', transition:'color 0.8s' }}>{hp} / 100</span>
            </div>
            <div style={{ height:'10px', borderRadius:'10px', background:b?'rgba(255,255,255,0.1)':'#edf2f7', overflow:'hidden', marginBottom:'8px' }}>
              <div style={{ height:'100%', borderRadius:'10px', width:`${hp}%`, background:b?'linear-gradient(90deg,#7c3aed88,#9f7aea)':`linear-gradient(90deg,${hpColor}88,${hpColor})`, transition:'width 1.2s ease, background 0.8s' }}/>
            </div>

            {/* CONDITION */}
            <div style={{ background:subBg, borderRadius:'10px', padding:'8px 10px', border:`1px solid ${subBdr}`, transition:'all 0.8s', marginBottom:'8px' }}>
              <div style={{ fontSize:'9px', color:sCol, letterSpacing:'1.5px', marginBottom:'3px' }}>CONDITION</div>
              <p style={{ fontSize:'12px', color:b?'#c4b5fd':'#4a5568', lineHeight:'1.6', margin:0, transition:'color 0.8s' }}>{cond.text}</p>
            </div>

            {/* 3指標 */}
            <div style={{ display:'flex', gap:'6px', marginBottom:'8px' }}>
              {healthStats.map(d => (
                <div key={d.label} style={{ flex:1, background:b?'rgba(255,255,255,0.06)':'#f8fafc', borderRadius:'9px', padding:'6px 4px', border:`1px solid ${subBdr}`, textAlign:'center', transition:'all 0.8s' }}>
                  <div style={{ fontSize:'9px', color:sCol, marginBottom:'1px' }}>{d.label}</div>
                  <div style={{ fontSize:'15px', fontWeight:'700', color:b?'#e9d8fd':'#2d3748', transition:'color 0.8s' }}>{d.value}</div>
                  <div style={{ fontSize:'9px', color:b?'#7c3aed':'#cbd5e0' }}>{d.unit}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 更新ボタン（大きく） */}
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <div style={{ fontSize:'10px', color:b?'rgba(167,139,250,0.5)':'#cbd5e0', flexShrink:0 }}>
              {loading?'読み込み中...':isDemo?'⚠️ デモ':updatedStr?`✅ ${updatedStr}`:' ✅'}
            </div>
            <a href="shortcuts://run-shortcut?name=Magic%20Port%20%E6%9B%B4%E6%96%B0"
              style={{ flex:1, display:'block', textAlign:'center', padding:'10px', borderRadius:'12px', background:b?'rgba(167,139,250,0.2)':`${hpColor}22`, border:`1.5px solid ${b?'rgba(167,139,250,0.4)':`${hpColor}55`}`, fontSize:'13px', fontWeight:'700', color:b?'#a78bfa':hpColor, textDecoration:'none', WebkitTapHighlightColor:'transparent', transition:'all 0.5s' }}>
              ↻ 今すぐ更新
            </a>
          </div>
        </div>
      </div>

      {/* アプリショートカット */}
      <div style={{ padding:'6px 12px 8px', display:'flex', gap:'8px', justifyContent:'center', position:'relative', zIndex:1, flexShrink:0 }}>
        {apps.map(app => (
          <a key={app.name} href={app.url}
            style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', padding:'8px 4px', background:b?'rgba(255,255,255,0.06)':'white', borderRadius:'14px', border:`1px solid ${b?'rgba(167,139,250,0.2)':'#e8edf5'}`, textDecoration:'none', boxShadow:'0 2px 8px rgba(0,0,0,0.05)', transition:'all 0.3s', WebkitTapHighlightColor:'transparent' }}>
            <span style={{ fontSize:'22px', lineHeight:1 }}>{app.icon}</span>
            <span style={{ fontSize:'9px', color:b?'#a78bfa':'#a0aec0', fontWeight:'600' }}>{app.name}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

// ━━━ タブ定義 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const TABS = [
  { key:'home',    label:'ホーム',   icon:'🏠' },
  { key:'task',    label:'タスク',   icon:'📋' },
  { key:'cleanse', label:'クレンズ', icon:'🧹' },
  { key:'mind',    label:'マインド', icon:'🧘' },
  { key:'safe',    label:'SAFE',     icon:'🛡️' },
];

// ━━━ メイン ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function Home() {
  const [now, setNow]=useState(new Date());
  const [tab, setTab]=useState('home');
  const [barrier, setBarrier]=useState(false);
  const [tasks, setTasks]=useState([]);
  const [health, setHealth]=useState({ steps:0, sleep:0, heartRate:0, isDemo:true, updatedAt:null });
  const [loading, setLoading]=useState(true);

  useEffect(() => { const t=setInterval(()=>setNow(new Date()),1000); return ()=>clearInterval(t); }, []);

  useEffect(() => {
    async function fetchHealth() {
      try { const res=await fetch('/api/health'); const data=await res.json(); if(!data.error) setHealth(data); }
      catch(e){console.error(e);}
      finally{setLoading(false);}
    }
    fetchHealth();
    const iv=setInterval(fetchHealth,5*60*1000);
    function onVisible(){if(document.visibilityState==='visible') fetchHealth();}
    document.addEventListener('visibilitychange',onVisible);
    return()=>{clearInterval(iv);document.removeEventListener('visibilitychange',onVisible);};
  }, []);

  const baseHP    = calcHP(health);
  const hp        = calcDecayedHP(baseHP, health.updatedAt);
  const hpColor   = getHPColor(hp);
  const cond      = { text: hp>=80?'エネルギー充分です。クリエイティブな作業に最適な状態ですよ。': hp>=60?'良い状態です。集中作業は午前中に終わらせておきましょう。': hp>=40?'少し疲れが出ています。今日の会議は最小限にしてください。': hp>=20?'回復が必要です。重要な決断は明日に回してよいです。':'今日は休む日です。自分を責めないでください。充電が最優先です。', emoji: hp>=80?'🌟':hp>=60?'😊':hp>=40?'🌿':hp>=20?'🍵':'🛌' };

  const appBg  = barrier?'linear-gradient(160deg,#140832 0%,#2d1b69 55%,#1a2c5c 100%)':'linear-gradient(160deg,#ffffff 0%,#f0f4ff 100%)';
  const tBarBg = barrier?'rgba(16,6,44,0.96)':'white';
  const tBarBdr= barrier?'rgba(167,139,250,0.2)':'#e8edf5';
  const TABBAR_HEIGHT=64;

  const healthStats=[
    {label:'歩数',value:loading?'...':health.steps.toLocaleString(),unit:'steps'},
    {label:'睡眠',value:loading?'...':health.sleep,unit:'h'},
    {label:'心拍',value:loading?'...':health.heartRate,unit:'bpm'},
  ];

  const cardStyle={background:'white',borderRadius:'22px',padding:'14px',boxShadow:'0 4px 20px rgba(0,0,0,0.07)',border:'1px solid #e8edf5',flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minHeight:0};

  function renderContent() {
    if(tab==='home') return (
      <HomeView hp={hp} baseHP={baseHP} cond={cond} hpColor={hpColor}
        barrier={barrier} setBarrier={setBarrier} now={now}
        healthStats={healthStats} isDemo={health.isDemo}
        loading={loading} updatedAt={health.updatedAt}/>
    );
    const titles={task:'TASK MATRIX',cleanse:'MIND CLEANSE',mind:'MINDFULNESS',safe:'HSP SAFE ZONE'};
    return (
      <div style={{ height:'100%', padding:'12px 14px 0', display:'flex', flexDirection:'column', boxSizing:'border-box' }}>
        <div style={cardStyle}>
          <div style={{ fontSize:'11px', color:'#a0aec0', letterSpacing:'2px', marginBottom:'8px', flexShrink:0 }}>{titles[tab]}</div>
          {tab==='task'    && <TaskTab tasks={tasks} setTasks={setTasks}/>}
          {tab==='cleanse' && <CleanseTab onAddTask={(text,quad)=>{setTasks(prev=>[...prev,{id:Date.now(),text,quad}]);setTab('task');}}/>}
          {tab==='mind'    && <MindTab/>}
          {tab==='safe'    && <SafeTab hp={hp} barrier={barrier} setBarrier={setBarrier}/>}
        </div>
      </div>
    );
  }

  return (
    <main style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:appBg, fontFamily:'-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', overflow:'hidden', userSelect:'none', WebkitUserSelect:'none', touchAction:'manipulation', transition:'background 0.8s ease' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, bottom:`calc(${TABBAR_HEIGHT}px + env(safe-area-inset-bottom))`, overflow:'hidden', display:'flex', flexDirection:'column' }}>
        {renderContent()}
      </div>
      <div style={{ position:'absolute', bottom:0, left:0, right:0, display:'flex', height:`${TABBAR_HEIGHT}px`, background:tBarBg, borderTop:`1px solid ${tBarBdr}`, paddingBottom:'env(safe-area-inset-bottom)', boxSizing:'content-box', transition:'background 0.8s, border-color 0.8s', backdropFilter:barrier?'blur(10px)':'none', WebkitBackdropFilter:barrier?'blur(10px)':'none', zIndex:100 }}>
        {TABS.map(t => {
          const active=tab===t.key;
          const col=active?(barrier?'#a78bfa':hpColor):(barrier?'#5b3f8a':'#a0aec0');
          return (
            <button key={t.key} onClick={()=>setTab(t.key)}
              style={{ flex:1, border:'none', background:'transparent', padding:'10px 0 8px', display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', cursor:'pointer', color:col, transition:'color 0.3s, transform 0.35s cubic-bezier(.34,1.56,.64,1)', transform:active?'scale(1.22) translateY(-3px)':'scale(1) translateY(0)' }}>
              <span style={{ fontSize:'20px', lineHeight:1 }}>{t.icon}</span>
              <span style={{ fontSize:'9.5px', fontWeight:active?'700':'400' }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </main>
  );
}
