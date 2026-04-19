CREATE TABLE pages (
	page_number INT AUTO_INCREMENT,
	title VARCHAR(255) NOT NULL,
	PRIMARY KEY (page_number)
) ENGINE=InnoDB;

CREATE TABLE urls (
	page_number INT NOT NULL,
	url_order INT NOT NULL,
	title VARCHAR(255) NOT NULL,
	url VARCHAR(2048) NOT NULL,
	PRIMARY KEY (page_number, url_order),
	FOREIGN KEY (page_number)
		REFERENCES pages(page_number)
		ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE topics (
	page_number INT NOT NULL,
	topic_name VARCHAR(50) NOT NULL,
	PRIMARY KEY (page_number, topic_name),
	FOREIGN KEY (page_number)
		REFERENCES pages(page_number)
		ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE documents (
	document_id INT AUTO_INCREMENT,
	page_number INT NOT NULL,
	file_name VARCHAR(255) NOT NULL,
	original_name VARCHAR(255) NOT NULL,
	file_path VARCHAR(500) NOT NULL,
	file_size INT NOT NULL,
	upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (document_id),
	FOREIGN KEY (page_number)
		REFERENCES pages(page_number)
		ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,

  email VARCHAR(255) NOT NULL UNIQUE,
  email_verified TINYINT(1) NOT NULL DEFAULT 0,

  password_hash VARCHAR(255) DEFAULT NULL,

  verify_code_hash VARCHAR(255) DEFAULT NULL,
  verify_expires_at DATETIME DEFAULT NULL,

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
