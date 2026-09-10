import Image from "next/image";
import type { Curator as CuratorData } from "@/lib/types";
import styles from "./Curator.module.css";

export interface CuratorProps {
  curator: CuratorData;
  className?: string;
}

/** The host: a monochrome portrait, name, role and two lines of bio. */
export function Curator({ curator, className }: CuratorProps) {
  return (
    <div className={`${styles.curator} ${className ?? ""}`}>
      <div className={styles.portrait}>
        <Image
          src={curator.portrait}
          alt={`Portrait of ${curator.name}`}
          width={600}
          height={800}
          sizes="(max-width: 600px) 34vw, (max-width: 900px) 22vw, 11vw"
          className={styles.img}
        />
      </div>
      <div className={styles.text}>
        <p className="t-caps t-muted">Curated by</p>
        <h2 className={styles.name}>{curator.name}</h2>
        <p className={`t-body t-muted ${styles.role}`}>{curator.role}</p>
        <p className={`t-body ${styles.bio}`}>{curator.bio}</p>
      </div>
    </div>
  );
}
