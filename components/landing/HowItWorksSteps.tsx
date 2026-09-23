import { HOW_STEPS } from "@/lib/landing/howSteps";
import { HOW_CURVE_PATH } from "@/lib/landing/howCurve";
import styles from "./HowItWorks.module.css";

export function HowItWorksSteps() {
  return (
    <div className={styles.journey}>
      <svg className={styles.curve} viewBox="0 0 100 100" preserveAspectRatio="none"
        aria-hidden="true" focusable="false">
        <path d={HOW_CURVE_PATH} fill="none" stroke="currentColor"
          strokeWidth="1" vectorEffect="non-scaling-stroke" />
      </svg>
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
