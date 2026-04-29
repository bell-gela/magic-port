export default function Home() {
  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #ffffff 0%, #f0f4ff 100%)',
      padding: '20px',
    }}>
      {/* ベイマックス風の丸いアイコン */}
      <div style={{
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        background: 'white',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '60px',
        marginBottom: '32px',
        border: '3px solid #e8eaf6',
      }}>
        🤖
      </div>

      <h1 style={{
        fontSize: '28px',
        fontWeight: '700',
        color: '#2d3748',
        margin: '0 0 12px 0',
        letterSpacing: '-0.5px',
      }}>
        Hello, Magic Port
      </h1>

      <p style={{
        fontSize: '16px',
        color: '#718096',
        textAlign: 'center',
        maxWidth: '280px',
        lineHeight: '1.7',
        margin: '0 0 40px 0',
      }}>
        おみのエネルギーを守る、<br />
        やさしいセルフケアパートナー ✨
      </p>

      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '20px 28px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        fontSize: '14px',
        color: '#4a5568',
        textAlign: 'center',
        border: '1px solid #e2e8f0',
      }}>
        🌟 Magic Port、まもなく起動します
      </div>
    </main>
  );
}
