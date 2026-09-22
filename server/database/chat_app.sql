-- Table roles
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS chats;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;

CREATE TABLE roles (
  id int NOT NULL AUTO_INCREMENT,
  name enum('ROLE_ADMIN','ROLE_MODERATOR','ROLE_USER') DEFAULT NULL,
  PRIMARY KEY (id)
);
INSERT INTO roles VALUES (1,'ROLE_USER'),(2,'ROLE_ADMIN'),(3,'ROLE_MODERATOR');

-- Table users
CREATE TABLE users (
  id bigint NOT NULL AUTO_INCREMENT,
  email varchar(50) DEFAULT NULL,
  password varchar(120) DEFAULT NULL,
  username varchar(20) DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY UKr43af9ap4edm43mmtq01oddj6 (username),
  UNIQUE KEY UK6dotkott2kjsp8vw4d0m25fb7 (email)
);
-- Passwords: admin -> admin123, user -> password, mod -> password
INSERT INTO users VALUES 
  (1,'admin@gmail.com','$2a$10$fmet506nEU7C9z3StvbvJeRWjTtnxc2ivki8trHnYJYtyKFZFEmVm','admin'),
  (2,'user@gmail.com','$2a$10$hku7gSpx2HsfCaBIN4rX9esNhh3GCTGh7M1E5FV02.K7U4OHRjN5S','user'),
  (3,'mod@gmail.com','$2a$10$hku7gSpx2HsfCaBIN4rX9esNhh3GCTGh7M1E5FV02.K7U4OHRjN5S','mod');

-- Table user_roles
CREATE TABLE user_roles (
  user_id bigint NOT NULL,
  role_id int NOT NULL,
  PRIMARY KEY (user_id,role_id),
  KEY FKh8ciramu9cc9q3qcqiv4ue8a6 (role_id),
  CONSTRAINT FKh8ciramu9cc9q3qcqiv4ue8a6 FOREIGN KEY (role_id) REFERENCES roles (id),
  CONSTRAINT FKhfh9dx7w3ubf1co1vdev94g3f FOREIGN KEY (user_id) REFERENCES users (id)
);
INSERT INTO user_roles VALUES (1,2),(2,1),(3,3);

-- Table chats
CREATE TABLE chats (
  id bigint NOT NULL AUTO_INCREMENT,
  topic varchar(255) DEFAULT NULL,
  type varchar(20) DEFAULT 'TEXT',
  PRIMARY KEY (id)
);
INSERT INTO chats VALUES (1, 'Général', 'TEXT'), (2, 'Développement', 'TEXT'), (3, 'Salon Vocal 1', 'VOICE');

-- Table messages
CREATE TABLE messages (
  id bigint NOT NULL AUTO_INCREMENT,
  content text DEFAULT NULL,
  date datetime DEFAULT CURRENT_TIMESTAMP,
  chat_id bigint DEFAULT NULL,
  user_id bigint DEFAULT NULL,
  message_type varchar(20) DEFAULT 'TEXT',
  media_url varchar(255) DEFAULT NULL,
  duration int DEFAULT NULL,
  PRIMARY KEY (id),
  KEY FK_chat_message (chat_id),
  KEY FK_user_message (user_id),
  CONSTRAINT FK_chat_message FOREIGN KEY (chat_id) REFERENCES chats (id) ON DELETE CASCADE,
  CONSTRAINT FK_user_message FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
);
INSERT INTO messages (content, date, chat_id, user_id, message_type, media_url, duration) VALUES 
  ('Bienvenue sur le salon Général !', NOW(), 1, 1, 'TEXT', NULL, NULL),
  ('Hello tout le monde ! Prêt pour le projet.', NOW(), 1, 2, 'TEXT', NULL, NULL);
