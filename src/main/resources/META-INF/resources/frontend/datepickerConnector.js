window.Vaadin.Flow.datepickerConnector = {
    initLazy: function(datepicker) {    
        // Check whether the connector was already initialized for the datepicker
        if (datepicker.$connector){
            return;
        }

        datepicker.$connector = {};
        
        datepicker.addEventListener('blur', e => {
        	if (!e.target.value && e.target.invalid) {
        		console.warn("Invalid value in the DatePicker.");
        		}
        	});

        datepicker.$connector.setLocale = function(locale){
            try{
                // Check weather the locale is supported or not
                new Date().toLocaleDateString(locale);
            } catch (e){
                locale = "en-US";
                console.warn("The locale is not supported, use default locale setting(en-US).");
            }

            datepicker.i18n.formatDate = function(date){
                let rawDate = new Date(date.year,date.month,date.day);
                return rawDate.toLocaleDateString(locale);
            }

            datepicker.i18n.parseDate = function(dateString){
            	//checking separator which is used in the date
            	let strings = dateString.split(/[\d]/);
            	let separators = strings.filter(string => isNaN(string));
            	
            	if (separators.length != 2 || separators[0] != separators[1]){
            		return null;
            	} else {
            		var separator = separators[0];
            	}

                const sample = ["2009","12","31"].join(separator);
                const sample_parts = sample.split(separator);
                let date = new Date();
                let sampleDate = new Date(sample);
                let sampleLocaleDate = sampleDate.toLocaleDateString(locale);

                if (sampleLocaleDate.toString() == sample) {
                    //Date format "YYYY/MM/DD"
                    date = new Date(dateString);
                } else if (sampleLocaleDate.toString() == sample.split(separator).reverse().join(separator)){
                    //Date format "DD/MM/YYYY"
                    date = new Date(dateString.split(separator).reverse().join(separator));
                } else if (sampleLocaleDate.toString() == [sample_parts[1], sample_parts[2], sample_parts[0]].join(separator)){
                    //Date format "MM/DD/YYYY"
                    const parts = dateString.split(separator);
                    date = new Date([parts[2],parts[0],parts[1]].join(separator));  
                } else {
                    console.warn("Selected locale is using unsupported date format, which might affect the parsing date.");
                    date = new Date(dateString);
                }

                return {
                    day:date.getDate(),
                    month:date.getMonth(),
                    year:date.getFullYear()
                };
            }
        }
    }
}
