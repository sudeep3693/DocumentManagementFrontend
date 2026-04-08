import React, { useState, useRef, useEffect, useCallback } from 'react';

// ============= BS Calendar Data =============
const BS_MONTHS = ['बैशाख','जेठ','असार','श्रावण','भदौ','असोज','कार्तिक','मंसिर','पुष','माघ','फाल्गुन','चैत'];
const BS_MONTHS_EN = ['Baisakh','Jestha','Asar','Shrawan','Bhadra','Ashoj','Kartik','Mangsir','Poush','Magh','Falgun','Chaitra'];
const BS_WEEKDAYS = ['आ','सो','मं','बु','बि','शु','श'];

// BS calendar days per month data (2000-2090 BS)
const BS_CALENDAR_DATA = {
  2000:[30,32,31,32,31,30,30,30,29,30,29,31],2001:[31,31,32,31,31,31,30,29,30,29,30,30],2002:[31,31,32,32,31,30,30,29,30,29,30,30],2003:[31,32,31,32,31,30,30,30,29,29,30,31],2004:[30,32,31,32,31,30,30,30,29,30,29,31],2005:[31,31,32,31,31,31,30,29,30,29,30,30],2006:[31,31,32,32,31,30,30,29,30,29,30,30],2007:[31,32,31,32,31,30,30,30,29,29,30,31],2008:[31,31,31,32,31,31,29,30,30,29,29,31],2009:[31,31,32,31,31,31,30,29,30,29,30,30],
  2010:[31,31,32,32,31,30,30,29,30,29,30,30],2011:[31,32,31,32,31,30,30,30,29,29,30,31],2012:[31,31,31,32,31,31,29,30,30,29,30,30],2013:[31,31,32,31,31,31,30,29,30,29,30,30],2014:[31,31,32,32,31,30,30,29,30,29,30,30],2015:[31,32,31,32,31,30,30,30,29,29,30,31],2016:[31,31,31,32,31,31,29,30,30,29,30,30],2017:[31,32,31,32,31,30,30,30,29,29,30,31],2018:[31,31,32,32,31,30,30,29,30,29,30,30],2019:[31,32,31,32,31,30,30,30,29,30,29,31],
  2020:[31,31,31,32,31,31,30,29,30,29,30,30],2021:[31,31,32,31,31,31,30,29,30,29,30,30],2022:[31,32,31,32,31,30,30,30,29,29,30,30],2023:[31,32,31,32,31,30,30,30,29,30,29,31],2024:[31,31,31,32,31,31,30,29,30,29,30,30],2025:[31,31,32,31,31,31,30,29,30,29,30,30],2026:[31,32,31,32,31,30,30,30,29,29,30,31],2027:[30,32,31,32,31,30,30,30,29,30,29,31],2028:[31,31,32,31,31,31,30,29,30,29,30,30],2029:[31,31,32,31,32,30,30,29,30,29,30,30],
  2030:[31,32,31,32,31,30,30,30,29,29,30,31],2031:[30,32,31,32,31,30,30,30,29,30,29,31],2032:[31,31,32,31,31,31,30,29,30,29,30,30],2033:[31,31,32,32,31,30,30,29,30,29,30,30],2034:[31,32,31,32,31,30,30,30,29,29,30,31],2035:[30,32,31,32,31,31,29,30,30,29,29,31],2036:[31,31,32,31,31,31,30,29,30,29,30,30],2037:[31,31,32,32,31,30,30,29,30,29,30,30],2038:[31,32,31,32,31,30,30,30,29,29,30,31],2039:[31,31,31,32,31,31,29,30,30,29,30,30],
  2040:[31,31,32,31,31,31,30,29,30,29,30,30],2041:[31,31,32,32,31,30,30,29,30,29,30,30],2042:[31,32,31,32,31,30,30,30,29,29,30,31],2043:[31,31,31,32,31,31,29,30,30,29,30,30],2044:[31,31,32,31,31,31,30,29,30,29,30,30],2045:[31,32,31,32,31,30,30,30,29,29,30,31],2046:[31,31,31,32,31,31,29,30,30,29,30,30],2047:[31,32,31,32,31,30,30,30,29,30,29,31],2048:[31,31,31,32,31,31,30,29,30,29,30,30],2049:[31,31,32,31,31,31,30,29,30,29,30,30],
  2050:[31,32,31,32,31,30,30,30,29,29,30,30],2051:[31,31,32,31,31,31,30,29,30,29,30,30],2052:[31,31,32,31,32,30,30,29,30,29,30,30],2053:[31,32,31,32,31,30,30,30,29,29,30,31],2054:[31,31,31,32,31,31,29,30,30,29,30,30],2055:[31,31,32,31,31,31,30,29,30,30,29,30],2056:[31,32,31,32,31,30,30,30,29,29,30,30],2057:[31,31,32,31,31,31,30,29,30,29,30,30],2058:[31,31,32,32,31,30,30,29,30,29,30,30],2059:[31,32,31,32,31,30,30,30,29,29,30,31],
  2060:[30,32,31,32,31,30,30,30,29,30,29,31],2061:[31,31,32,31,31,31,30,29,30,29,30,30],2062:[31,31,32,32,31,30,30,29,30,29,30,30],2063:[31,32,31,32,31,30,30,30,29,29,30,31],2064:[31,31,31,32,31,31,29,30,30,29,30,30],2065:[31,31,32,31,31,31,30,29,30,29,30,30],2066:[31,32,31,32,31,30,30,30,29,29,30,30],2067:[31,31,32,31,31,31,30,29,30,29,30,30],2068:[31,31,32,32,31,30,30,29,30,29,30,30],2069:[31,32,31,32,31,30,30,30,29,29,30,31],
  2070:[31,31,31,32,31,31,29,30,30,29,30,30],2071:[31,31,32,31,31,31,30,29,30,29,30,30],2072:[31,32,31,32,31,30,30,30,29,29,30,30],2073:[31,31,32,31,31,31,30,29,30,29,30,30],2074:[31,31,32,32,31,30,30,29,30,29,30,30],2075:[31,32,31,32,31,30,30,30,29,29,30,31],2076:[31,31,31,32,31,31,29,30,30,29,30,30],2077:[31,31,32,31,31,31,30,29,30,29,30,30],2078:[31,32,31,32,31,30,30,30,29,29,30,30],2079:[31,31,32,31,31,31,30,29,30,29,30,30],
  2080:[31,32,31,32,31,30,30,30,29,29,30,30],2081:[31,31,32,31,31,31,30,29,30,29,30,30],2082:[31,31,32,32,31,30,30,29,30,29,30,30],2083:[31,32,31,32,31,30,30,30,29,29,30,31],2084:[31,31,31,32,31,31,29,30,30,29,30,30],2085:[31,31,32,31,31,31,30,29,30,29,30,30],2086:[31,32,31,32,31,30,30,30,29,29,30,30],2087:[31,31,32,31,31,31,30,29,30,29,30,30],2088:[31,31,32,32,31,30,30,29,30,29,30,30],2089:[31,32,31,32,31,30,30,30,29,29,30,31],
  2090:[31,31,31,32,31,31,29,30,30,29,30,30],
};

// Reference date: BS 2000/01/01 = AD 1943/04/14, which is a Wednesday (day 3)
const BS_REF = { year: 2000, month: 1, day: 1 };
const AD_REF = new Date(1943, 3, 14); // April 14, 1943
const REF_DAY_OF_WEEK = 3; // Wednesday

// Nepali digit conversion helpers
export const nepaliDigits = ['०','१','२','३','४','५','६','७','८','९'];
export const toNepaliDigits = (num) => String(num).replace(/[0-9]/g, d => nepaliDigits[d]);
export const toEnglishDigits = (str) => {
  if (!str) return '';
  return str.replace(/[०-९]/g, ch => nepaliDigits.indexOf(ch).toString());
};

const getDaysInBsMonth = (year, month) => {
  if (BS_CALENDAR_DATA[year]) return BS_CALENDAR_DATA[year][month - 1];
  return 30; // fallback
};

// Count total BS days from reference to given BS date
const bsDaysFromRef = (y, m, d) => {
  let total = 0;
  for (let yr = BS_REF.year; yr < y; yr++) {
    if (BS_CALENDAR_DATA[yr]) {
      total += BS_CALENDAR_DATA[yr].reduce((a, b) => a + b, 0);
    }
  }
  for (let mo = 1; mo < m; mo++) {
    total += getDaysInBsMonth(y, mo);
  }
  total += d - 1;
  return total;
};

// Convert BS to AD
export const bsToAd = (bsY, bsM, bsD) => {
  const daysDiff = bsDaysFromRef(bsY, bsM, bsD);
  const ad = new Date(AD_REF);
  ad.setDate(ad.getDate() + daysDiff);
  return ad;
};

// Convert AD to BS
export const adToBs = (adDate) => {
  const d = new Date(adDate.getFullYear(), adDate.getMonth(), adDate.getDate());
  const diff = Math.floor((d - AD_REF) / (1000 * 60 * 60 * 24));
  let bsY = BS_REF.year;
  let bsM = 1;
  let bsD = 1;
  let remaining = diff;

  while (remaining > 0) {
    const data = BS_CALENDAR_DATA[bsY];
    if (!data) break;
    const yearDays = data.reduce((a, b) => a + b, 0);
    if (remaining >= yearDays) {
      remaining -= yearDays;
      bsY++;
      continue;
    }
    for (let m = 0; m < 12; m++) {
      if (remaining >= data[m]) {
        remaining -= data[m];
      } else {
        bsM = m + 1;
        bsD = remaining + 1;
        remaining = 0;
        break;
      }
    }
  }
  return { year: bsY, month: bsM, day: bsD };
};

// Get day of week for BS date (0=Sun ... 6=Sat)
const getDayOfWeek = (bsY, bsM, bsD) => {
  const days = bsDaysFromRef(bsY, bsM, bsD);
  return (REF_DAY_OF_WEEK + days) % 7;
};

// Get today in BS
export const getTodayBs = () => adToBs(new Date());

// Format BS date as YYYY-MM-DD
export const formatBs = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

// Format AD date as YYYY-MM-DD
export const formatAd = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

// Parse BS date string (handles both EN and NE digits)
export const parseBsDate = (str) => {
  if (!str) return null;
  const normalized = toEnglishDigits(String(str));
  const parts = normalized.split('-');
  if (parts.length !== 3) return null;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  return { year: y, month: m, day: d };
};

// ============= Calendar Component =============
const NepaliDatePickerWrapper = ({ name, value, onChange, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Parse current value
  const normalizedValue = (() => {
    if (!value) return '';
    if (typeof value === 'object' && value.bsDate) return toEnglishDigits(value.bsDate);
    if (typeof value === 'string') return toEnglishDigits(value);
    return '';
  })();

  const parsed = parseBsDate(normalizedValue);
  const today = getTodayBs();

  const [viewYear, setViewYear] = useState(parsed?.year || today.year);
  const [viewMonth, setViewMonth] = useState(parsed?.month || today.month);

  // Update view when value changes
  useEffect(() => {
    if (parsed) {
      setViewYear(parsed.year);
      setViewMonth(parsed.month);
    }
  }, [normalizedValue]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleDateSelect = useCallback((day) => {
    const bsDateEn = formatBs(viewYear, viewMonth, day);
    const bsDate = toNepaliDigits(bsDateEn);
    const adDate = bsToAd(viewYear, viewMonth, day);
    const adStr = formatAd(adDate);
    onChange({ target: { name, value: { bsDate, adDate: adStr } } });
    setIsOpen(false);
  }, [viewYear, viewMonth, name, onChange]);

  const prevMonth = () => {
    if (viewMonth === 1) { setViewMonth(12); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 12) { setViewMonth(1); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const goToToday = () => {
    setViewYear(today.year);
    setViewMonth(today.month);
    handleDateSelect(today.day);
  };

  const clearDate = () => {
    onChange({ target: { name, value: '' } });
    setIsOpen(false);
  };

  // Build calendar grid
  const daysInMonth = getDaysInBsMonth(viewYear, viewMonth);
  const firstDow = getDayOfWeek(viewYear, viewMonth, 1);
  const calendarCells = [];

  // Empty cells for days before month start
  for (let i = 0; i < firstDow; i++) {
    calendarCells.push({ day: null, key: `e${i}` });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push({ day: d, key: d });
  }

  const isSelected = (day) => parsed && parsed.year === viewYear && parsed.month === viewMonth && parsed.day === day;
  const isToday = (day) => today.year === viewYear && today.month === viewMonth && today.day === day;

  // Year range for dropdown
  const years = [];
  for (let y = 2000; y <= 2090; y++) years.push(y);

  // Display value with Nepali digits
  const displayValue = normalizedValue ? toNepaliDigits(normalizedValue) : '';

  return (
    <div className="nepali-datepicker-wrapper" ref={wrapperRef}>
      <div className="nepali-datepicker-input-container">
        <span className="nepali-datepicker-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </span>
        <input
          type="text"
          className={`nepali-dp-input ${isOpen ? 'active' : ''} ${className || ''}`}
          value={displayValue}
          placeholder="मिति छान्नुहोस्"
          readOnly
          onClick={() => setIsOpen(!isOpen)}
        />
      </div>

      {isOpen && (
        <div className="nepali-calendar-popup">
          <div className="calendar-header">
            <button type="button" className="calendar-nav-btn" onClick={prevMonth}>‹</button>
            <div className="calendar-title">
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
              >
                {BS_MONTHS.map((m, i) => (
                  <option key={i} value={i + 1}>{m} ({BS_MONTHS_EN[i]})</option>
                ))}
              </select>
              <select
                value={viewYear}
                onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
              >
                {years.map(y => (
                  <option key={y} value={y}>{toNepaliDigits(y)}</option>
                ))}
              </select>
            </div>
            <button type="button" className="calendar-nav-btn" onClick={nextMonth}>›</button>
          </div>

          <div className="calendar-weekdays">
            {BS_WEEKDAYS.map((w, i) => (
              <span key={i} className="calendar-weekday">{w}</span>
            ))}
          </div>

          <div className="calendar-days">
            {calendarCells.map(cell => (
              <button
                type="button"
                key={cell.key}
                className={`calendar-day ${!cell.day ? 'empty' : ''} ${cell.day && isToday(cell.day) ? 'today' : ''} ${cell.day && isSelected(cell.day) ? 'selected' : ''}`}
                onClick={() => cell.day && handleDateSelect(cell.day)}
                disabled={!cell.day}
              >
                {cell.day ? toNepaliDigits(cell.day) : ''}
              </button>
            ))}
          </div>

          <div className="calendar-footer">
            <button type="button" className="calendar-today-btn" onClick={goToToday}>आज</button>
            <button type="button" className="calendar-clear-btn" onClick={clearDate}>मेटाउनुहोस्</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NepaliDatePickerWrapper;
