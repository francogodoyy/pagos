import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import {db} from "@/utils/db"

const handler = NextAuth({
    providers: [
      CredentialsProvider({
        name: "Credentials",
        credentials: {
          email: { label: "Email", type: "text" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
          const { email, password } = credentials;
  
          // Busca al usuario en la base de datos
          const [rows] = await db.query("SELECT * FROM usuarios WHERE email = ?", [email]);
          if (rows.length === 0) {
            throw new Error("Usuario no encontrado");
          }
  
          const user = rows[0];
  
          // Verifica la contraseña
          const isValidPassword = await bcrypt.compare(password, user.password);
          if (!isValidPassword) {
            throw new Error("Contraseña incorrecta");
          }
  
          // Retorna el usuario si es válido
          return { id: user.id, email: user.email, role: user.role };
        },
      }),
    ],
    callbacks: {
      async session({ session, token }) {
        session.user = token.user;
        return session;
      },
      async jwt({ token, user }) {
        if (user) {
          token.user = user;
        }
        return token;
      },
    },
    pages: {
      signIn: "/admin/login", 
    },
    secret: process.env.NEXTAUTH_SECRET,
    session: {
      strategy: "jwt",
    },
  });
  
  export { handler as GET, handler as POST };