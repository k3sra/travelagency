"use client";

/**
 * The house pill as a link: same hairline, caps label, rising fill and
 * gravity as MagneticButton, but a real <a> that navigates through the
 * WebGL transition. Use it wherever a CTA leads somewhere.
 */

import type { ReactNode } from "react";
import { Magnetic } from "@/components/motion/Magnetic";
import { TransitionLink, type TransitionLinkProps } from "@/components/gl/TransitionLink";
import styles from "@/components/motion/MagneticButton.module.css";

export interface PillLinkProps extends Omit<TransitionLinkProps, "children"> {
  label: string;
  variant?: "gold" | "ghost" | "forest";
  size?: "md" | "lg";
  icon?: ReactNode;
}

export function PillLink({ label, variant = "gold", size = "md", icon, className, ...rest }: PillLinkProps) {
  const classes = [styles.button, styles[variant], styles[size], className].filter(Boolean).join(" ");
  return (
    <Magnetic>
      <TransitionLink className={classes} {...rest}>
        <span className={styles.fill} aria-hidden="true" />
        <span className={styles.label}>{label}</span>
        {icon ? (
          <span className={styles.icon} aria-hidden="true">
            {icon}
          </span>
        ) : null}
      </TransitionLink>
    </Magnetic>
  );
}
