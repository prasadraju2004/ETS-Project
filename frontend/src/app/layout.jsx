import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "ETS Project",
  description: "Event Ticketing System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
