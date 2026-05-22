'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@dialog/data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { firebaseErrorMessage } from '@/lib/firebase-errors';

const schema = z.object({
  email: z.string().email('Email inválido'),
});

type ResetValues = z.infer<typeof schema>;

export function ResetPasswordForm() {
  const { sendPasswordReset } = useAuth();
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<ResetValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values: ResetValues): Promise<void> {
    setFormError(null);
    try {
      await sendPasswordReset(values.email);
      setSent(true);
    } catch (e) {
      setFormError(firebaseErrorMessage(e));
    }
  }

  if (sent) {
    return (
      <p className="text-sm text-muted-foreground">
        Si existe una cuenta con ese email, te enviamos un link para resetear
        la contraseña.
      </p>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid gap-4"
        noValidate
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {formError !== null && (
          <p role="alert" className="text-destructive text-sm">
            {formError}
          </p>
        )}
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Enviando…' : 'Enviar'}
        </Button>
      </form>
    </Form>
  );
}
