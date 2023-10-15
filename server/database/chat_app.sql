-- Table roles
DROP TABLE IF EXISTS roles;
CREATE TABLE roles (
  id int NOT NULL AUTO_INCREMENT,
  name enum('ROLE_ADMIN','ROLE_MODERATOR','ROLE_USER') DEFAULT NULL,
  PRIMARY KEY (id)
);
INSERT INTO roles VALUES (1,'ROLE_USER'),(2,'ROLE_ADMIN'),(3,'ROLE_ADMIN'),(4,'ROLE_MODERATOR');

-- Table users
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id bigint NOT NULL AUTO_INCREMENT,
  email varchar(50) DEFAULT NULL,
  password varchar(120) DEFAULT NULL,
  username varchar(20) DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY UKr43af9ap4edm43mmtq01oddj6 (username),
  UNIQUE KEY UK6dotkott2kjsp8vw4d0m25fb7 (email)
);
INSERT INTO users VALUES (1,'admin@gmail.com','1234','admin'),(3,'mod@gmail.com','$2a$10$K2.G78hliY0C8gP3AWVmyeAwd7eUaMf1J35IV88LTHtpGpJ3eCX5W','mod');

-- Table user_roles
DROP TABLE IF EXISTS user_roles;
CREATE TABLE user_roles (
  user_id bigint NOT NULL,
  role_id int NOT NULL,
  PRIMARY KEY (user_id,role_id),
  KEY FKh8ciramu9cc9q3qcqiv4ue8a6 (role_id),
  CONSTRAINT FKh8ciramu9cc9q3qcqiv4ue8a6 FOREIGN KEY (role_id) REFERENCES roles (id),
  CONSTRAINT FKhfh9dx7w3ubf1co1vdev94g3f FOREIGN KEY (user_id) REFERENCES users (id)
);
INSERT INTO user_roles VALUES (1,1),(3,1),(3,4);
