import Image from "next/image";
import Link from "next/link";

/**
 * Banner de imagem única (arte pronta, sem texto sobreposto). Usa
 * width/height intrínsecos em vez de `fill` para nunca cortar a arte —
 * a imagem sempre escala mantendo a proporção original.
 */
export function ImageBanner({
  src,
  alt,
  href,
  width,
  height,
  priority = false,
  className = "",
}: {
  src: string;
  alt: string;
  href?: string;
  width: number;
  height: number;
  priority?: boolean;
  className?: string;
}) {
  const image = (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      sizes="(min-width: 1152px) 1152px, 100vw"
      className="h-auto w-full"
    />
  );

  const wrapperClassName = `overflow-hidden rounded-2xl ${className}`;

  if (href) {
    return (
      <Link href={href} className={`block ${wrapperClassName} transition hover:opacity-95`}>
        {image}
      </Link>
    );
  }

  return <div className={wrapperClassName}>{image}</div>;
}
