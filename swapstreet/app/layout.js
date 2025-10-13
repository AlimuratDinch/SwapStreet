/* Layout for the entire application */
/* So whatever is in here will be on every page */
/* You can add headers, footers, navigation bars, etc. here */

import "./globals.css";

export const metadata = {
  title: "SwapStreet",
  description: "***",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children} {/* Renders the content of each specific page */}
      </body>
    </html>
  );
}
