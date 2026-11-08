import './globals.css';

export const metadata = {
  title: 'SolarFlow - Company Operations Portal',
  description: 'Lead Management, Site Surveys, Quotations, and Installation Project Operations',
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
