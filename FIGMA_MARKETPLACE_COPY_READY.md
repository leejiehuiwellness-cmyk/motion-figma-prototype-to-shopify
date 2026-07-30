# Figma Marketplace Copy-Ready Submission

Use this file while publishing from Figma Desktop.

## Plugin Identity

### Name

```text
Motion: Figma Prototype to Shopify
```

### Tagline

```text
Export Figma prototype interactions into Shopify Liquid sections with motion-aware CSS and JavaScript.
```

### Category

```text
Development
```

Alternative category:

```text
Design tools
```

## Description

```text
Motion: Figma Prototype to Shopify helps designers and Shopify developers turn a selected Figma frame or prototype flow into a Shopify Online Store 2.0 Liquid section.

Select one top-level frame, component, instance, group, section, or prototype starting frame. The plugin scans the selected hierarchy, detects Shopify data layer names, reads prototype reactions, exports assets, and generates a Shopify-ready Liquid section with scoped CSS, JavaScript motion runtime, template JSON, README, and conversion report.

Supported Shopify layer names include product.title, product.price, product.image, product.description, product.vendor, product.url, product.add_to_cart, collection.grid, menu.main, cart.count, and cart.url.

Supported prototype behavior includes click/tap, hover, press, mouse enter/leave, mouse down/up, after-delay triggers, navigate, swap, change-to, overlay, close, back, URL actions, dissolve movement, directional movement, and Smart Animate-style matching layer diffs for position, scale, rotation, opacity, and solid fill color.

The export report preserves raw Figma prototype reactions so the full designer-authored interaction specification is available even when a feature cannot be compiled automatically in v1.

Best for Shopify landing sections, product hero sections, collection grids, campaign modules, interactive menus, overlays, and prototype-to-theme handoff.
```

## Support Contact

Use this support URL after the GitHub source is pushed:

```text
https://github.com/leejiehuiwellness-cmyk/motion-figma-prototype-to-shopify/issues
```

Fallback if Figma requires email:

```text
jiehui02@gmail.com
```

## Repository

```text
https://github.com/leejiehuiwellness-cmyk/motion-figma-prototype-to-shopify
```

## Images

### Icon

```text
C:\Users\User\Documents\Figma Prototype to Shopify - Motion\marketplace-assets\icon.png
```

Size: 128 x 128px

### Thumbnail / Cover

```text
C:\Users\User\Documents\Figma Prototype to Shopify - Motion\marketplace-assets\cover.png
```

Size: 1920 x 1080px

## Privacy / Data Security Answers

### Does the plugin use network access?

```text
No. The manifest declares no external network access using allowedDomains: ["none"].
```

### What data does the plugin read?

```text
The plugin reads only the current Figma file selection needed to generate the export: selected node names, hierarchy, layout/style properties, text contents, image fills, vector export data, and prototype reactions.
```

### Does the plugin send data to external servers?

```text
No. It does not send Figma file data, generated code, images, analytics, or user data to external servers.
```

### Does the plugin store data?

```text
No server-side storage is used. Generated Liquid, CSS, JavaScript, assets, ZIP files, and reports are created locally in the plugin UI and downloaded by the user.
```

### Does the plugin collect personal data?

```text
No account credentials, Shopify admin data, payment data, analytics events, or personal data are collected.
```

## Local Plugin Import Path

```text
C:\Users\User\Documents\Figma Prototype to Shopify - Motion\manifest.json
```

## Verification Commands

```bash
npm run assets:marketplace
npm run validate
```

## Current Review Caveat

Figma Community visibility is not instant. After submission, the plugin must pass Figma review before it appears publicly in Community search.

