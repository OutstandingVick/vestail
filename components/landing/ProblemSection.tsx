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
        <article className={styles.card} aria-labelledby="problem-shares">
          <div className={styles.icon}>
            <ProblemIcon>
              <path d="M16 3 27 7v8c0 6-4.5 10.5-11 14C9.5 25.5 5 21 5 15V7Z" />
              <rect x="11" y="13" width="10" height="8" rx="2" />
              <path d="M13 13v-2a3 3 0 0 1 6 0v2m-3 3v2" />
            </ProblemIcon>
          </div>
          <h3 id="problem-shares" className={styles.title}>Backed by<br />real shares</h3>
          <p className={styles.body}>
            xStocks holds the actual shares in custody, one for one. You own
            exposure to the real thing, but not a shareholder&apos;s rights.
          </p>
        </article>
        <article className={styles.card} aria-labelledby="problem-price">
          <div className={styles.icon}>
            <ProblemIcon>
              <path d="M5 4v23h23M9 21l6-7 5 3 7-10m-6 0h6v6" />
            </ProblemIcon>
          </div>
          <h3 id="problem-price" className={styles.title}>Just tracks<br />the price</h3>
          <p className={styles.body}>
            Ondo often issues a note that follows what the stock does. You get the
            performance without ever holding the share itself.
          </p>
        </article>
        <article className={styles.card} aria-labelledby="problem-claim">
          <div className={styles.icon}>
            <ProblemIcon>
              <path d="M15 27H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h13l7 7v7M20 3v7h7M10 11h5m-5 5h8" />
              <circle cx="23" cy="22" r="4" />
              <path d="m20 25-1 5 4-2 4 2-1-5" />
            </ProblemIcon>
          </div>
          <h3 id="problem-claim" className={styles.title}>A real<br />legal claim</h3>
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
