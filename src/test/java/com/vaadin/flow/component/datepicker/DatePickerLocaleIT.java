package com.vaadin.flow.component.datepicker;

import java.util.logging.Level;

import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.logging.LogEntries;

import com.vaadin.flow.testutil.AbstractComponentIT;
import com.vaadin.flow.testutil.TestPath;

@TestPath("date-picker-locale")
public class DatePickerLocaleIT extends AbstractComponentIT {

    private static final String DATEPICKER_OVERLAY = "vaadin-date-picker-overlay";

    @Test
    public void testPickerWithValueAndLocaleFromServerSideDifferentCtor() {
        open();

        WebElement localePicker = findElement(
                By.id("locale-picker-server-with-value"));
        WebElement displayText = findInShadowRoot(localePicker, By.id("input"))
                .get(0);

        Assert.assertEquals("Wrong initial date in field.", "2018/4/23",
                executeScript("return arguments[0].value", displayText));

        findElement(By.id("uk-locale")).click();
        Assert.assertEquals("Didn't have expected UK locale date.", "23/04/2018",
                executeScript("return arguments[0].value", displayText));

        localePicker = findElement(By.id("french-locale-date-picker"));
        displayText = findInShadowRoot(localePicker, By.id("input")).get(0);

        Assert.assertEquals("French locale date had wrong format",
                "30/05/2018",
                executeScript("return arguments[0].value", displayText));

        LogEntries logs  =  driver.manage().logs().get("browser");

        Assert.assertEquals("Expected only [Deprecation] warning should be in the logs", 1, logs.filter(Level.WARNING).size());

        localePicker = findElement(By.id("german-locale-date-picker"));
        executeScript("arguments[0].value = '10.01.1985'", localePicker);

        logs  =  driver.manage().logs().get("browser");

        Assert.assertEquals("Expected only [Deprecation] warning should be in the logs", 1, logs.filter(Level.WARNING).size());

        displayText = findInShadowRoot(localePicker, By.id("input")).get(0);
        Assert.assertEquals("Didn't have expected German locale date.", "23.04.2018",
                executeScript("return arguments[0].value", displayText));

    }
}
