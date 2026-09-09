import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
} from 'react';
import { Link, NavLink, Navigate, Outlet } from 'react-router-dom';
import {
  HiOutlineCalculator,
  HiOutlineChevronDoubleLeft,
  HiOutlineChevronDoubleRight,
  HiOutlineCog,
  HiOutlineHome,
  HiOutlineLogout,
  HiOutlineMenuAlt2,
  HiOutlineTemplate,
  HiOutlineX,
} from 'react-icons/hi';
import type { IconType } from 'react-icons';
import { BrandLockup } from '../brand/BrandLockup';
import { useAuthStore } from '../../store/authStore';

interface NavigationItem {
  label: string;
  path: string;
  icon: IconType;
  shortcut: string;
  available: boolean;
}

const navigationGroups: Array<{ label: string; items: NavigationItem[] }> = [
  {
    label: 'Workspace',
    items: [
      { label: 'Visão geral', path: '/dashboard', icon: HiOutlineHome, shortcut: '1', available: true },
      { label: 'Catálogo', path: '/catalog', icon: HiOutlineTemplate, shortcut: '2', available: false },
      { label: 'Estimativas', path: '/estimates', icon: HiOutlineCalculator, shortcut: '3', available: false },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { label: 'Perfil de custo', path: '/settings', icon: HiOutlineCog, shortcut: '4', available: false },
    ],
  },
];

interface SidebarContentProps {
  collapsed: boolean;
  onNavigate?: () => void;
  onToggleCollapse?: () => void;
  showClose?: boolean;
  onClose?: () => void;
  closeButtonRef?: RefObject<HTMLButtonElement | null>;
}

function SidebarContent({
  collapsed,
  onNavigate,
  onToggleCollapse,
  showClose = false,
  onClose,
  closeButtonRef,
}: SidebarContentProps) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const username = user?.username || 'Usuário';
  const role = user?.role
    ? String(user.role).replace(/_/g, ' ').toLocaleLowerCase('pt-BR')
    : 'usuário';

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={`flex h-20 shrink-0 items-center border-b border-line-subtle ${collapsed ? 'justify-center px-3' : 'justify-between px-5'}`}>
        <Link
          to="/dashboard"
          onClick={onNavigate}
          aria-label="Ir para a visão geral do PriceFunc"
          className="min-w-0 rounded-button"
        >
          <BrandLockup compact={collapsed} iconOnly={collapsed} />
        </Link>

        {showClose ? (
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Fechar menu"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-button border border-line-subtle text-text-secondary transition-[color,background-color,border-color] duration-fast ease-out hover:border-line hover:bg-white/[0.04] hover:text-text-primary"
          >
            <HiOutlineX aria-hidden="true" size={21} />
          </button>
        ) : null}
      </div>

      <nav
        aria-label="Navegação principal"
        className="min-h-0 flex-1 space-y-9 overflow-y-auto overscroll-contain px-3 py-6 [scrollbar-gutter:stable]"
      >
        {navigationGroups.map((group) => (
          <div key={group.label}>
            {!collapsed ? (
              <p className="mb-3 px-3 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-text-tertiary">
                {group.label}
              </p>
            ) : null}

            <ul className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;

                return (
                  <li key={item.path}>
                    {item.available ? (
                      <NavLink
                        to={item.path}
                        onClick={onNavigate}
                        title={collapsed ? item.label : undefined}
                        className={({ isActive }) => `relative flex min-h-11 items-center rounded-button border px-3 text-sm transition-[background-color,border-color,color] duration-fast ease-out ${collapsed ? 'justify-center' : 'gap-3'} ${isActive ? 'border-accent/25 bg-accent-soft text-accent' : 'border-transparent text-text-secondary hover:border-line-subtle hover:bg-white/[0.025] hover:text-text-primary'}`}
                      >
                        {({ isActive }) => (
                          <>
                            {isActive ? (
                              <span aria-hidden="true" className="absolute -left-[13px] top-2 h-7 w-px bg-accent" />
                            ) : null}
                            <Icon aria-hidden="true" className="shrink-0" size={19} />
                            {!collapsed ? (
                              <>
                                <span className="min-w-0 flex-1 truncate font-medium">{item.label}</span>
                                <kbd className="flex h-5 min-w-5 items-center justify-center rounded border border-line-subtle px-1 font-mono text-[10px] font-normal text-text-tertiary">
                                  {item.shortcut}
                                </kbd>
                              </>
                            ) : null}
                          </>
                        )}
                      </NavLink>
                    ) : (
                      <button
                        type="button"
                        disabled
                        aria-label={`${item.label}, disponível em breve`}
                        title={collapsed ? `${item.label} — em breve` : undefined}
                        className={`flex min-h-11 w-full cursor-not-allowed items-center rounded-button border border-transparent px-3 text-sm text-text-tertiary opacity-65 ${collapsed ? 'justify-center' : 'gap-3'}`}
                      >
                        <Icon aria-hidden="true" className="shrink-0" size={19} />
                        {!collapsed ? (
                          <>
                            <span className="min-w-0 flex-1 truncate text-left font-medium">{item.label}</span>
                            <span className="font-mono text-[9px] uppercase tracking-[0.08em]">Breve</span>
                          </>
                        ) : null}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-line-subtle p-3">
        <div className={`flex items-center ${collapsed ? 'flex-col gap-2' : 'gap-3 px-2 py-2'}`}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-white/[0.035] font-mono text-sm font-medium text-accent">
            {username.charAt(0).toUpperCase()}
          </div>

          {!collapsed ? (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-text-primary" title={username}>{username}</p>
              <p className="mt-0.5 truncate text-xs capitalize text-text-tertiary">{role}</p>
            </div>
          ) : null}

          <button
            type="button"
            onClick={logout}
            aria-label="Sair do PriceFunc"
            title="Sair"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-button border border-transparent text-text-tertiary transition-[color,background-color,border-color] duration-fast ease-out hover:border-error/25 hover:bg-error/[0.055] hover:text-error"
          >
            <HiOutlineLogout aria-hidden="true" size={19} />
          </button>
        </div>
      </div>

      {onToggleCollapse ? (
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
          className={`absolute -right-4 top-8 hidden h-8 w-8 items-center justify-center rounded-full border border-line bg-overlay text-text-secondary transition-[color,border-color,background-color] duration-fast ease-out hover:border-line-strong hover:text-text-primary md:flex`}
        >
          {collapsed ? (
            <HiOutlineChevronDoubleRight aria-hidden="true" size={15} />
          ) : (
            <HiOutlineChevronDoubleLeft aria-hidden="true" size={15} />
          )}
        </button>
      ) : null}
    </div>
  );
}

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
}

function MobileDrawer({ open, onClose, triggerRef }: MobileDrawerProps) {
  const drawerRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEscape);
      triggerRef.current?.focus();
    };
  }, [onClose, open, triggerRef]);

  const trapFocus = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Tab') {
      return;
    }

    const focusableElements = Array.from(
      drawerRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    );

    const first = focusableElements.at(0);
    const last = focusableElements.at(-1);

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label="Fechar menu"
        aria-hidden={!open}
        tabIndex={open ? 0 : -1}
        disabled={!open}
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-black/60 backdrop-blur-[2px] transition-opacity duration-base ease-out md:hidden ${open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
      />
      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal={open || undefined}
        aria-hidden={!open}
        aria-label="Menu do PriceFunc"
        inert={!open}
        onKeyDown={trapFocus}
        className={`fixed inset-y-0 left-0 z-40 h-dvh w-[min(88vw,320px)] border-r border-line bg-drawer shadow-overlay transition-transform duration-medium ease-out md:hidden ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <SidebarContent
          collapsed={false}
          onNavigate={onClose}
          showClose
          onClose={onClose}
          closeButtonRef={closeButtonRef}
        />
      </aside>
    </>
  );
}

function SessionLoading() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-canvas px-6 text-text-primary">
      <div className="flex flex-col items-center gap-5" role="status" aria-live="polite">
        <img src="/pricefunc-mark.svg" alt="" aria-hidden="true" className="h-10 w-10 outline-none" />
        <div className="h-5 w-5 animate-spin rounded-full border border-accent/25 border-r-accent" aria-hidden="true" />
        <span className="text-sm text-text-secondary">Restaurando sessão…</span>
      </div>
    </main>
  );
}

export function AppShell() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileTriggerRef = useRef<HTMLButtonElement>(null);

  if (isLoading) {
    return <SessionLoading />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-dvh bg-canvas text-text-primary">
      <a href="#main-content" className="skip-link">Pular para o conteúdo</a>

      <aside
        className={`fixed inset-y-0 left-0 z-20 hidden h-dvh border-r border-line-subtle bg-sidebar backdrop-blur-[3px] md:block ${collapsed ? 'w-[76px]' : 'w-[248px]'}`}
      >
        <SidebarContent
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((current) => !current)}
        />
      </aside>

      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line-subtle bg-sticky px-4 backdrop-blur-md md:hidden">
        <BrandLockup compact />
        <button
          ref={mobileTriggerRef}
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menu"
          aria-expanded={mobileOpen}
          className="flex h-11 w-11 items-center justify-center rounded-button border border-line-subtle text-text-secondary transition-[color,background-color,border-color] duration-fast ease-out hover:border-line hover:bg-white/[0.04] hover:text-text-primary"
        >
          <HiOutlineMenuAlt2 aria-hidden="true" size={22} />
        </button>
      </header>

      <MobileDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        triggerRef={mobileTriggerRef}
      />

      <main
        id="main-content"
        tabIndex={-1}
        className={`min-h-dvh px-4 py-8 sm:px-6 md:px-8 md:py-10 xl:px-12 ${collapsed ? 'md:ml-[76px]' : 'md:ml-[248px]'}`}
      >
        <div className="mx-auto w-full max-w-[1480px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
