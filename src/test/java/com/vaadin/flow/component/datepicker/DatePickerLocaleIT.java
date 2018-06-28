package com.vaadin.flow.component.datepicker;

import java.util.logging.Level;

import org.junit.Assert;
import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.logging.LogEntries;

import com.vaadin.flow.testutil.AbstractComponentIT;
import com.vaadin.flow.testutil.TestPath;
import com.vaadin.testbench.TestBenchElement;

@TestPath("date-picker-locale")
public class DatePickerLocaleIT extends AbstractComponentIT {

    private static final String DATEPICKER_OVERLAY = "vaadin-date-picker-overlay";

    @Test
    public void testPickerWithValueAndLocaleFromServerSideDifferentCtor() {
        open();

        TestBenchElement localePicker = $(TestBenchElement.class).id("locale-picker-server-with-value");
        WebElement displayText = localePicker.$(TestBenchElement.class).id("input");

        Assert.assertEquals("Wrong initial date in field.", "2018/4/23",
                executeScript("return arguments[0].value", displayText));

        findElement(By.id("uk-locale")).click();
        Assert.assertEquals("Didn't have expected UK locale date.",
                "23/04/2018",
                executeScript("return arguments[0].value", displayText));

        localePicker = $(TestBenchElement.class).id("french-locale-date-picker");
        displayText = localePicker.$(TestBenchElement.class).id("input");

        Assert.assertEquals("French locale date had wrong format", "30/05/2018",
                executeScript("return arguments[0].value", displayText));



        LogEntries logs = driver.manage().logs().get("browser");
logs.filter(Level.WARNING).forEach(log -> System.out.println("=== " + log));
        Assert.assertEquals(
                "Expected only [Deprecation] warning should be in the logs", 1,
                logs.filter(Level.WARNING).size());
        Assert.assertEquals(
                "deprecation - Styling master document from stylesheets defined in HTML Imports is deprecated. Please refer to https://goo.gl/EGXzpw for possible migration paths.",
                logs.filter(Level.WARNING).get(0).getMessage());

        localePicker = $(TestBenchElement.class).id("german-locale-date-picker");
        executeScript("arguments[0].value = '10.01.1985'", localePicker);

        logs = driver.manage().logs().get("browser");

        Assert.assertEquals(
                "Expected only [Deprecation] warning should be in the logs", 1,
                logs.filter(Level.WARNING).size());
        Assert.assertEquals(
                "deprecation - Styling master document from stylesheets defined in HTML Imports is deprecated. Please refer to https://goo.gl/EGXzpw for possible migration paths.",
                logs.filter(Level.WARNING).get(0).getMessage());


        displayText = localePicker.$(TestBenchElement.class).id("input");
        Assert.assertEquals("Didn't have expected German locale date.",
                "10.01.1985",
                executeScript("return arguments[0].value", displayText));

    }
}
