import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="flex flex-col items-center justify-center space-y-6">
            <Image
              src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/mlallure_logo-1761303427391.jpg"
              alt="ML Allure Logo"
              width={400}
              height={150}
              priority
              className="w-auto h-24 md:h-32 object-contain"
            />
            <p className="text-2xl text-muted-foreground font-light">
              Plateforme ML Allure
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <Link
              href="/customer"
              className="group p-8 rounded-lg border-2 border-border hover:border-primary transition-all duration-300 hover:shadow-lg"
            >
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold">Portail Client</h2>
                <p className="text-sm text-muted-foreground">
                  Parcourez les produits, gérez les commandes et achetez avec élégance
                </p>
              </div>
            </Link>

            <Link
              href="/admin"
              className="group p-8 rounded-lg border-2 border-border hover:border-accent transition-all duration-300 hover:shadow-lg"
            >
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold">Tableau de bord Admin</h2>
                <p className="text-sm text-muted-foreground">
                  Gérez les produits, les commandes et les paramètres de la plateforme
                </p>
              </div>
            </Link>

            <Link
              href="/pos"
              className="group p-8 rounded-lg border-2 border-border hover:border-secondary transition-all duration-300 hover:shadow-lg"
            >
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                  <svg className="w-8 h-8 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold">Point de Vente</h2>
                <p className="text-sm text-muted-foreground">
                  Caisse en magasin et gestion des stocks
                </p>
              </div>
            </Link>
          </div>

          <div className="mt-16 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Powered by{" "}
              <a 
                href="https://www.bourdak.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:text-accent transition-colors underline underline-offset-4"
              >
                Bourdak.
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}