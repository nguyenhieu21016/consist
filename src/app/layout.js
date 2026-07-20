import { Inter, EB_Garamond, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const ebGaramond = EB_Garamond({ subsets: ["latin"], variable: '--font-serif', weight: ['400', '500', '600', '700'] });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: '--font-space-grotesk', weight: ['400', '500', '600', '700'] });

export const metadata = {
  title: "consist",
  description: "Minimalist habit tracker",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "consist",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: "#facc15",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${ebGaramond.variable} ${spaceGrotesk.variable}`}>{children}</body>
    </html>
  );
}
