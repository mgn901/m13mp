type Nominal<T, K extends string> = T & {
	__brand: K;
}

type UnixTime = Nominal<number, 'UnixTime'>;
const isUnixTime = (v: unknown) => {
	if (typeof v === 'number' && Number.isInteger(v)) {
		return true;
	} else {
		return false;
	}
}

const isRecord = (v: unknown): v is Record<string, unknown> => {
	if (typeof v !== 'object' || v === null) {
		return false;
	} else {
		return true;
	}
}

const isTypedArray = <T>(v: unknown, f: (w: unknown) => w is T): v is T[] => {
	if (!Array.isArray(v)) {
		return false;
	}
	let finalResult = true;
	for (let i = 0; i < v.length; i += 1) {
		const item = v[i];
		const result = f(item);
		if (result === false) {
			finalResult = false;
			break;
		}
	}
	return finalResult;
}

export {
	Nominal,
	UnixTime,
	isUnixTime,
	isRecord,
	isTypedArray,
};
