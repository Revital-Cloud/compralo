"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  BUILDER_DEFAULT_PROPS,
  BUILDER_SECTION_META,
  createDefaultStyle,
} from "./builder-config";
import { createBuilderId, reorderSections } from "./builder-utils";
import type {
  BuilderPreviewMode,
  BuilderSection,
  BuilderSectionStyle,
  BuilderSectionType,
  BuilderViewport,
} from "./builder-types";
import { builderService, type BuilderSeo } from "@/services/builder.service";
import { toUserSafeApiDetail } from "@/utils/api-error-message";

const EMPTY_SEO: BuilderSeo = { title: null, description: null, og_image: null };

function errMessage(err: unknown, fallback: string): string {
  const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
  return toUserSafeApiDetail(detail, fallback);
}

function createInitialSections(): BuilderSection[] {
  const base: BuilderSectionType[] = [
    "banner",
    "header",
    "hero",
    "categories",
    "product_grid",
    "carousel",
    "footer",
  ];

  return base.map((type) => ({
    id: createBuilderId(type),
    type,
    props: { ...BUILDER_DEFAULT_PROPS[type] },
    visible: true,
    style: createDefaultStyle(),
  }));
}

/** Normaliza secciones que llegan de la API, rellenando defaults faltantes. */
function normalizeSections(sections: BuilderSection[]): BuilderSection[] {
  return sections.map((section) => ({
    id: section.id ?? createBuilderId(section.type),
    type: section.type,
    visible: section.visible ?? true,
    props: { ...(section.props ?? {}) },
    style: { ...createDefaultStyle(), ...(section.style ?? {}) },
  }));
}

export function useBuilderEditor(slug: string = "home") {
  const [sections, setSections] = useState<BuilderSection[]>(createInitialSections);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [viewport, setViewport] = useState<BuilderViewport>("desktop");
  const [zoom, setZoom] = useState<number>(80);
  const [previewMode, setPreviewMode] = useState<BuilderPreviewMode>("compose");
  const [insertSearch, setInsertSearch] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // Estado de persistencia / página
  const [title, setTitle] = useState<string>("Página Principal");
  const [seo, setSeo] = useState<BuilderSeo>(EMPTY_SEO);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [hasPublished, setHasPublished] = useState<boolean>(false);

  // Carga inicial de la página desde la API.
  useEffect(() => {
    let active = true;
    setIsLoading(true);
    builderService
      .getPage(slug)
      .then((page) => {
        if (!active) return;
        if (page) {
          const loaded = page.sections?.length
            ? normalizeSections(page.sections)
            : createInitialSections();
          setSections(loaded);
          setSelectedSectionId(loaded[0]?.id ?? null);
          setTitle(page.title ?? "Página Principal");
          setSeo(page.seo ?? EMPTY_SEO);
          setHasPublished(Boolean(page.has_published));
        } else {
          const initial = createInitialSections();
          setSelectedSectionId(initial[0]?.id ?? null);
        }
        setIsDirty(false);
      })
      .catch(() => {
        if (!active) return;
        const initial = createInitialSections();
        setSections(initial);
        setSelectedSectionId(initial[0]?.id ?? null);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  const selectedSection = useMemo(
    () => sections.find((item) => item.id === selectedSectionId) ?? null,
    [sections, selectedSectionId],
  );

  const insertableTypes = useMemo(() => {
    const query = insertSearch.trim().toLowerCase();
    return (Object.keys(BUILDER_SECTION_META) as BuilderSectionType[]).filter(
      (sectionType) => {
        if (!query) return true;
        const meta = BUILDER_SECTION_META[sectionType];
        return (
          meta.label.toLowerCase().includes(query) ||
          meta.description.toLowerCase().includes(query) ||
          meta.category.toLowerCase().includes(query)
        );
      },
    );
  }, [insertSearch]);

  const insertCategories = useMemo(() => {
    const categories = new Set<string>();
    insertableTypes.forEach((sectionType) => {
      categories.add(BUILDER_SECTION_META[sectionType].category);
    });
    return Array.from(categories);
  }, [insertableTypes]);

  const visibleCount = useMemo(
    () => sections.filter((section) => section.visible).length,
    [sections],
  );

  function addSection(sectionType: BuilderSectionType) {
    const newSection: BuilderSection = {
      id: createBuilderId(sectionType),
      type: sectionType,
      props: { ...BUILDER_DEFAULT_PROPS[sectionType] },
      visible: true,
      style: createDefaultStyle(),
    };

    setSections((prev) => [...prev, newSection]);
    setSelectedSectionId(newSection.id);
    setIsDirty(true);
  }

  function deleteSection(sectionId: string) {
    setSections((prev) => prev.filter((section) => section.id !== sectionId));
    setSelectedSectionId((prevSelected) => {
      if (prevSelected !== sectionId) return prevSelected;
      const next = sections.find((item) => item.id !== sectionId);
      return next?.id ?? null;
    });
    setIsDirty(true);
  }

  function toggleSectionVisibility(sectionId: string) {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? { ...section, visible: !section.visible }
          : section,
      ),
    );
    setIsDirty(true);
  }

  function updateSelectedProp(key: string, value: string | number) {
    if (!selectedSectionId) return;
    setSections((prev) =>
      prev.map((section) =>
        section.id === selectedSectionId
          ? { ...section, props: { ...section.props, [key]: value } }
          : section,
      ),
    );
    setIsDirty(true);
  }

  function updateSelectedStyle(
    key: keyof BuilderSectionStyle,
    value: string | number,
  ) {
    if (!selectedSectionId) return;
    setSections((prev) =>
      prev.map((section) =>
        section.id === selectedSectionId
          ? { ...section, style: { ...section.style, [key]: value } }
          : section,
      ),
    );
    setIsDirty(true);
  }

  function startDrag(sectionId: string) {
    setDraggingId(sectionId);
  }

  function endDrag() {
    setDraggingId(null);
  }

  function dropOnSection(targetSectionId: string) {
    if (!draggingId || draggingId === targetSectionId) return;
    setSections((prev) => reorderSections(prev, draggingId, targetSectionId));
    setDraggingId(null);
    setIsDirty(true);
  }

  const buildPayload = useCallback(
    () => ({ title, seo, sections }),
    [title, seo, sections],
  );

  const save = useCallback(async (): Promise<boolean> => {
    setIsSaving(true);
    try {
      await builderService.savePage(slug, buildPayload());
      setIsDirty(false);
      toast.success("Borrador guardado correctamente");
      return true;
    } catch (err: unknown) {
      toast.error(errMessage(err, "No se pudo guardar el borrador"));
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [slug, buildPayload]);

  const publish = useCallback(async (): Promise<boolean> => {
    setIsPublishing(true);
    try {
      // Guardamos el borrador primero para publicar exactamente lo que se ve.
      await builderService.savePage(slug, buildPayload());
      await builderService.publishPage(slug);
      setIsDirty(false);
      setHasPublished(true);
      toast.success("Página publicada. Los cambios ya están en vivo.");
      return true;
    } catch (err: unknown) {
      toast.error(errMessage(err, "No se pudo publicar la página"));
      return false;
    } finally {
      setIsPublishing(false);
    }
  }, [slug, buildPayload]);

  return {
    sections,
    selectedSectionId,
    selectedSection,
    viewport,
    zoom,
    previewMode,
    insertSearch,
    insertableTypes,
    insertCategories,
    visibleCount,
    draggingId,
    // estado de persistencia
    title,
    seo,
    isLoading,
    isSaving,
    isPublishing,
    isDirty,
    hasPublished,
    setTitle,
    setSeo,
    setSelectedSectionId,
    setViewport,
    setZoom,
    setPreviewMode,
    setInsertSearch,
    addSection,
    deleteSection,
    toggleSectionVisibility,
    updateSelectedProp,
    updateSelectedStyle,
    startDrag,
    endDrag,
    dropOnSection,
    save,
    publish,
  };
}
