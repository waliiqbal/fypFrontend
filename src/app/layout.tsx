import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Create your Askare profile",
  description: "Join Askare as a patient or healthcare professional.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
