(() => {
  "use strict";

  const RESERVED = new Set([
    "home", "explore", "notifications", "messages", "i", "settings", "search", "compose",
    "login", "logout", "signup", "tos", "privacy", "about", "jobs", "help", "share"
  ]);
  const notes = new Map();
  const tooltip = document.createElement("div");
  tooltip.className = "xpn-tooltip";
  document.documentElement.appendChild(tooltip);

  const normalize = value => String(value || "").replace(/^@/, "").trim().toLowerCase();
  const validHandle = value => /^[a-z0-9_]{1,15}$/i.test(value) && !RESERVED.has(value.toLowerCase());

  function handleFromHref(href) {
    try {
      const url = new URL(href, location.origin);
      if (!/^(x|twitter)\.com$/i.test(url.hostname)) return null;
      const parts = url.pathname.split("/").filter(Boolean);
      return parts.length === 1 && validHandle(parts[0]) ? parts[0] : null;
    } catch { return null; }
  }

  async function loadNotes() {
    const data = await chrome.storage.local.get("profileNotes");
    notes.clear();
    Object.entries(data.profileNotes || {}).forEach(([key, value]) => notes.set(key, value));
    refreshBadges();
  }

  async function writeNote(handle, note, tags) {
    const key = normalize(handle);
    const data = await chrome.storage.local.get("profileNotes");
    const all = data.profileNotes || {};
    if (!note.trim() && !tags.trim()) delete all[key];
    else all[key] = {
      handle: handle.replace(/^@/, ""), note: note.trim(),
      tags: tags.split(",").map(tag => tag.trim()).filter(Boolean),
      updatedAt: new Date().toISOString(), createdAt: all[key]?.createdAt || new Date().toISOString()
    };
    await chrome.storage.local.set({ profileNotes: all });
    await loadNotes();
  }

  function refreshBadges() {
    document.querySelectorAll(".xpn-button, .xpn-profile-button").forEach(button => {
      const hasNote = notes.has(normalize(button.dataset.handle));
      button.dataset.hasNote = String(hasNote);
      button.title = hasNote ? "View or edit private note" : "Add private note";
      if (button.classList.contains("xpn-profile-button")) {
        button.querySelector("span:last-child").textContent = hasNote ? "View private note" : "Add private note";
      }
    });
  }

  function currentProfileHandle() {
    const parts = location.pathname.split("/").filter(Boolean);
    return parts.length === 1 && validHandle(parts[0]) ? parts[0] : null;
  }

  function decorateProfilePage() {
    const handle = currentProfileHandle();
    const existing = document.querySelector(".xpn-profile-button");
    if (!handle) { existing?.remove(); return; }
    if (existing?.dataset.handle?.toLowerCase() === handle.toLowerCase()) return;
    existing?.remove();
    const usernameBlock = document.querySelector('[data-testid="UserName"]');
    if (!usernameBlock) return;
    const button = document.createElement("button");
    button.className = "xpn-profile-button";
    button.type = "button";
    button.dataset.handle = handle;
    button.dataset.hasNote = String(notes.has(normalize(handle)));
    button.innerHTML = '<span class="xpn-profile-pencil" aria-hidden="true">✎</span><span></span>';
    button.querySelector("span:last-child").textContent = notes.has(normalize(handle)) ? "View private note" : "Add private note";
    button.addEventListener("click", event => { event.preventDefault(); event.stopPropagation(); openEditor(handle); });
    usernameBlock.appendChild(button);
  }

  function showTooltip(button) {
    const item = notes.get(normalize(button.dataset.handle));
    if (!item) return;
    tooltip.replaceChildren();
    const title = document.createElement("strong");
    title.textContent = `@${item.handle}`;
    const body = document.createElement("span");
    body.textContent = [item.note, item.tags?.length ? `Tags: ${item.tags.join(", ")}` : ""].filter(Boolean).join("\n\n");
    tooltip.append(title, body);
    tooltip.style.display = "block";
    const rect = button.getBoundingClientRect();
    const width = Math.min(320, innerWidth - 24);
    tooltip.style.maxWidth = `${width}px`;
    tooltip.style.left = `${Math.max(12, Math.min(rect.left, innerWidth - width - 12))}px`;
    tooltip.style.top = `${Math.min(rect.bottom + 8, innerHeight - tooltip.offsetHeight - 12)}px`;
  }

  function hideTooltip() { tooltip.style.display = "none"; }

  function openEditor(handle) {
    hideTooltip();
    const key = normalize(handle);
    const item = notes.get(key) || { note: "", tags: [] };
    const overlay = document.createElement("div");
    overlay.className = "xpn-overlay";
    overlay.innerHTML = `
      <form class="xpn-dialog">
        <h2>Private profile note</h2>
        <div class="xpn-sub"></div>
        <label for="xpn-note">What should you remember?</label>
        <textarea id="xpn-note" maxlength="5000" placeholder="Where you met, what they do, follow-up ideas..."></textarea>
        <label for="xpn-tags">Tags</label>
        <input id="xpn-tags" maxlength="500" placeholder="AI, investor, met on Space">
        <div class="xpn-error" hidden></div>
        <div class="xpn-actions">
          <button class="xpn-delete" type="button">Delete</button>
          <button class="xpn-cancel" type="button">Cancel</button>
          <button class="xpn-save" type="submit">Save note</button>
        </div>
      </form>`;
    overlay.querySelector(".xpn-sub").textContent = `@${handle.replace(/^@/, "")}`;
    overlay.querySelector("#xpn-note").value = item.note || "";
    overlay.querySelector("#xpn-tags").value = (item.tags || []).join(", ");
    overlay.querySelector(".xpn-delete").hidden = !notes.has(key);
    const showContextError = () => {
      const error = overlay.querySelector(".xpn-error");
      error.textContent = "The extension was updated while this X tab was open. Refresh this page, then save the note again.";
      error.hidden = false;
    };
    const close = () => overlay.remove();
    overlay.addEventListener("click", event => { if (event.target === overlay) close(); });
    overlay.querySelector(".xpn-cancel").addEventListener("click", close);
    overlay.querySelector(".xpn-delete").addEventListener("click", async () => {
      try { await writeNote(handle, "", ""); close(); }
      catch { showContextError(); }
    });
    overlay.querySelector("form").addEventListener("submit", async event => {
      event.preventDefault();
      try {
        await writeNote(handle, overlay.querySelector("#xpn-note").value, overlay.querySelector("#xpn-tags").value);
        close();
      } catch { showContextError(); }
    });
    document.body.appendChild(overlay);
    setTimeout(() => overlay.querySelector("#xpn-note").focus(), 0);
  }

  function decorate(root = document) {
    decorateProfilePage();
    root.querySelectorAll?.('a[href]').forEach(anchor => {
      const handle = handleFromHref(anchor.href);
      if (!handle) return;
      const visibleText = anchor.innerText || anchor.textContent || "";
      const includesHandle = visibleText.toLowerCase().includes(`@${handle.toLowerCase()}`);
      if (!includesHandle && !anchor.closest('[data-testid="UserCell"]')) return;
      if (anchor.parentElement?.querySelector(`.xpn-button[data-handle="${CSS.escape(handle)}"]`)) return;
      const button = document.createElement("button");
      button.className = "xpn-button";
      button.type = "button";
      button.dataset.handle = handle;
      button.dataset.hasNote = String(notes.has(normalize(handle)));
      button.setAttribute("aria-label", `Private note for @${handle}`);
      button.textContent = "✎";
      button.addEventListener("click", event => { event.preventDefault(); event.stopPropagation(); openEditor(handle); });
      button.addEventListener("mouseenter", () => showTooltip(button));
      button.addEventListener("mouseleave", hideTooltip);
      anchor.insertAdjacentElement("afterend", button);
    });
  }

  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; decorate(); });
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  chrome.storage.onChanged.addListener((changes, area) => { if (area === "local" && changes.profileNotes) loadNotes(); });
  loadNotes().then(() => decorate()).catch(() => {});
})();
