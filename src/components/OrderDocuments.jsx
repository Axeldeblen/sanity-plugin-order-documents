import React from "react";
import update from "immutability-helper";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import client from "part:@sanity/base/client";
import { withRouterHOC } from "part:@sanity/base/router";
import styles from "../index.css";
import { setOrder, setListOrder, getDocumentTypeNames, willUserOverrideData } from "../functions";
import { DEFAULT_FIELD_VALUE, DEFAULT_FIELD_LABEL } from "../data";
import DraggableSection from "./organisms/DraggableSection";
import TypeSection from "./organisms/TypeSection";

const PAGE_SIZE = 25;
// note: going above 25 can lead to Promises not resolving

class OrderDocuments extends React.Component {
  state = {
    count: 0,
    documents: [],
    types: [],
    error: "",
    type: { label: "", value: "" },
    locale: { label: "English", value: "en" },
    field: { label: DEFAULT_FIELD_LABEL, value: DEFAULT_FIELD_VALUE },
    fields: [],
  };

  componentDidMount() {
    this.getTypes();
  }

  loadMore = async () => {
    const length = this.state.documents.length;

    const newDocuments = await client.fetch(
      `*[!(_id in path("drafts.**")) && _type == $types && __i18n_lang == "${this.state.locale.value}" && isDisplayed != false] | order (${this.state.field.value} asc, 
        order asc, _updatedAt desc)[${length}...${length + PAGE_SIZE}]`,
      { types: this.state.type.value }
    );

    const documents = [...this.state.documents, ...newDocuments];

    this.setState({ documents });

    await setListOrder(newDocuments, this.state.field.value, length);
  };

  getTypes = () => {
    const types = getDocumentTypeNames();
    this.setState({ types });
  };

  getFields = () => {
    const { type, types } = this.state;

    const selectedType = types.find(({ name }) => name === type.value);

    const fields = (selectedType ? selectedType.fields : []).map(({ name, title }) => ({
      value: name,
      label: title,
    }));

    this.setState({ fields });
  };

  refreshTypes = () => {
    this.getTypes();
    this.getFields();
  };

  refreshDocuments = async () => {
    const count = await client.fetch(`count(*[!(_id in path("drafts.**")) && _type == $types && __i18n_lang == "${this.state.locale.value}" && isDisplayed != false])`, {
      types: this.state.type.value,
    });

    const documents = await client.fetch(
      `*[!(_id in path("drafts.**")) && _type == $types && __i18n_lang == "${this.state.locale.value}" && isDisplayed != false] | order (${this.state.field.value} asc, order asc, _updatedAt desc)[0...${PAGE_SIZE}]`,
      { types: this.state.type.value }
    );

    this.setState({ documents, count });

    if (documents.length > 0) {
      await setListOrder(documents, this.state.field.value);
    }
  };

  isSafeToProceed = (documents, field, type) => {
    const shouldShowWarning = willUserOverrideData(documents, field.value);

    let shouldProceed = true;

    if (shouldShowWarning) {
      shouldProceed = window.confirm(
        `It looks like you are already storing data for:
          • Type: ${type.label}
          • Field: ${field.label}

          Override existing data? This is a one-time operation and cannot be reversed.`
      );
    }

    return shouldProceed;
  };

  handleDropdownChange = async ({ fieldName, value, label }) => {
    const type = fieldName === 'locale' ? this.state.type.value : value
    const typeLabel = fieldName === 'locale' ? this.state.type.label : label

    const locale = fieldName === 'locale' ? value : this.state.locale.value;
    const localeLabel = fieldName === 'locale' ? label : this.state.locale.label;
    
    if (type === '') {
      this.setState({ [fieldName]: { value, label } }, () => {
        this.getFields();
      });
      return;
    }

    let count;
    let documents;

    count = await client.fetch(
      `count(*[!(_id in path("drafts.**")) && _type == $types && __i18n_lang == "${locale}" && isDisplayed != false])`, 
      { types: type }
    );
    documents = await client.fetch(
      `*[!(_id in path("drafts.**")) && _type == $types && __i18n_lang == "${locale}" && isDisplayed != false] | order (${this.state.field.value} asc, order asc, _updatedAt desc)[0...${PAGE_SIZE}]`,
      { types: type }
    );

    const shouldProceed = this.isSafeToProceed(documents, this.state.field, { value, label });
    
    if (documents && documents.length > 0 && shouldProceed) {
      // check if the first document has no order field
      const firstDocument = documents[0];
      const firstDocumentOrderField = firstDocument[this.state.field.value];
      const isFirstOrderUndefined = firstDocumentOrderField === undefined;

      // if the first document has an order field, the plugin has been used at least once, and so we want to put documents with no order at the front
      if (!isFirstOrderUndefined) {
        for (let i = documents.length; i > 0; i--) {
          const document = documents[i - 1];
          const orderField = document[this.state.field.value];
          const isOrderUndefined = orderField === undefined;

          if (isOrderUndefined) {
            documents.pop();
            documents.unshift(document);
          } else {
            break;
          }
        }
      }

      this.setState({ [fieldName]: { value, label }, documents, count, error: "" }, () => {
        this.getFields();
      });

      if (documents.length > 0) {
        await setListOrder(documents, this.state.field.value);
      }
    } else {
      this.setState({
        ...this.state,
        error: `* No document found for "${localeLabel}" language and "${typeLabel}" type.`
      })
    }
  };

  handleFieldChange = async ({ value, label }) => {
    const count = await client.fetch(`count(*[!(_id in path("drafts.**")) && _type == $types])`, {
      types: this.state.type.value,
    });

    const documents = await client.fetch(
      `*[!(_id in path("drafts.**")) && _type == $types] | order (${value} asc, order asc, _updatedAt desc)[0...${PAGE_SIZE}]`,
      { types: this.state.type.value }
    );

    const shouldProceed = this.isSafeToProceed(documents, { value, label }, this.state.type);

    if (shouldProceed) {
      this.setState({ field: { value, label }, documents, count });

      if (documents.length > 0) {
        await setListOrder(this.state.documents, value);
      }
    }
  };

  moveCard = async (beforeIndex, afterIndex) => {
    const card1 = this.state.documents[beforeIndex];
    const card2 = this.state.documents[afterIndex];

    this.setState({
      documents: update(this.state.documents, {
        $splice: [
          [beforeIndex, 1],
          [afterIndex, 0, card1],
        ],
      }),
    });

    await Promise.all([setOrder(card1._id, afterIndex, this.state.field.value), setOrder(card2._id, beforeIndex, this.state.field.value)]);
  };

  render() {
    return (
      <DndProvider backend={HTML5Backend}>
        <div className={styles.orderDocumentsFlexContainer}>
          <div className={styles.orderDocumentsOuterWrapper}>
            <div className={styles.orderDocumentsInnerWrapper}>
              <TypeSection
                {...this.state}
                handleDropdownChange={this.handleDropdownChange}
                handleFieldChange={this.handleFieldChange}
                refreshTypes={this.refreshTypes}
              />
              <div className={styles.error}>{this.state.error}</div>
              <DraggableSection
                documents={this.state.documents}
                count={this.state.count}
                type={this.state.type}
                moveCard={this.moveCard}
                refreshDocuments={this.refreshDocuments}
                loadMore={this.loadMore}
              />
            </div>
          </div>
        </div>
      </DndProvider>
    );
  }
}

export default withRouterHOC(OrderDocuments);
