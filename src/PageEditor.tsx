import * as React from 'react';
import { EditorCommand, EditorInitCommand } from './EditorCommand';
import { isLine, isLineID, Line, LineID } from './Line';
import { Page } from './Page';

type PropsPageEditor = {
	page: Page;
}

const PageEditor: React.FC<PropsPageEditor> = (props) => {

	const { page } = props;
	const { id, title, updated, lines, links } = page;

	///////////
	// utils //
	///////////

	const getTargetLineElement = (range: Range): HTMLElement[] => {
		let lineElement0, lineElement1;
		if (range.startContainer instanceof HTMLDivElement) {
			lineElement0 = range.startContainer;
		} else {
			lineElement0 = range.startContainer.parentElement!;
		}
		if (range.endContainer instanceof HTMLDivElement) {
			lineElement1 = range.endContainer;
		} else {
			lineElement1 = range.endContainer.parentElement!;
		}
		return [lineElement0, lineElement1];
	}

	const getTargetLineID = (range: Range): LineID[] => {
		const lineElement = getTargetLineElement(range);
		let lineID0 = lineElement[0].dataset.id;
		let lineID1 = lineElement[1].dataset.id;
		if (!isLineID(lineID0) || !isLineID(lineID1)) {
			throw Error('PageEditorInvalidLineIDError');
		} else {
			return [lineID0, lineID1];
		}
	}

	const getLineByID = (id: LineID): Line => {
		const line = lines.find((v) => {
			return v.id === id;
		});
		if (!isLine(line)) {
			throw Error('PageEditorLineNotFoundError');
		} else {
			return line;
		}
	}

	/////////////////////
	// command history //
	/////////////////////

	const initCommand = new EditorInitCommand();
	const [commands, setCommands] = React.useState<(EditorCommand | EditorInitCommand)[]>([initCommand]);
	const [prevRange, setPrevRangeState] = React.useState<Range>();

	const pushCommand = (command: EditorCommand) => {
		setCommands([...commands, command]);
		return;
	}

	const peakCommand = () => {
		return commands[commands.length - 1];
	}

	const setPrevRange = (range: Range) => {
		const pr = prevRange;
		const r = range;
		if (pr === undefined) {
			setPrevRangeState(range);
			return;
		}
		if (
			pr.startContainer === r.startContainer
			&& pr.startOffset === r.startOffset
			&& pr.endContainer === r.endContainer
			&& pr.endOffset === r.endOffset
		) {
			return;
		}
		setPrevRangeState(range);
		return;
	}

	//////////////////////
	// generate command //
	//////////////////////

	const handleInsert = (e: InputEvent, newSelection: Selection) => {

		let command: EditorCommand;
		if (e.inputType === 'insertLineBreak') {
			command = new EditorCommand({
				type: 'insertLine',
				start: 0,
				end: 0,
				lineID: Date.now().toString(10) as LineID,
				refID: peakCommand().id,
				newText: '',
			});
		} else {
			const newRange = newSelection.getRangeAt(0);
			const newLineElement = getTargetLineElement(newRange)[0]!;
			const newLineText = newLineElement.textContent!;
			// EdgeではgetDataできない
			// 貼り付ける瞬間（実際に張り付けられるより前）にrangeがぶった切れる
			const pastePos = (prevRange?.startContainer?.previousSibling?.previousSibling?.textContent?.length! || 0);
			const start = prevRange!.startOffset! + pastePos;
			command = new EditorCommand({
				refID: peakCommand().id,
				lineID: getTargetLineID(prevRange!)[0],
				type: 'editLine',
				start,
				end: prevRange!.endOffset! + pastePos,
				newText: newLineText.substring(start, newRange.startOffset + pastePos),
			});
		}
		pushCommand(command);
		console.log(command);
		return;
	}

	const handleDelete = (e: InputEvent) => {

	}

	/////////////////////////
	// handler for onInput //
	/////////////////////////

	const handleInput: React.FormEventHandler<HTMLDivElement> = (e) => {
		const ne = e.nativeEvent;
		if (!(ne instanceof InputEvent)) {
			return;
		}
		if (ne.isComposing) {
			return;
		}
		if (ne.inputType.includes('insert')) {
			console.log(ne);
			const selection = window.getSelection()!;
			handleInsert(ne, selection);
			setPrevRange(selection.getRangeAt(0));
		} else if (ne.inputType.includes('delete')) {
		}
		return;
	}

	//////////////////////////
	// handler for onSelect //
	//////////////////////////

	const handleSelect: React.ReactEventHandler<HTMLDivElement> = (e) => {
		const selection = window.getSelection()!;
		setPrevRange(selection.getRangeAt(0));
		return;
	}

	const renderedLines = lines.map((line) => {
		return <div
			key={line.id}
			data-id={line.id}
			className='tk-b'>
			{line.text}
		</div>;
	});

	return <div
		className='tk-b tk-p-2qr'
		contentEditable={true}
		onInput={handleInput}
		onSelect={handleSelect}>
		{renderedLines}
	</div>;

}

export { PageEditor };
