import './globals.css';

export const metadata = {
  title: 'VSL Dashboard - Analytics',
  description: 'Tracking Dashboard für TERMINIFY.AI',
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
