-- MariaDB dump adapté pour le backend Spring Boot (UrbainAlert)
-- Les données ont été migrées depuis l'ancienne structure relationnelle
-- vers la nouvelle structure simplifiée utilisée par le Backend (User.java et Incident.java).

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `signal_guinee`
--

-- --------------------------------------------------------

--
-- Structure de la table `app_user` (Correspond à User.java)
--

DROP TABLE IF EXISTS `app_user`;
CREATE TABLE `app_user` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `fullname` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `role` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_email` (`email`),
  UNIQUE KEY `UK_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `app_user`
-- (Anciennement 'utilisateur', rôles mis en majuscules 'CITIZEN'/'ADMIN', noms concaténés)
--

INSERT INTO `app_user` (`id`, `fullname`, `email`, `phone`, `password`, `role`) VALUES
(1, 'Bah Hawadane', 'hawadane@gmail.com', '622111111', 'pass123', 'CITIZEN'),
(2, 'Diallo Mamadou', 'mamadou@gmail.com', '622222222', 'pass123', 'CITIZEN'),
(3, 'Camara Aissatou', 'aissatou@gmail.com', '622333333', 'pass123', 'CITIZEN'),
(4, 'Barry Ousmane', 'admin@citycare.com', '622444444', 'admin123', 'ADMIN'),
(5, 'Sow Fatou', 'fatou.admin@gmail.com', '622555555', 'admin456', 'ADMIN');

-- --------------------------------------------------------

--
-- Structure de la table `incident` (Correspond à Incident.java)
--

DROP TABLE IF EXISTS `incident`;
CREATE TABLE `incident` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `type` varchar(255) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `lat` double DEFAULT NULL,
  `lng` double DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `author_email` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `photo_url` text DEFAULT NULL,
  `admin_reply` text DEFAULT NULL,
  `flagged_as_fake` bit(1) DEFAULT b'0',
  `flag_reason` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `incident`
-- (Anciennement 'signalement', avec les données des catégories et zones intégrées)
--

INSERT INTO `incident` (`id`, `type`, `description`, `lat`, `lng`, `location`, `status`, `author_email`, `created_at`, `photo_url`, `admin_reply`, `flagged_as_fake`, `flag_reason`) VALUES
(1, 'Route', 'Un énorme trou bloque la circulation depuis plusieurs jours', 9.6412, -13.5789, 'Hamdallaye, Conakry', 'en cours', 'hawadane@gmail.com', '2026-06-29 15:55:52.000000', 'route1.jpg', 'Dossier transféré au service voirie', b'0', NULL),
(2, 'Eau', 'Le quartier manque d’eau depuis deux jours', 9.6521, -13.566, 'Matoto, Conakry', 'résolu', 'mamadou@gmail.com', '2026-06-29 15:55:52.000000', 'eau1.jpg', 'Problème d’eau réparé', b'0', NULL),
(3, 'Dechets', 'Accumulation importante de déchets au marché local', 9.633, -13.59, 'Hamdallaye, Conakry', 'nouveau', 'aissatou@gmail.com', '2026-06-29 15:55:52.000000', 'dechets1.jpg', NULL, b'0', NULL);

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
