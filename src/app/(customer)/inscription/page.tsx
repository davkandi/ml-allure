'use client';

import { RegisterForm } from '@/components/auth/RegisterForm';
import Link from 'next/link';

export default function InscriptionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              ML Allure
            </h1>
          </Link>
          <p className="mt-2 text-muted-foreground">
            Créez votre compte pour commencer
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg shadow-lg p-8">
          <RegisterForm />
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
