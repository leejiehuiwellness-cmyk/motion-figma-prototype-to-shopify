# Figma Variants to Shopify Fix Report

## Root Causes Found

1. `buildExport()` previously produced one `rootModel` and passed that single model through generation, so `COMPONENT_SET` children could be rendered as ordinary children instead of distinct Shopify states.
2. `resolveExportRoot()` supported component child selection, but individual `COMPONENT` variants did not reliably promote to their parent `COMPONENT_SET`.
3. `collectDestinationModels()` only collected the first queued destination IDs and did not recursively follow destination reactions, so chains such as `Variant2 -> Variant3 -> Variant4 -> Variant3` could be incomplete.
4. `buildMotionGraph()` emitted destination names and layer diffs, but it did not generate exact source/destination state switching instructions.
5. `generateRuntimeJs()` implemented fallback dissolve by briefly changing root section opacity, which could leave variants hidden instead of activating the destination.
6. `generateLiquidSection()` rendered one body tree without a coordinated code mode, so variants could be arranged by their original Component Set coordinates and CSS/JS could be double-loaded if inline and external references were both emitted.
7. `generateCss()` calculated layout from one root and did not create a dedicated responsive stage with overlaid states.
8. `maybeExportNodeAsset()` exported image fills and SVGs, but filenames were not based on exact node identity/hash and there was no asset manifest for successes, failures, dimensions, or duplicate use.

## Architecture Locations

- Selection and root resolution: `buildExport()`, `resolveExportRoot()`, `buildSelectionInfo()`.
- Figma node traversal: `serializeNode()`, `walk()`, `walkAll()`.
- Component Set and variant state collection: `createStateModels()`, `normalizeStateRoot()`, `chooseStartState()`.
- Prototype destination resolution: `readReactions()`, `collectDestinationModels()`.
- Interaction graph generation: `buildMotionGraph()`, `findDestinationModel()`, `triggerDelayMs()`, `buildSmartDiffs()`.
- Asset export: `maybeExportNodeAsset()`, `recordAssetSuccess()`, `recordAssetFailure()`, `addAssetUse()`.
- Liquid generation: `generateLiquidSection()`, `renderState()`, `renderNode()`.
- CSS generation: `generateCss()`, `cssForNode()`.
- JavaScript playback: `generateRuntimeJs()`.
- Package output: `generateShopifyFiles()`, `generateExportManifest()`, `generateExportReportMd()`, `generateReport()`.

## Implemented Behavior

- Selecting a `COMPONENT_SET` exports every direct `COMPONENT` variant as a state.
- Selecting one variant `COMPONENT` promotes export to its parent `COMPONENT_SET`.
- Selecting a child layer inside a component/instance still promotes to the nearest supported component/instance/component set boundary.
- Recursive destination traversal follows queued `destinationId` values and uses a visited set plus traversal limit to prevent circular chains from looping forever.
- Generated Liquid uses one `.fts-stage` sized from the starting state, then stacks `.fts-variant` states absolutely inside it.
- Generated runtime includes `changeVariant(sourceNodeId, destinationNodeId, transition)` and switches by exact Figma node ID.
- Smart Animate layer diffs now include both source and destination node IDs. The storefront runtime prepares matching destination layers from source geometry, mutes the matched source layers, then plays the destination layers into their final position/scale/rotation/opacity/color/radius so component prototype chains read as continuous motion instead of frame snapshots.
- Matched Smart Animate layers use GSAP timeline playback when `window.gsap` is already available on the Shopify theme, while keeping the original no-dependency fallback.
- Motion now builds and exports a prototype route graph, including circular variant/component loops, so the Motion tab and reports can show routes such as `Variant 3 -> Variant 4 -> Variant 3`.
- Scroll animation settings are now compiled into each viewport motion JSON, with Enter Once, Enter Replay, Infinite Loop, Scroll Scrub, and Pin Sequence runtime behavior.
- Exported assets now record `defaultFilename` and user-facing `shopifyFilename`. The Assets tab Save and Run flow regenerates Copy Code, Copy CSS, Copy JS, ZIP, manifest, and report with renamed files.
- SVG forcing supports clean filename layers such as `home_solution.svg`; image/PNG shadows are emitted on the Figma layer wrapper, not the inner file asset, and generated markup follows Figma layer panel order with CSS `z-index` preserving the visual stack.
- Layer stack direction now keeps earlier/top Figma children at higher `z-index`, preventing lower/background artwork from moving above foreground text or icons.
- Static layer rotation and Figma text weight/style/alignment/letter-spacing/line-height are emitted in CSS while font family still inherits from the Shopify theme.
- ZIP exports include `assets/motion-figma-gsap-runtime.css` and `assets/motion-figma-gsap-runtime.js`; Copy Code mode inlines the same runtime/base CSS.
- Repeated generated CSS declarations are grouped across similar layers to reduce duplicate Copy Code output.
- Generated Copy Code mode embeds CSS in `{% stylesheet %}` and JavaScript in a regular `<script>` tag inside the Liquid section. The optional `assets/*.css` and `assets/*.js` files are still packaged as developer copies, but the default Liquid does not load them with `asset_url`, preventing double loading.
- Generated text inherits Shopify theme font variables by default without adding extra theme-style settings to the section schema.
- Asset export now deduplicates by image hash or vector node ID, records every `usedBy` node, and writes failed exports into the asset manifest with warnings.

## Unsupported or Fallback Behavior

- Figma variables, conditionals, scroll-to behavior, media runtime actions, vector morphing, and full spring physics remain report-only or approximated.
- Smart Animate uses matching layer keys from path/name/type/structure. When safe matching is not found, runtime falls back to a destination crossfade and keeps the destination visible.
- `ON_DRAG` / `DRAG` is mapped to `pointerdown` as a conservative storefront trigger rather than full draggable physics.
