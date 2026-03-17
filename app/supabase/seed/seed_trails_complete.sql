-- ============================================================
-- Seed complet — 60+ sentiers de La Reunion
-- Coordonnees GPS reelles, toutes les regions
-- ============================================================

-- Nettoyer les donnees existantes
DELETE FROM trail_zones;
DELETE FROM user_activities;
DELETE FROM trail_conditions;
DELETE FROM trails;

INSERT INTO trails (name, slug, description, difficulty, distance_km, elevation_gain_m, duration_min, trail_type, region, start_point, end_point) VALUES

-- Cirque de Mafate
('Sentier Scout - Col des Boeufs a La Nouvelle', 'col-des-boeufs-la-nouvelle', 'Descente classique vers le coeur de Mafate par le Col des Boeufs, porte d''entree principale du cirque.', 'moyen', 7.2, 350, 180, 'point-a-point', 'Cirque de Mafate', ST_MakePoint(55.4270, -21.0750)::geography, ST_MakePoint(55.4180, -21.0580)::geography),
('La Nouvelle - Marla par le GR R1', 'la-nouvelle-marla-gr-r1', 'Etape mythique du GR R1 traversant le cirque de Mafate entre deux ilets emblematiques.', 'moyen', 12.5, 850, 360, 'point-a-point', 'Cirque de Mafate', ST_MakePoint(55.4180, -21.0580)::geography, ST_MakePoint(55.4050, -21.0830)::geography),
('Marla - Col du Taibit', 'marla-col-du-taibit', 'Montee exigeante vers le Col du Taibit reliant Mafate a Cilaos, panorama exceptionnel sur les deux cirques.', 'difficile', 5.8, 750, 210, 'point-a-point', 'Cirque de Mafate', ST_MakePoint(55.4050, -21.0830)::geography, ST_MakePoint(55.4120, -21.0920)::geography),
('Roche Plate - Ilet des Orangers', 'roche-plate-ilet-orangers', 'Sentier sauvage longeant la riviere des Galets entre deux ilets isoles de Mafate.', 'difficile', 8.0, 600, 270, 'point-a-point', 'Cirque de Mafate', ST_MakePoint(55.3950, -21.0520)::geography, ST_MakePoint(55.3870, -21.0430)::geography),
('Aurere - Ilet a Bourse', 'aurere-ilet-a-bourse', 'Chemin pittoresque entre deux ilets habites, au milieu de paysages grandioses et preserves.', 'moyen', 6.5, 450, 180, 'point-a-point', 'Cirque de Mafate', ST_MakePoint(55.4100, -21.0480)::geography, ST_MakePoint(55.4020, -21.0400)::geography),
('Sentier Augustave - Sans Souci a La Nouvelle', 'augustave-sans-souci-la-nouvelle', 'Traversee de la foret de cryptomerias avec vues plongeantes sur le fond du cirque.', 'moyen', 9.0, 550, 240, 'point-a-point', 'Cirque de Mafate', ST_MakePoint(55.4300, -21.0650)::geography, ST_MakePoint(55.4180, -21.0580)::geography),

-- Cirque de Cilaos
('Cilaos - Piton des Neiges par le Bloc', 'cilaos-piton-des-neiges-bloc', 'Ascension du plus haut sommet de l''ocean Indien depuis Cilaos, nuit au gite de la caverne Dufour recommandee.', 'difficile', 14.0, 1700, 480, 'aller-retour', 'Cirque de Cilaos', ST_MakePoint(55.4710, -21.1280)::geography, NULL),
('Tour du Piton des Neiges par Cilaos', 'tour-piton-neiges-cilaos', 'Boucle ambitieuse autour du toit de La Reunion offrant des panoramas a 360 degres.', 'expert', 22.0, 2200, 720, 'boucle', 'Cirque de Cilaos', ST_MakePoint(55.4710, -21.1280)::geography, NULL),
('Ilet a Cordes - Bras Sec', 'ilet-a-cordes-bras-sec', 'Randonnee a travers les vignes et les lentilles de Cilaos avec vue sur le Piton des Neiges.', 'facile', 5.5, 280, 120, 'boucle', 'Cirque de Cilaos', ST_MakePoint(55.4580, -21.1180)::geography, NULL),
('La Chapelle - Canyon de Cilaos', 'la-chapelle-cilaos', 'Remontee spectaculaire du Bras Rouge jusqu''a la cathedrale de roche de La Chapelle.', 'moyen', 6.0, 350, 180, 'aller-retour', 'Cirque de Cilaos', ST_MakePoint(55.4650, -21.1350)::geography, NULL),
('Cilaos - Col du Taibit', 'cilaos-col-du-taibit', 'Montee soutenue vers le col mythique reliant Cilaos a Mafate, un passage cle du GR R2.', 'difficile', 10.0, 1100, 330, 'point-a-point', 'Cirque de Cilaos', ST_MakePoint(55.4710, -21.1280)::geography, ST_MakePoint(55.4120, -21.0920)::geography),
('Roche Merveilleuse', 'roche-merveilleuse', 'Court sentier menant a un belvedere offrant une vue panoramique sur tout le cirque de Cilaos.', 'facile', 2.5, 150, 60, 'aller-retour', 'Cirque de Cilaos', ST_MakePoint(55.4690, -21.1250)::geography, NULL),

-- Cirque de Salazie
('Hell-Bourg - Piton des Neiges par Terre Plate', 'hell-bourg-piton-neiges', 'Voie historique d''ascension du Piton des Neiges depuis le village creole de Hell-Bourg.', 'difficile', 16.0, 1750, 540, 'aller-retour', 'Cirque de Salazie', ST_MakePoint(55.5180, -21.0650)::geography, NULL),
('Cascade du Voile de la Mariee', 'voile-de-la-mariee', 'Promenade facile menant au pied de la cascade la plus photographiee de La Reunion.', 'facile', 3.0, 120, 60, 'aller-retour', 'Cirque de Salazie', ST_MakePoint(55.5250, -21.0450)::geography, NULL),
('Hell-Bourg - Ilet a Vidot', 'hell-bourg-ilet-vidot', 'Sentier bucolique traversant des champs de chouchous et des hameaux creoles typiques.', 'facile', 4.5, 200, 90, 'boucle', 'Cirque de Salazie', ST_MakePoint(55.5180, -21.0650)::geography, NULL),
('Salazie - Col des Boeufs', 'salazie-col-des-boeufs', 'Montee reguliere vers le col reliant Salazie a Mafate, passage oblige pour entrer dans le cirque enclave.', 'moyen', 8.5, 900, 240, 'point-a-point', 'Cirque de Salazie', ST_MakePoint(55.5050, -21.0520)::geography, ST_MakePoint(55.4270, -21.0750)::geography),
('Trou de Fer - Belvedere', 'trou-de-fer-belvedere', 'Acces au panorama vertigineux sur le Trou de Fer, canyon le plus profond de l''ile.', 'moyen', 10.0, 500, 240, 'aller-retour', 'Cirque de Salazie', ST_MakePoint(55.5350, -21.0600)::geography, NULL),

-- Massif du Volcan
('Pas de Bellecombe - Piton de la Fournaise', 'pas-bellecombe-fournaise', 'La randonnee incontournable de La Reunion : traversee de l''Enclos jusqu''au cratere sommital du volcan actif.', 'moyen', 10.5, 530, 300, 'aller-retour', 'Massif du Volcan', ST_MakePoint(55.6920, -21.2150)::geography, NULL),
('Fournaise par le Nez Coupe de Sainte-Rose', 'fournaise-nez-coupe-ste-rose', 'Approche sauvage du volcan par le flanc est, traversee lunaire a travers les anciennes coulees.', 'difficile', 14.0, 800, 420, 'point-a-point', 'Massif du Volcan', ST_MakePoint(55.7100, -21.2050)::geography, ST_MakePoint(55.7140, -21.2440)::geography),
('Cratere Commerson', 'cratere-commerson', 'Boucle facile autour du spectaculaire cratere Commerson sur la route du volcan.', 'facile', 3.5, 150, 75, 'boucle', 'Massif du Volcan', ST_MakePoint(55.6800, -21.2050)::geography, NULL),
('Piton de Bert', 'piton-de-bert', 'Montee vers un point de vue exceptionnel sur l''Enclos Fouque et le Piton de la Fournaise.', 'moyen', 5.0, 350, 150, 'aller-retour', 'Massif du Volcan', ST_MakePoint(55.6850, -21.2100)::geography, NULL),
('Sentier du Volcan - Plaine des Sables', 'sentier-plaine-des-sables', 'Traversee de la Plaine des Sables, paysage desertique unique evoquant la surface de Mars.', 'moyen', 8.0, 300, 180, 'point-a-point', 'Massif du Volcan', ST_MakePoint(55.6650, -21.2080)::geography, ST_MakePoint(55.6920, -21.2150)::geography),

-- Plaine des Cafres
('Piton de l''Eau', 'piton-de-leau', 'Randonnee paisible vers un lac de cratere niche dans les hauts, ambiance de lande d''altitude.', 'facile', 7.0, 250, 150, 'aller-retour', 'Plaine des Cafres', ST_MakePoint(55.6100, -21.1550)::geography, NULL),
('Piton Tortue et Grand Morne', 'piton-tortue-grand-morne', 'Boucle sur les plateaux herbeux de la Plaine des Cafres avec vues sur le massif du volcan.', 'moyen', 9.5, 400, 210, 'boucle', 'Plaine des Cafres', ST_MakePoint(55.5900, -21.1700)::geography, NULL),
('Nez de Boeuf', 'nez-de-boeuf', 'Court sentier menant a un belvedere impressionnant surplombant la Riviere des Remparts.', 'facile', 1.5, 80, 30, 'aller-retour', 'Plaine des Cafres', ST_MakePoint(55.6350, -21.1950)::geography, NULL),

-- Plaine des Palmistes
('Foret de la Plaine des Palmistes - Sentier botanique', 'sentier-botanique-palmistes', 'Sentier d''interpretation en foret primaire, decouverte de la flore endemique reunionnaise.', 'facile', 4.0, 150, 90, 'boucle', 'Plaine des Palmistes', ST_MakePoint(55.6300, -21.1250)::geography, NULL),
('Piton des Songes', 'piton-des-songes', 'Balade familiale vers un sommet boise offrant une vue degagee sur la Plaine des Palmistes.', 'facile', 5.5, 280, 120, 'aller-retour', 'Plaine des Palmistes', ST_MakePoint(55.6200, -21.1150)::geography, NULL),

-- Grand Sud Sauvage
('Cap Mechant - Pointe de la Table', 'cap-mechant-pointe-table', 'Sentier littoral longeant les falaises volcaniques du sud sauvage battues par les vagues.', 'facile', 6.0, 100, 120, 'point-a-point', 'Grand Sud Sauvage', ST_MakePoint(55.7050, -21.3650)::geography, ST_MakePoint(55.7250, -21.3700)::geography),
('Anse des Cascades', 'anse-des-cascades', 'Promenade ombragee sous les cocotiers et filaos jusqu''aux cascades tombant dans l''ocean.', 'facile', 2.0, 50, 40, 'boucle', 'Grand Sud Sauvage', ST_MakePoint(55.7800, -21.1750)::geography, NULL),
('Sentier du Littoral - Le Baril a Vincendo', 'littoral-baril-vincendo', 'Randonnee cotiere sauvage entre coulees de lave anciennes et vegetation littorale intacte.', 'moyen', 8.5, 200, 180, 'point-a-point', 'Grand Sud Sauvage', ST_MakePoint(55.6500, -21.3600)::geography, ST_MakePoint(55.6200, -21.3500)::geography),
('Puits Arabe - Bois Blanc', 'puits-arabe-bois-blanc', 'Decouverte d''un site geologique etonnant dans le sud sauvage avec tunnel de lave accessible.', 'facile', 3.5, 80, 75, 'boucle', 'Grand Sud Sauvage', ST_MakePoint(55.7600, -21.2500)::geography, NULL),

-- Cote Ouest
('Sentier du Littoral - Saint-Gilles a Boucan Canot', 'littoral-st-gilles-boucan', 'Balade cotiere entre plages et criques avec vue sur le lagon et le coucher de soleil.', 'facile', 5.0, 80, 90, 'point-a-point', 'Cote Ouest', ST_MakePoint(55.2240, -21.0720)::geography, ST_MakePoint(55.2180, -21.0350)::geography),
('Cap La Houssaye', 'cap-la-houssaye', 'Promenade panoramique sur le cap avec savane seche, baobabs et vue sur la cote ouest.', 'facile', 3.0, 100, 60, 'boucle', 'Cote Ouest', ST_MakePoint(55.2270, -21.0150)::geography, NULL),
('Ravine Saint-Gilles - Bassin des Aigrettes', 'ravine-st-gilles-bassin-aigrettes', 'Descente dans la ravine luxuriante jusqu''a un bassin naturel borde de falaises.', 'moyen', 4.5, 300, 120, 'aller-retour', 'Cote Ouest', ST_MakePoint(55.2350, -21.0650)::geography, NULL),

-- Cote Est
('Sentier de Grand-Anse a Sainte-Rose', 'grand-anse-ste-rose', 'Sentier cotier traversant les coulees de lave recentes et la vegetation pionniere.', 'moyen', 7.5, 250, 180, 'point-a-point', 'Cote Est', ST_MakePoint(55.7950, -21.1400)::geography, ST_MakePoint(55.7850, -21.1250)::geography),
('Notre-Dame des Laves', 'notre-dame-des-laves', 'Balade historique autour de l''eglise miraculeusement epargnee par la coulee de 1977.', 'facile', 2.5, 60, 45, 'boucle', 'Cote Est', ST_MakePoint(55.7830, -21.1570)::geography, NULL),
('Takamaka - Belvedere', 'takamaka-belvedere', 'Acces au point de vue sur la vallee encaissee de Takamaka et ses cascades vertigineuses.', 'moyen', 6.0, 400, 150, 'aller-retour', 'Cote Est', ST_MakePoint(55.6050, -21.0950)::geography, NULL),

-- Nord
('La Roche Ecrite', 'la-roche-ecrite', 'Ascension vers le sommet offrant un panorama plongeant sur le cirque de Mafate depuis le nord.', 'difficile', 14.0, 900, 390, 'aller-retour', 'Nord', ST_MakePoint(55.4350, -20.9750)::geography, NULL),
('Sentier de la Providence - Riviere Saint-Denis', 'providence-riviere-st-denis', 'Parcours ombrage le long de la riviere Saint-Denis, oasis de fraicheur pres de la capitale.', 'facile', 4.0, 200, 90, 'aller-retour', 'Nord', ST_MakePoint(55.4480, -20.8850)::geography, NULL),
('Le Colorado - Saint-Denis', 'colorado-st-denis', 'Gorges colorees aux teintes ocre et rouge rappelant le Colorado americain.', 'moyen', 5.5, 350, 150, 'aller-retour', 'Nord', ST_MakePoint(55.4600, -20.9000)::geography, NULL),

-- Hauts de l'Ouest
('Maido - Grand Benare', 'maido-grand-benare', 'Crete spectaculaire entre le Maido et le Grand Benare avec vue sur Mafate et la cote ouest.', 'difficile', 16.0, 950, 420, 'aller-retour', 'Hauts de l''Ouest', ST_MakePoint(55.3450, -21.0700)::geography, NULL),
('Belvedere du Maido', 'belvedere-maido', 'Promenade courte depuis le parking du Maido jusqu''au belvedere surplombant Mafate de 1000 m.', 'facile', 1.0, 30, 20, 'aller-retour', 'Hauts de l''Ouest', ST_MakePoint(55.3460, -21.0680)::geography, NULL),
('Sentier du Maido a Roche Plate (Mafate)', 'maido-roche-plate', 'Descente vertigineuse de 1500 m de denivele dans le cirque de Mafate par le sentier du Maido.', 'expert', 12.0, 300, 360, 'point-a-point', 'Hauts de l''Ouest', ST_MakePoint(55.3460, -21.0680)::geography, ST_MakePoint(55.3950, -21.0520)::geography),
('Dos d''Ane - La Roche Verre Bouteille', 'dos-dane-roche-verre-bouteille', 'Sentier escarpe menant a un promontoire vertigineux au-dessus du cirque de Mafate.', 'difficile', 6.0, 500, 180, 'aller-retour', 'Hauts de l''Ouest', ST_MakePoint(55.3800, -20.9900)::geography, NULL),

-- Hauts du Sud
('Grand Coude - Piton de la Riviere Noire', 'grand-coude-piton-riviere-noire', 'Randonnee isolee dans les hauts du sud vers le point culminant du massif sud-ouest.', 'difficile', 13.0, 1100, 390, 'aller-retour', 'Hauts du Sud', ST_MakePoint(55.5200, -21.2800)::geography, NULL),
('Les Makes - Fenetre des Makes', 'fenetre-des-makes', 'Montee vers la Fenetre des Makes offrant un point de vue unique sur le cirque de Cilaos.', 'moyen', 8.0, 650, 210, 'aller-retour', 'Hauts du Sud', ST_MakePoint(55.4050, -21.1900)::geography, NULL),
('Notre-Dame de la Paix', 'notre-dame-paix', 'Balade champetre dans les paturages d''altitude avec vue sur le massif du Piton des Neiges.', 'facile', 5.0, 200, 100, 'boucle', 'Hauts du Sud', ST_MakePoint(55.5700, -21.2200)::geography, NULL),

-- Hauts du Nord-Est
('Foret de la Plaine d''Affouches', 'foret-plaine-affouches', 'Immersion en foret primaire de moyenne altitude riche en fougeres arborescentes et mousses.', 'moyen', 7.0, 400, 180, 'boucle', 'Hauts du Nord-Est', ST_MakePoint(55.5100, -20.9800)::geography, NULL),
('Sentier de la Riviere du Mat', 'sentier-riviere-du-mat', 'Remontee sauvage de la riviere du Mat a travers gorges profondes et cascades cachees.', 'difficile', 10.0, 700, 300, 'aller-retour', 'Hauts du Nord-Est', ST_MakePoint(55.5400, -21.0200)::geography, NULL),

-- Foret de Bebour-Belouve
('Foret de Belouve - Trou de Fer', 'belouve-trou-de-fer', 'Traversee de la foret primaire de tamarins jusqu''au belvedere vertigineux du Trou de Fer.', 'moyen', 11.0, 450, 270, 'aller-retour', 'Foret de Bebour-Belouve', ST_MakePoint(55.5400, -21.0650)::geography, NULL),
('Sentier botanique de la foret de Bebour', 'sentier-botanique-bebour', 'Sentier amenage de decouverte des especes endemiques dans la foret humide de Bebour.', 'facile', 3.5, 100, 75, 'boucle', 'Foret de Bebour-Belouve', ST_MakePoint(55.5550, -21.0850)::geography, NULL),
('Plateau de Belouve - Gite de Belouve', 'plateau-belouve-gite', 'Randonnee sur le plateau couvert de tamarins des hauts, ambiance mystique sous la brume.', 'facile', 5.0, 200, 105, 'boucle', 'Foret de Bebour-Belouve', ST_MakePoint(55.5350, -21.0600)::geography, NULL),

-- Grand Benare
('Grand Benare depuis le Maido', 'grand-benare-depuis-maido', 'Parcours de crete emblematique vers le troisieme sommet de l''ile avec vue sur les trois cirques.', 'difficile', 18.0, 1050, 480, 'aller-retour', 'Grand Benare', ST_MakePoint(55.3450, -21.0700)::geography, NULL),
('Grand Benare par Cilaos', 'grand-benare-par-cilaos', 'Ascension depuis le cirque de Cilaos par la crete, itineraire peu frequente et sauvage.', 'expert', 20.0, 1800, 600, 'aller-retour', 'Grand Benare', ST_MakePoint(55.4710, -21.1280)::geography, NULL),

-- Riviere des Remparts
('Riviere des Remparts - Ravel a Nez de Boeuf', 'riviere-remparts-ravel-nez-boeuf', 'Remontee integrale de la vallee glaciaire la plus impressionnante de La Reunion.', 'expert', 22.0, 1600, 600, 'point-a-point', 'Riviere des Remparts', ST_MakePoint(55.6100, -21.3200)::geography, ST_MakePoint(55.6350, -21.1950)::geography),
('Belvedere de la Riviere des Remparts', 'belvedere-riviere-remparts', 'Court acces au panorama grandiose sur la vallee encaissee de la Riviere des Remparts.', 'facile', 1.0, 40, 20, 'aller-retour', 'Riviere des Remparts', ST_MakePoint(55.6340, -21.1940)::geography, NULL),
('Ravel - Cascade de la Grande Ravine', 'ravel-cascade-grande-ravine', 'Descente vers la cascade cachee au fond de la vallee des Remparts.', 'moyen', 8.0, 500, 210, 'aller-retour', 'Riviere des Remparts', ST_MakePoint(55.6100, -21.3200)::geography, NULL),

-- Piton des Neiges
('Piton des Neiges depuis Hell-Bourg (Salazie)', 'piton-neiges-hell-bourg', 'Voie classique depuis Salazie avec nuit a la Caverne Dufour, lever de soleil inoubliable au sommet.', 'difficile', 17.0, 1800, 540, 'aller-retour', 'Piton des Neiges', ST_MakePoint(55.5180, -21.0650)::geography, NULL),
('Piton des Neiges depuis Cilaos (Le Bloc)', 'piton-neiges-cilaos-bloc', 'Itineraire le plus direct vers le sommet, pentes raides a travers la vegetation ericoide.', 'difficile', 14.5, 1700, 480, 'aller-retour', 'Piton des Neiges', ST_MakePoint(55.4710, -21.1280)::geography, NULL),
('Piton des Neiges depuis Mare a Boue (Salazie)', 'piton-neiges-mare-a-boue', 'Approche alternative par la foret de cryptomerias, sentier moins frequente et plus sauvage.', 'difficile', 15.0, 1650, 510, 'aller-retour', 'Piton des Neiges', ST_MakePoint(55.5050, -21.0750)::geography, NULL),
('Caverne Dufour - Sommet du Piton des Neiges', 'caverne-dufour-sommet', 'Derniere montee avant l''aube vers le toit de l''ocean Indien a 3071 m, panorama a 360 degres.', 'moyen', 3.5, 480, 90, 'aller-retour', 'Piton des Neiges', ST_MakePoint(55.4850, -21.0900)::geography, NULL),

-- GR R2
('GR R2 - Saint-Denis a La Roche Ecrite', 'gr-r2-st-denis-roche-ecrite', 'Premiere etape du GR R2 quittant la cote pour les sommets, montee soutenue vers le gite.', 'difficile', 18.0, 1800, 540, 'point-a-point', 'Nord', ST_MakePoint(55.4480, -20.8800)::geography, ST_MakePoint(55.4350, -20.9750)::geography),
('GR R2 - Cilaos a Mare a Boue', 'gr-r2-cilaos-mare-a-boue', 'Etape du GR R2 traversant le col entre Cilaos et Salazie par les cretes du Piton des Neiges.', 'expert', 15.0, 1500, 480, 'point-a-point', 'Cirque de Cilaos', ST_MakePoint(55.4710, -21.1280)::geography, ST_MakePoint(55.5050, -21.0750)::geography),
('GR R2 - Plaine des Cafres au Volcan', 'gr-r2-plaine-cafres-volcan', 'Etape mythique du GR R2 traversant la Plaine des Sables jusqu''au Pas de Bellecombe.', 'moyen', 20.0, 800, 420, 'point-a-point', 'Plaine des Cafres', ST_MakePoint(55.5900, -21.1700)::geography, ST_MakePoint(55.6920, -21.2150)::geography);
