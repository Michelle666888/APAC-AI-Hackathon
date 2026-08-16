const CONFIG = {
  registrationUrl: "https://forms.cloud.microsoft/e/7r0QrYmh4b",
  registrationDeadline: "2026-09-18T23:59:59+08:00",
};

const stages = {
  masterclass: {
    number: "01",
    label: "Learn · Practise · Prepare",
    title: "One-day AI Masterclass",
    description:
      "Delivered by AWS in English with a strong focus on hands-on experience. The live session is open to all Hackathon teams, and the recording will be available to all employees after the training.",
    points: ["15 September · 09:00–16:00 GMT+8", "Delivered by AWS in English", "Recording available to all employees after the session"],
    agendaUrl: "assets/amazon-quick-one-day-mastery-agenda.pdf",
  },
  registration: {
    number: "02",
    label: "Form your team",
    title: "Registration closes",
    description:
      "Bring together 2–6 colleagues around a real Operations challenge. Cross-function, cross-country, and cross-site collaboration is strongly encouraged.",
    points: ["Deadline: 18 September 2026", "Recommended team size: 2–6", "At least one team expected from each site"],
  },
  round1: {
    number: "03",
    label: "Re-imagine the business",
    title: "Round 1 · Opportunity identification",
    description:
      "Define the business opportunity and articulate the challenge, expected value, and solution direction using the standard submission template provided after kick-off.",
    points: ["No demo or prototype required", "Focus on business value", "21 September–2 October"],
  },
  round2: {
    number: "04",
    label: "Build · Test · Demonstrate",
    title: "Round 2 · Prototype",
    description:
      "Selected teams move into an intensive build period with external technical support and deliver a tangible demo or prototype. Advancement criteria are being finalised.",
    points: ["Demo or prototype expected", "External technical support", "7–17 October"],
  },
};

const updateJourney = (key) => {
  const stage = stages[key];
  if (!stage) return;
  document.querySelectorAll(".journey-node").forEach((node) => {
    const selected = node.dataset.stage === key;
    node.classList.toggle("active", selected);
    node.setAttribute("aria-selected", String(selected));
  });
  document.getElementById("stage-label").textContent = stage.label;
  document.getElementById("stage-title").textContent = stage.title;
  document.getElementById("stage-description").textContent = stage.description;
  document.getElementById("stage-number").textContent = stage.number;
  const stageLink = document.getElementById("stage-link");
  if (stage.agendaUrl) {
    stageLink.href = stage.agendaUrl;
    stageLink.hidden = false;
  } else {
    stageLink.hidden = true;
  }
  document.getElementById("stage-points").replaceChildren(
    ...stage.points.map((point) => {
      const item = document.createElement("li");
      item.textContent = point;
      return item;
    }),
  );
  refreshJourneyEditorKeys();
};

document.querySelectorAll(".journey-node").forEach((node) => {
  node.addEventListener("click", () => updateJourney(node.dataset.stage));
  node.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    const nodes = [...document.querySelectorAll(".journey-node")];
    const currentIndex = nodes.indexOf(node);
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const next = nodes[(currentIndex + direction + nodes.length) % nodes.length];
    next.focus();
    updateJourney(next.dataset.stage);
  });
});

const revealObserver = new IntersectionObserver(
  (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("visible")),
  { threshold: 0.12 },
);
document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      document.getElementById("current-section").textContent = entry.target.dataset.section;
      document.querySelectorAll("[data-section-link]").forEach((link) => {
        link.classList.toggle("active", link.dataset.sectionLink === id);
      });
    });
  },
  { rootMargin: "-35% 0px -55%", threshold: 0 },
);
document.querySelectorAll("[data-section]").forEach((section) => sectionObserver.observe(section));

const updateScrollProgress = () => {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
  document.getElementById("scroll-progress-bar").style.width = `${progress}%`;
};
window.addEventListener("scroll", updateScrollProgress, { passive: true });
updateScrollProgress();

const updateCountdown = () => {
  const deadline = new Date(CONFIG.registrationDeadline);
  const delta = deadline - new Date();
  const days = Math.max(0, Math.ceil(delta / 86400000));
  document.getElementById("days-left").textContent = String(days).padStart(2, "0");
  document.getElementById("days-label").textContent = delta > 0 ? "days left" : "registration closed";
};
updateCountdown();

const registrationButton = document.getElementById("registration-button");
if (CONFIG.registrationUrl) {
  registrationButton.disabled = false;
  registrationButton.textContent = "Open registration form";
  registrationButton.addEventListener("click", () => window.open(CONFIG.registrationUrl, "_blank", "noopener"));
}

document.getElementById("copy-page-link").addEventListener("click", async () => {
  const status = document.getElementById("copy-status");
  try {
    await navigator.clipboard.writeText(window.location.href);
    status.textContent = "Page link copied";
  } catch {
    status.textContent = "Copy unavailable—use the browser address bar";
  }
  window.setTimeout(() => (status.textContent = ""), 2500);
});

const EDITOR_STORAGE_KEY = "apac-ai-hackathon-page-draft-v1";
const EDITABLE_SELECTOR = "h1, h2, h3, p, li, figcaption, summary, a, button, strong, span";
const EDITOR_PROTECTED_SELECTOR = [
  "[data-editor-ui]",
  ".ambient",
  ".brand-mark",
  ".count-rule",
  ".scroll-progress",
  "#current-section",
  "#days-left",
  "#days-label",
  "#copy-status",
].join(", ");

const editorState = {
  active: false,
  dirty: false,
  changes: {},
};

const loadEditorDraft = () => {
  try {
    const stored = window.localStorage.getItem(EDITOR_STORAGE_KEY);
    editorState.changes = stored ? JSON.parse(stored) : {};
  } catch {
    editorState.changes = {};
  }
};

const getElementPath = (element) => {
  const parts = [];
  let current = element;
  while (current && current !== document.body) {
    const tag = current.tagName.toLowerCase();
    const siblings = current.parentElement
      ? [...current.parentElement.children].filter((sibling) => sibling.tagName === current.tagName)
      : [];
    const index = Math.max(1, siblings.indexOf(current) + 1);
    parts.unshift(`${tag}:nth-of-type(${index})`);
    current = current.parentElement;
  }
  return parts.join(" > ");
};

const getEditorId = (element) => {
  const path = getElementPath(element);
  if (!element.closest("#journey-detail")) return path;
  const activeStage = document.querySelector(".journey-node.active")?.dataset.stage || "masterclass";
  return `journey:${activeStage}:${path}`;
};

const isEditableText = (element) => {
  if (!element.matches(EDITABLE_SELECTOR)) return false;
  if (element.matches(EDITOR_PROTECTED_SELECTOR) || element.closest(EDITOR_PROTECTED_SELECTOR)) return false;
  if (element.matches(".journey-node")) return false;
  if (!element.textContent.trim()) return false;
  return !element.parentElement?.closest("[data-editor-id]");
};

const applySavedValue = (element, id) => {
  if (!Object.prototype.hasOwnProperty.call(editorState.changes, id)) return;
  if (element.innerHTML !== editorState.changes[id]) element.innerHTML = editorState.changes[id];
};

const decorateEditableElements = (root = document) => {
  root.querySelectorAll(EDITABLE_SELECTOR).forEach((element) => {
    if (!isEditableText(element)) return;
    const id = getEditorId(element);
    element.dataset.editorId = id;
    applySavedValue(element, id);
    if (editorState.active) {
      element.setAttribute("contenteditable", "true");
      element.setAttribute("spellcheck", "true");
    }
  });
};

function refreshJourneyEditorKeys() {
  const detail = document.getElementById("journey-detail");
  if (!detail || typeof editorState === "undefined") return;
  detail.querySelectorAll("[data-editor-id]").forEach((element) => {
    element.removeAttribute("data-editor-id");
    element.removeAttribute("contenteditable");
    element.removeAttribute("spellcheck");
  });
  decorateEditableElements(detail);
}

const createEditorToolbar = () => {
  const toolbar = document.createElement("aside");
  toolbar.className = "editor-toolbar";
  toolbar.dataset.editorUi = "true";
  toolbar.setAttribute("aria-label", "Page editing controls");
  toolbar.innerHTML = `
    <button class="editor-toggle" id="editor-toggle" type="button" aria-pressed="false">
      <span class="editor-toggle-dot" aria-hidden="true"></span>
      <span class="editor-toggle-label">Edit page</span>
    </button>
    <div class="editor-panel" id="editor-panel" hidden>
      <p>Click any highlighted text to edit it.</p>
      <div class="editor-actions">
        <button type="button" id="editor-save">Save draft</button>
        <button type="button" id="editor-export">Export HTML</button>
        <button type="button" id="editor-reset" class="editor-reset">Reset</button>
      </div>
      <span class="editor-status" id="editor-status" role="status" aria-live="polite"></span>
    </div>
  `;
  document.body.append(toolbar);
  return toolbar;
};

const setEditorStatus = (message, isError = false) => {
  const status = document.getElementById("editor-status");
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("error", isError);
};

const setEditorMode = (active) => {
  editorState.active = active;
  document.body.classList.toggle("editor-enabled", active);
  document.querySelectorAll("[data-editor-id]").forEach((element) => {
    if (active) {
      element.setAttribute("contenteditable", "true");
      element.setAttribute("spellcheck", "true");
    } else {
      element.removeAttribute("contenteditable");
      element.removeAttribute("spellcheck");
    }
  });
  if (active) document.querySelectorAll("details").forEach((details) => (details.open = true));

  const toggle = document.getElementById("editor-toggle");
  const panel = document.getElementById("editor-panel");
  toggle.setAttribute("aria-pressed", String(active));
  toggle.querySelector(".editor-toggle-label").textContent = active ? "Editing on" : "Edit page";
  panel.hidden = !active;
  setEditorStatus(active ? "Edits stay on this device until you export the page." : "");
};

const saveEditorDraft = () => {
  try {
    window.localStorage.setItem(EDITOR_STORAGE_KEY, JSON.stringify(editorState.changes));
    editorState.dirty = false;
    setEditorStatus("Draft saved on this device.");
  } catch {
    setEditorStatus("Local saving is unavailable. Please use Export HTML.", true);
  }
};

const getExportHtml = () => {
  const clone = document.documentElement.cloneNode(true);
  clone.querySelectorAll("[data-editor-ui]").forEach((element) => element.remove());
  clone.querySelectorAll("[data-editor-id]").forEach((element) => {
    element.removeAttribute("data-editor-id");
    element.removeAttribute("contenteditable");
    element.removeAttribute("spellcheck");
  });
  clone.querySelector("body")?.classList.remove("editor-enabled");
  return `<!doctype html>\n${clone.outerHTML}`;
};

const exportEditedHtml = async () => {
  const html = getExportHtml();
  const filename = `apac-ai-hackathon-edited-${new Date().toISOString().slice(0, 10)}.html`;
  try {
    if ("showSaveFilePicker" in window) {
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [{ description: "HTML document", accept: { "text/html": [".html"] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(html);
      await writable.close();
    } else {
      const blobUrl = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
      const download = document.createElement("a");
      download.href = blobUrl;
      download.download = filename;
      download.click();
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    }
    editorState.dirty = false;
    setEditorStatus("HTML exported. Keep it beside styles.css, script.js and the assets folder.");
  } catch (error) {
    if (error?.name === "AbortError") {
      setEditorStatus("Export cancelled.");
    } else {
      setEditorStatus("The HTML could not be exported. Please try again.", true);
    }
  }
};

const resetEditorDraft = () => {
  if (!window.confirm("Discard all saved text edits and restore the original page?")) return;
  try {
    window.localStorage.removeItem(EDITOR_STORAGE_KEY);
  } catch {
    // Reloading still restores the source HTML when browser storage is unavailable.
  }
  window.location.reload();
};

loadEditorDraft();
createEditorToolbar();
decorateEditableElements();

document.getElementById("editor-toggle").addEventListener("click", () => setEditorMode(!editorState.active));
document.getElementById("editor-save").addEventListener("click", saveEditorDraft);
document.getElementById("editor-export").addEventListener("click", exportEditedHtml);
document.getElementById("editor-reset").addEventListener("click", resetEditorDraft);

document.addEventListener(
  "click",
  (event) => {
    if (!editorState.active || event.target.closest("[data-editor-ui]")) return;
    const editable = event.target.closest("[data-editor-id]");
    const journeyControl = event.target.closest(".journey-node");
    if (!editable && !journeyControl) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    editable?.focus();
  },
  true,
);

document.addEventListener("input", (event) => {
  const editable = event.target.closest?.("[data-editor-id]");
  if (!editorState.active || !editable) return;
  editorState.changes[editable.dataset.editorId] = editable.innerHTML;
  editorState.dirty = true;
  setEditorStatus("Unsaved changes");
});

document.addEventListener("paste", (event) => {
  const editable = event.target.closest?.("[data-editor-id]");
  if (!editorState.active || !editable) return;
  event.preventDefault();
  document.execCommand("insertText", false, event.clipboardData.getData("text/plain"));
});

document.addEventListener("keydown", (event) => {
  if (!editorState.active) return;
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
    event.preventDefault();
    saveEditorDraft();
  }
  if (event.key === "Escape") setEditorMode(false);
});

const editorMutationObserver = new MutationObserver((mutations) => {
  if (!mutations.some((mutation) => mutation.type === "childList" && mutation.addedNodes.length)) return;
  decorateEditableElements();
});
editorMutationObserver.observe(document.getElementById("main"), { childList: true, subtree: true });
