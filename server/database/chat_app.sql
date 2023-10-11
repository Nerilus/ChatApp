/* Création de la table `users` */
DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users`(
    `user_id`       integer NOT NULL AUTO_INCREMENT,
    `username` varchar(40),
    `email`    varchar(40),
    `password` varchar(255) NOT NULL,
    `created_at`  datetime DEFAULT NULL,
    `updated_at`  datetime DEFAULT NULL,
    PRIMARY KEY (`user_id`)
    );

/* Insertion d'un utilisateur avec le role admin dans la table `Users`*/
INSERT INTO `users` (`user_id`, `username`, `email`, `password`,`created_at`,`updated_at`) VALUES
    (1, 'Admin', 'Admin@gmail.com', '$2y$10$OgGilVcpTrARPRsrx8YZf.GRCGW3EAugei7htlwYaGDdbROVRY2pu','2023-01-11 14:15:24', '2023-01-11 14:15:24');
INSERT INTO `users` (`user_id`, `username`, `email`, `password`,`created_at`,`updated_at`) VALUES
    (2, 'Romain', 'Romain@gmail.com', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6NCwidXNlcm5hbWUiOiJyb21haW4iLCJleHAiOjE2NzM1MTMyODJ9.ChfOhQ7Q1XSzPlURQX53j_qCBj19Byqr-qrMLSmUNL8','2023-01-12 09:15:24', '2023-01-12 09:15:24');
INSERT INTO `users` (`user_id`, `username`, `email`, `password`,`created_at`,`updated_at`) VALUES
    (3, 'Herby', 'herby@gmail.com', 'herby','2023-01-12 09:15:24', '2023-01-12 09:15:24');
INSERT INTO `users` (`user_id`, `username`, `email`, `password`,`created_at`,`updated_at`) VALUES
    (4, 'Tete', 'tete@gmail.com', 'tete','2023-01-12 09:15:24', '2023-01-12 09:15:24');