import styles from "./ProblemSection.module.css";
import { ProblemIcon } from "./ProblemIcon";

/** The three different claims a single ticker can represent. */
export function ProblemSection() {
  return (
    <section className={styles.section} aria-labelledby="problem-heading">
      <h2 id="problem-heading" className={styles.heading}>
        The same ticker can be three completely different things
      </h2>
      <div className={styles.cards}>
        <article className={styles.card}>
          <div className={styles.icon}>
            <ProblemIcon>
              <path d="M16 3 27 7v8c0 6-4.5 10.5-11 14C9.5 25.5 5 21 5 15V7Z" />
              <rect x="11" y="13" width="10" height="8" rx="2" />
              <path d="M13 13v-2a3 3 0 0 1 6 0v2m-3 3v2" />
            </ProblemIcon>
          </div>
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
