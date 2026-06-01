@block @block_exam_calculator @javascript
Feature: Use the exam calculator block
  In order to work with calculations in a block region
  As an administrator
  I need the exam calculator block to support its main user flows

  Background:
    Given I log in as "admin"
    And I am on site homepage
    And I turn editing mode on
    And I add the "Exam Calculator" block

  Scenario: Basic mode performs a simple calculation
    Then the exam calculator mode badge should be "BASIC"
    When I press the following buttons in the exam calculator block:
      | 2 | + | 2 | = |
    Then the exam calculator display should be "4"
    And the exam calculator operation should be "2+2 ="
    And the exam calculator history should contain "2+2"
    And the exam calculator history should contain "= 4"

  Scenario: Basic mode DEL removes the latest digit
    When I press the following buttons in the exam calculator block:
      | 1 | 2 | 3 | DEL |
    Then the exam calculator display should be "12"

  Scenario: Basic mode C clears the current calculation
    When I press the following buttons in the exam calculator block:
      | 9 | + | 1 | C |
    Then the exam calculator display should be "0"
    And the exam calculator operation should be ""

  Scenario: Basic mode CE clears only the current entry
    When I press the following buttons in the exam calculator block:
      | 1 | 2 | + | 3 | CE |
    Then the exam calculator display should be "0"
    And the exam calculator operation should be "12+"

  Scenario: Basic mode percent works in addition
    When I press the following buttons in the exam calculator block:
      | 2 | 0 | 0 | + | 1 | 0 | % | = |
    Then the exam calculator display should be "220"
    And the exam calculator operation should be "200+20 ="

  Scenario: Basic mode memory recall returns the stored value
    When I press the following buttons in the exam calculator block:
      | 5 | M+ | C | MR |
    Then the exam calculator display should be "5"

  Scenario: Basic mode memory clear removes the stored value
    When I press the following buttons in the exam calculator block:
      | 5 | M+ | C | MC | MR |
    Then the exam calculator display should be "0"

  Scenario: Scientific mode groups large numbers in the display
    Given the exam calculator block mode is "scientific"
    Then the exam calculator mode badge should be "SCIENTIFIC"
    When I press the following buttons in the exam calculator block:
      | 1 | 0 | 0 | 0 | 0 | 0 | 0 | + | 1 | = |
    Then the exam calculator display should be "1 000 001"
    And the exam calculator operation should be "1 000 000+1 ="

  Scenario: Scientific mode percent works in addition
    Given the exam calculator block mode is "scientific"
    When I press the following buttons in the exam calculator block:
      | 1 | 0 | + | 2 | 0 | % | = |
    Then the exam calculator display should be "12"
    And the exam calculator operation should be "10+2 ="

  Scenario: Scientific mode supports square root
    Given the exam calculator block mode is "scientific"
    When I press the following buttons in the exam calculator block:
      | 9 | sqrt | = |
    Then the exam calculator display should be "3"
    And the exam calculator operation should be "sqrt(9) ="

  Scenario: Scientific mode CE clears only the current entry
    Given the exam calculator block mode is "scientific"
    When I press the following buttons in the exam calculator block:
      | 1 | 2 | + | 3 | CE |
    Then the exam calculator display should be "12+"

  Scenario: Scientific mode memory recall returns the stored value
    Given the exam calculator block mode is "scientific"
    When I press the following buttons in the exam calculator block:
      | 8 | M+ | C | MR |
    Then the exam calculator display should be "8"

  Scenario Outline: Scientific mode matches reference calculations
    Given the exam calculator block mode is "scientific"
    When I type "<expression>" in the exam calculator block
    And I press "=" in the exam calculator block
    Then the exam calculator display should be approximately "<result>"

    Examples:
      | expression      | result       |
      | 2+2*3           | 8            |
      | (2+2)*3         | 12           |
      | 10/4            | 2.5          |
      | sqrt(2)         | 1.4142135624 |
      | sin(30)         | 0.5          |
      | cos(60)         | 0.5          |
      | tan(45)         | 1            |
      | asin(0.5)       | 30           |
      | acos(0.5)       | 60           |
      | atan(1)         | 45           |
      | log(100)        | 2            |
      | ln(e)           | 1            |
      | exp(1)          | 2.7182818285 |
      | 2^10            | 1024         |
      | 5!              | 120          |
      | pow(2,10)       | 1024         |
      | abs(-12.5)      | 12.5         |
      | min(4,2,8)      | 2            |
      | max(4,2,8)      | 8            |
      | round(2.6)      | 3            |
      | floor(2.9)      | 2            |
      | ceil(2.1)       | 3            |

  Scenario: Basic mode uses dot decimals for Moodle answer compatibility
    Then the exam calculator mode badge should be "BASIC"
    When I press the following buttons in the exam calculator block:
      | 1 | . | 2 | + | 2 | . | 3 | = |
    Then the exam calculator display should be "3.5"
    And the exam calculator operation should be "1.2+2.3 ="

  Scenario: Scientific mode uses dot decimals for Moodle answer compatibility
    Given the exam calculator block mode is "scientific"
    When I press the following buttons in the exam calculator block:
      | 6 | . | 0 | - | 0 | . | 1 | = |
    Then the exam calculator display should be "5.9"
    And the exam calculator operation should be "6.0-0.1 ="

  @quiz
  Scenario: Exam Calculator block can be shown on a quiz activity page
    Given the following "courses" exist:
      | fullname | shortname | category |
      | Calculator course | CALC101 | 0 |
    And the following "activities" exist:
      | activity | course  | name          | intro      |
      | quiz     | CALC101 | Practice quiz | Quiz intro |
    And I am on the "Calculator course" "course" page
    When I click on "Practice quiz" "link" in the "region-main" "region"
    And I turn editing mode on
    And I add the "Exam Calculator" block
    Then the exam calculator mode badge should be "BASIC"
