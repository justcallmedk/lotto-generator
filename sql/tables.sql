CREATE TABLE type (
    id INT NOT NULL auto_increment,
    name VARCHAR(45) NOT NULL,

    PRIMARY KEY(id)
);

CREATE TABLE numbers (
    id INT NOT NULL auto_increment,
    number TINYINT NOT NULL,
    is_ball BIT NOT NULL,
    type_id INT NOT NULL,
    draw_date DATE NOT NULL,

    PRIMARY KEY(id),
    UNIQUE KEY(draw_date,type_id,number,is_pb),
    INDEX(draw_date),
    FOREIGN KEY (type_id)
	    REFERENCES types(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);