export function activateTabGroup(sheet, root, { group, navSelector, defaultTab, getPersisted, setPersisted, onActivate, signal }) {
  const nav = root.querySelector(navSelector);
  if (!nav) return;

  const panels = Array.from(root.querySelectorAll(`.tab[data-group="${group}"][data-tab]`));
  const links = Array.from(nav.querySelectorAll(`.hwfwm-tab[data-tab]`));
  if (!panels.length || !links.length) return;

  const activate = (tabName) => {
    setPersisted(tabName);

    for (const p of panels) {
      const isActive = p.dataset.tab === tabName;
      p.classList.toggle("is-active", isActive);
      p.style.display = isActive ? "" : "none";
    }
    for (const a of links) a.classList.toggle("is-active", a.dataset.tab === tabName);

    onActivate?.(tabName);
  };

  const initial =
    getPersisted?.() ||
    links.find((a) => a.classList.contains("is-active"))?.dataset.tab ||
    defaultTab;

  activate(initial);

  nav.addEventListener(
    "click",
    (ev) => {
      const a = ev.target.closest(`.hwfwm-tab[data-tab]`);
      if (!a) return;
      ev.preventDefault();
      activate(a.dataset.tab);
    },
    { signal }
  );
}
