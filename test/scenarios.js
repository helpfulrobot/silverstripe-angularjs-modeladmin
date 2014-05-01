"use strict";

var webdriver = require("selenium-webdriver"),
	SeleniumServer = require("selenium-webdriver/remote").SeleniumServer,
	test = require("selenium-webdriver/testing"),
	jar = require("selenium-server-standalone-jar"),
	expect = require("expect.js"),
	fs = require("fs");

test.describe("Product catalog", function () {
	var server,
		driver,
		testHost = process.env.SELENIUM_TEST_HOST,
		testScripts = "<script type=\"text/javascript\" src=\"silverstripe-angularjs-modeladmin/vendor/angular-mocks/angular-mocks.js\"></script><script type=\"text/javascript\" src=\"silverstripe-angularjs-modeladmin/test/mockApp.js\"></script>",
		appTemplatePath = __dirname + "/../templates/ProductCatalogPage.ss",
		appTemplate = fs.readFileSync(appTemplatePath, {encoding: "utf8"});

	test.before(function () {
		// Write the test template
		fs.writeFileSync(appTemplatePath, appTemplate.replace("</body>", testScripts + "</body>"));

		// Create a Selenium Server.
		server = new SeleniumServer(jar.path, {
			port: 4444
		});

		server.start();
		
		// Create a Selenium WebDriver.
		driver = new webdriver.Builder().
			usingServer(server.address()).
			withCapabilities(webdriver.Capabilities.firefox()).
			build();
	});

	test.describe("sorting", function () {
		test.beforeEach(function () {
			driver.get(testHost);
		});

		test.it("should filter products by most recent (default)", function () {
			// Check products are in the correct order.
			driver.findElements(webdriver.By.css("#product-catalog .panel-title")).then(function (elements) {
				elements[0].getText().then(function (text) {
					expect(text).to.be("Banana");
				});
			});
		});

		test.it("should filter products alphabetically", function () {
			// Select alphabetical filtering from the dropdown.
			driver.findElement(webdriver.By.css(".dropdown-toggle")).then(function (element) {
				element.click();
				driver.findElement(webdriver.By.linkText("Alphabetical")).then(function (element) {
					element.click();
				});
			});

			// Check products are in the correct order.
			driver.findElements(webdriver.By.css("#product-catalog .panel-title")).then(function (elements) {
				elements[0].getText().then(function (text) {
					expect(text).to.be("Apple");
				});
			});
		});
	});

	test.describe("filtering", function () {
		test.beforeEach(function () {
			driver.get(testHost);
		});

		test.it("should filter products by search query", function () {
			// Search for "Apple"
			driver.findElement(webdriver.By.css(".catalog-search-filter input")).then(function (element) {
				element.sendKeys("Apple");
			});

			// There should a one product called "Apple"
			driver.findElement(webdriver.By.css("#product-catalog .panel-title")).then(function (element) {
				element.getText().then(function (text) {
					expect(text).to.be("Apple");
				});
			});

			// The pagination should be hidden
			driver.findElement(webdriver.By.css(".pagination")).then(function (element) {
				element.isDisplayed().then(function (isDisplayed) {
					expect(isDisplayed).to.be(false);
				});
			});

			// Search for a non-existant product
			driver.findElement(webdriver.By.css(".catalog-search-filter input")).then(function (element) {
				element.sendKeys("Pies");
			});

			// The "No products found" message show be visible
			driver.findElement(webdriver.By.css("#no-products-error-message")).then(function (element) {
				element.getText().then(function (text) {
					expect(text).to.be("Sorry, no products found.");
				});
			});
		});

		test.it("should include products from previous pages", function () {
			// Go to the second page
			driver.findElement(webdriver.By.css(".pagination .step.forward a")).then(function (element) {
				element.click();
			});

			// Search for a product on the previous page
			driver.findElement(webdriver.By.css(".catalog-search-filter input")).then(function (element) {
				element.sendKeys("Banana");
			});

			// Check the product is displayed
			driver.findElement(webdriver.By.css("#product-catalog .panel-title")).then(function (element) {
				element.getText().then(function (text) {
					expect(text).to.be("Banana");
				});
			});
		});
	});

	test.describe("pagination", function () {
		test.beforeEach(function () {
			driver.get(testHost);
		});

		test.it("should paginate the products", function () {
			// Should have three pages
			driver.findElements(webdriver.By.css(".pagination li")).then(function (elements) {
				expect(elements.length).to.be(5);
			});

			// Back button should be disabled
			driver.findElement(webdriver.By.css(".pagination .step.back")).then(function (element) {
				element.click();

				driver.findElement(webdriver.By.css("#product-catalog .panel-title")).then(function (element) {
					element.getText().then(function (text) {
						expect(text).to.be("Banana");
					});
				});
			});

			// The first page should be selected
			driver.findElements(webdriver.By.css(".pagination li.active:nth-child(2)")).then(function (element) {
				expect(element.length).to.be(1);
			});

			// Select the second page
			driver.findElement(webdriver.By.css(".pagination li:nth-child(3) a")).then(function (element) {
				element.click();
			});

			// The second page should be "Cherry"
			driver.findElement(webdriver.By.css("#product-catalog .panel-title")).then(function (element) {
				element.getText().then(function (text) {
					expect(text).to.be("Cherry");
				});
			});

			// Select the third page
			driver.findElement(webdriver.By.css(".pagination li:nth-child(4) a")).then(function (element) {
				element.click();
			});

			// The third page should be "Apple"
			driver.findElement(webdriver.By.css("#product-catalog .panel-title")).then(function (element) {
				element.getText().then(function (text) {
					expect(text).to.be("Apple");
				});
			});

			// The forward button should be disabled
			driver.findElement(webdriver.By.css(".pagination .step.forward a")).then(function (element) {
				element.click();

				driver.findElement(webdriver.By.css("#product-catalog .panel-title")).then(function (element) {
					element.getText().then(function (text) {
						expect(text).to.be("Apple");
					});
				});
			});

			// The back button should navigate
			driver.findElement(webdriver.By.css(".pagination .step.back a")).then(function (element) {
				element.click();

				driver.findElement(webdriver.By.css("#product-catalog .panel-title")).then(function (element) {
					element.getText().then(function (text) {
						expect(text).to.be("Cherry");
					});
				});
			});
			driver.findElement(webdriver.By.css(".pagination .step.back a")).then(function (element) {
				element.click();

				driver.findElement(webdriver.By.css("#product-catalog .panel-title")).then(function (element) {
					element.getText().then(function (text) {
						expect(text).to.be("Banana");
					});
				});
			});

			// The forward button should navigate
			driver.findElement(webdriver.By.css(".pagination .step.forward a")).then(function (element) {
				element.click();

				driver.findElement(webdriver.By.css("#product-catalog .panel-title")).then(function (element) {
					element.getText().then(function (text) {
						expect(text).to.be("Cherry");
					});
				});
			});
			driver.findElement(webdriver.By.css(".pagination .step.forward a")).then(function (element) {
				element.click();

				driver.findElement(webdriver.By.css("#product-catalog .panel-title")).then(function (element) {
					element.getText().then(function (text) {
						expect(text).to.be("Apple");
					});
				});
			});
		});
	});

	test.after(function () {
		// Clean up Selenium.
		driver.quit();
		server.stop();

		// Remove the test scripts from the template.
		fs.writeFileSync(appTemplatePath, appTemplate);
	});
});