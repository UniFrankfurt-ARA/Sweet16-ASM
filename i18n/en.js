/* English translations */
(function(global) {
  global.I18N_EN = {
    app: { title: "SWEET16 Processor Simulator" },
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
      programFinished: "Program finished ({reason}). Memory preserved — press Run Next / Run All to run again.",
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
      p4: "Pointer-based memory copy (STR, LDD)",
      p5: "Alias test suite (all 16 aliases)"
    },
    instrDesc: {
      NOT: "Bitwise NOT of source register into destination.",
      XOR: "Bitwise XOR of two registers into destination.",
      OR: "Bitwise OR of two registers into destination.",
      AND: "Bitwise AND of two registers into destination.",
      ROL: "Rotate left by one bit (MSB → LSB, MSB → CF).",
      ROR: "Rotate right by one bit (LSB → MSB, LSB → CF).",
      SBB: "Subtract with borrow: Rd = Rs - Rt - CF.",
      ADC: "Add with carry: Rd = Rs + Rt + CF.",
      LDL: "Load low byte / 16-bit constant into register.",
      LDH: "Load high byte into register (low byte preserved).",
      STO: "Store register to user memory at fixed address.",
      STR: "Store register to user memory at address in another register.",
      LDD: "Load from user memory at fixed address into register.",
      JZ: "Jump if Zero flag is set (ZF=1).",
      JNZ: "Jump if Zero flag is clear (ZF=0).",
      JC: "Jump if Carry flag is set (CF=1).",
      JNC: "Jump if Carry flag is clear (CF=0).",
      JS: "Jump if Sign/Negative flag is set (NF=1).",
      JMP: "Unconditional absolute jump.",
      BRA: "Branch conditional. B000=always, B100=Z, B101=C, B110=V, B111=N.",
      HLT: "Halt execution."
    },
    aliasCategory: {
      "Flag Management": "Flag Management",
      "Compare / Test": "Compare / Test",
      "Register Operations": "Register Operations",
      "Bit / Shift": "Bit / Shift",
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
