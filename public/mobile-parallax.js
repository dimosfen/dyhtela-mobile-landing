/**
 * Parallax only for #zy-mobile (+ #reviews / #lead). Canva #root stays hidden on mobile.
 */
(function () {
  var MQ = "(max-width: 900px)";
  var SPEED = 0.35;
  var CANVA_DIR = "./\u0414\u0432\u0438\u0436\u0435\u043d\u0438\u0435 \u0422\u0435\u043b\u043e \u0421\u043e\u0441\u0442\u043e\u044f\u043d\u0438\u0435_files/";
  var BG = {
    forest: {
      primary: "./_assets/media/1.jpg",
      fallback: CANVA_DIR + "9c0df15fa0170f3633db9e073abde91a.jpg",
    },
    sea: {
      primary: "./_assets/media/2.jpg",
      fallback: CANVA_DIR + "4df58f24915598e7d0415dcda964a7c3.jpg",
    },
  };

  var state = { enabled: false, layers: [], raf: 0 };

  function isMobile() {
    return window.matchMedia(MQ).matches;
  }

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function buildLayers() {
    removeLayers();
    var zones = document.querySelectorAll("[data-zy-bg]");
    zones.forEach(function (zone) {
      var kind = zone.getAttribute("data-zy-bg");
      var pack = BG[kind] || BG.forest;
      var bg = document.createElement("div");
      bg.className = "zy-m-zone__bg";
      bg.setAttribute("aria-hidden", "true");
      var img = document.createElement("img");
      img.src = pack.primary;
      img.alt = "";
      img.addEventListener("error", function onImgError() {
        if (img.dataset.zyFallback) return;
        img.dataset.zyFallback = "1";
        img.removeEventListener("error", onImgError);
        img.src = pack.fallback;
      });
      img.decoding = "async";
      img.loading = "eager";
      bg.appendChild(img);
      zone.insertBefore(bg, zone.firstChild);
      var parallax = zone.getAttribute("data-zy-parallax");
      state.layers.push({
        zone: zone,
        img: img,
        kind: kind,
        parallax: parallax !== "off" && parallax !== "false",
      });
    });
  }

  function removeLayers() {
    document.querySelectorAll(".zy-m-zone__bg").forEach(function (el) {
      el.parentNode && el.parentNode.removeChild(el);
    });
    state.layers = [];
  }

  function update() {
    state.raf = 0;
    if (!state.enabled || prefersReducedMotion()) return;

    var scrollY = window.scrollY;
    state.layers.forEach(function (item) {
      var rect = item.zone.getBoundingClientRect();
      var zoneTop = rect.top + scrollY;
      var inView = scrollY + window.innerHeight > zoneTop && scrollY < zoneTop + item.zone.offsetHeight;
      if (!inView) {
        item.img.style.transform = "";
        return;
      }
      if (!item.parallax) {
        item.img.style.transform = "";
        return;
      }
      var local = scrollY - zoneTop;
      item.img.style.transform = "translate3d(0," + local * SPEED + "px,0)";
    });
  }

  function requestUpdate() {
    if (state.raf) return;
    state.raf = requestAnimationFrame(update);
  }

  function onScroll() {
    requestUpdate();
  }

  function enable() {
    var mobile = document.getElementById("zy-mobile");
    if (!mobile || !isMobile()) {
      disable();
      return;
    }
    if (state.enabled) {
      requestUpdate();
      return;
    }
    state.enabled = true;
    document.documentElement.classList.add("zy-mobile-active");
    buildLayers();
    bindFormatLinks();
    requestUpdate();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
  }

  function bindFormatLinks() {
    document.querySelectorAll(".zy-m-format[data-interest]").forEach(function (link) {
      if (link.dataset.zyBound) return;
      link.dataset.zyBound = "1";
      link.addEventListener("click", function () {
        var interest = link.getAttribute("data-interest");
        var select = document.getElementById("interestSelect");
        var interestInput = document.getElementById("leadInterest");
        if (select && interest) {
          select.value = interest;
          select.dispatchEvent(new Event("change", { bubbles: true }));
        } else if (interestInput && interest) {
          interestInput.value = interest;
        }
      });
    });
  }

  function disable() {
    if (!state.enabled) return;
    state.enabled = false;
    document.documentElement.classList.remove("zy-mobile-active");
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
    if (state.raf) cancelAnimationFrame(state.raf);
    state.raf = 0;
    removeLayers();
  }

  function sync() {
    if (isMobile() && document.getElementById("zy-mobile")) enable();
    else disable();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", sync);
  } else {
    sync();
  }
  window.addEventListener("load", sync);

  var mq = window.matchMedia(MQ);
  if (mq.addEventListener) mq.addEventListener("change", sync);
  else if (mq.addListener) mq.addListener(sync);
})();
