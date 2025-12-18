// Thai localization strings for Catan

export const CatanStrings = {
    // Phase 0: เตรียมเกม (Setup Checklist)
    SETUP: {
        TITLE: "เตรียมเกม",
        CHOOSE_MODE: "เลือกโหมดกระดาน: Beginner / สุ่ม / จัดเอง",
        PLACE_TILES: "วางไทล์ทรัพยากรและทะเลทราย",
        PLACE_NUMBERS: "วางหมายเลขบนไทล์",
        PLACE_PORTS: "วางพอร์ตรอบกระดาน",
        PREPARE_BANK: "เตรียมธนาคาร: การ์ดทรัพยากร + การ์ดพัฒนา",
        PREPARE_PIECES: "แจกชิ้นส่วนให้ผู้เล่น: บ้าน 5 + เมือง 4 + ถนน 15",
        PICK_FIRST: "สุ่มเลือกผู้เล่นคนแรก",
        READY: "พร้อมเริ่มเกม กดเพื่อเริ่มวางบ้าน",
    },

    // Phase 1: วางบ้านเริ่มต้น (Initial Placement)
    PLACEMENT: {
        TITLE_R1: "วางบ้านรอบที่ 1",
        TITLE_R2: "วางบ้านรอบที่ 2",
        // Template strings - use with player name
        PLACE_SETTLEMENT_ROAD: (name: string) => `${name}: วางบ้าน 1 หลัง + ถนน 1 เส้น`,
        PLACE_SECOND_AND_COLLECT: (name: string) => `${name}: วางบ้าน 1 หลัง + ถนน 1 เส้น แล้วรับทรัพยากรจากบ้านหลังที่ 2`,
        PLACEMENT_COMPLETE: "วางบ้านเสร็จสิ้น! เริ่มเล่นรอบปกติ",
    },

    // Phase 2: วนลูปตาเล่น (Main Turn Loop)
    TURN: {
        TITLE: (round: number) => `รอบที่ ${round}`,
        START: (name: string) => `เริ่มตา: ${name}`,
        ROLL_DICE: "ทอยลูกเต๋า",
        DISTRIBUTE: "แจกทรัพยากรตามผลทอย",
        DISTRIBUTE_HELPER: "ผู้เล่นที่มีสิ่งปลูกสร้างติดกับช่องที่ตรงกับผลทอย รับทรัพยากร",
        TRADE: "ช่วงเทรด: แลกกับผู้เล่นอื่น / ธนาคาร / พอร์ต",
        TRADE_HELPER_BANK: "ธนาคาร: 4:1 / พอร์ต 3:1 หรือ 2:1",
        BUILD: "ช่วงสร้าง: ถนน / บ้าน / เมือง / การ์ดพัฒนา",
        BUILD_COSTS: "ถนน: Brick+Wood | บ้าน: Brick+Wood+Wool+Grain | เมือง: Ore×3+Grain×2 | Dev: Ore+Wool+Grain",
        END_TURN: (name: string) => `จบตา: ${name} ส่งให้ผู้เล่นถัดไป`,
        CHECKPOINT: "บันทึกสถานะรอบนี้ (1-5)",
    },

    // Robber Subflow (when rolling 7)
    ROBBER: {
        TITLE: "โจร! (ทอยได้ 7)",
        DISCARD: "ผู้เล่นที่มีเกิน 7 ใบ: ทิ้งครึ่งหนึ่ง (ปัดลง)",
        DISCARD_HELPER: "ถือ 8 ใบ = ทิ้ง 4 ใบ, ถือ 9 ใบ = ทิ้ง 4 ใบ",
        MOVE_ROBBER: (name: string) => `${name}: ย้ายโจรไปช่องใหม่ (ห้ามช่องเดิม)`,
        STEAL: (name: string) => `${name}: เลือกขโมยการ์ด 1 ใบจากผู้เล่นที่มีสิ่งปลูกสร้างติดกัน`,
        STEAL_HELPER: "ถ้าไม่มีใครติดกับช่องใหม่ ข้ามไป",
        FRIENDLY_ROBBER: "กติกาบ้าน Friendly Robber: ห้ามขโมยจากผู้เล่นที่มี ≤2 VP",
        RETURN: "กลับไปเล่นต่อ (ช่วงเทรด/สร้าง)",
    },

    // UI Labels
    UI: {
        DONE: "ทำเสร็จแล้ว",
        BACK: "ย้อนกลับ",
        SKIP: "ข้าม",
        NOTES: "จดโน้ต",
        ROLLED_7: "ทอยได้ 7",
        NEXT_PLAYER: "จบตา / ผู้เล่นถัดไป",
        END_GAME: "จบเกม",
        RESUME: "กลับไปเล่นต่อ",
        START_GAME: "เริ่มเกม Catan",
        ROLL: "ทอยเต๋า",
        ROLLING: "กำลังทอย...",
        SUM: "ผลรวม",
        ROBBER_ALERT: "โจรมาแล้ว! ผู้เล่นที่มีเกิน 7 ใบต้องทิ้ง",
    },

    // Summary Page
    SUMMARY: {
        TITLE: "สรุปเกม Catan",
        OVERVIEW: "ข้อมูลทั่วไป",
        PLAYERS: "ผู้เล่น",
        VP_TARGET: "เป้าหมาย VP",
        BOARD_MODE: "โหมดกระดาน",
        DURATION: "ระยะเวลา",
        ROUNDS: "จำนวนรอบ",
        NOTES: "บันทึก",
        CHECKPOINTS: "Checkpoints",
        EXPORT: "Export JSON",
        NO_NOTES: "ไม่มีบันทึก",
    },

    // Board Mode Labels
    BOARD_MODE: {
        BEGINNER: "แนะนำสำหรับมือใหม่",
        RANDOMIZED: "สุ่มไทล์/ตัวเลข/พอร์ต",
        MANUAL: "จัดเองตามกล่อง",
    },
}
