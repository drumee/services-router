DELIMITER $
DROP PROCEDURE IF EXISTS `passkey_get`$
CREATE PROCEDURE `passkey_get`(
  IN _uid         VARCHAR(200)
)
BEGIN
  SELECT * FROM passkey WHERE `uid`=_uid;
END$

DELIMITER ;
