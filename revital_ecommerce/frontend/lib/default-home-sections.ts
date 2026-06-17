import type { BuilderSection } from "@/components/builder/builder-types";

const defaultStyle = {
  bgColor: "transparent",
  paddingTop: 0,
  paddingBottom: 0,
  marginTop: 0,
  marginBottom: 0,
  align: "left" as const,
};

/**
 * Layout de home por defecto (solo secciones de cuerpo) usado cuando aún no hay
 * una home publicada. Espejo de services/builder_service.default_home_sections en
 * backend. Garantiza que la home siempre se renderice desde el pipeline del CMS.
 */
export const DEFAULT_HOME_SECTIONS: BuilderSection[] = [
  {
    id: "hero-default",
    type: "hero",
    visible: true,
    props: {
      title: "",
      subtitle: "",
      cta_text: "Ver productos",
      cta_link: "/products",
    },
    style: defaultStyle,
  },
  {
    id: "categories-default",
    type: "categories",
    visible: true,
    props: { title: "", columns: 3 },
    style: defaultStyle,
  },
  {
    id: "product_grid-default",
    type: "product_grid",
    visible: true,
    props: { title: "", columns: 4 },
    style: defaultStyle,
  },
  {
    id: "carousel-default",
    type: "carousel",
    visible: true,
    props: { title: "" },
    style: defaultStyle,
  },
];
