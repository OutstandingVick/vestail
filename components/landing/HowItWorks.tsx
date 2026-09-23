import styles from "./HowItWorks.module.css";

export function HowItWorks() {
  return (
    <section id="how-it-works" className={styles.section} aria-labelledby="how-heading">
      <div className={styles.layout}>
        <div className={styles.intro}>
          <h2 id="how-heading" className={styles.heading}>
            From a ticker to your<br />wallet, in four steps.
          </h2>
        </div>
      </div>
    </section>
  );
}
