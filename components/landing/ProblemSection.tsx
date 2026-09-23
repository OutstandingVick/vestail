import styles from "./ProblemSection.module.css";

/** The three different claims a single ticker can represent. */
export function ProblemSection() {
  return (
    <section className={styles.section} aria-labelledby="problem-heading">
      <h2 id="problem-heading" className={styles.heading}>
        The same ticker can be three completely different things
      </h2>
    </section>
  );
}
