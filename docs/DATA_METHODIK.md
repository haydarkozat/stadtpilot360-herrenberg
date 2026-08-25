# Daten- und Scoring-Methodik

## Datenbasis

Der kuratierte Snapshot verwendet öffentlich zugängliche Projektinformationen der Stadt Herrenberg. Die öffentliche Projektdatenbank ist über das Open-Data-Portal beziehungsweise die jeweiligen Projektseiten erreichbar.

## Felder mit Quellenbezug

- ID
- Titel
- Kategorie
- Status
- Ortsteil beziehungsweise Stadtgebietsbezug
- Aktualisierungsdatum
- Kurzbeschreibung
- Quell-URL
- teilweise veröffentlichte Koordinaten

## Demo-Modell

Für die Arbeitsprobe wurden bewusst zusätzliche Felder ergänzt:

- `impact` – angenommene öffentliche Wirkung
- `urgency` – angenommene Dringlichkeit
- `coordination` – angenommene Koordinationskomplexität
- `data` – angenommene Datenreife
- `risk` – angenommene Risikoklasse

Diese Felder sind keine Aussage oder Bewertung der Stadt Herrenberg.

## Steuerungsbedarf

```text
score =
  impact × 0,36
+ urgency × 0,26
+ coordination × 0,24
+ riskWeight × 0,14
```

Risikogewichte im Prototyp:

```text
niedrig = 24
mittel  = 62
hoch    = 100
```

## Methodische Grenzen

Ein produktiver Einsatz würde mindestens erfordern:

1. gemeinsam vereinbarte Definitionen und Gewichtungen,
2. Datenowner und Aktualisierungsrhythmen,
3. Versionierung von Bewertungen und Entscheidungen,
4. Rollen- und Rechtekonzept,
5. dokumentierte Datenqualität,
6. Trennung von öffentlichen und internen Informationen,
7. Prüfung von Barrierefreiheit, Datenschutz und IT-Sicherheit.
