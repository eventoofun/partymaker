import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();

  const adminId = process.env.ADMIN_USER_ID;
  if (!userId || !adminId || userId !== adminId) {
    return new NextResponse(null, { status: 404 });
  }

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<title>Cumplefy Admin</title>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<link rel="stylesheet" href="/admin-panel/assets/tokens.css"/>
<style>
  *{box-sizing:border-box}
  html,body{margin:0;padding:0;background:var(--surface-bg);color:var(--neutral-100);font-family:var(--font-body);-webkit-font-smoothing:antialiased}
  body{
    background:
      radial-gradient(ellipse 1200px 600px at 10% -10%, rgba(0,194,209,.08), transparent 60%),
      radial-gradient(ellipse 1000px 500px at 100% 0%, rgba(255,179,0,.05), transparent 60%),
      radial-gradient(ellipse 800px 600px at 50% 100%, rgba(255,77,109,.04), transparent 60%),
      var(--surface-bg);
    min-height:100vh;
  }
  body::after{
    content:'';position:fixed;inset:0;pointer-events:none;z-index:0;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.5'/></svg>");
    opacity:.025;
  }
  button{font-family:inherit}
  ::selection{background:rgba(0,194,209,.3);color:#fff}
  ::-webkit-scrollbar{width:10px;height:10px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:rgba(0,194,209,.15);border-radius:99px}
  ::-webkit-scrollbar-thumb:hover{background:rgba(0,194,209,.3)}
  @keyframes pulse-dot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.15)}}
  @keyframes ring-pulse{0%{box-shadow:0 0 0 0 rgba(0,229,160,.55)}70%{box-shadow:0 0 0 10px rgba(0,229,160,0)}100%{box-shadow:0 0 0 0 rgba(0,229,160,0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
  @keyframes fade-up{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
  @keyframes glow-breathe{0%,100%{box-shadow:0 0 20px rgba(0,194,209,.25), 0 0 40px rgba(0,194,209,.1)}50%{box-shadow:0 0 30px rgba(0,194,209,.45), 0 0 70px rgba(0,194,209,.2)}}
  @keyframes float-in{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}
  @keyframes modal-in{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:none}}
  @keyframes backdrop-in{from{opacity:0}to{opacity:1}}
  @keyframes slideRight{from{transform:translateX(-6px);opacity:0}to{transform:none;opacity:1}}
  @keyframes particle{0%{transform:translateY(0) scale(1);opacity:.8}100%{transform:translateY(-28px) scale(.3);opacity:0}}
</style>
</head>
<body>
<div id="root"></div>
<script src="https://unpkg.com/react@18.3.1/umd/react.development.js" integrity="sha384-hD6/rw4ppMLGNu3tX5cjIb+uRZ7UkRJ6BPkLpg4hAu/6onKUg4lLsHAs9EBPT82L" crossorigin="anonymous"></script>
<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js" integrity="sha384-u6aeetuaXnQ38mYT8rp6sbXaQe3NL9t+IBXmnYxwkUI2Hw4bsp2Wvmx4yRQF1uAm" crossorigin="anonymous"></script>
<script src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js" integrity="sha384-m08KidiNqLdpJqLq95G/LEi8Qvjl/xUYll3QILypMoQ65QorJ9Lvtp2RXYGBFj1y" crossorigin="anonymous"></script>
<script type="text/babel" src="/admin-panel/src/shared.jsx"></script>
<script type="text/babel" src="/admin-panel/src/shell.jsx"></script>
<script type="text/babel" src="/admin-panel/src/screens/overview.jsx"></script>
<script type="text/babel" src="/admin-panel/src/screens/usuarios.jsx"></script>
<script type="text/babel" src="/admin-panel/src/screens/eventos.jsx"></script>
<script type="text/babel" src="/admin-panel/src/screens/pagos.jsx"></script>
<script type="text/babel" src="/admin-panel/src/screens/ia.jsx"></script>
<script type="text/babel" src="/admin-panel/src/screens/tienda.jsx"></script>
<script type="text/babel" src="/admin-panel/src/screens/comunicaciones.jsx"></script>
<script type="text/babel" src="/admin-panel/src/screens/compliance.jsx"></script>
<script type="text/babel" src="/admin-panel/src/screens/integraciones.jsx"></script>
<script type="text/babel" src="/admin-panel/src/screens/audit.jsx"></script>
<script type="text/babel" src="/admin-panel/src/screens/equipo.jsx"></script>
<script type="text/babel" src="/admin-panel/src/app.jsx"></script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
