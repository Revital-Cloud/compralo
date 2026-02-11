"use client";

import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { profileSchema } from "@/schemas/user.schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { AvatarSelector } from "@/components/ui";
import { Button } from "@/components/ui";
import { UserPublic } from "@/types/auth";
import { AUTH_KEYS } from "@/hooks/use-auth";
import { toast } from "sonner";

interface AvatarTabProps {
  user: UserPublic;
  form: UseFormReturn<z.infer<typeof profileSchema>>;
  updateProfile: (data: { avatar_seed?: string | null; avatar_colors?: string | null }) => Promise<void>;
}

export default function AvatarTab({ user, form, updateProfile }: AvatarTabProps) {
  const queryClient = useQueryClient();

  const handleSelectSeed = (seed: string) => {
    form.setValue("avatar_seed", seed);
    queryClient.setQueryData(AUTH_KEYS.currentUser, (old: UserPublic | undefined) =>
      old ? { ...old, avatar_seed: seed } : old
    );
  };

  const handleSelectColors = (colors: string) => {
    form.setValue("avatar_colors", colors);
    queryClient.setQueryData(AUTH_KEYS.currentUser, (old: UserPublic | undefined) =>
      old ? { ...old, avatar_colors: colors } : old
    );
  };

  const handleSave = async () => {
    const avatar_seed = form.getValues("avatar_seed");
    const avatar_colors = form.getValues("avatar_colors");
    try {
      await updateProfile({ avatar_seed, avatar_colors });
      toast.success("Avatar actualizado correctamente.");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(err?.response?.data?.detail || err?.message || "No se pudo guardar el avatar.");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Avatar</CardTitle>
          <CardDescription>
            Elige la cara y el color de tu avatar. Se actualizará en el menú y en tu perfil.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <AvatarSelector
            currentSeed={form.watch("avatar_seed") || user.avatar_seed}
            currentColors={form.watch("avatar_colors") ?? user.avatar_colors ?? undefined}
            userEmail={user.email_usuario}
            userName={`${user.nom_usuario} ${user.ape_usuario}`}
            onSelect={handleSelectSeed}
            onSelectColors={handleSelectColors}
          />
          <input type="hidden" {...form.register("avatar_seed")} />
          <input type="hidden" {...form.register("avatar_colors")} />
          <Button onClick={handleSave}>
            Guardar avatar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
