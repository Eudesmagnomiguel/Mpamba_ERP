import type { Metadata } from "next";
import { Fraunces, Karla } from "next/font/google";
import "@/assets/styles/globals.css";
import { cn } from "@/lib/utils";
import QueryProvider from "@/providers/QueryProvider";
import { ModuleProvider } from "@/providers/ModuleProvider";
import { Toaster } from "sonner";

// Karla: corpo de texto — geométrica, amigável, muito legível em tabelas.
const karla = Karla({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

// Fraunces: títulos — serifada com carácter, dá um ar mais "instituição
// financeira premium" e editorial, destoando do típico SaaS genérico.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mpamba - Gestão financeira.",
  description:
    "Mpamba é uma plataforma de gestão financeira projetada para ajudar pequenas e médias empresas a controlar suas finanças de forma eficiente.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt" className={cn("h-full", "antialiased", fraunces.variable, "font-sans", karla.variable)}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('mpamba:theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(t==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <QueryProvider>
          <ModuleProvider>
            {children}
          </ModuleProvider>
          <Toaster position="top-right" richColors />
        </QueryProvider>
      </body>
    </html>
  );
}