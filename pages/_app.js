import { Bricolage_Grotesque, Manrope } from "next/font/google";
import "../styles/globals.css";
import "../styles/FlexCarousel.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["wdth", "opsz"],
  variable: "--font-display",
});
const body = Manrope({ subsets: ["latin"], variable: "--font-body" });

function MyApp({ Component, pageProps }) {
  return (
    <div className={`app ${display.variable} ${body.variable}`}>
      <Component {...pageProps} />
    </div>
  );
}

export default MyApp;
