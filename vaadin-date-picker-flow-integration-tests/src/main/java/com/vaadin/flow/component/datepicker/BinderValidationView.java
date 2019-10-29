package com.vaadin.flow.component.datepicker;

import java.time.LocalDate;

import javax.validation.constraints.NotNull;

import com.vaadin.flow.component.html.Div;
import com.vaadin.flow.data.binder.BeanValidationBinder;
import com.vaadin.flow.data.binder.Binder;
import com.vaadin.flow.router.Route;

@Route("binder-validation")
public class BinderValidationView extends Div {

    public BinderValidationView() {
        Binder<AData> binder = new BeanValidationBinder<>(AData.class);

        DatePicker dateField = new DatePicker("Date");
        binder.bind(dateField, "date");
        add(dateField);
    }

    public static class AData {

        @NotNull
        private LocalDate date;


        public LocalDate getDate() {
            return date;
        }

        public void setDate(LocalDate date) {
            this.date = date;
        }
    }
}
