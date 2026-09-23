import styles from "./TrustSection.module.css";
import { TrustCards } from "./TrustCards";

export function TrustSection() {
  return (
    <section id="why-trust-it" className={styles.section} aria-labelledby="trust-heading">
      <header className={styles.header}>
        <h2 id="trust-heading" className={styles.heading}>Built so you never have to trust us.</h2>
        <p className={styles.subhead}>Three things we made sure of before we shipped anything.</p>
      </header>
      <TrustCards />
    </section>
  );
}
