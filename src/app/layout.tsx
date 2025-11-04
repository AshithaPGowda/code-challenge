import type { Metadata, Viewport } from "next";
import ThemeRegistry from '../components/ThemeRegistry';
import "./globals.css";

export const metadata: Metadata = {
  title: "I-9 Voice Assistant",
  description: "Voice-driven I-9 Employment Eligibility Verification system built with Telnyx Voice AI",
  keywords: "I-9, employment verification, voice assistant, Telnyx, HR automation",
  authors: [{ name: "Ashitha Gowda" }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
        />
      </head>
      <body>
        <ThemeRegistry>
          {children}
        </ThemeRegistry>
      </body>
    </html>
  );
}
