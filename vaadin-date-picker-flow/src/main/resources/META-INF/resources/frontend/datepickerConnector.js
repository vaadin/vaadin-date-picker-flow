(function () {
    const tryCatchWrapper = function (callback) {
        return window.Vaadin.Flow.tryCatchWrapper(callback, 'Vaadin Date Picker', 'vaadin-date-picker-flow');
    };

    /**
     * @typedef {object} DateHash
     * @property {number} day - Day of month
     * @property {number} month - Month (0 = January, 11 = December)
     * @property {number} year - Year
     * @property {string|undefined} dayMatch - Returned by parseDate but not needed as input for formatDate
     * @property {string|undefined} monthMatch - Returned by parseDate but not needed as input for formatDate
     * @property {string|undefined} yearMatch - Returned by parseDate but not needed as input for formatDate
     */

    /**
     * @typedef {HTMLElement} DatePickerWithConnector
     * @property {string} value
     * @property {string} _inputValue
     * @property {boolean} invalid
     * @property {object} i18n
     * @property {function|undefined} i18n.formatDate
     * @property {function|undefined} i18n.parseDate
     * @property {object} $connector
     * @property {FlowDatePickerPart} $connector.dayPart
     * @property {FlowDatePickerPart} $connector.monthPart
     * @property {FlowDatePickerPart} $connector.yearPart
     * @property {FlowDatePickerPart[]} $connector.parts
     */

    /**
     * @typedef {Event} EventWithDatePickerTarget
     * @property {DatePickerWithConnector} target
     */

    /**
     * Helper class for parsing regex from formatted date string
     */
    class FlowDatePickerPart {
        /**
         * @param {string} initial
         */
        constructor(initial) {
            /** @type {string} */
            this.initial = initial;
            /** @type {number} */
            this.index = 0;
            /** @type {number} */
            this.value = 0;
        }

        /**
         * @param {FlowDatePickerPart} part1
         * @param {FlowDatePickerPart} part2
         * @returns {number}
         */
        static compare(part1, part2) {
            if (part1.index < part2.index) {
                return -1;
            }
            if (part1.index > part2.index) {
                return 1;
            }
            return 0;
        }
    }

    window.Vaadin.Flow.datepickerConnector = {
        initLazy: datepicker => tryCatchWrapper(/** @param {DatePickerWithConnector} datepicker */ function (datepicker) {
            // Check whether the connector was already initialized for the datepicker
            if (datepicker.$connector) {
                return;
            }

            datepicker.$connector = {};

            /* init helper parts for reverse-engineering date-regex */
            const dayPart = datepicker.$connector.dayPart = new FlowDatePickerPart("22");
            const monthPart = datepicker.$connector.monthPart = new FlowDatePickerPart("11");
            const yearPart = datepicker.$connector.yearPart = new FlowDatePickerPart("1987");
            const parts = datepicker.$connector.parts = [dayPart, monthPart, yearPart];

            // Old locale should always be the default vaadin-date-picker component
            // locale {English/US} as we init lazily and the date-picker formats
            // the date using the default i18n settings and we need to use the input
            // value as we may need to parse user input so we can't use the _selectedDate value.
            let oldLocale = "en-us";

            datepicker.addEventListener('blur', tryCatchWrapper(/** @param {EventWithDatePickerTarget} e */ e => {
                if (!e.target.value && e.target.invalid) {
                    console.warn("Invalid value in the DatePicker.");
                }
            }));

            /**
             * Clear any non ascii characters from the date string,
             * mainly the LEFT-TO-RIGHT MARK.
             * This is a problem for many Microsoft browsers where `toLocaleDateString`
             * adds the LEFT-TO-RIGHT MARK see https://en.wikipedia.org/wiki/Left-to-right_mark
             * @param {string} string
             * @returns {string}
             */
            let cleanString = function (string) {
                return string.replace(/[^\x00-\x7F]/g, "");
            };
            cleanString = tryCatchWrapper(cleanString);

            /**
             * @returns {string}
             */
            let getInputValue = function () {
                let inputValue;
                try {
                    inputValue = datepicker._inputValue;
                } catch(err) {
                    /* component not ready: falling back to stored value */
                    inputValue = datepicker.value || '';
                }
                return inputValue;
            };
            getInputValue = tryCatchWrapper(getInputValue);

            /**
             * @param {string} locale Locale string (e.g. 'en-US', 'fi-FI')
             */
            const setLocale = function (locale) {
                try {
                    // Check whether the locale is supported or not
                    new Date().toLocaleDateString(locale);
                } catch (e) {
                    locale = "en-US";
                    console.warn("The locale is not supported, using default locale setting(en-US).");
                }

                /** @type {DateHash} */
                let currentDate;
                /** @type {string} */
                let inputValue = getInputValue();

                if (datepicker.i18n.parseDate && inputValue) {
                    /* get current date with old parsing */
                    currentDate = datepicker.i18n.parseDate(inputValue);
                }

                /* create test-string where to extract parsing regex */
                let testDate = new Date(Date.UTC(parseInt(yearPart.initial), parseInt(monthPart.initial) - 1, parseInt(dayPart.initial)));
                let testString = cleanString(testDate.toLocaleDateString(locale, { timeZone: 'UTC' }));
                parts.forEach(function (part) {
                    part.index = testString.indexOf(part.initial);
                });
                /* sort items to match correct places in regex groups */
                parts.sort(FlowDatePickerPart.compare);
                /* create regex
                 * regex will be the date, so that:
                 * - day-part is '(\d{1,2})' (1 or 2 digits),
                 * - month-part is '(\d{1,2})' (1 or 2 digits),
                 * - year-part is '(\d{1,4})' (1 to 4 digits)
                 *
                 * and everything else is left as is.
                 * For example, us date "10/20/2010" => "(\d{1,2})/(\d{1,2})/(\d{1,4})".
                 *
                 * The sorting part solves that which part is which (for example,
                 * here the first part is month, second day and third year)
                 */
                datepicker.$connector.regex = testString.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
                    .replace(dayPart.initial, "(\\d{1,2})")
                    .replace(monthPart.initial, "(\\d{1,2})")
                    .replace(yearPart.initial, "(\\d{1,4})");

                /**
                 * @param {DateHash} date
                 * @returns {number}
                 */
                let indexOfYearForFormattedDate = function (date) {
                    let adjust = 0;
                    for (let i = 1; i < 4; i++) {
                        const part = parts[i - 1];
                        // Adjust the index if the day or month (before the year)
                        // have less digits than in the initial testDate so that
                        // this works also with single digit day or month.
                        // Day or month of less than 10 may still be 2 digit prefixed
                        // with 0 depending on locale.
                        if (part === dayPart && date.dayMatch) {
                            adjust -= 2 - date.dayMatch.length;
                        } else if (part === monthPart && date.monthMatch) {
                            adjust -= 2 - date.monthMatch.length;
                        } else if (part === yearPart) {
                            return yearPart.index + adjust;
                        }
                    }
                };
                indexOfYearForFormattedDate = tryCatchWrapper(indexOfYearForFormattedDate);

                /**
                 * Prefixes the year in the given date string with zeros if
                 * needed to make it four digits
                 * @param {string} formattedDate Date formatted with Date.toLocaleDateString()
                 * @returns {string}
                 */
                let yearToFourDigitInFormattedDate = function (formattedDate) {
                    const date = /** @type {DateHash} */ _parseDate(formattedDate);
                    if (!date) {
                        return formattedDate;
                    }
                    if (date.yearMatch.length >= 4) {
                        return formattedDate;
                    }
                    const yearIndex = indexOfYearForFormattedDate(date);
                    const yearStr = String(date.year).replace(/\d+/, y => '0000'.substring(y.length) + y);
                    const beforeYear = formattedDate.substring(0, yearIndex);
                    const afterYear = formattedDate.substring(yearIndex + String(date.year).length);
                    return beforeYear + yearStr + afterYear;
                }
                yearToFourDigitInFormattedDate = tryCatchWrapper(yearToFourDigitInFormattedDate);

                /**
                 * @param {DateHash} date
                 * @returns {string}
                 */
                const formatDate = function (date) {
                    let rawDate = new Date(Date.UTC(date.year, date.month, date.day));
                    if (date.year >= 0 && date.year <= 99) {
                        // JS Date constructor converts years 0-99 to 1900-1999 so
                        // this is needed to fix that when we want an explicit year.
                        rawDate.setUTCFullYear(date.year);
                    }
                    let formattedDate = cleanString(rawDate.toLocaleDateString(locale, { timeZone: 'UTC' }));
                    if (date.year < 1000) {
                        formattedDate = yearToFourDigitInFormattedDate(formattedDate);
                    }
                    return formattedDate;
                };
                datepicker.i18n.formatDate = tryCatchWrapper(formatDate);

                /**
                 * @param {string} dateString
                 * @returns {DateHash|boolean|undefined}
                 */
                let _parseDate = function (dateString) {
                    dateString = cleanString(dateString);

                    if (dateString.length === 0) {
                        return;
                    }

                    let match = dateString.match(datepicker.$connector.regex);
                    if (match && match.length === 4) {
                        /** @type {number} */
                        let day, month, year
                        /** @type {string} */
                        let dayMatch, monthMatch, yearMatch;

                        for (let i = 1; i < 4; i++) {
                            const part = parts[i-1];
                            const matchValue = match[i];
                            part.value = parseInt(matchValue);
                            if (part === dayPart) {
                                day = part.value;
                                dayMatch = matchValue;
                            } else if (part === monthPart) {
                                month = part.value - 1;
                                monthMatch = matchValue;
                            } else if (part === yearPart) {
                                year = part.value;
                                yearMatch = matchValue;
                            }
                        }
                        return {day, month, year, dayMatch, monthMatch, yearMatch};
                    } else {
                        return false;
                    }
                };
                _parseDate = tryCatchWrapper(_parseDate);

                /**
                 * @param {string} dateString
                 * @returns {DateHash|boolean|undefined}
                 */
                const parseDate = function (dateString) {
                    const date = _parseDate(dateString);
                    if (!date) {
                        return date;
                    }
                    if (date.yearMatch.length < 3 && date.year >= 0) {
                        date.year += date.year < 50 ? 2000 : 1900;
                    }
                    return date;
                };
                datepicker.i18n.parseDate = tryCatchWrapper(parseDate);

                if (inputValue === "") {
                    oldLocale = locale;
                } else if (currentDate) {
                    /* set current date to invoke use of new locale */
                    const rawDate = new Date(currentDate.year, currentDate.month, currentDate.day);
                    if (currentDate.year >= 0 && currentDate.year <= 99) {
                        // JS Date constructor converts years 0-99 to 1900-1999 so
                        // this is needed to fix that when we want an explicit year.
                        rawDate.setFullYear(currentDate.year);
                    }
                    datepicker._selectedDate = rawDate;
                }
            };
            datepicker.$connector.setLocale = tryCatchWrapper(setLocale);
        })(datepicker)
    };
})();
