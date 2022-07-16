import { isRecord, isUnixTime, Nominal, UnixTime } from './utils';

type LineID = Nominal<string, 'LineID'>;
const isLineID = (v: unknown): v is LineID => {
	if (typeof v === 'string') {
		return true;
	} else {
		return false;
	}
}

interface Line {
	id: LineID;
	updated: UnixTime;
	text: string;
}
const isLine = (v: unknown): v is Line => {
	if (!isRecord(v)) {
		return false;
	} else if (
		!isLineID(v.id)
		|| !isUnixTime(v.updated)
		|| typeof v.text !== 'string'
	) {
		return false;
	} else {
		return true;
	}
}

export {
	LineID,
	isLineID,
	Line,
	isLine,
};
