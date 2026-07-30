# Shopify Copy/Paste Guide

Use this when you want the fastest possible test inside Shopify.

For a ready-made smoke test before running the plugin in Figma, use `examples/example-shopify-section.liquid`.

## A. From Figma

1. Select one top-level frame.
2. Run Motion: Figma Prototype to Shopify.
3. Click Generate export.
4. Open the Copy tab.
5. Click Copy Liquid.

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

7. Delete the starter code Shopify creates.
8. Paste the full Liquid copied from the plugin.
9. Click Save.

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
- Liquid product/collection/menu/cart data for named layers.
- Inline CSS from the generated `{% stylesheet %}` block.
- Inline JavaScript motion from the generated `{% javascript %}` block.
- Supported Figma prototype animation such as click, hover, delay, overlay, and Smart Animate-style diffs.

## F. Common Fixes

| Symptom | Fix |
| --- | --- |
| Images are missing | Upload generated assets to the theme `assets` folder. |
| Product data is blank | Add the section to a product page or choose Product fallback in section settings. |
| Collection grid is blank | Choose Collection fallback in section settings. |
| Menu is blank | Choose Main menu in section settings. |
| Animation does not move | Check `motion-figma-prototype-to-shopify-report.json` for unsupported prototype features. |
