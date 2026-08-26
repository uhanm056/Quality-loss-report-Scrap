/* Start aplikace
   Spouští se až po načtení všech ostatních skriptů — ty jsou v index.html
   uvedené v pořadí data → jádro → záložky → import → main.
   Součást aplikace Scrap & QLR — Yanfeng Plant 1032. */

document.getElementById('sRwTgt').value=SET.rwTarget;
document.getElementById('sRwRate').value=SET.rwRate;
const ms0=monthsAvail();if(ms0.length)curMonth=ms0[ms0.length-1];
const rw0=rwMonths();if(rw0.length)curRwMonth=rw0[rw0.length-1];
renderBar();renderQ();renderDash();renderDays();renderSrc();renderTgt();renderRework();
