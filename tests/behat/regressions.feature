@block @block_course_calculator @javascript
Feature: Calculator results remain usable at numeric boundaries
  In order to rely on calculations while studying
  As a learner
  I need to edit grouped numbers and reuse small and large results accurately

  Background:
    Given I log in as "admin"
    And I am on site homepage
    And I turn editing mode on
    And I add the "Course Calculator" block

  Scenario: Scientific mode can delete a digit at the end of a grouped number
    Given the Course Calculator block mode is "scientific"
    When I type "1234" in the Course Calculator block
    And I press the end key
    And I press the backspace key
    Then the Course Calculator display should be "123"

  Scenario: Scientific mode paste replaces the initial zero
    Given the Course Calculator block mode is "scientific"
    When I paste "-2^2" at the cursor in the Course Calculator block
    And I press "=" in the Course Calculator block
    Then the Course Calculator display should be "-4"

  Scenario: Scientific mode has a power button
    Given the Course Calculator block mode is "scientific"
    When I press the following buttons in the Course Calculator block:
      | 2 | ^ | 3 | = |
    Then the Course Calculator display should be "8"

  Scenario: Scientific results are announced to assistive technology
    Given the Course Calculator block mode is "scientific"
    When I type "2+2" in the Course Calculator block
    And I press "=" in the Course Calculator block
    Then the Course Calculator display should be "4"
    And the Course Calculator should announce "Result: 4"
    And the Course Calculator input should have an accessible name and error description

  Scenario: Calculation errors are programmatically identified
    Given the Course Calculator block mode is "scientific"
    When I type "1/0" in the Course Calculator block
    And I press "=" in the Course Calculator block
    And I press "=" in the Course Calculator block
    Then the Course Calculator input should be marked invalid with an error message

  Scenario: Calculator text has sufficient contrast in the active Moodle theme
    Given the Course Calculator block mode is "scientific"
    When I type "2+2" in the Course Calculator block
    And I press "=" in the Course Calculator block
    Then the Course Calculator text contrast should meet WCAG AA

  Scenario: Scientific mode preserves small nonzero results
    Given the Course Calculator block mode is "scientific"
    When I type "1/100000000000" in the Course Calculator block
    And I press "=" in the Course Calculator block
    Then the Course Calculator display should be "1e-11"

  Scenario: Scientific mode can reuse a result with a negative exponent
    Given the Course Calculator block mode is "scientific"
    When I type "1/10000000000" in the Course Calculator block
    And I press "=" in the Course Calculator block
    And I press "*" in the Course Calculator block
    And I type "10000000000"
    And I press "=" in the Course Calculator block
    Then the Course Calculator display should be "1"

  Scenario: Scientific mode can reuse a result with a positive exponent
    Given the Course Calculator block mode is "scientific"
    When I type "pow(10;21)" in the Course Calculator block
    And I press "=" in the Course Calculator block
    And I press "/" in the Course Calculator block
    And I type "100000000000000000000"
    And I press "=" in the Course Calculator block
    Then the Course Calculator display should be "10"

  Scenario Outline: Scientific mode applies powers before unary minus
    Given the Course Calculator block mode is "scientific"
    When I type "<expression>" in the Course Calculator block
    And I press "=" in the Course Calculator block
    Then the Course Calculator display should be "<result>"

    Examples:
      | expression | result |
      | -2^2       | -4     |
      | (-2)^2     | 4      |
      | 2^-2       | 0.25   |
      | 2^3^2      | 512    |

  Scenario: Basic mode preserves small nonzero results
    When I type "1" in the Course Calculator block
    And I press "/" in the Course Calculator block
    And I type "100000000000" in the Course Calculator block
    And I press "=" in the Course Calculator block
    Then the Course Calculator display should be "1e-11"

  Scenario Outline: Scientific mode accepts negative operands from the keyboard
    Given the Course Calculator block mode is "scientific"
    When I type "0" in the Course Calculator block
    And I type "<expression>"
    And I press the enter key
    Then the Course Calculator display should be "<result>"

    Examples:
      | expression | result |
      | 2*-3       | -6     |
      | 2--3       | 5      |
      | 2^-2       | 0.25   |
      | -2^2       | -4     |

  Scenario: Scientific mode accepts the equals key
    Given the Course Calculator block mode is "scientific"
    When I type "2+2" in the Course Calculator block
    And I press the = key
    Then the Course Calculator display should be "4"

  Scenario: Basic mode accepts a pasted exponent without changing its value
    When I type "1e-10" in the Course Calculator block
    And I press "*" in the Course Calculator block
    And I type "10000000000" in the Course Calculator block
    And I press "=" in the Course Calculator block
    Then the Course Calculator display should be "1"

  Scenario: Basic mode reports numeric overflow
    When I type "1e200" in the Course Calculator block
    And I click on "Square" "button" in the "Course Calculator" "block"
    Then I should see "Result is too large." in the "Course Calculator" "block"

  Scenario Outline: Calculator memory rejects an overflowing sum
    Given the Course Calculator block mode is "<mode>"
    When I type "1e308" in the Course Calculator block
    And I press "M+" in the Course Calculator block
    And I press "M+" in the Course Calculator block
    Then I should see "Result is too large." in the "Course Calculator" "block"

    Examples:
      | mode       |
      | basic      |
      | scientific |

  Scenario Outline: Scientific mode reports undefined tangent values
    Given the Course Calculator block mode is "scientific"
    When I press "<angle_mode>" in the Course Calculator block
    And I type "<expression>" in the Course Calculator block
    And I press "=" in the Course Calculator block
    Then I should see "Value is outside the valid function range." in the "Course Calculator" "block"

    Examples:
      | angle_mode | expression |
      | DEG        | tan(90)    |
      | DEG        | tan(270)   |
      | RAD        | tan(pi/2)  |

  Scenario Outline: Scientific mode keeps defined tangent values available
    Given the Course Calculator block mode is "scientific"
    When I press "<angle_mode>" in the Course Calculator block
    And I type "<expression>" in the Course Calculator block
    And I press "=" in the Course Calculator block
    Then the Course Calculator display should be approximately "1"

    Examples:
      | angle_mode | expression |
      | DEG        | tan(45)    |
      | RAD        | tan(pi/4)  |
