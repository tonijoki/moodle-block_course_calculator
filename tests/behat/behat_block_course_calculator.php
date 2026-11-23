<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Behat steps for block_course_calculator.
 *
 * @package    block_course_calculator
 * @category   test
 * @copyright  2024 Toni Jokinen, University of Helsinki
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../../../lib/behat/behat_base.php');

/**
 * Behat steps for the Course Calculator block.
 */
class behat_block_course_calculator extends behat_base {
    /**
     * Return the outer Moodle block element.
     *
     * @return \Behat\Mink\Element\NodeElement
     */
    protected function get_block_element() {
        $block = $this->find('css', '.block_course_calculator');
        if (!$block) {
            throw new \Exception('Course Calculator block was not found on the page.');
        }

        return $block;
    }

    /**
     * Build a safe XPath string literal.
     *
     * @param string $value
     * @return string
     */
    protected function xpath_literal(string $value): string {
        if (strpos($value, "'") === false) {
            return "'" . $value . "'";
        }

        if (strpos($value, '"') === false) {
            return '"' . $value . '"';
        }

        $parts = explode("'", $value);
        return "concat('" . implode("', \"'\", '", $parts) . "')";
    }

    /**
     * Get current block instance id.
     *
     * @return int
     */
    protected function get_block_instance_id(): int {
        $block = $this->get_block_element();
        $id = (string)$block->getAttribute('id');

        if (preg_match('/inst(\d+)/', $id, $matches)) {
            return (int)$matches[1];
        }

        throw new \Exception('Could not determine Course Calculator block instance id.');
    }

    /**
     * Save block instance configuration and reload the page.
     *
     * @param array $changes
     * @return void
     */
    protected function update_block_config(array $changes): void {
        global $DB;

        $instanceid = $this->get_block_instance_id();
        $instance = $DB->get_record('block_instances', ['id' => $instanceid], '*', MUST_EXIST);
        $block = block_instance($instance->blockname, $instance);

        $config = empty($block->config) ? new stdClass() : clone $block->config;
        foreach ($changes as $key => $value) {
            $config->{$key} = $value;
        }

        $block->instance_config_save($config);
        $this->getSession()->reload();
    }

    /**
     * Click a calculator button by visible label.
     *
     * @param string $label
     * @return void
     */
    protected function press_button(string $label): void {
        $button = null;
        $functionlabels = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'ln', 'log', 'exp', 'abs', 'pow'];
        $buttonvalue = in_array($label, $functionlabels, true) ? $label . '(' : $label;

        if ($label === '=') {
            $button = $this->find(
                'css',
                '.block_course_calculator .advanced-calculator button[data-action="evaluate"]'
            );
        } else if ($label === 'C') {
            $button = $this->find(
                'css',
                '.block_course_calculator .advanced-calculator button[data-action="clear"]'
            );
        } else if ($label === 'DEL') {
            $button = $this->find(
                'css',
                '.block_course_calculator .advanced-calculator button[data-action="backspace"]'
            );
        } else if ($label === 'CE') {
            $button = $this->find(
                'css',
                '.block_course_calculator .advanced-calculator button[data-action="clear-entry"]'
            );
        } else if ($label === '%') {
            $button = $this->find(
                'css',
                '.block_course_calculator .advanced-calculator button[data-action="percent"]'
            );
        } else if ($label === 'MC') {
            $button = $this->find(
                'css',
                '.block_course_calculator .advanced-calculator button[data-action="memory-clear"]'
            );
        } else if ($label === 'MR') {
            $button = $this->find(
                'css',
                '.block_course_calculator .advanced-calculator button[data-action="memory-recall"]'
            );
        } else if ($label === 'M+') {
            $button = $this->find(
                'css',
                '.block_course_calculator .advanced-calculator button[data-action="memory-add"]'
            );
        } else if ($label === 'M-') {
            $button = $this->find(
                'css',
                '.block_course_calculator .advanced-calculator button[data-action="memory-subtract"]'
            );
        } else {
            $button = $this->find(
                'css',
                '.block_course_calculator .advanced-calculator button[data-value="' . addslashes($buttonvalue) . '"]'
            );
        }

        if (!$button) {
            $button = $this->find(
                'xpath',
                '//div[contains(@class,"block_course_calculator")]' .
                '//div[contains(@class,"advanced-calculator")]' .
                '//button[normalize-space(.)=' . $this->xpath_literal($label) . ']'
            );
        }

        if (!$button) {
            throw new \Exception('Calculator button not found: ' . $label);
        }

        $button->click();
    }

    /**
     * Set the block calculator mode.
     *
     * @Given /^the Course Calculator block mode is "([^"]*)"$/
     * @param string $mode
     * @return void
     */
    public function the_course_calculator_block_mode_is(string $mode): void {
        $allowed = ['basic', 'scientific'];
        if (!in_array($mode, $allowed, true)) {
            throw new \Exception('Unsupported calculator mode: ' . $mode);
        }

        $this->update_block_config(['calculatormode' => $mode]);
    }

    /**
     * Press a button in the calculator block.
     *
     * @When /^I press "([^"]*)" in the Course Calculator block$/
     * @param string $label
     * @return void
     */
    public function i_press_in_the_course_calculator_block(string $label): void {
        $this->press_button($label);
    }

    /**
     * Press several buttons in order.
     *
     * @When /^I press the following buttons in the Course Calculator block:$/
     * @param \Behat\Gherkin\Node\TableNode $table
     * @return void
     */
    public function i_press_the_following_buttons_in_the_course_calculator_block(\Behat\Gherkin\Node\TableNode $table): void {
        foreach ($table->getRows() as $row) {
            foreach ($row as $label) {
                $this->press_button(trim($label));
            }
        }
    }

    /**
     * Type an expression into the calculator display.
     *
     * @When /^I type "([^"]*)" in the Course Calculator block$/
     * @param string $expression
     * @return void
     */
    public function i_type_in_the_course_calculator_block(string $expression): void {
        $display = $this->find('css', '.block_course_calculator [data-region="display"]');
        if (!$display) {
            throw new \Exception('Calculator display was not found.');
        }

        $escaped = json_encode($expression);
        $this->getSession()->executeScript(
            "var input = document.querySelector('.block_course_calculator [data-region=\"display\"]');" .
            "input.focus();" .
            "input.setSelectionRange(0, input.value.length);" .
            "var event = new Event('paste', {bubbles: true, cancelable: true});" .
            "Object.defineProperty(event, 'clipboardData', {" .
            "value: {getData: function(type) {return type === 'text/plain' ? " . $escaped . " : '';}}" .
            "});" .
            "input.dispatchEvent(event);"
        );
    }

    /**
     * Paste into the focused display without selecting its current contents.
     *
     * @When /^I paste "([^"]*)" at the cursor in the Course Calculator block$/
     * @param string $expression
     * @return void
     */
    public function i_paste_at_cursor_in_the_course_calculator_block(string $expression): void {
        $escaped = json_encode($expression);
        $this->getSession()->executeScript(
            "var input = document.querySelector('.block_course_calculator [data-region=\"display\"]');" .
            "input.focus();" .
            "var event = new Event('paste', {bubbles: true, cancelable: true});" .
            "Object.defineProperty(event, 'clipboardData', {" .
            "value: {getData: function(type) {return type === 'text/plain' ? " . $escaped . " : '';}}" .
            "});" .
            "input.dispatchEvent(event);"
        );
    }

    /**
     * Check display value.
     *
     * @Then /^the Course Calculator display should be "([^"]*)"$/
     * @param string $expected
     * @return void
     */
    public function the_course_calculator_display_should_be(string $expected): void {
        $display = $this->find('css', '.block_course_calculator [data-region="display"]');
        if (!$display) {
            throw new \Exception('Calculator display was not found.');
        }

        $actual = (string)$display->getValue();
        if ($this->normalise_calculator_text($actual) !== $this->normalise_calculator_text($expected)) {
            throw new \Exception('Expected calculator display "' . $expected . '" but found "' . $actual . '".');
        }
    }

    /**
     * Check that the result is announced without moving focus.
     *
     * @Then /^the Course Calculator should announce "([^"]*)"$/
     * @param string $expected
     * @return void
     */
    public function the_course_calculator_should_announce(string $expected): void {
        $escaped = json_encode($expected);
        $selector = json_encode('.block_course_calculator [data-region="announcement"]');
        $this->getSession()->wait(
            1000,
            "(function() { var node = document.querySelector(" . $selector . "); " .
                "return node && node.textContent === " . $escaped . "; })()"
        );
        $announcement = $this->find('css', '.block_course_calculator [data-region="announcement"]');
        if (!$announcement || trim($announcement->getText()) !== $expected) {
            throw new \Exception('The calculator result was not announced as expected.');
        }
    }

    /**
     * Check that the display has an accessible name and an associated error message.
     *
     * @Then /^the Course Calculator input should have an accessible name and error description$/
     * @return void
     */
    public function the_course_calculator_input_should_have_an_accessible_name_and_error_description(): void {
        $input = $this->find('css', '.block_course_calculator [data-region="display"]');
        if (!$input || !$input->getAttribute('aria-label') || !$input->getAttribute('aria-describedby')) {
            throw new \Exception('The calculator input is missing its accessible name or error description.');
        }
        $describedby = $input->getAttribute('aria-describedby');
        $error = $this->find('css', '#' . $describedby);
        if (!$error || $error->getAttribute('role') !== 'alert' || $error->getAttribute('aria-live') !== 'assertive') {
            throw new \Exception('The calculator input error description is not an alert.');
        }
        $display = $this->getSession()->evaluateScript(
            "getComputedStyle(document.querySelector('.block_course_calculator [data-region=\"error\"]')).display"
        );
        if ($display === 'none') {
            throw new \Exception('The calculator error alert is hidden from assistive technology.');
        }
    }

    /**
     * Check that an invalid expression is linked to its announced error.
     *
     * @Then /^the Course Calculator input should be marked invalid with an error message$/
     * @return void
     */
    public function the_course_calculator_input_should_be_marked_invalid_with_an_error_message(): void {
        $this->getSession()->wait(
            1000,
            "(function() { var node = document.querySelector('.block_course_calculator [data-region=\"error\"]'); " .
                "return node && node.textContent.length > 0; })()"
        );
        $input = $this->find('css', '.block_course_calculator [data-region="display"]');
        $error = $this->find('css', '.block_course_calculator [data-region="error"]');
        if (!$input || $input->getAttribute('aria-invalid') !== 'true' || !$error || !$error->getText()) {
            throw new \Exception('The invalid calculation is not programmatically associated with its error.');
        }
    }

    /**
     * Check contrast of the calculator's text styles in the active Moodle theme.
     *
     * @Then /^the Course Calculator text contrast should meet WCAG AA$/
     * @return void
     */
    public function the_course_calculator_text_contrast_should_meet_wcag_aa(): void {
        $script = <<<'JS'
(function() {
    const selectors = [
        '.advanced-calculator__mode',
        '.advanced-calculator__hint',
        '.advanced-calculator__history-title',
        '.advanced-calculator__input',
        '.advanced-calculator__btn:not(.advanced-calculator__btn--soft):not(.advanced-calculator__btn--accent)',
        '.advanced-calculator__btn--soft',
        '.advanced-calculator__btn--accent',
        '.advanced-calculator__error',
    ];
    const calculator = document.querySelector('.block_course_calculator .advanced-calculator');
    const error = calculator.querySelector('[data-region="error"]');
    error.textContent = 'Example error';
    error.classList.add('is-visible');
    const parse = (value) => {
        const match = value.match(/[\d.]+/g).map(Number);
        return match.slice(0, 3);
    };
    const background = (element) => {
        for (let node = element; node && node !== document.documentElement; node = node.parentElement) {
            const value = getComputedStyle(node).backgroundColor;
            if (value !== 'rgba(0, 0, 0, 0)' && value !== 'transparent') {
                return parse(value);
            }
        }
        return [255, 255, 255];
    };
    const luminance = (rgb) => {
        const channels = rgb.map((value) => {
            const channel = value / 255;
            return channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
    };
    return JSON.stringify(selectors.map((selector) => {
        const element = calculator.querySelector(selector);
        const foreground = parse(getComputedStyle(element).color);
        const bg = background(element);
        const values = [luminance(foreground), luminance(bg)].sort((a, b) => b - a);
        return {selector: selector, ratio: (values[0] + 0.05) / (values[1] + 0.05)};
    }));
})()
JS;
        $results = json_decode($this->getSession()->evaluateScript($script), true);
        if (!is_array($results)) {
            throw new \Exception('Could not calculate calculator text contrast.');
        }
        foreach ($results as $result) {
            if ($result['ratio'] < 4.5) {
                throw new \Exception('Text contrast is below 4.5:1 for ' . $result['selector'] . '.');
            }
        }
    }

    /**
     * Check that separate block instances keep separate display values.
     *
     * @Then /^the Course Calculator displays should be in order:$/
     * @param \Behat\Gherkin\Node\TableNode $table
     * @return void
     */
    public function the_course_calculator_displays_should_be_in_order(\Behat\Gherkin\Node\TableNode $table): void {
        $displays = $this->find_all('css', '.block_course_calculator [data-region="display"]');
        $expected = $table->getRows();
        if (count($displays) !== count($expected)) {
            throw new \Exception('The number of calculator displays does not match the expected values.');
        }
        foreach ($displays as $index => $display) {
            $actual = $this->normalise_calculator_text((string)$display->getValue());
            if ($actual !== $this->normalise_calculator_text($expected[$index][0])) {
                throw new \Exception('Calculator display ' . ($index + 1) . ' has unexpected value "' . $actual . '".');
            }
        }
    }

    /**
     * Check numeric display value with a tolerance.
     *
     * @Then /^the Course Calculator display should be approximately "([^"]*)"$/
     * @param string $expected
     * @return void
     */
    public function the_course_calculator_display_should_be_approximately(string $expected): void {
        $display = $this->find('css', '.block_course_calculator [data-region="display"]');
        if (!$display) {
            throw new \Exception('Calculator display was not found.');
        }

        $actual = $this->normalise_calculator_text((string)$display->getValue());
        $expectednumber = (float)$expected;
        $actualnumber = (float)$actual;
        $tolerance = 0.000000001;

        if (abs($actualnumber - $expectednumber) > $tolerance) {
            throw new \Exception(
                'Expected calculator display approximately "' . $expected .
                '" but found "' . $actual . '".'
            );
        }
    }

    /**
     * Check operation line.
     *
     * @Then /^the Course Calculator operation should be "([^"]*)"$/
     * @param string $expected
     * @return void
     */
    public function the_course_calculator_operation_should_be(string $expected): void {
        $operation = $this->find('css', '.block_course_calculator [data-region="operation"]');
        if (!$operation) {
            throw new \Exception('Calculator operation area was not found.');
        }

        $actual = trim((string)$operation->getText());
        if ($this->normalise_calculator_text($actual) !== $this->normalise_calculator_text($expected)) {
            throw new \Exception('Expected calculator operation "' . $expected . '" but found "' . $actual . '".');
        }
    }

    /**
     * Normalise calculator text for locale-independent Behat comparisons.
     *
     * @param string $value
     * @return string
     */
    protected function normalise_calculator_text(string $value): string {
        return str_replace([',', ' '], '', $value);
    }

    /**
     * Check mode badge text.
     *
     * @Then /^the Course Calculator mode badge should be "([^"]*)"$/
     * @param string $expected
     * @return void
     */
    public function the_course_calculator_mode_badge_should_be(string $expected): void {
        $badge = $this->find('css', '.block_course_calculator .advanced-calculator__mode');
        if (!$badge) {
            throw new \Exception('Calculator mode badge was not found.');
        }

        $actual = trim((string)$badge->getText());
        if ($actual !== $expected) {
            throw new \Exception('Expected calculator mode badge "' . $expected . '" but found "' . $actual . '".');
        }
    }

    /**
     * Check that calculator initialisation did not move focus to its input.
     *
     * @Then /^the Course Calculator input should not be focused$/
     * @return void
     */
    public function the_course_calculator_input_should_not_be_focused(): void {
        $isfocused = $this->getSession()->evaluateScript(
            'return document.activeElement === ' .
            'document.querySelector(\'.block_course_calculator [data-region="display"]\');'
        );

        if ($isfocused) {
            throw new \Exception('The Course Calculator input unexpectedly received focus.');
        }
    }

    /**
     * Check that history contains a text fragment.
     *
     * @Then /^the Course Calculator history should contain "([^"]*)"$/
     * @param string $expected
     * @return void
     */
    public function the_course_calculator_history_should_contain(string $expected): void {
        $history = $this->find('css', '.block_course_calculator [data-region="history"]');
        if (!$history) {
            throw new \Exception('Calculator history was not found.');
        }

        $actual = (string)$history->getText();
        if (mb_strpos($actual, $expected) === false) {
            throw new \Exception('Expected calculator history to contain "' . $expected . '" but found "' . $actual . '".');
        }
    }
}
