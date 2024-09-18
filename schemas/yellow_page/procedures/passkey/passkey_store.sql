DELIMITER $
DROP PROCEDURE IF EXISTS `passkey_get`$
CREATE PROCEDURE `passkey_get`(
  IN _uid         VARCHAR(200),
  IN _credential JSON
)
BEGIN
  DECLARE _ctime INT(11) UNSIGNED;
  DECLARE _mtime INT(11) UNSIGNED;

  SELECT UNIX_TIMESTAMP() INTO _mtime;
  SELECT _mtime INTO _ctime;

  INSERT INTO passkey VALUES(_uid, _credential, _ctime, _mtime) 
    ON DUPLICATE KEY UPDATE mtime=_mtime, `credential`=_credential;
END$

DELIMITER ;
