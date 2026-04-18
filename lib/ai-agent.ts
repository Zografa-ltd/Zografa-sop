import mammoth from 'mammoth'
import { GoogleGenerativeAI } from '@google/generative-ai'

const FORMAT_RULES = `
Форматирай документа по следните правила за Зографа SOP система:

СТРУКТУРА (задължителна за ВСИЧКИ типове):
1. Зона 1 — Мета хедър (не се показва):
   **Код:** XXX-000
   **Версия:** X.X
   **Последна актуализация:** YYYY-MM-DD
   **Отговорник:** Роля
   **Описание:** Едно изречение — описание на документа

   ---

2. Зона 2 — Съдържание (показва се)
3. Зона 3 (задължително последна):
   ## Версионна история
   | Версия | Дата | Промени |
   |---|---|---|
   | 1.0 | YYYY-MM-DD | Начална версия |

ПРАВИЛА:
- БЕЗ H1 (# Заглавие) — заглавието идва от базата данни
- Метаблокът ТРЯБВА да завършва с --- на отделен ред

ЗА ФОРМИ (type: form):
- Всяко поле на отделен ред с ПРАЗЕН РЕД преди и след: **Label:** _______________
- Чекбокси ЗАДЪЛЖИТЕЛНО като списък: - ☐ Вариант
- Две кратки полета на ред: **Дата:** ___ &nbsp;&nbsp; **Търговец:** ___
- НИКОГА две полета без празен ред между тях

ЗА ИМЕЙЛ ШАБЛОНИ (type: email_template):
- Всеки имейл: ## ИМЕЙЛ N — Заглавие
- Мета (Фаза, Кога, Цел) преди ---
- Тялото на имейла след ---
- Без ___ редове в тялото

ЗА СОП (type: sop):
- Секции с ## заглавия
- Номерирани стъпки като списъци

Върни САМО markdown, без обяснения, без код блокове около него.
`

export async function extractDocxText(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer })
  return result.value
}

export async function convertTextToMd(
  rawText: string,
  docType: 'sop' | 'email_template' | 'assignment' | 'form',
  internalCode: string,
  title: string,
  version: string
): Promise<string> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const typeLabels: Record<string, string> = {
    sop: 'СОП процес',
    form: 'Формуляр / Въпросник',
    email_template: 'Имейл шаблони',
    assignment: 'Задание',
  }

  const prompt = `Ти си форматиращ агент за Зографа SOP система. Конвертирай следния Word документ в правилно форматиран Markdown.

Тип документ: ${typeLabels[docType]}
Код: ${internalCode}
Заглавие: ${title}
Версия: ${version}

${FORMAT_RULES}

ОРИГИНАЛЕН ТЕКСТ НА ДОКУМЕНТА:
${rawText}
`

  const result = await model.generateContent(prompt)
  return result.response.text().replace(/^```(?:markdown)?\n?|```$/g, '').trim()
}
