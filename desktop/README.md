# Rafly Masaüstü

Personel paneli `panel-src` kaynaklarından derlenir. Öğrenci portalı, ana sayfa ve destek sayfaları `docs` klasöründen pakete alınır. Uygulama mevcut Rafly API'sini kullanır, bu yüzden okul işlemleri internet bağlantısı gerektirir.

## Çalıştırma

Repo kökünde Node.js 22 veya daha yeni bir sürümle şu komutları çalıştır:

```sh
npm ci --prefix panel-src
npm ci --prefix desktop
npm run start --prefix desktop
```

Uygulama menüsünden personel panelini veya öğrenci portalını açabilirsin. Kamera ile barkod taramak için işletim sisteminde Rafly'ye kamera izni ver.

## Windows x64

Windows üzerinde repo kökünden:

```sh
npm run build:win --prefix desktop
```

Kurulum dosyası `desktop/release/Rafly-Setup-0.1.0-x64.exe` altında oluşur. Linux'ta `npm run build:linux --prefix desktop` komutu `desktop/release/linux-unpacked` altında çalıştırılabilir bir paket üretir.
