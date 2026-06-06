import { Plus_Jakarta_Sans } from "next/font/google";
import Providers from "@/components/providers/Providers";
import "./globals.css";

const googleSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: "VendorLand — Procurement ERP",
  description: "Enterprise procurement and vendor management platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${googleSans.variable} h-full`}>
      <body className="min-h-full antialiased font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
