
# 📘 Manual de Utilizare - PharmaBarista AI v7.0

**Versiune:** 7.0.0 (Enterprise Edition)
**Dispozitiv Țintă:** Samsung Galaxy S25 Ultra (Optimizat pentru operare cu o singură mână)
**Concept:** Laborator Digital SCA (Specialty Coffee Association) pentru Barista.

---

## 1. Introducere și Navigare

**PharmaBarista v7.0** transformă telefonul tău într-un asistent de precizie. Interfața a fost complet redesenată pentru a fi rapidă ("Thumb-Zone Navigation"), intuitivă și estetică.

### Meniul Principal (Dock-ul de jos)
Aplicația este împărțită în 4 secțiuni majore, accesibile din bara de jos:
1.  **NOU:** Interfața de extracție și notare (Fluxul "God Shot").
2.  **ISTORIC:** Jurnalul tuturor cafelelor preparate, cu filtre avansate și chat AI.
3.  **SERVICE:** Calendarul de întreținere pentru echipamente.
4.  **SETĂRI:** Gestiunea inventarului (Mașini, Cafea, Apă), Teme și Backup.

### Meniul Lateral (Accordion)
Apăsând butonul "Meniu" (colțul dreapta-sus), se deschide un sertar de navigare rapidă. Acesta funcționează ca un acordeon: apăsând pe o categorie (ex: "Extracție Nouă"), vei vedea scurtături directe către sub-secțiuni (ex: "Evaluare", "Concluzie"), permițându-ți să sari direct la pasul dorit fără scroll.

---

## 2. Fluxul de Lucru "God Shot" (Extracție Nouă)

Acesta este nucleul aplicației. Este gândit să fie parcurs de sus în jos.

### Pasul 1: Pregătirea (Setup)
Aici definești variabilele *înainte* de a porni pompa.

*   **Selectoare Inteligente:** Apasă pe Espressor, Cafea sau Apă pentru a deschide o listă de selecție rapidă.
    *   *Sfat:* Dacă ai mai multe râșnițe, selectarea uneia din ele va schimba automat interfața de reglaj!
*   **Interfața de Măcinare (Auto-Adaptivă):**
    *   **Modul Liniar (Generic):** O bandă orizontală infinită. Trage stânga-dreapta pentru a regla finețea. Vei simți o vibrație fină (Haptic Feedback) la fiecare 0.1 pași.
    *   **Modul Eureka/Niche (Cadran):** Dacă râșnița selectată este configurată ca "Eureka", vei vedea un cadran vizual. Acesta afișează numărul de rotații complete (cerc roșu) și cifra de pe cadran, exact ca în realitate.
*   **Doză & Temperatură:** Introdu cantitatea de cafea măcinată (IN) și temperatura apei.

### Pasul 2: Extracția (Timer & Flow)
1.  Apasă butonul **START** în momentul în care pornești pompa espressorului.
2.  **Monitorizare Semantică:** Culoarea cronometrului îți spune în timp real cum decurge extracția:
    *   ⚪ **Alb (<25s):** Prea rapid (Sub-extracție posibilă).
    *   🟢 **Verde (25s - 30s):** Zona Ideală ("Sweet Spot").
    *   🔴 **Roșu (>30s):** Prea lent (Supra-extracție posibilă).
3.  Apasă **STOP** când ai oprit fluxul.
4.  **Auto-Ratio:** Aplicația calculează automat un raport de 1:2 (ex: la 18g IN pune automat 36g OUT). Dacă ai cântărit lichidul și e diferit, apasă pe câmpul "CAFEA EXTRASĂ" și corectează valoarea.

### Pasul 3: Evaluarea Senzorială
Nu mai pierzi timp cu slidere fine. Folosește sistemul **Traffic Light** pentru viteză:
*   **➖ (Roșu):** Slab, Defectuos, Neplăcut.
*   **OK (Galben):** Acceptabil, Corect.
*   **➕ (Verde):** Excelent, Intens, Complex.

**Tag-uri Rapide:**
În dreapta butoanelor +/-, există un buton de etichete. Apasă-l pentru a selecta descriptori specifici (ex: "Crema densă", "Gust Arsură"). Butonul își schimbă culoarea în funcție de sentimentul tag-urilor selectate.

### Pasul 4: Concluzie și Diagnostic (CRITIC)
Înainte de salvare, trebuie să dai verdictul final asupra gustului. Aceasta este cea mai importantă dată pentru AI!
*   **PREA ACRU:** Indică sub-extracție.
*   **ECHILIBRAT:** Ținta finală.
*   **PREA AMAR:** Indică supra-extracție.
*   **ACRU + AMAR:** Dacă le selectezi pe amândouă, aplicația diagnostichează instantaneu **CHANNELING** (apă care a trecut inegal prin puc).

---

## 3. Motorul Hibrid de Inteligență (AI Engine)

Aplicația dispune de două "creiere" distincte. Poți comuta între ele din Setări -> Engine.

### A. Modul Online (Gemini 3 Flash) - Recomandat
*   **Cum funcționează:** Trimite toate datele (inclusiv poze și descrierea tehnică a echipamentelor din inventar) către serverele Google.
*   **Rezultat:** Primești o analiză detaliată în limbaj natural, un scor AI (ex: 8.5/10) și o sugestie complexă (ex: "Gustul acru la 28 de secunde sugerează o temperatură prea mică pentru această cafea etiopiană. Crește temperatura cu 2°C").
*   **Chat Barista:** În tab-ul Istoric, poți discuta vocal sau text cu AI-ul despre extracțiile tale anterioare.

### B. Modul Offline (Expert System) - Rapid
*   **Cum funcționează:** Folosește un algoritm matematic strict, stocat local pe telefon. Nu necesită internet.
*   **Rezultat:** Primești un diagnostic instantaneu bazat pe reguli SCA (ex: "Timp < 20s = Măcinare prea grosieră"). Este ideal când nu ai semnal sau vrei viteză maximă.

---

## 4. Data Lab: Analiză Avansată

În tab-ul **ISTORIC**, apasă butonul "ANALIZE EXTRACȚII" pentru a deschide laboratorul de date.

1.  **Corelații Simple:** Vezi grafice de dispersie (Scatter Plots) pentru a înțelege legătura dintre doi parametri (ex: Cum a influențat *Temperatura* *Nota Finală*?).
2.  **Impact Multifactorial:** Un algoritm de regresie calculează matematic care factor contează cel mai mult pentru tine.
    *   *Exemplu:* Îți poate spune: "Pentru cafeaua curentă, Râșnița are un impact de 80% asupra gustului, iar Temperatura doar 20%". Asta te ajută să știi ce să reglezi mai întâi.

---

## 5. Mentenanță și Service

Un espressor curat este vital. Tab-ul **SERVICE** gestionează automat calendarul.

*   **Programare Inteligentă:** Când adaugi o sarcină (ex: "Backflush cu detergent") și specifici frecvența (ex: "Săptămânal"), aplicația va genera automat intrări în calendar pentru tot restul anului.
*   **Dashboard:**
    *   🟥 **Restante:** Ce trebuia să faci și ai uitat.
    *   🟩 **Curente:** Ce ai de făcut azi.
    *   🟦 **Viitoare:** Următoarele sarcini (următoarele 30 de zile).

---

## 6. Inventar și AI Vision

În tab-ul **SETĂRI**, îți gestionezi echipamentul.

*   **Identificare AI:** Când adaugi o cafea sau un espressor, scrie doar numele (ex: "Lelit Bianca") și apasă butonul **Lupă 🔍**. AI-ul va căuta pe internet specificațiile tehnice (tip boiler, diametru portafiltru, origine cafea, altitudine) și va completa automat formularul pentru tine.
*   **Profile de Apă:** Poți salva rețete de apă (ex: "Bucovina", "Third Wave Water"). Selectarea apei în timpul extracției te ajută să vezi cum compoziția minerală influențează gustul.

---

## 7. Personalizare și Backup

*   **Teme Dinamice:** Poți alege din preset-uri (Navy, Forest, Coffee) sau poți crea propria temă coloristică folosind editorul vizual.
*   **Feedback Haptic:** Poți activa/dezactiva vibrațiile telefonului la scroll și butoane.
*   **Export & Backup:**
    *   **Excel (.xlsx):** Generează un raport profesional cu tab-uri separate pentru Extracții, Inventar și Service.
    *   **Backup Complet (.json):** Salvează toată baza de date. Fișierul este criptat ușor pentru a putea fi partajat via WhatsApp (extensia .txt) și restaurat pe alt telefon.

---

**© 2026 Darie Joean. Manual actualizat pentru v7.0.**
