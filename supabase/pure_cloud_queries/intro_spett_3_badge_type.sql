-- ============================================================
-- 3) CONTENUTO reale della tabella badges (id = chiave per il catalogo app)
-- ============================================================
SELECT id, name, icon, description, req_xp, req_poi_category
FROM badges
ORDER BY id;