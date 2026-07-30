(function () {
  "use strict";

  var PLUGIN_VERSION = "0.1.0";
  var MAX_ASSETS = 60;
  var MAX_ASSET_BYTES = 6 * 1024 * 1024;
  var SUPPORTED_ROOT_TYPES = {
    FRAME: true,
    COMPONENT: true,
    INSTANCE: true,
    SECTION: true,
    GROUP: true
  };
  var SUPPORTED_TRIGGERS = {
    ON_CLICK: true,
    ON_HOVER: true,
    ON_PRESS: true,
    AFTER_TIMEOUT: true,
    MOUSE_ENTER: true,
    MOUSE_LEAVE: true,
    MOUSE_DOWN: true,
    MOUSE_UP: true
  };
  var SUPPORTED_NODE_ACTIONS = {
    NAVIGATE: true,
    SWAP: true,
    OVERLAY: true,
    CHANGE_TO: true
  };
  var VECTOR_TYPES = {
    VECTOR: true,
    BOOLEAN_OPERATION: true,
    ELLIPSE: true,
    LINE: true,
    POLYGON: true,
    STAR: true
  };

  if (figma.editorType !== "figma") {
    figma.closePlugin("Motion: Figma Prototype to Shopify only runs in Figma Design files.");
    return;
  }

  figma.skipInvisibleInstanceChildren = true;
  figma.showUI(__html__, {
    width: 540,
    height: 720,
    title: "Motion: Figma Prototype to Shopify",
    themeColors: true
  });

  figma.ui.onmessage = function (message) {
    if (!message || !message.type) return;
    if (message.type === "scan") {
      runScan(message.settings || {});
      return;
    }
    if (message.type === "export") {
      runExport(message.settings || {});
      return;
    }
    if (message.type === "notify") {
      figma.notify(String(message.text || ""));
      return;
    }
    if (message.type === "close") {
      figma.closePlugin();
    }
  };

  figma.on("selectionchange", function () {
    post("selection-changed", {});
  });

  runScan({});

  async function runScan(rawSettings) {
    try {
      post("busy", { label: "Scanning selected Figma frame..." });
      var result = await buildExport(rawSettings, false);
      post("scan-result", {
        summary: result.summary,
        files: result.files,
        modelPreview: result.modelPreview
      });
    } catch (error) {
      postError(error);
    }
  }

  async function runExport(rawSettings) {
    try {
      post("busy", { label: "Exporting Shopify Liquid section..." });
      var result = await buildExport(rawSettings, true);
      post("export-result", {
        summary: result.summary,
        files: result.files,
        modelPreview: result.modelPreview
      });
      figma.notify("Shopify section export is ready.");
    } catch (error) {
      postError(error);
    }
  }

  function post(type, payload) {
    figma.ui.postMessage(Object.assign({ type: type }, payload || {}));
  }

  function postError(error) {
    var message = error && error.message ? error.message : String(error);
    post("error", { message: message });
    figma.notify(message, { error: true });
  }

  async function buildExport(rawSettings, includeAssets) {
    var settings = normalizeSettings(rawSettings);
    var selection = figma.currentPage.selection;

    if (!selection || selection.length === 0) {
      throw new Error("Select one top-level frame, component, instance, group, or section before running the plugin.");
    }

    if (selection.length > 1) {
      throw new Error("Select exactly one starting frame or section. Multiple selections make the Shopify section boundary ambiguous.");
    }

    var root = selection[0];
    if (!SUPPORTED_ROOT_TYPES[root.type]) {
      throw new Error("The selected node type '" + root.type + "' is not supported as a Shopify export root.");
    }

    var ctx = {
      includeAssets: includeAssets,
      settings: settings,
      warnings: [],
      assets: [],
      assetIndex: 0,
      assetHashMap: {},
      destinationIds: {},
      classPrefix: "fts-" + slug(settings.filePrefix || root.name || "section", "section"),
      sectionType: slug(settings.filePrefix || "motion-figma-prototype-to-shopify", "motion-figma-prototype-to-shopify"),
      rootId: cleanNodeId(root.id)
    };

    var rootModel = await serializeNode(root, null, root, ctx, 0, [root.name || "Root"]);
    if (!rootModel) {
      throw new Error("The selected node is hidden or could not be serialized.");
    }

    var destinationModels = await collectDestinationModels(ctx, root);
    var tokens = collectTokens(rootModel);
    var bindings = collectBindings(rootModel);
    var motion = buildMotionGraph(rootModel, destinationModels, ctx);

    if (includeAssets) {
      await maybeExportRootPreview(root, ctx);
      if (settings.includeVideoFallback) {
        await maybeExportVideoFallback(root, ctx);
      }
    }

    var files = generateShopifyFiles({
      settings: settings,
      root: rootModel,
      destinations: destinationModels,
      tokens: tokens,
      bindings: bindings,
      motion: motion,
      warnings: ctx.warnings,
      assets: ctx.assets,
      classPrefix: ctx.classPrefix,
      sectionType: ctx.sectionType
    });

    var summary = {
      status: ctx.warnings.length ? "ready-with-warnings" : "ready",
      pluginVersion: PLUGIN_VERSION,
      root: {
        name: rootModel.name,
        type: rootModel.type,
        width: rootModel.width,
        height: rootModel.height
      },
      counts: {
        nodes: countNodes(rootModel),
        assets: ctx.assets.length,
        bindings: bindings.length,
        interactions: motion.interactions.length,
        warnings: ctx.warnings.length
      },
      warnings: ctx.warnings,
      bindings: bindings,
      interactions: motion.interactions.map(function (item) {
        return {
          triggerNode: item.triggerNodeName,
          trigger: item.trigger,
          actions: item.actions.map(function (action) { return action.kind; })
        };
      }),
      files: files.map(function (file) {
        return {
          path: file.path,
          type: file.type || "text",
          size: file.content ? file.content.length : file.bytes ? file.bytes.length : 0
        };
      })
    };

    return {
      summary: summary,
      files: files,
      modelPreview: {
        rootName: rootModel.name,
        tokens: tokens,
        destinationCount: Object.keys(destinationModels).length
      }
    };
  }

  function normalizeSettings(raw) {
    var sectionName = String(raw.sectionName || "Motion: Figma Prototype to Shopify").trim();
    var filePrefix = slug(raw.filePrefix || "motion-figma-prototype-to-shopify", "motion-figma-prototype-to-shopify");
    var assetScale = Number(raw.assetScale || 1);
    if (!assetScale || assetScale < 0.5) assetScale = 1;
    if (assetScale > 4) assetScale = 4;
    return {
      sectionName: sectionName || "Motion: Figma Prototype to Shopify",
      filePrefix: filePrefix,
      assetScale: assetScale,
      includeVideoFallback: raw.includeVideoFallback !== false,
      includeInlineAssets: raw.includeInlineAssets !== false,
      reducedMotionMode: raw.reducedMotionMode || "skip"
    };
  }

  async function serializeNode(node, parentModel, root, ctx, depth, path) {
    if ("visible" in node && node.visible === false) {
      ctx.warnings.push(warning("hidden-node", "Skipped hidden layer: " + safeName(node.name), node.id));
      return null;
    }

    var bounds = getRelativeBounds(node, parentModel, root);
    var model = {
      id: cleanNodeId(node.id),
      figmaId: node.id,
      name: safeName(node.name),
      type: node.type,
      depth: depth,
      path: path.map(safeName),
      pathKey: path.slice(1).map(normalizePathPart).join("/"),
      className: "n-" + cleanNodeId(node.id),
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      absoluteX: bounds.absoluteX,
      absoluteY: bounds.absoluteY,
      rotation: numberOrZero(node.rotation),
      opacity: typeof node.opacity === "number" ? node.opacity : 1,
      layout: readLayout(node),
      fills: readPaints(node, "fills"),
      strokes: readPaints(node, "strokes"),
      effects: readEffects(node),
      cornerRadius: readCornerRadius(node),
      text: readText(node),
      binding: detectBinding(node.name || ""),
      reactions: readReactions(node, ctx),
      asset: null,
      children: []
    };

    if (model.text && model.text.characters && model.binding) {
      model.text.originalCharacters = model.text.characters;
    }

    if (ctx.includeAssets) {
      model.asset = await maybeExportNodeAsset(node, model, ctx);
    } else {
      model.asset = detectAssetReference(node, model, ctx);
    }

    if ("children" in node && node.children && depth < 8) {
      for (var i = 0; i < node.children.length; i += 1) {
        var child = node.children[i];
        var childPath = path.concat([child.name || child.type + " " + i]);
        var childModel = await serializeNode(child, model, root, ctx, depth + 1, childPath);
        if (childModel) model.children.push(childModel);
      }
    }

    return model;
  }

  async function collectDestinationModels(ctx, root) {
    var result = {};
    var ids = Object.keys(ctx.destinationIds).slice(0, 12);
    for (var i = 0; i < ids.length; i += 1) {
      var id = ids[i];
      if (id === root.id) continue;
      try {
        var node = await figma.getNodeByIdAsync(id);
        if (!node) {
          ctx.warnings.push(warning("missing-destination", "Prototype destination was not found: " + id, id));
          continue;
        }
        if (!("type" in node) || !SUPPORTED_ROOT_TYPES[node.type]) {
          ctx.warnings.push(warning("unsupported-destination", "Prototype destination '" + safeName(node.name) + "' is a " + node.type + " and will be reported only.", id));
          continue;
        }
        var childCtx = Object.assign({}, ctx, {
          includeAssets: false,
          warnings: ctx.warnings,
          assets: ctx.assets,
          destinationIds: {}
        });
        var model = await serializeNode(node, null, node, childCtx, 0, [node.name || "Destination"]);
        if (model) result[id] = model;
      } catch (error) {
        ctx.warnings.push(warning("destination-read-failed", "Could not read prototype destination " + id + ": " + error.message, id));
      }
    }
    return result;
  }

  function readReactions(node, ctx) {
    if (!("reactions" in node) || !node.reactions) return [];
    var reactions = Array.prototype.slice.call(node.reactions);
    return reactions.map(function (reaction, reactionIndex) {
      var trigger = cloneSimple(reaction.trigger);
      var actions = [];
      if (reaction.actions && reaction.actions.length) {
        actions = Array.prototype.slice.call(reaction.actions);
      } else if (reaction.action) {
        actions = [reaction.action];
      }

      if (!trigger || !SUPPORTED_TRIGGERS[trigger.type]) {
        ctx.warnings.push(warning("unsupported-trigger", "Unsupported prototype trigger '" + (trigger && trigger.type ? trigger.type : "unknown") + "' on " + safeName(node.name) + ".", node.id));
      }

      var serializedActions = actions.map(function (action) {
        var item = cloneSimple(action);
        if (item && item.type === "NODE" && item.destinationId) {
          ctx.destinationIds[item.destinationId] = true;
          if (!SUPPORTED_NODE_ACTIONS[item.navigation]) {
            ctx.warnings.push(warning("unsupported-navigation", "Unsupported Figma navigation action '" + item.navigation + "' on " + safeName(node.name) + ".", node.id));
          }
        }
        if (item && (item.type === "SET_VARIABLE" || item.type === "SET_VARIABLE_MODE" || item.type === "CONDITIONAL")) {
          ctx.warnings.push(warning("unsupported-action", "Figma action '" + item.type + "' is documented in the report but not compiled to Shopify runtime in v1.", node.id));
        }
        if (item && item.type === "UPDATE_MEDIA_RUNTIME") {
          ctx.warnings.push(warning("media-action", "Video runtime action '" + item.mediaAction + "' is reported but not compiled in v1.", node.id));
        }
        return item;
      });

      return {
        index: reactionIndex,
        trigger: trigger,
        actions: serializedActions
      };
    });
  }

  function buildMotionGraph(rootModel, destinations, ctx) {
    var interactions = [];
    walk(rootModel, function (node) {
      if (!node.reactions || !node.reactions.length) return;
      node.reactions.forEach(function (reaction) {
        if (!reaction.trigger || !SUPPORTED_TRIGGERS[reaction.trigger.type]) return;
        var compiledActions = [];
        reaction.actions.forEach(function (action) {
          if (!action || !action.type) return;

          if (action.type === "URL" && action.url) {
            compiledActions.push({ kind: "url", url: action.url });
            return;
          }

          if (action.type === "BACK" || action.type === "CLOSE") {
            compiledActions.push({ kind: "close-overlay" });
            return;
          }

          if (action.type !== "NODE") return;

          var destination = action.destinationId ? destinations[action.destinationId] : null;
          var transition = normalizeTransition(action.transition);
          if (action.navigation === "OVERLAY" && destination) {
            compiledActions.push({
              kind: "open-overlay",
              overlayId: destination.id,
              transition: transition
            });
            return;
          }

          if (destination && SUPPORTED_NODE_ACTIONS[action.navigation]) {
            var diffs = buildSmartDiffs(rootModel, destination, transition, ctx);
            if (diffs.length) {
              compiledActions.push({
                kind: "animate-to-state",
                destinationName: destination.name,
                transition: transition,
                diffs: diffs
              });
            } else {
              compiledActions.push({
                kind: "dissolve",
                destinationName: destination.name,
                transition: transition
              });
              ctx.warnings.push(warning("empty-motion-diff", "No matching layer property differences found for destination '" + destination.name + "'.", action.destinationId));
            }
          }
        });

        if (compiledActions.length) {
          interactions.push({
            triggerNodeId: node.id,
            triggerNodeName: node.name,
            trigger: reaction.trigger.type,
            delay: reaction.trigger.timeout || reaction.trigger.delay || 0,
            reversible: reaction.trigger.type === "ON_HOVER" || reaction.trigger.type === "ON_PRESS",
            actions: compiledActions
          });
        }
      });
    });
    return {
      version: 1,
      generatedAt: new Date().toISOString(),
      interactions: interactions
    };
  }

  function buildSmartDiffs(sourceRoot, destinationRoot, transition, ctx) {
    var sourceMap = {};
    var destinationMap = {};
    walk(sourceRoot, function (node) {
      if (node.pathKey) sourceMap[node.pathKey] = node;
    });
    walk(destinationRoot, function (node) {
      if (node.pathKey) destinationMap[node.pathKey] = node;
    });

    var diffs = [];
    Object.keys(sourceMap).forEach(function (key) {
      if (diffs.length >= 120) return;
      var source = sourceMap[key];
      var dest = destinationMap[key];
      if (!dest) return;

      var diff = { nodeId: source.id };
      var changed = false;
      var dx = round(dest.x - source.x, 3);
      var dy = round(dest.y - source.y, 3);
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
        diff.x = dx;
        diff.y = dy;
        changed = true;
      }

      if (source.width > 0 && source.height > 0 && dest.width > 0 && dest.height > 0) {
        var scaleX = round(dest.width / source.width, 4);
        var scaleY = round(dest.height / source.height, 4);
        if (Math.abs(scaleX - 1) > 0.01 || Math.abs(scaleY - 1) > 0.01) {
          diff.scaleX = scaleX;
          diff.scaleY = scaleY;
          changed = true;
        }
      }

      var rotation = round(dest.rotation - source.rotation, 3);
      if (Math.abs(rotation) > 0.5) {
        diff.rotation = rotation;
        changed = true;
      }

      if (Math.abs(dest.opacity - source.opacity) > 0.01) {
        diff.opacity = round(dest.opacity, 3);
        changed = true;
      }

      var sourceFill = firstSolidColor(source.fills);
      var destFill = firstSolidColor(dest.fills);
      if (sourceFill && destFill && sourceFill !== destFill) {
        diff.backgroundColor = destFill;
        changed = true;
      }

      if (changed) {
        diff.duration = transition.durationMs;
        diff.ease = transition.cssEase;
        diffs.push(diff);
      }
    });

    if (diffs.length >= 120) {
      ctx.warnings.push(warning("motion-diff-limit", "Only the first 120 Smart Animate layer differences were compiled for performance.", sourceRoot.figmaId));
    }
    return diffs;
  }

  async function maybeExportNodeAsset(node, model, ctx) {
    if (ctx.assets.length >= MAX_ASSETS) return detectAssetReference(node, model, ctx);

    var imageHash = firstImageHash(node);
    if (imageHash) {
      if (ctx.assetHashMap[imageHash]) {
        return ctx.assetHashMap[imageHash];
      }
      try {
        var image = figma.getImageByHash(imageHash);
        if (!image) return null;
        var bytes = await image.getBytesAsync();
        if (bytes.length > MAX_ASSET_BYTES) {
          ctx.warnings.push(warning("large-image-skipped", "Skipped image asset over 6MB on layer '" + model.name + "'.", model.figmaId));
          return null;
        }
        var ext = detectImageExtension(bytes);
        var asset = {
          path: "assets/" + ctx.sectionType + "-" + slug(model.name, "image") + "-" + (++ctx.assetIndex) + "." + ext,
          name: model.name,
          type: "binary",
          mime: imageMime(ext),
          bytes: Array.prototype.slice.call(bytes)
        };
        ctx.assets.push(asset);
        ctx.assetHashMap[imageHash] = {
          path: asset.path,
          filename: asset.path.split("/").pop(),
          kind: "image",
          mime: asset.mime
        };
        return ctx.assetHashMap[imageHash];
      } catch (error) {
        ctx.warnings.push(warning("image-export-failed", "Could not export image asset on '" + model.name + "': " + error.message, model.figmaId));
        return null;
      }
    }

    if (VECTOR_TYPES[node.type]) {
      try {
        var svg = await node.exportAsync({ format: "SVG_STRING" });
        var svgAsset = {
          path: "assets/" + ctx.sectionType + "-" + slug(model.name, "icon") + "-" + (++ctx.assetIndex) + ".svg",
          name: model.name,
          type: "text",
          content: svg
        };
        ctx.assets.push(svgAsset);
        return {
          path: svgAsset.path,
          filename: svgAsset.path.split("/").pop(),
          kind: "svg"
        };
      } catch (error2) {
        ctx.warnings.push(warning("svg-export-failed", "Could not export vector asset on '" + model.name + "': " + error2.message, model.figmaId));
      }
    }

    return null;
  }

  function detectAssetReference(node, model, ctx) {
    var imageHash = firstImageHash(node);
    if (imageHash) {
      return {
        path: "assets/" + ctx.sectionType + "-" + slug(model.name, "image") + ".png",
        filename: ctx.sectionType + "-" + slug(model.name, "image") + ".png",
        kind: "image-placeholder"
      };
    }
    if (VECTOR_TYPES[node.type]) {
      return {
        path: "assets/" + ctx.sectionType + "-" + slug(model.name, "icon") + ".svg",
        filename: ctx.sectionType + "-" + slug(model.name, "icon") + ".svg",
        kind: "svg-placeholder"
      };
    }
    return null;
  }

  async function maybeExportRootPreview(root, ctx) {
    if (!("exportAsync" in root)) return;
    try {
      var bytes = await root.exportAsync({
        format: "PNG",
        constraint: { type: "SCALE", value: ctx.settings.assetScale }
      });
      if (bytes.length > MAX_ASSET_BYTES) {
        ctx.warnings.push(warning("preview-too-large", "Root preview PNG was over 6MB and was not included.", root.id));
        return;
      }
      ctx.assets.push({
        path: "assets/" + ctx.sectionType + "-figma-preview.png",
        name: "Figma preview",
        type: "binary",
        mime: "image/png",
        bytes: Array.prototype.slice.call(bytes)
      });
    } catch (error) {
      ctx.warnings.push(warning("preview-export-failed", "Could not export root preview: " + error.message, root.id));
    }
  }

  async function maybeExportVideoFallback(root, ctx) {
    if (!("exportAsync" in root) || !root.parent || root.parent.type !== "PAGE") return;
    try {
      var bytes = await root.exportAsync({ format: "WEBM" });
      if (bytes.length > MAX_ASSET_BYTES) {
        ctx.warnings.push(warning("video-too-large", "Animated video fallback was over 6MB and was not included.", root.id));
        return;
      }
      ctx.assets.push({
        path: "assets/" + ctx.sectionType + "-motion-fallback.webm",
        name: "Motion fallback",
        type: "binary",
        mime: "video/webm",
        bytes: Array.prototype.slice.call(bytes)
      });
    } catch (error) {
      ctx.warnings.push(warning("video-fallback-unavailable", "Video fallback was not exported. Figma only exports animated top-level frames with animated content.", root.id));
    }
  }

  function generateShopifyFiles(input) {
    var css = generateCss(input.root, input.tokens, input.classPrefix);
    var js = generateRuntimeJs();
    var liquid = generateLiquidSection(input, css, js);
    var report = generateReport(input);
    var readme = generateExportReadme(input);
    var templateJson = JSON.stringify({
      sections: {
        main: {
          type: input.sectionType
        }
      },
      order: ["main"]
    }, null, 2);

    var files = [
      {
        path: "sections/" + input.sectionType + ".liquid",
        type: "text",
        content: liquid
      },
      {
        path: "assets/" + input.sectionType + ".css",
        type: "text",
        content: css
      },
      {
        path: "assets/" + input.sectionType + ".js",
        type: "text",
        content: js
      },
      {
        path: "templates/page." + input.sectionType + ".json",
        type: "text",
        content: templateJson
      },
      {
        path: "motion-figma-prototype-to-shopify-report.json",
        type: "text",
        content: report
      },
      {
        path: "README.md",
        type: "text",
        content: readme
      }
    ];

    input.assets.forEach(function (asset) {
      files.push(asset);
    });

    return files;
  }

  function generateLiquidSection(input, css, runtimeJs) {
    var needsProduct = input.bindings.some(function (binding) { return binding.group === "product"; });
    var needsCollection = input.bindings.some(function (binding) { return binding.group === "collection"; });
    var needsMenu = input.bindings.some(function (binding) { return binding.group === "menu"; });
    var schema = generateSchema(input, needsProduct, needsCollection, needsMenu);
    var motionJson = JSON.stringify(input.motion).replace(/</g, "\\u003c");
    var liquidSetup = [];

    if (needsProduct) {
      liquidSetup.push("assign fts_product = product");
      liquidSetup.push("if section.settings.product != blank");
      liquidSetup.push("  assign fts_product = section.settings.product");
      liquidSetup.push("  if fts_product.title == blank");
      liquidSetup.push("    assign fts_product = all_products[section.settings.product]");
      liquidSetup.push("  endif");
      liquidSetup.push("endif");
    }
    if (needsCollection) {
      liquidSetup.push("assign fts_collection = collection");
      liquidSetup.push("if section.settings.collection != blank");
      liquidSetup.push("  assign fts_collection = section.settings.collection");
      liquidSetup.push("  if fts_collection.products == blank");
      liquidSetup.push("    assign fts_collection = collections[section.settings.collection]");
      liquidSetup.push("  endif");
      liquidSetup.push("endif");
    }

    var body = renderNode(input.root, {
      classPrefix: input.classPrefix,
      collectionDepth: 0,
      inProductLoop: false,
      overlays: collectOverlayDestinations(input.root, input.destinations, input.motion)
    });

    var overlayMarkup = collectOverlayDestinations(input.root, input.destinations, input.motion).map(function (overlay) {
      return renderOverlay(overlay, input.classPrefix);
    }).join("\n");

    var parts = [];
    parts.push("{% comment %}");
    parts.push("Generated by Motion: Figma Prototype to Shopify v" + PLUGIN_VERSION + ".");
    parts.push("Paste this whole file into Shopify Admin > Online Store > Themes > Edit code > sections/" + input.sectionType + ".liquid.");
    parts.push("{% endcomment %}");
    if (liquidSetup.length) {
      parts.push("{% liquid");
      liquidSetup.forEach(function (line) { parts.push("  " + line); });
      parts.push("%}");
    }
    parts.push("");
    parts.push("<section class=\"" + input.classPrefix + "\" data-motion-figma-prototype-to-shopify>");
    parts.push(body);
    if (overlayMarkup) parts.push(overlayMarkup);
    parts.push("  <script type=\"application/json\" data-fts-motion-config>" + motionJson + "</script>");
    parts.push("</section>");
    parts.push("");
    parts.push("{% stylesheet %}");
    parts.push(css);
    parts.push("{% endstylesheet %}");
    parts.push("");
    parts.push("{% javascript %}");
    parts.push(runtimeJs);
    parts.push("{% endjavascript %}");
    parts.push("");
    parts.push("{% schema %}");
    parts.push(JSON.stringify(schema, null, 2));
    parts.push("{% endschema %}");
    return parts.join("\n");
  }

  function renderNode(node, ctx) {
    if (node.binding && node.binding.key === "collection.grid") {
      return renderCollectionGrid(node, ctx);
    }

    if (node.binding && node.binding.key === "menu.main") {
      return renderMainMenu(node, ctx);
    }

    if (node.binding && node.binding.key === "product.add_to_cart") {
      return renderAddToCart(node, ctx);
    }

    if (node.binding && node.binding.key === "product.url") {
      return renderDynamicLink(node, ctx && ctx.inProductLoop ? "{{ product.url }}" : "{{ fts_product.url }}", ctx, "View product");
    }

    if (node.binding && node.binding.key === "cart.url") {
      return renderDynamicLink(node, "{{ routes.cart_url }}", ctx, "View cart");
    }

    var tag = chooseTag(node);
    var attrs = renderAttrs(node);
    var content = renderNodeContent(node, ctx);
    return indent("<" + tag + attrs + ">" + content + "</" + tag + ">", node.depth);
  }

  function renderNodeContent(node, ctx) {
    if (node.binding) {
      var dynamicValue = renderBinding(node.binding, node, ctx);
      if (dynamicValue) return dynamicValue;
    }

    if (node.asset && (node.asset.kind === "image" || node.asset.kind === "image-placeholder")) {
      return "<img src=\"{{ '" + escapeAttr(node.asset.filename) + "' | asset_url }}\" alt=\"" + escapeAttr(readableAlt(node.name)) + "\" loading=\"lazy\">";
    }

    if (node.asset && (node.asset.kind === "svg" || node.asset.kind === "svg-placeholder")) {
      return "<img src=\"{{ '" + escapeAttr(node.asset.filename) + "' | asset_url }}\" alt=\"" + escapeAttr(readableAlt(node.name)) + "\" loading=\"lazy\">";
    }

    if (node.text && node.text.characters) {
      return escapeHtml(node.text.characters);
    }

    return node.children.map(function (child) {
      return "\n" + renderNode(child, ctx);
    }).join("") + (node.children.length ? "\n" + spaces(node.depth * 2) : "");
  }

  function renderCollectionGrid(node, ctx) {
    var children = node.children.length ? node.children : [];
    var sample = children[0] || null;
    var childMarkup = sample ? renderNode(sample, Object.assign({}, ctx, { inProductLoop: true })) : defaultProductCard();
    var lines = [];
    lines.push("<div" + renderAttrs(node) + ">");
    lines.push("  {% if fts_collection != blank %}");
    lines.push("    {% for product in fts_collection.products limit: section.settings.product_limit %}");
    lines.push(childMarkup.replace(/^/gm, "      "));
    lines.push("    {% endfor %}");
    lines.push("  {% else %}");
    lines.push("    <p class=\"" + node.className + "__empty\">Choose a collection in the Shopify theme editor.</p>");
    lines.push("  {% endif %}");
    lines.push("</div>");
    return indent(lines.join("\n"), node.depth);
  }

  function defaultProductCard() {
    return [
      "<article class=\"fts-generated-product-card\">",
      "  <a href=\"{{ product.url }}\">",
      "    {% if product.featured_image %}",
      "      {{ product.featured_image | image_url: width: 900 | image_tag: loading: 'lazy' }}",
      "    {% endif %}",
      "    <h3>{{ product.title }}</h3>",
      "    <p>{{ product.price | money }}</p>",
      "  </a>",
      "</article>"
    ].join("\n");
  }

  function renderMainMenu(node, ctx) {
    var lines = [];
    lines.push("<nav" + renderAttrs(node) + ">");
    lines.push("  {% for link in section.settings.main_menu.links %}");
    lines.push("    <a href=\"{{ link.url }}\">{{ link.title }}</a>");
    lines.push("  {% endfor %}");
    lines.push("</nav>");
    return indent(lines.join("\n"), node.depth);
  }

  function renderAddToCart(node, ctx) {
    var label = node.text && node.text.characters ? escapeHtml(node.text.characters) : "Add to cart";
    var lines = [];
    lines.push("<product-form" + renderAttrs(node) + ">");
    lines.push("  {% form 'product', fts_product %}");
    lines.push("    <input type=\"hidden\" name=\"id\" value=\"{{ fts_product.selected_or_first_available_variant.id }}\">");
    lines.push("    <button type=\"submit\" {% unless fts_product.available %}disabled{% endunless %}>");
    lines.push("      " + label);
    lines.push("    </button>");
    lines.push("  {% endform %}");
    lines.push("</product-form>");
    return indent(lines.join("\n"), node.depth);
  }

  function renderDynamicLink(node, href, ctx, fallbackLabel) {
    var content = "";
    if (node.children.length) {
      content = node.children.map(function (child) {
        return "\n" + renderNode(child, ctx);
      }).join("") + "\n" + spaces(node.depth * 2);
    } else if (node.text && node.text.characters) {
      content = escapeHtml(node.text.characters);
    } else {
      content = fallbackLabel;
    }
    return indent("<a" + renderAttrs(node) + " href=\"" + href + "\">" + content + "</a>", node.depth);
  }

  function renderOverlay(node, classPrefix) {
    var cloned = Object.assign({}, node, {
      depth: 1,
      className: node.className + " fts-overlay-panel"
    });
    var markup = renderNode(cloned, { classPrefix: classPrefix });
    return [
      "  <div class=\"fts-overlay\" data-fts-overlay=\"" + node.id + "\" hidden>",
      "    <div class=\"fts-overlay__backdrop\" data-fts-overlay-close></div>",
      markup,
      "  </div>"
    ].join("\n");
  }

  function renderBinding(binding, node, ctx) {
    var productVar = ctx && ctx.inProductLoop ? "product" : "fts_product";
    switch (binding.key) {
      case "product.title":
        return "{{ " + productVar + ".title | escape }}";
      case "product.price":
        return "{{ " + productVar + ".price | money }}";
      case "product.compare_at_price":
        return "{% if " + productVar + ".compare_at_price > " + productVar + ".price %}{{ " + productVar + ".compare_at_price | money }}{% endif %}";
      case "product.description":
        return "{{ " + productVar + ".description }}";
      case "product.vendor":
        return "{{ " + productVar + ".vendor | escape }}";
      case "product.url":
        return "{{ " + productVar + ".url }}";
      case "product.image":
        return "{% if " + productVar + ".featured_image %}{{ " + productVar + ".featured_image | image_url: width: 1200 | image_tag: loading: 'lazy' }}{% endif %}";
      case "cart.count":
        return "{{ cart.item_count }}";
      case "cart.url":
        return "{{ routes.cart_url }}";
      default:
        return "";
    }
  }

  function renderAttrs(node) {
    return " class=\"fts-node " + node.className + "\" data-fts-node=\"" + node.id + "\"";
  }

  function chooseTag(node) {
    if (node.binding && node.binding.key === "product.url") return "a";
    if (node.type === "TEXT") {
      if (/heading|title|headline|h1/i.test(node.name)) return "h2";
      return "span";
    }
    if (/button|cta|add to cart|buy/i.test(node.name)) return "button";
    if (/nav|menu/i.test(node.name)) return "nav";
    if (/card|product/i.test(node.name)) return "article";
    if (node.depth === 0) return "div";
    return "div";
  }

  function generateCss(root, tokens, classPrefix) {
    var lines = [];
    lines.push("." + classPrefix + " {");
    lines.push("  --fts-text: " + (tokens.colors[0] || "#111111") + ";");
    lines.push("  --fts-bg: " + (tokens.backgrounds[0] || "transparent") + ";");
    lines.push("  box-sizing: border-box;");
    lines.push("  color: var(--fts-text);");
    lines.push("  width: 100%;");
    lines.push("  max-width: " + px(root.width || 1200) + ";");
    if (root.width && root.height) lines.push("  aspect-ratio: " + round(root.width, 2) + " / " + round(root.height, 2) + ";");
    lines.push("  margin: 0 auto;");
    lines.push("  position: relative;");
    lines.push("  overflow: hidden;");
    lines.push("}");
    lines.push("." + classPrefix + " *, ." + classPrefix + " *::before, ." + classPrefix + " *::after { box-sizing: border-box; }");
    lines.push("." + classPrefix + " img { display: block; width: 100%; height: 100%; object-fit: cover; }");
    lines.push("." + classPrefix + " a { color: inherit; text-decoration: none; }");
    lines.push("." + classPrefix + " button { font: inherit; color: inherit; cursor: pointer; border: 0; background: transparent; }");
    lines.push(".fts-overlay[hidden] { display: none; }");
    lines.push(".fts-overlay { position: fixed; inset: 0; z-index: 2147483000; display: grid; place-items: center; opacity: 0; pointer-events: none; transition: opacity 220ms ease; }");
    lines.push(".fts-overlay.is-open { opacity: 1; pointer-events: auto; }");
    lines.push(".fts-overlay__backdrop { position: absolute; inset: 0; background: rgba(0,0,0,.4); }");
    lines.push(".fts-overlay-panel { position: relative; z-index: 1; }");
    lines.push(".fts-generated-product-card { display: grid; gap: 10px; }");
    lines.push(".fts-generated-product-card img { aspect-ratio: 1 / 1; object-fit: cover; }");
    walk(root, function (node, parent) {
      lines.push.apply(lines, cssForNode(node, parent, classPrefix));
    });
    lines.push("@media (prefers-reduced-motion: reduce) {");
    lines.push("  ." + classPrefix + " *, .fts-overlay { transition-duration: 1ms !important; animation-duration: 1ms !important; scroll-behavior: auto !important; }");
    lines.push("}");
    lines.push("@media (max-width: 749px) {");
    lines.push("  ." + classPrefix + " { max-width: 100%; }");
    lines.push("}");
    return lines.join("\n");
  }

  function cssForNode(node, parent, classPrefix) {
    var selector = "." + classPrefix + " ." + node.className;
    if (node.depth === 0) selector = "." + classPrefix + "." + node.className + ", ." + classPrefix + " ." + node.className;
    var lines = [selector + " {"];
    lines.push("  box-sizing: border-box;");
    lines.push("  min-width: 0;");

    if (node.binding && node.binding.key === "collection.grid") {
      lines.push("  display: grid;");
      lines.push("  grid-template-columns: repeat(auto-fit, minmax(min(180px, 100%), 1fr));");
      lines.push("  gap: 24px;");
    } else if (node.binding && node.binding.key === "menu.main") {
      lines.push("  display: flex;");
      lines.push("  flex-wrap: wrap;");
      lines.push("  gap: 16px;");
      lines.push("  align-items: center;");
    } else if (parent && parent.binding && parent.binding.key === "collection.grid") {
      lines.push("  position: relative;");
      lines.push("  width: 100%;");
      if (node.height) lines.push("  min-height: " + px(node.height) + ";");
    } else if (node.depth === 0) {
      if (node.layout.mode) {
        lines.push.apply(lines, flexCss(node));
      }
    } else if (parent && parent.layout.mode) {
      lines.push("  position: relative;");
      if (node.width) lines.push("  width: " + px(node.width) + ";");
      if (node.height) lines.push("  min-height: " + px(node.height) + ";");
    } else {
      lines.push("  position: absolute;");
      if (parent && parent.width) lines.push("  left: " + pct(node.x, parent.width) + ";");
      else lines.push("  left: " + px(node.x) + ";");
      if (parent && parent.height) lines.push("  top: " + pct(node.y, parent.height) + ";");
      else lines.push("  top: " + px(node.y) + ";");
      if (parent && parent.width) lines.push("  width: " + pct(node.width, parent.width) + ";");
      else if (node.width) lines.push("  width: " + px(node.width) + ";");
      if (parent && parent.height) lines.push("  height: " + pct(node.height, parent.height) + ";");
      else if (node.height) lines.push("  min-height: " + px(node.height) + ";");
    }

    if (node.children.length && node.depth !== 0 && node.layout.mode) {
      lines.push.apply(lines, flexCss(node));
    } else if (node.children.length && node.depth !== 0) {
      lines.push("  position: " + (parent && parent.layout.mode ? "relative" : "absolute") + ";");
    }

    var fill = firstSolidColor(node.fills);
    if (fill) {
      if (node.type === "TEXT") lines.push("  color: " + fill + ";");
      else lines.push("  background: " + fill + ";");
    }

    if (node.opacity < 1) lines.push("  opacity: " + node.opacity + ";");
    if (node.cornerRadius) lines.push("  border-radius: " + px(node.cornerRadius) + ";");
    var border = borderCss(node);
    if (border) lines.push("  " + border);
    var shadow = shadowCss(node.effects);
    if (shadow) lines.push("  box-shadow: " + shadow + ";");
    if (node.text) {
      if (node.text.fontFamily) lines.push("  font-family: " + cssFont(node.text.fontFamily) + ";");
      if (node.text.fontSize) lines.push("  font-size: " + px(node.text.fontSize) + ";");
      if (node.text.fontWeight) lines.push("  font-weight: " + node.text.fontWeight + ";");
      if (node.text.lineHeight) lines.push("  line-height: " + node.text.lineHeight + ";");
      lines.push("  white-space: pre-wrap;");
      lines.push("  overflow-wrap: anywhere;");
    }
    if (node.asset) {
      lines.push("  overflow: hidden;");
    }
    if (hasMotionTarget(node)) {
      lines.push("  will-change: transform, opacity;");
    }
    lines.push("}");
    return lines;
  }

  function flexCss(node) {
    var lines = [];
    lines.push("  display: flex;");
    lines.push("  flex-direction: " + (node.layout.mode === "HORIZONTAL" ? "row" : "column") + ";");
    if (node.layout.gap !== null) lines.push("  gap: " + px(node.layout.gap) + ";");
    if (node.layout.padding) {
      lines.push("  padding: " + node.layout.padding.map(px).join(" ") + ";");
    }
    if (node.layout.primaryAlign) lines.push("  justify-content: " + mapPrimaryAlign(node.layout.primaryAlign) + ";");
    if (node.layout.counterAlign) lines.push("  align-items: " + mapCounterAlign(node.layout.counterAlign) + ";");
    return lines;
  }

  function generateRuntimeJs() {
    return [
      "(function () {",
      "  'use strict';",
      "  var STATE_KEY = '__ftsMotionState';",
      "  function init(root) {",
      "    if (!root || root[STATE_KEY]) return;",
      "    var configEl = root.querySelector('[data-fts-motion-config]');",
      "    var config = { interactions: [] };",
      "    if (configEl && configEl.textContent) {",
      "      try { config = JSON.parse(configEl.textContent); } catch (error) { console.warn('Figma motion config could not be parsed', error); }",
      "    }",
      "    var cleanup = [];",
      "    var originals = new Map();",
      "    function remember(el) {",
      "      if (!originals.has(el)) originals.set(el, { transform: el.style.transform || '', opacity: el.style.opacity || '', backgroundColor: el.style.backgroundColor || '' });",
      "    }",
      "    function find(id) { return root.querySelector('[data-fts-node=\"' + cssEscape(id) + '\"]'); }",
      "    function transitionFor(diff) {",
      "      var duration = Math.max(1, Number(diff.duration || 220));",
      "      var ease = diff.ease || 'ease';",
      "      return 'transform ' + duration + 'ms ' + ease + ', opacity ' + duration + 'ms ' + ease + ', background-color ' + duration + 'ms ' + ease;",
      "    }",
      "    function applyDiff(diff) {",
      "      var el = find(diff.nodeId);",
      "      if (!el) return;",
      "      remember(el);",
      "      el.style.transition = transitionFor(diff);",
      "      var transforms = [];",
      "      if (diff.x || diff.y) transforms.push('translate(' + (diff.x || 0) + 'px, ' + (diff.y || 0) + 'px)');",
      "      if (diff.scaleX || diff.scaleY) transforms.push('scale(' + (diff.scaleX || 1) + ', ' + (diff.scaleY || 1) + ')');",
      "      if (diff.rotation) transforms.push('rotate(' + diff.rotation + 'deg)');",
      "      if (transforms.length) el.style.transform = transforms.join(' ');",
      "      if (typeof diff.opacity === 'number') el.style.opacity = String(diff.opacity);",
      "      if (diff.backgroundColor) el.style.backgroundColor = diff.backgroundColor;",
      "    }",
      "    function resetDiff(diff) {",
      "      var el = find(diff.nodeId);",
      "      var original = el && originals.get(el);",
      "      if (!el || !original) return;",
      "      el.style.transition = transitionFor(diff);",
      "      el.style.transform = original.transform;",
      "      el.style.opacity = original.opacity;",
      "      el.style.backgroundColor = original.backgroundColor;",
      "    }",
      "    function openOverlay(id) {",
      "      var overlay = root.querySelector('[data-fts-overlay=\"' + cssEscape(id) + '\"]');",
      "      if (!overlay) return;",
      "      overlay.hidden = false;",
      "      requestAnimationFrame(function () { overlay.classList.add('is-open'); });",
      "    }",
      "    function closeOverlay() {",
      "      root.querySelectorAll('.fts-overlay.is-open').forEach(function (overlay) {",
      "        overlay.classList.remove('is-open');",
      "        window.setTimeout(function () { overlay.hidden = true; }, 240);",
      "      });",
      "    }",
      "    function runAction(action, reset) {",
      "      if (!action) return;",
      "      if (action.kind === 'url' && action.url && !reset) window.location.href = action.url;",
      "      if (action.kind === 'close-overlay' && !reset) closeOverlay();",
      "      if (action.kind === 'open-overlay' && !reset) openOverlay(action.overlayId);",
      "      if (action.kind === 'animate-to-state' && action.diffs) action.diffs.forEach(reset ? resetDiff : applyDiff);",
      "      if (action.kind === 'dissolve' && !reset) { root.style.transition = 'opacity 180ms ease'; root.style.opacity = '0.94'; window.setTimeout(function () { root.style.opacity = ''; }, 180); }",
      "    }",
      "    function runInteraction(interaction, reset) {",
      "      (interaction.actions || []).forEach(function (action) { runAction(action, reset); });",
      "    }",
      "    function bind(interaction) {",
      "      var el = find(interaction.triggerNodeId);",
      "      if (!el) return;",
      "      var trigger = interaction.trigger;",
      "      if (trigger === 'AFTER_TIMEOUT') {",
      "        var timeout = window.setTimeout(function () { runInteraction(interaction, false); }, Number(interaction.delay || 0));",
      "        cleanup.push(function () { window.clearTimeout(timeout); });",
      "        return;",
      "      }",
      "      if (trigger === 'ON_HOVER') {",
      "        add(el, 'mouseenter', function () { runInteraction(interaction, false); });",
      "        add(el, 'mouseleave', function () { runInteraction(interaction, true); });",
      "        return;",
      "      }",
      "      if (trigger === 'ON_PRESS') {",
      "        add(el, 'mousedown', function () { runInteraction(interaction, false); });",
      "        add(el, 'mouseup', function () { runInteraction(interaction, true); });",
      "        add(el, 'mouseleave', function () { runInteraction(interaction, true); });",
      "        return;",
      "      }",
      "      var eventName = trigger === 'MOUSE_ENTER' ? 'mouseenter' : trigger === 'MOUSE_LEAVE' ? 'mouseleave' : trigger === 'MOUSE_DOWN' ? 'mousedown' : trigger === 'MOUSE_UP' ? 'mouseup' : 'click';",
      "      add(el, eventName, function (event) { event.preventDefault(); runInteraction(interaction, false); });",
      "    }",
      "    function add(el, eventName, handler) {",
      "      el.addEventListener(eventName, handler);",
      "      cleanup.push(function () { el.removeEventListener(eventName, handler); });",
      "    }",
      "    root.querySelectorAll('[data-fts-overlay-close]').forEach(function (el) { add(el, 'click', closeOverlay); });",
      "    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {",
      "      config.interactions = (config.interactions || []).filter(function (interaction) { return interaction.trigger === 'ON_CLICK'; });",
      "    }",
      "    (config.interactions || []).forEach(bind);",
      "    root[STATE_KEY] = { destroy: function () { cleanup.forEach(function (fn) { fn(); }); root[STATE_KEY] = null; } };",
      "  }",
      "  function cssEscape(value) {",
      "    if (window.CSS && CSS.escape) return CSS.escape(value);",
      "    return String(value).replace(/[^a-zA-Z0-9_-]/g, '\\\\$&');",
      "  }",
      "  function initAll(container) { (container || document).querySelectorAll('[data-motion-figma-prototype-to-shopify]').forEach(init); }",
      "  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { initAll(document); });",
      "  else initAll(document);",
      "  document.addEventListener('shopify:section:load', function (event) { initAll(event.target); });",
      "  document.addEventListener('shopify:section:unload', function (event) {",
      "    event.target.querySelectorAll('[data-motion-figma-prototype-to-shopify]').forEach(function (root) { if (root[STATE_KEY]) root[STATE_KEY].destroy(); });",
      "  });",
      "}());"
    ].join("\n");
  }

  function generateSchema(input, needsProduct, needsCollection, needsMenu) {
    var settings = [];
    if (needsProduct) {
      settings.push({
        type: "product",
        id: "product",
        label: "Product fallback"
      });
    }
    if (needsCollection) {
      settings.push({
        type: "collection",
        id: "collection",
        label: "Collection fallback"
      });
      settings.push({
        type: "range",
        id: "product_limit",
        min: 2,
        max: 24,
        step: 1,
        default: 8,
        label: "Products to show"
      });
    }
    if (needsMenu) {
      settings.push({
        type: "link_list",
        id: "main_menu",
        label: "Main menu",
        default: "main-menu"
      });
    }
    return {
      name: input.settings.sectionName,
      tag: "section",
      class: "motion-figma-prototype-to-shopify-wrapper",
      settings: settings,
      presets: [
        {
          name: input.settings.sectionName
        }
      ]
    };
  }

  function generateReport(input) {
    return JSON.stringify({
      generatedBy: "Motion: Figma Prototype to Shopify",
      version: PLUGIN_VERSION,
      generatedAt: new Date().toISOString(),
      root: {
        name: input.root.name,
        type: input.root.type,
        width: input.root.width,
        height: input.root.height
      },
      files: [
        "sections/" + input.sectionType + ".liquid",
        "assets/" + input.sectionType + ".css",
        "assets/" + input.sectionType + ".js",
        "templates/page." + input.sectionType + ".json"
      ],
      assets: input.assets.map(function (asset) {
        return { path: asset.path, type: asset.type, mime: asset.mime || null };
      }),
      liquidBindings: input.bindings,
      prototypeReactions: collectPrototypeReactions(input.root),
      motion: input.motion,
      warnings: input.warnings,
      manualChecklist: [
        "Paste sections/" + input.sectionType + ".liquid into your Shopify theme sections folder or Shopify code editor.",
        "Upload files from assets/ to the Shopify theme assets folder if the generated Liquid references them.",
        "Create a page template from templates/page." + input.sectionType + ".json or add the section from the theme editor.",
        "Choose product, collection, and menu settings in the theme editor when the section uses dynamic bindings.",
        "Preview desktop and mobile, then verify click, hover, delay, and overlay interactions."
      ]
    }, null, 2);
  }

  function collectPrototypeReactions(root) {
    var reactions = [];
    walk(root, function (node) {
      if (!node.reactions || !node.reactions.length) return;
      reactions.push({
        nodeId: node.figmaId,
        nodeName: node.name,
        path: node.path,
        reactions: node.reactions
      });
    });
    return reactions;
  }

  function generateExportReadme(input) {
    return [
      "# Motion: Figma Prototype to Shopify Export",
      "",
      "Generated by Motion: Figma Prototype to Shopify v" + PLUGIN_VERSION + ".",
      "",
      "## Fastest Shopify setup",
      "",
      "1. Open Shopify Admin.",
      "2. Go to Online Store > Themes > ... > Edit code.",
      "3. Open the `sections` folder and click `Add a new section`.",
      "4. Name it `" + input.sectionType + "`.",
      "5. Paste the full contents of `sections/" + input.sectionType + ".liquid`.",
      "6. Upload every file in `assets/` to the theme `assets` folder if the Liquid references it.",
      "7. Add the section in the Shopify theme editor.",
      "8. Pick product, collection, and menu settings if prompted.",
      "",
      "## One-file copy/paste mode",
      "",
      "The generated Liquid file already includes CSS in `{% stylesheet %}` and JavaScript in `{% javascript %}`. This means the section can be pasted as one file for a quick preview. Image assets still need to exist in the theme assets folder when referenced.",
      "",
      "## Supported Figma prototype behavior in this export",
      "",
      "- Click/tap, hover, press, mouse enter/leave, mouse down/up, and after-delay triggers.",
      "- Navigate, swap, overlay, change-to, URL, back, and close actions.",
      "- Dissolve, directional movement, and Smart Animate-style diffs for position, scale, rotation, opacity, and solid fill color.",
      "",
      "## Warnings",
      "",
      input.warnings.length ? input.warnings.map(function (item) { return "- " + item.message; }).join("\n") : "- No conversion warnings."
    ].join("\n");
  }

  function collectOverlayDestinations(root, destinations, motion) {
    var overlays = {};
    motion.interactions.forEach(function (interaction) {
      interaction.actions.forEach(function (action) {
        if (action.kind === "open-overlay" && action.overlayId) {
          Object.keys(destinations).forEach(function (key) {
            if (destinations[key].id === action.overlayId) overlays[action.overlayId] = destinations[key];
          });
        }
      });
    });
    return Object.keys(overlays).map(function (key) { return overlays[key]; });
  }

  function collectBindings(root) {
    var bindings = [];
    walk(root, function (node) {
      if (node.binding) {
        bindings.push({
          nodeId: node.figmaId,
          nodeName: node.name,
          key: node.binding.key,
          group: node.binding.group,
          confidence: node.binding.confidence
        });
      }
    });
    return bindings;
  }

  function collectTokens(root) {
    var colorSet = {};
    var bgSet = {};
    var fontSet = {};
    var radiusSet = {};
    walk(root, function (node) {
      node.fills.forEach(function (paint) {
        if (paint.type === "SOLID" && paint.hex) {
          if (node.type === "TEXT") colorSet[paint.hex] = true;
          else bgSet[paint.hex] = true;
        }
      });
      if (node.text && node.text.fontFamily) fontSet[node.text.fontFamily] = true;
      if (node.cornerRadius) radiusSet[String(node.cornerRadius)] = true;
    });
    return {
      colors: Object.keys(colorSet),
      backgrounds: Object.keys(bgSet),
      fonts: Object.keys(fontSet),
      radii: Object.keys(radiusSet).map(Number)
    };
  }

  function readLayout(node) {
    var mode = "layoutMode" in node && node.layoutMode !== "NONE" ? node.layoutMode : null;
    var padding = null;
    if (mode) {
      padding = [
        numberOrZero(node.paddingTop),
        numberOrZero(node.paddingRight),
        numberOrZero(node.paddingBottom),
        numberOrZero(node.paddingLeft)
      ];
    }
    return {
      mode: mode,
      gap: "itemSpacing" in node && typeof node.itemSpacing === "number" ? node.itemSpacing : null,
      padding: padding,
      primaryAlign: "primaryAxisAlignItems" in node ? node.primaryAxisAlignItems : null,
      counterAlign: "counterAxisAlignItems" in node ? node.counterAxisAlignItems : null
    };
  }

  function readText(node) {
    if (node.type !== "TEXT") return null;
    return {
      characters: node.characters || "",
      fontFamily: fontFamily(node.fontName),
      fontSize: typeof node.fontSize === "number" ? node.fontSize : null,
      fontWeight: typeof node.fontWeight === "number" ? node.fontWeight : null,
      lineHeight: lineHeightCss(node.lineHeight)
    };
  }

  function readPaints(node, property) {
    if (!(property in node) || !node[property] || node[property] === figma.mixed) return [];
    return Array.prototype.slice.call(node[property]).map(function (paint) {
      var result = cloneSimple(paint);
      if (paint.type === "SOLID" && paint.color) {
        result.hex = rgbaToCss(paint.color, typeof paint.opacity === "number" ? paint.opacity : 1);
      }
      return result;
    });
  }

  function readEffects(node) {
    if (!("effects" in node) || !node.effects || node.effects === figma.mixed) return [];
    return Array.prototype.slice.call(node.effects).map(cloneSimple);
  }

  function readCornerRadius(node) {
    if (!("cornerRadius" in node)) return null;
    if (typeof node.cornerRadius === "number") return node.cornerRadius;
    return null;
  }

  function getRelativeBounds(node, parentModel, root) {
    var abs = "absoluteBoundingBox" in node && node.absoluteBoundingBox ? node.absoluteBoundingBox : null;
    var rootAbs = "absoluteBoundingBox" in root && root.absoluteBoundingBox ? root.absoluteBoundingBox : null;
    if (!abs) {
      return {
        x: 0,
        y: 0,
        width: "width" in node ? numberOrZero(node.width) : 0,
        height: "height" in node ? numberOrZero(node.height) : 0
      };
    }
    var baseX = parentModel ? parentModel.absoluteX : rootAbs ? rootAbs.x : abs.x;
    var baseY = parentModel ? parentModel.absoluteY : rootAbs ? rootAbs.y : abs.y;
    var result = {
      x: round(abs.x - baseX, 2),
      y: round(abs.y - baseY, 2),
      width: round(abs.width, 2),
      height: round(abs.height, 2),
      absoluteX: abs.x,
      absoluteY: abs.y
    };
    return result;
  }

  function normalizeTransition(transition) {
    if (!transition) {
      return {
        type: "INSTANT",
        durationMs: 220,
        cssEase: "ease"
      };
    }
    var duration = typeof transition.duration === "number" ? transition.duration : 0.22;
    var durationMs = duration <= 10 ? Math.round(duration * 1000) : Math.round(duration);
    return {
      type: transition.type || "DISSOLVE",
      direction: transition.direction || null,
      matchLayers: Boolean(transition.matchLayers),
      durationMs: Math.max(1, Math.min(durationMs, 10000)),
      cssEase: easingToCss(transition.easing)
    };
  }

  function easingToCss(easing) {
    if (!easing || !easing.type) return "ease";
    if (easing.type === "LINEAR") return "linear";
    if (easing.type === "EASE_IN") return "ease-in";
    if (easing.type === "EASE_OUT") return "ease-out";
    if (easing.type === "EASE_IN_AND_OUT") return "ease-in-out";
    if (easing.type === "CUSTOM_CUBIC_BEZIER" && easing.easingFunctionCubicBezier) {
      var c = easing.easingFunctionCubicBezier;
      return "cubic-bezier(" + c.x1 + ", " + c.y1 + ", " + c.x2 + ", " + c.y2 + ")";
    }
    return "cubic-bezier(.2, .8, .2, 1)";
  }

  function detectBinding(name) {
    var value = String(name || "").toLowerCase().replace(/[\s_]+/g, ".").replace(/[()[\]{}]/g, "");
    var keys = [
      ["product.add_to_cart", "product"],
      ["product.add.to.cart", "product"],
      ["product.compare_at_price", "product"],
      ["product.compare.at.price", "product"],
      ["product.title", "product"],
      ["product.price", "product"],
      ["product.description", "product"],
      ["product.vendor", "product"],
      ["product.image", "product"],
      ["product.url", "product"],
      ["collection.grid", "collection"],
      ["collection.products", "collection"],
      ["menu.main", "menu"],
      ["navigation.main", "menu"],
      ["cart.count", "cart"],
      ["cart.url", "cart"]
    ];
    for (var i = 0; i < keys.length; i += 1) {
      if (value.indexOf(keys[i][0]) !== -1) {
        var canonical = keys[i][0] === "collection.products" ? "collection.grid" : keys[i][0] === "navigation.main" ? "menu.main" : keys[i][0] === "product.add.to.cart" ? "product.add_to_cart" : keys[i][0] === "product.compare.at.price" ? "product.compare_at_price" : keys[i][0];
        return {
          key: canonical,
          group: keys[i][1],
          confidence: "name-convention"
        };
      }
    }
    return null;
  }

  function firstImageHash(node) {
    if (!("fills" in node) || !node.fills || node.fills === figma.mixed) return null;
    for (var i = 0; i < node.fills.length; i += 1) {
      var paint = node.fills[i];
      if (paint.type === "IMAGE" && paint.imageHash) return paint.imageHash;
    }
    return null;
  }

  function detectImageExtension(bytes) {
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "png";
    if (bytes[0] === 0xff && bytes[1] === 0xd8) return "jpg";
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return "gif";
    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) return "webp";
    return "png";
  }

  function imageMime(ext) {
    if (ext === "jpg") return "image/jpeg";
    if (ext === "gif") return "image/gif";
    if (ext === "webp") return "image/webp";
    return "image/png";
  }

  function firstSolidColor(paints) {
    if (!paints || !paints.length) return null;
    for (var i = 0; i < paints.length; i += 1) {
      if (paints[i].type === "SOLID" && paints[i].visible !== false && paints[i].hex) return paints[i].hex;
    }
    return null;
  }

  function borderCss(node) {
    var stroke = firstSolidColor(node.strokes);
    if (!stroke) return "";
    return "border: 1px solid " + stroke + ";";
  }

  function shadowCss(effects) {
    if (!effects || !effects.length) return "";
    var shadows = [];
    effects.forEach(function (effect) {
      if (effect.visible === false) return;
      if (effect.type !== "DROP_SHADOW" && effect.type !== "INNER_SHADOW") return;
      var offset = effect.offset || { x: 0, y: 0 };
      var color = rgbaToCss(effect.color || { r: 0, g: 0, b: 0 }, effect.color && typeof effect.color.a === "number" ? effect.color.a : 0.2);
      shadows.push((effect.type === "INNER_SHADOW" ? "inset " : "") + px(offset.x) + " " + px(offset.y) + " " + px(effect.radius || 0) + " " + color);
    });
    return shadows.join(", ");
  }

  function hasMotionTarget(node) {
    return node.reactions && node.reactions.length;
  }

  function mapPrimaryAlign(value) {
    if (value === "CENTER") return "center";
    if (value === "MAX") return "flex-end";
    if (value === "SPACE_BETWEEN") return "space-between";
    return "flex-start";
  }

  function mapCounterAlign(value) {
    if (value === "CENTER") return "center";
    if (value === "MAX") return "flex-end";
    if (value === "BASELINE") return "baseline";
    return "flex-start";
  }

  function walk(node, visitor, parent) {
    visitor(node, parent || null);
    if (!node.children) return;
    node.children.forEach(function (child) {
      walk(child, visitor, node);
    });
  }

  function countNodes(root) {
    var count = 0;
    walk(root, function () { count += 1; });
    return count;
  }

  function cloneSimple(value) {
    if (value == null) return value;
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (error) {
      return null;
    }
  }

  function warning(code, message, nodeId) {
    return {
      code: code,
      message: message,
      nodeId: nodeId || null
    };
  }

  function fontFamily(fontName) {
    if (!fontName || fontName === figma.mixed) return "";
    if (typeof fontName.family === "string") return fontName.family;
    return "";
  }

  function lineHeightCss(lineHeight) {
    if (!lineHeight || lineHeight === figma.mixed) return "";
    if (lineHeight.unit === "PIXELS") return px(lineHeight.value);
    if (lineHeight.unit === "PERCENT") return String(round(lineHeight.value / 100, 3));
    return "";
  }

  function rgbaToCss(color, opacity) {
    var r = Math.round((color.r || 0) * 255);
    var g = Math.round((color.g || 0) * 255);
    var b = Math.round((color.b || 0) * 255);
    var a = typeof opacity === "number" ? opacity : typeof color.a === "number" ? color.a : 1;
    if (a < 1) return "rgba(" + r + ", " + g + ", " + b + ", " + round(a, 3) + ")";
    return "#" + hex2(r) + hex2(g) + hex2(b);
  }

  function hex2(value) {
    var out = Math.max(0, Math.min(255, value)).toString(16);
    return out.length === 1 ? "0" + out : out;
  }

  function cleanNodeId(id) {
    return String(id || "node").replace(/[^a-zA-Z0-9_-]/g, "_");
  }

  function slug(value, fallback) {
    var out = String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return out || fallback;
  }

  function normalizePathPart(value) {
    return slug(value || "layer", "layer");
  }

  function safeName(value) {
    return String(value || "Untitled").trim() || "Untitled";
  }

  function readableAlt(value) {
    return safeName(value).replace(/[._-]+/g, " ");
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/"/g, "&quot;");
  }

  function cssFont(value) {
    if (!value) return "inherit";
    return "'" + String(value).replace(/'/g, "\\'") + "', sans-serif";
  }

  function px(value) {
    return round(numberOrZero(value), 3) + "px";
  }

  function pct(value, total) {
    if (!total) return "0%";
    return round((numberOrZero(value) / total) * 100, 4) + "%";
  }

  function round(value, digits) {
    var factor = Math.pow(10, digits || 0);
    return Math.round(numberOrZero(value) * factor) / factor;
  }

  function numberOrZero(value) {
    return typeof value === "number" && isFinite(value) ? value : 0;
  }

  function spaces(count) {
    return new Array(count + 1).join(" ");
  }

  function indent(value, depth) {
    var pad = spaces((depth || 0) * 2);
    return String(value).split("\n").map(function (line) {
      return pad + line;
    }).join("\n");
  }
}());
