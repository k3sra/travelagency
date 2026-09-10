"use client";

/**
 * The house button: a hairline pill with a Cinzel caps label and gravity
 * built in. On hover a fill rises from the bottom (pseudo-layer, scaleY) and
 * the label swaps colour — transform and colour only, 0.3 s "fable".
 *
 * A real <button> (type="button" unless told otherwise); every native button
 * attribute passes through, and `ref` reaches the element.
 */

import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import { Magnetic } from "./Magnetic";
import styles from "./MagneticButton.module.css";

export interface MagneticButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** gold: gold hairline on any plate. ghost: vellum hairline for dark plates. forest: solid. @default "gold" */
  variant?: "gold" | "ghost" | "forest";
  /** @default "md" */
  size?: "md" | "lg";
  label: string;
  /** Optional icon (an inline SVG sized 1em) in the leading or trailing slot. */
  icon?: ReactNode;
  /** @default "trailing" */
  iconPosition?: "leading" | "trailing";
  ref?: Ref<HTMLButtonElement>;
}

export function MagneticButton({
  variant = "gold",
  size = "md",
  label,
  icon,
  iconPosition = "trailing",
  className,
  type = "button",
  ref,
  ...rest
}: MagneticButtonProps) {
  const classes = [styles.button, styles[variant], styles[size], className]
    .filter(Boolean)
    .join(" ");

  const iconNode = icon ? (
    <span className={styles.icon} aria-hidden="true">
      {icon}
    </span>
  ) : null;

  return (
    <Magnetic>
      <button ref={ref} type={type} className={classes} data-cursor="link" {...rest}>
        <span className={styles.fill} aria-hidden="true" />
        {iconPosition === "leading" ? iconNode : null}
        <span className={styles.label}>{label}</span>
        {iconPosition === "trailing" ? iconNode : null}
      </button>
    </Magnetic>
  );
}
