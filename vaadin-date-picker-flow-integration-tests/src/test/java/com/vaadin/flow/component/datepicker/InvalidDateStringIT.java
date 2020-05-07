/*
 * Copyright 2000-2017 Vaadin Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
package com.vaadin.flow.component.datepicker;

import org.junit.Assert;
import org.junit.Before;
import org.junit.Ignore;
import org.junit.Test;

import com.vaadin.flow.component.datepicker.testbench.DatePickerElement;
import com.vaadin.flow.testutil.AbstractComponentIT;
import com.vaadin.flow.testutil.TestPath;
import com.vaadin.testbench.TestBenchElement;

/**
 * Integration tests for the {@link InvalidDateStringView}.
 */
@TestPath("invalid-date-string")
public class InvalidDateStringIT extends AbstractComponentIT {

    private DatePickerElement datePicker;
    private TestBenchElement checkValidity;
    private TestBenchElement value;

    @Before
    public void init() {
        open();
        datePicker = $(DatePickerElement.class).first();
        checkValidity = $(TestBenchElement.class).id("check-validity");
        value = $(TestBenchElement.class).id("value");
    }

    @Test
    public void setInvalidDateString_fieldInvalid() {
        datePicker.setInputValue("asdf");
        assertValid(false);
        assertValue("");
    }

    @Test
    public void setValidValue_setInvalidDateString_fieldInvalid() {
        datePicker.setInputValue("1/1/2020");
        assertValid(true);
        assertValue("2020-01-01");
        datePicker.setInputValue("asdf");
        assertValid(false);
        assertValue(null);
    }

    @Test
    public void setInvalidDateString_clearField_fieldValid() {
        datePicker.setInputValue("asdf");
        datePicker.setInputValue("");
        assertValid(true);
        assertValue("");
    }

    @Test
    public void setInvalidDateString_setValidValue_fieldValid() {
        datePicker.setInputValue("asdf");
        datePicker.setInputValue("1/1/2020");
        assertValid(true);
        assertValue("2020-01-01");
    }

    @Test
    @Ignore
    // Ignore until Binder validates on blur:
    // https://github.com/vaadin/flow/issues/8242
    public void binderAsRequired_setInvalidDateString_clearField_fieldInvalid() {
        clickElementWithJs("add-binder-as-required");
        datePicker.setInputValue("asdf");
        datePicker.setInputValue("");
        // Verifies that Binder validator runs after component validators
        assertValid(false);
        assertValue("");
    }

    private void assertValid(boolean expectedValid) {
        String expectedText = expectedValid ? "valid" : "invalid";
        checkValidity.click();
        Assert.assertEquals("Expected DatePicker to be " + expectedText,
                expectedText, checkValidity.getText());
    }

    private void assertValue(String expectedValue) {
        Assert.assertEquals("Unexpected DatePicker value",
                expectedValue == null ? "null" : expectedValue,
                value.getText());
    }
}
