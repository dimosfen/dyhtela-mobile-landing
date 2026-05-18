/**
 * Отзывы: GET/POST /api/reviews (как в tz-json-admin-v2-site10).
 */
(function () {
  var reviewsGrid = document.getElementById("reviewsGrid");
  var reviewForm = document.getElementById("reviewForm");
  var reviewStatus = document.getElementById("reviewStatus");
  if (!reviewsGrid && !reviewForm) return;

  function escapeHtml(v) {
    return String(v || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function setReviewStatus(text, kind) {
    if (!reviewStatus) return;
    reviewStatus.textContent = text || "";
    if (kind === "ok") reviewStatus.style.color = "#2f6a2f";
    else if (kind === "err") reviewStatus.style.color = "#a63333";
    else reviewStatus.style.color = "";
  }

  async function loadReviews() {
    if (!reviewsGrid) return;
    try {
      var res = await fetch("/api/reviews");
      var data = await res.json().catch(function () {
        return {};
      });
      if (!res.ok || !data.ok) return;
      var first = reviewsGrid.querySelector("article");
      var cardClass = first ? first.className : "zy-review-card";
      var dynamic = (data.reviews || [])
        .slice(0, 12)
        .map(function (r) {
          return (
            '<article class="' +
            cardClass +
            '"><blockquote>«' +
            escapeHtml(r.text) +
            '»</blockquote><cite>— ' +
            escapeHtml(r.name) +
            "</cite></article>"
          );
        })
        .join("");
      if (dynamic) reviewsGrid.innerHTML = dynamic;
    } catch (_) {}
  }

  if (reviewForm) {
    reviewForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      setReviewStatus("");
      if (location.protocol === "file:") {
        setReviewStatus("Демо без сервера: отзыв не сохраняется, только проверка полей.", "ok");
        return;
      }
      var fd = new FormData(reviewForm);
      var payload = {
        name: String(fd.get("name") || "").trim(),
        text: String(fd.get("text") || "").trim(),
      };
      try {
        var res = await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        var data = await res.json().catch(function () {
          return {};
        });
        if (res.status === 422 && data.errors) {
          setReviewStatus(data.errors.text || data.errors.name || "Проверьте поля формы.", "err");
          return;
        }
        if (!res.ok) {
          setReviewStatus("Не удалось отправить отзыв.", "err");
          return;
        }
        setReviewStatus("Спасибо! Отзыв добавлен.", "ok");
        reviewForm.reset();
        await loadReviews();
      } catch (_) {
        setReviewStatus("Сеть или сервер недоступны.", "err");
      }
    });
  }

  loadReviews();
})();
