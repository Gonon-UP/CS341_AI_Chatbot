CREATE TABLE pages (
	page_number INT AUTO_INCREMENT,
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
