# Pro Vertical Room Control Card
Un card minimalist și modular pentru controlul luminilor pe verticală.

## Instalare
1. Adaugă acest link în HACS -> Frontend -> Custom Repositories.
2. Restart Home Assistant (sau Refresh Page).

## Configurare GUI / YAML
```yaml
type: custom:pro-vertical-light-card
entities:
  - entity: light.birou
    name: Birou
  - entity: light.tavan
    name: Tavan
