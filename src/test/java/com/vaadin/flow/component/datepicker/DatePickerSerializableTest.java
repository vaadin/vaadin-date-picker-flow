package com.vaadin.flow.component.datepicker;

import java.util.stream.Stream;

import com.vaadin.flow.component.UI;
import com.vaadin.flow.testutil.ClassesSerializableTest;

public class DatePickerSerializableTest extends ClassesSerializableTest {

    private static final UI FAKE_UI = new UI();

    @Override
    protected Stream<String> getExcludedPatterns() {
        return Stream.concat(super.getExcludedPatterns(), Stream.of(
                "com\\.vaadin\\.flow\\.component\\.datepicker\\.InjectedDatePickerI18nPage"));
    }

    @Override
    protected void resetThreadLocals() {
        super.resetThreadLocals();
        UI.setCurrent(null);
    }

    @Override
    protected void setupThreadLocals() {
        super.setupThreadLocals();
        UI.setCurrent(FAKE_UI);
    }
}
