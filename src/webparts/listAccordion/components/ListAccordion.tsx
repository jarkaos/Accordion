import * as React from 'react';
import styles from './ListAccordion.module.scss';
import { IListAccordionProps } from './IListAccordionProps';
import { SPHttpClient, SPHttpClientResponse, ISPHttpClientOptions } from '@microsoft/sp-http';
import { PrimaryButton } from "office-ui-fabric-react/lib/Button";
import { SearchBox } from "office-ui-fabric-react/lib/SearchBox";
import { Spinner, SpinnerSize } from "office-ui-fabric-react/lib/Spinner";
import { Accordion, AccordionItem, AccordionItemTitle, AccordionItemBody } from "react-accessible-accordion";
import 'react-accessible-accordion/dist/minimal-example.css';
import { IListAccordionState } from "./IListAccordionState";
import { WebPartTitle } from '@pnp/spfx-controls-react/lib/WebPartTitle';
import './accordion.css';
import { escape } from '@microsoft/sp-lodash-subset';
import IListAccordionItem from '../models/IListAccordionItem';

export default class ListAccordion extends React.Component<IListAccordionProps, IListAccordionState> {
  constructor(props: IListAccordionProps, state: IListAccordionState) {
    super(props);
    this.state = {
      status: this.listNotConfigured(this.props) ? 'Please configure list in Web Part properties' : 'Ready',
      items: [],
      listItems: [],
      isLoading: false,
      loaderMessage: ''
    };

    if (!this.listNotConfigured(this.props)) {
      this.readItems();
    }

    this.searchTextChange = this.searchTextChange.bind(this);
  }

  private listNotConfigured(props: IListAccordionProps): boolean {
    return props.listName === undefined || props.listName === null || props.listName.length === 0;
  }

  private searchTextChange(event) {
    if (event === undefined || event === null || event === "") {
      let listItemsCollection = [...this.state.listItems];
      this.setState({items: listItemsCollection.splice(0, this.props.maxItemsPerPage)});
    } else {
      var updatedList = [...this.state.listItems];
      updatedList = updatedList.filter((item) => {
        return item.Title.toLowerCase().search(
          event.toLowerCase()) !== -1 || item.Description.toLowerCase().search(
            event.toLowerCase()) !== -1;
      });
      this.setState({ items: updatedList });
    }
  }

  private readItems(): void {
    let restApi = this.props.siteUrl + `/_api/web/lists/GetByTitle('${this.props.listName}')/items?$select=Title,Description`;

    this.props.spHttpClient.get(restApi, SPHttpClient.configurations.v1, {
      headers: {
        'Accept': 'application/json;odata=nometadata',
        'odata-version': ''
      }
    })
    .then((response: SPHttpClientResponse): Promise<{value: IListAccordionItem[]}> => {
      return response.json();
    })
    .then((response: {value: IListAccordionItem[]}): void => {
      let listItemsCollection = [...response.value];

      this.setState({
        status: "",
        items:listItemsCollection.splice(0, this.props.maxItemsPerPage),
        listItems: response.value,
        isLoading: false,
        loaderMessage: ""
      });
    }, (error: any): void => {
      this.setState({
        status: 'Loading all items failed with error: ' + error,
        items: [],
        isLoading: false,
        loaderMessage: ""
      });
    });
  }

  public render(): React.ReactElement<IListAccordionProps> {
    let displayLoader;
    let faqTitle;
    let { listItems } = this.state;
    let pageCountDivisor: number = this.props.maxItemsPerPage;
    let pageCount: number;
    let pageButtons = [];

    let _pagedButtonClick = (pageNumber: number, listData: any) => {
      let startIndex: number = (pageNumber - 1) * pageCountDivisor;
      let listItemsCollection = [...listData];
      this.setState({ items: listItemsCollection.splice(startIndex, pageCountDivisor)});
    };

    const items: JSX.Element[] = this.state.items.map((item: IListAccordionItem, i: number): JSX.Element => {
      return (
        <AccordionItem>
          <AccordionItemTitle className="accordion_title">
            <h3 className="u-position-relative ms-fontColor-white">{item.Title}</h3>
            <div className="accordion__arrow ms-fontColor-white" role="presentation" />
          </AccordionItemTitle>
          <AccordionItemBody className="accordion__body">
            <div className="" dangerouslySetInnerHTML={{ __html: item.Description }}>
            </div>
          </AccordionItemBody>
        </AccordionItem>
      );
    });

    if (this.state.isLoading) {
      displayLoader = (<div className={`ms-Grid-row ms-bgColor-themeDark ms-fontColor-white ${styles.row}`}>
        <div className='ms-Grid-col ms-u-lg12'>
          <Spinner size={SpinnerSize.large} label={this.state.loaderMessage} />
        </div>
      </div>);
    }
    else {
      displayLoader = (null);
    }

    if (this.state.listItems.length > 0) {
      pageCount = Math.ceil(this.state.listItems.length / pageCountDivisor);
    }
    for (let i = 0; i < pageCount; i++) {
      pageButtons.push(<PrimaryButton onClick={() => { _pagedButtonClick(i + 1, listItems); }}> {i + 1} </PrimaryButton>);
    }

    return (
      <div className={ styles.listAccordion }>
        <div className={ styles.container }>
        {faqTitle}
          {displayLoader}
          <WebPartTitle displayMode={this.props.displayMode}
            title={this.props.title}
            updateProperty={this.props.updateProperty} />
          <div className='ms-Grid-row'>
            <div className='ms-Grid-col ms-u-lg12'>
              <SearchBox
                onChange={this.searchTextChange}
              />
            </div>
          </div>
          <div className={`ms-Grid-row`}>
            <div className='ms-Grid-col ms-u-lg12'>
              {this.state.status}
              <Accordion accordion={false}>
                {items}
              </Accordion>
            </div>
          </div>
          <div className='ms-Grid-row'>
            <div className='ms-Grid-col ms-u-lg12'>
              {pageButtons}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
