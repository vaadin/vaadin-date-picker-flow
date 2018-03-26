window.datepickerConnector = {
    initLazy: function(datepicker) {    
        // Check whether the connector was already initialized for the datepicker
        if (datepicker.$connector){
            return;
        }

        console.log("Initializing DatePicker Connector");

        datepicker.$connector = {};

        datepicker.$connector.setLocale = function(locale){
            try{
                // Check weather the locale is supported or not
                new Date().toLocaleDateString(locale);
            } catch (e){
                throw new RangeError("The locale is not supported.");
            }

            datepicker.i18n.formatDate = function(date){
                var d = new Date(date.year,date.month,date.day);
                return d.toLocaleDateString(locale);
            }

            datepicker.i18n.parseDate = function(dateString){
                const sp = "2009/12/31";
                const sp_parts = sp.split('/');
                var date = new Date();
                var sample = new Date(sp);
                var sample2 = sample.toLocaleDateString(locale);

                if(sample2.toString() == sp) {
                    //Date format "YYYY/MM/DD"
                    var date = new Date(dateString);
                } else if (sample2.toString() == sp.split('/').reverse().join('/')){
                    //Date format "DD/MM/YYYY"
                    var date = new Date(dateString.split('/').reverse().join('/'));
                } else if (sample2.toString() == [sp_parts[1], sp_parts[2], sp_parts[0]].join('/')){
                    //Date format "MM/DD/YYYY"
                    const parts = dateString.split('/');
                    var date = new Date([parts[2],parts[0],parts[1]].join('/'));  
                } else {
                    throw ("Selected locale is using unsupported date format.");
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
