(function () {
    const tryCatchWrapper = function (callback) {
        return window.Vaadin.Flow.tryCatchWrapper(callback, 'Vaadin Date Picker', 'vaadin-date-picker-flow');
    };

    /**
     * @typedef {object} DateHash
     * @property {number} day - Day of month
     * @property {number} month - Month (0 = January, 11 = December)
     * @property {number} year - Year
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
     * @typedef {object} FlowDatePickerPart
     * @property {string} initial
     * @property {number} index
     * @property {number} value
     */
    class FlowDatePickerPart {
        /**
         * @param {string} initial
         */
        constructor(initial) {
            this.initial = initial;
            this.index = 0;
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
            datepicker.$connector.dayPart = new FlowDatePickerPart("22");
            datepicker.$connector.monthPart = new FlowDatePickerPart("11");
            datepicker.$connector.yearPart = new FlowDatePickerPart("1987");
            datepicker.$connector.parts = [datepicker.$connector.dayPart, datepicker.$connector.monthPart, datepicker.$connector.yearPart];

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
                let inputValue = '';
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
                let testDate = new Date(Date.UTC(datepicker.$connector.yearPart.initial, datepicker.$connector.monthPart.initial - 1, datepicker.$connector.dayPart.initial));
                let testString = cleanString(testDate.toLocaleDateString(locale, { timeZone: 'UTC' }));
                datepicker.$connector.parts.forEach(function (part) {
                    part.index = testString.indexOf(part.initial);
                });
                /* sort items to match correct places in regex groups */
                datepicker.$connector.parts.sort(FlowDatePickerPart.compare);
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
                    .replace(datepicker.$connector.dayPart.initial, "(\\d{1,2})")
                    .replace(datepicker.$connector.monthPart.initial, "(\\d{1,2})")
                    .replace(datepicker.$connector.yearPart.initial, "(\\d{1,4})");

                /**
                 * @param {DateHash} date
                 * @returns {number}
                 */
                let indexOfYearForFormattedDate = function (date) {
                    const {parts, dayPart, monthPart, yearPart} = datepicker.$connector;
                    let adjust = 0;
                    for (let i = 1; i < 4; i++) {
                        const part = parts[i - 1];
                        if (part === dayPart && date.day < 10) {
                            adjust -= 1;
                        } else if (part === monthPart && date.month < 9) {
                            adjust -= 1;
                        } else if (part === yearPart) {
                            return yearPart.index + adjust;
                        }
                    }
                };
                indexOfYearForFormattedDate = tryCatchWrapper(indexOfYearForFormattedDate);

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
                        const yearIndex = indexOfYearForFormattedDate(date);
                        const yearStr = String(date.year).replace(/\d+/, y => '0000'.substring(y.length) + y);
                        formattedDate = formattedDate.substring(0, yearIndex) + yearStr + formattedDate.substring(yearIndex + String(date.year).length);
                    }
                    return formattedDate;
                };
                datepicker.i18n.formatDate = tryCatchWrapper(formatDate);

                /**
                 *
                 * @param {string} dateString
                 * @returns {DateHash|boolean|undefined}
                 */
                const parseDate = function (dateString) {
                    dateString = cleanString(dateString);

                    if (dateString.length === 0) {
                        return;
                    }

                    let match = dateString.match(datepicker.$connector.regex);
                    if (match && match.length === 4) {
                        const {parts, dayPart, monthPart, yearPart} = datepicker.$connector;
                        let year;
                        for (let i = 1; i < 4; i++) {
                            const part = parts[i-1];
                            const matchValue = match[i];
                            part.value = parseInt(matchValue);
                            if (part === yearPart) {
                                year = part.value;
                                if (matchValue.length < 3 && year >= 0) {
                                    year += year < 50 ? 2000 : 1900;
                                }
                            }
                        }
                        return {
                            day: dayPart.value,
                            month: monthPart.value - 1,
                            year
                        };
                    } else {
                        return false;
                    }
                };
                datepicker.i18n.parseDate = tryCatchWrapper(parseDate);

                if (inputValue === "") {
                    oldLocale = locale;
                } else if (currentDate) {
                    /* set current date to invoke use of new locale */
                    datepicker._selectedDate = new Date(currentDate.year, currentDate.month, currentDate.day);
                }
            };
            datepicker.$connector.setLocale = tryCatchWrapper(setLocale);
        })(datepicker)
    };
})();
