// Define the instruction set — List 0 (Reduced Instruction Set) only
// NOT, XOR, OR, AND, ROL, ROR, SBB, ADC, LDL, LDH, STO, STR, LDD,
// JZ, JNZ, JC, JNC, JS, JMP, BRA, HLT
// R0 = 0 and R1 = 1 always (constant registers). Writes are assembled and executed normally;
// the simulator discards the write-back so R0/R1 stay constant, but flags still update.

const instructionSet = {
    "NOT": { params: 2, types: ["R", "R"] },
    "XOR": { params: 3, types: ["R", "R", "R"] },
    "OR":  { params: 3, types: ["R", "R", "R"] },
    "AND": { params: 3, types: ["R", "R", "R"] },
    "ROL": { params: 1, types: ["R"] },
    "ROR": { params: 1, types: ["R"] },
    "SBB": { params: 3, types: ["R", "R", "R"] },
    "ADC": { params: 3, types: ["R", "R", "R"] },
    "LDL": { params: 2, types: ["R", "C"] },
    "LDH": { params: 2, types: ["R", "C"] },
    "STO": { params: 2, types: ["R", "MR"] },
    "STR": { params: 2, types: ["R", "R"] },
    "LDD": { params: 2, types: ["R", "MR"] },
    "JZ":  { params: 1, types: ["AD"] },
    "JNZ": { params: 1, types: ["AD"] },
    "JC":  { params: 1, types: ["AD"] },
    "JNC": { params: 1, types: ["AD"] },
    "JS":  { params: 1, types: ["AD"] },
    "JMP": { params: 1, types: ["AD"] },
    "BRA": { params: 2, types: ["COND", "AD"] },
    "HLT": { params: 0, types: [] }
};

// Strip comments and normalise whitespace
const cleanLine = (line) => {
    return line
        .split('--')[0] // Remove -- comments (verify.s16 / Sweet16 style)
        .split(';')[0]  // Remove ; comments
        .trim()
        .replace(/,+/g, ' ') // commas → spaces
        .replace(/\s+/g, ' ');
};

// Normalise alternative syntax forms to our canonical forms.
// Runs after cleanLine so tokens are already space-separated.
const normalizeInstruction = (line) => {
    if (!line) return line;
    if (line.endsWith(':')) return line; // leave labels untouched
    const parts = line.split(' ');
    let op = parts[0].toUpperCase();

    // Uppercase register names: r0 → R0, r5 → R5, etc.
    const p = parts.map((tok, i) => {
        if (i === 0) return op;
        return tok.replace(/^(r)([0-7])$/i, (_, _r, n) => 'R' + n);
    });

    // LDLO/LDHI: extract low/high byte from 16-bit constant (per verify.s16 / index2)
    // LDLO rd, 0x20  → LDL rd, #0x20  (low byte of 0x0020 = 0x20)
    // LDHI rd, 0x20  → LDH rd, #0x00  (high byte of 0x0020 = 0x00)  so R5 = 0x0020
    if ((op === 'LDLO' || op === 'LDHI') && p[2]) {
        const raw = p[2].replace(/^#/, '');
        let full = 0;
        if (/^0[xX][0-9a-fA-F]+$/.test(raw)) full = parseInt(raw, 16) & 0xFFFF;
        else if (/^\d+$/.test(raw)) full = parseInt(raw, 10) & 0xFFFF;
        else return p.join(' ');
        const byte = op === 'LDLO' ? (full & 0xFF) : ((full >> 8) & 0xFF);
        const newOp = op === 'LDLO' ? 'LDL' : 'LDH';
        return `${newOp} ${p[1]} #0x${byte.toString(16).toUpperCase()}`;
    }

    // STO [Rd], Rs  →  STR Rs, Rd   (indirect store via pointer register)
    if (op === 'STO' && p[1] && /^\[R[0-7]\]$/i.test(p[1])) {
        const rd = p[1].slice(1, -1).toUpperCase(); // [R2] → R2
        const rs = p[2];
        if (rs) return `STR ${rs} ${rd}`;
    }

    // LDD Rd, [Rs]  →  LDD Rd, 0xNNNN
    // Only meaningful for constant registers: R0 (=0) and R1 (=1).
    if (op === 'LDD' && p[2] && /^\[R[0-7]\]$/i.test(p[2])) {
        const rs = p[2].slice(1, -1).toUpperCase(); // [R0] → R0
        const regNum = parseInt(rs.slice(1));
        if (regNum > 1) throw new Error(
            `Indirect LDD [${rs}] is only supported for constant registers R0/R1.`
        );
        const addr = `0x${regNum.toString(16).padStart(4, '0').toUpperCase()}`;
        return `${p[0]} ${p[1]} ${addr}`;
    }

    // ROL Rd, Rs  (2-operand form)  →  ROL Rd  (in-place rotate)
    if (op === 'ROL' && p.length === 3) return `ROL ${p[1]}`;

    // ROR Rd, Rs  (2-operand form)  →  ROR Rd  (in-place rotate)
    if (op === 'ROR' && p.length === 3) return `ROR ${p[1]}`;

    return p.join(' ');
};

// Parse operands based on the type
const parseOperand = (operand, type, labels) => {
    if (type === "R" && operand.match(/^R[0-7]$/)) {
        return parseInt(operand.slice(1)); // Register number (e.g., R0-R7)
    }
    if (type === "C" && operand.match(/^#0x[0-9A-Fa-f]+$/)) {
        return parseInt(operand.slice(1), 16); // Hexadecimal constant (e.g., #0x10)
    }
    if (type === "C" && operand.match(/^0x[0-9A-Fa-f]+$/)) {
        return parseInt(operand, 16); // Allow 0xNNNN as constant
    }
    if (type === "AD" && labels[operand] !== undefined) {
        return labels[operand]; // Address resolved from label
    }
    if (type === "AD" && operand.match(/^0x[0-9A-Fa-f]+$/)) {
        return parseInt(operand, 16); // Hexadecimal address (e.g., 0x0004)
    }
    if (type === "MR" && operand.match(/^0x[0-9A-Fa-f]+$/)) {
        return parseInt(operand, 16); // Memory address (e.g., 0x0010)
    }
    if (type === "COND" && operand.match(/^B[01]{3}$/i)) {
        return parseInt(operand.slice(1), 2); // B000..B111 -> 0..7
    }
    throw new Error(`Invalid operand "${operand}" for expected type: ${type}`);
};

// Parse a single line of ASM code
const parseLine = (line, lineNumber, labels) => {
    const parts = line.split(' ');
    const op = parts[0].toUpperCase();

    const instruction = instructionSet[op];
    if (!instruction) {
        throw new Error(`Unknown instruction "${op}" on line ${lineNumber}.`);
    }

    const { params, types } = instruction;

    if (parts.length - 1 !== params) {
        throw new Error(`"${op}" expects ${params} operands but got ${parts.length - 1} on line ${lineNumber}.`);
    }

    const operands = parts.slice(1).map((operand, index) => {
        return parseOperand(operand, types[index], labels);
    });

    return { op, args: operands };
};

// Main function to assemble the program.
// Returns the instructions array with an extra `.sourceMap` property:
//   sourceMap[instrIndex] = 0-based line index in the original `input` string
//   so callers can highlight the corresponding source line for each instruction.
function assemble(input) {
    const rawLines = input.split('\n');

    // Build indexed lines: preserve original line index through cleaning/normalising
    const indexedLines = [];
    rawLines.forEach((raw, srcIdx) => {
        const cleaned = cleanLine(raw);
        if (!cleaned) return;
        const normalized = normalizeInstruction(cleaned);
        if (normalized) indexedLines.push({ normalized, srcIdx });
    });

    const labels = {};
    const instructions = [];
    const sourceMap = []; // sourceMap[instrIdx] = srcIdx in rawLines
    let currentAddress = 0;

    // First pass: Identify labels
    indexedLines.forEach(({ normalized }) => {
        if (normalized.endsWith(':')) {
            const label = normalized.slice(0, -1);
            if (labels[label] !== undefined) {
                throw new Error(`Duplicate label "${label}" found.`);
            }
            labels[label] = currentAddress;
        } else {
            currentAddress += 1;
        }
    });

    // Second pass: Parse instructions
    // R0/R1 writes are allowed by the assembler; the simulator silently keeps them constant.
    indexedLines.forEach(({ normalized, srcIdx }, index) => {
        if (!normalized.endsWith(':')) {
            try {
                const instruction = parseLine(normalized, index + 1, labels);

                // BRA uses an 8-bit signed PC-relative offset (per instr_set_reduced.pdf),
                // so the target must be within -128..+127 instructions of the BRA itself.
                if (instruction.op === 'BRA') {
                    const pcOfBRA = instructions.length;
                    const offset = instruction.args[1] - pcOfBRA;
                    if (offset < -128 || offset > 127) {
                        throw new Error(
                            `BRA target is too far (offset ${offset} instructions). ` +
                            `You are jumping too far — check your jump address. ` +
                            `BRA can only reach -128..+127 instructions; use JMP for longer jumps.`
                        );
                    }
                }

                instructions.push(instruction);
                sourceMap.push(srcIdx);
            } catch (error) {
                throw new Error(`Error on line ${index + 1}: ${error.message}`);
            }
        }
    });

    // Attach source map as a non-enumerable property so it travels with the array
    instructions.sourceMap = sourceMap;
    return instructions;
}

// Export the assemble function for use in the browser
window.assemble = assemble;
