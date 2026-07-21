# 数据库表结构文档

## 1 发射页面

### 信件主表 (letter)

| 字段         | 类型        | 约束               | 说明                                                         |
| ------------ | ----------- | ------------------ | ------------------------------------------------------------ |
| letter_id    | BIGINT      | PK, AUTO_INCREMENT | 主键                                                         |
| letter_no    | VARCHAR(32) | UNIQUE, NOT NULL   | 对外编号 / 小行星编号（MY / L01 / 小行星#2024-AA12）         |
| sender_id    | BIGINT      | FK → user(user_id) | 寄信人                                                       |
| mode         | TINYINT     | NOT NULL           | 1=寄给自己，2=寄给某人                                       |
| content      | TEXT        | NOT NULL           | 信件正文（≤5000 字）                                         |
| keyword      | VARCHAR(20) | NULL               | 主题关键字（对他人可见）                                     |
| channel_code | TINYINT(4)  | NOT NULL           | 送达渠道编码，0=不需要推送，1=QQ邮箱，2=短信推送，3=牢不可破的誓言 |
| is_public    | TINYINT(1)  | NOT NULL           | 0=公开，1=加密（不进星海）                                   |
| sent_time    | DATETIME    | NOT NULL           | 寄出时间                                                     |
| deliver_time | DATETIME    | NULL               | 预计送达时间                                                 |
| years_offset | INT         | NULL               | 预设年限 1 / 3 / 10                                          |
| status       | TINYINT     | NOT NULL           | 0=编写中，1=旅行中，2=已送达                                 |
| create_time  | DATETIME    | NOT NULL           | 创建时间                                                     |
| delete_time  | DATETIME    | NOT NULL           | 删除时间                                                     |
| decode       | VARCHAR(20) | NULL               | 信件编码                                                     |

### 送达渠道表 (channel)

| 字段          | 类型          | 约束               | 说明                                           |
| ------------- | ------------- | ------------------ | ---------------------------------------------- |
| channel_id    | INT           | PK, AUTO_INCREMENT | 主键id                                         |
| receiver_name | VARCHAR(32)   | NOT NULL           | 收信人昵称                                     |
| coord_id      | INT           | NOT NULL           | 坐标id                                         |
| channel_code  | VARCHAR(32)   | NOT NULL           | 渠道编码（mail/qqmail/sms/unbreakable/launch） |
| price         | DECIMAL(10,2) | NOT NULL           | 渠道价格（9.90 / 0 / 0.99 / 19.90 / 0）        |
| arrive_date   | DATETIME      | NOT NULL           | 预期到达时间                                   |
| create_time   | DATETIME      | NOT NULL           | 创建时间                                       |
| update_time   | DATETIME      | NOT NULL           | 更新时间                                       |
| delete_time   | DATETIME      | NOT NULL           | 删除时间                                       |

### 用户坐标表 (user_coord)

| 字段        | 类型         | 约束                         | 说明                             |
| ----------- | ------------ | ---------------------------- | -------------------------------- |
| coord_id    | BIGINT       | PK, AUTO_INCREMENT           | 坐标 ID                          |
| user_id     | BIGINT       | FK → user(user_id), NOT NULL | 所属用户                         |
| coord_type  | VARCHAR(16)  | NOT NULL                     | phone / email / address / wechat |
| coord_value | VARCHAR(255) | NOT NULL                     | 坐标值                           |
| create_time | DATETIME     | NOT NULL                     | 创建时间                         |
| update_time | DATETIME     | NOT NULL                     | 更新时间                         |
| delete_time | DATETIME     | NOT NULL                     | 删除时间                         |

## 2 星系界面

### 星系表 (galaxy)

| 字段        | 类型         | 约束               | 说明               |
| ----------- | ------------ | ------------------ | ------------------ |
| wander_id   | INT          | PK, AUTO_INCREMENT | 星系ID             |
| wander_name | VARCHAR(16)  | NOT NULL           | 星系名称           |
| wander_desc | VARCHAR(256) | NOT NULL           | 星系说明           |
| start_count | INT          | NOT NULL           | 星星数量（默认10） |
| create_time | DATETIME     | NOT NULL           | 创建时间           |
| update_time | DATETIME     | NOT NULL           | 更新时间           |
| delete_time | DATETIME     | NOT NULL           | 删除时间           |

## 3 信号界面

### 收听列表 (subscription)

| 字段            | 类型     | 约束                         | 说明           |
| --------------- | -------- | ---------------------------- | -------------- |
| subscription_id | INT      | PK, AUTO_INCREMENT           | 记录 ID        |
| my_id           | BIGINT   | FK → user(user_id), NOT NULL | 收听者id       |
| that_id         | BIGINT   | FK → user(user_id), NOT NULL | 被收听的用户id |
| listen_date     | DATETIME | NOT NULL                     | 收听时间       |

### 收听信箱列表 (subscription_letter)

| 字段                   | 类型       | 约束                                         | 说明           |
| ---------------------- | ---------- | -------------------------------------------- | -------------- |
| subscription_letter_id | INT        | PK, AUTO_INCREMENT                           | 收听 ID        |
| subscription_id        | INT        | FK → subscription(subscription_id), NOT NULL | 收听id         |
| letter_id              | INT        | FK → letter(letter_id), NOT NULL             | 被收听的用户id |
| status                 | TINYINT(2) | NOT NULL                                     | 0-未读，1-已读 |

### 小行星图鉴表 (atlas)

| 字段          | 类型         | 约束                             | 说明     |
| ------------- | ------------ | -------------------------------- | -------- |
| atlas_id      | BIGINT       | PK, AUTO_INCREMENT               | 记录 ID  |
| user_id       | BIGINT       | FK → user(user_id), NOT NULL     | 捕获者   |
| asteroid_id   | INT          | FK → asteroid(asteroid_id), NULL | 小行星ID |
| text          | VARCHAR(255) | NULL                             | 寄语文本 |
| captured_time | DATETIME     | NULL                             | 捕获时间 |
| created_time  | DATETIME     | NOT NULL                         | 创建时间 |

### 小行星表 (asteroid)

| 字段          | 类型        | 约束               | 说明                         |
| ------------- | ----------- | ------------------ | ---------------------------- |
| asteroid_id   | INT         | PK, AUTO_INCREMENT | 小行星ID                     |
| asteroid_no   | INT         | NULL               | 小行星编号                   |
| asteroid_name | VARCHAR(64) | NULL               | 小行星名称（Vesta 灶神星 …） |

### 点亮表 (light)

| 字段        | 类型     | 约束                             | 说明           |
| ----------- | -------- | -------------------------------- | -------------- |
| light_id    | INT      | PK, AUTO_INCREMENT               | 点亮 ID        |
| letter_id   | INT      | FK → letter(letter_id), NOT NULL | 被点亮的信件ID |
| user_id     | INT      | FK → user(user_id), NOT NULL     | 点亮人的用户id |
| create_time | datetime | NOT NULL                         | 点亮时间       |

## 4 地球界面

### 用户表 (user)

| 字段            | 类型        | 约束                               | 说明                                                         |
| --------------- | ----------- | ---------------------------------- | ------------------------------------------------------------ |
| user_id         | BIGINT      | PK, AUTO_INCREMENT                 | 用户内部 ID                                                  |
| planet_code     | VARCHAR(32) | UNIQUE, NOT NULL                   | 星球编号，唯一身份标识（EARTH-12345）                        |
| nickname        | VARCHAR(64) | NULL                               | 昵称                                                         |
| planet_type     | INT         | NULL                               | 当前星球类型，0-地球，1-火星，2-金星，3-月球，4-土星，5-天王星，6-海王星，7-冥王 |
| palette_id      | BIGINT      | FK → satellite_palette(palette_id) | 当前配色方案                                                 |
| listeners_count | INT         | NOT NULL                           | 被收听人数（卫星数）                                         |
| created_time    | DATETIME    | NOT NULL                           | 创建时间                                                     |
| updated_time    | DATETIME    | NOT NULL                           | 更新时间                                                     |

### 星球配色表 (palette)

| 字段         | 类型        | 约束               | 说明                              |
| ------------ | ----------- | ------------------ | --------------------------------- |
| palette_id   | BIGINT      | PK, AUTO_INCREMENT | 配色方案 ID                       |
| palette_name | VARCHAR(32) | NOT NULL           | 名称（星云 / 极光 / 暖阳 / 梦幻） |
| colors       | JSON        | NOT NULL           | 颜色数组，如 ["#00e5ff", …]       |
| created_time | DATETIME    | NOT NULL           | 创建时间                          |

### 信件解码表 (letter_decode)

| 字段      | 类型       | 约束                             | 说明                               |
| --------- | ---------- | -------------------------------- | ---------------------------------- |
| decode_id | INT        | PK, AUTO_INCREMENT               | 主键                               |
| letter_id | INT        | FK → letter(letter_id), NOT NULL | 被解码的信件                       |
| my_id     | INT        | FK → user(user_id), NOT NULL     | 解码人的用户ID                     |
| status    | TINYINT(1) | NOT NULL                         | 0-当前信件未解码，1-当前信件已解码 |

### 信号箱子表 (message_box)

| 字段      | 类型       | 约束                             | 说明                             |
| --------- | ---------- | -------------------------------- | -------------------------------- |
| box_id    | INT        | PK, AUTO_INCREMENT               | 信号箱主键                       |
| type      | TINYINT(2) | NOT NULL                         | 信号类型，0-收听，1-点亮，2-解码 |
| my_id     | INT        | FK → user(user_id), NOT NULL     | 收到信号人的用户ID               |
| letter_id | INT        | FK → letter(letter_id), NOT NULL | 信件ID                           |