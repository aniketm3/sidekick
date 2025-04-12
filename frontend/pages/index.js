import Head from "next/head";
import QueryBox from "@/components/queryBox";

export default function Home() {
  return (
    <div>
      <Head>
        <title>ZoomGPT</title>
      </Head>
      <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
        <h1>ZoomGPT 🧠</h1>
        <p>Paste a snippet from a meeting, and get an explanation or follow-up question.</p>
        <QueryBox />
      </main>
    </div>
  );
}
