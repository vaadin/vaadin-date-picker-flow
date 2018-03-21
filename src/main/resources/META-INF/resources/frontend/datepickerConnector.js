window.datepickerConnector = {
  initLazy: function(datepicker) {    
    // Check whether the connector was already initialized for the datepicker
    if (datepicker.$connector){
      return;
    }
    
    console.log("Initializing DatePicker Connector");

    datepicker.$connector = {};

    datepicker.$connector.setDateFormat = function(locale, format) {
		
    	Sugar.Date.setLocale(locale);
        
    	datepicker.i18n.formatDate = function(date) {
    		return Sugar.Date.format(Sugar.Date.create(date), format);
    	}
        
    	datepicker.i18n.parseDate = function(dateString) {
    		const date = Sugar.Date.create(dateString);
            return {
              day: date.getDate(),
              month: date.getMonth(),
              year: date.getFullYear()
            };
    	}
    }

    datepicker.$connector.setSeparator = function(separator) {
        
    	datepicker.i18n.formatDate = function(date) {
    		let formatted = Sugar.Date.format(Sugar.Date.create(date), '{short}');
    		formatted = formatted.split('/').join(separator);
    		return formatted;
    	}
        
    	datepicker.i18n.parseDate = function(dateString) {
    		const date = Sugar.Date.create(dateString.split(separator).join('/'));
            return {
              day: date.getDate(),
              month: date.getMonth(),
              year: date.getFullYear()
            };
    	}
    }
  }
}
