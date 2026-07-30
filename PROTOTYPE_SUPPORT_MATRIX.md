# Figma Prototype Support Matrix

This document maps Figma prototype concepts to the v1 Shopify export behavior.

Primary references:

- Figma Help: Guide to prototyping in Figma: https://help.figma.com/hc/en-us/articles/360040314193-Guide-to-prototyping-in-Figma
- Figma Plugin API: `Reaction`, `Trigger`, `Action`, and transition types
- Shopify theme sections and section schema documentation

## Prototype Concepts

| Figma concept | Meaning | V1 behavior |
| --- | --- | --- |
| Flow starting point | The first frame, component, instance, or variant in a prototype flow | Use the selected frame, section, component, component set, instance, group, or nearest supported ancestor as the Shopify section root |
| Component layer selection | A child layer selected inside a component or instance | Automatically promotes export to the nearest component/instance/component set boundary when available |
| Component Set variants | Direct component children in a selected Component Set | Exported as overlaid Shopify states inside one responsive stage |
| Hotspot | Layer where the interaction starts | Compiled to a DOM element with `data-fts-node` |
| Trigger | User or timed event that starts an action | Supported subset is compiled; unsupported triggers are reported |
| Action | What happens after the trigger | Supported subset is compiled; unsupported actions are reported |
| Destination | Target frame, overlay, URL, or state | Target frames are read when available |
| Animation / transition | Visual movement between states | Supported transitions become CSS/JS motion |
| Smart Animate | Matching layer animation between frames, components, instances, or variants | Converted by comparing matching layer names and hierarchy, then animating destination layers from source geometry to final geometry |
| Overlay | Floating destination above current frame | Exported as hidden overlay markup with JS open/close |
| Overflow / scrolling | Prototype viewport scroll behavior | Reported in v1; not compiled as scroll-linked Shopify behavior |
| Scroll animation behavior | How the exported section starts, repeats, scrubs, or pins while scrolling | User-configured in the plugin and included in Shopify Liquid motion JSON |
| Device preview | Prototype presentation shell | Not relevant to Shopify export |

The export report includes a `prototypeReactions` array with the raw interaction data found on the selected Figma hierarchy. This keeps the full prototype interaction spec available even when a feature is not compiled to storefront JavaScript in v1.

## Triggers

| Figma trigger | V1 status | Shopify runtime mapping |
| --- | --- | --- |
| `ON_CLICK` | Supported | `click` |
| `ON_HOVER` | Supported | `mouseenter` + `mouseleave` reset |
| `ON_PRESS` | Supported | `mousedown` + `mouseup` reset |
| `AFTER_TIMEOUT` | Supported | `setTimeout` |
| `MOUSE_ENTER` | Supported | `mouseenter` |
| `MOUSE_LEAVE` | Supported | `mouseleave` |
| `MOUSE_DOWN` | Supported | `mousedown` |
| `MOUSE_UP` | Supported | `mouseup` |
| `ON_DRAG` | Report only | Future draggable or media fallback |
| `ON_KEY_DOWN` | Report only | Future keyboard-triggered interactions |
| `ON_MEDIA_HIT` | Report only | Future media runtime support |
| `ON_MEDIA_END` | Report only | Future media runtime support |

## Actions

| Figma action | V1 status | Shopify runtime mapping |
| --- | --- | --- |
| `NODE` + `NAVIGATE` | Supported | Animate to target state when target frame is readable |
| `NODE` + `SWAP` | Supported | Animate to target state |
| `NODE` + `OVERLAY` | Supported | Open generated overlay markup |
| `NODE` + `CHANGE_TO` | Supported | Switch to target component/state by exact Figma node ID |
| `URL` | Supported | Navigate browser to URL |
| `BACK` | Supported | Close current generated overlay |
| `CLOSE` | Supported | Close current generated overlay |
| `NODE` + `SCROLL_TO` | Report only | Future scroll behavior |
| `SET_VARIABLE` | Report only | Future variable mapping |
| `SET_VARIABLE_MODE` | Report only | Future variable mode mapping |
| `CONDITIONAL` | Report only | Future conditional runtime |
| `UPDATE_MEDIA_RUNTIME` | Report only | Future video/audio control |

## Transitions and Animation Properties

| Figma transition/property | V1 status | Shopify output |
| --- | --- | --- |
| Dissolve | Supported | Opacity transition |
| Move in / move out | Supported approximation | CSS transform translate |
| Push | Supported approximation | CSS transform translate |
| Slide in / slide out | Supported approximation | CSS transform translate |
| Smart Animate position | Supported | Destination layer starts at source position, then `translate()` returns to final state |
| Smart Animate size | Supported approximation | Destination layer starts at source scale, then `scale()` returns to final state |
| Smart Animate rotation | Supported | Destination layer starts at source rotation, then `rotate()` returns to final state |
| Smart Animate opacity | Supported | Destination layer interpolates from source opacity to final opacity |
| Smart Animate solid fill color | Supported | Destination layer interpolates from source fill to final `background-color` |
| Smart Animate corner radius | Supported | Destination layer interpolates from source radius to final radius |
| Smart Animate unchanged matched layers | Supported | Static matched layers are held during looped transitions so after-delay routes do not flash like a whole-frame refresh |
| Custom cubic bezier easing | Supported | CSS `cubic-bezier()` |
| Ease in / ease out / ease in-out | Supported | CSS easing keyword |
| Spring animation | Approximation | Smooth cubic bezier and report note |
| Vector morphing | Report only | Future SVG-specific compiler |
| Masks and complex blend modes | Report only | Static render or manual follow-up |
| Video/audio playback action | Report only | Future media runtime |

## Scroll Animation Modes

| Plugin mode | V1 status | Shopify runtime behavior |
| --- | --- | --- |
| Enter Once | Supported | Starts the Figma prototype/variant sequence when the section enters the viewport; plays once |
| Enter Replay | Supported | Replays the sequence each time the section re-enters the viewport |
| Infinite Loop | Supported | Starts on enter and keeps looping through timed prototype states; if a sequence has no final timeout, Motion loops to the next state |
| Scroll Scrub | Supported | Maps scroll progress to the selected frame/component/component-set state order |
| Pin Sequence | Supported | Pins the section while scroll progress scrubs through the state order; uses GSAP ScrollTrigger when available and a sticky fallback otherwise |

## Prototype Route Detection

Motion builds a route graph from selected frame/component/component-set/variant prototype links and shows it in the Motion tab. Circular routes are supported and reported, for example `Variant 3 -> Variant 4 -> Variant 3`, so loops created by component variants remain visible before copying Shopify code.

## Asset Naming

| Layer naming format | V1 behavior |
| --- | --- |
| Vector layer | Exports as SVG automatically |
| `home_solution.svg` | Attempts SVG export for that layer and uses a clean `home-solution` filename stem |
| `logo.svg` | Attempts SVG export for that layer |
| `Logo [svg]` | Attempts SVG export for that layer |
| `Logo #svg` | Attempts SVG export for that layer |
| `Logo export=svg` | Attempts SVG export for that layer |

Renamed assets are stored in the export manifest with both `defaultFilename` and `shopifyFilename`. After users click Save and Run, Copy Code, Copy CSS, Copy JS, ZIP files, manifest, and report are regenerated from the renamed `shopifyFilename` values.

PNG/image file assets keep `box-shadow: none`; Figma effects such as drop shadow are emitted on the Figma layer wrapper. Generated markup follows Figma layer panel order, while CSS `z-index` preserves the visual stack.

Every ZIP export includes shared theme assets at `assets/motion-figma-gsap-runtime.css` and `assets/motion-figma-gsap-runtime.js`. Copy Code mode includes the same runtime/base CSS inline. Repeated CSS declarations are grouped across similar generated layers to avoid rewriting identical text/image style properties.

## Design Rules for Reliable Export

1. Use one clean top-level frame, component, instance, or variant for the Shopify section.
2. Designers may select a child layer inside a component; Motion will export the nearest supported component/instance ancestor.
3. Keep source and destination layer names consistent for Smart Animate. Motion matches by path, layer name, structure, and type so the Shopify playback can move the destination layer smoothly instead of flashing through state screenshots. If GSAP is already loaded by the theme, Motion uses `gsap.timeline()` for this layer playback.
4. Use Auto Layout when possible.
5. Use layer names for Liquid binding.
6. Choose the scroll animation mode before copying Shopify code.
7. Avoid relying on prototype-only variables or conditionals in v1.
8. For Shopify product and collection data, name layers explicitly instead of using visual labels only.
