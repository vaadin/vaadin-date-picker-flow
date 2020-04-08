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

import java.time.LocalDate;
import java.time.Month;

import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;

import com.vaadin.flow.component.datepicker.testbench.DatePickerElement;
import com.vaadin.flow.demo.ComponentDemoTest;
import com.vaadin.testbench.TestBenchElement;

/**
 * Integration tests for the {@link DatePickerViewDemoPage}.
 */
public class DatePickerIT extends ComponentDemoTest {

    private static final String DATEPICKER_OVERLAY = "vaadin-date-picker-overlay";

    @Before
    public void init() {
        waitForElementPresent(By.tagName("vaadin-date-picker"));
    }

    @Test
    public void selectDateOnSimpleDatePicker() {
        WebElement picker = layout.findElement(By.id("simple-picker"));
        WebElement message = layout.findElement(By.id("simple-picker-message"));

        executeScript("arguments[0].value = '1985-01-10'", picker);

        waitUntil(driver -> message.getText()
                .contains("Day: 10\nMonth: 1\nYear: 1985"));

        executeScript("arguments[0].value = ''", picker);

        waitUntil(driver -> "No date is selected".equals(message.getText()));
    }

    @Test
    public void selectDateOnMinMaxDatePicker() {
        WebElement picker = layout.findElement(By.id("min-and-max-picker"));
        WebElement message = layout
                .findElement(By.id("min-and-max-picker-message"));

        LocalDate now = LocalDate.now();
        executeScript("arguments[0].value = arguments[1]", picker,
                now.toString());

        Assert.assertEquals("The selected date should be considered valid",
                false, executeScript("return arguments[0].invalid", picker));

        waitUntil(driver -> message.getText()
                .contains(("Day: " + now.getDayOfMonth() + "\nMonth: "
                        + now.getMonthValue() + "\nYear: " + now.getYear())));

        executeScript("arguments[0].value = ''", picker);

        waitUntil(driver -> "No date is selected".equals(message.getText()));

        Assert.assertEquals("The empty date should be considered valid", false,
                executeScript("return arguments[0].invalid", picker));

        LocalDate invalid = now.minusYears(1);

        executeScript("arguments[0].value = arguments[1]", picker,
                invalid.toString());

        Assert.assertEquals("The selected date should be considered invalid",
                true, executeScript("return arguments[0].invalid", picker));
    }

    @Test
    public void selectDateOnFinnishDatePicker() {
        WebElement picker = layout.findElement(By.id("finnish-picker"));
        WebElement message = layout
                .findElement(By.id("finnish-picker-message"));

        executeScript("arguments[0].value = '1985-01-10'", picker);

        waitUntil(driver -> "Day of week: torstai\nMonth: tammiku"
                .equals(message.getText()));

        executeScript("arguments[0].value = ''", picker);

        waitUntil(driver -> "No date is selected".equals(message.getText()));

        executeScript("arguments[0].setAttribute(\"opened\", true)", picker);
        waitForElementPresent(By.tagName(DATEPICKER_OVERLAY));

        WebElement overlay = findElement(By.tagName(DATEPICKER_OVERLAY));
        WebElement content = findInShadowRoot(overlay, By.id("content")).get(0);
        WebElement overlayContent = findInShadowRoot(content,
                By.id("overlay-content")).get(0);
        WebElement todayButton = findInShadowRoot(overlayContent,
                By.id("todayButton")).get(0);

        waitUntil(driver -> "tänään".equals(todayButton.getText()));
    }

    @Test
    public void selectDatesOnLinkedDatePickers() {
        WebElement startPicker = layout.findElement(By.id("start-picker"));
        WebElement endPicker = layout.findElement(By.id("end-picker"));
        WebElement message = layout.findElement(By.id("start-and-end-message"));

        executeScript("arguments[0].value = '1985-01-10'", startPicker);

        waitUntil(driver -> "Select the ending date".equals(message.getText()));

        Assert.assertEquals(
                "The min date at the end date picker should be 1985-01-11",
                true, executeScript("return arguments[0].min === '1985-01-11'",
                        endPicker));

        executeScript("arguments[0].value = '1985-01-20'", endPicker);

        waitUntil(driver -> "Selected period:\nFrom 1985-01-10 to 1985-01-20"
                .equals(message.getText()));

        Assert.assertEquals(
                "The max date at the start date picker should be 1985-01-19",
                true, executeScript("return arguments[0].max === '1985-01-19'",
                        startPicker));

        executeScript("arguments[0].value = ''", startPicker);
        waitUntil(
                driver -> "Select the starting date".equals(message.getText()));
    }

    @Test
    public void selectDatesOnCustomLocaleDatePickers() {
        DatePickerElement localePicker = $(DatePickerElement.class)
                .id("locale-change-picker");
        TestBenchElement message = $("div")
                .id("Customize-locale-picker-message");
        localePicker.setDate(LocalDate.of(2018, Month.MARCH, 27));

        waitUntil(driver -> message.getText()
                .contains("Day: 27\nMonth: 3\nYear: 2018\nLocale:"));

        Assert.assertEquals(
                "The format of the displayed date should be MM/DD/YYYY.",
                "3/27/2018", localePicker.getInputValue());

        $("button").id("Locale-UK").click();
        localePicker.setDate(LocalDate.of(2018, Month.MARCH, 26));
        waitUntil(driver -> "Day: 26\nMonth: 3\nYear: 2018\nLocale: en_GB"
                .equals(message.getText()));

        Assert.assertEquals(
                "The format of the displayed date should be DD/MM/YYYY.",
                "26/03/2018", localePicker.getInputValue());

        $("button").id("Locale-US").click();
        localePicker.setDate(LocalDate.of(2018, Month.MARCH, 25));
        waitUntil(driver -> "Day: 25\nMonth: 3\nYear: 2018\nLocale: en_US"
                .equals(message.getText()));
        Assert.assertEquals(
                "The format of the displayed date should be MM/DD/YYYY.",
                "3/25/2018", localePicker.getInputValue());

        $("button").id("Locale-UK").click();
        Assert.assertEquals(
                "The format of the displayed date should be DD/MM/YYYY.",
                "25/03/2018", localePicker.getInputValue());
    }

    @Test
    public void selectDatesBeforeYear1000() {
        DatePickerElement localePicker = $(DatePickerElement.class)
                .id("locale-change-picker");
        TestBenchElement message = $("div")
                .id("Customize-locale-picker-message");

        localePicker.setDate(LocalDate.of(900, Month.MARCH, 7));
        Assert.assertEquals("3/7/0900", localePicker.getInputValue());
        localePicker.setDate(LocalDate.of(87, Month.MARCH, 7));
        Assert.assertEquals("3/7/0087", localePicker.getInputValue());

        $("button").id("Locale-UK").click();
        Assert.assertEquals("07/03/0087", localePicker.getInputValue());

        localePicker.setDate(LocalDate.of(900, Month.MARCH, 6));
        Assert.assertEquals("06/03/0900", localePicker.getInputValue());
        localePicker.setDate(LocalDate.of(87, Month.MARCH, 6));
        Assert.assertEquals("06/03/0087", localePicker.getInputValue());

        $("button").id("Locale-US").click();
        Assert.assertEquals("3/6/0087", localePicker.getInputValue());

        localePicker.setDate(LocalDate.of(900, Month.MARCH, 5));
        Assert.assertEquals("3/5/0900", localePicker.getInputValue());
        localePicker.setDate(LocalDate.of(87, Month.MARCH, 5));
        Assert.assertEquals("3/5/0087", localePicker.getInputValue());

        $("button").id("Locale-CHINA").click();
        Assert.assertEquals("0087/3/5", localePicker.getInputValue());

        localePicker.setDate(LocalDate.of(900, Month.MARCH, 4));
        Assert.assertEquals("0900/3/4", localePicker.getInputValue());
        localePicker.setDate(LocalDate.of(87, Month.MARCH, 4));
        Assert.assertEquals("0087/3/4", localePicker.getInputValue());

        $("button").id("Locale-UK").click();
        Assert.assertEquals("04/03/0087", localePicker.getInputValue());
    }

    @Test
    public void selectDatesBeforeYear1000SimulateUserInput() {
        DatePickerElement localePicker = $(DatePickerElement.class)
                .id("locale-change-picker");
        TestBenchElement message = $("div")
                .id("Customize-locale-picker-message");

        localePicker.setInputValue("3/7/0900");
        Assert.assertEquals("3/7/0900", localePicker.getInputValue());
        Assert.assertEquals(LocalDate.of(900, Month.MARCH, 7),
                localePicker.getDate());

        localePicker.setInputValue("3/6/900");
        Assert.assertEquals("3/6/0900", localePicker.getInputValue());
        Assert.assertEquals(LocalDate.of(900, Month.MARCH, 6),
                localePicker.getDate());

        localePicker.setInputValue("3/5/0087");
        Assert.assertEquals("3/5/0087", localePicker.getInputValue());
        Assert.assertEquals(LocalDate.of(87, Month.MARCH, 5),
                localePicker.getDate());

        localePicker.setInputValue("3/6/87");
        Assert.assertEquals("3/6/1987", localePicker.getInputValue());
        Assert.assertEquals(LocalDate.of(1987, Month.MARCH, 6),
                localePicker.getDate());

        localePicker.setInputValue("3/7/20");
        Assert.assertEquals("3/7/2020", localePicker.getInputValue());
        Assert.assertEquals(LocalDate.of(2020, Month.MARCH, 7),
                localePicker.getDate());

        localePicker.setInputValue("3/8/0020");
        Assert.assertEquals("3/8/0020", localePicker.getInputValue());
        Assert.assertEquals(LocalDate.of(20, Month.MARCH, 8),
                localePicker.getDate());

        $("button").id("Locale-UK").click();
        Assert.assertEquals("08/03/0020", localePicker.getInputValue());

        localePicker.setInputValue("7/3/0900");
        Assert.assertEquals("07/03/0900", localePicker.getInputValue());
        Assert.assertEquals(LocalDate.of(900, Month.MARCH, 7),
                localePicker.getDate());

        localePicker.setInputValue("6/3/900");
        Assert.assertEquals("06/03/0900", localePicker.getInputValue());
        Assert.assertEquals(LocalDate.of(900, Month.MARCH, 6),
                localePicker.getDate());

        localePicker.setInputValue("5/3/0087");
        Assert.assertEquals("05/03/0087", localePicker.getInputValue());
        Assert.assertEquals(LocalDate.of(87, Month.MARCH, 5),
                localePicker.getDate());

        localePicker.setInputValue("6/3/87");
        Assert.assertEquals("06/03/1987", localePicker.getInputValue());
        Assert.assertEquals(LocalDate.of(1987, Month.MARCH, 6),
                localePicker.getDate());

        localePicker.setInputValue("7/3/20");
        Assert.assertEquals("07/03/2020", localePicker.getInputValue());
        Assert.assertEquals(LocalDate.of(2020, Month.MARCH, 7),
                localePicker.getDate());

        localePicker.setInputValue("8/3/0020");
        Assert.assertEquals("08/03/0020", localePicker.getInputValue());
        Assert.assertEquals(LocalDate.of(20, Month.MARCH, 8),
                localePicker.getDate());

        $("button").id("Locale-CHINA").click();
        Assert.assertEquals("0020/3/8", localePicker.getInputValue());

        localePicker.setInputValue("0900/3/7");
        Assert.assertEquals("0900/3/7", localePicker.getInputValue());
        Assert.assertEquals(LocalDate.of(900, Month.MARCH, 7),
                localePicker.getDate());

        localePicker.setInputValue("900/3/6");
        Assert.assertEquals("0900/3/6", localePicker.getInputValue());
        Assert.assertEquals(LocalDate.of(900, Month.MARCH, 6),
                localePicker.getDate());

        localePicker.setInputValue("0087/3/5");
        Assert.assertEquals("0087/3/5", localePicker.getInputValue());
        Assert.assertEquals(LocalDate.of(87, Month.MARCH, 5),
                localePicker.getDate());

        localePicker.setInputValue("87/3/6");
        Assert.assertEquals("1987/3/6", localePicker.getInputValue());
        Assert.assertEquals(LocalDate.of(1987, Month.MARCH, 6),
                localePicker.getDate());

        localePicker.setInputValue("20/3/7");
        Assert.assertEquals("2020/3/7", localePicker.getInputValue());
        Assert.assertEquals(LocalDate.of(2020, Month.MARCH, 7),
                localePicker.getDate());

        localePicker.setInputValue("0020/3/8");
        Assert.assertEquals("0020/3/8", localePicker.getInputValue());
        Assert.assertEquals(LocalDate.of(20, Month.MARCH, 8),
                localePicker.getDate());

        $("button").id("Locale-US").click();
        Assert.assertEquals("3/8/0020", localePicker.getInputValue());
    }

    @Override
    protected String getTestPath() {
        return ("/vaadin-date-picker-test-demo");
    }
}
