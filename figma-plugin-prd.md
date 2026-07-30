# PRD: Motion: Figma Prototype to Shopify Plugin

## 1. Overview

### 1.1 Product Name

Motion: Figma Prototype to Shopify

### 1.2 One-Line Description

ä¸€ä¸ª Figma æ’ä»¶ï¼ŒæŠŠç”¨æˆ·é€‰ä¸­çš„ Figma prototype flow æˆ– section è½¬æ¢æˆå¯ç”¨äºŽ Shopify Online Store 2.0 çš„ä¸»é¢˜æ–‡ä»¶åŒ…ï¼Œå¹¶å°½å¯èƒ½ä¿ç•™ Figma prototype ä¸­çš„åŠ¨æ€åŠ¨ç”»ä¸Žäº¤äº’çŠ¶æ€ã€‚

### 1.3 Background

å‚è€ƒ Truestorefront çš„æ–‡ç« ã€ŒFigma to Shopify: Seamless Design Conversionã€ï¼ŒFigma åˆ° Shopify çš„åŸºç¡€æµç¨‹å¯ä»¥å½’çº³ä¸º Step 1 åˆ° Step 5ï¼š

1. å®Œæˆå¹¶æ£€æŸ¥ Figma è®¾è®¡ã€‚
2. å¯¼å‡ºå›¾ç‰‡ã€å›¾æ ‡ã€å­—ä½“ä¸Žè®¾è®¡è§„æ ¼ã€‚
3. é€‰æ‹© Shopify ä¸»é¢˜æˆ–åˆ›å»ºè‡ªå®šä¹‰ä¸»é¢˜ã€‚
4. å°† Figma è§†è§‰è®¾è®¡è½¬æˆ HTML/CSSã€‚
5. ç”¨ Liquid æŽ¥å…¥ Shopify åŠ¨æ€å†…å®¹ã€‚

æœ¬äº§å“åœ¨è¯¥æµç¨‹åŸºç¡€ä¸Šå¢žåŠ ä¸€ä¸ªæ ¸å¿ƒèƒ½åŠ›ï¼šè¯»å– Figma prototype çš„ reactionsã€transitionsã€Smart Animate ä¿¡æ¯ï¼Œå°†å¯æ˜ å°„çš„äº¤äº’åŠ¨æ•ˆç¼–è¯‘æˆ Shopify å¯è¿è¡Œçš„ CSS/JavaScript åŠ¨ç”»ï¼›æ— æ³•ç¨³å®šæ˜ å°„çš„åŠ¨ç”»åˆ™ä»¥ MP4/WebM/GIF ç­‰åª’ä½“èµ„æºä½œä¸º fallbackã€‚

### 1.4 Primary Goal

è®©è®¾è®¡å¸ˆæˆ– Shopify å¼€å‘è€…ä»Ž Figma ä¸­é€‰æ‹©ä¸€ä¸ªå·²ç»å®Œæˆçš„ prototype flow æˆ– section åŽï¼Œä¸€é”®å¯¼å‡ºä¸€ä¸ª Shopify ä¸»é¢˜æ–‡ä»¶åŒ…ï¼ŒåŒ…å«ï¼š

- Shopify section Liquid æ–‡ä»¶
- CSS æ ·å¼
- JavaScript/GSAP åŠ¨ç”»è¿è¡Œæ—¶
- å›¾ç‰‡ã€å›¾æ ‡ã€è§†é¢‘ç­‰ assets
- Liquid åŠ¨æ€æ•°æ®ç»‘å®š
- è½¬æ¢æŠ¥å‘Šä¸Ž unsupported feature warning

## 2. Target Users

### 2.1 Primary Users

- Shopify theme developerï¼šéœ€è¦å¿«é€ŸæŠŠ Figma è®¾è®¡è½¬æ¢æˆå¯ç»´æŠ¤çš„ Shopify section/theme ä»£ç ã€‚
- UI/UX designerï¼šå¸Œæœ›å°† Figma prototype ä¸­çš„è§†è§‰å’ŒåŠ¨æ€æ•ˆæžœäº¤ä»˜ç»™å¼€å‘æˆ–ç›´æŽ¥å¯¼å‡ºä¸º Shopify å¯ç”¨ä»£ç ã€‚
- E-commerce founder / marketerï¼šå¸Œæœ›æŠŠé«˜ä¿çœŸçš„æ´»åŠ¨é¡µã€é¦–é¡µæ¨¡å—ã€äº§å“å±•ç¤ºæ¨¡å—å¿«é€Ÿè½åœ°åˆ° Shopifyã€‚

### 2.2 User Skill Assumptions

- ç”¨æˆ·çŸ¥é“å¦‚ä½•åœ¨ Figma ä¸­é€‰æ‹© frameã€componentã€section æˆ– prototype flowã€‚
- ç”¨æˆ·ä¸ä¸€å®šç†Ÿæ‚‰ Liquidï¼Œä½†æ„¿æ„é€šè¿‡æ’ä»¶ UI ç¡®è®¤åŠ¨æ€æ•°æ®ç»‘å®šã€‚
- ç”¨æˆ·å¯èƒ½ç†Ÿæ‚‰ Shopify CLIï¼Œä½† v1 ä¸è¦æ±‚ç”¨æˆ·åœ¨æ’ä»¶ä¸­ç™»å½• Shopifyã€‚

## 3. Problem Statement

å½“å‰ Figma åˆ° Shopify çš„è½¬æ¢é€šå¸¸åªå…³æ³¨é™æ€è®¾è®¡åˆ‡å›¾æˆ– HTML/CSSï¼Œè¿˜åŽŸåº¦ä¾èµ–äººå·¥å¼€å‘ã€‚Figma prototype ä¸­çš„ dynamic animationã€Smart Animateã€hover/click/overlay çŠ¶æ€å¾ˆå®¹æ˜“åœ¨è½åœ° Shopify æ—¶ä¸¢å¤±ã€‚

æœ¬æ’ä»¶è¦è§£å†³ä¸‰ä¸ªå…³é”®é—®é¢˜ï¼š

- é™æ€è§†è§‰è¿˜åŽŸï¼šä»Ž Figma æå– layoutã€styleã€assetï¼Œç”ŸæˆæŽ¥è¿‘è®¾è®¡ç¨¿çš„ Shopify HTML/CSSã€‚
- åŠ¨æ€å†…å®¹æŽ¥å…¥ï¼šå°†ç‰¹å®š Figma å›¾å±‚ç»‘å®šåˆ° Shopify çš„ productã€collectionã€menuã€cart ç­‰ Liquid æ•°æ®ã€‚
- åŠ¨ç”»è¿ç§»ï¼šå°† Figma prototype reactions è½¬æ¢ä¸º Shopify storefront ä¸­å¯è¿è¡Œçš„äº¤äº’åŠ¨ç”»ã€‚

## 4. Product Scope

### 4.1 V1 In Scope

- ä»Žå½“å‰ Figma selection å¯¼å‡ºä¸€ä¸ª flow/sectionã€‚
- æ”¯æŒç”¨æˆ·åœ¨æ’ä»¶ UI ä¸­æ£€æŸ¥å¯¼å‡ºèŒƒå›´ã€ç¼ºå¤±ä¿¡æ¯ã€åŠ¨æ€ç»‘å®šã€åŠ¨ç”»æ”¯æŒæƒ…å†µã€‚
- ç”Ÿæˆ Shopify Online Store 2.0 ä¸»é¢˜æ–‡ä»¶åŒ…ã€‚
- æ”¯æŒ Liquid åŠ¨æ€æ•°æ®ç»‘å®šï¼š
  - product title / price / image / url / description / vendor / variant selector
  - collection product grid
  - menu navigation
  - cart item count / cart link
  - merchant-editable static copy and image settings
- æ”¯æŒå¸¸è§ prototype animationï¼š
  - click
  - hover / press
  - after delay
  - navigate / swap / change-to
  - overlay open / close
  - Smart Animate ä¸­çš„ä½ç½®ã€é€æ˜Žåº¦ã€ç¼©æ”¾ã€æ—‹è½¬ã€é¢œè‰²å˜åŒ–
- å¯¹å¤æ‚æˆ– unsupported animation ç”Ÿæˆ warningï¼Œå¹¶å°è¯•å¯¼å‡ºè§†é¢‘ fallbackã€‚

### 4.2 V1 Out of Scope

- ä¸ç›´æŽ¥ç™»å½•æˆ–å‘å¸ƒåˆ° Shopify storeã€‚
- ä¸åšå®Œæ•´æ•´ç«™ä¸€é”®è½¬æ¢ã€‚
- ä¸æ”¯æŒ checkout é¡µé¢è‡ªå®šä¹‰ã€‚
- ä¸æ‰¿è¯º 100% è¿˜åŽŸæ‰€æœ‰ Figma prototype è¡Œä¸ºã€‚
- ä¸æ”¯æŒå¤æ‚æ‰‹åŠ¿ä½œä¸º P0 åŠŸèƒ½ï¼Œä¾‹å¦‚ dragã€swipeã€scroll-linked animationã€‚
- ä¸è‡ªåŠ¨åˆ›å»º Shopify productã€collectionã€menu æ•°æ®ã€‚

### 4.3 Future Scope

- Shopify OAuth ä¸Žç›´æŽ¥ä¸Šä¼  themeã€‚
- Theme app extension / app block è¾“å‡ºã€‚
- å¤šé¡µé¢æ•´ç«™è½¬æ¢ã€‚
- ScrollTrigger / scroll-linked animation æ”¯æŒã€‚
- AI è¾…åŠ©è¯†åˆ« product cardã€collection gridã€navigationã€cart drawerã€‚
- ä¸Ž Shopify CLI æœ¬åœ°é¢„è§ˆé›†æˆã€‚

## 5. Success Metrics

### 5.1 Functional Success

- ç”¨æˆ·é€‰æ‹©ä¸€ä¸ªè§„èŒƒçš„ Figma section åŽï¼Œå¯ä»¥æˆåŠŸå¯¼å‡º ZIPã€‚
- ZIP è§£åŽ‹åŽå…·å¤‡ Shopify theme ç›®å½•ç»“æž„ï¼Œå¯è¢«å¼€å‘è€…æ”¾å…¥ä¸»é¢˜é¡¹ç›®ä¸­ä½¿ç”¨ã€‚
- ä¸»è¦è§†è§‰å…ƒç´ ã€æ–‡å­—ã€å›¾ç‰‡ã€æŒ‰é’®ã€å¸ƒå±€åœ¨æ¡Œé¢ä¸Žç§»åŠ¨ç«¯å¯ç”¨ã€‚
- å·²æ”¯æŒçš„ click/hover/delay åŠ¨ç”»åœ¨ Shopify preview ä¸­å¯è¿è¡Œã€‚
- åŠ¨æ€ product/collection/menu/cart ç»‘å®šå¯é€šè¿‡ Liquid è¾“å‡ºçœŸå®ž Shopify æ•°æ®ã€‚

### 5.2 Quality Success

- å¯¼å‡ºæŠ¥å‘Šæ˜Žç¡®åˆ—å‡ºæˆåŠŸè½¬æ¢ã€é™çº§è½¬æ¢ã€æ— æ³•æ”¯æŒçš„é¡¹ç›®ã€‚
- ç”Ÿæˆæ–‡ä»¶å‘½åç¨³å®šã€å¯è¯»ã€å¯ç»´æŠ¤ã€‚
- åŠ¨ç”»åœ¨ `prefers-reduced-motion` ä¸‹å¯å…³é—­æˆ–æ˜¾è‘—é™ä½Žã€‚
- ç”Ÿæˆçš„ JavaScript åœ¨ Shopify theme editor ä¸­ section reload åŽä»èƒ½æ­£ç¡®åˆå§‹åŒ–ã€‚

## 6. User Workflow

### 6.1 Happy Path

1. ç”¨æˆ·åœ¨ Figma ä¸­æ‰“å¼€å·²å®Œæˆçš„ Shopify é¡µé¢æˆ–æ¨¡å—è®¾è®¡ã€‚
2. ç”¨æˆ·é€‰æ‹©ä¸€ä¸ªé¡¶å±‚ frameã€sectionï¼Œæˆ–ä¸€ä¸ª prototype flow çš„èµ·å§‹ frameã€‚
3. ç”¨æˆ·è¿è¡Œæ’ä»¶ï¼š`Export selected flow to Shopify`ã€‚
4. æ’ä»¶æ‰«æ selectionï¼š
   - æ£€æŸ¥ layout æ˜¯å¦å®Œæ•´ã€‚
   - æå– design tokensã€‚
   - æ”¶é›† assetsã€‚
   - è¯»å– reactions å’Œ transitionsã€‚
   - è‡ªåŠ¨è¯†åˆ« Shopify data bindingã€‚
5. æ’ä»¶å±•ç¤º review é¢æ¿ï¼š
   - å¯¼å‡ºèŒƒå›´
   - å“åº”å¼æ–­ç‚¹
   - åŠ¨ç”»æ”¯æŒçŸ©é˜µ
   - Liquid æ•°æ®ç»‘å®š
   - warning / fallback
6. ç”¨æˆ·ç¡®è®¤å¯¼å‡ºã€‚
7. æ’ä»¶ç”Ÿæˆ ZIPï¼š
   - `sections/motion-figma-prototype-to-shopify.liquid`
   - `assets/motion-figma-prototype-to-shopify.css`
   - `assets/motion-figma-prototype-to-shopify.js`
   - `assets/*`
   - `templates/page.figma-motion.json` æˆ–å¯¼å‡ºè¯´æ˜Ž
   - `motion-figma-prototype-to-shopify-report.json`
8. ç”¨æˆ·å°†æ–‡ä»¶å¤åˆ¶åˆ° Shopify theme é¡¹ç›®ï¼Œä½¿ç”¨ Shopify CLI é¢„è§ˆã€‚

### 6.2 Article Step Mapping

| Article Step | Plugin Implementation |
| --- | --- |
| Step 1. Finalize Your Figma Design | æ’ä»¶è¿›è¡Œ preflight auditï¼Œæ£€æŸ¥ selectionã€frameã€responsive variantã€å­—ä½“ã€assetã€prototype reactionã€‚ |
| Step 2. Export Design Assets from Figma | æ’ä»¶è‡ªåŠ¨å¯¼å‡º SVGã€PNG/JPGã€WebP-ready image sourceã€MP4/WebM/GIF fallbackã€‚ |
| Step 3. Choose a Shopify Theme or Create a Custom One | v1 é»˜è®¤è¾“å‡º Shopify Online Store 2.0 section/theme packageï¼Œä¸ç›´æŽ¥é€‰æ‹©çº¿ä¸Šä¸»é¢˜ã€‚ |
| Step 4. Convert Figma Design to HTML/CSS | æ’ä»¶å°† Figma node tree è½¬æˆ HTML structureã€CSS variablesã€responsive CSSã€asset referencesã€‚ |
| Step 5. Implement Liquid for Dynamic Content | æ’ä»¶æ ¹æ®å‘½åçº¦å®šå’Œ UI ç¡®è®¤ç”Ÿæˆ Liquid object binding ä¸Ž section schemaã€‚ |

## 7. Functional Requirements

### 7.1 Figma Selection and Audit

Priority: P0

The plugin must:

- Require exactly one meaningful selected node, or clearly ask user to select one.
- Accept top-level `FrameNode`, `ComponentNode`, `ComponentSetNode`, `InstanceNode`, `SectionNode`, or group-like root when exportable.
- Accept a selected child layer inside a component, instance, component set, frame, group, or section, then promote the export boundary to the nearest supported ancestor.
- Record both the selected layer and actual export root in the export summary and conversion report.
- Detect prototype starting point from selected node reactions when available.
- Traverse child nodes and collect:
  - node id
  - node name
  - type
  - hierarchy path
  - absolute bounds
  - layout mode
  - fills
  - strokes
  - effects
  - text styles
  - image fills
  - export settings
  - reactions
- Produce a preflight status:
  - ready
  - ready with warnings
  - blocked

Blocked examples:

- No selection.
- Selected node cannot be exported or serialized.
- Required destination frame for a supported reaction cannot be found.

Warning examples:

- Missing responsive variants.
- Custom font detected but no web font mapping.
- Prototype uses unsupported drag/swipe/conditional/variable actions.
- Smart Animate includes unsupported property diffs.

### 7.2 Design Tokens

Priority: P0

The plugin must extract and normalize:

- Colors as CSS custom properties.
- Font families, font sizes, weights, line heights.
- Spacing values.
- Border radii.
- Shadows where feasible.
- Breakpoint candidates from sibling frame widths or user selection.

Generated CSS should use stable custom properties, for example:

```css
:root {
  --fts-color-primary: #111111;
  --fts-space-4: 16px;
  --fts-radius-md: 8px;
}
```

### 7.3 Asset Export

Priority: P0

The plugin must:

- Export vector/icon nodes as SVG when the node is suitable.
- Export bitmap/image-fill nodes as PNG or JPG.
- Name assets with sanitized, deterministic names.
- Deduplicate identical assets where possible.
- Preserve alt text candidates from layer names.
- Generate asset references using Shopify Liquid asset filters.

Example output:

```liquid
{{ 'figma-motion-hero-bg.png' | asset_url }}
```

For animated top-level frames, the plugin should attempt MP4/WebM/GIF export when supported by Figma. If export fails, it must add a report warning instead of failing the entire package.

### 7.4 Layout and HTML/CSS Conversion

Priority: P0

The plugin must:

- Convert Auto Layout to flexbox.
- Convert regular frame layouts to absolute-positioned or CSS grid layouts only when necessary.
- Prefer semantic HTML for common patterns:
  - button-like nodes -> `button` or `a`
  - navigation group -> `nav`
  - product card -> `article`
  - image -> `img` or Liquid image tag
  - section root -> `section`
- Generate responsive CSS from detected frame variants or selected breakpoint settings.
- Avoid inline styles except for per-instance dynamic values that cannot be expressed cleanly in CSS.
- Keep generated CSS scoped to the exported section to avoid theme-wide collisions.

### 7.5 Shopify Liquid Binding

Priority: P0

The plugin must support a naming-convention based binding system, with UI confirmation.

Supported naming examples:

| Figma Layer Name | Liquid Output |
| --- | --- |
| `product.title` | `{{ product.title }}` |
| `product.price` | `{{ product.price | money }}` |
| `product.description` | `{{ product.description }}` |
| `product.image` | product image markup |
| `product.url` | `{{ product.url }}` |
| `collection.grid` | loop over `collection.products` |
| `menu.main` | loop over selected menu links |
| `cart.count` | `{{ cart.item_count }}` |

The review UI must let users:

- Confirm detected bindings.
- Change a layer from dynamic to static.
- Choose product, collection, menu, cart, or static setting type.
- Rename generated Shopify section settings.

### 7.6 Shopify Section Schema

Priority: P0

The generated section must include valid Shopify section schema:

- `name`
- `tag`
- `class`
- `settings`
- `blocks` when repeated content is detected
- `presets`

The section must be addable from the Shopify theme editor.

Example:

```liquid
{% schema %}
{
  "name": "Motion: Figma Prototype to Shopify",
  "tag": "section",
  "class": "motion-figma-prototype-to-shopify",
  "settings": [],
  "presets": [
    {
      "name": "Motion: Figma Prototype to Shopify"
    }
  ]
}
{% endschema %}
```

### 7.7 Prototype Reaction and Motion Compiler

Priority: P0

The plugin must read Figma `reactions` from supported nodes.

Supported triggers:

- `ON_CLICK`
- `ON_HOVER`
- `ON_PRESS`
- `AFTER_TIMEOUT`
- `MOUSE_ENTER`
- `MOUSE_LEAVE`
- `MOUSE_UP`
- `MOUSE_DOWN`

Supported actions:

- `NODE` with:
  - `NAVIGATE`
  - `SWAP`
  - `OVERLAY`
  - `CHANGE_TO`
- `BACK`
- `CLOSE`
- `URL`

Supported transition behavior:

- `DISSOLVE` -> opacity transition.
- `MOVE_IN`, `MOVE_OUT`, `PUSH`, `SLIDE_IN`, `SLIDE_OUT` -> translate-based animation.
- `SMART_ANIMATE` -> compare matching layers between source and destination frames.
- Custom cubic bezier -> map to CSS `cubic-bezier()` or GSAP custom ease config.
- Spring/custom Figma easing -> approximate with GSAP easing, with report note.

Smart Animate support must compare matching layers by:

- layer name
- hierarchy position
- stable normalized path

Supported Smart Animate property diffs:

- position -> `x` / `y`
- size -> `scaleX` / `scaleY` when safe
- rotation -> `rotation`
- opacity -> `autoAlpha` or opacity
- fill color -> `backgroundColor` / SVG fill where safe

Unsupported diffs:

- arbitrary vector morphing
- complex masks
- unsupported blend modes
- complex blur/noise/texture
- variable-based conditional branches
- drag/swipe gestures in v1

### 7.8 Shopify Animation Runtime

Priority: P0

The exported JavaScript must:

- Scope all selectors to the section instance.
- Initialize animations on DOM ready.
- Reinitialize after Shopify theme editor section load.
- Clean up when Shopify theme editor unloads or reloads the section.
- Respect `prefers-reduced-motion`.
- Avoid global namespace collisions.
- Prefer transform and opacity animation for performance.

Runtime architecture:

- `assets/motion-figma-prototype-to-shopify.js` exports a small runtime.
- Section markup embeds motion config as JSON in a script tag or data attribute.
- Runtime discovers `[data-motion-figma-prototype-to-shopify]`.
- Runtime binds event listeners based on generated motion graph.
- Runtime uses CSS transitions for simple cases and GSAP-style timeline logic for complex sequences.

### 7.9 Export Package

Priority: P0

The generated ZIP must contain:

```text
motion-figma-prototype-to-shopify-export/
  assets/
    motion-figma-prototype-to-shopify.css
    motion-figma-prototype-to-shopify.js
    figma-motion-*.svg
    figma-motion-*.png
    figma-motion-*.jpg
    figma-motion-*.mp4
  sections/
    motion-figma-prototype-to-shopify.liquid
  templates/
    page.figma-motion.json
  motion-figma-prototype-to-shopify-report.json
  README.md
```

If template generation is disabled, the ZIP must still include README instructions for adding the section manually.

### 7.10 Conversion Report

Priority: P0

The report must include:

- Figma file/page metadata available to the plugin.
- Selected root node info.
- Exported asset list.
- Generated Shopify file list.
- Detected Liquid bindings.
- Supported animations converted.
- Animations downgraded to fallback.
- Unsupported features.
- Manual follow-up checklist.

## 8. UX Requirements

### 8.1 Plugin Panel States

The UI must include:

- Empty state: asks user to select a frame, component, component child layer, or flow.
- Audit running state.
- Audit result state.
- Binding review state.
- Animation review state.
- Export settings state.
- Export success state with download button.
- Error state with actionable message.

### 8.2 Export Settings

User-configurable settings:

- Output type: Shopify section package.
- Section name.
- File prefix.
- Asset scale.
- Image format preference.
- Enable/disable video fallback.
- Enable/disable animation JS.
- Reduced motion behavior.
- Responsive breakpoint strategy.

### 8.3 Error and Warning Tone

Warnings should be specific and non-blocking when possible.

Good:

> `ON_DRAG` is not supported in v1. This interaction will be exported as a static state and listed in the report.

Bad:

> Export failed.

## 9. Technical Architecture

### 9.1 Major Modules

```text
src/
  plugin/
    main.ts
    scanner.ts
    audit.ts
    assets.ts
    motion.ts
    bindings.ts
    shopify.ts
    zip.ts
  ui/
    index.html
    ui.ts
    styles.css
  shared/
    types.ts
    naming.ts
    sanitize.ts
    liquid.ts
    report.ts
  tests/
    fixtures/
```

### 9.2 Data Flow

```text
Figma Selection
  -> Audit
  -> Node Serialization
  -> Token Extraction
  -> Asset Export
  -> Binding Detection
  -> Motion Graph Extraction
  -> User Review
  -> Shopify Code Generation
  -> ZIP Export
```

### 9.3 Intermediate Model

The converter should use an internal intermediate representation instead of generating Liquid directly from Figma nodes.

Minimum model:

```ts
type ShopifyExportModel = {
  meta: ExportMeta;
  tokens: DesignTokens;
  nodes: ExportNode[];
  assets: ExportAsset[];
  bindings: LiquidBinding[];
  motion: MotionGraph;
  warnings: ConversionWarning[];
};
```

## 10. Acceptance Criteria

### 10.1 MVP Acceptance

- Given a selected hero/product section in Figma, when the user runs the plugin, then the plugin can export a ZIP with valid Shopify section, CSS, JS, assets, README, and report.
- Given a selected layer inside a Figma component or instance, when the user runs the plugin, then the plugin promotes the export root to the nearest supported component/instance ancestor and exports the full component hierarchy to Shopify.
- Given a layer named `product.title`, when exported, then the generated Liquid renders `{{ product.title }}`.
- Given a layer named `product.price`, when exported, then the generated Liquid renders a money-formatted product price.
- Given a product card group under `collection.grid`, when exported, then the generated Liquid loops through collection products.
- Given a click reaction from one frame state to another with Smart Animate position/opacity changes, when exported, then the Shopify section animates between those states.
- Given an unsupported drag interaction, when exported, then the plugin does not crash and the report lists the unsupported interaction.
- Given reduced motion enabled in the browser, when the section loads, then non-essential motion is skipped or duration is reduced to zero.

### 10.2 Quality Bar

- Generated Liquid schema is valid JSON.
- Generated CSS is scoped to the section class or data attribute.
- Generated JS does not require Shopify admin access.
- Generated JS works after Shopify theme editor section reload.
- Export report is readable enough for a developer to manually fix remaining gaps.

## 11. Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Figma prototype features exceed plugin API mapping ability | Animation loss | Support matrix, warnings, video fallback |
| Smart Animate matching is ambiguous | Incorrect animation | Match by layer name + hierarchy; warn on duplicate names |
| Generated Shopify code is too static | Merchant cannot edit content | Use section schema and Liquid bindings |
| CSS collides with existing theme | Broken storefront styles | Scope all generated selectors |
| Animation breaks in Shopify theme editor | Poor editing experience | Listen for section load/unload events |
| Custom fonts unavailable on storefront | Visual mismatch | Detect fonts and require web font mapping |

## 12. Milestones

### Milestone 1: Plugin Scaffold and Audit

- Create Figma plugin project.
- Implement selection scanning.
- Implement preflight audit.
- Show basic UI panel.

### Milestone 2: Static Shopify Export

- Export assets.
- Generate section Liquid.
- Generate scoped CSS.
- Generate ZIP and README.

### Milestone 3: Dynamic Liquid Binding

- Implement layer naming conventions.
- Add binding review UI.
- Generate product/collection/menu/cart Liquid output.
- Generate section schema settings.

### Milestone 4: Motion Compiler

- Extract Figma reactions.
- Generate motion graph.
- Compile simple transitions.
- Compile Smart Animate-supported diffs.
- Add video fallback and warnings.

### Milestone 5: Validation and Polish

- Add unit and fixture tests.
- Validate Shopify output with Theme Check where available.
- Test generated section in Shopify CLI preview.
- Improve report quality and edge-case messages.

## 13. References

- Truestorefront: https://truestorefront.com/blog/figma-to-shopify
- Figma Plugin API: https://developers.figma.com/docs/plugins/
- Figma reactions: https://developers.figma.com/docs/plugins/api/properties/nodes-reactions/
- Figma Action type: https://developers.figma.com/docs/plugins/api/Action/
- Figma Trigger type: https://developers.figma.com/docs/plugins/api/Trigger/
- Figma exportAsync: https://developers.figma.com/docs/plugins/api/properties/nodes-exportasync/
- Shopify sections: https://shopify.dev/docs/storefronts/themes/architecture/sections
- Shopify section schema: https://shopify.dev/docs/storefronts/themes/architecture/sections/section-schema
- Shopify CLI for themes: https://shopify.dev/docs/storefronts/themes/tools/cli
