import { readFileSync, existsSync } from "node:fs";
import vm from "node:vm";

const requiredFiles = [
  "manifest.json",
  "code.js",
  "ui.html",
  "figma-plugin-prd.md",
  "CODEX_FIX_FIGMA_VARIANTS_TO_SHOPIFY_REPORT.md",
  "PROTOTYPE_SUPPORT_MATRIX.md",
  "README.md",
  "CHANGELOG.md",
  "FIGMA_MARKETPLACE_COPY_READY.md",
  "LICENSE.md",
  "ONBOARDING.md",
  "PRIVACY.md",
  "SUPPORT.md",
  "SHOPIFY_COPY_PASTE_GUIDE.md",
  "MARKETPLACE_SUBMISSION.md",
  "TODAY_SHIP_CHECKLIST.md",
  "examples/example-shopify-section.liquid",
  "marketplace-assets/icon.svg",
  "marketplace-assets/cover.svg",
  "marketplace-assets/icon.png",
  "marketplace-assets/cover.png",
  "docs/.nojekyll",
  "docs/index.html",
  "docs/assets/site.css",
  "docs/assets/site.js",
  "docs/assets/icon.png",
  "docs/assets/cover.png",
  "assets/motion-figma-gsap-runtime.css",
  "assets/motion-figma-gsap-runtime.js"
];

for (const file of requiredFiles) {
  assert(existsSync(file), `Missing ${file}`);
}

const manifest = JSON.parse(read("manifest.json"));
assert(manifest.name === "Motion: Figma Prototype to Shopify", "Manifest name mismatch");
assert(manifest.api === "1.0.0", "Manifest API missing");
assert(manifest.main === "code.js", "Manifest main must be code.js");
assert(manifest.ui === "ui.html", "Manifest UI must be ui.html");
assert(Array.isArray(manifest.editorType) && manifest.editorType.includes("figma"), "Manifest must target Figma Design");
assert(Array.isArray(manifest.menu) && manifest.menu[0]?.command === "export-selected-frame", "Manifest must expose an export command");
assert(manifest.menu[0]?.name.includes("component"), "Manifest menu should mention component export");
assert(manifest.documentAccess === "dynamic-page", "Manifest must use dynamic-page document access");
assert(manifest.networkAccess?.allowedDomains?.[0] === "none", "Plugin should not request network access");

const code = read("code.js");
new vm.Script(code);
const ui = read("ui.html");
const scripts = [...ui.matchAll(/<script>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);
assert(scripts.length > 0, "ui.html must include an embedded script");
for (const script of scripts) {
  new vm.Script(script);
}

[
  "product.title",
  "product.price",
  "product.image",
  "collection.grid",
  "menu.main",
  "cart.count",
  "COMPONENT_SET",
  "resolveExportRoot",
  "usedAncestorRoot",
  "createStateModels",
  "changeVariant",
  "fts-stage",
  "codeMode",
  "Copy Code",
  "assetRenames",
  "Enter Once",
  "Enter Replay",
  "Infinite Loop",
  "Scroll Scrub",
  "Pin Sequence",
  "scheduleAfterTimeoutsForState",
  "setupScrollAnimation",
  "setupScrollProgressAnimation",
  "ScrollTrigger",
  "data-fts-scroll-mode",
  "forced-svg",
  "prepareDestinationDiffs",
  "playPreparedDiffs",
  "playPreparedDiffsWithGsap",
  "muteSourceDiffs",
  "Prototype routes",
  "prototypeRoutes",
  "window.gsap",
  "ON_CLICK",
  "ON_HOVER",
  "AFTER_TIMEOUT",
  "Smart Animate",
  "Pin Sequence",
  "shopify:section:load"
].forEach((needle) => {
  assert(code.includes(needle), `code.js missing ${needle}`);
});

[
  "Save and Run",
  "Asset filenames",
  "assetRenames",
  "Enter Once",
  "Enter Replay",
  "Infinite Loop",
  "Scroll Scrub",
  "Pin Sequence",
  "Logo [svg]",
  "home_solution.svg",
  "Prototype route",
  "assets/motion-figma-gsap-runtime.js"
].forEach((needle) => {
  assert(ui.includes(needle), `ui.html missing ${needle}`);
});

const onboarding = read("ONBOARDING.md");
[
  "Select the desktop frame",
  "Set Mobile",
  "Language label",
  "component set",
  "nearest supported ancestor",
  "product.title",
  "collection.grid",
  "Copy Code",
  "Shopify Admin",
  "home_solution.svg",
  "prototype route",
  "assets/motion-figma-gsap-runtime.js"
].forEach((needle) => {
  assert(onboarding.includes(needle), `ONBOARDING.md missing ${needle}`);
});

const marketplaceCopy = read("FIGMA_MARKETPLACE_COPY_READY.md");
[
  "Motion: Figma Prototype to Shopify",
  "allowedDomains: [\"none\"]",
  "icon.png",
  "cover.png",
  "jiehui02@gmail.com",
  "home_solution.svg",
  "prototype route/loop detection",
  "assets/motion-figma-gsap-runtime.js"
].forEach((needle) => {
  assert(marketplaceCopy.includes(needle), `FIGMA_MARKETPLACE_COPY_READY.md missing ${needle}`);
});

const supportMatrix = read("PROTOTYPE_SUPPORT_MATRIX.md");
[
  "ON_CLICK",
  "ON_DRAG",
  "SCROLL_TO",
  "SET_VARIABLE",
  "CONDITIONAL",
  "UPDATE_MEDIA_RUNTIME",
  "Smart Animate",
  "Pin Sequence",
  "Logo [svg]",
  "home_solution.svg",
  "Prototype Route Detection",
  "assets/motion-figma-gsap-runtime.js"
].forEach((needle) => {
  assert(supportMatrix.includes(needle), `PROTOTYPE_SUPPORT_MATRIX.md missing ${needle}`);
});

const exampleLiquid = read("examples/example-shopify-section.liquid");
const schemaMatch = exampleLiquid.match(/{% schema %}([\s\S]*?){% endschema %}/);
assert(schemaMatch, "Example Liquid missing schema block");
JSON.parse(schemaMatch[1]);
assertPngDimensions("marketplace-assets/icon.png", 128, 128);
assertPngDimensions("marketplace-assets/cover.png", 1920, 1080);

const docsHome = read("docs/index.html");
[
  "Motion: Figma Prototype to Shopify",
  "by Jiehui",
  "完整使用流程",
  "Import plugin from manifest",
  "component child layer",
  "product.title",
  "Shopify Admin",
  "Prototype motion",
  "Save and Run",
  "Pin Sequence",
  "Prototype routes",
  "home_solution.svg",
  "assets/motion-figma-gsap-runtime.js",
  "Download source ZIP"
].forEach((needle) => {
  assert(docsHome.includes(needle), `docs/index.html missing ${needle}`);
});
assert(!docsHome.includes("/dist/"), "Docs page must not link to ignored dist assets");
for (const ref of docsHome.matchAll(/(?:href|src)="(assets\/[^"]+)"/g)) {
  assert(existsSync(`docs/${ref[1]}`), `Docs page references missing asset ${ref[1]}`);
}
assertPngDimensions("docs/assets/icon.png", 128, 128);
assertPngDimensions("docs/assets/cover.png", 1920, 1080);

const runtimeResult = await runPluginRuntimeSmokeTest(code, ui);
assert(runtimeResult.showUICalled, "Plugin did not open UI");
assert(runtimeResult.exportMessage, "Plugin did not produce an export result in mock Figma runtime");
const exportedLiquid = runtimeResult.exportMessage.files.find((file) => /^sections\/.*\.liquid$/.test(file.path));
assert(exportedLiquid, "Runtime export missing Shopify Liquid section");
const exportedReport = runtimeResult.exportMessage.files.find((file) => /report\.json$/.test(file.path));
assert(exportedReport, "Runtime export missing conversion report");
const exportedCss = runtimeResult.exportMessage.files.find((file) => /^assets\/.*\.css$/.test(file.path));
const exportedJs = runtimeResult.exportMessage.files.find((file) => /^assets\/.*\.js$/.test(file.path));
const exportedSharedJs = runtimeResult.exportMessage.files.find((file) => file.path === "assets/motion-figma-gsap-runtime.js");
const exportedSharedCss = runtimeResult.exportMessage.files.find((file) => file.path === "assets/motion-figma-gsap-runtime.css");
const exportedManifest = runtimeResult.exportMessage.files.find((file) => /manifest\.json$/.test(file.path));
const exportedReportMd = runtimeResult.exportMessage.files.find((file) => /export-report\.md$/.test(file.path));
assert(exportedCss, "Runtime export missing optional CSS copy");
assert(exportedJs, "Runtime export missing optional JS copy");
assert(exportedSharedJs, "Runtime export missing shared runtime JS asset");
assert(exportedSharedCss, "Runtime export missing shared runtime CSS asset");
assert(exportedManifest, "Runtime export missing export manifest");
assert(exportedReportMd, "Runtime export missing Markdown export report");
new vm.Script(exportedJs.content);
new vm.Script(exportedSharedJs.content);
const parsedReport = JSON.parse(exportedReport.content);
const parsedManifest = JSON.parse(exportedManifest.content);
assert(parsedManifest.codeMode === "inline", "Default export should use Copy Code inline mode");
assert(Array.isArray(parsedReport.prototypeReactions), "Report missing raw prototype reactions");
assert(parsedReport.prototypeReactions.length > 0, "Report should include at least one raw prototype reaction in smoke test");
assert(parsedReport.selection?.selected?.type === "FRAME", "Report should record the selected component child layer");
assert(parsedReport.selection?.exportRoot?.type === "INSTANCE", "Report should promote selected component child layer to instance export root");
assert(runtimeResult.exportMessage.summary.selection.usedAncestorRoot === true, "Summary should flag ancestor export root when selecting a component child layer");
assert(runtimeResult.exportMessage.summary.root.type === "INSTANCE", "Summary root should be the exported instance");
const exportReadme = runtimeResult.exportMessage.files.find((file) => file.path === "README.md");
assert(exportReadme?.content.includes("Selected layer: `product.add_to_cart` (FRAME)."), "Export README should document selected layer");
assert(exportReadme?.content.includes("Export root: `Product Hero Component` (INSTANCE)."), "Export README should document promoted component export root");
assert(exportedLiquid.content.includes("\"name\": \"Mock Product Hero\""), "Schema name should match the plugin Section name field");
[
  "{{ fts_product.title | escape }}",
  "{% schema %}",
  "{% stylesheet %}",
  "<script>",
  "font-family: var(--font-body-family, inherit)",
  "font-family: var(--font-heading-family",
  "fts-stage",
  "data-fts-scroll-mode=\"enter-once\"",
  "\"scrollAnimation\":{\"mode\":\"enter-once\"",
  "Shared theme asset: assets/motion-figma-gsap-runtime.css",
  "Shared theme asset: assets/motion-figma-gsap-runtime.js",
  "fts-variant is-active",
  "data-motion-figma-prototype-to-shopify"
].forEach((needle) => {
  assert(exportedLiquid.content.includes(needle), `Exported Liquid missing ${needle}`);
});
assert(!exportedLiquid.content.includes("{{ 'mock-product-hero.css' | asset_url | stylesheet_tag }}"), "Inline Copy Code should not load generated CSS as a separate asset");
assert(!exportedLiquid.content.includes("src=\"{{ 'mock-product-hero.js' | asset_url }}\""), "Inline Copy Code should not load generated JS as a separate asset");
assert(!exportedLiquid.content.includes("{% javascript %}"), "Inline Copy Code should use a script tag instead of Shopify javascript block");
assert(!exportedLiquid.content.includes("\"type\": \"color_scheme\""), "Section schema should not add theme style color settings");
assert(!exportedLiquid.content.includes("\"id\": \"font_scale\""), "Section schema should not add theme style font scale settings");
assert(exportedCss.content.includes(".fts-stage"), "Optional CSS copy missing stage styles");
assert(exportedCss.content.includes(".fts-variant.is-active"), "Optional CSS copy missing active variant styles");
assert(exportedCss.content.includes("font-family: var(--font-body-family, inherit)"), "Generated CSS should inherit Shopify body font family");
assert(exportedCss.content.includes("width: 100vw"), "Generated CSS should break out to full viewport width");
assert(exportedCss.content.includes("max-width: none"), "Generated stage should not cap full-width rendering at the Figma frame width");
assert(exportedCss.content.includes("margin-left: calc(50% - 50vw)"), "Generated CSS should break out of Shopify page-width containers");
assert(exportedCss.content.includes("is-fts-pinned-fallback"), "Generated CSS should include no-GSAP pin sequence fallback");
assert(exportedCss.content.includes(".fts-node__asset { box-shadow: none; filter: none; }"), "Inner image assets should not receive the layer box-shadow");
assert(/z-index:\s*\d+;/.test(exportedCss.content), "Generated CSS should preserve visual stack with z-index while markup follows layer order");
assert(exportedCss.content.includes("font-weight: 700;"), "Generated CSS should preserve Figma text font weight while inheriting Shopify font family");
assert(!exportedCss.content.includes("font-family: Inter"), "Generated CSS should not hard-code the Figma font family");
assert(exportedJs.content.includes("function changeVariant"), "Optional JS copy missing real variant switching");
assert(exportedJs.content.includes("scheduleAfterTimeoutsForState"), "Runtime should schedule AFTER_TIMEOUT from the active state only");
assert(exportedJs.content.includes("setupScrollAnimation"), "Runtime should initialize scroll animation behavior");
assert(exportedJs.content.includes("setupScrollProgressAnimation"), "Runtime should support Scroll Scrub and Pin Sequence");
assert(exportedJs.content.includes("ScrollTrigger.create"), "Runtime should use GSAP ScrollTrigger when available");
assert(exportedJs.content.includes("afterTimeoutInteractions.push"), "Runtime should collect state-scoped AFTER_TIMEOUT interactions");
assert(exportedJs.content.includes("prepareDestinationDiffs"), "Runtime should prepare destination layers for smooth Smart Animate playback");
assert(exportedJs.content.includes("playPreparedDiffs"), "Runtime should play destination-layer Smart Animate diffs");
assert(exportedJs.content.includes("playPreparedDiffsWithGsap"), "Runtime should use GSAP timeline for prepared Smart Animate layers when available");
assert(exportedJs.content.includes("gsap.timeline"), "Runtime should include GSAP timeline enhancement");
assert(exportedJs.content.includes("muteSourceDiffs"), "Runtime should hide matched source layers to avoid frame-by-frame ghosting");
assert(exportedJs.content.includes("window.gsap"), "Runtime should support optional GSAP enhancement when the theme already loads GSAP");
assert(exportedSharedJs.content.includes("function changeVariant"), "Shared runtime JS asset should contain the full generated runtime");
assert(exportedSharedCss.content.includes("[data-motion-figma-prototype-to-shopify] .fts-node__asset"), "Shared runtime CSS asset should contain base asset rules");
assert(!exportedJs.content.includes("interaction.trigger === 'ON_CLICK'"), "Runtime should not discard Figma timed interactions for reduced-motion shortcuts");
assert(!exportedJs.content.includes("root.style.opacity = '0.94'"), "Runtime must not fake dissolve with root opacity");
assert(parsedManifest.interactions.some((item) => item.actions.some((action) => (action.diffs || []).some((diff) => diff.destinationNodeId && typeof diff.fromScaleX === "number"))), "Smart Animate diffs should include destination-layer start values");
assert(parsedManifest.routes?.edges?.length > 0, "Manifest should include prototype route edges");
assert(parsedManifest.files.includes("assets/motion-figma-gsap-runtime.css"), "Manifest should include shared runtime CSS asset");
assert(parsedManifest.files.includes("assets/motion-figma-gsap-runtime.js"), "Manifest should include shared runtime JS asset");
assert(parsedManifest.scrollAnimation?.mode === "enter-once", "Manifest should include selected scroll animation mode");
assert(parsedReport.scrollAnimation?.mode === "enter-once", "Report should include selected scroll animation mode");

const componentSetResult = await runComponentSetSmokeTest(code, ui, "set");
assertComponentSetExport(componentSetResult, "COMPONENT_SET");
const variantSelectionResult = await runComponentSetSmokeTest(code, ui, "variant2");
assertComponentSetExport(variantSelectionResult, "COMPONENT");
const schemaNameFallbackResult = await runPluginRuntimeSmokeTest(code, ui, {
  sectionName: "Motion: Figma Prototype to Shopify",
  filePrefix: "home_feature",
  includeVideoFallback: false
});
const schemaNameFallbackLiquid = schemaNameFallbackResult.exportMessage.files.find((file) => /^sections\/.*\.liquid$/.test(file.path));
assert(schemaNameFallbackLiquid.path === "sections/home-feature.liquid", "File prefix should still create Shopify-safe section filenames");
assert(schemaNameFallbackLiquid.content.includes("\"name\": \"home_feature\""), "Default schema name should follow the plugin file prefix/name field");
const responsiveResult = await runResponsiveFrameSmokeTest(code, ui);
assertResponsiveFrameExport(responsiveResult);
const responsiveManifest = JSON.parse(responsiveResult.files.find((file) => /manifest\.json$/.test(file.path)).content);
const defaultRenameAsset = responsiveManifest.assets.find((asset) => asset.status === "exported" && asset.sourceType === "image-fill" && asset.defaultFilename?.startsWith("home-feature-mobile-cn-mobile-badge"));
assert(defaultRenameAsset, "Responsive manifest should expose default asset filenames for user rename");
const renamedResponsiveResult = await runResponsiveFrameSmokeTest(code, ui, {
  scrollAnimationMode: "pin-sequence",
  assetRenames: {
    [defaultRenameAsset.defaultFilename]: "jiehui custom feature.png"
  }
});
assertRenamedResponsiveExport(renamedResponsiveResult, defaultRenameAsset.defaultFilename);
const transformOpacityResult = await runTransformOpacitySmokeTest(code, ui);
assertTransformOpacityExport(transformOpacityResult);

console.log("Validation passed.");

async function runPluginRuntimeSmokeTest(code, ui, exportSettings = {
  sectionName: "Mock Product Hero",
  filePrefix: "mock-product-hero",
  includeVideoFallback: true
}) {
  let uiHandler = null;
  const messages = [];
  const textNode = {
    id: "2:3",
    name: "product.title",
    type: "TEXT",
    visible: true,
    absoluteBoundingBox: { x: 32, y: 40, width: 320, height: 48 },
    rotation: 0,
    opacity: 1,
    fills: [{ type: "SOLID", color: { r: 0.04, g: 0.04, b: 0.04 }, opacity: 1, visible: true }],
    strokes: [],
    effects: [],
    cornerRadius: 0,
    fontName: { family: "Inter", style: "Bold" },
    fontSize: 40,
    fontWeight: 700,
    lineHeight: { unit: "PIXELS", value: 44 },
    characters: "Product title",
    reactions: []
  };
  const buttonNode = {
    id: "2:4",
    name: "product.add_to_cart",
    type: "FRAME",
    visible: true,
    absoluteBoundingBox: { x: 32, y: 112, width: 180, height: 48 },
    width: 180,
    height: 48,
    rotation: 0,
    opacity: 1,
    fills: [{ type: "SOLID", color: { r: 0.05, g: 0.05, b: 0.05 }, opacity: 1, visible: true }],
    strokes: [],
    effects: [],
    cornerRadius: 6,
    layoutMode: "NONE",
    reactions: [{
      trigger: { type: "ON_HOVER" },
      actions: [{
        type: "NODE",
        navigation: "CHANGE_TO",
        destinationId: "9:1",
        transition: { type: "SMART_ANIMATE", duration: 0.22, easing: { type: "EASE_OUT" } }
      }]
    }],
    children: []
  };
  const rootNode = {
    id: "1:2",
    name: "Product Hero Component",
    type: "INSTANCE",
    visible: true,
    parent: { type: "PAGE" },
    absoluteBoundingBox: { x: 0, y: 0, width: 720, height: 360 },
    width: 720,
    height: 360,
    rotation: 0,
    opacity: 1,
    fills: [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 1, visible: true }],
    strokes: [],
    effects: [],
    cornerRadius: 0,
    layoutMode: "VERTICAL",
    itemSpacing: 16,
    paddingTop: 32,
    paddingRight: 32,
    paddingBottom: 32,
    paddingLeft: 32,
    primaryAxisAlignItems: "MIN",
    counterAxisAlignItems: "MIN",
    reactions: [],
    children: [textNode, buttonNode],
    async exportAsync(settings) {
      if (settings?.format === "WEBM") throw new Error("No animated content");
      return new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
    }
  };
  textNode.parent = rootNode;
  buttonNode.parent = rootNode;
  const destinationNode = {
    ...rootNode,
    id: "9:1",
    name: "Product Hero Hover",
    type: "COMPONENT",
    absoluteBoundingBox: { x: 800, y: 0, width: 720, height: 360 },
    children: [
      { ...textNode, id: "9:3", absoluteBoundingBox: { x: 832, y: 40, width: 320, height: 48 } },
      { ...buttonNode, id: "9:4", reactions: [], absoluteBoundingBox: { x: 832, y: 112, width: 188, height: 50 }, width: 188, height: 50 }
    ]
  };
  const context = {
    __html__: ui,
    console,
    setTimeout,
    clearTimeout,
    Uint8Array,
    Date,
    JSON,
    Object,
    Array,
    String,
    Number,
    Boolean,
    RegExp,
    Math,
    Error,
    isFinite,
    figma: {
      editorType: "figma",
      mixed: Symbol("mixed"),
      currentPage: { selection: [buttonNode] },
      ui: {
        postMessage(message) {
          messages.push(message);
        },
        set onmessage(handler) {
          uiHandler = handler;
        },
        get onmessage() {
          return uiHandler;
        }
      },
      showUI() {
        context.__showUICalled = true;
      },
      on() {},
      notify() {},
      closePlugin() {},
      async getNodeByIdAsync(id) {
        return id === "9:1" ? destinationNode : null;
      },
      getImageByHash() {
        return null;
      }
    },
    __showUICalled: false
  };
  vm.createContext(context);
  new vm.Script(code).runInContext(context);
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert(typeof uiHandler === "function", "Plugin did not register UI message handler");
  uiHandler({
    type: "export",
    settings: exportSettings
  });
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
  return {
    showUICalled: Boolean(context.__showUICalled),
    exportMessage: messages.find((message) => message.type === "export-result"),
    messages
  };
}

async function runComponentSetSmokeTest(code, ui, selectionMode) {
  let uiHandler = null;
  const messages = [];
  const imageBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const componentSet = node("10:1", "Product CTA Set", "COMPONENT_SET", 0, 0, 1280, 720, {
    parent: { type: "PAGE" },
    layoutMode: "HORIZONTAL",
    children: []
  });
  const variants = [
    makeVariant("10:2", "Property 1=Default", 0, "10:3", "AFTER_TIMEOUT", 1),
    makeVariant("10:3", "Property 1=Variant2", 1500, "10:4", "AFTER_TIMEOUT", 1),
    makeVariant("10:4", "Property 1=Variant3", 3000, "10:5", "AFTER_TIMEOUT", 1),
    makeVariant("10:5", "Property 1=Variant4", 4500, "10:4", "ON_CLICK", 0)
  ];
  componentSet.children = variants;
  variants.forEach((variant) => {
    variant.parent = componentSet;
  });

  const context = {
    __html__: ui,
    console,
    setTimeout,
    clearTimeout,
    Uint8Array,
    Date,
    JSON,
    Object,
    Array,
    String,
    Number,
    Boolean,
    RegExp,
    Math,
    Error,
    isFinite,
    figma: {
      editorType: "figma",
      mixed: Symbol("mixed"),
      currentPage: { selection: [selectionMode === "variant2" ? variants[1] : componentSet] },
      ui: {
        postMessage(message) {
          messages.push(message);
        },
        set onmessage(handler) {
          uiHandler = handler;
        },
        get onmessage() {
          return uiHandler;
        }
      },
      showUI() {
        context.__showUICalled = true;
      },
      on() {},
      notify() {},
      closePlugin() {},
      async getNodeByIdAsync(id) {
        return variants.find((variant) => variant.id === id) || (id === componentSet.id ? componentSet : null);
      },
      getImageByHash(hash) {
        if (hash !== "shared-image-hash") return null;
        return {
          async getBytesAsync() {
            return imageBytes;
          }
        };
      }
    },
    __showUICalled: false
  };
  vm.createContext(context);
  new vm.Script(code).runInContext(context);
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert(typeof uiHandler === "function", "Plugin did not register UI message handler for component set");
  uiHandler({
    type: "export",
    settings: {
      sectionName: "Mock Variant Set",
      filePrefix: "mock-variant-set",
      includeVideoFallback: false
    }
  });
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
  return messages.find((message) => message.type === "export-result");
}

async function runResponsiveFrameSmokeTest(code, ui, extraSettings = {}) {
  let uiHandler = null;
  const messages = [];
  const pngBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const desktopFrame = node("20:1", "Home Feature Desktop", "FRAME", 0, 0, 1440, 620, {
    parent: { type: "PAGE" },
    children: []
  });
  const mobileFrame = node("21:1", "Home Feature Mobile", "FRAME", 0, 800, 390, 760, {
    parent: { type: "PAGE" },
    children: []
  });
  const desktopShared = node("20:2", "Shared product image", "RECTANGLE", 120, 80, 520, 260, {
    fills: [{ type: "IMAGE", imageHash: "responsive-shared-hash", scaleMode: "FILL", visible: true }]
  });
  const mobileShared = node("21:2", "Shared product image", "RECTANGLE", 24, 80, 342, 220, {
    fills: [{ type: "IMAGE", imageHash: "responsive-shared-hash", scaleMode: "FILL", visible: true }]
  });
  const mobileOnly = node("21:3", "Mobile badge", "RECTANGLE", 24, 320, 120, 120, {
    fills: [{ type: "IMAGE", imageHash: "responsive-mobile-only-hash", scaleMode: "FILL", visible: true }],
    effects: [{ type: "DROP_SHADOW", visible: true, offset: { x: 0, y: 8 }, radius: 24, color: { r: 0, g: 0, b: 0, a: 0.18 } }]
  });
  const forcedSvg = node("21:4", "home_solution.svg", "RECTANGLE", 180, 320, 120, 72, {
    fills: [{ type: "IMAGE", imageHash: "responsive-logo-hash", scaleMode: "FILL", visible: true }],
    async exportAsync(settings) {
      if (settings?.format === "SVG_STRING") return "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 120 72\"><rect width=\"120\" height=\"72\" fill=\"#26a6a6\"/></svg>";
      return pngBytes;
    }
  });
  desktopFrame.children = [desktopShared];
  mobileFrame.children = [mobileShared, mobileOnly, forcedSvg];
  desktopShared.parent = desktopFrame;
  mobileShared.parent = mobileFrame;
  mobileOnly.parent = mobileFrame;
  forcedSvg.parent = mobileFrame;

  const context = {
    __html__: ui,
    console,
    setTimeout,
    clearTimeout,
    Uint8Array,
    Date,
    JSON,
    Object,
    Array,
    String,
    Number,
    Boolean,
    RegExp,
    Math,
    Error,
    isFinite,
    figma: {
      editorType: "figma",
      mixed: Symbol("mixed"),
      currentPage: { selection: [desktopFrame] },
      ui: {
        postMessage(message) {
          messages.push(message);
        },
        set onmessage(handler) {
          uiHandler = handler;
        },
        get onmessage() {
          return uiHandler;
        }
      },
      showUI() {
        context.__showUICalled = true;
      },
      on() {},
      notify() {},
      closePlugin() {},
      async getNodeByIdAsync(id) {
        if (id === desktopFrame.id) return desktopFrame;
        if (id === mobileFrame.id) return mobileFrame;
        return null;
      },
      getImageByHash(hash) {
        if (hash !== "responsive-shared-hash" && hash !== "responsive-mobile-only-hash" && hash !== "responsive-logo-hash") return null;
        return {
          async getBytesAsync() {
            return pngBytes;
          }
        };
      }
    },
    __showUICalled: false
  };
  vm.createContext(context);
  new vm.Script(code).runInContext(context);
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert(typeof uiHandler === "function", "Plugin did not register UI message handler for responsive frames");
  uiHandler({
    type: "export",
    settings: {
      sectionName: "Motion: Figma Prototype to Shopify",
      filePrefix: "home_feature",
      languageLabel: "cn",
      desktopFrameId: desktopFrame.id,
      mobileFrameId: mobileFrame.id,
      includeVideoFallback: false,
      ...extraSettings
    }
  });
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
  return messages.find((message) => message.type === "export-result");
}

async function runTransformOpacitySmokeTest(code, ui) {
  let uiHandler = null;
  const messages = [];
  const angle = 12 * Math.PI / 180;
  const width = 120;
  const height = 80;
  const desiredX = 64;
  const desiredY = 32;
  const matrixA = Math.cos(angle);
  const matrixB = Math.sin(angle);
  const matrixC = -Math.sin(angle);
  const matrixD = Math.cos(angle);
  const matrixTx = desiredX + width / 2 - (matrixA * width / 2 + matrixC * height / 2);
  const matrixTy = desiredY + height / 2 - (matrixB * width / 2 + matrixD * height / 2);
  const rotatedLayer = node("30:2", "Rotated feature asset", "RECTANGLE", 150, 240, 138, 104, {
    rotation: undefined,
    relativeTransform: [
      [matrixA, matrixC, matrixTx],
      [matrixB, matrixD, matrixTy]
    ],
    width,
    height,
    opacity: 0.42
  });
  const rootFrame = node("30:1", "Transform Accuracy", "FRAME", 100, 200, 400, 240, {
    parent: { type: "PAGE" },
    children: [rotatedLayer]
  });
  rotatedLayer.parent = rootFrame;

  const context = {
    __html__: ui,
    console,
    setTimeout,
    clearTimeout,
    Uint8Array,
    Date,
    JSON,
    Object,
    Array,
    String,
    Number,
    Boolean,
    RegExp,
    Math,
    Error,
    isFinite,
    figma: {
      editorType: "figma",
      mixed: Symbol("mixed"),
      currentPage: { selection: [rootFrame] },
      ui: {
        postMessage(message) {
          messages.push(message);
        },
        set onmessage(handler) {
          uiHandler = handler;
        },
        get onmessage() {
          return uiHandler;
        }
      },
      showUI() {
        context.__showUICalled = true;
      },
      on() {},
      notify() {},
      closePlugin() {},
      async getNodeByIdAsync(id) {
        return id === rootFrame.id ? rootFrame : null;
      },
      getImageByHash() {
        return null;
      }
    },
    __showUICalled: false
  };
  vm.createContext(context);
  new vm.Script(code).runInContext(context);
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert(typeof uiHandler === "function", "Plugin did not register UI message handler for transform opacity smoke test");
  uiHandler({
    type: "export",
    settings: {
      sectionName: "Transform Accuracy",
      filePrefix: "transform-accuracy",
      includeVideoFallback: false
    }
  });
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
  return messages.find((message) => message.type === "export-result");
}

function makeVariant(id, name, x, destinationId, triggerType, delaySeconds) {
  const variant = node(id, name, "COMPONENT", x, 0, 320, 180, {
    variantProperties: { "Property 1": name.split("=").pop() },
    layoutMode: "NONE",
    reactions: [{
      trigger: triggerType === "AFTER_TIMEOUT" ? { type: "AFTER_TIMEOUT", timeout: delaySeconds } : { type: triggerType },
      actions: [{
        type: "NODE",
        navigation: "CHANGE_TO",
        destinationId,
        transition: { type: "SMART_ANIMATE", duration: 2, easing: { type: "EASE_OUT" } }
      }]
    }]
  });
  const title = node(id + ":title", "product.title", "TEXT", x + 24, 24, 180, 32, {
    characters: name,
    fontName: { family: "Inter", style: "Bold" },
    fontSize: 24,
    fontWeight: 700,
    lineHeight: { unit: "PIXELS", value: 28 },
    fills: [{ type: "SOLID", color: { r: 0.02, g: 0.02, b: 0.02 }, opacity: 1, visible: true }]
  });
  const image = node(id + ":image", "Hero image", "RECTANGLE", x + 24, 72, 96, 72, {
    rotation: -4,
    fills: [{ type: "IMAGE", imageHash: "shared-image-hash", scaleMode: "FILL", visible: true }]
  });
  const icon = node(id + ":icon", "Arrow icon", "VECTOR", x + 136, 82, 36, 36, {
    async exportAsync() {
      return "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 36 36\"><path d=\"M4 18h24\"/></svg>";
    }
  });
  const failed = node(id + ":failed", "Broken vector", "VECTOR", x + 184, 82, 20, 20, {
    async exportAsync() {
      throw new Error("Mock SVG export failure");
    }
  });
  variant.children = [title, image, icon, failed];
  variant.children.forEach((child) => {
    child.parent = variant;
  });
  return variant;
}

function node(id, name, type, x, y, width, height, overrides = {}) {
  return {
    id,
    name,
    type,
    visible: true,
    absoluteBoundingBox: { x, y, width, height },
    width,
    height,
    rotation: 0,
    opacity: 1,
    fills: [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 1, visible: true }],
    strokes: [],
    effects: [],
    cornerRadius: 0,
    layoutMode: "NONE",
    reactions: [],
    children: [],
    async exportAsync(settings) {
      if (settings?.format === "WEBM") throw new Error("No animated content");
      return new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
    },
    ...overrides
  };
}

function assertComponentSetExport(exportMessage, selectedType) {
  assert(exportMessage, "Component Set export did not produce a result");
  assert(exportMessage.summary.root.type === "COMPONENT_SET", "Component variant selection should export parent Component Set");
  assert(exportMessage.summary.counts.states === 4, "Component Set should export all four variants as states");
  assert(exportMessage.summary.selection.selected.type === selectedType, `Selection should be ${selectedType}`);
  const liquid = exportMessage.files.find((file) => /^sections\/.*\.liquid$/.test(file.path));
  const css = exportMessage.files.find((file) => /^assets\/.*\.css$/.test(file.path));
  const js = exportMessage.files.find((file) => /^assets\/.*\.js$/.test(file.path));
  const manifest = JSON.parse(exportMessage.files.find((file) => /manifest\.json$/.test(file.path)).content);
  const reportMd = exportMessage.files.find((file) => /export-report\.md$/.test(file.path));
  new vm.Script(js.content);
  assert(manifest.codeMode === "inline", "Component Set export should default to Copy Code inline mode");
  assert(liquid.content.match(/class="fts-variant/g).length === 4, "Liquid should render four overlaid variant states");
  assert(liquid.content.includes("data-figma-node-id=\"10:2\""), "Liquid missing exact Figma ID for Default variant");
  assert(liquid.content.includes("data-variant-name=\"Property 1=Variant4\""), "Liquid missing Variant4 state");
  assert(liquid.content.includes("{% stylesheet %}"), "Component Set Liquid should inline CSS in Copy Code mode");
  assert(liquid.content.includes("<script>"), "Component Set Liquid should inline JS with a script tag in Copy Code mode");
  assert(!liquid.content.includes("{% javascript %}"), "Component Set Liquid should not use Shopify javascript block");
  assert(!liquid.content.includes("{{ 'mock-variant-set.css' | asset_url | stylesheet_tag }}"), "Component Set Liquid should not load generated CSS separately in Copy Code mode");
  assert(!liquid.content.includes("src=\"{{ 'mock-variant-set.js' | asset_url }}\""), "Component Set Liquid should not load generated JS separately in Copy Code mode");
  assert(!liquid.content.includes("\"type\": \"color_scheme\""), "Component Set schema should not add theme style color settings");
  assert(!liquid.content.includes("\"id\": \"font_scale\""), "Component Set schema should not add theme style font scale settings");
  assert(css.content.includes("--stage-width: 320"), "Stage width should use one variant width, not combined Component Set width");
  assert(css.content.includes("--stage-height: 180"), "Stage height should use one variant height");
  assert(css.content.includes("width: 100vw"), "Component Set CSS should render full viewport width");
  assert(css.content.includes("max-width: none"), "Component Set stage should not cap at Figma variant width");
  assert(css.content.includes("is-fts-pinned-fallback"), "Component Set CSS should include pin sequence fallback styles");
  assert(css.content.includes(".fts-variant {"), "CSS missing variant stacking");
  assert(cssZIndex(css.content, ".fts-mock-variant-set .n-10_2_title") > cssZIndex(css.content, ".fts-mock-variant-set .n-10_2_image"), "Earlier Figma child layers should keep higher z-index than lower/background layers");
  assert(css.content.includes(".fts-mock-variant-set .n-10_2_title,\n.fts-mock-variant-set .n-10_3_title"), "Repeated text style declarations should be grouped across similar layers");
  assert(css.content.includes("transform: rotate(-4deg);"), "Generated CSS should preserve static Figma layer rotation");
  assert(js.content.includes("function changeVariant"), "Runtime missing changeVariant");
  assert(js.content.includes("scheduleAfterTimeoutsForState"), "Runtime missing state-scoped AFTER_TIMEOUT scheduling");
  assert(js.content.includes("setupScrollAnimation"), "Runtime missing scroll animation setup");
  assert(js.content.includes("ScrollTrigger.create"), "Runtime missing optional ScrollTrigger support");
  assert(js.content.includes("prepareDestinationDiffs"), "Runtime missing destination-layer Smart Animate preparation");
  assert(js.content.includes("muteSourceDiffs"), "Runtime missing matched source-layer muting");
  assert(js.content.includes("window.gsap"), "Runtime missing optional GSAP enhancement");
  assert(js.content.includes("shopify:section:load"), "Runtime missing Shopify load lifecycle");
  assert(js.content.includes("shopify:section:unload"), "Runtime missing Shopify unload lifecycle");
  assert(manifest.states.length === 4, "Manifest should include all four variants");
  assert(manifest.scrollAnimation?.mode === "enter-once", "Component Set manifest should include scroll animation mode");
  assert(manifest.files.includes("assets/motion-figma-gsap-runtime.css"), "Component Set manifest should include shared runtime CSS");
  assert(manifest.files.includes("assets/motion-figma-gsap-runtime.js"), "Component Set manifest should include shared runtime JS");
  assert(manifest.interactions.length >= 4, "Manifest should include recursive/circular prototype chain interactions");
  assert(manifest.interactions.some((item) => item.delayMs === 1000), "AFTER_TIMEOUT delay should be stored in milliseconds");
  assert(manifest.interactions.some((item) => item.actions.some((action) => action.transition?.durationMs === 2000)), "Figma transition duration should be stored in milliseconds");
  assert(manifest.interactions.some((item) => item.actions.some((action) => action.destinationNodeId === "10:5")), "Variant chain should include Variant4 destination");
  assert(manifest.routes?.edges?.length >= 4, "Manifest should expose the compiled prototype route graph");
  assert(manifest.routes?.hasLoop === true, "Manifest should flag circular variant routes");
  assert(manifest.routes?.loops?.some((loop) => loop.names.join(" -> ").includes("Property 1=Variant3 -> Property 1=Variant4 -> Property 1=Variant3")), "Manifest should describe the Variant3/Variant4 loop");
  assert(exportMessage.summary.routes?.hasLoop === true, "Summary should expose circular prototype routes for the Motion tab");
  assert(manifest.assets.some((asset) => asset.status === "exported" && asset.sourceType === "image-fill"), "Image fill asset should be exported");
  assert(manifest.assets.some((asset) => asset.status === "exported" && asset.assetType === "SVG"), "Vector SVG asset should be exported");
  assert(manifest.assets.some((asset) => asset.status === "failed" && asset.failureReason.includes("Mock SVG export failure")), "Failed vector export should be visible in asset manifest");
  const imageAssets = manifest.assets.filter((asset) => asset.status === "exported" && asset.sourceType === "image-fill");
  assert(imageAssets.length === 1, "Duplicate image fills should be deduplicated");
  assert(imageAssets[0].usedBy.length === 4, "Deduplicated image fill should record every variant using it");
  const packagedPaths = new Set(exportMessage.files.map((file) => file.path));
  for (const filename of [...liquid.content.matchAll(/{{ '([^']+)' \| asset_url/g)].map((match) => match[1])) {
    assert(packagedPaths.has(`assets/${filename}`), `Liquid references missing package asset ${filename}`);
  }
  assert(reportMd.content.includes("Property 1=Variant4"), "Markdown report should list Variant4");
  assert(reportMd.content.includes("Prototype routes"), "Markdown report should include prototype routes");
  assert(reportMd.content.includes("Loop detected"), "Markdown report should include detected loops");
}

function assertResponsiveFrameExport(exportMessage) {
  assert(exportMessage, "Responsive frame export did not produce a result");
  const liquid = exportMessage.files.find((file) => /^sections\/.*\.liquid$/.test(file.path));
  const css = exportMessage.files.find((file) => /^assets\/.*\.css$/.test(file.path));
  const manifest = JSON.parse(exportMessage.files.find((file) => /manifest\.json$/.test(file.path)).content);
  assert(liquid.path === "sections/home-feature.liquid", "Responsive export should use Shopify-safe file prefix");
  assert(liquid.content.includes("\"name\": \"home_feature\""), "Responsive schema name should follow plugin file name when schema name is default");
  assert(liquid.content.includes("fts-responsive--desktop"), "Responsive Liquid missing desktop viewport");
  assert(liquid.content.includes("fts-responsive--mobile"), "Responsive Liquid missing mobile viewport");
  assert(liquid.content.match(/data-fts-viewport=/g).length === 2, "Desktop and mobile viewports should initialize independently");
  assert(liquid.content.includes("data-fts-scroll-mode=\"enter-once\""), "Responsive Liquid should include selected animation mode");
  assert(liquid.content.includes("<script>"), "Copy Code should inline runtime with a script tag");
  assert(!liquid.content.includes("{% javascript %}"), "Copy Code should not use Shopify javascript block");
  assert(css.content.includes(".fts-responsive--desktop { display: block; }"), "Responsive CSS missing desktop default display");
  assert(css.content.includes(".fts-responsive--mobile { display: none; }"), "Responsive CSS missing mobile default hidden state");
  assert(css.content.includes(".fts-responsive--desktop { display: none; }"), "Responsive CSS missing mobile breakpoint desktop hide");
  assert(css.content.includes(".fts-responsive--mobile { display: block; }"), "Responsive CSS missing mobile breakpoint mobile show");
  assert(css.content.includes("box-shadow: 0px 8px 24px rgba(0, 0, 0, 0.18);"), "Image layer shadow should be emitted as CSS on the layer wrapper");
  assert(css.content.includes(".fts-node__asset { box-shadow: none; filter: none; }"), "PNG/SVG file assets should not carry the layer shadow themselves");
  assert(manifest.responsive.length === 2, "Manifest should include desktop and mobile responsive frame summaries");
  assert(manifest.responsive.some((item) => item.key === "desktop" && item.stage.width === 1440), "Manifest missing desktop stage");
  assert(manifest.responsive.some((item) => item.key === "mobile" && item.stage.width === 390), "Manifest missing mobile stage");
  assert(manifest.scrollAnimation?.mode === "enter-once", "Manifest missing responsive scroll animation mode");
  const imageAssets = manifest.assets.filter((asset) => asset.status === "exported" && asset.sourceType === "image-fill");
  assert(imageAssets.some((asset) => asset.shopifyFilename.startsWith("home-feature-desktop-cn-shared-product-image")), "Desktop asset filename should include desktop and language label");
  assert(imageAssets.some((asset) => asset.shopifyFilename.startsWith("home-feature-mobile-cn-mobile-badge")), "Mobile asset filename should include mobile and language label");
  const shared = imageAssets.find((asset) => asset.shopifyFilename.startsWith("home-feature-desktop-cn-shared-product-image"));
  assert(shared && shared.usedBy.length === 2, "Shared desktop/mobile image asset should be deduplicated and record both uses");
  assert(shared.defaultFilename === shared.shopifyFilename, "Unrenamed asset should keep default filename in manifest");
  assert(manifest.assets.some((asset) => asset.status === "exported" && asset.sourceType === "forced-svg" && asset.shopifyFilename.includes("home-solution") && asset.shopifyFilename.endsWith(".svg")), "Layer name home_solution.svg should force a clean SVG asset export");
}

function assertRenamedResponsiveExport(exportMessage, originalDefaultFilename) {
  assert(exportMessage, "Renamed responsive export did not produce a result");
  const liquid = exportMessage.files.find((file) => /^sections\/.*\.liquid$/.test(file.path));
  const css = exportMessage.files.find((file) => /^assets\/.*\.css$/.test(file.path));
  const js = exportMessage.files.find((file) => /^assets\/.*\.js$/.test(file.path));
  const manifest = JSON.parse(exportMessage.files.find((file) => /manifest\.json$/.test(file.path)).content);
  const renamed = manifest.assets.find((asset) => asset.defaultFilename === originalDefaultFilename);
  assert(renamed, "Renamed asset missing from manifest");
  assert(renamed.shopifyFilename === "jiehui-custom-feature.png", "Asset rename should be Shopify-safe and preserve extension");
  assert(renamed.renamed === true, "Manifest should mark asset as renamed");
  const liquidAssetRefs = [...liquid.content.matchAll(/{{ '([^']+)' \| asset_url/g)].map((match) => match[1]);
  assert(liquid.content.includes("jiehui-custom-feature.png"), `Copy Code Liquid should reference renamed asset file. Found refs: ${liquidAssetRefs.join(", ")}`);
  assert(!liquid.content.includes(originalDefaultFilename), "Copy Code Liquid should not reference old asset filename after Save and Run");
  assert(exportMessage.files.some((file) => file.path === "assets/jiehui-custom-feature.png"), "ZIP file list should include renamed asset path");
  assert(css.content.includes("is-fts-pinned-fallback"), "Copy CSS should include pin sequence fallback after Save and Run");
  assert(js.content.includes("setupScrollProgressAnimation"), "Copy JS should include scroll progress runtime after Save and Run");
  assert(manifest.scrollAnimation?.mode === "pin-sequence", "Save and Run should regenerate with selected Pin Sequence mode");
  assert(liquid.content.includes("data-fts-scroll-mode=\"pin-sequence\""), "Copy Code Liquid should include selected Pin Sequence mode");
}

function assertTransformOpacityExport(exportMessage) {
  assert(exportMessage, "Transform opacity export did not produce a result");
  const css = exportMessage.files.find((file) => /^assets\/.*\.css$/.test(file.path));
  const js = exportMessage.files.find((file) => /^assets\/.*\.js$/.test(file.path));
  const liquid = exportMessage.files.find((file) => /^sections\/.*\.liquid$/.test(file.path));
  assert(css.content.includes(".fts-transform-accuracy .n-30_2"), "Transform smoke CSS missing rotated layer rule");
  assert(css.content.includes("left: 16%;"), "Rotated layer should use relativeTransform x instead of absoluteBoundingBox x");
  assert(css.content.includes("top: 13.3333%;"), "Rotated layer should use relativeTransform y instead of absoluteBoundingBox y");
  assert(css.content.includes("width: 30%;"), "Rotated layer should use node width instead of rotated absoluteBoundingBox width");
  assert(css.content.includes("height: 33.3333%;"), "Rotated layer should use node height instead of rotated absoluteBoundingBox height");
  assert(css.content.includes("transform: rotate(12deg);"), "Generated CSS should read rotation from relativeTransform when node.rotation is unavailable");
  assert(css.content.includes("opacity: 0.42;"), "Generated CSS should preserve selected layer opacity");
  assert(js.content.includes("computedTransform"), "Runtime should remember stylesheet/computed base transform before Smart Animate playback");
  assert(js.content.includes("composeMotionTransform"), "Runtime should compose motion deltas with the base Figma transform");
  assert(js.content.includes("transform: baseTransform(original) || 'none'"), "GSAP runtime should tween back to the selected layer base transform instead of rotation 0");
  assert(liquid.content.includes("\"name\": \"Transform Accuracy\""), "Transform smoke schema name should follow plugin section name");
}

function read(path) {
  return readFileSync(path, "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function cssZIndex(css, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, "m"));
  assert(match, `Missing CSS rule for ${selector}`);
  const z = match[1].match(/z-index:\s*(\d+);/);
  assert(z, `Missing z-index for ${selector}`);
  return Number(z[1]);
}

function assertPngDimensions(path, width, height) {
  const bytes = readFileSync(path);
  assert(bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71, `${path} is not a PNG`);
  const actualWidth = bytes.readUInt32BE(16);
  const actualHeight = bytes.readUInt32BE(20);
  assert(actualWidth === width && actualHeight === height, `${path} must be ${width}x${height}, got ${actualWidth}x${actualHeight}`);
}
