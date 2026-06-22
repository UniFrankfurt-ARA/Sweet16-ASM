// Sweet16-ASM — RISC reduced ISA (instr_set_reduced.pdf)
// Memory (spec): STO [rs], rt  Mem[rs]=rt   LDD rd, [rs]  rd=Mem[rs]
// Assembler also accepts STO Rn, 0xADDR / LDD Rn, 0xADDR (expanded to indirect STO/LDD).
// STR Rt, Rs is a deprecated alias for STO [Rs], Rt.

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
    "STO": { params: 2, types: ["R", "R"] },
    "LDD": { params: 2, types: ["R", "R"] },
    "JZ":  { params: 1, types: ["AD"] },
    "JNZ": { params: 1, types: ["AD"] },
    "JC":  { params: 1, types: ["AD"] },
    "JNC": { params: 1, types: ["AD"] },
    "JS":  { params: 1, types: ["AD"] },
    "JMP": { params: 1, types: ["AD"] },
    "BRA": { params: 2, types: ["COND", "AD"] },
    "HLT": { params: 0, types: [] }
};

const cleanLine = (line) => {
    return line
        .split('--')[0]
        .split(';')[0]
        .trim()
        .replace(/,+/g, ' ')
        .replace(/\s+/g, ' ');
};

function parseBracketReg(tok) {
    const m = tok && tok.match(/^\[R([0-7])\]$/i);
    if (!m) return null;
    return parseInt(m[1], 10);
}

function isHexAddrToken(tok) {
    return tok && /^0x[0-9A-Fa-f]+$/i.test(tok);
}

function pickScratchPtr(valReg) {
    for (const r of [7, 6]) {
        if (r !== valReg) return r;
    }
    throw new Error(
        `Cannot expand absolute memory access: need a scratch pointer register (not R${valReg}).`
    );
}

function byteHex(n) {
    return `#0x${(n & 0xff).toString(16).toUpperCase()}`;
}

/** STO Rn, 0xADDR → LDL/LDH scratch + STO [scratch], Rn (spec-correct indirect). */
function expandAbsoluteStoreLines(valReg, addr) {
    addr &= 0xffff;
    if (addr === 0) return [`STO R0 R${valReg}`];
    if (addr === 1) return [`STO R1 R${valReg}`];
    const ptr = pickScratchPtr(valReg);
    return [
        `LDL R${ptr} ${byteHex(addr & 0xff)}`,
        `LDH R${ptr} ${byteHex((addr >> 8) & 0xff)}`,
        `STO R${ptr} R${valReg}`
    ];
}

/** LDD Rn, 0xADDR → LDL/LDH scratch + LDD Rn, [scratch]. */
function expandAbsoluteLoadLines(dstReg, addr) {
    addr &= 0xffff;
    if (addr === 0) return [`LDD R${dstReg} R0`];
    if (addr === 1) return [`LDD R${dstReg} R1`];
    const ptr = pickScratchPtr(dstReg);
    return [
        `LDL R${ptr} ${byteHex(addr & 0xff)}`,
        `LDH R${ptr} ${byteHex((addr >> 8) & 0xff)}`,
        `LDD R${dstReg} R${ptr}`
    ];
}

function expandMemorySugar(normalized) {
    if (!normalized || normalized.endsWith(':')) return [normalized];
    const parts = normalized.split(' ');
    const op = parts[0];

    if (op === 'STO' && parts[1] && isHexAddrToken(parts[2])) {
        const valReg = parseInt(parts[1].slice(1), 10);
        const addr = parseInt(parts[2], 16);
        return expandAbsoluteStoreLines(valReg, addr);
    }
    if (op === 'LDD' && parts[1] && isHexAddrToken(parts[2])) {
        const dstReg = parseInt(parts[1].slice(1), 10);
        const addr = parseInt(parts[2], 16);
        return expandAbsoluteLoadLines(dstReg, addr);
    }
    return [normalized];
}

const normalizeInstruction = (line) => {
    if (!line) return line;
    if (line.endsWith(':')) return line;
    const parts = line.split(' ');
    let op = parts[0].toUpperCase();

    const p = parts.map((tok, i) => {
        if (i === 0) return op;
        return tok.replace(/^(r)([0-7])$/i, (_, _r, n) => 'R' + n);
    });

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

    // STO [Rs], Rt  →  STO Rs Rt   (Mem[Rs] = Rt per PDF)
    if (op === 'STO' && p[1]) {
        const ptr = parseBracketReg(p[1]);
        if (ptr !== null && p[2]) return `STO R${ptr} ${p[2]}`;
    }

    // STR Rt, Rs  →  STO Rs Rt  (deprecated alias)
    if (op === 'STR' && p[1] && p[2]) return `STO ${p[2]} ${p[1]}`;

    // LDD Rd, [Rs]  →  LDD Rd Rs
    if (op === 'LDD' && p[2]) {
        const ptr = parseBracketReg(p[2]);
        if (ptr !== null) return `LDD ${p[1]} R${ptr}`;
    }

    if (op === 'ROL' && p.length === 3) return `ROL ${p[1]}`;
    if (op === 'ROR' && p.length === 3) return `ROR ${p[1]}`;

    return p.join(' ');
};

const parseOperand = (operand, type, labels) => {
    if (type === "R" && operand.match(/^R[0-7]$/)) {
        return parseInt(operand.slice(1), 10);
    }
    if (type === "C" && operand.match(/^#0x[0-9A-Fa-f]+$/)) {
        return parseInt(operand.slice(1), 16);
    }
    if (type === "C" && operand.match(/^0x[0-9A-Fa-f]+$/)) {
        return parseInt(operand, 16);
    }
    if (type === "AD" && labels[operand] !== undefined) {
        return labels[operand];
    }
    if (type === "AD" && operand.match(/^0x[0-9A-Fa-f]+$/)) {
        return parseInt(operand, 16);
    }
    if (type === "COND" && operand.match(/^B[01]{3}$/i)) {
        return parseInt(operand.slice(1), 2);
    }
    throw new Error(`Invalid operand "${operand}" for expected type: ${type}`);
};

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

function assemble(input) {
    const rawLines = input.split('\n');

    const indexedLines = [];
    rawLines.forEach((raw, srcIdx) => {
        const cleaned = cleanLine(raw);
        if (!cleaned) return;
        const normalized = normalizeInstruction(cleaned);
        if (!normalized) return;
        expandMemorySugar(normalized).forEach((expanded) => {
            indexedLines.push({ normalized: expanded, srcIdx });
        });
    });

    const labels = {};
    const instructions = [];
    const sourceMap = [];
    let currentAddress = 0;

    indexedLines.forEach(({ normalized }) => {
        if (normalized.endsWith(':')) {
            const label = normalized.slice(0, -1);
            if (labels[label] !== undefined) throw new Error(`Duplicate label "${label}" found.`);
            labels[label] = currentAddress;
        } else {
            currentAddress += 1;
        }
    });

    indexedLines.forEach(({ normalized, srcIdx }, index) => {
        if (!normalized.endsWith(':')) {
            try {
                const instruction = parseLine(normalized, index + 1, labels);

                if (instruction.op === 'BRA') {
                    const pcOfBRA = instructions.length;
                    const offset = instruction.args[1] - pcOfBRA;
                    if (offset < -128 || offset > 127) {
                        throw new Error(
                            `BRA target is too far (offset ${offset} instructions). ` +
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

    instructions.sourceMap = sourceMap;
    return instructions;
}

window.assemble = assemble;
