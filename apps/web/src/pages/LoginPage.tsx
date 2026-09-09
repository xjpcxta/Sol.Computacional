import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineExclamationCircle,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineLockClosed,
  HiOutlineUser,
} from 'react-icons/hi';
import { SplitFlapDisplay } from '../components/auth/SplitFlapDisplay';
import { BrandLockup } from '../components/brand/BrandLockup';
import { Button, TextField } from '../components/ui';
import { getLoginErrorMessage } from '../lib/authError';
import { useAuthStore } from '../store/authStore';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  useEffect(() => {
    if (error) {
      errorRef.current?.focus();
    }
  }, [error]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login({ username: username.trim(), password });
      navigate('/dashboard');
    } catch (caughtError: unknown) {
      setError(getLoginErrorMessage(caughtError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="login-canvas min-h-dvh overflow-hidden text-text-primary">
      <div className="mx-auto grid min-h-dvh w-full max-w-[1600px] lg:grid-cols-[minmax(420px,0.78fr)_minmax(560px,1.22fr)]">
        <section className="relative z-10 flex min-h-dvh items-center border-line-subtle px-6 py-8 sm:px-10 lg:border-r lg:px-16 xl:px-24">
          <div className="mx-auto w-full max-w-[400px]">
            <BrandLockup descriptor="Estimativas por Pontos de Função" />

            <div className="mb-8 mt-10 sm:mt-12">
              <p className="eyebrow mb-4">Acesso ao workspace</p>
              <h1 className="max-w-[14ch] font-display text-[clamp(2.4rem,4.2vw,3.5rem)] font-light leading-[1.02] tracking-[-0.045em]">
                Entre para precificar com clareza.
              </h1>
              <p className="mt-4 max-w-[46ch] text-base leading-7 text-text-secondary">
                Retome seus arquétipos, parâmetros de custo e estimativas em um único lugar.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <TextField
                id="username"
                name="username"
                label="Usuário"
                type="text"
                autoComplete="username"
                placeholder="Digite seu usuário"
                startIcon={<HiOutlineUser size={18} />}
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />

              <TextField
                id="password"
                name="password"
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Digite sua senha"
                startIcon={<HiOutlineLockClosed size={18} />}
                trailing={(
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    aria-pressed={showPassword}
                    className="flex h-10 w-10 items-center justify-center rounded-button text-text-tertiary transition-[color,background-color] duration-fast ease-out hover:bg-white/[0.05] hover:text-text-primary"
                  >
                    {showPassword ? <HiOutlineEyeOff size={19} /> : <HiOutlineEye size={19} />}
                  </button>
                )}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />

              {error ? (
                <div
                  ref={errorRef}
                  tabIndex={-1}
                  role="alert"
                  className="flex items-start gap-3 rounded-input border border-error/35 bg-error/[0.055] px-4 py-3 text-sm leading-6 text-error outline-none"
                >
                  <HiOutlineExclamationCircle aria-hidden="true" className="mt-0.5 shrink-0" size={18} />
                  <span>{error}</span>
                </div>
              ) : null}

              <Button
                type="submit"
                variant="primary"
                fullWidth
                isLoading={submitting}
                className="mt-2"
              >
                {submitting ? 'Entrando…' : 'Entrar no PriceFunc'}
              </Button>
            </form>

            <p className="mt-6 border-t border-line-subtle pt-4 text-xs leading-5 text-text-tertiary">
              Seu perfil de custo é carregado somente após a autenticação.
            </p>
          </div>
        </section>

        <section
          aria-label="Mensagens do PriceFunc"
          className="relative hidden min-h-dvh items-center justify-center overflow-hidden lg:flex"
        >
          <div className="absolute inset-x-16 top-16 flex items-center justify-between border-b border-line-subtle pb-4 font-mono text-[11px] tracking-[0.08em] text-text-tertiary xl:inset-x-24">
            <span>ESCOPO / ESFORÇO / VALOR</span>
            <span>PF.01</span>
          </div>

          <div className="relative mt-8 w-full max-w-[940px] px-10 xl:px-16">
            <SplitFlapDisplay />
          </div>
        </section>
      </div>
    </main>
  );
}
