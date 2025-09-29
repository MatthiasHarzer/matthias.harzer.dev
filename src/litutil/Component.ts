import { type CSSResultGroup, css, LitElement } from 'lit';
import { type BaseObject, ReactiveObject } from '../services/reactive-object.js';

const cssOverwrites = css`

input {
  min-width: 0;
  width: auto;
	font-family: inherit;
}

*, *::before, *::after {
  box-sizing: border-box;
}
* {
  margin: 0;
	interpolate-size: allow-keywords;
	font-variant-ligatures: none;
}

img, picture, video, canvas, svg {
  display: block;
  max-width: 100%;
}
input, button, textarea, select {
  font: inherit;
}
p, h1, h2, h3, h4, h5, h6 {
  overflow-wrap: break-word;
}
p {
  text-wrap: pretty;
}
h1, h2, h3, h4, h5, h6 {
  text-wrap: balance;
}
#root, #__next {
  isolation: isolate;
}
`;

type BaseState = BaseObject;

export class Component extends LitElement {
	private static _styles: CSSResultGroup;

	static get styles(): CSSResultGroup {
		const derivedStyles = Component._styles || [];
		return [cssOverwrites, ...(Array.isArray(derivedStyles) ? derivedStyles : [derivedStyles])];
	}

	static set styles(styles: CSSResultGroup) {
		Component._styles = styles;
	}

	get rect() {
		return this.getBoundingClientRect();
	}

	sleep(ms: number) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	connectedCallback(): void {
		super.connectedCallback();
	}

	dispatch<T>(
		name: string,
		detail: T | null = null,
		options: { bubbles?: boolean; composed?: boolean } = {},
	) {
		this.dispatchEvent(new CustomEvent(name, { detail, ...options }));
	}

	dispatchBubble<T>(name: string, detail: T | null = null) {
		this.dispatch(name, detail, { bubbles: true, composed: true });
	}

	disconnectedCallback() {
		super.disconnectedCallback();
	}
}

// biome-ignore lint/suspicious/noExplicitAny: Constructor arguments
type Constructor<T> = new (...args: any[]) => T;

export interface StatefulMixin<State extends BaseState> {
	state: State;
}
export interface SharedStateMixin<State extends BaseState> {
	sharedState: State;
}
export interface LocalStateMixin<State extends BaseState> {
	localState: State;
}

const StatefulMixin = <Base extends Constructor<Component>, State extends BaseState>(
	base: Base,
	initialState: State,
) => {
	class StatefulComponent extends base {
		private _stateObserver: ReactiveObject<State>;

		// biome-ignore lint/suspicious/noExplicitAny: any is needed to pass the constructor arguments
		constructor(...args: any[]) {
			super(...args);
			this._stateObserver = new ReactiveObject<State>(initialState);
		}

		get state(): State {
			return this._stateObserver.$;
		}

		connectedCallback(): void {
			super.connectedCallback();
			this._stateObserver.subscribeHost(this, false);
		}

		disconnectedCallback() {
			super.disconnectedCallback();
			this._stateObserver.unsubscribeHost(this);
		}
	}
	return StatefulComponent as Base & Constructor<StatefulMixin<State>>;
};

const SharedStateMixin = <Base extends Constructor<Component>, SharedState extends BaseState>(
	base: Base,
	initialState: SharedState,
) => {
	class SharedStateComponent extends base {
		private static sharedStates = new Map<string, ReactiveObject<BaseObject>>();
		private static getSharedState = <T extends BaseState>(name: string): ReactiveObject<T> => {
			if (!SharedStateComponent.sharedStates.has(name)) {
				SharedStateComponent.sharedStates.set(name, new ReactiveObject(initialState as BaseObject));
			}
			return SharedStateComponent.sharedStates.get(name) as ReactiveObject<T>;
		};
		private _sharedState: ReactiveObject<SharedState> =
			SharedStateComponent.getSharedState<SharedState>(this.localName);

		get sharedState(): SharedState {
			return this._sharedState.$;
		}

		connectedCallback(): void {
			super.connectedCallback();
			this._sharedState.subscribeHost(this, false);
		}

		disconnectedCallback() {
			super.disconnectedCallback();
			this._sharedState.unsubscribeHost(this);
		}
	}

	return SharedStateComponent as Base & Constructor<SharedStateMixin<SharedState>>;
};

const LocalStateMixin = <Base extends Constructor<Component>, LocalState extends BaseState>(
	base: Base,
	initialState: LocalState,
) => {
	class LocalStateComponent extends base {
		private static sharedStates = new Map<string, ReactiveObject<BaseObject>>();
		private static getSharedState = <T extends BaseState>(
			name: string,
			initialState: BaseObject,
		): ReactiveObject<T> => {
			if (!LocalStateComponent.sharedStates.has(name)) {
				LocalStateComponent.sharedStates.set(name, new ReactiveObject(initialState));
			}
			return LocalStateComponent.sharedStates.get(name) as ReactiveObject<T>;
		};
		private _localState: ReactiveObject<LocalState> =
			LocalStateComponent.getSharedState<LocalState>(
				this.localName,
				this.storedState ?? initialState,
			);

		private get storedState(): LocalState | null {
			const storedState = localStorage.getItem(this.storageKey);
			if (storedState) {
				return JSON.parse(storedState);
			}

			return null;
		}

		get localState(): LocalState {
			return this._localState.$;
		}

		private get storageKey(): string {
			return `local-state-component-${this.localName}`;
		}
		#handleStateUpdate = this.handleStateUpdate.bind(this);

		handleStateUpdate(state: LocalState): void {
			localStorage.setItem(this.storageKey, JSON.stringify(state));
		}

		connectedCallback(): void {
			super.connectedCallback();
			this._localState.subscribeHost(this, false);
			this._localState.subscribe(this.#handleStateUpdate, false);
		}

		disconnectedCallback() {
			super.disconnectedCallback();
			this._localState.unsubscribeHost(this);
			this._localState.unsubscribe(this.#handleStateUpdate);
		}
	}

	return LocalStateComponent as Base & Constructor<LocalStateMixin<LocalState>>;
};

/**
 * A StatefulComponent is a component that has its own internal state.
 * @param base - The base class to extend from, defaults to Component.
 * @returns A StatefulComponent class.
 */
export const StatefulComponent = <
	State extends BaseState,
	Base extends Constructor<Component> = Constructor<Component>,
>({
	base,
	initialState,
}: {
	base?: Base;
	initialState: State;
}) => StatefulMixin<Base, State>(base ?? (Component as unknown as Base), initialState);

/**
 * A SharedStateComponent is a component that shares its state with other components of the same type.
 * @param base - The base class to extend from, defaults to Component.
 * @returns A SharedStateComponent class.
 */
export const SharedStateComponent = <
	State extends BaseState,
	Base extends Constructor<Component> = Constructor<Component>,
>({
	base,
	initialState,
}: {
	base?: Base;
	initialState: State;
}) => SharedStateMixin<Base, State>(base ?? (Component as unknown as Base), initialState);

/**
 * A LocalStateComponent is a component that stores its state in localStorage.
 * @param base - The base class to extend from, defaults to Component.
 * @returns A LocalStateComponent class.
 */
export const LocalStateComponent = <
	State extends BaseState,
	Base extends Constructor<Component> = Constructor<Component>,
>({
	base,
	initialState,
}: {
	base?: Base;
	initialState: State;
}) => LocalStateMixin<Base, State>(base ?? (Component as unknown as Base), initialState);
