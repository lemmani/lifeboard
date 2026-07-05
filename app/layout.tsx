import type { Metadata } from "next";
import { Hanken_Grotesk, Space_Mono } from "next/font/google";
import "./lifeboard.css";

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-hanken",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
});

export const metadata: Metadata = {
  title: "LifeBoard — Goals, Tasks & Finance",
  description: "Personal goal, task & finance tracking platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${hanken.variable} ${spaceMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
