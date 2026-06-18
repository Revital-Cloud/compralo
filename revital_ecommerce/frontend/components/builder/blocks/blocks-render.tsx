"use client";

import Link from "next/link";
import { Streamdown } from "streamdown";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui";
import type { BuilderSection } from "../builder-types";

type Props = Record<string, string | number | boolean>;

// --- helpers --------------------------------------------------------------
function str(v: unknown, fallback = ""): string {
  if (v === undefined || v === null) return fallback;
  return String(v);
}
function num(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function bool(v: unknown): boolean {
  return v === true || v === "true";
}
const ALIGN_CLASS: Record<string, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};
const JUSTIFY_CLASS: Record<string, string> = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
};
const MD_COLS: Record<number, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
  5: "md:grid-cols-5",
  6: "md:grid-cols-6",
};

function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`container mx-auto px-4 ${className}`}>{children}</div>;
}

// eslint-disable-next-line @next/next/no-img-element
const Img = (p: React.ImgHTMLAttributes<HTMLImageElement>) => <img loading="lazy" {...p} />;

// --- blocks ---------------------------------------------------------------
function HeadingBlock({ props }: { props: Props }) {
  const level = str(props.level, "h2");
  const align = ALIGN_CLASS[str(props.align, "left")] ?? "text-left";
  const sizes: Record<string, string> = {
    h1: "text-4xl md:text-5xl lg:text-6xl",
    h2: "text-3xl md:text-4xl",
    h3: "text-2xl md:text-3xl",
  };
  const cls = `font-bold tracking-tight text-gray-900 dark:text-white ${sizes[level] ?? sizes.h2} ${align}`;
  const text = str(props.text, "Título");
  if (level === "h1") return <Container><h1 className={cls}>{text}</h1></Container>;
  if (level === "h3") return <Container><h3 className={cls}>{text}</h3></Container>;
  return <Container><h2 className={cls}>{text}</h2></Container>;
}

function TextBlock({ props }: { props: Props }) {
  const align = ALIGN_CLASS[str(props.align, "left")] ?? "text-left";
  return (
    <Container>
      <p className={`mx-auto max-w-3xl text-base leading-relaxed text-gray-700 dark:text-gray-300 md:text-lg ${align}`}>
        {str(props.text)}
      </p>
    </Container>
  );
}

function RichTextBlock({ props }: { props: Props }) {
  return (
    <Container>
      <div className="prose prose-slate mx-auto max-w-3xl dark:prose-invert prose-a:text-brand prose-headings:text-gray-900 dark:prose-headings:text-white">
        <Streamdown>{str(props.content)}</Streamdown>
      </div>
    </Container>
  );
}

function ImageBlock({ props }: { props: Props }) {
  const src = str(props.src);
  if (!src) {
    return (
      <Container>
        <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-gray-300 text-sm text-gray-400 dark:border-gray-700">
          Selecciona una imagen
        </div>
      </Container>
    );
  }
  const maxW = num(props.max_width, 0);
  const rounded = bool(props.rounded);
  const caption = str(props.caption);
  return (
    <Container className="text-center">
      <figure className="mx-auto" style={maxW > 0 ? { maxWidth: maxW } : undefined}>
        <Img
          src={src}
          alt={str(props.alt)}
          className={`h-auto w-full object-cover ${rounded ? "rounded-xl" : ""}`}
        />
        {caption ? <figcaption className="mt-2 text-sm text-gray-500 dark:text-gray-400">{caption}</figcaption> : null}
      </figure>
    </Container>
  );
}

function ImageTextBlock({ props }: { props: Props }) {
  const imageRight = str(props.image_position, "left") === "right";
  const src = str(props.image);
  const ctaText = str(props.cta_text);
  const ctaLink = str(props.cta_link, "/");
  return (
    <Container>
      <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
        <div className={imageRight ? "md:order-2" : ""}>
          {src ? (
            <Img src={src} alt={str(props.title)} className="h-auto w-full rounded-xl object-cover" />
          ) : (
            <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-gray-300 text-sm text-gray-400 dark:border-gray-700">
              Imagen
            </div>
          )}
        </div>
        <div className={imageRight ? "md:order-1" : ""}>
          {props.title ? (
            <h3 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">{str(props.title)}</h3>
          ) : null}
          {props.text ? (
            <p className="mb-5 whitespace-pre-line text-base leading-relaxed text-gray-700 dark:text-gray-300">
              {str(props.text)}
            </p>
          ) : null}
          {ctaText ? (
            <Link
              href={ctaLink}
              className="inline-flex items-center rounded-lg bg-brand px-5 py-2.5 font-semibold text-white transition-colors hover:opacity-90"
            >
              {ctaText}
            </Link>
          ) : null}
        </div>
      </div>
    </Container>
  );
}

function ButtonBlock({ props }: { props: Props }) {
  const variant = str(props.variant, "primary");
  const justify = JUSTIFY_CLASS[str(props.align, "left")] ?? "justify-start";
  const variantCls =
    variant === "secondary"
      ? "bg-brand-secondary text-slate-900 hover:opacity-90"
      : variant === "outline"
        ? "border-2 border-brand text-brand hover:bg-brand hover:text-white"
        : "bg-brand text-white hover:opacity-90";
  return (
    <Container>
      <div className={`flex ${justify}`}>
        <Link
          href={str(props.link, "/")}
          className={`inline-flex items-center rounded-lg px-6 py-3 font-semibold transition-colors ${variantCls}`}
        >
          {str(props.text, "Botón")}
        </Link>
      </div>
    </Container>
  );
}

function CtaBlock({ props }: { props: Props }) {
  const buttonText = str(props.button_text);
  return (
    <Container>
      <div className="rounded-2xl bg-gradient-to-r from-brand-accent to-brand-secondary px-6 py-12 text-center text-white md:px-12">
        <h2 className="text-2xl font-bold md:text-4xl">{str(props.title, "¿Listo para empezar?")}</h2>
        {props.subtitle ? <p className="mx-auto mt-3 max-w-2xl text-base opacity-95 md:text-lg">{str(props.subtitle)}</p> : null}
        {buttonText ? (
          <Link
            href={str(props.button_link, "/products")}
            className="mt-6 inline-flex items-center rounded-lg bg-white px-6 py-3 font-semibold text-gray-900 transition-transform hover:scale-105"
          >
            {buttonText}
          </Link>
        ) : null}
      </div>
    </Container>
  );
}

function FeaturesBlock({ props }: { props: Props }) {
  const cols = Math.min(4, Math.max(1, num(props.columns, 3)));
  const items = [1, 2, 3, 4]
    .map((i) => ({
      icon: str(props[`item_${i}_icon`]),
      title: str(props[`item_${i}_title`]),
      text: str(props[`item_${i}_text`]),
    }))
    .filter((it) => it.title || it.text || it.icon);
  return (
    <Container>
      {props.title ? (
        <h2 className="mb-10 text-center text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">{str(props.title)}</h2>
      ) : null}
      <div className={`grid grid-cols-1 gap-6 sm:grid-cols-2 ${MD_COLS[cols] ?? "md:grid-cols-3"}`}>
        {items.map((it, i) => (
          <div key={i} className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm dark:border-white/10 dark:bg-white/5">
            {it.icon ? <div className="mb-3 text-4xl">{it.icon}</div> : null}
            {it.title ? <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">{it.title}</h3> : null}
            {it.text ? <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">{it.text}</p> : null}
          </div>
        ))}
      </div>
    </Container>
  );
}

function GalleryBlock({ props }: { props: Props }) {
  const cols = Math.min(6, Math.max(1, num(props.columns, 3)));
  const images = [1, 2, 3, 4, 5, 6].map((i) => str(props[`image_${i}`])).filter(Boolean);
  return (
    <Container>
      {props.title ? (
        <h2 className="mb-8 text-center text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">{str(props.title)}</h2>
      ) : null}
      <div className={`grid grid-cols-2 gap-4 ${MD_COLS[cols] ?? "md:grid-cols-3"}`}>
        {images.map((src, i) => (
          <Img key={i} src={src} alt="" className="aspect-square w-full rounded-xl object-cover" />
        ))}
      </div>
    </Container>
  );
}

function FaqBlock({ props }: { props: Props }) {
  const items = [1, 2, 3, 4, 5]
    .map((i) => ({ q: str(props[`q_${i}`]), a: str(props[`a_${i}`]) }))
    .filter((it) => it.q);
  return (
    <Container className="max-w-3xl">
      {props.title ? (
        <h2 className="mb-8 text-center text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">{str(props.title)}</h2>
      ) : null}
      <Accordion type="single" collapsible className="w-full">
        {items.map((it, i) => (
          <AccordionItem key={i} value={`item-${i}`}>
            <AccordionTrigger className="text-left text-base font-medium">{it.q}</AccordionTrigger>
            <AccordionContent className="whitespace-pre-line text-gray-600 dark:text-gray-300">{it.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Container>
  );
}

function SpacerBlock({ props }: { props: Props }) {
  return <div style={{ height: Math.max(0, num(props.height, 48)) }} aria-hidden="true" />;
}

function DividerBlock() {
  return (
    <Container>
      <hr className="border-t border-gray-200 dark:border-white/10" />
    </Container>
  );
}

/** Renderiza un bloque genérico de la biblioteca a partir de su sección. */
export function renderGenericBlock(section: BuilderSection): React.ReactNode {
  const props = (section.props ?? {}) as Props;
  switch (section.type) {
    case "heading": return <HeadingBlock props={props} />;
    case "text": return <TextBlock props={props} />;
    case "richtext": return <RichTextBlock props={props} />;
    case "image": return <ImageBlock props={props} />;
    case "image_text": return <ImageTextBlock props={props} />;
    case "button": return <ButtonBlock props={props} />;
    case "cta": return <CtaBlock props={props} />;
    case "features": return <FeaturesBlock props={props} />;
    case "gallery": return <GalleryBlock props={props} />;
    case "faq": return <FaqBlock props={props} />;
    case "spacer": return <SpacerBlock props={props} />;
    case "divider": return <DividerBlock />;
    default: return null;
  }
}
