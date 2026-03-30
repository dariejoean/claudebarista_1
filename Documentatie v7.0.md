
# 📘 Documentație Tehnică - PharmaBarista AI v7.0

**Versiune:** 7.0.0 (Enterprise Stable)
**Target Hardware:** Samsung Galaxy S25 Ultra (Optimizat pentru High-DPI, 120Hz, Viewport Vertical extins)
**Tip Aplicație:** Progressive Web Application (PWA) / Offline-First / Hybrid Intelligence System
**Data Actualizării:** Februarie 2026

---

## 1. Arhitectură și Stack Tehnologic

PharmaBarista v7.0 este construită pe o arhitectură modernă, modulară, care prioritizează performanța pe dispozitive mobile și funcționarea offline. Aplicația urmează principiul **"Local-First, Cloud-Enhanced"**: datele trăiesc pe dispozitiv, iar cloud-ul (AI) este folosit doar pentru procesare și îmbogățire la cerere.

### 1.1 Core Stack
*   **Runtime:** **React 19.2** (Concurrent Mode activat pentru randare fluidă).
*   **State Management:** **Zustand 5.0** (Store global atomic, elimină re-randările inutile cauzate de Context API).
*   **Language:** **TypeScript 5.8** (Strict Type Checking pentru toate interfețele de date SCA).
*   **Build System:** **Vite 6.2** (Compilare ESBuild instantanee).
*   **Styling:** **Tailwind CSS 3.4** + CSS Variables native pentru motorul de teme dinamic.
*   **Database:** **Dexie.js 4.0** (Wrapper peste IndexedDB). Asigură persistența datelor (~50MB+ capacitate).
*   **AI Engine:** **Google GenAI SDK** (`@google/genai`) accesând modelul `gemini-3-flash-preview`.
*   **Export/Import:** `xlsx` (SheetJS) pentru Excel și JSON nativ pentru Backup complet.

### 1.2 Structura Aplicației (Separation of Concerns)

Arhitectura separă strict Datele, Logica și Prezentarea:

1.  **Data Layer (Store - `src/store/`)**:
    *   `editorStore.ts`: Gestionează starea volatilă a formularului de extracție (ex: poziția cursorului pe slider, timer-ul activ). Folosește `zustand` pentru a permite componentelor izolate (ex: `GrinderWheel`) să actualizeze starea fără a re-randa întregul arbore de componente.

2.  **Logic Layer (Custom Hooks - `src/hooks/`)**:
    *   `useAppController.ts`: "Creierul" aplicației. Gestionează rutarea internă (tab-uri), modalele globale și ciclul de viață al PWA.
    *   `useShotEditor.ts`: Conține logica de afaceri pentru salvarea extracției. Aici se fac apelurile către DB și către AI Service.
    *   `useHistoryLogic.ts`: Gestionează filtrarea complexă, sortarea și paginarea listei de istoric.
    *   `useMaintenance.ts`: Algoritmul de recurență pentru generarea sarcinilor de întreținere.

3.  **Service Layer (Business Logic - `src/services/`)**:
    *   `db.ts`: Singleton pentru conexiunea la IndexedDB. Definește schema și metodele CRUD.
    *   `geminiService.ts`: Abstracție peste API-ul Google. Include logică de *Retry*, *Timeout* și *JSON Parsing* rezilient.
    *   `expertSystem.ts`: Motorul de decizie deterministic (Offline) bazat pe standarde SCA.

4.  **Presentation Layer (Components & Views)**:
    *   Componente "Dumb" (pure): Primesc date prin props și emit evenimente (ex: `RatingBox`, `Timer`).
    *   Componente "Smart" (Views): Conectate la Store/Hooks (ex: `NewShotView`).

---

## 2. Baza de Date (Dexie.js v7 Schema)

Baza de date locală `PharmaBaristaDB` este versionată (v7) pentru a suporta migrații automate.

### Tabele Principale:

1.  **`shots`** (`id` PK):
    *   Stochează jurnalele de extracție.
    *   Câmpuri cheie: `machineName`, `beanName`, `waterName`, `grinderName`, `doseIn`, `yieldOut`, `time`, `temperature`.
    *   **Noutate v7:** `grindScaleType` ('linear' | 'eureka') - permite salvarea tipului de interfață folosit pentru râșniță.
    *   **Noutate v7:** `tasteConclusion` (Array `[1, 2, 3]`) - permite diagnostice complexe (ex: Acru + Amar = Channeling).

2.  **`machines` & `beans`** (`++id`):
    *   Inventar echipamente și cafea.
    *   Include detalii tehnice avansate obținute via AI: `boilerType`, `pumpType`, `process`, `altitude`, `roastDate`.
    *   Imaginile sunt stocate ca **Blob Base64** direct în DB.

3.  **`settings`** (`key` PK):
    *   Stocare Key-Value pentru preferințe și liste dinamice.
    *   Exemple chei: `tampers_list`, `water_list`, `grinders_list`, `appTheme`, `maintenance_types`.
    *   Permite aplicației să aibă liste infinit extensibile fără a modifica schema DB.

4.  **`maintenanceLog`** (`id` PK):
    *   Jurnal operațiuni.
    *   Câmpuri: `dueDate` (ISO Date), `status` ('pending' | 'completed'), `operationId` (FK virtual către lista de tipuri).

5.  **`analyses`**:
    *   Stochează rapoartele de tendințe generate de AI pentru a nu le regenera inutil.

---

## 3. Motorul de Inteligență Hibridă

Aplicația dispune de un sistem dual de analiză, comutabil din setări ("Engine Mode").

### 3.1 Modul Online (Gemini 3 Flash)
*   **Trigger:** Apel manual la salvarea shot-ului sau în chat.
*   **Input:** Prompt complex care include:
    *   Telemetry (Date numerice).
    *   Context (Specificațiile mașinii și cafelei din inventar).
    *   Senzorial (Note, Tag-uri, Concluzie Gust).
    *   Vizual (Imagini analizate multimodal).
*   **Procesare:**
    *   `systemInstruction`: "Ești un Head Barista certificat Q-Grader...".
    *   `responseSchema`: Forțează un JSON strict `{ score, diagnosis, suggestion }`.
    *   **Grounding:** La adăugarea unui echipament nou, folosește `googleSearch` tool pentru a completa automat specificațiile tehnice (ex: diametru portafiltru, tip procesare cafea).

### 3.2 Modul Offline (Expert System)
*   **Trigger:** Când nu există internet sau modul este setat pe "Non-AI".
*   **Arhitectură:** Arbore de decizie (Decision Tree) hardcodat în `expertSystem.ts`.
*   **Algoritm Prioritizare:**
    1.  **Veto Gust:** Dacă `tasteConclusion` conține [1, 3] (Acru+Amar), diagnosticul este forțat pe "Channeling", ignorând timpii.
    2.  **Analiza Fluxului:** Verifică raportul `Time` vs `Ratio`. (<20s = Sub-extracție, >40s = Supra-extracție).
    3.  **Fine Tuning:** Dacă timpul e corect (25-30s) dar gustul e imperfect, sugerează ajustări de temperatură (+/- 1°C).

---

## 4. Funcționalități și Fluxuri Detaliate

### 4.1 Extracția Nouă ("The God Shot Workflow")
Fluxul este împărțit în module React distincte pentru performanță:

*   **ShotSetup:**
    *   **Selectoare Inteligente:** Modale de selecție (`SelectionModal`) pentru Mașină, Cafea, Apă, Râșniță.
    *   **Auto-Switch Scale:** La selectarea unei râșnițe, aplicația verifică metadatele acesteia (`scaleType`) și comută automat interfața între:
        *   `GrinderWheel`: Slider orizontal infinit cu inerție și haptics la fiecare 0.1 pași.
        *   `EurekaDial`: Simulare vizuală a cadranului fizic (rotații + numere), specifică râșnițelor Eureka/Niche.
    *   **Haptics Engine:** Utilizează `navigator.vibrate` cu *rate-limiting* (40ms) pentru a oferi feedback tactil la scroll, fără a bloca thread-ul JS.

*   **ShotExtraction:**
    *   **Timer Semantic:** Își schimbă culoarea textului în timp real (Alb <25s, Verde 25-30s, Roșu >30s).
    *   **Auto-Ratio:** Dacă utilizatorul introduce doar Doza (IN), Yield-ul (OUT) este calculat automat la rația 1:2, dar poate fi suprascris manual (`isYieldManuallySet` flag).

*   **ShotEvaluation:**
    *   **Traffic Light System:** Controale +/- simplificate (Roșu/Galben/Verde) mapate la valori numerice (1/3/5).
    *   **Concluzie Gust:** Un control critic multi-select. Combinațiile logice determină diagnosticul (ex: selectarea simultană a "Acru" și "Amar").

### 4.2 Jurnalul de Mentenanță (Scheduler)
Un sistem complex de calculare a recurenței:
*   Utilizatorul definește o operațiune (ex: "Backflush") și o frecvență (text liber interpretat: "Săptămânal").
*   **Algoritmul `useMaintenance`:**
    *   Parsează textul frecvenței -> convertește în zile (ex: "Săptămânal" = 7).
    *   Generează intrări în `maintenanceLog` de la data curentă până la sfârșitul anului.
    *   Ajustează datele (ex: mută sarcinile săptămânale sâmbăta).
*   **Dashboard:** Afișează 3 stări: Restante (Overdue), Curente (Today), Viitoare (Future).

### 4.3 Management Inventar & Setări
*   **Dynamic Lists:** Listele de Tampere, Apă, Râșnițe și Accesorii sunt complet editabile (CRUD).
*   **AI Identification:** În formularele de editare (Espressor/Cafea), butonul "Lupă" trimite numele și pozele la Gemini AI pentru a completa automat câmpurile tehnice (Origine, Altitudine, Tip Boiler, etc.).
*   **Theming Engine:**
    *   Permite editarea culorilor `surface`, `container`, `text` în timp real.
    *   Calculează automat contrastul textului (Alb/Negru) pe baza luminozității culorii de fundal selectate.
    *   Include preset-uri (Navy, Forest, Coffee) și generator random.

---

## 5. Securitate și Backup

### 5.1 Backup & Restore (JSON)
*   **Structura Fișierului:** Include un header `meta` (versiune, dată) și toate tabelele din DB.
*   **Android Compatibility:** Deoarece Android restricționează partajarea fișierelor `.json` necunoscute, funcția `handleBackupCloud` redenumește temporar fișierul în `.txt` la partajare via WhatsApp/Drive. La import, aplicația detectează structura JSON indiferent de extensie.

### 5.2 Export Excel (XLSX)
*   Generează un fișier `.xlsx` complex, multi-sheet:
    *   `Extractii`: Date brute + note + diagnostic.
    *   `Inventar`: Mașini, Cafele cu detalii complete.
    *   `Mentenanta`: Jurnalul operațiunilor.
*   Procesarea se face 100% în browser (Client-side) folosind biblioteca `xlsx`.

---

## 6. UI/UX Design System

Designul este specific optimizat pentru **Samsung Galaxy S25 Ultra**:
*   **Thumb Zone:** Butoanele critice (Start/Stop, Salvare) sunt plasate în partea de jos a ecranului.
*   **High Contrast:** Etichetele (`LABEL_STYLE`) folosesc culori saturate (Emerald, Amber, Blue 700) pentru vizibilitate maximă în lumină puternică.
*   **Feedback Vizual:** Umbre adânci (`box-shadow`), efecte de sticlă (`backdrop-blur`) și animații fine (`animate-fade-in`, `active:scale-95`) pentru o senzație premium ("App-like").
*   **Dark/Light Mode:** Suport complet prin CSS Variables, cu inversiune automată a culorilor textului și a iconițelor.

---

**© 2026 Darie Joean. Documentație generată pentru v7.0.**
