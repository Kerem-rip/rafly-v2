const { app, BrowserWindow, Menu, dialog, protocol, session, shell } = require("electron");
const { readFile } = require("node:fs/promises");
const path = require("node:path");

const scheme = "app";
const home = "app://rafly/";
const site = path.join(__dirname, "site");
const types = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
]);
const policy = [
  "default-src 'self'",
  "base-uri 'none'",
  "object-src 'none'",
  "frame-src 'none'",
  "form-action 'self'",
  "img-src 'self' https: data: blob:",
  "connect-src 'self' https:",
  "style-src 'self' 'unsafe-inline'",
];

protocol.registerSchemesAsPrivileged([
  { scheme, privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } },
]);

function isRaflyPage(url) {
  const page = URL.parse(url);
  return page?.protocol === "app:" && page.host === "rafly" && !page.username && !page.password;
}

function isPanelPage(url) {
  return isRaflyPage(url) && new URL(url).pathname.startsWith("/panel/");
}

async function serveSite(request) {
  if (!isRaflyPage(request.url)) return new Response(null, { status: 404 });

  try {
    const pathname = decodeURIComponent(new URL(request.url).pathname);
    const file = path.resolve(site, "." + (pathname.endsWith("/") ? pathname + "index.html" : pathname));
    const type = types.get(path.extname(file));
    if (!file.startsWith(site + path.sep) || !type) return new Response(null, { status: 404 });

    const scriptPolicy = isPanelPage(request.url) ? "script-src 'self'" : "script-src 'self' 'unsafe-inline'";
    return new Response(await readFile(file), {
      headers: {
        "Content-Type": type,
        "Content-Security-Policy": [...policy, scriptPolicy].join("; "),
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}

function openExternal(url) {
  const target = URL.parse(url);
  if (target && (target.protocol === "https:" || target.protocol === "mailto:")) {
    shell.openExternal(target.href).catch(() => {
      dialog.showErrorBox("Rafly", "Bağlantı açılamadı.");
    });
  }
}

function createWindow() {
  const window = new BrowserWindow({
    title: "Rafly",
    width: 1360,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(site, "assets/rafly-logo.png"),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  window.webContents.on("will-navigate", (event, url) => {
    if (isRaflyPage(url)) return;
    event.preventDefault();
    openExternal(url);
  });
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (isRaflyPage(url)) window.loadURL(url);
    else openExternal(url);
    return { action: "deny" };
  });

  const navigate = (page) => () => window.loadURL(new URL(page, home).href);
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {
      label: "Rafly",
      submenu: [
        { label: "Ana Sayfa", click: navigate("") },
        { label: "Personel Paneli", click: navigate("panel/#/") },
        { label: "Öğrenci Portalı", click: navigate("ogrenci/") },
        { label: "Destek", click: navigate("support.html") },
        { type: "separator" },
        { label: "Çıkış", role: "quit" },
      ],
    },
    { label: "Düzen", role: "editMenu" },
    {
      label: "Görünüm",
      submenu: [
        { label: "Yenile", role: "reload" },
        { label: "Normal Boyut", role: "resetZoom" },
        { label: "Yakınlaştır", role: "zoomIn" },
        { label: "Uzaklaştır", role: "zoomOut" },
      ],
    },
  ]));

  navigate("")();
}

app.whenReady().then(() => {
  protocol.handle(scheme, serveSite);
  const browser = session.defaultSession;
  browser.setPermissionCheckHandler((contents, permission, _origin, details) => (
    permission === "media" && details.mediaType === "video" &&
    details.isMainFrame && isPanelPage(contents?.getURL())
  ));
  browser.setPermissionRequestHandler((contents, permission, allow, details) => {
    const videoOnly = details.mediaTypes?.length === 1 && details.mediaTypes[0] === "video";
    allow(Boolean(permission === "media" && videoOnly && details.isMainFrame &&
      isPanelPage(details.requestingUrl) && isPanelPage(contents?.getURL())));
  });

  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
