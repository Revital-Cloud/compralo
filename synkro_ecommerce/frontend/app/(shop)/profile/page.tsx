"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { profileSchema } from "@/schemas/user.schema";
import { 
  CreditCard, 
  MapPin, 
  Package, 
  Settings, 
  User 
} from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ProfileHeader,
  ProfileTab,
  OrdersTab,
  AddressesTab,
  PaymentTab,
  SettingsTab
} from "@/components/layout/shop/profile";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui";

export default function ProfilePage() {
  const { user, isAuthenticated, updateProfile, isLoadingUser, isHydrated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isEditing, setIsEditing] = useState(false);

  // Obtener la pestaña activa de la URL o usar 'profile' por defecto
  const activeTab = searchParams.get('tab') || 'profile';

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
    const params = new URLSearchParams(searchParams);
    params.set('tab', value);
    router.push(`/profile?${params.toString()}`);
  };

  useEffect(() => {
    // Esperar a que se complete la hidratación
    if (!isHydrated) return;
    
    // Si no está autenticado después de la hidratación, redirigir
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    
    // Si está autenticado y hay usuario, cargar datos en el formulario
    if (user) {
      form.reset({
        nom_usuario: user.nom_usuario || "",
        ape_usuario: user.ape_usuario || "",
        email_usuario: user.email_usuario || "",
        cel_usuario: user.cel_usuario || "",
        des_direccion: user.des_direccion || "",
        fec_nacimiento: user.fec_nacimiento ? new Date(user.fec_nacimiento).toISOString().split('T')[0] : "",
        password_usuario: "",
      });
    }
  }, [isAuthenticated, isLoadingUser, user, router, form, isHydrated]);

  const onSubmit = async (values: z.infer<typeof profileSchema>) => {
    // Filtrar valores vacíos y null, pero mantener los que realmente tienen datos
    const updatedValues: any = {};
    if (values.nom_usuario && values.nom_usuario.trim() !== "") updatedValues.nom_usuario = values.nom_usuario.trim();
    if (values.ape_usuario && values.ape_usuario.trim() !== "") updatedValues.ape_usuario = values.ape_usuario.trim();
    if (values.email_usuario && values.email_usuario.trim() !== "") updatedValues.email_usuario = values.email_usuario.trim();
    if (values.cel_usuario && values.cel_usuario.trim() !== "") updatedValues.cel_usuario = values.cel_usuario.trim();
    // fec_nacimiento no se puede actualizar, se omite
    // password_usuario se omite ya que se quitó del formulario
    // des_direccion no está en el esquema UserUpdate del backend, se omite

    if (Object.keys(updatedValues).length === 0) {
      toast.info("No hay cambios para guardar.");
      return;
    }

    try {
      await updateProfile(updatedValues);
      toast.success("¡Perfil actualizado con éxito!");
      setIsEditing(false);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || error?.message || "No se pudo actualizar el perfil. Inténtalo de nuevo.";
      toast.error(errorMessage);
      console.error("Error al actualizar perfil:", error);
    }
  };

  const handleEditToggle = async () => {
    if (isEditing) {
      // Si está editando, ejecutar la validación y guardar
      const isValid = await form.trigger();
      if (isValid) {
        form.handleSubmit(onSubmit)();
      }
    } else {
      // Si no está editando, activar modo edición
      setIsEditing(true);
    }
  };

  // Mostrar loading mientras se hidrata o carga el usuario
  if (!isHydrated || isLoadingUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado después de la hidratación, mostrar mensaje
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Redirigiendo al login...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario, mostrar error
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">Error al cargar el perfil del usuario</p>
          
          <button 
            onClick={() => router.push('/login')}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Volver al login
          </button>
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
      />

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
              <TabsTrigger value="payment" className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4" />
                <span className="hidden sm:inline">Pagos</span>
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

          {/* Orders Tab */}
          <TabsContent value="orders">
            <OrdersTab />
          </TabsContent>

          {/* Addresses Tab */}
          <TabsContent value="addresses">
            <AddressesTab />
          </TabsContent>

          {/* Payment Tab */}
          <TabsContent value="payment">
            <PaymentTab />
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