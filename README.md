# Sweet16-ASM — SWEET16 Simulator (RISC Instruction Set)

**This project — RISC (reduced instruction set):** [https://unifrankfurt-ara.github.io/Sweet16-ASM/](https://unifrankfurt-ara.github.io/Sweet16-ASM/)

**Also available:**

- **FULL** instruction set (complete Sweet-16, including the rest beyond RISC): [https://unifrankfurt-ara.github.io/Sweet16_Full_Instruction_set_Assembler/](https://unifrankfurt-ara.github.io/Sweet16_Full_Instruction_set_Assembler/)
- **EXTENDED** (full ISA + MUL, DIV, PSH/POP-style extras and more): [https://unifrankfurt-ara.github.io/Sweeter16_ExtendedPlus/](https://unifrankfurt-ara.github.io/Sweeter16_ExtendedPlus/)

Use **RISC** here for the reduced teaching ISA. Switch to **FULL** or **EXTENDED** if you need more instructions.

---

## About this project (Sweet16-ASM — RISC)

**Sweet16-ASM** is a browser-based assembler and step-by-step simulator for the **reduced SWEET16 instruction set** used in ARA teaching at Goethe University. No installation: open the demo link, paste assembly, preprocess `#DEF` aliases, assemble, and run instruction by instruction.

### Reduced ISA highlights

- Logic: `NOT`, `XOR`, `OR`, `AND`
- Arithmetic via carry: `ADC`, `SBB` (no plain `ADD`/`SUB` in this list)
- Shifts / rotates: `ROL`, `ROR` (in-place style after normalization)
- Loads: `LDL`, `LDH`, `LDLO`/`LDHI`
- Memory (per `instr_set_reduced.pdf`): **`STO [Rs], Rt`** → `Mem[Rs] = Rt`; **`LDD Rd, [Rs]`** → `Rd = Mem[Rs]`; absolute sugar **`STO Rn, 0xADDR`** / **`LDD Rn, 0xADDR`** (assembler expands via scratch register); deprecated alias **`STR Rt, Rs`** → `STO [Rs], Rt`
- Control: `JZ`, `JC`, `JNZ`, `JNC`, `JS`, `JMP`, `BRA`, `HLT`
- **R0 = 0** and **R1 = 1** are treated as constant in the simulator (writes are ignored for those registers)

Machine-code column shows **16-bit hex** for encodable instructions; unmapped ops show **`NONE`** (reserved for future definition with co-instructors).

Reference: `instr_set_reduced` (see also full spec in the Full project’s `docs/instr_set_full.tex` for comparison).

### Main features

- Web UI: ASM editor, alias preprocessor (`#DEF`), assemble, step/run
- Registers R0–R7, flags (C, Z, N, V), user memory, program memory view with **hex** column
- Sample programs, instruction tab, user manual (EN/DE)
- Includes `verify.s16`-style reduced test programs

### Quick start (local)

```bash
cd Sweet16-ASM
python3 -m http.server 8080
```

Open [http://localhost:8080/index.html](http://localhost:8080/index.html).

Or use the published demo: [https://unifrankfurt-ara.github.io/Sweet16-ASM/](https://unifrankfurt-ara.github.io/Sweet16-ASM/)

### Typical workflow

1. Write or paste ASM (optional `#DEF` aliases, `--` / `;` comments).
2. **Convert** — resolve aliases, assemble to internal program.
3. **Run Next** / **Run All** — observe registers, flags, memory, and machine code.
4. Copy hex export when you need words for external tools (only `0x….` lines; `NONE` is skipped on copy).

### Project structure

| File | Role |
|------|------|
| `index.html` | Main UI |
| `AliasResolver.js` | `#DEF` and comment preprocessing |
| `assembler.js` | Parse / reduced ISA |
| `simulator.js` | Execution + memory display |
| `script.js` | UI wiring, tabs, export |
| `verify.s16` | Reduced ISA test program |
| `Sample_*.js`, `i18n/` | Samples and translations |

### Feedback and contributions

Issues and pull requests are welcome. Please note which of the three projects your change targets.

### Author

**Dr. Gautam Dange**  
FIAS / Goethe University Frankfurt  
Email: dange@fias.uni-frankfurt.de
