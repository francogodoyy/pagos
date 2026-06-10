import './global.css';
import SessionProviderWrapper from '@/components/SessionProviderWrapper';

export const metadata = {
  title: "Shine Pagos",
  description: "Sistema de gestión de cobro de cuotas escolares",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <SessionProviderWrapper>{children}</SessionProviderWrapper>
      </body>
    </html>
  );
}

