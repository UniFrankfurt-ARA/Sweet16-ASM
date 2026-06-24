/* English translations */
(function(global) {
  global.I18N_EN = {
    app: { title: "SWEET16 Processor Simulator — Reduced Instruction Set" },
    tab: {
      originalCode: "Original Code",
      dealiasCode: "De-alias Code",
      inMemoryData: "Instruction Memory",
      machineCode: "Machine Code",
      samplePrograms: "Sample Programs",
      instructionSet: "Instruction Set",
      aliases: "Aliases",
      userManual: "User Manual"
    },
    placeholder: {
      asm: "Paste or type assembly code here...",
      dealias: "De-aliased view",
      memoryInput: "0x0000:0xA"
    },
    btn: {
      loadASM: "Load ASM",
      convert: "Code Assemble",
      converted: " Code Assembled ",
      runNext: "Run Next",
      runAll: "Run All",
      reRunNext: "Re-Run Next",
      reRunAll: "Re-Run All",
      pause: "⏸ Pause",
      continue: "▶ Continue",
      reset: "Reset",
      importMemory: "Import Memory",
      exportMemory: "Export Memory",
      add: "Add",
      addMemory: "Add Memory",
      set: "Set",
      copy: "Copy",
      download: "Download"
    },
    speed: { label: "Speed" },
    status: { ip: "IP" },
    flag: {
      cf: "CF (Carry Flag)",
      zf: "ZF (Zero Flag)",
      of: "OF (Overflow Flag)",
      nf: "NF (Negative Flag)"
    },
    card: { userMemory: "Data Memory" },
    instr: {
      syntax: "Syntax",
      description: "Description",
      use: "Use"
    },
    alias: { usage: "Usage" },
    general: "General",
    registerConst: "(const)",
    aria: {
      hamburger: "Toggle navigation",
      lang: "Language",
      resizeMain: "Resize: drag to adjust left/right split",
      resizeViewer: "Resize: drag to adjust split",
      fias: "FIAS Frankfurt Institute for Advanced Studies",
      goethe: "Goethe University Frankfurt"
    },
    modal: {
      resetTitle: "Reset simulator?",
      resetBody: "Do you want to keep the currently written ASM program text after reset?",
      clearCode: "Clear code",
      keepCode: "Keep code"
    },
    msg: {
      provideAsm: "Please provide an ASM program to convert.",
      assemblyError: "Error during assembly:",
      importedCount: "Imported {n} memory location(s).",
      provideMemory: "Please provide a memory address and content.",
      invalidFormat: "Invalid input format. Use hexadecimal (e.g., 0x0000:0xA).",
      invalidAddress: "Invalid user memory address. Valid range: 0x{start} - 0x{end}",
      memoryUpdated: "User Memory at address 0x{addr} updated to 0x{val} (decimal: {dec})",
      noProgramToLoad: "No program to load. Please convert an ASM program first.",
      machineCodeCopied: "Machine code copied to clipboard.",
      copyFailed: "Copy failed — please select and copy manually.",
      programFinished: "Program finished ({reason}). Memory preserved — first Run Next rewinds PC only (no fetch); then run again.",
      programFinishedAfterRun: "Run All finished. Inspect memory. First Run Next rewinds to start without executing.",
      rewindPcNoExecute: "PC rewound to start — no instruction executed (memory unchanged). Next step runs instruction 0.",
      programFinishedLabel: "Program finished",
      linePrefix: "line",
      hltReached: "HLT reached",
      endOfProgram: "end of program",
      manualNotLoaded: "Manual not loaded.",
      noProgramInMemory: "(no program in memory)"
    },
    samplePrograms: {
      p0: "Sum and difference (ADC, SBB)",
      p1: "16-bit word: build, mask and recombine (LDH, AND, OR, NOT)",
      p2: "Count set bits in a byte (ROL loop, JC, JNZ)",
      p3: "Find max and check sign (BRA, JNC, JS)",
      p4: "Pointer-based memory copy (STO [Rs], Rt / LDD)",
      p5: "Alias test suite (16 #DEF aliases + STR)"
    },
    instrDesc: {
      NOT: "Bitwise NOT of source register into destination.",
      XOR: "Bitwise XOR of two registers into destination.",
      OR: "Bitwise OR of two registers into destination.",
      AND: "Bitwise AND of two registers into destination.",
      ROL: "Rotate left through carry: rd = (rs[14:0], CF); MSB of rs → CF.",
      ROR: "Rotate right through carry: rd = (CF, rs[15:1]); LSB of rs → CF.",
      SBB: "Subtract with borrow: Rd = Rs - Rt - CF.",
      ADC: "Add with carry: Rd = Rs + Rt + CF.",
      LDL: "Load low byte / 16-bit constant into register.",
      LDH: "Load high byte into register (low byte preserved).",
      STO: "Store Rt to user memory at address in Rs: STO [Rs], Rt.",
      LDD: "Load Rd from user memory at address in Rs: LDD Rd, [Rs].",
      JZ: "Jump if Zero flag is set (ZF=1).",
      JC: "Jump if Carry flag is set (CF=1).",
      JMP: "Unconditional absolute jump.",
      BRA: "Branch conditional. B000=always, B100=Z, B101=C, B110=V, B111=N.",
      HLT: "Halt execution."
    },
    aliasCategory: {
      "Flag Management": "Flag Management",
      "Compare / Test": "Compare / Test",
      "Register Operations": "Register Operations",
      "Bit / Shift": "Bit / Shift",
      "Assembler sugar": "Assembler sugar",
      "Memory": "Memory",
      "General": "General"
    },
    aliasDesc: {},
    manual: `# SWEET16 Processor Simulator - User Manual

## Introduction
The SWEET16 Processor Simulator is a tool designed to help users understand and simulate the functionality of a 16-bit processor. It allows you to input assembly code, execute instructions step-by-step, and view the internal state of registers, flags, and memory in real time.

## Key Features
1. Input Assembly Code: Paste your assembly code into the provided text area.
2. Instruction Execution: Execute instructions one at a time or load predefined sample programs.
3. Memory Management: Update memory dynamically with hexadecimal values.
4. Real-Time Visualization: Monitor changes in registers, flags, and memory dynamically.
5. Instruction Set Support: Supports arithmetic, logic, control flow, and memory instructions.

## Quick Start
1. Loading a Program:
   - Paste your assembly code into the "Original Code" textarea.
   - Click on the "Convert" button to parse the code.

2. Executing Instructions:
   - Use the "Run Next" button to execute one instruction at a time.
   - The results are reflected in registers, flags, and memory in real time.

3. Updating Memory:
   - Enter a memory address and content in the format "ADDRESS:CONTENT" (e.g., "0008:0010") in the input field.
   - Click the "Add" button to update the memory.

4. Viewing Registers and Flags:
   - The current values of all registers (R0 to R7) are displayed dynamically.
   - Flags (CF, ZF, OF, NF) update after each instruction that modifies them.

## Tabs and Content
1. Sample Programs: Click the tab to view example assembly programs.
2. Instruction Set: Tab for supported instructions, syntax, and examples.
3. User Manual: This guide.`
  };
})(typeof window !== "undefined" ? window : this);
