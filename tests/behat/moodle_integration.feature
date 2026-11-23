@block @block_course_calculator @javascript
Feature: Course Calculator integrates with Moodle course and quiz pages
  In order to provide a calculator without granting administrator rights
  As a teacher
  I need to configure it on my course and make it available during quiz attempts

  Background:
    Given the following "users" exist:
      | username |
      | teacher1 |
      | student1 |
    And the following "courses" exist:
      | fullname          | shortname |
      | Calculator course | CALC101   |
    And the following "course enrolments" exist:
      | user     | course  | role           |
      | teacher1 | CALC101 | editingteacher |
      | student1 | CALC101 | student        |

  Scenario: A teacher can add a calculator and save scientific mode through the edit form
    Given I am on the "Calculator course" course page logged in as teacher1
    And I turn editing mode on
    When I add the "Course Calculator" block
    And I configure the "Course Calculator" block
    And I set the following fields to these values:
      | Calculator mode | Scientific |
    And I press "Save changes"
    Then the Course Calculator mode badge should be "SCIENTIFIC"
    When I type "sqrt(9)" in the Course Calculator block
    And I press "=" in the Course Calculator block
    Then the Course Calculator display should be "3"

  Scenario: An authenticated learner can add a calculator to the dashboard
    Given I log in as "student1"
    And I follow "Dashboard"
    And I turn editing mode on
    When I add the "Course Calculator" block
    Then the Course Calculator mode badge should be "BASIC"
    When I press the following buttons in the Course Calculator block:
      | 2 | + | 3 | = |
    Then the Course Calculator display should be "5"

  Scenario: Existing calculator instances on the same page operate independently
    Given the following "blocks" exist:
      | blockname         | contextlevel | reference | pagetypepattern | defaultregion | defaultweight |
      | course_calculator | Course       | CALC101   | course-view-*   | side-pre      | 0             |
      | course_calculator | Course       | CALC101   | course-view-*   | side-pre      | 1             |
    When I am on the "Calculator course" course page logged in as teacher1
    And I press the following buttons in the Course Calculator block:
      | 2 | + | 3 | = |
    Then the Course Calculator displays should be in order:
      | 5 |
      | 0 |
    When I click on ".block_course_calculator ~ .block_course_calculator button[data-value='4']" "css_element"
    Then the Course Calculator displays should be in order:
      | 5 |
      | 4 |

  @quiz
  Scenario: A learner can calculate during a quiz attempt without initial focus stealing
    Given the following "activities" exist:
      | activity | course  | name          | idnumber | showblocks |
      | quiz     | CALC101 | Practice quiz | q1       | 1          |
    And the following "question categories" exist:
      | contextlevel    | reference | name           |
      | Activity module | q1        | Test questions |
    And the following "questions" exist:
      | questioncategory | qtype     | name |
      | Test questions   | truefalse | TF1  |
    And quiz "Practice quiz" contains the following questions:
      | question | page |
      | TF1      | 1    |
    And the following "blocks" exist:
      | blockname         | contextlevel    | reference | pagetypepattern  | defaultregion |
      | course_calculator | Activity module | q1        | mod-quiz-attempt | side-pre      |
    When I am on the "Practice quiz" "quiz activity" page logged in as student1
    And I press "Attempt quiz"
    Then the Course Calculator input should not be focused
    When I press the following buttons in the Course Calculator block:
      | 8 | / | 2 | = |
    Then the Course Calculator display should be "4"
