"use client";

import { useParams } from "next/navigation";

import { BuilderWorkspace } from "@/components/builder/builder-workspace";

export default function BuilderEditPage() {
  const params = useParams();
  const slug = (Array.isArray(params.slug) ? params.slug[0] : params.slug) ?? "home";
  return <BuilderWorkspace slug={slug} />;
}
