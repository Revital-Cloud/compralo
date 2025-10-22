CREATE OR REPLACE FUNCTION fun_get_productos()
RETURNS TABLE (
    nom_categoria tab_categorias.nom_categoria%TYPE,
    nom_linea tab_lineas.nom_linea%TYPE,
    nom_sublinea tab_sublineas.nom_sublinea%TYPE,
    nom_producto tab_productos.nom_producto%TYPE,
    spcf_producto tab_productos.spcf_producto%TYPE,
    img_producto tab_productos.img_producto%TYPE,
    val_precio tab_productos.val_precio%TYPE,
    num_stock tab_productos.num_stock%TYPE,
    nom_proveedor tab_proveedores.nom_proveedor%TYPE,
    nom_marca tab_marcas.nom_marca%TYPE
) AS $$
BEGIN
    RETURN QUERY
    (
    SELECT 
        c.nom_categoria, 
        l.nom_linea, 
        s.nom_sublinea, 
        p.nom_producto, 
        p.spcf_producto, 
        p.img_producto, 
        p.val_precio, 
        p.num_stock, 
        pr.nom_proveedor, 
        m.nom_marca 
    FROM tab_lineas l 
    INNER JOIN tab_categorias c ON l.id_categoria = c.id_categoria
    INNER JOIN tab_sublineas s ON l.id_linea = s.id_linea
    INNER JOIN tab_productos p ON s.id_sublinea = p.id_sublinea
    INNER JOIN tab_proveedores pr ON p.id_proveedor = pr.id_proveedor
    INNER JOIN tab_marcas m ON p.id_marca = m.id_marca
    );
END
$$ LANGUAGE plpgsql;










