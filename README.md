# Motion: Figma Prototype to Shopify

Motion: Figma Prototype to Shopify is a Figma Design plugin that exports one selected Figma frame, section, component, instance, or prototype starting frame into a Shopify Online Store 2.0 Liquid section.

User guide website: https://leejiehuiwellness-cmyk.github.io/motion-figma-prototype-to-shopify/

Credit: built by Jiehui.

The first version focuses on a practical same-day workflow:

- Select one finished Figma frame or flow starting point.
- Run the plugin in Figma Desktop.
- Review detected Shopify bindings and prototype interactions.
- Copy the generated Liquid section directly into Shopify, or download a ZIP with Liquid, CSS, JavaScript, template JSON, assets, and a conversion report.

## What It Generates

The plugin generates:

```text
sections/motion-figma-prototype-to-shopify.liquid
assets/motion-figma-prototype-to-shopify.css
assets/motion-figma-prototype-to-shopify.js
templates/page.motion-figma-prototype-to-shopify.json
motion-figma-prototype-to-shopify-report.json
README.md
```

The Liquid section is self-contained for fast copy/paste. It includes generated CSS inside `{% stylesheet %}` and generated JavaScript inside `{% javascript %}`. If the section references exported images or SVGs, upload those files into Shopify theme assets.

An example copy/paste section is included at `examples/example-shopify-section.liquid`.

Marketplace publishing copy is in `FIGMA_MARKETPLACE_COPY_READY.md`.

## Install Locally in Figma

1. Open the Figma desktop app.
2. Open a Figma Design file.
3. Right-click the canvas.
4. Choose Plugins > Development > Import plugin from manifest.
5. Select this file:

```text
manifest.json
```

6. Run Plugins > Development > Motion: Figma Prototype to Shopify.

## Quick Shopify Test

1. In Figma, select one top-level frame.
2. Run the plugin.
3. Click Generate export.
4. Open the Copy tab.
5. Click Copy Liquid.
6. In Shopify Admin, go to Online Store > Themes > Edit code.
7. Add a new section named `motion-figma-prototype-to-shopify`.
8. Paste the copied Liquid and save.
9. Open the theme editor and add the section to a page.

## Dynamic Layer Naming

Rename Figma layers to these names to generate Liquid bindings:

| Figma layer name | Shopify Liquid behavior |
| --- | --- |
| `product.title` | Renders product title |
| `product.price` | Renders product price with money formatting |
| `product.compare_at_price` | Renders compare-at price when applicable |
| `product.description` | Renders product description |
| `product.vendor` | Renders product vendor |
| `product.image` | Renders featured product image |
| `product.url` | Creates a product link |
| `product.add_to_cart` | Creates a product form and add-to-cart button |
| `collection.grid` | Loops over selected collection products |
| `menu.main` | Loops over selected menu links |
| `cart.count` | Renders cart item count |
| `cart.url` | Creates a cart link |

## Supported Prototype Interactions

The plugin reads Figma prototype reactions and compiles the practical subset needed for Shopify storefront sections. It also preserves the raw Figma reaction data in the export report so the full designer-authored interaction spec is not lost.

- Triggers: click/tap, hover, press, mouse enter, mouse leave, mouse down, mouse up, after delay.
- Actions: navigate, swap, change to, open overlay, back, close, URL.
- Transitions: dissolve, directional movement, push/slide-style movement, and Smart Animate-like matching layer diffs.
- Smart Animate diffs: position, scale, rotation, opacity, and solid fill color.

Unsupported prototype features are preserved in `motion-figma-prototype-to-shopify-report.json` as raw reaction data and warnings.

For the full Figma prototype property mapping used by this plugin, see `PROTOTYPE_SUPPORT_MATRIX.md`. The matrix is based on Figma's official prototyping guide and plugin API reaction/action/trigger types.

## Validate

Generate marketplace PNG assets:

```bash
npm run assets:marketplace
```

Run:

```bash
npm run validate
```

This checks the manifest, main plugin syntax, embedded UI script syntax, and required documentation.

## Marketplace Readiness

The plugin can be loaded and run locally from `manifest.json`. To make it searchable in the Figma Community plugin marketplace, publish it from your Figma account in Figma Desktop. See `MARKETPLACE_SUBMISSION.md`.

Repository: https://github.com/leejiehuiwellness-cmyk/motion-figma-prototype-to-shopify
