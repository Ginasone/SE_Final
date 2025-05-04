import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import ThemeProvider from "@/components/ThemeProvider/ThemeProvider";
import AppProviders from "./AppProviders";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  style: ["italic", "normal"],
  variable: "--font-poppins"
});

export const metadata: Metadata = {
  title: "EduHub - Online Learning Platform",
  description: "The best online learning platform for Ghanaian students",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={poppins.className}>
        <ThemeProvider>
          <AppProviders>
            <main className="font-normal">
              <Header />
              {children}
              <Footer />
            </main>
          </AppProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}