CREATE TABLE `passkey` (
  `uid` varchar(16) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `credential` JSON,
  `ctime` INT(11) UNSIGNED,
  `mtime` INT(11) UNSIGNED,
  PRIMARY KEY (`uid`)
);
