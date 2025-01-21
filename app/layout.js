import './global.css';

export const metadata = {
  title: 'Pagos',
  description: 'Página de pagos de clientes',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
