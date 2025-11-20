CREATE OR REPLACE FUNCTION fun_audit_tablas() RETURNS TRIGGER AS
$$
BEGIN
    IF TG_OP = 'INSERT' THEN
        NEW.fec_insert = CURRENT_TIMESTAMP;
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'UPDATE' THEN
        NEW.fec_update = CURRENT_TIMESTAMP;
        RETURN NEW;
    END IF;
    IF TG_OP = 'DELETE' THEN
        INSERT INTO tab_reg_del(tab_name, atributos, usr_delete, fec_delete)
        VALUES (TG_TABLE_NAME, row_to_json(OLD), CURRENT_USER, CURRENT_TIMESTAMP);
        RETURN OLD;
    END IF;
END;
$$
LANGUAGE PLPGSQL;


CREATE OR REPLACE TRIGGER tri_audit_categorias BEFORE INSERT OR UPDATE OR DELETE ON tab_categorias
FOR EACH ROW EXECUTE PROCEDURE fun_audit_tablas();

CREATE OR REPLACE TRIGGER tri_audit_lineas BEFORE INSERT OR UPDATE OR DELETE ON tab_lineas
FOR EACH ROW EXECUTE PROCEDURE fun_audit_tablas();

CREATE OR REPLACE TRIGGER tri_audit_sublineas BEFORE INSERT OR UPDATE OR DELETE ON tab_sublineas
FOR EACH ROW EXECUTE PROCEDURE fun_audit_tablas();

CREATE OR REPLACE TRIGGER tri_audit_roles BEFORE INSERT OR UPDATE OR DELETE ON tab_roles
FOR EACH ROW EXECUTE PROCEDURE fun_audit_tablas();

CREATE OR REPLACE TRIGGER tri_audit_usuarios BEFORE INSERT OR UPDATE OR DELETE ON tab_usuarios
FOR EACH ROW EXECUTE PROCEDURE fun_audit_tablas();

CREATE OR REPLACE TRIGGER tri_audit_carritos BEFORE INSERT OR UPDATE OR DELETE ON tab_carritos
FOR EACH ROW EXECUTE PROCEDURE fun_audit_tablas();

CREATE OR REPLACE TRIGGER tri_audit_proveedores BEFORE INSERT OR UPDATE OR DELETE ON tab_proveedores
FOR EACH ROW EXECUTE PROCEDURE fun_audit_tablas();

CREATE OR REPLACE TRIGGER tri_audit_orden_compra_proveedor BEFORE INSERT OR UPDATE OR DELETE ON tab_orden_compra_proveedor
FOR EACH ROW EXECUTE PROCEDURE fun_audit_tablas();

CREATE OR REPLACE TRIGGER tri_audit_marcas BEFORE INSERT OR UPDATE OR DELETE ON tab_marcas
FOR EACH ROW EXECUTE PROCEDURE fun_audit_tablas();

CREATE OR REPLACE TRIGGER tri_audit_comentarios BEFORE INSERT OR UPDATE OR DELETE ON tab_comentarios
FOR EACH ROW EXECUTE PROCEDURE fun_audit_tablas();

CREATE OR REPLACE TRIGGER tri_audit_productos BEFORE INSERT OR UPDATE OR DELETE ON tab_productos
FOR EACH ROW EXECUTE PROCEDURE fun_audit_tablas();

CREATE OR REPLACE TRIGGER tri_audit_descuentos BEFORE INSERT OR UPDATE OR DELETE ON tab_descuentos
FOR EACH ROW EXECUTE PROCEDURE fun_audit_tablas();

CREATE OR REPLACE TRIGGER tri_audit_ordenes BEFORE INSERT OR UPDATE OR DELETE ON tab_ordenes
FOR EACH ROW EXECUTE PROCEDURE fun_audit_tablas();

CREATE OR REPLACE TRIGGER tri_audit_orden_productos BEFORE INSERT OR UPDATE OR DELETE ON tab_orden_productos
FOR EACH ROW EXECUTE PROCEDURE fun_audit_tablas();

CREATE OR REPLACE TRIGGER tri_audit_carrito_productos BEFORE INSERT OR UPDATE OR DELETE ON tab_carrito_productos
FOR EACH ROW EXECUTE PROCEDURE fun_audit_tablas();

CREATE OR REPLACE TRIGGER tri_audit_movimientos_inventario BEFORE INSERT OR UPDATE OR DELETE ON tab_movimientos_inventario
FOR EACH ROW EXECUTE PROCEDURE fun_audit_tablas();

CREATE OR REPLACE TRIGGER tri_audit_cms_content BEFORE INSERT OR UPDATE OR DELETE ON tab_cms_content
FOR EACH ROW EXECUTE PROCEDURE fun_audit_tablas();

CREATE OR REPLACE TRIGGER tri_audit_favoritos BEFORE INSERT OR UPDATE OR DELETE ON tab_favoritos
FOR EACH ROW EXECUTE PROCEDURE fun_audit_tablas();

CREATE OR REPLACE TRIGGER tri_audit_config_puntos_empresa BEFORE INSERT OR UPDATE OR DELETE ON tab_config_puntos_empresa
FOR EACH ROW EXECUTE PROCEDURE fun_audit_tablas();

CREATE OR REPLACE TRIGGER tri_audit_puntos_usuario BEFORE INSERT OR UPDATE OR DELETE ON tab_puntos_usuario
FOR EACH ROW EXECUTE PROCEDURE fun_audit_tablas();

CREATE OR REPLACE TRIGGER tri_audit_movimientos_puntos BEFORE INSERT OR UPDATE OR DELETE ON tab_movimientos_puntos
FOR EACH ROW EXECUTE PROCEDURE fun_audit_tablas();

CREATE OR REPLACE TRIGGER tri_audit_canjes_puntos_descuentos BEFORE INSERT OR UPDATE OR DELETE ON tab_canjes_puntos_descuentos
FOR EACH ROW EXECUTE PROCEDURE fun_audit_tablas();

CREATE OR REPLACE TRIGGER tri_audit_descuentos_usuarios BEFORE INSERT OR UPDATE OR DELETE ON tab_descuentos_usuarios
FOR EACH ROW EXECUTE PROCEDURE fun_audit_tablas();

CREATE OR REPLACE TRIGGER tri_audit_metodos_pago_usuario BEFORE INSERT OR UPDATE OR DELETE ON tab_metodos_pago_usuario
FOR EACH ROW EXECUTE PROCEDURE fun_audit_tablas();

CREATE OR REPLACE TRIGGER tri_audit_pagos BEFORE INSERT OR UPDATE OR DELETE ON tab_pagos
FOR EACH ROW EXECUTE PROCEDURE fun_audit_tablas();


