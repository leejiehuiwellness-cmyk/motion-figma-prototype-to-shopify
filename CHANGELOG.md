# Changelog

## 0.1.3

- Preserves selected Figma layer transform and opacity more accurately by reading Figma transform matrices, using unrotated node bounds for positioned layers, and composing Smart Animate transform deltas with each layer's existing CSS/base transform.
- Updates GSAP Smart Animate playback so rotated destination layers tween back to their own Figma base transform instead of being reset to rotation 0.

## 0.1.2

- Restores the previous Smart Animate runtime used before the source-layer/static-hold playback experiments, while keeping layer stacking, rotation/text, shared runtime assets, and grouped CSS updates.

## 0.1.0

- Initial local Figma plugin.
- Exports selected Figma frame/section/component/group into a Shopify Online Store 2.0 Liquid section.
- Exports selected component sets, instances, and child layers inside components by promoting them to the nearest supported component/instance export boundary.
- Adds Shopify layer naming conventions for product, collection, menu, and cart bindings.
- Reads Figma prototype reactions and compiles supported interaction motion to storefront JavaScript.
- Plays Smart Animate component/state chains with destination-layer interpolation so Shopify motion feels closer to Figma Play instead of showing each state as a separate frame.
- Uses GSAP timeline playback for matched Smart Animate layers when `window.gsap` is already available, with the existing no-dependency fallback for Shopify themes without GSAP.
- Detects prototype routes and circular variant/component loops in the Motion tab, manifest, and export report.
- Adds scroll animation modes: Enter Once, Enter Replay, Infinite Loop, Scroll Scrub, and Pin Sequence.
- Adds Assets tab rename workflow with Save and Run regeneration for Copy Code, Copy CSS, Copy JS, ZIP, manifest, and report.
- Supports SVG-forcing layer names such as `home_solution.svg`, `logo.svg`, `Logo [svg]`, `Logo #svg`, and `Logo export=svg`.
- Emits image/PNG shadows on the Figma layer wrapper, keeps inner image assets shadow-free, and outputs markup in Figma layer panel order with `z-index` preserving the visual stack.
- Fixes layer stack direction so top layer-panel children keep higher `z-index` and bottom/background layers stay behind.
- Preserves static layer rotation and Figma text weight/style/alignment/letter-spacing/line-height while still inheriting Shopify theme font family.
- Packages shared theme assets at `assets/motion-figma-gsap-runtime.css` and `assets/motion-figma-gsap-runtime.js`.
- Groups repeated generated CSS declarations across similar layers to reduce Copy Code noise.
- Preserves raw prototype reactions in the conversion report.
- Adds onboarding, copy/paste Shopify guide, privacy note, marketplace listing copy, icon, cover, and validation smoke test.
