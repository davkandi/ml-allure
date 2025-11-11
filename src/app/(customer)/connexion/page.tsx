'use client';

import { LoginForm } from '@/components/auth/LoginForm';
import Link from 'next/link';

export default function ConnexionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              ML Allure
            </h1>
          </Link>
          <p className="mt-2 text-muted-foreground">
            Connexion à votre compte
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg shadow-lg p-8">
          <LoginForm />
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
