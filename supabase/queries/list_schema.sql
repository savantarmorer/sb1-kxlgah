-- Lista todas as tabelas e suas colunas de forma organizada
SELECT 
    t.table_name,
    string_agg(c.column_name, ', ' ORDER BY c.ordinal_position) as columns
FROM 
    information_schema.tables t
    JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE 
    t.table_schema = 'public' 
    AND c.table_schema = 'public'
GROUP BY 
    t.table_name
ORDER BY 
    t.table_name;
