# Presentation demo, 14 November 2026

Base: upstream main `52ee4c4`. Added a bounded mission-start search and direct Horizons verification links. The PowerPoint files are unchanged.

## Reliable 90-second route

1. Open http://127.0.0.1:5173 and select **Plan this location**.
2. Open **Find a mission start**, then **Try cached nearside example**.
3. Explain that this compares 21 possible starts, six hours apart, for the same 48-hour mission at 0°N, 0°E. The starting-date search spans 13–18 November 2026. The shared ephemeris extends through 20 November so every candidate has full coverage.
4. The earliest top-ranked start is **17 November 2026, 06:00 UTC**. Several later starts tie at **48.0 h continuous overlap**. This result uses Sun ≥0° and Earth ≥5° above the reference plane.
5. Click the first **Use this start**, then **Calculate conditions**. The 193-sample, 15-minute genuine Horizons response is shipped as a cached verification and confirms 48 h overlap. Show the charts and requirement checks.
6. Open **Verify in Horizons** to show exact Sun/Earth API requests. Opening NASA links requires internet; the analysis itself can use the bundled response.
7. Save the scenario, open example comparison, then finish with **Sources**.

## Claims to keep precise

- “Best among the start times tested,” not “the globally best landing window.”
- “Sun and Earth meet the selected elevation thresholds,” not guaranteed power or radio contact.
- Terrain obstruction, landing safety and eclipse correction remain excluded from main availability.
- The finder uses hourly samples. Short events can be missed. Finer verification improves temporal resolution, not terrain accuracy.

## Other candidates for a later release

- Date-driven terminator and Earth phase: useful visual additions after frame and observer validation.
- Rise/set: prototype custom lunar observer behavior and limb conventions first. Do not call stepped event markers exact times.
- Eclipse refinement: bracket contact candidates, including close approaches between coarse samples.
- Extra planets: lower priority for mission comparison.

## Default polar search, also cached for the presentation

Instead of loading the nearside example, keep the initial polar mission (−89°, 0°, 168 h, Sun ≥0°, Earth ≥5°) and click **Rank mission starts** with seven days and six-hour spacing. The 29 tested starts rank 20 November 2026 00:00 UTC first, with approximately 151.6 h continuous overlap. **Use this start** and calculate at 15-minute spacing: the fresh 673-sample Horizons verification gives 151.639521 h continuous overlap. Both the broad source scan and this verification were retrieved from Horizons on 14 November 2026 and are bundled, so these exact settings can run offline. The 60-minute screening gave 151.638761 h, illustrating the small sampling difference without implying exact event times.
