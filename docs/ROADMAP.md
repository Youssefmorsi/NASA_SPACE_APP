# Remaining work

- Validate map/DEM coordinate frames against Horizons at required spatial precision before terrain integration.
- Import a suitable numeric terrain product with documented datum, resolution, coverage and access conditions.
- Implement/validate local terrain horizon calculations before claiming terrain-corrected Sun or Earth visibility.
- Model Earth occultation of the Sun if deriving direct solar availability, with a clear disk/limb convention.
- Add verified historical/candidate landing site records from the required resources; current catalog makes no mission assignment claims.
- Manual Horizons web-UI spot checks remain distinct from executed API-format consistency checks.
- Power and communication link modelling require spacecraft and network inputs; not implemented.

Implemented subsequently: six historical sites with traceable LROC coordinates, bounded spatial NAC search/footprint selection, regional on-demand Moon Trek layers, and sampled apparent solar-disk screening. Numeric terrain horizon/roughness/slope screening remains pending verified data access and frame/coverage validation. Full power and radio models remain excluded.
