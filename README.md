<div align="center">

<img src="assets/icon.svg" width="92" alt="Toolynx logo">

# Toolynx

### The local-first developer toolbox.

**23 fast utilities. Zero accounts. Zero tracking. Zero uploads. Zero runtime dependencies.**

[Live App](https://argyrios-dev.github.io/toolynx/) · [Report an issue](https://github.com/argyrios-dev/toolynx/issues) · [MIT License](LICENSE)

</div>

---

## Why Toolynx

Developer utilities are usually scattered across dozens of websites. Toolynx puts the ones you reach for every day into one fast, installable web app that runs locally in your browser.

- Local-first processing
- Offline-ready PWA
- No analytics or telemetry
- No accounts
- No third-party JavaScript
- No build step
- No runtime dependencies
- Responsive on mobile, tablet and desktop
- Keyboard launcher with `Cmd + K` / `Ctrl + K`

## Included tools

| Category | Tools |
| --- | --- |
| **Data** | JSON Studio, CSV ↔ JSON, Color Converter |
| **Encoding** | Base64, URL Encoder, HTML Entities |
| **Security** | JWT Decoder, Hash Generator, UUID Generator, Password Generator, Random Token |
| **Text** | Case Converter, Text Inspector, Unicode Inspector, Text Diff |
| **System** | Timestamp Converter, Number Base, chmod Calculator, Cron Explainer |
| **Network** | IPv4 Subnet, URL Inspector, HTTP Status, MIME Lookup |

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

## Deploy

The project is designed for static hosting and GitHub Pages. The production site is expected at:

```text
https://argyrios-dev.github.io/toolynx/
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

## Contributing

Focused issues and pull requests are welcome. Keep additions local-first, dependency-light, mobile-friendly and easy to audit.

## License

Released under the [MIT License](LICENSE).

---

<div align="center">

Built by [argyrios-dev](https://github.com/argyrios-dev).

**Toolynx — useful tools, minus the noise.**

</div>
