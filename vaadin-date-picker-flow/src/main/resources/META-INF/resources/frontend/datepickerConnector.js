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
     * @property {function(string):(Date|undefined)} _parseDate
     * @property {function(DateHash):string} i18n.formatDate
     * @property {function(string):(DateHash|undefined)} i18n.parseDate
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
     * @class
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
             * @param {string} locale - Locale string (e.g. 'en-US', 'fi-FI')
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
                let currentDate = false;
                /** @type {string} */
                let inputValue = getInputValue();

                if (datepicker.i18n.parseDate !== 'undefined' && inputValue) {
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
                *  */
                datepicker.$connector.regex = testString.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
                    .replace(datepicker.$connector.dayPart.initial, "(\\d{1,2})")
                    .replace(datepicker.$connector.monthPart.initial, "(\\d{1,2})")
                    .replace(datepicker.$connector.yearPart.initial, "(\\d{1,4})");

                /**
                 * @param {DateHash} date
                 * @returns {string}
                 */
                const formatDate = function (date) {
                    /** @type {Date} */
                    let rawDate = datepicker._parseDate(`${date.year}-${date.month + 1}-${date.day}`);

                    // Workaround for Safari DST offset issue when using Date.toLocaleDateString().
                    // This is needed to keep the correct date in formatted result even if Safari
                    // makes an error of an hour or more in the result with some past dates.
                    // See https://github.com/vaadin/vaadin-date-picker-flow/issues/126#issuecomment-508169514
                    rawDate.setHours(12)

                    return cleanString(rawDate.toLocaleDateString(locale));
                };
                datepicker.i18n.formatDate = tryCatchWrapper(formatDate);

                /**
                 * @param {string} dateString
                 * @returns {DateHash|boolean|undefined}
                 */
                const parseDate = function (dateString) {
                    dateString = cleanString(dateString);

                    if (dateString.length == 0) {
                        return;
                    }

                    let match = dateString.match(datepicker.$connector.regex);
                    if (match && match.length == 4) {
                        for (let i = 1; i < 4; i++) {
                            datepicker.$connector.parts[i-1].value = parseInt(match[i]);
                        }
                        return {
                            day: datepicker.$connector.dayPart.value,
                            month: datepicker.$connector.monthPart.value - 1,
                            year: datepicker.$connector.yearPart.value
                        };
                    }  else {
                        return false;
                    }
                };
                datepicker.i18n.parseDate = tryCatchWrapper(parseDate);

                if (inputValue === "") {
                    oldLocale = locale;
                } else if (currentDate) {
                    /* set current date to invoke use of new locale */
                    datepicker._selectedDate = datepicker._parseDate(`${currentDate.year}-${currentDate.month + 1}-${currentDate.day}`);
                }
            };
            datepicker.$connector.setLocale = tryCatchWrapper(setLocale);
        })(datepicker)
    };
})();
