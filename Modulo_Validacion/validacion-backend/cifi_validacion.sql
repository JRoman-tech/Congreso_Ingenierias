CREATE DATABASE  IF NOT EXISTS `cifi_validacion` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `cifi_validacion`;
-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: cifi_validacion
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `historial_validacion`
--

DROP TABLE IF EXISTS `historial_validacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `historial_validacion` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `id_validacion` bigint NOT NULL,
  `estado_anterior` varchar(255) DEFAULT NULL,
  `estado_nuevo` varchar(255) DEFAULT NULL,
  `comentario` varchar(255) DEFAULT NULL,
  `realizado_por` varchar(255) DEFAULT NULL,
  `fecha` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id_validacion` (`id_validacion`),
  CONSTRAINT `historial_validacion_ibfk_1` FOREIGN KEY (`id_validacion`) REFERENCES `validacion` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `historial_validacion`
--

LOCK TABLES `historial_validacion` WRITE;
/*!40000 ALTER TABLE `historial_validacion` DISABLE KEYS */;
INSERT INTO `historial_validacion` VALUES (1,1,'pendiente_academico','aprobado_academico','Datos académicos aprobados','Admin','2026-07-09T16:46:36.387477700'),(2,1,'aprobado_academico','rechazado_academico','Datos académicos rechazados','Admin','2026-07-09T16:46:49.336806400'),(3,1,'rechazado_academico','aprobado_academico','Datos académicos aprobados','Admin','2026-07-10T18:59:15.482911900'),(4,1,'aprobado_academico','pago_no_recibido','Pago no recibido','Admin','2026-07-10T18:59:27.952657400'),(5,1,'pago_no_recibido','validado_completo','Pago verificado — participante validado completamente','Admin','2026-07-10T18:59:34.668290600'),(6,2,'pendiente_academico','aprobado_academico','Datos académicos aprobados','Admin','2026-07-10T19:20:27.702071200'),(7,2,'aprobado_academico','en_correccion_academico','Participante envió corrección','Admin','2026-07-10T19:44:03.417360600'),(8,2,'en_correccion_academico','aprobado_academico','Datos académicos aprobados','Admin','2026-07-10T19:46:58.252178800'),(9,2,'aprobado_academico','validado_completo','Pago verificado — participante validado completamente','Admin','2026-07-10T20:52:56.788171500');
/*!40000 ALTER TABLE `historial_validacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) DEFAULT NULL,
  `correo` varchar(255) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `rol` enum('admin','participante') NOT NULL DEFAULT 'participante',
  `activo` tinyint(1) DEFAULT '1',
  `creado_en` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `correo` (`correo`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'Administrador','admin@cifi.mx','admin123','admin',1,'2026-07-04 09:16:43'),(2,'María García','maria@test.com','pass123','participante',1,'2026-07-04 09:16:43');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `validacion`
--

DROP TABLE IF EXISTS `validacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `validacion` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `actualizado_en` varchar(255) DEFAULT NULL,
  `creado_en` varchar(255) DEFAULT NULL,
  `estado` enum('pendiente_academico','rechazado_academico','en_correccion_academico','aprobado_academico','pendiente_pago','pago_no_recibido','validado_completo') NOT NULL DEFAULT 'pendiente_academico',
  `id_participante` bigint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `validacion`
--

LOCK TABLES `validacion` WRITE;
/*!40000 ALTER TABLE `validacion` DISABLE KEYS */;
INSERT INTO `validacion` VALUES (1,'2026-07-01','2026-06-20','pendiente_academico',1),(2,'2026-07-10T20:52:56.695447300','2026-06-20','validado_completo',2),(3,'2026-06-19','2026-06-18','pendiente_academico',3),(4,'2026-06-17','2026-06-15','pendiente_academico',4),(5,'2026-07-01','2026-07-01','pendiente_academico',2);
/*!40000 ALTER TABLE `validacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `validacion_academica`
--

DROP TABLE IF EXISTS `validacion_academica`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `validacion_academica` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `datos_validos` bit(1) DEFAULT NULL,
  `id_validacion` bigint DEFAULT NULL,
  `observaciones` varchar(255) DEFAULT NULL,
  `palabra_clave1` varchar(255) DEFAULT NULL,
  `palabra_clave2` varchar(255) DEFAULT NULL,
  `palabra_clave3` varchar(255) DEFAULT NULL,
  `palabra_clave4` varchar(255) DEFAULT NULL,
  `palabra_clave5` varchar(255) DEFAULT NULL,
  `resumen` text,
  `revisado_en` varchar(255) DEFAULT NULL,
  `revisado_por` varchar(255) DEFAULT NULL,
  `titulo` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `validacion_academica`
--

LOCK TABLES `validacion_academica` WRITE;
/*!40000 ALTER TABLE `validacion_academica` DISABLE KEYS */;
INSERT INTO `validacion_academica` VALUES (2,_binary '\0',2,'','Atun','Toyota','Nintendo','Barra','Nuez','si','','','Jale');
/*!40000 ALTER TABLE `validacion_academica` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `validacion_pago`
--

DROP TABLE IF EXISTS `validacion_pago`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `validacion_pago` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `comprobante_pago` varchar(255) DEFAULT NULL,
  `estado_pago` enum('pendiente','rechazado','verificado') DEFAULT NULL,
  `fecha_pago` varchar(255) DEFAULT NULL,
  `id_validacion` bigint DEFAULT NULL,
  `monto` double DEFAULT NULL,
  `observaciones` varchar(255) DEFAULT NULL,
  `revisado_en` varchar(255) DEFAULT NULL,
  `revisado_por` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `validacion_pago`
--

LOCK TABLES `validacion_pago` WRITE;
/*!40000 ALTER TABLE `validacion_pago` DISABLE KEYS */;
INSERT INTO `validacion_pago` VALUES (3,'comprobante_2_Esto es un pdf.pdf','pendiente','2026-07-10',2,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `validacion_pago` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-14 17:45:40
