import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "SwapStreet",
  description: `Our project is a web and mobile-based marketplace dedicated to buying and selling refurbished and second hand clothing. 
  The platform addresses two major needs in the fashion industry, which are accessibility to affordable, high quality clothing and the growing demand for environmentally friendly fashion alternatives.`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
