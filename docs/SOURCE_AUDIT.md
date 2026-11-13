# Required-source audit — 13 November 2026

The available project was V1, not the V2 described in earlier chat history. This audit is based on files actually present.

| Existing material | Actual origin | Decision |
|---|---|---|
| Sun/Earth calculations, initial results, demo results | Astronomy Engine 2.1.19 | Remove from active app/API. Retain engine only as a labelled legacy module for historical tests. New results must come from Horizons. |
| NASA SVS reference table and validation report | NASA SVS, outside required three resources | Retain historical files only; do not claim they validate the new Horizons adapter. |
| Shackleton R04, Malapert R23, Cabeus NPA coordinates | NASA Surface Data Book, outside required sources | Remove from active site catalog pending verification. |
| SVG terrain/map illustration | Procedural display in old frontend | Replace with sourced Moon Trek LROC WAC mosaic. Not terrain measurements. |
| Feasibility thresholds | Application defaults/user settings | Clearly label user assumptions, not NASA requirements. |
| Communication/risk implications | Geometric thresholds only | Use Earth elevation and mission conditions terminology. No link budget or landing safety claims. |

New catalog uses four user-defined mathematical reference coordinates plus the center of an archived QuickMap NAC observation. None is claimed to be a mission landing site. Terrain slope, rock hazards and terrain obstruction remain unassessed until numeric products and methods are verified.
