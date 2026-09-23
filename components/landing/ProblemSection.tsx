import styles from "./ProblemSection.module.css";

/** The three different claims a single ticker can represent. */
export function ProblemSection() {
  return (
    <section className={styles.section} aria-labelledby="problem-heading">
      <h2 id="problem-heading" className={styles.heading}>
        The same ticker can be three completely different things
      </h2>
      <div className={styles.cards}>
        <article className={styles.card}>
          <h3 className={styles.title}>Backed by real shares</h3>
          <p className={styles.body}>
            xStocks holds the actual shares in custody, one for one. You own
            exposure to the real thing, but not a shareholder&apos;s rights.
          </p>
        </article>
        <article className={styles.card}>
          <h3 className={styles.title}>Just tracks the price</h3>
          <p className={styles.body}>
            Ondo often issues a note that follows what the stock does. You get the
            performance without ever holding the share itself.
          </p>
        </article>
        <article className={styles.card}>
          <h3 className={styles.title}>A real legal claim</h3>
          <p className={styles.body}>
            Backpack issues a recognised entitlement through a licensed broker —
            the strongest claim, and the narrowest on who&apos;s allowed to hold it.
          </p>
        </article>
      </div>
      <p className={styles.takeaway}>
        Three tokens. One ticker. Completely different rules on who can own them.
      </p>
    </section>
  );
}
