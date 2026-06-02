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
 * Behat steps for block_exam_calculator.
 *
 * @package    block_exam_calculator
 * @category   test
 * @copyright  2024 Toni Jokinen
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../../../lib/behat/behat_base.php');

/**
 * Behat steps for the exam calculator block.
 */
class behat_block_exam_calculator extends behat_base {

    /**
     * Return the outer Moodle block element.
     *
     * @return \Behat\Mink\Element\NodeElement
     */
    protected function get_block_element() {
        $block = $this->find('css', '.block_exam_calculator');
        if (!$block) {
            throw new \Exception('Exam Calculator block was not found on the page.');
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

        throw new \Exception('Could not determine exam calculator block instance id.');
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

        if ($label === '=') {
            $button = $this->find(
                'css',
                '.block_exam_calculator .advanced-calculator button[data-action="evaluate"]'
            );
        } else if ($label === 'C') {
            $button = $this->find(
                'css',
                '.block_exam_calculator .advanced-calculator button[data-action="clear"]'
            );
        } else if ($label === 'DEL') {
            $button = $this->find(
                'css',
                '.block_exam_calculator .advanced-calculator button[data-action="backspace"]'
            );
        } else if ($label === 'CE') {
            $button = $this->find(
                'css',
                '.block_exam_calculator .advanced-calculator button[data-action="clear-entry"]'
            );
        } else if ($label === '%') {
            $button = $this->find(
                'css',
                '.block_exam_calculator .advanced-calculator button[data-action="percent"]'
            );
        } else if ($label === 'MC') {
            $button = $this->find(
                'css',
                '.block_exam_calculator .advanced-calculator button[data-action="memory-clear"]'
            );
        } else if ($label === 'MR') {
            $button = $this->find(
                'css',
                '.block_exam_calculator .advanced-calculator button[data-action="memory-recall"]'
            );
        } else if ($label === 'M+') {
            $button = $this->find(
                'css',
                '.block_exam_calculator .advanced-calculator button[data-action="memory-add"]'
            );
        } else if ($label === 'M-') {
            $button = $this->find(
                'css',
                '.block_exam_calculator .advanced-calculator button[data-action="memory-subtract"]'
            );
        } else {
            $button = $this->find(
                'css',
                '.block_exam_calculator .advanced-calculator button[data-value="' . addslashes($label) . '"]'
            );
        }

        if (!$button) {
            $button = $this->find(
                'xpath',
                '//div[contains(@class,"block_exam_calculator")]' .
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
     * @Given /^the exam calculator block mode is "([^"]*)"$/
     * @param string $mode
     * @return void
     */
    public function the_exam_calculator_block_mode_is(string $mode): void {
        $allowed = ['basic', 'scientific'];
        if (!in_array($mode, $allowed, true)) {
            throw new \Exception('Unsupported calculator mode: ' . $mode);
        }

        $this->update_block_config(['calculatormode' => $mode]);
    }

    /**
     * Press a button in the calculator block.
     *
     * @When /^I press "([^"]*)" in the exam calculator block$/
     * @param string $label
     * @return void
     */
    public function i_press_in_the_exam_calculator_block(string $label): void {
        $this->press_button($label);
    }

    /**
     * Press several buttons in order.
     *
     * @When /^I press the following buttons in the exam calculator block:$/
     * @param \Behat\Gherkin\Node\TableNode $table
     * @return void
     */
    public function i_press_the_following_buttons_in_the_exam_calculator_block(\Behat\Gherkin\Node\TableNode $table): void {
        foreach ($table->getRows() as $row) {
            foreach ($row as $label) {
                $this->press_button(trim($label));
            }
        }
    }

    /**
     * Type an expression into the calculator display.
     *
     * @When /^I type "([^"]*)" in the exam calculator block$/
     * @param string $expression
     * @return void
     */
    public function i_type_in_the_exam_calculator_block(string $expression): void {
        $display = $this->find('css', '.block_exam_calculator [data-region="display"]');
        if (!$display) {
            throw new \Exception('Calculator display was not found.');
        }

        $escaped = json_encode($expression);
        $this->getSession()->executeScript(
            "var input = document.querySelector('.block_exam_calculator [data-region=\"display\"]');" .
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
     * Check display value.
     *
     * @Then /^the exam calculator display should be "([^"]*)"$/
     * @param string $expected
     * @return void
     */
    public function the_exam_calculator_display_should_be(string $expected): void {
        $display = $this->find('css', '.block_exam_calculator [data-region="display"]');
        if (!$display) {
            throw new \Exception('Calculator display was not found.');
        }

        $actual = (string)$display->getValue();
        if ($this->normalise_calculator_text($actual) !== $this->normalise_calculator_text($expected)) {
            throw new \Exception('Expected calculator display "' . $expected . '" but found "' . $actual . '".');
        }
    }

    /**
     * Check numeric display value with a tolerance.
     *
     * @Then /^the exam calculator display should be approximately "([^"]*)"$/
     * @param string $expected
     * @return void
     */
    public function the_exam_calculator_display_should_be_approximately(string $expected): void {
        $display = $this->find('css', '.block_exam_calculator [data-region="display"]');
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
     * @Then /^the exam calculator operation should be "([^"]*)"$/
     * @param string $expected
     * @return void
     */
    public function the_exam_calculator_operation_should_be(string $expected): void {
        $operation = $this->find('css', '.block_exam_calculator [data-region="operation"]');
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
     * @Then /^the exam calculator mode badge should be "([^"]*)"$/
     * @param string $expected
     * @return void
     */
    public function the_exam_calculator_mode_badge_should_be(string $expected): void {
        $badge = $this->find('css', '.block_exam_calculator .advanced-calculator__mode');
        if (!$badge) {
            throw new \Exception('Calculator mode badge was not found.');
        }

        $actual = trim((string)$badge->getText());
        if ($actual !== $expected) {
            throw new \Exception('Expected calculator mode badge "' . $expected . '" but found "' . $actual . '".');
        }
    }

    /**
     * Check that history contains a text fragment.
     *
     * @Then /^the exam calculator history should contain "([^"]*)"$/
     * @param string $expected
     * @return void
     */
    public function the_exam_calculator_history_should_contain(string $expected): void {
        $history = $this->find('css', '.block_exam_calculator [data-region="history"]');
        if (!$history) {
            throw new \Exception('Calculator history was not found.');
        }

        $actual = (string)$history->getText();
        if (mb_strpos($actual, $expected) === false) {
            throw new \Exception('Expected calculator history to contain "' . $expected . '" but found "' . $actual . '".');
        }
    }
}
