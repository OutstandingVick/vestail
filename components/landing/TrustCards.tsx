"use client";

import { useTrustConnectors } from "@/hooks/useTrustConnectors";
import { TRUST_CARDS } from "@/lib/landing/trustCards";
import styles from "./TrustSection.module.css";
import { TrustIcon } from "./TrustIcon";

export function TrustCards() {
  const { stageRef, geometry } = useTrustConnectors();
  return (
    <div ref={stageRef} className={styles.stage}>
      {geometry.paths.length > 0 && (
        <svg className={styles.connectors} viewBox={`0 0 ${geometry.width} ${geometry.height}`}
          aria-hidden="true" focusable="false">
          {geometry.paths.map((path, index) => (
            <path key={index} d={path} fill="none" stroke="currentColor"
              strokeWidth="1" strokeDasharray="6 6" />
          ))}
        </svg>
      )}
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
