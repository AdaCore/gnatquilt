"""
Test the search override. Try out the following scenarios:
 * Basic search throughout the whole source, including unrendered portions
 * Search of a substring found in highlightjs keywords
 * Search of a substring with multiple matches on the same line
"""

import os
import time

from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from coverage import build_run_and_coverage
from webdriver import FirefoxDriver

with FirefoxDriver() as driver:

    def merge_adjacent_spans(spans):
        """
        Considering a list of spans (a span is a source range only identified
        by the column offset in this context), merge the adjacent spans.
        """
        if not spans:
            return []
        result = [spans[0]]
        i = 1
        while i < len(spans):
            # If the end index of the previous span equals the start index of
            # the current one, then merge the latter with the former.
            if spans[i - 1][1] == spans[i][0]:
                result[-1] = (result[-1][0], spans[i][1])
            else:
                result.append(spans[i])
            i = i + 1
        return result

    def get_spans_in_elem(cl, elem):
        """
        Get the spans in elem (supposedly a line element) with the given class.
        """
        # Start by grabbing all of the spans of the line
        text_nodes = driver.execute_script(
            """
        const root = arguments[0];
        const walker = document.createTreeWalker(
          root,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );
        const result = [];
        let node;
        while ((node = walker.nextNode())) {
           // We want to grab all the classes that apply to to the (nested)
           // spans containing this text node. We have nested span as
           // highlightjs generates token spans for highlighting purposes,
           // and so does the search feature.
           if (node.textContent === "") continue;
           result.push([node.textContent, []]);
           do {
              node = node.parentElement;
              result[result.length - 1][1].push(node.className);
           } while (node.parentElement.tagName === "SPAN");
        }
        return result;
        """,
            elem,
        )

        # Then filter out to those of the expected class
        matching_spans = []
        i = 0
        for (text_content, classes) in text_nodes:
            if any(cl in actual_cl for actual_cl in classes):
                matching_spans.append((i, i + len(text_content)))
            i = i + len(text_content)

        # Merge adjacent spans
        return merge_adjacent_spans(matching_spans)

    def get_spans_in_dom(cl):
        """
        Get the spans in the dom with the given class.
        """
        result = []
        # Grab all the line elements
        line_elems = driver.find_elements(
            By.XPATH,
            "//tr[contains(@class, 'xcov-source-line')]",
        )

        # For each of them, find the highlighted search results
        for line_elem in line_elems:
            line_number = line_elem.find_element(By.TAG_NAME, "PRE")
            i = int(line_number.text)
            line_source = line_elem.find_element(
                By.XPATH,
                ".//td[contains(@class, 'xcov-source-row-text')]",
            )
            for span in get_spans_in_elem(cl, line_source):
                result.append((i, span))
        return result

    def check_hits(expected_hits):
        """
        Check that we have the right amount of search hits.
        """
        actual_hits = driver.find_element(By.CSS_SELECTOR, ".search-hits").text
        assert actual_hits == f"1/{expected_hits}"

    def check_locs(locs, cl, text_length):
        expected_spans = []
        for loc in locs:
            expected_spans.append((loc[0], (loc[1], loc[1] + text_length)))
        actual_spans = get_spans_in_dom(cl)
        assert expected_spans == actual_spans

    def check_highlight(locs, text_length):
        """
        Check that the given source range starting at locs, and with a length
        of text_length are highlighted.
        """
        check_locs(locs, "search-highlight", text_length)

    def check_active_match(loc, text_length):
        """
        Check that the given source range starting at loc, with a length of
        text_length is the active match.
        """
        check_locs([loc], "active-match", text_length)

    def check_highlight_and_active_match(loc, text_length):
        check_highlight([loc], text_length)
        check_active_match(loc, text_length)

    def next_match():
        driver.find_element(
            By.XPATH, "//button[contains(., 'keyboard_arrow_down')]"
        ).click()

    def previous_match():
        driver.find_element(
            By.XPATH, "//button[contains(., 'keyboard_arrow_up')]"
        ).click()

    def search(str):
        input_element = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, ".search-input"))
        )
        input_element.clear()
        input_element.send_keys(str)
        # Add a passive wait to avoid stale elements errors
        time.sleep(1)

    build_run_and_coverage(
        "src-traces",
        "p.gpr",
        "stmt",
        ["obj/main"],
    )

    # Navigate to the main source file
    driver.get("file://" + os.getcwd() + "/obj/index.html")
    driver.find_element(By.LINK_TEXT, "main.adb").click()
    # Set a timeout as the navigation may take a bit of time
    driver.implicitly_wait(1)

    # Open up the search widget
    actions = ActionChains(driver)
    actions.key_down(Keys.CONTROL).send_keys("f").key_up(Keys.CONTROL).perform()

    # # Check a match with multiple elements on the same line. Also checks that
    # # the search feature is case insensitive.
    search("in")
    check_highlight(
        [(3, 12), (4, 16), (4, 30), (5, 6), (7, 11), (9, 45), (9, 55)], 2
    )

    # Check a match spanning over multiple tokens (thus over multiple span HTML
    # elements).
    #
    # Note: this also implicitly checks that we ignore regexp characters
    search("in (L, H")
    check_highlight_and_active_match((4, 16), 8)

    # Check the next match button
    next_match()
    time.sleep(1)
    check_highlight_and_active_match((161, 20), 8)

    # Check that we preserve the highlightjs highlighting
    search("Boolean")
    check_locs([(4, 30), (4, 46)], "hljs-type", 7)
    check_locs([(4, 46)], "search-highlight", 7)
    check_hits(5)

    # Check closing search
    driver.find_element(By.XPATH, "//button[contains(., 'close')]").click()
    assert len(driver.find_elements(By.CSS_SELECTOR, ".search-input")) == 0
