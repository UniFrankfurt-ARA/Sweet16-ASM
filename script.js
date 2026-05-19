"use strict";

const $ = (id) => document.getElementById(id);
const t = (key, params) => (typeof window.t === "function" ? window.t(key, params) : key);

/* -----------------------------
   applyTranslations — updates all UI text for current language
--------------------------------*/
window.applyTranslations = function() {
  const lang = typeof window.getCurrentLang === "function" ? window.getCurrentLang() : "en";
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (key) el.textContent = t(key);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (key) el.placeholder = t(key);
  });
  document.querySelectorAll("[data-i18n-attr]").forEach(el => {
    const val = el.getAttribute("data-i18n-attr");
    if (val) {
      const [attr, key] = val.split(":");
      if (attr && key) el.setAttribute(attr.trim(), t(key.trim()));
    }
  });
  if (document.title) document.title = t("app.title");
  const activeInfoTab = document.querySelector("#tabPrograms.viewer-tab.active, #tabInstructions.viewer-tab.active, #tabAliases.viewer-tab.active, #tabManual.viewer-tab.active");
  if (activeInfoTab) {
    if (activeInfoTab.id === "tabPrograms") loadSamplePrograms();
    else if (activeInfoTab.id === "tabInstructions") loadInstructionSet();
    else if (activeInfoTab.id === "tabAliases") loadAliases();
    else if (activeInfoTab.id === "tabManual") loadManualContent();
  }
  if (typeof window.refreshSimulatorLabels === "function") window.refreshSimulatorLabels();
};

function loadManualContent() {
  const tc = $("tabContent");
  if (!tc) return;
  const manual = t("manual");
  const formatted = manual
    .replace(/## (.*?)\n/g, "<h2>$1</h2>\n")
    .replace(/# (.*?)\n/g, "<h1>$1</h1>\n")
    .replace(/\n/g, "<br>");
  tc.innerHTML = formatted ? `<div class="user-manual-content">${formatted}</div>` : `<p>${t("msg.manualNotLoaded")}</p>`;
}

/* -----------------------------
   Toast notification
--------------------------------*/
window.showToast = function(message, duration = 4000) {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("toast-visible"));
  setTimeout(() => {
    toast.classList.remove("toast-visible");
    toast.addEventListener("transitionend", () => toast.remove(), { once: true });
  }, duration);
};

/* -----------------------------
   Visual helpers (kept as-is)
--------------------------------*/
function flashElement(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.classList.remove("highlight-flash");
  void el.offsetWidth; // restart CSS animation
  el.classList.add("highlight-flash");
}

function flashButton(buttonId) {
  const btn = document.getElementById(buttonId);
  if (!btn) return;
  btn.classList.add("highlight-flash");
  setTimeout(() => btn.classList.remove("highlight-flash"), 5000);
}

function disableConvertButton() {
  const btn = document.getElementById("Convert");
  if (!btn) return;
  btn.disabled = true;
  btn.innerText = t("btn.converted");
  // Do not flash RUN_NEXT so it stays full brightness after Convert
}

function requireReconvertAfterAsmChange() {
  const btnConvert = document.getElementById("Convert");
  const btnRunNext = document.getElementById("RUN_NEXT");
  const btnRunAll = document.getElementById("RUN_ALL");
  const btnReset = document.getElementById("RESET");
  if (!btnConvert) return;

  const hadRunnableProgram =
    btnConvert.style.display === "none" ||
    (btnRunNext && btnRunNext.style.display !== "none") ||
    (btnRunAll && btnRunAll.style.display !== "none");
  if (!hadRunnableProgram) return;

  // Stop any active loop so old code cannot continue running.
  if (typeof window.isRunAllActive === "function" && window.isRunAllActive()) {
    if (typeof window.pauseRunAll === "function") window.pauseRunAll();
  }

  btnConvert.style.display = "inline-block";
  btnConvert.disabled = false;
  btnConvert.innerText = t("btn.convert");

  if (btnRunNext) btnRunNext.style.display = "none";
  if (btnRunAll) btnRunAll.style.display = "none";
  if (btnReset) btnReset.style.display = "none";

  if (typeof window.resetRunButtonLabels === "function") window.resetRunButtonLabels();

  const sourceIndicator = document.getElementById("sourceLineIndicator");
  if (sourceIndicator) sourceIndicator.classList.add("hidden");
}

/* -----------------------------
   Tiny helpers
--------------------------------*/

/* -----------------------------
   RESET: preserve ASM across reload (unless user confirms delete)
--------------------------------*/
const S16_KEEP = "s16-asm-keep";
const S16_TEXT = "s16-asm-text";
const S16_CLEARED = "s16-asm-cleared";
function getAsmEl() { return $("InputASM"); }
function readAsm()   { return (getAsmEl()?.value ?? ""); }
function writeAsm(t) { const el = getAsmEl(); if (el) el.value = t; }


/* -----------------------------
   Content loaders
--------------------------------*/
function loadSamplePrograms() {
  const tabContent = $("tabContent");
  if (!tabContent) return;
  const data = window.samplePrograms || [];
  tabContent.innerHTML = data.map((program, index) => {
    const name = t(`samplePrograms.p${index}`, {}) || program.name;
    return `
    <div class="sample-program-block">
      <h3>${name}</h3>
      <pre><code>${program.code.trim()}</code></pre>
      <button type="button" class="add-program-btn use-instr-btn" data-program-index="${index}">${t("btn.add")}</button>
      <hr>
    </div>
  `;
  }).join("");
}

function loadInstructionSet() {
  const tabContent = $("tabContent");
  if (!tabContent) return;
  const data = window.sampleInstructions || [];
  const sorted = [...data].sort((a, b) => (a?.name ?? "").localeCompare((b?.name ?? ""), undefined, { sensitivity: "base" }));
  const escapeAttr = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  const desc = (inst) => t(`instrDesc.${inst.name}`, {}) || inst.description;
  tabContent.innerHTML = `<div class="instruction-set-content">
    <p class="instruction-legend"><strong>Notation:</strong> Rs = Source register, Rd = Destination register</p>
    ${sorted.map(instruction => `
    <div class="instr-block">
      <h3>${instruction.name}</h3>
      <p><strong>${t("instr.syntax")}:</strong> <code>${instruction.syntax}</code></p>
      <p><strong>${t("instr.description")}:</strong> ${desc(instruction)}</p>
      <pre><code>${instruction.example}</code></pre>
      ${instruction.useLine != null ? `<button type="button" class="use-instr-btn" data-use-line="${escapeAttr(instruction.useLine)}">${t("instr.use")}</button>` : ""}
    </div>
  `).join("")}</div>`;
}

function loadAliases() {
  const tabContent = $("tabContent");
  if (!tabContent) return;
  const data = window.sampleAliases || [];

  // Group by category
  const groups = {};
  data.forEach(a => {
    const cat = a.category || "General";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(a);
  });

  const escCode = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const escAttr = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;");

  const catName = (c) => t(`aliasCategory.${c}`, {}) || c;
  const aliasDesc = (a) => t(`aliasDesc.${a.name}`, {}) || a.description;
  tabContent.innerHTML = Object.entries(groups).map(([cat, aliases]) => `
    <div class="alias-group">
      <h2 class="alias-group-title">${catName(cat)}</h2>
      ${aliases.map(a => `
        <div class="alias-block">
          <div class="alias-header">
            <span class="alias-name">${escCode(a.name)}</span>
            <span class="alias-flags">${escCode(a.flags)}</span>
          </div>
          <pre class="alias-def"><code>${escCode(a.def)}</code></pre>
          <p class="alias-desc">${escCode(aliasDesc(a))}</p>
          <div class="alias-footer">
            <span class="alias-use-label">${t("alias.usage")}:</span>
            <pre class="alias-use"><code>${escCode(a.use)}</code></pre>
            <button type="button" class="use-instr-btn alias-use-btn"
              data-use-line="${escAttr(a.def + "\n" + a.use)}">${t("instr.use")}</button>
          </div>
        </div>
      `).join("")}
    </div>
  `).join("");
}

/* -----------------------------
   RESET dialog (Keep / Clear)
--------------------------------*/
function showResetDialog({ onKeep, onClear }) {
  // Avoid duplicates
  const existing = document.getElementById("s16-reset-overlay");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "s16-reset-overlay";
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.background = "rgba(0,0,0,0.45)";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.zIndex = "9999";

  const modal = document.createElement("div");
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.style.width = "min(520px, calc(100vw - 32px))";
  modal.style.background = "#fff";
  modal.style.borderRadius = "12px";
  modal.style.boxShadow = "0 10px 30px rgba(0,0,0,0.25)";
  modal.style.padding = "16px";

  const title = document.createElement("div");
  title.textContent = t("modal.resetTitle");
  title.style.fontWeight = "700";
  title.style.fontSize = "1.1rem";
  title.style.marginBottom = "8px";

  const body = document.createElement("div");
  body.textContent = t("modal.resetBody");
  body.style.marginBottom = "14px";

  const btnRow = document.createElement("div");
  btnRow.style.display = "flex";
  btnRow.style.gap = "10px";
  btnRow.style.justifyContent = "flex-end";

  const btnClear = document.createElement("button");
  btnClear.type = "button";
  btnClear.className = "primary-btn";
  btnClear.textContent = t("modal.clearCode");
  btnClear.style.backgroundColor = "#6c757d";
  // Override global button CSS inside modal
  btnClear.style.width = "auto";
  btnClear.style.maxWidth = "none";
  btnClear.style.margin = "0";
  btnClear.style.display = "inline-flex";
  btnClear.style.justifyContent = "center";
  btnClear.style.alignItems = "center";
  btnClear.style.padding = "10px 14px";

  const btnKeep = document.createElement("button");
  btnKeep.type = "button";
  btnKeep.className = "primary-btn";
  btnKeep.textContent = t("modal.keepCode");
  // Override global button CSS inside modal
  btnKeep.style.width = "auto";
  btnKeep.style.maxWidth = "none";
  btnKeep.style.margin = "0";
  btnKeep.style.display = "inline-flex";
  btnKeep.style.justifyContent = "center";
  btnKeep.style.alignItems = "center";
  btnKeep.style.padding = "10px 14px";

  function close() {
    overlay.remove();
    document.removeEventListener("keydown", onKeyDown, true);
  }

  function onKeyDown(e) {
    if (e.key === "Escape") {
      // Default action: keep
      e.preventDefault();
      close();
      onKeep?.();
    }
    if (e.key === "Enter") {
      // Default action: keep
      e.preventDefault();
      close();
      onKeep?.();
    }
  }

  btnKeep.addEventListener("click", () => {
    close();
    onKeep?.();
  });
  btnClear.addEventListener("click", () => {
    close();
    onClear?.();
  });

  // Clicking outside the modal = keep (default)
  overlay.addEventListener("click", (e) => {
    if (e.target !== overlay) return;
    close();
    onKeep?.();
  });

  btnRow.appendChild(btnClear);
  btnRow.appendChild(btnKeep);
  modal.appendChild(title);
  modal.appendChild(body);
  modal.appendChild(btnRow);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  document.addEventListener("keydown", onKeyDown, true);
  btnKeep.focus();
}

/* -----------------------------
   Machine code encoder (index2 philosophy: 16-bit hex per instruction)
   List 0 only: NOT, XOR, OR, AND, ROL, ROR, SBB, ADC, LDL, LDH, STO, STR, LDD, JZ, JC, JMP, BRA, HLT
--------------------------------*/
function encodeProgramToHex(program) {
  if (!program || program.length === 0) return "";
  const header = "v2.0 raw";
  const toHex = (w) => "0x" + (w & 0xffff).toString(16).toUpperCase().padStart(4, "0");
  const OP5_ALU3 = { XOR: 0b00001, OR: 0b00010, AND: 0b00011, SBB: 0b10110, ADC: 0b10111 };
  const OP5_ROTN = { NOT: 0b00000, ROL: 0b10100, ROR: 0b10101 };
  const OP5_JUMP = { JZ: 0b01100, JC: 0b01101, JMP: 0b11110 };
  function encALU3(op, rd, rs, rt) {
    const opCode = OP5_ALU3[op];
    let w = (opCode << 11);
    w |= ((rd >> 3) & 1) << 15;
    w |= ((rs >> 3) & 1) << 14;
    w |= ((rt >> 3) & 1) << 13;
    w |= ((rd & 0b111) << 8);
    w |= ((rs & 0b111) << 3);
    w |= (rt & 0b111);
    return w;
  }
  function encUnary(op, rd, rs) {
    let w = (OP5_ROTN[op] << 11);
    w |= (rd & 0b111) << 8;
    w |= ((rd >> 3) & 1) << 7;
    w |= (rs & 0xf) << 3;
    return w;
  }
  function encSTO(rs, rt) {
    let w = (0b01010 << 11);
    w |= ((rs >> 3) & 1) << 7;
    w |= ((rt >> 3) & 1) << 6;
    w |= (rs & 0b111) << 3;
    w |= (rt & 0b111);
    return w;
  }
  function encLDD(rd, rs) {
    let w = (0b01011 << 11);
    w |= (rd & 0b111) << 8;
    w |= ((rd >> 3) & 1) << 7;
    w |= (rs & 0xf) << 3;
    return w;
  }
  function encLD(isHigh, rd, imm8) {
    const op5 = isHigh ? 0b01001 : 0b01000;
    let w = (op5 << 11);
    w |= (rd & 0b111) << 8;
    w |= (imm8 & 0xff);
    return w;
  }
  function encAbsJump(op, P) {
    const p = P & 0x7ff;
    return (OP5_JUMP[op] << 11) | p;
  }
  function encBRA(cond3, pc, target) {
    const O = (target - pc) & 0xff;
    return (0b11111 << 11) | ((cond3 & 0x7) << 8) | O;
  }
  const out = [];
  for (let pc = 0; pc < program.length; pc++) {
    const { op, args } = program[pc];
    try {
      let w;
      switch (op) {
        case "XOR": case "OR": case "AND": case "SBB": case "ADC":
          w = encALU3(op, args[0], args[1], args[2]);
          break;
        case "NOT": case "ROL": case "ROR": {
          const rd = args[0];
          const rs = args.length > 1 ? args[1] : rd;
          w = encUnary(op, rd, rs);
          break;
        }
        case "STO":
          w = encSTO(args[0], args[1]);
          break;
        case "STR":
          w = encSTO(args[0], args[1]);
          break;
        case "LDD":
          w = encLDD(args[0], args[1]);
          break;
        case "LDL":
          w = encLD(false, args[0], args[1] & 0xff);
          break;
        case "LDH":
          w = encLD(true, args[0], args[1] & 0xff);
          break;
        case "JZ": case "JC": case "JMP":
          w = encAbsJump(op, args[0]);
          break;
        case "BRA":
          w = encBRA(args[0], pc, args[1]);
          break;
        case "HLT":
          w = 0b11111 << 11;
          break;
        default:
          out.push(window.sweet16NoMachineCode || "NONE");
          continue;
      }
      out.push(toHex(w));
    } catch (e) {
      out.push(`# Error: ${e.message}`);
    }
  }
  return [header, ...out].join("\n");
}

/* -----------------------------
   Wire everything after DOM is ready
--------------------------------*/
document.addEventListener("DOMContentLoaded", () => {
  window.memoryViewTab = "data";
  window.currentProgramDisplayText = "";

  // Apply the active speed button's values immediately so the defaults match
  // what is visually shown (5x = 100 steps/tick) without requiring a click.
  const activeSpeedBtn = document.querySelector(".speed-btn.active");
  if (activeSpeedBtn) {
    window.runAllDelay        = parseInt(activeSpeedBtn.dataset.delay, 10) || 16;
    window.runAllStepsPerTick = parseInt(activeSpeedBtn.dataset.steps || "1", 10);
  }

  const btnConvert      = $("Convert");
  const btnRunNext      = $("RUN_NEXT");
  const btnReset        = $("RESET");
  const tabPrograms     = $("tabPrograms");
  const tabInstructions = $("tabInstructions");
  const tabAliases      = $("tabAliases");
  const tabManual       = $("tabManual");
  const tabContent      = $("tabContent");
  const viewerProgramArea = $("viewerProgramArea");
  const viewerInfoArea    = $("viewerInfoArea");
  const allViewerTabs   = [$("tabInMemoryData"), tabPrograms, tabInstructions, tabAliases, tabManual];

  // Restore ASM if preserved
  if (sessionStorage.getItem(S16_KEEP) === "1") {
    writeAsm(sessionStorage.getItem(S16_TEXT) || "");
  }
  sessionStorage.removeItem(S16_KEEP);
  sessionStorage.removeItem(S16_TEXT);

  // Load ASM file from disk into the ASM input
  const loadASMFile = $("loadASMFile");
  $("LoadASMBtn")?.addEventListener("click", () => loadASMFile?.click());
  loadASMFile?.addEventListener("change", () => {
    const file = loadASMFile.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      writeAsm(e.target.result);
      requireReconvertAfterAsmChange();
      const tabOriginalCode = $("tabOriginalCode");
      const tabDealiasCode  = $("tabDealiasCode");
      const panelOriginal   = $("inputOriginalPanel");
      const panelDealias    = $("inputDealiasPanel");
      setLeftColumnMode("code");
      if (tabOriginalCode) tabOriginalCode.classList.add("active");
      if (tabDealiasCode)  tabDealiasCode.classList.remove("active");
      if (panelOriginal)   panelOriginal.classList.remove("hidden");
      if (panelDealias)    panelDealias.classList.add("hidden");
      // Hide the IP indicator when fresh code is loaded
      const ind = document.getElementById('sourceLineIndicator');
      if (ind) ind.classList.add('hidden');
    };
    reader.readAsText(file);
    loadASMFile.value = ""; // reset so the same file can be re-loaded
  });

  // Any edit in the ASM input requires converting again.
  getAsmEl()?.addEventListener("input", () => {
    requireReconvertAfterAsmChange();
  });

  // Import / Export dynamic memory (.txt, one line per address:value in hex)
  const importMemoryFile = $("importMemoryFile");
  $("exportMemoryBtn")?.addEventListener("click", () => {
    if (typeof window.exportDynamicMemory === "function") window.exportDynamicMemory();
  });
  $("importMemoryBtn")?.addEventListener("click", () => {
    if (importMemoryFile) importMemoryFile.click();
  });
  importMemoryFile?.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result;
      if (typeof window.importDynamicMemoryFromText === "function") {
        const n = window.importDynamicMemoryFromText(text);
        alert(t("msg.importedCount", { n: n }));
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  });

  // Convert
  btnConvert?.addEventListener("click", () => {
    const inputASM = readAsm();
    if (!inputASM.trim()) {
      alert(t("msg.provideAsm"));
      return;
    }

    try {
      // Resolve #DEF aliases before assembly, keeping a lineMap for IP highlighting
      let asmToAssemble, lineMap;
      if (window.resolveAliasesWithMap) {
        ({ resolved: asmToAssemble, lineMap } = window.resolveAliasesWithMap(inputASM));
      } else {
        asmToAssemble = window.resolveAliases ? window.resolveAliases(inputASM) : inputASM;
        lineMap = null;
      }

      const assembledProgram = assemble(asmToAssemble);

      // Compose instrIdx → original source line index (0-based) for the IP indicator
      window.programOriginalLines = inputASM.split('\n');
      window.programOriginalSourceMap = (assembledProgram.sourceMap && lineMap)
        ? assembledProgram.sourceMap.map(ri => lineMap[ri] ?? ri)
        : assembledProgram.sourceMap || [];

      loadProgram(assembledProgram);
      refreshProgramDisplay();
    } catch (error) {
      alert(t("msg.assemblyError") + " " + error.message);
      return;
    }

    disableConvertButton();
    if (btnRunNext) btnRunNext.style.display = "inline-block";
    const btnRunAll = $("RUN_ALL");
    if (btnRunAll) btnRunAll.style.display = "inline-block";
    if (btnReset)   btnReset.style.display   = "inline-block";
    btnConvert.style.display = "none";
    if (typeof window.resetRunButtonLabels === "function") window.resetRunButtonLabels();
  });

  // Run Next
  btnRunNext?.addEventListener("click", () => {
    executeNext();
  });

  // Run All / Pause / Continue — same button, cycles through states
  $("RUN_ALL")?.addEventListener("click", () => {
    if (window.isRunAllActive?.()) {
      // Loop is alive: toggle pause ↔ continue
      if (window.isRunAllPaused?.()) window.continueRunAll?.();
      else                           window.pauseRunAll?.();
    } else {
      // Not running: start (or re-run) the program
      if (typeof window.runAllSteps === "function") window.runAllSteps();
    }
  });

  // Speed buttons for Run All
  document.querySelectorAll(".speed-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".speed-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      window.runAllDelay       = parseInt(btn.dataset.delay, 10);
      window.runAllStepsPerTick = parseInt(btn.dataset.steps || "1", 10);
    });
  });

  // Viewer tabs (In Memory, Machine Code, Sample Programs, Instruction Set, Aliases, User Manual)
  function setViewerTab(active) {
    allViewerTabs.forEach(t => t?.classList.remove("active"));
    active?.classList.add("active");
  }

  function showProgramArea() {
    if (viewerProgramArea) viewerProgramArea.classList.remove("hidden");
    if (viewerInfoArea) viewerInfoArea.classList.add("hidden");
  }
  function showInfoArea() {
    if (viewerProgramArea) viewerProgramArea.classList.add("hidden");
    if (viewerInfoArea) viewerInfoArea.classList.remove("hidden");
  }

  tabPrograms?.addEventListener("click", () => {
    setViewerTab(tabPrograms);
    showInfoArea();
    loadSamplePrograms();
  });

  tabInstructions?.addEventListener("click", () => {
    setViewerTab(tabInstructions);
    showInfoArea();
    loadInstructionSet();
  });

  tabAliases?.addEventListener("click", () => {
    setViewerTab(tabAliases);
    showInfoArea();
    loadAliases();
  });

  tabManual?.addEventListener("click", () => {
    setViewerTab(tabManual);
    showInfoArea();
    loadManualContent();
  });

  // Left column mode: "code" (Original/De-alias full height) or "info" (Sample Programs etc. full height)
  const leftColumn = $("leftColumn");
  function setLeftColumnMode(mode) {
    if (!leftColumn) return;
    leftColumn.classList.remove("mode-code", "mode-info");
    leftColumn.classList.add(mode === "info" ? "mode-info" : "mode-code");
  }

  // Original Code / De-alias Code tabs (above input textarea)
  const tabOriginalCode = $("tabOriginalCode");
  const tabDealiasCode  = $("tabDealiasCode");
  const panelOriginal   = $("inputOriginalPanel");
  const panelDealias    = $("inputDealiasPanel");
  const dealiasASMEl    = $("DealiasASM");

  tabOriginalCode?.addEventListener("click", () => {
    setLeftColumnMode("code");
    tabOriginalCode.classList.add("active");
    tabDealiasCode?.classList.remove("active");
    panelOriginal?.classList.remove("hidden");
    panelDealias?.classList.add("hidden");
  });

  tabDealiasCode?.addEventListener("click", () => {
    setLeftColumnMode("code");
    tabDealiasCode.classList.add("active");
    tabOriginalCode?.classList.remove("active");
    panelDealias?.classList.remove("hidden");
    panelOriginal?.classList.add("hidden");
    const raw = readAsm();
    // Use the display variant that preserves comments and blank lines
    const resolved = (typeof window.resolveAliasesForDisplay === "function")
        ? window.resolveAliasesForDisplay(raw)
        : (typeof window.resolveAliases === "function" ? window.resolveAliases(raw) : raw);
    if (dealiasASMEl) dealiasASMEl.value = resolved;
  });

  // Instruction memory tab (above InMemoryProgram)
  const tabInMemoryData = $("tabInMemoryData");
  const inMemoryProgramEl = $("InMemoryProgram");
  const machineCodeActions = $("machineCodeActions");

  function getMachineCodeColumnText() {
    const machineCells = Array.from(document.querySelectorAll("#InMemoryProgram .memory-program-machine"));
    const codes = machineCells
      .map(el => (el.textContent || "").trim())
      .filter(code => code && code !== "--" && code !== "NONE" && /^0x/i.test(code));
    if (codes.length === 0) return "";
    return ["v2.0 raw", ...codes].join("\n");
  }

  tabInMemoryData?.addEventListener("click", () => {
    setViewerTab(tabInMemoryData);
    showProgramArea();
    window.memoryViewTab = "data";
    if (machineCodeActions) machineCodeActions.style.display = "flex";
    if (typeof updateMemoryDisplay === "function") updateMemoryDisplay();
    else if (inMemoryProgramEl) inMemoryProgramEl.textContent = window.currentProgramDisplayText || t("msg.noProgramInMemory");
  });

  function refreshProgramDisplay() {
    window.memoryViewTab = "data";
    if (machineCodeActions) machineCodeActions.style.display = "flex";
    if (typeof updateMemoryDisplay === "function") updateMemoryDisplay();
    else if (inMemoryProgramEl) inMemoryProgramEl.textContent = window.currentProgramDisplayText || t("msg.noProgramInMemory");
  }

  // Copy Machine Code (second column only)
  $("copyMachineCode")?.addEventListener("click", () => {
    const text = getMachineCodeColumnText();
    if (!text) {
      window.showToast?.(t("msg.noProgramInMemory"));
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      window.showToast?.(t("msg.machineCodeCopied"));
    }).catch(() => {
      window.showToast?.(t("msg.copyFailed"));
    });
  });

  // Download Machine Code (second column only)
  $("downloadMachineCode")?.addEventListener("click", () => {
    const text = getMachineCodeColumnText();
    if (!text) {
      window.showToast?.(t("msg.noProgramInMemory"));
      return;
    }
    const raw = prompt("Enter filename (without extension):", "MachineCode");
    if (raw === null) return; // cancelled
    const filename = (raw.trim() || "MachineCode") + ".hex";
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  });

  // "Use" in Instruction Set: append instruction to code; "Add" in Sample Programs: load full program
  tabContent?.addEventListener("click", (e) => {
    const asmEl = getAsmEl();
    if (!asmEl) return;

    const addProgramBtn = e.target?.closest?.(".add-program-btn");
    if (addProgramBtn) {
      const index = addProgramBtn.getAttribute("data-program-index");
      if (index == null) return;
      const programs = window.samplePrograms;
      if (!Array.isArray(programs) || !programs[parseInt(index, 10)]) return;
      const code = programs[parseInt(index, 10)].code?.trim() ?? "";
      writeAsm(code);
      requireReconvertAfterAsmChange();
      setLeftColumnMode("code");
      tabOriginalCode?.classList.add("active");
      tabDealiasCode?.classList.remove("active");
      panelDealias?.classList.add("hidden");
      panelOriginal?.classList.remove("hidden");
      asmEl.focus();
      return;
    }

    const btn = e.target?.closest?.(".use-instr-btn");
    if (!btn) return;
    const line = btn.getAttribute("data-use-line");
    if (line == null) return;
    const current = readAsm();
    const newContent = current.trimEnd() ? current + "\n" + line : (current + line);
    writeAsm(newContent);
    requireReconvertAfterAsmChange();
    setLeftColumnMode("code");
    tabOriginalCode?.classList.add("active");
    tabDealiasCode?.classList.remove("active");
    panelDealias?.classList.add("hidden");
    panelOriginal?.classList.remove("hidden");
    asmEl.focus();
  });

  // Initial content & small effects
  loadSamplePrograms();
  flashButton("Convert");    // flash Convert on page load

  // Blink the Manual tab briefly
  if (tabManual) {
    tabManual.classList.add("blink");
    setTimeout(() => tabManual.classList.remove("blink"), 5000);
  }

  // RESET: ask before deleting ASM, preserve across reload if NO
  btnReset?.addEventListener("click", (e) => {
    // If an old handler exists in a cached script, prevent it from firing.
    e?.preventDefault?.();
    e?.stopImmediatePropagation?.();
    const asm = readAsm();
    const keep = () => {
      if (asm.trim().length > 0) {
        sessionStorage.setItem(S16_KEEP, "1");
        sessionStorage.setItem(S16_TEXT, asm);
      }
      location.reload();
    };

    const clear = () => {
      sessionStorage.removeItem(S16_KEEP);
      sessionStorage.removeItem(S16_TEXT);
      sessionStorage.setItem(S16_CLEARED, "1");
      location.reload();
    };

    showResetDialog({ onKeep: keep, onClear: clear });
  });
});
