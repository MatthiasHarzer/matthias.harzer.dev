import type { ReactiveController, ReactiveControllerHost } from 'lit';

export type Subscriber<T> = (value: T) => void;
export type Unsubscribe = () => void;

export type BaseObject = Record<string, unknown>;

export class ReactiveObject<T extends BaseObject> implements ReactiveController {
	private state: T = {} as T;
	private hosts: ReactiveControllerHost[] = [];
	private notifier: ((value: T) => void)[] = [];

	constructor(initialState: T) {
		this.state = initialState;
	}

	protected notify() {
		for (const n of this.notifier) {
			n(this.state);
		}
		for (const host of this.hosts) {
			host.requestUpdate();
		}
	}

	subscribeHost(host: ReactiveControllerHost) {
		this.hosts.push(host);
		host.addController(this);

		return () => {
			this.hosts = this.hosts.filter(h => h !== host);
			host.removeController(this);
		};
	}

	subscribe(notifier: Subscriber<T>): Unsubscribe {
		this.notifier.push(notifier);
		return () => {
			this.notifier = this.notifier.filter(n => n !== notifier);
		};
	}

	unsubscribeHost(host: ReactiveControllerHost) {
		this.hosts = this.hosts.filter(h => h !== host);
		host.removeController(this);
	}

	unsubscribe(notifier: Subscriber<T>) {
		this.notifier = this.notifier.filter(n => n !== notifier);
	}

	set(value: T) {
		this.state = value;
		this.notify();
	}

	get $(): T {
		if (!this.state) {
			return this.state;
		}
		return new Proxy(this.state, {
			// biome-ignore lint/suspicious/noExplicitAny: any is needed to store the state
			get: (target: Record<string, any>, prop: string) => target[prop],
			set: (target, prop, value) => {
				if (typeof prop === 'string') {
					target[prop] = value;
					this.notify();
					return true;
				}
				return false;
			},
		}) as T;
	}

	hostConnected() {
		// Empty
	}
}
