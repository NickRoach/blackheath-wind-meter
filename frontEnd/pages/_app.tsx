import "../styles/globals.css";
import type { AppProps } from "next/app";
import { hotjar } from "react-hotjar";
import { useEffect } from "react";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    hotjar.initialize(
      Number(process.env.NEXT_PUBLIC_HJID),
      Number(process.env.NEXT_PUBLIC_HJSV)
    );
  }, []);

  return <Component {...pageProps} />;
}
