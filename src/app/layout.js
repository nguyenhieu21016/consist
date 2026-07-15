import { Inter, EB_Garamond } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const ebGaramond = EB_Garamond({ subsets: ["latin"], variable: '--font-serif', weight: ['400', '500', '600', '700'] });
export const metadata = {
  title: "Consist",
  description: "A modern habit tracker",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Consist",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${ebGaramond.variable}`}>{children}</body>
    </html>
  );
}
