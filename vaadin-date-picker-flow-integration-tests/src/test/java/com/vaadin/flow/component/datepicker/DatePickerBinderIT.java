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

/**
 * Integration tests for the {@link BinderValidationView}.
 */
@TestPath("binder-validation")
public class DatePickerBinderIT extends AbstractComponentIT {

    private DatePickerElement field;

    @Before
    public void init() {
        open();
        field = $(DatePickerElement.class).waitForFirst();
    }

    @Test
    public void initiallyValid() {
        assertValid(field);
    }

    private void setInternalValidBinderInvalidValue(DatePickerElement field) {
        field.setInputValue("1/2/2019");
    }

    private void setInternalInvalidBinderValidValue(DatePickerElement field) {
        field.setInputValue("3/2/2019");
    }

    @Test
    public void dateField_internalValidationPass_binderValidationFail_fieldInvalid() {
        setInternalValidBinderInvalidValue(field);
        assertInvalidatedByBinder(field);
    }

    @Test
    public void dateField_internalValidationPass_binderValidationFail_validateClient_fieldInvalid() {
        setInternalValidBinderInvalidValue(field);

        field.getCommandExecutor().executeScript(
                "arguments[0].validate(); arguments[0].immediateInvalid = arguments[0].invalid;",
                field);

        assertInvalidatedByBinder(field);
        // State before server roundtrip (avoid flash of valid
        // state)
        Assert.assertTrue("Unexpected immediateInvalid state",
                field.getPropertyBoolean("immediateInvalid"));
    }

    @Test
    public void dateField_internalValidationPass_binderValidationFail_setClientValid_serverFieldInvalid() {
        setInternalValidBinderInvalidValue(field);

        field.getCommandExecutor().executeScript("arguments[0].invalid = false",
                field);

        Assert.assertEquals(field.getPropertyString("label"), "invalid");
    }

    @Test
    @Ignore // until getDefaultValidator implemented
    public void dateField_internalValidationFail_binderValidationPass_fieldInvalid() {
        setInternalInvalidBinderValidValue(field);
        assertInvalid(field);
    }

    private void assertInvalidatedByBinder(DatePickerElement field) {
        assertInvalid(field);
        Assert.assertEquals(
                "Expected to have error message configured in the Binder Validator",
                BinderValidationView.BINDER_ERROR_MSG,
                field.getPropertyString("errorMessage"));
    }

    private void assertInvalid(DatePickerElement field) {
        Assert.assertTrue("Unexpected invalid state",
                field.getPropertyBoolean("invalid"));
    }

    private void assertValid(DatePickerElement field) {
        Assert.assertFalse("Unexpected invalid state",
                field.getPropertyBoolean("invalid"));
    }
}
