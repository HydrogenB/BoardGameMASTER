## PRD: Board Game Master — Game #2 “Catan” (Frontend-only, Thai-first)

### 1) Objective

Build the **Catan Host Assistant** as a turn-by-turn “rolling lyric” instruction experience (same core player pattern as Werewolf), optimized for a host to run setup + enforce turn structure + handle edge cases fast. **No backend**. **All UI and script text in Thai**.

### 2) Target Users

* **Host/Facilitator (GM-like)**: wants a clean checklist + turn loop prompts.
* **New groups**: need reminders for setup, placement order, “rolled 7”, robber rules, build/trade constraints.

### 3) Non-goals (MVP)

* Full rules engine that validates every legal move
* Multiplayer sync
* Auto score calculation from board state
* Expansion rules (Seafarers/C&K) in MVP

---

# 4) Information Architecture / Routes

* `/` Landing: list games (Werewolf + Catan)
* `/catan/setup` Create session
* `/catan/play` Rolling lyric play
* `/catan/summary` Summary + export JSON

---

# 5) UX Principles (Catan-specific)

* **Single primary action**: “ทำเสร็จแล้ว” (Mark done)
* **Never block the table**: edge-case flows must be callable in 1 tap (bottom dock quick actions)
* **Readable aloud**: 1–2 short Thai sentences per step
* **State-light but context-rich**: show current player + phase + quick reminders

---

# 6) Requirements (MVP) — Setup → Play → Notes → Summary

## Requirement 1: Catan Setup (Session Creation)

**Description**
Host sets party + rules preferences before starting. Should support 3–4 players baseline, optional 5–6 extension toggle.

**Solution & Design**
Page: `/catan/setup`

### Setup fields

1. Party

* `playerCount`: 3–4 (default 4)
* `playerNames[]`: optional but recommended (default: ผู้เล่น A/B/C/D)
* `turnTimerEnabled`: bool
* `turnTimerSeconds`: 60–180 (default 120)

2. Victory condition

* `victoryPointsTarget`: default 10

3. Board setup mode

* `boardMode`:

  * `BEGINNER` (แนะนำสำหรับมือใหม่)
  * `RANDOMIZED` (สุ่มไทล์/ตัวเลข/พอร์ต)
  * `MANUAL` (จัดเองตามกล่อง)
* `friendlyRobberEnabled`: bool (optional house rule)

4. Trading reminders

* `enableTradePrompts`: bool (default ON)
* `enablePortReminders`: bool (default ON)

5. Checkpoints / Notes

* `checkpointsEnabled`: default ON (หลังจบรอบ หรือหลังเหตุการณ์สำคัญ)
* `notesEnabled`: default ON
* `quickTagsEnabled`: default ON (เช่น “ของน้อย”, “ถือ ore”, “กำลังล่า longest road”)

### Validation

* playerCount in allowed range
* names unique (if provided)
* VP target 8–12 (limit)

CTA:

* Primary: “เริ่มเกม Catan”
* Persist last settings to LocalStorage.

---

## Requirement 2: Catan Play UI (Rolling Lyric + Current Player)

**Description**
Same lyric-style stack UI, but must add “current player” and “quick event flows”.

**Solution & Design**
Page: `/catan/play`

### Top bar

* Title: “Catan”
* Session badge: `4 คน • เป้าหมาย 10 VP • Timer 120s`
* Current player indicator: `ตาของ: ผู้เล่น B`
* Progress: `ตั้งกระดาน 3/9` or `รอบที่ 2 • ตา B • 2/8`

### Center: RollingLyricView

* 7–11 lines, active centered, fade others
* Tap active text = “ทำเสร็จแล้ว”
* Auto snap to active step on done/back

### Bottom dock (Catan needs quick actions)

Primary:

* `ทำเสร็จแล้ว`

Secondary:

* `ย้อนกลับ`
* `ข้าม` (only if step.can_skip)
* `จดโน้ต`

Quick actions (buttons or overflow menu):

* `ทอยได้ 7` (jump to Robber flow)
* `จบตา / ผู้เล่นถัดไป` (explicit end-turn action)
* `เตือนเทรด/สร้าง` (optional helper sheet)

Keyboard:

* Space = done
* ← = back

---

## Requirement 3: Catan Script Engine (Phase-based + repeatable turn loop)

**Description**
Catan is repetitive by turns. Script must be generated from settings and allow “loop phases”.

**Solution & Design**
Implement `scriptFactory(settings) => phases[]` with these phase groups:

### Phase 0: เตรียมเกม (Setup Checklist)

Example steps (Thai, short):

* “เลือกโหมดกระดาน: Beginner/สุ่ม/จัดเอง”
* “วางไทล์ทรัพยากร + ทะเลทราย”
* “วางหมายเลข (ห้ามวาง 6 ติด 8 ใน Beginner ถ้าใช้กติกาบ้าน)” *(as reminder; not strict engine)*
* “วางพอร์ต”
* “แจกทรัพยากรเริ่มต้น (ถ้าใช้กติกานั้น)”
* “เลือกคนเริ่ม (สุ่ม)”

### Phase 1: วางบ้านเริ่มต้น (Initial Placement)

Needs “snake order”:

* รอบที่ 1: A → B → C → D วาง “ถนน 1 + บ้าน 1”
* รอบที่ 2: D → C → B → A วาง “ถนน 1 + บ้าน 1” และ “รับทรัพยากรจากบ้านหลังที่ 2”
  UI should show which player is placing now and provide “ทำเสร็จแล้ว” to advance.

### Phase 2: วนลูปตาเล่น (Main Turn Loop)

For each player turn:

1. “เริ่มตา: ผู้เล่น X”
2. “ทอยลูกเต๋า”
3. “แจกทรัพยากรตามผล (ย้ำ: ถ้า 7 ไป Robber)”
4. “ช่วงเทรด (ถ้ามี): ธนาคาร/พอร์ต/ผู้เล่น”
5. “ช่วงสร้าง/อัปเกรด: ถนน/บ้าน/เมือง/การ์ดพัฒนา”
6. “จบตา: ส่งให้ผู้เล่นถัดไป”

### Special subflows (jump-in)

* **Robber Flow (เมื่อทอย 7)**:

  * “ทุกคนที่มีเกิน 7 ใบ ทิ้งครึ่งหนึ่ง (ปัดเศษลง)”
  * “ผู้เล่น X ย้ายโจรไปช่องใหม่”
  * “เลือกผู้เล่นขโมยการ์ด 1 ใบ (ถ้ามีสิ่งปลูกสร้างติดกัน)”
  * “กลับไปช่วงเทรด/สร้างของผู้เล่น X”

### CHECKPOINT steps (optional)

* หลัง “จบรอบ” หรือ “หลัง Robber”:

  * rating 1–5 + note + skip

> Implementation note: don’t hardcode infinite loops in static list. Use either:

* generate N rounds (e.g., 20 rounds max) and allow “จบเกม” early, OR
* store `turnIndex` in state and compute “current step list” dynamically (recommended).

---

## Requirement 4: Turn Control + Player Rotation

**Description**
Host must advance within turn and also rotate to next player deterministically.

**Solution & Design**

* State:

  * `currentPlayerIndex`
  * `roundNumber`
  * `phaseKey`: SETUP / PLACEMENT / TURN_LOOP / ROBBER
* Provide explicit action:

  * Button `จบตา / ผู้เล่นถัดไป`:

    * increments player index
    * when wraps, roundNumber++
    * jumps to “เริ่มตา: ผู้เล่น X” step

---

## Requirement 5: Notes (Mark Note)

**Description**
Notes must attach to the current context (round, player, phase). Catan notes often refer to who is hoarding what.

**Solution & Design**
Bottom sheet:

* noteText (required)
* playerLabel (optional; default current player)
* tags quick (if enabled): “ของเยอะ”, “ขาด brick”, “เน้น dev card”, “ล่า longest road”, “สงสัยถือ wheat”
  Auto attach:
* `phaseKey`, `roundNumber`, `currentPlayer`, `stepId`, timestamp

---

## Requirement 6: Game Summary (Catan)

**Description**
Summary should be useful: what settings used, how long game ran, notes timeline, checkpoints.

**Solution & Design**
Page: `/catan/summary`
Sections:

1. Overview:

* playerCount, VP target, boardMode, timer setting, checkpoints on/off
* startedAt, endedAt (if completed)
* last progress (round/player) if abandoned

2. Notes timeline:

* filter by playerLabel/tag

3. Checkpoint report:

* avg rating + list

4. Export:

* download `catan_session_{date}_{sessionId}.json`

Actions:

* `จบเกม` sets status COMPLETED
* `กลับไปเล่นต่อ` resumes `/catan/play`

---

# 7) Component List (Catan additions)

Shared:

* `RollingLyricView`
* `StepPlayer`
* `SessionMenuSheet`
* `NotesSheet`
* `CheckpointCard`
* `SummaryPage`

Catan-specific:

* `PlayerChip` (current player display)
* `TurnControlDock` (includes “Next player”, “Rolled 7”)
* `CatanScriptFactory`

---

# 8) Data Model (Catan)

`CatanSettings`:

* playerCount, playerNames[]
* victoryPointsTarget
* boardMode (BEGINNER/RANDOMIZED/MANUAL)
* friendlyRobberEnabled
* turnTimerEnabled, turnTimerSeconds
* enableTradePrompts, enablePortReminders
* notesEnabled, quickTagsEnabled
* checkpointsEnabled, checkpointFrequency

`CatanSessionRuntime`:

* phaseKey
* currentPlayerIndex
* roundNumber
* lastDiceRoll? (optional)
* flags: `robberPending` (optional)

---

# 9) Thai Localization Requirements

* All UI labels in Thai:

  * “เริ่มเกม Catan”, “ทำเสร็จแล้ว”, “จบตา / ผู้เล่นถัดไป”, “ทอยได้ 7”, “จดโน้ต”, “สรุปเกม”
* Thai typography rules identical to Werewolf (big text, high contrast, responsive)

---

# 10) MVP Acceptance Criteria

* Setup can create session (3–4 players) and persists settings
* Play starts at Phase 0 “เตรียมเกม”
* Placement phase supports snake order and shows current player
* Turn loop works with:

  * Mark done step-by-step
  * explicit “Next player”
  * “Rolled 7” subflow jump and return to turn
* Notes attach to round/player and appear in summary
* Checkpoints optional, skippable
* Summary + JSON export works, refresh resumes session

---

If you want, I can also generate the **Thai step script template** for Catan (Prep + Placement + Turn loop + Robber) in the exact JSON structure you already use (`strings.th.ts` + `scriptFactory.ts`) so dev can drop it in immediately.
