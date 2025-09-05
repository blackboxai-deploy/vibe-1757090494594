import './globals.css';

export const metadata = {
  title: 'Video Analyzer - Debug Version',
  description: 'Debug version with enhanced error logging',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}