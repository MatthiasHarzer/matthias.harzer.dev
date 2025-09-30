import { Observable } from './reactive.ts';

// biome-ignore lint/suspicious/noExplicitAny: any is needed to store the state
export type BaseObject = Record<string, any>;

export class ReactiveObject<TObject extends BaseObject> extends Observable<TObject> {
	private reactableValue: TObject;

	constructor(initialValue: TObject) {
		super(initialValue);

		this.reactableValue = this.#createProxy(initialValue);
	}

	#createProxy<T extends BaseObject>(value: T): T {
		return new Proxy(value, {
			get: (target: T, prop: string) => {
				const value = target[prop];
				if (typeof value === 'object' && value !== null) {
					return this.#createProxy(value as BaseObject);
				}
				return value;
			},
			set: (target: BaseObject, prop: string, value: unknown) => {
				if (prop in target) {
					target[prop] = value;
					this.notifySubscribers();
					return true;
				}
				return false;
			},
		}) as T;
	}

	/**
	 * A proxy to the observable object that notifies subscribers on property updates.
	 */
	get $(): TObject {
		if (!this.observableValue) {
			return this.observableValue;
		}
		return this.reactableValue;
	}

	hostConnected() {
		// Empty
	}
}
