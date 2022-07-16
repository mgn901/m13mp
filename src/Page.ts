import { isLine, Line } from './Line';
import { isRecord, isTypedArray, isUnixTime, Nominal, UnixTime } from './utils';

type PageID = Nominal<string, 'PageID'>;
const isPageID = (v: unknown): v is PageID => {
	if (typeof v === 'string') {
		return true;
	} else {
		return false;
	}
}

type PageTitle = Nominal<string, 'PageName'>;
const isPageTitle = (v: unknown): v is PageTitle => {
	if (typeof v === 'string') {
		return true;
	} else {
		return false;
	}
}

interface Page {
	id: PageID;
	title: PageTitle;
	updated: UnixTime;
	lines: Line[];
	links: PageIndex[];
}
const isPage = (v: unknown): v is Page => {
	if (!isRecord(v)) {
		return false;
	} else if (
		!isPageID(v.id)
		|| !isPageTitle(v.title)
		|| !isUnixTime(v.updated)
		|| !isTypedArray(v.lines, isLine)
		|| !isTypedArray(v.links, isPageIndex)
	) {
		return false;
	} else {
		return true;
	}
}

type PageIndex = Pick<Page, 'id' | 'title' | 'updated'>;
const isPageIndex = (v: unknown): v is PageIndex => {
	if (!isRecord(v)) {
		return false;
	} else if (
		!isPageID(v.id)
		|| !isPageTitle(v.title)
		|| !isUnixTime(v.updated)
	) {
		return false;
	} else {
		return true;
	}
}

export {
	PageID,
	isPageID,
	PageTitle,
	isPageTitle,
	Page,
	isPage,
	PageIndex,
	isPageIndex,
};
