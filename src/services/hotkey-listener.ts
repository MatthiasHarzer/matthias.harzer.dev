import { Observable, type Subscriber, type Unsubscribe } from './reactive.ts';

interface HotkeyListener {
	on(keys: string, subscriber: Subscriber<void>): Unsubscribe;
	isPressed(key: string): boolean;
}

class Listener extends Observable<Set<string>> {
	constructor() {
		super(new Set());

		window.addEventListener('keydown', e => {
			this.value.add(e.key.toLowerCase());
			this.notifySubscribers();
		});

		window.addEventListener('keyup', e => {
			this.value.delete(e.key.toLowerCase());
			this.notifySubscribers();
		});
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

	isPressed(key: string) {
		return this.value.has(key.toLowerCase());
	}
}

const keyListener: HotkeyListener = new Listener();

export { keyListener };
export type { HotkeyListener };
