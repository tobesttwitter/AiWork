# AI Photo Editor — Flutter app

Android-first Flutter client for the AI Photo Editor. It sends selected image bytes and a text prompt to the Node.js proxy in `../proxy/`.

## Requirements

- Flutter 3.38+ / Dart 3.10+ for the current dependency set.
- Android SDK / emulator or a physical Android device.
- The proxy must be running and reachable.

## Configure

Copy:

```bash
cp .env.example .env
```

Set `PROXY_URL` to the proxy's URL.

For an Android emulator, the example `http://10.0.2.2:8080` reaches a proxy running on the host machine. A physical device must use a reachable LAN/HTTPS address.

You can also avoid a local `.env` file:

```bash
flutter run --dart-define=PROXY_URL=https://your-proxy.example.com
```

No Gemini API key belongs in this app.

## Run

If the platform folders are not present:

```bash
flutter create --platforms=android,ios .
```

Then:

```flutter
flutter pub get
flutter run
```

## MVP

- Pick a photo.
- Enter an editing instruction.
- Send it to the proxy.
- Preview the returned image.
- Save it to the gallery.
- Share it using the system share sheet.

The app uses the OS photo picker through `image_picker` on modern Android. The `gal` package handles gallery-save permission.

## Limitations

- Internet and a running proxy are required.
- Images are sent as base64 JSON.
- No local AI inference.
- No history, crop tool, layers, or masks yet.
- The Gemini model's current pricing and quotas are controlled by Google and can change.
