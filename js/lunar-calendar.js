/**
 * Vietnamese Lunar Calendar Conversion Engine
 * Dựa trên thuật toán của Hồ Ngọc Đức
 */
window.GiaPha = window.GiaPha || {};

window.GiaPha.lunar = (function() {
    const PI = Math.PI;
    const TIMEZONE = 7.0; // Múi giờ Việt Nam

    const THIEN_CAN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
    const DIA_CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];

    // --- CÁC HÀM TOÁN HỌC CƠ BẢN CỦA THUẬT TOÁN HỒ NGỌC ĐỨC ---
    function INT(d) {
        return Math.floor(d);
    }

    function jdFromDate(dd, mm, yyyy) {
        let a = INT((14 - mm) / 12);
        let y = yyyy + 4800 - a;
        let m = mm + 12 * a - 3;
        let jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - INT(y / 100) + INT(y / 400) - 32045;
        if (jd < 2299161) {
            jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - 32083;
        }
        return jd;
    }

    function jdToDate(jd) {
        let a, b, c, d, e, m, day, month, year;
        if (jd > 2299160) {
            a = jd + 32044;
            b = INT((4 * a + 3) / 146097);
            c = a - INT((146097 * b) / 4);
        } else {
            b = 0;
            c = jd + 32082;
        }
        d = INT((4 * c + 3) / 1461);
        e = c - INT((1461 * d) / 4);
        m = INT((5 * e + 2) / 153);
        day = e - INT((153 * m + 2) / 5) + 1;
        month = m + 3 - 12 * INT(m / 10);
        year = b * 100 + d - 4800 + INT(m / 10);
        return { day, month, year };
    }

    function getSunLongitude(dayNumber, timeZone) {
        let t = (dayNumber - 2451545.5 - timeZone / 24.0) / 36525.0;
        let t2 = t * t;
        let dr = PI / 180.0;
        let l = 280.460 + 36000.770 * t;
        let g = 357.528 + 35999.050 * t;
        let lambda = l + 1.915 * Math.sin(g * dr) + 0.020 * Math.sin(2.0 * g * dr);
        while (lambda >= 360.0) lambda -= 360.0;
        while (lambda < 0.0) lambda += 360.0;
        return lambda;
    }

    function getNewMoonDay(k, timeZone) {
        let T = k / 1236.85;
        let T2 = T * T;
        let T3 = T2 * T;
        let dr = PI / 180.0;
        let Jd = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3 + 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
        let M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
        let Mprime = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
        let F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
        let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2.0 * M * dr);
        let C2 = -0.4068 * Math.sin(Mprime * dr) + 0.0161 * Math.sin(2.0 * Mprime * dr) - 0.0004 * Math.sin(3.0 * Mprime * dr);
        let C3 = 0.0104 * Math.sin(2.0 * F * dr) - 0.0051 * Math.sin((M + Mprime) * dr) - 0.0074 * Math.sin((M - Mprime) * dr) + 0.0004 * Math.sin((2.0 * F + M) * dr) - 0.0004 * Math.sin((2.0 * F - M) * dr) - 0.0006 * Math.sin((2.0 * F + Mprime) * dr) + 0.001 * Math.sin((2.0 * F - Mprime) * dr) + 0.0005 * Math.sin((M + 2.0 * Mprime) * dr);
        let deltaT = C1 + C2 + C3;
        return INT(Jd + deltaT + 0.5 + timeZone / 24.0);
    }

    function getLunarMonth11(yy, timeZone) {
        let off = yy - 1900;
        let k = INT(off * 12.3685);
        let nm = getNewMoonDay(k, timeZone);
        let sunLong = getSunLongitude(nm, timeZone);
        if (sunLong >= 9.0) {
            nm = getNewMoonDay(k - 1, timeZone);
        }
        return nm;
    }

    function getLeapMonthOffset(a11, timeZone) {
        let k, last, arc, i;
        k = INT((a11 - 2415021.076998695) / 29.530588853 + 0.5);
        last = 0;
        i = 1;
        arc = INT(getSunLongitude(getNewMoonDay(k, timeZone), timeZone) / 30.0);
        do {
            last = arc;
            i++;
            arc = INT(getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone) / 30.0);
        } while (arc != last && i < 14);
        return i - 1;
    }

    // --- PUBLIC API ---

    function getCanChiYear(lunarYear) {
        const can = THIEN_CAN[(lunarYear + 6) % 10];
        const chi = DIA_CHI[(lunarYear + 8) % 12];
        return `${can} ${chi}`;
    }

    function getCanChiDay(jd) {
        const can = THIEN_CAN[(jd + 9) % 10];
        const chi = DIA_CHI[(jd + 1) % 12];
        return `${can} ${chi}`;
    }

    function getLunarMonthName(month, isLeap) {
        let name = "";
        if (month === 1) name = "Tháng Giêng";
        else if (month === 12) name = "Tháng Chạp";
        else name = `Tháng ${month}`;
        
        if (isLeap) name += " Nhuận";
        return name;
    }

    function solarToLunar(dd, mm, yyyy) {
        let dayNumber = jdFromDate(dd, mm, yyyy);
        let k = INT((dayNumber - 2415021.076998695) / 29.530588853);
        let monthStart = getNewMoonDay(k + 1, TIMEZONE);
        if (monthStart > dayNumber) {
            monthStart = getNewMoonDay(k, TIMEZONE);
        }
        let a11 = getLunarMonth11(yyyy, TIMEZONE);
        let b11 = a11;
        if (a11 >= monthStart) {
            let lunarYear = yyyy;
            a11 = getLunarMonth11(yyyy - 1, TIMEZONE);
            if (monthStart < a11) {
                // Should never happen, just a failsafe
            } else {
                let m = 12; // Start from month 11, we figure it out
                let isLeap = 0;
                let monthStartFrom11 = a11;
                // Calculate leap
                let a11Next = getLunarMonth11(yyyy, TIMEZONE);
                let diff = INT((a11Next - a11) / 29);
                let leapMonthOffset = 0;
                if (diff === 13) {
                    leapMonthOffset = getLeapMonthOffset(a11, TIMEZONE);
                }
                
                // Count months from a11
                let offset = INT((monthStart - a11) / 29);
                if (diff === 13 && offset >= leapMonthOffset) {
                    if (offset === leapMonthOffset) {
                        isLeap = 1;
                    }
                    offset = offset - 1;
                }
                let month = offset + 11;
                if (month > 12) month -= 12;
                if (month >= 11 && offset < 2) lunarYear -= 1;
                
                let day = dayNumber - monthStart + 1;
                return {
                    day: day,
                    month: month,
                    year: lunarYear,
                    leap: isLeap,
                    monthName: getLunarMonthName(month, isLeap),
                    yearCanChi: getCanChiYear(lunarYear),
                    dayCanChi: getCanChiDay(dayNumber)
                };
            }
        }
        
        // When monthStart >= a11 (current year)
        let lunarYear = yyyy;
        let b11Next = getLunarMonth11(yyyy + 1, TIMEZONE);
        let diff = INT((b11Next - b11) / 29);
        let leapMonthOffset = 0;
        if (diff === 13) {
            leapMonthOffset = getLeapMonthOffset(b11, TIMEZONE);
        }
        
        let offset = INT((monthStart - b11) / 29);
        let isLeap = 0;
        if (diff === 13 && offset >= leapMonthOffset) {
            if (offset === leapMonthOffset) {
                isLeap = 1;
            }
            offset -= 1;
        }
        let month = offset + 11;
        if (month > 12) {
            month -= 12;
            lunarYear += 1;
        }
        let day = dayNumber - monthStart + 1;
        
        return {
            day: day,
            month: month,
            year: lunarYear,
            leap: isLeap,
            monthName: getLunarMonthName(month, isLeap),
            yearCanChi: getCanChiYear(lunarYear),
            dayCanChi: getCanChiDay(dayNumber)
        };
    }

    function lunarToSolar(lunarDay, lunarMonth, lunarYear, isLeap) {
        let a11 = getLunarMonth11(lunarYear, TIMEZONE);
        let b11 = a11;
        if (lunarMonth < 11) {
            a11 = getLunarMonth11(lunarYear - 1, TIMEZONE);
        } else if (lunarMonth >= 11) { // same year's 11th month
            b11 = getLunarMonth11(lunarYear + 1, TIMEZONE);
        }
        
        let a11Next = (lunarMonth < 11) ? getLunarMonth11(lunarYear, TIMEZONE) : b11;
        let diff = INT((a11Next - a11) / 29);
        
        let leapMonthOffset = 0;
        if (diff === 13) {
            leapMonthOffset = getLeapMonthOffset(a11, TIMEZONE);
        }
        
        let offset = lunarMonth - 11;
        if (offset < 0) offset += 12;
        
        if (diff === 13 && offset >= leapMonthOffset) {
            offset += 1;
            if (isLeap && offset === leapMonthOffset + 1) {
                offset -= 1; // It is the leap month
            }
        }
        
        let k = INT((a11 - 2415021.076998695) / 29.530588853 + 0.5);
        let monthStart = getNewMoonDay(k + offset, TIMEZONE);
        let dayNumber = monthStart + lunarDay - 1;
        
        return jdToDate(dayNumber);
    }

    function findNextSolarDate(lunarDay, lunarMonth, fromDateStrOrObj) {
        let fromDate;
        if (typeof fromDateStrOrObj === 'string') {
            fromDate = new Date(fromDateStrOrObj);
        } else if (fromDateStrOrObj instanceof Date) {
            fromDate = fromDateStrOrObj;
        } else {
            fromDate = new Date();
        }

        let currYear = fromDate.getFullYear();
        let currMonth = fromDate.getMonth() + 1;
        let currDay = fromDate.getDate();

        // Thử tính ngày dương lịch trong năm nay
        let solarThisYear = lunarToSolar(lunarDay, lunarMonth, currYear, 0);
        let dateThisYear = new Date(solarThisYear.year, solarThisYear.month - 1, solarThisYear.day);

        if (dateThisYear >= fromDate) {
            return {
                day: solarThisYear.day,
                month: solarThisYear.month,
                year: solarThisYear.year,
                dayOfWeek: dateThisYear.getDay()
            };
        } else {
            // Nếu ngày trong năm nay đã qua, lấy năm sau
            let solarNextYear = lunarToSolar(lunarDay, lunarMonth, currYear + 1, 0);
            let dateNextYear = new Date(solarNextYear.year, solarNextYear.month - 1, solarNextYear.day);
            return {
                day: solarNextYear.day,
                month: solarNextYear.month,
                year: solarNextYear.year,
                dayOfWeek: dateNextYear.getDay()
            };
        }
    }

    return {
        solarToLunar: solarToLunar,
        lunarToSolar: lunarToSolar,
        getCanChiYear: getCanChiYear,
        getCanChiDay: getCanChiDay,
        getLunarMonthName: getLunarMonthName,
        jdFromDate: jdFromDate,
        findNextSolarDate: findNextSolarDate
    };
})();
