import { Observable, type Subscriber, type Unsubscribe } from './reactive.ts';

interface Keylistener {
	on(keys: string, subscriber: Subscriber<void>): Unsubscribe;
	onOneOf(keys: string[], subscriber: Subscriber<void>): Unsubscribe;
	isPressed(key: string): boolean;
}

interface CustomKeylistener extends Keylistener {
	dispose(): void;
}

interface HostElement {
	addEventListener<K extends keyof HTMLElementEventMap>(
		type: K,
		listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => void,
		options?: boolean | AddEventListenerOptions,
	): void;
	removeEventListener<K extends keyof HTMLElementEventMap>(
		type: K,
		listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => void,
		options?: boolean | EventListenerOptions,
	): void;
}

interface ListenOptions {
	preventDefault?: boolean;
	stopPropagation?: boolean;
}

class Listener extends Observable<Set<string>> {
	#onKeydown = this.onKeyDown.bind(this);
	#onKeyup = this.onKeyUp.bind(this);
	#host: HostElement;
	#options: ListenOptions | undefined;

	constructor(host: HostElement, options?: ListenOptions) {
		super(new Set());

		this.#host = host;
		this.#options = options;
		host.addEventListener('keydown', this.#onKeydown);
		host.addEventListener('keyup', this.#onKeyup);
	}

	applyOptions(e: KeyboardEvent) {
		if (!this.#options) return;
		if (this.#options.preventDefault) {
			e.preventDefault();
		}
		if (this.#options.stopPropagation) {
			e.stopPropagation();
		}
	}

	onKeyDown(e: KeyboardEvent) {
		this.applyOptions(e);
		this.value.add(e.key.toLowerCase());
		this.notifySubscribers();
	}

	onKeyUp(e: KeyboardEvent) {
		this.applyOptions(e);
		this.value.delete(e.key.toLowerCase());
		this.notifySubscribers();
	}

	on(keys: string, subscriber: Subscriber<void>) {
		const keyList = keys
			.toLowerCase()
			.split('+')
			.map(k => (k === ' ' ? k : k.trim()))
			.filter(k => k.length > 0);
		const keySet = new Set(keyList);

		return this.subscribe(value => {
			if (keySet.size === 0) return;
			for (const key of keySet) {
				if (!value.has(key)) return;
			}
			subscriber();
		}, true);
	}

	onOneOf(keys: string[], subscriber: Subscriber<void>) {
		const subscribers: Unsubscribe[] = [];

		for (const key of keys) {
			subscribers.push(this.on(key, subscriber));
		}

		return () => {
			for (const unsubscribe of subscribers) {
				unsubscribe();
			}
		};
	}

	isPressed(key: string) {
		return this.value.has(key.toLowerCase());
	}

	dispose() {
		this.subscribers = [];
		this.value.clear();

		this.#host.removeEventListener('keydown', this.#onKeydown);
		this.#host.removeEventListener('keyup', this.#onKeyup);
	}
}

const keylistener: Keylistener = new Listener(window);

const listen = (host: HostElement, options?: ListenOptions): CustomKeylistener =>
	new Listener(host, options);

export { keylistener, listen };
export type { Keylistener, CustomKeylistener };
