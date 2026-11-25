# Football Rivals — Android App (trial)

Real native-shell Android app (Capacitor 7) with the FULL game bundled inside
the APK: `www/` is a copy of the live site's public tree (code + all card art,
~171MB). The game runs locally on the phone (offline for local play and the
card library). Features that live on the server (accounts, sync, online
results) call the existing backend at football-rivals-arena.vercel.app —
`www/` HTML pages carry a small first-script shim (FR-APP-SHIM) that rewrites
`/api/` calls to the live backend only when running inside the app, and
CapacitorHttp is enabled so those calls bypass CORS natively. The PWA service
worker is disabled inside the app.

Build: GitHub Actions → "Build Football Rivals APK" → artifact
`Football-Rivals-APK` (app-debug.apk, debug-signed, sideloadable).
appId: com.bibo.footballrivals
