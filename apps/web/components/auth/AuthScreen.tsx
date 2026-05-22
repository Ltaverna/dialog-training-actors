'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { ResetPasswordForm } from './ResetPasswordForm';
import { SocialButtons } from './SocialButtons';

export function AuthScreen() {
  const [mode, setMode] = useState<'auth' | 'reset'>('auth');

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Dialog</CardTitle>
          <CardDescription>
            {mode === 'reset'
              ? 'Recuperá tu contraseña'
              : 'Ingresá para practicar tus diálogos'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mode === 'reset' ? (
            <div className="grid gap-4">
              <ResetPasswordForm />
              <Button
                type="button"
                variant="link"
                className="justify-self-start px-0"
                onClick={() => setMode('auth')}
              >
                Volver
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Ingresar</TabsTrigger>
                <TabsTrigger value="register">Crear cuenta</TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="grid gap-4 pt-4">
                <LoginForm />
                <Button
                  type="button"
                  variant="link"
                  className="justify-self-start px-0"
                  onClick={() => setMode('reset')}
                >
                  ¿Olvidaste tu contraseña?
                </Button>
                <SocialButtons />
              </TabsContent>
              <TabsContent value="register" className="grid gap-4 pt-4">
                <RegisterForm />
                <SocialButtons />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
