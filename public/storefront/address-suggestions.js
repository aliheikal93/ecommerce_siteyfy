const locationCache = new Map();
let cleanupCheckoutLocations;
const fieldKinds = { province: "regions", city: "cities", district: "districts" };
const fieldLabels = { province: "المنطقة", city: "المدينة", district: "الحي" };

function searchText(value) {
  return String(value || "").trim().toLowerCase().normalize("NFKD")
    .replace(/[\u0300-\u036f\u064b-\u065f\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه")
    .replace(/^(?:منطقه|المنطقه|حي)\s+/, "").replace(/\s+/g, " ");
}
async function loadLocations(params, api) {
  const key = params.toString();
  if (!locationCache.has(key)) {
    if (locationCache.size >= 60) locationCache.delete(locationCache.keys().next().value);
    const pending = api(`/api/store/address/sa/locations?${key}`);
    locationCache.set(key, pending);
    pending.catch(() => { if (locationCache.get(key) === pending) locationCache.delete(key); });
  }
  return locationCache.get(key);
}

export function bindCheckoutLocationSuggestions(form, api) {
  cleanupCheckoutLocations?.();
  if (!form) return;
  const lifecycle = new AbortController(), controls = [];
  cleanupCheckoutLocations = () => { lifecycle.abort(); controls.forEach(control => control.close()); };
  const saudi = () => form.elements.country_code.value === "SA";
  const emit = input => { input.dispatchEvent(new Event("input", { bubbles: true })); input.dispatchEvent(new Event("change", { bubbles: true })); };
  const closeOthers = current => controls.forEach(control => { if (control !== current) control.close(); });
  const invalidateChildren = name => {
    const children = name === "province" ? ["city", "district"] : name === "city" ? ["district"] : [];
    for (const child of children) {
      const input = form.elements[child];
      if (input.value) { input.value = ""; emit(input); }
      controls.find(control => control.input === input)?.close();
    }
  };
  for (const name of Object.keys(fieldKinds)) {
    const input = form.elements[name];
    if (!input) continue;
    input.setAttribute("aria-label", fieldLabels[name]);
    const wrapper = input.closest("label"), id = `checkout-location-${name}`;
    wrapper.classList.add("checkout-location-field");
    const box = document.createElement("div"); box.className = "checkout-location-menu"; box.hidden = true;
    const list = document.createElement("div"); list.id = id; list.setAttribute("role", "listbox"); list.setAttribute("aria-label", `اقتراحات ${fieldLabels[name]}`);
    const status = document.createElement("small"); status.className = "checkout-location-status"; status.setAttribute("role", "status");
    box.append(list, status); wrapper.append(box);
    const originalAutocomplete = input.getAttribute("autocomplete");
    let revision = 0, matches = [], active = -1, previousValue = input.value, composing = false;
    const control = { input, close: () => {
      revision++; box.hidden = true; input.setAttribute("aria-expanded", "false");
      input.removeAttribute("aria-activedescendant"); input.removeAttribute("aria-busy"); active = -1;
    } };
    control.place = () => {
      if (box.hidden) return;
      const rect = wrapper.getBoundingClientRect(), viewport = window.visualViewport;
      const top = viewport?.offsetTop || 0, height = viewport?.height || innerHeight;
      const above = rect.top - top, below = top + height - rect.bottom;
      const flip = below < 180 && above > below;
      box.classList.toggle("is-above", flip);
      list.style.maxHeight = `${Math.max(88, Math.min(236, (flip ? above : below) - 64))}px`;
    };
    window.addEventListener("resize", control.place, { signal: lifecycle.signal });
    window.visualViewport?.addEventListener("resize", control.place, { signal: lifecycle.signal });
    controls.push(control);
    const configure = () => {
      control.close();
      if (saudi()) {
        input.setAttribute("role", "combobox"); input.setAttribute("aria-autocomplete", "list");
        input.setAttribute("aria-controls", id); input.setAttribute("autocomplete", "off");
      } else {
        for (const attr of ["role", "aria-autocomplete", "aria-controls", "aria-expanded"]) input.removeAttribute(attr);
        if (originalAutocomplete) input.setAttribute("autocomplete", originalAutocomplete);
      }
      previousValue = input.value;
    };
    configure(); form.elements.country_code.addEventListener("change", configure, { signal: lifecycle.signal });
    const choose = index => {
      const row = matches[index]; if (!row) return;
      input.value = row.name_ar; emit(input); previousValue = input.value; control.close(); input.focus({ preventScroll: true });
    };
    const highlight = index => {
      active = index;
      [...list.children].forEach((option, i) => option.setAttribute("aria-selected", String(i === active)));
      if (active >= 0) {
        input.setAttribute("aria-activedescendant", `${id}-${active}`);
        const option = list.children[active], top = option.offsetTop, bottom = top + option.offsetHeight;
        if (top < list.scrollTop) list.scrollTop = top;
        else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
      }
      else input.removeAttribute("aria-activedescendant");
    };
    const show = async () => {
      if (!saudi() || composing || !input.value.trim() || document.activeElement !== input || !form.isConnected) { control.close(); return; }
      closeOthers(control); const current = ++revision;
      const params = new URLSearchParams({ kind: fieldKinds[name], v: "20261006" });
      if (name !== "province") params.set("region", form.elements.province.value.trim());
      if (name === "district") params.set("city", form.elements.city.value.trim());
      const query = searchText(input.value); matches = []; active = -1; list.replaceChildren();
      input.removeAttribute("aria-activedescendant"); input.setAttribute("aria-expanded", "true");
      box.hidden = false; status.textContent = "جاري تحميل الاقتراحات…"; input.setAttribute("aria-busy", "true"); control.place();
      try {
        const result = await loadLocations(params, api);
        if (current !== revision || !form.isConnected || document.activeElement !== input || !saudi()) return;
        if (searchText(input.value) !== query || (name !== "province" && params.get("region") !== form.elements.province.value.trim()) ||
          (name === "district" && params.get("city") !== form.elements.city.value.trim())) { control.close(); return; }
        const filtered = result.items.filter(row => [row.name_ar, row.name_en].some(value => searchText(value).includes(query)))
          .sort((a, b) => Number(searchText(b.name_ar).startsWith(query)) - Number(searchText(a.name_ar).startsWith(query)));
        matches = filtered.slice(0, 12);
        list.replaceChildren(...matches.map((row, index) => {
          const option = document.createElement("button"); option.type = "button"; option.tabIndex = -1; option.id = `${id}-${index}`;
          option.setAttribute("role", "option"); option.setAttribute("aria-selected", "false"); option.textContent = row.name_ar;
          option.addEventListener("pointerdown", event => event.preventDefault());
          option.addEventListener("click", event => { event.preventDefault(); choose(index); }); return option;
        }));
        status.textContent = result.required_parent === "province" ? "اختاري المنطقة أولًا لعرض المدن التابعة لها." :
          result.required_parent === "city" ? "اختاري المدينة أولًا لعرض الأحياء التابعة لها." : !matches.length ?
          "لا يوجد اقتراح مطابق؛ يمكنك كتابة العنوان يدويًا." : name === "city" ? `مدن ${result.parent.region}` : name === "district" ? `أحياء ${result.parent.city}` : "مناطق المملكة العربية السعودية";
        if (filtered.length > 12) status.textContent += " · اكتبي المزيد لتضييق الاقتراحات.";
        control.place();
      } catch {
        if (current === revision) status.textContent = "تعذر تحميل الاقتراحات؛ يمكنك كتابة العنوان يدويًا.";
      } finally { if (current === revision) input.removeAttribute("aria-busy"); }
    };
    input.addEventListener("input", () => {
      if (saudi() && previousValue !== input.value) invalidateChildren(name);
      previousValue = input.value; show();
    }, { signal: lifecycle.signal });
    input.addEventListener("focus", show, { signal: lifecycle.signal });
    input.addEventListener("compositionstart", () => { composing = true; control.close(); }, { signal: lifecycle.signal });
    input.addEventListener("compositionend", () => { composing = false; show(); }, { signal: lifecycle.signal });
    input.addEventListener("keydown", event => {
      if (!saudi() || composing) return;
      if (event.key === "Escape") { control.close(); return; }
      if (event.key === "Tab") { control.close(); return; }
      if (["ArrowDown", "ArrowUp"].includes(event.key)) {
        event.preventDefault(); if (box.hidden) { show(); return; }
        if (matches.length) highlight(active < 0 ? event.key === "ArrowDown" ? 0 : matches.length - 1 : (active + (event.key === "ArrowDown" ? 1 : -1) + matches.length) % matches.length);
      } else if (event.key === "Enter" && !box.hidden && matches.length) {
        event.preventDefault(); choose(active >= 0 ? active : 0);
      }
    }, { signal: lifecycle.signal });
    input.addEventListener("blur", control.close, { signal: lifecycle.signal });
    // Autofill/saved-address/draft restoration changes values programmatically without clearing children.
    form.addEventListener("change", event => {
      if (!event.target.name || event.target.name === "address_id") control.close();
      if (document.activeElement !== input) previousValue = input.value;
    }, { signal: lifecycle.signal });
  }
  document.addEventListener("pointerdown", event => {
    if (!form.isConnected) { cleanupCheckoutLocations?.(); return; }
    controls.forEach(control => { if (!control.input.closest("label").contains(event.target)) control.close(); });
  }, { signal: lifecycle.signal });
}
