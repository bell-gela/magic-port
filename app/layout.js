export const metadata = {
  title: 'Magic Port',
  description: 'おみのセルフケアパートナー',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Magic Port" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body style={{
        margin: 0, padding: 0,
        fontFamily: 'sans-serif',
        overscrollBehavior: 'none',
      }}>
        {children}
      </body>
    </html>
  );
}
