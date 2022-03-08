
function assertElement<T extends Element>(element: Element | null, tagName: string): asserts element is T {
    if (element?.tagName.toLowerCase() !== tagName) {
        console.error(`Unexpected element. ${tagName} expected.`, element);
        throw new Error('Unexpected element');
    }
}

function createElement<K extends keyof HTMLElementTagNameMap>(tagName: K, attrs?: Partial<HTMLElementTagNameMap[K]>, children?: Node[]): HTMLElementTagNameMap[K] {
    const element = document.createElement(tagName);

    if (attrs !== undefined) {
        for (const key in attrs) {
            element[key] = attrs[key]!;
        }
    }

    if (children !== undefined) {
        for (const node of children)
            element.appendChild(node);
    }

    return element;
}

class EventStream<E> {
    private readonly events: E[] = [];
    private resolve: (() => void) | null = null;
    private reject: ((error: Error) => void) | null = null;
    private readonly stopCallbacks: (() => void)[] = [];

    public trigger(event: E) {
        const resolve = this.resolve;

        this.resolve = this.reject = null;

        this.events.push(event);

        if (resolve !== null) {
            resolve();
        }
    }

    public registerStopCallback(cb: () => void) {
        this.stopCallbacks.push(cb);
    }

    public pop(): E | null {
        if (this.events.length === 0)
            return null;
        return this.events.splice(0, 1)[0];
    }

    public wait(): Promise<void> {
        if (this.events.length > 0) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }

    public stop() {
        const stopCallbacks = this.stopCallbacks;
        const reject = this.reject;

        this.resolve = this.reject = null;
        this.stopCallbacks.length = 0;

        for (const cb of stopCallbacks) {
            try {
                cb();
            } catch (e) {
                console.error(e);
            }
        }

        if (reject !== null) {
            reject(new Error('Canceled'));
        }
    }
}

interface EventSink<E> {
    trigger(event: E): void;
    registerStopCallback(cb: () => void): void;
}

class ValueChange<T extends number | string | null> {
    public constructor(private value: T, private changed: boolean) {
    }

    public get(): T {
        return this.value;
    }

    public set(newValue: T) {
        if (this.value !== newValue) {
            this.value = newValue;
            this.changed = true;
        }
    }

    public pop(): boolean {
        const changed = this.changed;
        this.changed = false;
        return changed;
    }
}
