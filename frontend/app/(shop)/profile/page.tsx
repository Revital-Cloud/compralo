"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { profileSchema } from "@/schemas/user.schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CreditCard, 
  Heart, 
  MapPin, 
  Package, 
  Settings, 
  User 
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  ProfileHeader,
  ProfileTab,
  OrdersTab,
  AddressesTab,
  PaymentTab,
  WishlistTab,
  SettingsTab
} from "@/components/layout/shop/profile";

export default function ProfilePage() {
  const { user, isAuthenticated, updateProfile, isLoadingUser, isHydrated } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

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
        fec_nacimiento: user.fec_nacimiento ? new Date(user.fec_nacimiento).toISOString().split('T')[0] : "",
        password_usuario: "",
      });
    }
  }, [isAuthenticated, isLoadingUser, user, router, form, isHydrated]);

  const onSubmit = async (values: z.infer<typeof profileSchema>) => {
    const updatedValues = Object.fromEntries(
      Object.entries(values).filter(([_, value]) => value !== "" && value !== null)
    );

    if (Object.keys(updatedValues).length === 0) {
      toast.info("No hay cambios para guardar.");
      return;
    }

    try {
      await updateProfile(updatedValues);
      toast.success("¡Perfil actualizado con éxito!");
      setIsEditing(false);
    } catch (error) {
      toast.error("No se pudo actualizar el perfil. Inténtalo de nuevo.");
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
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
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
            <TabsTrigger value="wishlist" className="flex items-center space-x-2">
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">Favoritos</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Configuración</span>
            </TabsTrigger>
          </TabsList>

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

          {/* Wishlist Tab */}
          <TabsContent value="wishlist">
            <WishlistTab />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Componente de debug temporal */}
      
    </div>
  );
}