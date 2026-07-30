# Motion: Figma Prototype to Shopify

Motion: Figma Prototype to Shopify is a Figma Design plugin that exports one selected Figma frame, section, component, component set, instance, group, or a selected layer inside a component/instance into a Shopify Online Store 2.0 Liquid section.

User guide website: https://leejiehuiwellness-cmyk.github.io/motion-figma-prototype-to-shopify/

Credit: built by Jiehui.

The first version focuses on a practical same-day workflow:

- Select one finished Figma frame, component, instance, component variant, or a layer inside a component.
- Run the plugin in Figma Desktop.
- Review detected Shopify bindings and prototype interactions.
- Choose the scroll animation mode, optionally rename exported assets, then copy the generated Copy Code section directly into Shopify or download a ZIP with Liquid, optional CSS/JavaScript developer copies, template JSON, assets, and a conversion report.

## What It Generates

The plugin generates:

```text
sections/motion-figma-prototype-to-shopify.liquid
assets/motion-figma-prototype-to-shopify.css
assets/motion-figma-prototype-to-shopify.js
templates/page.motion-figma-prototype-to-shopify.json
motion-figma-prototype-to-shopify-manifest.json
motion-figma-prototype-to-shopify-export-report.md
motion-figma-prototype-to-shopify-report.json
README.md
```

The default Copy Code section includes generated CSS in `{% stylesheet %}` and generated JavaScript in a regular `<script>` tag so one pasted section file can run in Shopify. Upload only referenced image or SVG assets into Shopify theme assets before previewing. The generated CSS/JS files in the ZIP are optional developer copies and are not loaded by the default Liquid section.

Generated sections are full-bleed by default. Motion uses viewport-width CSS so the Figma stage can expand past Shopify theme `page-width` containers while preserving the original Figma aspect ratio.

For responsive exports, select the desktop frame in Figma and click `Set Desktop`, then select the mobile frame and click `Set Mobile`. Motion combines both frames into one Liquid section and switches them with CSS at mobile widths while sharing duplicate image/SVG assets when possible.

Exported image/SVG assets can be renamed in the Assets tab. After editing filenames, click `Save and Run`; Motion regenerates Copy Code, Copy CSS, Copy JS, Download ZIP, manifest, and report with the saved Shopify asset filenames.

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

1. In Figma, select one top-level desktop frame, component, instance, component set, group, section, or a layer inside a component/instance.
2. Run the plugin.
3. Click Set Desktop.
4. Optional: select the mobile frame/section and click Set Mobile.
5. Choose Language label: `en`, `cn`, or `my`.
6. Choose Animation mode: `Enter Once`, `Enter Replay`, `Infinite Loop`, `Scroll Scrub`, or `Pin Sequence`.
7. Click Generate export.
8. Optional: open Assets, rename exported files, then click Save and Run.
9. Open the Copy Code tab.
10. Click Copy Code.
11. In Shopify Admin, go to Online Store > Themes > Edit code.
12. Add a new section named `motion-figma-prototype-to-shopify`.
13. Paste the copied Liquid and save.
14. Open the theme editor and add the section to a page.

The Shopify schema `name` follows the Schema name field. If Schema name is left as the default and you set File name to something like `home_feature`, Motion uses `home_feature` as the schema display name and `home-feature.liquid` as the Shopify-safe file name.

## Component Layer Export

Designers often build Shopify sections as components or variants. Motion supports that workflow:

- Select a component, component set, or instance directly to export it as the Shopify section boundary.
- Select a child layer inside a component or instance, such as `product.title` or `product.add_to_cart`; Motion automatically exports the nearest component/instance ancestor.
- Select a variant component to export its parent Component Set. Motion exports every direct component variant and uses one responsive stage with overlaid states instead of placing variants side by side.
- Prototype `CHANGE_TO` / Smart Animate-style state changes are compiled as real source-to-destination variant switches by exact Figma node ID when matching layer names and hierarchy are consistent.
- Smart Animate playback now prepares matching destination layers from the source layer geometry, then moves/scales/rotates/fades them into their final Shopify state. This avoids the old "frame-by-frame slideshow" feeling for designer-built component animation chains.
- The export report records both the selected layer and the actual export root so builders can verify the component boundary before pasting into Shopify.

## Shopify Theme Font Inheritance

Generated text inherits Shopify theme font variables such as `--font-body-family`, `--font-body-style`, `--font-body-weight`, `--font-heading-family`, `--font-heading-style`, and `--font-heading-weight`. Motion keeps the Figma text sizing and uses Shopify's `--font-body-scale` when the theme provides it, without adding extra theme-style settings to the section schema.

## SVG Asset Naming

Vector layers export as SVG automatically. To force a non-vector image/frame layer to export as an SVG asset when Figma supports it, name the layer with one of these formats: `logo.svg`, `Logo [svg]`, `Logo #svg`, or `Logo export=svg`.

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
- Smart Animate diffs: position, scale, rotation, opacity, solid fill color, and corner radius, played as destination-layer interpolation instead of whole-frame snapshots.
- Scroll animation modes: Enter Once, Enter Replay, Infinite Loop, Scroll Scrub, and Pin Sequence. ScrollTrigger is used when a Shopify theme already provides GSAP + ScrollTrigger; otherwise Motion uses a no-dependency fallback.

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
