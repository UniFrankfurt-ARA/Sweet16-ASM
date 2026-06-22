// Sample_instructions.js — List 0 (Reduced Instruction Set) only
// useLine: template appended to code when user clicks "Use" (R3 and #0xFF placeholders)

const sampleInstructions = [
    { name: "NOT", description: "Bitwise NOT of source register into destination.", syntax: "NOT Rd, Rs", example: "NOT R4, R2", useLine: "NOT R3, R3" },
    { name: "XOR", description: "Bitwise XOR of two registers into destination.", syntax: "XOR Rd, Rs, Rt", example: "XOR R4, R2, R3", useLine: "XOR R3, R3, R3" },
    { name: "OR",  description: "Bitwise OR of two registers into destination.", syntax: "OR Rd, Rs, Rt",  example: "OR R4, R2, R3", useLine: "OR R3, R3, R3" },
    { name: "AND", description: "Bitwise AND of two registers into destination.", syntax: "AND Rd, Rs, Rt", example: "AND R4, R2, R3", useLine: "AND R3, R3, R3" },
    { name: "ROL", description: "Rotate left by one bit (MSB → LSB, MSB → CF).", syntax: "ROL Rd", example: "ROL R2", useLine: "ROL R3" },
    { name: "ROR", description: "Rotate right by one bit (LSB → MSB, LSB → CF).", syntax: "ROR Rd", example: "ROR R2", useLine: "ROR R3" },
    { name: "SBB", description: "Subtract with borrow: Rd = Rs - Rt - CF.", syntax: "SBB Rd, Rs, Rt", example: "SBB R2, R3, R4", useLine: "SBB R3, R3, R3" },
    { name: "ADC", description: "Add with carry: Rd = Rs + Rt + CF.", syntax: "ADC Rd, Rs, Rt", example: "ADC R2, R3, R4", useLine: "ADC R3, R3, R3" },
    { name: "LDL", description: "Load low byte / 16-bit constant into register.", syntax: "LDL Rn, #0xvalue", example: "LDL R2, #0xA", useLine: "LDL R3, #0xFF" },
    { name: "LDH", description: "Load high byte into register (low byte preserved).", syntax: "LDH Rn, #value", example: "LDH R2, #0xFF", useLine: "LDH R3, #0xFF" },
    { name: "STO", description: "Store to user memory: Mem[Rs] = Rt (spec). Also STO Rn, 0xADDR (assembler expands).", syntax: "STO [Rs], Rt", example: "STO [R2], R3", useLine: "STO [R3], R3" },
    { name: "LDD", description: "Load from user memory: Rd = Mem[Rs] (spec). Also LDD Rn, 0xADDR (assembler expands).", syntax: "LDD Rd, [Rs]", example: "LDD R4, [R2]", useLine: "LDD R3, [R3]" },
    { name: "JZ",  description: "Jump if Zero flag is set (ZF=1).",         syntax: "JZ label",  example: "JZ done",  useLine: "JZ 0x0000" },
    { name: "JNZ", description: "Jump if Zero flag is clear (ZF=0).",        syntax: "JNZ label", example: "JNZ loop", useLine: "JNZ 0x0000" },
    { name: "JC",  description: "Jump if Carry flag is set (CF=1).",          syntax: "JC label",  example: "JC carry", useLine: "JC 0x0000" },
    { name: "JNC", description: "Jump if Carry flag is clear (CF=0).",        syntax: "JNC label", example: "JNC next", useLine: "JNC 0x0000" },
    { name: "JS",  description: "Jump if Sign/Negative flag is set (NF=1).",  syntax: "JS label",  example: "JS neg",   useLine: "JS 0x0000" },
    { name: "JMP", description: "Unconditional absolute jump.",               syntax: "JMP label", example: "JMP end",  useLine: "JMP 0x0000" },
    { name: "BRA", description: "Branch conditional. B000=always, B100=Z, B101=C, B110=V, B111=N.", syntax: "BRA Bxxx, label", example: "BRA B000, loop", useLine: "BRA B000, 0x0000" },
    { name: "HLT", description: "Halt execution.", syntax: "HLT", example: "HLT", useLine: "HLT" }
];

// Expose to the UI (script.js reads window.sampleInstructions, same as UserManual.js)
window.sampleInstructions = sampleInstructions;
