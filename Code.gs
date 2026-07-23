const SHEET_NAME = 'Price History';
const HEADERS = ['Date', 'Saved At', 'Option', 'Ticket Price', 'Parking Per Vehicle', 'Meal Per Person', 'Line Skip Per Person'];

function doGet(e) {
  if (!e || !e.parameter || !e.parameter.api) {
    return HtmlService.createHtmlOutputFromFile('index')
      .setTitle('Theme Park Price Comparator')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }
  const sheet = getSheet_();
  const date = String((e && e.parameter && e.parameter.date) || '');
  if (!date) return json_({ dates: [...new Set(sheet.getDataRange().getValues().slice(1).map(r => formatDate_(r[0])).filter(Boolean))].sort().reverse() });
  const snapshot=getSnapshot(date);
  return snapshot ? json_(snapshot) : json_({ error:'No snapshot found', date:date });
}

function getSnapshot(date) {
  const sheet = getSheet_();
  const wanted = String(date || '');
  const rows = sheet.getDataRange().getValues().slice(1).filter(r => formatDate_(r[0]) === wanted);
  if (!rows.length) return null;
  const closed=closedOptionsForDate_(wanted);
  return { date:wanted, savedAt:rows[0][1], parks:rows.map(r => ({ name:r[2], ticketPrice:Number(r[3])||0, parking:Number(r[4])||0, meal:Number(r[5])||0, fastPass:Number(r[6])||0, closed:closed.indexOf(String(r[2]))>=0 })) };
}

function closedOptionsForDate_(date) {
  const seaWorld='2026-08-10,2026-08-11,2026-08-12,2026-08-17,2026-08-18,2026-08-19,2026-08-24,2026-08-25,2026-08-26,2026-08-31,2026-09-01,2026-09-02,2026-09-08,2026-09-09,2026-09-14,2026-09-15,2026-09-16,2026-09-21,2026-09-22,2026-09-23,2026-09-28,2026-09-29,2026-09-30,2026-10-05,2026-10-06,2026-10-07,2026-10-13,2026-10-14,2026-10-19,2026-10-20,2026-10-21,2026-10-26,2026-10-27,2026-10-28,2026-11-02,2026-11-03,2026-11-04,2026-11-09,2026-11-10,2026-11-16,2026-11-17,2026-11-18,2026-11-30,2026-12-01,2026-12-02,2026-12-07,2026-12-08,2026-12-09,2026-12-14,2026-12-15,2026-12-16'.split(',');
  const aquatica='2026-08-10,2026-08-11,2026-08-12,2026-08-13,2026-08-17,2026-08-18,2026-08-19,2026-08-20,2026-08-24,2026-08-25,2026-08-26,2026-08-27,2026-08-31,2026-09-01,2026-09-02,2026-09-03,2026-09-08,2026-09-09,2026-09-10,2026-09-11,2026-09-14,2026-09-15,2026-09-16,2026-09-17,2026-09-18,2026-09-21,2026-09-22,2026-09-23,2026-09-24,2026-09-25,2026-09-28,2026-09-29,2026-09-30,2026-10-01,2026-10-02,2026-10-05,2026-10-06,2026-10-07,2026-10-08,2026-10-09,2026-10-13,2026-10-14,2026-10-15,2026-10-16,2026-10-17,2026-10-18,2026-10-19,2026-10-20,2026-10-21,2026-10-22,2026-10-23,2026-10-24,2026-10-25,2026-10-26,2026-10-27,2026-10-28,2026-10-29,2026-10-30,2026-10-31,2026-11-01,2026-11-02,2026-11-03,2026-11-04,2026-11-05,2026-11-06,2026-11-07,2026-11-08,2026-11-09,2026-11-10,2026-11-11,2026-11-12,2026-11-13,2026-11-14,2026-11-15,2026-11-16,2026-11-17,2026-11-18,2026-11-19,2026-11-20,2026-11-21,2026-11-22,2026-11-23,2026-11-24,2026-11-25,2026-11-26,2026-11-27,2026-11-28,2026-11-29,2026-11-30,2026-12-01,2026-12-02,2026-12-03,2026-12-04,2026-12-05,2026-12-06,2026-12-07,2026-12-08,2026-12-09,2026-12-10,2026-12-11,2026-12-12,2026-12-13,2026-12-14,2026-12-15,2026-12-16,2026-12-17,2026-12-18,2026-12-19,2026-12-20,2026-12-21,2026-12-22,2026-12-23,2026-12-24,2026-12-25,2026-12-26,2026-12-27,2026-12-28,2026-12-29,2026-12-30,2026-12-31'.split(',');
  const result=[];
  if (seaWorld.indexOf(date)>=0) result.push('SeaWorld (1 Day)');
  if (aquatica.indexOf(date)>=0) result.push('Aquatica (1 Day)');
  if (seaWorld.indexOf(date)>=0 || aquatica.indexOf(date)>=0) result.push('SeaWorld + Aquatica (1 Day)');
  return result;
}

function saveSnapshot(data) {
  if (!data || !data.date || !Array.isArray(data.parks)) throw new Error('Invalid snapshot');
  const sheet = getSheet_(), values = sheet.getDataRange().getValues();
  for (let i=values.length-1; i>=1; i--) if (formatDate_(values[i][0]) === data.date) sheet.deleteRow(i+1);
  const rows = data.parks.map(p => [data.date, data.savedAt || new Date().toISOString(), p.name, Number(p.ticketPrice)||0, Number(p.parking)||0, Number(p.meal)||0, Number(p.fastPass)||0]);
  if (rows.length) sheet.getRange(sheet.getLastRow()+1,1,rows.length,HEADERS.length).setValues(rows);
  return { ok:true, date:data.date, rows:rows.length };
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  try { return json_(saveSnapshot(data)); }
  catch (err) { return json_({ error:String(err.message || err) }); }
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  ensureHeaders_(sheet);
  return sheet;
}
function ensureHeaders_(sheet) {
  const current = sheet.getRange(1, 1, 1, HEADERS.length).getDisplayValues()[0];
  const missing = HEADERS.some((header, i) => current[i] !== header);
  if (missing) {
    const rowHasContent = current.some(value => value !== '');
    if (rowHasContent) sheet.insertRowBefore(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  sheet.autoResizeColumns(1, HEADERS.length);
}

// Optional: run this once from the Apps Script editor to create/repair the tab.
function setupSheet() {
  getSheet_();
}

// Run once to import the Schlitterbahn one-day prices shown on July 22, 2026.
// Dates that appeared unavailable in the screenshots are intentionally omitted.
function importSchlitterbahnPrices() {
  const data = [
    ['2026-07-22',59,10],['2026-07-23',55,10],['2026-07-24',55,10],['2026-07-25',65,10],['2026-07-26',59,10],['2026-07-27',55,10],['2026-07-28',55,10],['2026-07-29',55,10],['2026-07-30',55,10],['2026-07-31',55,10],
    ['2026-08-01',65,10],['2026-08-02',59,10],['2026-08-03',55,10],['2026-08-04',55,10],['2026-08-05',55,10],['2026-08-06',55,10],['2026-08-07',55,10],['2026-08-08',59,10],['2026-08-09',59,10],['2026-08-10',45,0],['2026-08-11',45,0],['2026-08-12',45,0],['2026-08-13',45,0],['2026-08-14',45,0],['2026-08-15',59,10],['2026-08-16',55,10],['2026-08-22',55,10],['2026-08-23',49,10],['2026-08-29',55,10],['2026-08-30',49,10],['2026-09-05',55,10]
  ];
  return upsertPriceRows_(data.map(r => [r[0], new Date().toISOString(), 'Schlitterbahn (1 Day)', r[1], 20, r[2], 49]));
}

function importFiestaTexasPrices() {
  const data = [
    ['2026-07-22',49,20,40],['2026-07-23',39,20,40],['2026-07-24',45,20,44],['2026-07-25',49,20,50],['2026-07-26',45,20,44],['2026-07-27',45,20,44],['2026-07-28',39,20,40],['2026-07-29',39,20,40],['2026-07-30',39,20,40],['2026-07-31',45,20,44],
    ['2026-08-01',49,20,50],['2026-08-02',45,20,44],['2026-08-03',45,20,44],['2026-08-04',39,20,40],['2026-08-05',39,20,40],['2026-08-06',39,20,40],['2026-08-07',45,20,44],['2026-08-08',49,20,50],['2026-08-09',45,20,44],['2026-08-10',39,20,40],['2026-08-11',39,20,40],['2026-08-15',45,20,44],['2026-08-16',39,20,40],['2026-08-22',45,20,44],['2026-08-23',39,20,40],['2026-08-29',45,20,44],['2026-08-30',39,20,40],['2026-09-05',45,20,44]
  ];
  return upsertPriceRows_(data.map(r => [r[0], new Date().toISOString(), 'Fiesta Texas (1 Day)', r[1], 20, r[2], r[3]]));
}

function refreshSeaWorldPrices() {
  // The public-looking calendar URL returns "No Calendar Data" without
  // SeaWorld's browser session. These are the complete prices supplied on
  // 2026-07-22, grouped compactly by ticket price.
  const groups = {
    '43.99':'2026-07-22,2026-10-22,2026-10-29,2026-11-05,2026-11-12,2026-11-19,2026-12-03,2026-12-10,2026-12-11,2026-12-14,2026-12-15,2026-12-16,2026-12-17',
    '47.99':'2026-08-27',
    '51.99':'2026-07-23,2026-08-17,2026-08-18,2026-08-19,2026-08-24,2026-08-25,2026-08-26,2026-08-31,2026-09-01,2026-09-02,2026-09-08,2026-09-09,2026-09-14,2026-09-15,2026-09-16,2026-09-21,2026-09-22,2026-09-23,2026-09-28,2026-09-29,2026-09-30,2026-10-05,2026-10-06,2026-10-07,2026-10-13,2026-10-14,2026-10-19,2026-10-20,2026-10-21,2026-10-26,2026-10-27,2026-10-28,2026-11-02,2026-11-03,2026-11-04,2026-11-09,2026-11-10,2026-11-11',
    '53.99':'2026-07-27,2026-07-28,2026-07-29,2026-07-30,2026-08-10,2026-08-11,2026-08-12,2026-09-03,2026-09-10,2026-09-24,2026-10-30,2026-11-24,2026-11-25,2026-12-06,2026-12-12,2026-12-13',
    '55.99':'2026-07-26,2026-09-17,2026-10-08,2026-10-12,2026-10-15,2026-10-23,2026-10-25,2026-11-06,2026-11-23,2026-12-18',
    '57.99':'2026-07-24,2026-08-03,2026-08-04,2026-08-05,2026-10-01,2026-12-04,2026-12-21,2026-12-22,2026-12-23,2026-12-28,2026-12-29,2026-12-31',
    '59.99':'2026-08-06,2026-08-13,2026-09-25,2026-09-27,2026-11-01,2026-11-13,2026-12-05,2026-12-19,2026-12-20,2026-12-30',
    '61.99':'2026-07-25,2026-08-20,2026-10-24,2026-10-31,2026-11-08,2026-11-20,2026-11-22,2026-11-26,2026-11-27,2026-12-24,2026-12-25',
    '63.99':'2026-10-09,2026-10-11,2026-10-16,2026-10-18,2026-11-07,2026-12-27',
    '65.99':'2026-09-11,2026-09-18,2026-11-14,2026-11-15,2026-11-16,2026-11-17,2026-11-18,2026-11-29,2026-11-30,2026-12-01,2026-12-02,2026-12-07,2026-12-08,2026-12-09,2026-12-26',
    '67.99':'2026-08-21,2026-10-02,2026-11-21',
    '69.99':'2026-07-31,2026-08-02,2026-08-14,2026-08-28,2026-09-04,2026-09-20,2026-11-28',
    '71.99':'2026-08-07,2026-08-16,2026-09-13,2026-09-19,2026-09-26,2026-10-04,2026-10-10',
    '73.99':'2026-08-09,2026-08-23,2026-09-07,2026-09-12,2026-10-17',
    '75.99':'2026-08-01,2026-10-03',
    '77.99':'2026-08-08,2026-08-15,2026-08-29,2026-08-30,2026-09-05,2026-09-06',
    '79.99':'2026-08-22'
  };
  const now = new Date().toISOString();
  const rows = [];
  Object.keys(groups).forEach(price => groups[price].split(',').forEach(date => {
    rows.push([date, now, 'SeaWorld (1 Day)', Number(price), 36, 40, 50]);
  }));
  return upsertPriceRows_(rows);
}

function importAllProvidedPrices() {
  const seaWorld = refreshSeaWorldPrices();
  const aquatica = importAquaticaPrices();
  const seaWorldAquatica = buildSeaWorldAquaticaPrices();
  const fiesta = importFiestaTexasPrices();
  const schlitterbahn = importSchlitterbahnPrices();
  return { seaWorld:seaWorld, aquatica:aquatica, seaWorldAquatica:seaWorldAquatica, fiestaTexas:fiesta, schlitterbahn:schlitterbahn };
}

function buildSeaWorldAquaticaPrices() {
  const values = getSheet_().getDataRange().getValues().slice(1);
  const seaWorld={}, aquatica={};
  values.forEach(row => {
    const date=formatDate_(row[0]), option=String(row[2]);
    if (option === 'SeaWorld (1 Day)') seaWorld[date]=row;
    if (option === 'Aquatica (1 Day)') aquatica[date]=row;
  });
  const now=new Date().toISOString(), rows=[];
  Object.keys(seaWorld).sort().forEach(date => {
    if (!aquatica[date]) return;
    const sw=seaWorld[date], aq=aquatica[date];
    rows.push([date,now,'SeaWorld + Aquatica (1 Day)',Number(sw[3])+Number(aq[3]),Math.max(Number(sw[4])||0,Number(aq[4])||0),Number(sw[5]||0)+Number(aq[5]||0),Number(sw[6]||0)+Number(aq[6]||0)]);
  });
  return upsertPriceRows_(rows);
}

function importAquaticaPrices() {
  const groups = {
    '36.99':'2026-08-17,2026-08-18,2026-08-19,2026-08-20,2026-08-24,2026-08-25,2026-08-26,2026-08-27,2026-08-31,2026-09-01,2026-09-02,2026-09-03,2026-09-08,2026-09-09,2026-09-10,2026-09-11,2026-09-14,2026-09-15,2026-09-16,2026-09-17,2026-09-18,2026-09-21,2026-09-22,2026-09-23,2026-09-24,2026-09-25,2026-09-28,2026-09-29,2026-09-30,2026-10-01,2026-10-02,2026-10-05,2026-10-06,2026-10-07,2026-10-08,2026-10-09,2026-10-13,2026-10-14,2026-10-15,2026-10-16,2026-10-19,2026-10-20,2026-10-21,2026-10-22,2026-10-23,2026-10-26,2026-10-27,2026-10-28,2026-10-29,2026-10-30',
    '37.99':'2026-09-13,2026-09-20,2026-09-27,2026-10-04,2026-10-11,2026-10-12,2026-11-01,2026-11-02,2026-11-03,2026-11-04,2026-11-05,2026-11-06,2026-11-07,2026-11-08,2026-11-09,2026-11-10,2026-11-11,2026-11-12,2026-11-13,2026-11-14,2026-11-15,2026-11-16,2026-11-17,2026-11-18,2026-11-19,2026-11-20,2026-11-21,2026-11-22,2026-11-23,2026-11-24,2026-11-25,2026-11-26,2026-11-27,2026-11-28,2026-11-29,2026-11-30,2026-12-01,2026-12-02,2026-12-03,2026-12-04,2026-12-05,2026-12-06,2026-12-07,2026-12-08,2026-12-09,2026-12-10,2026-12-11,2026-12-12,2026-12-13,2026-12-14,2026-12-15,2026-12-16,2026-12-17,2026-12-18,2026-12-19,2026-12-20,2026-12-21,2026-12-22,2026-12-23,2026-12-24,2026-12-25,2026-12-26,2026-12-27,2026-12-28,2026-12-29,2026-12-30,2026-12-31',
    '39.99':'2026-09-12,2026-09-19,2026-09-26,2026-10-03,2026-10-10,2026-10-17,2026-10-18,2026-10-24,2026-10-25,2026-10-31',
    '42.99':'2026-08-10,2026-08-11,2026-08-12',
    '44.99':'2026-07-22,2026-07-23,2026-07-27,2026-07-28,2026-08-03,2026-08-04',
    '47.99':'2026-08-05,2026-08-13,2026-08-21,2026-08-28',
    '49.99':'2026-07-24,2026-07-26,2026-07-29,2026-07-30,2026-09-04',
    '52.99':'2026-08-06,2026-08-14',
    '54.99':'2026-07-25,2026-07-31,2026-08-02,2026-08-16,2026-08-23,2026-08-30,2026-09-07',
    '57.99':'2026-08-07,2026-08-09,2026-08-15,2026-08-22,2026-08-29',
    '59.99':'2026-08-01',
    '61.99':'2026-08-08,2026-09-05,2026-09-06'
  };
  const now = new Date().toISOString();
  const rows=[];
  Object.keys(groups).forEach(price => groups[price].split(',').forEach(date => rows.push([date,now,'Aquatica (1 Day)',Number(price),36,25,0])));
  return upsertPriceRows_(rows);
}

function upsertPriceRows_(rows) {
  const sheet = getSheet_();
  const values = sheet.getDataRange().getValues();
  const existing = {};
  for (let i=1; i<values.length; i++) existing[formatDate_(values[i][0])+'|'+String(values[i][2])] = i+1;
  let updated=0;
  const additions=[];
  rows.forEach(row => {
    const key=formatDate_(row[0])+'|'+String(row[2]);
    if (existing[key]) { sheet.getRange(existing[key],1,1,HEADERS.length).setValues([row]); updated++; }
    else additions.push(row);
  });
  if (additions.length) sheet.getRange(sheet.getLastRow()+1,1,additions.length,HEADERS.length).setValues(additions);
  return { updated:updated, added:additions.length, total:rows.length };
}
function formatDate_(value) { return value instanceof Date ? Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd') : String(value || '').slice(0,10); }
function json_(data) { return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON); }
