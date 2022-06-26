# 不休的音符自制谱库
Mysql DDL:

```sql
CREATE DATABASE spectrum;

CREATE TABLE qrcode (
  id int NOT NULL AUTO_INCREMENT,
  qr_path varchar(256) NOT NULL,
  qr_content varchar(256) NOT NULL,
  song_name varchar(64) NOT NULL,
  song_author varchar(64) DEFAULT NULL,
  song_bpm int DEFAULT NULL,
  spectrum_author varchar(64) DEFAULT NULL,
  sample_video varchar(256) DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY qr_path_UNIQUE (qr_path),
  UNIQUE KEY qr_content_UNIQUE (qr_content)
);

CREATE TABLE difficulty (
  id int NOT NULL AUTO_INCREMENT,
  song_id int NOT NULL,
  song_difficulty int DEFAULT NULL,
  PRIMARY KEY (id),
  KEY id_idx (song_id),
  CONSTRAINT song_id FOREIGN KEY (song_id) REFERENCES qrcode (id)
);
```



Start server:

```bash
node test.js
```

