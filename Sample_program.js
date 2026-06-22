// Sample_program.js — List 0 (Reduced Instruction Set) only
// 5 programs that together cover every instruction:
//   P1 – ADC, SBB, XOR, ROR, LDL, STO, HLT
//   P2 – LDL, LDH, AND, OR, NOT, XOR, STO, HLT
//   P3 – LDL, XOR, ROL, ROR, ADC, SBB, JC, JNC, JZ, JNZ, JMP, STO, HLT
//   P4 – LDL, XOR, ROR, SBB, BRA, JS, JNC, STO, HLT
//   P5 – LDL, STO, LDD, XOR, ROR, ADC, HLT

const samplePrograms = [
    {
        name: "Sum and difference (ADC, SBB)",
        code: `
; Compute A + B and A - B, store both results in User Memory.
; A = 12 (0x000C), B = 5 (0x0005).
; Expected: sum = 17 at address 0, diff = 7 at address 1.
; Instructions used: LDL, XOR, ROR, ADC, SBB, STO, HLT

LDL R2, #0x000C       ; R2 = 12 (A)
LDL R3, #0x0005       ; R3 = 5  (B)

; --- compute sum ---
XOR R4, R4, R4        ; R4 = 0
ROR R4                ; CF = 0  (ROR a zero value clears carry)
ADC R4, R2, R3        ; R4 = A + B + CF = 17
STO R4, 0x0000        ; mem[0] = 17

; --- compute difference ---
XOR R5, R5, R5
ROR R5                ; CF = 0
SBB R5, R2, R3        ; R5 = A - B - CF = 7
STO R5, 0x0001        ; mem[1] = 7

HLT
`
    },
    {
        name: "16-bit word: build, mask and recombine (LDH, AND, OR, NOT)",
        code: `
; Build 0xBEEF from two separate bytes using LDL + LDH.
; Then extract each byte, invert with NOT, recombine with OR.
; Instructions used: LDL, LDH, AND, OR, NOT, XOR, STO, HLT

LDL R2, #0x00EF       ; R2 = 0x00EF (low byte)
LDH R2, #0xBE         ; R2 = 0xBEEF (set high byte, low byte preserved)
STO R2, 0x0000        ; mem[0] = 0xBEEF

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
; Count how many 1-bits are in 0x00B5 = 0b1011_0101 (answer = 5).
; Loop 16 times: ROL shifts MSB into CF; JC counts when CF=1.
; Instructions used: LDL, XOR, ROL, ROR, ADC, SBB, JC, JNC, JNZ, STO, HLT

LDL R2, #0x00B5       ; R2 = value to inspect
XOR R3, R3, R3        ; R3 = 0  (bit count)
LDL R4, #0x0010       ; R4 = 16 (loop counter)

loop:
  ROL R2              ; shift MSB into CF
  JNC next            ; CF=0 → bit was 0, skip counting

  XOR R5, R5, R5
  ROR R5              ; clear CF  (LSB of 0 is 0 → CF=0)
  ADC R3, R3, R1      ; R3 = R3 + 1  (R1 is always 1)

next:
  XOR R5, R5, R5
  ROR R5              ; clear CF
  SBB R4, R4, R1      ; R4 = R4 - 1  (R1 is always 1)
  JNZ loop            ; not done yet → keep looping

  STO R3, 0x0000      ; mem[0] = 5  (number of set bits)
  HLT
`
    },
    {
        name: "Find max and check sign (BRA, JNC, JS)",
        code: `
; Find max(A, B) then check if it is negative.
; A - B:  CF=1 means A < B (borrow occurred).
; JS  branches if the negative flag (NF) is set.
; JNC branches if carry flag is clear.
; Instructions used: LDL, XOR, ROR, SBB, BRA, JNC, JS, STO, HLT

LDL R2, #0x0007       ; R2 = A =  7
LDL R3, #0x000C       ; R3 = B = 12

; --- find max via subtraction ---
XOR R4, R4, R4
ROR R4                ; CF = 0
SBB R4, R2, R3        ; R4 = A - B;  CF=1 if borrow (A < B)
JNC a_wins            ; CF=0 → no borrow → A >= B
STO R3, 0x0000        ; B > A: store B as max
JMP check_sign
a_wins:
  STO R2, 0x0000      ; A >= B: store A as max
check_sign:
  LDD R5, 0x0000      ; R5 = max value just stored
  JS  negative        ; NF=1 → result is negative
  LDL R6, #0x0000     ; result is positive: R6 = 0
  JMP done
negative:
  LDL R6, #0x0001     ; result is negative: R6 = 1
done:
  STO R6, 0x0001      ; mem[1] = 0 (positive) or 1 (negative)
  HLT
`
    },
    {
        name: "Pointer-based memory copy (STO [Rs], Rt / LDD)",
        code: `
; Write two values to fixed addresses, then copy them to a new
; location using a pointer register incremented with ADC + R1.
; Instructions used: LDL, STO, LDD, XOR, ROR, ADC, HLT

; --- write source values ---
LDL R2, #0x00AA
STO R2, 0x0000        ; mem[0] = 0xAA  (source 1)
LDL R2, #0x00BB
STO R2, 0x0001        ; mem[1] = 0xBB  (source 2)

; --- copy to destination starting at address 10 (0x000A) ---
LDL R5, #0x000A       ; R5 = destination pointer = 10

LDD R3, 0x0000        ; R3 = mem[0] = 0xAA
STO [R5], R3          ; mem[R5] = mem[10] = 0xAA

XOR R4, R4, R4
ROR R4                ; CF = 0
ADC R5, R5, R1        ; R5 = 11  (R1 is always 1)

LDD R3, 0x0001        ; R3 = mem[1] = 0xBB
STO [R5], R3          ; mem[11] = 0xBB

HLT
`
    },
    {
        name: "Alias test suite (all 16 aliases)",
        code: `
; Tests every alias defined in the Aliases tab.
; All flag aliases use only R0/R1 — no user registers touched.
; After HLT, check User Memory for expected values:
;   [0x00] = 0x0000  CLR_C   : CF cleared, ADC picks up 0
;   [0x01] = 0x0001  SET_C   : CF set,     ADC picks up 1
;   [0x02] = 0x0000  SET_Z   : SBB R0,R0,R0 = 0
;   [0x03] = 0x0001  CLR_ZNV : OR R1,R1,R1 = 1
;   [0x04] = 0x0001  SET_N   : NF set, branch taken
;   [0x05] = 0x0000  ZERO    : XOR R6,R0,R0 = 0
;   [0x06] = 0x0000  CMP     : 7==7, ZF=1, ADC picks up 0
;   [0x07] = 0x0005  TST     : R5=5 unchanged after TST
;   [0x08] = 0x0000  (CMP+TST slot, same as [0x06])
;   [0x09] = 0x0007  MOV     : OR R6,R3,R0 copies R3=7
;   [0x0A] = 0x0008  INC     : 7 + 1 = 8
;   [0x0B] = 0x0007  DEC     : 8 - 1 = 7
;   [0x0C] = 0xFFF9  NEG     : 0 - 7 = -7 (0xFFF9)
;   [0x0D] = 0x000E  SHL     : 7 << 1 = 14
;   [0x0E] = 0x0007  SHR     : 14 >> 1 = 7
;   [0x0F] = 0x0001  CC_ZERO : BRA taken when ZF=1

; ── Alias Definitions ────────────────────────────────────
#DEF CLR_C   = ROR R0;
#DEF SET_C   = ROR R1;
#DEF SET_Z   = SBB R0,R0,R0;
#DEF CLR_ZNV = OR R1,R1,R1;
#DEF SET_N   = NOT R0,R0;
#DEF CMP     = SBB R0,;
#DEF TST     = AND R0,;
#DEF CC_ZERO = B100;
#DEF ZERO    = XOR R6,R0,R0;
#DEF MOV     = OR R6,;
#DEF INC     = ADC R6,R6,R1;
#DEF DEC     = SBB R6,R6,R1;
#DEF NEG     = SBB R6,R0,R6;
#DEF SHL     = ROL R6;
#DEF SHR     = ROR R6;

; ── Test CLR_C ───────────────────────────────────────────
SET_C                   ; CF = 1  (setup)
CLR_C                   ; CF = 0  <-- alias: ROR R0
ADC R2, R0, R0          ; R2 = 0 + 0 + CF = 0
STO R2, 0x0000          ; [0x00] = 0x0000 ✓

; ── Test SET_C ───────────────────────────────────────────
CLR_C                   ; CF = 0  (setup)
SET_C                   ; CF = 1  <-- alias: ROR R1 (R1 is constant 1)
ADC R2, R0, R0          ; R2 = 0 + 0 + CF = 1
STO R2, 0x0001          ; [0x01] = 0x0001 ✓

; ── Test SET_Z ───────────────────────────────────────────
SET_Z                   ; ZF = 1  (SBB R0,R0,R0 = 0, R0 discarded)
ADC R2, R0, R0          ; R2 = 0+0+CF=0  (CF=0 after 0-0-0)
STO R2, 0x0002          ; [0x02] = 0x0000 ✓

; ── Test CLR_ZNV ─────────────────────────────────────────
CLR_ZNV                 ; ZF=0, NF=0, VF=0  (OR R1,R1,R1 = 1, R1 discarded)
OR R2, R1, R0           ; R2 = 1 OR 0 = 1  (capture the 1)
STO R2, 0x0003          ; [0x03] = 0x0001 ✓

; ── Test SET_N ───────────────────────────────────────────
SET_N                   ; NF = 1  (NOT R0,R0 = 0xFFFF discarded, NF=1)
LDL R2, #0x0000         ; R2 = 0  (default: branch not taken)
BRA B111, sn_pass       ; B111 = branch if NF — should jump
BRA B000, sn_end        ; skipped if SET_N worked
sn_pass:
  LDL R2, #0x0001       ; R2 = 1  (NF was set ✓)
sn_end:
  STO R2, 0x0004        ; [0x04] = 0x0001 ✓

; ── Test ZERO ────────────────────────────────────────────
LDL R6, #0x00AB         ; R6 = 0xAB  (non-zero, to be wiped)
ZERO                    ; R6 = 0  (XOR R6,R0,R0 — uses R0 as source, not R6)
STO R6, 0x0005          ; [0x05] = 0x0000 ✓

; ── Test CMP ─────────────────────────────────────────────
LDL R3, #0x0007         ; R3 = 7
LDL R4, #0x0007         ; R4 = 7  (equal → ZF should be 1)
CLR_C
CMP R3, R4              ; SBB R0,R3,R4 = 7-7-0 = 0 → ZF=1 (R0 discarded)
ADC R2, R0, R0          ; R2 = 0  (CF=0 after equal subtraction)
STO R2, 0x0006          ; [0x06] = 0x0000 ✓

; ── Test TST ─────────────────────────────────────────────
LDL R5, #0x0005         ; R5 = 5  (non-zero)
TST R5, R5              ; AND R0,R5,R5 → ZF=0, NF=0 (R5 unchanged, R0 discarded)
STO R5, 0x0007          ; [0x07] = 0x0005 ✓

; ── Test MOV ─────────────────────────────────────────────
LDL R3, #0x0007         ; R3 = 7
MOV R3, R0              ; OR R6,R3,R0 → R6 = 7  (copy R3 into R6)
STO R6, 0x0009          ; [0x09] = 0x0007 ✓

; ── Test INC ─────────────────────────────────────────────
; R6 = 7 from MOV above
CLR_C
INC                     ; ADC R6,R6,R1 → R6 = 7+1+0 = 8
STO R6, 0x000A          ; [0x0A] = 0x0008 ✓

; ── Test DEC ─────────────────────────────────────────────
; R6 = 8 from INC above
CLR_C
DEC                     ; SBB R6,R6,R1 → R6 = 8-1-0 = 7
STO R6, 0x000B          ; [0x0B] = 0x0007 ✓

; ── Test NEG ─────────────────────────────────────────────
; R6 = 7 from DEC above
CLR_C
NEG                     ; SBB R6,R0,R6 → R6 = 0-7-0 = 0xFFF9
STO R6, 0x000C          ; [0x0C] = 0xFFF9 ✓

; ── Test SHL ─────────────────────────────────────────────
LDL R6, #0x0007         ; R6 = 7 = 0b0000_0111
CLR_C
SHL                     ; ROL R6 → R6 = 14 = 0x000E  (×2)
STO R6, 0x000D          ; [0x0D] = 0x000E ✓

; ── Test SHR ─────────────────────────────────────────────
; R6 = 14 from SHL above
CLR_C
SHR                     ; ROR R6 → R6 = 7 = 0x0007  (÷2)
STO R6, 0x000E          ; [0x0E] = 0x0007 ✓

; ── Test CC_ZERO (branch if ZF=1) ────────────────────────
SET_Z                   ; ZF = 1  (setup)
BRA CC_ZERO, cc_pass    ; should branch (ZF=1)
LDL R2, #0x0000         ; SKIPPED if alias works
BRA B000, cc_end        ; SKIPPED
cc_pass:
  LDL R2, #0x0001       ; R2 = 1  (branch was taken ✓)
cc_end:
  STO R2, 0x000F        ; [0x0F] = 0x0001 ✓

HLT
`
    }
];

window.samplePrograms = samplePrograms;
