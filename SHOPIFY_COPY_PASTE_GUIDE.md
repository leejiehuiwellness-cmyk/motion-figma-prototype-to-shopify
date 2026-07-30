# Shopify Copy/Paste Guide

Use this when you want the fastest possible test inside Shopify.

For a ready-made smoke test before running the plugin in Figma, use `examples/example-shopify-section.liquid`.

## A. From Figma

1. Select one frame, component, component set, instance, group, section, or a layer inside a component/instance.
2. Run Motion: Figma Prototype to Shopify.
3. Click Set Desktop.
4. Optional: select the mobile frame/section and click Set Mobile.
5. Choose Language label: `en`, `cn`, or `my`.
6. Choose Animation mode: Enter Once, Enter Replay, Infinite Loop, Scroll Scrub, or Pin Sequence.
7. Click Generate export.
8. Optional: open Assets, rename exported image/SVG filenames, then click Save and Run.
9. Open the Copy Code tab.
10. Click Copy Code.

For SVG export, rename the Figma layer with a clean filename such as `home_solution.svg`. Motion keeps the `.svg` intent but generates a Shopify-safe asset name such as `home-solution`.

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

If you renamed assets in the plugin, upload the renamed files shown in the Assets tab or exported manifest. Copy Code, Copy CSS, Copy JS, and Download ZIP all update after Save and Run.

11. Delete the starter code Shopify creates.
12. Paste the full Liquid copied from the plugin.
13. Click Save.
14. CSS and JavaScript are already inside the copied section in Copy Code mode.

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
- Smoother component/state motion: matched destination layers animate from the source layer position, size, rotation, opacity, color, and radius instead of showing every Figma state as a separate frame. If your Shopify theme already loads GSAP, the generated runtime uses `gsap.timeline()`; otherwise it uses a no-dependency fallback.
- Motion tab, manifest, and report show prototype routes and loops before you paste the section.
- Figma layer order is preserved in markup, while CSS `z-index` keeps the visual stack correct.
- PNG/image shadows come from the Figma layer wrapper, not from the inner PNG file.
- Selected scroll animation mode: Enter Once, Enter Replay, Infinite Loop, Scroll Scrub, or Pin Sequence.

## F. Common Fixes

| Symptom | Fix |
| --- | --- |
| Images are missing | Upload generated assets to the theme `assets` folder. |
| Section is not full width | Regenerate with the latest plugin. Copy Code now uses full-bleed viewport CSS instead of capping the stage at the Figma frame width. |
| Product data is blank | Add the section to a product page or choose Product fallback in section settings. |
| Collection grid is blank | Choose Collection fallback in section settings. |
| Menu is blank | Choose Main menu in section settings. |
| Animation does not move | Check `motion-figma-prototype-to-shopify-report.json` for unsupported prototype features. |
| Animation looks like a frame slideshow | Regenerate with the latest plugin and keep matching source/destination layer names consistent. The latest runtime uses destination-layer Smart Animate playback instead of whole-frame snapshots when safe layer matches are found. |
| Variant sequence unexpectedly loops | Open the Motion tab or export report and check Prototype routes. Loops are listed explicitly, such as `Variant 3 -> Variant 4 -> Variant 3`. |
| SVG exported as PNG | Rename the layer to a clean SVG filename such as `home_solution.svg`, then click Save and Run. |
| Image shadow looks wrong | Regenerate with the latest plugin. The inner image asset has `box-shadow: none`; the Figma layer effect is emitted on the wrapper. |
| Renamed asset is missing | Click Save and Run after renaming, then upload the regenerated filename from the ZIP `assets/` folder. |
