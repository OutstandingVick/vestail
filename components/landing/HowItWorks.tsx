import Image from "next/image";
import { HowItWorksSteps } from "./HowItWorksSteps";
import styles from "./HowItWorks.module.css";

export function HowItWorks() {
  return (
    <section id="how-it-works" className={styles.section} aria-labelledby="how-heading">
      <div className={styles.layout}>
        <div className={styles.intro}>
          <h2 id="how-heading" className={styles.heading}>
            From a ticker to your<br />wallet, in four steps.
          </h2>
          <div className={styles.artwork} aria-hidden="true">
            <Image src="/brand/vestail-character.svg" alt="" width={420} height={420}
              unoptimized className={styles.character} />
          </div>
        </div>
        <HowItWorksSteps />
      </div>
    </section>
  );
}
