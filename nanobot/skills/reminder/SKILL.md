---
name: reminder
description: 管理提醒待办任务（增查改删）。当用户请求：(1) 设置提醒/定时任务 (2) 查看/修改/删除现有提醒 (3) 周期性通知或一次性定时提醒 时使用。通过 cron 工具调用调度服务。
---

# 提醒待办操作

使用 `cron` 工具管理提醒任务，自动继承当前会话的 channel 和 chat_id。

## 调度模式

| 模式 | 参数 | 示例 |
|------|------|------|
| 周期性 | `every_seconds` | 每2小时: `every_seconds=7200` |
| Cron | `cron_expr` + `tz` | 每工作日9点: `cron_expr="0 9 * * 1-5", tz="Asia/Shanghai"` |
| 一次性 | `at` | 指定时间: `at="2026-02-24T10:00:00"` |

## 常用 Cron 表达式

```
0 9 * * *       # 每天早上9点
0 9 * * 1-5     # 每工作日早上9点
0 10 * * 1      # 每周一早上10点
0 17 * * 5      # 每周五下午5点
```

## 操作

```python
# 添加
cron(action="add", message="提醒内容", every_seconds=7200)  # 周期
cron(action="add", message="提醒内容", cron_expr="0 9 * * *")  # cron
cron(action="add", message="提醒内容", at="2026-02-24T10:00:00")  # 一次性

# 查询
cron(action="list")

# 删除
cron(action="remove", job_id="xxx")
```

## 时间转换

| 用户说法 | 转换 |
|----------|------|
| "明天早上9点" | 当前日期 +1 天，09:00:00 |
| "30分钟后" | 当前时间 + 1800 秒 |
| "下周一10点" | 计算下周一，10:00:00 |
| "每天8点" | `cron_expr="0 8 * * *"` |

**相对时间需先获取当前时间再计算。**

## 修改策略

采用"先删后增"：查询 → 确认 → 删除原任务 → 创建新任务。

## 模糊匹配删除

用户未提供 ID 时：查询列表 → 按名称匹配 → 唯一匹配则直接删，多个匹配则让用户选择。

## 时区确认

跨时区用户需确认：`Asia/Shanghai`、`America/Vancouver`、`America/New_York` 等。

## 参考

- 工具实现：`nanobot/agent/tools/cron.py`
- 调度服务：`nanobot/cron/service.py`
- CLI：`nanobot cron add/list/remove`
