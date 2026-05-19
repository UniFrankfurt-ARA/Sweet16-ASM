const userMemoryMap = {};
const explicitUserMemoryAddresses = new Set();
const _t = (key, params) => (typeof window.t === "function" ? window.t(key, params) : key);

//MEMORY - ASM PROGRAM - IP 
const MEMORY_SIZE = 0xE000; // Program memory size up to 0xDFFFF
const MEMORY_START = 0x0000; // Memory starts at 0x0000
const MEMORY_END = 0x2FFF; // Memory ends at 0x2FFF
const memory = new Uint16Array(MEMORY_SIZE); // Adjusted memory size

// USER MEMORY
const USR_MEMORY_SIZE = 0x1000; // User dynamic memory size
const USR_MEMORY_START = 0x0000; // User memory starts at 0x0000
const USR_MEMORY_END = 0x1000; // User memory ends at 0x1000
const UserMemory = new Uint16Array(USR_MEMORY_SIZE);

//REGISTERS
const registers = new Uint16Array(8); // 8 registers (R0 to R7)
let instructionPointer = 0x0000; // Program Counter (IP) starts at 0x0000
let carryFlag = 0;    // Carry flag (0: no carry, 1: carry)
let zeroFlag = 0;     // Zero flag (0: no zero result, 1: zero result)
let overflowFlag = 0; // Overflow flag (0: no signed overflow, 1: overflow)
let negativeFlag = 0; // Negative flag (0: result >= 0, 1: result negative / MSB set)
let halted = false;
let userHasRunProgram = false; // true after Run Next/Run All; register colors use orange/purple only then // Add a global variable to track program state
let program = []; // Assembled program (array of { op, args })
const HEX_MASK = 0xFFFF; // Mask to ensure 16-bit values

window.getProgram = function () { return program; };

/** Export dynamic memory to text: one line per address:value (hex), same format as tool input. */
window.exportDynamicMemory = function () {
    let lastUsed = 0;
    for (let i = USR_MEMORY_START; i < USR_MEMORY_END; i++) {
        if ((UserMemory[i] & 0xFFFF) !== 0) lastUsed = i;
    }

    const lines = [];
    for (let i = USR_MEMORY_START; i <= lastUsed; i++) {
        const v = UserMemory[i] & 0xFFFF;
        const a = i.toString(16).toUpperCase().padStart(4, '0');
        const h = v.toString(16).toUpperCase().padStart(4, '0');
        lines.push(a + ':' + h);
    }
    const text = lines.length ? lines.join('\n') : '';
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'dynamic_memory.txt';
    a.click();
    URL.revokeObjectURL(a.href);
};

/** Import dynamic memory from text. Each non-empty line: address:value (hex, 0x optional). Comments (-- or #) and blank lines ignored. */
window.importDynamicMemoryFromText = function (text) {
    const toHex = (s) => String(s).trim().replace(/^0x/i, '');
    let count = 0;
    text.split(/\r?\n/).forEach((line) => {
        const trimmed = line.replace(/--.*$/, '').replace(/#.*$/, '').trim();
        if (!trimmed) return;
        const idx = trimmed.indexOf(':');
        if (idx < 0) return;
        const addrStr = toHex(trimmed.slice(0, idx));
        const valStr = toHex(trimmed.slice(idx + 1));
        if (!addrStr || !valStr) return;
        const addr = parseInt(addrStr, 16);
        const val = parseInt(valStr, 16) & 0xFFFF;
        if (isNaN(addr) || isNaN(val) || addr < USR_MEMORY_START || addr >= USR_MEMORY_END) return;
        UserMemory[addr] = val;
        explicitUserMemoryAddresses.add(addr);
        updateUserMemoryDisplay(addr);
        count++;
    });
    return count;
};

// R0 = 0, R1 = 1 always. Writes are allowed (flags still update) but the value is discarded.
function enforceFixedRegisters() {
    registers[0] = 0x0000;
    registers[1] = 0x0001;
}

//UI
const memoryInput = document.getElementById('dynamicMemoryContentsForUser');
const addMemoryButton = document.getElementById('addMemoryContent');


addMemoryButton.addEventListener('click', () => {
    const inputValue = memoryInput.value.trim();
    if (!inputValue) {
        alert(_t("msg.provideMemory"));
        return;
    }

    const [addressRaw, contentRaw] = inputValue.split(':').map(str => str.trim());
    const normalizeHex = (s) => String(s || "").replace(/^0x/i, "");
    const address = normalizeHex(addressRaw);
    const content = normalizeHex(contentRaw);
    if (!address.match(/^[0-9A-Fa-f]+$/) || !content.match(/^[0-9A-Fa-f]+$/)) {
        alert(_t("msg.invalidFormat"));
        return;
    }

    const memoryAddress = parseInt(address, 16);
    let memoryContent = parseInt(content, 16);

    if (memoryAddress < USR_MEMORY_START || memoryAddress >= USR_MEMORY_END) {
        alert(_t("msg.invalidAddress", { start: USR_MEMORY_START.toString(16), end: USR_MEMORY_END.toString(16) }));
        return;
    }

    UserMemory[memoryAddress] = memoryContent;
    explicitUserMemoryAddresses.add(memoryAddress);
    updateUserMemoryDisplay(memoryAddress);
    alert(_t("msg.memoryUpdated", { addr: memoryAddress.toString(16).toUpperCase(), val: memoryContent.toString(16).toUpperCase(), dec: memoryContent }));
});


function updateUserMemoryDisplay(updatedAddress) {
    if (_batchMode) { _batchDirtyAddrs.add(updatedAddress); return; }
    const dynamicMemoryDisplay = document.getElementById('dynamicmemorydisplay');

    if (!dynamicMemoryDisplay) {
        console.error("❌ Error: dynamicmemorydisplay element not found!");
        return;
    }

    const safeAddress = Number(updatedAddress);
    if (isNaN(safeAddress) || safeAddress < 0) return;

    let lastUsed = 0;
    for (let i = USR_MEMORY_START; i < USR_MEMORY_END; i++) {
        if ((UserMemory[i] & 0xFFFF) !== 0) lastUsed = i;
    }

    const safeVisibleAddress = Math.max(0, safeAddress);
    const lastVisible = Math.max(lastUsed, safeVisibleAddress);

    dynamicMemoryDisplay.innerHTML = "";

    let highlightedRowId = null;
    for (let i = 0; i <= lastVisible; i += 4) {
        const chunk = [];
        for (let j = 0; j < 4 && i + j <= lastVisible; j++) {
            const addr = i + j;
            chunk.push({ addr, val: UserMemory[addr] & 0xFFFF });
        }
        const addrText = chunk.map(item => item.addr.toString(16).toUpperCase().padStart(4, "0")).join(", ");
        const valText = chunk.map(item => {
            const cls = explicitUserMemoryAddresses.has(item.addr) ? "user-memory-val-explicit" : "user-memory-val-gap";
            const val = item.val.toString(16).toUpperCase().padStart(4, "0");
            return `<span class="${cls}">${val}</span>`;
        }).join(", ");

        const row = document.createElement("div");
        row.id = `userMemory-row-${Math.floor(i / 4)}`;
        row.className = "user-memory-row";
        row.innerHTML = `<span class="user-memory-addr-group">${addrText}</span><span class="user-memory-val-group">${valText}</span>`;
        dynamicMemoryDisplay.appendChild(row);

        if (chunk.some(item => item.addr === safeAddress)) highlightedRowId = row.id;
    }

    if (highlightedRowId) flashElement(highlightedRowId);
}

// BRA condition codes (per instr_set_reduced.pdf):
//   0XX = unconditional (B000, B001, B010, B011 — low two bits are don't-cares)
//   100 = Z, 101 = C, 110 = V, 111 = N
// For inverted flag tests (NZ, NC) use the dedicated JNZ / JNC mnemonics.
function evaluateCondition(cond) {
    const c = Number(cond) & 7;
    if ((c & 0b100) === 0) return true;          // 0XX: unconditional
    if (c === 4) return zeroFlag === 1;          // 100: Z
    if (c === 5) return carryFlag === 1;         // 101: C
    if (c === 6) return overflowFlag === 1;      // 110: V
    if (c === 7) return negativeFlag === 1;      // 111: N
    return false;                                 // unreachable (all 8 cases covered)
}

const SIGN_BIT = 0x8000;
function signedOverflowAdd(rs, rt, res) {
    const rsSign = (rs & SIGN_BIT) !== 0;
    const rtSign = (rt & SIGN_BIT) !== 0;
    const resSign = (res & SIGN_BIT) !== 0;
    return (rsSign === rtSign) && (resSign !== rsSign);
}
function signedOverflowSub(rs, rt, res) {
    const rsSign = (rs & SIGN_BIT) !== 0;
    const rtSign = (rt & SIGN_BIT) !== 0;
    const resSign = (res & SIGN_BIT) !== 0;
    return (rsSign !== rtSign) && (resSign !== rsSign);
}

const instructions = {
    "NOT": (rd, rs) => {
        registers[rd] = (~registers[rs]) & HEX_MASK;
        zeroFlag = (registers[rd] === 0) ? 1 : 0;
        overflowFlag = 0;
        negativeFlag = (registers[rd] & SIGN_BIT) ? 1 : 0;
        updateFlagsDisplay();
        updateRegisterDisplay();
    },
    "XOR": (rd, rs, rt) => {
        registers[rd] = (registers[rs] ^ registers[rt]) & HEX_MASK;
        zeroFlag = (registers[rd] === 0) ? 1 : 0;
        overflowFlag = 0;
        negativeFlag = (registers[rd] & SIGN_BIT) ? 1 : 0;
        updateFlagsDisplay();
        updateRegisterDisplay();
    },
    "OR": (rd, rs, rt) => {
        registers[rd] = (registers[rs] | registers[rt]) & HEX_MASK;
        zeroFlag = (registers[rd] === 0) ? 1 : 0;
        overflowFlag = 0;
        negativeFlag = (registers[rd] & SIGN_BIT) ? 1 : 0;
        updateFlagsDisplay();
        updateRegisterDisplay();
    },
    "AND": (rd, rs, rt) => {
        registers[rd] = (registers[rs] & registers[rt]) & HEX_MASK;
        zeroFlag = (registers[rd] === 0) ? 1 : 0;
        overflowFlag = 0;
        negativeFlag = (registers[rd] & SIGN_BIT) ? 1 : 0;
        updateFlagsDisplay();
        updateRegisterDisplay();
    },
    "ROL": (rd) => {
        // Rotate left THROUGH carry: MSB → CF, old CF → LSB
        const oldMSB   = (registers[rd] & 0x8000) >> 15;
        const carryOut = oldMSB;
        registers[rd]  = ((registers[rd] << 1) | carryFlag) & HEX_MASK;
        carryFlag      = carryOut;
        zeroFlag       = (registers[rd] === 0) ? 1 : 0;
        negativeFlag   = (registers[rd] & SIGN_BIT) ? 1 : 0;
        // VF: sign changed — old MSB differs from new MSB (bit14 of old value shifted up)
        overflowFlag   = (oldMSB !== ((registers[rd] & SIGN_BIT) >> 15)) ? 1 : 0;
        updateFlagsDisplay();
        updateRegisterDisplay();
    },
    "ROR": (rd) => {
        // Rotate right THROUGH carry: LSB → CF, old CF → MSB
        const oldMSB   = (registers[rd] & 0x8000) >> 15;
        const carryOut = registers[rd] & 0x1;
        registers[rd]  = ((registers[rd] >> 1) | (carryFlag << 15)) & HEX_MASK;
        carryFlag      = carryOut;
        zeroFlag       = (registers[rd] === 0) ? 1 : 0;
        negativeFlag   = (registers[rd] & SIGN_BIT) ? 1 : 0;
        // VF: sign changed — old MSB differs from incoming carry (new MSB)
        overflowFlag   = (oldMSB !== ((registers[rd] & SIGN_BIT) >> 15)) ? 1 : 0;
        updateFlagsDisplay();
        updateRegisterDisplay();
    },
    "SBB": (rd, rs, rt) => {
        const result = registers[rs] - registers[rt] - carryFlag;
        carryFlag = (result < 0) ? 1 : 0;
        registers[rd] = result & HEX_MASK;
        zeroFlag = (registers[rd] === 0) ? 1 : 0;
        overflowFlag = signedOverflowSub(registers[rs], registers[rt], registers[rd]) ? 1 : 0;
        negativeFlag = (registers[rd] & SIGN_BIT) ? 1 : 0;
        updateFlagsDisplay();
        updateRegisterDisplay();
    },
    "ADC": (rd, rs, rt) => {
        const result = registers[rs] + registers[rt] + carryFlag;
        carryFlag = (result > 0xFFFF) ? 1 : 0;
        registers[rd] = result & HEX_MASK;
        zeroFlag = (registers[rd] === 0) ? 1 : 0;
        overflowFlag = signedOverflowAdd(registers[rs], registers[rt], registers[rd]) ? 1 : 0;
        negativeFlag = (registers[rd] & SIGN_BIT) ? 1 : 0;
        updateFlagsDisplay();
        updateRegisterDisplay();
    },
    "LDL": (rd, val) => {
        // rd[7:0] = val (8-bit); high byte zeroed (per index2 / Sweet16)
        registers[rd] = (val & 0xFF);
        zeroFlag = (registers[rd] === 0) ? 1 : 0;
        overflowFlag = 0;
        negativeFlag = (registers[rd] & SIGN_BIT) ? 1 : 0;
        updateFlagsDisplay();
        updateRegisterDisplay();
    },
    "LDH": (rd, val) => {
        registers[rd] = ((registers[rd] & 0x00FF) | ((val & 0xFF) << 8)) & HEX_MASK;
        zeroFlag = (registers[rd] === 0) ? 1 : 0;
        overflowFlag = 0;
        negativeFlag = (registers[rd] & SIGN_BIT) ? 1 : 0;
        updateFlagsDisplay();
        updateRegisterDisplay();
    },
    "STO": (rs, address) => {
        if (address < USR_MEMORY_START || address >= USR_MEMORY_END) return; // silently ignore out-of-range
        UserMemory[address] = registers[rs] & HEX_MASK;
        updateUserMemoryDisplay(address);
    },
    "STR": (rs, rd) => {
        const address = registers[rd];
        if (address < USR_MEMORY_START || address >= USR_MEMORY_END) return; // silently ignore out-of-range
        UserMemory[address] = registers[rs] & HEX_MASK;
        updateUserMemoryDisplay(address);
    },
    "LDD": (rd, address) => {
        if (address < USR_MEMORY_START || address >= USR_MEMORY_END) {
            registers[rd] = 0; // out-of-range reads return 0
            zeroFlag = 1; overflowFlag = 0; negativeFlag = 0;
            updateFlagsDisplay(); updateRegisterDisplay();
            return;
        }
        registers[rd] = UserMemory[address] & HEX_MASK;
        zeroFlag = (registers[rd] === 0) ? 1 : 0;
        overflowFlag = 0;
        negativeFlag = (registers[rd] & SIGN_BIT) ? 1 : 0;
        updateFlagsDisplay();
        updateRegisterDisplay();
    },
    "JZ":  (address) => { if (zeroFlag     === 1) instructionPointer = address; },
    "JNZ": (address) => { if (zeroFlag     === 0) instructionPointer = address; },
    "JC":  (address) => { if (carryFlag    === 1) instructionPointer = address; },
    "JNC": (address) => { if (carryFlag    === 0) instructionPointer = address; },
    "JS":  (address) => { if (negativeFlag === 1) instructionPointer = address; },
    "JMP": (address) => { instructionPointer = address; },
    "BRA": (cond, address) => { if (evaluateCondition(cond)) instructionPointer = address; },
    "HLT": () => { halted = true; }
};




// ── Batch-execution helpers ───────────────────────────────────────────────────
// When _batchMode is true all DOM update calls are suppressed.
// Any user-memory addresses written during a batch are tracked in
// _batchDirtyAddrs and flushed (refreshed) after the batch completes.
let _batchMode      = false;
let _batchDirtyAddrs = new Set();

function updateFlagsDisplay() {
    if (_batchMode) return;
    const carryFlagDisplay = document.getElementById('carryFlagDisplay');
    if (carryFlagDisplay) carryFlagDisplay.textContent = carryFlag === 1 ? '1' : '0';
    const zeroFlagDisplay = document.getElementById('zeroFlagDisplay');
    if (zeroFlagDisplay) zeroFlagDisplay.textContent = zeroFlag === 1 ? '1' : '0';
    const overflowFlagDisplay = document.getElementById('overflowFlagDisplay');
    if (overflowFlagDisplay) overflowFlagDisplay.textContent = overflowFlag === 1 ? '1' : '0';
    const negativeFlagDisplay = document.getElementById('negativeFlagDisplay');
    if (negativeFlagDisplay) negativeFlagDisplay.textContent = negativeFlag === 1 ? '1' : '0';
}

// Load a sample program into memory
function loadProgram(assembledProgram) {
    if (!assembledProgram || assembledProgram.length === 0) {
        alert(_t("msg.noProgramToLoad"));
        return;
    }

    instructionPointer = 0;
    halted = false;
    enforceFixedRegisters();
    userHasRunProgram = false; // Reset so register display stays blue until next Run
    program = assembledProgram; // Use the dynamically assembled program

    // Load instructions into memory starting from 0x0000
    let address = 0x0000;
    program.forEach((inst, index) => {
        memory[address++] = index; // Storing line numbers (just as placeholder)
    });

    // Display program in ASM view (respect Machine Code tab: only write when showing data)
    const programDisplay = document.getElementById('InMemoryProgram');
    const programContent = program.map((inst, index) => {
        const formattedArgs = inst.args.map(arg => {
            if (typeof arg === 'number') {
                const hexValue = `0x${arg.toString(16).toUpperCase()}`; // Convert to hexadecimal
                const decimalValue = `(${arg})`; // Decimal representation
                return `${hexValue} ${decimalValue}`; // Combine both
            }
            return arg; // Leave non-numeric arguments unchanged
        }).join(', ');

        return `${index.toString(16).padStart(4, '0').toUpperCase()}: ${inst.op} ${formattedArgs}`;
    }).join('\n');
    window.currentProgramDisplayText = programContent;
    if (window.memoryViewTab !== 'machine') {
        if (programDisplay && programDisplay.tagName === 'DIV') {
            programDisplay.innerHTML = buildProgramDisplayHtml();
            scrollIpIntoView();
        } else if (programDisplay) {
            programDisplay.value = programContent;
        }
    }

    // Prime the source indicator at IP = 0
    updateSourceDisplay();
}


// Display register values
function updateRegisterDisplay() {
    if (_batchMode) return;
    const registerDisplay = document.querySelector('.register-display');

    enforceFixedRegisters();

    registers.forEach((value, index) => {
        const registerElement = document.getElementById(`register-R${index}`);
        if (!registerElement) return;

        // Mark constant registers (R0 and R1) in the UI
        if (index === 0 || index === 1) {
            registerElement.classList.add("fixed-register");
        } else {
            registerElement.classList.remove("fixed-register");
        }

        const previousValue = registerElement.dataset.value || "0";
        // Blue until user has run the program; then orange for 0, purple for non-zero
        const valueColor = userHasRunProgram ? (value === 0 ? "orange" : "purple") : "blue";
        // R0/R1 show a small "const" badge so users know writes are silently discarded
        const constBadge = (index === 0 || index === 1)
            ? ` <span style="font-size:smaller;color:#888;font-style:italic;">${_t("registerConst")}</span>`
            : "";

        registerElement.innerHTML = `
            R${index}:${constBadge}
            <span style="font-size: larger; color: ${valueColor};">0x${value.toString(16).toUpperCase()}</span> 
            (<span style="font-size: smaller; color: ${valueColor};">${value}</span>)
        `;

        // If the value has changed, trigger the flash effect
        if (previousValue !== value.toString()) {
            flashElement(`register-R${index}`);
            registerElement.dataset.value = value.toString(); // Update the stored value
        }
    });
}



function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
}

function scrollIpIntoView() {
    const el = document.querySelector('#InMemoryProgram .ip-line-highlight');
    if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

// ── Source-code IP indicator (no textarea replacement) ───────────────────────
// Shows a slim bar above the textarea with the currently-executing original
// source line (including alias names), and scrolls the textarea to that line.

function updateSourceDisplay() {
    const indicator = document.getElementById('sourceLineIndicator');
    const textarea  = document.getElementById('InputASM');
    const origMap   = window.programOriginalSourceMap;
    const origLines = window.programOriginalLines;
    if (!indicator || !origMap || !origLines) return;

    const ip = instructionPointer; // next instruction to execute (IP already advanced)
    if (ip >= origMap.length) {
        indicator.innerHTML = '<span class="src-ind-icon">■</span> ' + _t("msg.programFinishedLabel");
        indicator.classList.remove('hidden');
        return;
    }

    const origLineIdx = origMap[ip];
    const origLine    = (origLines[origLineIdx] || '').trim();

    indicator.innerHTML =
        `<span class="src-ind-icon">▶</span>` +
        `<span class="src-ind-num">${_t("msg.linePrefix")} ${origLineIdx + 1}</span>` +
        `<span class="src-ind-text">${escapeHtml(origLine)}</span>`;
    indicator.classList.remove('hidden');

    // Scroll textarea so the executing line is roughly centred
    if (textarea && origLines.length > 1) {
        const lineH = textarea.scrollHeight / origLines.length;
        textarea.scrollTop = Math.max(0, (origLineIdx - 2) * lineH);
    }
}

function buildProgramDisplayHtml() {
    const toHexWord = (w) => `0x${(w & 0xFFFF).toString(16).toUpperCase().padStart(4, "0")}`;
    const OP5_ALU3 = { XOR: 0b00001, OR: 0b00010, AND: 0b00011, SBB: 0b10110, ADC: 0b10111 };
    const OP5_ROTN = { NOT: 0b00000, ROL: 0b10100, ROR: 0b10101 };
    const OP5_JUMP = { JZ: 0b01100, JC: 0b01101, JMP: 0b11110 };
    function encodeInstructionWord(pc, op, args) {
        function encALU3(code, rd, rs, rt) {
            let w = (code << 11);
            w |= ((rd >> 3) & 1) << 15;
            w |= ((rs >> 3) & 1) << 14;
            w |= ((rt >> 3) & 1) << 13;
            w |= ((rd & 0b111) << 8);
            w |= ((rs & 0b111) << 3);
            w |= (rt & 0b111);
            return w;
        }
        function encUnary(code, rd, rs) {
            let w = (code << 11);
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
        function encAbsJump(code, P) {
            return (code << 11) | (P & 0x7ff);
        }
        function encBRA(cond3, target) {
            const O = (target - pc) & 0xff;
            return (0b11111 << 11) | ((cond3 & 0x7) << 8) | O;
        }

        switch (op) {
            case "XOR": case "OR": case "AND": case "SBB": case "ADC":
                return encALU3(OP5_ALU3[op], args[0], args[1], args[2]);
            case "NOT": case "ROL": case "ROR": {
                const rd = args[0];
                const rs = args.length > 1 ? args[1] : rd;
                return encUnary(OP5_ROTN[op], rd, rs);
            }
            case "STO":
            case "STR":
                return encSTO(args[0], args[1]);
            case "LDD":
                return encLDD(args[0], args[1]);
            case "LDL":
                return encLD(false, args[0], args[1] & 0xff);
            case "LDH":
                return encLD(true, args[0], args[1] & 0xff);
            case "JZ": case "JC": case "JMP":
                return encAbsJump(OP5_JUMP[op], args[0]);
            case "BRA":
                return encBRA(args[0], args[1]);
            case "HLT":
                return 0b11111 << 11;
            default:
                return null;
        }
    }

    const lines = [];
    lines.push(
        `<div class="memory-program-header">` +
            `<span>Address</span>` +
            `<span>Machine Code</span>` +
            `<span>Instruction</span>` +
        `</div>`
    );
    for (let i = 0; i < program.length; i++) {
        const instruction = program[i];
        const address = i.toString(16).padStart(4, '0').toUpperCase();
        const args = Array.isArray(instruction?.args) ? instruction.args : [];
        const argsHex = args.map(arg => typeof arg === "number" ? `0x${arg.toString(16).toUpperCase()}` : String(arg)).join(', ');
        const argsDec = args.map(arg => String(arg)).join(', ');
        const op = instruction?.op || '';
        const line = `${op}${argsHex ? ` ${argsHex}` : ''}${argsDec ? ` (${argsDec})` : ''}`;
        const encodedWord = encodeInstructionWord(i, op, args);
        const machineCode = encodedWord == null ? "--" : toHexWord(encodedWord);
        const isIp = (i === instructionPointer);
        const addressCell = `${address}${isIp ? " [IP]" : ""}`;
        lines.push(
            `<div class="memory-program-line${isIp ? ' ip-line-highlight' : ''}">` +
                `<span class="memory-program-address">${escapeHtml(addressCell)}</span>` +
                `<span class="memory-program-machine">${machineCode}</span>` +
                `<span class="memory-program-body">${escapeHtml(line)}</span>` +
            `</div>`
        );
    }
    return lines.join('');
}

// Display memory contents, highlighting IP and SP
function updateMemoryDisplay() {
    const programDisplay = document.getElementById('InMemoryProgram');
    const dynamicMemoryDisplay = document.getElementById('dynamicmemorydisplay'); // Added for memory content display

    // Update program memory
    const displayRange = program.length; // Adjust to program size
    let programContent = '';

    // Iterate through the program memory
    for (let i = 0; i < displayRange; i++) {
        const address = i.toString(16).padStart(4, '0').toUpperCase(); // Hexadecimal address
        const instruction = program[i];
        const instructionHex = instruction?.op || ''; // Instruction mnemonic
        const argsHex = instruction?.args.map(arg => `0x${arg.toString(16).toUpperCase()}`).join(', ') || ''; // Hexadecimal args
        const argsDec = instruction?.args.join(', ') || ''; // Decimal args

        // Format each line with both hex and decimal values
        let line = `${address}: ${instructionHex} ${argsHex} (${argsDec})`;

        // Highlight the current instruction pointer (IP)
        if (i === instructionPointer) {
            line = `[IP] ${line}`;
        }

        programContent += line + '\n';
    }

    window.currentProgramDisplayText = programContent.trim();
    if (window.memoryViewTab !== 'machine') {
        if (programDisplay && programDisplay.tagName === 'DIV') {
            programDisplay.innerHTML = buildProgramDisplayHtml();
            scrollIpIntoView();
        } else if (programDisplay) {
            programDisplay.value = programContent.trim();
        }
    }



    // Update the dynamic memory display (new addition)
    let dynamicMemoryContent = '';
    for (let i = 0; i < 16; i++) {  // Show first 16 memory addresses, adjust as needed
        const address = i.toString(16).padStart(4, '0').toUpperCase(); // Hexadecimal address
        const value = memory[i] || 0x0000;  // Default to 0x0000 if no value is set in memory
        dynamicMemoryContent += `0x${address}: 0x${value.toString(16).toUpperCase()} (${value})\n`;  // Format memory content
    }

    // Update the dynamic memory display (textarea)
    dynamicMemoryDisplay.value = dynamicMemoryContent.trim();
}


// Previous values to detect changes
let previousIP = null;
let previousCF = null;
let previousZF = null;
let previousVF = null;
let previousNF = null;

function updateControlPanel() {
    const ipElement = document.getElementById('ipDisplay');
    const cfElement = document.getElementById('carryFlagDisplay');
    const zfElement = document.getElementById('zeroFlagDisplay');
    const vfElement = document.getElementById('overflowFlagDisplay');
    const nfElement = document.getElementById('negativeFlagDisplay');

    const newIP = `0x${instructionPointer.toString(16).padStart(4, '0').toUpperCase()}`;
    if (previousIP !== newIP && ipElement) {
        ipElement.textContent = newIP;
        flashElement('ipDisplay');
        previousIP = newIP;
    }

    const newCF = carryFlag === 1 ? '1' : '0';
    if (previousCF !== newCF && cfElement) {
        cfElement.textContent = newCF;
        flashElement('carryFlagDisplay');
        previousCF = newCF;
    }

    const newZF = zeroFlag === 1 ? '1' : '0';
    if (previousZF !== newZF && zfElement) {
        zfElement.textContent = newZF;
        flashElement('zeroFlagDisplay');
        previousZF = newZF;
    }

    const newVF = overflowFlag === 1 ? '1' : '0';
    if (previousVF !== newVF && vfElement) {
        vfElement.textContent = newVF;
        flashElement('overflowFlagDisplay');
        previousVF = newVF;
    }

    const newNF = negativeFlag === 1 ? '1' : '0';
    if (previousNF !== newNF && nfElement) {
        nfElement.textContent = newNF;
        flashElement('negativeFlagDisplay');
        previousNF = newNF;
    }
}


/** Run until HLT or end of program; yields to UI between steps. */
window.runAllDelay      = 16;  // ms between ticks  (updated by speed buttons)
window.runAllStepsPerTick = 1; // instructions per tick (>1 = batch / "fast" mode)

// ── Run-All pause/continue state ─────────────────────────────────────────────
let runAllActive = false; // true while Run All loop is alive (including paused)
let runAllPaused = false; // true when the loop is suspended mid-run

/** Flush all user-memory entries that were silently written during a batch. */
function _flushBatchDirtyMemory() {
    _batchDirtyAddrs.forEach(addr => updateUserMemoryDisplay(addr));
    _batchDirtyAddrs.clear();
}

/**
 * Execute one instruction purely for its side-effects (no DOM updates).
 * Returns true if an instruction was run, false if halted / past end.
 */
function _executeOneStep() {
    if (halted || instructionPointer >= program.length) return false;
    enforceFixedRegisters();
    const { op, args } = program[instructionPointer++];
    userHasRunProgram = true;
    if (instructions[op]) instructions[op](...args);
    enforceFixedRegisters();
    return true;
}

/** Shared tick used by runAllSteps and continueRunAll. */
function _runAllStep() {
    if (runAllPaused) return;

    executeNext(); // run one instruction (handles halt/done detection internally)

    // Stop and unschedule when done
    if (halted || instructionPointer >= (program?.length ?? 0)) {
        runAllActive = false;
        resetForRerun();
        return;
    }

    if (runAllActive) {
        setTimeout(_runAllStep, window.runAllDelay || 100);
    }
}

function resetForRerun() {
    instructionPointer = 0;
    halted = false;
    runAllActive = false;
    runAllPaused = false;
    updateMemoryDisplay();
    updateSourceDisplay();
    updateControlPanel();
    const btnNext = document.getElementById('RUN_NEXT');
    const btnAll  = document.getElementById('RUN_ALL');
    if (btnNext) { btnNext.textContent = _t("btn.reRunNext"); btnNext.classList.add('rerun-btn'); btnNext.disabled = false; }
    if (btnAll)  { btnAll.textContent  = _t("btn.reRunAll");  btnAll.classList.add('rerun-btn'); btnAll.classList.remove('pause-btn', 'continue-btn'); }
}

window.resetRunButtonLabels = function () {
    runAllActive = false;
    runAllPaused = false;
    const btnNext = document.getElementById('RUN_NEXT');
    const btnAll  = document.getElementById('RUN_ALL');
    if (btnNext) { btnNext.textContent = _t("btn.runNext"); btnNext.classList.remove('rerun-btn'); btnNext.disabled = false; }
    if (btnAll)  { btnAll.textContent  = _t("btn.runAll");  btnAll.classList.remove('rerun-btn', 'pause-btn', 'continue-btn'); }
};

window.refreshSimulatorLabels = function () {
    const btnNext = document.getElementById('RUN_NEXT');
    const btnAll  = document.getElementById('RUN_ALL');
    if (btnNext) {
        if (runAllActive && runAllPaused) {
            if (btnAll) btnAll.textContent = _t("btn.continue");
        } else if (runAllActive) {
            if (btnAll) btnAll.textContent = _t("btn.pause");
        } else if (btnNext.classList.contains('rerun-btn')) {
            btnNext.textContent = _t("btn.reRunNext");
            if (btnAll) btnAll.textContent = _t("btn.reRunAll");
        } else {
            btnNext.textContent = _t("btn.runNext");
            if (btnAll) btnAll.textContent = _t("btn.runAll");
        }
    }
    const convertBtn = document.getElementById('Convert');
    if (convertBtn) convertBtn.innerText = convertBtn.disabled ? _t("btn.converted") : _t("btn.convert");
    updateSourceDisplay();
};

window.runAllSteps = function () {
    runAllActive = true;
    runAllPaused = false;
    const btnAll  = document.getElementById('RUN_ALL');
    const btnNext = document.getElementById('RUN_NEXT');
    if (btnAll)  { btnAll.textContent = _t("btn.pause"); btnAll.classList.add('pause-btn'); btnAll.classList.remove('rerun-btn', 'continue-btn'); }
    if (btnNext) { btnNext.disabled = true; }
    _runAllStep();
};

window.pauseRunAll = function () {
    if (!runAllActive || runAllPaused) return;
    runAllPaused = true;
    const btnAll  = document.getElementById('RUN_ALL');
    const btnNext = document.getElementById('RUN_NEXT');
    if (btnAll)  { btnAll.textContent = _t("btn.continue"); btnAll.classList.add('continue-btn'); btnAll.classList.remove('pause-btn'); }
    if (btnNext) { btnNext.disabled = false; } // allow single-stepping while paused
};

window.continueRunAll = function () {
    if (!runAllActive || !runAllPaused) return;
    runAllPaused = false;
    const btnAll  = document.getElementById('RUN_ALL');
    const btnNext = document.getElementById('RUN_NEXT');
    if (btnAll)  { btnAll.textContent = _t("btn.pause"); btnAll.classList.add('pause-btn'); btnAll.classList.remove('continue-btn'); }
    if (btnNext) { btnNext.disabled = true; }
    _runAllStep();
};

window.isRunAllActive = function () { return runAllActive; };
window.isRunAllPaused = function () { return runAllPaused; };

function executeNext() {

    if (halted || instructionPointer >= program.length) {
        const reason = halted ? _t("msg.hltReached") : _t("msg.endOfProgram");
        resetForRerun();
        window.showToast?.(_t("msg.programFinished", { reason: reason }));
        return;
    }

    enforceFixedRegisters();

    const { op, args } = program[instructionPointer++];
    userHasRunProgram = true; // From now on show register values as orange (0) / purple (non-zero)
    if (instructions[op]) {
        instructions[op](...args);
    }

    enforceFixedRegisters();

    const programDisplayEl = document.getElementById('InMemoryProgram');
    window.currentProgramDisplayText = program.map((_, i) => {
        const address = i.toString(16).padStart(4, '0').toUpperCase();
        const prefix = (i === instructionPointer - 1) ? '[IP] ' : '';
        return `${prefix}${address}: ${program[i]?.op || ''} ${program[i]?.args?.join(', ') || ''}`;
    }).join('\n');
    if (window.memoryViewTab !== 'machine') {
        if (programDisplayEl && programDisplayEl.tagName === 'DIV') {
            programDisplayEl.innerHTML = buildProgramDisplayHtml();
            scrollIpIntoView();
        } else if (programDisplayEl) {
            programDisplayEl.value = window.currentProgramDisplayText;
        }
    }


    updateRegisterDisplay();
    updateMemoryDisplay();
    updateSourceDisplay();
    updateControlPanel();
}

function initialize() {
    const defaultProgram = [
        { op: "LDL", args: [2, 5] },   // R2 = 5
        { op: "LDL", args: [3, 10] },  // R3 = 10
        { op: "ADC", args: [4, 2, 3] } // R4 = R2 + R3 + CF (List 0: no ADD, use ADC with CF=0)
    ];
    const asmText = `
    LDL R2, #0x5
    LDL R3, #0xA
    ADC R4, R2, R3`.trim();

    const inputAsmTextarea = document.getElementById('InputASM');
    const cleared = sessionStorage.getItem("s16-asm-cleared") === "1";
    if (cleared) {
        sessionStorage.removeItem("s16-asm-cleared");
        inputAsmTextarea.value = "";
        program = [];
        const programDisplay = document.getElementById('InMemoryProgram');
        if (programDisplay) {
            if (programDisplay.tagName === 'DIV') programDisplay.innerHTML = "";
            else programDisplay.value = "";
        }
        instructionPointer = 0x0000;
        carryFlag = 0;
        zeroFlag = 0;
        overflowFlag = 0;
        negativeFlag = 0;
        halted = false;
        userHasRunProgram = false;
        enforceFixedRegisters();
        updateRegisterDisplay();
        updateMemoryDisplay();
        updateControlPanel();

        // Ensure Convert is visible on reset-clear
        const convertBtn = document.getElementById('Convert');
        if (convertBtn) {
            convertBtn.style.display = "inline-block";
            convertBtn.disabled = false;
            convertBtn.innerText = _t("btn.convert");
        }
        document.getElementById('RUN_NEXT').style.display = 'none';
        const runAllEl = document.getElementById('RUN_ALL');
        if (runAllEl) runAllEl.style.display = 'none';
        document.getElementById('RESET').style.display = 'none';
        return;
    }

    inputAsmTextarea.value = asmText;

    enforceFixedRegisters();

    loadProgram(defaultProgram);
    updateRegisterDisplay();
    updateMemoryDisplay();
    updateControlPanel();

    // 🔴 HIDE "RUN NEXT", "RUN ALL" & "RESET" BUTTONS ON PAGE LOAD
    document.getElementById('RUN_NEXT').style.display = 'none';
    const runAllEl = document.getElementById('RUN_ALL');
    if (runAllEl) runAllEl.style.display = 'none';
    document.getElementById('RESET').style.display = 'none';
}



// Start the simulation
initialize();
