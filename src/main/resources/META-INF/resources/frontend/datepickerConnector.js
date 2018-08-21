class FlowDatePickerPart {
    constructor(initial) {
        this.initial = initial;
        this.index = 0;
        this.value = 0;
    }
    setIndex(testString) {
        this.index = testString.indexOf(day);
    }

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
    initLazy: function (datepicker) {
        // Check whether the connector was already initialized for the datepicker
        if (datepicker.$connector) {
            return;
        }

        datepicker.$connector = {};

        // Old locale should always be the default vaadin-date-picker component
        // locale {English/US} as we init lazily and the date-picker formats
        // the date using the default i18n settings and we need to use the input
        // value as we may need to parse user input so we can't use the _selectedDate value.
        let oldLocale = "en-us";

        datepicker.addEventListener('blur', e => {
            if (!e.target.value && e.target.invalid) {
                console.warn("Invalid value in the DatePicker.");
            }
        });

        const cleanString = function (string) {
            // Clear any non ascii characters from the date string,
            // mainly the LEFT-TO-RIGHT MARK.
            // This is a problem for many Microsoft browsers where `toLocaleDateString`
            // adds the LEFT-TO-RIGHT MARK see https://en.wikipedia.org/wiki/Left-to-right_mark
            return string.replace(/[^\x00-\x7F]/g, "");
        };

        // Create a Date from our dateObject that doesn't contain setters/getters
        const generateDate = function (dateObject) {
            let dateString = `${dateObject.year}-${dateObject.month + 1}-${dateObject.day}`;
            var parts = /^([-+]\d{1}|\d{2,4}|[-+]\d{6})-(\d{1,2})-(\d{1,2})$/.exec(dateString);
            if (!parts) {
                console.warn("Couldn't parse generated date string.");
                return;
            }

            // Wrong date (1900-01-01), but with midnight in local time
            var date = new Date(0, 0);
            date.setFullYear(parseInt(parts[1], 10));
            date.setMonth(parseInt(parts[2], 10) - 1);
            date.setDate(parseInt(parts[3], 10));

            return date;
        };

        const updateFormat = function () {
            let inputValue = getInputValue();
            if (inputValue !== "" && datepicker.i18n.parseDate) {
                let selectedDate = datepicker.i18n.parseDate(inputValue);
                if (!selectedDate) {
                    return;
                }

                datepicker._selectedDate = selectedDate && generateDate(selectedDate);
            }
        };
        
        const getInputValue = function () {
            let inputValue = '';
            try {
                inputValue = datepicker._inputValue;
            } catch(err) {
                /* component not ready: falling back to stored value */
                inputValue = datepicker.value || '';
            }
            return inputValue;
        }

        datepicker.$connector.setLocale = function (locale) {
            try {
                // Check whether the locale is supported or not
                new Date().toLocaleDateString(locale);
            } catch (e) {
                locale = "en-US";
                console.warn("The locale is not supported, use default locale setting(en-US).");
            }

            /* init helper parts for reverse-engineering date-regex */
            datepicker.$connector.dayPart = new FlowDatePickerPart("22");
            datepicker.$connector.monthPart = new FlowDatePickerPart("11");
            datepicker.$connector.yearPart = new FlowDatePickerPart("1987");
            datepicker.$connector.parts = [datepicker.$connector.dayPart, datepicker.$connector.monthPart, datepicker.$connector.yearPart];

            /* create test-string where to extract parsing regex */
            var testDate = new Date(datepicker.$connector.yearPart.initial, datepicker.$connector.monthPart.initial - 1, datepicker.$connector.dayPart.initial);
            var testString = cleanString(testDate.toLocaleDateString(locale));
            datepicker.$connector.parts.forEach(function (part) {
                part.index = testString.indexOf(part.initial);
            });
            /* sort items to match correct places in regex groups */
            datepicker.$connector.parts.sort(FlowDatePickerPart.compare);
            /* create regex */
            datepicker.$connector.regex = testString.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&').replace(datepicker.$connector.dayPart.initial, "(\\d{1,2})").replace(datepicker.$connector.monthPart.initial, "(\\d{1,2})").replace(datepicker.$connector.yearPart.initial, "(\\d{4})");


            datepicker.i18n.formatDate = function (date) {
                let rawDate = new Date(date.year, date.month, date.day);
                return cleanString(rawDate.toLocaleDateString(locale));
            };

            datepicker.i18n.parseDate = function (dateString) {
                dateString = cleanString(dateString);

                if (dateString.length == 0) {
                    return;
                }

                var match = dateString.match(datepicker.$connector.regex);
                if (match && match.length == 4) {
                    for (var i = 1; i < 4; i++) {
                        datepicker.$connector.parts[i-1].value = match[i]
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

            let inputValue = getInputValue();
            if (inputValue === "") {
                oldLocale = locale;
            } else {
                updateFormat();
            }
        }
    }
}
