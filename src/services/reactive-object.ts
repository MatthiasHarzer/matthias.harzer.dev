import { Observable } from './reactive.ts';

// biome-ignore lint/suspicious/noExplicitAny: any is needed to store the state
export type BaseObject = Record<string, any>;

const isObject = (value: unknown): value is BaseObject => {
	return typeof value === 'object' && value !== null;
};

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
				if (isObject(value)) {
					return this.#createProxy(value);
				}
				return value;
			},
			set: (target: BaseObject, prop: string, value: unknown) => {
				if (prop in target && typeof prop === 'string') {
					target[prop] = value;
					this.notifySubscribers();
					return true;
				}

				const index = Number(prop);
				if (Array.isArray(target) && !Number.isNaN(index)) {
					(target as Array<unknown>)[index] = value;
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
