# Zografa SOP Master Index

ТОВА Е ЕДИНСТВЕНИЯТ ИЗТОЧНИК НА ИСТИНА.
Таблицата по-долу съдържа връзки към официалните одобрени процедури (както във версия за хора, така и за AI Агенти).

## Отдел: Търговски (Sales)

| Код | Име на процедурата | Версия за Хора (Playbook) | Версия за AI (Agent) | Статус |
| --- | --- | --- | --- | --- |
| **SOP_SALE_001** | Оценка и Обработка на Запитвания | [Human_Doc](./Human_Playbooks/Sales/SOP_SALE_001_Оценка_и_Обработка_Запитвания.md) · [MAP](./Human_Playbooks/Sales/SOP_SALE_001_MAP.md) | [Agent_Logic](./AI_Agents/Sales/AGENT_SALE_001_Inquiry_Filter.md) | Active — v2.0 |
| **TMP_SALE_001A** | Въпросник — Наръчник и Чеклист | [Merged in SOP_SALE_001] | N/A | Deprecated |
| **TMP_SALE_001B** | Шаблонни Имейли (Снипети) | [Merged in SOP_SALE_001] | N/A | Deprecated |
| **TMP_SALE_001C** | Задание към Проектант (Скала 1–6, 3 пътеки) | [Human_Doc](./Templates/Sales/TEMPLATE_SALE_001C_Задание_Към_Проектант.md) | N/A | Active — v2.0 |

## Отдел: Логистика (LOG)

| Код | Име на процедурата | Версия за Хора (Playbook) | Версия за AI (Agent) | Статус |
| --- | --- | --- | --- | --- |
| **SOP_LOG_001** | Управление на Логистика, Доставка и Монтаж | [Human_Doc](./Human_Playbooks/Logistics/SOP_LOG_001_Управление_Логистика_Доставка_Монтаж.md) · [MAP](./Human_Playbooks/Logistics/SOP_LOG_001_MAP.md) | [Agent_Logic](./AI_Agents/Logistics/AGENT_LOG_001_Logistics_Delivery_Mount.md) | Active |
| **TMP_LOG_001A** | Въпросник Офериране — Доставка и Монтаж (Темплейт) | [Human_Doc](./Templates/Logistics/TEMPLATE_LOG_001A_Въпросник_Офериране_Доставка_Монтаж.md) | N/A | Active |
| **TMP_LOG_001B** | Декларация за Доставка и Монтаж — 48ч (Темплейт) | [Human_Doc](./Templates/Logistics/TEMPLATE_LOG_001B_Декларация_Доставка_Монтаж.md) | N/A | Active |
| **TMP_LOG_001C** | Условия за Доставка (Темплейт) | [Human_Doc](./Templates/Logistics/TEMPLATE_LOG_001C_Условия_Доставка.md) | N/A | Active |
| **TMP_LOG_001D** | Декларация за Доставка — 48ч (Темплейт) | [Human_Doc](./Templates/Logistics/TEMPLATE_LOG_001D_Декларация_Доставка.md) | N/A | Active |

## Отдел: Рекламации (REK)

| Код | Име на процедурата | Версия за Хора (Playbook) | Версия за AI (Agent) | Статус |
| --- | --- | --- | --- | --- |
| **SOP_REK_001** | Приемане и Обработка на Рекламации | [Human_Doc](./Human_Playbooks/REK/SOP_REK_001_Приемане_и_Обработка_Рекламации.md) · [MAP](./Human_Playbooks/REK/SOP_REK_001_MAP.md) | [Agent_Logic](./AI_Agents/REK/AGENT_REK_001_Complaint_Filter.md) | Active |
| **TMP_REK_001A** | Протокол за решение на комисия (Форма) | [Human_Doc](./Templates/REK/TEMPLATE_REK_001A_Протокол_Комисия.md) | N/A | Active |
| **TMP_REK_001B** | Имейли — Рекламации (Темплейт) | [Human_Doc](./Templates/REK/TEMPLATE_REK_001B_Имейли.md) | N/A | Active |

---

## Конвенции за именуване

| Елемент | Конвенция | Пример |
|---------|-----------|--------|
| Код на документа (в хедър) | `TMP_[DEPT]_[NNN][суфикс]` | `TMP_SALE_001A` |
| Файлово име | `TEMPLATE_[DEPT]_[NNN][суфикс]_*.md` | `TEMPLATE_SALE_001A_Въпросници.md` |
| Кодовете използват `TMP_`, файловите имена използват `TEMPLATE_` — разминаването е умишлено и системно. |

---

*Последно обновяване:* 2026-04-15 — SOP_SALE_001 v3.0 (Unified Playbook): Напълно премахната нуждата от отделни темплейти за хора. TMP_SALE_001A и B са интегрирани във фазите на самия процес. Създаден е Python скрипт `generate_playbook.py` за извеждане на HTML наръчници от Markdown.
