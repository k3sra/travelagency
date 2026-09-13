import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container" style={{ minHeight: "80svh", display: "grid", alignContent: "center", gap: "1.5rem", paddingBlock: "8rem" }}>
      <p className="t-label t-sun">404</p>
      <h1 className="t-display">Wrong beach.</h1>
      <p>
        <Link href="/" className="btn">
          Back to the start
        </Link>
      </p>
    </main>
  );
}
