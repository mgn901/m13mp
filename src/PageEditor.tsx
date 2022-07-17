import * as React from 'react';
import { EditorCommandCell, EditorCommand, EditorInitCommand } from './EditorCommand';
import { generateLineID, isLine, isLineID, Line, LineID } from './Line';
import { Page } from './Page';
import { UnixTime } from './utils';

interface RangeLike {
	startContainer: Node;
	startOffset: number;
	endContainer: Node;
	endOffset: number;
}

type PropsPageEditor = {
	page: Page;
}

const PageEditor: React.FC<PropsPageEditor> = (props) => {

	const { page } = props;
	const { id, title, updated, lines, links } = page;

	///////////
	// utils //
	///////////

	const getTargetLineElement = (range: RangeLike): HTMLElement[] => {
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

	const getTargetLineID = (range: RangeLike): LineID[] => {
		const lineElement = getTargetLineElement(range);
		let lineID0 = lineElement[0].dataset.id;
		let lineID1 = lineElement[1].dataset.id;
		if (!isLineID(lineID0) || !isLineID(lineID1)) {
			throw Error(`PageEditorInvalidLineIDError: ${lineID0} or ${lineID1} is invalid.`);
		} else {
			return [lineID0, lineID1];
		}
	}

	const getLineByID = (id: LineID, lines: Line[] = linesState): Line => {
		const line = lines.find((v) => {
			return v.id === id;
		});
		if (!isLine(line)) {
			throw Error(`PageEditorLineNotFoundError: line for ${id} is not found.`);
		} else {
			return line;
		}
	}

	const getLinePosById = (id: LineID, lines: Line[] = linesState): number => {
		const pos = lines.findIndex((v) => {
			return v.id === id;
		});
		if (pos === -1) {
			throw Error(`PageEditorLineNotFoundError: line for ${id} is not found.`);
		} else {
			return pos;
		}
	}

	/////////////////////
	// command history //
	/////////////////////

	const initCommand = new EditorInitCommand();
	const [commands, setCommands] = React.useState<(EditorCommand | EditorInitCommand)[]>([initCommand]);
	const [prevRange, setPrevRangeState] = React.useState<RangeLike>();
	const [linesState, setLinesState] = React.useState(lines);
	const [isComposing, setIsComposing] = React.useState(false);

	const pushCommand = (command: EditorCommand) => {
		setCommands([...commands, command]);
		handleCommand(command);
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
		const { startContainer, startOffset, endContainer, endOffset } = r;
		const rangeForSet = { startContainer, startOffset, endContainer, endOffset };
		setPrevRangeState(rangeForSet);
		return;
	}

	/////////////////////
	// handle command ///
	/////////////////////

	const handleCommand = (command: EditorCommand) => {
		const newLines = [...lines];
		for (let i = 0; i < command.commands.length; i += 1) {
			const cell = command.commands[i];
			const pos = getLinePosById(cell.lineID, newLines);
			if (cell.type === 'insertLine') {
				newLines.splice(pos, 0, {
					id: cell.newLineID!,
					text: '',
					updated: Date.now() / 1000 as UnixTime,
				});
			} else if (cell.type === 'editLine') {
				const newLine = { ...getLineByID(cell.lineID, linesState) };
				newLine.text = newLine.text.slice(0, cell.start) + cell.newText + newLine.text.slice(cell.end);
				console.log(newLine.text);
				newLines[pos] = newLine;
			}
		}
		setLinesState(newLines);
	}

	//////////////////////
	// generate command //
	//////////////////////

	const handleInsert = (e: InputEvent | CompositionEvent, newSelection: Selection) => {

		let commands: EditorCommandCell[];

		if (e instanceof InputEvent && (e.inputType === 'insertLineBreak' || e.inputType === 'insertParagraph')) {
			const lineID = getTargetLineID(prevRange!)[0];
			const newLineID = generateLineID();
			const oldLine = getLineByID(lineID);
			const insertLineCommandCell: EditorCommandCell = {
				type: 'insertLine',
				start: prevRange?.startOffset!,
				end: prevRange?.endOffset!,
				lineID,
				newLineID,
				newText: '',
			};
			const cellForNewLine: EditorCommandCell = {
				type: 'editLine',
				start: 0,
				end: 0,
				lineID: newLineID,
				newText: oldLine.text.substring(prevRange?.startOffset!),
			}
			commands = [insertLineCommandCell, cellForNewLine];
		} else {
			const newRange = newSelection.getRangeAt(0);
			const newLineElement = getTargetLineElement(newRange)[0]!;
			const newLineText = newLineElement.textContent!;
			// EdgeではgetDataできない
			// 貼り付ける瞬間（実際に張り付けられるより前）にrangeがぶった切れる
			const pastePos = (prevRange?.startContainer?.previousSibling?.previousSibling?.textContent?.length! || 0);
			const start = prevRange!.startOffset! + pastePos;
			const commandCell: EditorCommandCell = {
				lineID: getTargetLineID(prevRange!)[0],
				type: 'editLine',
				start,
				end: prevRange!.endOffset! + pastePos,
				newText: newLineText.substring(start, newRange.startOffset + pastePos),
			};
			// FirefoxではinputとcompositionEndが同時に発行されるが、片方が空になる。
			if (commandCell.start === commandCell.end && commandCell.newText === '') {
				return;
			}
			commands = [commandCell];
		}

		const command = new EditorCommand({
			refID: peakCommand().id,
			commands,
		});
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
		if (isComposing === true) {
			return;
		}
		if (ne.inputType.includes('insert')) {
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

	const handleCompositionStart: React.CompositionEventHandler = (e) => {
		setIsComposing(true);
	}

	const handleCompositionEnd: React.CompositionEventHandler = (e) => {
		if (isComposing === true) {
			handleInsert(e.nativeEvent, window.getSelection()!);
		}
		setIsComposing(false);
	}

	const handleSelect: React.ReactEventHandler<HTMLDivElement> = (e) => {
		if (isComposing === true) {
			return;
		}
		const selection = window.getSelection()!;
		setPrevRange(selection.getRangeAt(0));
		return;
	}

	const renderedLines = linesState.map((line) => {
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
		onSelect={handleSelect}
		onCompositionStart={handleCompositionStart}
		onCompositionEnd={handleCompositionEnd}>
		{renderedLines}
	</div>;

}

export { PageEditor };
