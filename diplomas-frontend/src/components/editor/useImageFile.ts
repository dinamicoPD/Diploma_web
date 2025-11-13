'use client';

import { useState, ChangeEvent } from 'react';

/** Hook simple para leer un archivo de imagen como DataURL. */
export function useImageFile() {
  const [url, setUrl] = useState<string | undefined>(undefined);

  const onChange = (e: ChangeEvent<HTMLInputElement>, cb?: (uri: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const data = String(reader.result);
      setUrl(data);
      cb?.(data);
    };
    reader.readAsDataURL(file);
  };

  const clear = () => setUrl(undefined);
  return { url, onChange, clear, setUrl };
}
