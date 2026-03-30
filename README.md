
# ☕️ PharmaBarista AI (v7.0)

![Version](https://img.shields.io/badge/version-7.0.0-blue?style=for-the-badge)
![Status](https://img.shields.io/badge/status-enterprise_stable-green?style=for-the-badge)
![Platform](https://img.shields.io/badge/mobile-S25_Ultra_Optimized-orange?style=for-the-badge)
![Engine](https://img.shields.io/badge/AI-Gemini_3_Flash-8E44AD?style=for-the-badge)

**PharmaBarista AI** este un laborator digital de precizie pentru Barista, construit sub forma unei **Progressive Web Application (PWA)** "Local-First". Transformă smartphone-ul într-un instrument de calibrare SCA (Specialty Coffee Association), combinând rigoarea farmaceutică a datelor cu arta preparării espresso-ului.

Este optimizată specific pentru viewport-ul vertical extins și capabilitățile hardware ale **Samsung Galaxy S25 Ultra**.

---

## 🌟 Noutăți în Versiunea 7.0 (Enterprise)

Versiunea 7.0 marchează trecerea la o arhitectură modulară completă și introducerea "Motorului Hibrid".

### 1. 🧠 Hybrid Intelligence Engine
Aplicația dispune acum de două "creiere" comutabile instantaneu:
*   **Modul Online (Gemini 3 Flash):** Analizează telemetria completă, contextul echipamentului și imaginile (Vision) pentru a oferi diagnoze de nivel Q-Grader. Folosește *Google Search Grounding* pentru a identifica automat specificațiile echipamentelor noi.
*   **Modul Offline (Expert System):** Un arbore de decizie deterministic, hardcodat local, care oferă feedback instantaneu (sub 50ms) chiar și fără conexiune la internet, bazat pe standarde matematice SCA.

### 2. ⚙️ Adaptive Grinder Interface (Eureka Dial)
Interfața de reglaj a măcinării se adaptează automat în funcție de echipamentul selectat:
*   **Linear Scale:** Pentru râșnițe standard (slider infinit orizontal).
*   **Eureka/Niche Dial:** O simulare vizuală a cadranului fizic care calculează automat **Rotațiile Complete** și **Numărul de pe Cadran** (ex: 2 Rotații + 15.5).

### 3. 🛠 Maintenance Scheduler & Recurrence
Un sistem complet de management al service-ului:
*   **Algoritm de Recurență:** Transformă text natural (ex: "Săptămânal") în intrări calendaristice, ajustând automat datele (ex: mută sarcinile de weekend sâmbăta).
*   **Dashboard:** Vizualizare clară a stărilor: 🟥 Restante, 🟩 Azi, 🟦 Viitoare.

### 4. 📊 Data Lab: Analiză Multifactorială
Nu doar grafice simple. Aplicația calculează **Impactul Relativ (Beta Coefficients)** al variabilelor.
*   *Exemplu:* Îți poate spune matematic: "Pentru această cafea, Temperatura influențează gustul cu 80%, în timp ce Doza doar cu 20%".

---

## 🚀 Fluxul de Lucru "God Shot"

Aplicația ghidează utilizatorul prin 4 etape critice:

1.  **Setup (Pregătire):**
    *   Selectare Echipament (Espressor, Cafea, Apă - *Nou!*).
    *   Reglaj Măcinare cu **Feedback Haptic** (vibrații fine la fiecare 0.1 pași).
2.  **Extraction (Execuție):**
    *   Timer Semantic (își schimbă culoarea în funcție de fereastra ideală 25-30s).
    *   Calcul automat al debitului (Flow Rate) în g/s.
3.  **Evaluation (Senzorial):**
    *   Sistem "Traffic Light" pentru notare rapidă.
    *   Concluzie Gust (Logic-gated): Selectarea simultană a "Acru" + "Amar" declanșează automat diagnosticul de **Channeling**.
4.  **Analysis (AI):**
    *   Generarea diagnosticului și salvarea în baza de date locală.

---

## 🏗 Arhitectură Tehnică

Proiectul urmează principiul **Separation of Concerns** strict.

### Core Stack
| Componentă | Tehnologie | Rol |
| :--- | :--- | :--- |
| **Runtime** | **React 19.2** | Concurrent Mode pentru randare fluidă la 120Hz. |
| **State** | **Zustand 5.0** | Store atomic global (evită re-render-urile inutile ale Context API). |
| **Database** | **Dexie.js 4.0** | Wrapper peste **IndexedDB**. Stocare locală persistentă (inclusiv imagini Base64). |
| **AI SDK** | **@google/genai** | Integrare directă cu Gemini 1.5/3.0. |
| **Styling** | **Tailwind CSS 3.4** | Design System bazat pe variabile CSS native pentru teme dinamice. |
| **Build** | **Vite 6.2** | Compilare ESBuild instantanee. |

### Schema Bază de Date (v7)
*   `shots`: Date brute, telemetrie, note.
*   `machines` / `beans`: Inventar cu specificații tehnice (Boiler Type, Process, Altitude).
*   `maintenanceLog`: Jurnal operațiuni cu status și due_date.
*   `settings`: Key-Value store pentru preferințe și liste dinamice editabile.

---

## 🎨 Design System & Theming

Aplicația include un motor de teme propriu (**Dynamic Theming Engine**):
*   **Live Injection:** Culorile sunt injectate ca CSS Variables în `<body>`.
*   **Contrast Check:** Aplicația calculează luminozitatea fundalului și inversează automat culoarea textului (Negru/Alb) pentru lizibilitate.
*   **Presets:** Include teme precum *Navy*, *Forest*, *Coffee* și un generator *Random* pentru inspirație.

---

## 📦 Instalare și Rulare

### Cerințe
*   Node.js v18+
*   Cheie API Google Gemini (pentru funcțiile Online AI).

### 1. Local Development
```bash
# Clone
git clone https://github.com/user/pharmabarista.git

# Install
npm install

# Environment
# Crează fișierul .env și adaugă:
GEMINI_API_KEY=cheia_ta_aici

# Start
npm run dev
```

### 2. Build pentru Producție
```bash
npm run build
# Folderul 'dist' este gata de deploy (Vercel/Netlify).
```

### 3. Instalare pe Telefon (PWA)
1.  Accesează URL-ul HTTPS (ex: Vercel).
2.  Deschide meniul browserului (Chrome/Safari).
3.  Apasă **"Add to Home Screen"** / **"Install App"**.
4.  Aplicația va rula fullscreen, offline, ca o aplicație nativă.

---

## 🛡 Securitate și Date

*   **100% Local:** Toate datele tale (inclusiv fotografiile cu echipamente) sunt stocate criptat în browserul telefonului tău. Nu există un server central de baze de date.
*   **Export:** Poți exporta oricând datele în format **Excel (.xlsx)** sau **JSON (Backup Complet)** pentru a le muta pe alt dispozitiv.

---

**© 2026 Darie Joean.**
Proiectat pentru excelență în cafea.
