

DROP TABLE IF EXISTS respostas;
DROP TABLE IF EXISTS preguntas;

CREATE TABLE preguntas (
    id          INT AUTO_INCREMENT,
    pregunta VARCHAR(500)  NOT NULL,
    imagen   VARCHAR(255)  NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE respostas (
    id          INT AUTO_INCREMENT,
    pregunta_id INT           NOT NULL,
    text        VARCHAR(500)  NOT NULL,
    es_correcta BOOLEAN       NOT NULL DEFAULT FALSE,
    ordre       TINYINT       NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_respostas_pregunta
        FOREIGN KEY (pregunta_id) REFERENCES preguntas(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT uq_pregunta_ordre UNIQUE (pregunta_id, ordre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_respostas_pregunta ON respostas(pregunta_id);


INSERT INTO preguntas (id, pregunta, imagen) VALUES
(1,  'Quina forma i color té el senyal de STOP (R-2)?',                                                  '/img/image_id_1.png'),
(2,  'Quin senyal és el que es mostra a la imatge i què obliga a fer?',                                  '/img/image_id_2.webp'),
(3,  'Què indica aquest senyal circular blanc amb vora vermella i barra horitzontal?',                   '/img/image_id_3.png'),
(4,  'Aquest senyal circular blanc amb dues fletxes vermelles oposades indica...',                       '/img/image_id_4.jpg'),
(5,  'El senyal amb dos cotxes (un vermell i un negre) dins d''un cercle vermell indica...',             '/img/image_id_5.png'),
(6,  'Quina és la taxa màxima d''alcohol en sang (g/l) permesa per a un conductor novell a Espanya?',    '/img/image_id_6.webp'),
(7,  'És obligatori portar el cinturó de seguretat cordat als seients del darrere?',                     '/img/image_id_7.jpg'),
(8,  'Quina distància de seguretat s''ha de mantenir respecte al vehicle del davant?',                   '/img/image_id_8.jpg'),
(9,  'Quants punts té el permís de conduir d''un conductor novell durant el primer any?',                '/img/image_id_9.jpeg'),
(10, 'A quina edat mínima es pot obtenir el permís de conduir tipus B a Espanya?',                       '/img/image_id_10.jpeg'),
(11, 'Què indica un senyal circular blanc amb vora vermella i un número negre a dins (per exemple, 50)?', '/img/image_id_11.jpg'),
(12, 'Quin significat té el senyal circular blau amb vora vermella i una barra vermella diagonal?',       '/img/image_id_12.jpg');


INSERT INTO respostas (id, pregunta_id, text, es_correcta, ordre) VALUES

(1,  1,  'Triangular, blanca amb vora vermella',                          FALSE, 0),
(2,  1,  'Circular, blava amb fletxa blanca',                             FALSE, 1),
(3,  1,  'Octogonal, vermella amb la paraula STOP en blanc',              TRUE,  2),
(4,  1,  'Quadrada, groga amb vora negra',                                FALSE, 3),

(5,  2,  'Prohibit avançar',                                              FALSE, 0),
(6,  2,  'Ceda el pas (R-1): cedir el pas al proper encreuament',         TRUE,  1),
(7,  2,  'Intersecció amb prioritat de pas',                              FALSE, 2),
(8,  2,  'Direcció obligatòria a la dreta',                               FALSE, 3),

(9,  3,  'Velocitat mínima obligatòria',                                  FALSE, 0),
(10, 3,  'Prohibit tocar el clàxon',                                      FALSE, 1),
(11, 3,  'Final de totes les prohibicions',                               FALSE, 2),
(12, 3,  'Direcció prohibida (entrada prohibida en aquell sentit)',       TRUE,  3),

(13, 4,  'Doble sentit de circulació',                                    FALSE, 0),
(14, 4,  'Encreuament de vies',                                           FALSE, 1),
(15, 4,  'Circulació prohibida en ambdós sentits',                        TRUE,  2),
(16, 4,  'Preferència sobre el sentit contrari',                          FALSE, 3),

(17, 5,  'Prohibit estacionar',                                           FALSE, 0),
(18, 5,  'Avançament prohibit',                                           TRUE,  1),
(19, 5,  'Zona d''obres',                                                 FALSE, 2),
(20, 5,  'Carretera amb doble carril',                                    FALSE, 3),

(21, 6,  '1,0 g/l',                                                       FALSE, 0),
(22, 6,  '0,8 g/l',                                                       FALSE, 1),
(23, 6,  '0,5 g/l',                                                       FALSE, 2),
(24, 6,  '0,3 g/l',                                                       TRUE,  3),

(25, 7,  'Només en autopista',                                            FALSE, 0),
(26, 7,  'No és obligatori mai al darrere',                               FALSE, 1),
(27, 7,  'Sí, sempre que el vehicle en disposi',                          TRUE,  2),
(28, 7,  'Només si hi ha menors',                                         FALSE, 3),

(29, 8,  'No hi ha cap norma específica',                                 FALSE, 0),
(30, 8,  'La necessària perquè, si frena, es pugui aturar sense col·lidir', TRUE, 1),
(31, 8,  'Sempre un mínim de 100 metres',                                 FALSE, 2),
(32, 8,  'Només cal en carretera, no en ciutat',                          FALSE, 3),

(33, 9,  '8 punts',                                                       TRUE,  0),
(34, 9,  '12 punts',                                                      FALSE, 1),
(35, 9,  '10 punts',                                                      FALSE, 2),
(36, 9,  '6 punts',                                                       FALSE, 3),

(37, 10, '17 anys',                                                       FALSE, 0),
(38, 10, '18 anys',                                                       TRUE,  1),
(39, 10, '21 anys',                                                       FALSE, 2),
(40, 10, '16 anys',                                                       FALSE, 3),

(41, 11, 'Velocitat mínima recomanada',                                   FALSE, 0),
(42, 11, 'Velocitat màxima permesa en aquest tram (R-301)',               TRUE,  1),
(43, 11, 'Distància de seguretat en metres',                              FALSE, 2),
(44, 11, 'Límit de pes del vehicle en tones',                             FALSE, 3),

(45, 12, 'Parada i estacionament obligatoris',                            FALSE, 0),
(46, 12, 'Zona d''estacionament reservat per a discapacitats',            FALSE, 1),
(47, 12, 'Estacionament prohibit (R-308)',                                TRUE,  2),
(48, 12, 'Final de la zona blava',                                        FALSE, 3);