import React from "react";
import Spinner from "part:@sanity/components/loading/spinner";
import Preview from "part:@sanity/base/preview";
import schema from "part:@sanity/base/schema";
import styles from "../../index.css";
import { Card } from "../molecules/Card";
import RefreshIcon from "../atoms/RefreshIcon";
import { LOCALE_META } from "../../data";

class DraggableSection extends React.Component {
  render() {
    const { documents, count, type, moveCard, refreshDocuments, locale, loadMore } = this.props;

    if (!(type && type.value) && !documents.length) {
      return null;
    }

    if (type && type.value && !documents.length) {
      return (
        <div className={styles.orderDocumentsMarginTop}>
          <Spinner message="Loading..." center />
        </div>
      );
    }

    const hasReachedEnd = documents.length === count;

    return (
      <>
        <hr className={styles.orderDocumentsRule} />
        <div className={styles.orderDocumentsSubheading}>
          <p>
            <strong>Step 3: Drag and Drop to Re-order</strong>
          </p>
          <button className={styles.orderDocumentsRefreshButton} onClick={refreshDocuments}>
            <RefreshIcon title="Refresh Documents" />
          </button>
        </div>
        <ul className={styles.orderDocumentsList}>
          {documents.map((document, index) => 
            (document.__i18n_lang === locale.value || document.__i18n_lang === "en") && 
                <li key={document._id} className={styles.orderDocumentsListItem}>
                  <Card
                    prefix={document.__i18n_lang === locale.value && document.__i18n_lang !== "en" ? `[${LOCALE_META[locale.value].name}]` : ""}
                    key={document._id}
                    index={index}
                    id={document._id}
                    text={document.title}
                    moveCard={moveCard}
                    jsx={<Preview value={document} type={schema.get(document._type)} />}
                  />
                </li>
          )}
        </ul>
        {hasReachedEnd ? null : (
          <div className={styles.orderDocumentsButtonWrapper}>
            <button className={styles.orderDocumentsButton} onClick={loadMore}>
              Load More
            </button>
          </div>
        )}
      </>
    );
  }
}

export default DraggableSection;
