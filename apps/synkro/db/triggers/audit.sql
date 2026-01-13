-- ============================================================
-- FUNCIÓN DE AUDITORÍA GENÉRICA
-- ============================================================
-- Descripción: Función genérica que maneja auditoría automática
--              para todas las tablas del sistema SaaS
-- ============================================================

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

-- ============================================================
-- TRIGGERS DE AUDITORÍA POR TABLA
-- ============================================================

CREATE OR REPLACE TRIGGER tri_audit_planes BEFORE INSERT OR UPDATE OR DELETE ON tab_planes
FOR EACH ROW EXECUTE FUNCTION fun_audit_tablas();

CREATE OR REPLACE TRIGGER tri_audit_clientes BEFORE INSERT OR UPDATE OR DELETE ON tab_clientes
FOR EACH ROW EXECUTE FUNCTION fun_audit_tablas();

CREATE OR REPLACE TRIGGER tri_audit_instancias BEFORE INSERT OR UPDATE OR DELETE ON tab_instancias
FOR EACH ROW EXECUTE FUNCTION fun_audit_tablas();

CREATE OR REPLACE TRIGGER tri_audit_suscripciones BEFORE INSERT OR UPDATE OR DELETE ON tab_suscripciones
FOR EACH ROW EXECUTE FUNCTION fun_audit_tablas();

CREATE OR REPLACE TRIGGER tri_audit_facturacion_cabecera BEFORE INSERT OR UPDATE OR DELETE ON tab_facturacion_cabecera
FOR EACH ROW EXECUTE FUNCTION fun_audit_tablas();

CREATE OR REPLACE TRIGGER tri_audit_facturacion_detalle BEFORE INSERT OR UPDATE OR DELETE ON tab_facturacion_detalle
FOR EACH ROW EXECUTE FUNCTION fun_audit_tablas();

CREATE OR REPLACE TRIGGER tri_audit_deployments BEFORE INSERT OR UPDATE OR DELETE ON tab_deployments
FOR EACH ROW EXECUTE FUNCTION fun_audit_tablas();

CREATE OR REPLACE TRIGGER tri_audit_dominios BEFORE INSERT OR UPDATE OR DELETE ON tab_dominios
FOR EACH ROW EXECUTE FUNCTION fun_audit_tablas();

CREATE OR REPLACE TRIGGER tri_audit_metricas_instancias BEFORE INSERT OR UPDATE OR DELETE ON tab_metricas_instancias
FOR EACH ROW EXECUTE FUNCTION fun_audit_tablas();

CREATE OR REPLACE TRIGGER tri_audit_uso_recursos BEFORE INSERT OR UPDATE OR DELETE ON tab_uso_recursos
FOR EACH ROW EXECUTE FUNCTION fun_audit_tablas();

CREATE OR REPLACE TRIGGER tri_audit_historial_planes BEFORE INSERT OR UPDATE OR DELETE ON tab_historial_planes
FOR EACH ROW EXECUTE FUNCTION fun_audit_tablas();
