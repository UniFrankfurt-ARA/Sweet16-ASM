// Sweet16-ASM — RISC reduced ISA (instr_set_reduced.pdf)
// Memory: STO [rs], rt  Mem[Rs]=Rt   LDD rd, [rs]  Rd=Mem[Rs]
// Jumps:  JZ, JC, JMP, BRA  (+ HLT alias)
// Assembler sugar (expanded before labels): JNZ/JNC/JS, STR, LDLO/LDHI
// Direct STO Rn, 0xADDR / LDD Rn, 0xADDR are rejected (not in architecture).

const instructionSet = {
    "NOT": { params: 2, types: ["R", "R"] },
    "XOR": { params: 3, types: ["R", "R", "R"] },
    "OR":  { params: 3, types: ["R", "R", "R"] },
    "AND": { params: 3, types: ["R", "R", "R"] },
    "ROL": { params: 2, types: ["R", "R"] },
    "ROR": { params: 2, types: ["R", "R"] },
    "SBB": { params: 3, types: ["R", "R", "R"] },
    "ADC": { params: 3, types: ["R", "R", "R"] },
    "LDL": { params: 2, types: ["R", "C"] },
    "LDH": { params: 2, types: ["R", "C"] },
    "STO": { params: 2, types: ["R", "R"] },
    "LDD": { params: 2, types: ["R", "R"] },
    "JZ":  { params: 1, types: ["AD"] },
    "JC":  { params: 1, types: ["AD"] },
    "JMP": { params: 1, types: ["AD"] },
    "BRA": { params: 2, types: ["COND", "AD"] },
    "HLT": { params: 0, types: [] }
};

let sugarLabelCounter = 0;

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

function rejectDirectMemory(op, line) {
    throw new Error(
        `${op} with a fixed address is not in the reduced instruction set ` +
        `(a 16-bit address cannot fit in one instruction word). ` +
        `Use ${op === 'STO' ? 'STO [Rs], Rt' : 'LDD Rd, [Rs]'} with the address in register Rs.`
    );
}

/** Expand non-spec mnemonics to JZ/JC/JMP/BRA (reduced set only). */
function expandLineSugar(normalized) {
    if (!normalized || normalized.endsWith(':')) return [normalized];
    const parts = normalized.split(' ');
    const op = parts[0];
    const target = parts[1];

    if (op === 'JNZ' && target) {
        const skip = `__jnz_skip_${sugarLabelCounter++}`;
        return [`JZ ${skip}`, `JMP ${target}`, `${skip}:`];
    }
    if (op === 'JNC' && target) {
        const skip = `__jnc_skip_${sugarLabelCounter++}`;
        return [`JC ${skip}`, `JMP ${target}`, `${skip}:`];
    }
    if (op === 'JS' && target) {
        return [`BRA B111 ${target}`];
    }

    if (op === 'STO' && parts[1] && isHexAddrToken(parts[2])) {
        rejectDirectMemory('STO', normalized);
    }
    if (op === 'LDD' && parts[1] && isHexAddrToken(parts[2])) {
        rejectDirectMemory('LDD', normalized);
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

    if (op === 'LDD' && p[2]) {
        const ptr = parseBracketReg(p[2]);
        if (ptr !== null) return `LDD ${p[1]} R${ptr}`;
    }

    if (op === 'JNZ' || op === 'JNC' || op === 'JS') {
        return p.join(' ');
    }

    // Single-operand ROL/ROR sugar → ROL Rd, Rd / ROR Rd, Rd (spec has rd, rs)
    if ((op === 'ROL' || op === 'ROR') && p.length === 2) {
        return `${op} ${p[1]} ${p[1]}`;
    }

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
        if (op === 'JNZ' || op === 'JNC' || op === 'JS') {
            throw new Error(
                `"${op}" is not in the reduced instruction set. ` +
                `It should have been expanded earlier; check assembler sugar.`
            );
        }
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
    sugarLabelCounter = 0;
    const rawLines = input.split('\n');

    const indexedLines = [];
    rawLines.forEach((raw, srcIdx) => {
        const cleaned = cleanLine(raw);
        if (!cleaned) return;
        const normalized = normalizeInstruction(cleaned);
        if (!normalized) return;
        expandLineSugar(normalized).forEach((expanded) => {
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
