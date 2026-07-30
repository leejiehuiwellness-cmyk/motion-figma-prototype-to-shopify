# Shopify Copy/Paste Guide

Use this when you want the fastest possible test inside Shopify.

For a ready-made smoke test before running the plugin in Figma, use `examples/example-shopify-section.liquid`.

## A. From Figma

1. Select one frame, component, component set, instance, group, section, or a layer inside a component/instance.
2. Run Motion: Figma Prototype to Shopify.
3. Click Set Desktop.
4. Optional: select the mobile frame/section and click Set Mobile.
5. Choose Language label: `en`, `cn`, or `my`.
6. Click Generate export.
7. Open the Copy Code tab.
8. Click Copy Code.

## B. In Shopify Admin

1. Go to Online Store > Themes.
2. Click the three-dot menu on your development theme.
3. Click Edit code.
4. In the left sidebar, open Sections.
5. Click Add a new section.
6. Name the section exactly:

```text
motion-figma-prototype-to-shopify
```

If you changed File prefix in the plugin, use that file prefix instead.

If you leave Schema name as the default and set File name to `home_feature`, the copied code uses `"name": "home_feature"` in `{% schema %}` and saves the file as `home-feature.liquid`.

Responsive asset filenames include the frame mode and language label, for example `home-feature-desktop-en-*` and `home-feature-mobile-en-*`. Reused component/image assets are deduplicated in the ZIP and shared by the desktop and mobile code.

7. Delete the starter code Shopify creates.
8. Paste the full Liquid copied from the plugin.
9. Click Save.
10. CSS and JavaScript are already inside the copied section in Copy Code mode.

## C. Add the Section to a Page

1. Go back to Online Store > Themes.
2. Click Customize.
3. Open the page where you want the section.
4. Click Add section.
5. Choose Motion: Figma Prototype to Shopify.
6. If settings appear, choose:
   - Product fallback
   - Collection fallback
   - Main menu
   - Products to show
7. Save.

## D. Upload Assets if Needed

If the copied Liquid references files like this:

```liquid
{{ 'motion-figma-prototype-to-shopify-image-1.png' | asset_url }}
```

Then upload that file into Shopify:

1. Go to Online Store > Themes > Edit code.
2. Open Assets.
3. Click Add a new asset.
4. Upload the matching file from the exported ZIP `assets/` folder.

## E. Expected Result

After saving, Shopify should render:

- The selected Figma section layout.
- The selected component/instance layout when a designer builds the Shopify section as a Figma component.
- Liquid product/collection/menu/cart data for named layers.
- Inline CSS and JavaScript inside the generated Liquid section.
- Font family, font style, and font weight inherited from the Shopify theme.
- Supported Figma prototype animation such as click, hover, delay, overlay, and Smart Animate-style diffs.

## F. Common Fixes

| Symptom | Fix |
| --- | --- |
| Images are missing | Upload generated assets to the theme `assets` folder. |
| Section is not full width | Regenerate with the latest plugin. Copy Code now uses full-bleed viewport CSS instead of capping the stage at the Figma frame width. |
| Product data is blank | Add the section to a product page or choose Product fallback in section settings. |
| Collection grid is blank | Choose Collection fallback in section settings. |
| Menu is blank | Choose Main menu in section settings. |
| Animation does not move | Check `motion-figma-prototype-to-shopify-report.json` for unsupported prototype features. |
