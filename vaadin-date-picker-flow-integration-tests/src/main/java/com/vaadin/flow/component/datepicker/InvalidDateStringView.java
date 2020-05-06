package com.vaadin.flow.component.datepicker;

import com.vaadin.flow.component.html.Div;
import com.vaadin.flow.component.html.NativeButton;
import com.vaadin.flow.router.Route;

@Route("invalid-date-string")
public class InvalidDateStringView extends Div {

    public InvalidDateStringView() {
        DatePicker datePicker = new DatePicker();

        Div value = new Div();
        datePicker.addValueChangeListener(e -> value.setText(
                e.getValue() == null ? "null" : e.getValue().toString()));
        value.setId("value");

        NativeButton checkValidity = new NativeButton("check validity",
                e -> e.getSource()
                        .setText(datePicker.isInvalid() ? "invalid" : "valid"));
        checkValidity.setId("check-validity");

        add(datePicker, value, checkValidity);
    }

}
