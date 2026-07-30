# Figma Marketplace Submission Checklist

This repository is prepared as a local Figma plugin. Making it searchable in the Figma Community marketplace requires publishing it from your own Figma account in Figma Desktop.

## 1. Local Run Check

1. Open Figma Desktop.
2. Import `manifest.json` from this project.
3. Run Motion: Figma Prototype to Shopify from Plugins > Development.
4. Select a frame, component, instance, component set, or a layer inside a component and confirm the plugin can scan and generate a Shopify section.
5. Run `npm run validate` locally.

## 2. Replace the Manifest ID Before Publishing

The manifest currently includes a development ID:

```json
"id": "1512345678901234567"
```

When publishing:

1. Open Figma Desktop.
2. Go to Plugins > Manage plugins.
3. Create or publish the plugin.
4. If Figma shows "Invalid ID in manifest.json", click Generate ID.
5. Replace the `id` value in `manifest.json` with the Figma-generated ID.
6. Save the manifest and publish again.

## 3. Listing Copy

### Plugin Name

Motion: Figma Prototype to Shopify

### Repository

https://github.com/leejiehuiwellness-cmyk/motion-figma-prototype-to-shopify

### Tagline

Export Figma prototype sections into Shopify Liquid with motion-aware CSS and JavaScript.

### Short Description

Turn a selected Figma frame, component, instance, component set, component child layer, or prototype flow into a Shopify Online Store 2.0 section. The plugin detects Shopify data layer names, exports assets, reads prototype interactions, and generates Liquid, CSS, JavaScript, template JSON, and a conversion report.

### Long Description

Motion: Figma Prototype to Shopify helps designers and Shopify developers move high-fidelity Figma prototype sections into Shopify faster. Select one frame, component, instance, component set, component child layer, or prototype flow starting point, run the plugin, review detected product, collection, menu, and cart bindings, then export a Shopify Liquid section.

The generated section includes scoped CSS and JavaScript for common prototype interactions such as click, hover, press, after delay, overlays, URL actions, and Smart Animate-style matching layer changes. The export report preserves raw Figma prototype reactions and clearly lists unsupported features so teams know what to adjust manually.

Best for:

- Shopify landing page sections
- Product hero sections
- Collection grids
- Campaign modules
- Interactive menus and overlays
- Prototype-to-theme handoff

### Suggested Tags

```text
Shopify
Liquid
Ecommerce
Prototype
Animation
Developer handoff
Code export
```

## 4. Support Contact

Figma requires a support contact for published plugins. Use the GitHub issues page or replace it with your support email:

```text
https://github.com/leejiehuiwellness-cmyk/motion-figma-prototype-to-shopify/issues
```

Replace this with your real email, support page, or help center URL if preferred.

## 5. Required Screenshots

Prepare screenshots showing:

1. Selecting a Figma frame, component, instance, component set, or child layer inside a component.
2. Running the plugin.
3. Binding review.
4. Motion review.
5. Copy Code panel.
6. Shopify section rendered in a theme preview.

Figma's publishing flow recommends a 128 x 128px icon and a 1920 x 1080px thumbnail. The review goal is typically 5-10 business days after first submission.

## 6. Privacy and Network Notes

This v1 does not use external network requests. The manifest declares:

```json
"networkAccess": {
  "allowedDomains": ["none"]
}
```

The plugin reads the current Figma file selection and generates local export files in the plugin UI.

Use `PRIVACY.md` as the starting privacy note for the marketplace listing.

## 7. Included Marketplace Assets

This repo includes starter listing assets:

```text
marketplace-assets/icon.png
marketplace-assets/cover.png
marketplace-assets/icon.svg
marketplace-assets/cover.svg
```

Use `icon.png` for the 128 x 128px icon and `cover.png` for the 1920 x 1080px thumbnail. The SVG files are editable sources.

## 8. Release Criteria

Do not submit until:

- `npm run validate` passes.
- The plugin imports from manifest in Figma Desktop.
- Selected desktop and optional mobile frames, components, instances, component sets, or child layers can be scanned.
- Copy Code produces a complete responsive Shopify section with inline CSS and a regular script tag.
- Download ZIP creates a ZIP with section, assets, template, README, and report.
- A Shopify theme preview can render the pasted section.
