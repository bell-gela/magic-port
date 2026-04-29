'use client';
import { useState } from 'react';

// ダミーデータ（Phase 2でAppleヘルスの本物データに差し替えます）
const DUMMY_HEALTH = {
  steps: 6800,
  sleep: 6.2,
  heartRate: 72,
};

// HPを計算する関数（歩数・睡眠・心拍から0〜100を算出）
function calcHP({ steps, sleep, heartRate }) {
  const stepScore  = Math.min(steps / 8000, 1) * 40;
  const sleepScore = Math.min(sleep / 7,    1) * 40;
  const hrScore    = heartRate < 80 ? 20 : heartRate < 90 ? 10 : 0;
  return Math.round(stepScore + sleepScore + hrScore);
}

// HPに応じたベイマックスのメッセージ
function getMessage(hp) {
  if (hp >= 80) return { text: 'エネルギー充分です。クリエイティブな作業に最適な状態ですよ。', emoji: '🌟' };
  if (hp >= 60) return { text: '良い状態です。集中作業は午前中に終わらせておきましょう。', emoji: '😊' };
  if (hp >= 40) return { text: '少し疲れが出ています。今日の会議は最小限にしてください。', emoji: '🌿' };
  if (hp >= 20) return { text: '回復が必要です。重要な決断は明日に回してよいです。', emoji: '🍵' };
  return         { text: '今日は休む日です。自分を責めないでください。充電が最優先です。', emoji: '🛌' };
}

// HPに応じたゲージの色
function getHPColor(hp) {
  if (hp >= 80) return '#68d391'; // 緑
  if (hp >= 60) return '#63b3ed'; // 青
  if (hp >= 40) return '#f6e05e'; // 黄
  if (hp >= 20) return '#f6ad55'; // オレンジ
  return '#fc8181';               // 赤
}

// アイゼンハワー行列のダミータスク
const INITIAL_TASKS = [
  { id: 1, text: '企画書の提出',     quad: 'do'      },
  { id: 2, text: 'チームMTGの準備', quad: 'do'      },
  { id: 3, text: 'note記事の下書き', quad: 'schedule'},
  { id: 4, text: 'スキルアップ読書', quad: 'schedule'},
  { id: 5, text: 'メールの返信',     quad: 'delegate'},
  { id: 6, text: '不要ファイル整理', quad: 'delete'  },
];

const QUADS = [
  { key: 'do',       label: '今すぐやる',     sub: '重要 × 緊急',     color: '#fc8181', bg: '#fff5f5' },
  { key: 'schedule', label: '予定を入れる',   sub: '重要 × 緊急でない', color: '#63b3ed', bg: '#ebf8ff' },
  { key: 'delegate', label: '誰かに任せる',   sub: '緊急 × 重要でない', color: '#f6ad55', bg: '#fffaf0' },
  { key: 'delete',   label: 'やらない',       sub: '重要でない × 緊急でない', color: '#a0aec0', bg: '#f7fafc' },
];

export default function Home() {
  const hp = calcHP(DUMMY_HEALTH);
  const msg = getMessage(hp);
  const hpColor = getHPColor(hp);

  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [newTask, setNewTask] = useState('');
  const [activeQuad, setActiveQuad] = useState('do');
  const [dragging, setDragging] = useState(null);

  function addTask() {
    if (!newTask.trim()) return;
    setTasks([...tasks, { id: Date.now(), text: newTask.trim(), quad: activeQuad }]);
    setNewTask('');
  }

  function removeTask(id) {
    setTasks(tasks.filter(t => t.id !== id));
  }

  function moveTask(id, quad) {
    setTasks(tasks.map(t => t.id === id ? { ...t, quad } : t));
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #ffffff 0%, #f0f4ff 100%)',
      padding: '24px 16px 48px',
      maxWidth: '480px',
      margin: '0 auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>

      {/* ヘッダー */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div style={{ fontSize: '11px', color: '#a0aec0', letterSpacing: '2px', marginBottom: '4px' }}>
          MAGIC PORT
        </div>
        <div style={{ fontSize: '13px', color: '#718096' }}>
          {new Date().toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'long' })}
        </div>
      </div>

      {/* ベイマックス本体 + HPメーター */}
      <div style={{
        background: 'white',
        borderRadius: '28px',
        padding: '28px 24px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
        marginBottom: '16px',
        border: '1px solid #e8edf5',
        textAlign: 'center',
      }}>
        {/* 顔 */}
        <div style={{
          width: '88px', height: '88px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #ffffff, #f0f4ff)',
          border: `3px solid ${hpColor}`,
          boxShadow: `0 0 20px ${hpColor}55`,
          margin: '0 auto 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '44px',
          transition: 'border-color 0.8s, box-shadow 0.8s',
        }}>
          {msg.emoji}
        </div>

        {/* HPメーター */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#a0aec0', letterSpacing: '1px' }}>
              ENERGY
            </span>
            <span style={{ fontSize: '13px', fontWeight: '800', color: hpColor }}>
              {hp} / 100
            </span>
          </div>
          <div style={{
            height: '10px', borderRadius: '10px',
            background: '#edf2f7', overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: '10px',
              width: `${hp}%`,
              background: `linear-gradient(90deg, ${hpColor}99, ${hpColor})`,
              transition: 'width 1.2s cubic-bezier(.4,0,.2,1)',
            }} />
          </div>
        </div>

        {/* コンシェルジュメッセージ */}
        <div style={{
          background: '#f8fafc',
          borderRadius: '14px',
          padding: '14px 16px',
          border: '1px solid #e8edf5',
        }}>
          <div style={{ fontSize: '11px', color: '#a0aec0', marginBottom: '6px', letterSpacing: '1px' }}>
            BAYMAX SAYS
          </div>
          <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: '1.7', margin: 0 }}>
            {msg.text}
          </p>
        </div>

        {/* ヘルスデータ小表示 */}
        <div style={{
          display: 'flex', gap: '8px', marginTop: '14px',
        }}>
          {[
            { label: '歩数', value: DUMMY_HEALTH.steps.toLocaleString(), unit: 'steps' },
            { label: '睡眠', value: DUMMY_HEALTH.sleep, unit: 'h' },
            { label: '心拍', value: DUMMY_HEALTH.heartRate, unit: 'bpm' },
          ].map(d => (
            <div key={d.label} style={{
              flex: 1, background: '#f8fafc',
              borderRadius: '12px', padding: '8px 4px',
              border: '1px solid #e8edf5', textAlign: 'center',
            }}>
              <div style={{ fontSize: '10px', color: '#a0aec0', marginBottom: '2px' }}>{d.label}</div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#2d3748' }}>{d.value}</div>
              <div style={{ fontSize: '10px', color: '#cbd5e0' }}>{d.unit}</div>
            </div>
          ))}
        </div>
      </div>

      {/* アイゼンハワー行列 */}
      <div style={{
        background: 'white',
        borderRadius: '28px',
        padding: '24px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
        border: '1px solid #e8edf5',
      }}>
        <div style={{ fontSize: '11px', color: '#a0aec0', letterSpacing: '2px', marginBottom: '16px' }}>
          TASK MATRIX
        </div>

        {/* タスク追加 */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <select
            value={activeQuad}
            onChange={e => setActiveQuad(e.target.value)}
            style={{
              border: '1.5px solid #e2e8f0', borderRadius: '10px',
              padding: '8px', fontSize: '12px', color: '#4a5568',
              background: 'white', outline: 'none',
            }}
          >
            {QUADS.map(q => (
              <option key={q.key} value={q.key}>{q.label}</option>
            ))}
          </select>
          <input
            value={newTask}
            onChange={e => setNewTask(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTask()}
            placeholder="タスクを追加..."
            style={{
              flex: 1, border: '1.5px solid #e2e8f0',
              borderRadius: '10px', padding: '8px 12px',
              fontSize: '13px', outline: 'none',
              color: '#2d3748',
            }}
          />
          <button
            onClick={addTask}
            style={{
              background: '#4a5568', color: 'white',
              border: 'none', borderRadius: '10px',
              padding: '8px 14px', fontSize: '16px',
              cursor: 'pointer',
            }}
          >＋</button>
        </div>

        {/* 4象限グリッド */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {QUADS.map(q => (
            <div
              key={q.key}
              onDragOver={e => e.preventDefault()}
              onDrop={() => dragging && moveTask(dragging, q.key)}
              style={{
                background: q.bg,
                borderRadius: '16px',
                padding: '12px',
                border: `1.5px solid ${q.color}33`,
                minHeight: '100px',
              }}
            >
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: q.color }}>
                  {q.label}
                </div>
                <div style={{ fontSize: '10px', color: '#a0aec0' }}>{q.sub}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {tasks.filter(t => t.quad === q.key).map(task => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => setDragging(task.id)}
                    onDragEnd={() => setDragging(null)}
                    style={{
                      background: 'white',
                      borderRadius: '8px',
                      padding: '6px 8px',
                      fontSize: '12px',
                      color: '#4a5568',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                      cursor: 'grab',
                      border: `1px solid ${q.color}22`,
                    }}
                  >
                    <span>{task.text}</span>
                    <button
                      onClick={() => removeTask(task.id)}
                      style={{
                        background: 'none', border: 'none',
                        color: '#cbd5e0', fontSize: '14px',
                        cursor: 'pointer', padding: '0 0 0 6px',
                        lineHeight: 1,
                      }}
                    >×</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* フッター */}
      <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '11px', color: '#cbd5e0' }}>
        ※ 現在はダミーデータを表示中です
      </div>

    </main>
  );
}
