# Theme Park Price Comparator

A mobile-friendly price calculator for any number of guests and editable extras. Every guest uses the same **Ticket Price** field. On phones, each park appears as a stacked card with touch-friendly controls.

## Quick start

1. Open `index.html` in a web browser.
2. Change the number of guests. Parking is a default-on checkbox because the comparison assumes one vehicle.
3. Turn meal and line-skipping options on or off. Their price fields appear only when selected.
4. Choose a date to load its imported prices.

Park prices are display-only and load from the connected Google Sheet. Dates without imported rows use the presets.

Select any visual-comparison row to expand its details immediately below that option. Calculated values are explicitly labeled **Calculated family ticket total** and **Calculated family total**. Select the option again to collapse it; there is no separate price table.

## Publish as a Google Apps Script web app

This makes the deployment URL open the comparator itself and connects it directly to the spreadsheet.

1. Create a new Google Sheet.
2. Open **Extensions → Apps Script**.
3. Replace the script editor contents with `Code.gs` and save.
4. Click **+** beside Files, choose **HTML**, and name it `index`.
5. Copy everything from the included `index.html` into that new Apps Script HTML file and save.
6. In the function menu, select `setupSheet`, click **Run**, and approve access. This creates or repairs the headers automatically.
7. Select **Deploy → New deployment → Web app**.
8. Run as yourself and allow access for anyone with the link.
9. Open the deployment URL. It will display the comparator and save directly to the connected sheet.

The script creates a `Price History` sheet with these columns:

`Date | Saved At | Option | Ticket Price | Parking Per Vehicle | Meal Per Person | Line Skip Per Person`

Changing the date loads its spreadsheet prices. If the date has no imported rows, the comparator displays its preset prices. The website does not provide manual park-price entry.

If the `Price History` tab already exists without headers, run `setupSheet`. After changing either Apps Script file, redeploy using **Deploy → Manage deployments → Edit → New version → Deploy**.

## Import the supplied Schlitterbahn prices

The included Apps Script has an `importSchlitterbahnPrices` function containing the dated prices visible in the July and August 2026 screenshots. To add them:

1. Paste the updated `Code.gs` into Apps Script and save.
2. Select `importSchlitterbahnPrices` from the function menu.
3. Click **Run** and approve access if prompted.

It adds or updates 31 dated Schlitterbahn rows while preserving other park rows. Unavailable dates are omitted. The imported row uses $20 parking and $49 line skipping. Confirmed meal bundles are stored as a $10 add-on; dates where the response contained no meal bundle retain $0.

## Import all supplied/current dated prices

Run `importAllProvidedPrices` from the Apps Script function menu to:

- import the complete dated SeaWorld ticket, dining, and Ultimate Bundle pricing supplied on July 22, 2026;
- import the complete dated standalone Aquatica ticket and dining pricing supplied on July 22, 2026;
- import the supplied Fiesta Texas ticket, meal-bundle, and Fast Lane calendar prices;
- import the supplied Schlitterbahn ticket and meal-bundle calendar prices.

The import updates matching park/date rows without deleting other options. SeaWorld parking is $36; Fiesta Texas and Schlitterbahn parking are $20. The Gold Pass preset is $95. The page merges dated spreadsheet rows with its fixed-price presets, so season passes and other options remain visible.

Aquatica is listed as its own one-day ticket. **SeaWorld + Aquatica (1 Day)** is a calculated comparison equal to both dated ticket prices added together; it is not an official one-day bundle. Parking is charged once using the higher applicable parking amount. Selected meal and line-skipping add-ons are summed across both parks. The SeaWorld + Aquatica season pass remains available.

Dates explicitly marked `IsClosed: true` in the supplied SeaWorld or Aquatica JSON display **Closed** instead of a price and are excluded from the chart. The calculated SeaWorld + Aquatica option is closed if either park is closed. Six Flags and Schlitterbahn are not marked closed unless their supplied data explicitly identifies a closure; missing dates are not assumed to be closed.

SeaWorld's calendar URL currently returns `No Calendar Data` without SeaWorld's browser session, so the importer uses the complete supplied dataset instead of depending on that unreliable endpoint.

## Data format

Each saved park option uses one admission value:

```json
{
  "name": "SeaWorld (1 Day)",
  "ticketPrice": 43,
  "parking": 0,
  "meal": 41.99,
  "fastPass": 0
}
```

The **Family ticket total** is `guests × ticketPrice`. The **Family total with selected options** adds parking plus meals and line skipping when their checkboxes are selected. Status labels above the prices make the included options visible.
