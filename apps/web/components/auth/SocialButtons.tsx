'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@dialog/data';
import { Button } from '@/components/ui/button';
import { firebaseErrorMessage, isPopupCancelled } from '@/lib/firebase-errors';

export function SocialButtons() {
  const { signInWithGoogle, signInWithApple } = useAuth();
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<void>): Promise<void> {
    setBusy(true);
    try {
      await action();
    } catch (e) {
      if (!isPopupCancelled(e)) {
        toast.error(firebaseErrorMessage(e));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-2">
      <Button
        type="button"
        variant="outline"
        disabled={busy}
        onClick={() => void run(signInWithGoogle)}
      >
        Continuar con Google
      </Button>
      <Button
        type="button"
        variant="outline"
        disabled={busy}
        onClick={() => void run(signInWithApple)}
      >
        Continuar con Apple
      </Button>
    </div>
  );
}
