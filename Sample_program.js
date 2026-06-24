// Sample_program.js — List 0 (Reduced Instruction Set) only
// 5 programs that together cover every instruction:
//   P1 – ADC, SBB, XOR, ROR, LDL, STO, HLT
//   P2 – LDL, LDH, AND, OR, NOT, XOR, STO, HLT
//   P3 – LDL, XOR, ROL, ROR, ADC, SBB, JC, JZ, JMP, STO, HLT (+ JNC/JNZ assembler sugar)
//   P4 – LDL, XOR, ROR, SBB, BRA, STO, HLT (+ JNC/JS assembler sugar)
//   P5 – LDL, STO, LDD, XOR, ROR, ADC, HLT

const samplePrograms = [
    {
        name: "Sum and difference (ADC, SBB)",
        code: `
; ═══════════════════════════════════════════════════════════════════════
; WHAT THIS PROGRAM DOES
;   Loads A=12 and B=5, computes sum (A+B) and difference (A-B),
;   stores both results in user memory using indirect STO [Rs], Rt.
;
; ── USER MEMORY (check after HLT) ─────────────────────────────────────
;   Address   Hex       Dec   Written by          Meaning
;   [0x00]    0x0011     17   STO [R0], R4        A + B  (12 + 5)
;   [0x01]    0x0007      7   STO [R1], R5        A - B  (12 - 5)
;   (all other addresses stay 0 unless you preloaded memory)
;
; ── REGISTERS (check after HLT) ─────────────────────────────────────────
;   Reg   Hex       Dec   Role
;   R0    0x0000      0   pointer to mem[0] (hardware constant)
;   R1    0x0001      1   pointer to mem[1] (hardware constant)
;   R2    0x000C     12   A — input, unchanged
;   R3    0x0005      5   B — input, unchanged
;   R4    0x0011     17   sum  (same value as mem[0x00])
;   R5    0x0007      7   diff (same value as mem[0x01])
;   R6    0x0000      0   unused
;   R7    0x0000      0   unused
;
; ── FLAGS (after HLT) ───────────────────────────────────────────────────
;   CF=0  ZF=0  NF=0  VF=0  (SBB 12-5 produced positive non-zero result)
;
; HOW TO VERIFY
;   1. Convert → Run All until HLT
;   2. User Memory: row 0x00 = 17, row 0x01 = 7
;   3. Registers: R4 purple 0x11, R5 purple 0x7, R2/R3 still 12 and 5
;
; INSTRUCTIONS USED: LDL, XOR, ROR, ADC, SBB, STO, HLT
; ═══════════════════════════════════════════════════════════════════════

LDL R2, #0x000C       ; R2 = 12 (A)
LDL R3, #0x0005       ; R3 = 5  (B)

; --- compute sum ---
XOR R4, R4, R4        ; R4 = 0
ROR R4, R4            ; CF = 0  (ROR a zero value clears carry)
ADC R4, R2, R3        ; R4 = A + B + CF = 17
STO [R0], R4        ; mem[0] = 17

; --- compute difference ---
XOR R5, R5, R5
ROR R5, R5            ; CF = 0
SBB R5, R2, R3        ; R5 = A - B - CF = 7
STO [R1], R5        ; mem[1] = 7

HLT
`
    },
    {
        name: "16-bit word: build, mask and recombine (LDH, AND, OR, NOT)",
        code: `
; ═══════════════════════════════════════════════════════════════════════
; WHAT THIS PROGRAM DOES
;   Builds 0xBEEF from bytes (LDL + LDH), masks out low/high bytes,
;   inverts a mask with NOT, recombines with OR, then clears R2.
;
; ── USER MEMORY (check after HLT) ─────────────────────────────────────
;   Address   Hex       Dec   Written by          Meaning
;   [0x00]    0xBEEF  48879   STO [R0], R2        full 16-bit word
;
; ── REGISTERS (check after HLT) ─────────────────────────────────────────
;   Reg   Hex       Dec   Role / how it was produced
;   R0    0x0000      0   hardware constant
;   R1    0x0001      1   hardware constant
;   R2    0x0000      0   cleared at end (was 0xBEEF before XOR R2,R2,R2)
;   R3    0x00FF    255   low-byte mask  (0b00000000_11111111)
;   R4    0x00EF    239   low byte of BEEF (0xBEEF AND 0x00FF)
;   R5    0xFF00  65280   NOT(0x00FF) → high-byte mask
;   R6    0xBE00  48640   high byte of BEEF (0xBEEF AND 0xFF00)
;   R7    0xBEEF  48879   OR(R4,R6) — recombined word
;
; ── FLAGS (after HLT) ───────────────────────────────────────────────────
;   CF=0  ZF=1  NF=0  VF=0  (last op XOR R2,R2,R2 gave zero)
;
; HOW TO VERIFY
;   1. Run All → HLT
;   2. User Memory [0x00] must show 0xBEEF
;   3. Registers: R7=0xBEEF, R4=0xEF, R6=0xBE00, R2=0 (orange)
;
; INSTRUCTIONS USED: LDL, LDH, AND, OR, NOT, XOR, STO, HLT
; ═══════════════════════════════════════════════════════════════════════

LDL R2, #0x00EF       ; R2 = 0x00EF (low byte)
LDH R2, #0xBE         ; R2 = 0xBEEF (set high byte, low byte preserved)
STO [R0], R2        ; mem[0] = 0xBEEF

LDL R3, #0x00FF       ; R3 = 0x00FF (low-byte mask)
AND R4, R2, R3        ; R4 = 0x00EF  (extract low byte)
NOT R5, R3            ; R5 = 0xFF00  (invert mask → high-byte mask)
AND R6, R2, R5        ; R6 = 0xBE00  (extract high byte)
OR  R7, R4, R6        ; R7 = 0xBEEF  (recombine both bytes)

XOR R2, R2, R2        ; R2 = 0  (clear using XOR-self)
HLT
`
    },
    {
        name: "Count set bits in a byte (ROL loop, JC, JNZ)",
        code: `
; ═══════════════════════════════════════════════════════════════════════
; WHAT THIS PROGRAM DOES
;   Counts 1-bits in 0x00B5 (= 0b00000000_10110101 → five 1-bits).
;   Loops 16 times: ROL shifts MSB into CF; if CF=1, increment counter.
;
; ── USER MEMORY (check after HLT) ─────────────────────────────────────
;   Address   Hex     Dec   Meaning
;   [0x00]    0x0005    5   number of set bits in 0xB5
;
; ── REGISTERS (check after HLT) ─────────────────────────────────────────
;   Reg   Hex       Dec   Role
;   R0    0x0000      0   hardware constant (mem[0] pointer)
;   R1    0x0001      1   hardware constant (used as +1 in ADC)
;   R2    0x00B5    181   input rotated 16× with CF=0 each time → back to start
;   R3    0x0005      5   bit counter (same as mem[0x00])
;   R4    0x0000      0   loop counter (started 16, counted down to 0)
;   R5    0x0000      0   scratch for clearing CF
;   R6    0x0000      0   unused
;   R7    0x0000      0   unused
;
; ── FLAGS (after HLT) ───────────────────────────────────────────────────
;   CF=0  ZF=1  NF=0  (last SBB R4,R4,R1 made R4=0)
;
; BIT COUNT CHECK: 0xB5 = bits at positions 0,2,4,5,7 → 5 ones
;
; HOW TO VERIFY
;   1. Run All → HLT
;   2. User Memory [0x00] = 5
;   3. Register R3 = 5 (purple), R4 = 0 (orange)
;
; INSTRUCTIONS USED: LDL, XOR, ROL, ROR, ADC, SBB, JC, JNC, JNZ, STO, HLT
; ═══════════════════════════════════════════════════════════════════════

LDL R2, #0x00B5       ; R2 = value to inspect
XOR R3, R3, R3        ; R3 = 0  (bit count)
LDL R4, #0x0010       ; R4 = 16 (loop counter)

loop:
  ROL R2, R2          ; shift MSB into CF
  JNC next            ; CF=0 → bit was 0, skip counting

  XOR R5, R5, R5
  ROR R5, R5          ; clear CF  (LSB of 0 is 0 → CF=0)
  ADC R3, R3, R1      ; R3 = R3 + 1  (R1 is always 1)

next:
  XOR R5, R5, R5
  ROR R5, R5          ; clear CF
  SBB R4, R4, R1      ; R4 = R4 - 1  (R1 is always 1)
  JNZ loop            ; not done yet → keep looping

  STO [R0], R3      ; mem[0] = 5  (number of set bits)
  HLT
`
    },
    {
        name: "Find max and check sign (BRA, JNC, JS)",
        code: `
; ═══════════════════════════════════════════════════════════════════════
; WHAT THIS PROGRAM DOES
;   A=7, B=12 → find max via SBB (borrow means A<B), store max in mem[0],
;   reload it, test sign bit (JS), store 0=positive or 1=negative in mem[1].
;
; ── USER MEMORY (check after HLT) ─────────────────────────────────────
;   Address   Hex     Dec   Meaning
;   [0x00]    0x000C   12   max(A,B) — B wins (7 < 12)
;   [0x01]    0x0000    0   sign of max: 0=positive, 1=negative
;
; ── REGISTERS (check after HLT) ─────────────────────────────────────────
;   Reg   Hex     Dec   Role
;   R0    0x0000    0   hardware constant
;   R1    0x0001    1   hardware constant
;   R2    0x0007    7   A (unchanged)
;   R3    0x000C   12   B (unchanged)
;   R4    0xFFFB 65531   A-B = 7-12 = -5 (scratch; not stored)
;   R5    0x000C   12   max reloaded from mem[0] via LDD R5,[R0]
;   R6    0x0000    0   sign result (same as mem[0x01])
;   R7    0x0000    0   unused
;
; ── FLAGS (after HLT) ───────────────────────────────────────────────────
;   CF=1  ZF=0  NF=0  VF=0  (last LDL R6,#0 cleared flags to ZF=1,NF=0)
;
; BRANCH PATH TAKEN: JNC skipped → STO B → JS skipped (12 is positive)
;
; HOW TO VERIFY
;   1. Run All → HLT
;   2. User Memory: [0x00]=12, [0x01]=0
;   3. Registers: R5=12, R6=0, R2=7, R3=12
;
; INSTRUCTIONS USED: LDL, XOR, ROR, SBB, BRA, JNC, JS, STO, LDD, JMP, HLT
; ═══════════════════════════════════════════════════════════════════════

LDL R2, #0x0007       ; R2 = A =  7
LDL R3, #0x000C       ; R3 = B = 12

; --- find max via subtraction ---
XOR R4, R4, R4
ROR R4, R4            ; CF = 0
SBB R4, R2, R3        ; R4 = A - B;  CF=1 if borrow (A < B)
JNC a_wins            ; CF=0 → no borrow → A >= B
STO [R0], R3        ; B > A: store B as max
JMP check_sign
a_wins:
  STO [R0], R2      ; A >= B: store A as max
check_sign:
  LDD R5, [R0]      ; R5 = max value just stored
  JS  negative        ; NF=1 → result is negative
  LDL R6, #0x0000     ; result is positive: R6 = 0
  JMP done
negative:
  LDL R6, #0x0001     ; result is negative: R6 = 1
done:
  STO [R1], R6      ; mem[1] = 0 (positive) or 1 (negative)
  HLT
`
    },
    {
        name: "Pointer-based memory copy (STO [Rs], Rt / LDD)",
        code: `
; ═══════════════════════════════════════════════════════════════════════
; WHAT THIS PROGRAM DOES
;   Stores 0xAA and 0xBB at mem[0] and mem[1], then copies them to
;   mem[10] and mem[11] using pointer R5 and indirect LDD/STO.
;
; ── USER MEMORY (check after HLT) ─────────────────────────────────────
;   Address   Hex     Dec   Meaning
;   [0x00]    0x00AA  170   source byte 1 (original)
;   [0x01]    0x00BB  187   source byte 2 (original)
;   [0x02]–[0x09]         (unchanged, should be 0)
;   [0x0A]    0x00AA  170   copy of source 1
;   [0x0B]    0x00BB  187   copy of source 2
;
; ── REGISTERS (check after HLT) ─────────────────────────────────────────
;   Reg   Hex     Dec   Role
;   R0    0x0000    0   points to mem[0] (constant)
;   R1    0x0001    1   points to mem[1] (constant)
;   R2    0x00BB  187   last LDL value (0xBB) before overwrite
;   R3    0x00BB  187   last LDD value (from mem[1])
;   R4    0x0000    0   scratch (cleared for CF=0)
;   R5    0x000B   11   destination pointer (incremented 10→11)
;   R6    0x0000    0   unused
;   R7    0x0000    0   unused
;
; ── FLAGS (after HLT) ───────────────────────────────────────────────────
;   CF=0  ZF=0  NF=0  (last ADC R5,R5,R1)
;
; HOW TO VERIFY
;   1. Run All → HLT
;   2. User Memory scroll: 0x00=AA, 0x01=BB, 0x0A=AA, 0x0B=BB
;   3. Register R5 = 11 (0xB), R3 = 0xBB
;
; INSTRUCTIONS USED: LDL, STO, LDD, XOR, ROR, ADC, HLT
; ═══════════════════════════════════════════════════════════════════════

; --- write source values ---
LDL R2, #0x00AA
STO [R0], R2        ; mem[0] = 0xAA  (source 1)
LDL R2, #0x00BB
STO [R1], R2        ; mem[1] = 0xBB  (source 2)

; --- copy to destination starting at address 10 (0x000A) ---
LDL R5, #0x000A       ; R5 = destination pointer = 10

LDD R3, [R0]        ; R3 = mem[0] = 0xAA
STO [R5], R3          ; mem[R5] = mem[10] = 0xAA

XOR R4, R4, R4
ROR R4, R4            ; CF = 0
ADC R5, R5, R1        ; R5 = 11  (R1 is always 1)

LDD R3, [R1]        ; R3 = mem[1] = 0xBB
STO [R5], R3          ; mem[11] = 0xBB

HLT
`
    },
    {
        name: "Alias test suite (16 #DEF aliases + STR)",
        code: `
; ═══════════════════════════════════════════════════════════════════════
; WHAT THIS PROGRAM DOES
;   One automated test per #DEF alias (16 total). Each test stores a
;   proof value in user memory. STR tested last as assembler mnemonic.
;
; ── USER MEMORY (check every row after HLT) ─────────────────────────────
;   Addr  Hex     Dec  Alias tested       What proves it worked
;   [00]  0x0000    0  CLR_C              ADC after clear-CF added 0
;   [01]  0x0001    1  SET_C              ADC after set-CF added 1
;   [02]  0x0000    0  SET_Z              ADC after zero-flag set
;   [03]  0x0001    1  CLR_ZNV            OR captured 1 after flags cleared
;   [04]  0x0001    1  SET_N              BRA B111 taken when NF=1
;   [05]  0x0000    0  ZERO               R6 wiped from 0xAB to 0
;   [06]  0x0000    0  CMP                7==7 → equal, ADC gave 0
;   [07]  0x0005    5  TST                R5 still 5 after TST R5,R5
;   [08]  0x0001    1  SET_Borrow         ADC after borrow set added 1
;   [09]  0x0007    7  MOV                R3 copied into R6
;   [0A]  0x0008    8  INC                R6 = 7+1
;   [0B]  0x0007    7  DEC                R6 = 8-1
;   [0C]  0xFFF9 65529  NEG                0-7 = -7 (two's complement)
;   [0D]  0x000E   14  SHL                7<<1 with CF=0
;   [0E]  0x0007    7  SHR                14>>1 with CF=0
;   [0F]  0x0001    1  CC_ZERO            BRA B100 when ZF=1
;   [10]  0x0007    7  STR                STR R6,R7 stored R6 via [R7]
;
; ── REGISTERS (check after HLT) ─────────────────────────────────────────
;   Reg   Hex     Dec   Last role in program
;   R0    0x0000    0   hardware constant (writes discarded)
;   R1    0x0001    1   hardware constant
;   R2    0x0001    1   CC_ZERO branch-taken proof
;   R3    0x0007    7   MOV test source
;   R4    0x0007    7   STR read-back (LDD R4,[R7])
;   R5    0x0005    5   TST operand (unchanged by TST)
;   R6    0x0007    7   after SHR (also stored by STR at [0x10])
;   R7    0x0010   16   pointer for STR test slot
;
; ── FLAGS (after HLT) ───────────────────────────────────────────────────
;   CF=0  ZF=0  NF=0  (after last LDL R7,#0x10)
;
; HOW TO VERIFY
;   1. Run All → HLT
;   2. User Memory: scan [0x00]–[0x10] against table above
;   3. Any mismatch → that alias test failed
;   4. Registers R2–R7 as listed (R0/R1 always 0 and 1)
;
; INSTRUCTIONS: full reduced ISA + 16 #DEF aliases + STR mnemonic
; ═══════════════════════════════════════════════════════════════════════

; ── Alias Definitions (all 16 #DEF entries from Aliases tab) ─────────────
#DEF CLR_C      = ROR R0, R0;
#DEF SET_C      = ROR R1, R1;
#DEF SET_Borrow = SBB R0,R0,R1;
#DEF SET_Z      = SBB R0,R0,R0;
#DEF CLR_ZNV    = OR R1,R1,R1;
#DEF SET_N      = NOT R0,R0;
#DEF CMP        = SBB R0,;
#DEF TST        = AND R0,;
#DEF CC_ZERO    = B100;
#DEF ZERO       = XOR R6,R0,R0;
#DEF MOV        = OR R6,;
#DEF INC        = ADC R6,R6,R1;
#DEF DEC        = SBB R6,R6,R1;
#DEF NEG        = SBB R6,R0,R6;
#DEF SHL        = ROL R6, R6;
#DEF SHR        = ROR R6, R6;

; ── Test CLR_C ───────────────────────────────────────────
SET_C                   ; CF = 1  (setup)
CLR_C                   ; CF = 0  (ROR R0, R0)
ADC R2, R0, R0          ; R2 = 0 + 0 + CF = 0
STO [R0], R2            ; [0x00] = 0x0000

; ── Test SET_C ───────────────────────────────────────────
CLR_C
SET_C                   ; CF = 1  (ROR R1, R1)
ADC R2, R0, R0          ; R2 = 1
STO [R1], R2            ; [0x01] = 0x0001

; ── Test SET_Z ───────────────────────────────────────────
SET_Z                   ; ZF = 1
ADC R2, R0, R0          ; R2 = 0  (CF=0 after 0-0-0)
LDL R7, #0x02
STO [R7], R2            ; [0x02] = 0x0000

; ── Test CLR_ZNV ─────────────────────────────────────────
CLR_ZNV                 ; ZF=0, NF=0, VF=0
OR R2, R1, R0           ; R2 = 1
LDL R7, #0x03
STO [R7], R2            ; [0x03] = 0x0001

; ── Test SET_N ───────────────────────────────────────────
SET_N                   ; NF = 1  (NOT R0,R0)
BRA B111, sn_pass       ; must branch before any op clears NF
LDL R2, #0x0000         ; fallthrough only if branch failed
JMP sn_end
sn_pass:
  LDL R2, #0x0001
sn_end:
  LDL R7, #0x04
  STO [R7], R2            ; [0x04] = 0x0001

; ── Test ZERO ────────────────────────────────────────────
LDL R6, #0x00AB
ZERO                    ; R6 = 0
LDL R7, #0x05
STO [R7], R6            ; [0x05] = 0x0000

; ── Test CMP ─────────────────────────────────────────────
LDL R3, #0x0007
LDL R4, #0x0007
CLR_C
CMP R3, R4              ; 7-7-0 = 0 → ZF=1
ADC R2, R0, R0
LDL R7, #0x06
STO [R7], R2            ; [0x06] = 0x0000

; ── Test TST ─────────────────────────────────────────────
LDL R5, #0x0005
TST R5, R5              ; R5 unchanged
LDL R7, #0x07
STO [R7], R5            ; [0x07] = 0x0005

; ── Test SET_Borrow ──────────────────────────────────────
CLR_C
SET_Borrow              ; SBB R0,R0,R1 → 0-1-0, CF=1
ADC R2, R0, R0          ; R2 = 0+0+CF = 1
LDL R7, #0x08
STO [R7], R2            ; [0x08] = 0x0001

; ── Test MOV ─────────────────────────────────────────────
LDL R3, #0x0007
MOV R3, R0              ; R6 = 7
LDL R7, #0x09
STO [R7], R6            ; [0x09] = 0x0007

; ── Test INC ─────────────────────────────────────────────
CLR_C
INC                     ; R6 = 8
LDL R7, #0x0A
STO [R7], R6            ; [0x0A] = 0x0008

; ── Test DEC ─────────────────────────────────────────────
CLR_C
DEC                     ; R6 = 7
LDL R7, #0x0B
STO [R7], R6            ; [0x0B] = 0x0007

; ── Test NEG ─────────────────────────────────────────────
CLR_C
NEG                     ; R6 = 0xFFF9
LDL R7, #0x0C
STO [R7], R6            ; [0x0C] = 0xFFF9

; ── Test SHL ─────────────────────────────────────────────
LDL R6, #0x0007
CLR_C
SHL                     ; ROL R6,R6 → 14
LDL R7, #0x0D
STO [R7], R6            ; [0x0D] = 0x000E

; ── Test SHR ─────────────────────────────────────────────
CLR_C
SHR                     ; ROR R6,R6 → 7
LDL R7, #0x0E
STO [R7], R6            ; [0x0E] = 0x0007

; ── Test CC_ZERO ─────────────────────────────────────────
SET_Z                   ; ZF = 1
BRA CC_ZERO, cc_pass    ; B100: branch if ZF
LDL R2, #0x0000         ; skipped when branch works
JMP cc_end
cc_pass:
  LDL R2, #0x0001
cc_end:
  LDL R7, #0x0F
  STO [R7], R2            ; [0x0F] = 0x0001

; ── Test STR (assembler mnemonic, not #DEF) ──────────────
LDL R7, #0x10           ; R7 = pointer to test slot
STR R6, R7              ; STO [R7], R6  (R6 still 7 from SHR)
LDD R4, [R7]            ; read back
LDL R7, #0x10
STO [R7], R4            ; [0x10] = 0x0007 (confirms STR store)

HLT
`
    }
];

window.samplePrograms = samplePrograms;
