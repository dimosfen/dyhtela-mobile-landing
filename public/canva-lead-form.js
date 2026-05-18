/**
 * Логика формы заявки (#lead) на страницах с вставкой из canva-lead-inject.mjs.
 */
(function () {
  var interestInput = document.getElementById("leadInterest");
  var tariffInput = document.getElementById("leadTariff");
  var interestSelect = document.getElementById("interestSelect");
  var form = document.getElementById("leadForm");
  var statusEl = document.getElementById("formStatus");
  if (!form || !interestSelect) return;

  /** Секция «форматы практики» в экспорте Canva: клики по пилюлям/подписям → форма (id из текущего index.html). */
  var FORMAT_SECTION_ID = "PBf2JnKMWclWBbkB";
  var FORMAT_CLICK_IDS = {
    LBYTL4q91nxCRYv2: "Онлайн",
    LBxqX2QxRxwT5HKN: "Ретриты",
    LBYwYpmcYF5mhNh1: "Оффлайн",
    LBBJbPp0RhX736Qj: "Корпоративные",
    LBS5f3dFvgL4yK7G: "Онлайн",
    LB3l3y83RVzhwrZy: "Ретриты",
    LBNzhHJYyTZ0lqD6: "Оффлайн",
    LBMNGltK1D1LJfSJ: "Корпоративные",
    LBtp42nsGbt60pT6: "Онлайн",
    LBCy0TZkS8fjYL2Y: "Ретриты",
    LBVB9s2yBqqR5rxM: "Оффлайн",
    LBWPQ3HVfdJ64vh5: "Корпоративные",
  };

  function setInterest(payload) {
    if (typeof payload.interest === "string") interestInput.value = payload.interest;
    if (typeof payload.tariffPlan === "string") tariffInput.value = payload.tariffPlan;
    if (typeof payload.interest === "string") {
      interestSelect.value = payload.interest;
      var opt = interestSelect.selectedOptions && interestSelect.selectedOptions[0];
      var tr = opt && opt.getAttribute("data-tariff");
      if (!payload.tariffPlan && tr) tariffInput.value = tr;
    }
    var h = form.querySelector('input[name="ctaSource"]');
    if (h && typeof payload.source === "string") h.value = payload.source;
  }

  interestSelect.addEventListener("change", function () {
    var opt = interestSelect.selectedOptions[0];
    setInterest({
      interest: interestSelect.value || "",
      tariffPlan: (opt && opt.getAttribute("data-tariff")) || "",
      source: "form",
    });
  });

  var formatSection = document.getElementById(FORMAT_SECTION_ID);
  if (formatSection) {
    document.documentElement.addEventListener(
      "click",
      function (e) {
        var el = e.target;
        if (!(el instanceof Element)) return;
        if (!formatSection.contains(el)) return;
        var interest = null;
        var walk = el;
        while (walk && walk !== formatSection) {
          if (walk.id && FORMAT_CLICK_IDS[walk.id]) {
            interest = FORMAT_CLICK_IDS[walk.id];
            break;
          }
          walk = walk.parentElement;
        }
        if (!interest) return;
        e.preventDefault();
        e.stopPropagation();
        setInterest({ interest: interest, source: "canva_format" });
        interestSelect.dispatchEvent(new Event("change", { bubbles: true }));
        var lead = document.getElementById("lead");
        if (lead) lead.scrollIntoView({ behavior: "smooth", block: "start" });
      },
      true
    );
  }

  function setStatus(t, k) {
    statusEl.textContent = t || "";
    statusEl.className = "zy-form-status" + (k ? " " + k : "");
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    setStatus("Отправляем…");
    var fd = new FormData(form);
    var payload = Object.fromEntries(fd.entries());
    if (!String(payload.interest || "").trim()) {
      setStatus("Выберите формат.", "err");
      return;
    }
    if (location.protocol === "file:") {
      setStatus("Демо без сервера: заявка не уходит, поля только для визуальной проверки.", "ok");
      return;
    }
    try {
      var res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      var data = await res.json().catch(function () {
        return {};
      });
      if (!res.ok) {
        setStatus(data.message || (data.errors ? Object.values(data.errors).join(" · ") : "Ошибка."), "err");
        return;
      }
      form.reset();
      setInterest({ interest: payload.interest, tariffPlan: payload.tariffPlan, source: "lead" });
      setStatus("Готово. Заявка отправлена.", "ok");
    } catch (err) {
      setStatus("Сервер недоступен.", "err");
    }
  });
})();

/** Масштаб фиксированного макета Canva (~1903px) под ширину экрана; только main, блок #lead не трогаем. */
(function () {
  var DESIGN = 1903;
  function run() {
    var mainEl = document.querySelector("main._8OlyIw");
    if (!mainEl) return;
    /* file://: отрицательный margin при scale перекрывает блоки под макетом — формы «пропадают». Масштаб отключаем. */
    if (location.protocol === "file:") {
      mainEl.style.zoom = "";
      mainEl.style.transform = "";
      mainEl.style.transformOrigin = "";
      mainEl.style.width = "";
      mainEl.style.marginBottom = "";
      return;
    }
    function apply() {
      mainEl.style.zoom = "";
      mainEl.style.transform = "";
      mainEl.style.transformOrigin = "";
      mainEl.style.width = "";
      mainEl.style.marginBottom = "";
      var vw = Math.min(document.documentElement.clientWidth || 0, window.innerWidth || 0);
      if (!vw || vw >= DESIGN) return;
      var s = vw / DESIGN;
      try {
        mainEl.style.zoom = 100 * s + "%";
        return;
      } catch (e1) {}
      mainEl.style.transformOrigin = "top left";
      mainEl.style.width = DESIGN + "px";
      mainEl.style.transform = "scale(" + s + ")";
      requestAnimationFrame(function () {
        var h = mainEl.offsetHeight;
        if (h > 0) mainEl.style.marginBottom = -((1 - s) * h) + "px";
      });
    }
    apply();
    window.addEventListener("resize", apply, { passive: true });
    window.addEventListener("orientationchange", apply, { passive: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();
