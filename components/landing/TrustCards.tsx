import { TRUST_CARDS } from "@/lib/landing/trustCards";
import styles from "./TrustSection.module.css";
import { TrustIcon } from "./TrustIcon";

export function TrustCards() {
  return (
    <div className={styles.stage}>
      <ol className={styles.cards}>
        {TRUST_CARDS.map((card) => (
          <li key={card.id} className={styles.item} data-trust-card={card.id}>
            <article className={styles.card} aria-labelledby={`trust-${card.id}`}>
              <span className={styles.orb} aria-hidden="true" />
              <div className={styles.panel}>
                <div className={styles.icon}><TrustIcon name={card.id} /></div>
                <h3 id={`trust-${card.id}`} className={styles.title}>{card.title}</h3>
                <p className={styles.body}>{card.body}</p>
              </div>
            </article>
          </li>
        ))}
      </ol>
    </div>
  );
}
