# BW Quiz Station - gefixte Version

Diese Version behebt:
- Syntax-Fehler in app.js
- Ergebnisanzeige für Liegestütze/Kniebeugen
- optionales Bildfeld pro Frage
- alte Service-Worker-Caches werden deaktiviert

Wichtig:
- Die App lädt fragen.json online frisch.
- Offline-Funktion ist vorerst deaktiviert.
- Nach dem Hochladen auf GitHub bitte STRG+F5 drücken oder Website-Daten löschen, falls noch alte Dateien geladen werden.


Update:
- Der Ergebnis-Button führt jetzt zurück zum Startbildschirm.
- Von dort kann ein neuer Durchgang sauber gestartet werden.


Update Joker-Modus:
- Jede Frage wird als Person 1 bis Person 10 angezeigt.
- Pro Frage kann ein Joker genutzt werden: Gruppe fragen.
- Joker kostet 5 Liegestütze oder 5 Kniebeugen, auch wenn die Antwort danach richtig ist.
- Wenn die Antwort nach Joker trotzdem falsch ist, kommen zusätzlich 10 Liegestütze oder 10 Kniebeugen dazu.
- Am Ende werden Joker-Übungen und Fehler-Übungen getrennt ausgewertet.


Update Timer-Modus:
- Pro Frage läuft jetzt ein 60-Sekunden-Timer.
- In der Mitte wird die Restzeit als Zahl angezeigt.
- Außen läuft ein Kreis mit.
- Ein kleiner Panzer startet oben und fährt im Uhrzeigersinn eine Runde.
- Bei 0 Sekunden gilt die Frage als falsch und die normale 10er-Übungsauswahl erscheint.
