<div align="center">

<img src="assets/icon.svg" width="92" alt="Toolynx logo">

# Toolynx

### The local-first developer toolbox.

**32 fast utilities. Windows + macOS + Linux + mobile. Zero accounts. Zero tracking. Zero uploads. Zero runtime dependencies.**

[Live App](https://argyrios-dev.github.io/toolynx/) · [Report an issue](https://github.com/argyrios-dev/toolynx/issues) · [MIT License](LICENSE)

</div>

---

## Why Toolynx

Developer utilities are usually scattered across dozens of websites. Toolynx puts the ones you reach for every day into one fast, installable web app that runs locally in your browser.

- Local-first processing
- Offline-ready PWA
- Native-feeling mouse, touch and keyboard interactions
- Windows / Linux shortcut: `Ctrl + K`
- macOS shortcut: `Cmd + K`
- Right-click tool cards on desktop for quick actions
- Automatic System / Light / Dark theme
- Follows the host OS color scheme by default
- No analytics or telemetry
- No accounts
- No third-party JavaScript
- No build step
- No runtime dependencies
- Responsive on mobile, tablet and desktop
- Reduced-motion support
- Visible keyboard focus states

## Included tools

| Category | Tools |
| --- | --- |
| **Data** | JSON Studio, JSON Flatten, CSV ↔ JSON, Query String, Color Converter, Data Size Converter |
| **Encoding** | Base64, URL Encoder, HTML Entities |
| **Security** | JWT Decoder, Hash Generator, HMAC SHA-256, UUID Generator, Password Generator, Random Token |
| **Text** | Case Converter, Text Inspector, Unicode Inspector, Text Diff, Regex Tester, Slug Generator, Line Toolkit, Lorem Ipsum |
| **System** | Timestamp Converter, Number Base, chmod Calculator, Cron Explainer |
| **Network** | IPv4 Subnet, URL Inspector, HTTP Status, MIME Lookup, Port Reference |

## Desktop support

Toolynx v1.1.0 treats desktop platforms as first-class targets.

### Windows and Linux

- `Ctrl + K` opens the command palette.
- UI typography includes Segoe UI and common Windows/Linux fallbacks.
- Desktop cards support mouse hover and right-click quick actions.
- Focus rings make full keyboard navigation visible.
- Standard browser/PWA installation works on Chromium-based desktop browsers.

### macOS

- `Cmd + K` opens the command palette.
- System font stack integrates naturally with macOS.
- The app follows macOS Light/Dark appearance when Theme is set to **System**.

### Theme behavior

The theme button cycles through:

```text
System → Light → Dark
```

`System` is the default. It follows `prefers-color-scheme` live, so changing the host operating system between Light and Dark updates Toolynx automatically.

The selected override is stored only in local browser storage.

## Mouse and pointer support

On devices with a fine pointer:

- Tool cards get desktop hover feedback.
- Right-click a tool card to open it or copy a direct link.
- Click outside the context menu, scroll or resize to dismiss it.
- Touch devices do not receive hover-only behavior.

## Privacy model

Toolynx has no application backend. Tool inputs are processed with browser APIs on the device where possible. The app contains no analytics, telemetry endpoint, advertising SDK, account system or remote processing service.

> JWT Decoder is an inspection utility. It decodes the token header and payload but does not verify signatures.

## Run locally

No dependency installation is required.

```bash
git clone https://github.com/argyrios-dev/toolynx.git
cd toolynx
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

On Windows, you can use:

```powershell
py -m http.server 8080
```

## Stack

```text
HTML
CSS
Vanilla JavaScript
Web Crypto API
Service Worker
Web App Manifest
```

No framework. No bundler. No CDN dependency.

## Version 1.1.0

Highlights:

- 23 → 32 built-in tools
- System / Light / Dark theme selector
- Live host OS theme detection
- Windows/Linux keyboard labels
- Desktop right-click quick actions
- Better mouse hover and focus behavior
- Reduced-motion support
- Split `index.html`, `styles.css` and `app.js`
- Improved PWA cache
- New PWA shortcuts

## Contributing

Focused issues and pull requests are welcome. Keep additions local-first, dependency-light, keyboard-accessible, mouse-friendly, mobile-friendly and easy to audit.

## License

Released under the [MIT License](LICENSE).

---

<div align="center">

Built by [argyrios-dev](https://github.com/argyrios-dev).

**Toolynx — useful tools, minus the noise.**

</div>
