"use client";

import { useId } from "react";
import { useTrustConnectors } from "@/hooks/useTrustConnectors";
import { useTrustReveal } from "@/hooks/useTrustReveal";
import { TRUST_CARDS } from "@/lib/landing/trustCards";
import styles from "./TrustSection.module.css";
import { TrustIcon } from "./TrustIcon";

export function TrustCards() {
  const { stageRef, geometry } = useTrustConnectors();
  const revealed = useTrustReveal(stageRef, TRUST_CARDS.length - 1);
  const maskId = useId();
  return (
    <div ref={stageRef} className={styles.stage}>
      {geometry.paths.length > 0 && (
        <svg className={styles.connectors} viewBox={`0 0 ${geometry.width} ${geometry.height}`}
          aria-hidden="true" focusable="false">
          <defs>
            {geometry.paths.map((path, index) => (
              <mask key={index} id={`${maskId}-${index}`} maskUnits="userSpaceOnUse"
                x="0" y="0" width={geometry.width} height={geometry.height}>
                <path d={path} fill="none" stroke="white" strokeWidth="3"
                  pathLength="1" strokeDasharray="1" className={styles.drawMask}
                  data-revealed={revealed[index]} />
              </mask>
            ))}
          </defs>
          {geometry.paths.map((path, index) => (
            <path key={index} d={path} fill="none" stroke="currentColor"
              strokeWidth="1" strokeDasharray="6 6" mask={`url(#${maskId}-${index})`} />
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
