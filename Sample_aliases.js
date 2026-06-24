// Sample_aliases.js — Useful #DEF aliases for the List 0 instruction set
// R0 = constant 0,  R1 = constant 1  (writes discarded, flags still update)

window.sampleAliases = [

    // ── FLAG MANAGEMENT ───────────────────────────────────────────────────────

    {
        name:       "CLR_C",
        def:        "#DEF CLR_C = ROR R0, R0;",
        use:        "CLR_C",
        flags:      "CF → 0",
        description:
            "Clear Carry Flag. ROR on R0 (always 0): bit 0 = 0 rotates into CF, so CF = 0. " +
            "Use before any ADC/SBB when you want CF = 0.",
        category:   "Flag Management"
    },
    {
        name:       "SET_C",
        def:        "#DEF SET_C = ROR R1, R1;",
        use:        "SET_C",
        flags:      "CF → 1 (ZF/NF/VF depend on previous CF)",
        description:
            "Set CF to 1 using ROR on R1 (R1 is constant 0x0001, so bit0 always rotates into CF as 1). " +
            "Use before ADC when you explicitly want +1 carry-in. R1 write-back is discarded.",
        category:   "Flag Management"
    },
    {
        name:       "SET_Borrow",
        def:        "#DEF SET_Borrow = SBB R0,R0,R1;",
        use:        "SET_Borrow",
        flags:      "CF → 1,  NF → 1,  ZF → 0",
        description:
            "Set borrow flag state for subtraction context (CF = 1 in this simulator). " +
            "Use before SBB when you intentionally want to subtract the extra borrow 1.",
        category:   "Flag Management"
    },
    {
        name:       "SET_Z",
        def:        "#DEF SET_Z = SBB R0,R0,R0;",
        use:        "SET_Z",
        flags:      "ZF → 1,  CF → 0,  NF → 0",
        description:
            "Set Zero Flag. Computes 0 − 0 − 0 = 0 → ZF = 1. " +
            "Write to R0 is discarded (R0 stays 0) but flags update normally.",
        category:   "Flag Management"
    },
    {
        name:       "CLR_ZNV",
        def:        "#DEF CLR_ZNV = OR R1,R1,R1;",
        use:        "CLR_ZNV",
        flags:      "ZF → 0,  NF → 0,  VF → 0",
        description:
            "Clear Zero, Negative and Overflow in one instruction. " +
            "1 OR 1 = 1 ≠ 0 → ZF = 0.  Bit 15 of 1 = 0 → NF = 0. " +
            "Logical OR never produces signed overflow → VF = 0. " +
            "Write to R1 is discarded (R1 stays 1).",
        category:   "Flag Management"
    },
    {
        name:       "SET_N",
        def:        "#DEF SET_N = NOT R0,R0;",
        use:        "SET_N",
        flags:      "NF → 1,  ZF → 0",
        description:
            "Set Negative Flag. NOT(R0) = NOT(0) = 0xFFFF. " +
            "Bit 15 = 1 → NF = 1.  Result 0xFFFF ≠ 0 → ZF = 0. " +
            "Write to R0 is discarded (R0 stays 0). No user register is touched.",
        category:   "Flag Management"
    },

    // ── ASSEMBLER SUGAR (expanded before assembly; not hardware opcodes) ─────

    {
        name:       "JNZ",
        def:        "(assembler expands to JZ skip / JMP target / skip:)",
        use:        "JNZ loop",
        flags:      "uses ZF",
        description:
            "Jump if Zero flag is clear (ZF=0). Not in the reduced hardware ISA — the assembler " +
            "expands each JNZ to JZ + JMP. Prefer JZ/JMP in hand-written machine programs.",
        category:   "Assembler sugar"
    },
    {
        name:       "JNC",
        def:        "(assembler expands to JC skip / JMP target / skip:)",
        use:        "JNC next",
        flags:      "uses CF",
        description:
            "Jump if Carry flag is clear (CF=0). Assembler sugar only; hardware has JC and BRA B101.",
        category:   "Assembler sugar"
    },
    {
        name:       "JS",
        def:        "(assembler expands to BRA B111 target)",
        use:        "JS negative",
        flags:      "uses NF",
        description:
            "Jump if Negative flag is set (NF=1). Assembler sugar only; hardware has BRA B111.",
        category:   "Assembler sugar"
    },

    // ── MEMORY (syntax sugar) ───────────────────────────────────────────────────

    {
        name:       "STR",
        def:        "#DEF STR = STO",
        use:        "STR R3, R5",
        flags:      "-",
        description:
            "Deprecated alias for STO [Rs], Rt. STR Rt, Rs expands to STO [Rs], Rt (spec form). " +
            "Prefer STO [R5], R3 in new code.",
        category:   "Memory"
    },

    // ── COMPARE / TEST ────────────────────────────────────────────────────────

    {
        name:       "CMP",
        def:        "#DEF CMP = SBB R0,",
        use:        "CMP R3,R4",
        flags:      "ZF, CF, NF, VF updated; result discarded",
        description:
            "Compare two registers. Expands to SBB R0, Rs, Rt. " +
            "Computes Rs − Rt − CF (use CLR_C first). " +
            "Result written to R0 is discarded, but all flags reflect the subtraction: " +
            "ZF=1 if Rs==Rt,  CF=1 if Rs < Rt (borrow),  NF=1 if result is negative,  VF=1 on signed overflow.",
        category:   "Compare / Test"
    },
    {
        name:       "TST",
        def:        "#DEF TST = AND R0,",
        use:        "TST R3,R3",
        flags:      "ZF, NF updated; CF → 0, VF → 0",
        description:
            "Test a register (AND with itself, result discarded). " +
            "Expands to AND R0, Rd, Rd. " +
            "ZF=1 if Rd == 0,  NF=1 if bit 15 of Rd = 1. " +
            "Write to R0 is discarded. Logical AND clears CF and VF.",
        category:   "Compare / Test"
    },
    {
        name:       "CC_ZERO",
        def:        "#DEF CC_ZERO = B100;",
        use:        "#DEF CC_ZERO = B100;\n; Usage after CMP: BRA CC_ZERO, your_label",
        flags:      "uses ZF",
        description:
            "Condition-code constant for the Zero flag. " +
            "Define it once, then write  BRA CC_ZERO, your_label  to branch when ZF=1 (i.e. the two compared values were equal). " +
            "B100 is the raw condition-code bit pattern for 'branch if ZF set'.",
        category:   "Compare / Test"
    },

    // ── REGISTER OPERATIONS ───────────────────────────────────────────────────

    {
        name:       "ZERO",
        def:        "#DEF ZERO = XOR R6,R0,R0;",
        use:        "ZERO",
        flags:      "ZF → 1,  NF → 0,  CF → 0",
        description:
            "Zero out register R6. R0 XOR R0 = 0 OR 0 = 0, written to R6. " +
            "Uses R0 (constant 0) as both sources — does not depend on R6's prior value. " +
            "ZF = 1 because result = 0. Redefine for other destinations as needed: " +
            "#DEF ZERO_R4 = XOR R4,R0,R0;",
        category:   "Register Operations"
    },
    {
        name:       "MOV",
        def:        "#DEF MOV = OR R6,",
        use:        "MOV R3,R0",
        flags:      "ZF, NF updated; CF → 0",
        description:
            "Copy a register into R6 (OR source with R0 = 0 leaves value unchanged). " +
            "Expands to OR R6, Rs, R0. Destination is always R6 here — redefine for other targets: " +
            "#DEF MOV_R4 = OR R4,",
        category:   "Register Operations"
    },
    {
        name:       "INC",
        def:        "#DEF INC = ADC R6,R6,R1;",
        use:        "CLR_C\nINC",
        flags:      "CF, ZF, NF, VF updated",
        description:
            "Increment R6 by 1. ADC R6,R6,R1 = R6 + 1 + CF. " +
            "Always use CLR_C first to ensure CF = 0, otherwise result is R6 + 2. " +
            "Redefine for other registers: #DEF INC_R3 = ADC R3,R3,R1;",
        category:   "Register Operations"
    },
    {
        name:       "DEC",
        def:        "#DEF DEC = SBB R6,R6,R1;",
        use:        "CLR_C\nDEC",
        flags:      "CF, ZF, NF, VF updated",
        description:
            "Decrement R6 by 1. SBB R6,R6,R1 = R6 − 1 − CF. " +
            "Always use CLR_C first. If R6 = 0 before DEC, result wraps to 0xFFFF and CF = 1 (borrow). " +
            "Redefine for other registers: #DEF DEC_R4 = SBB R4,R4,R1;",
        category:   "Register Operations"
    },
    {
        name:       "NEG",
        def:        "#DEF NEG = SBB R6,R0,R6;",
        use:        "CLR_C\nNEG",
        flags:      "CF, ZF, NF, VF updated",
        description:
            "Negate R6 (two's complement). SBB R6,R0,R6 = 0 − R6 − CF. " +
            "Use CLR_C first. NEG(0) = 0 (ZF=1, CF=0). NEG(1) = 0xFFFF (CF=1, NF=1). " +
            "Equivalent to NOT + INC in other architectures.",
        category:   "Register Operations"
    },

    // ── BIT / SHIFT ───────────────────────────────────────────────────────────

    {
        name:       "SHL",
        def:        "#DEF SHL = ROL R6, R6;",
        use:        "CLR_C\nSHL",
        flags:      "CF ← old bit 15,  NF, ZF updated",
        description:
            "Shift R6 left by 1 (multiply by 2). " +
            "Bit 15 rotates into CF, and old CF rotates into bit 0. " +
            "Use CLR_C first so bit 0 receives 0 (clean logical shift). " +
            "Repeat SHL N times to multiply by 2ᴺ.",
        category:   "Bit / Shift"
    },
    {
        name:       "SHR",
        def:        "#DEF SHR = ROR R6, R6;",
        use:        "CLR_C\nSHR",
        flags:      "CF ← old bit 0,  NF, ZF updated",
        description:
            "Shift R6 right by 1 (divide by 2, unsigned). " +
            "Bit 0 rotates into CF, and old CF rotates into bit 15. " +
            "Use CLR_C first so bit 15 receives 0 (clean logical right shift). " +
            "Repeat SHR N times to divide by 2ᴺ.",
        category:   "Bit / Shift"
    }

];
