# BW Quiz Station - gefixte Version

Offline-Nutzung:
- Die App kann nach dem ersten erfolgreichen Online-Aufruf auch ohne Empfang genutzt werden.
- Vor dem Übungsplatz die Website einmal mit Internet öffnen, damit alle Dateien gespeichert werden.
- Auf dem iPad am besten über Safari öffnen und zum Home-Bildschirm hinzufügen.
- Danach kann die App auch nach Bildschirm aus/an wieder gestartet werden.
- Nach Änderungen an Fragen oder Code die Website einmal mit Internet neu öffnen, damit die neue Version gespeichert wird.

Design-Auswahl:
- Die App enthält zwei Designs: Ausstellung und Klassisch.
- Der Umschalter befindet sich unten in der Statusleiste.
- Die gewählte Optik wird auf dem Gerät gespeichert und beim nächsten Öffnen wieder geladen.

Fragen aktivieren/deaktivieren:
- In fragen.json können Fragen mit "aktiv": false im Fragenpool behalten, aber aus dem Quiz entfernt werden.
- Zum späteren Reaktivieren den Wert auf true setzen oder die Zeile entfernen.
- Aktuell sind 12 Fragen gespeichert und 10 Fragen aktiv.

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


Update Panzer-Timer:
- Das hochgeladene Panzer-Icon wurde als `panzer-icon.png` eingebunden.
- Der Panzer startet oben am Kreis.
- Der Panzer fährt links herum / gegen den Uhrzeigersinn.
- Die Drehung des Panzers passt sich der Fahrtrichtung an.
- Der grüne Timer-Ring läuft synchron in dieselbe Richtung ab.


Update Panzer-Timer Fix:
- Das Panzer-Icon wurde hellgrün eingefärbt, damit es auf dem dunklen Hintergrund sichtbar ist.
- Panzer und grüner Timer-Balken laufen jetzt in dieselbe Richtung: gegen den Uhrzeigersinn.
- Die Drehung wurde korrigiert, damit der Panzer nicht mehr auf dem Kopf fährt.


Update Timer ohne Panzer:
- Das Panzer-Icon wurde entfernt.
- Der 60-Sekunden-Kreis-Timer bleibt erhalten.
- Der grüne Timer-Kreis läuft weiter ab.


Prüfung aktuelle Version:
- app.js Syntax geprüft.
- fragen.json geprüft.
- manifest.webmanifest geprüft.
- style.css repariert: fehlende schließende Klammer am Ende ergänzt.
- Tippfehler korrigiert: Generalinspelteuer -> Generalinspekteur.


Update Startbildschirm:
- Der Erklärungstext auf dem Home-Bildschirm wurde ausführlich und sauber formatiert.
- Strafen bei falscher Antwort und Joker-Regel werden getrennt dargestellt.
- Abstände und Darstellung für PC/iPad/Handy wurden angepasst.
