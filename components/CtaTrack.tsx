"use client";

type Props = {
  href: string;
  children: React.ReactNode;
  src?: string; // where the click happened (hero/footer/etc)
  className?: string;
};

export default function CtaTrack({ href, children, src, className }: Props) {
  const onClick = () => {
    if (typeof window !== "undefined" && typeof window.plausible === "function") {
      window.plausible("consulting_cta_click", src ? { props: { src } } : undefined);
    }
  };

  return (
    <a href={href} onClick={onClick} className={className}>
      {children}
    </a>
  );
}
