"use client";

import type { CSSProperties } from "react";
import { useClosestStep } from "@/hooks/useClosestStep";
import { HOW_STEPS } from "@/lib/landing/howSteps";
import { HOW_CURVE_PATH, howStepAnchor } from "@/lib/landing/howCurve";
import styles from "./HowItWorks.module.css";

export function HowItWorksSteps() {
  const { listRef, activeStep } = useClosestStep();
  return (
    <div className={styles.journey}>
      <svg className={styles.curve} viewBox="0 0 100 100" preserveAspectRatio="none"
        aria-hidden="true" focusable="false">
        <path d={HOW_CURVE_PATH} fill="none" stroke="currentColor"
          strokeWidth="1" vectorEffect="non-scaling-stroke" />
      </svg>
      <ol ref={listRef} className={styles.steps} data-tracking={activeStep !== null}>
        {HOW_STEPS.map((step, index) => (
          <li key={step.number} className={styles.step}
            data-active={activeStep === index}
            style={{ "--anchor-x": `${howStepAnchor(index, HOW_STEPS.length).x}%` } as CSSProperties}>
            <span className={styles.badge} data-step-badge aria-hidden="true">{step.number}</span>
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
