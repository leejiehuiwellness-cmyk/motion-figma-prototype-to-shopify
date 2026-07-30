import { readFileSync, existsSync } from "node:fs";
import vm from "node:vm";

const requiredFiles = [
  "manifest.json",
  "code.js",
  "ui.html",
  "figma-plugin-prd.md",
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
  "marketplace-assets/cover.png"
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
  "ON_CLICK",
  "ON_HOVER",
  "AFTER_TIMEOUT",
  "Smart Animate",
  "shopify:section:load"
].forEach((needle) => {
  assert(code.includes(needle), `code.js missing ${needle}`);
});

const onboarding = read("ONBOARDING.md");
[
  "Select the starting frame",
  "product.title",
  "collection.grid",
  "Copy Liquid",
  "Shopify Admin"
].forEach((needle) => {
  assert(onboarding.includes(needle), `ONBOARDING.md missing ${needle}`);
});

const marketplaceCopy = read("FIGMA_MARKETPLACE_COPY_READY.md");
[
  "Motion: Figma Prototype to Shopify",
  "allowedDomains: [\"none\"]",
  "icon.png",
  "cover.png",
  "jiehui02@gmail.com"
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
  "Smart Animate"
].forEach((needle) => {
  assert(supportMatrix.includes(needle), `PROTOTYPE_SUPPORT_MATRIX.md missing ${needle}`);
});

const exampleLiquid = read("examples/example-shopify-section.liquid");
const schemaMatch = exampleLiquid.match(/{% schema %}([\s\S]*?){% endschema %}/);
assert(schemaMatch, "Example Liquid missing schema block");
JSON.parse(schemaMatch[1]);
assertPngDimensions("marketplace-assets/icon.png", 128, 128);
assertPngDimensions("marketplace-assets/cover.png", 1920, 1080);

const runtimeResult = await runPluginRuntimeSmokeTest(code, ui);
assert(runtimeResult.showUICalled, "Plugin did not open UI");
assert(runtimeResult.exportMessage, "Plugin did not produce an export result in mock Figma runtime");
const exportedLiquid = runtimeResult.exportMessage.files.find((file) => /^sections\/.*\.liquid$/.test(file.path));
assert(exportedLiquid, "Runtime export missing Shopify Liquid section");
const exportedReport = runtimeResult.exportMessage.files.find((file) => /report\.json$/.test(file.path));
assert(exportedReport, "Runtime export missing conversion report");
const parsedReport = JSON.parse(exportedReport.content);
assert(Array.isArray(parsedReport.prototypeReactions), "Report missing raw prototype reactions");
assert(parsedReport.prototypeReactions.length > 0, "Report should include at least one raw prototype reaction in smoke test");
[
  "{{ fts_product.title | escape }}",
  "{% schema %}",
  "{% stylesheet %}",
  "{% javascript %}",
  "data-motion-figma-prototype-to-shopify"
].forEach((needle) => {
  assert(exportedLiquid.content.includes(needle), `Exported Liquid missing ${needle}`);
});

console.log("Validation passed.");

async function runPluginRuntimeSmokeTest(code, ui) {
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
    name: "Product Hero",
    type: "FRAME",
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
  const destinationNode = {
    ...rootNode,
    id: "9:1",
    name: "Product Hero Hover",
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
      currentPage: { selection: [rootNode] },
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
    settings: {
      sectionName: "Mock Product Hero",
      filePrefix: "mock-product-hero",
      includeVideoFallback: true
    }
  });
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
  return {
    showUICalled: Boolean(context.__showUICalled),
    exportMessage: messages.find((message) => message.type === "export-result"),
    messages
  };
}

function read(path) {
  return readFileSync(path, "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertPngDimensions(path, width, height) {
  const bytes = readFileSync(path);
  assert(bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71, `${path} is not a PNG`);
  const actualWidth = bytes.readUInt32BE(16);
  const actualHeight = bytes.readUInt32BE(20);
  assert(actualWidth === width && actualHeight === height, `${path} must be ${width}x${height}, got ${actualWidth}x${actualHeight}`);
}
