import { LineID } from './Line';
import { Nominal } from './utils';

type EditorCommandID = Nominal<string, 'EditorCommandID'>;
const generateEditorCommandID = (): EditorCommandID => {
	return Date.now().toString(10) as EditorCommandID;
}
const isEditorCommandID = (v: unknown): v is EditorCommandID => {
	if (typeof v !== 'string') {
		return false;
	} else {
		return true;
	}
}

interface EditorCommand {
	id: EditorCommandID;
	refID: EditorCommandID;
	lineID: LineID;
	type: 'insertLine' | 'editLine' | 'deleteLine';
	start: number;
	end: number;
	newText: string;
}

class EditorCommand implements EditorCommand {
	constructor(src: Omit<EditorCommand, 'id'>) {
		const id = generateEditorCommandID();
		const { refID, lineID, type, start, end, newText } = src;
		this.id = id;
		this.refID = refID;
		this.lineID = lineID;
		this.type = type;
		this.start = start;
		this.end = end;
		this.newText = newText;
	}
}

interface EditorInitCommand {
	id: EditorCommandID;
	type: 'init';
}

class EditorInitCommand implements EditorInitCommand {
	constructor() {
		this.id = generateEditorCommandID();
		this.type = 'init';
	}
}

export { EditorCommand, EditorInitCommand };
