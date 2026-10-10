(() => {
  "use strict";

  // رقم إدارة وفرلي بليبيا. يُحوَّل تلقائيًا إلى الصيغة الدولية المطلوبة في رابط wa.me.
  const ADMIN_PHONE = "0927772012";
  const LIBYA_COUNTRY_CODE = "218";

  const menuToggle = document.getElementById("menuToggle");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  const navLinks = [...document.querySelectorAll(".nav-link")];
  const toast = document.getElementById("toast");

  function normalizeWhatsAppNumber(raw) {
    let digits = String(raw).replace(/\D/g, "");
    if (digits.startsWith("00")) digits = digits.slice(2);
    if (digits.startsWith(LIBYA_COUNTRY_CODE)) return digits;
    if (digits.startsWith("0")) digits = digits.slice(1);
    return LIBYA_COUNTRY_CODE + digits;
  }

  const adminWhatsApp = normalizeWhatsAppNumber(ADMIN_PHONE);

  function toggleMenu(force) {
    const open = typeof force === "boolean" ? force : !sidebar.classList.contains("open");
    sidebar.classList.toggle("open", open);
    overlay.classList.toggle("visible", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "إغلاق القائمة" : "فتح القائمة");
    document.body.classList.toggle("menu-open", open);
  }

  menuToggle.addEventListener("click", () => toggleMenu());
  overlay.addEventListener("click", () => toggleMenu(false));
  navLinks.forEach(link => link.addEventListener("click", () => {
    navLinks.forEach(item => item.classList.toggle("active", item === link));
    toggleMenu(false);
  }));

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") toggleMenu(false);
  });

  document.getElementById("year").textContent = new Date().getFullYear();

  const generalMessage = "السلام عليكم، أود التواصل مع إدارة تطبيق وفرلي WAFRLI.";
  document.getElementById("generalWhatsApp").href =
    `https://wa.me/${adminWhatsApp}?text=${encodeURIComponent(generalMessage)}`;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    window.setTimeout(() => toast.classList.remove("show"), 4200);
  }

  function normalizeLibyanPhone(value) {
    return value.trim().replace(/[\s().-]/g, "");
  }

  function isValidPhone(value) {
    const phone = normalizeLibyanPhone(value);
    // قبول رقم ليبي محلي يبدأ بـ 09 أو 08 أو صيغة دولية شائعة.
    return /^(?:09\d{8}|08\d{8}|2189\d{8}|2188\d{8}|\+2189\d{8}|\+2188\d{8}|002189\d{8}|002188\d{8})$/.test(phone);
  }

  function openWhatsApp(message) {
    const url = `https://wa.me/${adminWhatsApp}?text=${encodeURIComponent(message)}`;
    const newWindow = window.open(url, "_blank", "noopener,noreferrer");
    if (!newWindow) window.location.href = url;
  }

  function setError(form, message) {
    const error = form.querySelector(".form-error");
    error.textContent = message;
    form.querySelectorAll("input").forEach(input => input.classList.remove("invalid"));
  }

  function setupForm(formId, errorId, handler) {
    const form = document.getElementById(formId);
    const error = document.getElementById(errorId);

    form.querySelectorAll("input").forEach(input => {
      input.addEventListener("input", () => {
        input.classList.remove("invalid");
        error.textContent = "";
      });
    });

    form.addEventListener("submit", event => {
      event.preventDefault();
      error.textContent = "";
      const result = handler(form);
      if (!result.ok) {
        error.textContent = result.message;
        if (result.field) {
          const input = form.querySelector(`[name="${result.field}"]`);
          if (input) {
            input.classList.add("invalid");
            input.focus();
          }
        }
        return;
      }
      openWhatsApp(result.message);
      showToast("تم تجهيز رسالة التسجيل. راجع واتساب واضغط إرسال لإكمال الطلب.");
    });
  }

  setupForm("driverForm", "driverError", form => {
    const name = form.elements.name.value.trim();
    const phone = form.elements.phone.value.trim();
    if (name.length < 3) return {ok: false, message: "يرجى إدخال الاسم الكامل بشكل صحيح.", field: "name"};
    if (!isValidPhone(phone)) return {ok: false, message: "يرجى إدخال رقم هاتف ليبي صحيح، مثل 0912345678.", field: "phone"};
    const message = [
      "طلب تسجيل سائق — تطبيق وفرلي WAFRLI",
      "",
      `الاسم الكامل: ${name}`,
      `رقم الهاتف: ${phone}`,
      "",
      "أرغب في الانضمام إلى فريق سائقي وفرلي. يرجى التواصل معي لمعرفة الخطوات التالية."
    ].join("\n");
    return {ok: true, message};
  });

  setupForm("businessForm", "businessError", form => {
    const owner = form.elements.owner.value.trim();
    const phone = form.elements.phone.value.trim();
    const business = form.elements.business.value.trim();
    if (owner.length < 3) return {ok: false, message: "يرجى إدخال اسم صاحب النشاط أو المسؤول.", field: "owner"};
    if (!isValidPhone(phone)) return {ok: false, message: "يرجى إدخال رقم هاتف ليبي صحيح، مثل 0912345678.", field: "phone"};
    if (business.length < 2) return {ok: false, message: "يرجى إدخال اسم النشاط التجاري.", field: "business"};
    const message = [
      "طلب انضمام نشاط تجاري — تطبيق وفرلي WAFRLI",
      "",
      `اسم صاحب النشاط أو المسؤول: ${owner}`,
      `رقم الهاتف: ${phone}`,
      `اسم النشاط التجاري: ${business}`,
      "",
      "أرغب في الانضمام إلى تطبيق وفرلي. يرجى التواصل معي لاستكمال إجراءات التسجيل ومعرفة الشروط والأحكام."
    ].join("\n");
    return {ok: true, message};
  });

  // يحدّث رابط القسم النشط عند التمرير، مع إبقاء القائمة الجانبية متوافقة مع الأقسام.
  const sections = [...document.querySelectorAll("main section[id]")];
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      navLinks.forEach(link => link.classList.toggle("active", link.getAttribute("href") === `#${visible.target.id}`));
    }, {rootMargin: "-25% 0px -60% 0px", threshold: [0, .15, .35, .6]});
    sections.forEach(section => observer.observe(section));
  }
})();