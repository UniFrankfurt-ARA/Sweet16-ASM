/* German translations */
(function(global) {
  global.I18N_DE = {
    app: { title: "SWEET16 Prozessorsimulator" },
    tab: {
      originalCode: "Originalcode",
      dealiasCode: "De-Alias-Code",
      inMemoryData: "Programmspeicher",
      machineCode: "Maschinencode",
      samplePrograms: "Beispielprogramme",
      instructionSet: "Befehlssatz",
      aliases: "Aliase",
      userManual: "Benutzerhandbuch"
    },
    placeholder: {
      asm: "Assemblycode einfügen oder eingeben...",
      dealias: "De-Alias-Ansicht",
      memoryInput: "0x0000:0xA"
    },
    btn: {
      loadASM: "ASM laden",
      convert: "Code assemblieren",
      converted: " Code assembliert ",
      runNext: "Nächster Schritt",
      runAll: "Alles ausführen",
      reRunNext: "Erneut nächster",
      reRunAll: "Erneut ausführen",
      pause: "⏸ Pause",
      continue: "▶ Fortsetzen",
      reset: "Zurücksetzen",
      importMemory: "Speicher importieren",
      exportMemory: "Speicher exportieren",
      add: "Hinzufügen",
      addMemory: "Speicher hinzufügen",
      set: "Setzen",
      copy: "Kopieren",
      download: "Herunterladen"
    },
    speed: { label: "Geschwindigkeit" },
    status: { ip: "IP" },
    flag: {
      cf: "CF (Übertrags-Flag)",
      zf: "ZF (Null-Flag)",
      of: "OF (Überlauf-Flag)",
      nf: "NF (Negativ-Flag)"
    },
    card: { userMemory: "Datenspeicher" },
    instr: {
      syntax: "Syntax",
      description: "Beschreibung",
      use: "Verwenden"
    },
    alias: { usage: "Verwendung" },
    general: "Allgemein",
    registerConst: "(konstant)",
    aria: {
      hamburger: "Navigation umschalten",
      lang: "Sprache",
      resizeMain: "Größe ändern: Ziehen für links/rechts",
      resizeViewer: "Größe ändern: Ziehen zum Anpassen",
      fias: "FIAS Frankfurt Institute for Advanced Studies",
      goethe: "Goethe-Universität Frankfurt"
    },
    modal: {
      resetTitle: "Simulator zurücksetzen?",
      resetBody: "Möchten Sie den aktuell geschriebenen ASM-Programmtext nach dem Zurücksetzen behalten?",
      clearCode: "Code löschen",
      keepCode: "Code behalten"
    },
    msg: {
      provideAsm: "Bitte geben Sie ein ASM-Programm zum Konvertieren ein.",
      assemblyError: "Fehler bei der Assemblierung:",
      importedCount: "{n} Speicherstelle(n) importiert.",
      provideMemory: "Bitte geben Sie eine Speicheradresse und den Inhalt ein.",
      invalidFormat: "Ungültiges Format. Hexadezimal verwenden (z.B. 0x0000:0xA).",
      invalidAddress: "Ungültige Speicheradresse. Gültiger Bereich: 0x{start} - 0x{end}",
      memoryUpdated: "Benutzerspeicher an Adresse 0x{addr} auf 0x{val} aktualisiert (dezimal: {dec})",
      noProgramToLoad: "Kein Programm zum Laden. Bitte konvertieren Sie zuerst ein ASM-Programm.",
      machineCodeCopied: "Maschinencode in die Zwischenablage kopiert.",
      copyFailed: "Kopieren fehlgeschlagen — bitte manuell kopieren.",
      programFinished: "Programm beendet ({reason}). Speicher erhalten — Nächster Schritt / Alles ausführen erneut drücken.",
      programFinishedLabel: "Programm beendet",
      linePrefix: "Zeile",
      hltReached: "HLT erreicht",
      endOfProgram: "Programmende",
      manualNotLoaded: "Handbuch nicht geladen.",
      noProgramInMemory: "(kein Programm im Speicher)"
    },
    samplePrograms: {
      p0: "Summe und Differenz (ADC, SBB)",
      p1: "16-Bit-Wort: Aufbau, Maske und Rekombination (LDH, AND, OR, NOT)",
      p2: "Gesetzte Bits in einem Byte zählen (ROL-Schleife, JC, JNZ)",
      p3: "Maximum finden und Vorzeichen prüfen (BRA, JNC, JS)",
      p4: "Zeigerbasierte Speicherkopie (STR, LDD)",
      p5: "Alias-Testsuite (alle 16 Aliase)"
    },
    instrDesc: {
      NOT: "Bitweises NOT des Quellregisters ins Zielregister.",
      XOR: "Bitweises XOR von zwei Registern ins Zielregister.",
      OR: "Bitweises OR von zwei Registern ins Zielregister.",
      AND: "Bitweises AND von zwei Registern ins Zielregister.",
      ROL: "Links rotation um ein Bit (MSB → LSB, MSB → CF).",
      ROR: "Rechts rotation um ein Bit (LSB → MSB, LSB → CF).",
      SBB: "Subtraktion mit Borrow: Rd = Rs - Rt - CF.",
      ADC: "Addition mit Carry: Rd = Rs + Rt + CF.",
      LDL: "Niederwertiges Byte / 16-Bit-Konstante in Register laden.",
      LDH: "Hochwertiges Byte in Register laden (niederwertiges erhalten).",
      STO: "Register in Benutzerspeicher an fester Adresse speichern.",
      STR: "Register an Adresse in anderem Register speichern.",
      LDD: "Aus Benutzerspeicher an fester Adresse laden.",
      JZ: "Sprung wenn Nullflag gesetzt (ZF=1).",
      JNZ: "Sprung wenn Nullflag gelöscht (ZF=0).",
      JC: "Sprung wenn Übertragsflag gesetzt (CF=1).",
      JNC: "Sprung wenn Übertragsflag gelöscht (CF=0).",
      JS: "Sprung wenn Vorzeichenflag gesetzt (NF=1).",
      JMP: "Unbedingter absoluter Sprung.",
      BRA: "Bedingter Sprung. B000=immer, B100=Z, B101=C, B110=V, B111=N.",
      HLT: "Programm anhalten."
    },
    aliasCategory: {
      "Flag Management": "Flag-Verwaltung",
      "Compare / Test": "Vergleich / Test",
      "Register Operations": "Registeroperationen",
      "Bit / Shift": "Bit / Shift",
      "General": "Allgemein"
    },
    aliasDesc: {
      CLR_C: "Übertragsflag löschen. ROR auf R0 (immer 0): Bit 0 = 0 rotiert in CF, also CF = 0. Vor ADC/SBB verwenden wenn CF = 0.",
      SET_C: "CF auf 1 setzen (allgemein). Umsetzung mit ROR auf R1 (R1 ist konstant 0x0001, daher rotiert Bit0 immer als 1 in CF). Vor ADC verwenden, wenn explizit ein +1 Carry-In gewünscht ist.",
      SET_Borrow: "Borrow-Zustand für Subtraktion setzen (CF = 1 in diesem Simulator). Vor SBB verwenden, wenn bewusst eine zusätzliche Borrow-1 subtrahiert werden soll.",
      SET_Z: "Nullflag setzen. Berechnet 0 − 0 − 0 = 0 → ZF = 1. R0-Schreibzugriff wird verworfen.",
      CLR_ZNV: "Zero, Negative und Overflow in einem Befehl löschen. 1 OR 1 = 1 ≠ 0 → ZF = 0.",
      SET_N: "Vorzeichenflag setzen. NOT(R0) = NOT(0) = 0xFFFF. Bit 15 = 1 → NF = 1.",
      CMP: "Zwei Register vergleichen. Erweitert zu SBB R0, Rs, Rt. ZF=1 wenn Rs==Rt, CF=1 wenn Rs < Rt.",
      TST: "Register testen (AND mit sich selbst, Ergebnis verworfen). ZF=1 wenn Rd == 0.",
      CC_ZERO: "Bedingungskonstante für Nullflag. BRA CC_ZERO, label für Sprung wenn ZF=1.",
      ZERO: "Register R6 auf Null setzen. R0 XOR R0 = 0, geschrieben nach R6.",
      MOV: "Register nach R6 kopieren (OR Quelle mit R0 = 0 lässt Wert unverändert).",
      INC: "R6 um 1 erhöhen. ADC R6,R6,R1 = R6 + 1 + CF. Zuerst CLR_C verwenden.",
      DEC: "R6 um 1 verringern. SBB R6,R6,R1 = R6 − 1 − CF. Zuerst CLR_C verwenden.",
      NEG: "R6 negieren (Zweierkomplement). SBB R6,R0,R6 = 0 − R6 − CF. Zuerst CLR_C verwenden.",
      SHL: "R6 um 1 nach links schieben (mit 2 multiplizieren). Zuerst CLR_C verwenden.",
      SHR: "R6 um 1 nach rechts schieben (durch 2 teilen, vorzeichenlos). Zuerst CLR_C verwenden."
    },
    manual: `# SWEET16 Prozessorsimulator - Benutzerhandbuch

## Einführung
Der SWEET16 Prozessorsimulator ist ein Hilfsmittel zum Verstehen und Simulieren eines 16-Bit-Prozessors. Sie können Assemblycode eingeben, Befehle einzeln ausführen und Register, Flags sowie Speicher in Echtzeit beobachten.

## Hauptfunktionen
1. Assemblycode eingeben: Fügen Sie Ihren Assemblycode in den bereitgestellten Textbereich ein.
2. Befehlsausführung: Führen Sie Befehle einzeln aus oder laden Sie vordefinierte Beispielprogramme.
3. Speicherverwaltung: Aktualisieren Sie den Speicher dynamisch mit Hexadezimalwerten.
4. Echtzeit-Visualisierung: Beobachten Sie Änderungen in Registern, Flags und Speicher.
5. Befehlssatz: Unterstützt arithmetische, logische, Steuer- und Speicherbefehle.

## Schnellstart
1. Programm laden:
   - Fügen Sie Ihren Assemblycode in den „Originalcode“-Bereich ein.
   - Klicken Sie auf „Konvertieren“.

2. Befehle ausführen:
   - „Nächster Schritt“ für einen Befehl.
   - Die Ergebnisse erscheinen in Echtzeit in Registern, Flags und Speicher.

3. Speicher aktualisieren:
   - Adresse und Inhalt im Format „ADRESSE:INHALT“ (z.B. 0008:0010) eingeben.
   - Auf „Hinzufügen“ klicken.

4. Register und Flags:
   - Alle Register (R0 bis R7) werden dynamisch angezeigt.
   - Flags (CF, ZF, OF, NF) aktualisieren sich nach jedem sie ändernden Befehl.

## Reiter und Inhalte
1. Beispielprogramme: Klicken Sie auf den Reiter für Beispiel-Assemblyprogramme.
2. Befehlssatz: Reiter für unterstützte Befehle, Syntax und Beispiele.
3. Benutzerhandbuch: Dieser Leitfaden.`
  };
})(typeof window !== "undefined" ? window : this);
