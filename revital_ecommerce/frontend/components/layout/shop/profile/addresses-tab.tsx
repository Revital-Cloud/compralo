"use client";

import { Button } from "@/components/ui";
import { Card, CardContent } from "@/components/ui";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui";
import { Input } from "@/components/ui";
import { MapPin, Pencil, Trash2, Eye, Star, Power } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import addressService from "@/services/address.service";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addressSchema, type AddressFormValues } from "@/schemas/shop/address.schema";
import { useState } from "react";
import { toast } from "sonner";

/**
 * Pestaña de direcciones del perfil.
 *
 * Soporta:
 * - crear/editar direcciones
 * - activar/desactivar
 * - marcar como principal
 * - vista detallada en modal
 */

export default function AddressesTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);
  const [viewAddress, setViewAddress] = useState<any>(null);
  const { data: addresses } = useQuery({
    queryKey: ["addresses"],
    queryFn: addressService.getMyAddresses,
    enabled: !!user?.id_usuario,
  });
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      nombre_direccion: "",
      calle_direccion: "",
      ciudad: "",
      departamento: "",
      codigo_postal: "",
      barrio: "",
      referencias: "",
      complemento: "",
    },
  });

  const onSubmit = async (data: AddressFormValues) => {
    if (!user?.id_usuario) return;
    setIsPending(true);
    try {
      console.log("Datos del formulario:", data);
      console.log("Direcciones existentes:", addresses);
      const editId = (form as any)._editId as number | undefined;
      if (editId) {
        await addressService.updateAddress(Number(editId), {
          nombre_direccion: data.nombre_direccion,
          calle_direccion: data.calle_direccion,
          ciudad: data.ciudad,
          departamento: data.departamento,
          codigo_postal: data.codigo_postal,
          barrio: data.barrio,
          referencias: data.referencias || null,
          complemento: data.complemento || null,
          ind_principal: false,
          ind_activa: true,
        });
      } else {
        // Crear dirección como NO principal por defecto - el usuario debe marcarla como principal manualmente
        const addressData = {
          id_usuario: Number(user.id_usuario),
          nombre_direccion: data.nombre_direccion,
          calle_direccion: data.calle_direccion,
          ciudad: data.ciudad,
          departamento: data.departamento,
          codigo_postal: data.codigo_postal,
          barrio: data.barrio,
          referencias: data.referencias || null,
          complemento: data.complemento || null,
          ind_principal: false, // NO principal por defecto
          ind_activa: true,     // Activa por defecto
        };
        console.log("Datos a enviar:", addressData);
        await addressService.createAddress(addressData);
      }
      setIsOpen(false);
      (form as any)._editId = undefined;
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      form.reset({
        nombre_direccion: "",
        calle_direccion: "",
        ciudad: "",
        departamento: "",
        codigo_postal: "",
        barrio: "",
        referencias: "",
        complemento: "",
      });
      toast.success(editId ? "Dirección actualizada exitosamente" : "Dirección creada exitosamente. Márcala como principal si la necesitas.");
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Error al procesar la dirección");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-foreground">Dirección guardada</h3>
          <p className="text-sm text-muted-foreground">Gestiona tu dirección de envío</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="cursor-pointer">
              {user?.des_direccion ? (
                <>
                  <Pencil className="w-4 h-4 mr-2" />
                  Editar dirección
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4 mr-2" />
                  Agregar dirección
                </>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="[&>button]:cursor-pointer">
            <DialogHeader>
              <DialogTitle>
                {user?.des_direccion ? "Editar dirección" : "Agregar dirección"}
              </DialogTitle>
              <DialogDescription>
                Ingresa tu dirección de envío para tus compras
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nombre_direccion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Casa, Oficina" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="calle_direccion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Calle 123 #45-67" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="ciudad"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ciudad</FormLabel>
                        <FormControl>
                          <Input placeholder="Ciudad" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="departamento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Departamento</FormLabel>
                        <FormControl>
                          <Input placeholder="Departamento/Estado" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="codigo_postal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código Postal</FormLabel>
                        <FormControl>
                          <Input placeholder="Código postal" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="barrio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Barrio</FormLabel>
                        <FormControl>
                          <Input placeholder="Barrio" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="referencias"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Referencias</FormLabel>
                      <FormControl>
                        <Input placeholder="Puntos de referencia" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="complemento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Complemento</FormLabel>
                      <FormControl>
                        <Input placeholder="Apto, interior, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="cursor-pointer">
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isPending} className="cursor-pointer">
                    {isPending ? "Guardando..." : "Guardar dirección"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardContent className="py-6">
          {addresses && addresses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {addresses.map((addr: any) => (
                <Card key={addr.id_direccion} className="h-full">
                  <CardContent className="p-4 h-full flex flex-col">
                    <div 
                      className="flex items-start gap-3 cursor-pointer flex-1"
                      onClick={() => setViewAddress(addr)}
                    >
                      <MapPin className="w-5 h-5 text-primary mt-1 shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium break-words">{addr.nombre_direccion}</p>
                          <button
                            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                              addr.ind_principal 
                                ? 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30' 
                                : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                            }`}
                            title={addr.ind_principal ? "Desactivar como dirección principal" : "Activar como dirección principal"}
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (!user?.id_usuario) return;
                              try {
                                if (addr.ind_principal) {
                                  await addressService.deactivateMainAddress(Number(addr.id_direccion), Number(user.id_usuario));
                                  toast.error("Dirección principal desactivada exitosamente");
                                } else {
                                  const principalAddresses = addresses?.filter((a:any) => a.ind_principal) || [];
                                  for (const principalAddr of principalAddresses) {
                                    await addressService.deactivateMainAddress(Number(principalAddr.id_direccion), Number(user.id_usuario));
                                  }
                                  await addressService.updateAddress(Number(addr.id_direccion), {
                                    nombre_direccion: addr.nombre_direccion,
                                    calle_direccion: addr.calle_direccion,
                                    ciudad: addr.ciudad,
                                    departamento: addr.departamento,
                                    codigo_postal: addr.codigo_postal,
                                    barrio: addr.barrio,
                                    referencias: addr.referencias,
                                    complemento: addr.complemento,
                                    ind_principal: true,
                                    ind_activa: addr.ind_activa,
                                  });
                                  toast.success("Dirección principal activada exitosamente");
                                }
                                queryClient.invalidateQueries({ queryKey: ["addresses"] });
                              } catch (error: any) {
                                toast.error(error?.response?.data?.detail || "Error al cambiar el estado de dirección principal");
                              }
                            }}
                          >
                            <Star className={`w-4 h-4 ${addr.ind_principal ? 'fill-current' : ''}`} />
                            <span>Principal</span>
                          </button>
                        </div>
                        <p className="text-sm text-muted-foreground break-words">{addr.calle_direccion}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <button
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-yellow-500 hover:text-white hover:border-yellow-500 h-10 w-10 cursor-pointer"
                        title="Ver detalles"
                        onClick={() => setViewAddress(addr)}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-yellow-500 hover:text-white hover:border-yellow-500 h-10 w-10 cursor-pointer"
                        title="Editar"
                        onClick={() => {
                          setIsOpen(true);
                          form.reset({
                            nombre_direccion: addr.nombre_direccion || 'Dirección',
                            calle_direccion: addr.calle_direccion || '',
                            ciudad: addr.ciudad || '',
                            departamento: addr.departamento || '',
                            codigo_postal: addr.codigo_postal || '',
                            barrio: addr.barrio || '',
                            referencias: addr.referencias || '',
                            complemento: addr.complemento || '',
                          });
                          (form as any)._editId = addr.id_direccion;
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <Button
                        size="icon"
                        variant={addr.ind_activa ? "default" : "destructive"}
                        className={`${addr.ind_activa ? "bg-green-600 hover:bg-green-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"} cursor-pointer`}
                        title={addr.ind_activa ? "Desactivar dirección" : "Activar dirección"}
                        onClick={async () => {
                          if (!user?.id_usuario) return;
                          try {
                            if (addr.ind_activa) {
                              await addressService.deactivateAddress(Number(addr.id_direccion), Number(user.id_usuario));
                              toast.error("Dirección desactivada exitosamente");
                            } else {
                              await addressService.updateAddress(Number(addr.id_direccion), {
                                nombre_direccion: addr.nombre_direccion,
                                calle_direccion: addr.calle_direccion,
                                ciudad: addr.ciudad,
                                departamento: addr.departamento,
                                codigo_postal: addr.codigo_postal,
                                barrio: addr.barrio,
                                referencias: addr.referencias,
                                complemento: addr.complemento,
                                ind_principal: addr.ind_principal,
                                ind_activa: true,
                              });
                              toast.success("Dirección activada exitosamente");
                            }
                            queryClient.invalidateQueries({ queryKey: ["addresses"] });
                          } catch (error: any) {
                            toast.error(error?.response?.data?.detail || "Error al cambiar el estado de la dirección");
                          }
                        }}
                      >
                        <Power className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No tienes una dirección guardada</p>
              <p className="text-sm text-muted-foreground/70">Agrega una dirección para facilitar tus compras</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Modal de vista de dirección */}
      <Dialog open={!!viewAddress} onOpenChange={() => setViewAddress(null)}>
        <DialogContent className="max-w-2xl [&>button]:cursor-pointer">
          <DialogHeader>
            <DialogTitle>Detalles de la dirección</DialogTitle>
            <DialogDescription>
              Información completa de la dirección seleccionada
            </DialogDescription>
          </DialogHeader>
          {viewAddress && (
            <div className="space-y-4">
              {/* Indicadores de estado */}
              <div className="flex gap-4 mb-4">
                {viewAddress.ind_principal && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm font-medium">Dirección Principal</span>
                  </div>
                )}
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                  viewAddress.ind_activa 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  <Power className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {viewAddress.ind_activa ? 'Activa' : 'Desactivada'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nombre</label>
                  <p className="text-sm">{viewAddress.nombre_direccion}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Dirección</label>
                  <p className="text-sm">{viewAddress.calle_direccion}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Ciudad</label>
                  <p className="text-sm">{viewAddress.ciudad}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Departamento</label>
                  <p className="text-sm">{viewAddress.departamento}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Código Postal</label>
                  <p className="text-sm">{viewAddress.codigo_postal}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Barrio</label>
                  <p className="text-sm">{viewAddress.barrio}</p>
                </div>
              </div>
              {viewAddress.referencias && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Referencias</label>
                  <p className="text-sm">{viewAddress.referencias}</p>
                </div>
              )}
              {viewAddress.complemento && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Complemento</label>
                  <p className="text-sm">{viewAddress.complemento}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 