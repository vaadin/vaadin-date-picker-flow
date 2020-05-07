package com.vaadin.flow.component.datepicker;

import com.vaadin.flow.component.datepicker.BinderValidationView.AData;
import com.vaadin.flow.component.html.Div;
import com.vaadin.flow.component.html.NativeButton;
import com.vaadin.flow.data.binder.Binder;
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

        NativeButton addBinderAsRequired = new NativeButton(
                "Add Binder as required", e -> addBinderAsRequired(datePicker));
        addBinderAsRequired.setId("add-binder-as-required");

        add(datePicker, value, checkValidity, addBinderAsRequired);
    }

    private void addBinderAsRequired(DatePicker datePicker) {
        Binder<AData> binder = new Binder<>();
        binder.forField(datePicker)
                // Using withValidator instead of asRequired matters here,
                // because asRequired sets the required-prop on the field.
                .withValidator(v -> v != null, "binder error")
                .bind(AData::getDate, AData::setDate);
    }

}
