import './globals.css';

export const metadata = {
  title: 'SolarFlow - Rooftop Solar Platform for Homeowners',
  description:
    'Apply for rooftop solar, verify your electricity bill with OCR, get instant estimates, and track your installation project.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
