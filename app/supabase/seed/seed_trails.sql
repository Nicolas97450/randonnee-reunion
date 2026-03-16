-- ============================================================
-- Seed — 20 sentiers pilotes de La Réunion
-- Coordonnées GPS réelles, données représentatives
-- ============================================================

INSERT INTO trails (name, slug, description, difficulty, distance_km, elevation_gain_m, duration_min, trail_type, region, start_point, end_point) VALUES

-- === CIRQUE DE MAFATE ===
(
  'Sentier Scout — Mafate par le Col des Boeufs',
  'mafate-col-des-boeufs',
  'L''accès le plus classique au cirque de Mafate via le Col des Boeufs. Descente vers La Nouvelle à travers la forêt de cryptomérias.',
  'moyen',
  11.5, 850, 300, 'aller-retour',
  'Cirque de Mafate',
  ST_MakePoint(55.4530, -21.0695)::geography,
  ST_MakePoint(55.4280, -21.0580)::geography
),
(
  'Ilet des Orangers par Rivière des Galets',
  'mafate-ilet-des-orangers',
  'Remontée spectaculaire de la Rivière des Galets jusqu''à l''Ilet des Orangers, au coeur de Mafate.',
  'difficile',
  16.0, 1200, 420, 'aller-retour',
  'Cirque de Mafate',
  ST_MakePoint(55.3150, -21.0030)::geography,
  ST_MakePoint(55.4100, -21.0450)::geography
),
(
  'Roche Plate — Maïdo à Mafate',
  'mafate-roche-plate-maido',
  'Descente vertigineuse depuis le Maïdo vers Roche Plate dans le cirque de Mafate. Sentier aérien avec vues exceptionnelles.',
  'expert',
  14.0, 1500, 480, 'aller-retour',
  'Cirque de Mafate',
  ST_MakePoint(55.3840, -21.0680)::geography,
  ST_MakePoint(55.4050, -21.0550)::geography
),

-- === CIRQUE DE CILAOS ===
(
  'Piton des Neiges par Cilaos',
  'cilaos-piton-des-neiges',
  'Ascension du point culminant de l''océan Indien (3070m) depuis le bloc à Cilaos. Nuit au gîte de la Caverne Dufour recommandée.',
  'difficile',
  15.0, 1750, 540, 'aller-retour',
  'Cirque de Cilaos',
  ST_MakePoint(55.4710, -21.1290)::geography,
  ST_MakePoint(55.4780, -21.0960)::geography
),
(
  'Bras Rouge — Cilaos',
  'cilaos-bras-rouge',
  'Randonnée dans le canyon de Bras Rouge, avec ses cascades et sa végétation luxuriante. Baignade possible.',
  'moyen',
  8.0, 450, 180, 'boucle',
  'Cirque de Cilaos',
  ST_MakePoint(55.4680, -21.1350)::geography,
  NULL
),
(
  'Roche Merveilleuse',
  'cilaos-roche-merveilleuse',
  'Court sentier menant au belvédère de la Roche Merveilleuse, panorama exceptionnel sur tout le cirque de Cilaos.',
  'facile',
  3.5, 200, 75, 'aller-retour',
  'Cirque de Cilaos',
  ST_MakePoint(55.4700, -21.1260)::geography,
  ST_MakePoint(55.4650, -21.1200)::geography
),

-- === CIRQUE DE SALAZIE ===
(
  'Trou de Fer — Bélouve',
  'salazie-trou-de-fer',
  'Traversée de la forêt primaire de Bélouve jusqu''au belvédère du Trou de Fer, l''un des canyons les plus profonds au monde.',
  'moyen',
  10.0, 350, 210, 'aller-retour',
  'Cirque de Salazie',
  ST_MakePoint(55.5300, -21.0630)::geography,
  ST_MakePoint(55.5100, -21.0580)::geography
),
(
  'Cascade du Voile de la Mariée',
  'salazie-voile-de-la-mariee',
  'Balade facile vers la célèbre cascade du Voile de la Mariée, emblème du cirque de Salazie.',
  'facile',
  2.0, 100, 45, 'aller-retour',
  'Cirque de Salazie',
  ST_MakePoint(55.5110, -21.0430)::geography,
  ST_MakePoint(55.5080, -21.0400)::geography
),
(
  'Piton des Neiges par Hell-Bourg',
  'salazie-piton-des-neiges',
  'Autre voie d''accès au Piton des Neiges depuis Hell-Bourg, traversant la forêt de Bélouve puis le Plateau des Petits Merlins.',
  'difficile',
  18.0, 1900, 600, 'aller-retour',
  'Cirque de Salazie',
  ST_MakePoint(55.5190, -21.0660)::geography,
  ST_MakePoint(55.4780, -21.0960)::geography
),

-- === PITON DE LA FOURNAISE ===
(
  'Enclos Fouqué — Cratère Dolomieu',
  'volcan-enclos-fouque-dolomieu',
  'La randonnée mythique du Piton de la Fournaise : traversée de la Plaine des Sables, descente dans l''Enclos, montée au sommet du Dolomieu.',
  'moyen',
  12.0, 530, 300, 'aller-retour',
  'Massif du Volcan',
  ST_MakePoint(55.6830, -21.2240)::geography,
  ST_MakePoint(55.7100, -21.2440)::geography
),
(
  'Piton de Bert',
  'volcan-piton-de-bert',
  'Point de vue spectaculaire sur l''Enclos Fouqué et le Piton de la Fournaise. Accessible depuis le Pas de Bellecombe.',
  'facile',
  5.0, 250, 120, 'boucle',
  'Massif du Volcan',
  ST_MakePoint(55.6830, -21.2240)::geography,
  NULL
),
(
  'Plaine des Sables',
  'volcan-plaine-des-sables',
  'Traversée lunaire de la Plaine des Sables, paysage unique au monde rappelant Mars. Panorama à 360° sur le massif volcanique.',
  'moyen',
  8.5, 300, 180, 'point-a-point',
  'Massif du Volcan',
  ST_MakePoint(55.6500, -21.2100)::geography,
  ST_MakePoint(55.6830, -21.2240)::geography
),

-- === PLAINE DES CAFRES ===
(
  'Piton de l''Eau',
  'plaine-des-cafres-piton-de-leau',
  'Randonnée vers le lac volcanique du Piton de l''Eau à travers les prairies et forêts des Hauts. Ambiance montagnarde.',
  'facile',
  7.0, 200, 150, 'aller-retour',
  'Plaine des Cafres',
  ST_MakePoint(55.5890, -21.1850)::geography,
  ST_MakePoint(55.5750, -21.1780)::geography
),

-- === FORÊT DE BÉBOUR-BÉLOUVE ===
(
  'Forêt de Bébour — Sentier botanique',
  'bebour-sentier-botanique',
  'Sentier aménagé au coeur de la forêt primaire de Bébour. Fougères arborescentes géantes, tamarins des hauts, ambiance Jurassic Park.',
  'facile',
  4.0, 150, 90, 'boucle',
  'Foret de Bebour-Belouve',
  ST_MakePoint(55.5450, -21.0900)::geography,
  NULL
),

-- === CÔTE OUEST ===
(
  'Cap Noir — Dos d''Âne',
  'ouest-cap-noir-dos-dane',
  'Belvédère de Cap Noir offrant une vue plongeante sur le cirque de Mafate. Court mais spectaculaire.',
  'facile',
  3.0, 150, 60, 'aller-retour',
  'Cote Ouest',
  ST_MakePoint(55.3950, -21.0190)::geography,
  ST_MakePoint(55.3980, -21.0230)::geography
),

-- === SUD SAUVAGE ===
(
  'Anse des Cascades',
  'sud-sauvage-anse-des-cascades',
  'Promenade littorale le long des falaises du Sud Sauvage jusqu''à l''Anse des Cascades, où l''eau douce rejoint l''océan.',
  'facile',
  4.5, 80, 75, 'boucle',
  'Grand Sud Sauvage',
  ST_MakePoint(55.7800, -21.1800)::geography,
  NULL
),
(
  'Pointe de la Table — Coulée de 2007',
  'sud-sauvage-pointe-de-la-table',
  'Marche sur la coulée de lave de 2007 qui a agrandi l''île. Paysage minéral brut, végétation pionnière.',
  'moyen',
  6.0, 150, 120, 'aller-retour',
  'Grand Sud Sauvage',
  ST_MakePoint(55.7750, -21.2050)::geography,
  ST_MakePoint(55.7900, -21.2100)::geography
),

-- === HAUTS DU NORD-EST ===
(
  'Takamaka — Bras Cabot',
  'nord-est-takamaka',
  'Descente vers le site hydroélectrique de Takamaka, au fond d''une vallée encaissée spectaculaire. Cascades monumentales.',
  'difficile',
  10.0, 900, 300, 'aller-retour',
  'Hauts du Nord-Est',
  ST_MakePoint(55.5950, -21.0500)::geography,
  ST_MakePoint(55.5800, -21.0600)::geography
),

-- === GRAND BÉNARE ===
(
  'Grand Bénare par le Maïdo',
  'grand-benare-maido',
  'Randonnée d''altitude sur la crête entre le Maïdo et le Grand Bénare (2898m). Vue simultanée sur Mafate et la côte Ouest.',
  'difficile',
  16.0, 1100, 420, 'aller-retour',
  'Grand Benare',
  ST_MakePoint(55.3840, -21.0680)::geography,
  ST_MakePoint(55.4100, -21.1050)::geography
),

-- === RIVIÈRE DES REMPARTS ===
(
  'Rivière des Remparts — Nez de Boeuf',
  'riviere-des-remparts-nez-de-boeuf',
  'Descente dans la vallée encaissée de la Rivière des Remparts depuis le belvédère du Nez de Boeuf. Paysage grandiose.',
  'difficile',
  14.0, 1300, 420, 'aller-retour',
  'Riviere des Remparts',
  ST_MakePoint(55.6100, -21.1950)::geography,
  ST_MakePoint(55.6300, -21.2100)::geography
);
