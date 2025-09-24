import type { BaseObject } from './reactive-object.ts';
import { Observable } from './reactive.ts';

interface Config {
	typewriterCharsPerSecond: number;
	glowColor: string;
}

const initialConfig: Config = {
	typewriterCharsPerSecond: 300,
	glowColor: 'rainbow',
};

class ConfigObservable extends Observable<Config> {
	private localStorageKey: string;
	private initialConfig: Config;

	constructor(localStorageKey: string, initialValue: Config) {
		super(initialValue);
		this.initialConfig = initialValue;
		this.localStorageKey = localStorageKey;

		const savedValue = localStorage.getItem(this.localStorageKey);
		if (savedValue) {
			try {
				const parsedValue = JSON.parse(savedValue);
				this.observableValue = { ...initialValue, ...parsedValue };
			} catch {
				// Ignore JSON parse errors
			}
		}

		this.subscribe(() => {
			localStorage.setItem(this.localStorageKey, JSON.stringify(this.observableValue));
		}, false);
	}

	setKeyValue(key: string, value: string) {
		if (!(key in this.initialConfig)) {
			throw new Error(`Unknown config key "${key}".`);
		}

		const valueType = this.initialConfig[key as keyof Config];

		switch (typeof valueType) {
			case 'number': {
				const numberValue = Number(value);
				if (Number.isNaN(numberValue)) {
					throw new Error(`Invalid value for config key "${key}". Expected a number.`);
				}
				(this.observableValue as BaseObject)[key] = numberValue;
				break;
			}
			case 'boolean': {
				const boolValue = value === 'true' || value === '1';
				(this.observableValue as BaseObject)[key] = boolValue;
				break;
			}
			case 'string': {
				(this.observableValue as BaseObject)[key] = String(value);
				break;
			}
			default:
				throw new Error(`Unsupported config key type for key "${key}".`);
		}

		this.notifySubscribers();
	}

	getKeyValue(key: string): string {
		if (!(key in this.initialConfig)) {
			throw new Error(`Unknown config key "${key}".`);
		}

		const value = (this.observableValue as BaseObject)[key];
		return String(value);
	}
}

const configService = new ConfigObservable('app-config', initialConfig);
export { configService };
