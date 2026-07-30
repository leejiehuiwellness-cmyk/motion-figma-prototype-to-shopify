(function () {
  "use strict";

  var PLUGIN_VERSION = "0.1.0";
  var MAX_ASSETS = 60;
  var MAX_ASSET_BYTES = 6 * 1024 * 1024;
  var SUPPORTED_ROOT_TYPES = {
    FRAME: true,
    COMPONENT: true,
    COMPONENT_SET: true,
    INSTANCE: true,
    SECTION: true,
    GROUP: true
  };
  var COMPONENT_ROOT_TYPES = {
    COMPONENT: true,
    COMPONENT_SET: true,
    INSTANCE: true
  };
  var SUPPORTED_TRIGGERS = {
    ON_CLICK: true,
    ON_HOVER: true,
    ON_PRESS: true,
    ON_DRAG: true,
    DRAG: true,
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
    if (message.type === "capture-responsive-frame") {
      captureResponsiveFrame(message.role);
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
      post("busy", { label: "Scanning selected Figma layer..." });
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

  function captureResponsiveFrame(role) {
    try {
      var selection = figma.currentPage.selection;
      if (!selection || selection.length !== 1) {
        throw new Error("Select exactly one frame, component, component set, instance, group, section, or child layer first.");
      }
      var selectedNode = selection[0];
      var root = resolveExportRoot(selectedNode);
      if (!root) {
        throw new Error("The selected node cannot be used as a responsive frame.");
      }
      var info = buildSelectionInfo(selectedNode, root);
      post("responsive-frame-captured", {
        role: role === "mobile" ? "mobile" : "desktop",
        frame: {
          id: info.exportRoot.id,
          figmaId: info.exportRoot.figmaId,
          name: info.exportRoot.name,
          type: info.exportRoot.type,
          selectedName: info.selected.name,
          selectedType: info.selected.type,
          usedAncestorRoot: info.usedAncestorRoot
        }
      });
      figma.notify((role === "mobile" ? "Mobile" : "Desktop") + " frame captured: " + info.exportRoot.name);
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
    var warnings = [];
    var exportRequests = await resolveExportRequests(settings, selection);

    var shared = {
      assets: [],
      assetManifest: [],
      assetHashMap: {},
      assetKeyMap: {}
    };
    var classPrefix = "fts-" + slug(settings.filePrefix || exportRequests[0].root.name || "section", "section");
    var sectionType = slug(settings.filePrefix || "motion-figma-prototype-to-shopify", "motion-figma-prototype-to-shopify");
    var viewports = [];

    for (var requestIndex = 0; requestIndex < exportRequests.length; requestIndex += 1) {
      viewports.push(await buildViewportExport(exportRequests[requestIndex], {
        includeAssets: includeAssets,
        settings: settings,
        warnings: warnings,
        shared: shared,
        classPrefix: classPrefix,
        sectionType: sectionType
      }));
    }

    var primaryViewport = viewports.find(function (item) { return item.key === "desktop"; }) || viewports[0];
    var states = flatten(viewports.map(function (viewport) { return viewport.states; }));
    var destinations = mergeDestinationModels(viewports);
    var tokens = collectTokens(states);
    var bindings = collectBindings(states);
    var motion = {
      version: 1,
      generatedAt: new Date().toISOString(),
      interactions: flatten(viewports.map(function (viewport) { return viewport.motion.interactions; }))
    };
    var selectionInfo = primaryViewport.selection;
    var rootModel = primaryViewport.root;
    var stage = primaryViewport.stage;

    var files = generateShopifyFiles({
      settings: settings,
      root: rootModel,
      selection: selectionInfo,
      responsive: viewports.map(function (viewport) { return viewportSummary(viewport); }),
      viewports: viewports,
      states: states,
      stage: stage,
      destinations: destinations,
      tokens: tokens,
      bindings: bindings,
      motion: motion,
      warnings: warnings,
      assets: shared.assets,
      assetManifest: shared.assetManifest,
      classPrefix: classPrefix,
      sectionType: sectionType
    });

    var summary = {
      status: warnings.length ? "ready-with-warnings" : "ready",
      pluginVersion: PLUGIN_VERSION,
      selection: selectionInfo,
      responsive: viewports.map(function (viewport) { return viewportSummary(viewport); }),
      root: {
        name: rootModel.name,
        type: rootModel.type,
        width: rootModel.width,
        height: rootModel.height
      },
      codeMode: settings.codeMode,
      stage: stage,
      counts: {
        nodes: countNodes(states),
        states: states.length,
        viewports: viewports.length,
        assets: shared.assets.length,
        bindings: bindings.length,
        interactions: motion.interactions.length,
        warnings: warnings.length
      },
      warnings: warnings,
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
        selectedName: selectionInfo.selected.name,
        selectedType: selectionInfo.selected.type,
        stateCount: states.length,
        tokens: tokens,
        viewportCount: viewports.length,
        destinationCount: Object.keys(destinations).length
      }
    };
  }

  async function buildViewportExport(request, base) {
    var ctx = {
      includeAssets: base.includeAssets,
      settings: base.settings,
      warnings: base.warnings,
      assets: base.shared.assets,
      assetManifest: base.shared.assetManifest,
      assetIndex: 0,
      assetHashMap: base.shared.assetHashMap,
      assetKeyMap: base.shared.assetKeyMap,
      destinationIds: {},
      classPrefix: base.classPrefix,
      sectionType: base.sectionType,
      rootId: cleanNodeId(request.root.id),
      viewport: request.viewport,
      assetFilePrefix: assetFilePrefix(base.settings, request.viewport)
    };

    var rootModel = await serializeNode(request.root, null, request.root, ctx, 0, [request.root.name || "Root"]);
    if (!rootModel) {
      throw new Error("The " + request.viewport + " frame is hidden or could not be serialized.");
    }

    var destinationModels = await collectDestinationModels(ctx, request.root);
    var states = createStateModels(rootModel, destinationModels, ctx);
    var startState = chooseStartState(states, ctx);
    var motion = buildMotionGraph(states, destinationModels, ctx);
    var stage = {
      width: startState && startState.width ? startState.width : rootModel.width,
      height: startState && startState.height ? startState.height : rootModel.height,
      startStateId: startState ? startState.id : rootModel.id,
      startStateFigmaId: startState ? startState.figmaId : rootModel.figmaId,
      startStateName: startState ? startState.name : rootModel.name
    };

    if (base.includeAssets) {
      await maybeExportRootPreview(request.root, ctx);
      if (base.settings.includeVideoFallback) {
        await maybeExportVideoFallback(request.root, ctx);
      }
    }

    return {
      key: request.viewport,
      label: request.viewport === "mobile" ? "Mobile" : "Desktop",
      root: rootModel,
      selection: request.selection,
      states: states,
      stage: stage,
      destinations: destinationModels,
      motion: motion
    };
  }

  async function resolveExportRequests(settings, selection) {
    var requests = [];
    if (settings.desktopFrameId) {
      requests.push(await resolveExportRequestById(settings.desktopFrameId, "desktop"));
    }
    if (settings.mobileFrameId && settings.mobileFrameId !== settings.desktopFrameId) {
      requests.push(await resolveExportRequestById(settings.mobileFrameId, "mobile"));
    }
    if (requests.length) return requests;

    if (!selection || selection.length === 0) {
      throw new Error("Select one desktop frame/component/section, or capture Desktop and Mobile frames before running the plugin.");
    }

    if (selection.length > 1) {
      throw new Error("Select exactly one starting layer, or use the Desktop/Mobile frame capture buttons.");
    }

    return [resolveExportRequestFromNode(selection[0], "desktop")];
  }

  async function resolveExportRequestById(figmaId, viewport) {
    var node = await figma.getNodeByIdAsync(figmaId);
    if (!node) {
      throw new Error("The saved " + viewport + " frame could not be found. Re-capture it from the current Figma file.");
    }
    return resolveExportRequestFromNode(node, viewport);
  }

  function resolveExportRequestFromNode(selectedNode, viewport) {
    var root = resolveExportRoot(selectedNode);
    if (!root) {
      throw new Error("The selected " + viewport + " node type '" + selectedNode.type + "' is not exportable and no supported ancestor was found.");
    }
    return {
      viewport: viewport,
      selected: selectedNode,
      root: root,
      selection: buildSelectionInfo(selectedNode, root)
    };
  }

  function mergeDestinationModels(viewports) {
    var merged = {};
    viewports.forEach(function (viewport) {
      Object.keys(viewport.destinations || {}).forEach(function (key) {
        merged[viewport.key + ":" + key] = viewport.destinations[key];
      });
    });
    return merged;
  }

  function viewportSummary(viewport) {
    return {
      key: viewport.key,
      label: viewport.label,
      root: {
        name: viewport.root.name,
        type: viewport.root.type,
        figmaId: viewport.root.figmaId,
        width: viewport.root.width,
        height: viewport.root.height
      },
      stage: viewport.stage,
      states: viewport.states.length,
      interactions: viewport.motion.interactions.length
    };
  }

  function flatten(groups) {
    var out = [];
    groups.forEach(function (group) {
      (group || []).forEach(function (item) { out.push(item); });
    });
    return out;
  }

  function resolveExportRoot(node) {
    if (!node || !node.type) return null;
    if (node.type === "COMPONENT" && node.parent && node.parent.type === "COMPONENT_SET") return node.parent;
    if (COMPONENT_ROOT_TYPES[node.type]) return node;

    var componentRoot = findAncestorOfType(node, COMPONENT_ROOT_TYPES);
    if (componentRoot && componentRoot.type === "COMPONENT" && componentRoot.parent && componentRoot.parent.type === "COMPONENT_SET") {
      return componentRoot.parent;
    }
    if (componentRoot) return componentRoot;

    if (SUPPORTED_ROOT_TYPES[node.type]) return node;
    return findAncestorOfType(node, SUPPORTED_ROOT_TYPES);
  }

  function findAncestorOfType(node, typeMap) {
    var current = node && node.parent ? node.parent : null;
    while (current && current.type && current.type !== "PAGE" && current.type !== "DOCUMENT") {
      if (typeMap[current.type]) return current;
      current = current.parent || null;
    }
    return null;
  }

  function buildSelectionInfo(selectedNode, root) {
    return {
      selected: {
        id: cleanNodeId(selectedNode.id),
        figmaId: selectedNode.id,
        name: safeName(selectedNode.name),
        type: selectedNode.type
      },
      exportRoot: {
        id: cleanNodeId(root.id),
        figmaId: root.id,
        name: safeName(root.name),
        type: root.type
      },
      usedAncestorRoot: selectedNode.id !== root.id
    };
  }

  function normalizeSettings(raw) {
    var defaultSectionName = "Motion: Figma Prototype to Shopify";
    var rawSectionName = String(raw.sectionName || "").trim();
    var rawFilePrefix = String(raw.filePrefix || "").trim();
    var languageLabel = String(raw.languageLabel || "en").toLowerCase();
    if (!/^(en|cn|my)$/.test(languageLabel)) languageLabel = "en";
    var filePrefix = slug(rawFilePrefix || rawSectionName || "motion-figma-prototype-to-shopify", "motion-figma-prototype-to-shopify");
    var sectionName = rawSectionName || defaultSectionName;
    if ((!rawSectionName || rawSectionName === defaultSectionName) && rawFilePrefix) {
      sectionName = rawFilePrefix;
    }
    var assetScale = Number(raw.assetScale || 1);
    if (!assetScale || assetScale < 0.5) assetScale = 1;
    if (assetScale > 4) assetScale = 4;
    return {
      sectionName: sectionName || defaultSectionName,
      filePrefix: filePrefix,
      rawFilePrefix: rawFilePrefix,
      languageLabel: languageLabel,
      desktopFrameId: String(raw.desktopFrameId || "").trim(),
      mobileFrameId: String(raw.mobileFrameId || "").trim(),
      assetScale: assetScale,
      codeMode: raw.codeMode === "external" ? "external" : "inline",
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
      variantProperties: cloneSimple(node.variantProperties || null),
      flowStartingPoints: cloneSimple(node.flowStartingPoints || []),
      isMask: Boolean(node.isMask),
      clipsContent: Boolean(node.clipsContent),
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
    var visited = {};
    var queue = Object.keys(ctx.destinationIds);
    var safety = 0;
    for (var i = 0; i < queue.length && safety < 80; i += 1, safety += 1) {
      var id = queue[i];
      if (visited[id]) continue;
      visited[id] = true;
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
          assetManifest: ctx.assetManifest,
          assetHashMap: ctx.assetHashMap,
          assetKeyMap: ctx.assetKeyMap,
          destinationIds: ctx.destinationIds
        });
        var model = await serializeNode(node, null, node, childCtx, 0, [node.name || "Destination"]);
        if (model) result[id] = model;
        Object.keys(ctx.destinationIds).forEach(function (destinationId) {
          if (!visited[destinationId] && queue.indexOf(destinationId) === -1) queue.push(destinationId);
        });
      } catch (error) {
        ctx.warnings.push(warning("destination-read-failed", "Could not read prototype destination " + id + ": " + error.message, id));
      }
    }
    if (safety >= 80) {
      ctx.warnings.push(warning("destination-chain-limit", "Prototype destination traversal stopped after 80 nodes to avoid an infinite loop.", root.id));
    }
    return result;
  }

  function createStateModels(rootModel, destinationModels, ctx) {
    var states = [];
    var seen = {};

    if (rootModel.type === "COMPONENT_SET") {
      rootModel.children.forEach(function (child) {
        if (child.type === "COMPONENT") addState(normalizeStateRoot(child));
      });
      if (!states.length) {
        ctx.warnings.push(warning("empty-component-set", "Selected Component Set did not contain direct component variants.", rootModel.figmaId));
      }
    } else {
      addState(normalizeStateRoot(rootModel));
    }

    Object.keys(destinationModels).forEach(function (key) {
      var destination = destinationModels[key];
      if (!destination) return;
      if (destination.type === "COMPONENT_SET") {
        destination.children.forEach(function (child) {
          if (child.type === "COMPONENT") addState(normalizeStateRoot(child));
        });
      } else if (SUPPORTED_ROOT_TYPES[destination.type]) {
        addState(normalizeStateRoot(destination));
      }
    });

    if (!states.length) addState(normalizeStateRoot(rootModel));
    return states;

    function addState(model) {
      if (!model || seen[model.figmaId]) return;
      seen[model.figmaId] = true;
      states.push(model);
    }
  }

  function normalizeStateRoot(model) {
    var offset = model.depth || 0;
    normalizeDepth(model, offset);
    model.x = 0;
    model.y = 0;
    return model;
  }

  function normalizeDepth(node, offset) {
    node.depth = Math.max(0, (node.depth || 0) - offset);
    if (!node.children) return;
    node.children.forEach(function (child) {
      normalizeDepth(child, offset);
    });
  }

  function chooseStartState(states, ctx) {
    if (!states.length) return null;
    var byFlow = states.find(function (state) {
      return state.flowStartingPoints && state.flowStartingPoints.length;
    });
    if (byFlow) return byFlow;

    var byDefault = states.find(function (state) {
      return /(^|[=,\s])default($|[,\s])/i.test(state.name || "");
    });
    var candidate = byDefault || states[0];
    if (candidate && candidate.opacity === 0) {
      var visible = states.find(function (state) { return state.opacity !== 0; });
      if (visible) {
        ctx.warnings.push(warning("invisible-start-state", "The preferred starting state '" + candidate.name + "' has opacity 0, so Motion activated visible state '" + visible.name + "' to avoid a blank Shopify section.", candidate.figmaId));
        return visible;
      }
    }
    return candidate;
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

  function buildMotionGraph(states, destinations, ctx) {
    var interactions = [];
    var stateByFigmaId = {};
    states.forEach(function (state) {
      stateByFigmaId[state.figmaId] = state;
    });

    states.forEach(function (stateRoot) {
      walk(stateRoot, function (node) {
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

            var destination = action.destinationId ? findDestinationModel(action.destinationId, stateByFigmaId, destinations) : null;
            var transition = normalizeTransition(action.transition);
            if (action.navigation === "OVERLAY" && destination) {
              compiledActions.push({
                kind: "open-overlay",
                overlayId: destination.id,
                destinationNodeId: destination.figmaId,
                transition: transition
              });
              return;
            }

            if (destination && SUPPORTED_NODE_ACTIONS[action.navigation]) {
              var diffs = buildSmartDiffs(stateRoot, destination, transition, ctx);
              compiledActions.push({
                kind: "change-variant",
                sourceNodeId: stateRoot.figmaId,
                sourceStateId: stateRoot.id,
                destinationNodeId: destination.figmaId,
                destinationStateId: destination.id,
                destinationName: destination.name,
                transition: transition,
                diffs: diffs,
                fallback: diffs.length ? "smart-animate" : "crossfade"
              });
              if (!diffs.length) {
                ctx.warnings.push(warning("smart-animate-crossfade-fallback", "No safe Smart Animate layer matches found from '" + stateRoot.name + "' to '" + destination.name + "'. Runtime will crossfade and keep the destination visible.", action.destinationId));
              }
            }
          });

          if (compiledActions.length) {
            interactions.push({
              triggerNodeId: node.id,
              triggerFigmaNodeId: node.figmaId,
              triggerNodeName: node.name,
              sourceNodeId: stateRoot.figmaId,
              sourceStateId: stateRoot.id,
              trigger: reaction.trigger.type,
              delayMs: triggerDelayMs(reaction.trigger),
              reversible: reaction.trigger.type === "ON_HOVER" || reaction.trigger.type === "ON_PRESS",
              actions: compiledActions
            });
          }
        });
      });
    });
    return {
      version: 1,
      generatedAt: new Date().toISOString(),
      interactions: interactions
    };
  }

  function findDestinationModel(destinationId, stateByFigmaId, destinations) {
    if (stateByFigmaId[destinationId]) return stateByFigmaId[destinationId];
    if (destinations[destinationId]) return destinations[destinationId];
    var clean = cleanNodeId(destinationId);
    var found = null;
    Object.keys(stateByFigmaId).forEach(function (key) {
      if (!found && stateByFigmaId[key].id === clean) found = stateByFigmaId[key];
    });
    if (found) return found;
    Object.keys(destinations).forEach(function (key) {
      if (!found && destinations[key].id === clean) found = destinations[key];
    });
    return found;
  }

  function triggerDelayMs(trigger) {
    if (!trigger) return 0;
    var raw = typeof trigger.timeout === "number" ? trigger.timeout : typeof trigger.delay === "number" ? trigger.delay : 0;
    return Math.max(0, Math.round(raw * 1000));
  }

  function buildSmartDiffs(sourceRoot, destinationRoot, transition, ctx) {
    var sourceMap = {};
    var destinationMap = {};
    walk(sourceRoot, function (node) {
      collectMatchKeys(node).forEach(function (key) {
        if (!sourceMap[key]) sourceMap[key] = node;
      });
    });
    walk(destinationRoot, function (node) {
      collectMatchKeys(node).forEach(function (key) {
        if (!destinationMap[key]) destinationMap[key] = node;
      });
    });

    var diffs = [];
    Object.keys(sourceMap).forEach(function (key) {
      if (diffs.length >= 120) return;
      var source = sourceMap[key];
      var dest = destinationMap[key];
      if (!dest) return;

      var diff = {
        nodeId: source.id,
        sourceNodeId: source.id,
        destinationNodeId: dest.id
      };
      var changed = false;
      var dx = round(dest.x - source.x, 3);
      var dy = round(dest.y - source.y, 3);
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
        diff.x = dx;
        diff.y = dy;
        diff.fromX = round(source.x - dest.x, 3);
        diff.fromY = round(source.y - dest.y, 3);
        changed = true;
      }

      if (source.width > 0 && source.height > 0 && dest.width > 0 && dest.height > 0) {
        var scaleX = round(dest.width / source.width, 4);
        var scaleY = round(dest.height / source.height, 4);
        if (Math.abs(scaleX - 1) > 0.01 || Math.abs(scaleY - 1) > 0.01) {
          diff.scaleX = scaleX;
          diff.scaleY = scaleY;
          diff.fromScaleX = round(source.width / dest.width, 4);
          diff.fromScaleY = round(source.height / dest.height, 4);
          diff.width = round(dest.width, 3);
          diff.height = round(dest.height, 3);
          changed = true;
        }
      }

      var rotation = round(dest.rotation - source.rotation, 3);
      if (Math.abs(rotation) > 0.5) {
        diff.rotation = rotation;
        diff.fromRotation = round(source.rotation - dest.rotation, 3);
        changed = true;
      }

      if (Math.abs(dest.opacity - source.opacity) > 0.01) {
        diff.opacity = round(dest.opacity, 3);
        diff.fromOpacity = round(source.opacity, 3);
        diff.toOpacity = round(dest.opacity, 3);
        changed = true;
      }

      var sourceFill = firstSolidColor(source.fills);
      var destFill = firstSolidColor(dest.fills);
      if (sourceFill && destFill && sourceFill !== destFill) {
        diff.backgroundColor = destFill;
        diff.fromBackgroundColor = sourceFill;
        diff.toBackgroundColor = destFill;
        changed = true;
      }

      if (Math.abs((dest.cornerRadius || 0) - (source.cornerRadius || 0)) > 0.5) {
        diff.borderRadius = round(dest.cornerRadius || 0, 3);
        diff.fromBorderRadius = round(source.cornerRadius || 0, 3);
        diff.toBorderRadius = round(dest.cornerRadius || 0, 3);
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

  function collectMatchKeys(node) {
    var keys = [];
    if (node.pathKey) keys.push("path:" + node.pathKey);
    if (node.name) keys.push("name-type:" + normalizePathPart(node.name) + ":" + node.type);
    if (node.path && node.path.length) {
      keys.push("struct:" + node.path.slice(1).map(normalizePathPart).join("/") + ":" + node.type);
    }
    return keys;
  }

  async function maybeExportNodeAsset(node, model, ctx) {
    if (ctx.assets.length >= MAX_ASSETS) return detectAssetReference(node, model, ctx);

    var imageHash = firstImageHash(node);
    if (imageHash) {
      var imageKey = "image:" + imageHash;
      if (ctx.assetKeyMap[imageKey]) {
        addAssetUse(ctx.assetKeyMap[imageKey].manifestEntry, model.figmaId);
        return ctx.assetKeyMap[imageKey].reference;
      }
      try {
        var image = figma.getImageByHash(imageHash);
        if (!image) return null;
        var bytes = await image.getBytesAsync();
        if (bytes.length > MAX_ASSET_BYTES) {
          ctx.warnings.push(warning("large-image-skipped", "Skipped image asset over 6MB on layer '" + model.name + "'.", model.figmaId));
          recordAssetFailure(ctx, model, "image-fill", "Image asset is over 6MB.");
          return null;
        }
        var ext = detectImageExtension(bytes);
        var imageFilename = (ctx.assetFilePrefix || ctx.sectionType) + "-" + slug(model.name, "image") + "-" + cleanNodeId(model.figmaId) + "-" + shortHash(imageHash) + "." + ext;
        var asset = {
          path: "assets/" + imageFilename,
          name: model.name,
          type: "binary",
          mime: imageMime(ext),
          bytes: Array.prototype.slice.call(bytes)
        };
        ctx.assets.push(asset);
        var reference = {
          path: asset.path,
          filename: asset.path.split("/").pop(),
          kind: "image",
          mime: asset.mime
        };
        var manifestEntry = recordAssetSuccess(ctx, model, reference.filename, ext.toUpperCase(), "image-fill");
        ctx.assetHashMap[imageHash] = reference;
        ctx.assetKeyMap[imageKey] = {
          reference: reference,
          manifestEntry: manifestEntry
        };
        return reference;
      } catch (error) {
        ctx.warnings.push(warning("image-export-failed", "Could not export image asset on '" + model.name + "': " + error.message, model.figmaId));
        recordAssetFailure(ctx, model, "image-fill", error.message);
        return null;
      }
    }

    if (VECTOR_TYPES[node.type]) {
      var vectorKey = "vector:" + model.figmaId;
      if (ctx.assetKeyMap[vectorKey]) {
        addAssetUse(ctx.assetKeyMap[vectorKey].manifestEntry, model.figmaId);
        return ctx.assetKeyMap[vectorKey].reference;
      }
      try {
        var svg = await node.exportAsync({ format: "SVG_STRING" });
        var svgFilename = (ctx.assetFilePrefix || ctx.sectionType) + "-" + slug(model.name, "icon") + "-" + cleanNodeId(model.figmaId) + ".svg";
        var svgAsset = {
          path: "assets/" + svgFilename,
          name: model.name,
          type: "text",
          content: svg
        };
        ctx.assets.push(svgAsset);
        var svgReference = {
          path: svgAsset.path,
          filename: svgAsset.path.split("/").pop(),
          kind: "svg"
        };
        ctx.assetKeyMap[vectorKey] = {
          reference: svgReference,
          manifestEntry: recordAssetSuccess(ctx, model, svgReference.filename, "SVG", "vector")
        };
        return svgReference;
      } catch (error2) {
        ctx.warnings.push(warning("svg-export-failed", "Could not export vector asset on '" + model.name + "': " + error2.message, model.figmaId));
        recordAssetFailure(ctx, model, "vector", error2.message);
      }
    }

    return null;
  }

  function recordAssetSuccess(ctx, model, filename, assetType, sourceType) {
    var entry = {
      figmaNodeId: model.figmaId,
      originalLayerName: model.name,
      shopifyFilename: filename,
      assetType: assetType,
      sourceType: sourceType,
      dimensions: {
        width: model.width || 0,
        height: model.height || 0
      },
      usedBy: [model.figmaId],
      status: "exported",
      failureReason: null
    };
    ctx.assetManifest.push(entry);
    return entry;
  }

  function recordAssetFailure(ctx, model, sourceType, reason) {
    ctx.assetManifest.push({
      figmaNodeId: model.figmaId,
      originalLayerName: model.name,
      shopifyFilename: null,
      assetType: null,
      sourceType: sourceType,
      dimensions: {
        width: model.width || 0,
        height: model.height || 0
      },
      usedBy: [model.figmaId],
      status: "failed",
      failureReason: reason
    });
  }

  function addAssetUse(entry, figmaNodeId) {
    if (!entry || entry.usedBy.indexOf(figmaNodeId) !== -1) return;
    entry.usedBy.push(figmaNodeId);
  }

  function detectAssetReference(node, model, ctx) {
    var imageHash = firstImageHash(node);
    if (imageHash) {
      var imageFilename = (ctx.assetFilePrefix || ctx.sectionType) + "-" + slug(model.name, "image") + "-" + cleanNodeId(model.figmaId) + "-" + shortHash(imageHash) + ".png";
      return {
        path: "assets/" + imageFilename,
        filename: imageFilename,
        kind: "image-placeholder"
      };
    }
    if (VECTOR_TYPES[node.type]) {
      var svgFilename = (ctx.assetFilePrefix || ctx.sectionType) + "-" + slug(model.name, "icon") + "-" + cleanNodeId(model.figmaId) + ".svg";
      return {
        path: "assets/" + svgFilename,
        filename: svgFilename,
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
        path: "assets/" + (ctx.assetFilePrefix || ctx.sectionType) + "-figma-preview.png",
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
        path: "assets/" + (ctx.assetFilePrefix || ctx.sectionType) + "-motion-fallback.webm",
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
    var css = generateCss(input.states, input.tokens, input.classPrefix, input.stage, input.viewports || []);
    var js = generateRuntimeJs();
    var liquid = generateLiquidSection(input, css, js);
    var report = generateReport(input);
    var manifest = generateExportManifest(input);
    var reportMd = generateExportReportMd(input);
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
        path: "motion-figma-prototype-to-shopify-manifest.json",
        type: "text",
        content: manifest
      },
      {
        path: "motion-figma-prototype-to-shopify-export-report.md",
        type: "text",
        content: reportMd
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

  function generateLiquidSection(input, css, js) {
    var needsProduct = input.bindings.some(function (binding) { return binding.group === "product"; });
    var needsCollection = input.bindings.some(function (binding) { return binding.group === "collection"; });
    var needsMenu = input.bindings.some(function (binding) { return binding.group === "menu"; });
    var schema = generateSchema(input, needsProduct, needsCollection, needsMenu);
    var liquidSetup = [];
    var inlineCode = input.settings.codeMode !== "external";

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

    var viewports = input.viewports && input.viewports.length ? input.viewports : [{
      key: "desktop",
      label: "Desktop",
      states: input.states,
      stage: input.stage,
      destinations: input.destinations,
      motion: input.motion
    }];
    var viewportMarkup = viewports.map(function (viewport) {
      return renderViewport(viewport, input);
    }).join("\n");

    var parts = [];
    parts.push("{% comment %}");
    parts.push("Generated by Motion: Figma Prototype to Shopify v" + PLUGIN_VERSION + ".");
    parts.push(inlineCode
      ? "Copy Code mode: this section includes its generated CSS and JavaScript inline. Upload only referenced image/SVG assets."
      : "External code mode: this section loads generated CSS and JavaScript from Shopify theme assets.");
    parts.push("Paste this whole file into Shopify Admin > Online Store > Themes > Edit code > sections/" + input.sectionType + ".liquid.");
    parts.push("{% endcomment %}");
    if (liquidSetup.length) {
      parts.push("{% liquid");
      liquidSetup.forEach(function (line) { parts.push("  " + line); });
      parts.push("%}");
    }
    parts.push("");
    if (!inlineCode) {
      parts.push("{{ '" + input.sectionType + ".css' | asset_url | stylesheet_tag }}");
      parts.push("<script src=\"{{ '" + input.sectionType + ".js' | asset_url }}\" defer></script>");
      parts.push("");
    }
    parts.push("<section class=\"" + input.classPrefix + "\" data-motion-figma-responsive-section>");
    parts.push(viewportMarkup);
    parts.push("</section>");
    parts.push("");
    parts.push("{% schema %}");
    parts.push(JSON.stringify(schema, null, 2));
    parts.push("{% endschema %}");
    if (inlineCode) {
      parts.push("");
      parts.push("{% stylesheet %}");
      parts.push(css);
      parts.push("{% endstylesheet %}");
      parts.push("");
      parts.push("<script>");
      parts.push(js);
      parts.push("</script>");
    }
    return parts.join("\n");
  }

  function renderViewport(viewport, input) {
    var motionJson = JSON.stringify(viewport.motion).replace(/</g, "\\u003c");
    var overlays = collectOverlayDestinations(viewport.states, viewport.destinations, viewport.motion);
    var stateMarkup = viewport.states.map(function (state) {
      return renderState(state, input, viewport.stage, overlays);
    }).join("\n");
    var overlayMarkup = overlays.map(function (overlay) {
      return renderOverlay(overlay, input.classPrefix);
    }).join("\n");
    var lines = [];
    lines.push("  <div class=\"fts-responsive fts-responsive--" + escapeAttr(viewport.key) + "\" data-motion-figma-prototype-to-shopify data-fts-viewport=\"" + escapeAttr(viewport.key) + "\">");
    lines.push("    <div class=\"fts-stage\" data-fts-stage style=\"--stage-width: " + numberOrZero(viewport.stage.width) + "; --stage-height: " + numberOrZero(viewport.stage.height) + ";\">");
    lines.push(stateMarkup);
    lines.push("    </div>");
    if (overlayMarkup) lines.push(overlayMarkup);
    lines.push("    <script type=\"application/json\" data-fts-motion-config>" + motionJson + "</script>");
    lines.push("  </div>");
    return lines.join("\n");
  }

  function renderState(state, input, stage, overlays) {
    var isActive = state.id === stage.startStateId;
    var attrs = [
      "class=\"fts-variant" + (isActive ? " is-active" : "") + "\"",
      "data-fts-state=\"" + escapeAttr(state.id) + "\"",
      "data-figma-node-id=\"" + escapeAttr(state.figmaId) + "\"",
      "data-variant-name=\"" + escapeAttr(state.name) + "\"",
      "aria-hidden=\"" + (isActive ? "false" : "true") + "\""
    ].join(" ");
    return [
      "    <div " + attrs + ">",
      renderNode(state, {
        classPrefix: input.classPrefix,
        collectionDepth: 0,
        inProductLoop: false,
        overlays: overlays
      }),
      "    </div>"
    ].join("\n");
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
    return " class=\"fts-node " + node.className + "\" data-fts-node=\"" + node.id + "\" data-figma-node-id=\"" + escapeAttr(node.figmaId) + "\"";
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

  function generateCss(states, tokens, classPrefix, stage, viewports) {
    var lines = [];
    lines.push("." + classPrefix + " {");
    lines.push("  --fts-text: " + (tokens.colors[0] || "#111111") + ";");
    lines.push("  --fts-bg: " + (tokens.backgrounds[0] || "transparent") + ";");
    lines.push("  box-sizing: border-box;");
    lines.push("  color: var(--fts-text);");
    lines.push("  background: var(--fts-bg);");
    lines.push("  font-family: var(--font-body-family, inherit);");
    lines.push("  font-style: var(--font-body-style, normal);");
    lines.push("  font-weight: var(--font-body-weight, inherit);");
    lines.push("  display: block;");
    lines.push("  width: 100vw;");
    lines.push("  width: 100dvw;");
    lines.push("  max-width: 100vw;");
    lines.push("  max-width: 100dvw;");
    lines.push("  margin-left: calc(50% - 50vw);");
    lines.push("  margin-left: calc(50% - 50dvw);");
    lines.push("  margin-right: calc(50% - 50vw);");
    lines.push("  margin-right: calc(50% - 50dvw);");
    lines.push("  position: relative;");
    lines.push("}");
    lines.push("." + classPrefix + " *, ." + classPrefix + " *::before, ." + classPrefix + " *::after { box-sizing: border-box; }");
    lines.push("." + classPrefix + " .fts-node { transform-origin: top left; backface-visibility: hidden; }");
    lines.push("." + classPrefix + " img { display: block; width: 100%; height: 100%; object-fit: cover; }");
    lines.push("." + classPrefix + " a { color: inherit; text-decoration: none; }");
    lines.push("." + classPrefix + " button { font: inherit; color: inherit; cursor: pointer; border: 0; background: transparent; }");
    lines.push("." + classPrefix + " h1, ." + classPrefix + " h2, ." + classPrefix + " h3, ." + classPrefix + " h4, ." + classPrefix + " h5, ." + classPrefix + " h6 {");
    lines.push("  font-family: var(--font-heading-family, var(--font-body-family, inherit));");
    lines.push("  font-style: var(--font-heading-style, var(--font-body-style, normal));");
    lines.push("  font-weight: var(--font-heading-weight, var(--font-body-weight, inherit));");
    lines.push("}");
    lines.push("." + classPrefix + " .fts-responsive { width: 100%; }");
    if (hasViewport(viewports, "desktop") && hasViewport(viewports, "mobile")) {
      lines.push("." + classPrefix + " .fts-responsive--desktop { display: block; }");
      lines.push("." + classPrefix + " .fts-responsive--mobile { display: none; }");
    }
    lines.push("." + classPrefix + " .fts-stage {");
    lines.push("  --stage-width: " + numberOrZero(stage.width || 1200) + ";");
    lines.push("  --stage-height: " + numberOrZero(stage.height || 800) + ";");
    lines.push("  position: relative;");
    lines.push("  width: 100%;");
    lines.push("  max-width: none;");
    lines.push("  aspect-ratio: var(--stage-width) / var(--stage-height);");
    lines.push("  margin-inline: 0;");
    lines.push("  overflow: hidden;");
    lines.push("  isolation: isolate;");
    lines.push("}");
    lines.push("." + classPrefix + " .fts-variant {");
    lines.push("  position: absolute;");
    lines.push("  inset: 0;");
    lines.push("  width: 100%;");
    lines.push("  height: 100%;");
    lines.push("  opacity: 0;");
    lines.push("  visibility: hidden;");
    lines.push("  pointer-events: none;");
    lines.push("}");
    lines.push("." + classPrefix + " .fts-variant.is-active {");
    lines.push("  opacity: 1;");
    lines.push("  visibility: visible;");
    lines.push("  pointer-events: auto;");
    lines.push("}");
    lines.push(".fts-overlay[hidden] { display: none; }");
    lines.push(".fts-overlay { position: fixed; inset: 0; z-index: 2147483000; display: grid; place-items: center; opacity: 0; pointer-events: none; transition: opacity 220ms ease; }");
    lines.push(".fts-overlay.is-open { opacity: 1; pointer-events: auto; }");
    lines.push(".fts-overlay__backdrop { position: absolute; inset: 0; background: rgba(0,0,0,.4); }");
    lines.push(".fts-overlay-panel { position: relative; z-index: 1; }");
    lines.push(".fts-generated-product-card { display: grid; gap: 10px; }");
    lines.push(".fts-generated-product-card img { aspect-ratio: 1 / 1; object-fit: cover; }");
    var emitted = {};
    walkAll(states, function (node, parent) {
      if (emitted[node.id]) return;
      emitted[node.id] = true;
      lines.push.apply(lines, cssForNode(node, parent, classPrefix));
    });
    lines.push("@media (max-width: 749px) {");
    lines.push("  ." + classPrefix + " .fts-stage { max-width: 100%; }");
    if (hasViewport(viewports, "desktop") && hasViewport(viewports, "mobile")) {
      lines.push("  ." + classPrefix + " .fts-responsive--desktop { display: none; }");
      lines.push("  ." + classPrefix + " .fts-responsive--mobile { display: block; }");
    }
    lines.push("}");
    return lines.join("\n");
  }

  function hasViewport(viewports, key) {
    return (viewports || []).some(function (viewport) { return viewport.key === key; });
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
      lines.push("  position: relative;");
      lines.push("  width: 100%;");
      lines.push("  height: 100%;");
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
      if (node.text.fontSize) lines.push("  font-size: calc(" + px(node.text.fontSize) + " * var(--font-body-scale, 1));");
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
      "    var timers = [];",
      "    var stateTimers = [];",
      "    var afterTimeoutInteractions = [];",
      "    var tweens = [];",
      "    var originals = new Map();",
      "    var activePreparedLayers = [];",
      "    var activeMutedLayers = [];",
      "    var transitionTimer = null;",
      "    ensureActiveState();",
      "    function find(id) { return root.querySelector('[data-fts-node=\"' + cssEscape(id) + '\"]'); }",
      "    function findStateByFigmaId(id) { return root.querySelector('[data-figma-node-id=\"' + cssEscape(id) + '\"].fts-variant, .fts-variant[data-figma-node-id=\"' + cssEscape(id) + '\"]'); }",
      "    function findStateByCleanId(id) { return root.querySelector('[data-fts-state=\"' + cssEscape(id) + '\"]'); }",
      "    function activeState() { return root.querySelector('.fts-variant.is-active'); }",
      "    function isActiveStateId(id) { var state = findStateByCleanId(id); return !!state && state.classList.contains('is-active'); }",
      "    function ensureActiveState() {",
      "      var active = activeState();",
      "      var first = root.querySelector('.fts-variant');",
      "      if (!active && first) activateOnly(first);",
      "      else if (active) setStateActive(active, true);",
      "    }",
      "    function setStateActive(state, active) {",
      "      if (!state) return;",
      "      state.classList.toggle('is-active', active);",
      "      state.setAttribute('aria-hidden', active ? 'false' : 'true');",
      "    }",
      "    function activateOnly(state) {",
      "      killTweens();",
      "      root.querySelectorAll('.fts-variant').forEach(function (item) { setStateActive(item, item === state); item.style.opacity = ''; item.style.visibility = ''; item.style.transition = ''; item.style.pointerEvents = ''; });",
      "      scheduleAfterTimeoutsForState(state, 0);",
      "    }",
      "    function clearStateTimers() {",
      "      stateTimers.forEach(function (id) { window.clearTimeout(id); });",
      "      stateTimers = [];",
      "    }",
      "    function clearTransitionTimer() {",
      "      if (transitionTimer !== null) window.clearTimeout(transitionTimer);",
      "      transitionTimer = null;",
      "    }",
      "    function scheduleAfterTimeoutsForState(state, waitMs) {",
      "      clearStateTimers();",
      "      if (!state) return;",
      "      var stateId = state.getAttribute('data-fts-state');",
      "      afterTimeoutInteractions.forEach(function (interaction) {",
      "        if (interaction.sourceStateId && interaction.sourceStateId !== stateId) return;",
      "        var id = window.setTimeout(function () { runInteraction(interaction, false); }, Math.max(0, Number(waitMs || 0)) + Math.max(0, Number(interaction.delayMs || 0)));",
      "        stateTimers.push(id);",
      "        timers.push(id);",
      "      });",
      "    }",
      "    function canUseGsap() { return window.gsap && typeof window.gsap.to === 'function' && typeof window.gsap.set === 'function'; }",
      "    function trackTween(tween) { if (tween && typeof tween.kill === 'function') tweens.push(tween); return tween; }",
      "    function killTweens() {",
      "      while (tweens.length) {",
      "        var tween = tweens.pop();",
      "        if (tween && typeof tween.kill === 'function') tween.kill();",
      "      }",
      "      clearTransitionTimer();",
      "      clearMotionStyles();",
      "    }",
      "    function toGsapEase(ease) {",
      "      var value = String(ease || '').toLowerCase();",
      "      if (value.indexOf('linear') !== -1 || value === 'none') return 'none';",
      "      if (value.indexOf('ease-in-out') !== -1) return 'power2.inOut';",
      "      if (value.indexOf('ease-in') !== -1) return 'power2.in';",
      "      if (value.indexOf('ease-out') !== -1) return 'power2.out';",
      "      return 'power1.out';",
      "    }",
      "    function remember(el) {",
      "      if (!originals.has(el)) originals.set(el, { transform: el.style.transform || '', opacity: el.style.opacity || '', backgroundColor: el.style.backgroundColor || '', borderRadius: el.style.borderRadius || '', width: el.style.width || '', height: el.style.height || '', transition: el.style.transition || '', willChange: el.style.willChange || '' });",
      "    }",
      "    function restoreOriginal(el) {",
      "      var original = el && originals.get(el);",
      "      if (!el || !original) return;",
      "      el.style.transform = original.transform;",
      "      el.style.opacity = original.opacity;",
      "      el.style.backgroundColor = original.backgroundColor;",
      "      el.style.borderRadius = original.borderRadius;",
      "      el.style.width = original.width;",
      "      el.style.height = original.height;",
      "      el.style.transition = original.transition;",
      "      el.style.willChange = original.willChange;",
      "    }",
      "    function clearMotionStyles() {",
      "      activePreparedLayers.forEach(function (item) { restoreOriginal(item.el); });",
      "      activeMutedLayers.forEach(function (item) { restoreOriginal(item.el); });",
      "      activePreparedLayers = [];",
      "      activeMutedLayers = [];",
      "    }",
      "    function transitionFor(diff) {",
      "      var duration = Math.max(0, Number(diff.duration || 0));",
      "      var ease = diff.ease || 'ease';",
      "      return 'transform ' + duration + 'ms ' + ease + ', opacity ' + duration + 'ms ' + ease + ', background-color ' + duration + 'ms ' + ease + ', border-radius ' + duration + 'ms ' + ease + ', width ' + duration + 'ms ' + ease + ', height ' + duration + 'ms ' + ease;",
      "    }",
      "    function numeric(value, fallback) { return typeof value === 'number' && isFinite(value) ? value : fallback; }",
      "    function inverseScale(value) { return value && isFinite(value) ? 1 / value : 1; }",
      "    function transformString(x, y, scaleX, scaleY, rotation) {",
      "      var transforms = [];",
      "      if (Math.abs(x || 0) > 0.01 || Math.abs(y || 0) > 0.01) transforms.push('translate(' + (x || 0) + 'px, ' + (y || 0) + 'px)');",
      "      if (Math.abs((scaleX || 1) - 1) > 0.001 || Math.abs((scaleY || 1) - 1) > 0.001) transforms.push('scale(' + (scaleX || 1) + ', ' + (scaleY || 1) + ')');",
      "      if (Math.abs(rotation || 0) > 0.01) transforms.push('rotate(' + rotation + 'deg)');",
      "      return transforms.join(' ');",
      "    }",
      "    function prepareDestinationDiff(diff, reverse) {",
      "      var targetId = reverse ? (diff.sourceNodeId || diff.nodeId) : (diff.destinationNodeId || diff.nodeId);",
      "      var el = find(targetId);",
      "      if (!el || !diff.destinationNodeId) return null;",
      "      remember(el);",
      "      var fromX = reverse ? numeric(diff.x, -numeric(diff.fromX, 0)) : numeric(diff.fromX, -numeric(diff.x, 0));",
      "      var fromY = reverse ? numeric(diff.y, -numeric(diff.fromY, 0)) : numeric(diff.fromY, -numeric(diff.y, 0));",
      "      var fromScaleX = reverse ? numeric(diff.scaleX, inverseScale(diff.fromScaleX)) : numeric(diff.fromScaleX, inverseScale(diff.scaleX));",
      "      var fromScaleY = reverse ? numeric(diff.scaleY, inverseScale(diff.fromScaleY)) : numeric(diff.fromScaleY, inverseScale(diff.scaleY));",
      "      var fromRotation = reverse ? numeric(diff.rotation, -numeric(diff.fromRotation, 0)) : numeric(diff.fromRotation, -numeric(diff.rotation, 0));",
      "      var fromOpacity = reverse ? numeric(diff.toOpacity, diff.opacity) : diff.fromOpacity;",
      "      var fromBackgroundColor = reverse ? (diff.toBackgroundColor || diff.backgroundColor) : diff.fromBackgroundColor;",
      "      var fromBorderRadius = reverse ? numeric(diff.toBorderRadius, diff.borderRadius) : diff.fromBorderRadius;",
      "      el.style.transition = 'none';",
      "      el.style.willChange = 'transform, opacity';",
      "      var transform = transformString(fromX, fromY, fromScaleX, fromScaleY, fromRotation);",
      "      if (transform) el.style.transform = transform;",
      "      if (typeof fromOpacity === 'number') el.style.opacity = String(fromOpacity);",
      "      if (fromBackgroundColor) el.style.backgroundColor = fromBackgroundColor;",
      "      if (typeof fromBorderRadius === 'number') el.style.borderRadius = fromBorderRadius + 'px';",
      "      return { el: el, diff: diff, reverse: reverse };",
      "    }",
      "    function prepareDestinationDiffs(diffs, reverse) {",
      "      var prepared = [];",
      "      (diffs || []).forEach(function (diff) {",
      "        var item = prepareDestinationDiff(diff, reverse);",
      "        if (item) prepared.push(item);",
      "      });",
      "      return prepared;",
      "    }",
      "    function playPreparedDiffs(prepared) {",
      "      prepared.forEach(function (item) {",
      "        var el = item.el;",
      "        var diff = item.diff;",
      "        var reverse = item.reverse;",
      "        var original = originals.get(el);",
      "        var finalOpacity = reverse ? diff.fromOpacity : diff.toOpacity;",
      "        var finalBackgroundColor = reverse ? diff.fromBackgroundColor : (diff.toBackgroundColor || diff.backgroundColor);",
      "        var finalBorderRadius = reverse ? diff.fromBorderRadius : numeric(diff.toBorderRadius, diff.borderRadius);",
      "        el.style.transition = transitionFor(diff);",
      "        el.style.transform = original ? original.transform : '';",
      "        if (typeof finalOpacity === 'number') el.style.opacity = String(finalOpacity);",
      "        else el.style.opacity = original ? original.opacity : '';",
      "        if (finalBackgroundColor) el.style.backgroundColor = finalBackgroundColor;",
      "        else el.style.backgroundColor = original ? original.backgroundColor : '';",
      "        if (typeof finalBorderRadius === 'number') el.style.borderRadius = finalBorderRadius + 'px';",
      "        else el.style.borderRadius = original ? original.borderRadius : '';",
      "      });",
      "    }",
      "    function muteSourceDiffs(diffs, reverse) {",
      "      var muted = [];",
      "      (diffs || []).forEach(function (diff) {",
      "        var sourceId = reverse ? (diff.destinationNodeId || diff.nodeId) : (diff.sourceNodeId || diff.nodeId);",
      "        var el = find(sourceId);",
      "        if (!el || !diff.destinationNodeId) return;",
      "        remember(el);",
      "        el.style.transition = 'none';",
      "        el.style.opacity = '0';",
      "        muted.push({ el: el, diff: diff, reverse: reverse });",
      "      });",
      "      return muted;",
      "    }",
      "    function applyDiff(diff) {",
      "      var el = find(diff.nodeId);",
      "      if (!el) return null;",
      "      remember(el);",
      "      el.style.transition = transitionFor(diff);",
      "      var transforms = [];",
      "      if (diff.x || diff.y) transforms.push('translate(' + (diff.x || 0) + 'px, ' + (diff.y || 0) + 'px)');",
      "      if (diff.scaleX || diff.scaleY) transforms.push('scale(' + (diff.scaleX || 1) + ', ' + (diff.scaleY || 1) + ')');",
      "      if (diff.rotation) transforms.push('rotate(' + diff.rotation + 'deg)');",
      "      if (transforms.length) el.style.transform = transforms.join(' ');",
      "      if (typeof diff.opacity === 'number') el.style.opacity = String(diff.opacity);",
      "      if (diff.backgroundColor) el.style.backgroundColor = diff.backgroundColor;",
      "      if (typeof diff.borderRadius === 'number') el.style.borderRadius = diff.borderRadius + 'px';",
      "      if (typeof diff.width === 'number') el.style.width = diff.width + 'px';",
      "      if (typeof diff.height === 'number') el.style.height = diff.height + 'px';",
      "      return el;",
      "    }",
      "    function resetDiff(diff) {",
      "      var el = find(diff.nodeId);",
      "      var original = el && originals.get(el);",
      "      if (!el || !original) return null;",
      "      el.style.transition = transitionFor(diff);",
      "      el.style.transform = original.transform;",
      "      el.style.opacity = original.opacity;",
      "      el.style.backgroundColor = original.backgroundColor;",
      "      el.style.borderRadius = original.borderRadius;",
      "      el.style.width = original.width;",
      "      el.style.height = original.height;",
      "      return el;",
      "    }",
      "    function changeVariant(sourceNodeId, destinationNodeId, transition, diffs, reverse) {",
      "      var source = findStateByFigmaId(sourceNodeId) || activeState();",
      "      var destination = findStateByFigmaId(destinationNodeId);",
      "      if (!destination) return;",
      "      var duration = Math.max(0, Number(transition && transition.durationMs || 0));",
      "      var ease = transition && transition.cssEase || transition && transition.ease || 'ease';",
      "      if (source === destination) { activateOnly(destination); return; }",
      "      clearStateTimers();",
      "      killTweens();",
      "      root.querySelectorAll('.fts-variant.is-active').forEach(function (item) {",
      "        if (item !== source && item !== destination) { setStateActive(item, false); item.style.opacity = ''; item.style.visibility = ''; item.style.transition = ''; item.style.pointerEvents = ''; }",
      "      });",
      "      var prepared = source && diffs && diffs.length ? prepareDestinationDiffs(diffs, reverse) : [];",
      "      var muted = prepared.length && source ? muteSourceDiffs(diffs, reverse) : [];",
      "      var sourceFadeDuration = prepared.length ? Math.min(duration, 180) : duration;",
      "      var legacy = [];",
      "      if (source && diffs && diffs.length && !prepared.length) {",
      "        diffs.forEach(function (diff) {",
      "          var el = reverse ? resetDiff(diff) : applyDiff(diff);",
      "          if (el) legacy.push({ el: el, diff: diff, reverse: reverse });",
      "        });",
      "      }",
      "      activePreparedLayers = prepared.length ? prepared : legacy;",
      "      activeMutedLayers = muted;",
      "      var finished = false;",
      "      function finishStateChange() {",
      "        if (finished) return;",
      "        finished = true;",
      "        clearMotionStyles();",
      "        if (source && source !== destination) {",
      "          setStateActive(source, false);",
      "          source.style.opacity = '';",
      "          source.style.visibility = '';",
      "          source.style.transition = '';",
      "          source.style.pointerEvents = '';",
      "        }",
      "        destination.style.opacity = '';",
      "        destination.style.visibility = '';",
      "        destination.style.transition = '';",
      "        scheduleAfterTimeoutsForState(destination, 0);",
      "      }",
      "      if (prepared.length) {",
      "        destination.style.transition = 'none';",
      "        destination.style.opacity = '1';",
      "        destination.style.visibility = 'visible';",
      "        setStateActive(destination, true);",
      "        destination.getBoundingClientRect();",
      "        playPreparedDiffs(prepared);",
      "        if (source && source !== destination) {",
      "          source.style.transition = 'opacity ' + sourceFadeDuration + 'ms ' + ease + ', visibility ' + sourceFadeDuration + 'ms ' + ease;",
      "          source.style.opacity = '0';",
      "          source.style.pointerEvents = 'none';",
      "        }",
      "        transitionTimer = window.setTimeout(function () { transitionTimer = null; finishStateChange(); }, duration);",
      "        timers.push(transitionTimer);",
      "        return;",
      "      }",
      "      if (canUseGsap()) {",
      "        var gsap = window.gsap;",
      "        gsap.set(destination, { autoAlpha: 0 });",
      "        setStateActive(destination, true);",
      "        var destinationTween = { autoAlpha: 1, duration: duration / 1000, ease: toGsapEase(ease), overwrite: 'auto', clearProps: 'opacity,visibility' };",
      "        if (!source || source === destination) destinationTween.onComplete = finishStateChange;",
      "        trackTween(gsap.to(destination, destinationTween));",
      "        if (source && source !== destination) {",
      "          source.style.pointerEvents = 'none';",
      "          trackTween(gsap.to(source, { autoAlpha: 0, duration: duration / 1000, ease: toGsapEase(ease), overwrite: 'auto', onComplete: finishStateChange }));",
      "        }",
      "        return;",
      "      }",
      "      destination.style.transition = 'opacity ' + duration + 'ms ' + ease + ', visibility ' + duration + 'ms ' + ease;",
      "      destination.style.opacity = '0';",
      "      setStateActive(destination, true);",
      "      destination.getBoundingClientRect();",
      "      destination.style.opacity = '1';",
      "      if (source && source !== destination) {",
      "        source.style.transition = 'opacity ' + duration + 'ms ' + ease + ', visibility ' + duration + 'ms ' + ease;",
      "        source.style.opacity = '0';",
      "        source.style.pointerEvents = 'none';",
      "      }",
      "      transitionTimer = window.setTimeout(function () { transitionTimer = null; finishStateChange(); }, duration);",
      "      timers.push(transitionTimer);",
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
      "      if (action.kind === 'change-variant') {",
      "        if (reset) changeVariant(action.destinationNodeId, action.sourceNodeId, action.transition, action.diffs, true);",
      "        else changeVariant(action.sourceNodeId, action.destinationNodeId, action.transition, action.diffs, false);",
      "      }",
      "    }",
      "    function runInteraction(interaction, reset) {",
      "      if (interaction.sourceStateId && !isActiveStateId(interaction.sourceStateId) && !reset) return;",
      "      (interaction.actions || []).forEach(function (action) { runAction(action, reset); });",
      "    }",
      "    function bind(interaction) {",
      "      var el = find(interaction.triggerNodeId);",
      "      if (!el) return;",
      "      var trigger = interaction.trigger;",
      "      if (trigger === 'AFTER_TIMEOUT') {",
      "        afterTimeoutInteractions.push(interaction);",
      "        return;",
      "      }",
      "      if (trigger === 'ON_HOVER') {",
      "        add(el, 'mouseenter', function () { runInteraction(interaction, false); });",
      "        add(el, 'mouseleave', function () { runInteraction(interaction, true); });",
      "        var hoverBoundary = root.querySelector('[data-fts-stage]') || root;",
      "        if (hoverBoundary !== el) add(hoverBoundary, 'mouseleave', function () { runInteraction(interaction, true); });",
      "        return;",
      "      }",
      "      if (trigger === 'ON_DRAG' || trigger === 'DRAG') {",
      "        add(el, 'pointerdown', function () { runInteraction(interaction, false); });",
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
      "    (config.interactions || []).forEach(bind);",
      "    scheduleAfterTimeoutsForState(activeState(), 0);",
      "    root[STATE_KEY] = { destroy: function () { cleanup.forEach(function (fn) { fn(); }); stateTimers.forEach(function (id) { window.clearTimeout(id); }); timers.forEach(function (id) { window.clearTimeout(id); }); killTweens(); root[STATE_KEY] = null; } };",
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
      codeMode: input.settings.codeMode,
      root: {
        name: input.root.name,
        type: input.root.type,
        width: input.root.width,
        height: input.root.height
      },
      selection: input.selection,
      responsive: input.responsive || [],
      stage: input.stage,
      states: input.states.map(stateSummary),
      files: [
        "sections/" + input.sectionType + ".liquid",
        "assets/" + input.sectionType + ".css",
        "assets/" + input.sectionType + ".js",
        "motion-figma-prototype-to-shopify-manifest.json",
        "motion-figma-prototype-to-shopify-export-report.md",
        "templates/page." + input.sectionType + ".json"
      ],
      assets: input.assetManifest,
      liquidBindings: input.bindings,
      prototypeReactions: collectPrototypeReactions(input.states),
      motion: input.motion,
      warnings: input.warnings,
      manualChecklist: [
        input.settings.codeMode === "external"
          ? "Paste sections/" + input.sectionType + ".liquid into your Shopify theme sections folder or Shopify code editor, then upload the generated CSS and JavaScript assets."
          : "Use Copy Code or paste sections/" + input.sectionType + ".liquid into your Shopify theme sections folder. The generated CSS and JavaScript are already inside this section file.",
        "Upload every referenced generated image/SVG asset from the assets folder into Shopify theme assets.",
        "Create a page template from templates/page." + input.sectionType + ".json or add the section from the theme editor.",
        "Choose product, collection, and menu settings in the theme editor when the section uses them.",
        "Preview desktop and mobile, then verify click, hover, delay, and overlay interactions."
      ]
    }, null, 2);
  }

  function generateExportManifest(input) {
    return JSON.stringify({
      generatedBy: "Motion: Figma Prototype to Shopify",
      version: PLUGIN_VERSION,
      generatedAt: new Date().toISOString(),
      sectionType: input.sectionType,
      codeMode: input.settings.codeMode,
      selection: input.selection,
      responsive: input.responsive || [],
      stage: input.stage,
      states: input.states.map(stateSummary),
      interactions: input.motion.interactions,
      assets: input.assetManifest,
      files: [
        "sections/" + input.sectionType + ".liquid",
        "assets/" + input.sectionType + ".css",
        "assets/" + input.sectionType + ".js"
      ].concat(input.assets.map(function (asset) { return asset.path; })),
      warnings: input.warnings
    }, null, 2);
  }

  function generateExportReportMd(input) {
    var lines = [];
    lines.push("# Motion Export Report");
    lines.push("");
    lines.push("Generated by Motion: Figma Prototype to Shopify v" + PLUGIN_VERSION + ".");
    lines.push("");
    lines.push("## Selection");
    lines.push("");
    lines.push("- Selected layer: `" + input.selection.selected.name + "` (" + input.selection.selected.type + ")");
    lines.push("- Export root: `" + input.selection.exportRoot.name + "` (" + input.selection.exportRoot.type + ")");
    lines.push("- Used ancestor root: `" + input.selection.usedAncestorRoot + "`");
    if (input.responsive && input.responsive.length > 1) {
      lines.push("- Responsive frames: `" + input.responsive.map(function (viewport) { return viewport.key + ": " + viewport.root.name + " (" + viewport.root.width + "x" + viewport.root.height + ")"; }).join("`, `") + "`");
    }
    lines.push("");
    lines.push("## Stage");
    lines.push("");
    lines.push("- Width: `" + input.stage.width + "`");
    lines.push("- Height: `" + input.stage.height + "`");
    lines.push("- Initial state: `" + input.stage.startStateName + "` (`" + input.stage.startStateFigmaId + "`)");
    lines.push("");
    lines.push("## States");
    lines.push("");
    input.states.forEach(function (state) {
      lines.push("- `" + state.name + "` (" + state.type + ", " + state.figmaId + ", " + state.width + "x" + state.height + ")");
    });
    lines.push("");
    lines.push("## Assets");
    lines.push("");
    if (input.assetManifest.length) {
      input.assetManifest.forEach(function (asset) {
        lines.push("- `" + (asset.shopifyFilename || "not exported") + "`: " + asset.status + " from `" + asset.originalLayerName + "` (" + asset.figmaNodeId + ")" + (asset.failureReason ? " - " + asset.failureReason : ""));
      });
    } else {
      lines.push("- No exported image or SVG assets.");
    }
    lines.push("");
    lines.push("## Interactions");
    lines.push("");
    if (input.motion.interactions.length) {
      input.motion.interactions.forEach(function (interaction) {
        lines.push("- `" + interaction.trigger + "` on `" + interaction.triggerNodeName + "` -> " + interaction.actions.map(function (action) { return action.kind + (action.destinationNodeId ? " `" + action.destinationNodeId + "`" : ""); }).join(", "));
      });
    } else {
      lines.push("- No supported interactions compiled.");
    }
    lines.push("");
    lines.push("## Warnings");
    lines.push("");
    lines.push(input.warnings.length ? input.warnings.map(function (item) { return "- " + item.code + ": " + item.message; }).join("\n") : "- No conversion warnings.");
    return lines.join("\n");
  }

  function stateSummary(state) {
    return {
      figmaNodeId: state.figmaId,
      id: state.id,
      name: state.name,
      type: state.type,
      variantProperties: state.variantProperties || null,
      width: state.width,
      height: state.height,
      childCount: state.children ? state.children.length : 0,
      opacity: state.opacity
    };
  }

  function collectPrototypeReactions(root) {
    var reactions = [];
    walkAll(root, function (node) {
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
      "## Figma selection",
      "",
      "Selected layer: `" + input.selection.selected.name + "` (" + input.selection.selected.type + ").",
      "Export root: `" + input.selection.exportRoot.name + "` (" + input.selection.exportRoot.type + ").",
      input.selection.usedAncestorRoot ? "The selected layer was inside a component, instance, component set, frame, group, or section, so Motion exported the nearest supported ancestor as the Shopify section boundary." : "The selected layer was directly used as the Shopify section boundary.",
      input.responsive && input.responsive.length > 1 ? "Responsive frames: " + input.responsive.map(function (viewport) { return "`" + viewport.key + "` `" + viewport.root.name + "` (" + viewport.root.width + "x" + viewport.root.height + ")"; }).join(", ") + "." : "",
      "",
      "## Fastest Shopify setup",
      "",
      "1. Open Shopify Admin.",
      "2. Go to Online Store > Themes > ... > Edit code.",
      "3. Open the `sections` folder and click `Add a new section`.",
      "4. Name it `" + input.sectionType + "`.",
      "5. Paste the full contents of `sections/" + input.sectionType + ".liquid`.",
      input.settings.codeMode === "external"
        ? "6. Upload `assets/" + input.sectionType + ".css`, `assets/" + input.sectionType + ".js`, and every exported image/SVG asset into the theme `assets` folder."
        : "6. Upload only the exported image/SVG files referenced by the section into the theme `assets` folder. CSS and JavaScript are already inside the Liquid section.",
      "7. Add the section in the Shopify theme editor.",
      "8. Pick product, collection, and menu settings if prompted. Typography inherits from the Shopify theme automatically.",
      "",
      "## Copy Code mode",
      "",
      input.settings.codeMode === "external"
        ? "This export is in external code mode, so the Liquid section loads CSS and JavaScript with Shopify `asset_url` and does not inline the same runtime."
        : "This export is in Copy Code mode, so the Liquid section includes generated CSS in `{% stylesheet %}` and generated JavaScript in a regular `<script>` tag. The separate CSS/JS files in the ZIP are optional developer copies and are not loaded by the section.",
      "",
      "## Shopify theme typography",
      "",
      "Generated text inherits Shopify theme font variables such as `--font-body-family`, `--font-body-style`, `--font-body-weight`, `--font-heading-family`, `--font-heading-style`, and `--font-heading-weight`. Motion preserves Figma text sizing with Shopify's `--font-body-scale` when the theme provides it.",
      "",
      "## Exported states",
      "",
      input.states.map(function (state) { return "- `" + state.name + "` (" + state.type + ", " + state.figmaId + ")"; }).join("\n"),
      "",
      "## Supported Figma prototype behavior in this export",
      "",
      "- Click/tap, hover, press, mouse enter/leave, mouse down/up, and after-delay triggers.",
      "- Navigate, swap, overlay, change-to, URL, back, and close actions.",
      "- Dissolve, directional movement, and Smart Animate-style destination-layer diffs for position, scale, rotation, opacity, solid fill color, and corner radius.",
      "",
      "## Warnings",
      "",
      input.warnings.length ? input.warnings.map(function (item) { return "- " + item.message; }).join("\n") : "- No conversion warnings."
    ].join("\n");
  }

  function collectOverlayDestinations(roots, destinations, motion) {
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
    walkAll(root, function (node) {
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
    walkAll(root, function (node) {
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
        durationMs: 0,
        cssEase: "ease"
      };
    }
    var duration = typeof transition.duration === "number" ? transition.duration : 0.22;
    var durationMs = duration <= 10 ? Math.round(duration * 1000) : Math.round(duration);
    return {
      type: transition.type || "DISSOLVE",
      direction: transition.direction || null,
      matchLayers: Boolean(transition.matchLayers),
      durationMs: Math.max(0, Math.min(durationMs, 10000)),
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

  function walkAll(rootOrRoots, visitor) {
    if (Array.isArray(rootOrRoots)) {
      rootOrRoots.forEach(function (root) {
        walk(root, visitor);
      });
      return;
    }
    walk(rootOrRoots, visitor);
  }

  function countNodes(root) {
    var count = 0;
    walkAll(root, function () { count += 1; });
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

  function shortHash(value) {
    var input = String(value || "");
    var hash = 0;
    for (var i = 0; i < input.length; i += 1) {
      hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
    }
    return Math.abs(hash).toString(36).slice(0, 8) || "hash";
  }

  function slug(value, fallback) {
    var out = String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return out || fallback;
  }

  function assetFilePrefix(settings, viewport) {
    return [
      slug(settings.rawFilePrefix || settings.filePrefix || settings.sectionName, "motion-figma-prototype-to-shopify"),
      viewport === "mobile" ? "mobile" : "desktop",
      settings.languageLabel || "en"
    ].join("-");
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
