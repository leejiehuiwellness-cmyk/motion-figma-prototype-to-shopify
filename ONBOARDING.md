# Onboarding Guide

This guide is written for a designer or Shopify builder who wants to move one Figma prototype section into Shopify.

## 1. Prepare the Figma Frame or Component

1. Open your Figma Design file.
2. Make sure the design section is finalized.
3. Put the Shopify section in one clear frame, component, component variant, instance, group, or section when possible.
4. If the component is part of a prototype flow, make sure it has prototype connections from buttons, links, overlays, hover states, or variant state changes.
5. Select only one frame, section, component, component set, instance, group, or a layer inside a component/instance before running the plugin.
6. If you select a child layer inside a component or instance, Motion automatically exports the nearest supported ancestor as the Shopify section boundary.

## 2. Name Dynamic Shopify Layers

Use these exact layer names when you want Shopify data instead of static text:

```text
product.title
product.price
product.compare_at_price
product.description
product.vendor
product.image
product.url
product.add_to_cart
collection.grid
menu.main
cart.count
cart.url
```

Recommended product card structure:

```text
collection.grid
  Product Card
    product.image
    product.title
    product.price
    product.url
```

Recommended product hero structure:

```text
Product Hero
  product.image
  product.vendor
  product.title
  product.price
  product.description
  product.add_to_cart
```

## 3. Add Figma Prototype Interactions

The plugin reads Figma prototype interaction details from the selected flow:

- Hotspot: the layer where the interaction starts.
- Trigger: click/tap, hover, press, after delay, mouse enter/leave, mouse down/up.
- Action: navigate, swap, change to, open overlay, back, close, URL.
- Destination: the target frame or overlay.
- Animation: dissolve, movement, push/slide, Smart Animate-like matching layer changes.
- Direction, duration, and easing.

Keep names consistent between source and destination frames if you want Smart Animate-style conversion. Figma Smart Animate matches layers by name and hierarchy; this plugin follows the same idea for Shopify motion diffs.

For the complete trigger/action/transition support table, read `PROTOTYPE_SUPPORT_MATRIX.md`. It follows Figma's official "Guide to prototyping in Figma" and the Figma Plugin API reaction model.

## 4. Run the Plugin

1. Open Figma Desktop.
2. Select the desktop frame, component, component instance, component set, group, section, or a layer inside the component you want to export.
3. Run Plugins > Development > Motion: Figma Prototype to Shopify.
4. Click Set Desktop.
5. Optional: select the mobile frame/section and click Set Mobile.
6. Choose Language label: `en`, `cn`, or `my`. Exported assets use names such as `home-feature-desktop-en-*` and `home-feature-mobile-en-*`.
7. Click Rescan if you changed the selection.
8. Review Overview, Bindings, Motion, and warnings.
9. Click Generate export.

## 5. Copy to Shopify

Fastest path:

1. Open the Copy Code tab in the plugin.
2. Click Copy Code.
3. Open Shopify Admin.
4. Go to Online Store > Themes > Edit code.
5. In the `sections` folder, click Add a new section.
6. Name it `motion-figma-prototype-to-shopify`, or use the file prefix shown in the plugin.
7. Replace all generated starter code with the copied Liquid.
8. Upload referenced image/SVG assets from the ZIP as needed. CSS and JavaScript are already included inside the copied section.
9. Save.
10. Open Customize theme.
11. Add the section to a page.
12. Choose product, collection, and menu settings if the section asks for them. Font family, font style, and font weight inherit from the Shopify theme automatically.

ZIP path:

1. Click Download ZIP in the plugin.
2. Unzip the export.
3. Copy `sections/*.liquid` into your Shopify theme `sections` folder.
4. Upload referenced image/SVG files from `assets/` into your Shopify theme `assets` folder. The generated CSS/JavaScript files are optional developer copies in Copy Code mode.
5. Optionally copy `templates/page.*.json` into your theme `templates` folder.
6. Preview with Shopify CLI or the Shopify theme editor.

## 6. Verify Before Publishing

Check:

- Desktop layout.
- Mobile layout.
- The export report selection block: selected layer and export root should match the component boundary you want in Shopify.
- Product title, price, image, and add-to-cart behavior.
- Collection product loop.
- Menu links.
- Cart count.
- Click/hover/after-delay/overlay animation.
- Reduced motion preference.
- Conversion report warnings.
