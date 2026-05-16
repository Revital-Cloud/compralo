"use client";

import { useMemo, useState } from "react";

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

export function useBuilderEditor() {
  const [sections, setSections] = useState<BuilderSection[]>(createInitialSections);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    sections.find((section) => section.type === "carousel")?.id ?? sections[0]?.id ?? null,
  );
  const [viewport, setViewport] = useState<BuilderViewport>("desktop");
  const [zoom, setZoom] = useState<number>(80);
  const [previewMode, setPreviewMode] = useState<BuilderPreviewMode>("compose");
  const [insertSearch, setInsertSearch] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);

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
  }

  function deleteSection(sectionId: string) {
    setSections((prev) => prev.filter((section) => section.id !== sectionId));
    setSelectedSectionId((prevSelected) => {
      if (prevSelected !== sectionId) return prevSelected;
      const next = sections.find((item) => item.id !== sectionId);
      return next?.id ?? null;
    });
  }

  function toggleSectionVisibility(sectionId: string) {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? { ...section, visible: !section.visible }
          : section,
      ),
    );
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
  }

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
  };
}
