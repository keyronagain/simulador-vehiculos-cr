# Costa Rica Vehicle Cost Simulator

An interactive web simulator that compares the total ownership cost of electric, gasoline, and LPG gas vehicles in the Costa Rican context.

Built as part of a university engineering case study on energy efficiency and transportation costs.

**Live demo:** [keyronagain.github.io/simulador-vehiculos-cr](https://keyronagain.github.io/simulador-vehiculos-cr)

---

## Features

- **Real-time simulation** — adjust sliders and all charts update instantly
- **Full cost model** — includes purchase price, fuel/electricity costs, and annual maintenance
- **Mathematical breakeven analysis** — calculates the exact kilometer where one vehicle becomes cheaper than another
- **5 analysis tabs** — Simulator, Breakeven, Maintenance, Energy Efficiency, Environmental Impact
- **Responsive design** — works on desktop and mobile
- **No dependencies** — single-page app, no frameworks or build tools required

---

## How it works

Each vehicle follows a linear cost function:

```
C(x) = C₀ + c·x + m·t
```

Where:
- `C₀` = purchase price
- `c` = cost per kilometer (fuel or electricity)
- `x` = total kilometers driven
- `m` = annual maintenance cost
- `t` = years of analysis

The breakeven point between two vehicles is found by equating their cost functions and solving for `x`.

---

## Data sources

| Parameter | Value | Source |
|---|---|---|
| Gasoline price | ₡650/L | Study reference (RECOPE) |
| LPG price | ₡280/L | Study reference |
| Electricity rate | ₡105/kWh | ICE residential average |
| Electric consumption | 18 kWh/100km (5.5 km/kWh) | RECOPE |
| Gasoline efficiency | 12 km/L | Study reference |
| LPG efficiency | 10 km/L | Study reference |
| Electric maintenance | ₡80,000/year | CR 2026 estimate |
| Gasoline maintenance | ₡250,000/year | CR 2026 estimate |
| Electric efficiency | ~60% energy conversion | Kückens, La Nación Argentina, March 2026 |
| Gasoline efficiency | ~19% energy conversion | Kückens, La Nación Argentina, March 2026 |

---

## Tech stack

- **HTML5** — structure
- **CSS3** — styling and responsive layout
- **Vanilla JavaScript** — all calculations and interactivity
- **Chart.js** — data visualizations

---

## Project structure

```
simulador-vehiculos-cr/
├── index.html       # Main HTML structure
├── styles.css       # All styles and responsive layout
├── script.js        # Calculations, charts, and interactivity
└── README.md        # This file
```

## Author

**Keyron Brenes** — Computer Engineering student, Costa Rica  
GitHub: [@keyronagain](https://github.com/keyronagain)
