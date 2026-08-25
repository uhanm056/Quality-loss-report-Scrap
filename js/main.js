/* Start aplikace
   Spouští se až po načtení všech ostatních skriptů — ty jsou v index.html
   uvedené v pořadí data → jádro → záložky → import → main.
   Součást aplikace Scrap & QLR — Yanfeng Plant 1032. */

document.getElementById('sTgt').value=SET.target;
document.getElementById('sDays').value=SET.workdays;
const ms0=monthsAvail();if(ms0.length)curMonth=ms0[ms0.length-1];
renderBar();renderQ();renderDash();renderDays();renderSrc();renderTgt();
