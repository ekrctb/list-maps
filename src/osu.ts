enum Mods {
    NONE = 0,
    EASY = 2,
    HIDDEN = 8,
    HARD_ROCK = 16,
    DOUBLE_TIME = 64,
    HALF_TIME = 256,
    FLASHLIGHT = 1024,
}

enum ApprovalStatus {
    RANKED = 1,
    APPROVED = 2,
    QUALIFIED = 3,
    LOVED = 4,
}

enum RulesetId {
    OSU = 0,
    CATCH = 2,
}

function calculateClockRate(mods: Mods): number {
    let rate = 1;
    if (mods & Mods.DOUBLE_TIME)
        rate *= 1.5;
    if (mods & Mods.HALF_TIME)
        rate *= 0.75;
    return rate;
}

function calculateApproachRate(ar: number, mods: Mods): number {
    if (mods & Mods.HARD_ROCK)
        ar = Math.min(ar * 1.5, 10);
    if (mods & Mods.EASY)
        ar /= 2;

    const clockRate = calculateClockRate(mods);
    const preempt = (ar < 5 ? 1200 + (5 - ar) * 120 : 1200 - (ar - 5) * 150) / clockRate;
    return preempt > 1200 ? (1800 - preempt) / 120 : 5 + (1200 - preempt) / 150;
}

function calculateCircleSize(cs: number, mods: Mods): number {
    if (mods & Mods.HARD_ROCK)
        cs = Math.min(cs * 1.3, 10);
    if (mods & Mods.EASY)
        cs /= 2;
    return cs;
}

// version 2020-03
function calculatePerformancePoint(
    stars: number, maxCombo: number, ar: number,
    mods: Mods = Mods.NONE,
    combo: number = maxCombo, miss = 0): number {

    let value = Math.pow(5 * Math.max(1, stars / 0.0049) - 4, 2) / 100000;

    const lengthFactor = 0.95 + 0.3 * Math.min(1, maxCombo / 2500) + 0.475 * Math.max(0, Math.log10(maxCombo / 2500));
    value *= lengthFactor;

    if (maxCombo > 0)
        value *= Math.min(Math.pow(combo / maxCombo, 0.8), 1);

    const arFactor = 1 + 0.1 * Math.max(0, ar - 9) + 0.1 * Math.max(0, ar - 10) + 0.025 * Math.max(0, 8 - ar);
    value *= arFactor;

    value *= Math.pow(0.97, miss);

    if (mods & Mods.HIDDEN) {
        if (ar <= 10)
            value *= 1.05 + 0.075 * (10 - ar);
        else
            value *= 1.01 + 0.04 * (11 - Math.min(11, ar));
    }

    if (mods & Mods.FLASHLIGHT)
        value *= 1.35 * lengthFactor;

    return value;
}
