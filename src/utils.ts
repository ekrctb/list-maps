export function classNames(...classNames: (string | false)[]): string {
    return classNames.filter((name) => name).join(" ");
}

export function clamp(value: number, min: number, max: number): number {
    if (!(min <= value)) value = min;
    if (!(value <= max)) value = max;
    return value;
}

export function formatTime(seconds: number): string {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds) - min * 60;
    if (sec < 10) return `${min}:0${sec}`;
    else return `${min}:${sec}`;
}

export function findToString<T extends number | string>(
    target: string | undefined | null,
    list: T[]
): T | undefined {
    return list.find((l) => l.toString() === target);
}

export function deepEqual<T>(first: T, second: T): boolean {
    return JSON.stringify(first) === JSON.stringify(second);
}
