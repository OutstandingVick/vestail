import { HOW_STEPS } from "@/lib/landing/howSteps";
import styles from "./HowItWorks.module.css";

export function HowItWorksSteps() {
  return (
    <div className={styles.journey}>
      <ol className={styles.steps}>
        {HOW_STEPS.map((step) => (
          <li key={step.number} className={styles.step}>
            <span className={styles.badge} aria-hidden="true">{step.number}</span>
            <div className={styles.copy}>
              <h3 className={styles.title}>{step.title}</h3>
              <p className={styles.body}>{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
