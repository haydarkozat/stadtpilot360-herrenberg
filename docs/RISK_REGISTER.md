# Risikoregister – StadtPilot 360°

| ID | Risiko | Eintritt | Auswirkung | Gegenmaßnahme | Frühindikator |
|---|---|---|---|---|---|
| R-01 | Der Prototyp könnte als offizielles Stadtprodukt missverstanden werden. | Mittel | Hoch | Unabhängigen Bewerbungscharakter in Navigation, Footer, Methodik und README deutlich kennzeichnen. | Nutzer fragt nach amtlicher Freigabe oder Produktivbetrieb. |
| R-02 | Demo-Scores könnten als reale Priorisierung interpretiert werden. | Mittel | Hoch | Formel offenlegen; jede relevante Ansicht mit „Demo / nicht amtlich“ kennzeichnen. | Score wird ohne Kontext zitiert. |
| R-03 | Zu viele Funktionen könnten die Kernbotschaft verwässern. | Mittel | Mittel | Geführte 90-Sekunden-Demo und klare Präsentationsreihenfolge einsetzen. | Nutzer springt orientierungslos zwischen Ansichten. |
| R-04 | Externe Bibliotheken oder Ressourcen könnten beim Interview ausfallen. | Niedrig | Hoch | Vollständig eigenständige Standalone-Datei ohne CDN oder API-Abhängigkeit. | Leere Seite bei fehlendem Internet. |
| R-05 | Mobile oder kleinere Bildschirme könnten Layoutfehler zeigen. | Mittel | Mittel | Responsive Breakpoints und Tests bei 390 px, 920 px und Desktopbreiten. | Horizontales Scrollen oder abgeschnittene Inhalte. |
| R-06 | Browser blockiert lokale Speicherung. | Mittel | Niedrig | Storage-Zugriffe fehlertolerant kapseln; Kernfunktionen ohne Storage nutzbar halten. | Aktionsboard-Zustand bleibt nach Neuladen nicht erhalten. |
| R-07 | Projektinformationen ändern sich nach dem Snapshot. | Hoch | Mittel | Snapshot-Datum sichtbar machen und Quelllinks bereitstellen. | Abweichung zwischen Demo und aktueller Projektseite. |
| R-08 | Das Projekt wirkt zu technisch und zu wenig menschenorientiert. | Niedrig | Mittel | Stakeholder-, Beteiligungs-, Kommunikations- und Serviceperspektive prominent integrieren. | Gespräch dreht sich ausschließlich um Code. |
| R-09 | Persönliche Aussagen könnten nicht sauber belegt sein. | Niedrig | Hoch | Nur belegbare Angaben verwenden; Projekt als Arbeitsprobe und nicht als amtliches Referenzprojekt darstellen. | Rückfrage nach nicht vorhandener Projektreferenz. |
| R-10 | Druck-/PDF-Ausgabe passt nicht auf A4. | Mittel | Mittel | Dedizierte Print-CSS und reduzierte Entscheidungsbriefansicht testen. | Seitenumbruch in zentralem Entscheidungsblock. |

## Risikobehandlung

- Risiken R-01, R-02 und R-09 werden als **Vertrauens- und Integritätsrisiken** mit höchster Aufmerksamkeit behandelt.
- Risiken R-03 und R-08 werden durch die geführte Demo und die Evidence Map reduziert.
- Risiken R-04, R-05, R-06 und R-10 werden durch technische Tests und progressive Verbesserung behandelt.
- Risiko R-07 wird durch Snapshot-Datum und direkte Quellenverlinkung akzeptiert und transparent gemacht.
