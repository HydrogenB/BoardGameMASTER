## Updated PRD Addendum — Play UI must be “rolling lyric” + “Mark done” from setup

### Requirement changes (non-negotiable)

* **The rolling text player must start from game setup** (pre-game checklist) and continue into Turn 1+.
* User (GM) advances by **Mark done** (not just “Next”). Tap-to-advance can still exist, but the UI language + mental model is “ทำเสร็จแล้ว”.
* Add **feedback checkpoint** steps (optional; user can skip globally or per checkpoint).
* Future game: **Catan** must plug into the same player pattern.

---

## Play Screen UI (Rolling lyric style)

### Layout

1. **Top bar (minimal)**

   * Game name + session summary (e.g., `Werewolf • 10 คน • แม่มด/ผู้ทำนาย`)
   * Progress compact: `เตรียมเกม 3/8` or `คืนที่ 1 • 2/12`
   * Menu (Restart / Settings / Exit)

2. **Center: Rolling Step Stack (karaoke/lyric)**

   * แสดง 7–11 บรรทัด “ซ้อนกันแนวตั้ง”
   * **บรรทัดกลาง = current step (Active)**

     * สีสว่างสุด, ตัวหนา, ขนาดใหญ่สุด
   * บรรทัดเหนือ/ใต้ = context

     * สีจางลงตามระยะห่าง (fade)
     * ขนาดเล็กลงเล็กน้อย
   * Background เรียบ (โหมดมืด/สว่างได้) เพื่อคอนทราสต์สูง

3. **Bottom dock (controls)**

   * ปุ่มหลัก: **“ทำเสร็จแล้ว”** (Primary)
   * ปุ่มรอง: “ย้อนกลับ”, “ข้าม” (เฉพาะ step ที่อนุญาต), “โน้ต” (optional)
   * Gesture/keyboard optional:

     * Space = done, ← = back, → = done

### Behavior (สำคัญ)

* เมื่อกด **ทำเสร็จแล้ว**

  * step ปัจจุบันเปลี่ยนสถานะเป็น **Completed**
  * list **auto-scroll ให้ step ถัดไปมาอยู่กลางจอ** (เหมือน lyric ที่เลื่อน)
* ถ้า user scroll มือเอง

  * UI ยังคง “snap” กลับมาที่ active step เมื่อกด done/back (กันหลุดจอ)
* **Tap on active text** = ทำเสร็จแล้ว (optional แต่ควรมี เพราะเร็วมากตอนเป็น GM)

---

## Flow Structure: Start from Setup → Mark done → Turn 1

### New phase order (Werewolf)

* **Phase 0: เตรียมเกม (Pre-game Setup Checklist)**

  * ตัวอย่าง step:

    1. “แจกบทบาทให้ครบ แล้วให้ทุกคนดูของตัวเอง”
    2. “อธิบายกติกาสั้น ๆ: กลางวันคุย-โหวต / กลางคืนใช้สกิล”
    3. “ย้ำสัญญาณ: แตะไหล่ = ถูกเลือก / พยักหน้า = รับทราบ”
    4. “พร้อมแล้ว: เริ่มคืนที่ 1”
* **Phase 1+: คืนที่ 1 / กลางวัน 1 / คืนที่ 2 ...**

> ผลลัพธ์: Play UI “เริ่มใช้งานได้ทันที” หลังจบหน้า setup โดยไม่ต้องให้ GM จำ checklist เอง

---

## Feedback Checkpoint (optional + skippable)

### What it is

“Checkpoint step type” ที่โผล่มาเป็นช่วง ๆ เช่น:

* หลังจบ “คืนที่ 1”
* หลังจบ “กลางวัน 1”
* หรือทุก 1 Turn

### UI pattern

* เมื่อถึง checkpoint:

  * Rolling stack ยังคงเดิม แต่ active step เป็น **การ์ด checkpoint**
  * มี 2 ปุ่มชัด:

    * **บันทึก (30 วิ)**: เลือก 1–5 ดาว + ช่องโน้ตสั้น (optional)
    * **ข้าม** (Skip)
* ใน Settings มี toggle:

  * `เปิด checkpoint` (default: ON)
  * `ถามทุกกี่เทิร์น` (default: ทุก 1 เทิร์น)

### Data to store (local only)

* `checkpoint_entries[]`:

  * `timestamp`, `turn`, `phase`, `rating`, `note`

---

## Script / Step Model update (to support lyric + checkpoints)

เพิ่ม field ที่ทำให้ player ทำงานแบบ deterministic:

* `step.kind`: `INSTRUCTION | CHECKPOINT`
* `step.can_skip`: boolean
* `step.requires_confirm`: boolean (ถ้าต้อง “กดค้างเพื่อยืนยัน” กันกดพลาด)
* `step.text_th`: ข้อความใหญ่ (1–2 ประโยค)
* `step.helper_th`: บรรทัดเล็ก (optional)
* `step.condition`: ใช้เปิด/ปิดตาม settings (เช่น ถ้าเปิดแม่มด)

---

## Catan (next game) — how it plugs in

### What changes

* เพิ่ม route ใหม่: `/catan/setup`, `/catan/play`
* เพิ่ม `CatanDefinition` ที่มี:

  * Setup schema (จำนวนคน 3–4, expansion toggle, time limit ต่อเทิร์น, initial placement rules)
  * Script phases:

    * Phase 0: Setup board checklist (เรียงเป็น step สั้น ๆ)
    * Game loop: “เทิร์นของผู้เล่น X”

      * ทอยลูกเต๋า → แจกทรัพยากร → เทรด/สร้าง → จบเทิร์น
    * Special checkpoints: หลังจบรอบแรก, หลังมีคนถึง 7 VP ฯลฯ (optional)

### Key UI addition for Catan (still same lyric player)

* เพิ่ม “badge” บน top bar:

  * `ผู้เล่นปัจจุบัน: A`
* ปุ่มเล็ก “เปลี่ยนผู้เล่น” ใน dock (ถ้าต้องการ) แต่ไม่บังคับใน MVP

---

## Acceptance Criteria (updated)

* เข้า `/werewolf/setup` → กดเริ่ม → ไป `/werewolf/play` และเริ่มที่ **เตรียมเกม step 1** ทันที
* Play แสดง rolling stack แบบ lyric (active centered + others faded)
* กด **ทำเสร็จแล้ว** แล้วเลื่อนไป step ถัดไปอัตโนมัติ
* มี checkpoint step ที่ “ข้ามได้” และปิดทั้งระบบได้จาก settings
* โครงสร้างรองรับการเพิ่ม `/catan/*` โดยใช้ player เดิมได้ (แค่เพิ่ม definition + script)

ถ้าต้องการ ผมจะเขียน “Werewolf Script TH” เป็นชุด step แบบพร้อมใช้งาน (pre-game + คืน/วัน อย่างละหลายเทิร์น) ในรูปแบบ JSON ตามโมเดลด้านบน เพื่อให้ dev เอาไปเสียบได้ทันที.
