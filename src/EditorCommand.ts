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

interface EditorCommandCell {
	lineID: LineID;
	type: 'insertLine' | 'editLine' | 'deleteLine';
	start: number;
	end: number;
	newText: string;
}

interface EditorCommand {
	id: EditorCommandID;
	refID: EditorCommandID;
	commands: EditorCommandCell[];
}

class EditorCommand implements EditorCommand {
	constructor(src: Omit<EditorCommand, 'id'>) {
		this.id = generateEditorCommandID();
		this.refID = src.refID;
		this.commands = src.commands;
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

export { EditorCommandCell, EditorInitCommand, EditorCommand };
