// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { initFirebase, type FirebaseServices } from '../index';
import { FirebaseProvider, useFirebase } from './FirebaseProvider';

const DEMO_CONFIG = {
  apiKey: 'demo-api-key',
  authDomain: 'demo-dialog-test.firebaseapp.com',
  projectId: 'demo-dialog-test',
  storageBucket: 'demo-dialog-test.appspot.com',
  messagingSenderId: '0',
  appId: 'demo-app-id',
};

function buildServices(): FirebaseServices {
  return initFirebase(DEMO_CONFIG, {
    emulators: {
      authUrl: 'http://127.0.0.1:9099',
      firestore: { host: '127.0.0.1', port: 8080 },
    },
  });
}

describe('FirebaseProvider / useFirebase', () => {
  it('expone los handles cuando está dentro del proveedor', () => {
    const services = buildServices();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <FirebaseProvider services={services}>{children}</FirebaseProvider>
    );
    const { result } = renderHook(() => useFirebase(), { wrapper });
    expect(result.current).toBe(services);
  });

  it('lanza un error si se usa fuera del proveedor', () => {
    expect(() => renderHook(() => useFirebase())).toThrow(
      /FirebaseProvider/,
    );
  });
});
