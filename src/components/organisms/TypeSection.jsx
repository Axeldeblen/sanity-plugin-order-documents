import React from "react";
import Select from "react-select";
import { DEFAULT_FIELD_LABEL, DEFAULT_FIELD_VALUE, LOCALES, LOCALE_META } from "../../data";
import styles from "../../index.css";
import { Tooltip } from "react-tippy";
import QuestionIcon from "../atoms/QuestionIcon";
import RefreshIcon from "../atoms/RefreshIcon";

class TypeSection extends React.Component {
  render() {
    const { documents, locale, type, types, fields, handleDropdownChange, handleFieldChange, refreshTypes } =
      this.props;

    if (!documents) {
      return (
        <div className={styles.orderDocumentsList}>
          <Spinner message="Loading..." center />
        </div>
      );
    }

    const selectorTypes = types.map(({ name, title }) => ({
      value: name,
      label: title,
    }));

    const localeOptions = LOCALES.map((lang) => ({
      value: lang,
      label: LOCALE_META[lang].name,
    }));

    const showFields =
      fields.length > 1 && fields.findIndex((field) => field.value === "order") !== -1;

    return (
      <>
        <div className={styles.orderDocumentsFlexSpaceBetween}>
          <div>
            <h2 className={styles.orderDocumentsNoTopMargin}>Order Documents</h2>
            <p>Order your documents via drag-and-drop.</p>
          </div>
          <div className={styles.orderDocumentsFlexEnd}>
            {showFields ? (
              <div className={styles.orderDocumentsSelectWrapper}>
                <Select
                  className={styles.orderDocumentsFieldsSelect}
                  options={fields}
                  isSearchable
                  onChange={handleFieldChange}
                  defaultValue={{ value: DEFAULT_FIELD_VALUE, label: DEFAULT_FIELD_LABEL }}
                />
                <div>
                  <Tooltip
                    html={
                      <p className={styles.orderDocumentsTooltipText}>
                        Use a custom field to order your documents. Fields must be hidden and have
                        type "number" to be listed here.
                      </p>
                    }
                    position="right-start"
                    trigger="mouseenter"
                  >
                    <div className={styles.orderDocumentsTooltip}>
                      <QuestionIcon />
                    </div>
                  </Tooltip>
                </div>
              </div>
            ) : null}
          </div>
        </div>
        <hr className={styles.orderDocumentsHr} />
        <div className={styles.orderDocumentsSubheading}>
          <p>
            <strong>Step 1: Choose a Language</strong>
          </p>
          <button className={styles.orderDocumentsRefreshButton} onClick={refreshTypes}>
            <RefreshIcon title="Refresh Types" />
          </button>
        </div>
        <Select options={localeOptions} isSearchable onChange={(e) => handleDropdownChange({fieldName: "locale", ...e})} value={locale} />
        <div className={styles.orderDocumentsSubheading}>
          <p>
            <strong>Step 2: Choose a Type</strong>
          </p>
          <button className={styles.orderDocumentsRefreshButton} onClick={refreshTypes}>
            <RefreshIcon title="Refresh Types" />
          </button>
        </div>
        <Select options={selectorTypes} isSearchable onChange={(e) => handleDropdownChange({fieldName: "type", ...e})} value={type} />
      </>
    );
  }
}

export default TypeSection;
