/*! Motion: Figma Prototype to Shopify shared theme asset.
 *  ZIP exports generate this same asset path with the full section runtime.
 *  This repository copy documents the shared global contract used by generated code. */
(function () {
  "use strict";

  var api = window.MotionFigmaGsapRuntime || {};
  api.version = api.version || "0.1.1";

  api.canUseGsap = function () {
    return !!(window.gsap && typeof window.gsap.to === "function" && typeof window.gsap.timeline === "function");
  };

  api.gsapEase = function (ease) {
    var value = String(ease || "").toLowerCase();
    if (value.indexOf("linear") !== -1 || value === "none") return "none";
    if (value.indexOf("ease-in-out") !== -1) return "power2.inOut";
    if (value.indexOf("ease-in") !== -1) return "power2.in";
    if (value.indexOf("ease-out") !== -1) return "power2.out";
    return "power1.out";
  };

  api.registerScrollTrigger = function () {
    var gsap = window.gsap;
    var ScrollTrigger = window.ScrollTrigger || (gsap && gsap.ScrollTrigger);
    if (!gsap || !ScrollTrigger || typeof ScrollTrigger.create !== "function") return null;
    if (typeof gsap.registerPlugin === "function") {
      try { gsap.registerPlugin(ScrollTrigger); } catch (error) {}
    }
    return ScrollTrigger;
  };

  api.ready = true;
  window.MotionFigmaGsapRuntime = api;
}());
