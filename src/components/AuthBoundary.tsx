import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { Delete, House, LockKeyhole, Mail } from 'lucide-react';
import { configurationError, inventoryId, supabase } from '../services/supabase';
import { checkPin, createPin, pinKey, readPin } from '../services/deviceLock';
import { useControlFeedback } from './useControlFeedback';
import { authErrorMessage } from '../domain/authErrors';

function authSessionId(session: Session): string {
  try {
    const payload = session.access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload)).session_id ?? session.user.last_sign_in_at ?? 'unknown';
  } catch { return session.user.last_sign_in_at ?? 'unknown'; }
}

export function AuthBoundary({ children }: { children: ReactNode }) {
  const route = useLocation();
  const navigate = useNavigate();
  const feedback = useControlFeedback();
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [authorizedFor, setAuthorizedFor] = useState<string | null>(null);
  const [locked, setLocked] = useState(true);
  const [opened, setOpened] = useState(false);
  const [setup, setSetup] = useState(false);
  const [firstPin, setFirstPin] = useState('');
  const [pin, setPin] = useState('');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [emailCode, setEmailCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [emailCooldown, setEmailCooldown] = useState(0);
  const [now, setNow] = useState(Date.now());
  const generation = useRef(0);
  const visibilityGeneration = useRef(0);
  const busyRef = useRef(false);
  const userId = session?.user.id;
  const allowed = Boolean(userId && authorizedFor === userId);
  const lockHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!supabase) { setChecking(false); setError(configurationError ?? 'Anslutningen saknas.'); return; }
    // Do not await another Supabase call inside its auth callback (client lock).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) setError(authErrorMessage(error, 'session'));
      setSession(data.session); setChecking(false);
    });
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => {
    const version = ++generation.current;
    setAuthorizedFor(null); setLocked(true); setOpened(false); setPin(''); setFirstPin('');
    if (!userId || !supabase) { setChecking(false); return; }
    setChecking(true);
    void (async () => {
      const { data, error: accessError } = await supabase!.from('inventories').select('id').eq('id', inventoryId).maybeSingle();
      if (version !== generation.current) return;
      if (accessError || !data) {
        setError('Ditt konto har inte tillgång till inventariet, eller anslutningen kunde inte verifieras.');
        setChecking(false); return;
      }
      setAuthorizedFor(userId); setError('');
      try {
        const reset = JSON.parse(localStorage.getItem('inventory-reset-pin') ?? 'null');
        if (reset?.user === userId && session && reset.previousSession !== authSessionId(session)) {
          localStorage.removeItem(pinKey(userId)); localStorage.removeItem('inventory-reset-pin');
        }
        const record = readPin(userId);
        setSetup(!record); setCooldown(record?.blockedUntil ?? 0);
      } catch (cause) { setError((cause as Error).message); }
      setChecking(false);
    })();
    return () => { generation.current++; };
  }, [userId]);
  useEffect(() => {
    if (!allowed) return;
    const destination = sessionStorage.getItem('inventory-auth-return');
    sessionStorage.removeItem('inventory-auth-return');
    const valid = (path: string) => /^\/(?:$|search(?:\?|$)|add(?:[/?]|$)|(?:location|storage|item)\/[a-f0-9-]+(?:\?|$))/.test(path);
    if (destination && valid(destination)) navigate(destination, { replace: true });
    else if (!valid(route.pathname)) navigate('/', { replace: true });
  }, [allowed]);
  useEffect(() => {
    const lock = () => {
      visibilityGeneration.current++;
      setLocked(true); setPin(''); setFirstPin('');
      if (userId) { setMessage(''); setError(''); }
      window.dispatchEvent(new Event('inventory-locked'));
    };
    const visibility = () => { if (document.visibilityState === 'hidden') lock(); };
    const storage = (event: StorageEvent) => {
      if (userId && event.key === pinKey(userId)) {
        lock();
        try { setSetup(!readPin(userId)); } catch { setError('Skärmlåset behöver återställas via mejl.'); }
      }
    };
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('pagehide', lock);
    window.addEventListener('inventory-lock', lock);
    window.addEventListener('storage', storage);
    return () => {
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('pagehide', lock); window.removeEventListener('inventory-lock', lock); window.removeEventListener('storage', storage);
    };
  }, [userId]);
  useEffect(() => {
    if (Math.max(cooldown, emailCooldown) <= Date.now()) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [cooldown, emailCooldown]);
  async function submitPin(value: string) {
    if (!userId || busyRef.current || value.length !== 4 || cooldown > Date.now()) return;
    busyRef.current = true; setBusy(true); setError('');
    const visibility = visibilityGeneration.current;
    const accessVersion = generation.current;
    try {
      if (setup && !firstPin) { setFirstPin(value); setPin(''); return; }
      if (setup && firstPin !== value) { setFirstPin(''); setPin(''); setError('Koderna var olika. Välj din kod igen.'); return; }
      if (setup) await createPin(userId, value);
      else {
        const result = await checkPin(userId, value);
        if (!result.ok) { setCooldown(result.blockedUntil); setNow(Date.now()); setPin(''); setError('Fel pinkod. Försök igen.'); return; }
      }
      if (visibility !== visibilityGeneration.current || accessVersion !== generation.current || document.visibilityState === 'hidden') { setPin(''); return; }
      setSetup(false); setLocked(false); setOpened(true); setPin(''); setFirstPin(''); setError('');
      window.dispatchEvent(new Event('inventory-unlocked'));
    } catch { setError('Skärmlåset kunde inte öppnas eller sparas. Kontrollera att Safari tillåter webbplatsdata, eller logga in igen.'); setPin(''); }
    finally { busyRef.current = false; setBusy(false); }
  }
  function digit(value: string) {
    if (busyRef.current || cooldown > Date.now() || pin.length >= 4) return;
    const next = pin + value; setPin(next);
    if (next.length === 4) void submitPin(next);
  }
  async function signOut(reset = false) {
    setBusy(true); setError('');
    try {
      const { error } = await supabase!.auth.signOut({ scope: 'local' });
      if (error) throw error;
      if (reset && userId && session) localStorage.setItem('inventory-reset-pin', JSON.stringify({ user: userId, previousSession: authSessionId(session) }));
      setSession(null); setSent(false); setEmailCode(''); setMessage(reset ? 'Logga in via mejl för att välja en ny pinkod.' : 'Du är utloggad på den här enheten.');
    } catch { setError('Det gick inte att logga ut. Försök igen.'); }
    finally { setBusy(false); }
  }
  const showLock = !opened || locked || !allowed;
  const wait = Math.max(0, Math.ceil((cooldown - now) / 1000));
  useLayoutEffect(() => { if (showLock && !checking) lockHeading.current?.focus({ preventScroll: true }); }, [showLock, checking, allowed, setup, Boolean(firstPin)]);
  return <>
    {session && allowed && opened && <div className="authenticated-app" hidden={showLock} inert={showLock}>{children}</div>}
    {showLock && <div className="app-shell auth-shell" {...feedback}>
      <main className="inventory-panel auth-panel">
        <House className="auth-house" aria-hidden="true" />
        {checking ? <p role="status">Kontrollerar inloggningen…</p> : !session ? <>
          <h1 ref={lockHeading} tabIndex={-1}>Välkommen hem</h1><p>Logga in en gång på den här enheten.</p>
          <form className="auth-email-form" onSubmit={async event => {
            event.preventDefault(); if (!supabase || busy || emailCooldown > Date.now()) return;
            setBusy(true); setError(''); setMessage('');
            try {
              sessionStorage.setItem('inventory-auth-return', route.pathname + route.search);
              const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: {
                shouldCreateUser: false, emailRedirectTo: window.location.origin + window.location.pathname,
              } });
              if (error) throw error;
              setSent(true); setEmailCode(''); setEmailCooldown(Date.now() + 60_000); setNow(Date.now());
            } catch (cause) { setError(authErrorMessage(cause, 'send')); setEmailCooldown(Date.now() + 60_000); setNow(Date.now()); }
            finally { setBusy(false); }
          }}>
            <label htmlFor="login-email">Mejladress</label>
            <input id="login-email" type="email" autoComplete="email" required value={email} onChange={event => { setEmail(event.target.value); setEmailCode(''); }} placeholder="din@mejl.se" readOnly={busy} />
            <button className="auth-primary" disabled={busy || !email.trim() || !supabase || emailCooldown > now}><Mail aria-hidden="true" />{busy ? 'Vänta…' : emailCooldown > now ? `Vänta ${Math.ceil((emailCooldown - now) / 1000)} s före nytt utskick` : sent ? 'Skicka ny kod' : 'Skicka inloggningskod'}</button>
          </form>
          {sent && <p role="status">En engångskod har skickats. Läs mejlet och ange koden här. Kontrollera även skräpposten.</p>}
          <form className="auth-email-form auth-code-form" onSubmit={async event => {
            event.preventDefault();
            if (!supabase || busy || !email.trim() || !/^\d{6}$/.test(emailCode)) return;
            setBusy(true); setError(''); setMessage('');
            try {
              sessionStorage.setItem('inventory-auth-return', route.pathname + route.search);
              const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: emailCode, type: 'email' });
              if (error) throw error;
              setEmailCode('');
            } catch (cause) { setError(authErrorMessage(cause, 'verify')); }
            finally { setBusy(false); }
          }}>
            <label htmlFor="login-code">Engångskod från mejlet</label>
            <input id="login-code" className="auth-code-input" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6}
              value={emailCode} onChange={event => setEmailCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6 siffror" readOnly={busy} required aria-describedby="login-code-help" />
            <p id="login-code-help">Har du redan en kod kan du ange den direkt. Din fyrsiffriga pinkod används efter inloggningen.</p>
            <button className="auth-primary" disabled={busy || !email.trim() || emailCode.length !== 6 || !supabase}>{busy ? 'Vänta…' : 'Logga in'}</button>
          </form>
        </> : allowed ? <>
          <LockKeyhole className="auth-lock-icon" aria-hidden="true" />
          <h1 ref={lockHeading} tabIndex={-1}>{setup ? firstPin ? 'Bekräfta din kod' : 'Välj din pinkod' : 'Lås upp ditt hem'}</h1>
          <p>{setup ? 'Fyra siffror för skärmlåset på den här enheten.' : 'Ange din fyrsiffriga pinkod.'}</p>
          <div className="pin-dots" role="status" aria-label={`${pin.length} av 4 siffror angivna`}>{[0, 1, 2, 3].map(index => <span key={index} className={index < pin.length ? 'filled' : ''} />)}</div>
          {/* Keyboard entry for the custom keypad; do not invite password-manager autofill. */}
          <input className="sr-only pin-keyboard-input" aria-label="Pinkod" type="text" inputMode="numeric" autoComplete="off" spellCheck={false} maxLength={4} value={pin}
            disabled={busy || wait > 0} onChange={event => { const next = event.target.value.replace(/\D/g, '').slice(0, 4); setPin(next); if (next.length === 4) void submitPin(next); }} />
          <div className="pin-keypad" aria-label="Knappsats för pinkod">{['1','2','3','4','5','6','7','8','9','','0','delete'].map((value, index) => value === '' ? <span key={index} />
            : <button key={index} type="button" disabled={busy || wait > 0} aria-label={value === 'delete' ? 'Ta bort sista siffran' : value}
              onClick={() => value === 'delete' ? setPin(current => current.slice(0, -1)) : digit(value)}>{value === 'delete' ? <Delete aria-hidden="true" /> : value}</button>)}</div>
          {wait > 0 && <p role="status">För många försök. Försök igen om {wait} sekunder.</p>}
          <button className="auth-text-button" disabled={busy} onClick={() => void signOut(true)}>Glömt pinkoden?</button>
        </> : <><h1>Ingen åtkomst</h1><button className="auth-primary" onClick={() => window.location.reload()}>Försök igen</button></>}
        {error && <p className="auth-error" role="alert">{error}</p>}
        {message && <p role="status">{message}</p>}
        {session && !checking && <button className="auth-text-button" disabled={busy} onClick={() => void signOut()}>Logga ut från den här enheten</button>}
      </main>
    </div>}
  </>;
}
