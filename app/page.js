'use client';
import { useState, useEffect } from 'react';

// ── ダミーデータ（Phase 2で本物に差し替え）──────────
const DUMMY_HEALTH = { steps: 6800, sleep: 6.2, heartRate: 72 };

// ── HP計算 ───────────────────────────────────────
function calcHP({ steps, sleep, heartRate }) {
  const s  = Math.min(steps / 8000, 1) * 40;
  const sl = Math.min(sleep / 7,    1) * 40;
  const hr = heartRate < 80 ? 20 : heartRate < 90 ? 10 : 0;
  return Math.round(s + sl + hr);
}

// ── Conditionメッセージ ───────────────────────────
function getCondition(hp) {
  if (hp >= 80) return { text: 'エネルギー充分です。クリエイティブな作業に最適な状態ですよ。', emoji: '🌟' };
  if (hp >= 60) return { text: '良い状態です。集中作業は午前中に終わらせておきましょう。', emoji: '😊' };
  if (hp >= 40) return { text: '少し疲れが出ています。今日の会議は最小限にしてください。', emoji: '🌿' };
  if (hp >= 20) return { text: '回復が必要です。重要な決断は明日に回してよいです。', emoji: '🍵' };
  return         { text: '今日は休む日です。自分を責めないでください。充電が最優先です。', emoji: '🛌' };
}

// ── HP色（80+:青 / 60-79:緑 / 40-59:黄 / 以下:赤）──
function getHPColor(hp) {
  if (hp >= 80) return '#4299e1';
  if (hp >= 60) return '#48bb78';
  if (hp >= 40) return '#ecc94b';
  return '#f56565';
}

// ── タスクデータ ─────────────────────────────────
const INIT_TASKS = [
  { id: 1, text: '企画書の提出',     quad: 'do'       },
  { id: 2, text: 'チームMTGの準備', quad: 'do'       },
  { id: 3, text: 'note記事の下書き', quad: 'schedule' },
  { id: 4, text: 'スキルアップ読書', quad: 'schedule' },
  { id: 5, text: 'メールの返信',     quad: 'delegate' },
  { id: 6, text: '不要ファイル整理', quad: 'delete'   },
];
const QUADS = [
  { key: 'do',       label: '今すぐ',   color: '#fc8181', bg: '#fff5f5' },
  { key: 'schedule', label: '予定',     color: '#63b3ed', bg: '#ebf8ff' },
  { key: 'delegate', label: '委任',     color: '#f6ad55', bg: '#fffaf0' },
  { key: 'delete',   label: 'やらない', color: '#a0aec0', bg: '#f7fafc' },
];

// ── ルーティンデータ ─────────────────────────────
const INIT_ROUTINES = [
  { id: 1, text: '朝の深呼吸',       done: false, time: '07:00' },
  { id: 2, text: '水を飲む',         done: false, time: '08:00' },
  { id: 3, text: 'タスク確認',       done: false, time: '09:00' },
  { id: 4, text: '昼休憩（完全離席）', done: false, time: '12:00' },
  { id: 5, text: '夕方の振り返り',   done: false, time: '17:00' },
];

// ════════════════════════════════════════════════
// タブ①：タスク行列
// ════════════════════════════════════════════════
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
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'hidden' }}>
      {/* 入力欄 */}
      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
        <select value={quad} onChange={e => setQuad(e.target.value)}
          style={{ border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '6px 8px', fontSize: '12px', color: '#4a5568', background: 'white', outline: 'none' }}>
          {QUADS.map(q => <option key={q.key} value={q.key}>{q.label}</option>)}
        </select>
        <input value={newTask} onChange={e => setNewTask(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="タスクを追加..."
          style={{ flex: 1, border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '6px 10px', fontSize: '12px', outline: 'none', color: '#2d3748' }} />
        <button onClick={add}
          style={{ background: '#4a5568', color: 'white', border: 'none', borderRadius: '10px', padding: '6px 14px', fontSize: '16px', cursor: 'pointer' }}>
          ＋
        </button>
      </div>
      {/* 4象限 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', flex: 1, minHeight: 0 }}>
        {QUADS.map(q => (
          <div key={q.key} style={{ background: q.bg, borderRadius: '12px', padding: '8px', border: `1.5px solid ${q.color}33`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ fontSize: '10px', fontWeight: '700', color: q.color, marginBottom: '5px', flexShrink: 0 }}>{q.label}</div>
            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {tasks.filter(t => t.quad === q.key).map(task => (
                <div key={task.id} style={{ background: 'white', borderRadius: '7px', padding: '5px 7px', fontSize: '11px', color: '#4a5568', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{task.text}</span>
                  <button onClick={() => setTasks(tasks.filter(t => t.id !== task.id))}
                    style={{ background: 'none', border: 'none', color: '#cbd5e0', fontSize: '13px', cursor: 'pointer', padding: '0 0 0 4px', flexShrink: 0 }}>×</button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
// タブ②：マインドフルネス（4-4-6呼吸法）
// ════════════════════════════════════════════════
function MindTab() {
  const [phase, setPhase] = useState('idle');
  const [elapsed, setElapsed] = useState(0);
  const [rounds, setRounds] = useState(0);

  const config = { inhale: { next: 'hold', dur: 4, label: '吸う', color: '#63b3ed' }, hold: { next: 'exhale', dur: 4, label: '止める', color: '#9f7aea' }, exhale: { next: 'inhale', dur: 6, label: '吐く', color: '#68d391' } };

  useEffect(() => {
    if (phase === 'idle') return;
    const iv = setInterval(() => {
      setElapsed(e => {
        const dur = config[phase].dur;
        if (e + 1 >= dur) {
          if (phase === 'exhale') setRounds(r => r + 1);
          setPhase(config[phase].next);
          return 0;
        }
        return e + 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [phase]);

  const cur = phase !== 'idle' ? config[phase] : null;
  const progress = cur ? (elapsed / cur.dur) * 360 : 0;
  const color = cur ? cur.color : '#e2e8f0';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px' }}>
      <div style={{ fontSize: '11px', color: '#a0aec0', letterSpacing: '1px' }}>
        4-4-6 呼吸法 {rounds > 0 && `— ${rounds}回完了 🌿`}
      </div>
      <div onClick={() => { setPhase(phase === 'idle' ? 'inhale' : 'idle'); setElapsed(0); }}
        style={{ width: '110px', height: '110px', borderRadius: '50%', border: `4px solid ${color}`, background: `conic-gradient(${color}55 ${progress}deg, #f0f4ff ${progress}deg)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: cur ? `0 0 24px ${color}44` : 'none', transition: 'box-shadow 0.5s' }}>
        {phase === 'idle'
          ? <span style={{ fontSize: '13px', color: '#a0aec0', textAlign: 'center', padding: '0 8px' }}>タップして開始</span>
          : <>
              <span style={{ fontSize: '14px', fontWeight: '700', color }}>{cur.label}</span>
              <span style={{ fontSize: '32px', fontWeight: '800', color }}>{cur.dur - elapsed}</span>
            </>
        }
      </div>
      <p style={{ fontSize: '12px', color: '#718096', textAlign: 'center', maxWidth: '220px', lineHeight: '1.7', margin: 0 }}>
        {phase === 'idle' ? 'HSPの神経系を落ち着かせる呼吸法です。\n会議前に3セットやってみましょう。' : ''}
      </p>
    </div>
  );
}

// ════════════════════════════════════════════════
// タブ③：SAFE（HSP対策）
// ════════════════════════════════════════════════
function SafeTab({ hp }) {
  const [barrier, setBarrier] = useState(false);

  const alerts = [
    hp < 60 ? '⚠️ エネルギーが低下中。重要な決断は避けましょう' : null,
    '📅 連続会議：2件（14:00〜）',
    '🌙 昨夜の睡眠：6.2h（推奨より0.8h不足）',
  ].filter(Boolean);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
      {/* バリアモードボタン */}
      <div onClick={() => setBarrier(!barrier)}
        style={{ background: barrier ? 'linear-gradient(135deg, #e9d8fd, #d6bcfa)' : '#f7fafc', borderRadius: '14px', padding: '12px 14px', border: `1.5px solid ${barrier ? '#9f7aea' : '#e2e8f0'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, transition: 'all 0.3s' }}>
        <div style={{ fontSize: '28px' }}>{barrier ? '🛡️' : '🔓'}</div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: barrier ? '#553c9a' : '#4a5568' }}>{barrier ? 'バリアモード ON' : 'バリアモード OFF'}</div>
          <div style={{ fontSize: '11px', color: barrier ? '#805ad5' : '#a0aec0', marginTop: '2px' }}>{barrier ? '精神的な防御が有効です' : 'タップして精神的バリアを張る'}</div>
        </div>
      </div>
      {/* アラート */}
      {alerts.map((a, i) => (
        <div key={i} style={{ background: '#fffaf0', borderRadius: '10px', padding: '9px 12px', fontSize: '12px', color: '#744210', border: '1px solid #fbd38d', flexShrink: 0 }}>{a}</div>
      ))}
      {/* HSPケアヒント */}
      <div style={{ background: '#f0fff4', borderRadius: '10px', padding: '10px 12px', border: '1px solid #c6f6d5', flexShrink: 0 }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: '#276749', marginBottom: '4px' }}>💚 今日のHSPケア</div>
        <div style={{ fontSize: '12px', color: '#2f855a', lineHeight: '1.7' }}>会議の合間に2分間、目を閉じて静かな場所へ。感覚のリセットが疲労を和らげます。</div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
// タブ④：ルーティン管理
// ════════════════════════════════════════════════
function RoutineTab() {
  const [routines, setRoutines] = useState(INIT_ROUTINES);

  function toggle(id) { setRoutines(routines.map(r => r.id === id ? { ...r, done: !r.done } : r)); }

  const done = routines.filter(r => r.done).length;
  const pct  = Math.round((done / routines.length) * 100);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'hidden' }}>
      {/* 進捗バー */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '11px', color: '#a0aec0' }}>今日の進捗</span>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#4a5568' }}>{done} / {routines.length}</span>
        </div>
        <div style={{ height: '6px', borderRadius: '6px', background: '#edf2f7', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: '6px', width: `${pct}%`, background: 'linear-gradient(90deg, #68d39199, #68d391)', transition: 'width 0.5s ease' }} />
        </div>
      </div>
      {/* チェックリスト */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', flex: 1 }}>
        {routines.map(r => (
          <div key={r.id} onClick={() => toggle(r.id)}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', background: r.done ? '#f0fff4' : 'white', borderRadius: '10px', padding: '9px 12px', border: `1.5px solid ${r.done ? '#c6f6d5' : '#e2e8f0'}`, cursor: 'pointer', transition: 'all 0.2s' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${r.done ? '#48bb78' : '#cbd5e0'}`, background: r.done ? '#48bb78' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '11px', color: 'white', fontWeight: '700' }}>
              {r.done && '✓'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', color: r.done ? '#276749' : '#4a5568', textDecoration: r.done ? 'line-through' : 'none' }}>{r.text}</div>
              <div style={{ fontSize: '10px', color: '#a0aec0', marginTop: '1px' }}>{r.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
// メイン画面
// ════════════════════════════════════════════════
const TABS = [
  { key: 'task',    label: 'タスク',     icon: '📋' },
  { key: 'mind',    label: 'マインド',   icon: '🧘' },
  { key: 'safe',    label: 'SAFE',       icon: '🛡️' },
  { key: 'routine', label: 'ルーティン', icon: '🔄' },
];

export default function Home() {
  const [now, setNow] = useState(new Date());
  const [tab, setTab] = useState('task');

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const hp       = calcHP(DUMMY_HEALTH);
  const cond     = getCondition(hp);
  const hpColor  = getHPColor(hp);

  const hh = now.getHours().toString().padStart(2, '0');
  const mm = now.getMinutes().toString().padStart(2, '0');
  const ss = now.getSeconds().toString().padStart(2, '0');
  const dateStr  = now.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'long' });
  const greeting = now.getHours() < 12 ? 'おはようございます' : now.getHours() < 18 ? 'こんにちは' : 'お疲れさまです';

  return (
    <main style={{
      height: '100dvh',
      display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(160deg, #ffffff 0%, #f0f4ff 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      overflow: 'hidden',
      userSelect: 'none', WebkitUserSelect: 'none',
      touchAction: 'manipulation',
    }}>

      {/* ─────────────────────────────────────────
          上部 1/3：ライブクロック
      ───────────────────────────────────────── */}
      <div style={{ flex: '0 0 30%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
        <div style={{ fontSize: '11px', color: '#a0aec0', letterSpacing: '3px', marginBottom: '4px' }}>
          {greeting}
        </div>
        <div style={{ fontSize: 'clamp(52px, 16vw, 76px)', fontWeight: '700', color: '#1a202c', letterSpacing: '-3px', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
          {hh}<span style={{ color: '#c0c8d8' }}>:</span>{mm}
        </div>
        <div style={{ fontSize: '14px', color: '#a0aec0', marginTop: '5px', letterSpacing: '0.5px' }}>
          {ss}s &nbsp;·&nbsp; {dateStr}
        </div>
      </div>

      {/* ─────────────────────────────────────────
          下部 2/3（上）：エネルギー＆ヘルス
      ───────────────────────────────────────── */}
      <div style={{ flex: '0 0 28%', padding: '0 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ background: 'white', borderRadius: '22px', padding: '14px 16px', boxShadow: '0 4px 20px rgba(0,0,0,0.07)', border: '1px solid #e8edf5' }}>
          {/* HP行 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '9px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, #f8faff, #f0f4ff)', border: `2.5px solid ${hpColor}`, boxShadow: `0 0 14px ${hpColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
              {cond.emoji}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ fontSize: '10px', color: '#a0aec0', letterSpacing: '1px' }}>ENERGY</span>
                <span style={{ fontSize: '12px', fontWeight: '800', color: hpColor }}>{hp} / 100</span>
              </div>
              <div style={{ height: '7px', borderRadius: '7px', background: '#edf2f7', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: '7px', width: `${hp}%`, background: `linear-gradient(90deg, ${hpColor}77, ${hpColor})`, transition: 'width 1.2s ease' }} />
              </div>
            </div>
          </div>
          {/* CONDITION */}
          <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '8px 10px', marginBottom: '8px' }}>
            <div style={{ fontSize: '9px', color: '#a0aec0', letterSpacing: '1.5px', marginBottom: '3px' }}>CONDITION</div>
            <p style={{ fontSize: '12px', color: '#4a5568', lineHeight: '1.6', margin: 0 }}>{cond.text}</p>
          </div>
          {/* 3指標 */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { label: '歩数', value: DUMMY_HEALTH.steps.toLocaleString(), unit: 'steps' },
              { label: '睡眠', value: DUMMY_HEALTH.sleep, unit: 'h' },
              { label: '心拍', value: DUMMY_HEALTH.heartRate, unit: 'bpm' },
            ].map(d => (
              <div key={d.label} style={{ flex: 1, background: '#f8fafc', borderRadius: '9px', padding: '6px 4px', border: '1px solid #e8edf5', textAlign: 'center' }}>
                <div style={{ fontSize: '9px', color: '#a0aec0', marginBottom: '1px' }}>{d.label}</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#2d3748' }}>{d.value}</div>
                <div style={{ fontSize: '9px', color: '#cbd5e0' }}>{d.unit}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────
          タブコンテンツエリア
      ───────────────────────────────────────── */}
      <div style={{ flex: 1, padding: '8px 14px 0', minHeight: 0 }}>
        <div style={{ background: 'white', borderRadius: '22px', padding: '14px', boxShadow: '0 4px 20px rgba(0,0,0,0.07)', border: '1px solid #e8edf5', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {tab === 'task'    && <TaskTab />}
          {tab === 'mind'    && <MindTab />}
          {tab === 'safe'    && <SafeTab hp={hp} />}
          {tab === 'routine' && <RoutineTab />}
        </div>
      </div>

      {/* ─────────────────────────────────────────
          タブバー（固定）
      ───────────────────────────────────────── */}
      <div style={{ display: 'flex', background: 'white', borderTop: '1px solid #e8edf5', paddingBottom: 'env(safe-area-inset-bottom)', flexShrink: 0 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ flex: 1, border: 'none', background: 'transparent', padding: '10px 0 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer', color: tab === t.key ? hpColor : '#a0aec0', transition: 'color 0.2s' }}>
            <div style={{ fontSize: '20px', lineHeight: 1 }}>{t.icon}</div>
            <div style={{ fontSize: '10px', fontWeight: tab === t.key ? '700' : '400' }}>{t.label}</div>
          </button>
        ))}
      </div>

    </main>
  );
}
