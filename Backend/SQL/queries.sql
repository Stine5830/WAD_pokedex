/* USE [1088434] 

GO 

CREATE TABLE pokPokemon 

( 

    pokPokemonId INT IDENTITY NOT NULL PRIMARY KEY, 

    pokName NVARCHAR(50) NOT NULL, 

    pokAbilities NVARCHAR(255), 

    pokHeight NVARCHAR(50), 

    pokWeight NVARCHAR(50), 

    pokGender NVARCHAR(50) 

) 

 

CREATE TABLE pokType 

( 

    pokTypeId INT IDENTITY NOT NULL PRIMARY KEY, 

    pokTypeName NVARCHAR(255) NOT NULL, 

    pokTypeDescription NVARCHAR(255) 

  ) 

 

CREATE TABLE pokPokemonTypes 

( 

     FK_pokTypeId INT NOT NULL, 

     FK_pokPokemonId INT NOT NULL 

 

CONSTRAINT pokFK_PokemonTypes_Type FOREIGN KEY (FK_pokTypeId) REFERENCES pokType (pokTypeId), 

CONSTRAINT pokFK_PokemonTypes_Pokemon FOREIGN KEY (FK_pokPokemonId) REFERENCES pokPokemon (pokPokemonId) 

) 

 

CREATE TABLE pokRole 

( 

    roleId INT IDENTITY NOT NULL PRIMARY KEY, 

    roleName NVARCHAR(50) NOT NULL, 

    roleDescription NVARCHAR(255) 

) 

 

CREATE TABLE pokUser 

( 

userId INT IDENTITY NOT NULL PRIMARY KEY, 

userName NVARCHAR(50), 

userEmail NVARCHAR(255) NOT NULL, 

FK_roleId INT NOT NULL 

 

CONSTRAINT pokFK_User_Role FOREIGN KEY (FK_roleId) REFERENCES pokRole (roleId) 

) 

 

CREATE TABLE pokPassword 

( 

passwordValue NVARCHAR(255) NOT NULL, 

FK_userId INT NOT NULL 

 

CONSTRAINT pokFK_Password_User FOREIGN KEY (FK_userId) REFERENCES pokUser (userId) 

) 

 

CREATE TABLE pokFavoritPokemon 

( 

FK_userId INT NOT NULL, 

FK_pokPokemonId INT NOT NULL 

 

CONSTRAINT pokFK_FavoritPokemon_User FOREIGN KEY (FK_userId) REFERENCES pokUser (userId), 

CONSTRAINT pokFK_ FavoritPokemon _Pokemon FOREIGN KEY (FK_pokPokemonId) REFERENCES pokPokemon (pokPokemonId) 

) 

GO 

  

INSERT INTO pokRole 

    ([roleName], [roleDescription]) 

VALUES 

    ('admin', 'can do whatever'), 

    ('member', 'can do stuff that is allowed') 

GO 

 

INSERT INTO pokPokemon 

([pokName], [pokAbilities], [pokHeight], [pokWeight], [pokGender]) 

VALUES 

/*GRASS*/ /*('Tangela', 'Chlorophyll, Leaf Guard', '1m', '35kg', 'Male/Female'), 

 /* POISON */ /*('Ekans', 'Shed Skin, Intimidate', '2m', '6,9kg', 'Male/Female'), 

/* FIRE */ /*('Charmander', 'Blaze', '0,6m', '8,5kg', 'Male/Female'), 

/* WATER */ /*('Squirtle', 'Torrent', '0,5m', '9kg', 'Male/Female'), 

/* FLYING */ /*('Pidgey', 'Keen Eye, Tangled Feet', '0,3m', '1,8kg', 'Male/Female'), 

/* BUG */ /*('Caterpie', 'Shield Dust', '0,3m', '2,9kg', 'Male/Female'), 

/* Normal */ /*('Rattata', 'Run away, guts', '0.3m', '3.5 kg', 'Male/Female'), 

/* Electic */ /*('Pikachu', 'Static', '0.4m', '6.0 kg', 'Male/Female'), 

/* Ground */ /*('Diglett', 'Sand veil, arena trap', '0.2 m', '0.8 kg', 'Male/Female'), 

/* Fairy */ /*('Clefairy', 'Cute charm, magic guard', '0.6 m', '7.5 kg', 'Male/Female'), 

/* Fighting */ /*('Machoke', 'Guts, no guard', '1.5 m', '70.5 kg', 'Male/Female'), 

/* PSYCHIC */ /*('Abra', 'Inner Focus, Synchronize', '88.9 cm', '19.5 kg', 'Male/Female'), 

/* ROCK */ /*('Sudowoodo', 'Rock Head, Sturdy', '119.38', '38kg', 'Male/Female' ), 

/* STEEL */ /*('Aron', 'Rock Head, Sturdy', '40.64 cm', '60 kg', 'Male/Female'), 

/* ICE */ /*('Snorunt', 'Inner Focus, Ice Body', '71.12 cm', '17 kg', 'Male/Female'), 

/* GHOST */ /*('Misdreavus', 'Levitate', '71.12 cm', '1kg', 'Male/Female'), 

/* DRAGON */ /*('Dratini', 'Shed Skin', '180.34 cm', '3.3 kg', 'Male/Female'), 

/* DARK */ /*('Umbreon', 'Synchronize', '99.06 cm', '27 kg', 'Male/Female') 

GO 

 

INSERT INTO pokType 

([pokTypeName], [pokTypeDescription]) 

VALUES 

(Grass, This is a grass type pokemon), 

(Poison, This is a poison type pokemon), 

(Fire, This is a fire type pokemon), 

(Water, This is a water type pokemon), 

(Flying, This is a flying type pokemon), 

(Bug, This is a bug type pokemon), 

(Normal, This is a normal type pokemon), 

(Electic, This is a electic type pokemon), 

(Ground, This is a ground type pokemon), 

(Fairy, This is a fairy type pokemon), 

(Fighting, This is a fighting type pokemon), 

(Psychic, This is a psychic type pokemon), 

(Rock, This is a rock type pokemon), 

(Steel, This is a steel type pokemon), 

(Ice, This is a ice type pokemon), 

(Ghost, This is a ghost type pokemon), 

(Dragon, This is a dragon type pokemon), 

(Dark, This is a dark type pokemon) 

GO 

 

INSERT INTO pokPokemonTypes 

([FK_pokTypeId], [FK_pokPokemonId]) 

VALUES 

(1,1), 

(2,2), 

(3,3), 

(4,4), 

(5,5), 

(6,6), 

(7,7), 

(8,8), 

(9,9), 

(10,10), 

(11,11), 

(12,12), 

(13,13), 

(14,14), 

(15,15), 

(16,16), 

(17,17), 

(18,18) 

GO 

 

/* 

USE [1088434] 

GO 

  

INSERT INTO pokUser 

    ([userName], [userEmail], [FK_roleId]) 

VALUES 

    ('admin1', 'admin@login.mail.com', 1) 

GO 

  

INSERT INTO pokPassword 

    ([passwordValue], [FK_userId]) 

VALUES 

    ('$2a$13$vcf4z958Oj2wq.hvS/BvOO8gc2bCkSH3nYgXTIAPLOChmoozcGPHy', 1) 

GO 

*/ 

 

/*{ 

    "userEmail": "kristine@mail.dk", 

    "userPassword": "kristine123", 

    "userName": "kris" 

} 

{ 

    "userEmail": "stine@mail.dk", 

    "userPassword": "stine123", 

    "userName": "stine" 

} 

{ 

    "userEmail": "admin@admin.dk", 

    "userPassword": "adminPokemon", 

    "userName": "admin" 

} 

INSERT INTO pokUser 

([userName], [userEmail], [FK_roleId]) 

VALUES 

('admin123', 'admin123@login.mail.dk', 1) 

GO 

  

INSERT INTO pokPassword 

([passwordValue], [FK_userId]) 

VALUES 

('admin123', 6) 

GO 

*/ 
/*

USE [1088434] 

GO 

 /* set admin til admin 

UPDATE pokUser 

SET FK_roleId = 1 

WHERE 

userId = 5 

GO 

*/ 
