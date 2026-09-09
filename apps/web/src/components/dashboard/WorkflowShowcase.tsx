import { useEffect, useRef, useState } from 'react';

interface WorkflowStep {
  number: string;
  title: string;
  description: string;
  source: string;
}

const workflowSteps: WorkflowStep[] = [
  {
    number: '01',
    title: 'Mapeie o escopo',
    description: 'Reúna os arquétipos que representam o que será construído, sem recomeçar a estimativa do zero.',
    source: '/media/workflow-01.mp4',
  },
  {
    number: '02',
    title: 'Calibre o esforço',
    description: 'Combine Pontos de Função, produtividade, valor por hora e margem de risco em uma mesma lógica.',
    source: '/media/workflow-02.mp4',
  },
  {
    number: '03',
    title: 'Apresente o valor',
    description: 'Converta a leitura técnica em uma proposta comercial mais clara, rastreável e fácil de defender.',
    source: '/media/workflow-03.mp4',
  },
];

function usePrefersReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener('change', updatePreference);
    return () => mediaQuery.removeEventListener('change', updatePreference);
  }, []);

  return reducedMotion;
}

function AmbientVideo({ source }: { source: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return undefined;
    }

    if (shouldReduceMotion) {
      video.pause();
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          void video.play().catch(() => undefined);
        } else {
          video.pause();
        }
      },
      { threshold: 0.2 },
    );

    observer.observe(video);
    return () => {
      observer.disconnect();
      video.pause();
    };
  }, [shouldReduceMotion]);

  return (
    <video
      ref={videoRef}
      src={source}
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden="true"
      tabIndex={-1}
      disablePictureInPicture
    />
  );
}

export function WorkflowShowcase() {
  return (
    <section aria-labelledby="workflow-heading" className="pt-4">
      <div className="mb-8 grid gap-5 border-t border-line-subtle pt-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(320px,0.55fr)] lg:items-end">
        <div>
          <p className="eyebrow mb-3">O sistema em movimento</p>
          <h2 id="workflow-heading" className="max-w-[14ch] font-display text-[clamp(2.25rem,5vw,4.5rem)] font-light leading-[1.02] tracking-[-0.045em]">
            Três decisões. Uma proposta mais clara.
          </h2>
        </div>
        <p className="max-w-[54ch] text-base leading-7 text-text-secondary lg:justify-self-end">
          O PriceFunc organiza a passagem do escopo técnico para o valor comercial sem esconder os parâmetros usados no caminho.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3 lg:gap-5">
        {workflowSteps.map((step) => (
          <article key={step.number} className="min-w-0">
            <div className="video-lens technical-crosshair aspect-[4/5] rounded-media border border-line-subtle">
              <AmbientVideo source={step.source} />
              <span className="absolute left-4 top-4 z-10 flex h-8 min-w-8 items-center justify-center rounded-button border border-white/15 bg-black/40 px-2 font-mono text-[11px] text-white/75 backdrop-blur-sm">
                {step.number}
              </span>
            </div>
            <div className="grid grid-cols-[36px_minmax(0,1fr)] gap-3 border-t border-line-subtle pt-5">
              <span aria-hidden="true" className="pt-1 font-mono text-xs text-accent">{step.number}</span>
              <div>
                <h3 className="text-xl font-medium tracking-[-0.025em] text-text-primary">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-text-secondary">{step.description}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
