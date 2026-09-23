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
      </div>
    </section>
  );
}
