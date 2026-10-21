'use client';

import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Props = { children: ReactNode };

// Esta barrera es de interfaz. La API debe verificar el token y la BD necesita RLS.
export default function AuthGate({ children }: Props) {
  const [checked, setChecked] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [opened, setOpened] = useState(false);
  const [account, setAccount] = useState('');
  const [editorUserId, setEditorUserId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    let eventCount = 0;
    const apply = (userEmail: string | undefined, hasSession: boolean, userId?: string) => {
      if (!active) return;
      setSignedIn(hasSession);
      setAccount(userEmail || 'Usuario autenticado');
      if (hasSession) { setOpened(true); if (userId) setEditorUserId(userId); }
      setChecked(true);
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      eventCount += 1;
      apply(session?.user.email, Boolean(session), session?.user.id);
    });
    const initialCount = eventCount;
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active || eventCount !== initialCount) return;
      if (error) setMessage('No se pudo recuperar la sesion. Vuelve a iniciar sesion.');
      apply(data.session?.user.email, Boolean(data.session), data.session?.user.id);
    }).catch(() => {
      if (!active || eventCount !== initialCount) return;
      setMessage('No se pudo consultar la sesion. Comprueba la conexion con Supabase.');
      apply(undefined, false);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(), password,
      });
      if (error) {
        if (error.code === 'email_not_confirmed') {
          throw new Error('Confirma el correo de este usuario en Supabase antes de ingresar.');
        }
        if (error.code === 'invalid_credentials') {
          throw new Error('Correo o contrasena incorrectos. Usa un usuario de Authentication de este proyecto.');
        }
        throw new Error('No se pudo iniciar sesion. Revisa la conexion y la configuracion de Authentication.');
      }
      if (!data.session) throw new Error('Supabase no devolvio una sesion. Revisa la confirmacion del correo.');
      setPassword('');
      setSignedIn(true);
      setOpened(true);
      setAccount(data.user?.email || email.trim());
      setEditorUserId(data.session.user.id);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo iniciar sesion.');
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    if (!window.confirm('Guarda primero tus cambios. Deseas cerrar la sesion de este navegador?')) return;
    setBusy(true);
    setMessage('');
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) throw error;
      setSignedIn(false);
    } catch {
      setMessage('No se pudo cerrar la sesion. Intenta nuevamente.');
    } finally {
      setBusy(false);
    }
  }

  if (!checked) return <p role="status" className="py-4">Comprobando sesion...</p>;

  return (
    <>
      {signedIn ? (
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
          <span className="small">Sesion: <strong>{account}</strong></span>
          <button type="button" className="btn btn-outline-secondary btn-sm" disabled={busy} onClick={signOut}>
            Cerrar sesion
          </button>
        </div>
      ) : (
        <section className="brand-card p-4 my-4 mx-auto" style={{ maxWidth: 480 }} aria-labelledby="access-title">
          <h1 id="access-title" className="h4">Ingreso a Diplomas Dinamico</h1>
          <p>Inicia sesion para abrir el editor y subir imagenes o fondos.</p>
          <form onSubmit={signIn}>
            <label htmlFor="access-email" className="form-label">Correo electronico</label>
            <input id="access-email" className="form-control mb-3" type="email" autoComplete="username"
              required value={email} disabled={busy} onChange={event => setEmail(event.target.value)} />
            <label htmlFor="access-password" className="form-label">Contrasena</label>
            <input id="access-password" className="form-control mb-3" type="password" autoComplete="current-password"
              required value={password} disabled={busy} onChange={event => setPassword(event.target.value)} />
            <button className="btn btn-brand w-100" type="submit" disabled={busy}>
              {busy ? 'Ingresando...' : 'Ingresar al editor'}
            </button>
          </form>
          <p className="small text-muted mt-3 mb-0">
            Usa un usuario creado en Authentication de tu proyecto Supabase. No ingreses claves API ni la contrasena de PostgreSQL.
          </p>
        </section>
      )}
      {message && <p role="alert" className="alert alert-danger">{message}</p>}
      {/* Mantener el componente montado al expirar la sesion evita borrar cambios
          en memoria. Ocultarlo NO sustituye los permisos en la API ni RLS. */}
      {opened && <div key={editorUserId} hidden={!signedIn}>{children}</div>}
    </>
  );
}
