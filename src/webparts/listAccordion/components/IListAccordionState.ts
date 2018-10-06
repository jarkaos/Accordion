import IListAccordionItem from '../models/IListAccordionItem';

export interface IListAccordionState {
    status: string;
    items: IListAccordionItem[];
    listItems: IListAccordionItem[];
    isLoading: boolean;
    loaderMessage: string;
}