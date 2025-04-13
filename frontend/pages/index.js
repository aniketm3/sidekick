import Head from "next/head";
import QueryBox from "@/components/queryBox";

export default function Home() {
  return (
    <div>
      <Head>
        <title>Sidekick – Real-time meeting companion</title>
      </Head>

      <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: "600", margin: 0 }}>
          Sidekick
        </h1>
        <p style={{ fontSize: "1rem", color: "#666", marginTop: "0.25rem" }}>
          Understand more. Ask better.
        </p>

        <QueryBox />
      </main>
    </div>
  );
}
