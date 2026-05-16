export interface Order {
  id_orden: string
  fec_pedido: string
  id_usuario: string
  nom_usuario: string
  ape_usuario: string
  email_usuario: string
  val_total_productos: number
  val_total_descuentos: number
  /** Costo de envío COP (tab_ordenes.val_costo_envio). */
  val_costo_envio?: number
  val_total_pedido: number
  ind_estado: number // 1, 2, 3
  metodo_pago?: string
  items_count?: number
  detalle_descuentos_aplicados?: any
}

export interface OrderProduct {
  id_producto: string
  nom_producto: string
  img_producto?: string
  cantidad: number
  val_precio_unitario: number
  val_subtotal: number
}

export interface Address {
  id_direccion: string
  nombre_direccion: string
  calle_direccion: string
  numero_direccion?: string
  ciudad: string
  departamento: string
  codigo_postal?: string
  telefono_contacto?: string
  ind_principal: boolean
  ind_activa: boolean
}

/** Datos de guía Envia (`tab_ordenes_envio`) expuestos en detalle admin. */
export interface OrderEnvioInfo {
  tracking_number?: string | null
  tracking_url?: string | null
  label_url?: string | null
  carrier?: string | null
  service?: string | null
  estado_envio?: string | null
  costo_envio?: number | null
}

export interface OrderDetail {
  orden: Order
  productos: OrderProduct[]
  direccion_envio?: Address
  envio?: OrderEnvioInfo | null
  descuentos_aplicados?: any
  puntos_ganados?: number
  des_observaciones?: string
}

export interface OrderStats {
  total?: number
  pendiente?: number
  /** Órdenes pagadas, en ruta (ind_estado = 2). */
  en_camino?: number
  completada?: number
  cancelada?: number
  total_ventas?: number
}

export interface OrderFilters {
  search?: string
  status?: number
  dateFrom?: string
  dateTo?: string
  limit?: number
  offset?: number
}
