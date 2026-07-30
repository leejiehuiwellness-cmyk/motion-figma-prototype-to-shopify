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
| Hotspot | Layer where the interaction starts | Compiled to a DOM element with `data-fts-node` |
| Trigger | User or timed event that starts an action | Supported subset is compiled; unsupported triggers are reported |
| Action | What happens after the trigger | Supported subset is compiled; unsupported actions are reported |
| Destination | Target frame, overlay, URL, or state | Target frames are read when available |
| Animation / transition | Visual movement between states | Supported transitions become CSS/JS motion |
| Smart Animate | Matching layer animation between frames, components, instances, or variants | Converted by comparing matching layer names and hierarchy |
| Overlay | Floating destination above current frame | Exported as hidden overlay markup with JS open/close |
| Overflow / scrolling | Prototype viewport scroll behavior | Reported in v1; not compiled as scroll-linked Shopify behavior |
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
| `NODE` + `CHANGE_TO` | Supported | Animate to target component/state |
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
| Smart Animate position | Supported | `translate(x, y)` |
| Smart Animate size | Supported approximation | `scale(x, y)` when safe |
| Smart Animate rotation | Supported | `rotate()` |
| Smart Animate opacity | Supported | `opacity` |
| Smart Animate solid fill color | Supported | `background-color` |
| Custom cubic bezier easing | Supported | CSS `cubic-bezier()` |
| Ease in / ease out / ease in-out | Supported | CSS easing keyword |
| Spring animation | Approximation | Smooth cubic bezier and report note |
| Vector morphing | Report only | Future SVG-specific compiler |
| Masks and complex blend modes | Report only | Static render or manual follow-up |
| Video/audio playback action | Report only | Future media runtime |

## Design Rules for Reliable Export

1. Use one clean top-level frame, component, instance, or variant for the Shopify section.
2. Designers may select a child layer inside a component; Motion will export the nearest supported component/instance ancestor.
3. Keep source and destination layer names consistent for Smart Animate.
4. Use Auto Layout when possible.
5. Use layer names for Liquid binding.
6. Avoid relying on prototype-only variables or conditionals in v1.
7. For Shopify product and collection data, name layers explicitly instead of using visual labels only.
