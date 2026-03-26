"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import type { UserPublic } from "@/types/auth";
import { profileSchema } from "@/schemas/user.schema";
import { 
  Gift, 
  ImageIcon,
  MapPin, 
  Package, 
  Settings, 
  User 
} from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { getApiErrorMessage } from "@/utils/apiWrapper";
import {
  ProfileHeader,
  ProfileTab,
  AvatarTab,
  OrdersTab,
  AddressesTab,
  ExchangeTab,
  SettingsTab
} from "@/components/layout/shop/profile";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  AvatarSelector,
  Button,
} from "@/components/ui";

/**
 * Mapa de la página `profile`.
 *
 * Funciones clave:
 * - Validar sesión e hidratar datos de usuario.
 * - Renderizar pestañas (perfil, órdenes, direcciones, canje, settings).
 * - Sincronizar estado de pestaña con `?tab=`.
 * - Editar datos de perfil y avatar con actualización optimista de cache.
 */

const CURRENT_USER_QUERY_KEY = ["auth", "currentUser"] as const;

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { user, updateProfile, isLoadingUser, isHydrated, isRestoringSession } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isEditing, setIsEditing] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);

  // Sincroniza navegación por pestañas con query param compartible.
  const tabParam = searchParams.get('tab') || 'profile';
  const activeTab = tabParam === 'payment' ? 'canje' : tabParam;

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nom_usuario: "",
      ape_usuario: "",
      email_usuario: "",
      cel_usuario: "",
      des_direccion: "",
      fec_nacimiento: "",
      password_usuario: "",
    },
  });

  // Función para cambiar la pestaña y actualizar la URL
  const handleTabChange = (value: string) => {
    // Mantiene el resto de parámetros URL existentes y solo reemplaza `tab`.
    // Esto permite compartir/volver a abrir la misma vista del perfil.
    const params = new URLSearchParams(searchParams);
    params.set('tab', value);
    router.push(`/profile?${params.toString()}`);
  };

  // Compatibilidad con links antiguos.
  useEffect(() => {
    if (searchParams.get('tab') === 'payment') {
      const params = new URLSearchParams(searchParams);
      params.set('tab', 'canje');
      router.replace(`/profile?${params.toString()}`);
    }
  }, [searchParams, router]);

  useEffect(() => {
    // Esperar a que se complete la hidratación y cualquier restore desde refresh cookie
    // evita reseteos del form con datos incompletos o en un estado intermedio.
    if (!isHydrated || isLoadingUser || isRestoringSession) return;

    // Si no logramos resolver un usuario autenticado, redirigir a login
    if (!user) {
      router.replace("/login?redirect=%2Fprofile");
      return;
    }

    // Poblamos el formulario con los datos del usuario.
    // - `email_usuario` y `fec_nacimiento` no se editan en la UI.
    // - `password_usuario` se maneja como campo para cambio (se mantiene vacío hasta submit).
    // - `avatar_seed` y `avatar_colors` alimentan tanto la pestaña de avatar como el modal.
    form.reset({
      nom_usuario: user.nom_usuario || "",
      ape_usuario: user.ape_usuario || "",
      email_usuario: user.email_usuario || "",
      cel_usuario: user.cel_usuario || "",
      des_direccion: user.des_direccion || "",
      fec_nacimiento: user.fec_nacimiento ? new Date(user.fec_nacimiento).toISOString().split('T')[0] : "",
      avatar_seed: user.avatar_seed || null,
      avatar_colors: user.avatar_colors ?? null,
      password_usuario: "",
    });
  }, [isLoadingUser, user, router, form, isHydrated, isRestoringSession]);

  const onSubmit = async (values: z.infer<typeof profileSchema>) => {
    // Filtrar valores vacíos y null, pero mantener los que realmente tienen datos
    const updatedValues: any = {};
    // Este filtrado evita:
    // - enviar strings vacíos (que el backend podría interpretar como “limpiar” campos)
    // - enviar cambios de campos que la UI no permite actualizar (fec_nacimiento / password / etc.)
    if (values.nom_usuario && values.nom_usuario.trim() !== "") updatedValues.nom_usuario = values.nom_usuario.trim();
    if (values.ape_usuario && values.ape_usuario.trim() !== "") updatedValues.ape_usuario = values.ape_usuario.trim();
    if (values.cel_usuario && values.cel_usuario.trim() !== "") updatedValues.cel_usuario = values.cel_usuario.trim();
    // avatar_seed puede ser null o string, siempre incluirlo si está presente
    if (values.avatar_seed !== undefined) updatedValues.avatar_seed = values.avatar_seed;
    if (values.avatar_colors !== undefined) updatedValues.avatar_colors = values.avatar_colors;
    // fec_nacimiento no se puede actualizar, se omite
    // password_usuario se omite ya que se quitó del formulario
    // des_direccion no está en el esquema UserUpdate del backend, se omite

    if (Object.keys(updatedValues).length === 0) {
      toast.info("No hay cambios para guardar.");
      return;
    }

    try {
      // Delegamos la persistencia al hook `useAuth()` para que:
      // - llame al backend
      // - invalide/cachea el query del usuario
      await updateProfile(updatedValues);
      toast.success("¡Perfil actualizado con éxito!");
      setIsEditing(false);
    } catch (error: unknown) {
      // Normaliza errores de API para mostrar mensajes legibles al usuario.
      const errorMessage = getApiErrorMessage(error, "No se pudo actualizar el perfil. Inténtalo de nuevo.");
      toast.error(errorMessage);
      console.error("Error al actualizar perfil:", error);
    }
  };

  const handleEditToggle = async () => {
    if (isEditing) {
      // Si está editando, ejecutar la validación y guardar
      const isValid = await form.trigger();
      if (isValid) {
        // `form.handleSubmit(onSubmit)()` ejecuta el `onSubmit` con los valores validados.
        form.handleSubmit(onSubmit)();
      }
    } else {
      // Si no está editando, activar modo edición
      setIsEditing(true);
    }
  };

  // Selecciones del avatar (desde `AvatarSelector`) actualizan:
  // - el estado del formulario para que el UI refleje el cambio
  // - la caché del usuario para que el resto del perfil/menu muestre el resultado al instante
  const handleSelectSeed = (seed: string) => {
    form.setValue("avatar_seed", seed);
    queryClient.setQueryData(CURRENT_USER_QUERY_KEY, (old: UserPublic | undefined) =>
      old ? { ...old, avatar_seed: seed } : old
    );
  };

  const handleSelectColors = (colors: string) => {
    form.setValue("avatar_colors", colors);
    queryClient.setQueryData(CURRENT_USER_QUERY_KEY, (old: UserPublic | undefined) =>
      old ? { ...old, avatar_colors: colors } : old
    );
  };

  const handleSaveAvatarModal = async () => {
    const avatar_seed = form.getValues("avatar_seed");
    const avatar_colors = form.getValues("avatar_colors");
    try {
      // Al guardar el modal persistimos en backend.
      await updateProfile({ avatar_seed, avatar_colors });
      toast.success("Avatar actualizado correctamente.");
      setAvatarModalOpen(false);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "No se pudo guardar el avatar."));
    }
  };

  // Mostrar loading mientras se hidrata o carga el usuario
  if (!isHydrated || isLoadingUser || isRestoringSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario resuelto, mostrar mensaje mientras ocurre la redirección
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Redirigiendo al login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <ProfileHeader 
        user={user}
        isEditing={isEditing}
        onEditToggle={handleEditToggle}
        onAvatarClick={() => setAvatarModalOpen(true)}
      />

      {/* Modal editar avatar */}
      <Dialog open={avatarModalOpen} onOpenChange={setAvatarModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar avatar</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <AvatarSelector
              currentSeed={form.watch("avatar_seed") || user.avatar_seed}
              currentColors={form.watch("avatar_colors") ?? user.avatar_colors ?? undefined}
              userEmail={user.email_usuario}
              userName={`${user.nom_usuario} ${user.ape_usuario}`}
              onSelect={handleSelectSeed}
              onSelectColors={handleSelectColors}
            />
            <Button onClick={handleSaveAvatarModal} className="w-full">
              Guardar avatar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <div className="flex justify-center">
            <TabsList className="grid w-full max-w-4xl grid-cols-5">
              <TabsTrigger value="profile" className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Perfil</span>
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex items-center space-x-2">
                <Package className="w-4 h-4" />
                <span className="hidden sm:inline">Órdenes</span>
              </TabsTrigger>
              <TabsTrigger value="addresses" className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span className="hidden sm:inline">Direcciones</span>
              </TabsTrigger>
              <TabsTrigger value="canje" className="flex items-center space-x-2">
                <Gift className="w-4 h-4" />
                <span className="hidden sm:inline">Canje</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Configuración</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <ProfileTab 
              user={user}
              form={form}
              isEditing={isEditing}
              onSubmit={onSubmit}
            />
          </TabsContent>

          {/* Avatar Tab */}
          <TabsContent value="avatar">
            <AvatarTab user={user} form={form} updateProfile={updateProfile} />
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <OrdersTab />
          </TabsContent>

          {/* Addresses Tab */}
          <TabsContent value="addresses">
            <AddressesTab />
          </TabsContent>

          {/* Canje Tab */}
          <TabsContent value="canje">
            <ExchangeTab />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}