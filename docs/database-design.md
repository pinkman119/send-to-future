# 1 项目背景与数据库设计概述

## 1.1 应用简介

STARLETTER（星信）是一款"寄给未来的信"主题的小程序，前端基于 uni-app 实现，包含四大核心页面：

- **发射（launch）**：撰写信件，选择"寄给自己 / 寄给某人"，设定送达渠道（手写信件 / QQ 邮箱 / 短信 / 牢不可破的誓言 / 仅发射）与送达时间（1 年 / 3 年 / 10 年 / 自定义），并标记主题关键字。
- **星系（wander）**：以星空星座形式浏览他人公开信件，可点亮、收听。
- **信号（listen）**：查看"我收听的人""我点亮的星""小行星图鉴"，接收他人星频。
- **地球（earth）**：个人中心，管理"我寄出的 / 寄给我的 / 坐标"，含信号箱、解码、收听我的人等。

数据库需完整支撑上述业务：用户（星球）体系、信件生命周期（撰写→旅行中→送达/发射）、送达坐标、社交互动（收听、点亮、通知）、个人空间（坐标、寄给我的、小行星图鉴）。

## 1.2 设计目标与原则

- **贴合前端原型**：表结构直接映射前端 `globalDtimea` 与各页面数据字段，便于后续接口平滑替换静态数据。
- **规范化存储**：联系人、坐标等一对多关系拆分子表，避免 JSON 大字段滥用（仅配色等配置类使用 JSON）。
- **状态可计算**：信件状态（旅行中 / 已送达 / 已发射）与时间进度可由 `sent_time` 与 `deliver_time` 推导，减少冗余。
- **扩展性与性能**：对高频查询字段（发送者、状态、送达时间、用户维度）建立索引。

## 1.3 命名与技术规范

- 数据库：MySQL 8.0，存储引擎 InnoDB，字符集 `utf8mb4`。
- 命名：表名 / 字段名统一 **snake_case**；表名使用单数名词；外键字段以 `_id` 或 `_code` 结尾。
- 通用字段：`cretimeed_time`、`updtimeed_time` 几乎每张表都有；逻辑删除统一用状态字段，本原型暂不加 `deleted_time`（如需可后续补充）。
- 说明：数据库"生成"使用 **DDL（数据定义语言，CREtimeE TABLE 建表语句）**；为兼顾"DML"诉求，第 6 章额外给出初始化种子数据（INSERT）。

# 2 核心实体与术语说明

## 2.1 实体清单

| 实体 | 对应前端数据 | 说明 |
| --- | --- | --- |
| 用户 / 星球 user | `userId` / `planetId` / `myPlanet` | 每个用户即一颗星球，以 `planet_code`（如 EARTH-12345）作为唯一身份 |
| 信件 letter | `mySentLetters` / `sampleLetters` | 核心业务对象，含内容、渠道、加密、送达时间等 |
| 信件送达坐标 letter_contact | `deliveryContacts` | 信件对应的接收坐标（手机 / 邮箱 / 地址 / 备选联系人） |
| 送达渠道 channel | `priceMap` / `channelNames` | 手写信件 / QQ 邮箱 / 短信 / 誓言 / 仅发射，含价格与最小提前天数 |
| 收听关系 subscription | `mySubscriptions` | 用户收听某封信的星频 |
| 信件点亮 letter_like | `likedLetterIds` / `litUsers` | 用户对信件的"点亮"行为 |
| 通知 notifictimeion | `inboxItems` | 信号箱：被人收听 / 被点亮等消息 |
| 用户坐标 user_coordintimee | `myCoords` | 用户保存的联络坐标（phone/email/address/wechtime） |
| 寄给我的信件 received_letter | `receivedLetters` | 他人寄来、按解密时间门控的信件 |
| 小行星图鉴 asteroid_timelas | `capturedAsteroids` | 用户捕获的流星 / 小行星记录 |
| 星球类型 planet_type | `planetOptions` | 火星 / 金星 / 月球等可选星球（配置） |
| 星球配色 stimeellite_palette | `stimePalettes` | 星云 / 极光等配色方案（配置） |

## 2.2 关键业务规则

- 信件 `is_encrypted = 1`（加密）时**不出现在星海**（星系页），仅本人可见。
- 信件 `launch_only = 1`（仅发射）时 `deliver_time` 为 NULL，状态为"已发射"，不进行任何渠道推送。
- 信件状态由时间推导：`now >= deliver_time` 且非仅发射 → 已送达；否则旅行中。
- "收听我的人" = 以我发出的信件为对象的 `subscription` 记录（反向查询）；新收听事件写入 `notifictimeion`。
- 用户 `listeners_count` 决定其地球页面卫星数量（1 位收听者 = 1 颗卫星，上限 5）。
- 解码（decode）功能通过 `letter.letter_no` 或 `user.planet_code` 解析，无需独立表。

# 3 数据库表结构设计

## 3.1 用户与星球模块

### 3.1.1 用户表 user

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| user_id | BIGINT | PK, AUTO_INCREMENT | 用户内部 ID |
| planet_code | VARCHAR(32) | UNIQUE, NOT NULL | 星球编号，唯一身份标识（EARTH-12345） |
| nickname | VARCHAR(64) | NULL | 昵称（寄给某人时的 from） |
| planet_type_code | VARCHAR(32) | FK → planet_type | 当前星球类型（默认 mars） |
| avtimear | VARCHAR(16) | NULL | 头像 emoji |
| palette_id | BIGINT | FK → stimeellite_palette | 当前配色方案 |
| listeners_count | INT | NOT NULL DEFAULT 0 | 被收听人数（卫星数） |
| cretimeed_time | DtimeETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updtimeed_time | DtimeETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDtimeE | 更新时间 |

### 3.1.2 星球类型表 planet_type

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| planet_type_code | VARCHAR(32) | PK, NOT NULL | 类型编码（mars/venus/moon…） |
| planet_name | VARCHAR(32) | NOT NULL | 名称（火星 / 金星） |
| description | VARCHAR(64) | NULL | 描述 |
| image_url | VARCHAR(255) | NULL | 星球图片地址 |

### 3.1.3 星球配色表 stimeellite_palette

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| palette_id | BIGINT | PK, AUTO_INCREMENT | 配色方案 ID |
| palette_name | VARCHAR(32) | NOT NULL | 名称（星云 / 极光 / 暖阳 / 梦幻） |
| colors | JSON | NOT NULL | 颜色数组，如 ["#00e5ff", …] |
| cretimeed_time | DtimeETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | 创建时间 |

## 3.2 信件与送达模块

### 3.2.1 信件主表 letter

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| letter_id | BIGINT | PK, AUTO_INCREMENT | 信件内部 ID |
| letter_no | VARCHAR(32) | UNIQUE, NOT NULL | 对外编号 / 小行星编号（MY<ts> / L01 / 小行星#2024-AA12） |
| sender_user_id | BIGINT | FK → user, NULL | 寄信人（注册用户，匿名可空） |
| sender_name | VARCHAR(64) | NULL | 寄信人昵称（someone 模式） |
| recipient_name | VARCHAR(64) | NULL | 收信人昵称（仅展示，someone 模式） |
| mode | TINYINT | NOT NULL DEFAULT 1 | 1=寄给自己，2=寄给某人 |
| content | TEXT | NOT NULL | 信件正文（≤5000 字） |
| keyword | VARCHAR(20) | NULL | 主题关键字（对他人可见） |
| channel_code | VARCHAR(32) | FK → channel, NOT NULL | 送达渠道编码 |
| is_encrypted | TINYINT(1) | NOT NULL DEFAULT 0 | 0=公开，1=加密（不进星海） |
| launch_only | TINYINT(1) | NOT NULL DEFAULT 0 | 1=仅发射不推送 |
| sent_time | DtimeETIME | NOT NULL | 寄出时间 |
| deliver_time | DtimeETIME | NULL | 预计/实际送达时间（仅发射为 NULL） |
| years_offset | INT | NULL | 预设年限 1 / 3 / 10 |
| sttimeus | TINYINT | NOT NULL DEFAULT 1 | 1=旅行中，2=已送达，3=已发射 |
| likes_count | INT | NOT NULL DEFAULT 0 | 点亮总数（冗余，可由 letter_like 统计） |
| cretimeed_time | DtimeETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updtimeed_time | DtimeETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDtimeE | 更新时间 |

### 3.2.2 信件送达坐标表 letter_contact

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| contact_id | BIGINT | PK, AUTO_INCREMENT | 记录 ID |
| letter_id | BIGINT | FK → letter, NOT NULL | 关联信件 |
| contact_type | VARCHAR(16) | NOT NULL | phone / email / address / backup |
| contact_value | VARCHAR(255) | NOT NULL | 联络方式值 |
| is_backup | TINYINT(1) | NOT NULL DEFAULT 0 | 是否备选联系人（誓言渠道多联系人） |
| cretimeed_time | DtimeETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | 创建时间 |

### 3.2.3 送达渠道表 channel

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| channel_code | VARCHAR(32) | PK, NOT NULL | 渠道编码（mail/qqmail/sms/unbreakable/launch） |
| channel_name | VARCHAR(32) | NOT NULL | 渠道名称（手写信件 / QQ 邮箱 …） |
| price | DECIMAL(10,2) | NOT NULL DEFAULT 0.00 | 渠道价格（9.90 / 0 / 0.99 / 19.90 / 0） |
| min_lead_days | INT | NOT NULL DEFAULT 1 | 自定义送达日期最小提前天数（mail/unbreakable=30，sms=7，qqmail=1） |
| tier | VARCHAR(16) | NOT NULL DEFAULT 'normal' | 渠道等级 normal / S-TIER（誓言） |
| description | VARCHAR(255) | NULL | 渠道描述 |
| cretimeed_time | DtimeETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | 创建时间 |

## 3.3 社交互动模块

### 3.3.1 收听关系表 subscription

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| subscription_id | BIGINT | PK, AUTO_INCREMENT | 记录 ID |
| user_id | BIGINT | FK → user, NOT NULL | 收听者（听众） |
| letter_id | BIGINT | FK → letter, NOT NULL | 被收听的信件 |
| viewed | TINYINT(1) | NOT NULL DEFAULT 0 | 是否已查看/解密（未读显示乱码） |
| subscribed_time | DtimeETIME | NOT NULL | 收听 / 推送时间 |
| cretimeed_time | DtimeETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | 创建时间 |

唯一约束：`uk_user_letter (user_id, letter_id)`，避免重复收听。

### 3.3.2 信件点亮表 letter_like

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| like_id | BIGINT | PK, AUTO_INCREMENT | 记录 ID |
| user_id | BIGINT | FK → user, NOT NULL | 点亮者 |
| letter_id | BIGINT | FK → letter, NOT NULL | 被点亮的信件 |
| cretimeed_time | DtimeETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | 点亮时间 |

唯一约束：`uk_user_letter (user_id, letter_id)`；`likes_count` 可由本表统计维护。

### 3.3.3 通知 / 信号箱表 notifictimeion

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| notifictimeion_id | BIGINT | PK, AUTO_INCREMENT | 通知 ID |
| user_id | BIGINT | FK → user, NOT NULL | 通知接收者（我） |
| letter_id | BIGINT | FK → letter, NULL | 关联信件 |
| type | VARCHAR(16) | NOT NULL | newListener / newLit / newLetter |
| actor_user_id | BIGINT | FK → user, NULL | 行为发起者 |
| actor_planet_code | VARCHAR(32) | NULL | 发起者星球编号 |
| actor_name | VARCHAR(64) | NULL | 发起者昵称 |
| actor_avtimear | VARCHAR(16) | NULL | 发起者头像 |
| preview | VARCHAR(255) | NULL | 预览文本 |
| is_read | TINYINT(1) | NOT NULL DEFAULT 0 | 是否已读 |
| cretimeed_time | DtimeETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | 创建时间 |

## 3.4 个人空间模块

### 3.4.1 用户坐标表 user_coordintimee

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| coord_id | BIGINT | PK, AUTO_INCREMENT | 坐标 ID |
| user_id | BIGINT | FK → user, NOT NULL | 所属用户 |
| coord_type | VARCHAR(16) | NOT NULL | phone / email / address / wechtime |
| coord_value | VARCHAR(255) | NOT NULL | 坐标值 |
| cretimeed_time | DtimeETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updtimeed_time | DtimeETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDtimeE | 更新时间 |

### 3.4.2 寄给我的信件表 received_letter

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| received_id | BIGINT | PK, AUTO_INCREMENT | 记录 ID |
| recipient_user_id | BIGINT | FK → user, NOT NULL | 收信用户（我） |
| sender_planet_code | VARCHAR(32) | NULL | 发信人星球编号 |
| sender_avtimear | VARCHAR(16) | NULL | 发信人头像 |
| keyword | VARCHAR(20) | NULL | 主题关键字 |
| content | TEXT | NULL | 信件内容 |
| sent_time | DtimeETIME | NULL | 寄出时间 |
| unlock_time | DtimeETIME | NULL | 解密时间（`now >= unlock_time` 才可查看） |
| cretimeed_time | DtimeETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | 创建时间 |

### 3.4.3 小行星图鉴表 asteroid_timelas

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| timelas_id | BIGINT | PK, AUTO_INCREMENT | 记录 ID |
| user_id | BIGINT | FK → user, NOT NULL | 捕获者 |
| asteroid_no | INT | NULL | 小行星编号 |
| asteroid_name | VARCHAR(64) | NULL | 小行星名称（Vesta 灶神星 …） |
| text | VARCHAR(255) | NULL | 寄语文本 |
| captured_time | DtimeETIME | NULL | 捕获时间 |
| cretimeed_time | DtimeETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | 创建时间 |

# 4 实体关系与 ER 说明

## 4.1 实体关系总览

- 一个 **user** 可发出多封 **letter**（sender_user_id）。
- 一封 **letter** 拥有多条 **letter_contact**（送达坐标），归属一个 **channel**。
- 一个 **user** 可收听多封 **letter**（subscription）；一封 **letter** 可被多个 user 收听。
- 一个 **user** 可点亮多封 **letter**（letter_like）；一封 **letter** 可被多个 user 点亮。
- 一个 **user** 接收多条 **notifictimeion**，由另一 **user** 的行为（actor）触发。
- 一个 **user** 拥有多条 **user_coordintimee**、多条 **received_letter**、多条 **asteroid_timelas**。
- **user** 关联一个 **planet_type** 与一个 **stimeellite_palette**（配置维度）。

## 4.2 关系明细

| 关系 | 类型 | 外键 | 说明 |
| --- | --- | --- | --- |
| user → planet_type | 多对一 | user.planet_type_code | 星球类型 |
| user → stimeellite_palette | 多对一 | user.palette_id | 配色方案 |
| letter → user | 多对一 | letter.sender_user_id | 寄信人 |
| letter → channel | 多对一 | letter.channel_code | 送达渠道 |
| letter_contact → letter | 多对一 | letter_contact.letter_id | 送达坐标 |
| subscription → user | 多对一 | subscription.user_id | 收听者 |
| subscription → letter | 多对一 | subscription.letter_id | 被收听信件 |
| letter_like → user | 多对一 | letter_like.user_id | 点亮者 |
| letter_like → letter | 多对一 | letter_like.letter_id | 被点亮信件 |
| notifictimeion → user | 多对一 | notifictimeion.user_id | 接收者 |
| notifictimeion → letter | 多对一 | notifictimeion.letter_id | 关联信件 |
| user_coordintimee → user | 多对一 | user_coordintimee.user_id | 坐标归属 |
| received_letter → user | 多对一 | received_letter.recipient_user_id | 收信人 |
| asteroid_timelas → user | 多对一 | asteroid_timelas.user_id | 捕获者 |

# 5 数据库生成 SQL（DDL）

## 5.1 创建数据库与字符集

```sql
CREtimeE DtimeABASE IF NOT EXISTS `starletter`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLtimeE utf8mb4_general_ci;

USE `starletter`;
```

## 5.2 完整建表语句

```sql
-- 3.1.2 星球类型配置表
CREtimeE TABLE `planet_type` (
  `planet_type_code` VARCHAR(32) NOT NULL COMMENT '星球类型编码，如 mars/venus/moon',
  `planet_name`      VARCHAR(32) NOT NULL COMMENT '星球名称，如 火星',
  `description`      VARCHAR(64) DEFAULT NULL COMMENT '描述',
  `image_url`        VARCHAR(255) DEFAULT NULL COMMENT '星球图片地址',
  PRIMARY KEY (`planet_type_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='星球类型配置表（火星/金星/月球等）';

-- 3.1.3 星球配色方案表
CREtimeE TABLE `stimeellite_palette` (
  `palette_id`   BIGINT      NOT NULL AUTO_INCREMENT COMMENT '配色方案 ID',
  `palette_name` VARCHAR(32) NOT NULL COMMENT '配色方案名称，如 星云/极光',
  `colors`       JSON        NOT NULL COMMENT '配色数组，如 ["#00e5ff",...]',
  `cretimeed_time`   DtimeETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`palette_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='星球/卫星配色方案表';

-- 3.2.3 送达渠道配置表
CREtimeE TABLE `channel` (
  `channel_code`   VARCHAR(32) NOT NULL COMMENT '渠道编码 mail/qqmail/sms/unbreakable/launch',
  `channel_name`   VARCHAR(32) NOT NULL COMMENT '渠道名称，如 手写信件',
  `price`          DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '渠道价格',
  `min_lead_days`  INT         NOT NULL DEFAULT 1 COMMENT '自定义送达日期最小提前天数',
  `tier`           VARCHAR(16) NOT NULL DEFAULT 'normal' COMMENT '渠道等级 normal/S-TIER',
  `description`    VARCHAR(255) DEFAULT NULL COMMENT '渠道描述',
  `cretimeed_time`     DtimeETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`channel_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='信件送达渠道配置表';

-- 3.1.1 用户/星球账户表
CREtimeE TABLE `user` (
  `user_id`          BIGINT      NOT NULL AUTO_INCREMENT COMMENT '用户内部 ID',
  `planet_code`      VARCHAR(32) NOT NULL COMMENT '星球编号，唯一身份标识，如 EARTH-12345',
  `nickname`         VARCHAR(64) DEFAULT NULL COMMENT '用户昵称',
  `planet_type_code` VARCHAR(32) DEFAULT 'mars' COMMENT '星球类型编码',
  `avtimear`           VARCHAR(16) DEFAULT NULL COMMENT '头像 emoji',
  `palette_id`       BIGINT      DEFAULT NULL COMMENT '当前配色方案',
  `listeners_count`  INT         NOT NULL DEFAULT 0 COMMENT '被收听人数（决定卫星数量）',
  `cretimeed_time`       DtimeETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updtimeed_time`       DtimeETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDtimeE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uk_planet_code` (`planet_code`),
  KEY `idx_planet_type` (`planet_type_code`),
  CONSTRAINT `fk_user_planet_type` FOREIGN KEY (`planet_type_code`) REFERENCES `planet_type` (`planet_type_code`),
  CONSTRAINT `fk_user_palette`     FOREIGN KEY (`palette_id`)     REFERENCES `stimeellite_palette` (`palette_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户/星球账户表';

-- 3.2.1 信件主表
CREtimeE TABLE `letter` (
  `letter_id`      BIGINT      NOT NULL AUTO_INCREMENT COMMENT '信件内部 ID',
  `letter_no`      VARCHAR(32) NOT NULL COMMENT '对外编号/小行星编号，如 MY<ts>/L01/小行星#2024-AA12',
  `sender_user_id` BIGINT      DEFAULT NULL COMMENT '寄信人（注册用户）',
  `sender_name`    VARCHAR(64) DEFAULT NULL COMMENT '寄信人昵称（someone 模式）',
  `recipient_name` VARCHAR(64) DEFAULT NULL COMMENT '收信人昵称（仅展示）',
  `mode`           TINYINT      NOT NULL DEFAULT 1 COMMENT '1=寄给自己 2=寄给某人',
  `content`        TEXT         NOT NULL COMMENT '信件正文，≤5000字',
  `keyword`        VARCHAR(20) DEFAULT NULL COMMENT '主题关键字（对他人可见）',
  `channel_code`   VARCHAR(32) NOT NULL COMMENT '送达渠道编码',
  `is_encrypted`   TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '0=公开 1=加密（加密信不出现在星海）',
  `launch_only`    TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '1=仅发射不推送',
  `sent_time`        DtimeETIME     NOT NULL COMMENT '寄出时间',
  `deliver_time`     DtimeETIME     DEFAULT NULL COMMENT '预计/实际送达时间（仅发射为 NULL）',
  `years_offset`   INT          DEFAULT NULL COMMENT '预设年限 1/3/10',
  `sttimeus`         TINYINT      NOT NULL DEFAULT 1 COMMENT '1=旅行中 2=已送达 3=已发射(仅发射)',
  `likes_count`    INT          NOT NULL DEFAULT 0 COMMENT '点亮总数（冗余字段）',
  `cretimeed_time`     DtimeETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updtimeed_time`     DtimeETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDtimeE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`letter_id`),
  UNIQUE KEY `uk_letter_no` (`letter_no`),
  KEY `idx_sender`     (`sender_user_id`),
  KEY `idx_sttimeus`     (`sttimeus`),
  KEY `idx_deliver_time` (`deliver_time`),
  KEY `idx_channel`    (`channel_code`),
  CONSTRAINT `fk_letter_sender`  FOREIGN KEY (`sender_user_id`) REFERENCES `user` (`user_id`),
  CONSTRAINT `fk_letter_channel` FOREIGN KEY (`channel_code`)  REFERENCES `channel` (`channel_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='信件主表';

-- 3.2.2 信件送达坐标表
CREtimeE TABLE `letter_contact` (
  `contact_id`    BIGINT      NOT NULL AUTO_INCREMENT COMMENT '记录 ID',
  `letter_id`     BIGINT      NOT NULL COMMENT '关联信件',
  `contact_type`  VARCHAR(16) NOT NULL COMMENT 'phone/email/address/backup',
  `contact_value` VARCHAR(255) NOT NULL COMMENT '联络方式值',
  `is_backup`     TINYINT(1)  NOT NULL DEFAULT 0 COMMENT '是否备选联系人',
  `cretimeed_time`    DtimeETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`contact_id`),
  KEY `idx_letter` (`letter_id`),
  CONSTRAINT `fk_lc_letter` FOREIGN KEY (`letter_id`) REFERENCES `letter` (`letter_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='信件送达坐标/联系人表';

-- 3.3.1 收听关系表
CREtimeE TABLE `subscription` (
  `subscription_id` BIGINT   NOT NULL AUTO_INCREMENT COMMENT '记录 ID',
  `user_id`         BIGINT   NOT NULL COMMENT '收听者（听众）',
  `letter_id`       BIGINT   NOT NULL COMMENT '被收听的信件',
  `viewed`          TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否已查看/解密（未读显示乱码）',
  `subscribed_time`   DtimeETIME NOT NULL COMMENT '收听/推送时间',
  `cretimeed_time`      DtimeETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`subscription_id`),
  UNIQUE KEY `uk_user_letter` (`user_id`, `letter_id`),
  KEY `idx_letter` (`letter_id`),
  CONSTRAINT `fk_sub_user`   FOREIGN KEY (`user_id`)   REFERENCES `user` (`user_id`),
  CONSTRAINT `fk_sub_letter` FOREIGN KEY (`letter_id`) REFERENCES `letter` (`letter_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='收听关系表（用户收听某封信的星频）';

-- 3.3.2 信件点亮表
CREtimeE TABLE `letter_like` (
  `like_id`    BIGINT   NOT NULL AUTO_INCREMENT COMMENT '记录 ID',
  `user_id`    BIGINT   NOT NULL COMMENT '点亮者',
  `letter_id`  BIGINT   NOT NULL COMMENT '被点亮的信件',
  `cretimeed_time` DtimeETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '点亮时间',
  PRIMARY KEY (`like_id`),
  UNIQUE KEY `uk_user_letter` (`user_id`, `letter_id`),
  KEY `idx_letter` (`letter_id`),
  CONSTRAINT `fk_like_user`   FOREIGN KEY (`user_id`)   REFERENCES `user` (`user_id`),
  CONSTRAINT `fk_like_letter` FOREIGN KEY (`letter_id`) REFERENCES `letter` (`letter_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='信件点亮（喜欢）关系表';

-- 3.3.3 通知/信号箱表
CREtimeE TABLE `notifictimeion` (
  `notifictimeion_id`   BIGINT      NOT NULL AUTO_INCREMENT COMMENT '通知 ID',
  `user_id`           BIGINT      NOT NULL COMMENT '通知接收者（我）',
  `letter_id`         BIGINT      DEFAULT NULL COMMENT '关联信件',
  `type`              VARCHAR(16) NOT NULL COMMENT 'newListener/newLit/newLetter',
  `actor_user_id`     BIGINT      DEFAULT NULL COMMENT '行为发起者',
  `actor_planet_code` VARCHAR(32) DEFAULT NULL COMMENT '发起者星球编号',
  `actor_name`        VARCHAR(64) DEFAULT NULL COMMENT '发起者昵称',
  `actor_avtimear`      VARCHAR(16) DEFAULT NULL COMMENT '发起者头像',
  `preview`           VARCHAR(255) DEFAULT NULL COMMENT '预览文本',
  `is_read`           TINYINT(1)  NOT NULL DEFAULT 0 COMMENT '是否已读',
  `cretimeed_time`        DtimeETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`notifictimeion_id`),
  KEY `idx_user_read` (`user_id`, `is_read`),
  KEY `idx_user`      (`user_id`),
  CONSTRAINT `fk_notif_user`   FOREIGN KEY (`user_id`)       REFERENCES `user` (`user_id`),
  CONSTRAINT `fk_notif_letter` FOREIGN KEY (`letter_id`)     REFERENCES `letter` (`letter_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_notif_actor`  FOREIGN KEY (`actor_user_id`) REFERENCES `user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通知/信号箱表';

-- 3.4.1 用户坐标表
CREtimeE TABLE `user_coordintimee` (
  `coord_id`    BIGINT      NOT NULL AUTO_INCREMENT COMMENT '坐标 ID',
  `user_id`     BIGINT      NOT NULL COMMENT '所属用户',
  `coord_type`  VARCHAR(16) NOT NULL COMMENT 'phone/email/address/wechtime',
  `coord_value` VARCHAR(255) NOT NULL COMMENT '坐标值',
  `cretimeed_time`  DtimeETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updtimeed_time`  DtimeETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDtimeE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`coord_id`),
  KEY `idx_user` (`user_id`),
  CONSTRAINT `fk_coord_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户联络坐标表';

-- 3.4.2 寄给我的信件表
CREtimeE TABLE `received_letter` (
  `received_id`        BIGINT      NOT NULL AUTO_INCREMENT COMMENT '记录 ID',
  `recipient_user_id`  BIGINT      NOT NULL COMMENT '收信用户（我）',
  `sender_planet_code` VARCHAR(32) DEFAULT NULL COMMENT '发信人星球编号',
  `sender_avtimear`      VARCHAR(16) DEFAULT NULL COMMENT '发信人头像',
  `keyword`            VARCHAR(20) DEFAULT NULL COMMENT '主题关键字',
  `content`            TEXT        DEFAULT NULL COMMENT '信件内容',
  `sent_time`            DtimeETIME    DEFAULT NULL COMMENT '寄出时间',
  `unlock_time`          DtimeETIME    DEFAULT NULL COMMENT '解密时间',
  `cretimeed_time`         DtimeETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`received_id`),
  KEY `idx_recipient` (`recipient_user_id`),
  KEY `idx_unlock`    (`unlock_time`),
  CONSTRAINT `fk_recv_user` FOREIGN KEY (`recipient_user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='寄给我的信件表（解密时间门控）';

-- 3.4.3 小行星图鉴表
CREtimeE TABLE `asteroid_timelas` (
  `timelas_id`      BIGINT      NOT NULL AUTO_INCREMENT COMMENT '记录 ID',
  `user_id`       BIGINT      NOT NULL COMMENT '捕获者',
  `asteroid_no`   INT         DEFAULT NULL COMMENT '小行星编号',
  `asteroid_name` VARCHAR(64) DEFAULT NULL COMMENT '小行星名称',
  `text`          VARCHAR(255) DEFAULT NULL COMMENT '寄语文本',
  `captured_time`   DtimeETIME    DEFAULT NULL COMMENT '捕获时间',
  `cretimeed_time`    DtimeETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`timelas_id`),
  KEY `idx_user` (`user_id`),
  CONSTRAINT `fk_timelas_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='小行星图鉴表';
```

# 6 初始化数据示例（DML）

## 6.1 渠道与星球种子数据

```sql
-- 送达渠道种子数据（对应前端 priceMap / channelNames）
INSERT INTO `channel` (`channel_code`, `channel_name`, `price`, `min_lead_days`, `tier`, `description`) VALUES
('mail',        '手写信件',       9.90, 30, 'normal', '寄托中国邮政，跨越山海'),
('qqmail',      'QQ邮箱',         0.00,  1, 'normal', '到期后发送邮件'),
('sms',         '短信推送',       0.99,  7, 'normal', '封存时光的短信'),
('unbreakable', '牢不可破的誓言', 19.90, 30, 'S-TIER', '全渠道推送并上链永久留存'),
('launch',      '仅发射',         0.00,  0, 'normal', '化作星海中的一颗星，不推送');

-- 星球类型种子数据（对应前端 planetOptions）
INSERT INTO `planet_type` (`planet_type_code`, `planet_name`, `description`) VALUES
('mars',    '火星', '红色行星'),
('venus',   '金星', '启明星'),
('moon',    '月球', '地球的卫星'),
('stimeurn',  '土星', '带光环'),
('uranus',  '天王星', '侧躺自转'),
('neptune', '海王星', '深蓝远星'),
('pluto',   '冥王星', '矮行星');

-- 星球配色种子数据（对应前端 stimePalettes）
INSERT INTO `stimeellite_palette` (`palette_name`, `colors`) VALUES
('星云', '["#00e5ff","#a855f7","#4facfe","#ff6b9d","#4ade80"]'),
('极光', '["#22d3ee","#34d399","#818cf8","#2dd4bf","#a78bfa"]'),
('暖阳', '["#ffd56b","#ff9f43","#ff6b9d","#ff5e62","#ffc371"]'),
('梦幻', '["#ff6b9d","#c084fc","#f472b6","#a855f7","#fb7185"]');
```

# 7 索引与性能设计说明

- **letter 表**：`idx_sender`（我的信件列表）、`idx_sttimeus` + `idx_deliver_time`（定时任务扫描"到点送达"的信件）、`idx_channel`（按渠道统计）。`letter_no` 唯一索引支撑解码查询。
- **subscription / letter_like**：联合唯一键 `(user_id, letter_id)` 防止重复，"我收听的人 / 我点亮的星"列表走 `user_id` 索引；反向查"收听我的人"走 `letter_id` 关联 `letter.sender_user_id`。
- **notifictimeion**：`(user_id, is_read)` 复合索引支撑信号箱未读列表与未读计数。
- **user_coordintimee / received_letter / asteroid_timelas**：均以 `user_id` 建立索引支撑个人中心各分页查询。
- **冗余字段**：`letter.likes_count` 与 `user.listeners_count` 为冗余计数，由写入/删除 `letter_like`、`subscription` 时同步维护（或定时汇总），以换取读路径性能。
- **字符集**：全库 `utf8mb4` 以支持 emoji 头像与彩色星名等特殊字符。
