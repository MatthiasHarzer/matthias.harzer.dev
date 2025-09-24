import { Observable } from './reactive.ts';

// biome-ignore lint/suspicious/noExplicitAny: any is needed to store the state
export type BaseObject = Record<string, any>;

export class ReactiveObject<T extends BaseObject> extends Observable<T> {
	/**
	 * A proxy to the observable object that notifies subscribers on property updates.
	 */
	get $(): T {
		if (!this.observableValue) {
			return this.observableValue;
		}
		return new Proxy(this.observableValue, {
			// biome-ignore lint/suspicious/noExplicitAny: any is needed to store the state
			get: (target: Record<string, any>, prop: string) => target[prop],
			set: (target, prop, value) => {
				if (typeof prop === 'string') {
					target[prop] = value;
					this.notifySubscribers();
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
